import { calculateSavedPercent } from './formatters.js';

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

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Lỗi khi đọc file ảnh'));

    reader.onload = (e) => {
      const img = new Image();

      img.onerror = () => reject(new Error('Định dạng ảnh không được hỗ trợ hoặc file bị hỏng'));

      img.onload = () => {
        try {
          let origWidth = img.naturalWidth || img.width;
          let origHeight = img.naturalHeight || img.height;

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
                reject(new Error('Không thể tạo file WebP từ canvas'));
                return;
              }

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
                originalUrl: e.target.result,
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
            quality
          );
        } catch (err) {
          reject(err);
        }
      };

      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  });
}
