/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Generator Ekspor Excel & CSV Data Peserta
 */

import { Participant } from '../types/fasi';
import { getStoredCategories, getStoredKemantren } from './storage';

/**
 * Escapes fields for CSV / Excel compatibility
 */
function escapeCsvValue(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Downloads participant data as an Excel-compatible CSV file (with UTF-8 BOM)
 */
export function exportParticipantsToExcel(
  participants: Participant[],
  fileNamePrefix: string = 'Data_Peserta_FASI_XIII'
) {
  const kemantrenList = getStoredKemantren();
  const categoriesList = getStoredCategories();

  const getKemantrenName = (id: string) => {
    const k = kemantrenList.find((item) => item.id === id);
    return k ? k.name : id;
  };

  const getCategory = (id: string) => {
    return categoriesList.find((item) => item.id === id);
  };

  // Header Columns
  const headers = [
    'No',
    'No. Registrasi',
    'Nama Lengkap Santri',
    'Jenis Kelamin',
    'Tanggal Lahir',
    'Usia (Thn-Bln-Hari)',
    'Kategori Jenjang',
    'Cabang Lomba',
    'Kemantren / Kecamatan',
    'Unit TKA/TPA',
    'Nama PJ / Pendamping',
    'Nomor WhatsApp PJ',
    'Nomor Undian Tampil',
    'Status Pendaftaran',
    'Status Presensi',
    'Nilai Juri 1',
    'Nilai Juri 2',
    'Nilai Juri 3',
    'Nilai Rata-rata',
    'Peringkat Juara',
    'Poin Juara Umum',
    'Catatan / Keterangan',
  ];

  // Rows Data
  const rows = participants.map((p, index) => {
    const cat = getCategory(p.categoryId);
    const kemName = getKemantrenName(p.kemantrenId);
    const ageString = p.ageOnCutoff
      ? `${p.ageOnCutoff.years} Thn ${p.ageOnCutoff.months} Bln ${p.ageOnCutoff.days} Hr`
      : '-';

    const points = p.rank === 1 ? 5 : p.rank === 2 ? 3 : p.rank === 3 ? 1 : 0;

    return [
      index + 1,
      p.registrationNumber || '-',
      p.fullName || '-',
      p.gender === 'L' ? 'Putra (L)' : 'Putri (P)',
      p.birthDate || '-',
      ageString,
      cat?.level || p.ageOnCutoff?.levelEligible || 'FASI',
      cat ? `[${cat.code}] ${cat.name}` : p.categoryId,
      `Kemantren ${kemName}`,
      p.tpaUnitName || '-',
      p.pjName || '-',
      p.whatsappNumber || '-',
      p.lotteryNumber ? String(p.lotteryNumber).padStart(2, '0') : 'Belum Diundi',
      p.status === 'verified' ? 'Terverifikasi' : p.status === 'rejected' ? 'Ditolak' : 'Draft',
      p.attendance === 'sudah_tampil'
        ? 'Sudah Tampil'
        : p.attendance === 'siap_tampil'
        ? 'Siap / Hadir'
        : 'Belum Tampil',
      p.scoreJury1 != null ? p.scoreJury1 : '-',
      p.scoreJury2 != null ? p.scoreJury2 : '-',
      p.scoreJury3 != null ? p.scoreJury3 : '-',
      p.averageScore != null ? p.averageScore : '-',
      p.rank != null ? `Juara ${p.rank}` : '-',
      points,
      p.notes || '-',
    ];
  });

  // Construct CSV Content with UTF-8 BOM (\uFEFF) for Excel compatibility
  const csvContent =
    '\uFEFF' +
    [
      headers.map(escapeCsvValue).join(','),
      ...rows.map((row) => row.map(escapeCsvValue).join(',')),
    ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const dateStr = new Date().toISOString().slice(0, 10);
  const fullFileName = `${fileNamePrefix}_${dateStr}.csv`;

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fullFileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
