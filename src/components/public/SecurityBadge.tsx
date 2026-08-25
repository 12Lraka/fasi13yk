/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Security Badge & Protection Indicator
 */

import React from 'react';
import { ShieldCheck, Lock, ShieldAlert, Cpu, CheckCircle } from 'lucide-react';

export const SecurityBadge: React.FC = () => {
  return (
    <div className="bg-slate-900 text-slate-300 rounded-xl p-4 border border-slate-800 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-white text-sm">Security & Anti-Bot Defense Layer</h4>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Sistem pendaftaran dan penjurian dilindungi dari otomatisasi bot, manipulasi usia, dan injeksi data.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-[11px] w-full sm:w-auto">
          <div className="bg-slate-800/80 px-2.5 py-1.5 rounded-md border border-slate-700/60 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Honeypot Trap</span>
          </div>
          <div className="bg-slate-800/80 px-2.5 py-1.5 rounded-md border border-slate-700/60 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Math Challenge</span>
          </div>
          <div className="bg-slate-800/80 px-2.5 py-1.5 rounded-md border border-slate-700/60 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>NIK 16-Digit</span>
          </div>
        </div>
      </div>
    </div>
  );
};
