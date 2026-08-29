/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Generator Ekspor Microsoft Excel (.xlsx) Resmi & Rapi Rekapitulasi Cabang Lomba
 */

import * as XLSX from 'xlsx';
import { Participant, CompetitionCategory, Kemantren } from '../types/fasi';

interface ExportBranchExcelOptions {
  category: CompetitionCategory;
  participants: Participant[];
  kemantrenList: Kemantren[];
}

/**
 * Downloads single category recap data as a clean, professionally formatted Microsoft Excel (.xlsx) file
 */
export function exportBranchToExcel({
  category,
  participants,
  kemantrenList,
}: ExportBranchExcelOptions) {
  const getKemantrenName = (id: string) => {
    const k = kemantrenList.find((item) => item.id === id);
    return k ? k.name : id;
  };

  // Sort participants by Lottery Number if present, else Registration Number
  const inCat = participants
    .filter((p) => p.categoryId === category.id)
    .sort((a, b) => {
      if (a.lotteryNumber && b.lotteryNumber) return a.lotteryNumber - b.lotteryNumber;
      if (a.lotteryNumber) return -1;
      if (b.lotteryNumber) return 1;
      return a.registrationNumber.localeCompare(b.registrationNumber);
    });

  // Title rows for official letterhead in Excel
  const titleRows = [
    ['FESTIVAL ANAK SHOLEH INDONESIA (FASI) XIII'],
    ['BADKO TKA-TPA KOTA YOGYAKARTA'],
    ['Sekretariat : Jln. Kenari No. 56 Muja Muju, Umbulharjo, Kota Yogyakarta | Telp. 085179928551 / 085647392525'],
    [],
    ['REKAPITULASI PESERTA CABANG LOMBA'],
    [`Cabang Lomba : [${category.code}] ${category.name} (Tingkat ${category.level})`],
    [`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} | Total Peserta: ${inCat.length} Santri`],
    [],
  ];

  // Header Columns: No, Undian, No Registrasi, Nama Lengkap, L/P, Rayon & Unit TPA, Juri I, Juri II, Total Nilai
  const headers = [
    'No',
    'No. Undian',
    'No. Registrasi',
    'Nama Lengkap Santri',
    'L/P',
    'Rayon (Kemantren)',
    'Asal Unit TPA',
    'Nilai Juri I',
    'Nilai Juri II',
    'Total Nilai',
    'Peringkat Juara',
  ];

  // Rows Data
  const dataRows = inCat.map((p, index) => {
    const kemName = getKemantrenName(p.kemantrenId);

    const totalNilai = p.averageScore != null
      ? Number(p.averageScore.toFixed(2))
      : ((p.scoreJury1 || 0) + (p.scoreJury2 || 0)) > 0
      ? ((p.scoreJury1 || 0) + (p.scoreJury2 || 0))
      : '-';

    return [
      index + 1,
      p.lotteryNumber ? String(p.lotteryNumber).padStart(2, '0') : '-',
      p.registrationNumber || '-',
      p.fullName || '-',
      p.gender === 'L' ? 'L' : 'P',
      `Kemantren ${kemName}`,
      p.tpaUnitName || '-',
      p.scoreJury1 != null ? p.scoreJury1 : '-',
      p.scoreJury2 != null ? p.scoreJury2 : '-',
      totalNilai,
      p.rank != null ? `Juara ${p.rank}` : '-',
    ];
  });

  // Footer signature rows in Excel
  const dateStrId = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const footerRows = [
    [],
    [],
    ['', '', '', '', '', '', '', '', '', 'Yogyakarta, ' + dateStrId],
    ['Mengetahui,', '', '', '', '', '', '', '', '', 'Ketua Panitia FASI XIII'],
    ['Ketua Umum BADKO TKA-TPA Kota', '', '', '', '', '', '', '', '', ''],
    [],
    [],
    [],
    ['Dicky Artanto, S.Pd., M.Pd.', '', '', '', '', '', '', '', '', 'Andry Sunny, S.E.'],
  ];

  // Combine sheet data
  const sheetData = [...titleRows, headers, ...dataRows, ...footerRows];

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Column widths
  ws['!cols'] = [
    { wch: 6 },  // No
    { wch: 12 }, // Undian
    { wch: 18 }, // No Registrasi
    { wch: 32 }, // Nama Lengkap
    { wch: 6 },  // L/P
    { wch: 22 }, // Rayon Kemantren
    { wch: 26 }, // Asal Unit TPA
    { wch: 14 }, // Nilai Juri 1
    { wch: 14 }, // Nilai Juri 2
    { wch: 14 }, // Total Nilai
    { wch: 16 }, // Peringkat
  ];

  // Create workbook
  const wb = XLSX.utils.book_new();
  const safeSheetName = `${category.code}_${category.level}`.slice(0, 30);
  XLSX.utils.book_append_sheet(wb, ws, safeSheetName);

  // Generate file name
  const safeCatName = category.name.replace(/[/\\?%*:|"<>]/g, '_');
  const dateIso = new Date().toISOString().slice(0, 10);
  const fullFileName = `Rekap_Cabang_${category.code}_${safeCatName}_${dateIso}.xlsx`;

  XLSX.writeFile(wb, fullFileName);
}
