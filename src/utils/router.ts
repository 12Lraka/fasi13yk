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
  | 'admin-data-peserta'
  | 'admin-rekap-peserta'
  | 'admin-rekapcbg-lomba'
  | 'berita-acara'
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

  // Admin Routes
  '/admin': 'admin-data-peserta',
  '/admin/admindashboard': 'admin-data-peserta',
  '/admin/dashboard': 'admin-data-peserta',
  '/admin/data-peserta': 'admin-data-peserta',
  '/admin/peserta': 'admin-data-peserta',
  '/admin/rekap-peserta': 'admin-rekap-peserta',
  '/admin/rekapcbg-lomba': 'admin-rekapcbg-lomba',
  '/admin/rekap-cabang': 'admin-rekapcbg-lomba',
  '/admin/berita-acara': 'berita-acara',
  '/admin/kejuaraan': 'berita-acara',
  '/admin/undian': 'undian',
  '/admin/checkin': 'presensi',
  '/admin/presensi': 'presensi',
  '/admin/scan': 'presensi',
  '/admin/cetak-kartu': 'cetak',
  '/admin/cetak': 'cetak',
  '/admin/idcard': 'cetak',
  '/admin/rekapitulasi': 'rekapitulasi',
  '/admin/rekap': 'rekapitulasi',
  '/admin/pengaturan': 'pengaturan',
  '/admin/settings': 'pengaturan',
  '/admin/log-audit': 'log',
  '/admin/log': 'log',
  '/admin/audit': 'log',
  '/admin/penjurian': 'penjurian',

  // Shortcuts
  '/superadmin': 'admin-data-peserta',
  '/adminkecamatan': 'admin-data-peserta',
  '/berita-acara': 'berita-acara',
  '/undian': 'undian',
  '/lottery': 'undian',
  '/presensi': 'presensi',
  '/checkin': 'presensi',
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
  '/log-audit': 'log',
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
  admin: '/admin/data-peserta',
  'admin-data-peserta': '/admin/data-peserta',
  'admin-rekap-peserta': '/admin/rekap-peserta',
  'admin-rekapcbg-lomba': '/admin/rekapcbg-lomba',
  'berita-acara': '/admin/berita-acara',
  superadmin: '/admin/data-peserta',
  adminkecamatan: '/admin/data-peserta',
  undian: '/admin/undian',
  presensi: '/admin/checkin',
  penjurian: '/admin/penjurian',
  rekapitulasi: '/admin/rekapitulasi',
  cetak: '/admin/cetak-kartu',
  pengaturan: '/admin/pengaturan',
  log: '/admin/log-audit',
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
    if (sub.includes('berita-acara') || sub.includes('kejuaraan')) return 'berita-acara';
    if (sub.includes('rekap-peserta')) return 'admin-rekap-peserta';
    if (sub.includes('rekapcbg') || sub.includes('rekap-cabang')) return 'admin-rekapcbg-lomba';
    if (sub.includes('rekap') || sub.includes('rekapitulasi')) return 'rekapitulasi';
    if (sub.includes('undian')) return 'undian';
    if (sub.includes('cetak') || sub.includes('idcard')) return 'cetak';
    if (sub.includes('checkin') || sub.includes('presensi') || sub.includes('scan')) return 'presensi';
    if (sub.includes('juri') || sub.includes('penjurian')) return 'penjurian';
    if (sub.includes('pengaturan') || sub.includes('setting')) return 'pengaturan';
    if (sub.includes('log') || sub.includes('audit')) return 'log';
    if (sub.includes('peserta') || sub.includes('data')) return 'admin-data-peserta';
    return 'admin-data-peserta';
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
