/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * BADKO TKA-TPA Kota Yogyakarta
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { PublicPortal } from './components/public/PublicPortal';
import { ParticipantDirectory } from './components/public/ParticipantDirectory';
import { LiveScoreboard } from './components/public/LiveScoreboard';
import { LocationMap } from './components/public/LocationMap';
import { AgeCalculatorModal } from './components/public/AgeCalculatorModal';
import { AdminLoginModal } from './components/admin/AdminLoginModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ParticipantFormModal } from './components/admin/ParticipantFormModal';
import { LotteryDrawModal } from './components/admin/LotteryDrawModal';
import { UndianNomorTampil } from './components/admin/UndianNomorTampil';
import { JudgingModal } from './components/admin/JudgingModal';
import { QrScannerModal } from './components/admin/QrScannerModal';
import { AuditLogModal } from './components/admin/AuditLogModal';
import { IdCardPrintView } from './components/print/IdCardPrintView';
import { RecapPrintView } from './components/print/RecapPrintView';
import { Participant, UserSession } from './types/fasi';
import {
  getStoredParticipants,
  saveParticipants,
  getStoredSession,
  saveSession,
  clearSession,
  logAuditEvent,
  getStoredSettings,
} from './utils/storage';
import { isSupabaseConfigured, fetchParticipantsFromSupabase } from './lib/supabase';
import { showToast, showConfirmDialog } from './utils/sweetalert';
import { AppRoute, getCurrentRouteFromURL, navigateToRoute } from './utils/router';
import { getThemeConfig } from './utils/theme';
import { AppSettings } from './types/fasi';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppRoute>('beranda');

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [session, setSession] = useState<UserSession | null>(null);
  const [settings, setSettings] = useState<AppSettings>(getStoredSettings());

  // Modals
  const [isAgeCalcOpen, setIsAgeCalcOpen] = useState<boolean>(false);
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [isLotteryModalOpen, setIsLotteryModalOpen] = useState<boolean>(false);
  const [isJudgingModalOpen, setIsJudgingModalOpen] = useState<boolean>(false);
  const [judgingParticipant, setJudgingParticipant] = useState<Participant | null>(null);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState<boolean>(false);
  const [isAuditLogOpen, setIsAuditLogOpen] = useState<boolean>(false);

  // Print Queue
  const [printQueue, setPrintQueue] = useState<Participant[]>([]);

  const applyRoute = (route: AppRoute, updateHistory: boolean = true) => {
    if (updateHistory) {
      navigateToRoute(route);
    }

    if (route === 'kalkulator') {
      setIsAgeCalcOpen(true);
      setActiveTab('beranda');
      return;
    }

    if (route === 'login') {
      setIsLoginOpen(true);
      setActiveTab(session ? 'admin' : 'beranda');
      return;
    }

    if (route === 'undian') {
      if (session) {
        setActiveTab('undian');
      } else {
        setIsLoginOpen(true);
        setActiveTab('beranda');
      }
      return;
    }

    if (route === 'presensi') {
      if (session) {
        setIsQrScannerOpen(true);
        setActiveTab('admin-data-peserta');
      } else {
        setIsLoginOpen(true);
        setActiveTab('beranda');
      }
      return;
    }

    if (
      route === 'admin' ||
      route === 'admin-data-peserta' ||
      route === 'admin-rekap-peserta' ||
      route === 'admin-rekapcbg-lomba' ||
      route === 'berita-acara' ||
      route === 'pengaturan' ||
      route === 'log' ||
      route === 'superadmin' ||
      route === 'adminkecamatan'
    ) {
      if (!session) {
        setIsLoginOpen(true);
        setActiveTab('beranda');
      } else {
        setActiveTab(route === 'admin' || route === 'superadmin' || route === 'adminkecamatan' ? 'admin-data-peserta' : route);
      }
      return;
    }

    if (route === 'rekapitulasi') {
      if (session) {
        setActiveTab('rekapitulasi');
      } else {
        setIsLoginOpen(true);
        setActiveTab('beranda');
      }
      return;
    }

    setActiveTab(route);
  };

  useEffect(() => {
    const localData = getStoredParticipants();
    setParticipants(localData);
    const storedSession = getStoredSession();
    setSession(storedSession);
    const storedSettings = getStoredSettings();
    setSettings(storedSettings);

    // Listener jika pengaturan (tema/nama event) diubah dari Backoffice
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'fasi_settings') {
        setSettings(getStoredSettings());
      }
      if (e.key === 'fasi_participants') {
        setParticipants(getStoredParticipants());
      }
    };

    // Custom window event listener untuk sinkronisasi seketika dalam satu tab
    const handleLocalSettingsUpdate = () => {
      setSettings(getStoredSettings());
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('fasi_settings_updated', handleLocalSettingsUpdate);

    // Jika Supabase aktif, lakukan sinkronisasi awal
    if (isSupabaseConfigured()) {
      fetchParticipantsFromSupabase().then((remoteData) => {
        if (remoteData && remoteData.length > 0) {
          setParticipants(remoteData);
          saveParticipants(remoteData);
        }
      });
    }

    // Initial URL Routing sync
    const initialRoute = getCurrentRouteFromURL();
    applyRoute(initialRoute, false);

    // Browser navigation event listeners
    const handlePopState = () => {
      const current = getCurrentRouteFromURL();
      applyRoute(current, false);
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('fasi_settings_updated', handleLocalSettingsUpdate);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  const handleNavigate = (route: AppRoute) => {
    applyRoute(route, true);
  };

  const handleUpdateParticipants = (newList: Participant[]) => {
    setParticipants(newList);
    saveParticipants(newList);
  };

  const handleSaveParticipant = (savedParticipant: Participant) => {
    const exists = participants.some((p) => p.id === savedParticipant.id);
    let updated: Participant[];

    if (exists) {
      updated = participants.map((p) => (p.id === savedParticipant.id ? savedParticipant : p));
      logAuditEvent(
        session?.name || 'ADMIN',
        'UPDATE_SANTRI',
        `Memperbarui data santri ${savedParticipant.fullName} (${savedParticipant.registrationNumber}).`
      );
    } else {
      updated = [savedParticipant, ...participants];
      logAuditEvent(
        session?.name || 'ADMIN',
        'TAMBAH_SANTRI',
        `Mendaftarkan santri baru ${savedParticipant.fullName} (${savedParticipant.registrationNumber}) ke sistem.`
      );
    }

    handleUpdateParticipants(updated);
  };

  const handleSaveMultipleParticipants = (newBatch: Participant[]) => {
    const updated = [...newBatch, ...participants];
    handleUpdateParticipants(updated);
  };

  const handleLoginSuccess = (newSession: UserSession) => {
    setSession(newSession);
    saveSession(newSession);
    setIsLoginOpen(false);
    handleNavigate('admin');
    showToast('success', `Selamat Datang, ${newSession.name}!`);
  };

  const handleLogout = async () => {
    const confirm = await showConfirmDialog(
      'Keluar dari Panel Admin?',
      'Sesi autentikasi Anda akan diakhiri.',
      'Ya, Logout'
    );
    if (!confirm) return;

    if (session) {
      logAuditEvent(session.name, 'LOGOUT', 'Pengguna keluar dari sesi panel kontrol.');
    }
    setSession(null);
    clearSession();
    handleNavigate('beranda');
    showToast('info', 'Anda telah berhasil logout.');
  };

  const handleOpenEdit = (p: Participant) => {
    setEditingParticipant(p);
    setIsFormModalOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingParticipant(null);
    setIsFormModalOpen(true);
  };

  const handleOpenJudging = (p: Participant) => {
    setJudgingParticipant(p);
    setIsJudgingModalOpen(true);
  };

  const handleSaveScore = (updated: Participant) => {
    const list = participants.map((p) => (p.id === updated.id ? updated : p));
    handleUpdateParticipants(list);
  };

  const handleCheckInSuccess = (updated: Participant) => {
    const list = participants.map((p) => (p.id === updated.id ? updated : p));
    handleUpdateParticipants(list);
  };

  const handleViewSingleCard = (p: Participant) => {
    setPrintQueue([p]);
    handleNavigate('cetak');
  };

  const handlePrintAllCards = () => {
    // Open print studio with all verified participants for rich filtering
    const queue =
      session?.role === 'kemantren_admin' && session.kemantrenId
        ? participants.filter((p) => p.kemantrenId === session.kemantrenId && p.status === 'verified')
        : participants.filter((p) => p.status === 'verified');

    setPrintQueue(queue);
    handleNavigate('cetak');
  };

  const theme = getThemeConfig(settings?.themeColor);

  return (
    <div className={`min-h-screen flex flex-col bg-slate-100 text-slate-900 font-sans antialiased ${theme.selectionClass}`}>
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => handleNavigate(tab)}
        session={session}
        settings={settings}
        onOpenLogin={() => handleNavigate('login')}
        onLogout={handleLogout}
        onOpenAgeCalc={() => handleNavigate('kalkulator')}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'beranda' && (
          <PublicPortal
            participants={participants}
            settings={settings}
            onOpenAgeCalc={() => handleNavigate('kalkulator')}
            onNavigateTab={(tab) => handleNavigate(tab as AppRoute)}
          />
        )}

        {activeTab === 'peserta' && (
          <ParticipantDirectory
            participants={participants}
            onViewIdCard={handleViewSingleCard}
          />
        )}

        {activeTab === 'klasemen' && <LiveScoreboard participants={participants} />}

        {activeTab === 'lokasi' && <LocationMap />}

        {(activeTab === 'admin' ||
          activeTab === 'admin-data-peserta' ||
          activeTab === 'admin-rekap-peserta' ||
          activeTab === 'admin-rekapcbg-lomba' ||
          activeTab === 'berita-acara' ||
          activeTab === 'pengaturan' ||
          activeTab === 'log') &&
          session && (
            <AdminDashboard
              session={session}
              participants={participants}
              onUpdateParticipants={handleUpdateParticipants}
              onOpenAddModal={handleOpenAdd}
              onOpenEditModal={handleOpenEdit}
              onOpenLotteryModal={() => handleNavigate('undian')}
              onOpenJudgingModal={handleOpenJudging}
              onOpenQrScanner={() => setIsQrScannerOpen(true)}
              onOpenAuditLog={() => setIsAuditLogOpen(true)}
              onOpenPrintCards={handlePrintAllCards}
              onOpenPrintRecap={() => handleNavigate('rekapitulasi')}
              onViewSingleCard={handleViewSingleCard}
              activeRoute={activeTab}
              onNavigateRoute={(r) => handleNavigate(r)}
            />
          )}

        {activeTab === 'undian' && session && session.role === 'super_admin' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => handleNavigate('admin')}
                className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                ← Kembali ke Admin Dashboard
              </button>
            </div>
            <UndianNomorTampil
              session={session}
              participants={participants}
              onUpdateParticipants={handleUpdateParticipants}
            />
          </div>
        )}

        {activeTab === 'cetak' && (
          <IdCardPrintView
            participants={printQueue.length > 0 ? printQueue : participants.filter((p) => p.status === 'verified')}
            session={session}
            onBack={() => handleNavigate(session ? 'admin' : 'peserta')}
          />
        )}

        {activeTab === 'rekapitulasi' && session && session.role === 'super_admin' && (
          <RecapPrintView
            participants={participants}
            session={session}
            onBack={() => handleNavigate('admin')}
          />
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Modals */}
      <AgeCalculatorModal
        isOpen={isAgeCalcOpen}
        onClose={() => setIsAgeCalcOpen(false)}
      />

      <AdminLoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {session && (
        <>
          <ParticipantFormModal
            isOpen={isFormModalOpen}
            onClose={() => {
              setIsFormModalOpen(false);
              setEditingParticipant(null);
            }}
            onSave={handleSaveParticipant}
            onSaveMultiple={handleSaveMultipleParticipants}
            editingParticipant={editingParticipant}
            session={session}
            allParticipants={participants}
          />

          {session.role === 'super_admin' && (
            <>
              <LotteryDrawModal
                isOpen={isLotteryModalOpen}
                onClose={() => setIsLotteryModalOpen(false)}
                participants={participants}
                onUpdateParticipants={handleUpdateParticipants}
                session={session}
              />

              <QrScannerModal
                isOpen={isQrScannerOpen}
                onClose={() => setIsQrScannerOpen(false)}
                participants={participants}
                onCheckInSuccess={handleCheckInSuccess}
                session={session}
              />

              <AuditLogModal
                isOpen={isAuditLogOpen}
                onClose={() => setIsAuditLogOpen(false)}
              />
            </>
          )}

          <JudgingModal
            isOpen={isJudgingModalOpen}
            onClose={() => {
              setIsJudgingModalOpen(false);
              setJudgingParticipant(null);
            }}
            participant={judgingParticipant}
            onSaveScore={handleSaveScore}
            session={session}
          />
        </>
      )}
    </div>
  );
}
