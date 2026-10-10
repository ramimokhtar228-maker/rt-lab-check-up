import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  Edit2, 
  Trash2, 
  Phone, 
  MapPin, 
  Clock, 
  Save, 
  CheckCircle2, 
  Settings, 
  Globe, 
  Mail, 
  ShieldCheck, 
  Home, 
  BellRing,
  Star,
  ExternalLink
} from 'lucide-react';
import { LabSettings, BranchItem } from '../types';
import { saveSettings } from '../utils/storage';
import { RTLogo } from './RTLogo';
import { playClick } from '../utils/audio';

interface LabAdminSettingsProps {
  settings: LabSettings;
  onSettingsUpdated: (newSettings: LabSettings) => void;
}

export const LabAdminSettings: React.FC<LabAdminSettingsProps> = ({
  settings,
  onSettingsUpdated,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'info' | 'branches'>('branches');
  const [formData, setFormData] = useState<LabSettings>({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Branch Modal State
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchItem | null>(null);

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    playClick();
    saveSettings(formData);
    onSettingsUpdated(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Branch handlers
  const handleOpenAddBranch = () => {
    setEditingBranch({
      id: `br_${Date.now()}`,
      name: '',
      city: 'القاهرة',
      address: '',
      phone: formData.hotline || '19088',
      workingHours: '08:00 ص - 11:00 م',
      isMain: false,
      isActive: true,
      googleMapsUrl: '',
    });
    setShowBranchModal(true);
  };

  const handleOpenEditBranch = (branch: BranchItem) => {
    setEditingBranch({ ...branch });
    setShowBranchModal(true);
  };

  const handleSaveBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch) return;
    playClick();

    const currentBranches = [...(formData.branchesList || [])];
    const index = currentBranches.findIndex(b => b.id === editingBranch.id);

    let updatedList: BranchItem[];
    if (index >= 0) {
      updatedList = [...currentBranches];
      updatedList[index] = editingBranch;
    } else {
      updatedList = [...currentBranches, editingBranch];
    }

    // Sync string branches array for backwards compatibility
    const updatedStringBranches = updatedList
      .filter(b => b.isActive)
      .map(b => `${b.name} - ${b.address}`);

    const updatedSettings: LabSettings = {
      ...formData,
      branchesList: updatedList,
      branches: updatedStringBranches,
    };

    setFormData(updatedSettings);
    saveSettings(updatedSettings);
    onSettingsUpdated(updatedSettings);
    setShowBranchModal(false);
    setEditingBranch(null);
  };

  const handleDeleteBranch = (branchId: string, branchName: string) => {
    if (confirm(`هل أنت متأكد من حذف فرع (${branchName})؟`)) {
      playClick();
      const updatedList = (formData.branchesList || []).filter(b => b.id !== branchId);
      const updatedStringBranches = updatedList
        .filter(b => b.isActive)
        .map(b => `${b.name} - ${b.address}`);

      const updatedSettings: LabSettings = {
        ...formData,
        branchesList: updatedList,
        branches: updatedStringBranches,
      };

      setFormData(updatedSettings);
      saveSettings(updatedSettings);
      onSettingsUpdated(updatedSettings);
    }
  };

  const handleToggleBranchActive = (branchId: string) => {
    const updatedList = (formData.branchesList || []).map(b => 
      b.id === branchId ? { ...b, isActive: !b.isActive } : b
    );
    const updatedStringBranches = updatedList
      .filter(b => b.isActive)
      .map(b => `${b.name} - ${b.address}`);

    const updatedSettings: LabSettings = {
      ...formData,
      branchesList: updatedList,
      branches: updatedStringBranches,
    };

    setFormData(updatedSettings);
    saveSettings(updatedSettings);
    onSettingsUpdated(updatedSettings);
  };

  const handleSetMainBranch = (branchId: string) => {
    const updatedList = (formData.branchesList || []).map(b => ({
      ...b,
      isMain: b.id === branchId,
    }));

    const updatedSettings: LabSettings = {
      ...formData,
      branchesList: updatedList,
    };

    setFormData(updatedSettings);
    saveSettings(updatedSettings);
    onSettingsUpdated(updatedSettings);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner in RT Brand Dark Red & Deep Navy */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-red-900/40 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded-md bg-red-600/20 text-red-300 border border-red-500/30 text-[10px] font-bold">
                إدارة المنظومة
              </span>
              <span className="text-slate-400 text-xs">·</span>
              <span className="text-xs text-blue-200 font-mono">RT LAB ADMINISTRATION</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Settings className="w-6 h-6 text-red-500" />
              بيانات إدارة معامل RT وشبكة الفروع
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              تحكم كامل في هوية المعمل، أرقام التواصل والخط الساخن، إضافة وتعديل الفروع بجميع المحافظات، وتحديد شروط وسعر الزيارات المنزلية.
            </p>
          </div>

          {/* Sub Navigation Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-800/80 rounded-2xl border border-slate-700/60 self-start md:self-auto">
            <button
              onClick={() => setActiveSubTab('branches')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSubTab === 'branches'
                  ? 'bg-gradient-to-r from-red-700 to-rose-700 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" />
              شبكة الفروع ({formData.branchesList?.length || 0})
            </button>
            <button
              onClick={() => setActiveSubTab('info')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSubTab === 'info'
                  ? 'bg-gradient-to-r from-blue-700 to-indigo-700 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              بيانات الإدارة والتواصل
            </button>
          </div>
        </div>
      </div>

      {/* SUCCESS NOTIFICATION */}
      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs font-bold animate-fade-in shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>تم حفظ وتحديث بيانات إدارة المعمل بنجاح، وستنعكس فورياً في جميع صفحات البرنامج والإيصالات!</span>
        </div>
      )}

      {/* 1. BRANCHES MANAGER TAB */}
      {activeSubTab === 'branches' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-red-600" />
                فروع معامل RT المعتمدة ({formData.branchesList?.length || 0} فرع)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                تظهر هذه الفروع تلقائياً للمريض أثناء حجز الفحص، وفي أسفل الموقع والإيصالات المطبوعة
              </p>
            </div>

            <button
              onClick={handleOpenAddBranch}
              className="px-4 py-2.5 bg-gradient-to-r from-red-700 to-rose-700 hover:from-red-800 hover:to-rose-800 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-900/20 flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              إضافة فرع جديد للمعمل
            </button>
          </div>

          {/* Branches Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(formData.branchesList || []).map(branch => (
              <div
                key={branch.id}
                className={`bg-white rounded-2xl border p-5 shadow-xs transition-all flex flex-col justify-between ${
                  branch.isMain 
                    ? 'border-red-400 ring-2 ring-red-500/10' 
                    : branch.isActive ? 'border-slate-200 hover:border-slate-300' : 'border-slate-200 opacity-60 bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200">
                          {branch.city}
                        </span>
                        {branch.isMain && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
                            <Star className="w-3 h-3 fill-red-600 text-red-600" />
                            الفرع الرئيسي
                          </span>
                        )}
                        {!branch.isActive && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-600">
                            مغلق مؤقتاً
                          </span>
                        )}
                      </div>
                      <h4 className="font-extrabold text-sm text-slate-900 mt-1.5">
                        {branch.name}
                      </h4>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 my-3 pt-2 border-t border-slate-100">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                      <span className="leading-snug">{branch.address}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                      <span className="font-mono font-bold text-slate-800">{branch.phone}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{branch.workingHours}</span>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-1">
                    {!branch.isMain && (
                      <button
                        onClick={() => handleSetMainBranch(branch.id)}
                        className="text-[10px] text-slate-500 hover:text-red-700 font-bold px-2 py-1 bg-slate-100 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        تعيين كرئيسي
                      </button>
                    )}
                    <button
                      onClick={() => handleToggleBranchActive(branch.id)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-colors ${
                        branch.isActive
                          ? 'text-slate-500 hover:text-amber-700 bg-slate-100 hover:bg-amber-50'
                          : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                      }`}
                    >
                      {branch.isActive ? 'تعطيل' : 'تفعيل'}
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditBranch(branch)}
                      className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      title="تعديل بيانات الفرع"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteBranch(branch.id, branch.name)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="حذف هذا الفرع"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. LAB ADMINISTRATION INFO FORM TAB */}
      {activeSubTab === 'info' && (
        <form onSubmit={handleSaveInfo} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 text-xs">
          {/* Identity Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 pb-2 border-b border-slate-200 flex items-center gap-2">
              <Globe className="w-4 h-4 text-red-600" />
              الاسم التجاري وهوية المعمل
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم المعمل باللغة العربية</label>
                <input
                  type="text"
                  required
                  value={formData.labNameAr}
                  onChange={e => setFormData({ ...formData, labNameAr: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-none text-xs font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم المعمل باللغة الإنجليزية</label>
                <input
                  type="text"
                  required
                  value={formData.labNameEn}
                  onChange={e => setFormData({ ...formData, labNameEn: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">شريط الإعلان الإداري والترحيبي (أعلى الموقع)</label>
              <input
                type="text"
                value={formData.announcementBanner}
                onChange={e => setFormData({ ...formData, announcementBanner: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-none text-xs"
              />
            </div>
          </div>

          {/* Contact & Support Section */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h3 className="text-sm font-extrabold text-slate-900 pb-2 border-b border-slate-200 flex items-center gap-2">
              <Phone className="w-4 h-4 text-blue-700" />
              أرقام التواصل والخط الساخن والدعم الفني
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">الخط الساخن الموحد (Hotline)</label>
                <input
                  type="text"
                  required
                  value={formData.hotline}
                  onChange={e => setFormData({ ...formData, hotline: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono text-sm font-bold text-red-700 focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">رقم الواتساب والحجوزات</label>
                <input
                  type="text"
                  value={formData.whatsapp}
                  onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono text-sm focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">هاتف الإدارة والشكاوى المباشر</label>
                <input
                  type="text"
                  value={formData.adminPhone}
                  onChange={e => setFormData({ ...formData, adminPhone: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono text-sm focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">البريد الإلكتروني الرسمي للمعمل</label>
              <input
                type="email"
                value={formData.adminEmail}
                onChange={e => setFormData({ ...formData, adminEmail: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Home Visits & Accreditation */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h3 className="text-sm font-extrabold text-slate-900 pb-2 border-b border-slate-200 flex items-center gap-2">
              <Home className="w-4 h-4 text-emerald-600" />
              سياسة الزيارات المنزلية والاعتماد الطبي
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">رسوم سحب العينات بالمنزل الافتراضية (ج.م)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.homeVisitFee}
                  onChange={e => setFormData({ ...formData, homeVisitFee: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold text-sm text-red-800 focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">شروط وتنويه الزيارة المجانية</label>
                <input
                  type="text"
                  value={formData.freeVisitNotice}
                  onChange={e => setFormData({ ...formData, freeVisitNotice: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-600"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">نص شهادة واعتماد الجودة (يظهر بالإيصالات المطبوعة)</label>
              <input
                type="text"
                value={formData.accreditationText}
                onChange={e => setFormData({ ...formData, accreditationText: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 font-semibold"
              />
            </div>
          </div>

          {/* Admin Privacy & Security Section */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h3 className="text-sm font-extrabold text-slate-900 pb-2 border-b border-slate-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-red-600" />
              أمان وخصوصية الإدارة (حماية أقسام وسجلات المعمل بكلمة مرور)
            </h3>

            <div className="p-4 bg-red-50/60 border border-red-200 rounded-2xl space-y-3">
              <div className="text-xs text-red-950 font-semibold leading-relaxed">
                لحماية خصوصية المرضى وأسرار المعمل، لا يستطيع أي مريض أو زائر عادي الدخول إلى لوحة الحجوزات أو الإعدادات أو المزامنة دون إدخال كلمة المرور هذه.
              </div>

              <div className="max-w-md">
                <label className="block font-bold text-slate-800 mb-1">
                  كلمة مرور دخول الإدارة (Admin PIN / Password)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={formData.adminPassword || '1234'}
                    onChange={e => setFormData({ ...formData, adminPassword: e.target.value })}
                    placeholder="مثال: 1234 أو rt2026"
                    className="flex-1 px-3.5 py-2.5 border border-red-300 rounded-xl font-mono text-sm font-bold text-red-800 focus:ring-2 focus:ring-red-600 bg-white"
                  />
                  <span className="text-[11px] text-slate-500 font-medium shrink-0">
                    الافتراضية: <strong className="font-mono text-slate-800">1234</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-red-700 via-red-800 to-blue-900 hover:from-red-800 hover:to-blue-950 text-white rounded-xl text-xs font-black shadow-lg shadow-red-950/20 transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              حفظ جميع بيانات الإدارة وتحديث البرنامج
            </button>
          </div>
        </form>
      )}

      {/* ADD / EDIT BRANCH MODAL */}
      {showBranchModal && editingBranch && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-scale-in">
            <h3 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-red-600" />
              {editingBranch.id ? 'تعديل بيانات فرع المعمل' : 'إضافة فرع جديد لمعامل RT'}
            </h3>

            <form onSubmit={handleSaveBranch} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم الفرع</label>
                  <input
                    type="text"
                    required
                    value={editingBranch.name}
                    onChange={e => setEditingBranch({ ...editingBranch, name: e.target.value })}
                    placeholder="مثال: فرع مدينة نصر"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">المحافظة / المدينة</label>
                  <input
                    type="text"
                    required
                    value={editingBranch.city}
                    onChange={e => setEditingBranch({ ...editingBranch, city: e.target.value })}
                    placeholder="القاهرة، الجيزة، الإسكندرية..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">العنوان بالتفصيل</label>
                <input
                  type="text"
                  required
                  value={editingBranch.address}
                  onChange={e => setEditingBranch({ ...editingBranch, address: e.target.value })}
                  placeholder="الشارع، الميدان، المعلم المميز، رقم العقار"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم هاتف الفرع</label>
                  <input
                    type="text"
                    value={editingBranch.phone}
                    onChange={e => setEditingBranch({ ...editingBranch, phone: e.target.value })}
                    placeholder="010xxxxxxxx"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">مواعيد العمل بالفرع</label>
                  <input
                    type="text"
                    value={editingBranch.workingHours}
                    onChange={e => setEditingBranch({ ...editingBranch, workingHours: e.target.value })}
                    placeholder="08:00 ص - 11:00 م"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">رابط خرائط جوجل (Google Maps URL)</label>
                <input
                  type="url"
                  value={editingBranch.googleMapsUrl || ''}
                  onChange={e => setEditingBranch({ ...editingBranch, googleMapsUrl: e.target.value })}
                  placeholder="https://maps.google.com/..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-[11px] focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={editingBranch.isMain || false}
                    onChange={e => setEditingBranch({ ...editingBranch, isMain: e.target.checked })}
                    className="rounded text-red-600 focus:ring-red-600"
                  />
                  <span>تعيين كفرع رئيسي للمعامل</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={editingBranch.isActive}
                    onChange={e => setEditingBranch({ ...editingBranch, isActive: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-600"
                  />
                  <span>الفرع نشط ومتاح للحجز</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowBranchModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-red-700 to-blue-900 text-white rounded-xl font-bold shadow-md"
                >
                  حفظ الفرع
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
