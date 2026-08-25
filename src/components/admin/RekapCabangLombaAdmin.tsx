/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Rekapitulasi Cabang Lomba (Fitur Search, Filter Tingkat/Kategori, & Download PDF)
 * Memuat Berita Acara dan Daftar Peserta per Cabang Lomba
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
  ChevronDown
} from 'lucide-react';
import { Participant, UserSession, CompetitionCategory } from '../../types/fasi';
import { getStoredKemantren, getStoredCategories, getStoredSettings } from '../../utils/storage';

interface RekapCabangLombaAdminProps {
  session: UserSession;
  participants: Participant[];
  onOpenJudgingModal?: (p: Participant) => void;
}

export const RekapCabangLombaAdmin: React.FC<RekapCabangLombaAdminProps> = ({
  session,
  participants,
  onOpenJudgingModal,
}) => {
  const kemantrenList = getStoredKemantren();
  const categoriesList = getStoredCategories();
  const appSettings = getStoredSettings();

  const isSuperAdmin = session.role === 'super_admin';
  const myKemantren = kemantrenList.find((k) => k.id === session.kemantrenId);

  // Filters
  const [selectedLevel, setSelectedLevel] = useState<'ALL' | 'TKA' | 'TPA' | 'TQA'>('TPA');
  const [selectedCategoryCode, setSelectedCategoryCode] = useState<string>('cat-tpa-1');
  const [searchTerm, setSearchTerm] = useState<string>('');

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

  // All participants for this Kemantren (for summary stats)
  const myKemantrenParticipants = useMemo(() => {
    if (isSuperAdmin) return participants;
    return participants.filter((p) => p.kemantrenId === session.kemantrenId);
  }, [participants, session.kemantrenId, isSuperAdmin]);

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

  // Category Participation Status for Kemantren Admin
  const kemantrenCategoryStatus = useMemo(() => {
    return levelCategories.map((cat) => {
      const registered = participants.filter(
        (p) => p.kemantrenId === session.kemantrenId && p.categoryId === cat.id
      );
      return {
        cat,
        count: registered.length,
        isRegistered: registered.length > 0,
        participants: registered,
      };
    });
  }, [levelCategories, participants, session.kemantrenId]);

  const filledCount = kemantrenQuotaStatus.filter((k) => k.isFilled).length;
  const myFilledCategoriesCount = kemantrenCategoryStatus.filter((c) => c.isRegistered).length;

  const handlePrint = () => {
    window.print();
  };

  const getKem = (kemId: string) => kemantrenList.find((k) => k.id === kemId);

  return (
    <div className="space-y-6">
      {/* 1. Filter Control Header */}
      <div className="no-print bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-950 border border-emerald-300 font-extrabold text-[10px] uppercase tracking-wider rounded-md">
                {isSuperAdmin
                  ? 'Rekapitulasi Majelis / Cabang Lomba'
                  : `Rekap Cabang Lomba Kemantren ${myKemantren?.name || ''}`}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {isSuperAdmin ? 'Berita Acara & Nilai Juri' : 'Daftar Santri & Cabang Terdaftar'}
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mt-1">
              {isSuperAdmin
                ? 'Rekapitulasi Per Cabang Lomba FASI XIII'
                : `Cabang Lomba yang Diikuti Kemantren ${myKemantren?.name || ''}`}
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              {isSuperAdmin
                ? 'Pilih tingkat dan cabang lomba untuk meninjau kuota 14 kemantren, urutan tampil undian, nilai dewan hakim, serta cetak laporan PDF.'
                : `Menampilkan daftar cabang lomba yang diikuti dan santri utusan Kemantren ${myKemantren?.name || ''} pada ajang FASI XIII.`}
            </p>
          </div>

          <button
            onClick={handlePrint}
            className="w-full md:w-auto px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>{isSuperAdmin ? 'Download Berita Acara PDF' : 'Cetak Rekap Cabang Lomba'}</span>
          </button>
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
            <p className="text-xs text-slate-600">
              {activeCategory.description}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {isSuperAdmin ? (
              <>
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
              </>
            ) : (
              <>
                <div className="bg-white px-3.5 py-2 rounded-xl border border-emerald-200 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Santri Kemantren</span>
                  <span className="text-sm font-black text-emerald-950">
                    {branchParticipants.length} Santri
                  </span>
                </div>
                <div className="bg-white px-3.5 py-2 rounded-xl border border-emerald-200 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Cabang Terisi ({selectedLevel})</span>
                  <span className="text-sm font-black text-amber-600">
                    {myFilledCategoriesCount} / {levelCategories.length}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Superadmin Quota Badges Grid OR Kemantren Category Badges */}
        {isSuperAdmin ? (
          <div>
            <div className="text-[11px] font-bold text-slate-500 mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Status Utusan Kemantren untuk Cabang Ini:</span>
              </div>
              <span className="text-[10px] text-slate-400">Maks. {activeCategory.maxParticipantsPerKemantren} per Kemantren</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {kemantrenQuotaStatus.map((k) => (
                <div
                  key={k.id}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    k.isFilled
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="text-[11px] font-bold truncate">{k.name}</div>
                  <div className="mt-0.5 flex items-center justify-center gap-1">
                    {k.isFilled ? (
                      <span className="text-[10px] font-black text-emerald-800 flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{k.count} Terdaftar</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium">Kosong</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="text-[11px] font-bold text-slate-500 mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-700" />
                <span>Status Keikutsertaan Cabang Lomba Tingkat {selectedLevel === 'ALL' ? 'Semua' : selectedLevel}:</span>
              </div>
              <span className="text-[10px] text-slate-400">Klik cabang untuk beralih</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {kemantrenCategoryStatus.map(({ cat, count, isRegistered }) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryCode(cat.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    activeCategory.id === cat.id
                      ? 'bg-emerald-800 text-white border-emerald-900 shadow-sm'
                      : isRegistered
                      ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 hover:bg-emerald-100/70'
                      : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-mono opacity-80">{cat.code}</div>
                    <div className="text-xs font-bold truncate">{cat.name}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    {isRegistered ? (
                      <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                          activeCategory.id === cat.id
                            ? 'bg-amber-400 text-emerald-950'
                            : 'bg-emerald-200 text-emerald-900'
                        }`}
                      >
                        {count} Santri
                      </span>
                    ) : (
                      <span className="text-[10px] opacity-60">Belum ada</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Official Printable Report Document */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0">
        {/* Kop Surat Resmi */}
        <div className="border-b-2 border-slate-900 pb-4 mb-4 text-center space-y-1">
          <h2 className="font-extrabold text-base sm:text-lg text-slate-900 uppercase tracking-wide">
            BADAN KOORDINASI TKA-TPA (BADKO TKA-TPA) KOTA YOGYAKARTA
          </h2>
          <h3 className="font-bold text-xs sm:text-sm text-emerald-900 uppercase tracking-wider">
            PANITIA PELAKSANA {appSettings.eventName} {appSettings.eventSubtitle}
          </h3>
          <p className="text-[10px] sm:text-xs text-slate-600">
            Sekretariat: Balai Kota Yogyakarta • Pelaksanaan: {appSettings.eventDate} di {appSettings.eventLocation}
          </p>
        </div>

        {/* Title */}
        <div className="text-center my-3">
          <h4 className="font-extrabold text-sm sm:text-base underline uppercase text-slate-900">
            {isSuperAdmin
              ? 'BERITA ACARA & REKAPITULASI PESERTA CABANG LOMBA'
              : `DAFTAR PESERTA UTUSAN KEMANTREN ${(myKemantren?.name || '').toUpperCase()}`}
          </h4>
          <p className="text-xs font-bold text-emerald-950 mt-1 uppercase">
            CABANG: [{activeCategory.code}] {activeCategory.name} — TINGKAT {activeCategory.level}
          </p>
          <p className="text-[11px] text-slate-600">
            {activeCategory.description}
          </p>
        </div>

        {/* Table of Contestants */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                <th className="py-2 px-2 border border-slate-300 text-center w-10">No</th>
                <th className="py-2 px-2 border border-slate-300 text-center w-16">Undian</th>
                <th className="py-2 px-3 border border-slate-300 w-28">No. Registrasi</th>
                <th className="py-2 px-3 border border-slate-300">Nama Lengkap Santri</th>
                <th className="py-2 px-2 border border-slate-300 text-center w-10">L/P</th>
                <th className="py-2 px-3 border border-slate-300 w-28">Utusan Kemantren</th>
                <th className="py-2 px-3 border border-slate-300">Unit TPA/Asal</th>
                {isSuperAdmin ? (
                  <>
                    <th className="py-2 px-2 border border-slate-300 text-center w-12">Juri 1</th>
                    <th className="py-2 px-2 border border-slate-300 text-center w-12">Juri 2</th>
                    <th className="py-2 px-2 border border-slate-300 text-center w-12">Juri 3</th>
                    <th className="py-2 px-2 border border-slate-300 text-center w-14">Rata2</th>
                    <th className="py-2 px-2 border border-slate-300 text-center w-16">Peringkat</th>
                  </>
                ) : (
                  <th className="py-2 px-3 border border-slate-300 text-center w-28">Status Kehadiran</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredParticipants.length === 0 ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 12 : 8} className="py-8 text-center text-slate-400 italic">
                    {isSuperAdmin
                      ? 'Belum ada santri terdaftar pada cabang lomba ini.'
                      : `Belum ada santri utusan Kemantren ${myKemantren?.name || ''} yang didaftarkan pada cabang lomba ini.`}
                  </td>
                </tr>
              ) : (
                filteredParticipants.map((p, idx) => {
                  const kem = getKem(p.kemantrenId);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2 px-2 border border-slate-300 text-center font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-2 border border-slate-300 text-center">
                        {p.lotteryNumber ? (
                          <span className="px-2 py-0.5 bg-amber-400 text-emerald-950 font-black rounded text-[11px] shadow-2xs">
                            {p.lotteryNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">-</span>
                        )}
                      </td>
                      <td className="py-2 px-3 border border-slate-300 font-mono font-bold text-[11px] text-emerald-950 whitespace-nowrap">
                        {p.registrationNumber}
                      </td>
                      <td className="py-2 px-3 border border-slate-300 font-bold text-slate-950">
                        {p.fullName}
                      </td>
                      <td className="py-2 px-2 border border-slate-300 text-center font-bold text-[10px]">
                        {p.gender}
                      </td>
                      <td className="py-2 px-3 border border-slate-300 font-semibold text-slate-800">
                        {kem?.name || p.kemantrenId}
                      </td>
                      <td className="py-2 px-3 border border-slate-300 text-slate-700 truncate max-w-[140px]">
                        {p.tpaUnitName}
                      </td>
                      {isSuperAdmin ? (
                        <>
                          <td className="py-2 px-2 border border-slate-300 text-center font-mono text-[11px]">
                            {p.scoreJury1 || '-'}
                          </td>
                          <td className="py-2 px-2 border border-slate-300 text-center font-mono text-[11px]">
                            {p.scoreJury2 || '-'}
                          </td>
                          <td className="py-2 px-2 border border-slate-300 text-center font-mono text-[11px]">
                            {p.scoreJury3 || '-'}
                          </td>
                          <td className="py-2 px-2 border border-slate-300 text-center font-mono font-bold text-[11px] text-emerald-950">
                            {p.averageScore ? p.averageScore.toFixed(2) : '-'}
                          </td>
                          <td className="py-2 px-2 border border-slate-300 text-center text-[10px] font-bold">
                            {p.rank ? (
                              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 rounded font-black">
                                Juara {p.rank}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                        </>
                      ) : (
                        <td className="py-2 px-3 border border-slate-300 text-center">
                          {p.attendance === 'hadir' || p.attendance === 'siap_tampil' || p.attendance === 'sudah_tampil' ? (
                            <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full">
                              Hadir
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-500 font-medium text-[10px] rounded-full">
                              Belum Hadir
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Printable Signature - Super Admin Only (Berita Acara Dewan Hakim) */}
        {isSuperAdmin && (
          <div className="mt-10 pt-4 grid grid-cols-3 gap-6 text-center text-xs break-inside-avoid">
            <div>
              <p className="font-bold text-slate-900">Hakim / Juri 1</p>
              <p className="text-[10px] text-slate-500">(Bidang Makhraj & Tajwid)</p>
              <div className="h-16"></div>
              <p className="font-bold text-slate-900 underline">( .................................................. )</p>
            </div>
            <div>
              <p className="font-bold text-slate-900">Hakim / Juri 2</p>
              <p className="text-[10px] text-slate-500">(Bidang Irama & Lagu)</p>
              <div className="h-16"></div>
              <p className="font-bold text-slate-900 underline">( .................................................. )</p>
            </div>
            <div>
              <p className="font-bold text-slate-900">Hakim / Juri 3</p>
              <p className="text-[10px] text-slate-500">(Bidang Adab & Fashahah)</p>
              <div className="h-16"></div>
              <p className="font-bold text-slate-900 underline">( .................................................. )</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
