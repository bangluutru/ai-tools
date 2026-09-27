/**
 * Nhận biết GIF động: canvas chỉ vẽ được khung hình đầu tiên, nên cần cảnh báo.
 * Đếm số Image Descriptor (0x2C) khi duyệt đúng cấu trúc khối GIF89a/87a.
 * @param {Uint8Array} bytes
 * @returns {boolean}
 */
export function isAnimatedGif(bytes) {
  if (!bytes || bytes.length < 13) return false;
  const sig = String.fromCharCode(...bytes.slice(0, 6));
  if (sig !== 'GIF89a' && sig !== 'GIF87a') return false;

  let pos = 13;
  const flags = bytes[10];
  if (flags & 0x80) pos += 3 * (1 << ((flags & 0x07) + 1)); // global color table

  const skipSubBlocks = () => {
    while (pos < bytes.length) {
      const size = bytes[pos];
      pos += 1;
      if (size === 0) return;
      pos += size;
    }
  };

  let frames = 0;
  while (pos < bytes.length) {
    const block = bytes[pos];
    if (block === 0x3b) break; // trailer
    if (block === 0x21) {
      pos += 2; // introducer + label
      skipSubBlocks();
    } else if (block === 0x2c) {
      frames += 1;
      if (frames > 1) return true;
      const localFlags = bytes[pos + 9];
      pos += 10;
      if (localFlags & 0x80) pos += 3 * (1 << ((localFlags & 0x07) + 1));
      pos += 1; // LZW minimum code size
      skipSubBlocks();
    } else {
      break; // dữ liệu hỏng: dừng an toàn
    }
  }
  return false;
}

export function looksLikeGif(file) {
  return file?.type === 'image/gif' || /\.gif$/i.test(file?.name || '');
}
