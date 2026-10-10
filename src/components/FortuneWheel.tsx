import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Gift, Sparkles, Plus, Edit2, Trash2, CheckCircle2, RotateCw, Copy, Ticket, Flame } from 'lucide-react';
import { RewardPrize, WonReward } from '../types';
import { getRewards, saveRewards, getWonRewards, addWonReward, saveWonRewards } from '../utils/storage';
import { playWheelTick, playWinFanfare, playClick } from '../utils/audio';
import { RTLogo } from './RTLogo';

interface FortuneWheelProps {
  onCouponApplied?: (coupon: WonReward) => void;
  patientPhone?: string;
  patientName?: string;
  isAdmin?: boolean;
}

export const FortuneWheel: React.FC<FortuneWheelProps> = ({ 
  onCouponApplied, 
  patientPhone = '', 
  patientName = '',
  isAdmin = false,
}) => {
  const [activeTab, setActiveTab] = useState<'wheel' | 'scratch' | 'manage'>('wheel');
  const [prizes, setPrizes] = useState<RewardPrize[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState<RewardPrize | null>(null);
  const [currentCoupon, setCurrentCoupon] = useState<WonReward | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  
  // Prize management modal state
  const [editingPrize, setEditingPrize] = useState<RewardPrize | null>(null);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [wonHistory, setWonHistory] = useState<WonReward[]>([]);

  // Wheel canvas / rotation
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rotationRef = useRef<number>(0);
  const spinAngleStartRef = useRef<number>(0);
  const spinTimeRef = useRef<number>(0);
  const spinTimeTotalRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const lastSoundSectorRef = useRef<number>(-1);

  // Scratch card state
  const scratchCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [scratchRevealed, setScratchRevealed] = useState(false);
  const [scratchPrize, setScratchPrize] = useState<RewardPrize | null>(null);
  const isScratchingRef = useRef(false);

  // Load prizes & won coupons on mount
  useEffect(() => {
    const loaded = getRewards();
    setPrizes(loaded);
    setWonHistory(getWonRewards());
  }, []);

  // Ensure non-admin cannot view prize management
  useEffect(() => {
    if (!isAdmin && activeTab === 'manage') {
      setActiveTab('wheel');
    }
  }, [isAdmin, activeTab]);

  const activePrizes = prizes.filter(p => p.isActive);

  // Draw the fortune wheel
  useEffect(() => {
    if (activeTab !== 'wheel') return;
    drawWheel(rotationRef.current);
  }, [activePrizes, activeTab]);

  const drawWheel = (currentAngle: number) => {
    const canvas = canvasRef.current;
    if (!canvas || activePrizes.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 14;

    ctx.clearRect(0, 0, width, height);

    const numSegments = activePrizes.length;
    const arcSize = (2 * Math.PI) / numSegments;

    // Draw outer shadow ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#0f172a';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.restore();

    // Draw slices
    for (let i = 0; i < numSegments; i++) {
      const startAngle = currentAngle + i * arcSize;
      const endAngle = startAngle + arcSize;
      const prize = activePrizes[i];

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();

      // Alternating slice colors
      ctx.fillStyle = prize.color || (i % 2 === 0 ? '#0284c7' : '#0d9488');
      ctx.fill();

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Draw text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + arcSize / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Cairo, sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 4;

      // Truncate text if needed
      const displayTitle = prize.title.length > 24 ? prize.title.slice(0, 22) + '...' : prize.title;
      ctx.fillText(displayTitle, radius - 20, 4);

      // Draw decorative icon dot
      ctx.beginPath();
      ctx.arc(radius - 8, 0, 4, 0, 2 * Math.PI);
      ctx.fillStyle = '#fef08a';
      ctx.fill();

      ctx.restore();
    }

    // Outer rim lights
    const totalBulbs = 24;
    for (let b = 0; b < totalBulbs; b++) {
      const bulbAngle = (b * (2 * Math.PI)) / totalBulbs;
      const bx = centerX + (radius + 4) * Math.cos(bulbAngle);
      const by = centerY + (radius + 4) * Math.sin(bulbAngle);
      ctx.beginPath();
      ctx.arc(bx, by, 3, 0, 2 * Math.PI);
      ctx.fillStyle = b % 2 === 0 ? '#fde047' : '#ffffff';
      ctx.fill();
    }

    // Draw Center hub with RT Lab Logo
    ctx.beginPath();
    ctx.arc(centerX, centerY, 38, 0, 2 * Math.PI);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#38bdf8';
    ctx.stroke();

    ctx.font = 'bold 16px Cairo, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('RT LAB', centerX, centerY - 4);
    ctx.font = 'bold 9px Cairo, sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('معامل RT', centerX, centerY + 12);
  };

  // Spin the wheel
  const startSpin = () => {
    if (isSpinning || activePrizes.length === 0) return;
    playClick();
    setIsSpinning(true);
    setSelectedPrize(null);
    setCurrentCoupon(null);
    setCopiedCode(false);

    spinAngleStartRef.current = Math.random() * 10 + 20; // high initial speed
    spinTimeRef.current = 0;
    spinTimeTotalRef.current = Math.random() * 2000 + 4000; // 4 to 6 seconds

    rotateAnimation();
  };

  const rotateAnimation = () => {
    spinTimeRef.current += 20;
    if (spinTimeRef.current >= spinTimeTotalRef.current) {
      stopSpin();
      return;
    }

    // Ease-out cubic
    const progress = spinTimeRef.current / spinTimeTotalRef.current;
    const spinAngle = spinAngleStartRef.current - easeOut(progress, 0, spinAngleStartRef.current, 1);
    rotationRef.current += (spinAngle * Math.PI) / 180;

    // Trigger audio tick when passing boundary
    const arcSize = (2 * Math.PI) / activePrizes.length;
    const currentSector = Math.floor((rotationRef.current % (2 * Math.PI)) / arcSize);
    if (currentSector !== lastSoundSectorRef.current) {
      playWheelTick();
      lastSoundSectorRef.current = currentSector;
    }

    drawWheel(rotationRef.current);
    animFrameRef.current = requestAnimationFrame(rotateAnimation);
  };

  const easeOut = (t: number, b: number, c: number, d: number) => {
    const ts = (t /= d) * t;
    const tc = ts * t;
    return b + c * (tc + -3 * ts + 3 * t);
  };

  const stopSpin = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setIsSpinning(false);

    // Calculate winning slice (at top 270 degrees / 1.5 PI or right 0 PI)
    // Pointer is located at 0 radians (right) or 1.5 * PI (top). Let's use Top Pointer (3 * Math.PI / 2)
    const pointerAngle = (3 * Math.PI) / 2;
    const arcSize = (2 * Math.PI) / activePrizes.length;
    
    // Normalize wheel angle
    let relativeAngle = (pointerAngle - rotationRef.current) % (2 * Math.PI);
    if (relativeAngle < 0) relativeAngle += 2 * Math.PI;

    const winningIndex = Math.floor(relativeAngle / arcSize) % activePrizes.length;
    const winner = activePrizes[winningIndex];

    setSelectedPrize(winner);

    // Generate coupon if won
    if (winner && winner.type !== 'try_again') {
      const code = `RT-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
      const newCoupon: WonReward = {
        id: `won_${Date.now()}`,
        prizeId: winner.id,
        prizeTitle: winner.title,
        couponCode: code,
        discountValue: winner.value,
        type: winner.type,
        patientPhone: patientPhone || '',
        isUsed: false,
        wonAt: new Date().toISOString(),
      };
      
      const updatedWon = addWonReward(newCoupon);
      setWonHistory(updatedWon);
      setCurrentCoupon(newCoupon);

      playWinFanfare();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  // Scratch card setup
  const initScratchCard = () => {
    const canvas = scratchCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Pick random prize from active prizes
    const randomPrize = activePrizes[Math.floor(Math.random() * activePrizes.length)] || activePrizes[0];
    setScratchPrize(randomPrize);
    setScratchRevealed(false);

    // Fill silver foil
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#94a3b8');
    grad.addColorStop(0.5, '#cbd5e1');
    grad.addColorStop(1, '#64748b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Write prompt
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 16px Cairo, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✨ اكشط هنا للكشف عن جائزتك ✨', canvas.width / 2, canvas.height / 2 - 8);
    ctx.font = '12px Cairo, sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText('معامل RT للتحاليل الطبية', canvas.width / 2, canvas.height / 2 + 18);
  };

  useEffect(() => {
    if (activeTab === 'scratch') {
      initScratchCard();
    }
  }, [activeTab]);

  const scratch = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = scratchCanvasRef.current;
    if (!canvas || scratchRevealed) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, 2 * Math.PI);
    ctx.fill();

    // Check how much is scratched
    if (Math.random() < 0.05) {
      playWheelTick();
    }

    // Auto reveal after some scratching
    setTimeout(() => {
      if (!scratchRevealed && scratchPrize) {
        setScratchRevealed(true);
        if (scratchPrize.type !== 'try_again') {
          playWinFanfare();
          confetti({ particleCount: 60, spread: 60 });
        }
      }
    }, 2500);
  };

  // Prize management handlers
  const handleSavePrize = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPrize) return;

    let updated: RewardPrize[];
    if (editingPrize.id) {
      updated = prizes.map(p => (p.id === editingPrize.id ? editingPrize : p));
    } else {
      const newPrize: RewardPrize = {
        ...editingPrize,
        id: `rew_${Date.now()}`,
      };
      updated = [newPrize, ...prizes];
    }

    saveRewards(updated);
    setPrizes(updated);
    setShowPrizeModal(false);
    setEditingPrize(null);
  };

  const handleDeletePrize = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه المكافأة من المسابقة؟')) {
      const updated = prizes.filter(p => p.id !== id);
      saveRewards(updated);
      setPrizes(updated);
    }
  };

  const copyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <RTLogo variant="icon-only" size="sm" />
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              عجلة الحظ ومسابقات معامل RT 🎯
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            اربح خصومات فورية، فحوصات مجانية، وزيارات منزلية مع كل حجز فحص!
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('wheel')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'wheel' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            عجلة الحظ 🎡
          </button>
          <button
            onClick={() => setActiveTab('scratch')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'scratch' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            بطاقة الكشط 🎫
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('manage')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'manage' ? 'bg-white text-red-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              إدارة المكافآت (خاص بالإدارة) ⚙️
            </button>
          )}
        </div>
      </div>

      {/* WHEEL TAB */}
      {activeTab === 'wheel' && (
        <div className="py-6 flex flex-col items-center">
          <div className="relative mb-6">
            {/* Pointer arrow pointing down into the wheel */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[28px] border-t-amber-500 drop-shadow-md" />

            <canvas
              ref={canvasRef}
              width={340}
              height={340}
              className="max-w-[90vw] max-h-[340px] drop-shadow-xl"
            />
          </div>

          {/* Action button */}
          <button
            onClick={startSpin}
            disabled={isSpinning || activePrizes.length === 0}
            className={`px-8 py-3 rounded-xl font-bold text-base shadow-lg transition-all flex items-center gap-2 ${
              isSpinning
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white shadow-sky-600/30 hover:scale-105 active:scale-95'
            }`}
          >
            <RotateCw className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
            {isSpinning ? 'جاري دوران العجلة...' : 'دوّر العجلة واربح الآن! 🎁'}
          </button>

          {/* Winner announcement */}
          {selectedPrize && (
            <div className="mt-6 w-full max-w-md bg-gradient-to-br from-sky-50 via-teal-50 to-emerald-50 border-2 border-sky-300 rounded-2xl p-5 text-center shadow-md animate-fade-in">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-sky-600 text-white rounded-full mb-2 shadow-sm">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">
                {selectedPrize.type === 'try_again' ? 'حظ أوفر المرة القادمة!' : 'ألف مبروك! لقد فزت بـ:'}
              </h3>
              <p className="text-lg font-bold text-sky-800 mt-1">
                {selectedPrize.title}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                {selectedPrize.description}
              </p>

              {currentCoupon && (
                <div className="mt-4 p-3 bg-white border border-dashed border-sky-400 rounded-xl">
                  <div className="text-[11px] text-slate-500 font-semibold mb-1">
                    كوبون الخصم المباشر الخاص بك:
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-mono font-bold text-base tracking-widest text-sky-700 bg-sky-50 px-3 py-1 rounded-lg border border-sky-200">
                      {currentCoupon.couponCode}
                    </span>
                    <button
                      onClick={() => copyCouponCode(currentCoupon.couponCode)}
                      className="p-1.5 text-slate-600 hover:text-sky-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                      title="نسخ الكود"
                    >
                      {copiedCode ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  {onCouponApplied && (
                    <button
                      onClick={() => onCouponApplied(currentCoupon)}
                      className="mt-3 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      تطبيق الكوبون على الحجز الحالي مباشرة ⚡
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SCRATCH CARD TAB */}
      {activeTab === 'scratch' && (
        <div className="py-6 flex flex-col items-center">
          <div className="relative w-80 h-48 rounded-2xl overflow-hidden shadow-lg border border-slate-300 mb-4 bg-gradient-to-tr from-sky-100 via-teal-50 to-amber-50">
            {/* Background Prize revealed */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center select-none">
              <Gift className="w-10 h-10 text-sky-600 mb-1" />
              <div className="text-xs text-slate-500 font-bold">جائزة معامل RT</div>
              <div className="text-base font-extrabold text-slate-900 mt-0.5">
                {scratchPrize?.title || 'جاري التحميل...'}
              </div>
              <div className="text-[11px] text-slate-600 mt-1">
                {scratchPrize?.description}
              </div>
            </div>

            {/* Canvas Scratch Foil Layer */}
            <canvas
              ref={scratchCanvasRef}
              width={320}
              height={192}
              onMouseMove={scratch}
              onTouchMove={scratch}
              className="absolute inset-0 cursor-pointer touch-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={initScratchCard}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <RotateCw className="w-4 h-4" />
              تجديد بطاقة الكشط
            </button>
          </div>
        </div>
      )}

      {/* MANAGE REWARDS TAB */}
      {activeTab === 'manage' && (
        <div className="py-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                إدارة وتعديل جوائز المسابقات وعجلة الحظ
              </h3>
              <p className="text-xs text-slate-500">
                يمكنك إضافة جوائز جديدة، تغيير نسب الخصم، أو تعديل الجوائز الحالية بكل حرية
              </p>
            </div>
            <button
              onClick={() => {
                setEditingPrize({
                  id: '',
                  title: '',
                  type: 'discount_percent',
                  value: 10,
                  description: '',
                  color: '#0284c7',
                  probabilityWeight: 5,
                  isActive: true,
                });
                setShowPrizeModal(true);
              }}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              إضافة جائزة جديدة
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {prizes.map(p => (
              <div
                key={p.id}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className="w-4 h-4 rounded-full mt-0.5 shrink-0"
                    style={{ backgroundColor: p.color }}
                  />
                  <div>
                    <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                      <span>{p.title}</span>
                      {!p.isActive && (
                        <span className="text-[10px] bg-red-100 text-red-700 px-1 rounded">معطلة</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{p.description}</div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      النوع: {p.type} · القيمة: {p.value} · وزن الظهور: {p.probabilityWeight}/10
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => {
                      setEditingPrize(p);
                      setShowPrizeModal(true);
                    }}
                    className="p-1 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded transition-colors"
                    title="تعديل الجائزة"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeletePrize(p.id)}
                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="حذف الجائزة"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Won history */}
          {wonHistory.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <Ticket className="w-4 h-4 text-sky-600" />
                سجل الكوبونات الفائزة حديثاً ({wonHistory.length})
              </h4>
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 text-xs">
                {wonHistory.slice(0, 10).map(w => (
                  <div key={w.id} className="p-2 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="font-bold text-sky-700 font-mono ml-2">{w.couponCode}</span>
                      <span className="text-slate-800">{w.prizeTitle}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(w.wonAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Prize Modal */}
      {showPrizeModal && editingPrize && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 border border-slate-200 animate-scale-in">
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-sky-600" />
              {editingPrize.id ? 'تعديل جائزة المسابقة' : 'إضافة جائزة جديدة للمسابقة'}
            </h3>

            <form onSubmit={handleSavePrize} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم الجائزة (يظهر بالعجلة)</label>
                <input
                  type="text"
                  required
                  value={editingPrize.title}
                  onChange={e => setEditingPrize({ ...editingPrize, title: e.target.value })}
                  placeholder="مثال: خصم 20% على التحاليل"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">نوع المكافأة</label>
                  <select
                    value={editingPrize.type}
                    onChange={e => setEditingPrize({ ...editingPrize, type: e.target.value as RewardPrize['type'] })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="discount_percent">نسبة مئوية (%)</option>
                    <option value="discount_fixed">خصم نقدي (ج.م)</option>
                    <option value="free_test">تحليل مجاني</option>
                    <option value="free_visit">زيارة منزلية مجانية</option>
                    <option value="points">نقاط ولاء إضافية</option>
                    <option value="try_again">حظ أوفر (جرب ثانية)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">القيمة الرقمية</label>
                  <input
                    type="number"
                    min="0"
                    value={editingPrize.value}
                    onChange={e => setEditingPrize({ ...editingPrize, value: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">وصف الجائزة وشروطها</label>
                <input
                  type="text"
                  value={editingPrize.description}
                  onChange={e => setEditingPrize({ ...editingPrize, description: e.target.value })}
                  placeholder="مثال: خصم فوري على أي باقة فحص"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">لون القطاع</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingPrize.color}
                      onChange={e => setEditingPrize({ ...editingPrize, color: e.target.value })}
                      className="w-9 h-9 p-0.5 border border-slate-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={editingPrize.color}
                      onChange={e => setEditingPrize({ ...editingPrize, color: e.target.value })}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-lg font-mono text-[11px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">وزن فرصة الظهور (1 - 10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={editingPrize.probabilityWeight}
                    onChange={e => setEditingPrize({ ...editingPrize, probabilityWeight: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="activePrize"
                  checked={editingPrize.isActive}
                  onChange={e => setEditingPrize({ ...editingPrize, isActive: e.target.checked })}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
                <label htmlFor="activePrize" className="font-bold text-slate-700">تفعيل هذه الجائزة في العجلة والمسابقة</label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowPrizeModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 font-bold"
                >
                  حفظ الجائزة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
