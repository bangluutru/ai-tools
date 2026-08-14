import { calculateSavedPercent } from './formatters.js';
import { IMAGE_LIMITS } from './limits.js';

/**
 * Converts an Image File to WebP format using Browser HTML5 Canvas API
 * @param {File} file - Source Image File
 * @param {Object} options - Conversion settings
 * @param {number} options.quality - WebP Quality (0.01 to 1.0)
 * @param {number|null} options.maxWidth - Max width limit
 * @param {number|null} options.maxHeight - Max height limit
 * @param {boolean} options.keepAspectRatio - Keep aspect ratio when resizing
 * @param {string|null} options.fillColor - Background color for transparent images
 * @returns {Promise<Object>} Converted result
 */
export async function convertImageToWebP(file, options = {}) {
  const {
    quality = 0.8,
    maxWidth = null,
    maxHeight = null,
    keepAspectRatio = true,
    fillColor = null
  } = options;

  if (!file || file.size <= 0) {
    throw new Error('File ảnh rỗng hoặc không hợp lệ');
  }
  if (file.size > IMAGE_LIMITS.maxFileBytes) {
    throw new Error(`Ảnh vượt giới hạn ${Math.round(IMAGE_LIMITS.maxFileBytes / 1024 / 1024)} MiB`);
  }

  const normalizedQuality = Math.min(1, Math.max(0.01, Number(quality) || 0.8));

  return new Promise((resolve, reject) => {
    const sourceUrl = URL.createObjectURL(file);
    const cleanupAndReject = (error) => {
      URL.revokeObjectURL(sourceUrl);
      reject(error);
    };
      const img = new Image();

      img.onerror = () => cleanupAndReject(new Error('Định dạng ảnh không được hỗ trợ hoặc file bị hỏng'));

      img.onload = () => {
        try {
          const origWidth = img.naturalWidth || img.width;
          const origHeight = img.naturalHeight || img.height;
          if (!origWidth || !origHeight) {
            throw new Error('Không đọc được kích thước ảnh');
          }
          if (origWidth * origHeight > IMAGE_LIMITS.maxPixels) {
            throw new Error(`Ảnh vượt giới hạn ${IMAGE_LIMITS.maxPixels.toLocaleString('vi-VN')} pixel`);
          }

          let targetWidth = origWidth;
          let targetHeight = origHeight;

          // Handle resizing
          if (maxWidth || maxHeight) {
            const reqMaxW = maxWidth ? parseInt(maxWidth, 10) : origWidth;
            const reqMaxH = maxHeight ? parseInt(maxHeight, 10) : origHeight;

            if (keepAspectRatio) {
              const ratio = Math.min(reqMaxW / origWidth, reqMaxH / origHeight);
              if (ratio < 1) {
                targetWidth = Math.round(origWidth * ratio);
                targetHeight = Math.round(origHeight * ratio);
              }
            } else {
              targetWidth = reqMaxW;
              targetHeight = reqMaxH;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;

          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) throw new Error('Trình duyệt không tạo được canvas 2D');

          // Fill background if specified
          if (fillColor) {
            ctx.fillStyle = fillColor;
            ctx.fillRect(0, 0, targetWidth, targetHeight);
          }

          // Image smoothing for high quality resizing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Draw image on canvas
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

          // Convert canvas to WebP blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                cleanupAndReject(new Error('Không thể tạo file WebP từ canvas'));
                return;
              }

              URL.revokeObjectURL(sourceUrl);

              const webpUrl = URL.createObjectURL(blob);
              const originalSize = file.size;
              const webpSize = blob.size;
              const savedBytes = Math.max(0, originalSize - webpSize);
              const savedPercent = calculateSavedPercent(originalSize, webpSize);

              // Extract filename without extension
              const lastDotIndex = file.name.lastIndexOf('.');
              const nameWithoutExt = lastDotIndex > 0 ? file.name.substring(0, lastDotIndex) : file.name;
              const webpFilename = `${nameWithoutExt}.webp`;

              resolve({
                id: Math.random().toString(36).substring(2, 9),
                originalFile: file,
                originalName: file.name,
                originalSize,
                originalType: file.type || 'image',
                originalDimensions: { width: origWidth, height: origHeight },
                webpBlob: blob,
                webpUrl,
                webpFilename,
                webpSize,
                targetDimensions: { width: targetWidth, height: targetHeight },
                savedBytes,
                savedPercent,
                status: 'completed',
                convertedAt: new Date()
              });
            },
            'image/webp',
            normalizedQuality
          );
        } catch (err) {
          cleanupAndReject(err);
        }
      };

      img.src = sourceUrl;
  });
}
