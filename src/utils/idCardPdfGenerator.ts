/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Generator PDF ID Card Standar Portrait 85mm x 55mm (9 ID Card / Lembar A4)
 * Menghasilkan PDF Vektor Murni & Tajam (Bukan Screenshot / Snapshot Buram)
 */

import { jsPDF } from 'jspdf';
import { Participant, CompetitionCategory, Kemantren } from '../types/fasi';
import { IdCardTheme } from '../components/print/idCardThemes';
import { OfficialCardData } from '../components/print/IdCardOfficial';
import { CommitteeCardData } from '../components/print/IdCardCommittee';

// Convert image url to Base64 data URL for jsPDF embedding
export async function loadImageAsBase64(url: string): Promise<string> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('Gagal memuat gambar ke Base64:', url, err);
    return '';
  }
}

// Convert Hex to RGB [r, g, b]
function hexToRgb(hex: string): [number, number, number] {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map((x) => x + x).join('');
  }
  const num = parseInt(c, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

interface GenerateIdCardPdfOptions {
  type: 'peserta' | 'official' | 'panitia';
  participants?: Participant[];
  categoriesList?: CompetitionCategory[];
  kemantrenList?: Kemantren[];
  officials?: OfficialCardData[];
  committees?: CommitteeCardData[];
  qrCodes?: Record<string, string>;
  theme: IdCardTheme;
  customTagline?: string;
  onProgress?: (current: number, total: number) => void;
}

export async function generateIdCardsPdf({
  type,
  participants = [],
  categoriesList = [],
  kemantrenList = [],
  officials = [],
  committees = [],
  qrCodes = {},
  theme,
  customTagline = 'Santri Hebat, Hebat Prestasi, Hebat Mengaji, & Berakhlakul Karimah.',
  onProgress,
}: GenerateIdCardPdfOptions): Promise<void> {
  // 1. Inisialisasi Dokumen jsPDF A4 Portrait (210mm x 297mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  // Dimensi & Layout Kartu (85mm x 55mm)
  const cardW = 55;
  const cardH = 85;
  const marginX = 8; // Margin kiri lembar A4
  const marginY = 10; // Margin atas lembar A4
  const gapX = 4; // Jarak antar kartu horizontal
  const gapY = 4; // Jarak antar kartu vertikal
  const cols = 3;
  const rows = 3;
  const cardsPerPage = cols * rows; // 9 Kartu per Lembar A4

  // Preload Logo Assets
  const logoBadkoUrl = 'https://ai-engineer-studio.s3.ap-southeast-1.amazonaws.com/projects/badko-fasi/logobadko.png';
  const logoFasiUrl = 'https://ai-engineer-studio.s3.ap-southeast-1.amazonaws.com/projects/badko-fasi/logofasi.png';
  const watermarkUrl = 'https://ai-engineer-studio.s3.ap-southeast-1.amazonaws.com/projects/badko-fasi/logodesain.png';

  const [logoBadkoBase64, logoFasiBase64, watermarkBase64] = await Promise.all([
    loadImageAsBase64(logoBadkoUrl),
    loadImageAsBase64(logoFasiUrl),
    loadImageAsBase64(watermarkUrl),
  ]);

  const [primaryR, primaryG, primaryB] = hexToRgb(theme.primaryColor || '#064e3b');
  const [accentR, accentG, accentB] = hexToRgb(theme.accentColor || '#f59e0b');
  const [borderR, borderG, borderB] = hexToRgb(theme.borderColor || '#059669');

  const totalItems =
    type === 'peserta' ? participants.length : type === 'official' ? officials.length : committees.length;

  if (totalItems === 0) return;

  const totalPages = Math.ceil(totalItems / cardsPerPage);

  for (let itemIdx = 0; itemIdx < totalItems; itemIdx++) {
    const pageIndex = Math.floor(itemIdx / cardsPerPage);
    const posInPage = itemIdx % cardsPerPage;
    const col = posInPage % cols;
    const row = Math.floor(posInPage / cols);

    if (itemIdx > 0 && posInPage === 0) {
      doc.addPage('a4', 'portrait');
    }

    const x = marginX + col * (cardW + gapX);
    const y = marginY + row * (cardH + gapY);

    if (onProgress) {
      onProgress(itemIdx + 1, totalItems);
    }

    // --- 1. Draw Card Background & Outer Rounded Border ---
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(borderR, borderG, borderB);
    doc.setLineWidth(0.4);
    doc.roundedRect(x, y, cardW, cardH, 3, 3, 'FD');

    // Subtle header top band
    doc.setFillColor(primaryR, primaryG, primaryB);
    doc.rect(x + 0.2, y + 0.2, cardW - 0.4, 2, 'F');

    // --- 2. Watermark Desain di Tengah (Jika tersedia) ---
    if (watermarkBase64) {
      try {
        const wmSize = 34;
        const wmX = x + (cardW - wmSize) / 2;
        const wmY = y + (cardH - wmSize) / 2 + 3;
        doc.addImage(watermarkBase64, 'PNG', wmX, wmY, wmSize, wmSize, undefined, 'FAST');
      } catch {
        // Safe fallback
      }
    }

    // --- 3. Corner Accent Lines (Ornamen Islami Halus) ---
    doc.setDrawColor(accentR, accentG, accentB);
    doc.setLineWidth(0.3);
    // Top-left
    doc.line(x + 1.5, y + 3.5, x + 4, y + 3.5);
    doc.line(x + 1.5, y + 3.5, x + 1.5, y + 6);
    // Top-right
    doc.line(x + cardW - 4, y + 3.5, x + cardW - 1.5, y + 3.5);
    doc.line(x + cardW - 1.5, y + 3.5, x + cardW - 1.5, y + 6);
    // Bottom-left
    doc.line(x + 1.5, y + cardH - 3.5, x + 4, y + cardH - 3.5);
    doc.line(x + 1.5, y + cardH - 3.5, x + 1.5, y + cardH - 6);
    // Bottom-right
    doc.line(x + cardW - 4, y + cardH - 3.5, x + cardW - 1.5, y + cardH - 3.5);
    doc.line(x + cardW - 1.5, y + cardH - 3.5, x + cardW - 1.5, y + cardH - 6);

    // --- 4. Header: Logo Badko & Logo FASI + Teks Panitia ---
    const logoY = y + 3.2;
    if (logoBadkoBase64) {
      try {
        doc.addImage(logoBadkoBase64, 'PNG', x + 12, logoY, 7.5, 7.5, undefined, 'FAST');
      } catch {
        // Ignore logo error
      }
    }
    // Divider line between logos
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(x + 22.5, logoY + 1, x + 22.5, logoY + 6.5);

    if (logoFasiBase64) {
      try {
        doc.addImage(logoFasiBase64, 'PNG', x + 25.5, logoY, 7.5, 7.5, undefined, 'FAST');
      } catch {
        // Ignore logo error
      }
    }

    // Teks Header Resmi
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(primaryR, primaryG, primaryB);
    doc.text('PANITIA FASI XIII', x + cardW / 2, y + 13.5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(80, 80, 80);
    doc.text('KOTA YOGYAKARTA', x + cardW / 2, y + 16, { align: 'center' });

    // Header Separator Line
    doc.setDrawColor(borderR, borderG, borderB);
    doc.setLineWidth(0.3);
    doc.line(x + 4, y + 17.5, x + cardW - 4, y + 17.5);

    // --- 5. Content Rendering Berdasarkan Tipe Kartu ---
    if (type === 'peserta') {
      const p = participants[itemIdx];
      const cat = categoriesList.find((c) => c.id === p.categoryId);
      const kem = kemantrenList.find((k) => k.id === p.kemantrenId);
      const levelText = cat?.level || 'FASI';
      const cleanCatName = cat?.name
        ? cat.name.replace(/\s*\(Putra\)|\s*\(Putri\)/gi, '').trim()
        : p.categoryId;
      const genderText = p.gender === 'L' ? 'Putra' : 'Putri';

      // Badge Kategori (TKA / TPA / TQA)
      doc.setFillColor(primaryR, primaryG, primaryB);
      doc.roundedRect(x + (cardW - 32) / 2, y + 20, 32, 4.5, 1.2, 1.2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(255, 255, 255);
      doc.text(`PESERTA ${levelText}`, x + cardW / 2, y + 23.2, { align: 'center' });

      // Nama Santri
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42); // slate-900
      const nameLines = doc.splitTextToSize(p.fullName, cardW - 8);
      const nameY = y + 29;
      doc.text(nameLines.slice(0, 2), x + cardW / 2, nameY, { align: 'center' });

      // Unit TPA & Rayon / Kemantren
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.8);
      doc.setTextColor(71, 85, 105); // slate-600
      const unitText = p.tpaUnitName ? `${p.tpaUnitName}` : '';
      doc.text(doc.splitTextToSize(unitText, cardW - 8).slice(0, 1), x + cardW / 2, nameY + 5, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.5);
      doc.setTextColor(primaryR, primaryG, primaryB);
      doc.text(`Rayon ${kem?.name || p.kemantrenId}`, x + cardW / 2, nameY + 8, { align: 'center' });

      // Box Cabang Lomba
      const catBoxY = y + 45;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.roundedRect(x + 4, catBoxY, cardW - 8, 12, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5);
      doc.setTextColor(accentR, accentG, accentB);
      doc.text('CABANG LOMBA', x + cardW / 2, catBoxY + 3.2, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(15, 23, 42);
      const catLines = doc.splitTextToSize(cleanCatName, cardW - 10);
      doc.text(catLines.slice(0, 1), x + cardW / 2, catBoxY + 6.8, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.5);
      doc.setTextColor(p.gender === 'L' ? 30 : 219, p.gender === 'L' ? 58 : 39, p.gender === 'L' ? 138 : 119);
      doc.text(`Golongan: ${genderText}`, x + cardW / 2, catBoxY + 10.2, { align: 'center' });

      // Bottom Area: QR Code di Kanan Bawah & Tagline di Kiri Bawah
      const qrDataUrl = qrCodes[p.id];
      const qrSize = 13.5;
      const qrX = x + cardW - qrSize - 4;
      const qrY = y + cardH - qrSize - 5.5;

      if (qrDataUrl) {
        try {
          doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize, undefined, 'FAST');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(4.8);
          doc.setTextColor(primaryR, primaryG, primaryB);
          doc.text(p.registrationNumber, qrX + qrSize / 2, qrY + qrSize + 2.5, { align: 'center' });
        } catch {
          // Ignore QR error
        }
      }

      // Tagline di sisi kiri bawah
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(4.2);
      doc.setTextColor(100, 116, 139);
      const tagLines = doc.splitTextToSize(customTagline, cardW - qrSize - 12);
      doc.text(tagLines.slice(0, 3), x + 4, y + cardH - 11);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(4.5);
      doc.setTextColor(primaryR, primaryG, primaryB);
      doc.text('BADKO TKA-TPA KOTA YOGYAKARTA', x + 4, y + cardH - 3);

    } else if (type === 'official') {
      const off = officials[itemIdx];

      // Badge OFFICIAL tebal besar
      doc.setFillColor(primaryR, primaryG, primaryB);
      doc.roundedRect(x + (cardW - 38) / 2, y + 20, 38, 6, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text('OFFICIAL', x + cardW / 2, y + 24.5, { align: 'center' });

      // Rayon Kontingen
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(accentR, accentG, accentB);
      doc.text(off.kemantrenName || 'Kontingen Rayon', x + cardW / 2, y + 32, { align: 'center' });

      // Box Nama & Jabatan Official
      const boxY = y + 36;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(borderR, borderG, borderB);
      doc.setLineWidth(0.3);
      doc.roundedRect(x + 4, boxY, cardW - 8, 22, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5);
      doc.setTextColor(100, 116, 139);
      doc.text('NAMA OFFICIAL PENDAMPING:', x + cardW / 2, boxY + 4, { align: 'center' });

      if (off.name) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        const nameLines = doc.splitTextToSize(off.name, cardW - 10);
        doc.text(nameLines.slice(0, 2), x + cardW / 2, boxY + 9.5, { align: 'center' });
      } else {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(6);
        doc.setTextColor(160, 174, 192);
        doc.text('(Tulis / Tempel Nama Official)', x + cardW / 2, boxY + 9.5, { align: 'center' });
      }

      // Jabatan Official
      doc.setFillColor(primaryR, primaryG, primaryB);
      doc.roundedRect(x + 7, boxY + 15, cardW - 14, 4.5, 1, 1, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.5);
      doc.setTextColor(255, 255, 255);
      doc.text(off.role || 'Official Kontingen', x + cardW / 2, boxY + 18.2, { align: 'center' });

      // Access Pill
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.5);
      doc.setTextColor(primaryR, primaryG, primaryB);
      doc.text('HAK AKSES: OFFICIAL VENUE & PENDAMPING', x + cardW / 2, y + 64, { align: 'center' });

      // Bottom Area Tagline
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(4.5);
      doc.setTextColor(100, 116, 139);
      const tagLines = doc.splitTextToSize(customTagline, cardW - 8);
      doc.text(tagLines.slice(0, 2), x + cardW / 2, y + cardH - 8, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(4.8);
      doc.setTextColor(primaryR, primaryG, primaryB);
      doc.text('BADKO TKA-TPA KOTA YOGYAKARTA', x + cardW / 2, y + cardH - 3, { align: 'center' });

    } else if (type === 'panitia') {
      const com = committees[itemIdx];

      // Badge PANITIA tebal besar
      doc.setFillColor(primaryR, primaryG, primaryB);
      doc.roundedRect(x + (cardW - 38) / 2, y + 20, 38, 6, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text('PANITIA', x + cardW / 2, y + 24.5, { align: 'center' });

      // Divisi / Seksi
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(accentR, accentG, accentB);
      doc.text(com.division || 'Panitia Pelaksana', x + cardW / 2, y + 31.5, { align: 'center' });

      // Frame Area Nama (Bisa cetak digital / tempel stiker)
      const boxY = y + 35.5;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(borderR, borderG, borderB);
      doc.setLineWidth(0.3);
      doc.roundedRect(x + 4, boxY, cardW - 8, 23, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5);
      doc.setTextColor(100, 116, 139);
      doc.text('AREA NAMA PANITIA / STIKER LABEL:', x + cardW / 2, boxY + 4, { align: 'center' });

      if (com.name) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        const nameLines = doc.splitTextToSize(com.name, cardW - 10);
        doc.text(nameLines.slice(0, 2), x + cardW / 2, boxY + 10, { align: 'center' });
      } else {
        doc.setDrawColor(203, 213, 225);
        doc.setLineDashPattern([1, 1], 0);
        doc.rect(x + 6, boxY + 6.5, cardW - 12, 10, 'D');
        doc.setLineDashPattern([], 0); // reset dash

        doc.setFont('helvetica', 'italic');
        doc.setFontSize(5);
        doc.setTextColor(148, 163, 184);
        doc.text('Tempel Label No. 103 / Tulis Nama', x + cardW / 2, boxY + 12.5, { align: 'center' });
      }

      // Akses Level
      doc.setFillColor(primaryR, primaryG, primaryB);
      doc.roundedRect(x + 7, boxY + 17.5, cardW - 14, 4, 1, 1, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5);
      doc.setTextColor(255, 255, 255);
      doc.text(`AKSES: ${com.accessLevel || 'ALL ACCESS'}`, x + cardW / 2, boxY + 20.3, { align: 'center' });

      // Bottom Area Tagline
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(4.5);
      doc.setTextColor(100, 116, 139);
      const tagLines = doc.splitTextToSize(customTagline, cardW - 8);
      doc.text(tagLines.slice(0, 2), x + cardW / 2, y + cardH - 8, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(4.8);
      doc.setTextColor(primaryR, primaryG, primaryB);
      doc.text('BADKO TKA-TPA KOTA YOGYAKARTA', x + cardW / 2, y + cardH - 3, { align: 'center' });
    }
  }

  // Simpan file PDF langsung ke unduhan browser
  const filename =
    type === 'peserta'
      ? `ID_Card_Peserta_FASI_XIII_Yogyakarta_${Date.now()}.pdf`
      : type === 'official'
      ? `ID_Card_Official_FASI_XIII_Yogyakarta_${Date.now()}.pdf`
      : `ID_Card_Panitia_FASI_XIII_Yogyakarta_${Date.now()}.pdf`;

  doc.save(filename);
}
