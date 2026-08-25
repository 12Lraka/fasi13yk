/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Panel Pengaturan Terpadu (Tagline, Warna Tema, CRUD Admin Kecamatan, CRUD Cabang Lomba)
 */

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Palette,
  Type,
  Users,
  Award,
  Plus,
  Edit,
  Trash2,
  Save,
  RotateCcw,
  CheckCircle2,
  Lock,
  Building2,
  FolderOpen,
  Phone,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  Info,
  Database,
  CloudUpload,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  X
} from 'lucide-react';
import { AppSettings, CompetitionCategory, Kemantren, UserSession } from '../../types/fasi';
import {
  getStoredSettings,
  saveSettings,
  getStoredKemantren,
  saveKemantren,
  resetKemantren,
  getStoredCategories,
  saveCategories,
  resetCategories,
  getStoredParticipants,
  logAuditEvent,
  DEFAULT_SETTINGS
} from '../../utils/storage';
import {
  isSupabaseConfigured,
  syncCategoriesToSupabase,
  syncKemantrenToSupabase,
  bulkSyncParticipantsToSupabase
} from '../../lib/supabase';
import { showToast, showConfirmDialog, showSuccessAlert, showErrorAlert } from '../../utils/sweetalert';

interface PengaturanAdminProps {
  session: UserSession;
  onSettingsChanged?: () => void;
}

