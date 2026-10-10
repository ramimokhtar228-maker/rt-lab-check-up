import { Booking, SyncLog, TestResultItem } from '../types';
import { addSyncLog, getBookings, saveBooking, saveBookings } from './storage';
import { playSyncDing } from './audio';

const BROADCAST_CHANNEL_NAME = 'rt_lab_unified_sync_channel';

// Singleton broadcast channel
let broadcastChannel: BroadcastChannel | null = null;

export function getSyncChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined') return null;
  if (!broadcastChannel && 'BroadcastChannel' in window) {
    try {
      broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    } catch (e) {
      console.warn('BroadcastChannel not supported or restricted:', e);
    }
  }
  return broadcastChannel;
}

export type SyncMessage = 
  | { type: 'NEW_BOOKING'; payload: Booking; timestamp: string }
  | { type: 'UPDATE_BOOKING'; payload: Booking; timestamp: string }
  | { type: 'RESULT_PUBLISHED'; bookingCode: string; results: TestResultItem[]; timestamp: string }
  | { type: 'HEARTBEAT_PING'; timestamp: string; sender: string }
  | { type: 'HEARTBEAT_PONG'; timestamp: string; sender: string };

/**
 * Broadcast booking to any open tab/window of RT Unified System immediately!
 */
export function broadcastBooking(booking: Booking, eventType: 'NEW_BOOKING' | 'UPDATE_BOOKING' = 'NEW_BOOKING'): void {
  const channel = getSyncChannel();
  const message: SyncMessage = {
    type: eventType,
    payload: booking,
    timestamp: new Date().toISOString(),
  };

  if (channel) {
    try {
      channel.postMessage(message);
    } catch (err) {
      console.warn('BroadcastChannel postMessage failed:', err);
    }
  }

  // Also post through localStorage storage event bridge for cross-tab compatibility
  try {
    localStorage.setItem('rt_lab_last_sync_event', JSON.stringify(message));
  } catch (e) {
    // Ignore storage quota
  }

  // Also post to window.parent if embedded in iframe
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ rtLabEvent: message }, '*');
    }
  } catch {
    // Ignore
  }

  addSyncLog({
    timestamp: new Date().toISOString(),
    type: 'outgoing_booking',
    message: `تم إرسال حجز فوري للمريض (${booking.patientName}) بكود [${booking.bookingCode}] عبر قناة المزامنة المباشرة.`,
    bookingCode: booking.bookingCode,
    success: true,
  });

  playSyncDing();
}

/**
 * Push booking to GitHub Repository using the provided GitHub Token
 * Path: data/bookings.json in repo
 */
export async function pushBookingToGitHubRepo(
  booking: Booking,
  token: string,
  repo: string = 'ramimokhtar228-maker/rt-lab-unified-system'
): Promise<{ success: boolean; message: string }> {
  if (!token) {
    return { success: false, message: 'رمز الوصول للـ GitHub غير محدد' };
  }

  const filePath = 'data/live_bookings.json';
  const apiUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;

  try {
    // 1. Get current file sha & content if exists
    let sha: string | undefined;
    let existingBookings: Booking[] = [];

    const getRes = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${token.trim()}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (getRes.ok) {
      const data = await getRes.json();
      sha = data.sha;
      if (data.content) {
        try {
          const decoded = decodeURIComponent(escape(atob(data.content.replace(/\s/g, ''))));
          existingBookings = JSON.parse(decoded);
          if (!Array.isArray(existingBookings)) existingBookings = [];
        } catch {
          existingBookings = [];
        }
      }
    }

    // Append or update booking
    const idx = existingBookings.findIndex(b => b.id === booking.id || b.bookingCode === booking.bookingCode);
    if (idx >= 0) {
      existingBookings[idx] = booking;
    } else {
      existingBookings.unshift(booking);
    }

    // Base64 encode UTF-8
    const contentString = JSON.stringify(existingBookings, null, 2);
    const encodedContent = btoa(unescape(encodeURIComponent(contentString)));

    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token.trim()}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `RT Lab Sync: New booking ${booking.bookingCode} for ${booking.patientName}`,
        content: encodedContent,
        sha: sha,
      }),
    });

    if (putRes.ok) {
      addSyncLog({
        timestamp: new Date().toISOString(),
        type: 'outgoing_booking',
        message: `تم رفع الحجز [${booking.bookingCode}] بنجاح إلى مستودع GitHub (${repo}) في المسار ${filePath}.`,
        bookingCode: booking.bookingCode,
        success: true,
      });
      return { success: true, message: `تمت المزامنة بنجاح مع مستودع GitHub (${repo})!` };
    } else {
      const errorJson = await putRes.json().catch(() => ({}));
      const errMsg = errorJson.message || `خطأ HTTP ${putRes.status}`;
      addSyncLog({
        timestamp: new Date().toISOString(),
        type: 'error',
        message: `تعذر الرفع إلى GitHub: ${errMsg}`,
        bookingCode: booking.bookingCode,
        success: false,
      });
      return { success: false, message: `فشلت مزامنة GitHub: ${errMsg}` };
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    addSyncLog({
      timestamp: new Date().toISOString(),
      type: 'error',
      message: `خطأ اتصال أثناء مزامنة GitHub: ${errorMsg}`,
      bookingCode: booking.bookingCode,
      success: false,
    });
    return { success: false, message: `خطأ اتصال: ${errorMsg}` };
  }
}

/**
 * Register incoming listeners for real-time results from RT Unified System
 */
export function initSyncListener(onMessageReceived?: (msg: SyncMessage) => void): () => void {
  const channel = getSyncChannel();

  const handleMessage = (event: MessageEvent) => {
    try {
      const data = event.data as SyncMessage;
      if (!data || !data.type) return;

      if (data.type === 'RESULT_PUBLISHED') {
        const bookings = getBookings();
        const target = bookings.find(b => b.bookingCode === data.bookingCode);
        if (target) {
          const updated: Booking = {
            ...target,
            results: data.results,
            status: 'completed',
            resultsPublishedAt: data.timestamp,
          };
          saveBooking(updated);
          addSyncLog({
            timestamp: new Date().toISOString(),
            type: 'incoming_result',
            message: `وصلت نتائج مخبرية جديدة فورياً للحجز [${data.bookingCode}] من نظام RT الموحد!`,
            bookingCode: data.bookingCode,
            success: true,
          });
          playSyncDing();
        }
      }

      if (data.type === 'UPDATE_BOOKING') {
        saveBooking(data.payload);
      }

      if (onMessageReceived) {
        onMessageReceived(data);
      }
    } catch (err) {
      console.warn('Error handling sync message:', err);
    }
  };

  if (channel) {
    channel.addEventListener('message', handleMessage);
  }

  // Also listen on window storage event
  const handleStorage = (e: StorageEvent) => {
    if (e.key === 'rt_lab_last_sync_event' && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        handleMessage({ data: parsed } as MessageEvent);
      } catch {
        // Ignore
      }
    }
  };

  window.addEventListener('storage', handleStorage);

  return () => {
    if (channel) {
      channel.removeEventListener('message', handleMessage);
    }
    window.removeEventListener('storage', handleStorage);
  };
}
