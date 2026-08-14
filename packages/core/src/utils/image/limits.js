export const IMAGE_LIMITS = Object.freeze({
  maxFiles: 50,
  maxFileBytes: 25 * 1024 * 1024,
  maxTotalBytes: 100 * 1024 * 1024,
  maxPixels: 40_000_000,
});

export const SUPPORTED_IMAGE_EXTENSIONS = Object.freeze([
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.gif',
]);

function extensionOf(name) {
  const dotIndex = name.lastIndexOf('.');
  return dotIndex >= 0 ? name.slice(dotIndex).toLowerCase() : '';
}

export function validateImageFiles(files, existingItems = [], limits = IMAGE_LIMITS) {
  const accepted = [];
  const rejected = [];
  const existingBytes = existingItems.reduce(
    (sum, item) => sum + (item.originalSize || item.originalFile?.size || 0),
    0,
  );
  let totalBytes = existingBytes;
  let totalCount = existingItems.length;

  for (const file of files) {
    const extension = extensionOf(file.name || '');
    let reason = '';

    if (!SUPPORTED_IMAGE_EXTENSIONS.includes(extension)) {
      reason = 'Định dạng chưa được hỗ trợ ổn định';
    } else if (file.size <= 0) {
      reason = 'File rỗng';
    } else if (file.size > limits.maxFileBytes) {
      reason = `Vượt giới hạn ${Math.round(limits.maxFileBytes / 1024 / 1024)} MiB/file`;
    } else if (totalCount + 1 > limits.maxFiles) {
      reason = `Vượt giới hạn ${limits.maxFiles} file/lần làm việc`;
    } else if (totalBytes + file.size > limits.maxTotalBytes) {
      reason = `Vượt tổng dung lượng ${Math.round(limits.maxTotalBytes / 1024 / 1024)} MiB`;
    }

    if (reason) {
      rejected.push({ file, reason });
    } else {
      accepted.push(file);
      totalCount += 1;
      totalBytes += file.size;
    }
  }

  return { accepted, rejected };
}
