import React, { useState } from 'react';
import { Lock, KeyRound, Eye, EyeOff, ShieldCheck, X, AlertCircle } from 'lucide-react';
import { RTLogo } from './RTLogo';
import { playClick } from '../utils/audio';

interface AdminLoginModalProps {
  onSuccess: () => void;
  onClose: () => void;
  correctPassword?: string;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  onSuccess,
  onClose,
  correctPassword = '1234',
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const effectivePassword = (correctPassword && correctPassword.trim()) ? correctPassword.trim() : '1234';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playClick();

    if (password.trim() === effectivePassword) {
      setErrorMsg('');
      onSuccess();
    } else {
      setErrorMsg('كلمة المرور غير صحيحة، يرجى المحاولة مرة أخرى.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-7 border border-red-900/30 animate-scale-in text-slate-800 relative overflow-hidden">
        {/* Subtle decorative brand glow */}
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center pb-4 border-b border-slate-100">
          <div className="w-14 h-14 bg-gradient-to-tr from-red-950 to-red-700 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md shadow-red-900/20">
            <Lock className="w-7 h-7 text-red-100" />
          </div>
          <h3 className="text-lg font-black text-slate-950 tracking-tight">
            دخول مصرح لإدارة معامل RT 🔒
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            قسم خاص بالإدارة وطاقم المختبر لمتابعة الحجوزات وسجلات المرضى.
          </p>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              كلمة مرور أو رمز دخول الإدارة (Admin PIN / Password)
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoFocus
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="أدخل كلمة المرور..."
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl font-mono text-base tracking-widest focus:ring-2 focus:ring-red-600 focus:outline-none bg-slate-50/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-blue-700" />
              كلمة المرور الافتراضية للمعامل:
            </span>
            <span className="font-mono font-bold text-red-700 bg-red-100/70 px-2 py-0.5 rounded">
              1234
            </span>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl font-bold transition-colors"
            >
              إلغاء والعودة للمريض
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white rounded-xl font-black shadow-lg shadow-red-900/25 transition-all flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              دخول لوحة الإدارة
            </button>
          </div>
        </form>

        <div className="mt-4 pt-3 border-t border-slate-100 text-center text-[10px] text-slate-400">
          معامل RT للتحاليل الطبية • خصوصية كاملة لبيانات المرضى والمختبر
        </div>
      </div>
    </div>
  );
};
