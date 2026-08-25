/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Modul Kalkulator & Validasi Batas Usia Santri
 * Patokan Baku Juknis: 1 Juli 2027 (DD/MM/YYYY)
 */

import { FasiLevel } from '../types/fasi';

export const CUTOFF_DATE = new Date(2027, 6, 1); // 1 Juli 2027 (bulan index 6 = Juli)

export interface AgeCalculationResult {
  isValidFormat: boolean;
  parsedDate: Date | null;
  years: number;
  months: number;
  days: number;
  eligibleLevel: FasiLevel | null;
  isEligible: boolean;
  statusMessage: string;
  categoryRecommendations: string[];
  exactAgeText: string;
}

/**
 * Format input string menjadi DD/MM/YYYY secara otomatis saat mengetik
 */
export function maskDateInput(input: string): string {
  // Ambil hanya angka
  const cleaned = input.replace(/\D/g, '').slice(0, 8);
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 4) return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
  return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
}

/**
 * Mengurai format string DD/MM/YYYY ke objek Date
 */
export function parseDDMMYYYY(dateString: string): Date | null {
  if (!dateString || dateString.trim().length !== 10) return null;
  const parts = dateString.split('/');
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed
  const year = parseInt(parts[2], 10);

  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  if (year < 1990 || year > 2030) return null;
  if (month < 0 || month > 11) return null;

  const testDate = new Date(year, month, day);
  if (
    testDate.getFullYear() !== year ||
    testDate.getMonth() !== month ||
    testDate.getDate() !== day
  ) {
    return null;
  }

  return testDate;
}

/**
 * Hitung selisih presisi (Tahun, Bulan, Hari) antara Tanggal Lahir dan 1 Juli 2027
 */
export function calculateAgeOnCutoff(birthDate: Date): { years: number; months: number; days: number } {
  const target = new Date(CUTOFF_DATE);
  
  let years = target.getFullYear() - birthDate.getFullYear();
  let months = target.getMonth() - birthDate.getMonth();
  let days = target.getDate() - birthDate.getDate();

  if (days < 0) {
    // Ambil hari dari bulan sebelumnya di target
    const prevMonthLastDay = new Date(target.getFullYear(), target.getMonth(), 0).getDate();
    days += prevMonthLastDay;
    months -= 1;
  }

  if (months < 0) {
    months += 12;
    years -= 1;
  }

  return { years: Math.max(0, years), months: Math.max(0, months), days: Math.max(0, days) };
}

/**
 * Evaluasi Kelayakan Kategori Santri Berdasarkan Juknis Resmi FASI XIII:
 * 
 * - TKA: 4 s.d. 7 Tahun Inklusif (Kelahiran: 01 Juli 2020 s.d. 01 Juli 2023)
 * - TPA: > 7 s.d. 12 Tahun Inklusif (Kelahiran: 01 Juli 2015 s.d. 30 Juni 2020)
 * - TQA: > 12 s.d. 15 Tahun Inklusif (Kelahiran: 01 Juli 2012 s.d. 30 Juni 2015)
 */
export function evaluateFasiAge(dateString: string): AgeCalculationResult {
  const birthDate = parseDDMMYYYY(dateString);

  if (!birthDate) {
    return {
      isValidFormat: false,
      parsedDate: null,
      years: 0,
      months: 0,
      days: 0,
      eligibleLevel: null,
      isEligible: false,
      statusMessage: 'Format tanggal belum lengkap atau tidak valid (Gunakan format DD/MM/YYYY).',
      categoryRecommendations: [],
      exactAgeText: '-',
    };
  }

  const { years, months, days } = calculateAgeOnCutoff(birthDate);
  const exactAgeText = `${years} Tahun ${months} Bulan ${days} Hari`;

  // Patokan batas tanggal (Kelahiran)
  const dateTkaMin = new Date(2020, 6, 1); // 01 Juli 2020 (7 Tahun pada 1 Juli 2027)
  const dateTkaMax = new Date(2023, 6, 1); // 01 Juli 2023 (4 Tahun pada 1 Juli 2027)

  const dateTpaMin = new Date(2015, 6, 1); // 01 Juli 2015 (12 Tahun pada 1 Juli 2027)
  const dateTpaMax = new Date(2020, 5, 30); // 30 Juni 2020 (> 7 Tahun pada 1 Juli 2027)

  const dateTqaMin = new Date(2012, 6, 1); // 01 Juli 2012 (15 Tahun pada 1 Juli 2027)
  const dateTqaMax = new Date(2015, 5, 30); // 30 Juni 2015 (> 12 Tahun pada 1 Juli 2027)

  let eligibleLevel: FasiLevel | null = null;
  let isEligible = false;
  let statusMessage = '';
  let categoryRecommendations: string[] = [];

  const timeVal = birthDate.getTime();

  if (timeVal >= dateTkaMin.getTime() && timeVal <= dateTkaMax.getTime()) {
    eligibleLevel = 'TKA';
    isEligible = true;
    statusMessage = 'Lolos Verifikasi Kategori TKA (Taman Kanak-kanak Al-Qur\'an)';
    categoryRecommendations = [
      'Tartil Al-Qur\'an',
      'Adzan dan Iqomah',
      'Peragaan Shalat',
      'Ikrar & Puitisasi Tarjamah Al-Qur\'an',
      'Nasyid Islami',
      'Cerdas Cermat Al-Qur\'an',
      'Mewarnai Gambar',
      'Ceramah Agama Islam Bhs. Indonesia',
    ];
  } else if (timeVal >= dateTpaMin.getTime() && timeVal <= dateTpaMax.getTime()) {
    eligibleLevel = 'TPA';
    isEligible = true;
    statusMessage = 'Lolos Verifikasi Kategori TPA (Taman Pendidikan Al-Qur\'an)';
    categoryRecommendations = [
      'Tartil Al-Qur\'an',
      'Adzan dan Iqomah',
      'Ikrar & Puitisasi Tarjamah Al-Qur\'an',
      'Nasyid Islami',
      'Cerdas Cermat Al-Qur\'an',
      'Menggambar',
      'Ceramah Agama Islam Bhs. Indonesia',
    ];
  } else if (timeVal >= dateTqaMin.getTime() && timeVal <= dateTqaMax.getTime()) {
    eligibleLevel = 'TQA';
    isEligible = true;
    statusMessage = 'Lolos Verifikasi Kategori TQA (Ta\'limul Qur\'an Lil Aulad)';
    categoryRecommendations = [
      'Tilawati Al-Quran',
      'Tahfidz Juz Amma',
      'Syarhil Quran',
      'Cerdas Cermat Al-Quran',
      'Kisah Islami',
      'Kaligrafi',
      'Ceramah Agama Islam Bhs. Indonesia',
    ];
  } else {
    isEligible = false;
    if (timeVal > dateTkaMax.getTime()) {
      statusMessage = 'Belum Memenuhi Syarat Usia Minimal (Usia kurang dari 4 tahun per 1 Juli 2027).';
    } else {
      statusMessage = 'Melebihi Batas Usia Maksimal FASI XIII (Usia lebih dari 15 tahun per 1 Juli 2027).';
    }
  }

  return {
    isValidFormat: true,
    parsedDate: birthDate,
    years,
    months,
    days,
    eligibleLevel,
    isEligible,
    statusMessage,
    categoryRecommendations,
    exactAgeText,
  };
}
