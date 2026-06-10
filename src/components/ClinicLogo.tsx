import React from 'react';
import { Stethoscope } from 'lucide-react';

interface ClinicLogoProps {
  variant?: 'compact' | 'badge' | 'full';
  className?: string;
}

export default function ClinicLogo({ variant = 'compact', className = '' }: ClinicLogoProps) {
  if (variant === 'compact') {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20 shadow-md">
          <Stethoscope className="w-5 h-5 text-emerald-400" strokeWidth={2.5} />
        </div>
        <div className="flex flex-col">
          <h1 className="font-extrabold text-white text-sm sm:text-base tracking-tight leading-none">
            Dr. Tipre Healthcare
          </h1>
          <p className="text-[9px] sm:text-[10px] text-emerald-400 font-bold uppercase tracking-wider mt-1">
            Since 2001
          </p>
        </div>
      </div>
    );
  }

  // Classic minimalist badge/full variant
  return (
    <div className={`p-4 bg-[#0c0d10] border border-slate-800 rounded-xl flex items-center space-x-3.5 shadow-md ${className}`}>
      <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
        <Stethoscope className="w-6 h-6 text-emerald-400" strokeWidth={2.5} />
      </div>
      <div>
        <h3 className="font-sans font-black text-sm text-white leading-none tracking-tight">
          Dr. Tipre Healthcare
        </h3>
        <p className="text-[10px] text-emerald-400 font-extrabold tracking-wider uppercase mt-1">
          Acupuncture Expert
        </p>
        <p className="text-[9px] text-slate-500 font-bold mt-0.5 uppercase tracking-widest">
          Since 2001
        </p>
      </div>
    </div>
  );
}
