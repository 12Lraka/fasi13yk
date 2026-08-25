/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Footer Komponen
 */

import React from 'react';
import { ShieldCheck, MapPin, Calendar, CheckCircle2 } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-6 border-b border-slate-800">
          {/* Kolom 1: Profil */}
          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-emerald-600 flex items-center justify-center text-amber-300 font-bold text-xs">
                F13
              </div>
              <h3 className="font-bold text-white text-sm">BADKO TKA-TPA KOTA YOGYAKARTA</h3>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-lg">
              Sistem Informasi Manajemen & Pendaftaran Festival Anak Sholeh Indonesia (FASI) XIII Tingkat Kota Yogyakarta Tahun 2026. Mewujudkan generasi Qur’ani yang cerdas, sholeh, mandiri, dan berakhlakul karimah.
            </p>
            <div className="flex items-center gap-3 pt-1 text-slate-300">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                Ahad, 11 Oktober 2026
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                SMP Negeri 1 Yogyakarta
              </span>
            </div>
          </div>

          {/* Kolom 2: Juknis Batas Usia */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">Batas Usia (Per 1 Juli 2027)</h4>
            <ul className="space-y-1 text-slate-400">
              <li><strong className="text-emerald-400">TKA:</strong> 4 - 7 Thn (01/07/20 - 01/07/23)</li>
              <li><strong className="text-emerald-400">TPA:</strong> &gt;7 - 12 Thn (01/07/15 - 30/06/20)</li>
              <li><strong className="text-emerald-400">TQA:</strong> &gt;12 - 15 Thn (01/07/12 - 30/06/15)</li>
            </ul>
          </div>

          {/* Kolom 3: Security & Anti-Bot Protection */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">Proteksi & Integritas</h4>
            <div className="space-y-1.5 text-slate-400">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span className="font-semibold text-[11px]">Anti-Bot Shield Aktif</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Dilengkapi enkripsi data lokal, honeypot bot trap, filter XSS, dan validasi NIK 16 digit.
              </p>
              <div className="flex items-center gap-1 text-[10px] text-slate-300">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span>Format Baku DD/MM/YYYY</span>
              </div>
            </div>
          </div>
        </div>

        {/* Baris Bawah */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-400 text-[11px]">
          <p>© 2026 BADKO TKA-TPA Kota Yogyakarta</p>
        </div>
      </div>
    </footer>
  );
};
