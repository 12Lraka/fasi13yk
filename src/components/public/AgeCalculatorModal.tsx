/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Kalkulator Batas Usia Santri (Patokan Baku: 1 Juli 2027)
 */

import React, { useState } from 'react';
import { Calculator, X, Calendar, CheckCircle2, AlertCircle, Sparkles, BookOpen, ShieldCheck, ArrowRight } from 'lucide-react';
import { maskDateInput, evaluateFasiAge } from '../../utils/ageCalculator';
import { generateSecurityChallenge, verifySecurityChallenge } from '../../utils/security';

interface AgeCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory?: (level: string) => void;
}

export const AgeCalculatorModal: React.FC<AgeCalculatorModalProps> = ({
  isOpen,
  onClose,
  onSelectCategory,
}) => {
  const [dateInput, setDateInput] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  
  // Anti-bot challenge
  const [challenge, setChallenge] = useState(() => generateSecurityChallenge());
  const [challengeAnswer, setChallengeAnswer] = useState<string>('');
  const [botChecked, setBotChecked] = useState<boolean>(false);
  const [botError, setBotError] = useState<string>('');

  if (!isOpen) return null;

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskDateInput(e.target.value);
    setDateInput(masked);
  };

  const handleApplyPreset = (presetDate: string, name: string) => {
    setDateInput(presetDate);
    setFullName(name);
  };

  const calculationResult = evaluateFasiAge(dateInput);

  const handleVerifyBot = () => {
    if (!verifySecurityChallenge(challenge, challengeAnswer)) {
      setBotError('Jawaban keamanan tidak tepat. Silakan coba lagi.');
      setChallenge(generateSecurityChallenge());
      setChallengeAnswer('');
      return;
    }
    setBotError('');
    setBotChecked(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-snug">Kalkulator Batas Usia Santri</h3>
              <p className="text-xs text-emerald-200 font-medium">
                Patokan Baku Juknis FASI XIII: <strong>1 Juli 2027</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Preset Buttons for Quick Testing */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Contoh Cepat Uji Kasus:
            </label>
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleApplyPreset('15/04/2022', 'Ahmad (TKA)')}
                className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md hover:bg-emerald-100 font-medium"
              >
                👶 TKA (5 Thn)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('10/08/2017', 'Faris (TPA)')}
                className="px-2.5 py-1 bg-sky-50 text-sky-800 border border-sky-200 rounded-md hover:bg-sky-100 font-medium"
              >
                👦 TPA (10 Thn)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('20/03/2014', 'Zahra (TQA)')}
                className="px-2.5 py-1 bg-purple-50 text-purple-800 border border-purple-200 rounded-md hover:bg-purple-100 font-medium"
              >
                🧕 TQA (13 Thn)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('05/01/2010', 'Melebihi Usia')}
                className="px-2.5 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-md hover:bg-rose-100 font-medium"
              >
                ❌ Over Age (17 Thn)
              </button>
            </div>
          </div>

          {/* Form Input */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nama Lengkap Santri (Opsional)
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Contoh: Muhammad Farhan"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Tanggal Lahir Santri <span className="text-rose-600">*</span>
                </label>
                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Format: DD/MM/YYYY
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  maxLength={10}
                  value={dateInput}
                  onChange={handleDateChange}
                  placeholder="HH/BB/TTTT (Contoh: 15/04/2018)"
                  className="w-full pl-10 pr-3.5 py-2.5 text-base font-mono tracking-wider font-semibold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Ketik 8 digit angka, tanda garis miring (/) akan otomatis terisi.
              </p>
            </div>
          </div>

          {/* Result Card */}
          {dateInput.length >= 10 && (
            <div
              className={`rounded-xl p-4 border transition-all ${
                calculationResult.isEligible
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                  : 'bg-rose-50/80 border-rose-200 text-rose-950'
              }`}
            >
              <div className="flex items-start gap-3">
                {calculationResult.isEligible ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-2 flex-1">
                  <div>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider mb-1 ${
                        calculationResult.isEligible
                          ? 'bg-emerald-200 text-emerald-900'
                          : 'bg-rose-200 text-rose-900'
                      }`}
                    >
                      {calculationResult.isEligible
                        ? `Kategori: ${calculationResult.eligibleLevel}`
                        : 'Tidak Memenuhi Syarat'}
                    </span>
                    <h4 className="font-bold text-sm leading-tight">
                      {calculationResult.statusMessage}
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-white/70 p-2.5 rounded-lg border border-slate-200/60">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Usia per 1 Juli 2027:</span>
                      <strong className="text-slate-900 font-mono text-sm">
                        {calculationResult.exactAgeText}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Level Kompetisi:</span>
                      <strong className="text-slate-900 font-semibold">
                        {calculationResult.eligibleLevel || 'Di Luar Kategori'}
                      </strong>
                    </div>
                  </div>

                  {/* Recommended Categories */}
                  {calculationResult.categoryRecommendations.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                        Rekomendasi Cabang Lomba:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {calculationResult.categoryRecommendations.map((cat, idx) => (
                          <span
                            key={idx}
                            className="bg-white text-emerald-900 text-xs px-2 py-0.5 rounded border border-emerald-300 font-medium"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Reference Info Accordion */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs text-slate-600 space-y-1.5">
            <h5 className="font-bold text-slate-800 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Rentang Baku Kelahiran Juknis FASI XIII:
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
              <div className="bg-white p-2 rounded border border-slate-200">
                <strong className="text-emerald-700 block">TKA (4-7 Thn)</strong>
                <span>01/07/2020 - 01/07/2023</span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <strong className="text-sky-700 block">TPA (&gt;7-12 Thn)</strong>
                <span>01/07/2015 - 30/06/2020</span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <strong className="text-purple-700 block">TQA (&gt;12-15 Thn)</strong>
                <span>01/07/2012 - 30/06/2015</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Validasi Terverifikasi BADKO</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
