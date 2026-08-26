/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Generator PDF ID Card Standar Portrait 55mm x 88mm (9 ID Card / Lembar A4)
 * Menghasilkan PDF Berkualitas Tinggi yang 100% Identik dengan Tampilan Preview
 */

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { logErrorEvent } from './storage';

export interface GeneratePdfFromDomOptions {
  containerSelector?: string;
  onProgress?: (current: number, total: number) => void;
  fileName?: string;
}

// In-memory Base64 cache for images to bypass CORS taint in html2canvas
const imageBase64Cache = new Map<string, string>();
const colorConvertCache = new Map<string, string>();

let helperCanvas: HTMLCanvasElement | null = null;
let helperCtx: CanvasRenderingContext2D | null = null;

function getHelperCanvasCtx(): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') return null;
  if (!helperCtx) {
    helperCanvas = document.createElement('canvas');
    helperCanvas.width = 1;
    helperCanvas.height = 1;
    helperCtx = helperCanvas.getContext('2d', { willReadFrequently: true });
  }
  return helperCtx;
}

/**
 * Konversi satu string fungsi warna modern (oklch, color-mix, lab, lch) ke RGB/HEX standar
 */
function convertModernColorToRgb(colorStr: string): string {
  if (!colorStr) return '#000000';
  if (colorConvertCache.has(colorStr)) {
    return colorConvertCache.get(colorStr)!;
  }

  const ctx = getHelperCanvasCtx();
  if (ctx) {
    try {
      ctx.fillStyle = 'rgba(0, 0, 0, 0)';
      ctx.fillStyle = colorStr;
      const resolved = ctx.fillStyle;
      if (
        resolved &&
        !resolved.includes('oklch') &&
        !resolved.includes('color-mix') &&
        !resolved.includes('lab') &&
        !resolved.includes('lch')
      ) {
        colorConvertCache.set(colorStr, resolved);
        return resolved;
      }
    } catch {
      // ignore
    }
  }

  // Fallback pemetaan warna umum
  const lower = colorStr.toLowerCase();
  let fallback = '#059669';
  if (lower.includes('emerald') || lower.includes('green')) fallback = '#059669';
  else if (lower.includes('amber') || lower.includes('yellow')) fallback = '#d97706';
  else if (lower.includes('blue') || lower.includes('navy')) fallback = '#1d4ed8';
  else if (lower.includes('rose') || lower.includes('maroon') || lower.includes('red')) fallback = '#be123c';
  else if (lower.includes('teal') || lower.includes('cyan')) fallback = '#0d9488';
  else if (lower.includes('gray') || lower.includes('slate') || lower.includes('zinc')) fallback = '#475569';
  else if (lower.includes('white')) fallback = '#ffffff';
  else if (lower.includes('black')) fallback = '#000000';

  colorConvertCache.set(colorStr, fallback);
  return fallback;
}

/**
 * Sanitasi string CSS atau style inline dari fungsi warna modern (oklch, lab, lch, color-mix)
 */
function sanitizeModernColorsInCss(cssText: string): string {
  if (!cssText) return cssText;
  if (
    !cssText.includes('oklch') &&
    !cssText.includes('color-mix') &&
    !cssText.includes('lab') &&
    !cssText.includes('lch')
  ) {
    return cssText;
  }

  return cssText.replace(
    /((?:oklch|color-mix|lab|lch)\((?:[^)(]+|\((?:[^)(]+|\([^)(]*\))*\))*\))/gi,
    (match) => convertModernColorToRgb(match)
  );
}

/**
 * Mengonversi URL gambar menjadi Base64 Data URL
 */
async function fetchImageAsBase64(url: string): Promise<string> {
  if (!url) return '';
  if (url.startsWith('data:')) return url;

  if (imageBase64Cache.has(url)) {
    return imageBase64Cache.get(url)!;
  }

  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        imageBase64Cache.set(url, base64data);
        resolve(base64data);
      };
      reader.onerror = () => resolve(url);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn(`Gagal fetch image via blob, fallback to original URL [${url}]:`, err);
    return url;
  }
}

/**
 * Pre-cache dan ganti semua gambar eksternal di DOM dengan Base64 sebelum html2canvas
 */
