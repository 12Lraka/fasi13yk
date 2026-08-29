/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Generator Ekspor Microsoft Excel (.xlsx) Resmi & Rapi Data Peserta
 */

import * as XLSX from 'xlsx';
import { Participant } from '../types/fasi';
import { getStoredCategories, getStoredKemantren } from './storage';

/**
 * Downloads participant data as a clean, professionally formatted Microsoft Excel (.xlsx) file
 */
export function exportParticipantsToExcel(
  participants: Participant[],
  fileNamePrefix: string = 'Daftar_Peserta_FASI_XIII'
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

  // Title rows for official letterhead in Excel
  const titleRows = [
    ['FESTIVAL ANAK SHOLEH INDONESIA (FASI) XIII'],
    ['BADKO TKA-TPA KOTA YOGYAKARTA'],
    ['Sekretariat : Jln. Kenari No. 56 Muja Muju, Umbulharjo, Kota Yogyakarta | Telp. 085179928551 / 085647392525'],
    [],
    ['REKAPITULASI NOMINASI TETAP PESERTA LOMBA'],
    [`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} | Total Peserta: ${participants.length} Santri`],
    [],
  ];

  // Header Columns: Rayon & Unit TPA
  const headers = [
    'No',
    'No. Registrasi',
    'Nama Lengkap Santri',
    'L/P',
    'Tgl Lahir / Usia',
    'Rayon (Kemantren)',
    'Asal Unit TPA',
    'Cabang Lomba',
    'Jenjang',
    'No. Undian',
    'Kehadiran',
    'Nilai Rata-rata',
    'Peringkat Juara',
    'Nama PJ / Pendamping',
    'No. WhatsApp PJ',
    'Status Validasi',
  ];

  // Rows Data
  const dataRows = participants.map((p, index) => {
    const cat = getCategory(p.categoryId);
    const kemName = getKemantrenName(p.kemantrenId);

    let kehadiran = 'Belum Hadir';
    if (p.attendance === 'sudah_tampil') kehadiran = 'Sudah Tampil';
    else if (p.attendance === 'siap_tampil' || p.attendance === 'hadir') kehadiran = 'Hadir';

    const birthAndAge = p.birthDate
      ? `${p.birthDate} (${p.ageOnCutoff.years}th ${p.ageOnCutoff.months}bln)`
      : '-';

    return [
      index + 1,
      p.registrationNumber || '-',
      p.fullName || '-',
      p.gender === 'L' ? 'L' : 'P',
      birthAndAge,
      `Kemantren ${kemName}`,
      p.tpaUnitName || '-',
      cat ? cat.name : p.categoryId,
      cat?.level || 'FASI',
      p.lotteryNumber ? String(p.lotteryNumber).padStart(2, '0') : '-',
      kehadiran,
      p.averageScore != null ? Number(p.averageScore.toFixed(2)) : '-',
      p.rank != null ? `Juara ${p.rank}` : '-',
      p.pjName || '-',
      p.whatsappNumber || '-',
      p.status === 'verified' ? 'Terverifikasi' : p.status === 'rejected' ? 'Ditolak' : 'Draft',
    ];
  });

  // Footer signature rows in Excel
  const dateStrId = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const footerRows = [
    [],
    [],
    ['', '', '', '', '', '', '', '', '', '', '', 'Yogyakarta, ' + dateStrId],
    ['Mengetahui,', '', '', '', '', '', '', '', '', '', '', 'Ketua Panitia FASI XIII'],
    ['Ketua Umum BADKO TKA-TPA Kota', '', '', '', '', '', '', '', '', '', '', ''],
    [],
    [],
    [],
    ['Dicky Artanto, S.Pd., M.Pd.', '', '', '', '', '', '', '', '', '', '', 'Andry Sunny, S.E.'],
  ];

  // Combine title, headers, data, and signatures
  const sheetData = [...titleRows, headers, ...dataRows, ...footerRows];

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Set column widths for neat appearance
  ws['!cols'] = [
    { wch: 6 },  // No
    { wch: 18 }, // No. Registrasi
    { wch: 32 }, // Nama Lengkap
    { wch: 6 },  // L/P
    { wch: 22 }, // Tgl Lahir
    { wch: 22 }, // Rayon Kemantren
    { wch: 26 }, // Asal TPA
    { wch: 32 }, // Cabang Lomba
    { wch: 10 }, // Jenjang
    { wch: 12 }, // No. Undian
    { wch: 14 }, // Kehadiran
    { wch: 14 }, // Nilai
    { wch: 14 }, // Peringkat Juara
    { wch: 24 }, // Nama PJ
    { wch: 16 }, // WhatsApp
    { wch: 15 }, // Status Validasi
  ];

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Rekapitulasi FASI XIII');

  // Generate file name
  const dateStr = new Date().toISOString().slice(0, 10);
  const fullFileName = `${fileNamePrefix}_${dateStr}.xlsx`;

  // Write and trigger download
  XLSX.writeFile(wb, fullFileName);
}
