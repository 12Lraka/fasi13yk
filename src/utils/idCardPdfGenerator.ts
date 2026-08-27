/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Generator PDF ID Card Standar Portrait 55mm x 88mm (9 ID Card / Lembar A4)
 * Menggunakan html-to-image dengan pixelRatio 2.5 - 3.0 untuk ketajaman 100% presisi.
 */

import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import { logErrorEvent } from './storage';
import { inlineImagesAsBase64 } from './idCardPngGenerator';

export interface GeneratePdfFromDomOptions {
  containerSelector?: string;
  onProgress?: (current: number, total: number) => void;
  fileName?: string;
}

/**
 * Generate PDF dokumen A4 dari halaman preview DOM menggunakan html-to-image dengan resolusi tinggi.
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

  try {
    for (let i = 0; i < totalPages; i++) {
      const pageEl = pageElements[i];
      if (onProgress) {
        onProgress(i + 1, totalPages);
      }

      // 1. Inline semua gambar ke Base64 agar tidak ada CORS delay
      const restoreImages = await inlineImagesAsBase64(pageEl);

      try {
        // 2. Render halaman A4 ke PNG resolusi tinggi menggunakan html-to-image
        // skipFonts: true mencegah error 'Cannot access rules' pada remote CSS Google Fonts
        const imgData = await toPng(pageEl, {
          pixelRatio: 2.5, // ~250-300 DPI - tajam maksimal dan aman di memori
          backgroundColor: '#ffffff',
          cacheBust: true,
          skipFonts: true,
        });

        if (i > 0) {
          doc.addPage('a4', 'portrait');
        }

        // Tambahkan gambar halaman ke lembar A4 secara pas (210mm x 297mm)
        doc.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
      } finally {
        restoreImages();
      }
    }

    doc.save(fileName);
  } catch (error) {
    logErrorEvent('ADMIN_ID_CARD', 'EXPORT_PDF_ID_CARD', error);
    throw error;
  }
}
