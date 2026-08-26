import { AppSettings } from '../types/fasi';

export interface ThemeConfig {
  id: AppSettings['themeColor'];
  name: string;
  desc: string;
  headerGradient: string;
  headerBorder: string;
  headerSubtext: string;
  navbarBg: string;
  navbarBorder: string;
  navActiveBtn: string;
  navInactiveText: string;
  navIconActive: string;
  navIconInactive: string;
  logoBg: string;
  logoBorder: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  primaryBtn: string;
  primaryText: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;
  selectionClass: string;
}

export const THEMES: Record<AppSettings['themeColor'], ThemeConfig> = {
  emerald: {
    id: 'emerald',
    name: 'Emerald Classic',
    desc: 'Hijau Zamrud & Emas Elegan (Bawaan)',
    headerGradient: 'bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950',
    headerBorder: 'border-emerald-700/50',
    headerSubtext: 'text-emerald-200/90',
    navbarBg: 'bg-emerald-950/95',
    navbarBorder: 'border-emerald-800/80',
    navActiveBtn: 'bg-amber-400 text-slate-950 shadow-amber-950/30',
    navInactiveText: 'text-emerald-100/80 hover:text-white hover:bg-emerald-900/60',
    navIconActive: 'text-slate-950',
    navIconInactive: 'text-emerald-400',
    logoBg: 'bg-emerald-950',
    logoBorder: 'border-amber-400/40',
    badgeBg: 'bg-amber-400/20',
    badgeText: 'text-amber-300',
    badgeBorder: 'border-amber-400/30',
    primaryBtn: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white',
    primaryText: 'text-emerald-700',
    accentBg: 'bg-emerald-50',
    accentBorder: 'border-emerald-200',
    accentText: 'text-emerald-600',
    selectionClass: 'selection:bg-emerald-500 selection:text-white',
  },
  'islamic-green': {
    id: 'islamic-green',
    name: 'Hijau Islami',
    desc: 'Nuansa Hijau Daun Alami & Segar',
    headerGradient: 'bg-gradient-to-r from-green-950 via-green-900 to-emerald-950',
    headerBorder: 'border-green-700/50',
    headerSubtext: 'text-green-200/90',
    navbarBg: 'bg-green-950/95',
    navbarBorder: 'border-green-800/80',
    navActiveBtn: 'bg-lime-400 text-slate-950 shadow-green-950/30',
    navInactiveText: 'text-green-100/80 hover:text-white hover:bg-green-900/60',
    navIconActive: 'text-slate-950',
    navIconInactive: 'text-lime-400',
    logoBg: 'bg-green-950',
    logoBorder: 'border-lime-400/40',
    badgeBg: 'bg-lime-400/20',
    badgeText: 'text-lime-300',
    badgeBorder: 'border-lime-400/30',
    primaryBtn: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white',
    primaryText: 'text-green-700',
    accentBg: 'bg-green-50',
    accentBorder: 'border-green-200',
    accentText: 'text-green-600',
    selectionClass: 'selection:bg-green-500 selection:text-white',
  },
  teal: {
    id: 'teal',
    name: 'Teal Samudra',
    desc: 'Hijau Kebiruan Modern & Teduh',
    headerGradient: 'bg-gradient-to-r from-teal-950 via-teal-900 to-cyan-950',
    headerBorder: 'border-teal-700/50',
    headerSubtext: 'text-teal-200/90',
    navbarBg: 'bg-teal-950/95',
    navbarBorder: 'border-teal-800/80',
    navActiveBtn: 'bg-cyan-400 text-slate-950 shadow-teal-950/30',
    navInactiveText: 'text-teal-100/80 hover:text-white hover:bg-teal-900/60',
    navIconActive: 'text-slate-950',
    navIconInactive: 'text-cyan-400',
    logoBg: 'bg-teal-950',
    logoBorder: 'border-cyan-400/40',
    badgeBg: 'bg-cyan-400/20',
    badgeText: 'text-cyan-300',
    badgeBorder: 'border-cyan-400/30',
    primaryBtn: 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white',
    primaryText: 'text-teal-700',
    accentBg: 'bg-teal-50',
    accentBorder: 'border-teal-200',
    accentText: 'text-teal-600',
    selectionClass: 'selection:bg-teal-500 selection:text-white',
  },
  sapphire: {
    id: 'sapphire',
    name: 'Sapphire Royal',
    desc: 'Biru Safir Formal & Berwibawa',
    headerGradient: 'bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950',
    headerBorder: 'border-blue-700/50',
    headerSubtext: 'text-blue-200/90',
    navbarBg: 'bg-slate-950/95',
    navbarBorder: 'border-blue-800/80',
    navActiveBtn: 'bg-amber-400 text-slate-950 shadow-blue-950/30',
    navInactiveText: 'text-blue-100/80 hover:text-white hover:bg-blue-900/60',
    navIconActive: 'text-slate-950',
    navIconInactive: 'text-sky-400',
    logoBg: 'bg-slate-950',
    logoBorder: 'border-amber-400/40',
    badgeBg: 'bg-amber-400/20',
    badgeText: 'text-amber-300',
    badgeBorder: 'border-amber-400/30',
    primaryBtn: 'bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white',
    primaryText: 'text-blue-700',
    accentBg: 'bg-blue-50',
    accentBorder: 'border-blue-200',
    accentText: 'text-blue-600',
    selectionClass: 'selection:bg-blue-600 selection:text-white',
  },
  maroon: {
    id: 'maroon',
    name: 'Maroon Kasultanan',
    desc: 'Merah Marun Megah Istana Jogja',
    headerGradient: 'bg-gradient-to-r from-stone-950 via-rose-950 to-red-950',
    headerBorder: 'border-rose-800/50',
    headerSubtext: 'text-rose-200/90',
    navbarBg: 'bg-stone-950/95',
    navbarBorder: 'border-rose-900/80',
    navActiveBtn: 'bg-amber-400 text-slate-950 shadow-rose-950/30',
    navInactiveText: 'text-rose-100/80 hover:text-white hover:bg-rose-950/70',
    navIconActive: 'text-slate-950',
    navIconInactive: 'text-amber-400',
    logoBg: 'bg-stone-950',
    logoBorder: 'border-amber-400/40',
    badgeBg: 'bg-amber-400/20',
    badgeText: 'text-amber-300',
    badgeBorder: 'border-amber-400/30',
    primaryBtn: 'bg-gradient-to-r from-rose-800 to-red-800 hover:from-rose-700 hover:to-red-700 text-white',
    primaryText: 'text-rose-800',
    accentBg: 'bg-rose-50',
    accentBorder: 'border-rose-200',
    accentText: 'text-rose-700',
    selectionClass: 'selection:bg-rose-700 selection:text-white',
  },
  gold: {
    id: 'gold',
    name: 'Emas Kehormatan',
    desc: 'Nuansa Emas Tropis Prestisius',
    headerGradient: 'bg-gradient-to-r from-amber-950 via-stone-950 to-yellow-950',
    headerBorder: 'border-amber-700/50',
    headerSubtext: 'text-amber-200/90',
    navbarBg: 'bg-stone-950/95',
    navbarBorder: 'border-amber-900/80',
    navActiveBtn: 'bg-amber-400 text-slate-950 shadow-amber-950/30',
    navInactiveText: 'text-amber-100/80 hover:text-white hover:bg-amber-950/60',
    navIconActive: 'text-slate-950',
    navIconInactive: 'text-amber-400',
    logoBg: 'bg-stone-950',
    logoBorder: 'border-amber-400/40',
    badgeBg: 'bg-amber-400/20',
    badgeText: 'text-amber-300',
    badgeBorder: 'border-amber-400/30',
    primaryBtn: 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white',
    primaryText: 'text-amber-800',
    accentBg: 'bg-amber-50',
    accentBorder: 'border-amber-200',
    accentText: 'text-amber-700',
    selectionClass: 'selection:bg-amber-500 selection:text-slate-950',
  },
};

export function getThemeConfig(themeColor?: AppSettings['themeColor']): ThemeConfig {
  if (themeColor && THEMES[themeColor]) {
    return THEMES[themeColor];
  }
  return THEMES.emerald;
}

export function getFontFamilyClass(fontFamily?: AppSettings['fontFamily']): string {
  switch (fontFamily) {
    case 'poppins':
      return 'font-poppins';
    case 'inter':
      return 'font-inter';
    case 'scheherazade':
      return 'font-scheherazade';
    case 'plus-jakarta':
    default:
      return 'font-jakarta';
  }
}
