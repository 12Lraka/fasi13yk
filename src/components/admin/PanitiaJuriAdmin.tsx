/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Panel Manajemen Data Panitia, Panitera & Dewan Hakim (Superadmin Only)
 * Terhubung langsung ke Studio Cetak ID Card dan Generator PDF Daftar Hadir
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Scale,
  FileCheck,
  ShieldCheck,
  Plus,
  Trash2,
  Edit3,
  Download,
  Printer,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Building2,
  FileText,
  Eye,
  Sliders,
  X,
  Check,
  ChevronDown,
} from 'lucide-react';
import { IdCardCommitteeData, UserSession } from '../../types/fasi';
import {
  getStoredCommittees,
  saveCommitteesList,
  persistCommittee,
  removeCommittee,
  syncCommitteesFromCloud,
  getStoredSettings,
  logAuditEvent,
} from '../../utils/storage';
import { isSupabaseConfigured, fetchCommitteesFromSupabase } from '../../lib/supabase';
import { showToast, showSuccessAlert, showConfirmDialog } from '../../utils/sweetalert';
import { downloadDaftarHadirPdf } from '../../utils/daftarHadirPdfGenerator';

interface PanitiaJuriAdminProps {
  session: UserSession;
  onNavigateToIdCard?: (categoryType?: 'panitia' | 'dewan_hakim' | 'panitera') => void;
}

type SubCategoryFilter = 'all' | 'dewan_hakim' | 'panitera' | 'panitia';

