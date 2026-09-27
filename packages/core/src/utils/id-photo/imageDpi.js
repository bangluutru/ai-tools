/**
 * Ghi thông tin DPI vào tệp ảnh xuất ra (JPEG JFIF APP0 / PNG pHYs) để phần mềm in
 * và máy in tại cửa hàng tiện lợi hiểu đúng kích thước vật lý.
 *
 * Các hàm *Bytes là hàm thuần (Uint8Array → Uint8Array), chạy được trong Node để kiểm thử.
 */

// ---------------------------------------------------------------------------
// JPEG — JFIF APP0 (JFIF 1.02 spec)
//   p     : 0xFF   p+1 : 0xE0 (APP0 marker)
//   p+2.3 : segment length (big-endian, includes these 2 bytes, excludes marker)
//   p+4..8: "JFIF\0"
//   p+9   : major version, p+10: minor version
//   p+11  : density units (0 = aspect ratio only, 1 = dots/inch, 2 = dots/cm)
//   p+12.13: X density, p+14.15: Y density
//   p+16  : X thumbnail, p+17: Y thumbnail
// ---------------------------------------------------------------------------

const JFIF_ID = [0x4a, 0x46, 0x49, 0x46, 0x00];

function isJfifApp0(bytes, p) {
  if (bytes[p] !== 0xff || bytes[p + 1] !== 0xe0) return false;
  for (let i = 0; i < JFIF_ID.length; i++) {
    if (bytes[p + 4 + i] !== JFIF_ID[i]) return false;
  }
  return true;
}

/** Tìm vị trí marker APP0 JFIF bằng cách duyệt theo segment (không quét mù từng byte). */
export function findJfifApp0(bytes) {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return -1;
  let p = 2;
  while (p + 4 <= bytes.length) {
    if (bytes[p] !== 0xff) return -1;
    const marker = bytes[p + 1];
    // SOS / EOI: hết phần header
    if (marker === 0xda || marker === 0xd9) return -1;
    const len = (bytes[p + 2] << 8) | bytes[p + 3];
    if (marker === 0xe0 && isJfifApp0(bytes, p)) return p;
    if (len < 2) return -1;
    p += 2 + len;
  }
  return -1;
}

/** Đọc lại thông tin mật độ từ header JFIF (dùng cho kiểm thử). */
export function readJfifDensity(bytes) {
  const p = findJfifApp0(bytes);
  if (p < 0) return null;
  return {
    offset: p,
    units: bytes[p + 11],
    xDensity: (bytes[p + 12] << 8) | bytes[p + 13],
    yDensity: (bytes[p + 14] << 8) | bytes[p + 15],
  };
}

export function setJpegDpiBytes(input, dpi = 300) {
  const bytes = new Uint8Array(input);
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return bytes;
  const d = Math.max(1, Math.min(65535, Math.round(dpi)));
  const p = findJfifApp0(bytes);
  if (p >= 0 && p + 16 <= bytes.length) {
    bytes[p + 11] = 1;
    bytes[p + 12] = (d >> 8) & 0xff;
    bytes[p + 13] = d & 0xff;
    bytes[p + 14] = (d >> 8) & 0xff;
    bytes[p + 15] = d & 0xff;
    return bytes;
  }
  // Không có APP0 JFIF: chèn ngay sau SOI
  const app0 = new Uint8Array([
    0xff, 0xe0, 0x00, 0x10, ...JFIF_ID, 0x01, 0x02, 0x01,
    (d >> 8) & 0xff, d & 0xff, (d >> 8) & 0xff, d & 0xff, 0x00, 0x00,
  ]);
  const out = new Uint8Array(bytes.length + app0.length);
  out.set(bytes.subarray(0, 2), 0);
  out.set(app0, 2);
  out.set(bytes.subarray(2), 2 + app0.length);
  return out;
}

