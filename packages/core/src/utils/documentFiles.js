const MIB = 1024 * 1024;

export const EXCEL_FILE_LIMITS = Object.freeze({
  maxFiles: 3,
  maxFileBytes: 20 * MIB,
  maxTotalBytes: 60 * MIB,
  extensions: ['.xlsx', '.xls'],
});

export const PDF_SPLIT_LIMITS = Object.freeze({
  maxFiles: 1,
  maxFileBytes: 50 * MIB,
  maxTotalBytes: 50 * MIB,
  maxPages: 200,
  extensions: ['.pdf'],
});

export const PDF_MERGE_LIMITS = Object.freeze({
  maxFiles: 20,
  maxFileBytes: 50 * MIB,
  maxTotalBytes: 200 * MIB,
  maxPages: 500,
  extensions: ['.pdf'],
});

export const PDF_COMPRESS_LIMITS = Object.freeze({
  maxFiles: 20,
  maxFileBytes: 100 * MIB,
  maxTotalBytes: 300 * MIB,
  extensions: ['.pdf'],
});

export const CONVERT_LIMITS = Object.freeze({
  maxFiles: 20,
  maxFileBytes: 50 * MIB,
  maxTotalBytes: 200 * MIB,
  extensions: ['.docx', '.pptx', '.xlsx', '.pdf', '.png', '.jpg', '.jpeg', '.webp', '.svg'],
});

/** Ảnh đơn lẻ dùng làm đầu vào: logo mã QR, ảnh nạp vào trình chú thích. */
export const IMAGE_INPUT_LIMITS = Object.freeze({
  maxFiles: 1,
  maxFileBytes: 15 * MIB,
  maxTotalBytes: 15 * MIB,
  extensions: ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'],
});

function extensionOf(name = '') {
  const dotIndex = name.lastIndexOf('.');
  return dotIndex >= 0 ? name.slice(dotIndex).toLowerCase() : '';
}

export function formatMiB(bytes) {
  return Math.round(bytes / MIB);
}

export function validateDocumentFiles(files, existingFiles = [], limits) {
  const accepted = [];
  const rejected = [];
  let totalCount = existingFiles.length;
  let totalBytes = existingFiles.reduce((sum, file) => sum + (file.size || 0), 0);

  for (const file of files) {
    let reason = '';
    if (!limits.extensions.includes(extensionOf(file.name))) {
      reason = `Chỉ hỗ trợ ${limits.extensions.join(', ')}`;
    } else if (!file.size || file.size <= 0) {
      reason = 'File rỗng';
    } else if (file.size > limits.maxFileBytes) {
      reason = `Vượt ${formatMiB(limits.maxFileBytes)} MiB/file`;
    } else if (totalCount + 1 > limits.maxFiles) {
      reason = `Vượt ${limits.maxFiles} file/lần xử lý`;
    } else if (totalBytes + file.size > limits.maxTotalBytes) {
      reason = `Vượt tổng ${formatMiB(limits.maxTotalBytes)} MiB`;
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

export function hasExpectedDocumentSignature(bytes, extension) {
  const ext = extension.toLowerCase();
  if (ext === '.pdf') {
    return bytes.length >= 5 && String.fromCharCode(...bytes.slice(0, 5)) === '%PDF-';
  }
  if (ext === '.xlsx') {
    return bytes.length >= 4
      && bytes[0] === 0x50
      && bytes[1] === 0x4b
      && (
        (bytes[2] === 0x03 && bytes[3] === 0x04)
        || (bytes[2] === 0x05 && bytes[3] === 0x06)
        || (bytes[2] === 0x07 && bytes[3] === 0x08)
      );
  }
  if (ext === '.docx' || ext === '.pptx') {
    // Cùng họ OOXML với .xlsx nên dùng chung chữ ký ZIP.
    return bytes.length >= 4
      && bytes[0] === 0x50
      && bytes[1] === 0x4b
      && (
        (bytes[2] === 0x03 && bytes[3] === 0x04)
        || (bytes[2] === 0x05 && bytes[3] === 0x06)
        || (bytes[2] === 0x07 && bytes[3] === 0x08)
      );
  }
  if (ext === '.png') {
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return signature.every((value, index) => bytes[index] === value);
  }
  if (ext === '.jpg' || ext === '.jpeg') {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (ext === '.gif') {
    return bytes.length >= 6 && String.fromCharCode(...bytes.slice(0, 6)).startsWith('GIF8');
  }
  if (ext === '.webp') {
    // RIFF....WEBP — bốn byte kích thước nằm giữa nên cần 12 byte đầu.
    return bytes.length >= 12
      && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF'
      && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  }
  if (ext === '.svg') {
    // SVG là văn bản nên không có magic byte cố định; chấp nhận theo phần mở rộng.
    return true;
  }
  if (ext === '.xls') {
    const signature = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];
    return signature.every((value, index) => bytes[index] === value);
  }
  return false;
}

export async function verifyDocumentSignature(file) {
  const extension = extensionOf(file.name);
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  return hasExpectedDocumentSignature(bytes, extension);
}

export function rejectionMessages(rejected) {
  return rejected.map(({ file, reason }) => `${file.name}: ${reason}`);
}
