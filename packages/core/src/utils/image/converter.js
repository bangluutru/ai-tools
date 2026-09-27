import { calculateSavedPercent } from './formatters.js';
import { isAnimatedGif, looksLikeGif } from './gif.js';
import { IMAGE_LIMITS, getMaxCanvasPixels } from './limits.js';

export const SUPPORTED_TARGET_FORMATS = Object.freeze({
  webp: { mime: 'image/webp', ext: '.webp', label: 'WebP' },
  avif: { mime: 'image/avif', ext: '.avif', label: 'AVIF' },
  jpg: { mime: 'image/jpeg', ext: '.jpg', label: 'JPEG' },
  jpeg: { mime: 'image/jpeg', ext: '.jpg', label: 'JPEG' },
  // Chỉ xuất hiện khi trình duyệt tự đổi định dạng (vd Safari trả PNG khi xin WebP).
  png: { mime: 'image/png', ext: '.png', label: 'PNG' },
});

const MIME_TO_FORMAT = Object.freeze({
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
});

/** Định dạng thật của một Blob theo MIME (null nếu không nhận ra). */
export function formatFromMime(mime) {
  return MIME_TO_FORMAT[String(mime || '').split(';')[0].trim().toLowerCase()] || null;
}

/**
 * Checks if the browser's HTML5 Canvas natively supports encoding to a given MIME type
 * @param {string} mime
 * @returns {boolean}
 */
export function isCanvasMimeSupported(mime) {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL(mime).startsWith(`data:${mime}`);
  } catch {
    return false;
  }
}

/**
 * Khả năng mã hoá của trình duyệt hiện tại, để giao diện tắt lựa chọn không dùng được.
 * AVIF: canvas gốc (hiếm) hoặc WebCodecs (Chromium) — WebCodecs vẫn có thể thất bại
 * lúc chạy, khi đó kết quả mang `fallbackFrom: 'avif'`.
 */
export function getEncoderSupport() {
  return {
    webp: isCanvasMimeSupported('image/webp'),
    jpg: true,
    avif: isCanvasMimeSupported('image/avif') || typeof VideoEncoder !== 'undefined',
  };
}

/**
 * Kích thước canvas đích: áp dụng giới hạn người dùng rồi giới hạn pixel của thiết bị
 * (iOS ~16,7 MP). Trả `downscaledForDevice` nếu phải thu nhỏ thêm vì thiết bị.
 */
export function computeTargetDimensions(origWidth, origHeight, options = {}) {
  const { maxWidth = null, maxHeight = null, keepAspectRatio = true, maxCanvasPixels = Infinity } = options;
  let width = origWidth;
  let height = origHeight;

  if (maxWidth || maxHeight) {
    const reqMaxW = maxWidth ? parseInt(maxWidth, 10) : origWidth;
    const reqMaxH = maxHeight ? parseInt(maxHeight, 10) : origHeight;
    if (keepAspectRatio) {
      const ratio = Math.min(reqMaxW / origWidth, reqMaxH / origHeight);
      if (ratio < 1) {
        width = Math.round(origWidth * ratio);
        height = Math.round(origHeight * ratio);
      }
    } else {
      width = reqMaxW;
      height = reqMaxH;
    }
  }

  let downscaledForDevice = false;
  if (width * height > maxCanvasPixels) {
    const ratio = Math.sqrt(maxCanvasPixels / (width * height));
    width = Math.max(1, Math.floor(width * ratio));
    height = Math.max(1, Math.floor(height * ratio));
    downscaledForDevice = true;
  }
  return { width, height, downscaledForDevice };
}

function toBlobAsync(canvas, mime, quality) {
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), mime, quality);
  });
}

/**
 * Encodes a canvas element to a Blob with support for WebP, AVIF, and JPEG.
 * Luôn đọc `blob.type`: Safari trả PNG khi xin WebP thay vì trả null, nên
 * định dạng/đuôi tệp phải theo MIME thật chứ không theo lựa chọn.
 * @param {HTMLCanvasElement} canvas
 * @param {string} targetFormat - 'webp' | 'avif' | 'jpg' | 'jpeg'
 * @param {number} quality - 0.01 to 1.0
 * @returns {Promise<{ blob: Blob, actualFormat: string, actualMime: string, fallbackFrom?: string }>}
 */
