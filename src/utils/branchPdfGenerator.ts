/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Generator PDF Berita Acara & Rekapitulasi Cabang Lomba A4 Portrait Rapi
 * Mendukung Ekspor Satuan (1 Cabang) atau Batch Semua Cabang Lomba
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Participant, CompetitionCategory, Kemantren } from '../types/fasi';
import { fetchImageAsBase64 } from './idCardPngGenerator';

const LOGO_BADKO_URL = 'https://gigluvvkswjaiwxpnqet.supabase.co/storage/v1/object/public/public-assets/logobadko.png';
const LOGO_FASI_URL = 'https://gigluvvkswjaiwxpnqet.supabase.co/storage/v1/object/public/public-assets/logofasi.png';

interface ExportBranchPdfOptions {
  category: CompetitionCategory;
  participants: Participant[];
  kemantrenList: Kemantren[];
  doc?: jsPDF;
  isFirstPage?: boolean;
}

/**
 * Render satu cabang lomba ke halaman dokumen jsPDF A4 Portrait
 */
export async function renderBranchToPdfPage({
  category,
  participants,
  kemantrenList,
  doc,
  isFirstPage = true,
}: ExportBranchPdfOptions): Promise<jsPDF> {
  const pdfDoc = doc || new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  if (!isFirstPage) {
    pdfDoc.addPage('a4', 'portrait');
  }

  const pageWidth = 210;
  const marginX = 12;
  const contentWidth = pageWidth - (marginX * 2);

  // Load logo images as Base64
  let logoBadkoBase64 = '';
  let logoFasiBase64 = '';
  try {
    logoBadkoBase64 = await fetchImageAsBase64(LOGO_BADKO_URL);
    logoFasiBase64 = await fetchImageAsBase64(LOGO_FASI_URL);
  } catch {
    // ignore
  }

  // 1. KOP SURAT RESMI
  const topY = 12;
  const logoSize = 16;

  if (logoBadkoBase64 && logoBadkoBase64.startsWith('data:')) {
    try {
      pdfDoc.addImage(logoBadkoBase64, 'PNG', marginX + 2, topY, logoSize, logoSize);
    } catch {}
  }

  if (logoFasiBase64 && logoFasiBase64.startsWith('data:')) {
    try {
      pdfDoc.addImage(logoFasiBase64, 'PNG', pageWidth - marginX - logoSize - 2, topY, logoSize, logoSize);
    } catch {}
  }

  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.setFontSize(11);
  pdfDoc.setTextColor(15, 23, 42); // slate-900
  pdfDoc.text('FESTIVAL ANAK SHOLEH INDONESIA XIII', pageWidth / 2, topY + 4, { align: 'center' });

  pdfDoc.setFontSize(12);
  pdfDoc.setTextColor(6, 78, 59); // emerald-900
  pdfDoc.text('BADKO TKA-TPA KOTA YOGYAKARTA', pageWidth / 2, topY + 9, { align: 'center' });

  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.setFontSize(7.5);
  pdfDoc.setTextColor(71, 85, 105); // slate-600
  pdfDoc.text(
    'Sekretariat : Jln. Kenari No. 56 Muja Muju, Umbulharjo, Kota Yogyakarta | Telp. 085179928551 / 085647392525',
    pageWidth / 2,
    topY + 14,
    { align: 'center' }
  );

  // Garis Kop Surat
  const lineY = topY + 18;
  pdfDoc.setDrawColor(15, 23, 42);
  pdfDoc.setLineWidth(0.8);
  pdfDoc.line(marginX, lineY, pageWidth - marginX, lineY);
  pdfDoc.setLineWidth(0.2);
  pdfDoc.line(marginX, lineY + 0.8, pageWidth - marginX, lineY + 0.8);

  // 2. JUDUL DOKUMEN & NAMA CABANG LOMBA
  const titleY = lineY + 7;
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.setFontSize(11);
  pdfDoc.setTextColor(15, 23, 42);
  pdfDoc.text('REKAPITULASI PESERTA CABANG LOMBA', pageWidth / 2, titleY, { align: 'center' });

  pdfDoc.setFontSize(10);
  pdfDoc.setTextColor(4, 120, 87); // emerald-700
  pdfDoc.text(
    `CABANG: [${category.code}] ${category.name.toUpperCase()} — TINGKAT ${category.level}`,
    pageWidth / 2,
    titleY + 5,
    { align: 'center' }
  );

  // Filter and sort participants for this category
  const inCat = participants
    .filter((p) => p.categoryId === category.id)
    .sort((a, b) => {
      if (a.lotteryNumber && b.lotteryNumber) return a.lotteryNumber - b.lotteryNumber;
      if (a.lotteryNumber) return -1;
      if (b.lotteryNumber) return 1;
      return a.registrationNumber.localeCompare(b.registrationNumber);
    });

  const getKemName = (id: string) => {
    const k = kemantrenList.find((item) => item.id === id);
    return k ? k.name : id;
  };

  // 3. TABEL DATA
  // Kolom: No, Undian, No Registrasi, Nama Lengkap, L/P, Rayon & Unit TPA, Juri I, Juri II, Total Nilai
  const tableHeaders = [
    'No',
    'Undian',
    'No Registrasi',
    'Nama Lengkap',
    'L/P',
    'Rayon & Unit TPA',
    'Juri I',
    'Juri II',
    'Total Nilai',
  ];

  const tableBody = inCat.length === 0
    ? [['-', '-', '-', 'Belum ada santri terdaftar pada cabang lomba ini.', '-', '-', '-', '-', '-']]
    : inCat.map((p, index) => {
        const kemName = getKemName(p.kemantrenId);
        const rayonAndTpa = p.tpaUnitName
          ? `Kem. ${kemName}\n${p.tpaUnitName}`
          : `Kem. ${kemName}`;

        const totalNilai = p.averageScore != null
          ? Number(p.averageScore.toFixed(2))
          : ((p.scoreJury1 || 0) + (p.scoreJury2 || 0)) > 0
          ? ((p.scoreJury1 || 0) + (p.scoreJury2 || 0))
          : '-';

        return [
          String(index + 1),
          p.lotteryNumber ? String(p.lotteryNumber).padStart(2, '0') : '-',
          p.registrationNumber || '-',
          p.fullName || '-',
          p.gender || '-',
          rayonAndTpa,
          p.scoreJury1 != null ? String(p.scoreJury1) : '',
          p.scoreJury2 != null ? String(p.scoreJury2) : '',
          totalNilai !== '-' ? String(totalNilai) : '',
        ];
      });

  const startTableY = titleY + 8;

  autoTable(pdfDoc, {
    startY: startTableY,
    head: [tableHeaders],
    body: tableBody,
    margin: { left: marginX, right: marginX, bottom: 45 },
    theme: 'grid',
    headStyles: {
      fillColor: [241, 245, 249], // slate-100
      textColor: [15, 23, 42], // slate-900
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center',
      valign: 'middle',
      lineWidth: 0.2,
      lineColor: [148, 163, 184], // slate-400
    },
    bodyStyles: {
      textColor: [15, 23, 42],
      fontSize: 8,
      lineWidth: 0.15,
      lineColor: [203, 213, 225], // slate-300
      valign: 'middle',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },  // No
      1: { halign: 'center', cellWidth: 14, fontStyle: 'bold' }, // Undian
      2: { halign: 'center', cellWidth: 26, fontStyle: 'bold' }, // No Registrasi
      3: { halign: 'left', cellWidth: 46, fontStyle: 'bold' },   // Nama Lengkap
      4: { halign: 'center', cellWidth: 10 }, // L/P
      5: { halign: 'left', cellWidth: 42 },   // Rayon & Unit TPA
      6: { halign: 'center', cellWidth: 13 }, // Juri I
      7: { halign: 'center', cellWidth: 13 }, // Juri II
      8: { halign: 'center', cellWidth: 14, fontStyle: 'bold' }, // Total Nilai
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
  });

  // 4. BLOK TANDA TANGAN RESMI
  // Sisi Kiri: Mengetahui, Ketua Umum BADKO TKA-TPA Kota (Dicky Artanto, S.Pd., M.Pd.)
  // Sisi Kanan: Yogyakarta, [Tanggal] Ketua Panitia FASI XIII (Andry Sunny, S.E.)
  const lastTableY = (pdfDoc as any).lastAutoTable?.finalY || startTableY + 40;
  const pageHeight = 297;
  let signatureY = lastTableY + 8;

  // Jika tidak cukup ruang untuk tanda tangan (butuh minimal 35mm), buat halaman baru
  if (signatureY + 35 > pageHeight) {
    pdfDoc.addPage('a4', 'portrait');
    signatureY = 20;
  }

  const colWidth = contentWidth / 2;
  const colLeftX = marginX + (colWidth / 2);
  const colRightX = marginX + colWidth + (colWidth / 2);

  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.setFontSize(8.5);
  pdfDoc.setTextColor(71, 85, 105);

  // Kiri: Mengetahui, Ketua Umum BADKO TKA-TPA Kota
  pdfDoc.text('Mengetahui,', colLeftX, signatureY, { align: 'center' });
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.setTextColor(15, 23, 42);
  pdfDoc.text('Ketua Umum BADKO TKA-TPA Kota', colLeftX, signatureY + 4.5, { align: 'center' });

  // Kanan: Tanggal & Ketua Panitia FASI XIII
  const dateStr = `Yogyakarta, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.setTextColor(71, 85, 105);
  pdfDoc.text(dateStr, colRightX, signatureY, { align: 'center' });
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.setTextColor(15, 23, 42);
  pdfDoc.text('Ketua Panitia FASI XIII', colRightX, signatureY + 4.5, { align: 'center' });

  // Nama Pejabat Bertandatangan
  const lineSignY = signatureY + 24;
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.setFontSize(9.5);
  pdfDoc.text('Dicky Artanto, S.Pd., M.Pd.', colLeftX, lineSignY, { align: 'center' });
  pdfDoc.text('Andry Sunny, S.E.', colRightX, lineSignY, { align: 'center' });

  // Garis bawah nama
  pdfDoc.setLineWidth(0.3);
  pdfDoc.setDrawColor(15, 23, 42);
  const leftTextWidth = pdfDoc.getTextWidth('Dicky Artanto, S.Pd., M.Pd.');
  const rightTextWidth = pdfDoc.getTextWidth('Andry Sunny, S.E.');
  pdfDoc.line(colLeftX - (leftTextWidth / 2), lineSignY + 0.8, colLeftX + (leftTextWidth / 2), lineSignY + 0.8);
  pdfDoc.line(colRightX - (rightTextWidth / 2), lineSignY + 0.8, colRightX + (rightTextWidth / 2), lineSignY + 0.8);

  return pdfDoc;
}

/**
 * Unduh 1 Cabang Lomba Aktif sebagai PDF Resmi
 */
export async function downloadSingleBranchPdf(
  category: CompetitionCategory,
  participants: Participant[],
  kemantrenList: Kemantren[]
): Promise<void> {
  const doc = await renderBranchToPdfPage({
    category,
    participants,
    kemantrenList,
    isFirstPage: true,
  });

  const safeCatName = category.name.replace(/[/\\?%*:|"<>]/g, '_');
  doc.save(`Rekapitulasi_Cabang_${category.code}_${safeCatName}.pdf`);
}

/**
 * Unduh SEMUA Cabang Lomba dalam 1 Dokumen PDF Lengkap (A4 Multi-page)
 */
export async function downloadAllBranchesPdf({
  categories,
  participants,
  kemantrenList,
  onProgress,
}: {
  categories: CompetitionCategory[];
  participants: Participant[];
  kemantrenList: Kemantren[];
  onProgress?: (current: number, total: number) => void;
}): Promise<void> {
  if (!categories.length) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const total = categories.length;
  for (let i = 0; i < total; i++) {
    if (onProgress) onProgress(i + 1, total);
    const cat = categories[i];
    await renderBranchToPdfPage({
      category: cat,
      participants,
      kemantrenList,
      doc,
      isFirstPage: i === 0,
    });
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`Rekapitulasi_Semua_Cabang_Lomba_FASI_XIII_${dateStr}.pdf`);
}
