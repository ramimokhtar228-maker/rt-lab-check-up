import React, { useState } from 'react';
import { 
  UserCheck, 
  UserPlus, 
  Calendar, 
  MapPin, 
  Home, 
  Building2, 
  Check, 
  Plus, 
  Trash2, 
  Gift, 
  Sparkles, 
  Printer, 
  Clock, 
  AlertCircle, 
  Phone, 
  Search,
  CheckCircle2,
  FileText,
  BadgePercent
} from 'lucide-react';
import { 
  Patient, 
  Booking, 
  LabTest, 
  CheckupPackage, 
  VisitType, 
  WonReward, 
  LabSettings 
} from '../types';
import { 
  savePatient, 
  saveBooking, 
  getPatients, 
  getBookings 
} from '../utils/storage';
import { broadcastBooking } from '../utils/syncService';
import { playClick, playSyncDing } from '../utils/audio';
import { RTLogo } from './RTLogo';
import { FortuneWheel } from './FortuneWheel';
import { ReceiptPrintModal } from './ReceiptPrintModal';

interface PatientPortalProps {
  tests: LabTest[];
  packages: CheckupPackage[];
  settings: LabSettings;
  onBookingCreated: (booking: Booking) => void;
  activePatient: Patient | null;
  setActivePatient: (patient: Patient | null) => void;
}

