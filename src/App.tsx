/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LabTest, 
  CheckupPackage, 
  Patient, 
  Booking, 
  LabSettings
} from './types';
import { 
  getTests, 
  getPackages, 
  getPatients, 
  getBookings, 
  getSettings 
} from './utils/storage';
import { initSyncListener, SyncMessage } from './utils/syncService';
import { Navbar, MainTab } from './components/Navbar';
import { PatientPortal } from './components/PatientPortal';
import { AdminBookings } from './components/AdminBookings';
import { CatalogManager } from './components/CatalogManager';
import { FortuneWheel } from './components/FortuneWheel';
import { SyncHubModal } from './components/SyncHubModal';
import { LabAdminSettings } from './components/LabAdminSettings';
import { AdminLoginModal } from './components/AdminLoginModal';
import { RTLogo } from './components/RTLogo';
import { Phone, MapPin, ShieldCheck, Clock, ExternalLink, Activity, Building2, Lock } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<MainTab>('patient-portal');
  const [tests, setTests] = useState<LabTest[]>([]);
  const [packages, setPackages] = useState<CheckupPackage[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [settings, setSettings] = useState<LabSettings>(getSettings());
  const [activePatient, setActivePatient] = useState<Patient | null>(null);

  const handleSetActivePatient = (patient: Patient | null) => {
    setActivePatient(patient);
    if (patient) {
      sessionStorage.setItem('rt_active_patient_phone', patient.phone);
    } else {
      sessionStorage.removeItem('rt_active_patient_phone');
    }
  };

  // Admin authentication state for privacy (Patient vs Admin)
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('rt_lab_admin_auth') === 'true';
    }
    return false;
  });
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);

  // Sync Hub modal state
  const [showSyncHub, setShowSyncHub] = useState(false);
  const [realtimeNotice, setRealtimeNotice] = useState<string | null>(null);

  const handleAdminLoginSuccess = () => {
    setIsAdmin(true);
    sessionStorage.setItem('rt_lab_admin_auth', 'true');
    setShowAdminLoginModal(false);
    setActiveTab('admin-bookings');
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    sessionStorage.removeItem('rt_lab_admin_auth');
    setActiveTab('patient-portal');
  };

  const handleTabChange = (tab: MainTab) => {
    // If patient tries to open admin tabs, prompt for admin password
    if ((tab === 'admin-bookings' || tab === 'admin-settings') && !isAdmin) {
      setShowAdminLoginModal(true);
      return;
    }
    setActiveTab(tab);
  };

  // Refresh all state from storage
  const reloadData = () => {
    setTests(getTests());
    setPackages(getPackages());
    const pats = getPatients();
    setPatients(pats);
    setBookings(getBookings());
    setSettings(getSettings());

    // If active patient exists, update reference
    if (activePatient) {
      const refreshed = pats.find(p => p.id === activePatient.id || p.phone === activePatient.phone);
      if (refreshed) setActivePatient(refreshed);
    }
  };

  useEffect(() => {
    reloadData();

    // Check for an existing patient session (do not auto-select another patient)
    const savedPhone = sessionStorage.getItem('rt_active_patient_phone');
    if (savedPhone) {
      const pats = getPatients();
      const found = pats.find(p => p.phone === savedPhone);
      if (found) {
        setActivePatient(found);
      }
    }

    // Set up real-time listener for incoming events from RT Unified System
    const cleanupSync = initSyncListener((msg: SyncMessage) => {
      reloadData();
      if (msg.type === 'RESULT_PUBLISHED') {
        setRealtimeNotice(`وصلت نتائج مخبرية جديدة فوراً للحجز [${msg.bookingCode}] دون الحاجة لتحديث الصفحة!`);
        setTimeout(() => setRealtimeNotice(null), 6000);
      } else if (msg.type === 'NEW_BOOKING') {
        setRealtimeNotice(`تم تسجيل حجز جديد بنجاح وتمريره فورياً [${msg.payload.bookingCode}]!`);
        setTimeout(() => setRealtimeNotice(null), 5000);
      }
    });

    return () => {
      cleanupSync();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Cairo',sans-serif] text-slate-800">
      {/* Real-time live toast notification */}
      {realtimeNotice && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-700 text-white px-5 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-bounce">
          <Activity className="w-4 h-4 text-emerald-300 animate-spin" />
          <span>{realtimeNotice}</span>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onOpenSyncHub={() => setShowSyncHub(true)}
        settings={settings}
        bookingsCount={bookings.length}
        isAdmin={isAdmin}
        onOpenAdminLogin={() => setShowAdminLoginModal(true)}
        onAdminLogout={handleAdminLogout}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'patient-portal' && (
          <PatientPortal
            tests={tests}
            packages={packages}
            settings={settings}
            activePatient={activePatient}
            setActivePatient={handleSetActivePatient}
            onBookingCreated={() => {
              reloadData();
            }}
          />
        )}

        {/* ADMIN ONLY TABS (Double guarded) */}
        {activeTab === 'admin-bookings' && isAdmin && (
          <AdminBookings
            bookings={bookings}
            patients={patients}
            settings={settings}
            onDataChanged={reloadData}
            onOpenSyncHub={() => setShowSyncHub(true)}
          />
        )}

        {activeTab === 'catalog' && (
          <CatalogManager
            tests={tests}
            packages={packages}
            onCatalogChanged={reloadData}
            readOnly={!isAdmin}
            onSelectTestForBooking={test => {
              setActiveTab('patient-portal');
            }}
            onSelectPackageForBooking={pkg => {
              setActiveTab('patient-portal');
            }}
          />
        )}

        {activeTab === 'admin-settings' && isAdmin && (
          <LabAdminSettings
            settings={settings}
            onSettingsUpdated={newSettings => {
              setSettings(newSettings);
            }}
          />
        )}

        {activeTab === 'fortune-wheel' && (
          <FortuneWheel
            patientPhone={activePatient?.phone}
            patientName={activePatient?.fullName}
            isAdmin={isAdmin}
            onCouponApplied={() => {
              setActiveTab('patient-portal');
            }}
          />
        )}
      </main>

      {/* Admin Login & Privacy PIN Modal */}
      {showAdminLoginModal && (
        <AdminLoginModal
          correctPassword={settings.adminPassword || '1234'}
          onSuccess={handleAdminLoginSuccess}
          onClose={() => setShowAdminLoginModal(false)}
        />
      )}

      {/* Sync Hub Modal (Admin only) */}
      {showSyncHub && isAdmin && (
        <SyncHubModal
          onClose={() => setShowSyncHub(false)}
          onBookingUpdated={reloadData}
        />
      )}

      {/* Footer in RT Lab brand identity */}
      <footer className="mt-16 bg-white border-t border-slate-200 pt-10 pb-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-2 md:col-span-2">
              <RTLogo variant="compact" size="md" />
              <p className="text-slate-600 text-xs leading-relaxed max-w-md mt-2">
                {settings.labNameAr} - دقة نتائج مخبرية متناهية مع معايير الجودة العالمية ISO 15189، وطاقم تمريض منزلي مجهز لأخذ العينات في جميع المناطق.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-2 text-slate-800 font-bold">
                <a href={`tel:${settings.hotline}`} className="flex items-center gap-1.5 text-red-700 hover:underline">
                  <Phone className="w-3.5 h-3.5" />
                  الخط الساخن: {settings.hotline}
                </a>
                <span>·</span>
                <span className="flex items-center gap-1.5 text-emerald-700">
                  واتساب: {settings.whatsapp}
                </span>
                {settings.adminEmail && (
                  <>
                    <span>·</span>
                    <span className="text-slate-500 font-mono text-[11px]">{settings.adminEmail}</span>
                  </>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="font-bold text-slate-900">فروع معامل RT ({settings.branchesList?.length || settings.branches?.length || 0})</h4>
                {isAdmin && (
                  <button
                    onClick={() => handleTabChange('admin-settings')}
                    className="text-[10px] text-red-700 hover:underline font-bold"
                  >
                    إدارة الفروع
                  </button>
                )}
              </div>
              <ul className="space-y-1.5 text-[11px] text-slate-600 max-h-40 overflow-y-auto pr-1">
                {(settings.branchesList && settings.branchesList.length > 0
                  ? settings.branchesList
                  : settings.branches.map((b, i) => ({ id: String(i), name: b, address: '', city: '', phone: '', workingHours: '', isActive: true }))
                ).map((b) => (
                  <li key={b.id} className="flex items-start gap-1.5">
                    <MapPin className="w-3 h-3 text-red-600 shrink-0 mt-0.5" />
                    <span>{b.name} {b.address ? `(${b.address})` : ''}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-2.5">الربط والأنظمة المتكاملة</h4>
              <ul className="space-y-2 text-[11px]">
                {isAdmin ? (
                  <li>
                    <button
                      onClick={() => setShowSyncHub(true)}
                      className="text-sky-700 hover:underline font-bold flex items-center gap-1"
                    >
                      <span>مركز المزامنة الفورية (Sync Hub)</span>
                      <Activity className="w-3.5 h-3.5 text-emerald-600" />
                    </button>
                  </li>
                ) : (
                  <li>
                    <button
                      onClick={() => setShowAdminLoginModal(true)}
                      className="text-slate-500 hover:text-red-700 font-bold flex items-center gap-1"
                    >
                      <Lock className="w-3 h-3 text-red-600" />
                      <span>دخول إدارة وطاقم المعمل 🔒</span>
                    </button>
                  </li>
                )}
                <li>
                  <a
                    href={settings.unifiedSystemUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-600 hover:text-sky-700 flex items-center gap-1"
                  >
                    <span>نظام RT الموحد (Unified System)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li className="text-slate-400">
                  مزامنة لحظية فورية دون الحاجة لإعادة تحميل الصفحة
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
            <div>
              جميع الحقوق محفوظة © {new Date().getFullYear()} معامل RT للتحاليل الطبية والفحص الشامل
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                معتمد ISO 15189
              </span>
              <span>·</span>
              <span>أحدث تقنيات التشخيص المخبري</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
