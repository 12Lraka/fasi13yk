/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Storage & State Synchronization Layer
 * (Local Persistence, RBAC Session, Medal Calculator, Lottery Engine)
 */

import { Participant, ParticipantDraft, MedalTally, UserSession, AuditLog, AppSettings, CompetitionCategory, Kemantren, BeritaAcaraKejuaraan } from '../types/fasi';
import { KEMANTREN_LIST, CATEGORIES_LIST, INITIAL_PARTICIPANTS } from '../data/fasiMasterData';
import { createAuditLog } from './security';
import {
  isSupabaseConfigured,
  bulkSyncParticipantsToSupabase,
  upsertParticipantToSupabase,
  deleteParticipantFromSupabase,
  insertAuditLogToSupabase,
} from '../lib/supabase';

const PARTICIPANTS_KEY = 'fasi13_participants_data';
const DRAFTS_KEY = 'fasi13_participants_drafts';
const AUDIT_LOGS_KEY = 'fasi13_audit_logs';
const SESSION_KEY = 'fasi13_user_session';
const SETTINGS_KEY = 'fasi13_app_settings';
const CATEGORIES_KEY = 'fasi13_categories_data';
const KEMANTREN_KEY = 'fasi13_kemantren_data';
const BERITA_ACARA_KEY = 'fasi13_berita_acara_data';

export const DEFAULT_SETTINGS: AppSettings = {
  tagline: 'Santri Hebat, Hebat Prestasi, Hebat Mengaji, & Berakhlakul Karimah.',
  eventName: 'FESTIVAL ANAK SHOLEH INDONESIA - XIII',
  eventSubtitle: 'Kota Yogyakarta 2026',
  eventDate: 'Ahad, 11 Oktober 2026',
  eventLocation: 'SMPN 1 Yogyakarta (Jl. Cik Di Tiro No. 29, Terban, Gondokusuman)',
  themeColor: 'emerald',
};

/**
 * Pengaturan Aplikasi (Tagline, Warna Tema, Event Info)
 */
export function getStoredSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('fasi_settings_updated', { detail: settings }));
    }
  } catch (err) {
    console.error('Gagal menyimpan pengaturan:', err);
  }
}

/**
 * CRUD Master Cabang Lomba
 */
export function getStoredCategories(): CompetitionCategory[] {
  try {
    const raw = localStorage.getItem(CATEGORIES_KEY);
    if (!raw) {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(CATEGORIES_LIST));
      return CATEGORIES_LIST;
    }
    const parsed: CompetitionCategory[] = JSON.parse(raw);
    // Upgrade legacy default quota 1 to 3 (individual) / 9 (group)
    const upgraded = parsed.map((cat) => {
      if (!cat.maxParticipantsPerKemantren || cat.maxParticipantsPerKemantren === 1) {
        return { ...cat, maxParticipantsPerKemantren: cat.isGroup ? 9 : 3 };
      }
      return cat;
    });
    return upgraded;
  } catch {
    return CATEGORIES_LIST;
  }
}

export function saveCategories(categories: CompetitionCategory[]): void {
  try {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  } catch (err) {
    console.error('Gagal menyimpan master cabang lomba:', err);
  }
}

export function resetCategories(): CompetitionCategory[] {
  try {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(CATEGORIES_LIST));
    return CATEGORIES_LIST;
  } catch {
    return CATEGORIES_LIST;
  }
}

/**
 * CRUD Master Kemantren & Akun Admin Kecamatan
 */
export function getStoredKemantren(): Kemantren[] {
  try {
    const raw = localStorage.getItem(KEMANTREN_KEY);
    if (!raw) {
      localStorage.setItem(KEMANTREN_KEY, JSON.stringify(KEMANTREN_LIST));
      return KEMANTREN_LIST;
    }
    const parsed: Kemantren[] = JSON.parse(raw);
    const upgraded = parsed.map((kem) => {
      const defaultPass = `${kem.name.toLowerCase().replace(/\s+/g, '')}123`;
      if (!kem.password || kem.password === 'kemantren123') {
        return { ...kem, password: defaultPass };
      }
      return kem;
    });
    return upgraded;
  } catch {
    return KEMANTREN_LIST;
  }
}

export function saveKemantren(kemantrenList: Kemantren[]): void {
  try {
    localStorage.setItem(KEMANTREN_KEY, JSON.stringify(kemantrenList));
  } catch (err) {
    console.error('Gagal menyimpan data kemantren:', err);
  }
}

export function resetKemantren(): Kemantren[] {
  try {
    localStorage.setItem(KEMANTREN_KEY, JSON.stringify(KEMANTREN_LIST));
    return KEMANTREN_LIST;
  } catch {
    return KEMANTREN_LIST;
  }
}

/**
 * Inisialisasi & Ambil Data Peserta
 */
