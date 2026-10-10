import React from 'react';
import { 
  Calendar, 
  Users, 
  BookOpen, 
  Sparkles, 
  Radio, 
  PhoneCall, 
  MapPin, 
  Building2, 
  ExternalLink, 
  Megaphone, 
  Settings, 
  Lock, 
  LogOut, 
  ShieldCheck 
} from 'lucide-react';
import { RTLogo } from './RTLogo';
import { LabSettings } from '../types';

export type MainTab = 'patient-portal' | 'admin-bookings' | 'catalog' | 'fortune-wheel' | 'admin-settings';

interface NavbarProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  onOpenSyncHub: () => void;
  settings: LabSettings;
  bookingsCount: number;
  isAdmin: boolean;
  onOpenAdminLogin: () => void;
  onAdminLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onOpenSyncHub,
  settings,
  bookingsCount,
  isAdmin,
  onOpenAdminLogin,
  onAdminLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      {/* Top Utility Bar in Deep Crimson & Navy */}
      <div className="bg-gradient-to-r from-red-950 via-slate-950 to-blue-950 text-slate-200 text-[11px] py-1.5 px-4 sm:px-6 border-b border-red-900/30">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 overflow-hidden">
            <a
              href={`tel:${settings.hotline}`}
              className="flex items-center gap-1.5 text-red-300 hover:text-white font-bold shrink-0 transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5 text-red-400" />
              الخط الساخن: <span className="font-mono text-xs">{settings.hotline}</span>
            </a>

            {settings.announcementBanner && (
              <>
                <span className="hidden md:inline text-slate-600">·</span>
                <div className="hidden md:flex items-center gap-1.5 text-slate-300 truncate">
                  <Megaphone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">{settings.announcementBanner}</span>
                </div>
              </>
            )}
          </div>

          {/* Admin status & actions */}
          <div className="flex items-center gap-2 shrink-0">
            {isAdmin ? (
              <>
                {/* Admin is authenticated */}
                <button
                  onClick={onOpenSyncHub}
                  className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 transition-colors font-medium text-[10px]"
                  title="مركز المزامنة اللحظية مع النظام الموحد"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  <span className="hidden sm:inline">مزامنة فورية: متصل</span>
                  <span className="sm:hidden">متصل 🟢</span>
                </button>

                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-red-900/80 text-white border border-red-700 text-[10px] font-bold">
                  <ShieldCheck className="w-3 h-3 text-red-300" />
                  <span>وضع الإدارة مفعّل</span>
                </div>

                <button
                  onClick={onAdminLogout}
                  className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-[10px] font-bold transition-colors"
                  title="تسجيل خروج الإدارة وقفل لوحة التحكم"
                >
                  <LogOut className="w-3 h-3 text-red-400" />
                  <span>قفل الإدارة</span>
                </button>
              </>
            ) : (
              /* Ordinary Patient / Visitor View: Discrete Staff Login */
              <button
                onClick={onOpenAdminLogin}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-200 hover:text-white border border-red-800/60 text-[11px] font-bold transition-all shadow-xs"
                title="خاص بإدارة وطاقم معمل RT فقط"
              >
                <Lock className="w-3 h-3 text-red-400" />
                <span>دخول إدارة المعمل 🔒</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Header Nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* RT Lab Brand Logo */}
        <div className="flex items-center justify-between">
          <RTLogo variant="full" />
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0 text-xs font-bold">
          {/* Public Patient Portal Tab */}
          <button
            onClick={() => onTabChange('patient-portal')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'patient-portal'
                ? 'bg-gradient-to-r from-red-700 to-rose-700 text-white shadow-md shadow-red-900/20'
                : 'text-slate-700 hover:text-red-700 hover:bg-red-50/60'
            }`}
          >
            <Calendar className="w-4 h-4" />
            بوابة حجز الفحوصات
          </button>

          {/* Catalog Tab */}
          <button
            onClick={() => onTabChange('catalog')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'catalog'
                ? 'bg-gradient-to-r from-red-800 to-red-950 text-white shadow-md'
                : 'text-slate-700 hover:text-red-800 hover:bg-red-50/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            كتالوج التحاليل والأسعار
          </button>

          {/* Fortune Wheel for Patient */}
          <button
            onClick={() => onTabChange('fortune-wheel')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'fortune-wheel'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-md'
                : 'text-amber-800 hover:bg-amber-50'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            عجلة الحظ ومكافآتي 🎡
          </button>

          {/* ADMIN-ONLY TABS (Hidden from patients unless logged in as Admin) */}
          {isAdmin && (
            <>
              <button
                onClick={() => onTabChange('admin-bookings')}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 border border-blue-900/30 ${
                  activeTab === 'admin-bookings'
                    ? 'bg-gradient-to-r from-blue-800 to-slate-900 text-white shadow-md shadow-blue-900/20'
                    : 'text-blue-900 hover:text-blue-800 hover:bg-blue-50/60'
                }`}
              >
                <Users className="w-4 h-4 text-blue-700" />
                حجوزات وسجل المرضى
                {bookingsCount > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === 'admin-bookings' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-800'
                  }`}>
                    {bookingsCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => onTabChange('admin-settings')}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 border border-blue-900/30 ${
                  activeTab === 'admin-settings'
                    ? 'bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-md'
                    : 'text-blue-900 hover:text-blue-900 hover:bg-blue-50/60'
                }`}
              >
                <Building2 className="w-4 h-4 text-blue-700" />
                إدارة المعامل والفروع
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};
