/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Beranda Portal Publik & Countdown Timer
 */

import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Award, Users, Calculator, ShieldCheck, ChevronRight, Sparkles, BookOpen, CheckCircle } from 'lucide-react';
import { Participant } from '../../types/fasi';
import { KEMANTREN_LIST, CATEGORIES_LIST } from '../../data/fasiMasterData';
import { SecurityBadge } from './SecurityBadge';

interface PublicPortalProps {
  participants: Participant[];
  onOpenAgeCalc: () => void;
  onNavigateTab: (tab: 'peserta' | 'klasemen' | 'lokasi' | 'kalkulator') => void;
}

export const PublicPortal: React.FC<PublicPortalProps> = ({
  participants,
  onOpenAgeCalc,
  onNavigateTab,
}) => {
  // Target Tanggal Acara: Ahad, 11 Oktober 2026 07:00:00 WIB
  const targetDate = new Date('2026-10-11T07:00:00+07:00').getTime();

  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const verifiedCount = participants.filter((p) => p.status === 'verified').length;

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-950 rounded-3xl p-6 sm:p-10 text-white shadow-xl border border-emerald-700/50 relative overflow-hidden">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#fbbf24_1px,transparent_1px)] [background-size:16px_16px]"></div>

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>FESTIVAL ANAK SHOLEH INDONESIA (FASI) XIII TAHUN 2026</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white">
            Mewujudkan Generasi Santri Qur’ani yang Unggul, Cerdas & Berakhlakul Karimah
          </h1>

          <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed font-light">
            Portal resmi pendaftaran santri, validasi otomatis batas usia, pengacakan nomor undian tampil, dan publikasi live score klasemen 14 Kemantren se-Kota Yogyakarta.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button
              id="hero-btn-calc"
              onClick={onOpenAgeCalc}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
            >
              <Calculator className="w-4 h-4" />
              <span>Kalkulator Batas Usia Santri</span>
            </button>

            <button
              id="hero-btn-directory"
              onClick={() => onNavigateTab('peserta')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-white border border-emerald-600 font-semibold text-xs sm:text-sm transition-all"
            >
              <Users className="w-4 h-4 text-emerald-300" />
              <span>Lihat Data Peserta</span>
            </button>
          </div>
        </div>

        {/* Countdown Card */}
        <div className="mt-8 pt-6 border-t border-emerald-700/60 relative z-10">
          <div className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>Hitung Mundur Menuju Hari-H Pelaksanaan (Ahad, 11 Oktober 2026):</span>
          </div>

          <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-lg">
            <div className="bg-emerald-950/80 p-3 rounded-xl border border-emerald-700/60 text-center">
              <span className="block text-xl sm:text-3xl font-black font-mono text-white">
                {String(timeLeft.days).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs text-emerald-300 uppercase tracking-wider font-semibold">
                Hari
              </span>
            </div>
            <div className="bg-emerald-950/80 p-3 rounded-xl border border-emerald-700/60 text-center">
              <span className="block text-xl sm:text-3xl font-black font-mono text-white">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs text-emerald-300 uppercase tracking-wider font-semibold">
                Jam
              </span>
            </div>
            <div className="bg-emerald-950/80 p-3 rounded-xl border border-emerald-700/60 text-center">
              <span className="block text-xl sm:text-3xl font-black font-mono text-white">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs text-emerald-300 uppercase tracking-wider font-semibold">
                Menit
              </span>
            </div>
            <div className="bg-emerald-950/80 p-3 rounded-xl border border-emerald-700/60 text-center">
              <span className="block text-xl sm:text-3xl font-black font-mono text-amber-400">
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs text-amber-300 uppercase tracking-wider font-semibold">
                Detik
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Stat Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xl shrink-0">
            14
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Kontingen</span>
            <h4 className="font-bold text-slate-900 text-sm sm:text-base">14 Kemantren</h4>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xl shrink-0">
            34
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Cabang Lomba</span>
            <h4 className="font-bold text-slate-900 text-sm sm:text-base">TKA, TPA & TQA</h4>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold text-xl shrink-0">
            {verifiedCount}
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Santri Terdaftar</span>
            <h4 className="font-bold text-slate-900 text-sm sm:text-base">Lolos Verifikasi</h4>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xl shrink-0">
            100%
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Validasi Juknis</span>
            <h4 className="font-bold text-slate-900 text-sm sm:text-base">1 Juli 2027</h4>
          </div>
        </div>
      </div>

      {/* Sambutan & Juknis Batas Usia Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Sambutan & Profil Singkat */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <BookOpen className="w-5 h-5 text-emerald-700" />
            <h3 className="font-bold text-slate-900 text-base">Sambutan BADKO TKA-TPA Kota Yogyakarta</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Festival Anak Sholeh Indonesia (FASI) XIII merupakan momentum akbar pembinaan dan evaluasi kualitas santri Al-Qur’an di Kota Yogyakarta. Melalui sistem pendaftaran digital terpadu ini, kami berkomitmen menyelenggarakan kompetisi yang jujur, transparan, dan akuntabel, mulai dari validasi batas usia berstandar baku hingga penjurian real-time.
          </p>

          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-800 block">Akun Pendaftaran Mandiri</span>
              <p className="text-slate-500 text-[11px]">
                14 Admin Kemantren mengelola pendaftaran peserta kontingen wilayahnya secara aman.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-800 block">Cetak ID Card 9/A4</span>
              <p className="text-slate-500 text-[11px]">
                Layout kartu peserta otomatis siap cetak 9 kartu/lembar A4 ber-QR Code resmi.
              </p>
            </div>
          </div>
        </div>

        {/* Kolom Quick Age Check & Rule Reminder */}
        <div className="bg-gradient-to-b from-emerald-50 to-white rounded-2xl p-6 border border-emerald-200 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
              <Calculator className="w-4 h-4 text-emerald-700" />
              <span>Ketentuan Usia Santri FASI XIII</span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Patokan baku usia dihitung per <strong>1 Juli 2027</strong>:
            </p>

            <ul className="mt-3 space-y-2 text-xs">
              <li className="p-2 rounded-lg bg-white border border-emerald-100 shadow-2xs">
                <strong className="text-emerald-800 block">1. Jenjang TKA (4 - 7 Thn)</strong>
                <span className="text-slate-500 text-[11px]">Kelahiran: 01/07/2020 s.d. 01/07/2023</span>
              </li>
              <li className="p-2 rounded-lg bg-white border border-emerald-100 shadow-2xs">
                <strong className="text-sky-800 block">2. Jenjang TPA (&gt;7 - 12 Thn)</strong>
                <span className="text-slate-500 text-[11px]">Kelahiran: 01/07/2015 s.d. 30/06/2020</span>
              </li>
              <li className="p-2 rounded-lg bg-white border border-emerald-100 shadow-2xs">
                <strong className="text-purple-800 block">3. Jenjang TQA (&gt;12 - 15 Thn)</strong>
                <span className="text-slate-500 text-[11px]">Kelahiran: 01/07/2012 s.d. 30/06/2015</span>
              </li>
            </ul>
          </div>

          <button
            onClick={onOpenAgeCalc}
            className="w-full py-2.5 px-4 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <span>Uji Tanggal Lahir Santri</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Security Protection Shield Indicator */}
      <SecurityBadge />
    </div>
  );
};
