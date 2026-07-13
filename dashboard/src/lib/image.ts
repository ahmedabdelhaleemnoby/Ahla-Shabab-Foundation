/**
 * Client-side image intake for the demo Media Library. Downscales large images
 * on a canvas and re-encodes them so base64 blobs stay small enough for
 * localStorage. SVGs are kept as-is (already tiny). No server involved.
 */

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // reject originals over 5 MB
export const MAX_STORED_BYTES = 400 * 1024; // reject if still >400 KB after compression
const MAX_DIM = 1000; // longest edge after downscale
const JPEG_QUALITY = 0.72;

export interface ProcessedImage {
  src: string; // data URL
  type: 'image' | 'svg';
  width?: number;
  height?: number;
  sizeBytes: number;
}

function approxBytes(dataUrl: string): number {
  // base64 payload length → bytes (¾), good enough for a size gauge.
  const comma = dataUrl.indexOf(',');
  const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  return Math.round((b64.length * 3) / 4);
}

export function processImageFile(file: File): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_UPLOAD_BYTES) {
      reject(new Error('حجم الملف كبير جداً (الحد الأقصى 5 ميجابايت).'));
      return;
    }
    if (!file.type.startsWith('image/')) {
      reject(new Error('الملف ليس صورة.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('تعذّر قراءة الملف.'));
    reader.onload = () => {
      const dataUrl = String(reader.result ?? '');

      // SVGs: keep as-is (vector, already small).
      if (file.type === 'image/svg+xml') {
        const bytes = approxBytes(dataUrl);
        if (bytes > MAX_STORED_BYTES) return reject(new Error('ملف SVG كبير جداً للعرض التجريبي.'));
        return resolve({ src: dataUrl, type: 'svg', sizeBytes: bytes });
      }

      const img = new Image();
      img.onerror = () => reject(new Error('تعذّر فتح الصورة.'));
      img.onload = () => {
        const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('تعذّر معالجة الصورة.'));
        ctx.drawImage(img, 0, 0, w, h);
        const out = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
        const bytes = approxBytes(out);
        if (bytes > MAX_STORED_BYTES) {
          return reject(new Error('الصورة كبيرة بعد الضغط — جرّب صورة أصغر.'));
        }
        resolve({ src: out, type: 'image', width: w, height: h, sizeBytes: bytes });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export const humanSize = (bytes: number): string =>
  bytes < 1024 ? `${bytes} ب` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} ك.ب` : `${(bytes / 1024 / 1024).toFixed(2)} م.ب`;
