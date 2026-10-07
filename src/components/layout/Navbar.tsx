/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Navbar Komponen
 */

import React, { useState, useRef, useEffect } from 'react';
import { Award, Calculator, Calendar, MapPin, Users, ShieldCheck, LogIn, LogOut, LayoutDashboard, Printer, QrCode, ChevronDown, X } from 'lucide-react';
import { UserSession, AppSettings } from '../../types/fasi';
import { AppRoute } from '../../utils/router';
import { getThemeConfig } from '../../utils/theme';

interface NavbarProps {
  activeTab: AppRoute;
  setActiveTab: (tab: AppRoute) => void;
  session: UserSession | null;
  settings?: AppSettings;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenAgeCalc: () => void;
  onOpenPresensi: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  session,
  settings,
  onOpenLogin,
  onLogout,
  onOpenAgeCalc,
  onOpenPresensi,
}) => {
  const theme = getThemeConfig(settings?.themeColor);
  const [isFeaturesOpen, setIsFeaturesOpen] = useState(false);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (featuresRef.current && !featuresRef.current.contains(event.target as Node)) {
        setIsFeaturesOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className={`sticky top-0 z-40 text-white shadow-md border-b ${theme.navbarBg} ${theme.navbarBorder}`}>
      {/* Top Banner Penyelenggara */}
      <div className={`${theme.headerGradient} px-4 py-1.5 text-xs border-b ${theme.headerBorder}`}>
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="font-semibold tracking-wide uppercase">{settings?.eventOrganizer || 'BADKO TKA-TPA Kota Yogyakarta'}</span>
            <span className="hidden sm:inline text-amber-400">•</span>
            <span className="hidden sm:inline">{settings?.eventTitle || 'FASI XIII Kota Yogyakarta'} {settings?.eventYear || '2026'}</span>
          </div>
          <div className="flex items-center gap-4 text-slate-200">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>{settings?.eventDate || 'Ahad, 11 Oktober 2026'}</span>
            </span>
            <span className="hidden md:flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>{settings?.eventVenue || 'SMP Negeri 1 Yogyakarta'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Identity */}
          <div
            id="nav-logo"
            onClick={() => setActiveTab('beranda')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className={`w-10 h-10 rounded-lg ${theme.logoBg} border ${theme.logoBorder} flex items-center justify-center shadow-inner text-amber-300 font-serif font-black text-xl overflow-hidden`}>
              {settings?.eventLogoUrl ? (
                <img src={settings.eventLogoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
              ) : (
                'F13'
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base sm:text-lg tracking-tight leading-tight text-white group-hover:text-amber-300 transition-colors">
                  {settings?.eventTitle || 'FASI XIII KOTA YOGYAKARTA'}
                </h1>
              </div>
              <p className={`text-xs ${theme.headerSubtext} font-normal`}>
                {settings?.eventSubtitle || 'Sistem Pendaftaran, Validasi Usia & Live Score'}
              </p>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              id="nav-tab-beranda"
              onClick={() => setActiveTab('beranda')}
              className={`px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'beranda'
                  ? `${theme.navActiveBtn}`
                  : `${theme.navInactiveText}`
              }`}
            >
              Beranda
            </button>
            <button
              id="nav-btn-kalkulator"
              onClick={onOpenAgeCalc}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs sm:text-sm font-medium text-amber-200 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/30 transition-colors"
            >
              <Calculator className="w-4 h-4 text-amber-400" />
              <span>Kalkulator Usia</span>
            </button>
            <button
              id="nav-tab-peserta"
              onClick={() => setActiveTab('peserta')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'peserta'
                  ? `${theme.navActiveBtn}`
                  : `${theme.navInactiveText}`
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Direktori Peserta</span>
            </button>
            <button
              id="nav-tab-klasemen"
              onClick={() => setActiveTab('klasemen')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'klasemen'
                  ? `${theme.navActiveBtn}`
                  : `${theme.navInactiveText}`
              }`}
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>Live Score</span>
            </button>
            <button
              id="nav-tab-lokasi"
              onClick={() => setActiveTab('lokasi')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'lokasi'
                  ? `${theme.navActiveBtn}`
                  : `${theme.navInactiveText}`
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Lokasi Lomba</span>
            </button>
          </nav>

          {/* User / RBAC Controls & Presensi QR */}
          <div className="flex items-center gap-2">
            <button
              id="nav-btn-presensi"
              onClick={onOpenPresensi}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all shadow-sm active:scale-95 cursor-pointer"
              title="Buka QR Scanner Presensi Check-in Hari-H"
            >
              <QrCode className="w-3.5 h-3.5 text-slate-950" />
              <span className="hidden sm:inline">Presensi QR</span>
              <span className="sm:hidden">Presensi</span>
            </button>

            {session ? (
              <div className="flex items-center gap-2">
                <button
                  id="nav-btn-dashboard"
                  onClick={() => setActiveTab('admin')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold ${
                    activeTab.startsWith('admin') || activeTab === 'pengaturan' || activeTab === 'log'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Panel</span>
                  <span>{session.name}</span>
                </button>
                <button
                  id="nav-btn-logout"
                  onClick={onLogout}
                  title="Keluar / Logout"
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="nav-btn-login"
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-white/15 hover:bg-white/25 text-white border border-white/20 shadow-sm transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Masuk Admin</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Sub Navigation */}
        <div className={`flex lg:hidden items-center overflow-x-auto py-2 border-t ${theme.navbarBorder} gap-1.5 text-xs no-scrollbar`}>
          <button
            onClick={() => {
              setActiveTab('beranda');
              setIsFeaturesOpen(false);
            }}
            className={`px-2.5 py-1.5 rounded whitespace-nowrap ${
              activeTab === 'beranda' ? `${theme.navActiveBtn} font-semibold` : 'text-slate-200'
            }`}
          >
            Beranda
          </button>
          <button
            onClick={() => {
              setActiveTab('peserta');
              setIsFeaturesOpen(false);
            }}
            className={`px-2.5 py-1.5 rounded whitespace-nowrap ${
              activeTab === 'peserta' ? `${theme.navActiveBtn} font-semibold` : 'text-slate-200'
            }`}
          >
            Direktori Peserta
          </button>
          <button
            onClick={() => {
              setActiveTab('klasemen');
              setIsFeaturesOpen(false);
            }}
            className={`px-2.5 py-1.5 rounded whitespace-nowrap ${
              activeTab === 'klasemen' ? `${theme.navActiveBtn} font-semibold` : 'text-slate-200'
            }`}
          >
            Live Score
          </button>
          <button
            onClick={() => {
              setActiveTab('lokasi');
              setIsFeaturesOpen(false);
            }}
            className={`px-2.5 py-1.5 rounded whitespace-nowrap ${
              activeTab === 'lokasi' ? `${theme.navActiveBtn} font-semibold` : 'text-slate-200'
            }`}
          >
            Lokasi Lomba
          </button>

          {/* Tombol Toggle Fitur Mobile */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsFeaturesOpen((prev) => !prev);
            }}
            className={`px-2.5 py-1.5 rounded whitespace-nowrap flex items-center gap-1 font-semibold transition-colors cursor-pointer shrink-0 ${
              isFeaturesOpen
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'bg-white/15 text-amber-300 hover:bg-white/25 border border-white/10'
            }`}
          >
            <span>Fitur</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isFeaturesOpen ? 'rotate-180 text-slate-950' : 'text-amber-300'
              }`}
            />
          </button>

          {session && (
            <button
              onClick={() => {
                setActiveTab('admin');
                setIsFeaturesOpen(false);
              }}
              className={`px-2.5 py-1.5 rounded whitespace-nowrap ${
                activeTab.startsWith('admin') || activeTab === 'pengaturan' || activeTab === 'log'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'bg-white/20 text-white'
              }`}
            >
              Backoffice
            </button>
          )}
        </div>

        {/* Panel Menu Fitur Mobile (Diletakkan di luar overflow-x-auto agar tidak pernah terpotong) */}
        {isFeaturesOpen && (
          <div
            ref={featuresRef}
            className="lg:hidden bg-slate-950/98 border-t border-slate-800 py-2 px-3.5 flex items-center justify-between gap-2 shadow-2xl animate-in slide-in-from-top-1 duration-150"
          >
            <span className="text-[11px] font-bold text-amber-300 tracking-wider uppercase pl-0.5">
              Menu Fitur:
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsFeaturesOpen(false);
                  onOpenPresensi();
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                Presensi QR
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsFeaturesOpen(false);
                  onOpenAgeCalc();
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-100 bg-slate-800 hover:bg-slate-700 border border-slate-700 active:scale-95 transition-all cursor-pointer"
              >
                Cek Usia
              </button>
              <button
                type="button"
                onClick={() => setIsFeaturesOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-white/10 cursor-pointer"
                title="Tutup Menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

