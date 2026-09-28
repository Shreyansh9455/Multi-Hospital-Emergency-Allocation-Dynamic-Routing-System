import React from 'react';
import { HeartPulse, Shield, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-[#0e1526]/80 backdrop-blur-sm py-6 px-4 md:px-8 text-center text-xs text-slate-400">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <HeartPulse size={16} className="text-cyan-400" />
          <span className="font-semibold text-slate-200">
            Hospital Bed & Emergency Dispatch Manager
          </span>
          <span className="text-slate-500">•</span>
          <span>Varanasi Healthcare Grid</span>
        </div>

        <div className="flex items-center gap-4 text-slate-400">
          <span className="flex items-center gap-1">
            <MapPin size={13} className="text-amber-400" /> 10 District Hospitals
          </span>
          <span className="flex items-center gap-1">
            <Shield size={13} className="text-emerald-400" /> Ayushman Bharat Empanelled
          </span>
        </div>

        <div className="text-slate-500">
          © {new Date().getFullYear()} MED-DISPATCH v1.0.0
        </div>
      </div>
    </footer>
  );
}