export function getStoredParticipants(): Participant[] {
  try {
    const raw = localStorage.getItem(PARTICIPANTS_KEY);
    if (!raw) {
      localStorage.setItem(PARTICIPANTS_KEY, JSON.stringify([]));
      return [];
    }
    const parsed: Participant[] = JSON.parse(raw);
    // Filter out legacy dummy sample participant items
    const cleaned = parsed.filter((p) => !p.id.match(/^p-0[1-9]$|^p-10$/));
    return cleaned;
  } catch {
    return [];
  }
}

/**
 * Simpan Data Peserta ke LocalStorage dan Supabase (jika aktif)
 */
export function saveParticipants(participants: Participant[]): void {
  try {
    localStorage.setItem(PARTICIPANTS_KEY, JSON.stringify(participants));
    window.dispatchEvent(new CustomEvent('fasi_participants_updated'));
    if (isSupabaseConfigured()) {
      bulkSyncParticipantsToSupabase(participants).catch((err) =>
        console.warn('Gagal sinkronisasi background ke Supabase:', err)
      );
    }
  } catch (err) {
    console.error('Gagal menyimpan data peserta:', err);
  }
}

/**
 * Manajemen Draft Peserta (Untuk Pengisian Cepat & Kirim Massal)
 */
export function getStoredDrafts(): ParticipantDraft[] {
  try {
    const raw = localStorage.getItem(DRAFTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveDrafts(drafts: ParticipantDraft[]): void {
  try {
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  } catch (err) {
    console.error('Gagal menyimpan data draft:', err);
  }
}

export function clearDrafts(): void {
  try {
    localStorage.removeItem(DRAFTS_KEY);
  } catch (err) {
    console.error('Gagal membersihkan data draft:', err);
  }
}

/**
 * Aturan Bobot Poin Kejuaraan FASI XIII:
 * - Khusus cabang Tartil Al-Qur'an (TKA & TPA) dan Tilawati Al-Quran (TQA):
 *   Juara I = 7 Poin, Juara II = 5 Poin, Juara III = 3 Poin
 * - Cabang lomba lainnya:
 *   Juara I = 5 Poin, Juara II = 3 Poin, Juara III = 1 Poin
 */
export function getCategoryPointsForRank(categoryId: string, rank: number): number {
  const cat = getStoredCategories().find((c) => c.id === categoryId);
  const isSpecial =
    cat &&
    ((cat.level === 'TKA' && cat.name.toLowerCase().includes('tartil')) ||
      (cat.level === 'TPA' && cat.name.toLowerCase().includes('tartil')) ||
      (cat.level === 'TQA' && (cat.name.toLowerCase().includes('tilawati') || cat.name.toLowerCase().includes('tilawah'))));

  if (isSpecial) {
    if (rank === 1) return 7;
    if (rank === 2) return 5;
    if (rank === 3) return 3;
  } else {
    if (rank === 1) return 5;
    if (rank === 2) return 3;
    if (rank === 3) return 1;
  }
  return 0;
}

/**
 * Generate Nomor Registrasi Resmi FASI XIII
 * Format: {KODE_KEMANTREN}-{LEVEL}-{KODE_CABANG_NUM}-{URUTAN_2_DIGIT}
 * Contoh: KG-TPA-01-04
 */
export function generateRegistrationNumber(
  kemantrenId: string,
  categoryId: string,
  currentParticipants: Participant[]
): string {
  const kemantren = getStoredKemantren().find((k) => k.id === kemantrenId);
  const category = getStoredCategories().find((c) => c.id === categoryId);

  const kCode = kemantren ? kemantren.code : 'YK';
  const level = category ? category.level : 'TPA';
  const catCode = category ? category.code.replace(/[^\d]/g, '') : '01';

  // Hitung jumlah peserta terdaftar di kemantren & kategori ini
  const existingCount = currentParticipants.filter(
    (p) => p.kemantrenId === kemantrenId && p.categoryId === categoryId
  ).length;

  const sequence = String(existingCount + 1).padStart(2, '0');
  return `${kCode}-${level}-${catCode}-${sequence}`;
}

/**
 * Kalkulasi Klasemen Medali Real-time 14 Kemantren dengan Pembobotan Khusus
 */
export function calculateMedalTallies(participants: Participant[]): MedalTally[] {
  const tallies: Record<string, MedalTally> = {};
  const kemantrenList = getStoredKemantren();

  // Inisialisasi seluruh kemantren
  kemantrenList.forEach((k) => {
    tallies[k.id] = {
      kemantrenId: k.id,
      kemantrenName: k.name,
      gold: 0,
      silver: 0,
      bronze: 0,
      harapan1: 0,
      harapan2: 0,
      harapan3: 0,
      totalPoints: 0,
      rank: 0,
    };
  });

  // Hitung medali dan bobot poin dari peserta yang sudah dinilai
  participants.forEach((p) => {
    if (p.rank && tallies[p.kemantrenId]) {
      const points = getCategoryPointsForRank(p.categoryId, p.rank);
      tallies[p.kemantrenId].totalPoints += points;

      if (p.rank === 1) {
        tallies[p.kemantrenId].gold += 1;
      } else if (p.rank === 2) {
        tallies[p.kemantrenId].silver += 1;
      } else if (p.rank === 3) {
        tallies[p.kemantrenId].bronze += 1;
      } else if (p.rank === 4) {
        tallies[p.kemantrenId].harapan1 += 1;
      } else if (p.rank === 5) {
        tallies[p.kemantrenId].harapan2 += 1;
      } else if (p.rank === 6) {
        tallies[p.kemantrenId].harapan3 += 1;
      }
    }
  });

  // Urutkan berdasarkan: Total Poin -> Emas -> Perak -> Perunggu -> Nama
  const sorted = Object.values(tallies).sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.gold !== a.gold) return b.gold - a.gold;
    if (b.silver !== a.silver) return b.silver - a.silver;
    if (b.bronze !== a.bronze) return b.bronze - a.bronze;
    return a.kemantrenName.localeCompare(b.kemantrenName);
  });

  // Tentukan peringkat klasemen
  return sorted.map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));
}

