/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Generator PDF Daftar Nomor Urut Tampil Peserta (A4 Portrait)
 * Format Bersih Tanpa Tanda Tangan Juri/Panitera — Siap Distribusi ke Ketua Rayon & Walisantri
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Participant, CompetitionCategory, Kemantren } from '../types/fasi';
import { fetchImageAsBase64 } from './idCardPngGenerator';

const LOGO_BADKO_URL = 'https://gigluvvkswjaiwxpnqet.supabase.co/storage/v1/object/public/public-assets/logobadko.png';
const LOGO_FASI_URL = 'https://gigluvvkswjaiwxpnqet.supabase.co/storage/v1/object/public/public-assets/logofasi.png';

interface ExportLotteryPdfOptions {
  category: CompetitionCategory;
  participants: Participant[];
  kemantrenList: Kemantren[];
  doc?: jsPDF;
  isFirstPage?: boolean;
}

/**
 * Format tanggal Indonesia lengkap: "28 September 2026"
 */
function getIndonesianDate(): string {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const now = new Date();
  const day = now.getDate();
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Render satu cabang lomba ke halaman dokumen jsPDF A4 Portrait untuk Nomor Undian
 */
export async function renderLotteryToPdfPage({
  category,
  participants,
  kemantrenList,
  doc,
  isFirstPage = true,
}: ExportLotteryPdfOptions): Promise<jsPDF> {
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
  const pageHeight = 297;
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
  pdfDoc.text('DAFTAR NOMOR URUT TAMPIL PESERTA', pageWidth / 2, titleY, { align: 'center' });

  pdfDoc.setFontSize(10);
  pdfDoc.setTextColor(4, 120, 87); // emerald-700
  pdfDoc.text(
    `CABANG: [${category.code}] ${category.name.toUpperCase()} — JENJANG ${category.level}`,
    pageWidth / 2,
    titleY + 5,
    { align: 'center' }
  );

  // Filter and sort participants for this category
  // Prioritas urut: Berdasarkan Nomor Undian (1, 2, 3...)
  // Santri yang belum diundi diletakkan di akhir berdasarkan No. Registrasi
  const inCat = participants
    .filter((p) => p.categoryId === category.id)
    .sort((a, b) => {
      const numA = a.lotteryNumber;
      const numB = b.lotteryNumber;
      if (numA && numB) return numA - numB;
      if (numA && !numB) return -1;
      if (!numA && numB) return 1;
      return a.registrationNumber.localeCompare(b.registrationNumber);
    });

  const getKemName = (id: string) => {
    const k = kemantrenList.find((item) => item.id === id);
    return k ? k.name : id;
  };

  const totalPeserta = inCat.length;
  const sudahDiundi = inCat.filter((p) => p.lotteryNumber && p.lotteryNumber > 0).length;

  // Metadata Sub-bar
  const subMetaY = titleY + 10;
  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.setFontSize(8);
  pdfDoc.setTextColor(71, 85, 105);
  pdfDoc.text(
    `Total Peserta: ${totalPeserta} | Sudah Diundi: ${sudahDiundi} Santri/Regu | Tanggal Cetak: ${getIndonesianDate()}`,
    marginX,
    subMetaY
  );

  // 3. TABEL DATA DAFTAR NOMOR TAMPIL
  // Kolom: No, No. Undian, No Registrasi, Nama Lengkap / Regu, L/P, Rayon (Kemantren), Asal Unit TPA
  const tableHeaders = [
    'No',
    'No. Undian',
    'No Registrasi',
    'Nama Lengkap Peserta / Regu',
    'L/P',
    'Rayon (Kemantren)',
    'Asal Unit TPA',
  ];

  const tableBody = inCat.length === 0
    ? [['-', '-', '-', 'Belum ada santri terdaftar pada cabang lomba ini.', '-', '-', '-']]
    : inCat.map((p, index) => {
        const kemName = getKemName(p.kemantrenId);
        const undianStr = p.lotteryNumber != null && p.lotteryNumber > 0
          ? String(p.lotteryNumber).padStart(2, '0')
          : 'Belum Diundi';

        return [
          String(index + 1),
          undianStr,
          p.registrationNumber || '-',
          p.fullName || '-',
          p.gender || '-',
          `Kem. ${kemName}`,
          p.tpaUnitName || '-',
        ];
      });

  const startTableY = subMetaY + 3;

  autoTable(pdfDoc, {
    startY: startTableY,
    head: [tableHeaders],
    body: tableBody,
    margin: { left: marginX, right: marginX, bottom: 42 },
    theme: 'grid',
    headStyles: {
      fillColor: [16, 185, 129], // emerald-500
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center',
      valign: 'middle',
      lineWidth: 0.2,
      lineColor: [5, 150, 105], // emerald-600
    },
    bodyStyles: {
      textColor: [15, 23, 42],
      fontSize: 8,
      lineWidth: 0.15,
      lineColor: [203, 213, 225], // slate-300
      valign: 'middle',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },                           // No
      1: { halign: 'center', cellWidth: 22, fontStyle: 'bold' },        // No. Undian
      2: { halign: 'center', cellWidth: 26, fontStyle: 'bold' },        // No Registrasi
      3: { halign: 'left', cellWidth: 54, fontStyle: 'bold' },          // Nama Lengkap
      4: { halign: 'center', cellWidth: 10 },                          // L/P
      5: { halign: 'left', cellWidth: 32 },                            // Rayon
      6: { halign: 'left', cellWidth: 34 },                            // Unit TPA
    },
    alternateRowStyles: {
      fillColor: [240, 253, 244], // emerald-50
    },
    didParseCell: (data) => {
      // Highlight cell No. Undian if already drawn
      if (data.section === 'body' && data.column.index === 1) {
        const val = String(data.cell.raw);
        if (val !== 'Belum Diundi' && val !== '-') {
          data.cell.styles.fillColor = [254, 243, 199]; // amber-100
          data.cell.styles.textColor = [120, 53, 15];   // amber-900
        } else {
          data.cell.styles.textColor = [148, 163, 184]; // slate-400
          data.cell.styles.fontStyle = 'normal';
        }
      }
    },
  });

  // 4. FOOTER: TATA TERTIB & PENGESAHAN PANITIA (TANPA TTD JURI/PANITERA)
  const lastTableY = (pdfDoc as any).lastAutoTable?.finalY || startTableY + 40;
  let footerY = lastTableY + 8;

  // Cek apakah muat di halaman yang sama (butuh sekitar 32mm)
  if (footerY + 32 > pageHeight) {
    pdfDoc.addPage('a4', 'portrait');
    footerY = 20;
  }

  // Kotak Catatan / Tata Tertib Peserta
  const noteBoxWidth = contentWidth * 0.62;
  const noteBoxX = marginX;
  
  pdfDoc.setFillColor(248, 250, 252); // slate-50
  pdfDoc.setDrawColor(226, 232, 240); // slate-200
  pdfDoc.roundedRect(noteBoxX, footerY, noteBoxWidth, 24, 2, 2, 'FD');

  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.setFontSize(7.5);
  pdfDoc.setTextColor(15, 23, 42);
  pdfDoc.text('Ketentuan & Tata Tertib Pemanggilan:', noteBoxX + 3, footerY + 4.5);

  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.setFontSize(7);
  pdfDoc.setTextColor(71, 85, 105);
  pdfDoc.text('1. Peserta wajib hadir di arena lomba 15 menit sebelum nomor urut dipanggil.', noteBoxX + 3, footerY + 9);
  pdfDoc.text('2. Pemanggilan peserta dilakukan maksimal 3 (tiga) kali berturut-turut oleh panitera.', noteBoxX + 3, footerY + 13.5);
  pdfDoc.text('3. Daftar nomor undian ini resmi diterbitkan oleh Panitia FASI XIII Kota Yogyakarta.', noteBoxX + 3, footerY + 18);

  // Pengesahan Panitia Pelaksana (Sisi Kanan)
  const authBoxX = marginX + noteBoxWidth + 5;
  const authWidth = contentWidth - noteBoxWidth - 5;
  const authCenterX = authBoxX + (authWidth / 2);

  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.setFontSize(7.5);
  pdfDoc.setTextColor(15, 23, 42);
  pdfDoc.text(`Yogyakarta, ${getIndonesianDate()}`, authCenterX, footerY + 4.5, { align: 'center' });

  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.setFontSize(8);
  pdfDoc.text('Panitia Pelaksana FASI XIII', authCenterX, footerY + 9, { align: 'center' });
  pdfDoc.text('BADKO TKA-TPA Kota Yogyakarta', authCenterX, footerY + 13, { align: 'center' });

  pdfDoc.setFont('helvetica', 'italic');
  pdfDoc.setFontSize(7);
  pdfDoc.setTextColor(4, 120, 87);
  pdfDoc.text('( Bidang Lomba & Kesekretariatan )', authCenterX, footerY + 22, { align: 'center' });

  return pdfDoc;
}

/**
 * Unduh 1 Cabang Lomba sebagai PDF Nomor Urut Tampil (A4 Portrait)
 */
export async function downloadSingleLotteryPdf(
  category: CompetitionCategory,
  participants: Participant[],
  kemantrenList: Kemantren[]
): Promise<void> {
  const doc = await renderLotteryToPdfPage({
    category,
    participants,
    kemantrenList,
    isFirstPage: true,
  });

  const safeCatName = category.name.replace(/[/\\?%*:|"<>]/g, '_');
  doc.save(`Nomor_Urut_Tampil_${category.code}_${safeCatName}.pdf`);
}

/**
 * Unduh SEMUA Cabang Lomba dalam 1 Dokumen PDF Gabungan (A4 Multi-page)
 */
export async function downloadAllLotteryPdf({
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
    await renderLotteryToPdfPage({
      category: cat,
      participants,
      kemantrenList,
      doc,
      isFirstPage: i === 0,
    });
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`Daftar_Nomor_Urut_Tampil_Semua_Cabang_FASI_XIII_${dateStr}.pdf`);
}
