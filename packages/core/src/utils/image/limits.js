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
 * Danh sách đang có là các item đã nạp, mang dung lượng ở `originalSize` hoặc
 * `originalFile.size`, nên quy về dạng {size} trước khi đưa vào bộ dùng chung.
 */
export function validateImageFiles(files, existingItems = [], limits = IMAGE_LIMITS) {
  const existingFiles = existingItems.map((item) => ({
    size: item.originalSize || item.originalFile?.size || 0,
  }));

  return validateDocumentFiles(files, existingFiles, limits);
}
