/**
 * Logic nén PDF (không phụ thuộc React/DOM) để kiểm thử bằng node.
 *
 * Cách làm giống các công cụ nén PDF phổ biến: chữ và vector giữ nguyên, chỉ
 * giảm dung lượng phần nặng nhất của tệp:
 *   1. Ảnh nhúng: hạ độ phân giải xuống mức DPI đích theo kích thước ảnh được
 *      hiển thị thật trên trang, rồi nén lại JPEG. Ảnh quá nhỏ hoặc nén xong
 *      không nhẹ hơn thì giữ nguyên bản gốc.
 *   2. Luồng dữ liệu chưa nén (nội dung trang, ảnh thô) được nén Flate.
 *   3. Xóa đối tượng mồ côi (bản sửa đổi cũ, ảnh không còn được dùng) và ảnh
 *      thu nhỏ trang (/Thumb), lưu với object streams.
 * Không bao giờ trả về tệp lớn hơn tệp gốc.
 *
 * Nhận module pdf-lib và bộ codec ảnh/nén qua tham số nên không kéo pdf-lib
 * hay canvas vào chunk ban đầu và kiểm thử được với codec giả.
 */

export const COMPRESS_PRESETS = Object.freeze({
  /** Giữ độ nét in ấn: chỉ giảm ảnh vượt 200 dpi. */
  light: Object.freeze({ id: 'light', targetDpi: 200, quality: 0.85 }),
  /** Mặc định: đủ nét để đọc và gửi email, giảm mạnh dung lượng. */
  balanced: Object.freeze({ id: 'balanced', targetDpi: 150, quality: 0.7 }),
  /** Nhỏ nhất: phù hợp xem trên màn hình. */
  strong: Object.freeze({ id: 'strong', targetDpi: 96, quality: 0.55 }),
});

export const DEFAULT_COMPRESS_PRESET = 'balanced';

/** Ảnh vượt ngưỡng này không giải mã thô (Flate) vì RGBA chiếm 4 byte/điểm ảnh. */
export const MAX_RAW_IMAGE_PIXELS = 40_000_000;

const MIN_IMAGE_STREAM_BYTES = 8 * 1024;
const MIN_IMAGE_PIXELS = 10_000;
/** Chỉ thay ảnh khi nhỏ hơn ít nhất 5%: nén lại JPEG đã nén sẵn thường không có lợi. */
const ACCEPT_RATIO = 0.95;
const MIN_PLAIN_STREAM_BYTES = 256;
/** Chỉ hạ độ phân giải khi giảm được trên 10%, tránh làm mờ vô ích. */
const RESAMPLE_THRESHOLD = 0.9;

export function resolvePreset(preset) {
  if (preset && typeof preset === 'object') return preset;
  return COMPRESS_PRESETS[preset] || COMPRESS_PRESETS[DEFAULT_COMPRESS_PRESET];
}

/**
 * Kích thước ảnh đích theo DPI hiển thị thật (dpiX/dpiY tính từ ma trận hiển thị).
 * Không có thông tin hiển thị thì giới hạn cạnh dài theo `fallbackLongPx`.
 * Không bao giờ phóng to.
 */
export function planImageSize({ width, height, dpiX, dpiY, fallbackLongPx, targetDpi }) {
  let sx = 1;
  let sy = 1;
  if (dpiX > 0 && dpiY > 0) {
    sx = Math.min(1, targetDpi / dpiX);
    sy = Math.min(1, targetDpi / dpiY);
  } else if (fallbackLongPx > 0) {
    sx = Math.min(1, fallbackLongPx / Math.max(width, height));
    sy = sx;
  }
  if (sx > RESAMPLE_THRESHOLD && sy > RESAMPLE_THRESHOLD) {
    return { width, height, resized: false };
  }
  return {
    width: Math.max(1, Math.round(width * sx)),
    height: Math.max(1, Math.round(height * sy)),
    resized: true,
  };
}

