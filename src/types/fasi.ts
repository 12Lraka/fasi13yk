/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Tipe Data & Interface Sistem (RBAC, Santri, Lomba, Medali, Keamanan)
 */

export type FasiLevel = 'TKA' | 'TPA' | 'TQA';

export type Gender = 'L' | 'P';

export type ParticipantStatus = 'verified' | 'pending' | 'rejected';

export type AttendanceStatus = 'belum_hadir' | 'hadir' | 'siap_tampil' | 'sudah_tampil';

export interface Kemantren {
  id: string;
  code: string; // e.g. 'KG', 'DN', 'UH'
  name: string; // e.g. 'Kotagede', 'Danurejan'
  adminName: string;
  contactPerson: string;
  driveFolderUrl?: string;
  password?: string;
  username?: string;
}

export interface AppSettings {
  tagline: string;
  eventName: string;
  eventSubtitle: string;
  eventDate: string;
  eventLocation: string;
  themeColor: 'emerald' | 'islamic-green' | 'teal' | 'sapphire' | 'maroon' | 'gold';
  customAccentColor?: string;
  superAdminPassword?: string;
}

export interface CompetitionCategory {
  id: string;
  code: string; // e.g. 'TKA-01'
  level: FasiLevel;
  name: string; // e.g. 'Tartil Al-Qur\'an (Putra)'
  genderRequirement: 'L' | 'P' | 'ALL';
  isGroup: boolean;
  groupMemberCount?: number;
  maxParticipantsPerKemantren: number;
  description: string;
}

export interface Participant {
  id: string;
  registrationNumber: string; // e.g. 'KG-TPA-01-08'
  fullName: string;
  gender: Gender;
  birthDate: string; // 'DD/MM/YYYY'
  ageOnCutoff: {
    years: number;
    months: number;
    days: number;
    isValid: boolean;
    levelEligible: FasiLevel | null;
  };
  tpaUnitName: string;
  kemantrenId: string;
  categoryId: string;
  documentUrl?: string;
  lotteryNumber?: number | null; // Nomor undian tampil (1, 2, 3...)
  pjName: string; // Nama Penanggung Jawab
  whatsappNumber: string; // Nomor WA PJ / Kontingen
  photoUrl?: string;
  status: ParticipantStatus;
  attendance: AttendanceStatus;
  checkInTime?: string;
  scoreJury1?: number;
  scoreJury2?: number;
  scoreJury3?: number;
  totalScore?: number;
  averageScore?: number;
  rank?: number; // Juara 1, 2, 3, Harapan 1, 2, 3
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ParticipantDraft {
  id: string;
  fullName: string;
  gender: Gender;
  birthDate: string;
  ageOnCutoff: {
    years: number;
    months: number;
    days: number;
    isValid: boolean;
    levelEligible: FasiLevel | null;
  };
  tpaUnitName: string;
  kemantrenId: string;
  categoryId: string;
  pjName: string;
  whatsappNumber: string;
  createdAt: string;
}

export interface MedalTally {
  kemantrenId: string;
  kemantrenName: string;
  gold: number;
  silver: number;
  bronze: number;
  harapan1: number;
  harapan2: number;
  harapan3: number;
  totalPoints: number; // Gold: 5, Silver: 3, Bronze: 1
  rank: number;
}

export interface UserSession {
  role: 'super_admin' | 'kemantren_admin';
  kemantrenId?: string;
  name: string;
  token: string;
  loginTime: string;
  expiresAt: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
  ipMock: string;
  status: 'SUCCESS' | 'BLOCKED_BOT' | 'FLAGGED';
}

export interface SecurityChallenge {
  num1: number;
  num2: number;
  operator: '+' | '-' | '*';
  expectedAnswer: number;
  token: string;
}
