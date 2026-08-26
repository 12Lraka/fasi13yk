/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Check-in QR Scanner Real-time di Lokasi Lomba (Panggung & Registrasi Ulang)
 * Didukung Pemindaian Kamera Aktif (Html5Qrcode), Scan File Foto, dan Input Manual
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  QrCode,
  Camera,
  CameraOff,
  SwitchCamera,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  UserCheck,
  Search,
  Upload,
  RefreshCw,
  Info,
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { Participant, UserSession } from '../../types/fasi';
import { CATEGORIES_LIST, KEMANTREN_LIST } from '../../data/fasiMasterData';
import { logAuditEvent, logErrorEvent } from '../../utils/storage';
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
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraPermissionError, setCameraPermissionError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrRegionId = 'html5qr-code-full-region';
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastScanTimestampRef = useRef<number>(0);

  // Stop camera helper safely without interfering with React's DOM
  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
      scannerRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Start camera helper
  const startCamera = async (facing: 'environment' | 'user') => {
    setCameraPermissionError(null);
    setErrorMessage('');

    try {
      await stopCamera();

      // Tunggu DOM elemen siap
      const element = document.getElementById(qrRegionId);
      if (!element) return;

      const html5QrCode = new Html5Qrcode(qrRegionId);
      scannerRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 220, height: 220 },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        { facingMode: facing },
        config,
        (decodedText) => {
          // Debounce scan 1.5 detik agar tidak memicu re-render ganda saat kamera menyorot kartu
          const now = Date.now();
          if (now - lastScanTimestampRef.current > 1500) {
            lastScanTimestampRef.current = now;
            handleProcessCode(decodedText);
          }
        },
        () => {
          // Ignored per-frame scan errors
        }
      );

      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Gagal mengakses kamera:', err);
      const msg =
        err?.name === 'NotAllowedError' || err?.message?.includes('Permission')
          ? 'Izin kamera belum diberikan. Harap izinkan akses kamera di browser Anda.'
          : err?.name === 'NotFoundError' || err?.message?.includes('DevicesNotFoundError')
          ? 'Kamera tidak ditemukan pada perangkat Anda.'
          : `Tidak dapat mengaktifkan kamera: ${err?.message || err}`;
      setCameraPermissionError(msg);
      setIsCameraActive(false);
      logErrorEvent(session?.name || 'ADMIN_SCANNER', 'CAMERA_SCAN_START', err);
    }
  };

  // Switch between back/front camera
  const toggleCameraFacing = async () => {
    const nextFacing = cameraFacingMode === 'environment' ? 'user' : 'environment';
    setCameraFacingMode(nextFacing);
    if (isCameraActive) {
      await startCamera(nextFacing);
    }
  };

  // Trigger file upload scan
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      setErrorMessage('');
      const html5QrCode = scannerRef.current || new Html5Qrcode(qrRegionId);
      const decodedText = await html5QrCode.scanFile(file, true);
      handleProcessCode(decodedText);
      showToast('success', 'QR Code berhasil dipindai dari file foto!');
    } catch (err) {
      setErrorMessage('Tidak menemukan QR Code yang jelas pada foto tersebut.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Effect saat modal dibuka/tutup
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        startCamera(cameraFacingMode);
      }, 200);
      return () => {
        clearTimeout(timer);
        stopCamera();
      };
    } else {
      stopCamera();
    }
  }, [isOpen]);

  const handleProcessCode = (code: string) => {
    setErrorMessage('');
    setSuccessStatus('');
    setScannedResult(null);

    const clean = code.trim();
    if (!clean) return;

    // 1. Ekstrak data jika QR berisi format JSON
    let searchReg = clean;
    let searchName = clean;
    try {
      if (clean.startsWith('{') && clean.endsWith('}')) {
        const parsed = JSON.parse(clean);
        if (parsed.reg) searchReg = String(parsed.reg).trim();
        if (parsed.nama) searchName = String(parsed.nama).trim();
      }
    } catch {
      // bukan json, pakai raw string
    }

    // 2. Cari berdasarkan Registration Number, ID, atau nama
    const found = participants.find((p) => {
      const regMatch =
        p.registrationNumber.toLowerCase() === searchReg.toLowerCase() ||
        p.registrationNumber.toLowerCase() === clean.toLowerCase() ||
        clean.toLowerCase().includes(p.registrationNumber.toLowerCase());

      const idMatch = p.id.toLowerCase() === clean.toLowerCase();

      const nameMatch =
        p.fullName.toLowerCase().includes(searchName.toLowerCase()) ||
        clean.toLowerCase().includes(p.fullName.toLowerCase());

      return regMatch || idMatch || nameMatch;
    });

    if (!found) {
      setErrorMessage(`Data santri dengan kode/nama "${searchReg}" tidak ditemukan dalam sistem FASI XIII.`);
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

  if (!isOpen) return null;

  const getCat = (catId: string) => CATEGORIES_LIST.find((c) => c.id === catId);
  const getKem = (kemId: string) => KEMANTREN_LIST.find((k) => k.id === kemId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
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
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Scanner Viewport */}
          <div className="relative rounded-2xl bg-slate-900 border-2 border-emerald-500/40 p-3 text-center text-white overflow-hidden">
            {/* HTML5 QR Code Host Container - MUST BE EMPTY FOR REACT */}
            <div className="relative w-full max-w-[320px] mx-auto min-h-[250px] bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center">
              {/* Dedicated pure DOM element for html5-qrcode, NO React children inside */}
              <div id={qrRegionId} className="w-full h-full min-h-[240px]" />

              {/* Sibling React overlay when camera is not active */}
              {!isCameraActive && (
                <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-3 z-10">
                  <CameraOff className="w-10 h-10 text-slate-500 mx-auto" />
                  <p className="text-xs text-slate-400">
                    {cameraPermissionError || 'Kamera sedang non-aktif.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => startCamera(cameraFacingMode)}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Aktifkan Kamera</span>
                  </button>
                </div>
              )}
            </div>

            {/* Control buttons under camera */}
            <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                {isCameraActive ? (
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-2.5 py-1.5 bg-rose-900/60 hover:bg-rose-800 text-rose-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <CameraOff className="w-3.5 h-3.5" />
                    <span>Matikan Kamera</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => startCamera(cameraFacingMode)}
                    className="px-2.5 py-1.5 bg-emerald-800/80 hover:bg-emerald-700 text-emerald-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Mulai Kamera</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={toggleCameraFacing}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                  title="Ganti Kamera Depan / Belakang"
                >
                  <SwitchCamera className="w-3.5 h-3.5" />
                  <span>{cameraFacingMode === 'environment' ? 'Kamera Belakang' : 'Kamera Depan'}</span>
                </button>
              </div>

              {/* Upload Foto QR Code */}
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="px-2.5 py-1.5 bg-amber-500/20 border border-amber-400/40 text-amber-300 hover:bg-amber-500/30 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Foto QR</span>
                </button>
              </div>
            </div>
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
                placeholder="Contoh: KG-TPA-01-01 atau nama santri..."
                className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono"
              />
              <button
                type="button"
                onClick={() => handleProcessCode(manualCode)}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
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
                  className="px-2 py-0.5 text-[11px] font-mono bg-slate-100 text-slate-700 hover:bg-slate-200 rounded border border-slate-200 cursor-pointer"
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
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <Info className="w-3.5 h-3.5 text-emerald-700" />
            <span>Arahkan kamera ke QR Code pada ID Card santri</span>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold cursor-pointer"
          >
            Tutup Scanner
          </button>
        </div>
      </div>
    </div>
  );
};
