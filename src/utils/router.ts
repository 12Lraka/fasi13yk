/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Client-side Router & URL Path Synchronization Engine
 */

export type AppRoute =
  | 'beranda'
  | 'peserta'
  | 'klasemen'
  | 'lokasi'
  | 'kalkulator'
  | 'login'
  | 'admin'
  | 'superadmin'
  | 'adminkecamatan'
  | 'undian'
  | 'presensi'
  | 'penjurian'
  | 'rekapitulasi'
  | 'cetak'
  | 'pengaturan'
  | 'log';

// Mapping from URL path to internal route name
export const ROUTE_PATH_MAP: Record<string, AppRoute> = {
  '/': 'beranda',
  '/beranda': 'beranda',
  '/peserta': 'peserta',
  '/santri': 'peserta',
  '/klasemen': 'klasemen',
  '/juara': 'klasemen',
  '/lokasi': 'lokasi',
  '/kalkulator': 'kalkulator',
  '/login': 'login',
  // Admin Base & Sub-Routes
  '/admin': 'admin',
  '/admin/admindashboard': 'admin',
  '/admin/dashboard': 'admin',
  '/admin/peserta': 'admin',
  '/admin/undian': 'undian',
  '/admin/cetak-kartu': 'cetak',
  '/admin/cetak': 'cetak',
  '/admin/idcard': 'cetak',
  '/admin/rekap': 'rekapitulasi',
  '/admin/rekapitulasi': 'rekapitulasi',
  '/admin/pengaturan': 'pengaturan',
  '/admin/settings': 'pengaturan',
  '/admin/log': 'log',
  '/admin/presensi': 'presensi',
  '/admin/penjurian': 'penjurian',
  // Shortcuts
  '/superadmin': 'superadmin',
  '/adminkecamatan': 'adminkecamatan',
  '/undian': 'undian',
  '/lottery': 'undian',
  '/presensi': 'presensi',
  '/scan': 'presensi',
  '/penjurian': 'penjurian',
  '/juri': 'penjurian',
  '/rekapitulasi': 'rekapitulasi',
  '/rekap': 'rekapitulasi',
  '/cetak': 'cetak',
  '/idcard': 'cetak',
  '/pengaturan': 'pengaturan',
  '/settings': 'pengaturan',
  '/log': 'log',
  '/audit': 'log',
};

// Mapping from route name to primary canonical URL path
export const CANONICAL_PATH_MAP: Record<AppRoute, string> = {
  beranda: '/',
  peserta: '/peserta',
  klasemen: '/klasemen',
  lokasi: '/lokasi',
  kalkulator: '/kalkulator',
  login: '/login',
  admin: '/admin',
  superadmin: '/admin',
  adminkecamatan: '/admin',
  undian: '/admin/undian',
  presensi: '/admin/presensi',
  penjurian: '/admin/penjurian',
  rekapitulasi: '/admin/rekapitulasi',
  cetak: '/admin/cetak-kartu',
  pengaturan: '/admin/pengaturan',
  log: '/admin/log',
};

/**
 * Parses current window location (pathname or hash fallback) to determine the active route.
 */
export function getCurrentRouteFromURL(): AppRoute {
  if (typeof window === 'undefined') return 'beranda';

  // 1. Check Hash first (if user uses #/admin/undian)
  const hash = window.location.hash.replace(/^#\/?/, '/').toLowerCase();
  if (hash && ROUTE_PATH_MAP[hash]) {
    return ROUTE_PATH_MAP[hash];
  }

  // 2. Check Pathname (e.g. /admin/cetak-kartu, /admin/undian)
  const pathname = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
  if (ROUTE_PATH_MAP[pathname]) {
    return ROUTE_PATH_MAP[pathname];
  }

  // Prefix matching for any nested admin route
  if (pathname.startsWith('/admin/')) {
    const sub = pathname.replace(/^\/admin\//, '');
    if (sub.includes('undian')) return 'undian';
    if (sub.includes('cetak') || sub.includes('idcard')) return 'cetak';
    if (sub.includes('rekap')) return 'rekapitulasi';
    if (sub.includes('presensi') || sub.includes('scan')) return 'presensi';
    if (sub.includes('juri') || sub.includes('penjurian')) return 'penjurian';
    if (sub.includes('pengaturan') || sub.includes('setting')) return 'pengaturan';
    if (sub.includes('log') || sub.includes('audit')) return 'log';
    return 'admin';
  }

  return 'beranda';
}

/**
 * Updates the browser's URL without triggering a full page reload.
 */
export function navigateToRoute(route: AppRoute, replace: boolean = false) {
  if (typeof window === 'undefined') return;

  const targetPath = CANONICAL_PATH_MAP[route] || '/';
  const currentPath = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
  const currentHash = window.location.hash.replace(/^#\/?/, '/').toLowerCase();

  if (currentPath !== targetPath && currentHash !== targetPath) {
    const url = targetPath;
    if (replace) {
      window.history.replaceState({ route }, '', url);
    } else {
      window.history.pushState({ route }, '', url);
    }
  }
}
