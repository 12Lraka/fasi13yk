/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Generator Ekspor ID Card Gambar PNG Satuan & Batch ZIP Beresolusi Tinggi (300 DPI)
 * Menggunakan engine modern html-to-image dengan pixelRatio tinggi.
 * Menghasilkan output yang 100% identik pixel-by-pixel dengan preview di browser.
 */

import { toPng, toCanvas } from 'html-to-image';
import JSZip from 'jszip';
import { logErrorEvent } from './storage';

// In-memory cache for Base64 images to bypass any CORS taint or latency
const imageBase64Cache = new Map<string, string>();

export async function fetchImageAsBase64(url: string): Promise<string> {
  if (!url) return '';
  if (url.startsWith('data:')) return url;

  if (imageBase64Cache.has(url)) {
    return imageBase64Cache.get(url)!;
  }

  // Method 1: Direct fetch via blob (Supabase / public CDN)
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (response.ok) {
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      if (base64 && base64.startsWith('data:')) {
        imageBase64Cache.set(url, base64);
        return base64;
      }
    }
  } catch {
    // Continue to Method 2 fallback
  }

  // Method 2: HTML Image to Canvas
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const base64 = await new Promise<string>((resolve) => {
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width || 400;
          canvas.height = img.naturalHeight || img.height || 400;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          } else {
            resolve(url);
          }
        } catch {
          resolve(url);
        }
      };
      img.onerror = () => resolve(url);
      img.src = url;
    });

    if (base64 && base64.startsWith('data:')) {
      imageBase64Cache.set(url, base64);
      return base64;
    }
  } catch {
    // Fallback
  }

  return url;
}

/**
 * Pre-inlines all images inside the node to Data URI Base64
 * This ensures html-to-image does not fail on cross-origin images or delay fetching.
 */
export async function inlineImagesAsBase64(rootElement: HTMLElement): Promise<() => void> {
  const images = Array.from(rootElement.querySelectorAll<HTMLImageElement>('img'));
  const originalImgSources = new Map<HTMLImageElement, string>();

  await Promise.all(
    images.map(async (img) => {
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
    })
  );

  return () => {
    originalImgSources.forEach((src, img) => {
      img.src = src;
    });
  };
}

/**
 * Konversi Data URL base64 ke Uint8Array murni
 * Mencegah error "Invalid base64 input, it looks like a data url" pada JSZip
 */
export function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const commaIdx = dataUrl.indexOf(',');
  if (commaIdx < 0) {
    throw new Error('Format Data URL tidak valid (tidak ada koma pemisah)');
  }
  const base64 = dataUrl.slice(commaIdx + 1).replace(/\s/g, '');
  if (!base64 || base64.length === 0) {
    throw new Error('Data gambar kosong (0 bytes)');
  }
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Capture satu elemen kartu ID card menjadi PNG Data URL berkualitas ultra-tinggi (~350 DPI)
 * Menggunakan html-to-image dengan native browser rendering engine.
 */
export async function captureCardToPngDataUrl(cardElement: HTMLElement): Promise<string> {
  // Targetkan elemen fisik kartu .fasi-id-card
  const targetEl =
    (cardElement.classList.contains('fasi-id-card')
      ? cardElement
      : cardElement.querySelector<HTMLElement>('.fasi-id-card')) || cardElement;

  // Pastikan elemen dan seluruh leluhurnya terlihat saat capture agar dimensi & canvas tidak bernilai 0
  let current: HTMLElement | null = targetEl;
  const temporarilyUnhidden: {
    el: HTMLElement;
    prevDisplay: string;
    prevPosition: string;
    prevLeft: string;
    prevTop: string;
    prevVisibility: string;
  }[] = [];

  while (current && current !== document.body) {
    const computed = window.getComputedStyle(current);
    if (computed.display === 'none') {
      temporarilyUnhidden.push({
        el: current,
        prevDisplay: current.style.display,
        prevPosition: current.style.position,
        prevLeft: current.style.left,
        prevTop: current.style.top,
        prevVisibility: current.style.visibility,
      });
      current.style.setProperty('display', 'block', 'important');
      current.style.setProperty('position', 'fixed', 'important');
      current.style.setProperty('left', '-99999px', 'important');
      current.style.setProperty('top', '-99999px', 'important');
      current.style.setProperty('visibility', 'visible', 'important');
    }
    current = current.parentElement;
  }

  const restoreImages = await inlineImagesAsBase64(targetEl);

  try {
    // pixelRatio 3.5 menghasilkan kartu ~730px x 1165px (resolusi cetak 300+ DPI sangat tajam)
    // skipFonts: true mencegah error 'Cannot access rules' pada remote CSS Google Fonts
    const dataUrl = await toPng(targetEl, {
      pixelRatio: 3.5,
      backgroundColor: '#ffffff',
      cacheBust: true,
      skipFonts: true,
    });
    return dataUrl;
  } catch (err) {
    logErrorEvent('ADMIN_ID_CARD', 'CAPTURE_CARD_PNG_ERROR', err);
    throw err;
  } finally {
    restoreImages();
    // Kembalikan style elemen yang sempat di-unhide
    temporarilyUnhidden.forEach(({ el, prevDisplay, prevPosition, prevLeft, prevTop, prevVisibility }) => {
      el.style.display = prevDisplay;
      el.style.position = prevPosition;
      el.style.left = prevLeft;
      el.style.top = prevTop;
      el.style.visibility = prevVisibility;
    });
  }
}

