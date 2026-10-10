import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Key, 
  Send, 
  Code2, 
  Copy, 
  Check, 
  Terminal, 
  X,
  ExternalLink,
  Activity,
  FileSpreadsheet
} from 'lucide-react';
import { LabSettings, SyncLog, Booking } from '../types';
import { getSyncLogs, getSettings, saveSettings, getBookings, saveBooking } from '../utils/storage';
import { broadcastBooking, pushBookingToGitHubRepo } from '../utils/syncService';
import { playSyncDing } from '../utils/audio';

interface SyncHubModalProps {
  onClose: () => void;
  onBookingUpdated?: () => void;
}

export const SyncHubModal: React.FC<SyncHubModalProps> = ({ onClose, onBookingUpdated }) => {
  const [settings, setSettingsState] = useState<LabSettings>(getSettings());
  const [logs, setLogs] = useState<SyncLog[]>(getSyncLogs());
  const [isTestingGitHub, setIsTestingGitHub] = useState(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  
  // Simulated result push
  const [bookings, setBookings] = useState<Booking[]>(getBookings());
  const [selectedBookingForResults, setSelectedBookingForResults] = useState<string>('');
  const [resultInput, setResultInput] = useState({
    hemoglobin: '14.2',
    fbs: '95',
    creatinine: '0.9',
    hba1c: '5.4'
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setLogs(getSyncLogs());
      setBookings(getBookings());
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings(settings);
    setTestResult({ success: true, message: 'تم حفظ إعدادات الربط بنجاح!' });
  };

  const handleTestBroadcast = () => {
    const sampleBooking = bookings[0];
    if (sampleBooking) {
      broadcastBooking(sampleBooking, 'UPDATE_BOOKING');
      setTestResult({
        success: true,
        message: `تم إرسال إشارة فورية للحجز [${sampleBooking.bookingCode}] عبر قناة BroadcastChannel بنجاح!`,
      });
    } else {
      setTestResult({ success: false, message: 'لا توجد حجوزات لإجراء الاختبار عليها.' });
    }
  };

  const handleTestGitHubPush = async () => {
    const targetBooking = bookings[0];
    if (!targetBooking) {
      setTestResult({ success: false, message: 'لا يوجد حجز متوفر لرفعه.' });
      return;
    }

    setIsTestingGitHub(true);
    setTestResult(null);

    const res = await pushBookingToGitHubRepo(
      targetBooking,
      settings.githubToken,
      settings.githubRepo
    );

    setIsTestingGitHub(false);
    setTestResult(res);
    setLogs(getSyncLogs());
  };

  // Simulate publishing lab results from Unified system
  const handlePublishResults = () => {
    const booking = bookings.find(b => b.id === selectedBookingForResults || b.bookingCode === selectedBookingForResults);
    if (!booking) return;

    const updated: Booking = {
      ...booking,
      status: 'completed',
      resultsPublishedAt: new Date().toISOString(),
      results: [
        { testId: 'test_cbc', testName: 'صورة دم كاملة (الهيموجلوبين)', resultValue: resultInput.hemoglobin, unit: 'g/dL', referenceRange: '13.0 - 17.5', status: 'normal' },
        { testId: 'test_fbs', testName: 'سكر الدم الصائم (FBS)', resultValue: resultInput.fbs, unit: 'mg/dL', referenceRange: '70 - 100', status: 'normal' },
        { testId: 'test_creatinine', testName: 'الكرياتينين الكلوي (Creatinine)', resultValue: resultInput.creatinine, unit: 'mg/dL', referenceRange: '0.6 - 1.2', status: 'normal' },
        { testId: 'test_hba1c', testName: 'السكر التراكمي (HbA1c)', resultValue: resultInput.hba1c, unit: '%', referenceRange: '< 5.7', status: 'normal' }
      ]
    };

    saveBooking(updated);
    broadcastBooking(updated, 'UPDATE_BOOKING');
    playSyncDing();
    setTestResult({
      success: true,
      message: `تم اعتماد ونشر النتائج للحجز [${updated.bookingCode}] ووصلت فورياً لشاشة المريض بدون إعادة تحميل!`
    });
    if (onBookingUpdated) onBookingUpdated();
  };

  // Integration code snippet for the user's unified system
  const unifiedSystemIntegrationCode = `// أضف هذا الكود في نظام RT الموحد (rt-lab-unified-system)
// لاستقبال الحجوزات وتحديث البيانات فورياً بدون إعادة تحميل الصفحة:
const rtChannel = new BroadcastChannel('rt_lab_unified_sync_channel');

rtChannel.onmessage = (event) => {
  const { type, payload, timestamp } = event.data;
  if (type === 'NEW_BOOKING' || type === 'UPDATE_BOOKING') {
    console.log('وصل حجز فوري جديد من RT Check-Up:', payload);
    // 1. أضف الحجز لقائمتك في React أو JS State
    // 2. أظهر تنبيه صوتي وإشعار فوري لمسؤول المختبر
    alert('حجز جديد وصل فوراً: ' + payload.patientName + ' (' + payload.bookingCode + ')');
  }
};`;

  const copySnippet = () => {
    navigator.clipboard.writeText(unifiedSystemIntegrationCode);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-6 animate-scale-in">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
            <div>
              <h3 className="font-bold text-sm">
                مركز المزامنة الفورية مع نظام RT الموحد (Real-Time Sync Hub)
              </h3>
              <p className="text-[11px] text-slate-400">
                ربط لحظي بين بوابة الفحوصات ونظام إدارة المعامل بدون إعادة تحميل الصفحة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-xs max-h-[80vh] overflow-y-auto">
          {/* Status Banners */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-emerald-900 text-xs">قناة المزامنة الفورية (نشطة 100%)</div>
                <div className="text-[11px] text-emerald-700 mt-0.5">
                  تعتمد تقنية <span className="font-mono">BroadcastChannel</span> + <span className="font-mono">Shared Events</span>. أي حجز يتم في هذا البرنامج يظهر فوراً في النظام الموحد في أجزاء من الثانية!
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-xl flex items-start gap-3">
              <Activity className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-sky-900 text-xs">رابط النظام الموحد المستهدف</div>
                <a 
                  href={settings.unifiedSystemUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-[11px] text-sky-700 underline font-mono flex items-center gap-1 mt-0.5 break-all"
                >
                  {settings.unifiedSystemUrl}
                  <ExternalLink className="w-3 h-3 inline shrink-0" />
                </a>
              </div>
            </div>
          </div>

          {/* Test result banner */}
          {testResult && (
            <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
              testResult.success 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                : 'bg-red-50 border-red-300 text-red-800'
            }`}>
              <div className="flex items-center gap-2">
                {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                <span>{testResult.message}</span>
              </div>
              <button onClick={() => setTestResult(null)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
          )}

          {/* Configuration Settings */}
          <form onSubmit={handleSaveSettings} className="space-y-3 bg-slate-50 p-4 border border-slate-200 rounded-xl">
            <div className="font-bold text-slate-800 flex items-center gap-2">
              <Key className="w-4 h-4 text-sky-600" />
              بيانات اعتماد GitHub والمستودع التلقائي:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">GitHub Personal Access Token</label>
                <input
                  type="password"
                  value={settings.githubToken}
                  onChange={e => setSettingsState({ ...settings, githubToken: e.target.value })}
                  placeholder="ghp_xxxx..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono text-[11px] bg-white focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">مسار المستودع على GitHub (Repo)</label>
                <input
                  type="text"
                  value={settings.githubRepo}
                  onChange={e => setSettingsState({ ...settings, githubRepo: e.target.value })}
                  placeholder="owner/repo-name"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono text-[11px] bg-white focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestBroadcast}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  إرسال نبضة مزامنة فورية (Test Channel)
                </button>
                <button
                  type="button"
                  onClick={handleTestGitHubPush}
                  disabled={isTestingGitHub}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold flex items-center gap-1 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingGitHub ? 'animate-spin' : ''}`} />
                  مزامنة مع GitHub الآن
                </button>
              </div>

              <button
                type="submit"
                className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold transition-colors"
              >
                حفظ الإعدادات
              </button>
            </div>
          </form>

          {/* SIMULATE LAB RESULTS INPUT */}
          <div className="p-4 bg-sky-50/60 border border-sky-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-bold text-sky-950 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-sky-600" />
                محاكاة إدخال النتائج الطبية فورياً (كما لو أدخلت من النظام الموحد):
              </div>
              <span className="text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded font-bold">
                تحديث فوري دون تحديث الصفحة
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">اختر الحجز لإدخال نتائجه</label>
                <select
                  value={selectedBookingForResults}
                  onChange={e => setSelectedBookingForResults(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-bold"
                >
                  <option value="">-- اختر حجزاً مريضاً --</option>
                  {bookings.map(b => (
                    <option key={b.id} value={b.id}>
                      [{b.bookingCode}] {b.patientName} ({b.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">الهيموجلوبين (Hb)</label>
                <input
                  type="text"
                  value={resultInput.hemoglobin}
                  onChange={e => setResultInput({ ...resultInput, hemoglobin: e.target.value })}
                  placeholder="14.2 g/dL"
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">السكر الصائم (FBS)</label>
                <input
                  type="text"
                  value={resultInput.fbs}
                  onChange={e => setResultInput({ ...resultInput, fbs: e.target.value })}
                  placeholder="95 mg/dL"
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handlePublishResults}
              disabled={!selectedBookingForResults}
              className="w-full py-2 bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-700 hover:to-sky-700 text-white rounded-lg font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              نشر النتائج الطبية فورياً (تظهر في شاشة المريض مباشرة بدون Refresh)
            </button>
          </div>

          {/* Integration snippet */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-slate-600" />
                كود الربط الفوري لنظام RT الموحد (انسخه وضعه في صفحة النظام الموحد):
              </span>
              <button
                onClick={copySnippet}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-bold text-[11px] flex items-center gap-1 transition-colors"
              >
                {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedSnippet ? 'تم النسخ!' : 'نسخ الكود'}
              </button>
            </div>
            <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto text-left dir-ltr">
              {unifiedSystemIntegrationCode}
            </pre>
          </div>

          {/* Live Sync Log Console */}
          <div className="space-y-2">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-slate-600" />
              سجل أحداث المزامنة اللحظية (Live Sync Console):
            </div>
            <div className="bg-slate-900 text-slate-200 p-3 rounded-xl max-h-48 overflow-y-auto space-y-2 font-mono text-[11px] dir-ltr text-left">
              {logs.map(log => (
                <div key={log.id} className="flex items-start gap-2 border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-500 shrink-0 text-[10px]">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`px-1 py-0.2 rounded text-[10px] shrink-0 font-bold ${
                    log.type === 'outgoing_booking' ? 'bg-sky-900 text-sky-200' :
                    log.type === 'incoming_result' ? 'bg-emerald-900 text-emerald-200' :
                    log.type === 'error' ? 'bg-red-900 text-red-200' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {log.type}
                  </span>
                  <span className={`text-slate-200 text-right dir-rtl ${log.type === 'error' ? 'text-red-400' : ''}`}>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold text-xs"
          >
            إغلاق مركز المزامنة
          </button>
        </div>
      </div>
    </div>
  );
};
