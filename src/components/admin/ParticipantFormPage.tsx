/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Dedicated Full-Page Form Input Peserta & Antrian Draft Masal
 * Dirancang untuk kenyamanan input intensif di monitor/laptop tanpa batasan modal dialog.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  User,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Phone,
  Plus,
  Trash2,
  Edit3,
  Layers,
  Sparkles,
  Check,
  ArrowLeft,
  Building2,
  Award,
  ShieldCheck,
  Users2,
  Info,
  RotateCcw,
  AlertTriangle,
  HelpCircle,
  X,
  BookOpen,
  CheckCircle,
  ListFilter,
  FileText,
  Clock,
  Sparkle,
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
  getStoredSettings,
} from '../../utils/storage';
import { showToast, showSuccessAlert, showConfirmDialog } from '../../utils/sweetalert';
import { getThemeConfig } from '../../utils/theme';
import { isSupabaseConfigured } from '../../lib/supabase';

interface ParticipantFormPageProps {
  session: UserSession;
  allParticipants: Participant[];
  onSave: (participant: Participant) => Promise<{ success: boolean; error?: string }> | Promise<any> | void;
  onSaveMultiple?: (participants: Participant[]) => Promise<{ success: boolean; error?: string }> | Promise<any> | void;
  editingParticipant?: Participant | null;
  onBack: () => void;
}

