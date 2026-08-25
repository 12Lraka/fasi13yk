/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Live Scoreboard & Klasemen Perolehan Medali 14 Kemantren
 */

import React, { useMemo } from 'react';
import { Award, Trophy, Medal, Sparkles, RefreshCw, Star, ShieldCheck } from 'lucide-react';
import { Participant, MedalTally } from '../../types/fasi';
import { calculateMedalTallies } from '../../utils/storage';
import { CATEGORIES_LIST } from '../../data/fasiMasterData';

interface LiveScoreboardProps {
  participants: Participant[];
}

export const LiveScoreboard: React.FC<LiveScoreboardProps> = ({ participants }) => {
  const medalTallies = useMemo(() => {
    return calculateMedalTallies(participants);
  }, [participants]);

  // Peserta berprestasi (Juara 1, 2, 3)
  const winnersList = useMemo(() => {
    return participants
      .filter((p) => p.rank && p.rank <= 3)
      .sort((a, b) => (a.categoryId.localeCompare(b.categoryId)) || (a.rank || 0) - (b.rank || 0));
  }, [participants]);

  const top1 = medalTallies[0];
  const top2 = medalTallies[1];
  const top3 = medalTallies[2];

  const getCategoryName = (catId: string) => {
    const c = CATEGORIES_LIST.find((item) => item.id === catId);
    return c ? `[${c.level}] ${c.name}` : catId;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-950 rounded-2xl p-6 text-white shadow-md border border-emerald-700/50">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-400/20 border border-amber-400/30 text-amber-300">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-amber-300 uppercase tracking-widest">
                  LIVE SCOREBOARD RESMI
                </span>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                  Klasemen Kejuaraan
                </h2>
              </div>
            </div>
            <p className="text-xs text-emerald-200">
              Sistem kalkulasi poin otomatis
            </p>
          </div>

          <div className="flex items-center gap-2 bg-emerald-950/80 px-3.5 py-2 rounded-xl border border-emerald-700/60 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-emerald-300 font-semibold">Real-Time Sync Terverifikasi</span>
          </div>
        </div>
      </div>

      {/* Podium Top 3 Leaderboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Peringkat 2 */}
        {top2 && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between order-2 md:order-1">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                Peringkat 2
              </span>
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-black text-slate-700 text-sm">
                🥈
              </div>
            </div>
            <div className="my-3">
              <h3 className="text-lg font-bold text-slate-900 leading-tight">
                Kemantren {top2.kemantrenName}
              </h3>
              <p className="text-xs text-slate-500 font-mono">Total {top2.totalPoints} Poin</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs bg-slate-50 p-2 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400 block text-[10px]">Juara I</span>
                <strong className="text-amber-600 font-bold text-sm">{top2.gold}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Juara II</span>
                <strong className="text-slate-600 font-bold text-sm">{top2.silver}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Juara III</span>
                <strong className="text-amber-800 font-bold text-sm">{top2.bronze}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Peringkat 1 (Juara Umum) */}
        {top1 && (
          <div className="bg-gradient-to-b from-amber-50 to-white rounded-2xl p-5 border-2 border-amber-400/80 shadow-md relative overflow-hidden flex flex-col justify-between order-1 md:order-2 scale-100 md:-translate-y-2">
            <div className="absolute top-0 right-0 bg-amber-500 text-emerald-950 text-[10px] font-black px-3 py-0.5 rounded-bl-lg uppercase tracking-wider">
              KANDIDAT JUARA UMUM
            </div>
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                Peringkat 1
              </span>
              <div className="w-10 h-10 rounded-full bg-amber-400 flex items-center justify-center font-black text-amber-950 text-base shadow-sm">
                🥇
              </div>
            </div>
            <div className="my-3">
              <h3 className="text-xl font-black text-slate-900 leading-tight">
                Kemantren {top1.kemantrenName}
              </h3>
              <p className="text-xs font-bold text-amber-700 font-mono">Total {top1.totalPoints} Poin Kejuaraan</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs bg-amber-100/60 p-2.5 rounded-xl border border-amber-200">
              <div>
                <span className="text-amber-800 block text-[10px] font-semibold">Juara I</span>
                <strong className="text-amber-700 font-black text-base">{top1.gold}</strong>
              </div>
              <div>
                <span className="text-slate-600 block text-[10px] font-semibold">Juara II</span>
                <strong className="text-slate-700 font-black text-base">{top1.silver}</strong>
              </div>
              <div>
                <span className="text-amber-900 block text-[10px] font-semibold">Juara III</span>
                <strong className="text-amber-900 font-black text-base">{top1.bronze}</strong>
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
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center font-black text-amber-800 text-sm">
                🥉
              </div>
            </div>
            <div className="my-3">
              <h3 className="text-lg font-bold text-slate-900 leading-tight">
                Kemantren {top3.kemantrenName}
              </h3>
              <p className="text-xs text-slate-500 font-mono">Total {top3.totalPoints} Poin</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs bg-slate-50 p-2 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400 block text-[10px]">Juara I</span>
                <strong className="text-amber-600 font-bold text-sm">{top3.gold}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Juara II</span>
                <strong className="text-slate-600 font-bold text-sm">{top3.silver}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Juara III</span>
                <strong className="text-amber-800 font-bold text-sm">{top3.bronze}</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabel Lengkap 14 Kemantren */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Tabel Perolehan Medali 14 Kemantren</h3>
          <span className="text-xs text-slate-500">Urut Berdasarkan: Total Poin</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <th className="py-3 px-4 w-14 text-center">Rank</th>
                <th className="py-3 px-4">Kontingen Kemantren</th>
                <th className="py-3 px-4 text-center bg-amber-50/60 text-amber-900 font-bold w-20">Juara I</th>
                <th className="py-3 px-4 text-center bg-slate-100/60 text-slate-800 font-bold w-20">Juara II</th>
                <th className="py-3 px-4 text-center bg-orange-50/60 text-orange-900 font-bold w-20">Juara III</th>
                <th className="py-3 px-4 text-center w-24">Harapan 1/2/3</th>
                <th className="py-3 px-4 text-center font-black bg-emerald-50 text-emerald-950 w-24">Total Poin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {medalTallies.map((tally) => (
                <tr
                  key={tally.kemantrenId}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    tally.rank <= 3 ? 'font-semibold bg-emerald-50/20' : ''
                  }`}
                >
                  <td className="py-3 px-4 text-center">
                    {tally.rank === 1 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-amber-950 font-black text-xs">
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
                  <td className="py-3 px-4 font-medium text-slate-900">
                    Kemantren {tally.kemantrenName}
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-amber-700 bg-amber-50/30">
                    {tally.gold}
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-slate-700 bg-slate-100/30">
                    {tally.silver}
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-orange-800 bg-orange-50/30">
                    {tally.bronze}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-500 font-mono">
                    {tally.harapan1 + tally.harapan2 + tally.harapan3}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-emerald-800 bg-emerald-50/50 text-sm">
                    {tally.totalPoints}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Santri Peraih Medali Terbaru */}
      {winnersList.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
              <h3 className="font-bold text-slate-900 text-base">Daftar Santri Berprestasi (Juara Resmi)</h3>
            </div>
            <span className="text-xs text-slate-400">{winnersList.length} Pemenang Terdata</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {winnersList.map((p) => (
              <div
                key={p.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start gap-3"
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${
                    p.rank === 1
                      ? 'bg-amber-400 text-amber-950'
                      : p.rank === 2
                      ? 'bg-slate-300 text-slate-800'
                      : 'bg-amber-200 text-amber-900'
                  }`}
                >
                  {p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : '🥉'}
                </div>
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider truncate">
                    {getCategoryName(p.categoryId)}
                  </div>
                  <div className="font-bold text-slate-900 text-xs truncate">{p.fullName}</div>
                  <div className="text-[11px] text-slate-500 truncate">{p.tpaUnitName}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Skor: {p.averageScore?.toFixed(2)} / 100
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
