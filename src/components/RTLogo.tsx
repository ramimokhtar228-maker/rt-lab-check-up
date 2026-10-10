import React from 'react';

interface RTLogoProps {
  variant?: 'full' | 'compact' | 'icon-only' | 'print-header' | 'watermark';
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const RTLogo: React.FC<RTLogoProps> = ({ 
  variant = 'compact', 
  className = '', 
  size = 'md' 
}) => {
  // Dimension sizing
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const IconEmblem = (
    <div className={`relative flex items-center justify-center shrink-0 ${iconSizes[size]}`}>
      <img
        src="./rt_logo.png"
        alt="معامل RT للتحاليل الطبية"
        className="w-full h-full object-contain rounded-xl drop-shadow-sm"
        onError={(e) => {
          // Fallback if image path differs
          (e.currentTarget as HTMLImageElement).src = './rt_logo.svg';
        }}
      />
    </div>
  );

  if (variant === 'icon-only') {
    return <div className={`inline-flex items-center ${className}`}>{IconEmblem}</div>;
  }

  if (variant === 'watermark') {
    return (
      <div className={`pointer-events-none select-none opacity-5 flex flex-col items-center justify-center ${className}`}>
        <img src="./rt_logo.png" alt="" className="w-48 h-48 object-contain" />
        <div className="text-2xl font-bold text-slate-900 mt-2">معامل RT للتحاليل الطبية</div>
      </div>
    );
  }

  if (variant === 'print-header') {
    return (
      <div className={`w-full pb-4 border-b-2 border-sky-600 flex items-center justify-between ${className}`}>
        <div className="flex items-center gap-3">
          <img src="./rt_logo.png" alt="معامل RT" className="w-16 h-16 object-contain" />
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
              معامل RT للتحاليل الطبية والفحص الشامل
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              RT Medical Laboratories & Clinical Diagnostic Center
            </p>
            <p className="text-[10px] text-teal-700 font-semibold mt-0.5">
              اعتماد الجودة والمعايير العالمية ISO 15189 • دقة • سرعة • أمان
            </p>
          </div>
        </div>

        <div className="text-left text-xs text-slate-600 space-y-0.5 border-r pr-4 border-slate-200">
          <div className="font-bold text-sky-800">الخط الساخن: 19088</div>
          <div>واتساب والحجوزات: 01023456789</div>
          <div className="text-[10px] text-slate-500">خدمة سحب العينات المنزلية متاحة 24/7</div>
        </div>
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {IconEmblem}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              معامل <span className="text-red-600">RT</span> للتحاليل الطبية
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 font-bold border border-sky-200">
              Check-Up
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
            <span>RT Medical Laboratories</span>
            <span>·</span>
            <span className="text-emerald-700 font-semibold">دقة وسرعة</span>
          </div>
        </div>
      </div>
    );
  }

  // Default: compact
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {IconEmblem}
      <div className="flex flex-col">
        <div className="text-sm sm:text-base font-black text-slate-900 leading-none">
          معامل <span className="text-red-600">RT</span>
        </div>
        <span className="text-[10px] text-slate-500 font-medium leading-none mt-1">
          للتحاليل الطبية والفحص الشامل
        </span>
      </div>
    </div>
  );
};
