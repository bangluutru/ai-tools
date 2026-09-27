import {
  IMAGE_CONVERT_LIMITS,
  validateDocumentFiles,
} from '../documentFiles.js';

/**
 * Miniapp Chuyển đổi ảnh từng có bản kiểm tra riêng, gần như trùng hoàn toàn
 * với bộ dùng chung nhưng lệch câu chữ báo lỗi. Giờ nó uỷ thác cho một nguồn
 * duy nhất; phần còn lại ở đây là thứ chỉ ảnh mới có.
 */
export const IMAGE_LIMITS = IMAGE_CONVERT_LIMITS;

export const SUPPORTED_IMAGE_EXTENSIONS = IMAGE_CONVERT_LIMITS.extensions;

/**
 * Safari/WebKit trên iOS/iPadOS giới hạn một canvas ở 16 777 216 pixel (4096²);
 * vượt quá thì canvas trắng hoặc toBlob trả null. Máy tính không có giới hạn này
 * ở mức 40 MP của công cụ.
 */
export const IOS_MAX_CANVAS_PIXELS = 16_777_216;

export function isIOSLike(nav = typeof navigator !== 'undefined' ? navigator : undefined) {
  if (!nav) return false;
  const ua = nav.userAgent || '';
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  // iPadOS 13+ tự nhận là "Macintosh" nhưng có màn hình cảm ứng.
  return /Macintosh/.test(ua) && (nav.maxTouchPoints || 0) > 1;
}

export function getMaxCanvasPixels(nav) {
  return isIOSLike(nav) ? IOS_MAX_CANVAS_PIXELS : IMAGE_LIMITS.maxPixels;
}

/**
 * Danh sách đang có là các item đã nạp, mang dung lượng ở `originalSize` hoặc
 * `originalFile.size`, nên quy về dạng {size} trước khi đưa vào bộ dùng chung.
 */
export function validateImageFiles(files, existingItems = [], limits = IMAGE_LIMITS) {
  const existingFiles = existingItems.map((item) => ({
    size: item.originalSize || item.originalFile?.size || 0,
  }));

  return validateDocumentFiles(files, existingFiles, limits);
}
