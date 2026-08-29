/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Rekap Peserta Superadmin & Kemantren
 * Format Kop Resmi, Tabel Standar FASI, Tanda Tangan Resmi, dan Ekspor .xlsx / Cetak A4
 */

import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Printer,
  FileSpreadsheet,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  CheckCircle2,
  Clock,
  Award,
} from 'lucide-react';
import { Participant, UserSession } from '../../types/fasi';
import { getStoredKemantren, getStoredCategories } from '../../utils/storage';
import { exportParticipantsToExcel } from '../../utils/excelExport';

const LOGO_BADKO_URL = 'https://gigluvvkswjaiwxpnqet.supabase.co/storage/v1/object/public/public-assets/logobadko.png';
const LOGO_FASI_URL = 'https://gigluvvkswjaiwxpnqet.supabase.co/storage/v1/object/public/public-assets/logofasi.png';

interface RekapPesertaAdminProps {
  session: UserSession;
  participants: Participant[];
  onViewSingleCard?: (p: Participant) => void;
}

export const RekapPesertaAdmin: React.FC<RekapPesertaAdminProps> = ({
  session,
  participants,
}) => {
  const kemantrenList = getStoredKemantren();
  const categoriesList = getStoredCategories();

  const isKemantrenAdmin = session?.role === 'kemantren_admin';
  const defaultKemantren = isKemantrenAdmin && session.kemantrenId ? session.kemantrenId : 'ALL';

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedKemantren, setSelectedKemantren] = useState<string>(defaultKemantren);
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedGender, setSelectedGender] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedAttendance, setSelectedAttendance] = useState<string>('ALL');

  // Pagination State (for screen preview only; print mode displays all filtered rows)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  const currentKemantrenObj = useMemo(() => {
    if (isKemantrenAdmin && session.kemantrenId) {
      return kemantrenList.find((k) => k.id === session.kemantrenId);
    }
    return null;
  }, [isKemantrenAdmin, session, kemantrenList]);

  // Base list of participants accessible to this session
  const accessibleParticipants = useMemo(() => {
    if (isKemantrenAdmin && session.kemantrenId) {
      return participants.filter((p) => p.kemantrenId === session.kemantrenId);
    }
    return participants;
  }, [participants, isKemantrenAdmin, session]);

  // Filtered List
  const filteredParticipants = useMemo(() => {
    return accessibleParticipants.filter((p) => {
      if (!isKemantrenAdmin && selectedKemantren !== 'ALL' && p.kemantrenId !== selectedKemantren) return false;
      if (selectedGender !== 'ALL' && p.gender !== selectedGender) return false;
      if (selectedStatus !== 'ALL' && p.status !== selectedStatus) return false;

      if (selectedAttendance !== 'ALL') {
        const isHadir = p.attendance === 'hadir' || p.attendance === 'siap_tampil' || p.attendance === 'sudah_tampil';
        if (selectedAttendance === 'hadir' && !isHadir) return false;
        if (selectedAttendance === 'belum' && isHadir) return false;
      }

      const cat = categoriesList.find((c) => c.id === p.categoryId);
      if (selectedLevel !== 'ALL' && cat?.level !== selectedLevel) return false;
      if (selectedCategory !== 'ALL' && p.categoryId !== selectedCategory) return false;

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const kem = kemantrenList.find((k) => k.id === p.kemantrenId);
        const match =
          p.fullName.toLowerCase().includes(term) ||
          p.registrationNumber.toLowerCase().includes(term) ||
          p.tpaUnitName.toLowerCase().includes(term) ||
          p.pjName.toLowerCase().includes(term) ||
          (kem && kem.name.toLowerCase().includes(term)) ||
          (cat && cat.name.toLowerCase().includes(term));
        if (!match) return false;
      }

      return true;
    });
  }, [
    accessibleParticipants,
    isKemantrenAdmin,
    selectedKemantren,
    selectedLevel,
    selectedCategory,
    selectedGender,
    selectedStatus,
    selectedAttendance,
    searchTerm,
    categoriesList,
    kemantrenList,
  ]);

  // Statistics
  const stats = useMemo(() => {
    const total = accessibleParticipants.length;
    const totalPutra = accessibleParticipants.filter((p) => p.gender === 'L').length;
    const totalPutri = accessibleParticipants.filter((p) => p.gender === 'P').length;
    const hadir = accessibleParticipants.filter(
      (p) => p.attendance === 'hadir' || p.attendance === 'siap_tampil' || p.attendance === 'sudah_tampil'
    ).length;
    const verified = accessibleParticipants.filter((p) => p.status === 'verified').length;

    return { total, totalPutra, totalPutri, hadir, verified };
  }, [accessibleParticipants]);

  // Kemantren distribution
  const kemantrenDistribution = useMemo(() => {
    return kemantrenList.map((kem) => {
      const count = participants.filter((p) => p.kemantrenId === kem.id).length;
      return {
        ...kem,
        participantCount: count,
      };
    });
  }, [kemantrenList, participants]);

  // Pagination for screen view
  const totalPages = Math.max(1, Math.ceil(filteredParticipants.length / pageSize));
  const paginatedScreenRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredParticipants.slice(start, start + pageSize);
  }, [filteredParticipants, currentPage, pageSize]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const prefix = isKemantrenAdmin
      ? `Daftar_Peserta_Kemantren_${currentKemantrenObj?.name || 'Kecamatan'}`
      : selectedKemantren !== 'ALL'
      ? `Daftar_Peserta_Kemantren_${kemantrenList.find((k) => k.id === selectedKemantren)?.name || 'Wilayah'}`
      : 'Daftar_Peserta_FASI_XIII_Yogyakarta';
    exportParticipantsToExcel(filteredParticipants, prefix);
  };

  const getCat = (catId: string) => categoriesList.find((c) => c.id === catId);
  const getKem = (kemId: string) => kemantrenList.find((k) => k.id === kemId);

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & SUMMARY STATS (SCREEN ONLY) */}
      {/* ========================================================================= */}
      <div className="no-print bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 font-extrabold text-[10px] uppercase tracking-wider rounded-md">
                {isKemantrenAdmin ? `Wilayah Kemantren ${currentKemantrenObj?.name || ''}` : 'BADKO TKA-TPA KOTA YOGYAKARTA'}
              </span>
              <span className="text-xs text-slate-500 font-medium">Buku Induk & Rekapitulasi</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mt-1">
              Daftar Peserta {isKemantrenAdmin ? `Kemantren ${currentKemantrenObj?.name || ''}` : 'FASI XIII'}
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Pratinjau data nominasi peserta, cetak dokumen resmi ukuran A4, dan unduh rekapan Microsoft Excel (.xlsx).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <button
              onClick={handleExportExcel}
              className="flex-1 md:flex-initial px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-300" />
              <span>Download Excel (.xlsx)</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex-1 md:flex-initial px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span>Cetak / Simpan PDF (A4)</span>
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Terdaftar</span>
            <span className="text-xl font-black text-slate-900">{stats.total}</span>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Putra (L)</span>
            <span className="text-xl font-black text-blue-900">{stats.totalPutra}</span>
          </div>
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-center">
            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">Putri (P)</span>
            <span className="text-xl font-black text-rose-900">{stats.totalPutri}</span>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Terverifikasi</span>
            <span className="text-xl font-black text-emerald-900">{stats.verified}</span>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Presensi Hadir</span>
            <span className="text-xl font-black text-amber-900">{stats.hadir}</span>
          </div>
        </div>

        {/* Kemantren Quick Filter Badges (Superadmin only) */}
        {!isKemantrenAdmin && (
          <div className="pt-2 border-t border-slate-100">
            <div className="text-[11px] font-bold text-slate-500 mb-2 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Filter Cepat Kemantren (14 Wilayah):</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {kemantrenDistribution.map((k) => (
                <button
                  key={k.id}
                  onClick={() => {
                    setSelectedKemantren(selectedKemantren === k.id ? 'ALL' : k.id);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    selectedKemantren === k.id
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span>{k.name}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full font-mono text-[9.5px] font-bold ${
                      selectedKemantren === k.id ? 'bg-amber-400 text-emerald-950' : 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    {k.participantCount}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. FILTER & SEARCH CONTROLS (SCREEN ONLY) */}
      {/* ========================================================================= */}
      <div className="no-print bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {/* Search */}
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari nama santri, no reg, TPA, PJ..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Filter Kemantren */}
          <div>
            <select
              disabled={isKemantrenAdmin}
              value={selectedKemantren}
              onChange={(e) => {
                setSelectedKemantren(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none cursor-pointer disabled:opacity-80 font-semibold"
            >
              {isKemantrenAdmin ? (
                <option value={session.kemantrenId || ''}>
                  Kemantren {currentKemantrenObj?.name}
                </option>
              ) : (
                <>
                  <option value="ALL">Semua Kemantren (14)</option>
                  {kemantrenList.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.name} ({k.code})
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          {/* Filter Level */}
          <div>
            <select
              value={selectedLevel}
              onChange={(e) => {
                setSelectedLevel(e.target.value);
                setSelectedCategory('ALL');
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Tingkat (TKA/TPA/TQA)</option>
              <option value="TKA">TKA (4-7 Tahun)</option>
              <option value="TPA">TPA (&gt;7-12 Tahun)</option>
              <option value="TQA">TQA (&gt;12-15 Tahun)</option>
            </select>
          </div>

          {/* Filter Gender */}
          <div>
            <select
              value={selectedGender}
              onChange={(e) => {
                setSelectedGender(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Gender</option>
              <option value="L">Putra (L)</option>
              <option value="P">Putri (P)</option>
            </select>
          </div>

          {/* Filter Kehadiran */}
          <div>
            <select
              value={selectedAttendance}
              onChange={(e) => {
                setSelectedAttendance(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Kehadiran</option>
              <option value="hadir">Hadir / Sudah Tampil</option>
              <option value="belum">Belum Hadir</option>
            </select>
          </div>
        </div>

        {/* Row count info & reset */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <div>
            Menampilkan <span className="font-bold text-slate-900">{filteredParticipants.length}</span> santri sesuai filter
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[11px] font-semibold text-slate-600">Tampilan per halaman:</label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="text-xs py-1 px-2 border border-slate-300 rounded-lg bg-slate-50"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={500}>Semua</option>
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. DOKUMEN RESMI A4 (SCREEN PREVIEW & PRINTABLE FORMAT) */}
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

        {/* JUDUL DOKUMEN */}
        <div className="text-center my-4">
          <h4 className="font-black text-sm sm:text-base text-slate-900 uppercase tracking-wide underline">
            Daftar Peserta FASI XIII
          </h4>
          <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mt-1">
            {selectedKemantren !== 'ALL'
              ? `KONTINGEN KEMANTREN ${getKem(selectedKemantren)?.name.toUpperCase()}`
              : 'GABUNGAN SELURUH 14 KEMANTREN KOTA YOGYAKARTA'}
          </p>
        </div>

        {/* ========================================================================= */}
        {/* TABEL DATA PESERTA (SCREEN VIEW - PAGINATED) */}
        {/* ========================================================================= */}
        <div className="no-print overflow-x-auto">
          <table className="w-full text-left text-[11px] border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                <th className="py-2.5 px-2 border border-slate-300 text-center w-8">No</th>
                <th className="py-2.5 px-2 border border-slate-300 w-28">No Registrasi</th>
                <th className="py-2.5 px-3 border border-slate-300">Nama lengkap</th>
                <th className="py-2.5 px-2 border border-slate-300 text-center w-12">L/P</th>
                <th className="py-2.5 px-3 border border-slate-300">Kemantren dan Asal TPA</th>
                <th className="py-2.5 px-3 border border-slate-300">Cabang Lomba</th>
                <th className="py-2.5 px-2 border border-slate-300 text-center w-20">Kehadiran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginatedScreenRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                    Tidak ada data peserta yang cocok dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                paginatedScreenRows.map((p, idx) => {
                  const cat = getCat(p.categoryId);
                  const kem = getKem(p.kemantrenId);
                  const rowNum = (currentPage - 1) * pageSize + idx + 1;
                  const isHadir =
                    p.attendance === 'hadir' || p.attendance === 'siap_tampil' || p.attendance === 'sudah_tampil';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2 px-2 border border-slate-300 text-center font-mono text-[10px] text-slate-600">
                        {rowNum}
                      </td>
                      <td className="py-2 px-2 border border-slate-300 font-mono font-bold text-[10.5px] text-emerald-950 whitespace-nowrap">
                        {p.registrationNumber}
                      </td>
                      <td className="py-2 px-3 border border-slate-300 font-bold text-slate-950">
                        {p.fullName}
                      </td>
                      <td className="py-2 px-2 border border-slate-300 text-center font-semibold">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold ${
                            p.gender === 'L' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                          }`}
                        >
                          {p.gender}
                        </span>
                      </td>
                      <td className="py-2 px-3 border border-slate-300 text-slate-800">
                        <div className="font-bold text-slate-900">Kemantren {kem?.name || p.kemantrenId}</div>
                        <div className="text-[10px] text-slate-600 font-medium">{p.tpaUnitName || '-'}</div>
                      </td>
                      <td className="py-2 px-3 border border-slate-300">
                        <span className="font-semibold text-emerald-950">{cat?.name || p.categoryId}</span>
                        {cat?.level && (
                          <span className="ml-1.5 text-[9px] px-1.5 py-0.2 bg-slate-100 border border-slate-200 rounded font-bold text-slate-700">
                            {cat.level}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2 border border-slate-300 text-center text-[10px]">
                        {isHadir ? (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Hadir</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">Belum</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ========================================================================= */}
        {/* TABEL DATA PESERTA (PRINT ONLY - FULL LIST SEMUA RECORD TANPA PAGINASI) */}
        {/* ========================================================================= */}
        <div className="hidden print:block">
          <table className="w-full text-left text-[9.5pt] border-collapse border border-slate-400">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400">
                <th className="py-1.5 px-2 border border-slate-400 text-center w-8">No</th>
                <th className="py-1.5 px-2 border border-slate-400 w-28">No Registrasi</th>
                <th className="py-1.5 px-2 border border-slate-400">Nama lengkap</th>
                <th className="py-1.5 px-1 border border-slate-400 text-center w-10">L/P</th>
                <th className="py-1.5 px-2 border border-slate-400">Kemantren dan Asal TPA</th>
                <th className="py-1.5 px-2 border border-slate-400">Cabang Lomba</th>
                <th className="py-1.5 px-2 border border-slate-400 text-center w-18">Kehadiran</th>
              </tr>
            </thead>
            <tbody>
              {filteredParticipants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500 italic">
                    Tidak ada data peserta.
                  </td>
                </tr>
              ) : (
                filteredParticipants.map((p, idx) => {
                  const cat = getCat(p.categoryId);
                  const kem = getKem(p.kemantrenId);
                  const isHadir =
                    p.attendance === 'hadir' || p.attendance === 'siap_tampil' || p.attendance === 'sudah_tampil';

                  return (
                    <tr key={p.id} className="border-b border-slate-300 break-inside-avoid">
                      <td className="py-1 px-1.5 border border-slate-400 text-center font-mono text-[8.5pt]">
                        {idx + 1}
                      </td>
                      <td className="py-1 px-1.5 border border-slate-400 font-mono font-bold text-[8.5pt] whitespace-nowrap">
                        {p.registrationNumber}
                      </td>
                      <td className="py-1 px-2 border border-slate-400 font-bold text-slate-900">
                        {p.fullName}
                      </td>
                      <td className="py-1 px-1 border border-slate-400 text-center font-bold">
                        {p.gender}
                      </td>
                      <td className="py-1 px-2 border border-slate-400">
                        <span className="font-bold">Kemantren {kem?.name || p.kemantrenId}</span>
                        {p.tpaUnitName && <span className="text-[8pt] text-slate-700 block">{p.tpaUnitName}</span>}
                      </td>
                      <td className="py-1 px-2 border border-slate-400">
                        <span className="font-semibold">{cat?.name || p.categoryId}</span>
                        {cat?.level && <span className="text-[7.5pt] ml-1 font-bold">({cat.level})</span>}
                      </td>
                      <td className="py-1 px-1.5 border border-slate-400 text-center font-semibold text-[8pt]">
                        {isHadir ? 'Hadir' : 'Belum'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ========================================================================= */}
        {/* TANDA TANGAN RESMI DI BAGIAN BAWAH */}
        {/* ========================================================================= */}
        <div className="mt-10 pt-4 grid grid-cols-2 gap-8 text-center text-xs break-inside-avoid">
          {/* Kiri: Ketua Umum BADKO TKA-TPA Kota */}
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

          {/* Kanan: Ketua Panitia FASI XIII */}
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

      {/* ========================================================================= */}
      {/* 4. PAGINATION CONTROLS (SCREEN ONLY) */}
      {/* ========================================================================= */}
      <div className="no-print bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <div>
          Halaman <span className="font-bold text-slate-900">{currentPage}</span> dari{' '}
          <span className="font-bold text-slate-900">{totalPages}</span> (Total {filteredParticipants.length} santri)
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title="Halaman Pertama"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title="Halaman Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-3 py-1.5 font-bold text-emerald-950 bg-emerald-100 rounded-lg">
            {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title="Halaman Selanjutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title="Halaman Terakhir"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
