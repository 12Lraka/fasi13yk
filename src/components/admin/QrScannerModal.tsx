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
  CheckCheck,
  AlertCircle,
  AlertTriangle,
  Search,
  Upload,
  Info,
  Zap,
  ZoomIn,
  Flashlight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { Participant, UserSession } from '../../types/fasi';
import { CATEGORIES_LIST, KEMANTREN_LIST } from '../../data/fasiMasterData';
import { logAuditEvent, logErrorEvent } from '../../utils/storage';
import { showToast } from '../../utils/sweetalert';
import {
  upsertParticipantToSupabase,
  updateParticipantAttendanceInSupabase,
  isSupabaseConfigured,
} from '../../lib/supabase';

// Helper audio tone untuk feedback instan scanner super pintar
const playAudioTone = (type: 'success' | 'warning' | 'already_checked') => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      // Dua nada naik merdu (C6 -> G6)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, ctx.currentTime);
      osc.frequency.setValueAtTime(1567.98, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'already_checked') {
      // Nada pengingat bahwa santri sudah hadir
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc.frequency.setValueAtTime(523.25, ctx.currentTime + 0.1); // C5
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } else {
      // Warning nada rendah
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch {
    // Abaikan jika browser memblokir audio context otomatis
  }
};

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
  const [scanFeedback, setScanFeedback] = useState<{
    type: 'success' | 'already_checked';
    participant: Participant;
    time: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraPermissionError, setCameraPermissionError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [recentSessionScans, setRecentSessionScans] = useState<Participant[]>([]);
  const [showHistoryList, setShowHistoryList] = useState<boolean>(false);

  // Kamera lanjutan: Multi-lensa, Zoom optik/digital, dan Senter untuk Samsung, iPhone & Infinix
  const [availableCameras, setAvailableCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [zoomRange, setZoomRange] = useState<{ min: number; max: number; step: number } | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isTorchSupported, setIsTorchSupported] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrRegionId = 'html5qr-code-full-region';
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastScanTimestampRef = useRef<number>(0);
  const lastScannedCodeRef = useRef<string>('');

  // Ref peserta agar selalu sinkron dengan state terbaru di dalam closure scanner
  const participantsRef = useRef<Participant[]>(participants);
  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

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
    setIsTorchOn(false);
  };

  // Start camera helper dengan dukungan BarcodeDetector hardware & dynamic viewport
  const startCamera = async (facing: 'environment' | 'user', specificCameraId?: string) => {
    setCameraPermissionError(null);
    setErrorMessage('');

    try {
      await stopCamera();

      // Tunggu DOM elemen siap
      const element = document.getElementById(qrRegionId);
      if (!element) return;

      // Inisialisasi Html5Qrcode dengan BarcodeDetector bawaan OS (Krusial untuk Samsung & Infinix di Chrome)
      const html5QrCode = new Html5Qrcode(qrRegionId, {
        verbose: false,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true,
        },
      });
      scannerRef.current = html5QrCode;

      // Dynamic qrbox: 75% dari dimensi viewfinder agar tidak terpotong sempit di sensor resolusi tinggi
      const config = {
        fps: 15,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const size = Math.max(180, Math.floor(minEdge * 0.75));
          return { width: size, height: size };
        },
        aspectRatio: 1.0,
      };

      // Tentukan target kamera (device ID spesifik atau constraints facingMode)
      // Catatan: Html5Qrcode mewajibkan objek cameraIdOrConfig hanya memiliki tepat 1 key ('facingMode' atau 'deviceId')
      const targetId = (specificCameraId !== undefined ? specificCameraId : selectedCameraId)?.trim();
      const cameraTarget: string | { facingMode: 'environment' | 'user' } = targetId
        ? targetId
        : { facingMode: facing };

      await html5QrCode.start(
        cameraTarget,
        config,
        (decodedText) => {
          // Debounce scan 2 detik agar tidak spamming jika kamera diam di depan QR
          const now = Date.now();
          const isSameCode = lastScannedCodeRef.current === decodedText;
          if (now - lastScanTimestampRef.current > 2000 || !isSameCode) {
            lastScanTimestampRef.current = now;
            lastScannedCodeRef.current = decodedText;
            handleProcessCode(decodedText, true);
          }
        },
        () => {
          // Ignored per-frame scan errors
        }
      );

      setIsCameraActive(true);

      // Ambil daftar kamera fisik (misal Samsung memiliki kamera Wide, Ultra-Wide, Telephoto)
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          setAvailableCameras(
            devices.map((d, i) => ({
              id: d.id,
              label: d.label || `Kamera ${i + 1}`,
            }))
          );
        }
      } catch {
        // Abaikan jika tidak diizinkan membaca device list
      }

      // Deteksi kapabilitas Zoom dan Senter (Torch)
      try {
        const caps = html5QrCode.getRunningTrackCameraCapabilities();
        const zoom = caps.zoomFeature();
        if (zoom && zoom.isSupported()) {
          setZoomRange({
            min: zoom.min(),
            max: zoom.max(),
            step: zoom.step(),
          });
          setZoomLevel(zoom.value() ?? 1);
        } else {
          setZoomRange(null);
        }

        const torch = caps.torchFeature();
        if (torch && torch.isSupported()) {
          setIsTorchSupported(true);
          setIsTorchOn(torch.value() ?? false);
        } else {
          setIsTorchSupported(false);
          setIsTorchOn(false);
        }
      } catch {
        setZoomRange(null);
        setIsTorchSupported(false);
      }
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

  // Zoom control
  const handleSetZoom = async (newZoom: number) => {
    if (!scannerRef.current) return;
    try {
      const caps = scannerRef.current.getRunningTrackCameraCapabilities();
      const zoomFeature = caps.zoomFeature();
      if (zoomFeature && zoomFeature.isSupported()) {
        const clamped = Math.min(Math.max(newZoom, zoomRange?.min || 1), zoomRange?.max || 5);
        await zoomFeature.apply(clamped);
        setZoomLevel(clamped);
      }
    } catch (err) {
      console.warn('Zoom failed:', err);
    }
  };

  // Torch control
  const handleToggleTorch = async () => {
    if (!scannerRef.current) return;
    try {
      const caps = scannerRef.current.getRunningTrackCameraCapabilities();
      const torchFeature = caps.torchFeature();
      if (torchFeature && torchFeature.isSupported()) {
        const nextState = !isTorchOn;
        await torchFeature.apply(nextState);
        setIsTorchOn(nextState);
      }
    } catch (err) {
      console.warn('Torch failed:', err);
    }
  };

  // Switch between back/front camera
  const toggleCameraFacing = async () => {
    const nextFacing = cameraFacingMode === 'environment' ? 'user' : 'environment';
    setCameraFacingMode(nextFacing);
    setSelectedCameraId('');
    if (isCameraActive) {
      await startCamera(nextFacing, '');
    }
  };

  // Pilih lensa kamera spesifik
  const handleSelectCamera = async (cameraId: string) => {
    setSelectedCameraId(cameraId);
    if (isCameraActive) {
      await startCamera(cameraFacingMode, cameraId);
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
      handleProcessCode(decodedText, true);
    } catch (err) {
      setErrorMessage('Tidak menemukan QR Code yang jelas pada foto tersebut.');
      setScanFeedback(null);
      playAudioTone('warning');
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
      setScanFeedback(null);
      setErrorMessage('');
    }
  }, [isOpen]);

  // Eksekusi kehadiran ke State, Supabase, dan Audit Log (Zero-Click Otomatis)
  const executeAttendance = async (
    target: Participant,
    attendanceType: 'hadir' | 'belum_hadir',
    isAuto = false
  ) => {
    const timeString = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const formattedTime = `${timeString} WIB`;

    const updated: Participant = {
      ...target,
      attendance: attendanceType,
      checkInTime: attendanceType === 'hadir' ? (target.checkInTime || formattedTime) : undefined,
      updatedAt: new Date().toISOString(),
    };

    // 1. Update state di parent React (dan LocalStorage)
    onCheckInSuccess(updated);
    setScannedResult(updated);
    setScanFeedback({
      type: 'success',
      participant: updated,
      time: updated.checkInTime || formattedTime,
    });

    // Rekam ke riwayat sesi aktif pemindai agar petugas melihat counter kartu berhasil discan
    if (attendanceType === 'hadir') {
      setRecentSessionScans((prev) => [updated, ...prev.filter((p) => p.id !== updated.id)]);
    } else {
      setRecentSessionScans((prev) => prev.filter((p) => p.id !== updated.id));
    }

    // Langsung mutasi ref scanner lokal seketika agar pembacaan kartu berikutnya tidak tertimpa/bentrok
    participantsRef.current = participantsRef.current.map((p) =>
      p.id === updated.id ? updated : p
    );

    // 2. Simpan seketika secara atomik per baris ke Supabase (tidak pernah menimpa santri lain)
    if (isSupabaseConfigured()) {
      updateParticipantAttendanceInSupabase(updated.id, attendanceType).catch((err) =>
        console.warn('Gagal update kehadiran santri ke Supabase:', err)
      );
    }

    // 3. Catat audit trail
    logAuditEvent(
      session.name,
      'CHECK_IN_QR',
      `Presensi santri ${updated.fullName} [${updated.registrationNumber}] status: ${attendanceType === 'hadir' ? 'Hadir' : 'Belum Hadir'}${attendanceType === 'hadir' ? ` (${updated.checkInTime || formattedTime})` : ''}.`
    );

    // 4. Feedback Suara & Notifikasi Visual
    if (attendanceType === 'hadir') {
      playAudioTone('success');
      setErrorMessage('');
      showToast('success', `✅ Hadir: ${updated.fullName} (${updated.checkInTime || formattedTime})`);
    } else {
      showToast('info', `Status presensi ${updated.fullName} diatur ke Belum Hadir.`);
    }
  };

  // Proses scan atau pencarian santri (Cepat, Akurat, Zero-Click)
  const handleProcessCode = (code: string, isAutoScan = false) => {
    setErrorMessage('');
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

    // 2. Cari berdasarkan Registration Number, ID, atau nama dari participantsRef (terbaru)
    const currentList = participantsRef.current.length > 0 ? participantsRef.current : participants;
    const found = currentList.find((p) => {
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
      setScanFeedback(null);
      playAudioTone('warning');
      return;
    }

    // 3. Evaluasi Status Kehadiran:
    if (found.attendance === 'hadir') {
      // SUDAH HADIR: Tampilkan status sudah hadir dengan HUD ringkas
      const existingTime = found.checkInTime
        ? (found.checkInTime.includes('WIB') ? found.checkInTime : `${found.checkInTime} WIB`)
        : 'Tercatat';
      setScannedResult(found);
      setScanFeedback({
        type: 'already_checked',
        participant: found,
        time: existingTime,
      });
      playAudioTone('already_checked');
      showToast('info', `${found.fullName} sudah berstatus HADIR.`);
      return;
    }

    // BELUM HADIR: Langsung simpan HADIR ke Supabase & Data Peserta (Zero-Click)
    executeAttendance(found, 'hadir', isAutoScan);
  };

  if (!isOpen) return null;

  const getCat = (catId: string) => CATEGORIES_LIST.find((c) => c.id === catId);
  const getKem = (kemId: string) => KEMANTREN_LIST.find((k) => k.id === kemId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 to-emerald-950 px-5 py-3.5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">QR Scanner Presensi FASI XIII</h3>
              <p className="text-[11px] text-emerald-300">Scan Cepat Antrean • Tersimpan Otomatis</p>
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
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-2.5">
          {/* Scanner Viewport */}
          <div className="relative rounded-2xl bg-slate-900 border-2 border-emerald-500/40 p-3 text-center text-white overflow-hidden">
            {/* Auto Check-in Badge Header */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[11px]">
              <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
                <span>Auto Check-in Cerdas Aktif</span>
              </div>
              <span className="text-emerald-400 text-[10px] font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Real-time Supabase
              </span>
            </div>

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
            <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-800 text-xs">
              <div className="flex flex-wrap items-center gap-2">
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

            {/* Quick Zoom & Senter (Flashlight) saat kamera aktif */}
            {isCameraActive && (
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                {/* Zoom Buttons untuk Samsung/iPhone/Infinix */}
                <div className="flex items-center gap-1 text-[11px]">
                  <span className="text-slate-400 font-semibold flex items-center gap-1 mr-1">
                    <ZoomIn className="w-3.5 h-3.5 text-emerald-400" />
                    Zoom:
                  </span>
                  {[1, 1.5, 2].map((lvl) => {
                    const isDisabled = zoomRange ? lvl > zoomRange.max || lvl < zoomRange.min : false;
                    const isActive = Math.abs(zoomLevel - lvl) < 0.15;
                    return (
                      <button
                        key={lvl}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => handleSetZoom(lvl)}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-emerald-500 text-slate-950 shadow-xs'
                            : isDisabled
                            ? 'bg-slate-800/40 text-slate-600 cursor-not-allowed'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                        title={`Perbesar ${lvl}x`}
                      >
                        {lvl}x
                      </button>
                    );
                  })}
                </div>

                {/* Senter / Flashlight */}
                {isTorchSupported && (
                  <button
                    type="button"
                    onClick={handleToggleTorch}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isTorchOn
                        ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                    title="Nyalakan/matikan lampu kilat senter"
                  >
                    <Flashlight className="w-3.5 h-3.5" />
                    <span>{isTorchOn ? 'Senter: ON' : 'Senter'}</span>
                  </button>
                )}
              </div>
            )}

            {/* Pemilihan Lensa Fisik Spesifik (Samsung & Infinix dengan multi-lensa) */}
            {availableCameras.length > 1 && isCameraActive && (
              <div className="mt-2 flex items-center justify-between gap-2 text-[11px] bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 shrink-0">Pilih Lensa:</span>
                <select
                  value={selectedCameraId}
                  onChange={(e) => handleSelectCamera(e.target.value)}
                  className="bg-slate-900 text-slate-200 text-[11px] border border-slate-700 rounded px-2 py-0.5 truncate flex-1 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Otomatis ({cameraFacingMode === 'environment' ? 'Belakang' : 'Depan'})</option>
                  {availableCameras.map((c, i) => (
                    <option key={c.id} value={c.id}>
                      {c.label || `Kamera ${i + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Petunjuk Jarak Fokus untuk Samsung, iPhone, dan Infinix */}
            <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-center gap-1.5 bg-slate-950/50 py-1.5 px-2.5 rounded-lg border border-slate-800/60">
              <span className="text-amber-400 font-bold">💡 Tips:</span>
              <span>Pegang HP berjarak <strong className="text-slate-200">15–20 cm</strong> dari kartu. Gunakan <strong className="text-emerald-300">Zoom 1.5x / 2x</strong> bila kamera buram.</span>
            </div>
          </div>

          {/* Hasil Scan Ringkas HUD Banner (Otomatis & Tanpa Tombol yang Membingungkan) */}
          {scanFeedback && (
            <div
              className={`p-3 rounded-xl border text-left shadow-xs transition-all duration-200 animate-in fade-in slide-in-from-top-1 ${
                scanFeedback.type === 'success'
                  ? 'bg-emerald-50/90 border-emerald-500 text-emerald-950'
                  : 'bg-amber-50/90 border-amber-500 text-amber-950'
              }`}
            >
              {/* Baris 1: Status (HADIR / SUDAH HADIR) + Jam + Nama Lengkap Santri + No. Undian */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wide text-white shadow-xs ${
                      scanFeedback.type === 'success' ? 'bg-emerald-600' : 'bg-amber-600'
                    }`}
                  >
                    {scanFeedback.type === 'success' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>HADIR ({scanFeedback.time})</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>SUDAH HADIR ({scanFeedback.time})</span>
                      </>
                    )}
                  </span>
                  <span className="font-bold text-xs sm:text-sm truncate text-slate-900">
                    • {scanFeedback.participant.fullName}
                  </span>
                </div>
                {scanFeedback.participant.lotteryNumber && (
                  <span className="shrink-0 text-xs font-mono font-black px-2 py-0.5 rounded bg-slate-900 text-amber-300 border border-slate-700">
                    No. {String(scanFeedback.participant.lotteryNumber).padStart(2, '0')}
                  </span>
                )}
              </div>

              {/* Baris 2: [No. Registrasi] Cabang Lomba Lengkap (Kategori) • Unit TPA */}
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-700">
                <span className="font-mono font-bold text-slate-900 bg-white/90 px-1.5 py-0.5 rounded border border-slate-300 text-[11px]">
                  {scanFeedback.participant.registrationNumber}
                </span>
                <span className="font-semibold text-emerald-950">
                  {getCat(scanFeedback.participant.categoryId)?.name || scanFeedback.participant.categoryId}
                </span>
                {scanFeedback.participant.tpaUnitName && (
                  <span className="text-slate-600 text-[11px]">
                    • {scanFeedback.participant.tpaUnitName}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Error Feedback */}
          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-semibold">{errorMessage}</span>
            </div>
          )}

          {/* Quick Input Bar (Untuk input manual jika barcode rusak/tidak terbaca) */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Atau Input / Tempel No. Registrasi:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleProcessCode(manualCode, false);
                    setManualCode('');
                  }
                }}
                placeholder="Contoh: KG-TPA-01-01 atau nama santri..."
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono"
              />
              <button
                type="button"
                onClick={() => {
                  handleProcessCode(manualCode, false);
                  setManualCode('');
                }}
                className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Validasi</span>
              </button>
            </div>
          </div>

          {/* Riwayat Check-In Sesi Aktif (Ringkas, Hemat Tempat di Layar HP) */}
          {recentSessionScans.length > 0 && (
            <div className="rounded-xl p-2.5 bg-slate-900 text-white border border-slate-800 text-xs animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="font-semibold text-emerald-300 text-[11px]">
                    Sesi Ini: {recentSessionScans.length} Santri Hadir
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHistoryList(!showHistoryList)}
                  className="text-[11px] text-slate-300 hover:text-white flex items-center gap-1 underline underline-offset-2 cursor-pointer"
                >
                  {showHistoryList ? 'Sembunyikan' : 'Lihat Riwayat'}
                  {showHistoryList ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>

              {showHistoryList && (
                <div className="mt-2 pt-2 border-t border-slate-800 max-h-32 overflow-y-auto space-y-1 pr-1 text-[11px]">
                  {recentSessionScans.map((p, idx) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-1.5 rounded-lg bg-slate-800/70 border border-slate-700/50"
                    >
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <span className="w-4 h-4 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="truncate text-slate-200 font-medium">{p.fullName}</span>
                      </div>
                      <span className="font-mono text-emerald-400 text-[10px] shrink-0 ml-2">
                        {p.checkInTime || 'Hadir'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-4 py-2.5 sm:px-6 sm:py-3 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <Info className="w-3.5 h-3.5 text-emerald-700" />
            <span>Kamera siap scan berulang untuk antrean</span>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold cursor-pointer"
          >
            Tutup Scanner
          </button>
        </div>
      </div>
    </div>
  );
};