export const PanitiaJuriAdmin: React.FC<PanitiaJuriAdminProps> = ({
  session,
  onNavigateToIdCard,
}) => {
  const [committees, setCommittees] = useState<IdCardCommitteeData[]>(() => getStoredCommittees());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<SubCategoryFilter>('all');
  const [selectedAccessLevel, setSelectedAccessLevel] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<IdCardCommitteeData | null>(null);

  // Form Fields
  const [formName, setFormName] = useState<string>('');
  const [formDivision, setFormDivision] = useState<string>('');
  const [formCategory, setFormCategory] = useState<'panitia' | 'dewan_hakim' | 'panitera'>('dewan_hakim');
  const [formAccessLevel, setFormAccessLevel] = useState<string>('RUANG HAKIM & JURI');
  const [formCustomBadge, setFormCustomBadge] = useState<string>('DEWAN HAKIM');

  // Dropdown Download Menu
  const [showDownloadMenu, setShowDownloadMenu] = useState<boolean>(false);

  // Settings
  const appSettings = useMemo(() => getStoredSettings(), []);

  // Sync on mount
  useEffect(() => {
    const list = getStoredCommittees();
    setCommittees(list);

    if (isSupabaseConfigured()) {
      syncCommitteesFromCloud().then((cloudList) => {
        if (cloudList && cloudList.length > 0) {
          setCommittees(cloudList);
        }
      });
    }

    const handleStorageUpdate = (e: any) => {
      if (e.detail) {
        setCommittees(e.detail);
      } else {
        setCommittees(getStoredCommittees());
      }
    };

    window.addEventListener('fasi_committees_updated', handleStorageUpdate);
    return () => {
      window.removeEventListener('fasi_committees_updated', handleStorageUpdate);
    };
  }, []);

  // Filtered list
  const filteredList = useMemo(() => {
    return committees.filter((item) => {
      // Category filter
      if (selectedCategory !== 'all') {
        const itemCat = item.cardCategory || 'panitia';
        if (itemCat !== selectedCategory) return false;
      }

      // Access level filter
      if (selectedAccessLevel !== 'all') {
        if (item.accessLevel !== selectedAccessLevel) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (item.name || '').toLowerCase().includes(q);
        const matchDiv = (item.division || '').toLowerCase().includes(q);
        const matchAccess = (item.accessLevel || '').toLowerCase().includes(q);
        const matchBadge = (item.customBadge || '').toLowerCase().includes(q);
        if (!matchName && !matchDiv && !matchAccess && !matchBadge) return false;
      }

      return true;
    });
  }, [committees, selectedCategory, selectedAccessLevel, searchQuery]);

  // Statistics Count
  const stats = useMemo(() => {
    const hakim = committees.filter((c) => c.cardCategory === 'dewan_hakim').length;
    const panitera = committees.filter((c) => c.cardCategory === 'panitera').length;
    const panitia = committees.filter((c) => !c.cardCategory || c.cardCategory === 'panitia').length;
    return {
      hakim,
      panitera,
      panitia,
      total: committees.length,
    };
  }, [committees]);

  // Unique Access Levels
  const uniqueAccessLevels = useMemo(() => {
    const set = new Set<string>();
    committees.forEach((c) => {
      if (c.accessLevel) set.add(c.accessLevel);
    });
    return Array.from(set).sort();
  }, [committees]);

  // Refresh from Cloud
  const handleRefreshCloud = async () => {
    setIsRefreshing(true);
    try {
      const cloudData = await syncCommitteesFromCloud();
      setCommittees(cloudData);
      showToast('success', `Berhasil menyinkronkan ${cloudData.length} data personel dari Supabase.`);
    } catch {
      showToast('error', 'Gagal menyinkronkan data dengan Supabase.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Open Form Add
  const handleOpenAdd = (defaultType?: 'panitia' | 'dewan_hakim' | 'panitera') => {
    setEditingItem(null);
    const cat = defaultType || (selectedCategory === 'all' ? 'dewan_hakim' : selectedCategory);
    setFormCategory(cat);
    setFormName('');

    if (cat === 'dewan_hakim') {
      setFormDivision('Cabang Tilawah (TKA, TPA, TQA)');
      setFormAccessLevel('RUANG HAKIM & JURI');
      setFormCustomBadge('DEWAN HAKIM');
    } else if (cat === 'panitera') {
      setFormDivision('Panitera Arena Tilawah');
      setFormAccessLevel('ARENA LOMBA & MEJA PANITERA');
      setFormCustomBadge('PANITERA');
    } else {
      setFormDivision('Seksi Acara & Lomba');
      setFormAccessLevel('ALL ACCESS');
      setFormCustomBadge('PANITIA');
    }

    setIsModalOpen(true);
  };

  // Open Form Edit
  const handleOpenEdit = (item: IdCardCommitteeData) => {
    setEditingItem(item);
    setFormName(item.name || '');
    setFormDivision(item.division || '');
    setFormCategory(item.cardCategory || 'panitia');
    setFormAccessLevel(item.accessLevel || 'ALL ACCESS');
    setFormCustomBadge(item.customBadge || (item.cardCategory === 'dewan_hakim' ? 'DEWAN HAKIM' : (item.cardCategory === 'panitera' ? 'PANITERA' : 'PANITIA')));
    setIsModalOpen(true);
  };

  // Handle Category Change inside Form
  const handleFormCategoryChange = (cat: 'panitia' | 'dewan_hakim' | 'panitera') => {
    setFormCategory(cat);
    if (!editingItem) {
      if (cat === 'dewan_hakim') {
        setFormAccessLevel('RUANG HAKIM & JURI');
        setFormCustomBadge('DEWAN HAKIM');
      } else if (cat === 'panitera') {
        setFormAccessLevel('ARENA LOMBA & MEJA PANITERA');
        setFormCustomBadge('PANITERA');
      } else {
        setFormAccessLevel('ALL ACCESS');
        setFormCustomBadge('PANITIA');
      }
    }
  };

  // Submit Form Save
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('warning', 'Nama lengkap & gelar wajib diisi.');
      return;
    }
    if (!formDivision.trim()) {
      showToast('warning', 'Jabatan / Penugasan cabang lomba wajib diisi.');
      return;
    }

    const itemData: IdCardCommitteeData = {
      id: editingItem ? editingItem.id : `com-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: formName.trim(),
      division: formDivision.trim(),
      accessLevel: formAccessLevel.trim() || 'ALL ACCESS',
      cardCategory: formCategory,
      customBadge: formCustomBadge.trim() || (formCategory === 'dewan_hakim' ? 'DEWAN HAKIM' : (formCategory === 'panitera' ? 'PANITERA' : 'PANITIA')),
      updatedAt: new Date().toISOString(),
    };

    await persistCommittee(itemData);

    const updated = getStoredCommittees();
    setCommittees(updated);
    setIsModalOpen(false);

    logAuditEvent(
      session.name,
      editingItem ? 'UPDATE_PANITIA_HAKIM' : 'TAMBAH_PANITIA_HAKIM',
      `${editingItem ? 'Memperbarui' : 'Menambahkan'} data ${itemData.name} (${itemData.division}) sebagai ${itemData.cardCategory}.`
    );

    showToast(
      'success',
      editingItem
        ? `Data ${itemData.name} berhasil diperbarui!`
        : `Berhasil menambahkan ${itemData.name} ke sistem!`
    );
  };

  // Handle Delete
  const handleDeleteItem = async (item: IdCardCommitteeData) => {
    const confirmed = await showConfirmDialog(
      `Hapus ${item.name}?`,
      `Data personel "${item.name}" (${item.division}) akan dihapus dari daftar panitia dan database Supabase.`,
      'Ya, Hapus'
    );

    if (!confirmed) return;

    await removeCommittee(item.id);
    const updated = getStoredCommittees();
    setCommittees(updated);

    logAuditEvent(
      session.name,
      'HAPUS_PANITIA_HAKIM',
      `Menghapus data personel ${item.name} (${item.division}) dari sistem.`
    );

    showToast('info', `Data ${item.name} telah dihapus.`);
  };

  // Handle Download PDF Daftar Hadir
  const handleDownloadPdf = async (type: 'dewan_hakim' | 'panitera' | 'panitia' | 'all') => {
    setIsGeneratingPdf(true);
    setShowDownloadMenu(false);
    try {
      showToast('info', 'Sedang menyusun dokumen PDF Daftar Hadir resmi...');
      await downloadDaftarHadirPdf({
        categoryType: type,
        committees,
        eventName: appSettings.eventName,
        eventDate: appSettings.eventDate,
      });
      showToast('success', 'PDF Daftar Hadir berhasil diunduh!');
    } catch (err: any) {
      console.error('Gagal generate PDF daftar hadir:', err);
      showToast('error', 'Gagal membuat dokumen PDF Daftar Hadir.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER BANNER */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 rounded-2xl p-5 sm:p-6 text-white shadow-sm border border-emerald-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-emerald-950 uppercase tracking-wider">
              Khusus Super Admin
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-800 text-emerald-200">
              Perangkat FASI XIII
            </span>
            {isSupabaseConfigured() ? (
              <span className="flex items-center gap-1 text-[11px] text-emerald-300 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Tersinkron Cloud Supabase
              </span>
            ) : (
              <span className="text-[11px] text-amber-300 font-medium">
                Penyimpanan Lokal Aktif
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1.5 flex items-center gap-2">
            <Scale className="w-6 h-6 text-amber-400" />
            <span>Data Panitia, Panitera & Dewan Hakim</span>
          </h2>
          <p className="text-xs sm:text-sm text-emerald-200 mt-1 max-w-2xl leading-relaxed">
            Pusat administrasi resmi perangkat lomba FASI XIII. Terhubung otomatis dengan sistem Cetak ID Card dan Lembar Presensi / Daftar Hadir ber-KOP BADKO Kota Yogyakarta.
          </p>
        </div>

        {/* Action Header Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full md:w-auto">
          {/* Tombol Cetak ID Card */}
          {onNavigateToIdCard && (
            <button
              onClick={() => onNavigateToIdCard(selectedCategory === 'all' ? 'panitia' : selectedCategory)}
              className="px-3.5 py-2.5 bg-emerald-800/80 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs border border-emerald-600/50 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
              title="Buka Studio Cetak ID Card untuk Panitia & Hakim"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Cetak ID Card</span>
            </button>
          )}

          {/* Tombol Download PDF Presensi Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              disabled={isGeneratingPdf}
              className="px-3.5 py-2.5 bg-teal-800 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs border border-teal-600/50 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap disabled:opacity-60"
              title="Unduh Lembar Presensi / Daftar Hadir Resmi format PDF"
            >
              <Download className="w-4 h-4 text-teal-300" />
              <span>{isGeneratingPdf ? 'Membuat PDF...' : 'Download Daftar Hadir (PDF)'}</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-80" />
            </button>

            {showDownloadMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 text-slate-800 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  Pilih Lembar Daftar Hadir
                </div>
                <button
                  onClick={() => handleDownloadPdf('dewan_hakim')}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-950 hover:bg-rose-50 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Scale className="w-4 h-4 text-rose-700 shrink-0" />
                  <span>Daftar Hadir Dewan Hakim & Juri</span>
                </button>
                <button
                  onClick={() => handleDownloadPdf('panitera')}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-teal-950 hover:bg-teal-50 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <FileCheck className="w-4 h-4 text-teal-700 shrink-0" />
                  <span>Daftar Hadir Panitera Lomba</span>
                </button>
                <button
                  onClick={() => handleDownloadPdf('panitia')}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-emerald-950 hover:bg-emerald-50 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Daftar Hadir Panitia Pelaksana</span>
                </button>
                <div className="border-t border-slate-100 my-1"></div>
                <button
                  onClick={() => handleDownloadPdf('all')}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 text-slate-700 shrink-0" />
                  <span>Unduh Semua Paket Lengkap (3 Lembar)</span>
                </button>
              </div>
            )}
          </div>

          {/* Tombol Tambah Personel */}
          <button
            onClick={() => handleOpenAdd()}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-emerald-950 font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Tambah Personel</span>
          </button>
        </div>
      </div>

      {/* 2. STATISTIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Dewan Hakim */}
        <div
          onClick={() => setSelectedCategory('dewan_hakim')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedCategory === 'dewan_hakim'
              ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-400 shadow-xs'
              : 'bg-white border-slate-200 hover:border-rose-300 hover:bg-rose-50/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Dewan Hakim / Juri
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-950">{stats.hakim}</span>
            <span className="text-xs text-rose-700 font-medium">Orang</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Penilai arena lomba FASI XIII</p>
        </div>

        {/* Panitera */}
        <div
          onClick={() => setSelectedCategory('panitera')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedCategory === 'panitera'
              ? 'bg-teal-50 border-teal-400 ring-2 ring-teal-400 shadow-xs'
              : 'bg-white border-slate-200 hover:border-teal-300 hover:bg-teal-50/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Panitera Meja Lomba
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-teal-950">{stats.panitera}</span>
            <span className="text-xs text-teal-700 font-medium">Orang</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Pencatat nilai & pemanggilan</p>
        </div>

        {/* Panitia Pelaksana */}
        <div
          onClick={() => setSelectedCategory('panitia')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedCategory === 'panitia'
              ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400 shadow-xs'
              : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Panitia Pelaksana
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-950">{stats.panitia}</span>
            <span className="text-xs text-emerald-700 font-medium">Orang</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Seksi acara, registrasi, konsumsi</p>
        </div>

        {/* Total Personel */}
        <div
          onClick={() => setSelectedCategory('all')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400 shadow-xs'
              : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-amber-50/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Keseluruhan
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-950">{stats.total}</span>
            <span className="text-xs text-amber-800 font-medium">Personel</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Semua perangkat resmi terdaftar</p>
        </div>
      </div>

      {/* 3. FILTER & SEARCH CONTROLS */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Subcategory Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({stats.total})
            </button>
            <button
              onClick={() => setSelectedCategory('dewan_hakim')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                selectedCategory === 'dewan_hakim'
                  ? 'bg-rose-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-rose-900'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Dewan Hakim ({stats.hakim})</span>
            </button>
            <button
              onClick={() => setSelectedCategory('panitera')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                selectedCategory === 'panitera'
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-teal-900'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Panitera ({stats.panitera})</span>
            </button>
            <button
              onClick={() => setSelectedCategory('panitia')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                selectedCategory === 'panitia'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Panitia ({stats.panitia})</span>
            </button>
          </div>

          {/* Cloud Sync Button */}
          {isSupabaseConfigured() && (
            <button
              onClick={handleRefreshCloud}
              disabled={isRefreshing}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer self-end sm:self-auto disabled:opacity-50"
              title="Perbarui data langsung dari database Supabase"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
              <span>{isRefreshing ? 'Menyinkronkan...' : 'Sinkron Supabase'}</span>
            </button>
          )}
        </div>

        {/* Search & Access Level Dropdown */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1 border-t border-slate-100">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama personel, penugasan cabang lomba, divisi, atau hak akses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="sm:col-span-4">
            <select
              value={selectedAccessLevel}
              onChange={(e) => setSelectedAccessLevel(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium cursor-pointer"
            >
              <option value="all">Semua Hak Akses Ruangan</option>
              {uniqueAccessLevels.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4. DATA TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
              Daftar Perangkat Terdaftar ({filteredList.length})
            </h3>
            {searchQuery && (
              <span className="text-[11px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full font-medium">
                Pencarian: "{searchQuery}"
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Format Resmi FASI XIII BADKO Kota Yogyakarta
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase font-black tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4 w-32">Kategori Perangkat</th>
                <th className="py-3 px-4">Nama Lengkap & Gelar</th>
                <th className="py-3 px-4">Jabatan / Penugasan Cabang</th>
                <th className="py-3 px-4 w-44">Hak Akses Ruang / Arena</th>
                <th className="py-3 px-4 w-28 text-center">Badge Kartu</th>
                <th className="py-3 px-4 w-28 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Scale className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="font-semibold text-xs">Tidak ada data personel yang cocok.</p>
                    <p className="text-[11px] mt-0.5">
                      Coba ganti kata kunci pencarian atau klik "+ Tambah Personel" di atas.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredList.map((item, index) => {
                  const cat = item.cardCategory || 'panitia';
                  const isHakim = cat === 'dewan_hakim';
                  const isPanitera = cat === 'panitera';

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="py-3 px-4 text-center font-mono text-slate-400 font-bold">
                        {index + 1}
                      </td>

                      {/* Kategori Badge */}
                      <td className="py-3 px-4">
                        {isHakim && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
                            <Scale className="w-3 h-3 text-rose-700" />
                            <span>Dewan Hakim</span>
                          </span>
                        )}
                        {isPanitera && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-100 text-teal-900 border border-teal-300">
                            <FileCheck className="w-3 h-3 text-teal-700" />
                            <span>Panitera</span>
                          </span>
                        )}
                        {!isHakim && !isPanitera && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                            <ShieldCheck className="w-3 h-3 text-emerald-700" />
                            <span>Panitia</span>
                          </span>
                        )}
                      </td>

                      {/* Nama Lengkap */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-xs">
                          {item.name || '(Nama belum diisi)'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          ID: {item.id}
                        </div>
                      </td>

                      {/* Jabatan / Penugasan */}
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {item.division || '-'}
                      </td>

                      {/* Hak Akses Ruang */}
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {item.accessLevel || 'ALL ACCESS'}
                        </span>
                      </td>

                      {/* Badge Kartu */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black tracking-wider uppercase bg-amber-100 text-amber-950 border border-amber-300">
                          {item.customBadge || (isHakim ? 'DEWAN HAKIM' : (isPanitera ? 'PANITERA' : 'PANITIA'))}
                        </span>
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Data Personel"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Personel"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. MODAL FORM TAMBAH / EDIT PERSONEL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-900 to-emerald-950 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">
                  {editingItem ? 'Edit Data Perangkat Lomba' : 'Tambah Perangkat FASI XIII Baru'}
                </h3>
                <p className="text-[11px] text-emerald-200">
                  Data otomatis terhubung dengan kartu identitas dan daftar hadir resmi.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveForm} className="p-6 space-y-4">
              {/* Kategori Perangkat */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Kategori Perangkat <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleFormCategoryChange('dewan_hakim')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      formCategory === 'dewan_hakim'
                        ? 'bg-rose-900 text-white border-rose-900 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Scale className="w-4 h-4" />
                    <span>Dewan Hakim</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFormCategoryChange('panitera')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      formCategory === 'panitera'
                        ? 'bg-teal-800 text-white border-teal-800 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>Panitera</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFormCategoryChange('panitia')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      formCategory === 'panitia'
                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Panitia</span>
                  </button>
                </div>
              </div>

              {/* Nama Lengkap & Gelar */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Lengkap & Gelar <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: K.H. Ahmad Syukri, M.S.I / Dra. Hj. Siti Aminah"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent font-medium"
                />
              </div>

              {/* Jabatan / Penugasan Cabang */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Jabatan / Penugasan Cabang Lomba <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    formCategory === 'dewan_hakim'
                      ? 'Contoh: Cabang Tilawah (TKA, TPA, TQA) / Bidang Tajwid'
                      : formCategory === 'panitera'
                      ? 'Contoh: Panitera Arena Tilawah / Panitera CCQ TPA'
                      : 'Contoh: Koordinator Sie Acara & Lomba / Sie Konsumsi'
                  }
                  value={formDivision}
                  onChange={(e) => setFormDivision(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent font-medium"
                />
              </div>

              {/* Hak Akses Ruangan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Hak Akses Ruangan / Arena
                </label>
                <input
                  type="text"
                  placeholder="Contoh: RUANG HAKIM & JURI / ARENA LOMBA / ALL ACCESS"
                  value={formAccessLevel}
                  onChange={(e) => setFormAccessLevel(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent font-medium"
                />
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setFormAccessLevel('RUANG HAKIM & JURI')}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-mono cursor-pointer"
                  >
                    RUANG HAKIM & JURI
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormAccessLevel('ARENA LOMBA & MEJA PANITERA')}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-mono cursor-pointer"
                  >
                    ARENA LOMBA & MEJA PANITERA
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormAccessLevel('ALL ACCESS')}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-mono cursor-pointer"
                  >
                    ALL ACCESS
                  </button>
                </div>
              </div>

              {/* Badge Kartu */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Teks Badge ID Card
                </label>
                <input
                  type="text"
                  placeholder="Contoh: DEWAN HAKIM / PANITERA / PANITIA"
                  value={formCustomBadge}
                  onChange={(e) => setFormCustomBadge(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent font-medium uppercase font-mono"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Tambahkan Perangkat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
