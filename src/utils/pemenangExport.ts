/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Generator Ekspor Excel (.xlsx) & PDF untuk Hasil Pemenang / Rekapitulasi Kejuaraan
 */

import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BeritaAcaraKejuaraan, CompetitionCategory, WinnerSlot } from '../types/fasi';
import { fetchImageAsBase64 } from './idCardPngGenerator';

const LOGO_BADKO_URL = 'https://gigluvvkswjaiwxpnqet.supabase.co/storage/v1/object/public/public-assets/logobadko.png';
const LOGO_FASI_URL = 'https://gigluvvkswjaiwxpnqet.supabase.co/storage/v1/object/public/public-assets/logofasi.png';

export interface WinnerRow {
  no: number;
  cabangKode: string;
  cabangNama: string;
  jenjang: string;
  kategoriGender: string;
  isCabangUtama: boolean;
  peringkat: string; // Juara I, II, III, Harapan I, Harapan II
  namaPemenang: string;
  rayon: string;
  unitTpa: string;
  totalNilai: number | string;
  statusPengesahan: string;
  tanggalPenetapan: string;
}

/**
 * Ekstraksi baris datar pemenang dari daftar Berita Acara
 */
export function extractWinnerRows(
  categories: CompetitionCategory[],
  beritaAcaraMap: Map<string, BeritaAcaraKejuaraan>,
  onlyDisahkan: boolean = false
): WinnerRow[] {
  const rows: WinnerRow[] = [];
  let no = 1;

  categories.forEach((cat) => {
    const ba = beritaAcaraMap.get(cat.id);
    if (onlyDisahkan && ba?.status !== 'Disahkan') return;

    const isUtama = ba?.isCabangUtama ?? (
      (cat.level === 'TKA' && cat.name.toLowerCase().includes('tartil')) ||
      (cat.level === 'TPA' && cat.name.toLowerCase().includes('tartil')) ||
      (cat.level === 'TQA' && (cat.name.toLowerCase().includes('tilawah') || cat.name.toLowerCase().includes('tilawati')))
    );

    const genderText = cat.genderRequirement === 'L'
      ? 'Putra'
      : cat.genderRequirement === 'P'
      ? 'Putri'
      : 'Campuran/Beregu';

    const statusText = ba?.status === 'Disahkan' ? 'Resmi Disahkan' : 'Menunggu Juri / Draft';
    const tgl = ba?.tanggalPenetapan || '-';

    const checkAndAdd = (peringkat: string, slot?: WinnerSlot) => {
      if (slot && (slot.nama?.trim() || slot.totalNilai > 0)) {
        rows.push({
          no: no++,
          cabangKode: cat.code,
          cabangNama: cat.name,
          jenjang: cat.level,
          kategoriGender: genderText,
          isCabangUtama: isUtama,
          peringkat,
          namaPemenang: slot.nama || '-',
          rayon: slot.kemantren ? `Kem. ${slot.kemantren}` : '-',
          unitTpa: slot.unitTpa || '-',
          totalNilai: slot.totalNilai || 0,
          statusPengesahan: statusText,
          tanggalPenetapan: tgl,
        });
      }
    };

    if (ba?.pemenang) {
      checkAndAdd('Juara I', ba.pemenang.juara1);
      checkAndAdd('Juara II', ba.pemenang.juara2);
      checkAndAdd('Juara III', ba.pemenang.juara3);
      checkAndAdd('Harapan I', ba.pemenang.harapan1);
      checkAndAdd('Harapan II', ba.pemenang.harapan2);
    }
  });

  return rows;
}

/**
 * Ekspor Hasil Pemenang ke File Microsoft Excel Asli (.xlsx)
 */
