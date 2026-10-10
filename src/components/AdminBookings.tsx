import React, { useState } from 'react';
import { 
  Users, 
  Calendar, 
  Trash2, 
  Edit2, 
  Printer, 
  Home, 
  Building2, 
  Search, 
  Filter, 
  AlertTriangle, 
  Send, 
  CheckCircle2, 
  Clock, 
  RotateCcw,
  Plus,
  FileText,
  BadgeAlert
} from 'lucide-react';
import { Booking, Patient, LabSettings, BookingStatus } from '../types';
import { 
  deletePatientWithData, 
  deleteBooking, 
  resetPatientDataPreservingCatalog,
  saveBooking,
  savePatient 
} from '../utils/storage';
import { broadcastBooking } from '../utils/syncService';
import { EditModal, EditEntity } from './EditModal';
import { ReceiptPrintModal } from './ReceiptPrintModal';
import { RTLogo } from './RTLogo';

interface AdminBookingsProps {
  bookings: Booking[];
  patients: Patient[];
  settings: LabSettings;
  onDataChanged: () => void;
  onOpenSyncHub: () => void;
}

export const AdminBookings: React.FC<AdminBookingsProps> = ({
  bookings,
  patients,
  settings,
  onDataChanged,
  onOpenSyncHub,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'bookings' | 'patients'>('bookings');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [visitFilter, setVisitFilter] = useState<string>('all');

  // Modals state
  const [editingEntity, setEditingEntity] = useState<EditEntity | null>(null);
  const [receiptBooking, setReceiptBooking] = useState<Booking | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmWord, setResetConfirmWord] = useState('');

  // Filtering bookings
  const filteredBookings = bookings.filter(b => {
    const matchesSearch = 
      b.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.patientPhone.includes(searchQuery) ||
      b.bookingCode.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    const matchesVisit = visitFilter === 'all' || b.visitType === visitFilter;

    return matchesSearch && matchesStatus && matchesVisit;
  });

  // Filtering patients
  const filteredPatients = patients.filter(p => {
    return (
      p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery) ||
      p.fileNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Handlers
  const handleDeleteSinglePatient = (patient: Patient) => {
    if (confirm(`هل أنت متأكد من حذف المريض (${patient.fullName}) وجميع حجوزاته وسجلاته نهائياً؟`)) {
      deletePatientWithData(patient.id);
      onDataChanged();
    }
  };

  const handleDeleteSingleBooking = (booking: Booking) => {
    if (confirm(`هل أنت متأكد من حذف الحجز [${booking.bookingCode}] للمريض ${booking.patientName}؟`)) {
      deleteBooking(booking.id);
      onDataChanged();
    }
  };

  const handleMasterReset = () => {
    if (resetConfirmWord !== 'تصفير') {
      alert('يرجى كتابة كلمة "تصفير" لتأكيد مسح بيانات المرضى والحجوزات.');
      return;
    }

    resetPatientDataPreservingCatalog();
    setShowResetModal(false);
    setResetConfirmWord('');
    onDataChanged();
    alert('تم تصفير جميع بيانات المرضى والحجوزات بنجاح، مع الاحتفاظ الكامل بكتالوج التحاليل، الباقات، والأسعار!');
  };

  const handleSaveEdit = (entity: EditEntity) => {
    if (entity.type === 'booking') {
      saveBooking(entity.data);
      broadcastBooking(entity.data, 'UPDATE_BOOKING');
    } else if (entity.type === 'patient') {
      savePatient(entity.data);
    }
    onDataChanged();
    setEditingEntity(null);
  };

  const handleQuickStatusChange = (booking: Booking, newStatus: BookingStatus) => {
    const updated = { ...booking, status: newStatus };
    saveBooking(updated);
    broadcastBooking(updated, 'UPDATE_BOOKING');
    onDataChanged();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Reset Action */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <RTLogo variant="icon-only" size="sm" />
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              لوحة إدارة المعمل وحجوزات المرضى 🏥
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            متابعة الحجوزات، مواعيد الزيارات المنزلية، تعديل السجلات، وحذف المرضى مع ميزة التصفير الآمن
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Master Reset Button */}
          <button
            onClick={() => setShowResetModal(true)}
            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            title="تصفير المرضى والحجوزات مع الاحتفاظ بكتالوج التحاليل والأسعار"
          >
            <RotateCcw className="w-4 h-4 text-rose-600" />
            تصفير سجل المرضى والحجوزات
          </button>

          <button
            onClick={onOpenSyncHub}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Send className="w-4 h-4" />
            مركز المزامنة الفورية ⚡
          </button>
        </div>
      </div>

      {/* Tabs and Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Sub tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setActiveSubTab('bookings')}
              className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeSubTab === 'bookings'
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              قائمة الحجوزات والفحوصات ({bookings.length})
            </button>
            <button
              onClick={() => setActiveSubTab('patients')}
              className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeSubTab === 'patients'
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              سجل المرضى المسجلين ({patients.length})
            </button>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="بحث باسم المريض، الهاتف، الكود..."
              className="w-full pr-9 pl-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Filter controls for bookings */}
        {activeSubTab === 'bookings' && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-semibold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              تصفية حسب:
            </span>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
            >
              <option value="all">كل الحالات ({bookings.length})</option>
              <option value="pending">في الانتظار (Pending)</option>
              <option value="confirmed">مؤكد (Confirmed)</option>
              <option value="sampling">جاري سحب العينة (Sampling)</option>
              <option value="processing">جاري التحليل (Processing)</option>
              <option value="completed">جاهز النتائج (Completed)</option>
              <option value="cancelled">ملغي (Cancelled)</option>
            </select>

            <select
              value={visitFilter}
              onChange={e => setVisitFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
            >
              <option value="all">كل أنواع الزيارات</option>
              <option value="branch">🏢 زيارة الفرع</option>
              <option value="home">🏠 زيارة منزلية</option>
            </select>
          </div>
        )}
      </div>

      {/* BOOKINGS VIEW */}
      {activeSubTab === 'bookings' && (
        <div className="space-y-3">
          {filteredBookings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 text-sm">
              لا توجد حجوزات مطابقة لمعايير البحث الحالية.
            </div>
          ) : (
            filteredBookings.map(booking => (
              <div
                key={booking.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-sky-300 transition-all p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Main Booking Details */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-black text-sky-800 text-sm bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                      {booking.bookingCode}
                    </span>

                    <span className="font-bold text-sm text-slate-900">
                      {booking.patientName}
                    </span>

                    <span className="text-xs text-slate-500 font-mono">
                      ({booking.patientPhone})
                    </span>

                    {/* Visit Type Badge */}
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                      booking.visitType === 'home'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {booking.visitType === 'home' ? <Home className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                      {booking.visitType === 'home' ? 'زيارة منزلية' : 'فرع المعمل'}
                    </span>

                    {/* Free Visit Indicator */}
                    {booking.visitType === 'home' && booking.isHomeVisitFree && (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300">
                        زيارة منزلية مجانية (معفية: {booking.homeVisitFreeReason || 'عرض معتمد'})
                      </span>
                    )}
                  </div>

                  {/* Tests preview */}
                  <div className="flex flex-wrap items-center gap-1 text-xs text-slate-600">
                    <span className="font-bold text-slate-700">الفحوصات:</span>
                    {booking.selectedTests.map((t, idx) => (
                      <span key={idx} className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[11px]">
                        {t.nameAr}
                      </span>
                    ))}
                    {booking.selectedPackages.length > 0 && (
                      <span className="bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded text-[11px] font-bold">
                        باقة فحص شامل ({booking.selectedPackages.length})
                      </span>
                    )}
                  </div>

                  {/* Date & Address */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{booking.appointmentDate} · {booking.appointmentTimeSlot}</span>
                    </div>

                    {booking.patientAddress && booking.visitType === 'home' && (
                      <div className="text-slate-600 font-medium">
                        العنوان: {booking.patientAddress}
                      </div>
                    )}
                  </div>

                  {/* Financial summary */}
                  <div className="flex items-center gap-3 text-xs pt-1">
                    <span className="text-slate-500">
                      المجموع: <strong className="text-slate-800">{booking.subtotal} ج.م</strong>
                    </span>
                    {booking.discount > 0 && (
                      <span className="text-emerald-700 font-bold">
                        خصم: -{booking.discount} ج.م
                      </span>
                    )}
                    <span className="text-sky-900 font-black">
                      الإجمالي: {booking.total} ج.م
                    </span>
                  </div>
                </div>

                {/* Status Switcher & Action buttons */}
                <div className="flex flex-wrap md:flex-col items-end gap-2 shrink-0 border-t md:border-t-0 md:border-r border-slate-100 pt-3 md:pt-0 md:pr-4">
                  {/* Status Dropdown */}
                  <select
                    value={booking.status}
                    onChange={e => handleQuickStatusChange(booking, e.target.value as BookingStatus)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border focus:outline-none ${
                      booking.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : booking.status === 'confirmed'
                        ? 'bg-sky-50 text-sky-800 border-sky-300'
                        : booking.status === 'sampling'
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : 'bg-slate-50 text-slate-700 border-slate-300'
                    }`}
                  >
                    <option value="pending">في الانتظار ⏳</option>
                    <option value="confirmed">مؤكد ✓</option>
                    <option value="sampling">سحب العينات 🩸</option>
                    <option value="processing">جاري التحليل 🔬</option>
                    <option value="completed">جاهز النتائج 📄</option>
                    <option value="cancelled">ملغي ✕</option>
                  </select>

                  {/* Controls */}
                  <div className="flex items-center gap-1.5">
                    {/* Print Receipt */}
                    <button
                      onClick={() => setReceiptBooking(booking)}
                      className="p-2 text-slate-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors"
                      title="طباعة إيصال الحجز والفاتورة"
                    >
                      <Printer className="w-4 h-4" />
                    </button>

                    {/* Universal Edit */}
                    <button
                      onClick={() => setEditingEntity({ type: 'booking', data: booking })}
                      className="p-2 text-slate-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors"
                      title="تعديل بيانات الحجز والأسعار"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete booking */}
                    <button
                      onClick={() => handleDeleteSingleBooking(booking)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="حذف هذا الحجز"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* PATIENTS VIEW */}
      {activeSubTab === 'patients' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                  <th className="py-3 px-4 font-bold">رقم الملف</th>
                  <th className="py-3 px-4 font-bold">اسم المريض</th>
                  <th className="py-3 px-4 font-bold">الهاتف</th>
                  <th className="py-3 px-4 font-bold">السن / النوع</th>
                  <th className="py-3 px-4 font-bold">العنوان</th>
                  <th className="py-3 px-4 font-bold">نقاط الولاء</th>
                  <th className="py-3 px-4 font-bold text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      لا يوجد مرضى مسجلين حالياً.
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map(pat => (
                    <tr key={pat.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-sky-800">
                        {pat.fileNumber}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {pat.fullName}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {pat.phone}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {pat.age} سنة · {pat.gender === 'male' ? 'ذكر' : 'أنثى'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {pat.address || 'غير محدد'}
                      </td>
                      <td className="py-3 px-4 font-bold text-amber-600">
                        {pat.points} نقطة
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setEditingEntity({ type: 'patient', data: pat })}
                            className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                            title="تعديل بيانات المريض"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSinglePatient(pat)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                            title="حذف المريض وجميع بياناته وحجوزاته"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MASTER RESET CONFIRMATION MODAL */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border-2 border-rose-300 animate-scale-in">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h3 className="text-base font-extrabold text-slate-900 mb-2">
              تصفير سجل المرضى والحجوزات بالكامل
            </h3>

            <div className="text-xs text-slate-600 space-y-2 mb-4">
              <p className="leading-relaxed">
                هذا الإجراء سيقوم بحذف <strong className="text-rose-600">جميع المرضى المسجلين والحجوزات الحالية</strong> والبدء بسجل نظيف.
              </p>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 font-semibold">
                ✓ سيتم الاحتفاظ بالكامل بـ: كتالوج التحاليل، الأسعار المعتمدة، باقات الفحص الشامل، جوائز عجلة الحظ، وإعدادات المعمل!
              </div>
            </div>

            <div className="mb-4 text-xs">
              <label className="block font-bold text-slate-700 mb-1">
                للتأكيد، اكتب كلمة <span className="text-rose-600 font-black">"تصفير"</span> في الحقل أدناه:
              </label>
              <input
                type="text"
                value={resetConfirmWord}
                onChange={e => setResetConfirmWord(e.target.value.trim())}
                placeholder="اكتب تصفير هنا"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-center font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setShowResetModal(false);
                  setResetConfirmWord('');
                }}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-bold text-xs"
              >
                إلغاء التراجع
              </button>
              <button
                type="button"
                onClick={handleMasterReset}
                disabled={resetConfirmWord !== 'تصفير'}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs transition-colors disabled:opacity-40"
              >
                تأكيد التصفير الآن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UNIVERSAL EDIT MODAL */}
      {editingEntity && (
        <EditModal
          entity={editingEntity}
          onSave={handleSaveEdit}
          onClose={() => setEditingEntity(null)}
        />
      )}

      {/* PRINT RECEIPT MODAL */}
      {receiptBooking && (
        <ReceiptPrintModal
          booking={receiptBooking}
          settings={settings}
          onClose={() => setReceiptBooking(null)}
        />
      )}
    </div>
  );
};
