/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Client Koneksi Database Supabase (PostgreSQL)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Participant, CompetitionCategory, Kemantren, AppSettings, AuditLog, FasiLevel } from '../types/fasi';
import { KEMANTREN_LIST } from '../data/fasiMasterData';

// Environment variables via Vite import.meta.env
const metaEnv = (import.meta as any).env || {};
const rawSupabaseUrl = (metaEnv.VITE_SUPABASE_URL as string | undefined) || '';
const rawSupabaseAnonKey = (metaEnv.VITE_SUPABASE_ANON_KEY as string | undefined) || '';

/**
 * Sanitasi URL Supabase untuk mencegah error PGRST125 jika pengguna memasukkan
 * URL dengan trailing slash, endpoint /rest/v1, atau URL dashboard.
 */
function sanitizeSupabaseUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim().replace(/^["']|["']$/g, '');
  
  // Jika pengguna menyalin URL dashboard https://supabase.com/dashboard/project/<project_ref>
  const dashboardMatch = url.match(/supabase\.com\/dashboard\/project\/([a-zA-Z0-9_\-]+)/);
  if (dashboardMatch && dashboardMatch[1]) {
    return `https://${dashboardMatch[1]}.supabase.co`;
  }

  // Hapus /rest/v1 atau /rest/v1/ di akhir URL jika ada
  url = url.replace(/\/rest\/v1\/?$/i, '');
  
  // Hapus trailing slash
  url = url.replace(/\/+$/, '');

  return url;
}

function sanitizeSupabaseKey(rawKey: string): string {
  if (!rawKey) return '';
  return rawKey.trim().replace(/^["']|["']$/g, '');
}

const supabaseUrl = sanitizeSupabaseUrl(rawSupabaseUrl);
const supabaseAnonKey = sanitizeSupabaseKey(rawSupabaseAnonKey);

let supabaseInstance: SupabaseClient | null = null;

/**
 * Cek apakah kredensial Supabase telah dikonfigurasi di environment
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('YOUR_SUPABASE') &&
    supabaseAnonKey.length > 20
  );
}

/**
 * Mendapatkan Supabase Client instance (Lazy Singleton)
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!supabaseInstance && supabaseUrl && supabaseAnonKey) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  return supabaseInstance;
}

/**
 * Uji koneksi ke database Supabase
 */
export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'Supabase URL atau Anon Key belum dikonfigurasi pada environment variables.',
    };
  }

  try {
    const { error } = await client.from('kemantren').select('id').limit(1);
    if (error) throw error;
    return { success: true, message: 'Koneksi ke database Supabase berhasil terhubung.' };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal terhubung ke Supabase: ${err?.message || 'Error tidak diketahui'}`,
    };
  }
}

// ====================================================================
// MAPPER: TypeScript (camelCase) <-> Supabase (snake_case)
// ====================================================================

/**
 * Konversi tanggal lahir dari DD/MM/YYYY (aplikasi) ke YYYY-MM-DD (PostgreSQL DATE)
 */
function formatDateToIso(dateStr: string): string {
  if (!dateStr) return '2015-01-01';
  // Jika sudah format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  // Jika format DD/MM/YYYY
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  // Fallback
  return dateStr;
}

/**
 * Konversi tanggal dari YYYY-MM-DD (PostgreSQL DATE) ke DD/MM/YYYY (aplikasi)
 */
function formatDateToDisplay(dateStr: string): string {
  if (!dateStr) return '';
  // Jika sudah format DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    return dateStr;
  }
  // Jika format YYYY-MM-DD
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const month = parts[1].padStart(2, '0');
    const day = parts[2].padStart(2, '0');
    return `${day}/${month}/${year}`;
  }
  return dateStr;
}

/**
 * Normalisasi status kehadiran untuk Supabase
 * Schema Supabase CHECK (attendance IN ('belum_tampil', 'siap_tampil', 'sudah_tampil'))
 */
function normalizeAttendanceForDb(attendance?: string): string {
  if (!attendance) return 'belum_tampil';
  const clean = attendance.trim().toLowerCase();
  if (clean === 'belum_tampil' || clean === 'siap_tampil' || clean === 'sudah_tampil') {
    return clean;
  }
  if (clean === 'belum_hadir' || clean === 'belum' || clean === 'absent') {
    return 'belum_tampil';
  }
  if (clean === 'hadir' || clean === 'siap') {
    return 'siap_tampil';
  }
  if (clean === 'selesai') {
    return 'sudah_tampil';
  }
  return 'belum_tampil';
}

/**
 * Normalisasi status pendaftaran untuk Supabase
 * Schema Supabase CHECK (status IN ('draft', 'verified', 'pending', 'rejected'))
 */
function normalizeStatusForDb(status?: string): string {
  if (!status) return 'verified';
  const clean = status.trim().toLowerCase();
  if (clean === 'rejected') return 'rejected';
  if (clean === 'pending' || clean === 'draft') return 'draft';
  return 'verified';
}

/**
 * Konversi timestamp ke ISO string untuk PostgreSQL TIMESTAMP WITH TIME ZONE
 */
function formatTimestampToIso(timestampStr?: string): string {
  if (!timestampStr) return new Date().toISOString();
  
  // Jika sudah ISO string
  if (timestampStr.includes('T') || /^\d{4}-\d{2}-\d{2}/.test(timestampStr)) {
    const d = new Date(timestampStr);
    if (!isNaN(d.getTime())) return d.toISOString();
  }

  // Format lokal Indonesia: "24/08/2026, 21.16.37" atau "24/08/2026 21:16:37"
  const match = timestampStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})[,\s]+(\d{1,2})[.:](\d{1,2})[.:](\d{1,2})/);
  if (match) {
    const [_, d, m, y, h, min, s] = match;
    const isoLike = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T${h.padStart(2, '0')}:${min.padStart(2, '0')}:${s.padStart(2, '0')}+07:00`;
    const dateObj = new Date(isoLike);
    if (!isNaN(dateObj.getTime())) return dateObj.toISOString();
  }

  return new Date().toISOString();
}