export async function encodeCanvasToBlob(canvas, targetFormat, quality) {
  const fmtKey = String(targetFormat || 'webp').toLowerCase();
  const normalizedQuality = Math.min(1, Math.max(0.01, Number(quality) || 0.85));
  const requested = fmtKey === 'jpeg' ? 'jpg' : fmtKey;

  const describe = (blob, fallbackFrom) => {
    const actualFormat = formatFromMime(blob.type) || 'png';
    const result = {
      blob,
      actualFormat,
      actualMime: SUPPORTED_TARGET_FORMATS[actualFormat].mime,
    };
    const from = fallbackFrom || (actualFormat !== requested ? requested : null);
    if (from) result.fallbackFrom = from;
    return result;
  };

  // 1. AVIF Format
  if (fmtKey === 'avif') {
    // A. Native canvas toBlob('image/avif') if supported by browser
    if (isCanvasMimeSupported('image/avif')) {
      const nativeBlob = await toBlobAsync(canvas, 'image/avif', normalizedQuality);
      if (nativeBlob && nativeBlob.type === 'image/avif') {
        return { blob: nativeBlob, actualFormat: 'avif', actualMime: 'image/avif' };
      }
    }

    // B. WebCodecs hardware/software AV1 encoder (Chrome, Edge, Chromium)
    if (typeof VideoEncoder !== 'undefined') {
      try {
        const { encodeImageToAvif } = await import('@browser-mc/webcodecs-avif');
        const avifBytes = await encodeImageToAvif(canvas, {
          quality: normalizedQuality,
          alpha: 'keep',
        });
        if (avifBytes && avifBytes.byteLength > 0) {
          const blob = new Blob([avifBytes], { type: 'image/avif' });
          return { blob, actualFormat: 'avif', actualMime: 'image/avif' };
        }
      } catch (err) {
        console.warn('WebCodecs AVIF encoder failed, falling back to WebP:', err);
      }
    }

    // C. Fallback to WebP (or whatever the browser actually produces)
    const fallbackBlob = await toBlobAsync(canvas, 'image/webp', normalizedQuality);
    if (fallbackBlob) return describe(fallbackBlob, 'avif');
    throw new Error('Không thể mã hoá ảnh (AVIF/WebP) từ canvas');
  }

  // 2. JPEG Format
  if (fmtKey === 'jpg' || fmtKey === 'jpeg') {
    const jpegBlob = await toBlobAsync(canvas, 'image/jpeg', normalizedQuality);
    if (!jpegBlob) throw new Error('Không thể tạo file JPEG từ canvas');
    return describe(jpegBlob);
  }

  // 3. WebP Format (Default)
  const webpBlob = await toBlobAsync(canvas, 'image/webp', normalizedQuality);
  if (!webpBlob) throw new Error('Không thể tạo file WebP từ canvas');
  return describe(webpBlob);
}

async function detectAnimatedGif(file) {
  if (!looksLikeGif(file) || typeof file.arrayBuffer !== 'function') return false;
  try {
    return isAnimatedGif(new Uint8Array(await file.arrayBuffer()));
  } catch {
    return false;
  }
}

/**
 * Converts an Image File to WebP, AVIF, or JPEG format using Browser Canvas & WebCodecs APIs
 * @param {File} file - Source Image File
 * @param {Object} options - Conversion settings
 * @param {string} [options.targetFormat='webp'] - Target format: 'webp' | 'avif' | 'jpg' | 'jpeg'
 * @param {number} [options.quality=0.85] - Compression Quality (0.01 to 1.0)
 * @param {number|null} [options.maxWidth=null] - Max width limit
 * @param {number|null} [options.maxHeight=null] - Max height limit
 * @param {boolean} [options.keepAspectRatio=true] - Keep aspect ratio when resizing
 * @param {string|null} [options.fillColor=null] - Background color for transparent images (defaults to #FFFFFF for JPEG)
 * @returns {Promise<Object>} Converted result
 */