export const PengaturanAdmin: React.FC<PengaturanAdminProps> = ({
  session,
  onSettingsChanged,
}) => {
  const [activeTab, setActiveTab] = useState<'tagline' | 'tema' | 'kemantren' | 'cabang' | 'database'>('tagline');

  // 1. Settings State
  const [settings, setSettings] = useState<AppSettings>(() => getStoredSettings());
  const [taglineInput, setTaglineInput] = useState<string>(settings.tagline);
  const [eventNameInput, setEventNameInput] = useState<string>(settings.eventName);
  const [eventSubtitleInput, setEventSubtitleInput] = useState<string>(settings.eventSubtitle);
  const [eventDateInput, setEventDateInput] = useState<string>(settings.eventDate);
  const [eventLocationInput, setEventLocationInput] = useState<string>(settings.eventLocation);
  const [superAdminPassInput, setSuperAdminPassInput] = useState<string>(settings.superAdminPassword || '');
  const [showPass, setShowPass] = useState<boolean>(false);

  // 2. Kemantren Admin CRUD State
  const [kemantrenList, setKemantrenList] = useState<Kemantren[]>(() => getStoredKemantren());
  const [isKemantrenModalOpen, setIsKemantrenModalOpen] = useState<boolean>(false);
  const [editingKemantren, setEditingKemantren] = useState<Kemantren | null>(null);
  const [kemantrenForm, setKemantrenForm] = useState<{
    id: string;
    code: string;
    name: string;
    adminName: string;
    contactPerson: string;
    password: string;
    driveFolderUrl: string;
  }>({
    id: '',
    code: '',
    name: '',
    adminName: '',
    contactPerson: '',
    password: '',
    driveFolderUrl: '',
  });

  // 3. Cabang Lomba CRUD State
  const [categoriesList, setCategoriesList] = useState<CompetitionCategory[]>(() => getStoredCategories());
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<CompetitionCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState<{
    id: string;
    code: string;
    level: 'TKA' | 'TPA' | 'TQA';
    name: string;
    genderRequirement: 'L' | 'P' | 'ALL';
    isGroup: boolean;
    groupMemberCount: number;
    maxParticipantsPerKemantren: number;
    description: string;
  }>({
    id: '',
    code: '',
    level: 'TPA',
    name: '',
    genderRequirement: 'ALL',
    isGroup: false,
    groupMemberCount: 1,
    maxParticipantsPerKemantren: 1,
    description: '',
  });

  // Save Main Settings
  const handleSaveGeneralSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: AppSettings = {
      ...settings,
      tagline: taglineInput.trim() || DEFAULT_SETTINGS.tagline,
      eventName: eventNameInput.trim() || DEFAULT_SETTINGS.eventName,
      eventSubtitle: eventSubtitleInput.trim() || DEFAULT_SETTINGS.eventSubtitle,
      eventDate: eventDateInput.trim() || DEFAULT_SETTINGS.eventDate,
      eventLocation: eventLocationInput.trim() || DEFAULT_SETTINGS.eventLocation,
      superAdminPassword: superAdminPassInput.trim() || undefined,
    };

    setSettings(updated);
    saveSettings(updated);
    logAuditEvent(
      session.name,
      'PENGATURAN_UMUM',
      `Memperbarui tagline dan identitas pelaksanaan FASI XIII.`
    );
    showToast('success', 'Pengaturan identitas dan tagline berhasil disimpan.');
    onSettingsChanged?.();
  };

  // Change Theme Color
  const handleSelectTheme = (theme: AppSettings['themeColor']) => {
    const updated: AppSettings = {
      ...settings,
      themeColor: theme,
    };
    setSettings(updated);
    saveSettings(updated);
    logAuditEvent(
      session.name,
      'PENGATURAN_TEMA',
      `Mengubah palet tema antarmuka ke warna ${theme.toUpperCase()}.`
    );
    showToast('success', `Tema warna ${theme} berhasil diterapkan.`);
    onSettingsChanged?.();
  };

  // ================= KEMANTREN CRUD =================
  const handleOpenAddKemantren = () => {
    setEditingKemantren(null);
    setKemantrenForm({
      id: `kem-${Date.now()}`,
      code: '',
      name: '',
      adminName: '',
      contactPerson: '',
      password: '',
      driveFolderUrl: '',
    });
    setIsKemantrenModalOpen(true);
  };

  const handleOpenEditKemantren = (kem: Kemantren) => {
    setEditingKemantren(kem);
    const defaultKemPass = `${kem.name.toLowerCase().replace(/\s+/g, '')}123`;
    setKemantrenForm({
      id: kem.id,
      code: kem.code,
      name: kem.name,
      adminName: kem.adminName,
      contactPerson: kem.contactPerson,
      password: kem.password || defaultKemPass,
      driveFolderUrl: kem.driveFolderUrl || '',
    });
    setIsKemantrenModalOpen(true);
  };

  const handleSaveKemantren = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kemantrenForm.name.trim() || !kemantrenForm.code.trim()) {
      showToast('error', 'Nama dan Kode Kemantren wajib diisi.');
      return;
    }

    const defaultKemPass = `${kemantrenForm.name.toLowerCase().replace(/\s+/g, '')}123`;

    let updated: Kemantren[];
    if (editingKemantren) {
      updated = kemantrenList.map((k) =>
        k.id === editingKemantren.id
          ? {
              ...k,
              code: kemantrenForm.code.trim().toUpperCase(),
              name: kemantrenForm.name.trim(),
              adminName: kemantrenForm.adminName.trim(),
              contactPerson: kemantrenForm.contactPerson.trim(),
              password: kemantrenForm.password.trim() || defaultKemPass,
              driveFolderUrl: kemantrenForm.driveFolderUrl.trim(),
            }
          : k
      );
      logAuditEvent(
        session.name,
        'UPDATE_KEMANTREN',
        `Memperbarui akun Admin Kemantren ${kemantrenForm.name} (${kemantrenForm.code}).`
      );
      showToast('success', `Akun Admin Kemantren ${kemantrenForm.name} diperbarui.`);
    } else {
      const newKem: Kemantren = {
        id: kemantrenForm.id || `kem-${Date.now()}`,
        code: kemantrenForm.code.trim().toUpperCase(),
        name: kemantrenForm.name.trim(),
        adminName: kemantrenForm.adminName.trim(),
        contactPerson: kemantrenForm.contactPerson.trim(),
        password: kemantrenForm.password.trim() || defaultKemPass,
        driveFolderUrl: kemantrenForm.driveFolderUrl.trim(),
      };
      updated = [...kemantrenList, newKem];
      logAuditEvent(
        session.name,
        'TAMBAH_KEMANTREN',
        `Menambahkan akun Admin Kemantren baru ${newKem.name} (${newKem.code}).`
      );
      showToast('success', `Akun Admin Kemantren ${newKem.name} berhasil ditambahkan.`);
    }

    setKemantrenList(updated);
    saveKemantren(updated);
    setIsKemantrenModalOpen(false);
    onSettingsChanged?.();
  };

  const handleDeleteKemantren = async (kem: Kemantren) => {
    const confirm = await showConfirmDialog(
      'Hapus Admin Kemantren?',
      `Apakah Anda yakin ingin menghapus data Kemantren "${kem.name}" (${kem.code})?`,
      'Ya, Hapus',
      '#dc2626'
    );
    if (!confirm) return;

    const updated = kemantrenList.filter((k) => k.id !== kem.id);
    setKemantrenList(updated);
    saveKemantren(updated);
    logAuditEvent(
      session.name,
      'HAPUS_KEMANTREN',
      `Menghapus data Admin Kemantren ${kem.name} (${kem.code}).`
    );
    showToast('success', `Data Kemantren ${kem.name} berhasil dihapus.`);
    onSettingsChanged?.();
  };

  const handleResetKemantren = async () => {
    const confirm = await showConfirmDialog(
      'Reset Data Kemantren?',
      'Kembalikan seluruh daftar akun ke 14 Kemantren resmi Kota Yogyakarta?',
      'Ya, Reset Default'
    );
    if (!confirm) return;

    const def = resetKemantren();
    setKemantrenList(def);
    logAuditEvent(session.name, 'RESET_KEMANTREN', 'Mengembalikan master 14 Kemantren ke data bawaan.');
    showToast('success', 'Data 14 Kemantren berhasil di-reset ke default.');
    onSettingsChanged?.();
  };

  // ================= CABANG LOMBA CRUD =================
  const [isSyncingCategories, setIsSyncingCategories] = useState<boolean>(false);
  const [isSyncingKemantren, setIsSyncingKemantren] = useState<boolean>(false);
  const [isSyncingParticipants, setIsSyncingParticipants] = useState<boolean>(false);

  const handleSyncParticipantsToDatabase = async () => {
    setIsSyncingParticipants(true);
    try {
      const currentParticipants = getStoredParticipants();
      const res = await bulkSyncParticipantsToSupabase(currentParticipants);
      if (res.success) {
        logAuditEvent(
          session.name,
          'SYNC_SUPABASE_PARTICIPANTS',
          `Berhasil mensinkronkan ${res.count} santri ke Supabase.`
        );
        showToast('success', `Berhasil mensinkronkan ${res.count} data santri ke database Supabase!`);
      } else {
        const errorMsg = res.error || '';
        if (errorMsg.toLowerCase().includes('row-level security') || errorMsg.toLowerCase().includes('violates')) {
          showErrorAlert(
            'Perlu Konfigurasi RLS di Supabase',
            'Supabase mengaktifkan Row-Level Security (RLS). Silakan buka SQL Editor di Supabase dan jalankan script skema RLS (CREATE POLICY) yang ada di tab Database & Supabase agar API memiliki izin insert/update peserta.'
          );
        } else {
          showToast('error', `Gagal sinkronisasi ke Supabase: ${errorMsg}`);
        }
      }
    } catch (err: any) {
      showToast('error', `Error: ${err?.message || 'Gagal terhubung ke Supabase'}`);
    } finally {
      setIsSyncingParticipants(false);
    }
  };

  const handleSyncCategoriesToDatabase = async () => {
    setIsSyncingCategories(true);
    try {
      const res = await syncCategoriesToSupabase(categoriesList);
      if (res.success) {
        logAuditEvent(
          session.name,
          'SYNC_SUPABASE_CATEGORIES',
          `Berhasil mensinkronkan ${res.count} cabang lomba ke Supabase.`
        );
        showToast('success', `Berhasil mensinkronkan ${res.count} Cabang Lomba ke database Supabase!`);
      } else {
        const errorMsg = res.error || '';
        if (errorMsg.toLowerCase().includes('row-level security') || errorMsg.toLowerCase().includes('violates')) {
          showErrorAlert(
            'Perlu Konfigurasi RLS di Supabase',
            'Supabase mengaktifkan Row-Level Security (RLS). Silakan buka SQL Editor di Supabase dan jalankan script skema RLS (CREATE POLICY) yang ada di tab Database & Supabase agar API memiliki izin insert/update data master.'
          );
        } else {
          showToast('error', `Gagal sinkronisasi ke Supabase: ${errorMsg}`);
        }
      }
    } catch (err: any) {
      showToast('error', `Error: ${err?.message || 'Gagal terhubung ke Supabase'}`);
    } finally {
      setIsSyncingCategories(false);
    }
  };

  const handleSyncKemantrenToDatabase = async () => {
    setIsSyncingKemantren(true);
    try {
      const res = await syncKemantrenToSupabase(kemantrenList);
      if (res.success) {
        logAuditEvent(
          session.name,
          'SYNC_SUPABASE_KEMANTREN',
          `Berhasil mensinkronkan ${res.count} kemantren ke Supabase.`
        );
        showToast('success', `Berhasil mensinkronkan ${res.count} Kemantren ke database Supabase!`);
      } else {
        const errorMsg = res.error || '';
        if (errorMsg.toLowerCase().includes('row-level security') || errorMsg.toLowerCase().includes('violates')) {
          showErrorAlert(
            'Perlu Konfigurasi RLS di Supabase',
            'Supabase mengaktifkan Row-Level Security (RLS). Silakan buka SQL Editor di Supabase dan jalankan script skema RLS (CREATE POLICY) yang ada di tab Database & Supabase.'
          );
        } else {
          showToast('error', `Gagal sinkronisasi ke Supabase: ${errorMsg}`);
        }
      }
    } catch (err: any) {
      showToast('error', `Error: ${err?.message || 'Gagal terhubung ke Supabase'}`);
    } finally {
      setIsSyncingKemantren(false);
    }
  };

  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({
      id: `cat-custom-${Date.now()}`,
      code: 'TPA-99',
      level: 'TPA',
      name: '',
      genderRequirement: 'ALL',
      isGroup: false,
      groupMemberCount: 1,
      maxParticipantsPerKemantren: 3,
      description: '',
    });
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: CompetitionCategory) => {
    setEditingCategory(cat);
    setCategoryForm({
      id: cat.id,
      code: cat.code,
      level: cat.level,
      name: cat.name,
      genderRequirement: cat.genderRequirement,
      isGroup: cat.isGroup,
      groupMemberCount: cat.groupMemberCount || 1,
      maxParticipantsPerKemantren: cat.maxParticipantsPerKemantren || (cat.isGroup ? 9 : 3),
      description: cat.description,
    });
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim() || !categoryForm.code.trim()) {
      showToast('error', 'Nama dan Kode Cabang Lomba wajib diisi.');
      return;
    }

    let updated: CompetitionCategory[];
    if (editingCategory) {
      updated = categoriesList.map((c) =>
        c.id === editingCategory.id
          ? {
              ...c,
              code: categoryForm.code.trim().toUpperCase(),
              level: categoryForm.level,
              name: categoryForm.name.trim(),
              genderRequirement: categoryForm.genderRequirement,
              isGroup: categoryForm.isGroup,
              groupMemberCount: categoryForm.isGroup ? Number(categoryForm.groupMemberCount) : undefined,
              maxParticipantsPerKemantren: Number(categoryForm.maxParticipantsPerKemantren) || 1,
              description: categoryForm.description.trim(),
            }
          : c
      );
      logAuditEvent(
        session.name,
        'UPDATE_CABANG_LOMBA',
        `Memperbarui cabang lomba [${categoryForm.code}] ${categoryForm.name}.`
      );
      showToast('success', `Cabang Lomba "${categoryForm.name}" berhasil diperbarui.`);
    } else {
      const newCat: CompetitionCategory = {
        id: categoryForm.id || `cat-${Date.now()}`,
        code: categoryForm.code.trim().toUpperCase(),
        level: categoryForm.level,
        name: categoryForm.name.trim(),
        genderRequirement: categoryForm.genderRequirement,
        isGroup: categoryForm.isGroup,
        groupMemberCount: categoryForm.isGroup ? Number(categoryForm.groupMemberCount) : undefined,
        maxParticipantsPerKemantren: Number(categoryForm.maxParticipantsPerKemantren) || 1,
        description: categoryForm.description.trim(),
      };
      updated = [...categoriesList, newCat];
      logAuditEvent(
        session.name,
        'TAMBAH_CABANG_LOMBA',
        `Menambahkan cabang lomba baru [${newCat.code}] ${newCat.name}.`
      );
      showToast('success', `Cabang Lomba "${newCat.name}" berhasil ditambahkan.`);
    }

    setCategoriesList(updated);
    saveCategories(updated);
    setIsCategoryModalOpen(false);
    onSettingsChanged?.();
  };

  const handleDeleteCategory = async (cat: CompetitionCategory) => {
    const confirm = await showConfirmDialog(
      'Hapus Cabang Lomba?',
      `Apakah Anda yakin ingin menghapus cabang lomba "${cat.name}" (${cat.code})?`,
      'Ya, Hapus',
      '#dc2626'
    );
    if (!confirm) return;

    const updated = categoriesList.filter((c) => c.id !== cat.id);
    setCategoriesList(updated);
    saveCategories(updated);
    logAuditEvent(
      session.name,
      'HAPUS_CABANG_LOMBA',
      `Menghapus cabang lomba ${cat.name} (${cat.code}).`
    );
    showToast('success', `Cabang lomba ${cat.name} telah dihapus.`);
    onSettingsChanged?.();
  };

  const handleResetCategories = async () => {
    const confirm = await showConfirmDialog(
      'Reset Cabang Lomba?',
      'Kembalikan seluruh cabang lomba ke 18 Cabang Lomba resmi FASI XIII?',
      'Ya, Reset Default'
    );
    if (!confirm) return;

    const def = resetCategories();
    setCategoriesList(def);
    logAuditEvent(session.name, 'RESET_CABANG_LOMBA', 'Mengembalikan master cabang lomba ke bawaan.');
    showToast('success', 'Cabang lomba berhasil di-reset ke default.');
    onSettingsChanged?.();
  };

  return (
    <div className="space-y-6">
      {/* Settings Navigation Tabs */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('tagline')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'tagline'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Type className="w-4 h-4" />
            <span>Identitas & Tagline</span>
          </button>

          <button
            onClick={() => setActiveTab('tema')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'tema'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Warna Tema & Visual</span>
          </button>

          <button
            onClick={() => setActiveTab('kemantren')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'kemantren'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Admin Kecamatan ({kemantrenList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('cabang')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'cabang'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Cabang Lomba ({categoriesList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'database'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Database & Supabase</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-400 font-semibold">
          Panel Super Administrator
        </div>
      </div>

      {/* TAB 1: IDENTITAS & TAGLINE */}
      {activeTab === 'tagline' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Pengaturan Identitas & Tagline Resmi FASI XIII
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Nilai yang disimpan di sini akan diterapkan secara langsung ke seluruh antarmuka, cetak kartu ID Card, dan Berita Acara.
              </p>
            </div>

            <form onSubmit={handleSaveGeneralSettings} className="space-y-4">
              {/* Tagline */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Tagline Resmi (Motto FASI XIII):</span>
                </label>
                <textarea
                  rows={2}
                  value={taglineInput}
                  onChange={(e) => setTaglineInput(e.target.value)}
                  placeholder="Santri Hebat, Hebat Prestasi, Hebat Mengaji, & Berakhlakul Karimah."
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                  required
                />
                <p className="text-[11px] text-slate-400">
                  Tagline ini dicetak di bagian bawah setiap kartu ID santri resmi.
                </p>
              </div>

              {/* Event Title & Subtitle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Nama Kegiatan:</label>
                  <input
                    type="text"
                    value={eventNameInput}
                    onChange={(e) => setEventNameInput(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Sub-judul / Wilayah:</label>
                  <input
                    type="text"
                    value={eventSubtitleInput}
                    onChange={(e) => setEventSubtitleInput(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Date & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Tanggal Pelaksanaan:</label>
                  <input
                    type="text"
                    value={eventDateInput}
                    onChange={(e) => setEventDateInput(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Lokasi / Venue:</label>
                  <input
                    type="text"
                    value={eventLocationInput}
                    onChange={(e) => setEventLocationInput(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Superadmin Custom Password */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-800" />
                    <span>Kata Sandi / PIN Super Admin:</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Default: badko2026</span>
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={superAdminPassInput}
                    onChange={(e) => setSuperAdminPassInput(e.target.value)}
                    placeholder="Kosongkan jika ingin tetap menggunakan badko2026"
                    className="w-full p-2.5 pr-10 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <Save className="w-4 h-4 text-amber-400" />
                  <span>Simpan Perubahan Identitas</span>
                </button>
              </div>
            </form>
          </div>

          {/* Live Preview of Card with Tagline */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Live Preview Kartu ID & Tagline</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Simulasi tampilan identitas dan tagline pada kartu peserta resmi FASI XIII:
              </p>

              {/* Card Mini Simulation */}
              <div className="bg-white text-slate-900 rounded-2xl p-4 border-2 border-amber-400 shadow-lg text-center space-y-2">
                <div className="border-b border-emerald-800/30 pb-1">
                  <div className="inline-block px-2 py-0.5 bg-emerald-900 text-amber-300 font-extrabold text-[8px] tracking-wider rounded-md uppercase">
                    KARTU PESERTA RESMI
                  </div>
                  <h4 className="font-black text-[11px] text-emerald-950 uppercase font-serif">
                    {eventNameInput || 'FESTIVAL ANAK SHOLEH INDONESIA - XIII'}
                  </h4>
                  <p className="text-[8.5px] font-bold text-amber-800 uppercase">
                    {eventSubtitleInput || 'Kota Yogyakarta 2026'}
                  </p>
                </div>

                <div className="py-2 bg-emerald-50 rounded-xl">
                  <span className="text-[8px] text-slate-400 uppercase font-bold">Nama Santri:</span>
                  <div className="font-extrabold text-xs text-slate-900">MUHAMMAD FARHAN AL-GHIFARI</div>
                  <div className="text-[9px] font-bold text-emerald-800 mt-0.5">Tartil Al-Qur'an (Putra) - TPA</div>
                </div>

                <div className="border-t border-emerald-800/30 pt-2 space-y-1">
                  <p className="text-[9px] font-serif italic font-semibold text-emerald-950 leading-tight">
                    “{taglineInput || DEFAULT_SETTINGS.tagline}”
                  </p>
                  <div className="bg-emerald-900 text-amber-300 text-[8px] font-black py-0.5 px-2 rounded tracking-wider uppercase">
                    BADKO TKA TPA KOTA YOGYAKARTA
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WARNA TEMA & VISUAL */}
      {activeTab === 'tema' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Pilihan Tema Warna & Nuansa Islami
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Sesuaikan aksen visual palet warna aplikasi sesuai nuansa acara FASI XIII Kota Yogyakarta.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Emerald Classic */}
            <div
              onClick={() => handleSelectTheme('emerald')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                settings.themeColor === 'emerald'
                  ? 'border-emerald-700 bg-emerald-50/50 shadow-md scale-[1.02]'
                  : 'border-slate-200 hover:border-emerald-400'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-800"></div>
                  <span className="font-bold text-xs text-slate-900">Emerald Classic (Default)</span>
                </div>
                {settings.themeColor === 'emerald' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                )}
              </div>
              <div className="h-10 rounded-xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-amber-500 flex items-center justify-center text-white text-[10px] font-bold">
                Nuansa Hijau Zamrud & Emas
              </div>
            </div>

            {/* Islamic Green */}
            <div
              onClick={() => handleSelectTheme('islamic-green')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                settings.themeColor === 'islamic-green'
                  ? 'border-green-700 bg-green-50/50 shadow-md scale-[1.02]'
                  : 'border-slate-200 hover:border-green-400'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-green-800"></div>
                  <span className="font-bold text-xs text-slate-900">Islamic Forest Green</span>
                </div>
                {settings.themeColor === 'islamic-green' && (
                  <CheckCircle2 className="w-4 h-4 text-green-700" />
                )}
              </div>
              <div className="h-10 rounded-xl bg-gradient-to-r from-green-950 via-green-800 to-lime-500 flex items-center justify-center text-white text-[10px] font-bold">
                Nuansa Hijau Daun Al-Qur'an
              </div>
            </div>

            {/* Teal */}
            <div
              onClick={() => handleSelectTheme('teal')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                settings.themeColor === 'teal'
                  ? 'border-teal-700 bg-teal-50/50 shadow-md scale-[1.02]'
                  : 'border-slate-200 hover:border-teal-400'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-teal-800"></div>
                  <span className="font-bold text-xs text-slate-900">Royal Teal</span>
                </div>
                {settings.themeColor === 'teal' && (
                  <CheckCircle2 className="w-4 h-4 text-teal-700" />
                )}
              </div>
              <div className="h-10 rounded-xl bg-gradient-to-r from-teal-950 via-teal-800 to-cyan-500 flex items-center justify-center text-white text-[10px] font-bold">
                Nuansa Segar Teal & Toska
              </div>
            </div>

            {/* Sapphire Blue */}
            <div
              onClick={() => handleSelectTheme('sapphire')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                settings.themeColor === 'sapphire'
                  ? 'border-blue-700 bg-blue-50/50 shadow-md scale-[1.02]'
                  : 'border-slate-200 hover:border-blue-400'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-800"></div>
                  <span className="font-bold text-xs text-slate-900">Sapphire Islamic Blue</span>
                </div>
                {settings.themeColor === 'sapphire' && (
                  <CheckCircle2 className="w-4 h-4 text-blue-700" />
                )}
              </div>
              <div className="h-10 rounded-xl bg-gradient-to-r from-blue-950 via-blue-800 to-amber-400 flex items-center justify-center text-white text-[10px] font-bold">
                Nuansa Biru Langit & Safir
              </div>
            </div>

            {/* Ruby Maroon */}
            <div
              onClick={() => handleSelectTheme('maroon')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                settings.themeColor === 'maroon'
                  ? 'border-rose-700 bg-rose-50/50 shadow-md scale-[1.02]'
                  : 'border-slate-200 hover:border-rose-400'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-rose-900"></div>
                  <span className="font-bold text-xs text-slate-900">Ruby Maroon</span>
                </div>
                {settings.themeColor === 'maroon' && (
                  <CheckCircle2 className="w-4 h-4 text-rose-700" />
                )}
              </div>
              <div className="h-10 rounded-xl bg-gradient-to-r from-rose-950 via-rose-900 to-amber-400 flex items-center justify-center text-white text-[10px] font-bold">
                Nuansa Merah Marun Eksklusif
              </div>
            </div>

            {/* Royal Gold */}
            <div
              onClick={() => handleSelectTheme('gold')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                settings.themeColor === 'gold'
                  ? 'border-amber-600 bg-amber-50/50 shadow-md scale-[1.02]'
                  : 'border-slate-200 hover:border-amber-400'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-amber-600"></div>
                  <span className="font-bold text-xs text-slate-900">Kesultanan Amber Gold</span>
                </div>
                {settings.themeColor === 'gold' && (
                  <CheckCircle2 className="w-4 h-4 text-amber-700" />
                )}
              </div>
              <div className="h-10 rounded-xl bg-gradient-to-r from-amber-950 via-amber-700 to-yellow-400 flex items-center justify-center text-white text-[10px] font-bold">
                Nuansa Emas Klasik Yogyakarta
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CRUD ROLE ADMIN KECAMATAN */}
      {activeTab === 'kemantren' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Manajemen Akun & Role Admin Kecamatan (14 Kemantren)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola hak akses login, PIN sandi khusus, nama koordinator/kontingen, dan tautan Google Drive berkas peserta.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleSyncKemantrenToDatabase}
                disabled={isSyncingKemantren}
                className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                title="Sinkronkan seluruh master kemantren ke Supabase"
              >
                {isSyncingKemantren ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CloudUpload className="w-3.5 h-3.5 text-emerald-700" />
                )}
                <span>{isSyncingKemantren ? 'Sinkronisasi...' : 'Sinkron ke Supabase'}</span>
              </button>

              <button
                onClick={handleResetKemantren}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset 14 Kemantren</span>
              </button>

              <button
                onClick={handleOpenAddKemantren}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>+ Tambah Kecamatan</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3 w-12 text-center">Kode</th>
                  <th className="py-2.5 px-3">Nama Kemantren</th>
                  <th className="py-2.5 px-3">Koordinator / Admin</th>
                  <th className="py-2.5 px-3">No. WhatsApp</th>
                  <th className="py-2.5 px-3">PIN / Password</th>
                  <th className="py-2.5 px-3">Folder Drive</th>
                  <th className="py-2.5 px-3 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {kemantrenList.map((kem) => (
                  <tr key={kem.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-3 text-center font-mono font-black text-emerald-900 bg-emerald-50/50">
                      {kem.code}
                    </td>
                    <td className="py-2 px-3 font-bold text-slate-900">
                      Kemantren {kem.name}
                    </td>
                    <td className="py-2 px-3 text-slate-700">
                      {kem.adminName}
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-600">
                      {kem.contactPerson}
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] text-emerald-800 font-bold">
                      {kem.password || `${kem.name.toLowerCase().replace(/\s+/g, '')}123`}
                    </td>
                    <td className="py-2 px-3 max-w-[140px] truncate text-[11px] text-blue-600">
                      {kem.driveFolderUrl ? (
                        <a href={kem.driveFolderUrl} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1">
                          <FolderOpen className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">Google Drive</span>
                        </a>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditKemantren(kem)}
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-colors cursor-pointer"
                          title="Edit Admin"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteKemantren(kem)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: CRUD CABANG LOMBA */}
      {activeTab === 'cabang' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Manajemen Master Cabang Lomba Resmi FASI XIII
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola 18 cabang lomba resmi, tingkat (TKA, TPA, TQA), batasan gender, jenis individu/beregu, serta kuota kontingen.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleSyncCategoriesToDatabase}
                disabled={isSyncingCategories}
                className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                title="Sinkronkan seluruh master cabang lomba ke Supabase"
              >
                {isSyncingCategories ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CloudUpload className="w-3.5 h-3.5 text-emerald-700" />
                )}
                <span>{isSyncingCategories ? 'Sinkronisasi...' : 'Sinkron ke Supabase'}</span>
              </button>

              <button
                onClick={handleResetCategories}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset 18 Cabang Resmi</span>
              </button>

              <button
                onClick={handleOpenAddCategory}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>+ Tambah Cabang Lomba</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3 w-16 text-center">Kode</th>
                  <th className="py-2.5 px-3 w-16 text-center">Tingkat</th>
                  <th className="py-2.5 px-3">Nama Cabang Lomba</th>
                  <th className="py-2.5 px-3 text-center w-16">Gender</th>
                  <th className="py-2.5 px-3 text-center w-20">Tipe</th>
                  <th className="py-2.5 px-3">Deskripsi / Ketentuan</th>
                  <th className="py-2.5 px-3 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {categoriesList.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-3 text-center font-mono font-bold text-emerald-900 bg-emerald-50/40">
                      {cat.code}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        cat.level === 'TKA' ? 'bg-blue-100 text-blue-800' :
                        cat.level === 'TPA' ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {cat.level}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-bold text-slate-900">
                      {cat.name}
                    </td>
                    <td className="py-2 px-3 text-center font-semibold">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        cat.genderRequirement === 'L' ? 'bg-blue-100 text-blue-800' :
                        cat.genderRequirement === 'P' ? 'bg-pink-100 text-pink-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {cat.genderRequirement === 'L' ? 'Putra' : cat.genderRequirement === 'P' ? 'Putri' : 'Semua'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center text-[11px]">
                      {cat.isGroup ? (
                        <span className="font-bold text-amber-700">Beregu ({cat.groupMemberCount || 3})</span>
                      ) : (
                        <span className="text-slate-600">Individu</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-slate-600 text-[11px] max-w-xs truncate">
                      {cat.description}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditCategory(cat)}
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-colors cursor-pointer"
                          title="Edit Lomba"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= MODAL TAMBAH / EDIT KEMANTREN ================= */}
      {isKemantrenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="bg-emerald-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">
                  {editingKemantren ? 'Edit Admin Kecamatan' : 'Tambah Kecamatan Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsKemantrenModalOpen(false)}
                className="text-emerald-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveKemantren} className="p-6 space-y-3.5">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Kode (2 Huruf):</label>
                  <input
                    type="text"
                    maxLength={3}
                    value={kemantrenForm.code}
                    onChange={(e) => setKemantrenForm({ ...kemantrenForm, code: e.target.value.toUpperCase() })}
                    placeholder="KG"
                    className="w-full p-2 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl uppercase"
                    required
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-700">Nama Kemantren:</label>
                  <input
                    type="text"
                    value={kemantrenForm.name}
                    onChange={(e) => setKemantrenForm({ ...kemantrenForm, name: e.target.value })}
                    placeholder="Kotagede"
                    className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Nama Koordinator / Admin:</label>
                <input
                  type="text"
                  value={kemantrenForm.adminName}
                  onChange={(e) => setKemantrenForm({ ...kemantrenForm, adminName: e.target.value })}
                  placeholder="Ust. Hasan Basri"
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">No. Kontak / WA:</label>
                  <input
                    type="text"
                    value={kemantrenForm.contactPerson}
                    onChange={(e) => setKemantrenForm({ ...kemantrenForm, contactPerson: e.target.value })}
                    placeholder="08123456789"
                    className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">PIN / Kata Sandi:</label>
                  <input
                    type="text"
                    value={kemantrenForm.password}
                    onChange={(e) => setKemantrenForm({ ...kemantrenForm, password: e.target.value })}
                    placeholder="kemantren123"
                    className="w-full p-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Link Folder Google Drive:</label>
                <input
                  type="url"
                  value={kemantrenForm.driveFolderUrl}
                  onChange={(e) => setKemantrenForm({ ...kemantrenForm, driveFolderUrl: e.target.value })}
                  placeholder="https://drive.google.com/..."
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsKemantrenModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Simpan Kecamatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 5: DATABASE & SUPABASE SYNC */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-700" />
                  <span>Koneksi & Sinkronisasi Database Supabase</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kelola integrasi data master (Cabang Lomba & Kemantren) dan pengaturan izin Row-Level Security (RLS) PostgreSQL.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {isSupabaseConfigured() ? (
                  <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-xl flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Supabase Terhubung</span>
                  </span>
                ) : (
                  <span className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-300 font-bold text-xs rounded-xl flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-amber-600" />
                    <span>Supabase Belum Dikonfigurasi</span>
                  </span>
                )}
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-700" />
                    <span>Tabel `categories`</span>
                  </span>
                  <span className="text-[11px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                    {categoriesList.length} Cabang
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Kirimkan seluruh master 34 cabang lomba ke Supabase.
                </p>
                <button
                  onClick={handleSyncCategoriesToDatabase}
                  disabled={isSyncingCategories}
                  className="w-full py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSyncingCategories ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CloudUpload className="w-3.5 h-3.5" />}
                  <span>{isSyncingCategories ? 'Sedang Sinkron...' : 'Sinkronkan Cabang'}</span>
                </button>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-700" />
                    <span>Tabel `kemantren`</span>
                  </span>
                  <span className="text-[11px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                    {kemantrenList.length} Wilayah
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Kirimkan master 14 wilayah kemantren & akun ke Supabase.
                </p>
                <button
                  onClick={handleSyncKemantrenToDatabase}
                  disabled={isSyncingKemantren}
                  className="w-full py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSyncingKemantren ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CloudUpload className="w-3.5 h-3.5" />}
                  <span>{isSyncingKemantren ? 'Sedang Sinkron...' : 'Sinkronkan Kemantren'}</span>
                </button>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-700" />
                    <span>Tabel `participants`</span>
                  </span>
                  <span className="text-[11px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                    {getStoredParticipants().length} Santri
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Kirimkan seluruh data santri terdaftar saat ini ke Supabase.
                </p>
                <button
                  onClick={handleSyncParticipantsToDatabase}
                  disabled={isSyncingParticipants}
                  className="w-full py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSyncingParticipants ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CloudUpload className="w-3.5 h-3.5" />}
                  <span>{isSyncingParticipants ? 'Sedang Sinkron...' : 'Sinkronkan Data Santri'}</span>
                </button>
              </div>
            </div>

            {/* RLS Fix Guide & Copyable SQL */}
            <div className="p-5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <span>Solusi Row-Level Security (RLS) Policy Supabase</span>
                </div>
                <button
                  onClick={() => {
                    const sqlScript = `-- HAK AKSES ROW LEVEL SECURITY (RLS) SUPABASE FASI XIII\nALTER TABLE IF EXISTS kemantren ENABLE ROW LEVEL SECURITY;\nALTER TABLE IF EXISTS categories ENABLE ROW LEVEL SECURITY;\nALTER TABLE IF EXISTS participants ENABLE ROW LEVEL SECURITY;\nALTER TABLE IF EXISTS app_settings ENABLE ROW LEVEL SECURITY;\nALTER TABLE IF EXISTS audit_logs ENABLE ROW LEVEL SECURITY;\n\nDROP POLICY IF EXISTS "Public full access on kemantren" ON kemantren;\nDROP POLICY IF EXISTS "Public full access on categories" ON categories;\nDROP POLICY IF EXISTS "Public full access on participants" ON participants;\nDROP POLICY IF EXISTS "Public full access on app_settings" ON app_settings;\nDROP POLICY IF EXISTS "Public full access on audit_logs" ON audit_logs;\n\nCREATE POLICY "Public full access on kemantren" ON kemantren FOR ALL USING (true) WITH CHECK (true);\nCREATE POLICY "Public full access on categories" ON categories FOR ALL USING (true) WITH CHECK (true);\nCREATE POLICY "Public full access on participants" ON participants FOR ALL USING (true) WITH CHECK (true);\nCREATE POLICY "Public full access on app_settings" ON app_settings FOR ALL USING (true) WITH CHECK (true);\nCREATE POLICY "Public full access on audit_logs" ON audit_logs FOR ALL USING (true) WITH CHECK (true);`;
                    navigator.clipboard.writeText(sqlScript);
                    showToast('success', 'Skrip SQL RLS berhasil disalin ke clipboard!');
                  }}
                  className="px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Skrip SQL</span>
                </button>
              </div>

              <p className="text-xs text-amber-900 leading-relaxed">
                Jika Anda menjumpai pesan <code className="font-mono bg-amber-100 px-1.5 py-0.5 rounded text-[11px] font-bold">violates row-level security policy</code> saat sinkronisasi, jalankan skrip SQL di bawah ini di menu <strong>SQL Editor</strong> dashboard Supabase Anda:
              </p>

              <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono overflow-x-auto select-all leading-relaxed">
{`-- JALANKAN DI SUPABASE SQL EDITOR:
ALTER TABLE IF EXISTS kemantren ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public full access on kemantren" ON kemantren;
DROP POLICY IF EXISTS "Public full access on categories" ON categories;
DROP POLICY IF EXISTS "Public full access on participants" ON participants;
DROP POLICY IF EXISTS "Public full access on app_settings" ON app_settings;
DROP POLICY IF EXISTS "Public full access on audit_logs" ON audit_logs;

CREATE POLICY "Public full access on kemantren" ON kemantren FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on participants" ON participants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on app_settings" ON app_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on audit_logs" ON audit_logs FOR ALL USING (true) WITH CHECK (true);`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL TAMBAH / EDIT CABANG LOMBA ================= */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="bg-emerald-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">
                  {editingCategory ? 'Edit Cabang Lomba' : 'Tambah Cabang Lomba Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-emerald-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-6 space-y-3.5">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Kode Lomba:</label>
                  <input
                    type="text"
                    value={categoryForm.code}
                    onChange={(e) => setCategoryForm({ ...categoryForm, code: e.target.value.toUpperCase() })}
                    placeholder="TPA-01"
                    className="w-full p-2 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl uppercase"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Tingkat:</label>
                  <select
                    value={categoryForm.level}
                    onChange={(e) => setCategoryForm({ ...categoryForm, level: e.target.value as any })}
                    className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="TKA">TKA (4-7 thn)</option>
                    <option value="TPA">TPA (&gt;7-12 thn)</option>
                    <option value="TQA">TQA (&gt;12-15 thn)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Batasan Gender:</label>
                  <select
                    value={categoryForm.genderRequirement}
                    onChange={(e) => setCategoryForm({ ...categoryForm, genderRequirement: e.target.value as any })}
                    className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="ALL">Semua / Terbuka</option>
                    <option value="L">Khusus Putra (L)</option>
                    <option value="P">Khusus Putri (P)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Nama Cabang Lomba:</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="Tartil Al-Qur'an (Putra)"
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Tipe Keikutsertaan:</label>
                  <select
                    value={categoryForm.isGroup ? 'GROUP' : 'INDIVIDUAL'}
                    onChange={(e) => {
                      const isGrp = e.target.value === 'GROUP';
                      setCategoryForm({
                        ...categoryForm,
                        isGroup: isGrp,
                        groupMemberCount: isGrp ? 3 : 1,
                        maxParticipantsPerKemantren: isGrp ? 9 : 3,
                      });
                    }}
                    className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="INDIVIDUAL">Individu (Perorangan)</option>
                    <option value="GROUP">Beregu (Kelompok)</option>
                  </select>
                </div>

                {categoryForm.isGroup && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Anggota per Regu:</label>
                    <input
                      type="number"
                      min={2}
                      max={10}
                      value={categoryForm.groupMemberCount || 3}
                      onChange={(e) => setCategoryForm({ ...categoryForm, groupMemberCount: Number(e.target.value) })}
                      className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Maks. Santri/Kemantren:</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={categoryForm.maxParticipantsPerKemantren}
                    onChange={(e) => setCategoryForm({ ...categoryForm, maxParticipantsPerKemantren: Number(e.target.value) })}
                    className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                  <p className="text-[10px] text-slate-500">
                    {categoryForm.isGroup ? 'Default 9 santri (3 regu)' : 'Default 3 santri (Juara 1-3)'}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Deskripsi & Ketentuan Lomba:</label>
                <textarea
                  rows={2}
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Membaca tartil maqra pilihan Al-Qur'an dengan makhraj dan tajwid..."
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Simpan Cabang Lomba
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
