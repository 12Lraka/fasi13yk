/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Modul Rekapitulasi Berita Acara & Laporan Nominasi Tetap Siap Cetak & Ekspor
 * Dilengkapi Filter Jenjang, Cabang Lomba, Jenis Kelamin (Putra/Putri/Grup), & Kemantren
 * Format Kop Surat Resmi FASI XIII, Tabel Standar Rayon & Unit TPA, Tanda Tangan Resmi, dan Ekspor PDF A4 / .xlsx
 */

import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Printer,
  FileSpreadsheet,
  Filter,
  Users,
  CheckCircle2,
  Download,
  Building2,
  Award,
  FileDown,
  Loader2,
} from 'lucide-react';
import { Participant, UserSession, CompetitionCategory, Kemantren } from '../../types/fasi';
import { getStoredKemantren, getStoredCategories } from '../../utils/storage';
import { exportParticipantsToExcel } from '../../utils/excelExport';
import { showToast } from '../../utils/sweetalert';
import { downloadSingleRecapPdf, downloadAllKemantrenRecapPdf } from '../../utils/recapPdfGenerator';

const LOGO_BADKO_URL = 'https://gigluvvkswjaiwxpnqet.supabase.co/storage/v1/object/public/public-assets/logobadko.png';
const LOGO_FASI_URL = 'https://gigluvvkswjaiwxpnqet.supabase.co/storage/v1/object/public/public-assets/logofasi.png';

interface RecapPrintViewProps {
  participants: Participant[];
  session: UserSession;
  onBack: () => void;
}