export async function convertImage(file, options = {}) {
  const {
    targetFormat = 'webp',
    quality = 0.85,
    maxWidth = null,
    maxHeight = null,
    keepAspectRatio = true,
    fillColor = null,
  } = options;

  if (!file || file.size <= 0) {
    throw new Error('File ảnh rỗng hoặc không hợp lệ');
  }
  if (file.size > IMAGE_LIMITS.maxFileBytes) {
    throw new Error(`Ảnh vượt giới hạn ${Math.round(IMAGE_LIMITS.maxFileBytes / 1024 / 1024)} MiB`);
  }

  const animatedSource = await detectAnimatedGif(file);

  return new Promise((resolve, reject) => {
    const sourceUrl = URL.createObjectURL(file);
    const cleanupAndReject = (error) => {
      URL.revokeObjectURL(sourceUrl);
      reject(error);
    };

    const img = new Image();

    img.onerror = () => cleanupAndReject(new Error('Định dạng ảnh không được hỗ trợ hoặc file bị hỏng'));

    img.onload = async () => {
      try {
        const origWidth = img.naturalWidth || img.width;
        const origHeight = img.naturalHeight || img.height;
        if (!origWidth || !origHeight) {
          throw new Error('Không đọc được kích thước ảnh');
        }
        if (origWidth * origHeight > IMAGE_LIMITS.maxPixels) {
          throw new Error(`Ảnh vượt giới hạn ${IMAGE_LIMITS.maxPixels.toLocaleString('vi-VN')} pixel`);
        }

        const {
          width: targetWidth,
          height: targetHeight,
          downscaledForDevice,
        } = computeTargetDimensions(origWidth, origHeight, {
          maxWidth,
          maxHeight,
          keepAspectRatio,
          maxCanvasPixels: getMaxCanvasPixels(),
        });

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) throw new Error('Trình duyệt không tạo được canvas 2D');

        const fmtKey = String(targetFormat || 'webp').toLowerCase();

        // Fill background if explicitly specified OR if target is JPEG (avoids black transparent background)
        if (fillColor || fmtKey === 'jpg' || fmtKey === 'jpeg') {
          ctx.fillStyle = fillColor || '#FFFFFF';
          ctx.fillRect(0, 0, targetWidth, targetHeight);
        }

        // Image smoothing for high quality resizing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw image on canvas
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // Encode to desired format Blob
        let encoded;
        try {
          encoded = await encodeCanvasToBlob(canvas, targetFormat, quality);
        } finally {
          // Giải phóng bộ nhớ canvas ngay (iOS giới hạn tổng bộ nhớ canvas).
          canvas.width = 0;
          canvas.height = 0;
        }
        const { blob, actualFormat, actualMime, fallbackFrom } = encoded;

        URL.revokeObjectURL(sourceUrl);
        img.src = '';

        const formatMeta = SUPPORTED_TARGET_FORMATS[actualFormat] || SUPPORTED_TARGET_FORMATS.webp;
        const lastDotIndex = file.name.lastIndexOf('.');
        const nameWithoutExt = lastDotIndex > 0 ? file.name.substring(0, lastDotIndex) : file.name;
        const outputFilename = `${nameWithoutExt}${formatMeta.ext}`;
        const outputUrl = URL.createObjectURL(blob);
        const originalSize = file.size;
        const outputSize = blob.size;
        const savedBytes = Math.max(0, originalSize - outputSize);
        const savedPercent = calculateSavedPercent(originalSize, outputSize);

        resolve({
          id: Math.random().toString(36).substring(2, 9),
          originalFile: file,
          originalName: file.name,
          originalSize,
          originalType: file.type || 'image',
          originalDimensions: { width: origWidth, height: origHeight },
          targetFormat: actualFormat,
          targetMimeType: actualMime,
          outputBlob: blob,
          outputUrl,
          outputFilename,
          outputSize,
          // Backwards compatibility aliases for existing consumers
          webpBlob: blob,
          webpUrl: outputUrl,
          webpFilename: outputFilename,
          webpSize: outputSize,
          targetDimensions: { width: targetWidth, height: targetHeight },
          savedBytes,
          savedPercent,
          savings: savedPercent,
          status: 'completed',
          fallbackFrom: fallbackFrom || null,
          // GIF động: canvas chỉ lấy khung hình đầu tiên.
          animatedSourceFlattened: animatedSource,
          // Ảnh bị thu nhỏ thêm vì giới hạn canvas của thiết bị (iOS ~16,7 MP).
          downscaledForDevice,
          convertedAt: new Date(),
        });
      } catch (err) {
        cleanupAndReject(err);
      }
    };

    img.src = sourceUrl;
  });
}

/**
 * Backwards compatibility wrapper: Converts an Image File to WebP format
 * @param {File} file
 * @param {Object} options
 * @returns {Promise<Object>}
 */
export async function convertImageToWebP(file, options = {}) {
  return convertImage(file, { ...options, targetFormat: 'webp' });
}
