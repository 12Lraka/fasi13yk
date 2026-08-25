/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Info Lokasi & Jadwal Pelaksanaan (SMP Negeri 1 Yogyakarta)
 */

import React from 'react';
import { MapPin, Calendar, Clock, Navigation, Phone, ExternalLink, Building2, CheckCircle2 } from 'lucide-react';

export const LocationMap: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 uppercase tracking-wider">
              VENUE RESMI FASI XIII
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
              SMP Negeri 1 Yogyakarta
            </h2>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              Jl. Cik Di Tiro No.29, Terban, Kec. Gondokusuman, Kota Yogyakarta, D.I. Yogyakarta 55223
            </p>
          </div>

          <a
            href="https://maps.google.com/?q=SMP+Negeri+1+Yogyakarta"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
          >
            <Navigation className="w-4 h-4 text-amber-400" />
            <span>Buka Google Maps</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </a>
        </div>

        {/* 3 Detail Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 text-xs">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-center gap-2 text-emerald-800 font-bold">
              <Calendar className="w-4 h-4" />
              <span>Hari & Tanggal</span>
            </div>
            <p className="font-semibold text-slate-900 text-sm">Ahad (Minggu), 11 Oktober 2026</p>
            <p className="text-slate-500 text-[11px]">Waktu: 07.00 WIB s.d. Selesai</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-center gap-2 text-emerald-800 font-bold">
              <Building2 className="w-4 h-4" />
              <span>Panggung & Ruang Lomba</span>
            </div>
            <p className="font-semibold text-slate-900 text-sm">18 Ruang Kelas & Aula Utama</p>
            <p className="text-slate-500 text-[11px]">Disertai QR Check-in di setiap panggung</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-center gap-2 text-emerald-800 font-bold">
              <Phone className="w-4 h-4" />
              <span>Sekretariat BADKO Kota</span>
            </div>
            <p className="font-semibold text-slate-900 text-sm">Panitia Pelaksana FASI XIII</p>
            <p className="text-slate-500 text-[11px]">Helpdesk: 0812-2334-4000 (WhatsApp)</p>
          </div>
        </div>
      </div>

      {/* Rundown Jadwal Acara */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-700" />
          <h3 className="font-bold text-slate-900 text-base">Rundown Resmi Pelaksanaan Hari-H</h3>
        </div>

        <div className="relative pl-6 border-l-2 border-emerald-500/30 space-y-5 text-xs">
          <div className="relative">
            <div className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-emerald-600 border-2 border-white"></div>
            <div className="font-bold text-slate-900">06.30 - 07.30 WIB</div>
            <div className="text-slate-700 font-semibold">Registrasi Ulang & Check-in QR Kontingen 14 Kemantren</div>
            <p className="text-slate-500 text-[11px]">Verifikasi ID Card santri di meja panitia per wilayah kemantren.</p>
          </div>

          <div className="relative">
            <div className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-emerald-600 border-2 border-white"></div>
            <div className="font-bold text-slate-900">07.30 - 08.30 WIB</div>
            <div className="text-slate-700 font-semibold">Upacara Pembukaan & Defile Kontingen</div>
            <p className="text-slate-500 text-[11px]">Sambutan Ketua Umum BADKO TKA-TPA Kota Yogyakarta & Walikota Yogyakarta.</p>
          </div>

          <div className="relative">
            <div className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-amber-500 border-2 border-white"></div>
            <div className="font-bold text-amber-900 font-mono">08.30 - 11.45 WIB</div>
            <div className="text-slate-900 font-semibold">Pelaksanaan 18 Cabang Lomba (TKA, TPA, TQA)</div>
            <p className="text-slate-500 text-[11px]">Sesuai nomor urut undian tampil di masing-masing panggung dan ruang penjurian.</p>
          </div>

          <div className="relative">
            <div className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-emerald-600 border-2 border-white"></div>
            <div className="font-bold text-slate-900">11.45 - 13.00 WIB</div>
            <div className="text-slate-700 font-semibold">Ishoma (Istirahat, Sholat Dzuhur Berjamaah, & Makan Siang)</div>
            <p className="text-slate-500 text-[11px]">Masjid SMP Negeri 1 Yogyakarta.</p>
          </div>

          <div className="relative">
            <div className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-emerald-600 border-2 border-white"></div>
            <div className="font-bold text-slate-900">13.00 - 15.00 WIB</div>
            <div className="text-slate-700 font-semibold">Lanjutan Lomba & Rekapitulasi Nilai Dewan Hakim</div>
            <p className="text-slate-500 text-[11px]">Input digital nilai 3 juri & penentuan Juara 1, 2, 3 per cabang.</p>
          </div>

          <div className="relative">
            <div className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-amber-500 border-2 border-white"></div>
            <div className="font-bold text-amber-900 font-mono">15.30 - 17.00 WIB</div>
            <div className="text-slate-900 font-semibold">Pengumuman Pemenang, Penyerahan Piala & Juara Umum FASI XIII</div>
            <p className="text-slate-500 text-[11px]">Penetapan Kontingen Kemantren Juara Umum Kota Yogyakarta.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
