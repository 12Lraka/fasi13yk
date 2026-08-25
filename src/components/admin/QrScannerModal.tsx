/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Check-in QR Scanner di Lokasi Lomba (Panggung & Registrasi Ulang)
 */

import React, { useState } from 'react';
import { X, QrCode, Camera, CheckCircle2, AlertCircle, Sparkles, UserCheck, Search } from 'lucide-react';
import { Participant, UserSession } from '../../types/fasi';
import { CATEGORIES_LIST, KEMANTREN_LIST } from '../../data/fasiMasterData';
import { logAuditEvent } from '../../utils/storage';
import { showToast } from '../../utils/sweetalert';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
  onCheckInSuccess: (updatedParticipant: Participant) => void;
  session: UserSession;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  participants,
  onCheckInSuccess,
  session,
}) => {
  const [manualCode, setManualCode] = useState<string>('');
  const [scannedResult, setScannedResult] = useState<Participant | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successStatus, setSuccessStatus] = useState<string>('');

  if (!isOpen) return null;

  const handleProcessCode = (code: string) => {
    setErrorMessage('');
    setSuccessStatus('');
    setScannedResult(null);

    const clean = code.trim();
    if (!clean) return;

    // Cari berdasarkan Registration Number, Nama, atau ID
    const found = participants.find(
      (p) =>
        p.registrationNumber.toLowerCase() === clean.toLowerCase() ||
        p.fullName.toLowerCase().includes(clean.toLowerCase()) ||
        p.id.toLowerCase() === clean.toLowerCase() ||
        clean.includes(p.registrationNumber)
    );

    if (!found) {
      setErrorMessage(`Data santri dengan kode "${clean}" tidak ditemukan dalam direktori FASI XIII.`);
      return;
    }

    setScannedResult(found);
  };

  const handleConfirmAttendance = (attendanceType: 'hadir' | 'belum_hadir') => {
    if (!scannedResult) return;

    const timeString = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const updated: Participant = {
      ...scannedResult,
      attendance: attendanceType,
      checkInTime: attendanceType === 'hadir' ? timeString : undefined,
      updatedAt: new Date().toISOString(),
    };

    onCheckInSuccess(updated);
    setScannedResult(updated);
    setSuccessStatus(
      attendanceType === 'hadir'
        ? `Berhasil check-in kehadiran ${updated.fullName} (Hadir) pukul ${timeString} WIB.`
        : `Status kehadiran ${updated.fullName} diatur kembali menjadi (Belum Hadir).`
    );
    showToast('success', `Status presensi ${updated.fullName}: ${attendanceType === 'hadir' ? 'HADIR' : 'BELUM HADIR'}`);

    logAuditEvent(
      session.name,
      'CHECK_IN_QR',
      `Presensi santri ${updated.fullName} [${updated.registrationNumber}] status: ${attendanceType === 'hadir' ? 'Hadir' : 'Belum Hadir'}${attendanceType === 'hadir' ? ` (${timeString} WIB)` : ''}.`
    );
  };

  const getCat = (catId: string) => CATEGORIES_LIST.find((c) => c.id === catId);
  const getKem = (kemId: string) => KEMANTREN_LIST.find((k) => k.id === kemId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 to-emerald-950 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">QR Scanner Check-in Hari-H</h3>
              <p className="text-xs text-emerald-300">Validasi Kehadiran Panggung & Registrasi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Scanner Simulation Viewport */}
          <div className="relative rounded-2xl bg-slate-900 border-2 border-emerald-500/40 p-6 text-center text-white overflow-hidden">
            <div className="w-44 h-44 mx-auto border-2 border-dashed border-amber-400/80 rounded-2xl flex flex-col items-center justify-center relative bg-slate-800/40">
              <Camera className="w-10 h-10 text-emerald-400 animate-pulse mb-2" />
              <span className="text-[11px] font-mono text-emerald-200">ARAHKAN KE QR CODE</span>
              <div className="absolute inset-x-2 top-1/2 h-0.5 bg-amber-400 shadow-[0_0_8px_#f59e0b] animate-bounce"></div>
            </div>
            <p className="text-xs text-slate-300 mt-3 font-medium">
              Kamera siap memindai QR Code pada Kartu Peserta (ID Card) Santri
            </p>
          </div>

          {/* Quick Input Bar */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Atau Input / Tempel Kode Barcode / No. Registrasi:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleProcessCode(manualCode);
                }}
                placeholder="Contoh: KG-TPA-01-01 atau NIK santri..."
                className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono"
              />
              <button
                type="button"
                onClick={() => handleProcessCode(manualCode)}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Search className="w-4 h-4" />
                <span>Validasi</span>
              </button>
            </div>

            {/* Quick Test Demo Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400">Contoh Demo:</span>
              {participants.slice(0, 3).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setManualCode(p.registrationNumber);
                    handleProcessCode(p.registrationNumber);
                  }}
                  className="px-2 py-0.5 text-[11px] font-mono bg-slate-100 text-slate-700 hover:bg-slate-200 rounded border border-slate-200"
                >
                  {p.registrationNumber}
                </button>
              ))}
            </div>
          </div>

          {/* Error Feedback */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Status */}
          {successStatus && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successStatus}</span>
            </div>
          )}

          {/* Found Participant Card */}
          {scannedResult && (
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3 animate-in fade-in">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    {scannedResult.registrationNumber}
                  </span>
                  <h4 className="font-bold text-base text-slate-900 mt-1">{scannedResult.fullName}</h4>
                  <p className="text-xs text-slate-500">
                    Kemantren {getKem(scannedResult.kemantrenId)?.name} • {scannedResult.tpaUnitName}
                  </p>
                </div>
                {scannedResult.lotteryNumber && (
                  <div className="text-center bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-xl">
                    <span className="text-[10px] text-amber-800 block uppercase font-bold">No. Tampil</span>
                    <strong className="text-base font-black font-mono text-amber-950">
                      {String(scannedResult.lotteryNumber).padStart(2, '0')}
                    </strong>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-200 text-xs grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block text-[11px]">Cabang Lomba:</span>
                  <strong className="text-slate-800 font-semibold">{getCat(scannedResult.categoryId)?.name}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Status Kehadiran Saat Ini:</span>
                  <strong className="capitalize text-emerald-800 font-semibold">
                    {scannedResult.attendance === 'hadir' || scannedResult.attendance === 'siap_tampil' || scannedResult.attendance === 'sudah_tampil'
                      ? '✅ Hadir'
                      : '❌ Belum Hadir'}
                  </strong>
                </div>
              </div>

              {/* Check-in Actions */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleConfirmAttendance('hadir')}
                  className="py-2.5 px-3 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Tandai Hadir</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmAttendance('belum_hadir')}
                  className="py-2.5 px-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <UserCheck className="w-4 h-4 text-slate-500" />
                  <span>Tandai Belum Hadir</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold"
          >
            Tutup Scanner
          </button>
        </div>
      </div>
    </div>
  );
};
