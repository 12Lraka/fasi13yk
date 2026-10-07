/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Modal Akses Cepat Petugas Presensi Hari-H
 * Otentikasi Berbasis PIN Petugas (fasi132026)
 */

import React, { useState, useEffect, useRef } from 'react';
import { QrCode, Lock, X, CheckCircle2, AlertCircle, Eye, EyeOff, ShieldCheck, Sparkles } from 'lucide-react';
import { showToast } from '../../utils/sweetalert';
import { setPresensiAuthorized } from '../../utils/storage';

interface PresensiPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  expectedPin?: string;
}

export const PresensiPinModal: React.FC<PresensiPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  expectedPin = 'fasi132026',
}) => {
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setErrorMessage('');
      setIsSuccess(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedInput = pin.trim();
    const correctPin = expectedPin.trim() || 'fasi132026';

    if (!trimmedInput) {
      setErrorMessage('Mohon masukkan PIN Petugas Presensi.');
      return;
    }

    if (trimmedInput === correctPin) {
      setIsSuccess(true);
      setPresensiAuthorized();
      showToast('success', 'PIN Terverifikasi! Kamera Presensi Aktif.');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 500);
    } else {
      setErrorMessage('PIN Petugas salah. Silakan periksa kembali atau Sekretariat FASI XIII.');
      setPin('');
      inputRef.current?.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Visual */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 p-6 text-white text-center relative overflow-hidden">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-emerald-300 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center mx-auto mb-3 shadow-lg font-black">
            <QrCode className="w-8 h-8" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-800/80 border border-emerald-700 text-amber-300 text-[11px] font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Petugas Hari-H</span>
          </div>

          <h3 className="text-xl font-black tracking-tight text-white">
            Akses Presensi QR Santri
          </h3>
          <p className="text-xs text-emerald-200/80 mt-1 max-w-xs mx-auto">
            Masukkan PIN Petugas untuk membuka pemindai barcode check-in di panggung & meja registrasi.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold">PIN valid! Membuka kamera scanner...</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              PIN Petugas Presensi
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukkan PIN Petugas"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                disabled={isSuccess}
                autoComplete="off"
                className="w-full pl-3.5 pr-11 py-3 text-sm font-mono tracking-wider rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 font-semibold"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
              <Lock className="w-3 h-3 text-amber-600 shrink-0" />
              <span>Akses ini hanya untuk petugas check-in & panitera panggung lomba.</span>
            </p>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSuccess}
              className="flex-1 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <QrCode className="w-4 h-4 text-amber-400" />
              <span>Buka Scanner</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
