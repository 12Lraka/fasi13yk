import React, { useState, useMemo, useEffect } from 'react';
import { 
  Award, 
  Trophy, 
  Medal, 
  Sparkles, 
  RefreshCw, 
  Star, 
  Search, 
  Filter, 
  CheckCircle2, 
  ChevronRight,
  BookOpen,
  Calendar,
  Building2,
  Users
} from 'lucide-react';
import { Participant, BeritaAcaraKejuaraan, AppSettings, Jenjang } from '../../types/fasi';
import { KEMANTREN_LIST, CATEGORIES_LIST } from '../../data/fasiMasterData';
import { getStoredBeritaAcara, getStoredSettings } from '../../utils/storage';
import { getThemeConfig } from '../../utils/theme';

interface LiveScoreboardProps {
  participants: Participant[];
  settings?: AppSettings;
}

interface KemantrenTally {
  kemantrenId: string;
  kode: string;
  nama: string;
  emas: number; // Juara 1
  perak: number; // Juara 2
  perunggu: number; // Juara 3
  harapan1: number;
  harapan2: number;
  totalPoin: number;
  rank: number;
}

export const LiveScoreboard: React.FC<LiveScoreboardProps> = ({ participants, settings: propSettings }) => {
  const settings = propSettings || getStoredSettings();
  const theme = getThemeConfig(settings?.themeColor);

  const [activeTab, setActiveTab] = useState<'umum' | 'tka' | 'tpa' | 'tqa' | 'cabang'>('umum');
  const [searchCabang, setSearchCabang] = useState('');
  const [selectedJenjangFilter, setSelectedJenjangFilter] = useState<'ALL' | Jenjang>('ALL');
  const [beritaAcaraList, setBeritaAcaraList] = useState<BeritaAcaraKejuaraan[]>(() => getStoredBeritaAcara());

  // Listen to local / storage events for live updates
  useEffect(() => {
    const handleUpdate = () => {
      setBeritaAcaraList(getStoredBeritaAcara());
    };

    window.addEventListener('fasi_berita_acara_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('fasi_berita_acara_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Filter hanya berita acara yang sudah "Disahkan" oleh dewan juri/superadmin
  const validatedBeritaAcara = useMemo(() => {
    return beritaAcaraList.filter(b => b.status === 'Disahkan');
  }, [beritaAcaraList]);

  // Kalkulasi Klasemen Kemantren (berdasarkan tab aktif: Umum, TKA, TPA, TQA)
  const standings = useMemo(() => {
    const talliesMap: Record<string, KemantrenTally> = {};

    KEMANTREN_LIST.forEach(k => {
      const kName = k.name;
      talliesMap[kName] = {
        kemantrenId: k.id,
        kode: k.code,
        nama: kName,
        emas: 0,
        perak: 0,
        perunggu: 0,
        harapan1: 0,
        harapan2: 0,
        totalPoin: 0,
        rank: 1,
      };
    });

    const findTally = (kemName?: string): KemantrenTally | undefined => {
      if (!kemName) return undefined;
      const clean = kemName.trim().toLowerCase().replace(/^kemantren\s+/i, '');
      const key = Object.keys(talliesMap).find(k => k.toLowerCase() === clean || k.toLowerCase() === kemName.toLowerCase());
      return key ? talliesMap[key] : undefined;
    };

    validatedBeritaAcara.forEach(ba => {
      // Filter jenjang jika tab spesifik
      if (activeTab === 'tka' && ba.jenjang !== 'TKA') return;
      if (activeTab === 'tpa' && ba.jenjang !== 'TPA') return;
      if (activeTab === 'tqa' && ba.jenjang !== 'TQA') return;

      const p = ba.pemenang;
      const isUtama = ba.isCabangUtama;
      const p1 = isUtama ? 7 : 5;
      const p2 = isUtama ? 5 : 3;
      const p3 = isUtama ? 3 : 1;

      const t1 = findTally(p.juara1?.kemantren);
      if (t1) {
        t1.emas += 1;
        t1.totalPoin += p1;
      }

      const t2 = findTally(p.juara2?.kemantren);
      if (t2) {
        t2.perak += 1;
        t2.totalPoin += p2;
      }

      const t3 = findTally(p.juara3?.kemantren);
      if (t3) {
        t3.perunggu += 1;
        t3.totalPoin += p3;
      }

      const th1 = findTally(p.harapan1?.kemantren);
      if (th1) {
        th1.harapan1 += 1;
      }

      const th2 = findTally(p.harapan2?.kemantren);
      if (th2) {
        th2.harapan2 += 1;
      }
    });

    // Urutkan berdasarkan: Total Poin desc -> Emas desc -> Perak desc -> Perunggu desc
    const sorted = Object.values(talliesMap).sort((a, b) => {
      if (b.totalPoin !== a.totalPoin) return b.totalPoin - a.totalPoin;
      if (b.emas !== a.emas) return b.emas - a.emas;
      if (b.perak !== a.perak) return b.perak - a.perak;
      return b.perunggu - a.perunggu;
    });

    // Tetapkan ranking
    return sorted.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  }, [validatedBeritaAcara, activeTab]);

  const top1 = standings[0];
  const top2 = standings[1];
  const top3 = standings[2];

  // Helper untuk menentukan cabang utama
  const isCategoryUtama = (name: string, level: string) => {
    const n = name.toLowerCase();
    if (level === 'TKA' && n.includes('tartil')) return true;
    if (level === 'TPA' && n.includes('tartil')) return true;
    if (level === 'TQA' && n.includes('tilawah')) return true;
    return false;
  };

  // Daftar Cabang Lomba untuk Tab Hasil Per Cabang
  const filteredCategoriesForResults = useMemo(() => {
    return CATEGORIES_LIST.filter(c => {
      if (selectedJenjangFilter !== 'ALL' && c.level !== selectedJenjangFilter) return false;
      if (searchCabang.trim()) {
        const q = searchCabang.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || c.level.toLowerCase().includes(q);
      }
      return true;
    });
  }, [selectedJenjangFilter, searchCabang]);

  return (
    <div className="space-y-6">
      {/* Hero Banner Live Score */}
      <div className={`${theme.headerGradient} rounded-3xl p-6 sm:p-8 text-white shadow-xl border ${theme.headerBorder} relative overflow-hidden`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-2.5 rounded-2xl bg-amber-400 text-slate-950 shadow-md">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-extrabold text-amber-300 uppercase tracking-widest block">
                  PORTAL PUBLIKASI RESMI
                </span>
                <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight">
                  Live Scoreboard & Klasemen Kejuaraan
                </h2>
              </div>
            </div>
            <p className={`text-xs sm:text-sm ${theme.headerSubtext} max-w-2xl`}>
              Rekapitulasi perolehan poin dan penetapan juara resmi FASI XIII Kota Yogyakarta.
              <br />
              <span className="text-amber-300 font-medium">
                ★ Cabang Utama (Tartil & Tilawah): J1=7pt, J2=5pt, J3=3pt | Cabang Umum: J1=5pt, J2=3pt, J3=1pt.
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 bg-black/30 backdrop-blur px-4 py-2 rounded-2xl border border-white/20 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-slate-200 font-semibold">
              {validatedBeritaAcara.length} dari {CATEGORIES_LIST.length} Cabang Disahkan
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 text-xs sm:text-sm font-semibold no-scrollbar">
        <button
          onClick={() => setActiveTab('umum')}
          className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'umum'
              ? 'bg-slate-900 text-white shadow-sm font-bold'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Klasemen Juara Umum</span>
        </button>

        <button
          onClick={() => setActiveTab('tka')}
          className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'tka'
              ? 'bg-emerald-800 text-white shadow-sm font-bold'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Award className="w-4 h-4 text-emerald-400" />
          <span>Juara Kategori TKA</span>
        </button>

        <button
          onClick={() => setActiveTab('tpa')}
          className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'tpa'
              ? 'bg-sky-800 text-white shadow-sm font-bold'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Award className="w-4 h-4 text-sky-400" />
          <span>Juara Kategori TPA</span>
        </button>

        <button
          onClick={() => setActiveTab('tqa')}
          className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'tqa'
              ? 'bg-purple-800 text-white shadow-sm font-bold'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Award className="w-4 h-4 text-purple-400" />
          <span>Juara Kategori TQA</span>
        </button>

        <button
          onClick={() => setActiveTab('cabang')}
          className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'cabang'
              ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Hasil Per Cabang Lomba</span>
        </button>
      </div>

      {/* Konten Tab 1 s.d 4 (Klasemen Umum / Kategori) */}
      {activeTab !== 'cabang' && (
        <div className="space-y-6">
          {/* Top 3 Podium Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            
            {/* Peringkat 2 */}
            {top2 && (
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between order-2 md:order-1">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    Peringkat 2
                  </span>
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-black text-slate-700 text-sm shadow-2xs">
                    🥈
                  </div>
                </div>
                <div className="my-3">
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">
                    Kemantren {top2.nama}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Total <strong>{top2.totalPoin} Poin</strong>
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Juara I</span>
                    <strong className="text-amber-600 font-bold text-sm">{top2.emas}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Juara II</span>
                    <strong className="text-slate-600 font-bold text-sm">{top2.perak}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Juara III</span>
                    <strong className="text-amber-800 font-bold text-sm">{top2.perunggu}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Peringkat 1 (Juara Umum / Kategori) */}
            {top1 && (
              <div className="bg-gradient-to-b from-amber-50 to-white rounded-2xl p-6 border-2 border-amber-400 shadow-lg relative overflow-hidden flex flex-col justify-between order-1 md:order-2 md:-translate-y-2">
                <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[10px] font-black px-3.5 py-0.5 rounded-bl-xl uppercase tracking-wider shadow-2xs">
                  {activeTab === 'umum' ? 'KANDIDAT JUARA UMUM' : `JUARA 1 ${activeTab.toUpperCase()}`}
                </div>
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                    Peringkat 1
                  </span>
                  <div className="w-11 h-11 rounded-2xl bg-amber-400 flex items-center justify-center font-black text-slate-950 text-xl shadow-md">
                    🥇
                  </div>
                </div>
                <div className="my-4">
                  <h3 className="text-2xl font-black text-slate-900 leading-tight">
                    Kemantren {top1.nama}
                  </h3>
                  <p className="text-sm font-extrabold text-amber-700 font-mono mt-0.5">
                    Total {top1.totalPoin} Poin Kejuaraan
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs bg-amber-100/70 p-2.5 rounded-xl border border-amber-200">
                  <div>
                    <span className="text-amber-900 block text-[10px] font-bold">Juara I</span>
                    <strong className="text-amber-700 font-black text-base">{top1.emas}</strong>
                  </div>
                  <div>
                    <span className="text-slate-700 block text-[10px] font-bold">Juara II</span>
                    <strong className="text-slate-800 font-black text-base">{top1.perak}</strong>
                  </div>
                  <div>
                    <span className="text-amber-950 block text-[10px] font-bold">Juara III</span>
                    <strong className="text-amber-950 font-black text-base">{top1.perunggu}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Peringkat 3 */}
            {top3 && (
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between order-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    Peringkat 3
                  </span>
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center font-black text-amber-800 text-sm shadow-2xs">
                    🥉
                  </div>
                </div>
                <div className="my-3">
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">
                    Kemantren {top3.nama}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Total <strong>{top3.totalPoin} Poin</strong>
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Juara I</span>
                    <strong className="text-amber-600 font-bold text-sm">{top3.emas}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Juara II</span>
                    <strong className="text-slate-600 font-bold text-sm">{top3.perak}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Juara III</span>
                    <strong className="text-amber-800 font-bold text-sm">{top3.perunggu}</strong>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Tabel Lengkap Perolehan Medali 14 Kemantren */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Klasemen Resmi 14 Kemantren ({activeTab === 'umum' ? 'Semua Jenjang' : `Jenjang ${activeTab.toUpperCase()}`})
                </h3>
                <p className="text-xs text-slate-500">
                  Diurutkan berdasarkan Total Poin akumulasi Berita Acara yang telah disahkan.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-3.5 px-4 w-14 text-center">Rank</th>
                    <th className="py-3.5 px-4">Kontingen Kemantren</th>
                    <th className="py-3.5 px-4 text-center bg-amber-50/70 text-amber-950 font-bold w-24">🥇 Juara I</th>
                    <th className="py-3.5 px-4 text-center bg-slate-100/70 text-slate-800 font-bold w-24">🥈 Juara II</th>
                    <th className="py-3.5 px-4 text-center bg-amber-900/10 text-amber-950 font-bold w-24">🥉 Juara III</th>
                    <th className="py-3.5 px-4 text-center w-28">Harapan 1 & 2</th>
                    <th className="py-3.5 px-4 text-center font-black bg-amber-100 text-slate-950 w-28">Total Poin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {standings.map((tally) => (
                    <tr
                      key={tally.kemantrenId}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        tally.rank === 1 ? 'bg-amber-50/30 font-semibold' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center">
                        {tally.rank === 1 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow-2xs">
                            1
                          </span>
                        ) : tally.rank === 2 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-800 font-black text-xs">
                            2
                          </span>
                        ) : tally.rank === 3 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-200 text-amber-900 font-black text-xs">
                            3
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">{tally.rank}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        Kemantren {tally.nama}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-amber-700 bg-amber-50/30">
                        {tally.emas}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-700 bg-slate-100/30">
                        {tally.perak}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-amber-900 bg-amber-900/5">
                        {tally.perunggu}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-500 font-mono">
                        {tally.harapan1 + tally.harapan2}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-black text-slate-950 bg-amber-50 text-sm">
                        {tally.totalPoin}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Konten Tab 5: Hasil Per Cabang Lomba */}
      {activeTab === 'cabang' && (
        <div className="space-y-4">
          {/* Filter & Pencarian Cabang */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold w-full sm:w-auto">
              {(['ALL', 'TKA', 'TPA', 'TQA'] as const).map(j => (
                <button
                  key={j}
                  onClick={() => setSelectedJenjangFilter(j)}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg transition-all ${
                    selectedJenjangFilter === j
                      ? 'bg-white text-slate-900 font-bold shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {j === 'ALL' ? 'Semua Jenjang' : j}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari cabang lomba..."
                value={searchCabang}
                onChange={(e) => setSearchCabang(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-slate-50"
              />
            </div>
          </div>

          {/* Grid Kartu Hasil Pemenang Per Cabang */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCategoriesForResults.map(cat => {
              const ba = validatedBeritaAcara.find(b => b.cabangId === cat.id);
              const p = ba?.pemenang;

              return (
                <div 
                  key={cat.id} 
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between"
                >
                  {/* Header Card Cabang */}
                  <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                          cat.level === 'TKA' ? 'bg-emerald-100 text-emerald-800' :
                          cat.level === 'TPA' ? 'bg-sky-100 text-sky-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {cat.level}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500">
                          {cat.genderRequirement === 'L' ? 'Putra' : cat.genderRequirement === 'P' ? 'Putri' : 'Campuran / Beregu'}
                        </span>
                        {isCategoryUtama(cat.name, cat.level) && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-400 text-slate-950">
                            ★ Utama (7-5-3)
                          </span>
                        )}
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-sm">
                        {cat.name}
                      </h4>
                    </div>

                    {ba ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Hasil Resmi
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-400 border border-slate-200 shrink-0">
                        Menunggu Juri
                      </span>
                    )}
                  </div>

                  {/* Body Daftar Pemenang */}
                  <div className="p-4 space-y-2 text-xs flex-1">
                    {ba && p && (p.juara1 || p.juara2 || p.juara3) ? (
                      <div className="space-y-1.5">
                        {/* Juara 1 */}
                        {p.juara1 && (
                          <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50/80 border border-amber-200">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-6 h-6 rounded-lg bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                                1
                              </span>
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 truncate">{p.juara1.nama}</div>
                                <div className="text-[11px] text-slate-500 truncate">{p.juara1.kemantren} &bull; {p.juara1.unitTpa}</div>
                              </div>
                            </div>
                            <div className="text-right shrink-0 pl-2">
                              <span className="font-mono font-bold text-amber-700 text-xs block">{p.juara1.totalNilai}</span>
                              <span className="text-[10px] text-slate-400">Total Nilai</span>
                            </div>
                          </div>
                        )}

                        {/* Juara 2 */}
                        {p.juara2 && (
                          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-6 h-6 rounded-lg bg-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center shrink-0">
                                2
                              </span>
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 truncate">{p.juara2.nama}</div>
                                <div className="text-[11px] text-slate-500 truncate">{p.juara2.kemantren} &bull; {p.juara2.unitTpa}</div>
                              </div>
                            </div>
                            <div className="text-right shrink-0 pl-2">
                              <span className="font-mono font-bold text-slate-700 text-xs block">{p.juara2.totalNilai}</span>
                              <span className="text-[10px] text-slate-400">Total Nilai</span>
                            </div>
                          </div>
                        )}

                        {/* Juara 3 */}
                        {p.juara3 && (
                          <div className="flex items-center justify-between p-2 rounded-xl bg-amber-900/5 border border-amber-900/10">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-6 h-6 rounded-lg bg-amber-200 text-amber-900 font-bold text-xs flex items-center justify-center shrink-0">
                                3
                              </span>
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 truncate">{p.juara3.nama}</div>
                                <div className="text-[11px] text-slate-500 truncate">{p.juara3.kemantren} &bull; {p.juara3.unitTpa}</div>
                              </div>
                            </div>
                            <div className="text-right shrink-0 pl-2">
                              <span className="font-mono font-bold text-amber-900 text-xs block">{p.juara3.totalNilai}</span>
                              <span className="text-[10px] text-slate-400">Total Nilai</span>
                            </div>
                          </div>
                        )}

                        {/* Harapan 1 & 2 */}
                        {(p.harapan1 || p.harapan2) && (
                          <div className="pt-1 text-[11px] text-slate-500 border-t border-slate-100 flex flex-wrap gap-x-4 gap-y-1">
                            {p.harapan1 && (
                              <div>
                                <span className="font-semibold text-slate-700">Harapan I:</span> {p.harapan1.nama} ({p.harapan1.kemantren}) - {p.harapan1.totalNilai}
                              </div>
                            )}
                            {p.harapan2 && (
                              <div>
                                <span className="font-semibold text-slate-700">Harapan II:</span> {p.harapan2.nama} ({p.harapan2.kemantren}) - {p.harapan2.totalNilai}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-6 text-center text-slate-400 italic">
                        Hasil lomba cabang ini belum disahkan oleh dewan juri.
                      </div>
                    )}
                  </div>

                  {/* Footer Tanggal / Juri jika ada */}
                  {ba && (
                    <div className="px-4 py-2 bg-slate-50/50 border-t border-slate-100 text-[10px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
                      <span>Ketetapan: {ba.tanggalPenetapan}</span>
                      <div className="flex items-center gap-2">
                        {ba.namaKetuaJuri && (
                          <span>Juri I: <strong className="text-slate-700 font-semibold">{ba.namaKetuaJuri}</strong></span>
                        )}
                        {ba.namaAnggotaJuri && (
                          <span>&bull; Juri II: <strong className="text-slate-700 font-semibold">{ba.namaAnggotaJuri}</strong></span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
