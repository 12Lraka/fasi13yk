import React, { useState, useMemo, useEffect } from 'react';
import { 
  Award, 
  Trophy, 
  Medal, 
  Sparkles, 
  RefreshCw, 
  Star, 
  CheckCircle2, 
  ChevronRight,
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

interface RayonTally {
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

  const [activeTab, setActiveTab] = useState<'umum' | 'tka' | 'tpa' | 'tqa'>('umum');
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

  // Kalkulasi Klasemen Rayon (berdasarkan tab aktif: Umum, TKA, TPA, TQA)
  const standings = useMemo(() => {
    const talliesMap: Record<string, RayonTally> = {};

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

    const findTally = (kemName?: string): RayonTally | undefined => {
      if (!kemName) return undefined;
      const clean = kemName.trim().toLowerCase().replace(/^kemantren\s+/i, '').replace(/^rayon\s+/i, '');
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
          className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
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
          className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
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
          className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
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
          className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'tqa'
              ? 'bg-purple-800 text-white shadow-sm font-bold'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Award className="w-4 h-4 text-purple-400" />
          <span>Juara Kategori TQA</span>
        </button>
      </div>

      {/* Konten Klasemen Umum & Kategori */}
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
                  Rayon {top2.nama}
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
                  Rayon {top1.nama}
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
                  Rayon {top3.nama}
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

        {/* Tabel Lengkap Perolehan Medali 14 Rayon */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Klasemen Resmi 14 Rayon ({activeTab === 'umum' ? 'Semua Jenjang' : `Jenjang ${activeTab.toUpperCase()}`})
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
                  <th className="py-3.5 px-4">Kontingen Rayon</th>
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
                      Rayon {tally.nama}
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
    </div>
  );
};
