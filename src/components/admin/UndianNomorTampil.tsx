/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Halaman Khusus Pengundian Nomor Urut Tampil (Lottery Engine)
 * Dilengkapi Tab Kategori (TKA, TPA, TQA), Pemilihan Cabang Lomba, & Simpan ke Database
 */

import React, { useState, useMemo } from 'react';
import {
  Dices,
  Shuffle,
  Save,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Printer,
  Sparkles,
  Users,
  Search,
  Layers,
  ArrowLeft,
  ChevronRight,
  HelpCircle,
  FileCheck2
} from 'lucide-react';
import { Participant, UserSession } from '../../types/fasi';
import { getStoredCategories, getStoredKemantren, saveParticipants, logAuditEvent } from '../../utils/storage';
import { showToast, showSuccessAlert, showConfirmDialog } from '../../utils/sweetalert';

interface UndianNomorTampilProps {
  session: UserSession;
  participants: Participant[];
  onUpdateParticipants: (newList: Participant[]) => void;
  onBack?: () => void;
}

export const UndianNomorTampil: React.FC<UndianNomorTampilProps> = ({
  session,
  participants,
  onUpdateParticipants,
  onBack,
}) => {
  const categoriesList = getStoredCategories();
  const kemantrenList = getStoredKemantren();

  // Category Tab: 'TKA' | 'TPA' | 'TQA' | 'ALL'
  const [activeCategoryTab, setActiveCategoryTab] = useState<'TKA' | 'TPA' | 'TQA' | 'ALL'>('TKA');

  // Selected Cabang Lomba ID
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(() => {
    const firstTka = categoriesList.find((c) => c.level === 'TKA');
    return firstTka?.id || categoriesList[0]?.id || '';
  });

  // Local draft of participants for the current draw session before saving to database
  const [localParticipants, setLocalParticipants] = useState<Participant[]>(participants);
  const [isShuffling, setIsShuffling] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Keep local participants in sync when props change (if not dirty)
  React.useEffect(() => {
    if (!hasUnsavedChanges) {
      setLocalParticipants(participants);
    }
  }, [participants, hasUnsavedChanges]);

  // Categories filtered by the active Tab
  const tabCategories = useMemo(() => {
    if (activeCategoryTab === 'ALL') return categoriesList;
    return categoriesList.filter((c) => c.level === activeCategoryTab);
  }, [categoriesList, activeCategoryTab]);

  // Selected category object
  const currentCategory = useMemo(() => {
    return categoriesList.find((c) => c.id === selectedCategoryId) || tabCategories[0] || categoriesList[0];
  }, [categoriesList, selectedCategoryId, tabCategories]);

  // Participants belonging to this category
  const categoryParticipants = useMemo(() => {
    return localParticipants.filter(
      (p) => p.categoryId === currentCategory?.id && p.status === 'verified'
    );
  }, [localParticipants, currentCategory]);

  // Stats for the active category
  const stats = useMemo(() => {
    const total = categoryParticipants.length;
    const drawn = categoryParticipants.filter((p) => p.lotteryNumber != null && p.lotteryNumber > 0).length;
    const undrawn = total - drawn;
    const isComplete = total > 0 && undrawn === 0;
    return { total, drawn, undrawn, isComplete };
  }, [categoryParticipants]);

  const getKemantrenName = (id: string) => {
    const k = kemantrenList.find((item) => item.id === id);
    return k ? k.name : id;
  };

  // Perform Lottery Draw / Shuffle
  const handleDrawLottery = () => {
    if (categoryParticipants.length === 0) {
      showToast('warning', 'Belum ada peserta terverifikasi di cabang lomba ini.');
      return;
    }

    setIsShuffling(true);

    setTimeout(() => {
      // 1. Generate array of numbers 1..N
      const total = categoryParticipants.length;
      const numbers = Array.from({ length: total }, (_, i) => i + 1);

      // 2. Fisher-Yates Shuffle
      for (let i = numbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
      }

      // 3. Assign to participants of this category
      const targetIds = new Set(categoryParticipants.map((p) => p.id));
      let numIndex = 0;
      const nowIso = new Date().toISOString();

      const updated = localParticipants.map((p) => {
        if (targetIds.has(p.id)) {
          const lotNum = numbers[numIndex++];
          return {
            ...p,
            lotteryNumber: lotNum,
            lotteryDrawnAt: nowIso,
            lotteryDrawnBy: session.name || 'Panitia FASI XIII',
            updatedAt: nowIso,
          };
        }
        return p;
      });

      setLocalParticipants(updated);
      setIsShuffling(false);
      setHasUnsavedChanges(true);

      showToast(
        'success',
        `Berhasil mengundi nomor urut tampil untuk ${categoryParticipants.length} santri. Jangan lupa klik Simpan ke Database.`
      );
    }, 500);
  };

  // Reset lottery numbers for this category
  const handleResetLottery = async () => {
    const confirmed = await showConfirmDialog(
      'Reset Nomor Undian Cabang Ini?',
      `Nomor undian untuk cabang [${currentCategory?.code}] ${currentCategory?.name} akan dikosongkan kembali.`,
      'Ya, Reset Nomor',
      '#e11d48'
    );

    if (!confirmed) return;

    const targetIds = new Set(categoryParticipants.map((p) => p.id));
    const nowIso = new Date().toISOString();

    const updated = localParticipants.map((p) => {
      if (targetIds.has(p.id)) {
        return {
          ...p,
          lotteryNumber: null,
          lotteryDrawnAt: null,
          lotteryDrawnBy: null,
          updatedAt: nowIso,
        };
      }
      return p;
    });

    setLocalParticipants(updated);
    setHasUnsavedChanges(true);
    showToast('info', 'Nomor undian cabang ini telah di-reset. Klik Simpan ke Database untuk memperbarui.');
  };

  // Save Drawn Numbers into the Database (Storage Engine)
  const handleSaveToDatabase = () => {
    onUpdateParticipants(localParticipants);
    saveParticipants(localParticipants);
    setHasUnsavedChanges(false);

    logAuditEvent(
      session.name,
      'SIMPAN_UNDIAN_DATABASE',
      `Menyimpan hasil undian nomor tampil cabang [${currentCategory?.code}] ${currentCategory?.name} (${stats.drawn} santri).`
    );

    showSuccessAlert(
      'Hasil Undian Tersimpan!',
      `Nomor urut tampil cabang [${currentCategory?.code}] ${currentCategory?.name} berhasil disimpan ke database sistem.`
    );
  };

  // Switch category tab
  const handleSwitchTab = (tab: 'TKA' | 'TPA' | 'TQA' | 'ALL') => {
    setActiveCategoryTab(tab);
    const firstCat = tab === 'ALL' ? categoriesList[0] : categoriesList.find((c) => c.level === tab);
    if (firstCat) {
      setSelectedCategoryId(firstCat.id);
    }
  };

  const handlePrintSheet = () => {
    window.print();
  };

  // Filtered & Sorted participants for display
  const displayedParticipants = useMemo(() => {
    let list = [...categoryParticipants];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.fullName.toLowerCase().includes(q) ||
          p.registrationNumber.toLowerCase().includes(q) ||
          p.tpaUnitName.toLowerCase().includes(q) ||
          getKemantrenName(p.kemantrenId).toLowerCase().includes(q)
      );
    }
    // Sort by lottery number (if drawn), otherwise by registration number
    return list.sort((a, b) => {
      if (a.lotteryNumber && b.lotteryNumber) return a.lotteryNumber - b.lotteryNumber;
      if (a.lotteryNumber) return -1;
      if (b.lotteryNumber) return 1;
      return a.registrationNumber.localeCompare(b.registrationNumber);
    });
  }, [categoryParticipants, searchQuery]);

  return (
    <div className="space-y-6">
      {/* 1. Header & Breadcrumb */}
      <div className="no-print bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 mb-1 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Dashboard</span>
            </button>
          )}
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-800 font-bold">
              <Dices className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Pengundian Nomor Urut Tampil (Lottery Engine)
              </h2>
              <p className="text-xs text-slate-500">
                Pilih kategori dan cabang lomba, acak urutan tampil santri secara transparan dan simpan langsung ke database.
              </p>
            </div>
          </div>
        </div>

        {/* Global Save Indicator */}
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <button
              onClick={handleSaveToDatabase}
              className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 animate-pulse cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan ke Database</span>
            </button>
          )}
          <button
            onClick={handlePrintSheet}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Lembar</span>
          </button>
        </div>
      </div>

      {/* 2. Category Level Selector (TKA / TPA / TQA / Semua) */}
      <div className="no-print bg-white rounded-2xl p-2 border border-slate-200 shadow-sm flex flex-wrap gap-2">
        <button
          onClick={() => handleSwitchTab('TKA')}
          className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeCategoryTab === 'TKA'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Jenjang TKA</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-400 text-emerald-950 font-black">
            {categoriesList.filter((c) => c.level === 'TKA').length} Cabang
          </span>
        </button>

        <button
          onClick={() => handleSwitchTab('TPA')}
          className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeCategoryTab === 'TPA'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Jenjang TPA</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-400 text-emerald-950 font-black">
            {categoriesList.filter((c) => c.level === 'TPA').length} Cabang
          </span>
        </button>

        <button
          onClick={() => handleSwitchTab('TQA')}
          className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeCategoryTab === 'TQA'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Jenjang TQA</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-400 text-emerald-950 font-black">
            {categoriesList.filter((c) => c.level === 'TQA').length} Cabang
          </span>
        </button>

        <button
          onClick={() => handleSwitchTab('ALL')}
          className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeCategoryTab === 'ALL'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <span>Semua Cabang</span>
        </button>
      </div>

      {/* 3. Main Grid: Cabang Lomba Selection & Lottery Execution Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Cabang Lomba Selector List */}
        <div className="no-print lg:col-span-4 space-y-3">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Pilih Cabang Lomba ({tabCategories.length})
            </h3>

            <div className="space-y-1.5 max-h-[580px] overflow-y-auto pr-1">
              {tabCategories.map((cat) => {
                const catPartCount = localParticipants.filter(
                  (p) => p.categoryId === cat.id && p.status === 'verified'
                ).length;
                const drawnPartCount = localParticipants.filter(
                  (p) => p.categoryId === cat.id && p.status === 'verified' && p.lotteryNumber != null && p.lotteryNumber > 0
                ).length;
                const isSelected = cat.id === currentCategory?.id;

                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-emerald-900 text-white border-emerald-950 shadow-sm'
                        : 'bg-slate-50/70 hover:bg-slate-100 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.2 rounded font-mono font-bold text-[10px] ${
                            isSelected ? 'bg-amber-400 text-emerald-950' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {cat.code}
                        </span>
                        <span
                          className={`text-[10px] font-semibold ${
                            isSelected ? 'text-emerald-200' : 'text-slate-500'
                          }`}
                        >
                          {cat.level} • {cat.genderRequirement === 'L' ? 'Putra' : cat.genderRequirement === 'P' ? 'Putri' : 'Campuran'}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs truncate leading-snug">{cat.name}</h4>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          catPartCount === 0
                            ? 'bg-slate-200 text-slate-500'
                            : drawnPartCount === catPartCount
                            ? isSelected
                              ? 'bg-emerald-400 text-emerald-950'
                              : 'bg-emerald-100 text-emerald-800'
                            : isSelected
                            ? 'bg-amber-400 text-emerald-950'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {drawnPartCount}/{catPartCount}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Execution Workspace & Participants Table */}
        <div className="lg:col-span-8 space-y-4">
          {/* Active Cabang Lomba Card Banner */}
          <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-950 rounded-2xl p-5 text-white shadow-sm border border-emerald-700/50 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-amber-400 text-emerald-950">
                    {currentCategory?.code}
                  </span>
                  <span className="text-xs text-emerald-300 font-semibold">
                    Jenjang {currentCategory?.level} • {currentCategory?.genderRequirement === 'L' ? 'Khusus Putra' : currentCategory?.genderRequirement === 'P' ? 'Khusus Putri' : 'Putra / Putri'}
                  </span>
                </div>
                <h3 className="text-xl font-bold tracking-tight text-white mt-1">
                  {currentCategory?.name}
                </h3>
              </div>

              {/* Status Badge */}
              <div className="text-left sm:text-right">
                {stats.isComplete ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-400 text-emerald-950 font-bold text-xs rounded-full shadow-sm">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Undian Lengkap ({stats.total}/{stats.total})
                  </span>
                ) : stats.drawn > 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400 text-emerald-950 font-bold text-xs rounded-full shadow-sm">
                    <Sparkles className="w-3.5 h-3.5" />
                    Sebagian Diundi ({stats.drawn}/{stats.total})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 text-emerald-100 font-semibold text-xs rounded-full">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Belum Diundi (0/{stats.total})
                  </span>
                )}
              </div>
            </div>

            {/* Action Bar (Undi, Reset, Simpan) */}
            <div className="no-print pt-3 border-t border-emerald-700/60 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDrawLottery}
                  disabled={isShuffling || categoryParticipants.length === 0}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-emerald-950 font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  <Shuffle className={`w-4 h-4 ${isShuffling ? 'animate-spin' : ''}`} />
                  <span>
                    {isShuffling
                      ? 'Mengacak Nomor...'
                      : stats.drawn > 0
                      ? 'Undi Ulang Acak'
                      : 'Undi Acak Nomor Tampil'}
                  </span>
                </button>

                {stats.drawn > 0 && (
                  <button
                    onClick={handleResetLottery}
                    className="px-3.5 py-2.5 bg-emerald-950/80 hover:bg-rose-900/90 text-emerald-200 hover:text-white font-semibold text-xs rounded-xl border border-emerald-700 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>

              {hasUnsavedChanges && (
                <button
                  onClick={handleSaveToDatabase}
                  className="px-5 py-2.5 bg-white text-emerald-950 hover:bg-emerald-100 font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <Save className="w-4 h-4 text-emerald-800" />
                  <span>Simpan ke Database</span>
                </button>
              )}
            </div>
          </div>

          {/* Participants Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
            {/* Search within this Cabang */}
            <div className="no-print p-4 border-b border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari santri, no regis, atau kemantren..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="text-xs text-slate-500">
                Menampilkan <strong>{displayedParticipants.length}</strong> dari{' '}
                <strong>{categoryParticipants.length}</strong> santri terdaftar
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4">No. Registrasi</th>
                    <th className="py-3 px-4">Nama Lengkap Santri</th>
                    <th className="py-3 px-4">Kemantren & Unit TPA</th>
                    <th className="py-3 px-4 text-center">Nomor Undian</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedParticipants.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="font-semibold">Belum ada peserta terdaftar pada cabang lomba ini.</p>
                        <p className="text-[11px] mt-0.5">
                          Gunakan menu pendaftaran santri untuk mengisi utusan kemantren.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    displayedParticipants.map((p, idx) => {
                      const kem = getKemantrenName(p.kemantrenId);
                      const hasNumber = p.lotteryNumber != null && p.lotteryNumber > 0;

                      return (
                        <tr
                          key={p.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            hasNumber ? 'bg-emerald-50/20' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-500 text-center">
                            {idx + 1}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              {p.registrationNumber}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{p.fullName}</div>
                            <div className="text-[11px] text-slate-400 font-medium">
                              {p.gender === 'L' ? '👦 Putra' : '🧕 Putri'} • Usia: {p.ageOnCutoff?.years || 0} Thn {p.ageOnCutoff?.months || 0} Bln
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800">Kemantren {kem}</div>
                            <div className="text-[11px] text-slate-500">{p.tpaUnitName}</div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {hasNumber ? (
                              <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-emerald-950 font-black font-mono text-base shadow-sm border border-amber-300">
                                {String(p.lotteryNumber).padStart(2, '0')}
                              </div>
                            ) : (
                              <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-400">
                                Belum Diundi
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {hasNumber ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="w-3 h-3" />
                                Siap Tampil
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                                Menunggu Undian
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Print Footer Summary (Visible in Print Mode) */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span>
                Hasil undian resmi ini akan otomatis tercantum pada ID Card Santri dan Sistem Dewan Hakim.
              </span>
              <span className="font-mono text-[11px] text-slate-400">
                BADKO TKA-TPA Kota Yogyakarta 2026
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