function mapParticipantToDb(p: Participant): Record<string, any> {
  const points = p.rank === 1 ? 5 : p.rank === 2 ? 3 : p.rank === 3 ? 1 : 0;
  
  // Ambil fallback nama PJ dan Kontak berdasarkan Kemantren jika data peserta belum mengisinya
  const kemantrenFallback = KEMANTREN_LIST.find((k) => k.id === p.kemantrenId);
  const safePjName = (p.pjName && p.pjName.trim()) 
    ? p.pjName.trim() 
    : (kemantrenFallback?.adminName || 'Admin Kontingen');
  const safeWhatsapp = (p.whatsappNumber && p.whatsappNumber.trim()) 
    ? p.whatsappNumber.trim() 
    : (kemantrenFallback?.contactPerson || '081200000000');
  const safeTpaUnit = (p.tpaUnitName && p.tpaUnitName.trim()) 
    ? p.tpaUnitName.trim() 
    : `TPA Kemantren ${kemantrenFallback?.name || ''}`;

  return {
    id: p.id,
    registration_number: p.registrationNumber,
    full_name: p.fullName || 'Santri FASI',
    gender: p.gender === 'L' || p.gender === 'P' ? p.gender : 'L',
    birth_date: formatDateToIso(p.birthDate),
    age_years: p.ageOnCutoff?.years || 0,
    age_months: p.ageOnCutoff?.months || 0,
    age_days: p.ageOnCutoff?.days || 0,
    kemantren_id: p.kemantrenId || 'kem-1',
    category_id: p.categoryId || 'cat-tka-1',
    tpa_unit_name: safeTpaUnit,
    pj_name: safePjName,
    whatsapp_number: safeWhatsapp,
    document_url: p.documentUrl || null,
    lottery_number: p.lotteryNumber || null,
    status: normalizeStatusForDb(p.status),
    attendance: normalizeAttendanceForDb(p.attendance),
    score_jury1: p.scoreJury1 ?? null,
    score_jury2: p.scoreJury2 ?? null,
    score_jury3: p.scoreJury3 ?? null,
    average_score: p.averageScore ?? null,
    rank: p.rank ?? null,
    points_awarded: points,
    notes: p.notes || null,
    updated_at: new Date().toISOString(),
  };
}

