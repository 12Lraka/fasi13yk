/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Generator PDF Rekapitulasi Nominasi Tetap Peserta Lomba A4 Portrait Rapi
 * Mendukung Ekspor Satuan (Filter/Kemantren Terpilih) atau Batch Semua 14 Kemantren
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Participant, CompetitionCategory, Kemantren } from '../types/fasi';
import { fetchImageAsBase64 } from './idCardPngGenerator';

const LOGO_BADKO_URL = 'https://gigluvvkswjaiwxpnqet.supabase.co/storage/v1/object/public/public-assets/logobadko.png';
const LOGO_FASI_URL = 'https://gigluvvkswjaiwxpnqet.supabase.co/storage/v1/object/public/public-assets/logofasi.png';

interface ExportRecapPdfOptions {
  titleSubtitle: {
    mainTitle?: string;
    subTitle?: string;
    filterInfo?: string;
  };
  participants: Participant[];
  categoriesList: CompetitionCategory[];
  kemantrenList: Kemantren[];
  doc?: jsPDF;
  isFirstPage?: boolean;
}

/**
 * Render satu lembar / kontingen rekapitulasi ke dokumen jsPDF A4 Portrait
 */
export async function renderRecapToPdfPage({
  titleSubtitle,
  participants,
  categoriesList,
  kemantrenList,
  doc,
  isFirstPage = true,
}: ExportRecapPdfOptions): Promise<jsPDF> {
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

  // 1. KOP SURAT RESMI FASI XIII
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

  // Garis Kop Surat Ganda
  const lineY = topY + 18;
  pdfDoc.setDrawColor(15, 23, 42);
  pdfDoc.setLineWidth(0.8);
  pdfDoc.line(marginX, lineY, pageWidth - marginX, lineY);
  pdfDoc.setLineWidth(0.2);
  pdfDoc.line(marginX, lineY + 0.8, pageWidth - marginX, lineY + 0.8);

  // 2. JUDUL DOKUMEN & KETERANGAN KONTINGEN
  const titleY = lineY + 7;
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.setFontSize(11);
  pdfDoc.setTextColor(15, 23, 42);
  pdfDoc.text(titleSubtitle.mainTitle || 'REKAPITULASI NOMINASI TETAP PESERTA LOMBA', pageWidth / 2, titleY, { align: 'center' });

  pdfDoc.setFontSize(10);
  pdfDoc.setTextColor(4, 120, 87); // emerald-700
  pdfDoc.text(
    titleSubtitle.subTitle || 'SEMUA KONTINGEN 14 KEMANTREN KOTA YOGYAKARTA',
    pageWidth / 2,
    titleY + 5,
    { align: 'center' }
  );

  if (titleSubtitle.filterInfo) {
    pdfDoc.setFont('helvetica', 'normal');
    pdfDoc.setFontSize(7.5);
    pdfDoc.setTextColor(100, 116, 139); // slate-500
    pdfDoc.text(titleSubtitle.filterInfo, pageWidth / 2, titleY + 9, { align: 'center' });
  }

  const getKemName = (id: string) => {
    const k = kemantrenList.find((item) => item.id === id);
    return k ? k.name : id;
  };

  const getCategory = (id: string) => {
    return categoriesList.find((c) => c.id === id);
  };

  // 3. TABEL DATA
  // Kolom: No, No. Registrasi, Nama Lengkap Santri, L/P, Tgl Lahir / Usia, Rayon & Unit TPA, Cabang Lomba, No. Undian
  const tableHeaders = [
    'No',
    'No. Registrasi',
    'Nama Lengkap Santri',
    'L/P',
    'Tgl Lahir / Usia',
    'Rayon & Unit TPA',
    'Cabang Lomba',
    'No. Undian',
  ];

  const tableBody = participants.length === 0
    ? [['-', '-', 'Tidak ada santri yang memenuhi kriteria rekapitulasi.', '-', '-', '-', '-', '-']]
    : participants.map((p, index) => {
        const kemName = getKemName(p.kemantrenId);
        const cat = getCategory(p.categoryId);
        const rayonAndTpa = p.tpaUnitName
          ? `Kem. ${kemName}\n${p.tpaUnitName}`
          : `Kem. ${kemName}`;

        const birthAndAge = p.birthDate
          ? `${p.birthDate}\n(${p.ageOnCutoff.years}th ${p.ageOnCutoff.months}bln)`
          : '-';

        const branchName = cat
          ? `[${cat.level}] ${cat.name}${cat.isGroup ? ' (Grup)' : ''}`
          : p.categoryId;

        return [
          String(index + 1),
          p.registrationNumber || '-',
          p.fullName || '-',
          p.gender || '-',
          birthAndAge,
          rayonAndTpa,
          branchName,
          p.lotteryNumber ? String(p.lotteryNumber).padStart(2, '0') : '-',
        ];
      });

  const startTableY = titleSubtitle.filterInfo ? titleY + 12 : titleY + 8;

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
      1: { halign: 'center', cellWidth: 26, fontStyle: 'bold' }, // No Registrasi
      2: { halign: 'left', cellWidth: 44, fontStyle: 'bold' },   // Nama Lengkap
      3: { halign: 'center', cellWidth: 10 }, // L/P
      4: { halign: 'center', cellWidth: 26 }, // Tgl Lahir / Usia
      5: { halign: 'left', cellWidth: 36 },   // Rayon & Unit TPA
      6: { halign: 'left', cellWidth: 24 },   // Cabang Lomba
      7: { halign: 'center', cellWidth: 12, fontStyle: 'bold' }, // No Undian
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
 * Unduh Rekapitulasi Data Peserta Aktif (Single Filter / Kemantren) sebagai PDF A4 Resmi
 */
export async function downloadSingleRecapPdf({
  titleSubtitle,
  participants,
  categoriesList,
  kemantrenList,
  fileName = 'Rekapitulasi_Peserta_FASI_XIII',
}: {
  titleSubtitle: {
    mainTitle?: string;
    subTitle?: string;
    filterInfo?: string;
  };
  participants: Participant[];
  categoriesList: CompetitionCategory[];
  kemantrenList: Kemantren[];
  fileName?: string;
}): Promise<void> {
  const doc = await renderRecapToPdfPage({
    titleSubtitle,
    participants,
    categoriesList,
    kemantrenList,
    isFirstPage: true,
  });

  const dateIso = new Date().toISOString().slice(0, 10);
  const safeName = fileName.replace(/[/\\?%*:|"<>]/g, '_');
  doc.save(`${safeName}_${dateIso}.pdf`);
}

/**
 * Unduh Semua 14 Kemantren dalam 1 Dokumen PDF Lengkap (A4 Multi-page)
 */
export async function downloadAllKemantrenRecapPdf({
  kemantrenList,
  participants,
  categoriesList,
  onProgress,
}: {
  kemantrenList: Kemantren[];
  participants: Participant[];
  categoriesList: CompetitionCategory[];
  onProgress?: (current: number, total: number) => void;
}): Promise<void> {
  if (!kemantrenList.length) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const total = kemantrenList.length;
  for (let i = 0; i < total; i++) {
    if (onProgress) onProgress(i + 1, total);
    const kem = kemantrenList[i];
    const kemParticipants = participants.filter((p) => p.kemantrenId === kem.id);

    await renderRecapToPdfPage({
      titleSubtitle: {
        mainTitle: 'REKAPITULASI NOMINASI TETAP PESERTA LOMBA',
        subTitle: `KONTINGEN KEMANTREN ${kem.name.toUpperCase()} (${kemParticipants.length} SANTRI)`,
        filterInfo: `Kontingen Resmi FASI XIII — Kemantren ${kem.name}`,
      },
      participants: kemParticipants,
      categoriesList,
      kemantrenList,
      doc,
      isFirstPage: i === 0,
    });
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`Rekapitulasi_Semua_Kemantren_FASI_XIII_${dateStr}.pdf`);
}