export function exportPemenangToExcel(
  categories: CompetitionCategory[],
  beritaAcaraMap: Map<string, BeritaAcaraKejuaraan>,
  fileNamePrefix: string = 'Hasil_Pemenang_FASI_XIII_Kota_Yogyakarta'
) {
  const winnerRows = extractWinnerRows(categories, beritaAcaraMap, false);

  const titleRows = [
    ['FESTIVAL ANAK SHOLEH INDONESIA (FASI) XIII KOTA YOGYAKARTA'],
    ['BADKO TKA-TPA KOTA YOGYAKARTA'],
    ['Sekretariat : Jln. Kenari No. 56 Muja Muju, Umbulharjo, Kota Yogyakarta | Telp. 085179928551'],
    [],
    ['DAFTAR RESMI PEMENANG KEJUARAAN PER CABANG LOMBA'],
    [
      `Waktu Unduh: ${new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })} | Total Data Pemenang: ${winnerRows.length} Peringkat`,
    ],
    [],
  ];

  const headers = [
    'No',
    'Kode Cabang',
    'Cabang Lomba',
    'Jenjang',
    'Kategori',
    'Peringkat / Juara',
    'Nama Lengkap Pemenang',
    'Wilayah Rayon / Kontingen',
    'Asal Unit TKA / TPA',
    'Total Skor / Nilai',
    'Status Pengesahan',
    'Tanggal Penetapan',
    'Keterangan Bobot',
  ];

  const dataRows = winnerRows.map((r) => [
    r.no,
    r.cabangKode,
    r.cabangNama,
    r.jenjang,
    r.kategoriGender,
    r.peringkat,
    r.namaPemenang,
    r.rayon,
    r.unitTpa,
    r.totalNilai,
    r.statusPengesahan,
    r.tanggalPenetapan,
    r.isCabangUtama ? 'Cabang Utama (7-5-3)' : 'Cabang Reguler (5-3-1)',
  ]);

  const wsData = [...titleRows, headers, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Lebar Kolom
  ws['!cols'] = [
    { wch: 6 },  // No
    { wch: 12 }, // Kode Cabang
    { wch: 32 }, // Cabang Lomba
    { wch: 10 }, // Jenjang
    { wch: 15 }, // Kategori
    { wch: 18 }, // Peringkat
    { wch: 32 }, // Nama Pemenang
    { wch: 22 }, // Rayon
    { wch: 28 }, // Unit TPA
    { wch: 14 }, // Total Nilai
    { wch: 18 }, // Status
    { wch: 18 }, // Tanggal
    { wch: 22 }, // Bobot
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Hasil Pemenang FASI XIII');

  const dateStr = new Date().toISOString().slice(0, 10);
  const fullFileName = `${fileNamePrefix}_${dateStr}.xlsx`;

  XLSX.writeFile(wb, fullFileName);
}

/**
 * Ekspor Hasil Pemenang ke Dokumen PDF Resmi (Format A4 Landscape Rapi dengan Kop Surat)
 */
export async function exportPemenangToPdf(
  categories: CompetitionCategory[],
  beritaAcaraMap: Map<string, BeritaAcaraKejuaraan>,
  fileNamePrefix: string = 'Hasil_Pemenang_FASI_XIII_Kota_Yogyakarta',
  onlyDisahkan: boolean = false
) {
  const winnerRows = extractWinnerRows(categories, beritaAcaraMap, onlyDisahkan);

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const marginX = 14;

  // Load logo images as Base64
  let logoBadkoBase64 = '';
  let logoFasiBase64 = '';
  try {
    logoBadkoBase64 = await fetchImageAsBase64(LOGO_BADKO_URL);
    logoFasiBase64 = await fetchImageAsBase64(LOGO_FASI_URL);
  } catch {
    // ignore
  }

  // 1. KOP SURAT
  const topY = 10;
  const logoSize = 16;

  if (logoBadkoBase64 && logoBadkoBase64.startsWith('data:')) {
    try {
      doc.addImage(logoBadkoBase64, 'PNG', marginX + 2, topY, logoSize, logoSize);
    } catch {}
  }

  if (logoFasiBase64 && logoFasiBase64.startsWith('data:')) {
    try {
      doc.addImage(logoFasiBase64, 'PNG', pageWidth - marginX - logoSize - 2, topY, logoSize, logoSize);
    } catch {}
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('FESTIVAL ANAK SHOLEH INDONESIA (FASI) XIII', pageWidth / 2, topY + 4, { align: 'center' });

  doc.setFontSize(13);
  doc.setTextColor(6, 78, 59); // emerald-900
  doc.text('BADKO TKA-TPA KOTA YOGYAKARTA', pageWidth / 2, topY + 9, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'Sekretariat : Jln. Kenari No. 56 Muja Muju, Umbulharjo, Kota Yogyakarta | Telp. 085179928551 / 085647392525',
    pageWidth / 2,
    topY + 14,
    { align: 'center' }
  );

  // Garis Kop Surat
  const lineY = topY + 17;
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.8);
  doc.line(marginX, lineY, pageWidth - marginX, lineY);
  doc.setLineWidth(0.2);
  doc.line(marginX, lineY + 0.8, pageWidth - marginX, lineY + 0.8);

  // 2. JUDUL DOKUMEN
  const titleY = lineY + 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('DAFTAR RESMI REKAPITULASI PEMENANG KEJUARAAN', pageWidth / 2, titleY, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Dokumen Sah Penetapan Dewan Juri • Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })}`,
    pageWidth / 2,
    titleY + 4.5,
    { align: 'center' }
  );

  // 3. TABEL DATA
  const tableHeaders = [
    'No',
    'Kode',
    'Cabang Lomba',
    'Jenjang',
    'Peringkat',
    'Nama Pemenang',
    'Rayon / Kemantren',
    'Unit TKA/TPA',
    'Nilai',
    'Status',
  ];

  const tableBody = winnerRows.length === 0
    ? [['-', '-', 'Belum ada data pemenang yang disahkan.', '-', '-', '-', '-', '-', '-', '-']]
    : winnerRows.map((r) => [
        r.no,
        r.cabangKode,
        r.cabangNama,
        r.jenjang,
        r.peringkat,
        r.namaPemenang,
        r.rayon,
        r.unitTpa,
        r.totalNilai,
        r.statusPengesahan,
      ]);

  autoTable(doc, {
    head: [tableHeaders],
    body: tableBody,
    startY: titleY + 8,
    margin: { left: marginX, right: marginX, bottom: 18 },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
      textColor: [15, 23, 42],
    },
    headStyles: {
      fillColor: [6, 78, 59], // emerald-900
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 14 },
      2: { cellWidth: 48 },
      3: { halign: 'center', cellWidth: 16 },
      4: { halign: 'center', cellWidth: 22, fontStyle: 'bold' },
      5: { cellWidth: 50, fontStyle: 'bold' },
      6: { cellWidth: 32 },
      7: { cellWidth: 42 },
      8: { halign: 'center', cellWidth: 16, fontStyle: 'bold' },
      9: { halign: 'center', cellWidth: 19 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didDrawPage: (data) => {
      // Footer Halaman
      const pageCount = (doc as any).internal.getNumberOfPages();
      const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `FASI XIII Kota Yogyakarta — Hasil Pemenang Resmi • Halaman ${currentPage} dari ${pageCount}`,
        pageWidth / 2,
        pageHeight - 6,
        { align: 'center' }
      );
    },
  });

  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`${fileNamePrefix}_${dateStr}.pdf`);
}

/**
 * Ekspor 1 Cabang Lomba Spesifik ke PDF Lembar Keputusan Resmi A4 Portrait
 */
export async function exportSingleCabangPdf(
  category: CompetitionCategory,
  beritaAcara?: BeritaAcaraKejuaraan
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = 210;
  const marginX = 14;

  let logoBadkoBase64 = '';
  let logoFasiBase64 = '';
  try {
    logoBadkoBase64 = await fetchImageAsBase64(LOGO_BADKO_URL);
    logoFasiBase64 = await fetchImageAsBase64(LOGO_FASI_URL);
  } catch {}

  const topY = 12;
  const logoSize = 16;

  if (logoBadkoBase64 && logoBadkoBase64.startsWith('data:')) {
    try {
      doc.addImage(logoBadkoBase64, 'PNG', marginX + 2, topY, logoSize, logoSize);
    } catch {}
  }

  if (logoFasiBase64 && logoFasiBase64.startsWith('data:')) {
    try {
      doc.addImage(logoFasiBase64, 'PNG', pageWidth - marginX - logoSize - 2, topY, logoSize, logoSize);
    } catch {}
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('FESTIVAL ANAK SHOLEH INDONESIA (FASI) XIII', pageWidth / 2, topY + 4, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(6, 78, 59);
  doc.text('BADKO TKA-TPA KOTA YOGYAKARTA', pageWidth / 2, topY + 9, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'Sekretariat : Jln. Kenari No. 56 Muja Muju, Umbulharjo, Kota Yogyakarta | Telp. 085179928551',
    pageWidth / 2,
    topY + 14,
    { align: 'center' }
  );

  const lineY = topY + 17;
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.8);
  doc.line(marginX, lineY, pageWidth - marginX, lineY);
  doc.setLineWidth(0.2);
  doc.line(marginX, lineY + 0.8, pageWidth - marginX, lineY + 0.8);

  const titleY = lineY + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('BERITA ACARA PENETAPAN HASIL KEJUARAAN', pageWidth / 2, titleY, { align: 'center' });

  doc.setFontSize(9.5);
  doc.setTextColor(4, 120, 87);
  doc.text(`CABANG: [${category.code}] ${category.name.toUpperCase()}`, pageWidth / 2, titleY + 5, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Tingkat: ${category.level} | Tanggal Penetapan: ${beritaAcara?.tanggalPenetapan || '-'} | Status: ${
      beritaAcara?.status === 'Disahkan' ? 'RESMI DISAHKAN' : 'DRAFT'
    }`,
    pageWidth / 2,
    titleY + 10,
    { align: 'center' }
  );

  const p = beritaAcara?.pemenang;
  const tableData = [
    ['Juara I', p?.juara1?.nama || '-', p?.juara1?.kemantren ? `Kem. ${p?.juara1?.kemantren}` : '-', p?.juara1?.unitTpa || '-', p?.juara1?.totalNilai || '-'],
    ['Juara II', p?.juara2?.nama || '-', p?.juara2?.kemantren ? `Kem. ${p?.juara2?.kemantren}` : '-', p?.juara2?.unitTpa || '-', p?.juara2?.totalNilai || '-'],
    ['Juara III', p?.juara3?.nama || '-', p?.juara3?.kemantren ? `Kem. ${p?.juara3?.kemantren}` : '-', p?.juara3?.unitTpa || '-', p?.juara3?.totalNilai || '-'],
    ['Harapan I', p?.harapan1?.nama || '-', p?.harapan1?.kemantren ? `Kem. ${p?.harapan1?.kemantren}` : '-', p?.harapan1?.unitTpa || '-', p?.harapan1?.totalNilai || '-'],
    ['Harapan II', p?.harapan2?.nama || '-', p?.harapan2?.kemantren ? `Kem. ${p?.harapan2?.kemantren}` : '-', p?.harapan2?.unitTpa || '-', p?.harapan2?.totalNilai || '-'],
  ];

  autoTable(doc, {
    head: [['Peringkat', 'Nama Juara', 'Rayon / Kemantren', 'Asal Unit TPA', 'Total Nilai']],
    body: tableData,
    startY: titleY + 15,
    margin: { left: marginX, right: marginX },
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [6, 78, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 28, fontStyle: 'bold' },
      1: { cellWidth: 50, fontStyle: 'bold' },
      2: { cellWidth: 35 },
      3: { cellWidth: 45 },
      4: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 12;

  // Catatan juri jika ada
  if (beritaAcara?.catatanJuri || (beritaAcara as any)?.catatan) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Catatan Dewan Juri: "${beritaAcara.catatanJuri || (beritaAcara as any).catatan}"`, marginX, finalY);
  }

  // Tanda Tangan Dewan Juri
  const signY = finalY + 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Yogyakarta, ' + (beritaAcara?.tanggalPenetapan || new Date().toLocaleDateString('id-ID')), pageWidth - marginX - 10, signY, { align: 'right' });
  doc.text('Dewan Juri / Hakim Lomba,', pageWidth - marginX - 10, signY + 5, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  const juri1 = beritaAcara?.juriSatu || beritaAcara?.namaKetuaJuri || '( ........................................ )';
  const juri2 = beritaAcara?.juriDua || beritaAcara?.namaAnggotaJuri || '( ........................................ )';

  doc.text(juri1, marginX + 25, signY + 28, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('Ketua Dewan Juri', marginX + 25, signY + 32, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.text(juri2, pageWidth - marginX - 35, signY + 28, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('Anggota / Sekretaris Juri', pageWidth - marginX - 35, signY + 32, { align: 'center' });

  const safeCategoryCode = category.code.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`Berita_Acara_${safeCategoryCode}_${category.level}.pdf`);
}