/**
 * Eksekusi Pengundian Nomor Tampil Acak (Random Lottery Draw Engine)
 */
export function shuffleLotteryNumbers(
  categoryId: string,
  participants: Participant[]
): { updatedList: Participant[]; drawnCount: number } {
  const inCategory = participants.filter(p => p.categoryId === categoryId && p.status === 'verified');
  
  if (inCategory.length === 0) {
    return { updatedList: participants, drawnCount: 0 };
  }

  // Buat array nomor undian 1 s.d. N
  const numbers = Array.from({ length: inCategory.length }, (_, i) => i + 1);
  
  // Algoritma Fisher-Yates Shuffle
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }

  // Petakan ke peserta
  const idToNumberMap = new Map<string, number>();
  inCategory.forEach((p, idx) => {
    idToNumberMap.set(p.id, numbers[idx]);
  });

  const updatedList = participants.map(p => {
    if (idToNumberMap.has(p.id)) {
      return {
        ...p,
        lotteryNumber: idToNumberMap.get(p.id)!,
        updatedAt: new Date().toISOString(),
      };
    }
    return p;
  });

  saveParticipants(updatedList);
  return { updatedList, drawnCount: inCategory.length };
}

/**
 * Manajemen Audit Log
 */
export function getStoredAuditLogs(): AuditLog[] {
  try {
    const raw = localStorage.getItem(AUDIT_LOGS_KEY);
    if (!raw) {
      const initLog = createAuditLog('SISTEM', 'INISIALISASI', 'Sistem Informasi FASI XIII Kota Yogyakarta siap digunakan.');
      localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify([initLog]));
      return [initLog];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function logAuditEvent(
  user: string,
  action: string,
  details: string,
  status: 'SUCCESS' | 'BLOCKED_BOT' | 'FLAGGED' | 'ERROR' = 'SUCCESS',
  stack?: string
): void {
  try {
    const logs = getStoredAuditLogs();
    const newLog = createAuditLog(user, action, details, status, stack);
    const updated = [newLog, ...logs].slice(0, 150); // Maks 150 log
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(updated));

    if (isSupabaseConfigured()) {
      insertAuditLogToSupabase(newLog).catch((err) =>
        console.warn('Gagal mencatat audit log ke Supabase:', err)
      );
    }
  } catch (err) {
    console.error('Gagal mencatat audit log:', err);
  }
}

/**
 * Catat Error Sistem Otomatis ke Audit Log
 */
export function logErrorEvent(user: string, context: string, error: unknown): void {
  const errMsg = error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unknown error';
  const errStack = error instanceof Error ? error.stack : undefined;
  logAuditEvent(user || 'SISTEM', 'SYSTEM_ERROR', `[${context}] ${errMsg}`, 'ERROR', errStack);
}

export function clearAuditLogs(): void {
  try {
    const initLog = createAuditLog('SISTEM', 'LOG_CLEARED', 'Riwayat log telah dibersihkan oleh Administrator.');
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify([initLog]));
  } catch (err) {
    console.error('Gagal membersihkan audit log:', err);
  }
}

/**
 * Manajemen Session RBAC
 */
export function getStoredSession(): UserSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: UserSession = JSON.parse(raw);
    
    // Cek kadaluarsa session (misal 8 jam)
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function saveSession(session: UserSession): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (err) {
    console.error('Gagal menyimpan session:', err);
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (err) {
    console.error('Gagal menghapus session:', err);
  }
}

/**
 * Manajemen Berita Acara Kejuaraan Resmi (FASI XIII)
 */
export function getStoredBeritaAcara(): BeritaAcaraKejuaraan[] {
  try {
    const raw = localStorage.getItem(BERITA_ACARA_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Gagal mengambil data berita acara:', err);
    return [];
  }
}

export function saveBeritaAcaraList(list: BeritaAcaraKejuaraan[]): void {
  try {
    localStorage.setItem(BERITA_ACARA_KEY, JSON.stringify(list));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('fasi_berita_acara_updated', { detail: list }));
    }
  } catch (err) {
    console.error('Gagal menyimpan berita acara:', err);
  }
}
