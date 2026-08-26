/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Navbar Komponen
 */

import React from 'react';
import { Award, Calculator, Calendar, MapPin, Users, ShieldCheck, LogIn, LogOut, LayoutDashboard, Printer } from 'lucide-react';
import { UserSession } from '../../types/fasi';
import { AppRoute } from '../../utils/router';

interface NavbarProps {
  activeTab: AppRoute;
  setActiveTab: (tab: AppRoute) => void;
  session: UserSession | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenAgeCalc: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  session,
  onOpenLogin,
  onLogout,
  onOpenAgeCalc,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-emerald-900 text-white shadow-md border-b border-emerald-800">
      {/* Top Banner Penyelenggara */}
      <div className="bg-emerald-950 px-4 py-1.5 text-xs text-emerald-200 border-b border-emerald-900/60">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold tracking-wide uppercase">BADKO TKA-TPA Kota Yogyakarta</span>
            <span className="hidden sm:inline text-emerald-400">•</span>
            <span className="hidden sm:inline">FASI XIII Kota Yogyakarta 2026</span>
          </div>
          <div className="flex items-center gap-4 text-emerald-300">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Ahad, 11 Oktober 2026</span>
            </span>
            <span className="hidden md:flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>SMP Negeri 1 Yogyakarta</span>
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
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-800 border border-amber-400/40 flex items-center justify-center shadow-inner text-amber-300 font-serif font-black text-xl">
              F13
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base sm:text-lg tracking-tight leading-tight text-white group-hover:text-amber-300 transition-colors">
                  FASI XIII KOTA YOGYAKARTA
                </h1>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  RESMI
                </span>
              </div>
              <p className="text-xs text-emerald-300 font-normal">
                Sistem Pendaftaran, Validasi Usia & Live Score
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
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-white'
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
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-white'
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
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-white'
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
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-white'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Lokasi Lomba</span>
            </button>
          </nav>

          {/* User / RBAC Controls */}
          <div className="flex items-center gap-2">
            {session ? (
              <div className="flex items-center gap-2">
                <button
                  id="nav-btn-dashboard"
                  onClick={() => setActiveTab('admin')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold ${
                    activeTab === 'admin'
                      ? 'bg-amber-500 text-emerald-950'
                      : 'bg-emerald-700 hover:bg-emerald-600 text-white'
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
                  className="p-1.5 text-emerald-300 hover:text-white hover:bg-emerald-800 rounded-md transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="nav-btn-login"
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-emerald-950 shadow-sm transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Masuk Admin</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Sub Navigation */}
        <div className="flex lg:hidden overflow-x-auto py-2 border-t border-emerald-800 gap-1 text-xs no-scrollbar">
          <button
            onClick={() => setActiveTab('beranda')}
            className={`px-2.5 py-1.5 rounded whitespace-nowrap ${
              activeTab === 'beranda' ? 'bg-emerald-800 text-white font-semibold' : 'text-emerald-200'
            }`}
          >
            Beranda
          </button>
          <button
            onClick={onOpenAgeCalc}
            className="px-2.5 py-1.5 rounded whitespace-nowrap bg-amber-500/20 text-amber-300 font-semibold flex items-center gap-1"
          >
            <Calculator className="w-3.5 h-3.5" />
            Cek Usia
          </button>
          <button
            onClick={() => setActiveTab('peserta')}
            className={`px-2.5 py-1.5 rounded whitespace-nowrap ${
              activeTab === 'peserta' ? 'bg-emerald-800 text-white font-semibold' : 'text-emerald-200'
            }`}
          >
            Direktori Peserta
          </button>
          <button
            onClick={() => setActiveTab('klasemen')}
            className={`px-2.5 py-1.5 rounded whitespace-nowrap ${
              activeTab === 'klasemen' ? 'bg-emerald-800 text-white font-semibold' : 'text-emerald-200'
            }`}
          >
            Live Score
          </button>
          <button
            onClick={() => setActiveTab('lokasi')}
            className={`px-2.5 py-1.5 rounded whitespace-nowrap ${
              activeTab === 'lokasi' ? 'bg-emerald-800 text-white font-semibold' : 'text-emerald-200'
            }`}
          >
            Lokasi SMPN 1
          </button>
          {session && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-2.5 py-1.5 rounded whitespace-nowrap ${
                activeTab === 'admin' ? 'bg-amber-500 text-emerald-950 font-semibold' : 'bg-emerald-700 text-white'
              }`}
            >
              Backoffice
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