function mapDbToParticipant(row: Record<string, any>): Participant {
  const years = row.age_years || 0;
  let levelEligible: FasiLevel | null = null;
  if (years <= 7) levelEligible = 'TKA';
  else if (years <= 12) levelEligible = 'TPA';
  else if (years <= 15) levelEligible = 'TQA';

  return {
    id: row.id,
    registrationNumber: row.registration_number,
    fullName: row.full_name,
    gender: row.gender,
    birthDate: formatDateToDisplay(row.birth_date),
    kemantrenId: row.kemantren_id,
    categoryId: row.category_id,
    tpaUnitName: row.tpa_unit_name,
    documentUrl: row.document_url || undefined,
    lotteryNumber: row.lottery_number || null,
    pjName: row.pj_name,
    whatsappNumber: row.whatsapp_number,
    status: row.status || 'verified',
    attendance: row.attendance || 'belum_hadir',
    scoreJury1: row.score_jury1 !== null ? Number(row.score_jury1) : undefined,
    scoreJury2: row.score_jury2 !== null ? Number(row.score_jury2) : undefined,
    scoreJury3: row.score_jury3 !== null ? Number(row.score_jury3) : undefined,
    averageScore: row.average_score !== null ? Number(row.average_score) : undefined,
    rank: row.rank !== null ? Number(row.rank) : undefined,
    notes: row.notes || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ageOnCutoff: {
      years: row.age_years || 0,
      months: row.age_months || 0,
      days: row.age_days || 0,
      isValid: true,
      levelEligible,
    },
  };
}

// ====================================================================
// SERVICE CRUD OPERATIONS
// ====================================================================

/**
 * Mengambil semua peserta dari database Supabase
 */
export async function fetchParticipantsFromSupabase(): Promise<Participant[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('participants')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn(
          'Tabel "participants" belum dibuat di database Supabase. Silakan jalankan DDL SQL dari src/db/schema.sql pada Supabase SQL Editor.'
        );
      } else {
        console.warn('Gagal mengambil data peserta dari Supabase:', error.message || error);
      }
      return null;
    }
    if (!data) return [];

    return data.map(mapDbToParticipant);
  } catch (error: any) {
    console.warn('Gagal mengambil data peserta dari Supabase:', error?.message || error);
    return null;
  }
}

/**
 * Menyimpan atau memperbarui data peserta ke Supabase
 */
export async function upsertParticipantToSupabase(participant: Participant): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase URL & Anon Key belum terpasang di environment' };
  }

  try {
    const payload = mapParticipantToDb(participant);
    const { error } = await client.from('participants').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Gagal menyimpan peserta ke Supabase:', error);
    return { success: false, error: error?.message || 'Gagal menyimpan ke Supabase' };
  }
}

/**
 * Menghapus peserta dari Supabase
 */
export async function deleteParticipantFromSupabase(participantId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('participants').delete().eq('id', participantId);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Gagal menghapus peserta di Supabase:', error);
    return false;
  }
}

/**
 * Sinkronisasi massal seluruh data peserta ke Supabase
 */
export async function bulkSyncParticipantsToSupabase(participants: Participant[]): Promise<{ success: boolean; count: number; error?: string }> {
  const client = getSupabaseClient();
  if (!client || participants.length === 0) {
    return { success: false, count: 0, error: 'Supabase tidak aktif atau tidak ada peserta' };
  }

  try {
    const payloads = participants.map(mapParticipantToDb);
    const { error } = await client.from('participants').upsert(payloads, { onConflict: 'id' });
    if (error) throw error;
    return { success: true, count: payloads.length };
  } catch (error: any) {
    console.error('Gagal sinkronisasi data peserta ke Supabase:', error);
    return { success: false, count: 0, error: error?.message || 'Gagal sync ke Supabase' };
  }
}

/**
 * Normalisasi status audit log agar sesuai dengan CHECK constraint di database PostgreSQL Supabase
 * Schema database Supabase standar: CHECK (status IN ('SUCCESS', 'BLOCKED_BOT', 'FLAGGED'))
 */
function normalizeAuditStatusForDb(status?: string): 'SUCCESS' | 'BLOCKED_BOT' | 'FLAGGED' {
  if (!status) return 'SUCCESS';
  const clean = status.trim().toUpperCase();
  if (clean === 'SUCCESS' || clean === 'BLOCKED_BOT' || clean === 'FLAGGED') {
    return clean as 'SUCCESS' | 'BLOCKED_BOT' | 'FLAGGED';
  }
  // Jika status adalah 'ERROR' atau nilai lainnya, petakan ke 'FLAGGED' agar tidak melanggar check constraint
  return 'FLAGGED';
}

/**
 * Mengambil data audit log dari Supabase
 */
