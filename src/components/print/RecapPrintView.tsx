/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Modul Rekapitulasi Berita Acara & Laporan Nominasi Tetap Siap Cetak
 * Dilengkapi Filter Jenjang, Cabang Lomba, Jenis Kelamin (Putra/Putri/Grup), & Kemantren
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
} from 'lucide-react';
import { Participant, UserSession, CompetitionCategory, Kemantren } from '../../types/fasi';
import { getStoredKemantren, getStoredCategories } from '../../utils/storage';
import { exportParticipantsToExcel } from '../../utils/excelExport';
import { showToast } from '../../utils/sweetalert';

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
    showToast('success', 'Data rekapitulasi berhasil diekspor ke format Excel!');
  };

  const getCat = (catId: string) => categoriesList.find((c) => c.id === catId);
  const getKem = (kemId: string) => kemantrenList.find((k) => k.id === kemId);

  return (
    <div className="space-y-6">
      {/* Control Bar (Hidden on Print) */}
      <div className="no-print bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
              Dokumen resmi rekapitulasi peserta FASI XIII Kota Yogyakarta 2026.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>Ekspor Excel</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Cetak Berita Acara (Ctrl+P)</span>
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

      {/* Official Printable Report Document */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-6xl mx-auto print:border-none print:shadow-none print:p-0 print:max-w-none">
        {/* Official Kop Surat */}
        <div className="border-b-2 border-slate-900 pb-3 mb-5 text-center space-y-1">
          <h2 className="font-extrabold text-base sm:text-lg text-slate-900 uppercase tracking-wide">
            BADAN KOORDINASI TKA-TPA (BADKO TKA-TPA) KOTA YOGYAKARTA
          </h2>
          <h3 className="font-bold text-xs sm:text-sm text-emerald-900 uppercase tracking-wider">
            PANITIA PELAKSANA FESTIVAL ANAK SHOLEH INDONESIA (FASI) XIII TAHUN 2026
          </h3>
          <p className="text-[11px] text-slate-600">
            Sekretariat: Kompleks Masjid Diponegoro, Balaikota Yogyakarta • Pelaksanaan: Ahad, 11 Oktober 2026 di SMPN 1 Yogyakarta
          </p>
        </div>

        {/* Title */}
        <div className="text-center my-4 space-y-0.5">
          <h4 className="font-extrabold text-sm sm:text-base underline uppercase text-slate-900">
            REKAPITULASI NOMINASI TETAP PESERTA LOMBA
          </h4>
          <p className="text-xs font-bold text-slate-800">
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

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse border border-slate-400 mt-4">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-bold">
                <th className="border border-slate-400 py-2 px-2 text-center w-8">No</th>
                <th className="border border-slate-400 py-2 px-2 w-28">No. Registrasi</th>
                <th className="border border-slate-400 py-2 px-2.5">Nama Lengkap Santri</th>
                <th className="border border-slate-400 py-2 px-2 text-center w-10">L/P</th>
                <th className="border border-slate-400 py-2 px-2">Tgl Lahir / Usia</th>
                <th className="border border-slate-400 py-2 px-2.5">Kemantren & Unit TPA</th>
                <th className="border border-slate-400 py-2 px-2.5">Cabang Lomba</th>
                <th className="border border-slate-400 py-2 px-2 text-center w-16">No. Undian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {filteredParticipants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="border border-slate-400 py-6 text-center text-slate-400 italic">
                    Tidak ada peserta yang memenuhi kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredParticipants.map((p, idx) => {
                  const cat = getCat(p.categoryId);
                  const kem = getKem(p.kemantrenId);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="border border-slate-400 py-1.5 px-2 text-center">{idx + 1}</td>
                      <td className="border border-slate-400 py-1.5 px-2 font-mono font-bold text-[11px]">
                        {p.registrationNumber}
                      </td>
                      <td className="border border-slate-400 py-1.5 px-2.5 font-semibold text-slate-900">
                        {p.fullName}
                      </td>
                      <td className="border border-slate-400 py-1.5 px-2 text-center font-bold">
                        {p.gender}
                      </td>
                      <td className="border border-slate-400 py-1.5 px-2 text-[11px]">
                        {p.birthDate} ({p.ageOnCutoff.years}th {p.ageOnCutoff.months}bln)
                      </td>
                      <td className="border border-slate-400 py-1.5 px-2.5">
                        Kem. {kem?.name} - {p.tpaUnitName}
                      </td>
                      <td className="border border-slate-400 py-1.5 px-2.5 font-medium">
                        [{cat?.level}] {cat?.name} {cat?.isGroup ? '(Grup)' : ''}
                      </td>
                      <td className="border border-slate-400 py-1.5 px-2 text-center font-mono font-bold">
                        {p.lotteryNumber ? String(p.lotteryNumber).padStart(2, '0') : '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Tanda Tangan */}
        <div className="grid grid-cols-2 gap-8 mt-10 text-xs text-center text-slate-900">
          <div>
            <p>Mengetahui,</p>
            <p className="font-bold">Ketua Umum BADKO TKA-TPA Kota Yogyakarta</p>
            <div className="h-16"></div>
            <p className="font-bold underline">( H. Muhammad Anis, S.Pd.I )</p>
          </div>
          <div>
            <p>Yogyakarta, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="font-bold">
              {selectedKemantrenFilter !== 'ALL'
                ? `Ketua Kontingen Kemantren ${kemantrenList.find((k) => k.id === selectedKemantrenFilter)?.name}`
                : 'Ketua Panitia Pelaksana FASI XIII'}
            </p>
            <div className="h-16"></div>
            <p className="font-bold underline">
              ( {selectedKemantrenFilter !== 'ALL'
                ? kemantrenList.find((k) => k.id === selectedKemantrenFilter)?.adminName || 'Ketua Kontingen'
                : 'Ust. H. Rahmat Hidayat, M.S.I'} )
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
