/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Modal Rekapitulasi Nilai Juri & Penetapan Juara
 */

import React, { useState, useEffect } from 'react';
import { X, Award, Star, CheckCircle2, Calculator, Sparkles } from 'lucide-react';
import { Participant, UserSession } from '../../types/fasi';
import { CATEGORIES_LIST, KEMANTREN_LIST } from '../../data/fasiMasterData';
import { logAuditEvent } from '../../utils/storage';
import { showToast, showSuccessAlert } from '../../utils/sweetalert';

interface JudgingModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant: Participant | null;
  onSaveScore: (updatedParticipant: Participant) => void;
  session: UserSession;
}

export const JudgingModal: React.FC<JudgingModalProps> = ({
  isOpen,
  onClose,
  participant,
  onSaveScore,
  session,
}) => {
  const [score1, setScore1] = useState<number>(0);
  const [score2, setScore2] = useState<number>(0);
  const [score3, setScore3] = useState<number>(0);
  const [rank, setRank] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (participant) {
      setScore1(participant.scoreJury1 || 85);
      setScore2(participant.scoreJury2 || 85);
      setScore3(participant.scoreJury3 || 85);
      setRank(participant.rank || 0);
      setNotes(participant.notes || '');
    }
  }, [participant, isOpen]);

  if (!isOpen || !participant) return null;

  const totalScore = Number(score1) + Number(score2) + Number(score3);
  const averageScore = totalScore / 3;

  const cat = CATEGORIES_LIST.find((c) => c.id === participant.categoryId);
  const kem = KEMANTREN_LIST.find((k) => k.id === participant.kemantrenId);

  const isSpecialCategory =
    cat &&
    ((cat.level === 'TKA' && cat.name.toLowerCase().includes('tartil')) ||
      (cat.level === 'TPA' && cat.name.toLowerCase().includes('tartil')) ||
      (cat.level === 'TQA' && (cat.name.toLowerCase().includes('tilawati') || cat.name.toLowerCase().includes('tilawah'))));

  const p1 = isSpecialCategory ? 7 : 5;
  const p2 = isSpecialCategory ? 5 : 3;
  const p3 = isSpecialCategory ? 3 : 1;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const updated: Participant = {
      ...participant,
      scoreJury1: Number(score1),
      scoreJury2: Number(score2),
      scoreJury3: Number(score3),
      totalScore,
      averageScore,
      rank: Number(rank) > 0 ? Number(rank) : undefined,
      notes,
      attendance: 'sudah_tampil',
      updatedAt: new Date().toISOString(),
    };

    onSaveScore(updated);

    logAuditEvent(
      session.name,
      'INPUT_NILAI_JURI',
      `Input nilai santri ${participant.fullName} (${participant.registrationNumber}) rata-rata: ${averageScore.toFixed(
        2
      )}${rank > 0 ? ` [Juara ${rank}]` : ''}.`
    );

    showToast('success', `Nilai ${participant.fullName} (${averageScore.toFixed(2)}) berhasil disimpan.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 to-emerald-950 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Penilaian & Penetapan Juara</h3>
              <p className="text-xs text-emerald-300">Dewan Hakim FASI XIII Kota Yogyakarta</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {/* Identity Snippet */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-emerald-800">{participant.registrationNumber}</span>
              {participant.lotteryNumber && (
                <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded text-[11px] font-mono">
                  No. Tampil: {String(participant.lotteryNumber).padStart(2, '0')}
                </span>
              )}
            </div>
            <h4 className="font-bold text-sm text-slate-900 mt-1">{participant.fullName}</h4>
            <p className="text-slate-500 text-[11px]">
              Kemantren {kem?.name} • Cabang: {cat?.name} ({cat?.level})
            </p>
          </div>

          {/* Scores for 3 Juries */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Juri 1 (Tajwid/Materi)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                required
                value={score1}
                onChange={(e) => setScore1(Number(e.target.value))}
                className="w-full px-3 py-2 text-center text-base font-bold font-mono bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Juri 2 (Fashahah/Lagu)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                required
                value={score2}
                onChange={(e) => setScore2(Number(e.target.value))}
                className="w-full px-3 py-2 text-center text-base font-bold font-mono bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Juri 3 (Adab/Penampilan)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                required
                value={score3}
                onChange={(e) => setScore3(Number(e.target.value))}
                className="w-full px-3 py-2 text-center text-base font-bold font-mono bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Score Summary Box */}
          <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
            <div>
              <span className="text-emerald-800 block text-[11px]">Total Nilai:</span>
              <strong className="text-emerald-950 font-mono text-base font-bold">{totalScore}</strong>
            </div>
            <div className="text-right">
              <span className="text-emerald-800 block text-[11px]">Rata-Rata Skor Akhir:</span>
              <strong className="text-emerald-950 font-mono text-base font-bold">
                {averageScore.toFixed(2)} / 100
              </strong>
            </div>
          </div>

          {/* Penetapan Juara */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Penetapan Peringkat / Juara Resmi:
              </label>
              <span className="text-[11px] font-semibold text-emerald-800">
                {isSpecialCategory ? '🌟 Bobot Khusus (7-5-3 Poin)' : 'Bobot Standar (5-3-1 Poin)'}
              </span>
            </div>
            <select
              value={rank}
              onChange={(e) => setRank(Number(e.target.value))}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none font-bold text-slate-900"
            >
              <option value={0}>Peserta Reguler (Bukan Juara)</option>
              <option value={1}>🥇 Juara 1 (Medali Emas - {p1} Poin)</option>
              <option value={2}>🥈 Juara 2 (Medali Perak - {p2} Poin)</option>
              <option value={3}>🥉 Juara 3 (Medali Perunggu - {p3} Poin)</option>
              <option value={4}>🎗️ Juara Harapan 1</option>
              <option value={5}>🎗️ Juara Harapan 2</option>
              <option value={6}>🎗️ Juara Harapan 3</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Catatan Dewan Hakim / Evaluasi
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan tajwid, intonasi, atau masukan untuk santri..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
            ></textarea>
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
            >
              Simpan & Tetapkan Skor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