export async function fetchAuditLogsFromSupabase(): Promise<AuditLog[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100);

    if (error) throw error;
    return (data || []).map((row) => {
      const isError =
        row.status === 'ERROR' ||
        (row.status === 'FLAGGED' &&
          (row.action === 'SYSTEM_ERROR' || (row.details && row.details.startsWith('[ERROR]'))));

      return {
        id: row.id,
        user: row.user_name || row.user || 'Unknown',
        action: row.action,
        details: row.details,
        status: isError ? 'ERROR' : (row.status as any),
        ipMock: row.ip_address || row.ip_mock || '127.0.0.1',
        timestamp: row.timestamp,
      };
    });
  } catch (error) {
    console.error('Gagal mengambil audit log dari Supabase:', error);
    return null;
  }
}

/**
 * Menambahkan catatan audit log ke Supabase
 */
export async function insertAuditLogToSupabase(log: AuditLog): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const dbStatus = normalizeAuditStatusForDb(log.status);
    let detailsText = log.details || '';
    if (log.status === 'ERROR' && !detailsText.startsWith('[ERROR]')) {
      detailsText = `[ERROR] ${detailsText}`;
    }
    if (log.stack) {
      detailsText += `\nStack: ${log.stack.slice(0, 300)}`;
    }

    const { error } = await client.from('audit_logs').insert({
      id: log.id,
      user_name: log.user,
      action: log.action,
      details: detailsText,
      status: dbStatus,
      ip_address: log.ipMock || null,
      timestamp: formatTimestampToIso(log.timestamp),
    });
    if (error) throw error;
    return true;
  } catch (error) {
    console.warn('Gagal mencatat audit log ke Supabase:', error);
    return false;
  }
}

// ====================================================================
// MASTER DATA: CATEGORIES & KEMANTREN SYNC
// ====================================================================

function mapCategoryToDb(cat: CompetitionCategory): Record<string, any> {
  return {
    id: cat.id,
    code: cat.code,
    level: cat.level,
    name: cat.name,
    gender_requirement: cat.genderRequirement,
    is_group: Boolean(cat.isGroup),
    group_member_count: cat.groupMemberCount || 1,
    max_participants_per_kemantren: cat.maxParticipantsPerKemantren || 1,
    description: cat.description || '',
  };
}

function mapDbToCategory(row: Record<string, any>): CompetitionCategory {
  return {
    id: row.id,
    code: row.code,
    level: row.level as any,
    name: row.name,
    genderRequirement: (row.gender_requirement || 'ALL') as any,
    isGroup: Boolean(row.is_group),
    groupMemberCount: row.group_member_count || 1,
    maxParticipantsPerKemantren: row.max_participants_per_kemantren || 1,
    description: row.description || '',
  };
}

/**
 * Mengambil data cabang lomba dari Supabase
 */
export async function fetchCategoriesFromSupabase(): Promise<CompetitionCategory[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('categories')
      .select('*')
      .order('code', { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) return null;

    return data.map(mapDbToCategory);
  } catch (error: any) {
    console.warn('Gagal mengambil master cabang lomba dari Supabase:', error?.message || error);
    return null;
  }
}

/**
 * Sinkronisasi seluruh master cabang lomba ke Supabase
 */
export async function syncCategoriesToSupabase(categories: CompetitionCategory[]): Promise<{ success: boolean; count: number; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, count: 0, error: 'Supabase belum terkonfigurasi di environment.' };
  }

  try {
    const payloads = categories.map(mapCategoryToDb);
    const { error } = await client.from('categories').upsert(payloads, { onConflict: 'id' });
    if (error) throw error;
    return { success: true, count: payloads.length };
  } catch (error: any) {
    console.error('Gagal sinkronisasi kategori lomba ke Supabase:', error);
    return { success: false, count: 0, error: error?.message || 'Gagal menyimpan ke Supabase' };
  }
}

/**
 * Sinkronisasi master kemantren ke Supabase
 */
export async function syncKemantrenToSupabase(kemantrenList: Kemantren[]): Promise<{ success: boolean; count: number; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, count: 0, error: 'Supabase belum terkonfigurasi di environment.' };
  }

  try {
    const payloads = kemantrenList.map((k) => ({
      id: k.id,
      code: k.code,
      name: k.name,
      admin_name: k.adminName,
      password_hash: k.password || `${k.name.toLowerCase().replace(/\s+/g, '')}123`,
    }));
    const { error } = await client.from('kemantren').upsert(payloads, { onConflict: 'id' });
    if (error) throw error;
    return { success: true, count: payloads.length };
  } catch (error: any) {
    console.error('Gagal sinkronisasi kemantren ke Supabase:', error);
    return { success: false, count: 0, error: error?.message || 'Gagal menyimpan ke Supabase' };
  }
}

