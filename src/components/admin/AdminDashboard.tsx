/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Panel Kontrol Admin dengan Sidebar Navigation & Pagination
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Dices,
  Award,
  QrCode,
  Printer,
  History,
  Trash2,
  Edit,
  Search,
  CheckCircle2,
  FolderOpen,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ShieldCheck,
  Building2,
  LogOut,
  Sparkles,
  Settings,
  FileText,
  Layers,
  Lock,
} from 'lucide-react';
import { Participant, UserSession } from '../../types/fasi';
import {
  saveParticipants,
  logAuditEvent,
  getStoredKemantren,
  getStoredCategories,
  getStoredSettings
} from '../../utils/storage';
import { exportParticipantsToExcel } from '../../utils/excelExport';
import { showToast, showConfirmDialog, showSuccessAlert } from '../../utils/sweetalert';
import { RekapPesertaAdmin } from './RekapPesertaAdmin';
import { RekapCabangLombaAdmin } from './RekapCabangLombaAdmin';
import { PengaturanAdmin } from './PengaturanAdmin';
import { LogAktivitasAdmin } from './LogAktivitasAdmin';
import { AppRoute } from '../../utils/router';

interface AdminDashboardProps {
  session: UserSession;
  participants: Participant[];
  onUpdateParticipants: (newList: Participant[]) => void;
  onOpenAddModal: () => void;
  onOpenEditModal: (p: Participant) => void;
  onOpenLotteryModal: () => void;
  onOpenJudgingModal: (p: Participant) => void;
  onOpenQrScanner: () => void;
  onOpenAuditLog: () => void;
  onOpenPrintCards: () => void;
  onOpenPrintRecap: () => void;
  onViewSingleCard: (p: Participant) => void;
  onLogout?: () => void;
  activeRoute?: AppRoute;
  onNavigateRoute?: (route: AppRoute) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  session,
  participants = [],
  onUpdateParticipants,
  onOpenAddModal,
  onOpenEditModal,
  onOpenLotteryModal,
  onOpenJudgingModal,
  onOpenQrScanner,
  onOpenAuditLog,
  onOpenPrintCards,
  onOpenPrintRecap,
  onViewSingleCard,
  onLogout,
  activeRoute = 'admin-data-peserta',
  onNavigateRoute,
}) => {
  const getInitialTab = (): 'peserta' | 'rekap-peserta' | 'rekap-cabang' | 'pengaturan' | 'log' => {
    if (activeRoute === 'admin-rekap-peserta') return 'rekap-peserta';
    if (activeRoute === 'admin-rekapcbg-lomba') return 'rekap-cabang';
    if (activeRoute === 'pengaturan') return 'pengaturan';
    if (activeRoute === 'log') return 'log';
    return 'peserta';
  };

  const [activeAdminTab, setActiveAdminTab] = useState<'peserta' | 'rekap-peserta' | 'rekap-cabang' | 'pengaturan' | 'log'>(getInitialTab);

  useEffect(() => {
    if (activeRoute === 'admin-rekap-peserta') setActiveAdminTab('rekap-peserta');
    else if (activeRoute === 'admin-rekapcbg-lomba') setActiveAdminTab('rekap-cabang');
    else if (activeRoute === 'pengaturan') setActiveAdminTab('pengaturan');
    else if (activeRoute === 'log') setActiveAdminTab('log');
    else if (activeRoute === 'admin-data-peserta' || activeRoute === 'admin') setActiveAdminTab('peserta');
  }, [activeRoute]);

  const handleTabChange = (tab: 'peserta' | 'rekap-peserta' | 'rekap-cabang' | 'pengaturan' | 'log') => {
    setActiveAdminTab(tab);
    if (onNavigateRoute) {
      if (tab === 'peserta') onNavigateRoute('admin-data-peserta');
      else if (tab === 'rekap-peserta') onNavigateRoute('admin-rekap-peserta');
      else if (tab === 'rekap-cabang') onNavigateRoute('admin-rekapcbg-lomba');
      else if (tab === 'pengaturan') onNavigateRoute('pengaturan');
      else if (tab === 'log') onNavigateRoute('log');
    }
  };

  const kemantrenList = getStoredKemantren();
  const categoriesList = getStoredCategories();
  const appSettings = getStoredSettings();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedKemantrenFilter, setSelectedKemantrenFilter] = useState<string>(
    session?.role === 'kemantren_admin' && session?.kemantrenId ? session.kemantrenId : 'ALL'
  );
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Filter participants based on role & search
  const visibleParticipants = useMemo(() => {
    return participants.filter((p) => {
      // If Kemantren Admin, lock strictly to their kemantren
      if (session?.role === 'kemantren_admin' && session?.kemantrenId) {
        if (p.kemantrenId !== session.kemantrenId) return false;
      } else if (selectedKemantrenFilter !== 'ALL') {
        if (p.kemantrenId !== selectedKemantrenFilter) return false;
      }

      if (selectedCategoryFilter !== 'ALL' && p.categoryId !== selectedCategoryFilter) {
        return false;
      }

      if (searchTerm) {
        const match =
          (p.fullName && p.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (p.registrationNumber && p.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (p.tpaUnitName && p.tpaUnitName.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (p.pjName && p.pjName.toLowerCase().includes(searchTerm.toLowerCase()));
        if (!match) return false;
      }

      return true;
    });
  }, [participants, session, selectedKemantrenFilter, selectedCategoryFilter, searchTerm]);

  // Total Pages Calculation
  const totalPages = Math.max(1, Math.ceil(visibleParticipants.length / pageSize));

  // Reset to page 1 if search/filter alters results
  useMemo(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [visibleParticipants.length, totalPages, currentPage]);

  // Paginated Sliced Data
  const paginatedParticipants = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return visibleParticipants.slice(start, start + pageSize);
  }, [visibleParticipants, currentPage, pageSize]);

  const currentKemantren = useMemo(() => {
    if (session?.role === 'kemantren_admin' && session?.kemantrenId) {
      return kemantrenList.find((k) => k.id === session.kemantrenId);
    }
    return null;
  }, [session, kemantrenList]);

  const handleDelete = async (participant: Participant) => {
    const confirmed = await showConfirmDialog(
      'Hapus Data Santri?',
      `Apakah Anda yakin ingin menghapus "${participant.fullName}" (${participant.registrationNumber})?`,
      'Ya, Hapus Data',
      '#dc2626'
    );

    if (confirmed) {
      const updated = participants.filter((p) => p.id !== participant.id);
      onUpdateParticipants(updated);
      saveParticipants(updated);
      logAuditEvent(
        session.name,
        'HAPUS_SANTRI',
        `Menghapus data santri ${participant.fullName} (${participant.registrationNumber}).`
      );
      showToast('success', `Data santri "${participant.fullName}" telah dihapus.`);
    }
  };

  const handleExportDataPeserta = () => {
    const filename =
      session.role === 'kemantren_admin'
        ? `Data_Peserta_FASI_Kemantren_${currentKemantren?.name || 'Kecamatan'}`
        : 'Data_Peserta_FASI_Kota_Yogyakarta';
    exportParticipantsToExcel(visibleParticipants, filename);
  };

  const getCat = (catId: string) => categoriesList.find((c) => c.id === catId);
  const getKem = (kemId: string) => kemantrenList.find((k) => k.id === kemId);

  return (
    <div className="flex flex-col lg:flex-row items-start gap-6">
      {/* 1. ADMIN SIDEBAR */}
      <aside className="w-full lg:w-64 shrink-0 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4 lg:sticky lg:top-24">
        {/* User Info / Role Badge */}
        <div className="p-3.5 bg-gradient-to-br from-emerald-900 to-emerald-950 text-white rounded-xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-emerald-950 uppercase tracking-wider">
              {session.role === 'super_admin' ? 'Super Admin' : 'Admin Kemantren'}
            </span>
          </div>
          <div>
            <h3 className="font-bold text-xs text-white leading-tight">
              {session.name}
            </h3>
            <p className="text-[11px] text-emerald-300 truncate">
              {session.role === 'super_admin'
                ? 'BADKO Kota Yogyakarta'
                : `Kemantren ${currentKemantren?.name || ''}`}
            </p>
          </div>
        </div>

        {/* Action Navigation Menu */}
        <div className="space-y-1 text-xs">
          <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Menu Utama
          </div>

          <button
            onClick={onOpenAddModal}
            className="w-full px-3 py-2.5 bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer active:scale-95 text-left mb-2"
          >
            <UserPlus className="w-4 h-4 shrink-0" />
            <span>+ Daftarkan Santri</span>
          </button>

          {/* Data Peserta Tab */}
          <button
            onClick={() => handleTabChange('peserta')}
            className={`w-full px-3 py-2 font-bold rounded-xl flex items-center justify-between transition-all cursor-pointer text-left ${
              activeAdminTab === 'peserta'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-700 hover:text-emerald-900 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 shrink-0" />
              <span>Data Peserta</span>
            </div>
            <span
              className={`px-1.5 py-0.5 font-mono text-[10px] rounded-full font-bold ${
                activeAdminTab === 'peserta'
                  ? 'bg-amber-400 text-emerald-950'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {visibleParticipants.length}
            </span>
          </button>

          {/* Rekap Peserta Tab */}
          <button
            onClick={() => handleTabChange('rekap-peserta')}
            className={`w-full px-3 py-2 font-bold rounded-xl flex items-center justify-between transition-all cursor-pointer text-left ${
              activeAdminTab === 'rekap-peserta'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-700 hover:text-emerald-900 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 shrink-0 text-amber-500" />
              <span>Rekap Peserta</span>
            </div>
            {session.role === 'super_admin' ? (
              <span className="px-1.5 py-0.2 bg-amber-400 text-emerald-950 text-[9px] font-extrabold rounded">
                Super
              </span>
            ) : (
              <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-900 text-[9px] font-bold rounded">
                {currentKemantren?.code}
              </span>
            )}
          </button>

          {/* Rekap Cabang Lomba Tab */}
          <button
            onClick={() => handleTabChange('rekap-cabang')}
            className={`w-full px-3 py-2 font-bold rounded-xl flex items-center justify-between transition-all cursor-pointer text-left ${
              activeAdminTab === 'rekap-cabang'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-700 hover:text-emerald-900 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Rekap Cabang Lomba</span>
            </div>
          </button>

          {/* Undian Nomor Tampil (Superadmin Only) */}
          {session.role === 'super_admin' && (
            <button
              onClick={onOpenLotteryModal}
              className="w-full px-3 py-2 text-slate-700 hover:text-emerald-900 hover:bg-slate-100 font-semibold rounded-xl flex items-center justify-between transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2">
                <Dices className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Undian Nomor Tampil</span>
              </div>
              <span className="px-1.5 py-0.2 bg-amber-400 text-emerald-950 text-[9px] font-extrabold rounded">
                Super
              </span>
            </button>
          )}

          {/* QR Presensi Check-In (Superadmin Only) */}
          {session.role === 'super_admin' && (
            <button
              onClick={onOpenQrScanner}
              className="w-full px-3 py-2 text-slate-700 hover:text-emerald-900 hover:bg-slate-100 font-semibold rounded-xl flex items-center justify-between transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>QR Presensi Check-In</span>
              </div>
              <span className="px-1.5 py-0.2 bg-amber-400 text-emerald-950 text-[9px] font-extrabold rounded">
                Super
              </span>
            </button>
          )}

          <div className="pt-2 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Dokumen & Cetak
          </div>

          <button
            onClick={onOpenPrintCards}
            className="w-full px-3 py-2 text-slate-700 hover:text-emerald-900 hover:bg-slate-100 font-semibold rounded-xl flex items-center justify-between transition-colors cursor-pointer text-left"
          >
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Studio Cetak ID Card</span>
            </div>
            <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-900 text-[9px] font-bold rounded">
              85x55mm
            </span>
          </button>

          {/* Rekapitulasi PDF (Superadmin Only) */}
          {session.role === 'super_admin' && (
            <button
              onClick={onOpenPrintRecap}
              className="w-full px-3 py-2 text-slate-700 hover:text-emerald-900 hover:bg-slate-100 font-semibold rounded-xl flex items-center justify-between transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Rekapitulasi PDF</span>
              </div>
              <span className="px-1.5 py-0.2 bg-amber-400 text-emerald-950 text-[9px] font-extrabold rounded">
                Super
              </span>
            </button>
          )}

          {currentKemantren?.driveFolderUrl && (
            <a
              href={currentKemantren.driveFolderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full px-3 py-2 text-slate-700 hover:text-emerald-900 hover:bg-slate-100 font-semibold rounded-xl flex items-center gap-2 transition-colors text-left"
            >
              <FolderOpen className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="truncate">Google Drive Berkas</span>
            </a>
          )}

          {session.role === 'super_admin' && (
            <>
              <div className="pt-2 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Sistem & Pengaturan
              </div>

              {/* Pengaturan Tab (Superadmin Only) */}
              <button
                onClick={() => handleTabChange('pengaturan')}
                className={`w-full px-3 py-2 font-bold rounded-xl flex items-center justify-between transition-all cursor-pointer text-left ${
                  activeAdminTab === 'pengaturan'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-700 hover:text-emerald-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 shrink-0 text-amber-500" />
                  <span>Pengaturan Sistem</span>
                </div>
                <span className="px-1.5 py-0.2 bg-amber-400 text-emerald-950 text-[9px] font-extrabold rounded">
                  Super
                </span>
              </button>

              {/* Log Tab (Superadmin Only) */}
              <button
                onClick={() => handleTabChange('log')}
                className={`w-full px-3 py-2 font-bold rounded-xl flex items-center justify-between transition-all cursor-pointer text-left ${
                  activeAdminTab === 'log'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-700 hover:text-emerald-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 shrink-0 text-blue-500" />
                  <span>Log & Audit Trail</span>
                </div>
                <span className="px-1.5 py-0.2 bg-amber-400 text-emerald-950 text-[9px] font-extrabold rounded">
                  Super
                </span>
              </button>
            </>
          )}
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 w-full space-y-4">
        {/* VIEW: REKAP PESERTA (SUPERADMIN) */}
        {activeAdminTab === 'rekap-peserta' && (
          <RekapPesertaAdmin
            session={session}
            participants={participants}
            onViewSingleCard={onViewSingleCard}
          />
        )}

        {/* VIEW: REKAP CABANG LOMBA */}
        {activeAdminTab === 'rekap-cabang' && (
          <RekapCabangLombaAdmin
            session={session}
            participants={participants}
            onOpenJudgingModal={onOpenJudgingModal}
          />
        )}

        {/* VIEW: PENGATURAN */}
        {activeAdminTab === 'pengaturan' && (
          <PengaturanAdmin
            session={session}
            onSettingsChanged={() => {
              // Trigger state refresh
            }}
          />
        )}

        {/* VIEW: LOG AKTIVITAS */}
        {activeAdminTab === 'log' && (
          <LogAktivitasAdmin session={session} />
        )}

        {/* VIEW: DATA PESERTA (DEFAULT MAIN TABLE) */}
        {activeAdminTab === 'peserta' && (
          <>
            {/* Top Header Banner */}
            <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-950 rounded-2xl p-5 text-white shadow-sm border border-emerald-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-emerald-950 uppercase tracking-wider">
                    {session.role === 'super_admin' ? 'Pusat FASI XIII Kota' : `Wilayah Kemantren ${currentKemantren?.name || ''}`}
                  </span>
                  <span className="text-xs text-emerald-300">
                    {appSettings.eventDate}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight mt-1">
                  Data Santri & Penilaian {appSettings.eventName}
                </h2>
                <p className="text-xs text-emerald-200 mt-0.5">
                  Kelola data pendaftaran, presensi QR, nomor undian, dan rekapitulasi poin kejuaraan.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleExportDataPeserta}
                  className="px-3.5 py-2 bg-emerald-700/80 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm border border-emerald-500/50 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                  title="Unduh Data Peserta ke Format Excel/CSV"
                >
                  <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                  <span>Download Excel (.csv)</span>
                </button>

                <button
                  onClick={onOpenAddModal}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Daftarkan Santri</span>
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                {/* Search Box */}
                <div className="sm:col-span-6 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cari santri, no registrasi, unit TPA, atau PJ..."
                    className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                  />
                </div>

                {/* Kemantren Filter (Superadmin only) */}
                {session.role === 'super_admin' ? (
                  <div className="sm:col-span-3">
                    <select
                      value={selectedKemantrenFilter}
                      onChange={(e) => setSelectedKemantrenFilter(e.target.value)}
                      className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none cursor-pointer"
                    >
                      <option value="ALL">Semua Kemantren (14)</option>
                      {kemantrenList.map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.name} ({k.code})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="sm:col-span-3">
                    <div className="w-full py-2 px-3 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-medium truncate">
                      Wilayah: Kemantren {currentKemantren?.name}
                    </div>
                  </div>
                )}

                {/* Category Filter */}
                <div className="sm:col-span-3">
                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">Semua Cabang Lomba</option>
                    {categoriesList.map((c) => (
                      <option key={c.id} value={c.id}>
                        [{c.level}] {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Rows Per Page Selector & Summary info */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-1 text-xs text-slate-500 border-t border-slate-100">
                <div>
                  Menampilkan <span className="font-bold text-slate-900">{visibleParticipants.length}</span> dari{' '}
                  <span className="font-bold text-slate-900">{participants.length}</span> total santri terdaftar
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-medium text-slate-600">Tampilkan per halaman:</label>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="text-xs py-1 px-2 border border-slate-300 rounded-lg bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value={10}>10 Baris</option>
                    <option value={25}>25 Baris</option>
                    <option value={50}>50 Baris</option>
                    <option value={100}>100 Baris</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Participants Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/90 text-slate-800 font-bold border-b border-slate-200">
                      <th className="py-3 px-3 text-center w-12">No</th>
                      <th className="py-3 px-3">No. Registrasi</th>
                      <th className="py-3 px-3">Nama Santri</th>
                      <th className="py-3 px-3">Kemantren / Unit TPA</th>
                      <th className="py-3 px-3">Cabang Lomba</th>
                      <th className="py-3 px-3 text-center">No. Undian</th>
                      <th className="py-3 px-3 text-center">Kehadiran</th>
                      {session.role === 'super_admin' && (
                        <th className="py-3 px-3 text-center">Nilai & Juara</th>
                      )}
                      <th className="py-3 px-3 text-center w-36">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {paginatedParticipants.length === 0 ? (
                      <tr>
                        <td colSpan={session.role === 'super_admin' ? 9 : 8} className="py-12 text-center text-slate-400">
                          <div className="max-w-xs mx-auto space-y-2">
                            <Users className="w-8 h-8 text-slate-300 mx-auto" />
                            <p className="font-semibold text-slate-600">Tidak ada data santri ditemukan</p>
                            <p className="text-[11px] text-slate-400">
                              Silakan sesuaikan kata kunci pencarian atau daftarkan santri baru.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedParticipants.map((participant, index) => {
                        const cat = getCat(participant.categoryId);
                        const kem = getKem(participant.kemantrenId);
                        const rowNumber = (currentPage - 1) * pageSize + index + 1;

                        return (
                          <tr key={participant.id} className="hover:bg-slate-50/80 transition-colors">
                            {/* Row Number */}
                            <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-400">
                              {rowNumber}
                            </td>

                            {/* Reg Number */}
                            <td className="py-3 px-3">
                              <span className="font-mono font-bold text-[11px] text-emerald-950 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                {participant.registrationNumber}
                              </span>
                            </td>

                            {/* Full Name & Gender */}
                            <td className="py-3 px-3">
                              <div className="font-bold text-slate-900">{participant.fullName}</div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                    participant.gender === 'L'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-pink-100 text-pink-800'
                                  }`}
                                >
                                  {participant.gender === 'L' ? 'Putra' : 'Putri'}
                                </span>
                                <span>• PJ: {participant.pjName}</span>
                              </div>
                            </td>

                            {/* Kemantren & TPA */}
                            <td className="py-3 px-3">
                              <div className="font-semibold text-slate-800">
                                Kemantren {kem?.name || participant.kemantrenId}
                              </div>
                              <div className="text-[11px] text-slate-500 truncate max-w-[150px]">
                                {participant.tpaUnitName}
                              </div>
                            </td>

                            {/* Category */}
                            <td className="py-3 px-3">
                              <div className="font-semibold text-emerald-900">
                                {cat?.name || participant.categoryId}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                Tingkat: <span className="font-bold text-slate-600">{cat?.level || '-'}</span>
                              </div>
                            </td>

                            {/* Lottery */}
                            <td className="py-3 px-3 text-center">
                              {participant.lotteryNumber ? (
                                <span className="inline-block px-2.5 py-1 bg-amber-400 text-emerald-950 font-black rounded-lg text-xs shadow-2xs">
                                  #{participant.lotteryNumber}
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">Belum undi</span>
                              )}
                            </td>

                            {/* Attendance */}
                            <td className="py-3 px-3 text-center">
                              {participant.attendance === 'hadir' || participant.attendance === 'siap_tampil' || participant.attendance === 'sudah_tampil' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Hadir</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-medium">
                                  <span>Belum Hadir</span>
                                </span>
                              )}
                            </td>

                            {/* Score & Rank (Superadmin Only) */}
                            {session.role === 'super_admin' && (
                              <td className="py-3 px-3 text-center">
                                {participant.averageScore ? (
                                  <div className="space-y-0.5">
                                    <div className="font-mono font-bold text-xs text-slate-900">
                                      {participant.averageScore.toFixed(1)} Pts
                                    </div>
                                    {participant.rank && (
                                      <span className="inline-block px-1.5 py-0.2 bg-amber-100 text-amber-900 font-extrabold text-[10px] rounded">
                                        Juara {participant.rank}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => onOpenJudgingModal(participant)}
                                    className="text-[10px] text-emerald-700 hover:text-emerald-800 font-bold underline cursor-pointer"
                                  >
                                    + Input Nilai
                                  </button>
                                )}
                              </td>
                            )}

                            {/* Action Buttons */}
                            <td className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => onViewSingleCard(participant)}
                                  title="Lihat Kartu Santri"
                                  className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-colors cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                {session.role === 'super_admin' && (
                                  <button
                                    onClick={() => onOpenJudgingModal(participant)}
                                    title="Penilaian Juri"
                                    className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 transition-colors cursor-pointer"
                                  >
                                    <Award className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => onOpenEditModal(participant)}
                                  title="Edit Santri"
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(participant)}
                                  title="Hapus Santri"
                                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
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

              {/* Pagination Controls */}
              <div className="bg-slate-50/80 px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
                <div>
                  Halaman <span className="font-bold text-slate-900">{currentPage}</span> dari{' '}
                  <span className="font-bold text-slate-900">{totalPages}</span> (Total {visibleParticipants.length} data)
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title="Halaman Pertama"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title="Sebelumnya"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="px-3 py-1 font-bold text-emerald-950 bg-emerald-100 rounded-lg">
                    {currentPage} / {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title="Berikutnya"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title="Halaman Terakhir"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

