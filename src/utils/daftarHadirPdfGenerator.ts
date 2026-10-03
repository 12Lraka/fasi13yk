/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Generator PDF Lembar Presensi / Daftar Hadir Resmi (Dewan Hakim, Panitera, & Panitia)
 * Standar A4 Portrait dengan KOP Resmi BADKO Kota Yogyakarta & Format Paraf Selang-Seling
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { IdCardCommitteeData } from '../types/fasi';
import { fetchImageAsBase64 } from './idCardPngGenerator';

const LOGO_BADKO_URL = 'https://gigluvvkswjaiwxpnqet.supabase.co/storage/v1/object/public/public-assets/logobadko.png';
const LOGO_FASI_URL = 'https://gigluvvkswjaiwxpnqet.supabase.co/storage/v1/object/public/public-assets/logofasi.png';

export interface ExportDaftarHadirPdfOptions {
  categoryType: 'dewan_hakim' | 'panitera' | 'panitia' | 'all';
  committees: IdCardCommitteeData[];
  eventName?: string;
  eventDate?: string;
  venueName?: string;
  customTitle?: string;
  ketuaPanitiaName?: string;
  koordinatorHakimName?: string;
  koordinatorLombaName?: string;
  sekretarisName?: string;
}

/**
 * Format tanggal Indonesia hari ini / default
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
 * Mendapatkan label judul formal berdasarkan cardCategory
 */
function getCategoryMeta(categoryType: string) {
  switch (categoryType) {
    case 'dewan_hakim':
      return {
        title: 'DAFTAR HADIR DEWAN HAKIM / JURI',
        sub: 'FESTIVAL ANAK SHOLEH INDONESIA (FASI) XIII TAHUN 2026',
        roleLabel: 'Penugasan Cabang / Bidang',
        color: [136, 19, 55], // rose-900
        signatoryRightRole: 'Koordinator Dewan Hakim / Juri',
        signatoryRightDefault: 'Imam Muhtarom, S.S',
      };
    case 'panitera':
      return {
        title: 'DAFTAR HADIR PANITERA',
        sub: 'FESTIVAL ANAK SHOLEH INDONESIA (FASI) XIII TAHUN 2026',
        roleLabel: 'Arena Lomba / Meja Sidang',
        color: [15, 118, 110], // teal-700
        signatoryRightRole: 'Koordinator Lomba',
        signatoryRightDefault: 'Ali Hafidh, S.Pd.I., M.Pd.',
      };
    case 'panitia':
      return {
        title: 'DAFTAR HADIR PANITIA PELAKSANA',
        sub: 'FESTIVAL ANAK SHOLEH INDONESIA (FASI) XIII TAHUN 2026',
        roleLabel: 'Divisi / Seksi Kepanitiaan',
        color: [6, 78, 59], // emerald-900
        signatoryRightRole: 'Sekretaris',
        signatoryRightDefault: 'Viko Saputra',
      };
    default:
      return {
        title: 'DAFTAR HADIR PERANGKAT RESMI FASI XIII',
        sub: 'FESTIVAL ANAK SHOLEH INDONESIA (FASI) XIII TAHUN 2026',
        roleLabel: 'Jabatan / Penugasan',
        color: [15, 23, 42], // slate-900
        signatoryRightRole: 'Sekretaris',
        signatoryRightDefault: 'Viko Saputra',
      };
  }
}

/**
 * Render satu kategori lembar daftar hadir ke dalam jsPDF
 */
