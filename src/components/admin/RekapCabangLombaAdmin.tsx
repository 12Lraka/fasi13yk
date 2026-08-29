/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Rekapitulasi Cabang Lomba (Fitur Search, Filter Tingkat/Kategori, & Download PDF / Excel .xlsx Resmi A4 Satuan/Semua)
 * Memuat Format Kop Resmi FASI XIII, Tabel Standar Penilaian, dan Tanda Tangan Resmi
 */

import React, { useState, useMemo } from 'react';
import {
  Award,
  Search,
  Printer,
  Download,
  Filter,
  Users,
  CheckCircle2,
  Building2,
  Sparkles,
  Trophy,
  Dices,
  Layers,
  ChevronDown,
  FileDown,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react';
import { Participant, UserSession, CompetitionCategory } from '../../types/fasi';
import { getStoredKemantren, getStoredCategories } from '../../utils/storage';
import { downloadSingleBranchPdf, downloadAllBranchesPdf } from '../../utils/branchPdfGenerator';
import { exportBranchToExcel } from '../../utils/branchExcelExport';

const LOGO_BADKO_URL = 'https://gigluvvkswjaiwxpnqet.supabase.co/storage/v1/object/public/public-assets/logobadko.png';
const LOGO_FASI_URL = 'https://gigluvvkswjaiwxpnqet.supabase.co/storage/v1/object/public/public-assets/logofasi.png';

interface RekapCabangLombaAdminProps {
  session: UserSession;
  participants: Participant[];
  onOpenJudgingModal?: (p: Participant) => void;
}

export const RekapCabangLombaAdmin: React.FC<RekapCabangLombaAdminProps> = ({
  session,
  participants,
}) => {
  const kemantrenList = getStoredKemantren();
  const categoriesList = getStoredCategories();

  const isSuperAdmin = session.role === 'super_admin';
  const myKemantren = kemantrenList.find((k) => k.id === session.kemantrenId);

  // Filters
  const [selectedLevel, setSelectedLevel] = useState<'ALL' | 'TKA' | 'TPA' | 'TQA'>('TPA');
  const [selectedCategoryCode, setSelectedCategoryCode] = useState<string>('cat-tpa-1');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Loading States for PDF Download
  const [isExportingSingle, setIsExportingSingle] = useState<boolean>(false);
  const [isExportingAll, setIsExportingAll] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number } | null>(null);

  // Available categories based on selectedLevel
  const levelCategories = useMemo(() => {
    if (selectedLevel === 'ALL') return categoriesList;
    return categoriesList.filter((c) => c.level === selectedLevel);
  }, [categoriesList, selectedLevel]);

  // Ensure active category is valid when level changes
  const activeCategory: CompetitionCategory = useMemo(() => {
    const found = categoriesList.find((c) => c.id === selectedCategoryCode);
    if (found) return found;
    return levelCategories[0] || categoriesList[0];
  }, [categoriesList, selectedCategoryCode, levelCategories]);

  // Participants in active category (filtered by role)
  const branchParticipants = useMemo(() => {
    const inCat = isSuperAdmin
      ? participants.filter((p) => p.categoryId === activeCategory.id)
      : participants.filter((p) => p.categoryId === activeCategory.id && p.kemantrenId === session.kemantrenId);
    
    // Sort by: Lottery Number if available, then Registration Number
    return inCat.sort((a, b) => {
      if (a.lotteryNumber && b.lotteryNumber) return a.lotteryNumber - b.lotteryNumber;
      if (a.lotteryNumber) return -1;
      if (b.lotteryNumber) return 1;
      return a.registrationNumber.localeCompare(b.registrationNumber);
    });
  }, [participants, activeCategory, isSuperAdmin, session.kemantrenId]);

  // Filtered by Search
  const filteredParticipants = useMemo(() => {
    if (!searchTerm) return branchParticipants;
    const term = searchTerm.toLowerCase();
    return branchParticipants.filter((p) => {
      const kem = kemantrenList.find((k) => k.id === p.kemantrenId);
      return (
        p.fullName.toLowerCase().includes(term) ||
        p.registrationNumber.toLowerCase().includes(term) ||
        p.tpaUnitName.toLowerCase().includes(term) ||
        (kem && kem.name.toLowerCase().includes(term))
      );
    });
  }, [branchParticipants, searchTerm, kemantrenList]);

  // Kemantren quota analysis for Superadmin
  const kemantrenQuotaStatus = useMemo(() => {
    return kemantrenList.map((kem) => {
      const registered = participants.filter(
        (p) => p.kemantrenId === kem.id && p.categoryId === activeCategory.id
      );
      const isFilled = registered.length > 0;
      return {
        ...kem,
        count: registered.length,
        isFilled,
        participants: registered,
      };
    });
  }, [kemantrenList, participants, activeCategory]);

  const filledCount = kemantrenQuotaStatus.filter((k) => k.isFilled).length;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadSinglePdf = async () => {
    try {
      setIsExportingSingle(true);
      await downloadSingleBranchPdf(activeCategory, participants, kemantrenList);
    } catch (err) {
      console.error('Error exporting single branch PDF:', err);
    } finally {
      setIsExportingSingle(false);
    }
  };

  const handleDownloadAllPdf = async () => {
    try {
      setIsExportingAll(true);
      const targetCategories = selectedLevel === 'ALL'
        ? categoriesList
        : categoriesList.filter((c) => c.level === selectedLevel);

      await downloadAllBranchesPdf({
        categories: targetCategories,
        participants,
        kemantrenList,
        onProgress: (current, total) => setExportProgress({ current, total }),
      });
    } catch (err) {
      console.error('Error exporting all branches PDF:', err);
    } finally {
      setIsExportingAll(false);
      setExportProgress(null);
    }
  };

  const handleExportExcel = () => {
    exportBranchToExcel({
      category: activeCategory,
      participants,
      kemantrenList,
    });
  };

  const getKem = (kemId: string) => kemantrenList.find((k) => k.id === kemId);

  return (
    <div className="space-y-6">
      {/* 1. FILTER & CONTROLS HEADER (SCREEN ONLY) */}
      <div className="no-print bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-950 border border-emerald-300 font-extrabold text-[10px] uppercase tracking-wider rounded-md">
                {isSuperAdmin
                  ? 'BADKO TKA-TPA KOTA YOGYAKARTA'
                  : `Kemantren ${myKemantren?.name || ''}`}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Rekapitulasi Cabang Lomba & Berita Acara
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mt-1">
              Rekapitulasi Peserta Cabang Lomba FASI XIII
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Pratinjau nomor undian, nama santri, asal TPA, form penilaian dewan hakim, dan unduh berkas PDF resmi A4 / Excel (.xlsx).
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Download Excel (.xlsx) */}
            <button
              onClick={handleExportExcel}
              className="flex-1 md:flex-initial px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-300" />
              <span>Download Excel (.xlsx)</span>
            </button>

            {/* Download 1 Cabang PDF */}
            <button
              onClick={handleDownloadSinglePdf}
              disabled={isExportingSingle || isExportingAll}
              className="flex-1 md:flex-initial px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              {isExportingSingle ? (
                <Loader2 className="w-4 h-4 text-amber-300 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4 text-amber-300" />
              )}
              <span>Download PDF (Cabang Ini)</span>
            </button>

            {/* Download Semua Cabang PDF */}
            <button
              onClick={handleDownloadAllPdf}
              disabled={isExportingSingle || isExportingAll}
              className="flex-1 md:flex-initial px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              {isExportingAll ? (
                <>
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                  <span>
                    Proses ({exportProgress ? `${exportProgress.current}/${exportProgress.total}` : '...'})
                  </span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-white" />
                  <span>
                    Download Semua PDF {selectedLevel !== 'ALL' ? `(${selectedLevel})` : '(Semua)'}
                  </span>
                </>
              )}
            </button>

            {/* Cetak Browser */}
            <button
              onClick={handlePrint}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 shadow-2xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
              title="Cetak Halaman Ini"
            >
              <Printer className="w-4 h-4 text-emerald-800" />
              <span>Cetak</span>
            </button>
          </div>
        </div>

        {/* Level Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
          {(['ALL', 'TKA', 'TPA', 'TQA'] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => {
                setSelectedLevel(lvl);
                const firstInLvl = lvl === 'ALL' ? categoriesList[0] : categoriesList.find((c) => c.level === lvl);
                if (firstInLvl) setSelectedCategoryCode(firstInLvl.id);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedLevel === lvl
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {lvl === 'ALL' ? 'Semua Tingkat' : `Tingkat ${lvl}`}
            </button>
          ))}
        </div>

        {/* Category Selector & Search Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Cabang Lomba Dropdown */}
          <div className="md:col-span-8">
            <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
              Pilih Cabang Lomba:
            </label>
            <select
              value={activeCategory.id}
              onChange={(e) => setSelectedCategoryCode(e.target.value)}
              className="w-full py-2.5 px-3 text-xs font-bold text-emerald-950 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none cursor-pointer"
            >
              {levelCategories.map((cat) => {
                const countInCat = isSuperAdmin
                  ? participants.filter((p) => p.categoryId === cat.id).length
                  : participants.filter((p) => p.categoryId === cat.id && p.kemantrenId === session.kemantrenId).length;
                return (
                  <option key={cat.id} value={cat.id}>
                    [{cat.code}] {cat.name} ({cat.level}) {countInCat > 0 ? `— (${countInCat} Santri)` : '— (Kosong)'}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Search within this branch */}
          <div className="md:col-span-4">
            <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
              Cari Peserta di Cabang Ini:
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama santri, regis, TPA..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Active Branch Info Card */}
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-emerald-800 text-white font-mono font-bold text-[10px] rounded-md">
                {activeCategory.code}
              </span>
              <span className="px-2 py-0.5 bg-amber-400 text-emerald-950 font-bold text-[10px] rounded-md">
                Tingkat {activeCategory.level}
              </span>
              <span className="text-xs font-semibold text-emerald-900">
                {activeCategory.isGroup ? `Beregu (${activeCategory.groupMemberCount || 3} Orang)` : 'Individu'}
              </span>
            </div>
            <h3 className="text-base font-extrabold text-emerald-950">
              {activeCategory.name}
            </h3>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white px-3.5 py-2 rounded-xl border border-emerald-200 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Partisipasi</span>
              <span className="text-sm font-black text-emerald-950">
                {filledCount} / {kemantrenList.length} Kemantren
              </span>
            </div>
            <div className="bg-white px-3.5 py-2 rounded-xl border border-emerald-200 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Peserta</span>
              <span className="text-sm font-black text-amber-600">
                {branchParticipants.length} Santri
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DOKUMEN RESMI A4 (SCREEN PREVIEW & PRINTABLE FORMAT) */}
      {/* ========================================================================= */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0 print:m-0">
        {/* KOP SURAT RESMI FASI XIII */}
        <div className="pb-3 border-b-2 border-slate-900 space-y-1">
          <div className="flex items-center justify-between gap-4">
            {/* Logo Kiri: BADKO */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center">
              <img
                src={LOGO_BADKO_URL}
                alt="Logo Badko TKA-TPA"
                crossOrigin="anonymous"
                className="max-h-full max-w-full object-contain"
              />
            </div>

            {/* Teks Kop Tengah */}
            <div className="text-center flex-1 px-2">
              <h2 className="font-extrabold text-xs sm:text-base md:text-lg text-slate-900 uppercase tracking-wide leading-tight">
                FESTIVAL ANAK SHOLEH INDONESIA XIII
              </h2>
              <h3 className="font-black text-xs sm:text-sm md:text-base text-emerald-950 uppercase tracking-wider leading-tight mt-0.5">
                BADKO TKA-TPA KOTA YOGYAKARTA
              </h3>
              <p className="text-[8.5px] sm:text-[10px] md:text-[11px] text-slate-700 font-medium leading-tight mt-1">
                Sekretariat : Jln. Kenari No. 56 Muja Muju, Umbulharjo, Kota Yogyakarta | Telp. 085179928551 / 085647392525
              </p>
            </div>

            {/* Logo Kanan: FASI */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center">
              <img
                src={LOGO_FASI_URL}
                alt="Logo FASI XIII"
                crossOrigin="anonymous"
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </div>

          {/* Garis Ganda Kop Surat */}
          <div className="pt-1">
            <div className="w-full h-[1px] bg-slate-900" />
          </div>
        </div>

        {/* JUDUL DOKUMEN & NAMA CABANG LOMBA */}
        <div className="text-center my-4 space-y-1">
          <h4 className="font-black text-sm sm:text-base text-slate-900 uppercase tracking-wide underline">
            REKAPITULASI PESERTA CABANG LOMBA
          </h4>
          <p className="text-xs sm:text-sm font-black text-emerald-950 uppercase tracking-wider">
            CABANG: [{activeCategory.code}] {activeCategory.name} — TINGKAT {activeCategory.level}
          </p>
        </div>

        {/* TABEL DATA REKAPITULASI CABANG LOMBA */}
        {/* Kolom: No, Undian, No Registrasi, Nama Lengkap, L/P, Rayon & Unit TPA, Juri I, Juri II, Total Nilai */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                <th className="py-2.5 px-2 border border-slate-300 text-center w-8">No</th>
                <th className="py-2.5 px-2 border border-slate-300 text-center w-14">Undian</th>
                <th className="py-2.5 px-2 border border-slate-300 text-center w-28">No Registrasi</th>
                <th className="py-2.5 px-3 border border-slate-300">Nama Lengkap</th>
                <th className="py-2.5 px-1.5 border border-slate-300 text-center w-10">L/P</th>
                <th className="py-2.5 px-3 border border-slate-300">Rayon & Unit TPA</th>
                <th className="py-2.5 px-2 border border-slate-300 text-center w-14">Juri I</th>
                <th className="py-2.5 px-2 border border-slate-300 text-center w-14">Juri II</th>
                <th className="py-2.5 px-2 border border-slate-300 text-center w-16">Total Nilai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredParticipants.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 italic">
                    Belum ada santri terdaftar pada cabang lomba ini.
                  </td>
                </tr>
              ) : (
                filteredParticipants.map((p, idx) => {
                  const kem = getKem(p.kemantrenId);
                  const totalNilai = p.averageScore != null
                    ? p.averageScore.toFixed(2)
                    : ((p.scoreJury1 || 0) + (p.scoreJury2 || 0)) > 0
                    ? String((p.scoreJury1 || 0) + (p.scoreJury2 || 0))
                    : '';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2 px-2 border border-slate-300 text-center font-mono text-[11px] text-slate-600">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-2 border border-slate-300 text-center">
                        {p.lotteryNumber ? (
                          <span className="px-1.5 py-0.5 bg-amber-400 text-emerald-950 font-black rounded text-[11px] shadow-2xs">
                            {String(p.lotteryNumber).padStart(2, '0')}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">-</span>
                        )}
                      </td>
                      <td className="py-2 px-2 border border-slate-300 font-mono font-bold text-[11px] text-emerald-950 text-center whitespace-nowrap">
                        {p.registrationNumber}
                      </td>
                      <td className="py-2 px-3 border border-slate-300 font-bold text-slate-950">
                        {p.fullName}
                      </td>
                      <td className="py-2 px-1.5 border border-slate-300 text-center font-bold text-[10px]">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            p.gender === 'L' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                          }`}
                        >
                          {p.gender}
                        </span>
                      </td>
                      <td className="py-2 px-3 border border-slate-300 text-slate-800">
                        <div className="font-bold text-slate-900">Kem. {kem?.name || p.kemantrenId}</div>
                        {p.tpaUnitName && (
                          <div className="text-[10px] text-slate-600 font-medium">{p.tpaUnitName}</div>
                        )}
                      </td>
                      <td className="py-2 px-2 border border-slate-300 text-center font-mono text-[11px] text-slate-700">
                        {p.scoreJury1 != null ? p.scoreJury1 : ''}
                      </td>
                      <td className="py-2 px-2 border border-slate-300 text-center font-mono text-[11px] text-slate-700">
                        {p.scoreJury2 != null ? p.scoreJury2 : ''}
                      </td>
                      <td className="py-2 px-2 border border-slate-300 text-center font-mono font-bold text-[11px] text-emerald-950">
                        {totalNilai}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* BLOK TANDA TANGAN RESMI DI BAGIAN BAWAH DOKUMEN */}
        <div className="mt-10 pt-4 grid grid-cols-2 gap-8 text-center text-xs break-inside-avoid">
          {/* Sisi Kiri: Ketua Umum BADKO TKA-TPA Kota */}
          <div className="flex flex-col items-center justify-between min-h-[100px]">
            <div>
              <p className="text-slate-600 font-medium">Mengetahui,</p>
              <p className="font-bold text-slate-900 mt-0.5">Ketua Umum BADKO TKA-TPA Kota</p>
            </div>
            <div className="mt-14">
              <p className="font-extrabold text-slate-950 underline tracking-wide text-xs sm:text-sm">
                Dicky Artanto, S.Pd., M.Pd.
              </p>
            </div>
          </div>

          {/* Sisi Kanan: Ketua Panitia FASI XIII */}
          <div className="flex flex-col items-center justify-between min-h-[100px]">
            <div>
              <p className="text-slate-600 font-medium">
                Yogyakarta, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <p className="font-bold text-slate-900 mt-0.5">Ketua Panitia FASI XIII</p>
            </div>
            <div className="mt-14">
              <p className="font-extrabold text-slate-950 underline tracking-wide text-xs sm:text-sm">
                Andry Sunny, S.E.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
