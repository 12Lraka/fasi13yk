/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Modal Form Pendaftaran Santri & Fitur Draft Antrian Masal
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  User,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Phone,
  Plus,
  Send,
  Trash2,
  Edit3,
  Layers,
  Sparkles,
  Check,
  RotateCcw,
} from 'lucide-react';
import { Participant, ParticipantDraft, UserSession, Gender } from '../../types/fasi';
import { KEMANTREN_LIST, CATEGORIES_LIST } from '../../data/fasiMasterData';
import { maskDateInput, evaluateFasiAge } from '../../utils/ageCalculator';
import { sanitizeInput, validateHoneypot } from '../../utils/security';
import {
  generateRegistrationNumber,
  getStoredDrafts,
  saveDrafts,
  clearDrafts,
  logAuditEvent,
} from '../../utils/storage';
import { showToast, showSuccessAlert, showConfirmDialog } from '../../utils/sweetalert';

interface ParticipantFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (participant: Participant) => void;
  onSaveMultiple?: (participants: Participant[]) => void;
  editingParticipant?: Participant | null;
  session: UserSession;
  allParticipants: Participant[];
}

export const ParticipantFormModal: React.FC<ParticipantFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onSaveMultiple,
  editingParticipant,
  session,
  allParticipants = [],
}) => {
  const [activeView, setActiveView] = useState<'form' | 'drafts'>('form');

  // Form Fields
  const [fullName, setFullName] = useState<string>('');
  const [gender, setGender] = useState<Gender>('L');
  const [birthDate, setBirthDate] = useState<string>('');
  const [kemantrenId, setKemantrenId] = useState<string>(() => {
    if (session?.role === 'kemantren_admin' && session?.kemantrenId) {
      return session.kemantrenId;
    }
    return KEMANTREN_LIST[0]?.id || 'kem-1';
  });
  const [tpaUnitName, setTpaUnitName] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [documentUrl, setDocumentUrl] = useState<string>('');
  const [pjName, setPjName] = useState<string>('');
  const [whatsappNumber, setWhatsappNumber] = useState<string>('');
  const [honeypot, setHoneypot] = useState<string>('');

  const [formError, setFormError] = useState<string>('');
  const [draftSuccessMsg, setDraftSuccessMsg] = useState<string>('');

  // Drafts State
  const [drafts, setDrafts] = useState<ParticipantDraft[]>([]);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);

  // Sync Drafts on open
  useEffect(() => {
    if (isOpen) {
      try {
        setDrafts(getStoredDrafts());
      } catch {
        setDrafts([]);
      }
    }
  }, [isOpen]);

  // Sync editing participant or reset form
  useEffect(() => {
    if (!isOpen) return;

    if (editingParticipant) {
      setActiveView('form');
      setFullName(editingParticipant.fullName || '');
      setGender(editingParticipant.gender || 'L');
      setBirthDate(editingParticipant.birthDate || '');
      setKemantrenId(editingParticipant.kemantrenId || KEMANTREN_LIST[0]?.id || 'kem-1');
      setTpaUnitName(editingParticipant.tpaUnitName || '');
      setCategoryId(editingParticipant.categoryId || '');
      setDocumentUrl(editingParticipant.documentUrl || '');
      setPjName(editingParticipant.pjName || '');
      setWhatsappNumber(editingParticipant.whatsappNumber || '');
    } else {
      // Reset form fields
      setFullName('');
      setGender('L');
      setBirthDate('');
      setKemantrenId(
        session?.role === 'kemantren_admin' && session?.kemantrenId
          ? session.kemantrenId
          : KEMANTREN_LIST[0]?.id || 'kem-1'
      );
      setTpaUnitName('');
      setCategoryId('');
      setDocumentUrl('');
      setPjName('');
      setWhatsappNumber('');
    }
    setFormError('');
    setDraftSuccessMsg('');
    setEditingDraftId(null);
  }, [editingParticipant, isOpen, session]);

  const ageEvaluation = useMemo(() => {
    return evaluateFasiAge(birthDate);
  }, [birthDate]);

  // Filter cabang lomba berdasarkan jenjang usia otomatis (TKA / TPA / TQA) & jenis kelamin
  const eligibleCategories = useMemo(() => {
    return CATEGORIES_LIST.filter((cat) => {
      if (!ageEvaluation.eligibleLevel) return true;
      const matchLevel = cat.level === ageEvaluation.eligibleLevel;
      const matchGender = cat.genderRequirement === 'ALL' || cat.genderRequirement === gender;
      return matchLevel && matchGender;
    });
  }, [ageEvaluation.eligibleLevel, gender]);

  // Otomatis pilih kategori yang sesuai saat list berganti
  useEffect(() => {
    if (eligibleCategories.length > 0) {
      const isCurrentValid = eligibleCategories.some((c) => c.id === categoryId);
      if (!isCurrentValid) {
        setCategoryId(eligibleCategories[0].id);
      }
    }
  }, [eligibleCategories, categoryId]);

  if (!isOpen) return null;

  const validateFormData = (): string | null => {
    if (!validateHoneypot(honeypot)) {
      return 'Terdeteksi pengisian otomatis bot spam.';
    }
    if (!fullName.trim()) {
      return 'Nama lengkap santri wajib diisi.';
    }
    if (birthDate.length !== 10) {
      return 'Format tanggal lahir belum lengkap (Gunakan DD/MM/YYYY).';
    }
    if (!ageEvaluation.isEligible) {
      return ageEvaluation.statusMessage || 'Santri tidak memenuhi kriteria usia FASI XIII per 1 Juli 2027.';
    }
    if (!tpaUnitName.trim()) {
      return 'Nama Unit TKA/TPA asal santri wajib diisi.';
    }
    if (!categoryId) {
      return 'Pilih cabang lomba yang akan diikuti santri.';
    }
    if (!pjName.trim()) {
      return 'Nama Penanggung Jawab (PJ / Ustadz) wajib diisi.';
    }
    if (!whatsappNumber.trim() || whatsappNumber.length < 9) {
      return 'Nomor WhatsApp Penanggung Jawab wajib diisi dengan benar.';
    }

    return null;
  };

  // 1. Simpan Langsung 1 Santri
  const handleSaveDirect = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const error = validateFormData();
    if (error) {
      setFormError(error);
      showToast('warning', error);
      return;
    }

    const regNumber = editingParticipant
      ? editingParticipant.registrationNumber
      : generateRegistrationNumber(kemantrenId, categoryId, allParticipants || []);

    const participantData: Participant = {
      id: editingParticipant ? editingParticipant.id : `p-${Date.now()}`,
      registrationNumber: regNumber,
      fullName: sanitizeInput(fullName),
      gender,
      birthDate,
      ageOnCutoff: {
        years: ageEvaluation.years ?? 0,
        months: ageEvaluation.months ?? 0,
        days: ageEvaluation.days ?? 0,
        isValid: ageEvaluation.isEligible ?? false,
        levelEligible: ageEvaluation.eligibleLevel ?? null,
      },
      tpaUnitName: sanitizeInput(tpaUnitName),
      kemantrenId,
      categoryId,
      documentUrl: documentUrl.trim() || undefined,
      lotteryNumber: editingParticipant ? editingParticipant.lotteryNumber : null,
      pjName: sanitizeInput(pjName),
      whatsappNumber: sanitizeInput(whatsappNumber),
      photoUrl:
        editingParticipant?.photoUrl ||
        'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&h=200&fit=crop&crop=faces',
      status: 'verified',
      attendance: editingParticipant ? editingParticipant.attendance : 'belum_hadir',
      createdAt: editingParticipant ? editingParticipant.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(participantData);
    showSuccessAlert(
      editingParticipant ? 'Perubahan Disimpan!' : 'Santri Berhasil Didaftarkan!',
      `Nomor Registrasi: ${regNumber} - ${participantData.fullName}`
    );
    onClose();
  };

  // 2. Tambah / Perbarui ke Antrian Draft
  const handleAddToDraft = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const error = validateFormData();
    if (error) {
      setFormError(error);
      showToast('warning', error);
      return;
    }

    const draftItem: ParticipantDraft = {
      id: editingDraftId || `draft-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      fullName: sanitizeInput(fullName),
      gender,
      birthDate,
      ageOnCutoff: {
        years: ageEvaluation.years ?? 0,
        months: ageEvaluation.months ?? 0,
        days: ageEvaluation.days ?? 0,
        isValid: ageEvaluation.isEligible ?? false,
        levelEligible: ageEvaluation.eligibleLevel ?? null,
      },
      tpaUnitName: sanitizeInput(tpaUnitName),
      kemantrenId,
      categoryId,
      pjName: sanitizeInput(pjName),
      whatsappNumber: sanitizeInput(whatsappNumber),
      createdAt: new Date().toISOString(),
    };

    let updatedDrafts: ParticipantDraft[];
    if (editingDraftId) {
      updatedDrafts = drafts.map((d) => (d.id === editingDraftId ? draftItem : d));
      setEditingDraftId(null);
      showToast('success', `Draft santri "${draftItem.fullName}" diperbarui.`);
    } else {
      updatedDrafts = [draftItem, ...drafts];
      showToast('success', `Santri "${draftItem.fullName}" masuk ke antrian draft (${updatedDrafts.length} total).`);
    }

    setDrafts(updatedDrafts);
    saveDrafts(updatedDrafts);

    // Reset nama & tanggal lahir agar siap mengetik santri berikutnya, tetap pertahankan Unit/PJ untuk efisiensi
    setFullName('');
    setBirthDate('');
    setGender('L');
  };

  // 3. Edit Draft Item
  const handleEditDraftItem = (draft: ParticipantDraft) => {
    setEditingDraftId(draft.id);
    setFullName(draft.fullName);
    setGender(draft.gender);
    setBirthDate(draft.birthDate);
    setKemantrenId(draft.kemantrenId);
    setTpaUnitName(draft.tpaUnitName);
    setCategoryId(draft.categoryId);
    setPjName(draft.pjName || '');
    setWhatsappNumber(draft.whatsappNumber || '');
    setActiveView('form');
    showToast('info', `Memuat draft "${draft.fullName}" ke form input.`);
  };

  // 4. Hapus Draft Item
  const handleDeleteDraftItem = (id: string) => {
    const target = drafts.find((d) => d.id === id);
    const updated = drafts.filter((d) => d.id !== id);
    setDrafts(updated);
    saveDrafts(updated);
    if (editingDraftId === id) {
      setEditingDraftId(null);
    }
    showToast('info', `Draft "${target?.fullName || 'Santri'}" dihapus.`);
  };

  // 5. Kirim Massal Semua Draft ke Sistem
  const handleBatchSubmit = async () => {
    if (drafts.length === 0) return;

    const confirmed = await showConfirmDialog(
      `Kirim Massal ${drafts.length} Santri?`,
      `Seluruh data santri dalam antrian draft akan diverifikasi dan dibuatkan nomor registrasi resmi FASI XIII.`,
      'Ya, Kirim Semua'
    );

    if (!confirmed) return;

    const currentList = [...allParticipants];
    const newParticipants: Participant[] = [];

    for (const draft of drafts) {
      const regNumber = generateRegistrationNumber(
        draft.kemantrenId,
        draft.categoryId,
        [...currentList, ...newParticipants]
      );

      const kemFallback = KEMANTREN_LIST.find((k) => k.id === draft.kemantrenId);
      const participant: Participant = {
        id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        registrationNumber: regNumber,
        fullName: draft.fullName,
        gender: draft.gender,
        birthDate: draft.birthDate,
        ageOnCutoff: draft.ageOnCutoff || {
          years: 0,
          months: 0,
          days: 0,
          isValid: true,
          levelEligible: null,
        },
        tpaUnitName: draft.tpaUnitName || `TPA ${kemFallback?.name || 'Kemantren'}`,
        kemantrenId: draft.kemantrenId,
        categoryId: draft.categoryId,
        lotteryNumber: null,
        pjName: draft.pjName?.trim() || kemFallback?.adminName || 'Admin Kontingen',
        whatsappNumber: draft.whatsappNumber?.trim() || kemFallback?.contactPerson || '081200000000',
        photoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&h=200&fit=crop&crop=faces',
        status: 'verified',
        attendance: 'belum_hadir',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      newParticipants.push(participant);
    }

    if (onSaveMultiple) {
      onSaveMultiple(newParticipants);
    } else {
      newParticipants.forEach((p) => onSave(p));
    }

    logAuditEvent(
      session.name,
      'KIRIM_MASSAL_DRAFT',
      `Berhasil mendaftarkan ${newParticipants.length} santri secara massal dari antrian draft.`
    );

    clearDrafts();
    setDrafts([]);
    showSuccessAlert(
      'Kirim Massal Berhasil!',
      `${newParticipants.length} santri resmi terdaftar dengan nomor registrasi unik FASI XIII.`
    );
    onClose();
  };

  const getCategoryName = (id: string) => CATEGORIES_LIST.find((c) => c.id === id)?.name || id;
  const getKemantrenName = (id: string) => KEMANTREN_LIST.find((k) => k.id === id)?.name || id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-6">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-900 to-emerald-950 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {editingParticipant ? 'Edit Data Santri' : 'Pendaftaran Santri FASI XIII'}
              </h3>
              <p className="text-xs text-emerald-300">
                {session?.role === 'kemantren_admin'
                  ? `Kontingen Kemantren ${getKemantrenName(session?.kemantrenId || '')}`
                  : 'BADKO TKA-TPA Kota Yogyakarta (Super Admin)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Switcher Bar (Form Input vs Antrian Draft) */}
        {!editingParticipant && (
          <div className="bg-slate-100 px-6 py-2 border-b border-slate-200 flex items-center justify-between">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveView('form')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeView === 'form'
                    ? 'bg-white text-emerald-900 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Form Input {editingDraftId ? '(Edit Draft)' : 'Santri'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView('drafts')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeView === 'drafts'
                    ? 'bg-white text-emerald-900 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-amber-600" />
                <span>Antrian Draft</span>
                {drafts.length > 0 && (
                  <span className="px-1.5 py-0.2 bg-amber-500 text-emerald-950 font-black text-[10px] rounded-full">
                    {drafts.length}
                  </span>
                )}
              </button>
            </div>

            {drafts.length > 0 && activeView === 'form' && (
              <span className="text-[11px] text-amber-800 font-semibold bg-amber-100/80 px-2 py-0.5 rounded border border-amber-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-600" />
                {drafts.length} santri di draft antrian
              </span>
            )}
          </div>
        )}

        {/* View 1: Form Input */}
        {activeView === 'form' && (
          <form className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            {/* Honeypot Bot Trap */}
            <div className="hidden" aria-hidden="true">
              <input
                type="text"
                name="_fasi_santri_trap"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 1. Nama Lengkap */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Lengkap Santri <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Contoh: Muhammad Farhan Al-Ghifari"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none font-medium text-slate-900"
                />
              </div>

              {/* 2. Jenis Kelamin */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Jenis Kelamin <span className="text-rose-600">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGender('L')}
                    className={`py-2 text-xs font-bold rounded-xl border text-center transition-all ${
                      gender === 'L'
                        ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    👦 Putra
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('P')}
                    className={`py-2 text-xs font-bold rounded-xl border text-center transition-all ${
                      gender === 'P'
                        ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    🧕 Putri
                  </button>
                </div>
              </div>

              {/* 3. Tanggal Lahir (DD/MM/YYYY) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Tanggal Lahir <span className="text-rose-600">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">DD/MM/YYYY</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={10}
                    required
                    value={birthDate}
                    onChange={(e) => setBirthDate(maskDateInput(e.target.value))}
                    placeholder="HH/BB/TTTT (Contoh: 15/04/2017)"
                    className="w-full px-3.5 py-2.5 text-xs font-mono font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* 4. Kolom Kategori Jenjang (Otomatis Sesuai Rules Usia FASI) */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Kategori Jenjang FASI <span className="text-emerald-800 font-normal text-[11px]">(Otomatis Terisi Mengikuti Rules Usia)</span>
                </label>
                <div className="p-3 bg-slate-50 border border-slate-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        ageEvaluation.isEligible
                          ? 'bg-emerald-800 text-white shadow-xs'
                          : birthDate.length >= 10
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {ageEvaluation.eligibleLevel || 'FASI'}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {ageEvaluation.eligibleLevel === 'TKA' && 'Jenjang TKA (Taman Kanak-kanak Al-Qur\'an)'}
                        {ageEvaluation.eligibleLevel === 'TPA' && 'Jenjang TPA (Taman Pendidikan Al-Qur\'an)'}
                        {ageEvaluation.eligibleLevel === 'TQA' && 'Jenjang TQA (Ta\'limul Qur\'an lil Aulad)'}
                        {!ageEvaluation.eligibleLevel && birthDate.length < 10 && 'Ketik Tanggal Lahir untuk mendeteksi Jenjang'}
                        {!ageEvaluation.eligibleLevel && birthDate.length >= 10 && 'Usia tidak memenuhi kriteria lomba'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {birthDate.length >= 10 ? (
                          <>
                            Detail Usia: <strong className="font-mono text-slate-800">{ageEvaluation.exactAgeText}</strong> (per 1 Juli 2027)
                          </>
                        ) : (
                          'Rules: TKA (Maks 7 Thn), TPA (>7 s/d 12 Thn), TQA (>12 s/d 15 Thn)'
                        )}
                      </div>
                    </div>
                  </div>

                  {ageEvaluation.eligibleLevel && (
                    <span className="inline-flex items-center gap-1 self-start sm:self-auto px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                      Lolos Kategori {ageEvaluation.eligibleLevel}
                    </span>
                  )}
                </div>
              </div>

              {/* 5. Kontingen Kemantren */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Kontingen Kecamatan (Kemantren) <span className="text-rose-600">*</span>
                </label>
                <select
                  disabled={session?.role === 'kemantren_admin'}
                  value={kemantrenId}
                  onChange={(e) => setKemantrenId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none font-semibold disabled:opacity-80"
                >
                  {KEMANTREN_LIST.map((k) => (
                    <option key={k.id} value={k.id}>
                      Kemantren {k.name} ({k.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* 6. Nama Unit TKA/TPA */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Unit TKA / TPA <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={tpaUnitName}
                  onChange={(e) => setTpaUnitName(e.target.value)}
                  placeholder="Contoh: TPA Masjid Perak"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                />
              </div>

              {/* 7. Cabang Lomba (Otomatis Filter Berdasarkan Kategori & Gender) */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Cabang Lomba <span className="text-rose-600">*</span>
                  </label>
                  {ageEvaluation.eligibleLevel && (
                    <span className="text-[11px] text-emerald-800 font-semibold">
                      Filter Otomatis: Jenjang {ageEvaluation.eligibleLevel} ({gender === 'L' ? 'Putra' : 'Putri'})
                    </span>
                  )}
                </div>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none font-semibold text-slate-900"
                >
                  {eligibleCategories.length === 0 ? (
                    <option value="">Tidak ada cabang lomba yang cocok</option>
                  ) : (
                    eligibleCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        [{c.level}] {c.name} {c.isGroup ? '(Grup)' : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* 8. Nama PJ */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Penanggung Jawab (PJ) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={pjName}
                  onChange={(e) => setPjName(e.target.value)}
                  placeholder="Contoh: Ust. Hasan Basri"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                />
              </div>

              {/* 9. Nomor WA */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nomor WhatsApp PJ <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value.replace(/[^\d+]/g, ''))}
                    placeholder="0812xxxxxxxx"
                    className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* 10. Link Dokumen Berkas Santri (Google Drive / Akta / KK / Surat Tugas) */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Link Berkas Dokumen Santri <span className="text-slate-400 font-normal text-[11px]">(Google Drive / PDF / Akta / KK - Opsional)</span>
                </label>
                <input
                  type="url"
                  value={documentUrl}
                  onChange={(e) => setDocumentUrl(e.target.value)}
                  placeholder="https://drive.google.com/... atau tautan berkas digital"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Footer Buttons: Save Direct & Add to Draft */}
            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {!editingParticipant && (
                  <button
                    type="button"
                    onClick={handleAddToDraft}
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{editingDraftId ? 'Perbarui di Draft' : '+ Tambah ke Draft'}</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Tutup
                </button>

                <button
                  type="button"
                  onClick={handleSaveDirect}
                  className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingParticipant ? 'Simpan Perubahan' : 'Simpan Langsung'}</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* View 2: Antrian Draft & Kirim Massal */}
        {activeView === 'drafts' && (
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-900">
                  Antrian Draft Peserta ({drafts.length} Santri)
                </h4>
                <p className="text-xs text-slate-500">
                  Kumpulkan data seluruh santri, periksa kembali, lalu kirim massal ke sistem sekaligus.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveView('form')}
                className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Input Santri Lain</span>
              </button>
            </div>

            {/* List of Drafted Participants */}
            {drafts.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500 space-y-3">
                <Layers className="w-10 h-10 mx-auto text-slate-400" />
                <p className="text-xs">
                  Belum ada santri di antrian draft. Buka form dan klik <strong>"+ Tambah ke Draft"</strong> untuk mengisi secara bertahap.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveView('form')}
                  className="px-4 py-2 bg-emerald-800 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Mulai Input Santri
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                  {drafts.map((d, index) => (
                    <div
                      key={d.id || `draft-${index}`}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                            #{index + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{d.fullName}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            {d.gender === 'L' ? '👦 Putra' : '🧕 Putri'} • {d.ageOnCutoff?.levelEligible || 'FASI'}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-3 gap-y-0.5">
                          <span>
                            <strong>Cabang:</strong> {getCategoryName(d.categoryId)}
                          </span>
                          <span>
                            <strong>Unit:</strong> {d.tpaUnitName}
                          </span>
                          <span>
                            <strong>PJ:</strong> {d.pjName || '-'} {d.whatsappNumber ? `(${d.whatsappNumber})` : ''}
                          </span>
                          <span>
                            <strong>Usia:</strong> {d.ageOnCutoff?.years ?? 0} Thn {d.ageOnCutoff?.months ?? 0} Bln
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleEditDraftItem(d)}
                          title="Edit Santri Ini"
                          className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDraftItem(d.id)}
                          title="Hapus dari Draft"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Batch Action Bar */}
                <div className="bg-gradient-to-r from-emerald-900 to-emerald-950 p-4 rounded-2xl text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
                  <div>
                    <span className="font-bold text-xs block text-amber-300">
                      Siap Mengirim {drafts.length} Data Santri
                    </span>
                    <span className="text-[11px] text-emerald-200">
                      Semua data santri akan otomatis diberi nomor registrasi resmi FASI XIII.
                    </span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={async () => {
                        const ok = await showConfirmDialog(
                          'Bersihkan Antrian Draft?',
                          'Semua data santri di dalam draft antrian akan dihapus.',
                          'Ya, Bersihkan',
                          '#dc2626'
                        );
                        if (ok) {
                          clearDrafts();
                          setDrafts([]);
                          showToast('info', 'Antrian draft telah dibersihkan.');
                        }
                      }}
                      className="px-3 py-2 bg-emerald-800/80 hover:bg-rose-900/80 text-emerald-200 hover:text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                      Kosongkan
                    </button>

                    <button
                      type="button"
                      onClick={handleBatchSubmit}
                      className="flex-1 sm:flex-initial px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 whitespace-nowrap cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>Kirim Massal Semua ({drafts.length})</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