export const PatientPortal: React.FC<PatientPortalProps> = ({
  tests,
  packages,
  settings,
  onBookingCreated,
  activePatient,
  setActivePatient,
}) => {
  // Navigation inside portal: 'book' | 'my-bookings' | 'wheel'
  const [subView, setSubView] = useState<'book' | 'my-bookings' | 'wheel'>('book');

  // Login / Register toggle
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [loginPhone, setLoginPhone] = useState('');

  // Register form fields
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAge, setRegAge] = useState<number>(30);
  const [regGender, setRegGender] = useState<'male' | 'female'>('male');
  const [regAddress, setRegAddress] = useState('');
  const [regNotes, setRegNotes] = useState('');

  // Booking Wizard states
  const [visitType, setVisitType] = useState<VisitType>('home');
  const [isHomeVisitFree, setIsHomeVisitFree] = useState(false);
  const [homeVisitFreeReason, setHomeVisitFreeReason] = useState('كبار السن وذوي الهمم (+60 عاماً)');
  const [selectedTests, setSelectedTests] = useState<LabTest[]>([]);
  const [selectedPackages, setSelectedPackages] = useState<CheckupPackage[]>([]);
  
  // Custom tests added by patient
  const [customTestInput, setCustomTestInput] = useState('');
  const [customTestsList, setCustomTestsList] = useState<string[]>([]);

  // Appointment scheduling
  const [appointmentDate, setAppointmentDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [appointmentSlot, setAppointmentSlot] = useState('09:00 صباحاً - 11:00 صباحاً');

  // Coupon / Rewards
  const [appliedCoupon, setAppliedCoupon] = useState<WonReward | null>(null);
  const [couponCodeInput, setCouponCodeInput] = useState('');

  // Receipt Modal
  const [viewReceiptBooking, setViewReceiptBooking] = useState<Booking | null>(null);
  const [showBookingSuccess, setShowBookingSuccess] = useState<Booking | null>(null);

  // Search in booking test picker
  const [testSearch, setTestSearch] = useState('');

  // Patient Login handler (by phone or booking code)
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    playClick();
    const query = loginPhone.trim();
    const allPatients = getPatients();
    let found = allPatients.find(p => p.phone === query);

    // If not found by phone, check if entered a booking code
    if (!found) {
      const allBookings = getBookings();
      const matchBooking = allBookings.find(
        b => b.bookingCode.toUpperCase() === query.toUpperCase() || b.patientPhone === query
      );
      if (matchBooking) {
        found = allPatients.find(p => p.id === matchBooking.patientId || p.phone === matchBooking.patientPhone);
        if (!found) {
          found = {
            id: matchBooking.patientId,
            fileNumber: matchBooking.bookingCode,
            fullName: matchBooking.patientName,
            phone: matchBooking.patientPhone,
            age: matchBooking.patientAge,
            gender: matchBooking.patientGender,
            address: matchBooking.patientAddress,
            createdAt: matchBooking.createdAt,
            points: 50,
          };
        }
      }
    }

    if (found) {
      setActivePatient(found);
    } else {
      alert('لم يتم العثور على مريض مسجل بهذا الهاتف أو كود الحجز. يرجى تسجيل حساب جديد في ثوانٍ.');
      setRegPhone(loginPhone);
      setAuthMode('register');
    }
  };

  // Patient Register handler
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    playClick();
    const newPatient: Patient = {
      id: `pat_${Date.now()}`,
      fileNumber: `RT-P${Math.floor(1000 + Math.random() * 9000)}`,
      fullName: regFullName.trim(),
      phone: regPhone.trim(),
      age: regAge,
      gender: regGender,
      address: regAddress.trim(),
      notes: regNotes.trim(),
      createdAt: new Date().toISOString(),
      points: 50, // Welcome bonus points!
    };

    savePatient(newPatient);
    setActivePatient(newPatient);
  };

  // Add custom test requested by patient
  const handleAddCustomTest = () => {
    if (!customTestInput.trim()) return;
    setCustomTestsList([...customTestsList, customTestInput.trim()]);
    setCustomTestInput('');
  };

  const handleRemoveCustomTest = (idx: number) => {
    setCustomTestsList(customTestsList.filter((_, i) => i !== idx));
  };

  // Price calculations
  const testsSubtotal = selectedTests.reduce((sum, t) => sum + t.price, 0);
  const packagesSubtotal = selectedPackages.reduce((sum, p) => sum + p.price, 0);
  const subtotal = testsSubtotal + packagesSubtotal;

  // Visit fee calculation
  const effectiveVisitFee = visitType === 'home' 
    ? (isHomeVisitFree ? 0 : settings.homeVisitFee)
    : 0;

  // Auto free visit for seniors (>60) or subtotal >= 1000
  React.useEffect(() => {
    if (activePatient && activePatient.age >= 60) {
      setIsHomeVisitFree(true);
      setHomeVisitFreeReason('إعفاء كبار السن (+60 عاماً)');
    } else if (subtotal >= 1000) {
      setIsHomeVisitFree(true);
      setHomeVisitFreeReason('عرض إعفاء مجاني (قيمة الفحوصات أكثر من 1000 ج.م)');
    }
  }, [activePatient, subtotal]);

  // Discount calculation
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'discount_percent') {
      discountAmount = Math.round((subtotal * appliedCoupon.discountValue) / 100);
    } else if (appliedCoupon.type === 'discount_fixed') {
      discountAmount = appliedCoupon.discountValue;
    } else if (appliedCoupon.type === 'free_visit') {
      setIsHomeVisitFree(true);
      setHomeVisitFreeReason('كوبون عجلة الحظ (زيارة منزلية مجانية)');
    }
  }

  const finalTotal = Math.max(0, subtotal + effectiveVisitFee - discountAmount);

  // Submit Booking
  const handleConfirmBooking = () => {
    if (!activePatient) {
      alert('يرجى تسجيل الدخول أو إدخال بيانات المريض أولاً.');
      return;
    }

    if (selectedTests.length === 0 && selectedPackages.length === 0 && customTestsList.length === 0) {
      alert('يرجى اختيار فحص واحد على الأقل أو باقة أو كتابة فحص مخصص للمتابعة.');
      return;
    }

    const bookingCode = `RT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    
    // Combine items
    const bookedItems = [
      ...selectedTests.map(t => ({
        testId: t.id,
        nameAr: t.nameAr,
        nameEn: t.nameEn,
        price: t.price,
      })),
      ...customTestsList.map((ct, idx) => ({
        testId: `custom_${idx}_${Date.now()}`,
        nameAr: `فحص مخصص: ${ct}`,
        nameEn: 'Custom Test Request',
        price: 0,
        isCustom: true,
      }))
    ];

    const newBooking: Booking = {
      id: `book_${Date.now()}`,
      bookingCode,
      patientId: activePatient.id,
      patientName: activePatient.fullName,
      patientPhone: activePatient.phone,
      patientAge: activePatient.age,
      patientGender: activePatient.gender,
      patientAddress: activePatient.address,
      visitType,
      isHomeVisitFree,
      homeVisitFreeReason: isHomeVisitFree ? homeVisitFreeReason : undefined,
      homeVisitFee: settings.homeVisitFee,
      selectedTests: bookedItems,
      selectedPackages: selectedPackages.map(p => p.id),
      customTestsRequested: customTestsList,
      appointmentDate,
      appointmentTimeSlot: appointmentSlot,
      subtotal,
      discount: discountAmount,
      discountReason: appliedCoupon ? `كوبون (${appliedCoupon.couponCode}): ${appliedCoupon.prizeTitle}` : undefined,
      total: finalTotal,
      paidAmount: 0,
      status: 'pending',
      notes: activePatient.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncedToUnified: true,
      syncedAt: new Date().toISOString(),
    };

    saveBooking(newBooking);
    
    // Broadcast instantly to RT Unified System!
    broadcastBooking(newBooking, 'NEW_BOOKING');

    onBookingCreated(newBooking);
    setShowBookingSuccess(newBooking);
    playSyncDing();

    // Reset wizard fields
    setSelectedTests([]);
    setSelectedPackages([]);
    setCustomTestsList([]);
  };

  // Get active patient's past bookings
  const patientBookings = activePatient 
    ? getBookings().filter(b => b.patientPhone === activePatient.phone || b.patientId === activePatient.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Hero Welcome with RT Lab branding (Dark Red & Royal Navy Blue) */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-red-900/30">
        {/* Background decorative circles */}
        <div className="absolute -top-12 -right-12 w-56 h-56 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-56 h-56 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center p-1 border border-white/20">
                <img src="./rt_logo.png" alt="RT" className="w-full h-full object-contain" />
              </span>
              <span className="text-xs uppercase tracking-widest text-red-300 font-extrabold">
                {settings.labNameEn || 'RT Medical Laboratories & Health Check-Up'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              بوابة حجز الفحوصات والزيارات المنزلية 🔬
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 max-w-2xl leading-relaxed">
              اختر تحاليلك الطبية أو باقات الفحص الشامل بكل سهولة، واحجز سحب العينات في أحد فروع معامل RT أو في راحة منزلك مع مزامنة فورية للنتائج!
            </p>
          </div>

          {/* Quick patient status badge / action */}
          {activePatient ? (
            <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-4 border border-red-500/30 min-w-[220px]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-red-300 font-bold">المريض الحالي</span>
                <button
                  onClick={() => setActivePatient(null)}
                  className="text-[10px] text-blue-200 hover:text-white underline"
                >
                  تبديل الحساب
                </button>
              </div>
              <div className="font-bold text-sm text-white">{activePatient.fullName}</div>
              <div className="text-[11px] text-slate-300 font-mono">{activePatient.phone}</div>
              <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                <span>رصيد نقاط الولاء:</span>
                <span className="font-bold text-amber-300">{activePatient.points} نقطة</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAuthMode('login')}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/20"
              >
                تسجيل الدخول برقم الهاتف
              </button>
              <button
                onClick={() => setAuthMode('register')}
                className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-red-900/30 hover:scale-105"
              >
                تسجيل مريض جديد
              </button>
            </div>
          )}
        </div>

        {/* Sub Navigation Bar inside portal */}
        {activePatient && (
          <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-2 overflow-x-auto text-xs">
            <button
              onClick={() => setSubView('book')}
              className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                subView === 'book'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Calendar className="w-4 h-4" />
              حجز فحوصات وباقات جديدة
            </button>
            <button
              onClick={() => setSubView('my-bookings')}
              className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                subView === 'my-bookings'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <FileText className="w-4 h-4" />
              حجوزاتي ونتائج التحاليل ({patientBookings.length})
            </button>
            <button
              onClick={() => setSubView('wheel')}
              className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                subView === 'wheel'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                  : 'bg-amber-400/20 text-amber-200 hover:bg-amber-400/30'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              عجلة الحظ واربح خصمك 🎡
            </button>
          </div>
        )}
      </div>

      {/* LOGIN OR REGISTER FORM (If no patient selected) */}
      {!activePatient && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-xl mx-auto">
          {/* Tabs */}
          <div className="flex items-center gap-2 mb-6 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setAuthMode('register')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                authMode === 'register' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              <UserPlus className="w-4 h-4 inline ml-1.5" />
              تسجيل بيانات مريض جديد
            </button>
            <button
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                authMode === 'login' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              <UserCheck className="w-4 h-4 inline ml-1.5" />
              دخول برقم الهاتف المسجل
            </button>
          </div>

          {authMode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  رقم الهاتف المسجل أو كود الحجز الطبي
                </label>
                <input
                  type="text"
                  required
                  value={loginPhone}
                  onChange={e => setLoginPhone(e.target.value)}
                  placeholder="مثال: 01012345678 أو RT-2026-105"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-mono text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  يمكنك الاستعلام برقم هاتفك أو بكود الحجز المطبوع على الإيصال للاطلاع على نتائجك فوراً.
                </span>
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white rounded-xl font-bold text-xs shadow-md transition-all"
              >
                دخول واستعراض الحجوزات والنتائج 🔬
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم المريض بالكامل</label>
                <input
                  type="text"
                  required
                  value={regFullName}
                  onChange={e => setRegFullName(e.target.value)}
                  placeholder="الاسم ثلاثي أو رباعي"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم الهاتف (موبايل / واتساب)</label>
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={e => setRegPhone(e.target.value)}
                    placeholder="010xxxxxxxx"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">السن (بالسنوات)</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    required
                    value={regAge}
                    onChange={e => setRegAge(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">النوع / الجنس</label>
                  <select
                    value={regGender}
                    onChange={e => setRegGender(e.target.value as 'male' | 'female')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="male">ذكر</option>
                    <option value="female">أنثى</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">المنطقة أو الفرع الأقرب</label>
                  <select
                    value={regNotes}
                    onChange={e => setRegNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-red-600 focus:outline-none"
                  >
                    {(settings.branchesList && settings.branchesList.length > 0
                      ? settings.branchesList.filter(b => b.isActive).map(b => `${b.name} (${b.city} - ${b.address})`)
                      : settings.branches
                    ).map((b, i) => (
                      <option key={i} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">العنوان بالتفصيل (لسحب العينات بالمنزل)</label>
                <input
                  type="text"
                  value={regAddress}
                  onChange={e => setRegAddress(e.target.value)}
                  placeholder="المحافظة، الحي، الشارع، رقم العقار، الدور، الشقة"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white rounded-xl font-bold text-xs shadow-md transition-all mt-2"
              >
                تأكيد التسجيل والمتابعة للحجز (احصل على 50 نقطة ولاء هدية) 🎁
              </button>
            </form>
          )}
        </div>
      )}

      {/* ACTIVE PATIENT VIEWS */}
      {activePatient && subView === 'wheel' && (
        <FortuneWheel
          patientPhone={activePatient.phone}
          patientName={activePatient.fullName}
          onCouponApplied={coupon => {
            setAppliedCoupon(coupon);
            setSubView('book');
          }}
        />
      )}

      {/* MY BOOKINGS & RESULTS VIEW */}
      {activePatient && subView === 'my-bookings' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-1">
              سجل فحوصات وحجوزات المريض: {activePatient.fullName}
            </h2>
            <p className="text-xs text-slate-500">
              تابع حالة العينات، وطباعة الفواتير، ومشاهدة النتائج المخبرية الفورية
            </p>
          </div>

          {patientBookings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-500 text-xs">
              لا توجد لديك حجوزات سابقة حتى الآن. يمكنك بدء حجز جديد الآن!
            </div>
          ) : (
            patientBookings.map(b => (
              <div
                key={b.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-sky-300 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <RTLogo variant="icon-only" size="sm" />
                    <div>
                      <div className="font-mono font-bold text-sky-800 text-sm">{b.bookingCode}</div>
                      <div className="text-[10px] text-slate-400">
                        تاريخ الحجز: {new Date(b.createdAt).toLocaleDateString('ar-EG')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded text-xs font-bold border ${
                      b.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : b.status === 'sampling'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-sky-50 text-sky-800 border-sky-200'
                    }`}>
                      {b.status === 'completed' ? 'النتائج جاهزة معتمدة ✓' : 
                       b.status === 'sampling' ? 'جاري سحب العينة 🩸' :
                       b.status === 'processing' ? 'جاري التحليل 🔬' : 'حجز مؤكد'}
                    </span>

                    <button
                      onClick={() => setViewReceiptBooking(b)}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      طباعة الإيصال
                    </button>
                  </div>
                </div>

                {/* Tests summary */}
                <div className="text-xs space-y-1">
                  <span className="font-bold text-slate-700">الفحوصات المطلوبة:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {b.selectedTests.map((t, idx) => (
                      <span key={idx} className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px]">
                        {t.nameAr} ({t.price} ج.م)
                      </span>
                    ))}
                  </div>
                </div>

                {/* RESULTS SECTION IF PUBLISHED */}
                {b.results && b.results.length > 0 && (
                  <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-900 text-xs flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        النتائج المخبرية الرسمية المعتمدة (معامل RT):
                      </span>
                      <span className="text-[10px] text-emerald-700">
                        معتمدة بتاريخ: {new Date(b.resultsPublishedAt || b.updatedAt).toLocaleTimeString('ar-EG')}
                      </span>
                    </div>

                    <div className="bg-white rounded-lg border border-emerald-200 overflow-hidden">
                      <table className="w-full text-xs text-right">
                        <thead>
                          <tr className="bg-emerald-100/60 text-emerald-950 font-bold border-b border-emerald-200">
                            <th className="py-1.5 px-3">الفحص</th>
                            <th className="py-1.5 px-3">النتيجة</th>
                            <th className="py-1.5 px-3">الوحدة</th>
                            <th className="py-1.5 px-3">المعدل الطبيعي</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-emerald-100">
                          {b.results.map((r, i) => (
                            <tr key={i}>
                              <td className="py-1.5 px-3 font-semibold text-slate-800">{r.testName}</td>
                              <td className="py-1.5 px-3 font-bold font-mono text-emerald-700">{r.resultValue}</td>
                              <td className="py-1.5 px-3 text-slate-500 font-mono text-[10px]">{r.unit}</td>
                              <td className="py-1.5 px-3 text-slate-500 text-[11px]">{r.referenceRange}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* MAIN BOOKING WIZARD */}
      {activePatient && subView === 'book' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. Visit Type Selector */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sky-600" />
                1. حدد مكان سحب العينات وموعد الزيارة
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Home Visit Card */}
                <div
                  onClick={() => setVisitType('home')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    visitType === 'home'
                      ? 'border-sky-600 bg-sky-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                      <Home className="w-4 h-4 text-sky-600" />
                      زيارة منزلية (سحب بالمنزل)
                    </div>
                    {isHomeVisitFree ? (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
                        مجاناً
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-sky-700">
                        {settings.homeVisitFee} ج.م
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    أخصائي تمريض متخصص يصل لباب منزلك مع كافة أدوات التعقيم وحفظ العينات.
                  </p>
                </div>

                {/* Branch Visit Card */}
                <div
                  onClick={() => setVisitType('branch')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    visitType === 'branch'
                      ? 'border-sky-600 bg-sky-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                      <Building2 className="w-4 h-4 text-sky-600" />
                      زيارة أحد فروع المعمل
                    </div>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      بدون رسوم إضافية
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    تفضل بزيارة أقرب فرع من فروع معامل RT الـ 7 على مستوى الجمهورية.
                  </p>
                </div>
              </div>

              {/* Free Visit Toggle Option */}
              {visitType === 'home' && (
                <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isHomeVisitFree}
                      onChange={e => setIsHomeVisitFree(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span className="font-bold text-emerald-900">
                      تطبيق الإعفاء من رسوم الزيارة المنزلية (زيارة مجانية 0 ج.م)
                    </span>
                  </label>

                  {isHomeVisitFree && (
                    <div className="pt-1">
                      <label className="block text-[11px] font-semibold text-emerald-800 mb-1">سبب الاستحقاق المجاني:</label>
                      <select
                        value={homeVisitFreeReason}
                        onChange={e => setHomeVisitFreeReason(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-emerald-300 rounded-lg bg-white text-xs"
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

              {/* Date & Slot selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ الموعد المفضل</label>
                  <input
                    type="date"
                    value={appointmentDate}
                    onChange={e => setAppointmentDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الفترة الزمنية</label>
                  <select
                    value={appointmentSlot}
                    onChange={e => setAppointmentSlot(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="08:00 صباحاً - 09:30 صباحاً">08:00 صباحاً - 09:30 صباحاً (مثالي للصائمين)</option>
                    <option value="09:30 صباحاً - 11:30 صباحاً">09:30 صباحاً - 11:30 صباحاً</option>
                    <option value="11:30 صباحاً - 01:30 ظهراً">11:30 صباحاً - 01:30 ظهراً</option>
                    <option value="04:00 عصراً - 06:00 مساءً">04:00 عصراً - 06:00 مساءً</option>
                    <option value="06:00 مساءً - 08:30 مساءً">06:00 مساءً - 08:30 مساءً</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Choose Packages or Tests */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  2. باقات الفحص الشامل الموصى بها
                </h2>
                <span className="text-[11px] text-slate-400">وفر حتى 40% مع الباقات</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {packages.slice(0, 4).map(pkg => {
                  const isSelected = selectedPackages.some(p => p.id === pkg.id);
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedPackages(selectedPackages.filter(p => p.id !== pkg.id));
                        } else {
                          setSelectedPackages([...selectedPackages, pkg]);
                        }
                      }}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-sky-600 bg-sky-50/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <h3 className="font-bold text-xs text-slate-900 leading-snug">
                            {pkg.nameAr}
                          </h3>
                          <div className="text-left shrink-0">
                            <span className="font-black text-sky-800 text-xs">{pkg.price} ج.م</span>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2">
                          {pkg.description}
                        </p>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                        <span className="text-slate-400">{pkg.testIds.length} فحص مشمول</span>
                        <span className={`font-bold ${isSelected ? 'text-sky-700' : 'text-slate-500'}`}>
                          {isSelected ? '✓ مشمولة بالحجز' : '+ إضافة الباقة'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Pick Individual Tests */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Search className="w-4 h-4 text-sky-600" />
                  3. اختر تحاليلك الفردية من الكتالوج ({tests.length} تحليل متاح)
                </h2>

                <div className="relative sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={testSearch}
                    onChange={e => setTestSearch(e.target.value)}
                    placeholder="ابحث بالاسم أو الكود..."
                    className="w-full pr-8 pl-2 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Fast Test Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
                {tests
                  .filter(t => 
                    t.nameAr.toLowerCase().includes(testSearch.toLowerCase()) ||
                    t.nameEn.toLowerCase().includes(testSearch.toLowerCase()) ||
                    t.code.toLowerCase().includes(testSearch.toLowerCase())
                  )
                  .map(t => {
                    const isSelected = selectedTests.some(x => x.id === t.id);
                    return (
                      <div
                        key={t.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedTests(selectedTests.filter(x => x.id !== t.id));
                          } else {
                            setSelectedTests([...selectedTests, t]);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-sky-600 bg-sky-50/70 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-slate-900 leading-tight">{t.nameAr}</div>
                          <div className="text-[10px] font-mono text-slate-400">{t.nameEn}</div>
                        </div>

                        <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-slate-100">
                          <span className="font-black text-sky-800">{t.price} ج.م</span>
                          <span className={`text-[10px] font-bold ${isSelected ? 'text-sky-700' : 'text-slate-400'}`}>
                            {isSelected ? '✓ تم الاختيار' : '+ اختيار'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* 4. CUSTOM TEST ADDITION BY PATIENT */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-sky-600" />
                    هل لديك تحليل من الطبيب غير موجود بالقائمة؟ اكتبه هنا ليتم إضافته:
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customTestInput}
                    onChange={e => setCustomTestInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCustomTest())}
                    placeholder="مثال: تحليل مزرعة بول، فحص هرمون DHEA، أو كتابة اسم التحليل كما في الروشتة..."
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomTest}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    إضافة الفحص
                  </button>
                </div>

                {customTestsList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {customTestsList.map((ct, idx) => (
                      <span
                        key={idx}
                        className="bg-amber-50 border border-amber-200 text-amber-900 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                      >
                        <span>{ct}</span>
                        <button
                          onClick={() => handleRemoveCustomTest(idx)}
                          className="text-amber-500 hover:text-amber-700 text-sm font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Col: Booking Order Summary & Confirm */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 sticky top-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <RTLogo variant="icon-only" size="sm" />
                  <h3 className="font-bold text-sm text-slate-900">ملخص الحجز الطبي</h3>
                </div>
                <span className="text-[11px] font-mono text-slate-400">RT Lab</span>
              </div>

              {/* Selected tests list */}
              <div className="space-y-2 text-xs max-h-52 overflow-y-auto pr-1">
                {selectedPackages.map(p => (
                  <div key={p.id} className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="font-semibold text-slate-800">{p.nameAr}</span>
                    <span className="font-bold text-sky-800">{p.price} ج.م</span>
                  </div>
                ))}

                {selectedTests.map(t => (
                  <div key={t.id} className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-700">{t.nameAr}</span>
                    <span className="font-semibold text-slate-800">{t.price} ج.م</span>
                  </div>
                ))}

                {customTestsList.map((ct, idx) => (
                  <div key={idx} className="flex justify-between items-center py-1 border-b border-slate-100 text-amber-800">
                    <span>{ct} (فحص مخصص)</span>
                    <span className="text-[10px] text-amber-600 font-bold">يحدد لاحقاً</span>
                  </div>
                ))}

                {selectedPackages.length === 0 && selectedTests.length === 0 && customTestsList.length === 0 && (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    لم تختر أي فحص بعد. اختر من القائمة لتحديث الإجمالي.
                  </div>
                )}
              </div>

              {/* Home Visit fee row */}
              <div className="pt-2 border-t border-slate-200 text-xs space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>المجموع الفرعي للفحوصات:</span>
                  <span className="font-bold text-slate-900">{subtotal} ج.م</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>رسوم الزيارة ({visitType === 'home' ? 'منزلية' : 'فرع'}):</span>
                  <span>
                    {visitType === 'home' ? (
                      isHomeVisitFree ? (
                        <span className="font-bold text-emerald-600">0 ج.م (مجاناً معفية)</span>
                      ) : (
                        <span className="font-bold text-slate-800">{settings.homeVisitFee} ج.م</span>
                      )
                    ) : (
                      <span className="text-slate-500">0 ج.م (بالفرع)</span>
                    )}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>الخصم المطبق:</span>
                    <span>- {discountAmount} ج.م</span>
                  </div>
                )}

                {/* Coupon Input */}
                <div className="pt-2">
                  {appliedCoupon ? (
                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-emerald-800">{appliedCoupon.couponCode}</span>
                        <div className="text-[10px] text-emerald-600">{appliedCoupon.prizeTitle}</div>
                      </div>
                      <button
                        onClick={() => setAppliedCoupon(null)}
                        className="text-red-500 hover:text-red-700 text-xs font-bold"
                      >
                        إلغاء
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={couponCodeInput}
                        onChange={e => setCouponCodeInput(e.target.value)}
                        placeholder="كود الخصم أو عجلة الحظ..."
                        className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono uppercase"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!couponCodeInput.trim()) return;
                          setAppliedCoupon({
                            id: `manual_${Date.now()}`,
                            prizeId: 'manual',
                            prizeTitle: 'كود خصم يدوي',
                            couponCode: couponCodeInput.trim().toUpperCase(),
                            discountValue: 15,
                            type: 'discount_percent',
                            isUsed: false,
                            wonAt: new Date().toISOString()
                          });
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                      >
                        تطبيق
                      </button>
                    </div>
                  )}
                </div>

                {/* Net Total */}
                <div className="pt-3 border-t-2 border-slate-200 flex justify-between items-center text-sm font-black text-sky-950">
                  <span>الإجمالي النهائي المستحق:</span>
                  <span className="text-xl text-sky-800">{finalTotal} ج.م</span>
                </div>
              </div>

              {/* Confirm Booking Button */}
              <button
                type="button"
                onClick={handleConfirmBooking}
                disabled={selectedTests.length === 0 && selectedPackages.length === 0 && customTestsList.length === 0}
                className="w-full py-3.5 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-lg shadow-sky-600/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              >
                <CheckCircle2 className="w-4 h-4" />
                تأكيد حجز الفحوصات والزيارة الآن ⚡
              </button>

              <div className="text-[10px] text-slate-400 text-center leading-normal">
                بمجرد الضغط يتم إرسال بيانات الحجز فورياً إلى نظام RT الموحد وتجهيز طاقم التمريض.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BOOKING SUCCESS DIALOG */}
      {showBookingSuccess && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 text-center border border-slate-200 animate-scale-in">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <h3 className="text-xl font-extrabold text-slate-900">
              تم تأكيد حجزك بنجاح في معامل RT!
            </h3>
            
            <p className="text-xs text-slate-600 mt-1">
              تم تسجيل الحجز وإرساله لحظياً إلى شاشة نظام الإدارة والمختبر.
            </p>

            <div className="my-4 p-3.5 bg-sky-50 border border-sky-200 rounded-2xl">
              <div className="text-xs text-slate-500 font-semibold">رقم الحجز المرجعي (Barcode):</div>
              <div className="text-2xl font-black font-mono tracking-widest text-sky-800 mt-0.5">
                {showBookingSuccess.bookingCode}
              </div>
              <div className="text-[11px] text-sky-700 font-medium mt-1">
                الموعد: {showBookingSuccess.appointmentDate} ({showBookingSuccess.appointmentTimeSlot})
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  setViewReceiptBooking(showBookingSuccess);
                  setShowBookingSuccess(null);
                }}
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                عرض وطباعة إيصال الحجز الرسمي
              </button>
              <button
                onClick={() => setShowBookingSuccess(null)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                إغلاق والعودة للبوابة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT RECEIPT MODAL */}
      {viewReceiptBooking && (
        <ReceiptPrintModal
          booking={viewReceiptBooking}
          settings={settings}
          onClose={() => setViewReceiptBooking(null)}
        />
      )}
    </div>
  );
};
