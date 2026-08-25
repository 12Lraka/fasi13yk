/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Generator & Pengacak Nomor Undian Tampil (Lotto Draw Engine)
 */

import React, { useState } from 'react';
import { X, Dices, Sparkles, CheckCircle2, Lock, Shuffle, AlertCircle } from 'lucide-react';
import { Participant, UserSession } from '../../types/fasi';
import { CATEGORIES_LIST, KEMANTREN_LIST } from '../../data/fasiMasterData';
import { shuffleLotteryNumbers, logAuditEvent } from '../../utils/storage';
import { showSuccessAlert, showToast } from '../../utils/sweetalert';

interface LotteryDrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
  onUpdateParticipants: (newList: Participant[]) => void;
  session: UserSession;
}

export const LotteryDrawModal: React.FC<LotteryDrawModalProps> = ({
  isOpen,
  onClose,
  participants,
  onUpdateParticipants,
  session,
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(CATEGORIES_LIST[0].id);
  const [isShuffling, setIsShuffling] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  if (!isOpen) return null;

  const currentCategory = CATEGORIES_LIST.find((c) => c.id === selectedCategoryId);
  const categoryParticipants = participants.filter(
    (p) => p.categoryId === selectedCategoryId && p.status === 'verified'
  );

  const isAlreadyDrawn = categoryParticipants.length > 0 && categoryParticipants.every((p) => p.lotteryNumber != null);

  const handleExecuteShuffle = () => {
    if (categoryParticipants.length === 0) return;

    setIsShuffling(true);
    setSuccessMessage('');

    setTimeout(() => {
      const { updatedList, drawnCount } = shuffleLotteryNumbers(selectedCategoryId, participants);
      onUpdateParticipants(updatedList);
      setIsShuffling(false);
      setSuccessMessage(`Berhasil mengundi secara acak nomor tampil ${drawnCount} santri.`);
      showToast('success', `Pengundian nomor tampil untuk ${drawnCount} santri berhasil diacak.`);

      logAuditEvent(
        session.name,
        'UNDIAN_NOMOR_TAMPIL',
        `Pengundian nomor tampil acak cabang [${currentCategory?.code}] ${currentCategory?.name} (${drawnCount} peserta).`
      );
    }, 600);
  };

  const getKemantrenName = (id: string) => {
    const k = KEMANTREN_LIST.find((item) => item.id === id);
    return k ? k.name : id;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 to-emerald-950 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Dices className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Pengacakan Nomor Undian Tampil Lomba</h3>
              <p className="text-xs text-emerald-300">Generator Transparan & Adil FASI XIII</p>
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
        <div className="p-6 space-y-5">
          {/* Cabang Lomba Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Pilih Cabang Lomba yang Akan Diundi:
            </label>
            <select
              value={selectedCategoryId}
              onChange={(e) => {
                setSelectedCategoryId(e.target.value);
                setSuccessMessage('');
              }}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none font-semibold text-slate-900"
            >
              {CATEGORIES_LIST.map((c) => (
                <option key={c.id} value={c.id}>
                  [{c.level}] {c.name} ({participants.filter((p) => p.categoryId === c.id && p.status === 'verified').length} Peserta)
                </option>
              ))}
            </select>
          </div>

          {/* Action Trigger Card */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">
                  Total Peserta Terverifikasi: {categoryParticipants.length} Santri
                </span>
                {isAlreadyDrawn && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-3 h-3" />
                    Sudah Diundi
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Klik tombol di samping untuk mengacak urutan tampil secara otomatis.
              </p>
            </div>

            <button
              onClick={handleExecuteShuffle}
              disabled={isShuffling || categoryParticipants.length === 0}
              className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-emerald-950 font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 whitespace-nowrap"
            >
              <Shuffle className={`w-4 h-4 ${isShuffling ? 'animate-spin' : ''}`} />
              <span>{isShuffling ? 'Mengacak Undian...' : isAlreadyDrawn ? 'Undi Ulang Acak' : 'Acak Nomor Tampil'}</span>
            </button>
          </div>

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Table of Drawn Numbers */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Daftar Peserta Cabang Ini</span>
              <span>Urutan Tampil Resmi</span>
            </div>
            <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
              {categoryParticipants.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Belum ada peserta terverifikasi pada cabang lomba ini.
                </div>
              ) : (
                categoryParticipants
                  .sort((a, b) => (a.lotteryNumber || 999) - (b.lotteryNumber || 999))
                  .map((p) => (
                    <div key={p.id} className="p-3 flex items-center justify-between hover:bg-slate-50 text-xs">
                      <div>
                        <span className="font-mono text-emerald-800 font-bold block">{p.registrationNumber}</span>
                        <span className="font-semibold text-slate-900">{p.fullName}</span>
                        <span className="text-slate-400 text-[11px] block">
                          Kemantren {getKemantrenName(p.kemantrenId)} • {p.tpaUnitName}
                        </span>
                      </div>
                      <div className="text-right">
                        {p.lotteryNumber ? (
                          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-500 text-emerald-950 font-black font-mono text-sm shadow-inner">
                            {String(p.lotteryNumber).padStart(2, '0')}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Belum Ada Nomor</span>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Hasil undian otomatis tercatat ke kartu peserta & sistem dewan juri.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
