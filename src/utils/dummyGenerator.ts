/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Generator Data Dummy Santri FASI Realistis (TKA, TPA, TQA)
 * Mematuhi kalkulasi batasan usia per 1 Juli 2027 & kuota kemantren
 */

import { CompetitionCategory, Kemantren, Participant } from '../types/fasi';
import { evaluateFasiAge } from './ageCalculator';

const FIRST_NAMES_MALE = [
  'Muhammad', 'Ahmad', 'Danial', 'Fajar', 'Rizky', 'Farhan', 'Rayhan',
  'Naufal', 'Fadhil', 'Azka', 'Ziyad', 'Bilal', 'Hafizh', 'Hamzah',
  'Althaf', 'Kenzie', 'Ihsan', 'Daffa', 'Arkan', 'Salman', 'Yusuf',
  'Ibrahim', 'Luqman', 'Ghazali', 'Rafi', 'Aditya', 'Bagus', 'Zaidan',
  'Fathir', 'Hilman', 'Faris', 'Gibran', 'Zulfa', 'Al-Ghifari', 'Ilyas',
];

const FIRST_NAMES_FEMALE = [
  'Aisyah', 'Fatimah', 'Zahra', 'Nabila', 'Syifa', 'Annisa', 'Khadijah',
  'Maryam', 'Salma', 'Aqila', 'Hana', 'Nayla', 'Sarah', 'Kayla',
  'Shafira', 'Medina', 'Jasmine', 'Talita', 'Zhafira', 'Hasna', 'Rania',
  'Tsabita', 'Afifah', 'Aliya', 'Shakira', 'Nasywa', 'Raisya', 'Khalisa',
  'Kamila', 'Hafidzah', 'Ameera', 'Adiba', 'Qonita', 'Azizah', 'Mawaddah',
];

const LAST_NAMES = [
  'Al-Fatih', 'Pratama', 'Ramadhan', 'Hidayat', 'Maulana', 'Al-Ghazali',
  'Firdaus', 'Rahman', 'Hakim', 'Wijaya', 'Santoso', 'Kusuma', 'Syihab',
  'Ar-Rasyid', 'Setiawan', 'Nugroho', 'Saputra', 'Wibowo', 'Nugraha',
  'Putra', 'Putri', 'Azzahra', 'Wardani', 'Rahmawati', 'Lestari',
  'Salsabila', 'Humaira', 'Zahira', 'Nuraini', 'Fauziah', 'Safitri',
  'Damayanti', 'Nurhaliza', 'Khairunnisa', 'Maharani', 'Fitriani',
];

