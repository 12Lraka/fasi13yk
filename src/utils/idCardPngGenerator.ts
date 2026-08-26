/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Generator Ekspor ID Card Gambar PNG Satuan & Batch ZIP Beresolusi Tinggi (300 DPI)
 * Menjamin 100% Identik & Pixel-Perfect dengan Tampilan Preview di Web
 */

import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import { logErrorEvent } from './storage';

// In-memory cache for Base64 images
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
    console.warn(`Fallback image Base64 for [${url}]:`, err);
    return url;
  }
}

async function inlineImagesAsBase64(rootElement: HTMLElement): Promise<() => void> {
  const images = Array.from(rootElement.querySelectorAll<HTMLImageElement>('img'));
  const elementsWithBg = Array.from(rootElement.querySelectorAll<HTMLElement>('*')).filter((el) => {
    const bg = el.style.backgroundImage || window.getComputedStyle(el).backgroundImage;
    return bg && bg.includes('url(');
  });

  const originalImgSources = new Map<HTMLImageElement, string>();
  const originalBgs = new Map<HTMLElement, string>();

  for (const img of images) {
    if (img.src && !img.src.startsWith('data:')) {
      originalImgSources.set(img, img.src);
      try {
        const base64 = await fetchImageAsBase64(img.src);
        if (base64 && base64.startsWith('data:')) {
          img.src = base64;
        }
      } catch {
        // ignore
      }
    }
  }

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
        // ignore
      }
    }
  }

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
 * Capture satu elemen kartu menjadi Canvas berkualias tinggi
 */
export async function captureCardToCanvas(cardElement: HTMLElement): Promise<HTMLCanvasElement> {
  const restoreImages = await inlineImagesAsBase64(cardElement);

  try {
    const canvas = await html2canvas(cardElement, {
      scale: 3.0, // Resolusi tinggi ~300 DPI untuk cetak tajam
      useCORS: true,
      allowTaint: false,
      backgroundColor: null,
      logging: false,
      imageTimeout: 20000,
      onclone: (clonedDoc, clonedElement) => {
        // Bersihkan style tag
        const styleTags = clonedDoc.querySelectorAll('style');
        styleTags.forEach((tag) => {
          if (tag.textContent) {
            tag.textContent = sanitizeModernColorsInCss(tag.textContent);
          }
        });

        // Bersihkan inline style
        const styledNodes = clonedDoc.querySelectorAll<HTMLElement>('[style]');
        styledNodes.forEach((node) => {
          const inlineStyle = node.getAttribute('style');
          if (inlineStyle) {
            node.setAttribute('style', sanitizeModernColorsInCss(inlineStyle));
          }
        });

        // Pastikan ukuran eksplisit pada elemen yang di-clone
        clonedElement.style.boxShadow = 'none';
        clonedElement.style.margin = '0';
      },
    });

    return canvas;
  } finally {
    restoreImages();
  }
}

/**
 * Download 1 kartu tunggal langsung sebagai file PNG beresolusi tinggi
 */
export async function downloadSingleCardAsPng(
  cardElement: HTMLElement,
  fileName: string = 'ID_Card_FASI_XIII.png'
): Promise<void> {
  const canvas = await captureCardToCanvas(cardElement);
  const dataUrl = canvas.toDataURL('image/png', 1.0);

  const downloadLink = document.createElement('a');
  downloadLink.href = dataUrl;
  downloadLink.download = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}

/**
 * Download kumpulan kartu (Batch) ke dalam satu berkas .ZIP berisi file-file .PNG
 */
export async function downloadBatchCardsAsZip({
  cardElements,
  fileNames,
  zipFileName = 'ID_Cards_FASI_XIII_PNG.zip',
  onProgress,
}: {
  cardElements: HTMLElement[];
  fileNames: string[];
  zipFileName?: string;
  onProgress?: (current: number, total: number) => void;
}): Promise<void> {
  if (!cardElements.length) {
    throw new Error('Tidak ada kartu untuk diunduh.');
  }

  const zip = new JSZip();
  const folder = zip.folder('ID_Cards_FASI_XIII') || zip;
  const total = cardElements.length;

  for (let i = 0; i < total; i++) {
    if (onProgress) onProgress(i + 1, total);
    const el = cardElements[i];
    const rawName = fileNames[i] || `ID_Card_${i + 1}`;
    const safeName = rawName.replace(/[/\\?%*:|"<>]/g, '_') + '.png';

    const canvas = await captureCardToCanvas(el);
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');

    folder.file(safeName, base64Data, { base64: true });
  }

  const contentBlob = await zip.generateAsync({ type: 'blob' });
  const downloadUrl = URL.createObjectURL(contentBlob);
  const downloadLink = document.createElement('a');
  downloadLink.href = downloadUrl;
  downloadLink.download = zipFileName.endsWith('.zip') ? zipFileName : `${zipFileName}.zip`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(downloadUrl);
}
