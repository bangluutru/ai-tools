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
 * Calculate saved percentage
 * @param {number} originalSize 
 * @param {number} newSize 
 * @returns {number} Percentage saved
 */
export function calculateSavedPercent(originalSize, newSize) {
  if (!originalSize || !newSize || originalSize <= 0) return 0;
  const diff = originalSize - newSize;
  const percent = (diff / originalSize) * 100;
  return Math.max(0, Math.round(percent * 10) / 10);
}
