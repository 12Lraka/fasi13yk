/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Rekap Peserta Superadmin (Fitur Search, Filter & Download PDF)
 * Khusus Hak Akses Super Administrator BADKO Kota Yogyakarta
 */

import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Printer,
  Download,
  Filter,
  ShieldAlert,
  Building2,
  Award,
  CheckCircle2,
  Clock,
  UserCheck,
  FileSpreadsheet,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  FileText
} from 'lucide-react';
import { Participant, UserSession } from '../../types/fasi';
import { getStoredKemantren, getStoredCategories, getStoredSettings } from '../../utils/storage';
import { exportParticipantsToExcel } from '../../utils/excelExport';

interface RekapPesertaAdminProps {
  session: UserSession;
  participants: Participant[];
  onViewSingleCard?: (p: Participant) => void;
}

export const RekapPesertaAdmin: React.FC<RekapPesertaAdminProps> = ({
  session,
  participants,
  onViewSingleCard,
}) => {
  const kemantrenList = getStoredKemantren();
  const categoriesList = getStoredCategories();
  const appSettings = getStoredSettings();

  const isKemantrenAdmin = session?.role === 'kemantren_admin';
  const defaultKemantren = isKemantrenAdmin && session.kemantrenId ? session.kemantrenId : 'ALL';

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedKemantren, setSelectedKemantren] = useState<string>(defaultKemantren);
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedGender, setSelectedGender] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [isPrintMode, setIsPrintMode] = useState<boolean>(false);

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
  }, [accessibleParticipants, isKemantrenAdmin, selectedKemantren, selectedLevel, selectedCategory, selectedGender, selectedStatus, searchTerm, categoriesList, kemantrenList]);

  // Statistics scoped to accessible participants
  const stats = useMemo(() => {
    const total = accessibleParticipants.length;
    const totalPutra = accessibleParticipants.filter((p) => p.gender === 'L').length;
    const totalPutri = accessibleParticipants.filter((p) => p.gender === 'P').length;

    const totalTka = accessibleParticipants.filter((p) => {
      const cat = categoriesList.find((c) => c.id === p.categoryId);
      return cat?.level === 'TKA';
    }).length;

    const totalTpa = accessibleParticipants.filter((p) => {
      const cat = categoriesList.find((c) => c.id === p.categoryId);
      return cat?.level === 'TPA';
    }).length;

    const totalTqa = accessibleParticipants.filter((p) => {
      const cat = categoriesList.find((c) => c.id === p.categoryId);
      return cat?.level === 'TQA';
    }).length;

    const verified = accessibleParticipants.filter((p) => p.status === 'verified').length;
    const scored = accessibleParticipants.filter((p) => p.averageScore !== undefined && p.averageScore > 0).length;

    return { total, totalPutra, totalPutri, totalTka, totalTpa, totalTqa, verified, scored };
  }, [accessibleParticipants, categoriesList]);

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

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredParticipants.length / pageSize));
  const paginated = useMemo(() => {
    if (isPrintMode) return filteredParticipants;
    const start = (currentPage - 1) * pageSize;
    return filteredParticipants.slice(start, start + pageSize);
  }, [filteredParticipants, currentPage, pageSize, isPrintMode]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const prefix = isKemantrenAdmin
      ? `Rekap_Santri_Kemantren_${currentKemantrenObj?.name || 'Kecamatan'}`
      : 'Rekap_Peserta_FASI_XIII_Yogyakarta';
    exportParticipantsToExcel(filteredParticipants, prefix);
  };

  const getCat = (catId: string) => categoriesList.find((c) => c.id === catId);
  const getKem = (kemId: string) => kemantrenList.find((k) => k.id === kemId);

  return (
    <div className="space-y-6">
      {/* 1. Header & Summary Stats */}
      <div className="no-print bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-[10px] uppercase tracking-wider rounded-md">
                {isKemantrenAdmin ? `Wilayah Kemantren ${currentKemantrenObj?.name || ''}` : 'Pusat FASI XIII Kota'}
              </span>
              <span className="text-xs text-slate-500 font-medium">Rekapitulasi Santri Resmi</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mt-1">
              Rekapitulasi Peserta {isKemantrenAdmin ? `Kemantren ${currentKemantrenObj?.name || ''}` : 'FASI XIII'}
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              {isKemantrenAdmin
                ? `Data rekapitulasi seluruh santri dan cabang lomba kontingen Kemantren ${currentKemantrenObj?.name || ''}.`
                : 'Daftar seluruh nominasi peserta dari 14 Kemantren se-Kota Yogyakarta dengan fitur filter cepat & ekspor dokumen.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={handleExportExcel}
              className="flex-1 md:flex-initial px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-400" />
              <span>Download Excel (.csv)</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex-1 md:flex-initial px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Printer className="w-4 h-4 text-emerald-800" />
              <span>Cetak / PDF</span>
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 pt-2">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Peserta</span>
            <span className="text-xl font-black text-slate-900">{stats.total}</span>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Putra (L)</span>
            <span className="text-xl font-black text-emerald-900">{stats.totalPutra}</span>
          </div>
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-center">
            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">Putri (P)</span>
            <span className="text-xl font-black text-rose-900">{stats.totalPutri}</span>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Tingkat TKA</span>
            <span className="text-xl font-black text-blue-900">{stats.totalTka}</span>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Tingkat TPA</span>
            <span className="text-xl font-black text-amber-900">{stats.totalTpa}</span>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-center">
            <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">Tingkat TQA</span>
            <span className="text-xl font-black text-purple-900">{stats.totalTqa}</span>
          </div>
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-center col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">Sudah Dinilai</span>
            <span className="text-xl font-black text-teal-900">{stats.scored}</span>
          </div>
        </div>

        {/* Kemantren Distribution Badges (Superadmin only) */}
        {!isKemantrenAdmin && (
          <div className="pt-2 border-t border-slate-100">
            <div className="text-[11px] font-bold text-slate-500 mb-2 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Sebaran Peserta per 14 Kemantren:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {kemantrenDistribution.map((k) => (
                <button
                  key={k.id}
                  onClick={() => setSelectedKemantren(selectedKemantren === k.id ? 'ALL' : k.id)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
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

      {/* 2. Filter & Search Controls */}
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
              placeholder="Cari nama, no reg, TPA, PJ..."
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

          {/* Filter Status */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="verified">Terverifikasi</option>
              <option value="pending">Pending Draft</option>
              <option value="rejected">Ditolak</option>
            </select>
          </div>
        </div>

        {/* Row count info & reset */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <div>
            Menampilkan <span className="font-bold text-slate-900">{filteredParticipants.length}</span> dari{' '}
            <span className="font-bold text-slate-900">{participants.length}</span> total santri
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[11px] font-semibold text-slate-600">Baris:</label>
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

      {/* 3. Printable / Screen Document View */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0">
        {/* Printable Official Kop Surat (Visible on print) */}
        <div className="border-b-2 border-slate-900 pb-4 mb-4 text-center space-y-1">
          <h2 className="font-extrabold text-base sm:text-lg text-slate-900 uppercase tracking-wide">
            BADAN KOORDINASI TKA-TPA (BADKO TKA-TPA) KOTA YOGYAKARTA
          </h2>
          <h3 className="font-bold text-xs sm:text-sm text-emerald-900 uppercase tracking-wider">
            PANITIA PELAKSANA {appSettings.eventName} {appSettings.eventSubtitle}
          </h3>
          <p className="text-[10px] sm:text-xs text-slate-600">
            Sekretariat: Kompleks Balai Kota Yogyakarta • Pelaksanaan: {appSettings.eventDate} di {appSettings.eventLocation}
          </p>
        </div>

        {/* Title */}
        <div className="text-center my-3">
          <h4 className="font-extrabold text-sm sm:text-base underline uppercase text-slate-900">
            BUKU INDUK REKAPITULASI NOMINASI PESERTA FASI XIII
          </h4>
          <p className="text-[11px] font-semibold text-slate-700 mt-0.5">
            {selectedKemantren !== 'ALL'
              ? `KONTINGEN KEMANTREN ${getKem(selectedKemantren)?.name.toUpperCase()}`
              : 'GABUNGAN SELURUH 14 KEMANTREN KOTA YOGYAKARTA'}
          </p>
        </div>

        {/* Table of Participants */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                <th className="py-2 px-2 border border-slate-300 text-center w-8">No</th>
                <th className="py-2 px-2 border border-slate-300 w-24">No. Registrasi</th>
                <th className="py-2 px-2 border border-slate-300 text-center w-12">Undian</th>
                <th className="py-2 px-3 border border-slate-300">Nama Lengkap Santri</th>
                <th className="py-2 px-2 border border-slate-300 text-center w-10">L/P</th>
                <th className="py-2 px-2 border border-slate-300 w-24">Kemantren</th>
                <th className="py-2 px-3 border border-slate-300">Unit TPA/TKA/TQA</th>
                <th className="py-2 px-3 border border-slate-300">Cabang Lomba</th>
                <th className="py-2 px-2 border border-slate-300 text-center w-16">Kehadiran</th>
                <th className="py-2 px-2 border border-slate-300 text-center w-14">Nilai</th>
                <th className="py-2 px-2 border border-slate-300 text-center w-16">Juara</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400 italic">
                    Tidak ada data santri yang cocok dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                paginated.map((p, idx) => {
                  const cat = getCat(p.categoryId);
                  const kem = getKem(p.kemantrenId);
                  const rowNum = (currentPage - 1) * pageSize + idx + 1;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-1.5 px-2 border border-slate-300 text-center font-mono text-[10px]">
                        {rowNum}
                      </td>
                      <td className="py-1.5 px-2 border border-slate-300 font-mono font-bold text-[10px] text-emerald-950 whitespace-nowrap">
                        {p.registrationNumber}
                      </td>
                      <td className="py-1.5 px-2 border border-slate-300 text-center font-mono font-bold text-[10px]">
                        {p.lotteryNumber ? (
                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 rounded font-black">
                            #{p.lotteryNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-1.5 px-3 border border-slate-300 font-bold text-slate-950">
                        {p.fullName}
                      </td>
                      <td className="py-1.5 px-2 border border-slate-300 text-center font-semibold">
                        <span
                          className={`px-1 rounded text-[9px] font-bold ${
                            p.gender === 'L' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                          }`}
                        >
                          {p.gender}
                        </span>
                      </td>
                      <td className="py-1.5 px-2 border border-slate-300 font-medium text-slate-800">
                        {kem?.name || p.kemantrenId}
                      </td>
                      <td className="py-1.5 px-3 border border-slate-300 text-slate-700 truncate max-w-[140px]">
                        {p.tpaUnitName}
                      </td>
                      <td className="py-1.5 px-3 border border-slate-300">
                        <span className="font-semibold text-emerald-900">{cat?.name || p.categoryId}</span>
                        <span className="ml-1 text-[9px] px-1 bg-slate-100 rounded text-slate-600 font-bold">
                          {cat?.level}
                        </span>
                      </td>
                      <td className="py-1.5 px-2 border border-slate-300 text-center text-[10px]">
                        {p.attendance === 'hadir' || p.attendance === 'siap_tampil' || p.attendance === 'sudah_tampil' ? (
                          <span className="text-emerald-700 font-bold">Hadir</span>
                        ) : (
                          <span className="text-slate-400">Belum</span>
                        )}
                      </td>
                      <td className="py-1.5 px-2 border border-slate-300 text-center font-mono font-bold text-[10px]">
                        {p.averageScore ? p.averageScore.toFixed(1) : '-'}
                      </td>
                      <td className="py-1.5 px-2 border border-slate-300 text-center text-[10px] font-bold">
                        {p.rank ? (
                          <span className="text-amber-700">Juara {p.rank}</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Printable Signature Block */}
        <div className="mt-8 pt-4 grid grid-cols-2 gap-8 text-center text-xs break-inside-avoid">
          <div>
            <p className="text-slate-500">Mengetahui,</p>
            <p className="font-bold text-slate-900 mt-1">Ketua Umum BADKO TKA-TPA Kota</p>
            <div className="h-16"></div>
            <p className="font-bold text-slate-900 underline">( .................................................. )</p>
          </div>
          <div>
            <p className="text-slate-500">Yogyakarta, 11 Oktober 2026</p>
            <p className="font-bold text-slate-900 mt-1">Ketua Panitia Pelaksana FASI XIII</p>
            <div className="h-16"></div>
            <p className="font-bold text-slate-900 underline">( .................................................. )</p>
          </div>
        </div>
      </div>

      {/* 4. Pagination Controls (Hidden on Print) */}
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
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
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
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
