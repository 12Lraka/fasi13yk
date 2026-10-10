/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Generator Ekspor Microsoft Excel (.xlsx) Resmi & Rapi Data Peserta
 */

import * as XLSX from 'xlsx';
import { Participant, MasterTpa } from '../types/fasi';
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

  const LEVEL_ORDER: Record<string, number> = {
    TKA: 1,
    TPA: 2,
    TQA: 3,
  };

  // Pastikan data yang diekspor selalu terurut: Jenjang -> Kode Cabang Lomba -> No Undian -> Unit TPA & Nama
  const sortedParticipants = [...participants].sort((a, b) => {
    const catA = categoriesList.find((c) => c.id === a.categoryId);
    const catB = categoriesList.find((c) => c.id === b.categoryId);

    // 1. Jenjang
    const levelRankA = catA?.level ? (LEVEL_ORDER[catA.level] || 99) : 99;
    const levelRankB = catB?.level ? (LEVEL_ORDER[catB.level] || 99) : 99;
    if (levelRankA !== levelRankB) {
      return levelRankA - levelRankB;
    }

    // 2. Kode Cabang Lomba (TKA-01, TKA-02, ..., TPA-01, dst.)
    const codeA = catA?.code || '';
    const codeB = catB?.code || '';
    const codeComp = codeA.localeCompare(codeB, 'id', { numeric: true });
    if (codeComp !== 0) {
      return codeComp;
    }

    // 3. Nomor Undian
    const lotteryA = a.lotteryNumber != null && a.lotteryNumber > 0 ? a.lotteryNumber : 999999;
    const lotteryB = b.lotteryNumber != null && b.lotteryNumber > 0 ? b.lotteryNumber : 999999;
    if (lotteryA !== lotteryB) {
      return lotteryA - lotteryB;
    }

    // 4. Unit TPA & Nama
    const groupA = `${a.tpaUnitName || ''}_${a.fullName || ''}`;
    const groupB = `${b.tpaUnitName || ''}_${b.fullName || ''}`;
    const groupComp = groupA.localeCompare(groupB, 'id', { sensitivity: 'base' });
    if (groupComp !== 0) {
      return groupComp;
    }

    return (a.registrationNumber || '').localeCompare(b.registrationNumber || '', 'id');
  });

  // Title rows for official letterhead in Excel
  const titleRows = [
    ['FESTIVAL ANAK SHOLEH INDONESIA (FASI) XIII'],
    ['BADKO TKA-TPA KOTA YOGYAKARTA'],
    ['Sekretariat : Jln. Kenari No. 56 Muja Muju, Umbulharjo, Kota Yogyakarta | Telp. 085179928551 / 085647392525'],
    [],
    ['REKAPITULASI NOMINASI TETAP PESERTA LOMBA'],
    [`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} | Total Peserta: ${sortedParticipants.length} Santri`],
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
  const dataRows = sortedParticipants.map((p, index) => {
    const cat = getCategory(p.categoryId);
    const kemName = getKemantrenName(p.kemantrenId);

    const kehadiran = p.attendance === 'hadir' ? 'Hadir' : 'Belum Hadir';

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
  const dateStrId = '11 Oktober 2026';
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

/**
 * Downloads Master Data TPA as a clean, professionally formatted Microsoft Excel (.xlsx) file
 */
export function exportMasterTpaToExcel(
  tpaList: MasterTpa[],
  fileNamePrefix: string = 'Master_Data_TPA_Kota_Yogyakarta'
) {
  const kemantrenList = getStoredKemantren();

  const titleRows = [
    ['FESTIVAL ANAK SHOLEH INDONESIA (FASI) XIII'],
    ['BADKO TKA-TPA KOTA YOGYAKARTA'],
    ['Sekretariat : Jln. Kenari No. 56 Muja Muju, Umbulharjo, Kota Yogyakarta | Telp. 085179928551'],
    [],
    ['MASTER DATA LEMBAGA TKA / TPA KOTA YOGYAKARTA'],
    [`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} | Total Lembaga: ${tpaList.length} Unit TPA`],
    [],
  ];

  const headers = [
    'No',
    'Nama Unit TKA / TPA',
    'Nama Direktur / Kepala TPA',
    'Wilayah Rayon',
    'Kode Rayon',
    'No. Kontak / WA',
  ];

  const dataRows = tpaList.map((tpa, idx) => {
    const kem = kemantrenList.find((k) => k.id === tpa.kemantrenId);
    return [
      idx + 1,
      tpa.namaTpa,
      tpa.namaDirektur || '-',
      kem?.name || tpa.rayonName || 'Yogyakarta',
      kem?.code || '-',
      tpa.kontakDirektur || '-',
    ];
  });

  const wsData = [...titleRows, headers, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws['!cols'] = [
    { wch: 6 },  // No
    { wch: 32 }, // Nama Unit TPA
    { wch: 28 }, // Nama Direktur
    { wch: 20 }, // Rayon
    { wch: 12 }, // Kode
    { wch: 18 }, // No Kontak
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Master Data TPA');

  const dateStr = new Date().toISOString().slice(0, 10);
  const fullFileName = `${fileNamePrefix}_${dateStr}.xlsx`;

  XLSX.writeFile(wb, fullFileName);
}
