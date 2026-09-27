/**
 * Format bytes to human readable string (KB, MB, GB)
 * @param {number} bytes 
 * @param {number} decimals 
 * @returns {string}
 */
export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0 || !bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Calculate saved percentage.
 * Dương = nhỏ đi, ÂM = tệp to lên (trước đây bị kẹp về 0 nên tệp phình to vẫn hiện "0%").
 * @param {number} originalSize 
 * @param {number} newSize 
 * @returns {number} Percentage saved (negative when the output is larger)
 */
export function calculateSavedPercent(originalSize, newSize) {
  if (!originalSize || !newSize || originalSize <= 0) return 0;
  const diff = originalSize - newSize;
  const percent = (diff / originalSize) * 100;
  return Math.round(percent * 10) / 10;
}

/**
 * Nhãn thay đổi dung lượng: "-42.5%" (nhỏ đi), "+12%" (to lên), "0%".
 * @param {number} savedPercent giá trị từ calculateSavedPercent
 */
export function formatSizeChange(savedPercent) {
  const n = Number(savedPercent) || 0;
  if (n > 0) return `-${n}%`;
  if (n < 0) return `+${Math.abs(n)}%`;
  return '0%';
}
