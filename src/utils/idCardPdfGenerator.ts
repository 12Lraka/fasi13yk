/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Generator PDF ID Card Standar Portrait 55mm x 88mm (9 ID Card / Lembar A4)
 * Menghasilkan PDF Berkualitas Tinggi (300 DPI) yang 100% Identik dengan Tampilan Preview
 */

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export interface GeneratePdfFromDomOptions {
  containerSelector?: string;
  onProgress?: (current: number, total: number) => void;
  fileName?: string;
}

/**
 * Generate PDF dokumen A4 dari halaman preview DOM menggunakan html2canvas dengan resolusi tinggi (scale: 3).
 * Menjamin hasil PDF 100% sama persis dengan yang dilihat di layar preview:
 * - Tidak ada logo ketarik (aspect ratio asli terjaga)
 * - Tidak ada border aneh / sudut tajam persegi tanpa lengkungan
 * - Layout, badge, watermark, dan font persis sama
 */
export async function generateIdCardsPdfFromDom({
  containerSelector = '.idcard-print-page',
  onProgress,
  fileName = 'ID_Card_FASI_XIII_A4.pdf',
}: GeneratePdfFromDomOptions): Promise<void> {
  const pageElements = document.querySelectorAll<HTMLElement>(containerSelector);

  if (!pageElements || pageElements.length === 0) {
    throw new Error('Tidak ada halaman ID Card yang ditemukan untuk diekspor ke PDF.');
  }

  const totalPages = pageElements.length;
  
  // Inisialisasi dokumen jsPDF ukuran A4 Portrait (210mm x 297mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  for (let i = 0; i < totalPages; i++) {
    const pageEl = pageElements[i];
    if (onProgress) {
      onProgress(i + 1, totalPages);
    }

    // Capture elemen halaman ke Canvas beresolusi tinggi (scale: 3)
    const canvas = await html2canvas(pageEl, {
      scale: 3, // ~300 DPI print quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 15000,
      windowWidth: pageEl.scrollWidth,
      windowHeight: pageEl.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    if (i > 0) {
      doc.addPage('a4', 'portrait');
    }

    // Tambahkan gambar halaman ke A4 secara pas (210mm x 297mm)
    doc.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
  }

  doc.save(fileName);
}