/**
 * Capture satu elemen kartu ID card menjadi HTMLCanvasElement
 */
export async function captureCardToCanvas(cardElement: HTMLElement): Promise<HTMLCanvasElement> {
  const targetEl =
    (cardElement.classList.contains('fasi-id-card')
      ? cardElement
      : cardElement.querySelector<HTMLElement>('.fasi-id-card')) || cardElement;

  let current: HTMLElement | null = targetEl;
  const temporarilyUnhidden: {
    el: HTMLElement;
    prevDisplay: string;
    prevPosition: string;
    prevLeft: string;
    prevTop: string;
    prevVisibility: string;
  }[] = [];

  while (current && current !== document.body) {
    const computed = window.getComputedStyle(current);
    if (computed.display === 'none') {
      temporarilyUnhidden.push({
        el: current,
        prevDisplay: current.style.display,
        prevPosition: current.style.position,
        prevLeft: current.style.left,
        prevTop: current.style.top,
        prevVisibility: current.style.visibility,
      });
      current.style.setProperty('display', 'block', 'important');
      current.style.setProperty('position', 'fixed', 'important');
      current.style.setProperty('left', '-99999px', 'important');
      current.style.setProperty('top', '-99999px', 'important');
      current.style.setProperty('visibility', 'visible', 'important');
    }
    current = current.parentElement;
  }

  const restoreImages = await inlineImagesAsBase64(targetEl);

  try {
    const canvas = await toCanvas(targetEl, {
      pixelRatio: 3.5,
      backgroundColor: '#ffffff',
      cacheBust: true,
      skipFonts: true,
    });
    return canvas;
  } finally {
    restoreImages();
    temporarilyUnhidden.forEach(({ el, prevDisplay, prevPosition, prevLeft, prevTop, prevVisibility }) => {
      el.style.display = prevDisplay;
      el.style.position = prevPosition;
      el.style.left = prevLeft;
      el.style.top = prevTop;
      el.style.visibility = prevVisibility;
    });
  }
}

/**
 * Download 1 kartu tunggal langsung sebagai file PNG beresolusi tinggi
 */
export async function downloadSingleCardAsPng(
  cardElement: HTMLElement,
  fileName: string = 'ID_Card_FASI_XIII.png'
): Promise<void> {
  try {
    const dataUrl = await captureCardToPngDataUrl(cardElement);

    const downloadLink = document.createElement('a');
    downloadLink.href = dataUrl;
    downloadLink.download = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  } catch (error) {
    logErrorEvent('ADMIN_ID_CARD', 'DOWNLOAD_SINGLE_PNG', error);
    throw error;
  }
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
  onZipStart?: () => void;
}): Promise<void> {
  if (!cardElements.length) {
    throw new Error('Tidak ada kartu untuk diunduh.');
  }

  const zip = new JSZip();
  const folder = zip.folder('ID_Cards_FASI_XIII') || zip;
  const total = cardElements.length;
  const usedNames = new Map<string, number>();

  for (let i = 0; i < total; i++) {
    if (onProgress) onProgress(i + 1, total);
    const el = cardElements[i];
    const rawName = fileNames[i] || `ID_Card_${i + 1}`;
    let safeName = rawName.replace(/[/\\?%*:|"<>]/g, '_') + '.png';

    // Mencegah duplikasi nama file di dalam zip
    if (usedNames.has(safeName)) {
      const count = usedNames.get(safeName)! + 1;
      usedNames.set(safeName, count);
      safeName = safeName.replace(/\.png$/i, `_${count}.png`);
    } else {
      usedNames.set(safeName, 1);
    }

    const dataUrl = await captureCardToPngDataUrl(el);
    const binaryData = dataUrlToUint8Array(dataUrl);

    folder.file(safeName, binaryData);
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