export const ParticipantFormPage: React.FC<ParticipantFormPageProps> = ({
  session,
  allParticipants = [],
  onSave,
  onSaveMultiple,
  editingParticipant = null,
  onBack,
}) => {
  const settings = getStoredSettings();
  const theme = getThemeConfig(settings?.themeColor);

  const [activeTab, setActiveTab] = useState<'form' | 'drafts'>('form');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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
  const [pjName, setPjName] = useState<string>('');
  const [whatsappNumber, setWhatsappNumber] = useState<string>('');
  const [honeypot, setHoneypot] = useState<string>('');

  const [formError, setFormError] = useState<string>('');

  // Dismissible Tutorial Card State
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('fasi_form_tutorial_dismissed');
      return saved !== 'true';
    } catch {
      return true;
    }
  });

  // Modal Cek Cabang Belum Terisi
  const [showMissingModal, setShowMissingModal] = useState<boolean>(false);
  const [missingFilter, setMissingFilter] = useState<'all' | 'TKA' | 'TPA' | 'TQA'>('all');

  const handleDismissTutorial = () => {
    setShowTutorial(false);
    try {
      localStorage.setItem('fasi_form_tutorial_dismissed', 'true');
    } catch {
      // ignore
    }
  };

  const handleOpenTutorial = () => {
    setShowTutorial(true);
    try {
      localStorage.removeItem('fasi_form_tutorial_dismissed');
    } catch {
      // ignore
    }
  };

  // Drafts State
  const [drafts, setDrafts] = useState<ParticipantDraft[]>([]);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);

  // Sync Drafts on mount
  useEffect(() => {
    try {
      setDrafts(getStoredDrafts());
    } catch {
      setDrafts([]);
    }
  }, []);

  // Sync editing participant or reset form
  useEffect(() => {
    if (editingParticipant) {
      setActiveTab('form');
      setFullName(editingParticipant.fullName || '');
      setGender(editingParticipant.gender || 'L');
      setBirthDate(editingParticipant.birthDate || '');
      setKemantrenId(editingParticipant.kemantrenId || KEMANTREN_LIST[0]?.id || 'kem-1');
      setTpaUnitName(editingParticipant.tpaUnitName || '');
      setCategoryId(editingParticipant.categoryId || '');
      setPjName(editingParticipant.pjName || '');
      setWhatsappNumber(editingParticipant.whatsappNumber || '');
    } else {
      // Form default
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
      setPjName('');
      setWhatsappNumber('');
    }
    setFormError('');
    setEditingDraftId(null);
  }, [editingParticipant, session]);

  // Evaluasi usia FASI (Cutoff 1 Juli 2027)
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

  // Otomatis pilih kategori yang sesuai saat daftar berganti
  useEffect(() => {
    if (eligibleCategories.length > 0) {
      const isCurrentValid = eligibleCategories.some((c) => c.id === categoryId);
      if (!isCurrentValid) {
        setCategoryId(eligibleCategories[0].id);
      }
    }
  }, [eligibleCategories, categoryId]);

  // Cabang lomba aktif
  const currentCategoryObj = useMemo(() => {
    return CATEGORIES_LIST.find((c) => c.id === categoryId);
  }, [categoryId]);

  // Analisis Cabang Lomba yang Terisi vs Belum Terisi untuk Kontingen Ini
  const categoryStatusAnalysis = useMemo(() => {
    const kontingenParticipants = (allParticipants || []).filter(
      (p) => p.kemantrenId === kemantrenId
    );

    return CATEGORIES_LIST.map((cat) => {
      const registeredInCat = kontingenParticipants.filter((p) => p.categoryId === cat.id);
      const filledCount = registeredInCat.length;

      let isComplete = false;
      let statusLabel = 'Kosong';
      let requiredCount = 1;

      if (cat.isGroup) {
        requiredCount = cat.groupMemberCount || 3;
        if (filledCount === 0) {
          statusLabel = 'Belum Ada Anggota (0/' + requiredCount + ')';
          isComplete = false;
        } else if (filledCount < requiredCount) {
          statusLabel = `Regu Belum Lengkap (${filledCount}/${requiredCount})`;
          isComplete = false;
        } else {
          statusLabel = `Regu Lengkap (${filledCount}/${requiredCount})`;
          isComplete = true;
        }
      } else {
        requiredCount = cat.maxParticipantsPerKemantren || 1;
        if (filledCount === 0) {
          statusLabel = 'Belum Terisi (0/1)';
          isComplete = false;
        } else {
          statusLabel = `Terisi (${filledCount}/${requiredCount})`;
          isComplete = true;
        }
      }

      return {
        category: cat,
        filledCount,
        requiredCount,
        isComplete,
        statusLabel,
        registeredParticipants: registeredInCat,
      };
    });
  }, [allParticipants, kemantrenId]);

  const missingCategoriesCount = useMemo(() => {
    return categoryStatusAnalysis.filter((item) => !item.isComplete).length;
  }, [categoryStatusAnalysis]);

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

  // 1. Simpan Langsung 1 Santri (Langsung ke Supabase / Database)
  const handleSaveDirect = async (e: React.FormEvent, andKeepContext: boolean = false) => {
    e.preventDefault();
    if (isSubmitting) return;
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
      documentUrl: editingParticipant?.documentUrl || undefined,
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

    setIsSubmitting(true);
    try {
      const res = await onSave(participantData);
      if (res && typeof res === 'object' && res.success === false) {
        setIsSubmitting(false);
        return;
      }

      showSuccessAlert(
        editingParticipant ? 'Perubahan Disimpan!' : 'Santri Berhasil Didaftarkan!',
        `Nomor Registrasi: ${regNumber} - ${participantData.fullName}${
          isSupabaseConfigured() ? ' (Tersimpan di Database Supabase)' : ''
        }`
      );

      if (andKeepContext) {
        // Tetap di halaman, reset identitas personal santri tapi kunci Unit/Cabang/PJ (Sangat ideal untuk regu/batch)
        setFullName('');
        setBirthDate('');
        setGender('L');
        showToast('info', 'Data tersimpan ke Supabase! Form siap untuk anggota/santri berikutnya dari unit & cabang ini.');
      } else {
        onBack();
      }
    } finally {
      setIsSubmitting(false);
    }
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

    // Reset nama & tanggal lahir agar siap mengetik santri berikutnya
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
    setActiveTab('form');
    showToast('info', `Memuat draft "${draft.fullName}" ke formulir.`);
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

    setIsSubmitting(true);
    try {
      if (onSaveMultiple) {
        const res = await onSaveMultiple(newParticipants);
        if (res && typeof res === 'object' && res.success === false) {
          setIsSubmitting(false);
          return;
        }
      } else {
        for (const p of newParticipants) {
          const res = await onSave(p);
          if (res && typeof res === 'object' && res.success === false) {
            setIsSubmitting(false);
            return;
          }
        }
      }

      logAuditEvent(
        session.name,
        'KIRIM_MASSAL_DRAFT',
        `Berhasil mendaftarkan ${newParticipants.length} santri secara massal dari antrian draft ke database.`
      );

      clearDrafts();
      setDrafts([]);
      showSuccessAlert(
        'Kirim Massal Berhasil!',
        `${newParticipants.length} santri resmi terdaftar dengan nomor registrasi unik FASI XIII${
          isSupabaseConfigured() ? ' dan langsung tersimpan di database Supabase' : ''
        }.`
      );
      onBack();
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryName = (id: string) => CATEGORIES_LIST.find((c) => c.id === id)?.name || id;
  const getKemantrenName = (id: string) => KEMANTREN_LIST.find((k) => k.id === id)?.name || id;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-950 rounded-2xl p-6 text-white shadow-sm border border-emerald-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all cursor-pointer"
            title="Kembali ke Daftar Peserta"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-emerald-950 uppercase tracking-wider">
                Mode Halaman Penuh
              </span>
              <span className="text-xs text-emerald-300">
                {session?.role === 'kemantren_admin'
                  ? `Kontingen Rayon ${getKemantrenName(session?.kemantrenId || '')}`
                  : 'Super Admin BADKO Kota'}
              </span>
              {isSupabaseConfigured() ? (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-700/80 text-emerald-100 border border-emerald-500/50 flex items-center gap-1.5 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  Database: Supabase Aktif
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-900/60 text-amber-200 border border-amber-700/50 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Penyimpanan Lokal
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight mt-1">
              {editingParticipant ? 'Edit Data Santri FASI' : 'Formulir Pendaftaran Santri FASI XIII'}
            </h1>
            <p className="text-xs text-emerald-200 mt-0.5">
              Tata letak luas dan lega dirancang khusus untuk kenyamanan input data masal.
            </p>
          </div>
        </div>

        {/* Tab Switcher & Quick Actions */}
        {!editingParticipant && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowMissingModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer bg-emerald-800/80 hover:bg-emerald-700 text-white border border-emerald-600/60 shadow-xs"
              title="Periksa cabang lomba apa saja yang kuotanya masih kosong atau belum lengkap"
            >
              <ListFilter className="w-4 h-4 text-amber-300" />
              <span>Status Cabang ({missingCategoriesCount} Belum Lengkap)</span>
            </button>

            {!showTutorial && (
              <button
                type="button"
                onClick={handleOpenTutorial}
                className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer bg-emerald-950/60 hover:bg-emerald-900 text-emerald-200 hover:text-white border border-emerald-700/40"
                title="Buka kembali panduan alur pengisian santri"
              >
                <BookOpen className="w-4 h-4 text-emerald-300" />
                <span>Panduan Input</span>
              </button>
            )}

            <div className="flex items-center gap-1 bg-emerald-950/60 p-1.5 rounded-xl border border-emerald-700/40">
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'form'
                    ? 'bg-amber-400 text-emerald-950 shadow-sm'
                    : 'text-emerald-200 hover:text-white hover:bg-white/5'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Form {editingDraftId ? '(Edit)' : ''}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('drafts')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'drafts'
                    ? 'bg-amber-400 text-emerald-950 shadow-sm'
                    : 'text-emerald-200 hover:text-white hover:bg-white/5'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Draft</span>
                {drafts.length > 0 && (
                  <span className="px-1.5 py-0.5 bg-emerald-900 text-amber-300 font-extrabold text-[10px] rounded-full">
                    {drafts.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dismissible Tutorial Card */}
      {showTutorial && !editingParticipant && (
        <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-5 sm:p-6 border border-emerald-600/40 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex items-start gap-3.5 flex-1">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-emerald-950 flex items-center justify-center shrink-0 font-black shadow-md mt-0.5">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="space-y-3 flex-1">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-black uppercase tracking-wider">
                      Petunjuk Operator Rayon
                    </span>
                    <span className="text-[11px] text-emerald-200 font-medium hidden sm:inline">
                      Simak 4 aturan utama agar input data lancar & tanpa kendala
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-white mt-1">
                    Panduan Tata Cara Input Peserta & Cabang Lomba FASI XIII
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                  {/* Poin 1: Validasi Otomatis */}
                  <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3.5 border border-white/10 space-y-1.5">
                    <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                      <span>1. Validasi Otomatis</span>
                    </div>
                    <p className="text-[11px] text-emerald-100/90 leading-relaxed">
                      Ketik tanggal lahir (DD/MM/YYYY) dan pilih jenis kelamin. Sistem otomatis menghitung usia per <strong>1 Juli 2027</strong> dan menyaring cabang lomba yang sah (TKA, TPA, atau TQA).
                    </p>
                  </div>

                  {/* Poin 2: Input Beregu */}
                  <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3.5 border border-white/10 space-y-1.5">
                    <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                      <Users2 className="w-4 h-4 shrink-0" />
                      <span>2. Peserta Beregu</span>
                    </div>
                    <p className="text-[11px] text-emerald-100/90 leading-relaxed">
                      Setiap anggota regu diinput satu per satu. Pastikan <strong>Nama Unit TPA</strong> ditulis sama persis agar sistem menyatukan seluruh anggota ke dalam satu tim regu yang sama.
                    </p>
                  </div>

                  {/* Poin 3: Tombol Simpan */}
                  <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3.5 border border-white/10 space-y-1.5">
                    <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                      <RotateCcw className="w-4 h-4 shrink-0" />
                      <span>3. Pilih Tombol Simpan</span>
                    </div>
                    <p className="text-[11px] text-emerald-100/90 leading-relaxed">
                      • <strong className="text-white">Simpan & Lanjut Input</strong>: Untuk santri individu berurutan atau anggota regu ke-1 & ke-2 (nama dibersihkan, unit & cabang tetap terkunci). Data langsung tersimpan ke Supabase.<br />
                      • <strong className="text-white">Simpan & Selesai</strong>: Jika sudah selesai menginput santri atau ini santri/anggota regu terakhir (kembali ke tabel peserta).
                    </p>
                  </div>

                  {/* Poin 4: Fitur Draft */}
                  <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3.5 border border-white/10 space-y-1.5">
                    <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                      <Layers className="w-4 h-4 shrink-0" />
                      <span>4. Fitur Antrian Draft</span>
                    </div>
                    <p className="text-[11px] text-emerald-100/90 leading-relaxed">
                      Klik <strong className="text-white">+ Tambah ke Draft</strong> jika ingin mengumpulkan santri secara lokal terlebih dahulu, lalu kirim sekaligus secara massal melalui tab <em>Antrian Draft</em>.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDismissTutorial}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors self-end md:self-start shrink-0 cursor-pointer"
              title="Tutup panduan ini (dapat dibuka kembali sewaktu-waktu)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {activeTab === 'form' && (
        <form onSubmit={(e) => handleSaveDirect(e, false)} className="space-y-6">
          {formError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3 shadow-xs">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <div>
                <strong className="block font-bold">Terjadi Kesalahan Validasi:</strong>
                <span>{formError}</span>
              </div>
            </div>
          )}

          {/* Honeypot Bot Trap */}
          <div className="hidden" aria-hidden="true">
            <input
              type="text"
              name="_fasi_santri_trap_page"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          {/* Banner Peringatan Lomba Beregu (Muncul jika cabang lomba yang dipilih adalah beregu) */}
          {currentCategoryObj?.isGroup && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center gap-3.5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-700" />
              </div>
              <div className="flex-1 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-black text-xs uppercase tracking-wide px-2 py-0.5 rounded-md bg-amber-500 text-amber-950">
                    Peringatan Khusus Cabang Beregu ({currentCategoryObj.groupMemberCount || 3} Santri)
                  </span>
                </div>
                <p className="text-xs font-bold text-amber-900 leading-relaxed pt-0.5">
                  &ldquo;Jangan menginput cabang lomba beregu sebelum data seluruh anggota regu tersebut sudah lengkap terkumpul di tangan operator rayon.&rdquo;
                </p>
                <p className="text-[11px] text-amber-800/80">
                  Pastikan Nama Unit TPA sama persis untuk seluruh anggota regu agar sistem otomatis menyatukan tim regu.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* KOLOM KIRI: Data Pribadi & Verifikasi Usia (7 Kolom) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Kartu 1: Identitas Santri */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">1. Identitas Santri</h3>
                    <p className="text-[11px] text-slate-500">Nama lengkap sesuai akta kelahiran/KK & jenis kelamin.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Nama Lengkap */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Nama Lengkap Santri <span className="text-rose-600">*</span>
                      </label>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                        Sesuai Akta Kelahiran / KK resmi
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Contoh: Muhammad Farhan Al-Ghifari"
                      className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none font-semibold text-slate-900"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Gunakan ejaan asli huruf kapital di awal kata tanpa singkatan gelar.
                    </p>
                  </div>

                  {/* Jenis Kelamin & Tanggal Lahir */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Jenis Kelamin */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Jenis Kelamin <span className="text-rose-600">*</span>
                        </label>
                        <span className="text-[10px] text-slate-400">Menyaring cabang</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setGender('L')}
                          className={`py-2.5 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                            gender === 'L'
                              ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          Putra
                        </button>
                        <button
                          type="button"
                          onClick={() => setGender('P')}
                          className={`py-2.5 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                            gender === 'P'
                              ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          Putri
                        </button>
                      </div>
                    </div>

                    {/* Tanggal Lahir */}
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
                          className="w-full px-4 py-2.5 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                          <Calendar className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Cukup ketik angka tanggal lahir, garis miring terisi otomatis.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Kartu 2: Verifikasi Usia & Jenjang Otomatis */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">2. Validasi Usia & Jenjang Otomatis</h3>
                      <p className="text-[11px] text-slate-500">Dihitung otomatis berpedoman batas usia FASI XIII per 1 Juli 2027.</p>
                    </div>
                  </div>

                  {ageEvaluation.eligibleLevel && (
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      Lolos {ageEvaluation.eligibleLevel}
                    </span>
                  )}
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                        ageEvaluation.isEligible
                          ? 'bg-emerald-800 text-white'
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
                        {!ageEvaluation.eligibleLevel && birthDate.length < 10 && 'Ketik Tanggal Lahir untuk Deteksi Jenjang'}
                        {!ageEvaluation.eligibleLevel && birthDate.length >= 10 && 'Usia Tidak Memenuhi Kriteria Juknis'}
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        {birthDate.length >= 10 ? (
                          <>
                            Hitungan Usia: <strong className="font-mono text-slate-900">{ageEvaluation.exactAgeText}</strong> (per 1 Juli 2027)
                          </>
                        ) : (
                          'Aturan: TKA (Maks 7 Thn), TPA (>7 s/d 12 Thn), TQA (>12 s/d 15 Thn)'
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {birthDate.length >= 10 && !ageEvaluation.isEligible && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{ageEvaluation.statusMessage}</span>
                  </div>
                )}
              </div>
            </div>

            {/* KOLOM KANAN: Cabang Lomba, Kontingen, & Kontak PJ (5 Kolom) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Kartu 3: Cabang Lomba & Kontingen */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">3. Cabang Lomba & Asal Unit</h3>
                    <p className="text-[11px] text-slate-500">Cabang disaring otomatis sesuai umur & jenis kelamin.</p>
                  </div>
                </div>

                {/* Cabang Lomba */}
                <div>
                  <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Cabang Lomba <span className="text-rose-600">*</span>
                      </label>
                      {currentCategoryObj?.isGroup && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                          Lomba Beregu ({currentCategoryObj.groupMemberCount || 3} Orang)
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowMissingModal(true)}
                      className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <ListFilter className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Cek Status Kuota Cabang</span>
                    </button>
                  </div>

                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none font-bold text-slate-900"
                  >
                    {eligibleCategories.length === 0 ? (
                      <option value="">Tidak ada cabang lomba yang cocok</option>
                    ) : (
                      eligibleCategories.map((c) => {
                        const statusInfo = categoryStatusAnalysis.find((s) => s.category.id === c.id);
                        return (
                          <option key={c.id} value={c.id}>
                            [{c.level}] {c.name} {c.isGroup ? `(Grup ${c.groupMemberCount || 3} org)` : ''} — {statusInfo?.statusLabel || 'Kosong'}
                          </option>
                        );
                      })
                    )}
                  </select>

                  {currentCategoryObj?.isGroup && (
                    <div className="mt-2 p-3 bg-amber-50 border border-amber-300 rounded-xl text-[11px] text-amber-950 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>SOP Input Cabang Beregu:</span>
                      </div>
                      <p className="leading-relaxed">
                        Pastikan seluruh data {currentCategoryObj.groupMemberCount || 3} santri sudah siap sebelum disimpan.
                        Gunakan nama Unit TKA/TPA yang <strong>sama persis</strong> agar nomor undian beregu digabungkan otomatis.
                      </p>
                    </div>
                  )}
                </div>

                {/* Kontingen Kemantren */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Kontingen Kemantren (Kecamatan) <span className="text-rose-600">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Rayon Wilayah</span>
                  </div>
                  <select
                    disabled={session?.role === 'kemantren_admin'}
                    value={kemantrenId}
                    onChange={(e) => setKemantrenId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none font-semibold text-slate-900 disabled:opacity-80"
                  >
                    {KEMANTREN_LIST.map((k) => (
                      <option key={k.id} value={k.id}>
                        Kemantren {k.name} ({k.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Nama Unit TKA/TPA */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Nama Unit TKA / TPA <span className="text-rose-600">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Contoh: TPA Baitul Makmur</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={tpaUnitName}
                    onChange={(e) => setTpaUnitName(e.target.value)}
                    placeholder="Contoh: TPA Baitul Makmur"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none text-slate-900"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Penulisan nama unit wajib konsisten untuk seluruh santri dari lembaga yang sama.
                  </p>
                </div>
              </div>

              {/* Kartu 4: Penanggung Jawab (PJ) */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">4. Kontak Penanggung Jawab (PJ)</h3>
                    <p className="text-[11px] text-slate-500">Untuk konfirmasi teknis & verifikasi panitia lomba.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nama PJ */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Nama PJ / Ustadz <span className="text-rose-600">*</span>
                      </label>
                    </div>
                    <input
                      type="text"
                      required
                      value={pjName}
                      onChange={(e) => setPjName(e.target.value)}
                      placeholder="Ust. Hasan Basri"
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none text-slate-900"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Ustadz/ah pendamping unit</p>
                  </div>

                  {/* Nomor WA PJ */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        No. WhatsApp PJ <span className="text-rose-600">*</span>
                      </label>
                      <span className="text-[10px] text-slate-400">Aktif WA</span>
                    </div>
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
                        <Phone className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Format: 08xxxxxxxxxx</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
                  <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    Berkas digital akta diunggah langsung ke <strong>Google Drive resmi masing-masing Rayon / Kemantren</strong> yang telah dikoordinasikan.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar Sticky Bottom */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 z-20">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer w-full sm:w-auto text-center"
              >
                ← Kembali ke Data Peserta
              </button>

              {!editingParticipant && (
                <button
                  type="button"
                  onClick={handleAddToDraft}
                  className="px-4 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4 text-amber-700" />
                  <span>{editingDraftId ? 'Perbarui di Draft' : '+ Tambah ke Draft'}</span>
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2.5 w-full sm:w-auto">
              {!editingParticipant && (
                <div className="flex flex-col items-center sm:items-end w-full sm:w-auto">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={(e) => handleSaveDirect(e, true)}
                    className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 text-emerald-900 border border-emerald-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer w-full sm:w-auto shadow-xs"
                    title="Simpan santri ini langsung ke Supabase dan bersihkan nama untuk menginput santri berikutnya"
                  >
                    <RotateCcw className={`w-4 h-4 text-emerald-700 ${isSubmitting ? 'animate-spin' : ''}`} />
                    <span>{isSubmitting ? 'Menyimpan...' : 'Simpan & Lanjut Input'}</span>
                  </button>
                  <span className="text-[10px] text-emerald-700 font-medium mt-0.5 hidden sm:inline">
                    (Santri berikutnya berurutan / Anggota 1 & 2 regu)
                  </span>
                </div>
              )}

              <div className="flex flex-col items-center sm:items-end w-full sm:w-auto">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer w-full sm:w-auto"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? 'Menyimpan ke Supabase...'
                      : editingParticipant
                      ? 'Simpan Perubahan'
                      : 'Simpan & Selesai'}
                  </span>
                </button>
                {!editingParticipant && (
                  <span className="text-[10px] text-slate-500 font-medium mt-0.5 hidden sm:inline">
                    (Santri terakhir / kembali ke tabel data peserta)
                  </span>
                )}
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Tab 2: Antrian Draft Masal */}
      {activeTab === 'drafts' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <span>Antrian Draft Santri</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-400 text-emerald-950">
                  {drafts.length} Santri
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kumpulkan data seluruh santri (termasuk anggota beregu), periksa kembali, lalu kirim massal ke database sekaligus.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Input Santri Baru</span>
              </button>

              {drafts.length > 0 && (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleBatchSubmit}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-emerald-950 font-black text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <CheckCircle2 className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
                  <span>
                    {isSubmitting ? 'Mengirim ke Supabase...' : `Kirim Massal (${drafts.length} Santri)`}
                  </span>
                </button>
              )}
            </div>
          </div>

          {drafts.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500 space-y-3">
              <Layers className="w-12 h-12 mx-auto text-slate-400" />
              <div className="max-w-md mx-auto">
                <h4 className="font-bold text-sm text-slate-800">Antrian Draft Masih Kosong</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Buka formulir input, lengkapi data, lalu klik tombol <strong>"+ Tambah ke Draft"</strong> untuk menampung pendaftaran santri secara berurutan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className="px-4 py-2 bg-emerald-800 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Mulai Isi Formulir
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                {drafts.map((d, index) => (
                  <div
                    key={d.id || `draft-${index}`}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                          #{index + 1}
                        </span>
                        <span className="text-sm font-bold text-slate-900">{d.fullName}</span>
                        <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {d.gender === 'L' ? 'Putra' : 'Putri'} • {d.ageOnCutoff?.levelEligible || 'FASI'}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                        <span>
                          <strong>Cabang:</strong> {getCategoryName(d.categoryId)}
                        </span>
                        <span>
                          <strong>Unit TPA:</strong> {d.tpaUnitName}
                        </span>
                        <span>
                          <strong>Rayon:</strong> {getKemantrenName(d.kemantrenId)}
                        </span>
                        <span>
                          <strong>PJ:</strong> {d.pjName || '-'} {d.whatsappNumber ? `(${d.whatsappNumber})` : ''}
                        </span>
                        <span>
                          <strong>Usia:</strong> {d.ageOnCutoff?.years ?? 0} Thn {d.ageOnCutoff?.months ?? 0} Bln
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEditDraftItem(d)}
                        title="Edit Data Santri Ini"
                        className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDraftItem(d.id)}
                        title="Hapus dari Antrian Draft"
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Batch Submit Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleBatchSubmit}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-emerald-950 font-black text-xs rounded-xl shadow-sm flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Kirim Massal Seluruh ({drafts.length}) Santri ke Database</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal / Dialog: Status Pengisian Cabang Lomba Per Kontingen */}
      {showMissingModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <ListFilter className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Status Kuota Cabang Lomba Kontingen
                  </h3>
                  <p className="text-xs text-slate-500">
                    Rayon {KEMANTREN_LIST.find((k) => k.id === kemantrenId)?.name || 'Semua'} • {missingCategoriesCount} cabang masih kosong / belum lengkap
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowMissingModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Tabs Jenjang (TKA, TPA, TQA) */}
            <div className="px-6 pt-4 pb-2 flex items-center gap-2 border-b border-slate-100 overflow-x-auto">
              {(['all', 'TKA', 'TPA', 'TQA'] as const).map((filter) => {
                const count = categoryStatusAnalysis.filter((c) => {
                  if (filter === 'all') return true;
                  return c.category.level === filter;
                }).length;

                const missingInLevel = categoryStatusAnalysis.filter((c) => {
                  const matchLevel = filter === 'all' ? true : c.category.level === filter;
                  return matchLevel && !c.isComplete;
                }).length;

                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setMissingFilter(filter)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      missingFilter === filter
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{filter === 'all' ? 'Semua Jenjang' : `Jenjang ${filter}`}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                        missingFilter === filter
                          ? missingInLevel > 0
                            ? 'bg-amber-400 text-emerald-950'
                            : 'bg-emerald-950 text-emerald-200'
                          : missingInLevel > 0
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {missingInLevel > 0 ? `${missingInLevel} kosong` : 'Lengkap'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Modal Body: List of Categories */}
            <div className="p-6 overflow-y-auto space-y-3 flex-1">
              {categoryStatusAnalysis
                .filter((item) => {
                  if (missingFilter === 'all') return true;
                  return item.category.level === missingFilter;
                })
                .map((item) => {
                  return (
                    <div
                      key={item.category.id}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        item.isComplete
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : item.filledCount > 0
                          ? 'bg-amber-50/60 border-amber-300'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider ${
                              item.category.level === 'TKA'
                                ? 'bg-emerald-200 text-emerald-900'
                                : item.category.level === 'TPA'
                                ? 'bg-blue-200 text-blue-900'
                                : 'bg-purple-200 text-purple-900'
                            }`}
                          >
                            {item.category.level}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900">
                            {item.category.name}
                          </h4>
                          {item.category.isGroup && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                              Beregu ({item.category.groupMemberCount || 3} Orang)
                            </span>
                          )}
                          <span className="text-[10px] text-slate-500">
                            Gender: {item.category.genderRequirement === 'ALL' ? 'Putra/Putri' : item.category.genderRequirement === 'L' ? 'Putra' : 'Putri'}
                          </span>
                        </div>

                        {item.registeredParticipants.length > 0 ? (
                          <div className="text-[11px] text-slate-600 flex items-center gap-1.5 flex-wrap pt-0.5">
                            <span className="font-semibold text-slate-700">Santri Terdaftar:</span>
                            {item.registeredParticipants.map((p, idx) => (
                              <span
                                key={p.id}
                                className="px-2 py-0.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-[10px] font-medium"
                              >
                                #{idx + 1} {p.fullName} ({p.tpaUnitName})
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-rose-600 font-medium">
                            Belum ada santri yang didaftarkan untuk cabang lomba ini.
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                            item.isComplete
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : item.filledCount > 0
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {item.isComplete ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          ) : item.filledCount > 0 ? (
                            <Clock className="w-3.5 h-3.5 text-amber-700" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                          )}
                          <span>{item.statusLabel}</span>
                        </span>

                        {!item.isComplete && (
                          <button
                            type="button"
                            onClick={() => {
                              setCategoryId(item.category.id);
                              if (item.category.genderRequirement !== 'ALL') {
                                setGender(item.category.genderRequirement as Gender);
                              }
                              setShowMissingModal(false);
                              setActiveTab('form');
                              showToast('info', `Cabang "${item.category.name}" dipilih ke formulir!`);
                            }}
                            className="px-3 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                          >
                            Pilih Cabang Ini
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-between bg-slate-50/70 rounded-b-3xl">
              <span className="text-xs text-slate-500">
                Total <strong>{CATEGORIES_LIST.length} Cabang Lomba</strong> FASI XIII Kota Yogyakarta
              </span>
              <button
                type="button"
                onClick={() => setShowMissingModal(false)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
