/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Modul Superadmin: Hasil Pemenang Per Cabang Lomba (Terintegrasi Otomatis dengan Berita Acara & Supabase)
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy,
  Award,
  CheckCircle2,
  Clock,
  Search,
  RefreshCw,
  FileText,
  Building2,
  Calendar,
  Sparkles,
  Users,
  ExternalLink,
  ChevronRight,
  Filter
} from 'lucide-react';
import { Jenjang, BeritaAcaraKejuaraan, CompetitionCategory } from '../../types/fasi';
import { CATEGORIES_LIST } from '../../data/fasiMasterData';
import { getStoredBeritaAcara, saveBeritaAcaraList } from '../../utils/storage';
import {
  fetchBeritaAcaraFromSupabase,
  subscribeToBeritaAcaraRealtime,
  isSupabaseConfigured
} from '../../lib/supabase';
import { showToast } from '../../utils/sweetalert';

interface HasilCabangLombaAdminProps {
  onNavigateToBeritaAcara?: (cabangId?: string) => void;
}

export const HasilCabangLombaAdmin: React.FC<HasilCabangLombaAdminProps> = ({
  onNavigateToBeritaAcara
}) => {
  const [beritaAcaraList, setBeritaAcaraList] = useState<BeritaAcaraKejuaraan[]>(() => getStoredBeritaAcara());
  const [filterJenjang, setFilterJenjang] = useState<'ALL' | Jenjang>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'Disahkan' | 'Menunggu'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // Helper untuk menentukan cabang utama (Bobot 7-5-3)
  const isCategoryUtama = (name: string, level: string) => {
    const n = name.toLowerCase();
    if (level === 'TKA' && n.includes('tartil')) return true;
    if (level === 'TPA' && n.includes('tartil')) return true;
    if (level === 'TQA' && (n.includes('tilawah') || n.includes('tilawati'))) return true;
    return false;
  };

  // Sinkronisasi data awal dari Supabase & langganan realtime
  useEffect(() => {
    let isMounted = true;

    const syncData = async () => {
      if (!isSupabaseConfigured()) return;
      try {
        const cloudData = await fetchBeritaAcaraFromSupabase();
        if (cloudData && isMounted) {
          setBeritaAcaraList(cloudData);
          saveBeritaAcaraList(cloudData);
        }
      } catch (err) {
        console.warn('Gagal sinkronisasi data Berita Acara dari Supabase:', err);
      }
    };

    syncData();

    // Event listener local storage
    const handleLocalUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setBeritaAcaraList(e.detail);
      } else {
        setBeritaAcaraList(getStoredBeritaAcara());
      }
    };
    window.addEventListener('fasi_berita_acara_updated', handleLocalUpdate);

    // Realtime Supabase Subscription
    const unsubscribe = subscribeToBeritaAcaraRealtime((updatedList) => {
      if (isMounted && updatedList) {
        setBeritaAcaraList(updatedList);
        saveBeritaAcaraList(updatedList);
      }
    });

    return () => {
      isMounted = false;
      window.removeEventListener('fasi_berita_acara_updated', handleLocalUpdate);
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Manual Refresh Handler
  const handleManualRefresh = async () => {
    setIsSyncing(true);
    try {
      if (isSupabaseConfigured()) {
        const cloudData = await fetchBeritaAcaraFromSupabase();
        if (cloudData) {
          setBeritaAcaraList(cloudData);
          saveBeritaAcaraList(cloudData);
          showToast('success', 'Data berhasil disinkronkan dengan database cloud Supabase.');
        }
      } else {
        setBeritaAcaraList(getStoredBeritaAcara());
        showToast('info', 'Data diperbarui dari penyimpanan lokal browser.');
      }
    } catch {
      showToast('error', 'Gagal menyinkronkan data.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Map Berita Acara per Cabang ID
  const beritaAcaraMap = useMemo(() => {
    const map = new Map<string, BeritaAcaraKejuaraan>();
    beritaAcaraList.forEach((ba) => {
      map.set(ba.cabangId, ba);
    });
    return map;
  }, [beritaAcaraList]);

  // Statistik Ringkasan
  const stats = useMemo(() => {
    const totalCabang = CATEGORIES_LIST.length;
    let disahkan = 0;
    let menunggu = 0;

    CATEGORIES_LIST.forEach((cat) => {
      const ba = beritaAcaraMap.get(cat.id);
      if (ba && ba.status === 'Disahkan') {
        disahkan++;
      } else {
        menunggu++;
      }
    });

    const percent = totalCabang > 0 ? Math.round((disahkan / totalCabang) * 100) : 0;

    return { totalCabang, disahkan, menunggu, percent };
  }, [beritaAcaraMap]);

  // Daftar Cabang Terfilter
  const filteredCategories = useMemo(() => {
    return CATEGORIES_LIST.filter((cat) => {
      // Filter Jenjang
      if (filterJenjang !== 'ALL' && cat.level !== filterJenjang) return false;

      // Filter Status
      const ba = beritaAcaraMap.get(cat.id);
      const isDisahkan = ba && ba.status === 'Disahkan';
      if (filterStatus === 'Disahkan' && !isDisahkan) return false;
      if (filterStatus === 'Menunggu' && isDisahkan) return false;

      // Filter Pencarian
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = cat.name.toLowerCase().includes(q);
        const matchCode = cat.code.toLowerCase().includes(q);
        const matchLevel = cat.level.toLowerCase().includes(q);
        const matchWinner =
          ba?.pemenang?.juara1?.nama?.toLowerCase().includes(q) ||
          ba?.pemenang?.juara1?.kemantren?.toLowerCase().includes(q) ||
          ba?.pemenang?.juara2?.nama?.toLowerCase().includes(q) ||
          ba?.pemenang?.juara3?.nama?.toLowerCase().includes(q);

        if (!matchName && !matchCode && !matchLevel && !matchWinner) return false;
      }

      return true;
    });
  }, [filterJenjang, filterStatus, searchQuery, beritaAcaraMap]);

  return (
    <div className="space-y-6">
      {/* Header Banner & Kontrol Sinkronisasi */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden border border-emerald-700/30">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
              <Trophy className="w-3.5 h-3.5" />
              <span>Executive Board &bull; Hasil Resmi FASI XIII</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Hasil Pemenang Per Cabang Lomba
            </h2>
            <p className="text-emerald-100/80 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Daftar resmi juara 1, 2, 3 dan harapan per cabang lomba. Terhubung secara otomatis dan real-time dengan status pengesahan di Berita Acara Kejuaraan.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleManualRefresh}
              disabled={isSyncing}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/10 transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
              title="Sinkronkan dengan Database Cloud Supabase"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Menyinkronkan...' : 'Refresh Data'}</span>
            </button>
            {onNavigateToBeritaAcara && (
              <button
                onClick={() => onNavigateToBeritaAcara()}
                className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
              >
                <FileText className="w-4 h-4" />
                <span>Buka Berita Acara</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress & Quick Stats Card */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3.5 border border-white/10">
            <span className="text-emerald-200/80 text-[11px] block font-semibold">Total Cabang</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-white">{stats.totalCabang}</span>
              <span className="text-[10px] text-emerald-300">Cabang Lomba</span>
            </div>
          </div>

          <div className="bg-emerald-500/15 backdrop-blur-sm rounded-2xl p-3.5 border border-emerald-500/30">
            <span className="text-emerald-300 text-[11px] block font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Sudah Disahkan
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-white">{stats.disahkan}</span>
              <span className="text-[10px] text-emerald-300">Cabang Resmi</span>
            </div>
          </div>

          <div className="bg-amber-500/10 backdrop-blur-sm rounded-2xl p-3.5 border border-amber-500/20">
            <span className="text-amber-300 text-[11px] block font-semibold flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" />
              Menunggu Juri
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-white">{stats.menunggu}</span>
              <span className="text-[10px] text-amber-200">Belum Disahkan</span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3.5 border border-white/10">
            <span className="text-emerald-200/80 text-[11px] block font-semibold">Progress Hasil</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-amber-400">{stats.percent}%</span>
              <span className="text-[10px] text-emerald-300">Tuntas</span>
            </div>
            {/* Mini Progress Bar */}
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className="bg-amber-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.percent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bar Filter & Pencarian */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Filter Jenjang */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold w-full lg:w-auto overflow-x-auto">
          {(['ALL', 'TKA', 'TPA', 'TQA'] as const).map((j) => (
            <button
              key={j}
              onClick={() => setFilterJenjang(j)}
              className={`px-3.5 py-2 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                filterJenjang === j
                  ? 'bg-emerald-800 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {j === 'ALL' ? 'Semua Jenjang' : `Jenjang ${j}`}
            </button>
          ))}
        </div>

        {/* Filter Status & Search */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          {/* Filter Status Pengesahan */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold w-full sm:w-auto">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterStatus === 'ALL'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Status
            </button>
            <button
              onClick={() => setFilterStatus('Disahkan')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                filterStatus === 'Disahkan'
                  ? 'bg-emerald-100 text-emerald-900 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Disahkan</span>
            </button>
            <button
              onClick={() => setFilterStatus('Menunggu')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                filterStatus === 'Menunggu'
                  ? 'bg-amber-100 text-amber-900 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Menunggu Juri</span>
            </button>
          </div>

          {/* Kolom Pencarian */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari cabang, peserta, atau rayon..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Grid Kartu Hasil Cabang Lomba */}
      {filteredCategories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base">Tidak ada cabang lomba ditemukan</h3>
          <p className="text-xs text-slate-500 mt-1">
            Coba sesuaikan kata kunci pencarian atau filter status yang dipilih.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {filteredCategories.map((cat) => {
            const ba = beritaAcaraMap.get(cat.id);
            const isDisahkan = ba && ba.status === 'Disahkan';
            const p = ba?.pemenang;

            return (
              <div
                key={cat.id}
                className={`bg-white rounded-2xl border shadow-sm transition-all duration-200 flex flex-col justify-between overflow-hidden ${
                  isDisahkan
                    ? 'border-emerald-300/80 hover:shadow-md'
                    : 'border-slate-200/90 bg-slate-50/40 opacity-95'
                }`}
              >
                {/* Card Header */}
                <div
                  className={`p-4 sm:p-5 border-b flex items-start justify-between gap-3 ${
                    isDisahkan
                      ? 'bg-gradient-to-r from-emerald-50/60 to-white border-emerald-100'
                      : 'bg-slate-50/80 border-slate-200/80'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Badge Jenjang */}
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                          cat.level === 'TKA'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : cat.level === 'TPA'
                            ? 'bg-sky-100 text-sky-800 border border-sky-200'
                            : 'bg-purple-100 text-purple-800 border border-purple-200'
                        }`}
                      >
                        {cat.level}
                      </span>

                      {/* Badge Gender */}
                      <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                        {cat.genderRequirement === 'L'
                          ? 'Putra'
                          : cat.genderRequirement === 'P'
                          ? 'Putri'
                          : 'Campuran / Beregu'}
                      </span>

                      {/* Badge Cabang Utama */}
                      {isCategoryUtama(cat.name, cat.level) && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 shadow-2xs">
                          ★ Cabang Utama (7-5-3)
                        </span>
                      )}
                    </div>

                    <h3 className="font-extrabold text-slate-900 text-base leading-tight truncate">
                      {cat.name}
                    </h3>
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0 flex items-center gap-2">
                    {isDisahkan ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Resmi Disahkan</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-200 text-slate-600 border border-slate-300">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Menunggu Juri</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Body: Daftar Pemenang */}
                <div className="p-4 sm:p-5 flex-1 space-y-2.5">
                  {isDisahkan && p && (p.juara1 || p.juara2 || p.juara3) ? (
                    <div className="space-y-2">
                      {/* Juara 1 */}
                      {p.juara1 ? (
                        <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-50/90 to-amber-50/30 border border-amber-300/80 shadow-2xs">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                              🥇
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-black uppercase text-amber-900 tracking-wider">
                                  Juara I
                                </span>
                              </div>
                              <div className="font-extrabold text-slate-900 text-sm truncate">
                                {p.juara1.nama || '-'}
                              </div>
                              <div className="text-xs text-slate-600 truncate">
                                Rayon {p.juara1.kemantren || '-'} &bull; {p.juara1.unitTpa || '-'}
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0 pl-3">
                            <span className="font-mono font-black text-amber-800 text-sm block">
                              {p.juara1.totalNilai || '-'}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">Total Nilai</span>
                          </div>
                        </div>
                      ) : null}

                      {/* Juara 2 */}
                      {p.juara2 ? (
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/90">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-slate-300 text-slate-800 font-black text-sm flex items-center justify-center shrink-0">
                              🥈
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider">
                                  Juara II
                                </span>
                              </div>
                              <div className="font-bold text-slate-900 text-sm truncate">
                                {p.juara2.nama || '-'}
                              </div>
                              <div className="text-xs text-slate-600 truncate">
                                Rayon {p.juara2.kemantren || '-'} &bull; {p.juara2.unitTpa || '-'}
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0 pl-3">
                            <span className="font-mono font-bold text-slate-800 text-sm block">
                              {p.juara2.totalNilai || '-'}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">Total Nilai</span>
                          </div>
                        </div>
                      ) : null}

                      {/* Juara 3 */}
                      {p.juara3 ? (
                        <div className="flex items-center justify-between p-3 rounded-xl bg-amber-900/5 border border-amber-900/15">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-amber-200 text-amber-900 font-black text-sm flex items-center justify-center shrink-0">
                              🥉
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-black uppercase text-amber-900 tracking-wider">
                                  Juara III
                                </span>
                              </div>
                              <div className="font-bold text-slate-900 text-sm truncate">
                                {p.juara3.nama || '-'}
                              </div>
                              <div className="text-xs text-slate-600 truncate">
                                Rayon {p.juara3.kemantren || '-'} &bull; {p.juara3.unitTpa || '-'}
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0 pl-3">
                            <span className="font-mono font-bold text-amber-900 text-sm block">
                              {p.juara3.totalNilai || '-'}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">Total Nilai</span>
                          </div>
                        </div>
                      ) : null}

                      {/* Harapan 1 & 2 */}
                      {(p.harapan1 || p.harapan2) && (
                        <div className="pt-2 px-1 text-xs text-slate-600 border-t border-slate-100 flex flex-wrap gap-x-4 gap-y-1.5">
                          {p.harapan1 && (
                            <div>
                              <span className="font-semibold text-slate-700">Harapan I:</span>{' '}
                              <strong>{p.harapan1.nama}</strong> (Rayon {p.harapan1.kemantren}){' '}
                              &bull; <span className="font-mono text-slate-500">{p.harapan1.totalNilai}</span>
                            </div>
                          )}
                          {p.harapan2 && (
                            <div>
                              <span className="font-semibold text-slate-700">Harapan II:</span>{' '}
                              <strong>{p.harapan2.nama}</strong> (Rayon {p.harapan2.kemantren}){' '}
                              &bull; <span className="font-mono text-slate-500">{p.harapan2.totalNilai}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-10 text-center px-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                        <Clock className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-semibold text-slate-700">
                        Hasil Kejuaraan Belum Disahkan
                      </p>
                      <p className="text-[11px] text-slate-400 max-w-sm mx-auto mt-0.5">
                        Menunggu dewan juri menyelesaikan rekapitulasi penilaian dan pengesahan Berita Acara resmi.
                      </p>
                    </div>
                  )}
                </div>

                {/* Card Footer: Metadata Juri & Tombol Aksi */}
                <div className="px-4 sm:px-5 py-3 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                  <div className="text-[11px] text-slate-500 space-y-0.5">
                    {ba?.tanggalPenetapan && (
                      <div>
                        Penetapan: <strong className="text-slate-700">{ba.tanggalPenetapan}</strong>
                      </div>
                    )}
                    {(ba?.namaKetuaJuri || ba?.juriSatu) && (
                      <div className="truncate max-w-xs">
                        Ketua Juri: <strong className="text-slate-700">{ba.namaKetuaJuri || ba.juriSatu}</strong>
                      </div>
                    )}
                  </div>

                  {onNavigateToBeritaAcara && (
                    <button
                      onClick={() => onNavigateToBeritaAcara(cat.id)}
                      className="inline-flex items-center gap-1.5 text-emerald-800 hover:text-emerald-950 font-bold text-xs hover:underline cursor-pointer ml-auto"
                    >
                      <span>{isDisahkan ? 'Kelola di Berita Acara' : 'Input Berita Acara'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