async function renderSingleCategorySheet(
  pdfDoc: jsPDF,
  categoryType: 'dewan_hakim' | 'panitera' | 'panitia',
  items: IdCardCommitteeData[],
  options: ExportDaftarHadirPdfOptions,
  isFirstPage: boolean
) {
  if (!isFirstPage) {
    pdfDoc.addPage('a4', 'portrait');
  }

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 12;
  const meta = getCategoryMeta(categoryType);

  // Load logo
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
  pdfDoc.setTextColor(15, 23, 42);
  pdfDoc.text('PANITIA PELAKSANA FESTIVAL ANAK SHOLEH INDONESIA XIII', pageWidth / 2, topY + 4, { align: 'center' });

  pdfDoc.setFontSize(12);
  pdfDoc.setTextColor(6, 78, 59); // emerald-900
  pdfDoc.text('BADKO TKA-TPA KOTA YOGYAKARTA', pageWidth / 2, topY + 9, { align: 'center' });

  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.setFontSize(7.5);
  pdfDoc.setTextColor(71, 85, 105);
  pdfDoc.text(
    'Sekretariat : Jln. Kenari No. 56 Muja Muju, Umbulharjo, Kota Yogyakarta | Telp. 085179928551 / 085647392525',
    pageWidth / 2,
    topY + 14,
    { align: 'center' }
  );

  // Garis Kop Ganda
  const lineY = topY + 17.5;
  pdfDoc.setDrawColor(15, 23, 42);
  pdfDoc.setLineWidth(0.8);
  pdfDoc.line(marginX, lineY, pageWidth - marginX, lineY);
  pdfDoc.setLineWidth(0.2);
  pdfDoc.line(marginX, lineY + 0.8, pageWidth - marginX, lineY + 0.8);

  // 2. JUDUL LEMBAR PRESENSI
  const titleY = lineY + 7;
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.setFontSize(11.5);
  pdfDoc.setTextColor(meta.color[0], meta.color[1], meta.color[2]);
  pdfDoc.text(options.customTitle || meta.title, pageWidth / 2, titleY, { align: 'center' });

  pdfDoc.setFontSize(9.5);
  pdfDoc.setTextColor(51, 65, 85);
  pdfDoc.text(meta.sub, pageWidth / 2, titleY + 4.5, { align: 'center' });

  // 3. META INFORMASI ACARA (Hari/Tanggal, Tempat, Total Personel)
  const metaBoxY = titleY + 7.5;
  pdfDoc.setFillColor(248, 250, 252); // slate-50
  pdfDoc.setDrawColor(226, 232, 240); // slate-200
  pdfDoc.setLineWidth(0.3);
  pdfDoc.roundedRect(marginX, metaBoxY, pageWidth - (marginX * 2), 11, 2, 2, 'FD');

  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.setFontSize(8);
  pdfDoc.setTextColor(30, 41, 59);

  const eventDateText = options.eventDate || 'Minggu, 28 Maret 2026';
  const venueText = options.venueName || 'SMP N 1 Yogyakarta';

  pdfDoc.text('Hari / Tanggal :', marginX + 3, metaBoxY + 4.2);
  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.text(eventDateText, marginX + 27, metaBoxY + 4.2);

  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.text('Tempat / Lokasi :', marginX + 3, metaBoxY + 8.5);
  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.text(venueText, marginX + 27, metaBoxY + 8.5);

  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.text('Total Personel :', pageWidth - marginX - 45, metaBoxY + 4.2);
  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.text(`${items.length} Orang`, pageWidth - marginX - 22, metaBoxY + 4.2);

  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.text('Status Presensi :', pageWidth - marginX - 45, metaBoxY + 8.5);
  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.setTextColor(4, 120, 87);
  pdfDoc.text('Verifikasi Meja', pageWidth - marginX - 22, metaBoxY + 8.5);

  // 4. TABEL PRESENSI (FORMAT PARAF SELANG-SELING INDONESIA)
  const tableHeaders = [
    'No',
    'Nama Lengkap & Gelar',
    meta.roleLabel,
    'Hak Akses Ruang',
    'Tanda Tangan / Paraf',
  ];

  const tableBody = items.length === 0
    ? [[
        '-',
        'Belum ada data personel terdaftar pada kategori ini.',
        '-',
        '-',
        '-',
      ]]
    : items.map((item, index) => {
        const no = index + 1;
        // Format paraf ganjil di kiri, genap di kanan
        const isOdd = no % 2 !== 0;
        const signatureText = isOdd
          ? `${no}. ..........................`
          : `            ${no}. ..........................`;

        return [
          String(no),
          item.name || '(Nama belum diisi)',
          item.division || '-',
          item.accessLevel || 'ALL ACCESS',
          signatureText,
        ];
      });

  const startTableY = metaBoxY + 13.5;

  autoTable(pdfDoc, {
    startY: startTableY,
    head: [tableHeaders],
    body: tableBody,
    margin: { left: marginX, right: marginX, bottom: 42 },
    theme: 'grid',
    headStyles: {
      fillColor: [241, 245, 249], // slate-100
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center',
      valign: 'middle',
      lineWidth: 0.2,
      lineColor: [148, 163, 184],
    },
    bodyStyles: {
      textColor: [15, 23, 42],
      fontSize: 8,
      lineWidth: 0.15,
      lineColor: [203, 213, 225],
      valign: 'middle',
      minCellHeight: 8.5, // Ruang cukup tinggi untuk kenyamanan tanda tangan fisik
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 9 }, // No
      1: { halign: 'left', cellWidth: 58, fontStyle: 'bold' }, // Nama Lengkap
      2: { halign: 'left', cellWidth: 54 }, // Jabatan / Penugasan
      3: { halign: 'center', cellWidth: 27, fontSize: 7.5 }, // Hak Akses
      4: { halign: 'left', cellWidth: 38, fontStyle: 'normal' }, // Tanda Tangan
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255],
    },
  });

  // 5. BLOK TANDA TANGAN PENGESAHAN
  const lastTableY = (pdfDoc as any).lastAutoTable?.finalY || startTableY + 40;
  let signatureY = lastTableY + 6;

  // Cek apakah halaman cukup menampung blok tanda tangan (butuh ~34mm)
  if (signatureY + 34 > pageHeight) {
    pdfDoc.addPage('a4', 'portrait');
    signatureY = 20;
  }

  const signColWidth = 70;
  const leftSignX = marginX + 5;
  const rightSignX = pageWidth - marginX - signColWidth - 5;

  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.setFontSize(8);
  pdfDoc.setTextColor(71, 85, 105);

  // Kiri: Mengetahui Ketua Panitia
  pdfDoc.text('Mengetahui,', leftSignX, signatureY);
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.text('Ketua Panitia FASI XIII Kota', leftSignX, signatureY + 4);

  // Kanan: Titimangsa Yogyakarta & Penanggung Jawab Kategori
  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.text(`Yogyakarta, ${options.eventDate ? options.eventDate.split(',')[1]?.trim() || getIndonesianDate() : getIndonesianDate()}`, rightSignX, signatureY);
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.text(meta.signatoryRightRole, rightSignX, signatureY + 4);

  // Ruang Tanda Tangan
  const nameY = signatureY + 22;

  // Nama Pengesah Kiri
  const ketuaName = options.ketuaPanitiaName || 'Andry Sunny, S.E';
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.setFontSize(8.5);
  pdfDoc.setTextColor(15, 23, 42);
  pdfDoc.text(ketuaName, leftSignX, nameY);
  pdfDoc.setLineWidth(0.2);
  pdfDoc.line(leftSignX, nameY + 0.8, leftSignX + signColWidth, nameY + 0.8);

  // Nama Pengesah Kanan
  const rightSignName = categoryType === 'dewan_hakim'
    ? (options.koordinatorHakimName || meta.signatoryRightDefault)
    : categoryType === 'panitera'
    ? (options.koordinatorLombaName || meta.signatoryRightDefault)
    : (options.sekretarisName || meta.signatoryRightDefault);

  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.setFontSize(8.5);
  pdfDoc.setTextColor(15, 23, 42);
  pdfDoc.text(rightSignName, rightSignX, nameY);
  pdfDoc.setLineWidth(0.2);
  pdfDoc.line(rightSignX, nameY + 0.8, rightSignX + signColWidth, nameY + 0.8);
}

