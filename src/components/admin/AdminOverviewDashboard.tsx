/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Admin Overview Dashboard - Halaman Statistik, Progres, & Shortcut Utama
 */

import React, { useState } from 'react';
import {
  Users,
  Award,
  ShieldCheck,
  FolderSync,
  UserPlus,
  FileSpreadsheet,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Dices,
  Printer,
  Info,
  Layers,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  Trophy,
} from 'lucide-react';
import { Participant, UserSession, Kemantren, CompetitionCategory, AppSettings } from '../../types/fasi';

interface AdminOverviewDashboardProps {
  session: UserSession;
  participants: Participant[];
  kemantrenList: Kemantren[];
  categoriesList: CompetitionCategory[];
  appSettings: AppSettings;
  onOpenAddModal: () => void;
  onNavigateTab: (tab: 'dashboard' | 'peserta' | 'rekap-peserta' | 'rekap-cabang' | 'hasil-cabang' | 'berita-acara' | 'pengaturan' | 'log') => void;
  onOpenLotteryModal?: () => void;
  onOpenPrintCards?: () => void;
}

export const AdminOverviewDashboard: React.FC<AdminOverviewDashboardProps> = ({
  session,
  participants,
  kemantrenList,
  categoriesList,
  appSettings,
  onOpenAddModal,
  onNavigateTab,
  onOpenLotteryModal,
  onOpenPrintCards,
}) => {
  const isSuperAdmin = session.role === 'super_admin';
  const currentKemantren = kemantrenList.find((k) => k.id === session.kemantrenId);

  // Filter peserta sesuai role
  const relevantParticipants = isSuperAdmin
    ? participants
    : participants.filter((p) => p.kemantrenId === session.kemantrenId);

  // Statistik Jenjang
  const totalCount = relevantParticipants.length;
  const tkaCount = relevantParticipants.filter((p) => {
    const cat = categoriesList.find((c) => c.id === p.categoryId);
    return cat?.level === 'TKA';
  }).length;
  const tpaCount = relevantParticipants.filter((p) => {
    const cat = categoriesList.find((c) => c.id === p.categoryId);
    return cat?.level === 'TPA';
  }).length;
  const tqaCount = relevantParticipants.filter((p) => {
    const cat = categoriesList.find((c) => c.id === p.categoryId);
    return cat?.level === 'TQA';
  }).length;

  const putraCount = relevantParticipants.filter((p) => p.gender === 'L').length;
  const putriCount = relevantParticipants.filter((p) => p.gender === 'P').length;

  // Keterisian Kuota Cabang Lomba
  // Untuk Kemantren: Berapa cabang yang sudah diisi santri kemantren tersebut
  // Untuk Superadmin: Rata-rata atau total cabang yang aktif terisi
  const filledCategoryIds = new Set(relevantParticipants.map((p) => p.categoryId));
  const filledCategoriesCount = filledCategoryIds.size;
  const totalCategoriesCount = categoriesList.length || 18;
  const categoryFillPercentage = Math.min(
    100,
    Math.round((filledCategoriesCount / totalCategoriesCount) * 100)
  );

  // Status Verifikasi: Sesuai instruksi, status dibuat terverifikasi semua (100% siap tanding)
  const verifiedPercentage = totalCount > 0 ? 100 : 100;

  // Google Drive Modal / Selector untuk Superadmin
  const [selectedDriveKemantrenId, setSelectedDriveKemantrenId] = useState<string>(
    session.kemantrenId || kemantrenList[0]?.id || ''
  );

  const activeDriveUrl = isSuperAdmin
    ? kemantrenList.find((k) => k.id === selectedDriveKemantrenId)?.driveFolderUrl ||
      'https://drive.google.com'
    : currentKemantren?.driveFolderUrl || 'https://drive.google.com';

  // Perhitungan Data 14 Kemantren untuk Superadmin
  const kemantrenProgress = kemantrenList.map((kem) => {
    const kemParticipants = participants.filter((p) => p.kemantrenId === kem.id);
    const kemFilledCats = new Set(kemParticipants.map((p) => p.categoryId)).size;
    const pct = Math.min(100, Math.round((kemFilledCats / totalCategoriesCount) * 100));
    return {
      ...kem,
      totalSantri: kemParticipants.length,
      filledCats: kemFilledCats,
      percentage: pct,
    };
  });

  return (
    <div className="space-y-6 pb-12" id="admin-overview-dashboard">
      {/* 1. HERO GREETING BANNER */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-950 rounded-2xl p-6 sm:p-7 text-white shadow-md border border-emerald-700/60">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 -mb-12 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-400 text-emerald-950 uppercase tracking-wider shadow-xs">
                {isSuperAdmin ? 'Pusat FASI XIII Kota Yogyakarta' : `Rayon Kemantren ${currentKemantren?.name || ''}`}
              </span>
              <span className="flex items-center gap-1 text-xs text-emerald-200 bg-emerald-800/60 px-2.5 py-0.5 rounded-full border border-emerald-600/40">
                <Calendar className="w-3.5 h-3.5 text-amber-300" />
                {appSettings.eventDate || 'Oktober 2026'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white pt-1">
              Selamat Datang, {session.name}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              {isSuperAdmin
                ? 'Pantau progres pendaftaran santri 14 Kemantren, kesiapan berkas kafilah, dan statistik cabang lomba se-Kota Yogyakarta secara real-time.'
                : `Panel statistik dan kesiapan kafilah santri Kemantren ${currentKemantren?.name}. Pastikan seluruh kuota cabang lomba terisi maksimal.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenAddModal}
              id="btn-quick-add-santri"
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-emerald-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Daftarkan Santri</span>
            </button>

            <a
              href={activeDriveUrl}
              target="_blank"
              rel="noopener noreferrer"
              id="btn-quick-gdrive"
              className="px-4 py-2.5 bg-emerald-700/80 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl border border-emerald-500/50 transition-all flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <FolderSync className="w-4 h-4 text-amber-300" />
              <span>Folder Berkas Drive</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>
          </div>
        </div>
      </div>

      {/* 2. THREE PRIMARY KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* KPI 1: TOTAL PESERTA */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isSuperAdmin ? 'Total Santri Se-Kota' : 'Kafilah Santri Terdaftar'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 font-mono">
              {totalCount}
            </span>
            <span className="text-xs font-bold text-slate-500">Santri Terdaftar</span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>TKA: <strong className="text-slate-800 font-mono">{tkaCount}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-teal-500" />
              <span>TPA: <strong className="text-slate-800 font-mono">{tpaCount}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>TQA: <strong className="text-slate-800 font-mono">{tqaCount}</strong></span>
            </div>
          </div>

          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Putra: <strong className="text-slate-700 font-mono">{putraCount}</strong></span>
            <span>Putri: <strong className="text-slate-700 font-mono">{putriCount}</strong></span>
          </div>
        </div>

        {/* KPI 2: STATUS VERIFIKASI (100% TERVERIFIKASI SEMUA) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Status Berkas & Verifikasi
            </span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-emerald-700 font-mono">
              {verifiedPercentage}%
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
              Terverifikasi Sah
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50/80 p-2 rounded-xl border border-emerald-200/60">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Semua data santri tervalidasi siap berlaga di arena FASI XIII.</span>
            </div>
          </div>
        </div>

        {/* KPI 3: KETERISIAN KUOTA CABANG */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Keterisian Kuota Cabang
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 font-mono">
              {categoryFillPercentage}%
            </span>
            <span className="text-xs font-bold text-slate-500">
              ({filledCategoriesCount} dari {totalCategoriesCount} Cabang)
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-600 to-amber-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${categoryFillPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 font-medium">
              <span>{filledCategoriesCount} Cabang Aktif</span>
              <span>Sisa {Math.max(0, totalCategoriesCount - filledCategoriesCount)} Cabang</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SECTION TENGAH: GRAFIK & DISTRIBUSI + SHORTCUT AKSI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KOLOM KIRI (2 SPAN): GRAFIK & PROGRES */}
        <div className="lg:col-span-2 space-y-6">
          {/* DISTRIBUSI JENJANG */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-700" />
                  Distribusi Santri per Jenjang Lomba
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Komparasi jumlah santri di tingkat TKA, TPA, dan TQA
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400">
                {totalCount} Total
              </span>
            </div>

            <div className="space-y-3.5">
              {/* Bar TKA */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600" />
                    TKA (Taman Kanak-kanak Al-Qur'an)
                  </span>
                  <span className="font-mono text-slate-800">
                    {tkaCount} Santri ({totalCount > 0 ? Math.round((tkaCount / totalCount) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-3 rounded-full transition-all"
                    style={{
                      width: `${totalCount > 0 ? (tkaCount / totalCount) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* Bar TPA */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-teal-600" />
                    TPA (Taman Pendidikan Al-Qur'an)
                  </span>
                  <span className="font-mono text-slate-800">
                    {tpaCount} Santri ({totalCount > 0 ? Math.round((tpaCount / totalCount) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-teal-600 h-3 rounded-full transition-all"
                    style={{
                      width: `${totalCount > 0 ? (tpaCount / totalCount) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* Bar TQA */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                    TQA (Ta'limul Qur'an Lil Aulad)
                  </span>
                  <span className="font-mono text-slate-800">
                    {tqaCount} Santri ({totalCount > 0 ? Math.round((tqaCount / totalCount) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-amber-500 h-3 rounded-full transition-all"
                    style={{
                      width: `${totalCount > 0 ? (tqaCount / totalCount) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* KHUSUS SUPERADMIN: KOMPARASI PROGRES 14 KEMANTREN */}
          {isSuperAdmin && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-700" />
                    Progres Pendaftaran 14 Rayon se-Kota
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Evaluasi keterisian cabang dan total pendaftar di setiap kontingen
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-emerald-950 uppercase">
                  Superadmin View
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200/80">
                      <th className="py-2.5 px-3">Rayon</th>
                      <th className="py-2.5 px-3 text-center">Jml Santri</th>
                      <th className="py-2.5 px-3">Keterisian Cabang</th>
                      <th className="py-2.5 px-3 text-right">Berkas Drive</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {kemantrenProgress.map((kem) => (
                      <tr key={kem.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          <span className="inline-block px-1.5 py-0.2 bg-slate-200 text-slate-700 text-[10px] font-mono rounded mr-2 font-bold">
                            {kem.code}
                          </span>
                          {kem.name}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">
                          {kem.totalSantri}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-100 rounded-full h-2 max-w-[120px] overflow-hidden">
                              <div
                                className={`h-2 rounded-full ${
                                  kem.percentage >= 80
                                    ? 'bg-emerald-600'
                                    : kem.percentage >= 40
                                    ? 'bg-teal-500'
                                    : 'bg-amber-400'
                                }`}
                                style={{ width: `${kem.percentage}%` }}
                              />
                            </div>
                            <span className="font-mono text-[11px] text-slate-600">
                              {kem.percentage}% ({kem.filledCats}/{totalCategoriesCount})
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <a
                            href={kem.driveFolderUrl || 'https://drive.google.com'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-900 font-bold hover:underline"
                          >
                            <FolderSync className="w-3 h-3" />
                            <span>Buka Folder</span>
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* KOLOM KANAN (1 SPAN): SHORTCUT CEPAT & TIMELINE */}
        <div className="space-y-6">
          {/* SHORTCUT AKSI PINTAS */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Aksi Cepat & Navigasi
            </h3>

            <div className="space-y-2">
              {/* Tombol Tambah */}
              <button
                onClick={onOpenAddModal}
                className="w-full p-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200/70 text-emerald-950 font-bold text-xs flex items-center justify-between transition-colors cursor-pointer group text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-400 text-emerald-950 flex items-center justify-center shrink-0 shadow-2xs">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold">Pendaftaran Santri Baru</div>
                    <div className="text-[10px] text-emerald-800 font-normal">Input biodata & cabang lomba santri</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-600 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Tombol Data & Rekap Peserta */}
              <button
                onClick={() => onNavigateTab('peserta')}
                className="w-full p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 text-slate-800 font-bold text-xs flex items-center justify-between transition-colors cursor-pointer group text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-800 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold">Manajemen Data Santri</div>
                    <div className="text-[10px] text-slate-500 font-normal">Tabel lengkap, filter, edit & hapus</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Tombol Rekap Peserta */}
              <button
                onClick={() => onNavigateTab('rekap-peserta')}
                className="w-full p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 text-slate-800 font-bold text-xs flex items-center justify-between transition-colors cursor-pointer group text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-teal-700 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold">Download Rekap Peserta</div>
                    <div className="text-[10px] text-slate-500 font-normal">Export Excel, PDF & Cetak Buku Induk</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Tombol Cetak ID Card */}
              {onOpenPrintCards && (
                <button
                  onClick={onOpenPrintCards}
                  className="w-full p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 text-slate-800 font-bold text-xs flex items-center justify-between transition-colors cursor-pointer group text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-700 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Printer className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold">Cetak ID Card Santri</div>
                      <div className="text-[10px] text-slate-500 font-normal">Format A4 & Kartu Satuan QR Code</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}

              {/* Tombol Undian Nomor Tampil (Superadmin) */}
              {isSuperAdmin && onOpenLotteryModal && (
                <button
                  onClick={onOpenLotteryModal}
                  className="w-full p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 text-slate-800 font-bold text-xs flex items-center justify-between transition-colors cursor-pointer group text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Dices className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold">Undian Nomor Tampil</div>
                      <div className="text-[10px] text-slate-500 font-normal">Pengacakan nomor urut lomba resmi</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}

              {/* Tombol Hasil Cabang Lomba (Superadmin) */}
              {isSuperAdmin && (
                <button
                  onClick={() => onNavigateTab('hasil-cabang')}
                  className="w-full p-3 rounded-xl bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200/60 text-slate-800 font-bold text-xs flex items-center justify-between transition-colors cursor-pointer group text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-2xs">
                      <Trophy className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">Hasil Per Cabang Lomba</div>
                      <div className="text-[10px] text-amber-900 font-normal">Executive board juara 1, 2, 3 per cabang</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-amber-700 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}
            </div>
          </div>

          {/* CEK BERKAS GOOGLE DRIVE KHUSUS */}
          <div className="bg-gradient-to-br from-slate-900 to-emerald-950 rounded-2xl p-5 text-white shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
              <FolderSync className="w-4 h-4" />
              <span>Verifikasi Berkas Google Drive</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isSuperAdmin
                ? 'Pilih kemantren untuk meninjau dokumen scan berkas (Akta) di Google Drive resmi.'
                : `Akses folder Google Drive khusus Rayon ${currentKemantren?.name} untuk mengunggah dan memverifikasi berkas santri.`}
            </p>

            {isSuperAdmin && (
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-semibold">Pilih Wilayah Rayon:</label>
                <select
                  value={selectedDriveKemantrenId}
                  onChange={(e) => setSelectedDriveKemantrenId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {kemantrenList.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.code} - Rayon {k.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <a
              href={activeDriveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              <span>Buka Folder Google Drive</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* TIMELINE & PENGUMUMAN PANITIA */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3.5">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-700" />
              Agenda & Timeline Resmi FASI XIII
            </h3>

            <div className="space-y-3 relative before:absolute before:inset-0 before:left-2 before:w-0.5 before:bg-slate-200">
              <div className="relative flex items-start gap-3 pl-6">
                <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-emerald-600 border-2 border-white shadow-2xs flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Pendaftaran & Input Biodata Santri</div>
                  <div className="text-[11px] text-emerald-700 font-semibold">Sedang Berlangsung</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Pengisian data santri dan penetapan cabang lomba oleh admin rayon.</div>
                </div>
              </div>

              <div className="relative flex items-start gap-3 pl-6">
                <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-teal-600 border-2 border-white shadow-2xs flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Batas Akhir Validasi & Berkas</div>
                  <div className="text-[11px] text-slate-600 font-semibold"> Oktober 2026</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Penutupan pendaftaran santri dan penguncian kuota kontingen.</div>
                </div>
              </div>

              <div className="relative flex items-start gap-3 pl-6">
                <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-amber-500 border-2 border-white shadow-2xs flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Technical Meeting & Undian Tampil</div>
                  <div className="text-[11px] text-slate-600 font-semibold"> Oktober 2026</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Pengundian nomor urut tampil secara transparan dan terpusat.</div>
                </div>
              </div>

              <div className="relative flex items-start gap-3 pl-6">
                <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-slate-400 border-2 border-white shadow-2xs flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Pelaksanaan FASI XIII Kota Yogyakarta</div>
                  <div className="text-[11px] text-slate-600 font-semibold">11 Oktober 2026</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Perlombaan di SMPN 1 Yogyakarta.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
