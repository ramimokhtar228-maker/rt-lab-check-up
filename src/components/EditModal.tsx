import React, { useState } from 'react';
import { X, Check, Edit2, AlertCircle } from 'lucide-react';
import { Patient, Booking, LabTest, CheckupPackage, SampleType, TestCategory } from '../types';

export type EditEntity = 
  | { type: 'patient'; data: Patient }
  | { type: 'booking'; data: Booking }
  | { type: 'test'; data: LabTest }
  | { type: 'package'; data: CheckupPackage };

interface EditModalProps {
  entity: EditEntity;
  onSave: (updated: EditEntity) => void;
  onClose: () => void;
}

export const EditModal: React.FC<EditModalProps> = ({ entity, onSave, onClose }) => {
  // Local edit states
  const [patientState, setPatientState] = useState<Patient>(
    entity.type === 'patient' ? { ...entity.data } : ({} as Patient)
  );

  const [bookingState, setBookingState] = useState<Booking>(
    entity.type === 'booking' ? { ...entity.data } : ({} as Booking)
  );

  const [testState, setTestState] = useState<LabTest>(
    entity.type === 'test' ? { ...entity.data } : ({} as LabTest)
  );

  const [packageState, setPackageState] = useState<CheckupPackage>(
    entity.type === 'package' ? { ...entity.data } : ({} as CheckupPackage)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (entity.type === 'patient') {
      onSave({ type: 'patient', data: patientState });
    } else if (entity.type === 'booking') {
      onSave({ type: 'booking', data: bookingState });
    } else if (entity.type === 'test') {
      onSave({ type: 'test', data: testState });
    } else if (entity.type === 'package') {
      onSave({ type: 'package', data: packageState });
    }
  };

  const categories: TestCategory[] = [
    'أمراض الدم والسيولة',
    'وظائف الكبد',
    'وظائف الكلى واليوريك',
    'السكر والتمثيل الغذائي',
    'دهون وكوليسترول الدم',
    'الهرمونات والغدد',
    'الفيتامينات والمعادن',
    'دلالات الأورام والمناعة',
    'الفيروسات والأمراض المعدية',
    'التحاليل الميكروسكوبية والسريرية',
    'فحوصات مخصصة'
  ];

  const sampleTypes: SampleType[] = [
    'دم كامل (EDTA)',
    'مصل دم (Serum)',
    'بلازما (Citrate)',
    'عينة بول (Urine)',
    'عينة براز (Stool)',
    'مسحة (Swab)',
    'أخرى'
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden my-6 animate-scale-in">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit2 className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-sm">
              {entity.type === 'patient' && 'تعديل بيانات المريض'}
              {entity.type === 'booking' && `تعديل الحجز الطبي [${bookingState.bookingCode}]`}
              {entity.type === 'test' && 'تعديل بيانات وسعر الفحص المخبري'}
              {entity.type === 'package' && 'تعديل بيانات باقة الفحص الشامل'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* ============ PATIENT EDIT ============ */}
          {entity.type === 'patient' && (
            <>
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم المريض ثلاثي / رباعي</label>
                <input
                  type="text"
                  required
                  value={patientState.fullName}
                  onChange={e => setPatientState({ ...patientState, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم الهاتف (موبايل)</label>
                  <input
                    type="tel"
                    required
                    value={patientState.phone}
                    onChange={e => setPatientState({ ...patientState, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">السن (بالسنوات)</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    required
                    value={patientState.age}
                    onChange={e => setPatientState({ ...patientState, age: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الجنس</label>
                  <select
                    value={patientState.gender}
                    onChange={e => setPatientState({ ...patientState, gender: e.target.value as 'male' | 'female' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="male">ذكر</option>
                    <option value="female">أنثى</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم الملف (File Number)</label>
                  <input
                    type="text"
                    value={patientState.fileNumber}
                    onChange={e => setPatientState({ ...patientState, fileNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">العنوان بالتفصيل (للزيارات المنزلية)</label>
                <input
                  type="text"
                  value={patientState.address || ''}
                  onChange={e => setPatientState({ ...patientState, address: e.target.value })}
                  placeholder="الشارع، المنطقة، رقم العمارة، الدور"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ملاحظات طبية / أمراض مزمنة</label>
                <textarea
                  rows={2}
                  value={patientState.notes || ''}
                  onChange={e => setPatientState({ ...patientState, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </>
          )}

          {/* ============ BOOKING EDIT ============ */}
          {entity.type === 'booking' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم المريض</label>
                  <input
                    type="text"
                    required
                    value={bookingState.patientName}
                    onChange={e => setBookingState({ ...bookingState, patientName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم الهاتف</label>
                  <input
                    type="tel"
                    required
                    value={bookingState.patientPhone}
                    onChange={e => setBookingState({ ...bookingState, patientPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Home Visit Settings */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="font-bold text-slate-800">إعدادات الزيارة والرسوم:</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">نوع الزيارة</label>
                    <select
                      value={bookingState.visitType}
                      onChange={e => setBookingState({ ...bookingState, visitType: e.target.value as 'branch' | 'home' })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                    >
                      <option value="branch">🏢 زيارة الفرع</option>
                      <option value="home">🏠 زيارة منزلية</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">رسوم الزيارة (ج.م)</label>
                    <input
                      type="number"
                      min="0"
                      value={bookingState.homeVisitFee}
                      onChange={e => {
                        const fee = Number(e.target.value);
                        const newTotal = bookingState.subtotal + (bookingState.isHomeVisitFree ? 0 : fee) - bookingState.discount;
                        setBookingState({ ...bookingState, homeVisitFee: fee, total: Math.max(0, newTotal) });
                      }}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                {bookingState.visitType === 'home' && (
                  <div className="pt-2 border-t border-slate-200 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bookingState.isHomeVisitFree}
                        onChange={e => {
                          const isFree = e.target.checked;
                          const fee = isFree ? 0 : 100;
                          const newTotal = bookingState.subtotal + (isFree ? 0 : bookingState.homeVisitFee) - bookingState.discount;
                          setBookingState({
                            ...bookingState,
                            isHomeVisitFree: isFree,
                            total: Math.max(0, newTotal)
                          });
                        }}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                      />
                      <span className="font-bold text-emerald-700">تطبيق زيارة منزلية مجانية (معفية من الرسوم)</span>
                    </label>

                    {bookingState.isHomeVisitFree && (
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">سبب الإعفاء من رسوم الزيارة</label>
                        <select
                          value={bookingState.homeVisitFreeReason || ''}
                          onChange={e => setBookingState({ ...bookingState, homeVisitFreeReason: e.target.value })}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white"
                        >
                          <option value="كبار السن وذوي الهمم (+60 عاماً)">كبار السن وذوي الهمم (+60 عاماً)</option>
                          <option value="عرض ترويجي / كود فائز من عجلة الحظ">عرض ترويجي / كود فائز من عجلة الحظ</option>
                          <option value="قيمة الفحوصات تتجاوز 1000 ج.م">قيمة الفحوصات تتجاوز 1000 ج.م</option>
                          <option value="حالة إنسانية / خصم إدارة">حالة إنسانية / خصم إدارة</option>
                          <option value="مريض دائم وعائلي (VIP)">مريض دائم وعائلي (VIP)</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Pricing & Status */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">المجموع الفرعي (ج.م)</label>
                  <input
                    type="number"
                    min="0"
                    value={bookingState.subtotal}
                    onChange={e => {
                      const sub = Number(e.target.value);
                      const visitCost = (bookingState.visitType === 'home' && !bookingState.isHomeVisitFree) ? bookingState.homeVisitFee : 0;
                      setBookingState({ ...bookingState, subtotal: sub, total: Math.max(0, sub + visitCost - bookingState.discount) });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الخصم (ج.م)</label>
                  <input
                    type="number"
                    min="0"
                    value={bookingState.discount}
                    onChange={e => {
                      const disc = Number(e.target.value);
                      const visitCost = (bookingState.visitType === 'home' && !bookingState.isHomeVisitFree) ? bookingState.homeVisitFee : 0;
                      setBookingState({ ...bookingState, discount: disc, total: Math.max(0, bookingState.subtotal + visitCost - disc) });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الإجمالي النهائي</label>
                  <input
                    type="number"
                    min="0"
                    value={bookingState.total}
                    onChange={e => setBookingState({ ...bookingState, total: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-sky-400 bg-sky-50 font-bold text-sky-900 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">حالة الحجز</label>
                  <select
                    value={bookingState.status}
                    onChange={e => setBookingState({ ...bookingState, status: e.target.value as Booking['status'] })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="pending">في الانتظار (Pending)</option>
                    <option value="confirmed">مؤكد (Confirmed)</option>
                    <option value="sampling">جاري سحب العينة (Sampling)</option>
                    <option value="processing">جاري التحليل بالمختبر (Processing)</option>
                    <option value="completed">جاهز النتائج (Completed)</option>
                    <option value="cancelled">ملغي (Cancelled)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">تاريخ وموعد الحجز</label>
                  <input
                    type="date"
                    value={bookingState.appointmentDate}
                    onChange={e => setBookingState({ ...bookingState, appointmentDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ملاحظات إدارية / خاصة</label>
                <textarea
                  rows={2}
                  value={bookingState.notes || ''}
                  onChange={e => setBookingState({ ...bookingState, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </>
          )}

          {/* ============ TEST CATALOG EDIT ============ */}
          {entity.type === 'test' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم الفحص بالعربي</label>
                  <input
                    type="text"
                    required
                    value={testState.nameAr}
                    onChange={e => setTestState({ ...testState, nameAr: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم الفحص بالإنجليزي</label>
                  <input
                    type="text"
                    required
                    value={testState.nameEn}
                    onChange={e => setTestState({ ...testState, nameEn: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">السعر (جنيهاً مصرياً)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={testState.price}
                    onChange={e => setTestState({ ...testState, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-sky-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">القسم الطبي</label>
                  <select
                    value={testState.category}
                    onChange={e => setTestState({ ...testState, category: e.target.value as TestCategory })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">نوع العينة</label>
                  <select
                    value={testState.sampleType}
                    onChange={e => setTestState({ ...testState, sampleType: e.target.value as SampleType })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    {sampleTypes.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ساعات الصيام المطلوبة</label>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    value={testState.fastingHours}
                    onChange={e => setTestState({ ...testState, fastingHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">مدة خروج النتيجة (ساعة)</label>
                  <input
                    type="number"
                    min="1"
                    value={testState.turnaroundHours}
                    onChange={e => setTestState({ ...testState, turnaroundHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الوصف الطبي والأهمية</label>
                <textarea
                  rows={2}
                  value={testState.description || ''}
                  onChange={e => setTestState({ ...testState, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </>
          )}

          {/* ============ PACKAGE EDIT ============ */}
          {entity.type === 'package' && (
            <>
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم الباقة بالعربي</label>
                <input
                  type="text"
                  required
                  value={packageState.nameAr}
                  onChange={e => setPackageState({ ...packageState, nameAr: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">سعر الباقة الحالي (ج.م)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={packageState.price}
                    onChange={e => setPackageState({ ...packageState, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-sky-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">السعر الأصلي قبل الخصم (ج.م)</label>
                  <input
                    type="number"
                    min="0"
                    value={packageState.originalPrice}
                    onChange={e => setPackageState({ ...packageState, originalPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الوصف الترويجي</label>
                <textarea
                  rows={2}
                  value={packageState.description}
                  onChange={e => setPackageState({ ...packageState, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-bold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Check className="w-4 h-4" />
              حفظ التعديلات الفورية
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