const TPA_PREFIXES = [
  'TPA Al-Ikhlas', 'TPA Al-Hidayah', 'TPA Masjid Gedhe', 'TPA Baiturrahman',
  'TPA Nurul Huda', 'TPA Al-Muttaqin', 'TPA Nurul Iman', 'TPA Darussalam',
  'TPA Al-Falah', 'TPA Kauman', 'TPA As-Salam', 'TPA Ar-Raudhah',
  'TPA Baitul Mukminin', 'TPA Al-Mujahidin', 'TPA An-Nuur', 'TPA Nurul Falah',
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/**
 * Hasilkan tanggal lahir valid per jenjang (TKA, TPA, TQA) sesuai patokan 1 Juli 2027
 */
function generateValidBirthDate(level: 'TKA' | 'TPA' | 'TQA'): { dateStr: string; dateObj: Date } {
  let year = 2021;
  let month = randomInt(0, 11);
  let day = randomInt(1, 28);

  if (level === 'TKA') {
    // Usia 4 - 7 tahun per 1 Juli 2027 (Kelahiran 1 Juli 2020 - 1 Juli 2023)
    year = randomInt(2021, 2022);
    day = randomInt(1, 28);
    month = randomInt(0, 11);
  } else if (level === 'TPA') {
    // Usia > 7 - 12 tahun per 1 Juli 2027 (Kelahiran 1 Juli 2015 - 30 Juni 2020)
    year = randomInt(2016, 2019);
    day = randomInt(1, 28);
    month = randomInt(0, 11);
  } else {
    // TQA: Usia > 12 - 15 tahun per 1 Juli 2027 (Kelahiran 1 Juli 2012 - 30 Juni 2015)
    year = randomInt(2013, 2014);
    day = randomInt(1, 28);
    month = randomInt(0, 11);
  }

  const dateObj = new Date(year, month, day);
  const dateStr = `${pad2(day)}/${pad2(month + 1)}/${year}`;
  return { dateStr, dateObj };
}

/**
 * Generate daftar santri dummy realistis
 */
export function generateDummyParticipantsList(
  count: number,
  categories: CompetitionCategory[],
  kemantrenList: Kemantren[]
): Participant[] {
  if (!categories.length || !kemantrenList.length || count <= 0) return [];

  const participants: Participant[] = [];
  const timestamp = Date.now();

  for (let i = 0; i < count; i++) {
    // Distribusi merata ke seluruh kemantren dan kategori
    const kemantren = kemantrenList[i % kemantrenList.length];
    const category = categories[i % categories.length];

    // Tentukan gender berdasarkan syarat lomba
    let gender: 'L' | 'P' = 'L';
    if (category.genderRequirement === 'L') {
      gender = 'L';
    } else if (category.genderRequirement === 'P') {
      gender = 'P';
    } else {
      gender = Math.random() > 0.5 ? 'L' : 'P';
    }

    // Nama lengkap realistis
    const firstName = gender === 'L' ? pickRandom(FIRST_NAMES_MALE) : pickRandom(FIRST_NAMES_FEMALE);
    const middleOrLastName = pickRandom(LAST_NAMES);
    const fullName = `${firstName} ${middleOrLastName}`;

    // Tanggal lahir valid sesuai level kategori
    const { dateStr } = generateValidBirthDate(category.level);
    const ageResult = evaluateFasiAge(dateStr);

    // Nomor urut peserta per cabang & kemantren
    const indexInBranch = Math.floor(i / (kemantrenList.length * categories.length)) + 1;
    const regNumber = `${kemantren.code}-${category.code}-${pad2(indexInBranch)}`;

    const tpaName = `${pickRandom(TPA_PREFIXES)} ${kemantren.name}`;
    const dummyId = `dummy-${timestamp}-${i + 1}`;

    // Skor acak untuk simulasi live score & ranking (sebagian sudah dinilai)
    const isScored = Math.random() > 0.4;
    let score1: number | undefined;
    let score2: number | undefined;
    let score3: number | undefined;
    let totalScore: number | undefined;
    let average: number | undefined;

    if (isScored) {
      score1 = randomInt(75, 96);
      score2 = randomInt(74, 97);
      score3 = randomInt(76, 95);
      totalScore = score1 + score2 + score3;
      average = Number((totalScore / 3).toFixed(2));
    }

    // Undian nomor tampil (acak 1 s.d. 14)
    const lotteryNumber = (i % 14) + 1;
    const nowIso = new Date().toISOString();

    participants.push({
      id: dummyId,
      registrationNumber: regNumber,
      fullName,
      gender,
      birthDate: dateStr,
      ageOnCutoff: {
        years: ageResult.years,
        months: ageResult.months,
        days: ageResult.days,
        isValid: true,
        levelEligible: category.level,
      },
      tpaUnitName: tpaName,
      kemantrenId: kemantren.id,
      categoryId: category.id,
      pjName: kemantren.adminName,
      whatsappNumber: kemantren.contactPerson,
      status: 'verified',
      attendance: Math.random() > 0.15 ? 'hadir' : 'belum_hadir',
      lotteryNumber,
      scoreJury1: score1,
      scoreJury2: score2,
      scoreJury3: score3,
      totalScore,
      averageScore: average,
      notes: '[DUMMY_DATA] Data simulasi sistem FASI XIII Kota Yogyakarta',
      createdAt: nowIso,
      updatedAt: nowIso,
    });
  }

  return participants;
}