/**
 * Generate Dokumen PDF Daftar Hadir
 * Mendukung filter dewan_hakim, panitera, panitia, atau bundle gabungan
 */
export async function generateDaftarHadirPdf(options: ExportDaftarHadirPdfOptions): Promise<Blob> {
  const pdfDoc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const { categoryType, committees } = options;

  if (categoryType === 'all') {
    // Render 3 lembar terpisah: Dewan Hakim, Panitera, Panitia
    const hakimList = committees.filter((c) => c.cardCategory === 'dewan_hakim');
    const paniteraList = committees.filter((c) => c.cardCategory === 'panitera');
    const panitiaList = committees.filter((c) => !c.cardCategory || c.cardCategory === 'panitia');

    await renderSingleCategorySheet(pdfDoc, 'dewan_hakim', hakimList, options, true);
    await renderSingleCategorySheet(pdfDoc, 'panitera', paniteraList, options, false);
    await renderSingleCategorySheet(pdfDoc, 'panitia', panitiaList, options, false);
  } else {
    const filtered = committees.filter((c) => {
      if (categoryType === 'panitia') {
        return !c.cardCategory || c.cardCategory === 'panitia';
      }
      return c.cardCategory === categoryType;
    });

    await renderSingleCategorySheet(pdfDoc, categoryType, filtered, options, true);
  }

  // Tambahkan nomor halaman di footer setiap lembar
  const totalPages = pdfDoc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdfDoc.setPage(i);
    pdfDoc.setFont('helvetica', 'normal');
    pdfDoc.setFontSize(7);
    pdfDoc.setTextColor(148, 163, 184); // slate-400
    pdfDoc.text(
      `Daftar Hadir Resmi FASI XIII Kota Yogyakarta — Halaman ${i} dari ${totalPages}`,
      105,
      292,
      { align: 'center' }
    );
  }

  return pdfDoc.output('blob');
}

/**
 * Download langsung PDF Daftar Hadir ke komputer pengguna
 */
export async function downloadDaftarHadirPdf(
  options: ExportDaftarHadirPdfOptions,
  filename?: string
): Promise<void> {
  const blob = await generateDaftarHadirPdf(options);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  
  let defaultFilename = 'Daftar_Hadir_FASI_XIII.pdf';
  if (options.categoryType === 'dewan_hakim') {
    defaultFilename = 'Daftar_Hadir_Dewan_Hakim_FASI_XIII.pdf';
  } else if (options.categoryType === 'panitera') {
    defaultFilename = 'Daftar_Hadir_Panitera_FASI_XIII.pdf';
  } else if (options.categoryType === 'panitia') {
    defaultFilename = 'Daftar_Hadir_Panitia_FASI_XIII.pdf';
  } else {
    defaultFilename = 'Daftar_Hadir_Lengkap_Panitia_Hakim_Panitera_FASI_XIII.pdf';
  }

  a.download = filename || defaultFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