// ---------------------------------------------------------------------------
// PNG — pHYs chunk (PNG spec §11.3.5.3): X ppu (4), Y ppu (4), unit (1 = metre)
// ---------------------------------------------------------------------------

const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
let crcTable = null;

function crc32(bytes) {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) crc = crcTable[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function readU32(bytes, p) {
  return ((bytes[p] << 24) | (bytes[p + 1] << 16) | (bytes[p + 2] << 8) | bytes[p + 3]) >>> 0;
}

function writeU32(bytes, p, v) {
  bytes[p] = (v >>> 24) & 0xff;
  bytes[p + 1] = (v >>> 16) & 0xff;
  bytes[p + 2] = (v >>> 8) & 0xff;
  bytes[p + 3] = v & 0xff;
}

function isPng(bytes) {
  return bytes.length > 8 && PNG_SIG.every((b, i) => bytes[i] === b);
}

/** Liệt kê chunk PNG: [{type, offset, length}] (offset = vị trí trường length). */
export function listPngChunks(bytes) {
  const chunks = [];
  if (!isPng(bytes)) return chunks;
  let p = 8;
  while (p + 12 <= bytes.length) {
    const length = readU32(bytes, p);
    const type = String.fromCharCode(bytes[p + 4], bytes[p + 5], bytes[p + 6], bytes[p + 7]);
    chunks.push({ type, offset: p, length });
    p += 12 + length;
    if (type === 'IEND') break;
  }
  return chunks;
}

export function readPngPhys(bytes) {
  const chunk = listPngChunks(bytes).find((c) => c.type === 'pHYs');
  if (!chunk) return null;
  const d = chunk.offset + 8;
  const typeAndData = bytes.subarray(chunk.offset + 4, chunk.offset + 8 + chunk.length);
  return {
    xPpm: readU32(bytes, d),
    yPpm: readU32(bytes, d + 4),
    unit: bytes[d + 8],
    crcValid: crc32(typeAndData) === readU32(bytes, chunk.offset + 8 + chunk.length),
  };
}

export function setPngDpiBytes(input, dpi = 300) {
  const bytes = new Uint8Array(input);
  if (!isPng(bytes)) return bytes;
  const ppm = Math.round(dpi / 0.0254);
  const chunk = new Uint8Array(21);
  writeU32(chunk, 0, 9);
  chunk.set([0x70, 0x48, 0x59, 0x73], 4); // "pHYs"
  writeU32(chunk, 8, ppm);
  writeU32(chunk, 12, ppm);
  chunk[16] = 1;
  writeU32(chunk, 17, crc32(chunk.subarray(4, 17)));

  const chunks = listPngChunks(bytes);
  const existing = chunks.find((c) => c.type === 'pHYs');
  const idat = chunks.find((c) => c.type === 'IDAT');
  if (!idat) return bytes;
  const cutStart = existing ? existing.offset : idat.offset;
  const cutEnd = existing ? existing.offset + 12 + existing.length : idat.offset;
  const out = new Uint8Array(bytes.length - (cutEnd - cutStart) + chunk.length);
  out.set(bytes.subarray(0, cutStart), 0);
  out.set(chunk, cutStart);
  out.set(bytes.subarray(cutEnd), cutStart + chunk.length);
  return out;
}

// ---------------------------------------------------------------------------
// Blob wrappers (browser)
// ---------------------------------------------------------------------------

export async function setJpegDpi(blob, dpi = 300) {
  try {
    const buf = await blob.arrayBuffer();
    return new Blob([setJpegDpiBytes(new Uint8Array(buf), dpi)], { type: 'image/jpeg' });
  } catch {
    return blob;
  }
}

export async function setPngDpi(blob, dpi = 300) {
  try {
    const buf = await blob.arrayBuffer();
    return new Blob([setPngDpiBytes(new Uint8Array(buf), dpi)], { type: 'image/png' });
  } catch {
    return blob;
  }
}
