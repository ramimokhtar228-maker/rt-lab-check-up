import React from 'react';
import { Printer, X, CheckCircle, Clock, MapPin, Phone, QrCode } from 'lucide-react';
import { Booking, LabSettings } from '../types';
import { RTLogo } from './RTLogo';

interface ReceiptPrintModalProps {
  booking: Booking;
  settings: LabSettings;
  onClose: () => void;
}

export const ReceiptPrintModal: React.FC<ReceiptPrintModalProps> = ({ 
  booking, 
  settings, 
  onClose 
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8">
        {/* Top actions (hidden on actual print) */}
        <div className="print:hidden p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-sky-400" />
            <span className="font-bold text-sm">إيصال حجز وفاتورة معمل معتمدة</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              طباعة الإيصال (Print)
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE RECEIPT CONTENT */}
        <div id="printable-receipt" className="p-6 sm:p-8 bg-white text-slate-800 space-y-6">
          {/* Header */}
          <RTLogo variant="print-header" />

          {/* Booking Barcode Banner */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <div className="text-[11px] text-slate-500 font-semibold">رقم الحجز المرجعي / Barcode:</div>
              <div className="text-xl font-black font-mono tracking-widest text-sky-800">
                {booking.bookingCode}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                تاريخ التسجيل: {new Date(booking.createdAt).toLocaleDateString('ar-EG', { dateStyle: 'long' })}
              </div>
            </div>

            {/* Simulated barcode representation */}
            <div className="flex flex-col items-center">
              <div className="font-mono text-2xl tracking-[4px] font-light select-none text-slate-900">
                ||| | |||| | || |||| |
              </div>
              <span className="text-[10px] font-mono text-slate-500">*{booking.bookingCode}*</span>
            </div>

            <div className="text-left">
              <span className={`inline-block px-2.5 py-1 rounded text-xs font-bold border ${
                booking.status === 'completed' 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-sky-50 text-sky-700 border-sky-200'
              }`}>
                {booking.status === 'completed' ? 'جاهز النتائج ✓' : 'حجز مؤكد'}
              </span>
            </div>
          </div>

          {/* Patient Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border border-slate-200 rounded-xl p-3 bg-white">
            <div>
              <span className="text-slate-400 block text-[10px]">اسم المريض:</span>
              <span className="font-bold text-slate-900">{booking.patientName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">رقم الهاتف:</span>
              <span className="font-bold text-slate-800 font-mono">{booking.patientPhone}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">السن / الجنس:</span>
              <span className="font-bold text-slate-800">
                {booking.patientAge} سنة · {booking.patientGender === 'male' ? 'ذكر' : 'أنثى'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">نوع وموعد الزيارة:</span>
              <span className="font-bold text-slate-800">
                {booking.visitType === 'home' ? '🏠 زيارة منزلية' : '🏢 زيارة الفرع'}
              </span>
            </div>
          </div>

          {booking.visitType === 'home' && (
            <div className="text-xs p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
              <span className="font-bold">عنوان الزيارة المنزلية: </span>
              <span>{booking.patientAddress || 'تم الاتفاق هاتفياً'}</span>
              {booking.isHomeVisitFree && (
                <span className="mr-2 font-bold text-emerald-700">
                  (زيارة معفية مجانية: {booking.homeVisitFreeReason || 'عرض معتمد'})
                </span>
              )}
            </div>
          )}

          {/* Test Items Table */}
          <div>
            <table className="w-full text-xs text-right border-collapse">
              <thead>
                <tr className="bg-sky-50 text-sky-900 border-b border-sky-200">
                  <th className="py-2 px-3 font-bold">#</th>
                  <th className="py-2 px-3 font-bold">التحليل / الباقة الطبية المطلوبة</th>
                  <th className="py-2 px-3 font-bold">الاسم الإنجليزي</th>
                  <th className="py-2 px-3 font-bold text-left">السعر (ج.م)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {booking.selectedTests.map((t, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                    <td className="py-2 px-3 font-bold text-slate-800">
                      {t.nameAr}
                      {t.isCustom && <span className="mr-1 text-[10px] text-amber-600 bg-amber-50 px-1 rounded">(فحص مخصص)</span>}
                    </td>
                    <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">{t.nameEn}</td>
                    <td className="py-2 px-3 font-bold text-slate-900 text-left">{t.price} ج.م</td>
                  </tr>
                ))}

                {/* If home visit with fee */}
                {booking.visitType === 'home' && (
                  <tr className="bg-slate-50/50">
                    <td className="py-2 px-3 text-slate-400">#</td>
                    <td className="py-2 px-3 font-bold text-slate-700">رسوم سحب العينات بالمنزل (Home Visit Service)</td>
                    <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">Home Nursing Visit</td>
                    <td className="py-2 px-3 font-bold text-left">
                      {booking.isHomeVisitFree ? (
                        <span className="text-emerald-600 font-bold">0 ج.م (مجاناً)</span>
                      ) : (
                        <span>{booking.homeVisitFee} ج.م</span>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Financial Totals */}
          <div className="flex flex-col items-end pt-3 border-t-2 border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between w-60 text-slate-600">
              <span>المجموع الفرعي:</span>
              <span className="font-bold">{booking.subtotal + (booking.isHomeVisitFree ? 0 : booking.homeVisitFee)} ج.م</span>
            </div>
            {booking.discount > 0 && (
              <div className="flex justify-between w-60 text-emerald-700 font-bold">
                <span>الخصم المطبق ({booking.discountReason || 'كوبون'}):</span>
                <span>- {booking.discount} ج.م</span>
              </div>
            )}
            <div className="flex justify-between w-60 text-sm font-black text-sky-900 pt-1.5 border-t border-slate-300">
              <span>الإجمالي النهائي المستحق:</span>
              <span className="text-base">{booking.total} ج.م</span>
            </div>
          </div>

          {/* Test Preparation Advice */}
          <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-xl text-xs space-y-1">
            <div className="font-bold text-sky-900 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-sky-700" />
              تعليمات تحضير المريض قبل سحب العينة:
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              يرجى الالتزام بالصيام المحدد لكل فحص (مع شرب الماء مسموح)، وتناول الأدوية المعتادة إلا إذا أوصى الطبيب بغير ذلك.
              يمكنكم استلام النتائج إلكترونياً عبر مسح رمز QR أو عبر رابط النظام الموحد.
            </p>
          </div>

          {/* Footer Accreditation */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <div>
              <span>معامل RT - الدقة والسرعة المعتمدة</span>
              <span className="mx-2">|</span>
              <span>للاستفسارات والشكاوى: 19088</span>
            </div>
            <div className="font-mono text-[10px]">
              ID: {booking.id}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