export const RecapPrintView: React.FC<RecapPrintViewProps> = ({
  participants,
  session,
  onBack,
}) => {
  const kemantrenList: Kemantren[] = getStoredKemantren();
  const categoriesList: CompetitionCategory[] = getStoredCategories();

  const isKemantrenAdmin = session.role === 'kemantren_admin' && Boolean(session.kemantrenId);
  const currentKemantren = isKemantrenAdmin
    ? kemantrenList.find((k) => k.id === session.kemantrenId)
    : null;

  // Filter States
  const [selectedKemantrenFilter, setSelectedKemantrenFilter] = useState<string>(
    isKemantrenAdmin && session.kemantrenId ? session.kemantrenId : 'ALL'
  );
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('ALL'); // ALL, TKA, TPA, TQA
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<string>('ALL'); // ALL, L, P, GROUP

  // PDF Export States
  const [isExportingSinglePdf, setIsExportingSinglePdf] = useState<boolean>(false);
  const [isExportingAllPdf, setIsExportingAllPdf] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number } | null>(null);

  // Filtered categories based on selected level
  const availableCategories = useMemo(() => {
    if (selectedLevelFilter === 'ALL') return categoriesList;
    return categoriesList.filter((c) => c.level === selectedLevelFilter);
  }, [categoriesList, selectedLevelFilter]);

  // Filtered participants
  const filteredParticipants = useMemo(() => {
    return participants.filter((p) => {
      // 1. Filter Kemantren
      if (isKemantrenAdmin && session.kemantrenId) {
        if (p.kemantrenId !== session.kemantrenId) return false;
      } else if (selectedKemantrenFilter !== 'ALL') {
        if (p.kemantrenId !== selectedKemantrenFilter) return false;
      }

      // Cari cabang lomba
      const cat = categoriesList.find((c) => c.id === p.categoryId);

      // 2. Filter Jenjang
      if (selectedLevelFilter !== 'ALL' && cat?.level !== selectedLevelFilter) {
        return false;
      }

      // 3. Filter Cabang Lomba
      if (selectedCategoryFilter !== 'ALL' && p.categoryId !== selectedCategoryFilter) {
        return false;
      }

      // 4. Filter Jenis Kelamin & Grup
      if (selectedGenderFilter === 'GROUP') {
        // Hanya cabang lomba beregu / grup
        if (!cat?.isGroup) return false;
      } else if (selectedGenderFilter === 'L') {
        if (p.gender !== 'L') return false;
      } else if (selectedGenderFilter === 'P') {
        if (p.gender !== 'P') return false;
      }

      return true;
    });
  }, [
    participants,
    categoriesList,
    isKemantrenAdmin,
    session,
    selectedKemantrenFilter,
    selectedLevelFilter,
    selectedCategoryFilter,
    selectedGenderFilter,
  ]);

  // Statistik Ringkas
  const stats = useMemo(() => {
    let putra = 0;
    let putri = 0;
    let group = 0;

    filteredParticipants.forEach((p) => {
      const cat = categoriesList.find((c) => c.id === p.categoryId);
      if (cat?.isGroup) {
        group += 1;
      }
      if (p.gender === 'L') putra += 1;
      if (p.gender === 'P') putri += 1;
    });

    return { total: filteredParticipants.length, putra, putri, group };
  }, [filteredParticipants, categoriesList]);

  const handlePrint = () => {
    window.focus();
    window.print();
  };

  const handleExportExcel = () => {
    const filename = `Rekap_Nominasi_FASI_XIII_${
      selectedKemantrenFilter !== 'ALL'
        ? kemantrenList.find((k) => k.id === selectedKemantrenFilter)?.name || 'Kemantren'
        : 'Kota_Yogyakarta'
    }`;
    exportParticipantsToExcel(filteredParticipants, filename);
    showToast('success', 'Data rekapitulasi berhasil diekspor ke format Excel (.xlsx)!');
  };

  const handleDownloadSinglePdf = async () => {
    try {
      setIsExportingSinglePdf(true);
      const selectedKemName = selectedKemantrenFilter !== 'ALL'
        ? kemantrenList.find((k) => k.id === selectedKemantrenFilter)?.name.toUpperCase()
        : 'SEMUA KONTINGEN 14 KEMANTREN KOTA YOGYAKARTA';

      const filterInfoParts: string[] = [];
      if (selectedLevelFilter !== 'ALL') filterInfoParts.push(`Jenjang ${selectedLevelFilter}`);
      if (selectedCategoryFilter !== 'ALL') {
        const cat = categoriesList.find((c) => c.id === selectedCategoryFilter);
        if (cat) filterInfoParts.push(cat.name);
      }
      if (selectedGenderFilter === 'GROUP') filterInfoParts.push('Kategori Beregu/Grup');
      else if (selectedGenderFilter === 'L') filterInfoParts.push('Khusus Putra');
      else if (selectedGenderFilter === 'P') filterInfoParts.push('Khusus Putri');

      await downloadSingleRecapPdf({
        titleSubtitle: {
          mainTitle: 'REKAPITULASI NOMINASI TETAP PESERTA LOMBA',
          subTitle: selectedKemantrenFilter !== 'ALL' ? `KONTINGEN KEMANTREN ${selectedKemName}` : selectedKemName,
          filterInfo: filterInfoParts.length > 0 ? `Filter: ${filterInfoParts.join(' • ')}` : undefined,
        },
        participants: filteredParticipants,
        categoriesList,
        kemantrenList,
        fileName: `Rekapitulasi_FASI_XIII_${selectedKemantrenFilter !== 'ALL' ? selectedKemName : 'Kota_Yogyakarta'}`,
      });
    } catch (err) {
      console.error('Error exporting recap PDF:', err);
    } finally {
      setIsExportingSinglePdf(false);
    }
  };

  const handleDownloadAllKemantrenPdf = async () => {
    try {
      setIsExportingAllPdf(true);
      await downloadAllKemantrenRecapPdf({
        kemantrenList,
        participants,
        categoriesList,
        onProgress: (current, total) => setExportProgress({ current, total }),
      });
    } catch (err) {
      console.error('Error exporting all kemantren recap PDF:', err);
    } finally {
      setIsExportingAllPdf(false);
      setExportProgress(null);
    }
  };

  const getCat = (catId: string) => categoriesList.find((c) => c.id === catId);
  const getKem = (kemId: string) => kemantrenList.find((k) => k.id === kemId);

  return (
    <div className="space-y-6">
      {/* Control Bar (Hidden on Print) */}
      <div className="no-print bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 mb-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Panel Admin</span>
            </button>
            <h2 className="text-xl font-black text-slate-900">
              Laporan Rekapitulasi Berita Acara & Nominasi Tetap
            </h2>
            <p className="text-xs text-slate-500">
              Dokumen resmi rekapitulasi peserta FASI XIII BADKO TKA-TPA Kota Yogyakarta.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Download Excel (.xlsx) */}
            <button
              onClick={handleExportExcel}
              className="flex-1 lg:flex-initial px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-300" />
              <span>Download Excel (.xlsx)</span>
            </button>

            {/* Download PDF (Halaman Ini) */}
            <button
              onClick={handleDownloadSinglePdf}
              disabled={isExportingSinglePdf || isExportingAllPdf}
              className="flex-1 lg:flex-initial px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              {isExportingSinglePdf ? (
                <Loader2 className="w-4 h-4 text-amber-300 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4 text-amber-300" />
              )}
              <span>Download PDF (Halaman Ini)</span>
            </button>

            {/* Download Semua PDF (14 Kemantren) */}
            {session.role === 'super_admin' && (
              <button
                onClick={handleDownloadAllKemantrenPdf}
                disabled={isExportingSinglePdf || isExportingAllPdf}
                className="flex-1 lg:flex-initial px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                {isExportingAllPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                    <span>
                      Proses ({exportProgress ? `${exportProgress.current}/${exportProgress.total}` : '...'})
                    </span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-white" />
                    <span>Download Semua PDF (14 Kemantren)</span>
                  </>
                )}
              </button>
            )}

            {/* Cetak Browser */}
            <button
              onClick={handlePrint}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 shadow-2xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
              title="Cetak Berita Acara (Ctrl+P)"
            >
              <Printer className="w-4 h-4 text-emerald-800" />
              <span>Cetak</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Filter 1: Kemantren */}
          <div>
            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
              Kontingen Kemantren:
            </label>
            <select
              value={selectedKemantrenFilter}
              onChange={(e) => setSelectedKemantrenFilter(e.target.value)}
              disabled={isKemantrenAdmin}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white disabled:opacity-60 cursor-pointer"
            >
              {!isKemantrenAdmin && <option value="ALL">Semua 14 Kemantren (Kota Yogyakarta)</option>}
              {kemantrenList.map((k) => (
                <option key={k.id} value={k.id}>
                  Kemantren {k.name} ({k.code})
                </option>
              ))}
            </select>
          </div>

          {/* Filter 2: Jenjang (Level) */}
          <div>
            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
              Jenjang Kategori:
            </label>
            <select
              value={selectedLevelFilter}
              onChange={(e) => {
                setSelectedLevelFilter(e.target.value);
                setSelectedCategoryFilter('ALL');
              }}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white cursor-pointer"
            >
              <option value="ALL">Semua Jenjang (TKA, TPA, TQA)</option>
              <option value="TKA">Jenjang TKA (Maks. 7 Th)</option>
              <option value="TPA">Jenjang TPA (Maks. 12 Th)</option>
              <option value="TQA">Jenjang TQA (Maks. 15 Th)</option>
            </select>
          </div>

          {/* Filter 3: Cabang Lomba */}
          <div>
            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
              Cabang Lomba:
            </label>
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white cursor-pointer truncate"
            >
              <option value="ALL">Semua Cabang Lomba</option>
              {availableCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  [{c.level}] {c.name} {c.isGroup ? '(Grup)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Filter 4: Gender / Grup */}
          <div>
            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
              Jenis Kelamin / Kategori:
            </label>
            <select
              value={selectedGenderFilter}
              onChange={(e) => setSelectedGenderFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white cursor-pointer"
            >
              <option value="ALL">Semua (Putra, Putri & Grup)</option>
              <option value="L">Khusus Putra (Laki-laki)</option>
              <option value="P">Khusus Putri (Perempuan)</option>
              <option value="GROUP">Khusus Beregu / Grup (Disatukan)</option>
            </select>
          </div>
        </div>

        {/* Info Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 rounded-lg font-bold">
            Total Terpilih: {stats.total} Santri
          </span>
          <span className="px-2.5 py-1 bg-blue-100 text-blue-900 rounded-lg font-semibold">
            Putra: {stats.putra} Santri
          </span>
          <span className="px-2.5 py-1 bg-pink-100 text-pink-900 rounded-lg font-semibold">
            Putri: {stats.putri} Santri
          </span>
          {stats.group > 0 && (
            <span className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-lg font-semibold">
              Kategori Grup: {stats.group} Santri
            </span>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DOKUMEN RESMI A4 (SCREEN PREVIEW & PRINTABLE FORMAT) */}
      {/* ========================================================================= */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm max-w-6xl mx-auto print:border-none print:shadow-none print:p-0 print:max-w-none">
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

        {/* JUDUL DOKUMEN & SUBJUDUL */}
        <div className="text-center my-4 space-y-0.5">
          <h4 className="font-extrabold text-sm sm:text-base underline uppercase text-slate-900">
            REKAPITULASI NOMINASI TETAP PESERTA LOMBA
          </h4>
          <p className="text-xs font-bold text-slate-800 uppercase">
            {selectedKemantrenFilter !== 'ALL'
              ? `KONTINGEN KEMANTREN ${kemantrenList.find((k) => k.id === selectedKemantrenFilter)?.name.toUpperCase()}`
              : 'SEMUA KONTINGEN 14 KEMANTREN KOTA YOGYAKARTA'}
          </p>
          {(selectedLevelFilter !== 'ALL' || selectedCategoryFilter !== 'ALL' || selectedGenderFilter !== 'ALL') && (
            <p className="text-[11px] text-slate-600 font-medium">
              Filter: {selectedLevelFilter !== 'ALL' ? `Jenjang ${selectedLevelFilter} • ` : ''}
              {selectedCategoryFilter !== 'ALL' ? `${getCat(selectedCategoryFilter)?.name} • ` : ''}
              {selectedGenderFilter === 'GROUP'
                ? 'Kategori Beregu/Grup'
                : selectedGenderFilter === 'L'
                ? 'Khusus Putra'
                : selectedGenderFilter === 'P'
                ? 'Khusus Putri'
                : 'Semua Kategori'}
            </p>
          )}
        </div>

        {/* TABEL DATA REKAPITULASI */}
        {/* Kolom: No, No. Registrasi, Nama Lengkap Santri, L/P, Tgl Lahir / Usia, Rayon & Unit TPA, Cabang Lomba, No. Undian */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse border border-slate-300 mt-4">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                <th className="border border-slate-300 py-2 px-2 text-center w-8">No</th>
                <th className="border border-slate-300 py-2 px-2 text-center w-28">No. Registrasi</th>
                <th className="border border-slate-300 py-2 px-2.5">Nama Lengkap Santri</th>
                <th className="border border-slate-300 py-2 px-2 text-center w-10">L/P</th>
                <th className="border border-slate-300 py-2 px-2 text-center">Tgl Lahir / Usia</th>
                <th className="border border-slate-300 py-2 px-2.5">Rayon & Unit TPA</th>
                <th className="border border-slate-300 py-2 px-2.5">Cabang Lomba</th>
                <th className="border border-slate-300 py-2 px-2 text-center w-16">No. Undian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredParticipants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="border border-slate-300 py-6 text-center text-slate-400 italic">
                    Tidak ada peserta yang memenuhi kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredParticipants.map((p, idx) => {
                  const cat = getCat(p.categoryId);
                  const kem = getKem(p.kemantrenId);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="border border-slate-300 py-1.5 px-2 text-center font-mono text-[11px] text-slate-600">
                        {idx + 1}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2 font-mono font-bold text-[11px] text-emerald-950 text-center whitespace-nowrap">
                        {p.registrationNumber}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2.5 font-bold text-slate-950">
                        {p.fullName}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2 text-center font-bold">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            p.gender === 'L' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                          }`}
                        >
                          {p.gender}
                        </span>
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2 text-center text-[11px] text-slate-700">
                        <div>{p.birthDate || '-'}</div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          ({p.ageOnCutoff.years}th {p.ageOnCutoff.months}bln)
                        </div>
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2.5 text-slate-800">
                        <div className="font-bold text-slate-900">Kem. {kem?.name || p.kemantrenId}</div>
                        {p.tpaUnitName && (
                          <div className="text-[10px] text-slate-600 font-medium">{p.tpaUnitName}</div>
                        )}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2.5 font-medium text-slate-900">
                        <span className="font-bold text-emerald-950">[{cat?.level}]</span> {cat?.name} {cat?.isGroup ? '(Grup)' : ''}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2 text-center">
                        {p.lotteryNumber ? (
                          <span className="px-1.5 py-0.5 bg-amber-400 text-emerald-950 font-black rounded text-[11px] shadow-2xs font-mono">
                            {String(p.lotteryNumber).padStart(2, '0')}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">-</span>
                        )}
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