async function inlineImagesAsBase64(rootElement: HTMLElement): Promise<() => void> {
  const images = Array.from(rootElement.querySelectorAll<HTMLImageElement>('img'));
  const elementsWithBg = Array.from(rootElement.querySelectorAll<HTMLElement>('*')).filter((el) => {
    const bg = el.style.backgroundImage || window.getComputedStyle(el).backgroundImage;
    return bg && bg.includes('url(');
  });

  const originalImgSources = new Map<HTMLImageElement, string>();
  const originalBgs = new Map<HTMLElement, string>();

  // Inline img src
  for (const img of images) {
    if (img.src && !img.src.startsWith('data:')) {
      originalImgSources.set(img, img.src);
      try {
        const base64 = await fetchImageAsBase64(img.src);
        if (base64 && base64.startsWith('data:')) {
          img.src = base64;
        }
      } catch {
        // Abaikan jika fallback
      }
    }
  }

  // Inline background-image url(...)
  for (const el of elementsWithBg) {
    const bg = el.style.backgroundImage || window.getComputedStyle(el).backgroundImage;
    const match = bg.match(/url\(["']?([^"')]+)["']?\)/);
    if (match && match[1] && !match[1].startsWith('data:')) {
      originalBgs.set(el, el.style.backgroundImage);
      try {
        const base64 = await fetchImageAsBase64(match[1]);
        if (base64 && base64.startsWith('data:')) {
          el.style.backgroundImage = `url("${base64}")`;
        }
      } catch {
        // Abaikan jika fallback
      }
    }
  }

  // Kembalikan fungsi restore
  return () => {
    originalImgSources.forEach((src, img) => {
      img.src = src;
    });
    originalBgs.forEach((bg, el) => {
      el.style.backgroundImage = bg;
    });
  };
}

/**
 * Generate PDF dokumen A4 dari halaman preview DOM menggunakan html2canvas dengan resolusi tajam.
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

      // 1. Inline semua gambar ke Base64 agar canvas tidak pernah tainted
      const restoreImages = await inlineImagesAsBase64(pageEl);

      try {
        // 2. Capture elemen halaman ke Canvas dengan pembersihan oklch pada DOM clone
        const canvas = await html2canvas(pageEl, {
          scale: 2.2, // ~220-300 DPI - tajam, aman dari alokasi memori berlebih di HP
          useCORS: true,
          allowTaint: false, // Wajib FALSE agar tidak terjadi SecurityError pada toDataURL
          backgroundColor: '#ffffff',
          logging: false,
          imageTimeout: 20000,
          windowWidth: pageEl.scrollWidth,
          windowHeight: pageEl.scrollHeight,
          onclone: (clonedDoc, clonedElement) => {
            // A. Bersihkan seluruh <style> tag di cloned document dari fungsi warna modern (oklch, color-mix, lab, lch)
            const styleTags = clonedDoc.querySelectorAll('style');
            styleTags.forEach((tag) => {
              if (tag.textContent) {
                tag.textContent = sanitizeModernColorsInCss(tag.textContent);
              }
            });

            // B. Bersihkan atribut inline style pada seluruh elemen clonedDoc
            const styledNodes = clonedDoc.querySelectorAll<HTMLElement>('[style]');
            styledNodes.forEach((node) => {
              const inlineStyle = node.getAttribute('style');
              if (inlineStyle) {
                node.setAttribute('style', sanitizeModernColorsInCss(inlineStyle));
              }
            });

            // C. Bersihkan elemen target dan anak-anaknya secara spesifik
            const colorProps = [
              'color',
              'backgroundColor',
              'borderColor',
              'borderTopColor',
              'borderBottomColor',
              'borderLeftColor',
              'borderRightColor',
              'outlineColor',
              'boxShadow',
              'textDecorationColor',
              'fill',
              'stroke',
            ];

            const allClonedDescendants = clonedElement.querySelectorAll<HTMLElement>('*');
            allClonedDescendants.forEach((node) => {
              try {
                // Bersihkan atribut SVG fill/stroke jika ada
                ['fill', 'stroke', 'color', 'background-color', 'border-color'].forEach((attr) => {
                  const val = node.getAttribute(attr);
                  if (val && (val.includes('oklch') || val.includes('color-mix') || val.includes('lab') || val.includes('lch'))) {
                    node.setAttribute(attr, sanitizeModernColorsInCss(val));
                  }
                });

                // Periksa computed style dan paksa fallback jika browser masih memancarkan oklch
                const computed = window.getComputedStyle(node);
                for (const prop of colorProps) {
                  const val = (computed as any)[prop];
                  if (
                    typeof val === 'string' &&
                    (val.includes('oklch') || val.includes('color-mix') || val.includes('lab') || val.includes('lch'))
                  ) {
                    (node.style as any)[prop] = sanitizeModernColorsInCss(val);
                  }
                }
              } catch {
                // Abaikan jika elemen bukan HTML/SVG standar
              }
            });
          },
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        if (i > 0) {
          doc.addPage('a4', 'portrait');
        }

        // Tambahkan gambar halaman ke A4 secara pas (210mm x 297mm)
        doc.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      } finally {
        // Kembalikan gambar asli
        restoreImages();
      }
    }

    doc.save(fileName);
  } catch (error) {
    logErrorEvent('ADMIN_ID_CARD', 'EXPORT_PDF_ID_CARD', error);
    throw error;
  }
}
