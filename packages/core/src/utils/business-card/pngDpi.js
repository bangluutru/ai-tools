/**
 * PNG pHYs (DPI) writer for business-card proof images.
 * NOTE: mirrors utils/id-photo/imageDpi.js (kept separate because miniapps must not import each
 * other's internal utils — see scripts/lib/ai-tools-graph/rules.mjs). A shared utils/imageDpi.js
 * would remove the duplication.
 */
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
function listPngChunks(bytes) {
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