/** Bỏ bộ lọc dự đoán PNG (Predictor 10–15) của luồng Flate. */
export function undoPngPredictor(data, { colors, bpc, columns }) {
  const bpp = Math.max(1, Math.ceil((colors * bpc) / 8));
  const rowBytes = Math.ceil((colors * bpc * columns) / 8);
  const stride = rowBytes + 1;
  if (data.length % stride !== 0 && data.length < stride) throw new Error('PREDICTOR_DATA');
  const rows = Math.floor(data.length / stride);
  const out = new Uint8Array(rows * rowBytes);
  for (let r = 0; r < rows; r += 1) {
    const type = data[r * stride];
    const inOff = r * stride + 1;
    const outOff = r * rowBytes;
    const prevOff = outOff - rowBytes;
    for (let i = 0; i < rowBytes; i += 1) {
      const raw = data[inOff + i];
      const a = i >= bpp ? out[outOff + i - bpp] : 0;
      const b = r > 0 ? out[prevOff + i] : 0;
      const c = r > 0 && i >= bpp ? out[prevOff + i - bpp] : 0;
      let v;
      switch (type) {
        case 0: v = raw; break;
        case 1: v = raw + a; break;
        case 2: v = raw + b; break;
        case 3: v = raw + ((a + b) >> 1); break;
        case 4: {
          const p = a + b - c;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - b);
          const pc = Math.abs(p - c);
          v = raw + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
          break;
        }
        default: throw new Error('PREDICTOR_TYPE');
      }
      out[outOff + i] = v & 0xff;
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Nội dung trang: tìm kích thước hiển thị thật của từng ảnh
// ---------------------------------------------------------------------------

const IDENTITY = Object.freeze([1, 0, 0, 1, 0, 0]);

/** Nhân ma trận theo quy ước PDF: kết quả = A × B (A áp dụng trước). */
export function multiplyMatrix(A, B) {
  return [
    A[0] * B[0] + A[1] * B[2],
    A[0] * B[1] + A[1] * B[3],
    A[2] * B[0] + A[3] * B[2],
    A[2] * B[1] + A[3] * B[3],
    A[4] * B[0] + A[5] * B[2] + B[4],
    A[4] * B[1] + A[5] * B[3] + B[5],
  ];
}

const isWhite = (c) => c === 0 || c === 9 || c === 10 || c === 12 || c === 13 || c === 32;
const isDelimiter = (c) => c === 40 || c === 41 || c === 60 || c === 62 || c === 91 || c === 93
  || c === 123 || c === 125 || c === 47 || c === 37;
const NUMBER_RE = /^[+-]?(?:\d+\.?\d*|\.\d+)$/;

function skipString(bytes, start) {
  let i = start + 1;
  let depth = 1;
  while (i < bytes.length && depth > 0) {
    const c = bytes[i];
    if (c === 92) i += 2;
    else {
      if (c === 40) depth += 1;
      else if (c === 41) depth -= 1;
      i += 1;
    }
  }
  return i;
}

function skipInlineImage(bytes, start) {
  let i = start;
  // tìm "ID" tách biệt, rồi "EI" tách biệt
  while (i + 2 < bytes.length) {
    if (isWhite(bytes[i]) && bytes[i + 1] === 73 && bytes[i + 2] === 68
      && (i + 3 >= bytes.length || isWhite(bytes[i + 3]))) { i += 3; break; }
    i += 1;
  }
  while (i + 2 < bytes.length) {
    if (isWhite(bytes[i]) && bytes[i + 1] === 69 && bytes[i + 2] === 73
      && (i + 3 >= bytes.length || isWhite(bytes[i + 3]) || isDelimiter(bytes[i + 3]))) return i + 3;
    i += 1;
  }
  return bytes.length;
}

/**
 * Bộ tách toán tử luồng nội dung: trả về { op, operands } với operands là số,
 * { name } hoặc null (chuỗi/mảng/từ điển — không cần giá trị).
 */
export function* contentOperators(bytes) {
  const n = bytes.length;
  let i = 0;
  let operands = [];
  while (i < n) {
    const c = bytes[i];
    if (isWhite(c)) { i += 1; continue; }
    if (c === 37) {
      while (i < n && bytes[i] !== 10 && bytes[i] !== 13) i += 1;
      continue;
    }
    if (c === 40) { i = skipString(bytes, i); operands.push(null); continue; }
    if (c === 60) {
      if (bytes[i + 1] === 60) {
        let depth = 1;
        i += 2;
        while (i < n && depth > 0) {
          if (bytes[i] === 60 && bytes[i + 1] === 60) { depth += 1; i += 2; }
          else if (bytes[i] === 62 && bytes[i + 1] === 62) { depth -= 1; i += 2; }
          else if (bytes[i] === 40) i = skipString(bytes, i);
          else i += 1;
        }
      } else {
        while (i < n && bytes[i] !== 62) i += 1;
        i += 1;
      }
      operands.push(null);
      continue;
    }
    if (c === 91) {
      let depth = 1;
      i += 1;
      while (i < n && depth > 0) {
        if (bytes[i] === 40) i = skipString(bytes, i);
        else {
          if (bytes[i] === 91) depth += 1;
          else if (bytes[i] === 93) depth -= 1;
          i += 1;
        }
      }
      operands.push(null);
      continue;
    }
    if (c === 41 || c === 62 || c === 93 || c === 123 || c === 125) { i += 1; continue; }
    if (c === 47) {
      let j = i + 1;
      while (j < n && !isWhite(bytes[j]) && !isDelimiter(bytes[j])) j += 1;
      let name = '';
      for (let k = i + 1; k < j; k += 1) name += String.fromCharCode(bytes[k]);
      name = name.replace(/#([0-9a-fA-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
      operands.push({ name });
      i = j;
      continue;
    }
    let j = i;
    while (j < n && !isWhite(bytes[j]) && !isDelimiter(bytes[j])) j += 1;
    let token = '';
    for (let k = i; k < j; k += 1) token += String.fromCharCode(bytes[k]);
    i = j;
    if (NUMBER_RE.test(token)) {
      operands.push(Number(token));
    } else if (token === 'BI') {
      i = skipInlineImage(bytes, i);
      operands = [];
    } else {
      yield { op: token, operands };
      operands = [];
    }
  }
}

// ---------------------------------------------------------------------------
// Nén PDF
// ---------------------------------------------------------------------------

function makeHelpers(PDFLib, context) {
  const { PDFName, PDFNumber, PDFDict, PDFArray, PDFRef, PDFRawStream, PDFBool, decodePDFRawStream } = PDFLib;
  const key = (n) => PDFName.of(n);
  const nameOf = (v) => (v instanceof PDFName ? v.decodeText() : undefined);
  const numOf = (v) => (v instanceof PDFNumber ? v.asNumber() : undefined);
  const get = (dict, k) => context.lookup(dict.get(key(k)));
  const isStream = (o) => o instanceof PDFRawStream;
  const decodeStream = (stream) => decodePDFRawStream(stream).decode();

  /** Danh sách tên bộ lọc (chuẩn hóa cả dạng tên đơn lẫn mảng). */
  const filtersOf = (dict) => {
    const f = get(dict, 'Filter');
    if (!f) return [];
    if (f instanceof PDFArray) {
      return f.asArray().map((x) => nameOf(context.lookup(x)) || '?');
    }
    return [nameOf(f) || '?'];
  };

  const boolOf = (v) => (v instanceof PDFBool ? v.asBoolean() : false);

  return { PDFLib, context, key, nameOf, numOf, get, isStream, decodeStream, filtersOf, boolOf, PDFDict, PDFArray, PDFRef };
}

/** Duyệt trang (và Form XObject) ghi lại DPI hiển thị lớn nhất của từng ảnh. */
function collectImageUsage(h, doc) {
  const { context, key, nameOf, numOf, get, isStream, decodeStream, PDFDict, PDFArray, PDFRef } = h;
  const usage = new Map(); // tag → { dpiX, dpiY }
  let budget = 20000; // số lần gọi Do tối đa để tránh tài liệu độc hại

  const bytesOfContents = (contents) => {
    if (!contents) return null;
    if (isStream(contents)) return decodeStream(contents);
    if (contents instanceof PDFArray) {
      const chunks = [];
      for (let i = 0; i < contents.size(); i += 1) {
        const s = contents.lookup(i);
        if (isStream(s)) chunks.push(decodeStream(s), Uint8Array.of(10));
      }
      const total = chunks.reduce((sum, c) => sum + c.length, 0);
      const out = new Uint8Array(total);
      let off = 0;
      for (const c of chunks) { out.set(c, off); off += c.length; }
      return out;
    }
    return null;
  };

  const walk = (bytes, resources, baseMatrix, depth, visiting) => {
    if (!bytes || !resources) return;
    const xobjects = resources.lookupMaybe(key('XObject'), PDFDict);
    if (!xobjects) return;
    let ctm = baseMatrix;
    const stack = [];
    for (const { op, operands } of contentOperators(bytes)) {
      if (op === 'q') stack.push(ctm);
      else if (op === 'Q') { if (stack.length) ctm = stack.pop(); }
      else if (op === 'cm') {
        const m = operands.slice(-6);
        if (m.length === 6 && m.every((v) => typeof v === 'number')) ctm = multiplyMatrix(m, ctm);
      } else if (op === 'Do') {
        const last = operands[operands.length - 1];
        if (!last || typeof last !== 'object' || !last.name) continue;
        budget -= 1;
        if (budget < 0) return;
        const raw = xobjects.get(key(last.name));
        const target = context.lookup(raw);
        if (!isStream(target)) continue;
        const subtype = nameOf(target.dict.lookup(key('Subtype')));
        if (subtype === 'Image' && raw instanceof PDFRef) {
          const widthPt = Math.hypot(ctm[0], ctm[1]);
          const heightPt = Math.hypot(ctm[2], ctm[3]);
          const w = numOf(get(target.dict, 'Width'));
          const hgt = numOf(get(target.dict, 'Height'));
          if (!(widthPt >= 1 && heightPt >= 1 && w > 0 && hgt > 0)) continue;
          const dpiX = w / (widthPt / 72);
          const dpiY = hgt / (heightPt / 72);
          const prev = usage.get(raw.tag);
          usage.set(raw.tag, {
            dpiX: Math.max(prev?.dpiX || 0, dpiX),
            dpiY: Math.max(prev?.dpiY || 0, dpiY),
          });
        } else if (subtype === 'Form' && raw instanceof PDFRef && depth < 6 && !visiting.has(raw.tag)) {
          let matrix = IDENTITY;
          const m = target.dict.lookupMaybe(key('Matrix'), PDFArray);
          if (m && m.size() === 6) {
            const vals = m.asArray().map((x) => numOf(context.lookup(x)));
            if (vals.every((v) => typeof v === 'number')) matrix = vals;
          }
          const formResources = target.dict.lookupMaybe(key('Resources'), PDFDict) || resources;
          visiting.add(raw.tag);
          try {
            walk(decodeStream(target), formResources, multiplyMatrix(matrix, ctm), depth + 1, visiting);
          } catch {
            // luồng không giải mã được: bỏ qua, ảnh bên trong dùng giới hạn dự phòng
          } finally {
            visiting.delete(raw.tag);
          }
        }
      }
    }
  };

  for (const page of doc.getPages()) {
    try {
      walk(
        bytesOfContents(page.node.Contents()),
        page.node.Resources(),
        IDENTITY,
        0,
        new Set(),
      );
    } catch {
      // trang có luồng nội dung lạ: ảnh của trang dùng giới hạn dự phòng
    }
  }
  return usage;
}

/** Tập đối tượng được tham chiếu làm SMask/Mask của ảnh khác (không được đổi sang JPEG). */
function collectMaskTargets(h, objects) {
  const { key, isStream, PDFRef } = h;
  const masks = new Set();
  for (const [, obj] of objects) {
    if (!isStream(obj)) continue;
    for (const k of ['SMask', 'Mask']) {
      const v = obj.dict.get(key(k));
      if (v instanceof PDFRef) masks.add(v.tag);
    }
  }
  return masks;
}

/** Xóa đối tượng không còn với tới được từ Root/Info. */
function removeUnreachable(h, doc) {
  const { context, isStream, PDFDict, PDFArray, PDFRef } = h;
  const info = context.trailerInfo;
  const seen = new Set();
  const stack = [info.Root, info.Info, info.Encrypt].filter(Boolean);
  while (stack.length) {
    const node = stack.pop();
    if (node instanceof PDFRef) {
      if (seen.has(node.tag)) continue;
      seen.add(node.tag);
      const target = context.lookup(node);
      if (target) stack.push(target);
    } else if (node instanceof PDFDict) {
      for (const v of node.values()) stack.push(v);
    } else if (node instanceof PDFArray) {
      for (const v of node.asArray()) stack.push(v);
    } else if (isStream(node)) {
      stack.push(node.dict);
    }
  }
  let removed = 0;
  for (const [ref] of context.enumerateIndirectObjects()) {
    if (!seen.has(ref.tag)) {
      context.delete(ref);
      removed += 1;
    }
  }
  return removed;
}

function detectSignature(h, objects) {
  const { key, nameOf, PDFDict, context } = h;
  for (const [, obj] of objects) {
    if (obj instanceof PDFDict && obj.get(key('ByteRange')) && obj.get(key('Contents'))) return true;
    if (obj instanceof PDFDict && nameOf(context.lookup(obj.get(key('Type')))) === 'Sig') return true;
  }
  return false;
}

const SIMPLE_COLORSPACES = new Set(['DeviceRGB', 'DeviceGray', 'CalRGB', 'CalGray']);

/** Cách đọc không gian màu: { channels: 1|3, palette? } hoặc null nếu không hỗ trợ. */
function describeColorSpace(h, cs) {
  const { context, nameOf, numOf, isStream, decodeStream, PDFArray } = h;
  const name = nameOf(cs);
  if (name) return SIMPLE_COLORSPACES.has(name) ? { channels: name.endsWith('Gray') ? 1 : 3 } : null;
  if (!(cs instanceof PDFArray) || cs.size() < 2) return null;
  const family = nameOf(context.lookup(cs.get(0)));
  if (SIMPLE_COLORSPACES.has(family)) return { channels: family.endsWith('Gray') ? 1 : 3 };
  if (family === 'ICCBased') {
    const profile = context.lookup(cs.get(1));
    const n = isStream(profile) ? numOf(context.lookup(profile.dict.get(h.key('N')))) : undefined;
    return n === 1 || n === 3 ? { channels: n } : null;
  }
  if (family === 'Indexed' || family === 'I') {
    const base = describeColorSpace(h, context.lookup(cs.get(1)));
    const hival = numOf(context.lookup(cs.get(2)));
    const lookup = context.lookup(cs.get(3));
    if (!base || base.palette || !(hival >= 0)) return null;
    let table = null;
    if (isStream(lookup)) {
      try { table = decodeStream(lookup); } catch { return null; }
    } else if (lookup && typeof lookup.asBytes === 'function') {
      table = lookup.asBytes();
    }
    if (!table || table.length < (hival + 1) * base.channels) return null;
    return { channels: 1, palette: { table, base: base.channels, size: hival + 1 } };
  }
  return null;
}

function toRgba(data, width, height, cs) {
  const count = width * height;
  const rgba = new Uint8Array(count * 4);
  if (cs.palette) {
    const { table, base } = cs.palette;
    for (let p = 0; p < count; p += 1) {
      const idx = data[p];
      const t = idx * base;
      const o = p * 4;
      if (base === 3) { rgba[o] = table[t]; rgba[o + 1] = table[t + 1]; rgba[o + 2] = table[t + 2]; }
      else { rgba[o] = table[t]; rgba[o + 1] = table[t]; rgba[o + 2] = table[t]; }
      rgba[o + 3] = 255;
    }
  } else if (cs.channels === 3) {
    for (let p = 0, s = 0; p < count; p += 1, s += 3) {
      const o = p * 4;
      rgba[o] = data[s]; rgba[o + 1] = data[s + 1]; rgba[o + 2] = data[s + 2]; rgba[o + 3] = 255;
    }
  } else {
    for (let p = 0; p < count; p += 1) {
      const o = p * 4;
      rgba[o] = data[p]; rgba[o + 1] = data[p]; rgba[o + 2] = data[p]; rgba[o + 3] = 255;
    }
  }
  return rgba;
}

/**
 * Nén một tệp PDF.
 *
 * @param {object} PDFLib module pdf-lib
 * @param {ArrayBuffer|Uint8Array} input
 * @param {object} options
 * @param {'light'|'balanced'|'strong'|object} [options.preset]
 * @param {{ jpegToJpeg: Function, rgbaToJpeg: Function, inflate: Function, deflate: Function }} options.codec
 *   - jpegToJpeg(bytes, { width, height, quality }) → Uint8Array | null
 *   - rgbaToJpeg(rgba, srcWidth, srcHeight, { width, height, quality }) → Uint8Array | null
 *   - inflate(bytes) / deflate(bytes) → Promise<Uint8Array> (định dạng zlib, như FlateDecode)
 * @param {(p: { done: number, total: number }) => void} [options.onProgress]
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<{ bytes: Uint8Array, originalSize: number, newSize: number, pageCount: number,
 *   unchanged: boolean, signed: boolean, images: { total: number, optimized: number, skipped: number } }>}
 */
export async function compressPdf(PDFLib, input, options = {}) {
  const { codec, onProgress, signal } = options;
  if (!codec) throw new Error('NO_CODEC');
  const preset = resolvePreset(options.preset);
  const original = input instanceof Uint8Array ? input : new Uint8Array(input);
  const throwIfAborted = () => { if (signal?.aborted) throw new DOMException('Aborted', 'AbortError'); };

  const { PDFDocument, PDFName, PDFRawStream } = PDFLib;
  const doc = await PDFDocument.load(original, { updateMetadata: false });
  const pageCount = doc.getPageCount();
  const context = doc.context;
  const h = makeHelpers(PDFLib, context);
  const { key, nameOf, numOf, get, isStream, filtersOf, boolOf } = h;

  const objects = context.enumerateIndirectObjects();
  const signed = detectSignature(h, objects);

  let usage = new Map();
  try { usage = collectImageUsage(h, doc); } catch { usage = new Map(); }
  const maskTargets = collectMaskTargets(h, objects);

  const maxPageLongPt = Math.max(0, ...doc.getPages().map((p) => {
    const { width, height } = p.getSize();
    return Math.max(width, height);
  }));
  const fallbackLongPx = Math.round((maxPageLongPt / 72) * preset.targetDpi);

  const images = [];
  for (const [ref, obj] of objects) {
    if (isStream(obj) && nameOf(obj.dict.lookup(key('Subtype'))) === 'Image') images.push([ref, obj]);
  }
  const stats = { total: images.length, optimized: 0, skipped: 0 };

  const optimizeImage = async (ref, stream) => {
    const dict = stream.dict;
    if (maskTargets.has(ref.tag)) return false;
    if (boolOf(get(dict, 'ImageMask')) || dict.get(key('Mask')) || dict.get(key('Decode'))) return false;
    const smask = get(dict, 'SMask');
    if (smask && isStream(smask) && smask.dict.get(key('Matte'))) return false;

    const width = numOf(get(dict, 'Width'));
    const height = numOf(get(dict, 'Height'));
    if (!(width > 0 && height > 0) || width * height < MIN_IMAGE_PIXELS) return false;
    const oldBytes = stream.getContents();
    if (oldBytes.length < MIN_IMAGE_STREAM_BYTES) return false;

    const use = usage.get(ref.tag);
    const target = planImageSize({
      width,
      height,
      dpiX: use?.dpiX,
      dpiY: use?.dpiY,
      fallbackLongPx,
      targetDpi: preset.targetDpi,
    });
    const encodeOpts = { width: target.width, height: target.height, quality: preset.quality };

    const filters = filtersOf(dict);
    let jpeg = null;
    if (filters.length === 1 && filters[0] === 'DCTDecode') {
      const cs = describeColorSpace(h, get(dict, 'ColorSpace'));
      if (!cs || cs.palette) return false; // CMYK/Separation/Lab… giữ nguyên
      jpeg = await codec.jpegToJpeg(oldBytes, encodeOpts);
    } else if (filters.length === 1 && (filters[0] === 'FlateDecode' || filters[0] === 'Fl')) {
      const bpc = numOf(get(dict, 'BitsPerComponent'));
      const cs = describeColorSpace(h, get(dict, 'ColorSpace'));
      if (bpc !== 8 || !cs || width * height > MAX_RAW_IMAGE_PIXELS) return false;
      const parms = get(dict, 'DecodeParms') || get(dict, 'DP');
      const predictor = parms instanceof h.PDFDict ? (numOf(parms.lookup(key('Predictor'))) || 1) : 1;
      if (parms instanceof h.PDFArray) return false; // chuỗi bộ lọc có tham số riêng: bỏ qua
      if (predictor === 2) return false; // dự đoán TIFF: hiếm, bỏ qua
      let raw = await codec.inflate(oldBytes);
      if (predictor >= 10) {
        raw = undoPngPredictor(raw, { colors: cs.channels, bpc, columns: width });
      }
      if (raw.length < width * height * cs.channels) return false;
      jpeg = await codec.rgbaToJpeg(toRgba(raw, width, height, cs), width, height, encodeOpts);
    } else {
      return false;
    }

    if (!jpeg || jpeg.length >= oldBytes.length * ACCEPT_RATIO) return false;

    const next = context.obj({
      Type: 'XObject',
      Subtype: 'Image',
      Width: target.width,
      Height: target.height,
      ColorSpace: 'DeviceRGB',
      BitsPerComponent: 8,
      Filter: 'DCTDecode',
    });
    for (const k of ['SMask', 'Interpolate', 'Intent', 'OC']) {
      const v = dict.get(key(k));
      if (v) next.set(key(k), v);
    }
    context.assign(ref, PDFRawStream.of(next, jpeg));
    return true;
  };

  for (let i = 0; i < images.length; i += 1) {
    throwIfAborted();
    const [ref, stream] = images[i];
    let ok = false;
    try {
      ok = await optimizeImage(ref, stream);
    } catch (err) {
      if (err?.name === 'AbortError') throw err;
      ok = false; // ảnh lạ/hỏng: giữ nguyên bản gốc
    }
    if (ok) stats.optimized += 1;
    else stats.skipped += 1;
    onProgress?.({ done: i + 1, total: images.length });
  }

  // Nén Flate các luồng chưa nén (nội dung trang, ảnh thô, font không nén…).
  for (const [, obj] of context.enumerateIndirectObjects()) {
    throwIfAborted();
    if (!isStream(obj)) continue;
    const dict = obj.dict;
    if (dict.get(key('Filter')) || dict.get(key('DecodeParms'))) continue;
    const type = nameOf(dict.lookup(key('Type')));
    if (type === 'Metadata' || type === 'XRef' || type === 'ObjStm') continue;
    const bytes = obj.getContents();
    if (bytes.length < MIN_PLAIN_STREAM_BYTES) continue;
    try {
      const packed = await codec.deflate(bytes);
      if (packed.length < bytes.length * 0.97) {
        dict.set(key('Filter'), PDFName.of('FlateDecode'));
        obj.contents = packed;
      }
    } catch {
      // giữ nguyên luồng
    }
  }

  // Bỏ ảnh thu nhỏ trang (/Thumb), rồi dọn đối tượng mồ côi.
  for (const page of doc.getPages()) page.node.delete(key('Thumb'));
  removeUnreachable(h, doc);

  throwIfAborted();
  const bytes = await doc.save({ useObjectStreams: true, addDefaultPage: false });

  // Kiểm tra lại: tệp mới phải mở được và đủ số trang, không thì giữ bản gốc.
  let valid = false;
  try {
    const check = await PDFDocument.load(bytes, { updateMetadata: false });
    valid = check.getPageCount() === pageCount;
  } catch {
    valid = false;
  }

  const unchanged = !valid || bytes.length >= original.length;
  return {
    bytes: unchanged ? original : bytes,
    originalSize: original.length,
    newSize: unchanged ? original.length : bytes.length,
    pageCount,
    unchanged,
    signed,
    images: stats,
  };
}

/** Tên tệp đầu ra khi nén: "<tên>_compressed.pdf". */
export function compressedName(name) {
  const base = String(name || 'document').replace(/\.pdf$/i, '').replace(/[\\/:*?"<>|]+/g, '_').trim() || 'document';
  return `${base}_compressed.pdf`;
}
