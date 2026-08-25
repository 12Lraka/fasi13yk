/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Definisi Tema Warna & Asset Resmi ID Card
 */

export interface IdCardTheme {
  id: string;
  name: string;
  primaryColor: string;
  accentColor: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  bgGradient: string;
  watermarkOpacity: number;
  textColor: string;
  subtextColor: string;
  taglineColor: string;
}

export const ID_CARD_ASSETS = {
  logoBadko: 'https://gigluvvkswjaiwxpnqet.supabase.co/storage/v1/object/public/public-assets/logobadko.png',
  logoFasi: 'https://gigluvvkswjaiwxpnqet.supabase.co/storage/v1/object/public/public-assets/logofasi.png',
  watermarkDesain: 'https://gigluvvkswjaiwxpnqet.supabase.co/storage/v1/object/public/public-assets/logodesain.png',
};

export const ID_CARD_THEMES: Record<string, IdCardTheme> = {
  emerald: {
    id: 'emerald',
    name: 'Hijau Emerald (Resmi FASI)',
    primaryColor: '#064e3b', // emerald-900
    accentColor: '#d97706', // amber-600
    badgeBg: '#064e3b',
    badgeText: '#fde68a', // amber-200
    borderColor: '#059669', // emerald-600
    bgGradient: 'from-emerald-50/50 via-white to-amber-50/40',
    watermarkOpacity: 0.08,
    textColor: '#022c22',
    subtextColor: '#047857',
    taglineColor: '#065f46',
  },
  navy: {
    id: 'navy',
    name: 'Biru Safir / Royal Navy',
    primaryColor: '#1e3a8a', // blue-900
    accentColor: '#0284c7', // sky-600
    badgeBg: '#1e3a8a',
    badgeText: '#bae6fd', // sky-200
    borderColor: '#2563eb', // blue-600
    bgGradient: 'from-blue-50/50 via-white to-sky-50/40',
    watermarkOpacity: 0.08,
    textColor: '#0f172a',
    subtextColor: '#1d4ed8',
    taglineColor: '#1e40af',
  },
  maroon: {
    id: 'maroon',
    name: 'Merah Marun Elegan',
    primaryColor: '#831843', // pink-950 / maroon
    accentColor: '#e11d48', // rose-600
    badgeBg: '#881337',
    badgeText: '#fecdd3', // rose-200
    borderColor: '#be123c', // rose-700
    bgGradient: 'from-rose-50/50 via-white to-amber-50/40',
    watermarkOpacity: 0.08,
    textColor: '#4c0519',
    subtextColor: '#9f1239',
    taglineColor: '#881337',
  },
  gold: {
    id: 'gold',
    name: 'Emas Amber Imperial',
    primaryColor: '#78350f', // amber-950
    accentColor: '#d97706', // amber-600
    badgeBg: '#78350f',
    badgeText: '#fef3c7', // amber-100
    borderColor: '#b45309', // amber-700
    bgGradient: 'from-amber-50/60 via-white to-yellow-50/40',
    watermarkOpacity: 0.09,
    textColor: '#451a03',
    subtextColor: '#92400e',
    taglineColor: '#78350f',
  },
  teal: {
    id: 'teal',
    name: 'Toska Modern / Cyan',
    primaryColor: '#134e4a', // teal-900
    accentColor: '#0d9488', // teal-600
    badgeBg: '#134e4a',
    badgeText: '#99f6e4', // teal-200
    borderColor: '#0f766e', // teal-700
    bgGradient: 'from-teal-50/50 via-white to-cyan-50/40',
    watermarkOpacity: 0.08,
    textColor: '#042f2e',
    subtextColor: '#0f766e',
    taglineColor: '#115e59',
  },
  slate: {
    id: 'slate',
    name: 'Dark Slate / Monokrom',
    primaryColor: '#0f172a', // slate-900
    accentColor: '#475569', // slate-600
    badgeBg: '#0f172a',
    badgeText: '#f1f5f9', // slate-100
    borderColor: '#334155', // slate-700
    bgGradient: 'from-slate-100/70 via-white to-slate-50/50',
    watermarkOpacity: 0.07,
    textColor: '#020617',
    subtextColor: '#334155',
    taglineColor: '#1e293b',
  },
};
