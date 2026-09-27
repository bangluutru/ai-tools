/**
 * Bộ nạp pdf.js dùng chung cho PDF Toolkit, OmniConvert và Watermark Studio.
 *
 * - Dùng bản build "legacy": bản modern của pdfjs-dist 6.x gọi
 *   Map.prototype.getOrInsertComputed / Promise.withResolvers, Safari < 17.4
 *   và Chrome đời cũ chưa có nên mở PDF là văng lỗi.
 * - Worker, CMap, font chuẩn và WASM giải mã ảnh đều lấy từ gói pdfjs-dist đã
 *   cài (Vite phát thành asset cùng origin). Trước đây worker và CMap kéo từ
 *   unpkg: bên thứ ba nhận đoạn mã chạy trên PDF của người dùng và mất mạng là
 *   công cụ hỏng.
 * - Không có side effect lúc import. `workerSrc` được gán lại ở mỗi lần gọi vì
 *   GlobalWorkerOptions là trạng thái toàn cục của module pdf.js.
 */
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';

const toFileMap = (modules) => Object.fromEntries(
  Object.entries(modules).map(([path, url]) => [path.slice(path.lastIndexOf('/') + 1), url])
);

// `no-inline`: CMap nhỏ hơn assetsInlineLimit sẽ bị nhồi base64 vào chunk JS.
const CMAP_URLS = toFileMap(import.meta.glob('../../../../node_modules/pdfjs-dist/cmaps/*.bcmap', {
  eager: true, query: '?url&no-inline', import: 'default', exhaustive: true,
}));
const STANDARD_FONT_URLS = toFileMap(import.meta.glob('../../../../node_modules/pdfjs-dist/standard_fonts/*.{pfb,ttf}', {
  eager: true, query: '?url&no-inline', import: 'default', exhaustive: true,
}));
const WASM_URLS = toFileMap(import.meta.glob('../../../../node_modules/pdfjs-dist/wasm/*.wasm', {
  eager: true, query: '?url&no-inline', import: 'default', exhaustive: true,
}));

const BINARY_MAPS = {
  cMapUrl: CMAP_URLS,
  standardFontDataUrl: STANDARD_FONT_URLS,
  wasmUrl: WASM_URLS,
};

/**
 * pdf.js hỏi dữ liệu nhị phân theo *tên tệp* (ví dụ "UniJIS-UCS2-H.bcmap").
 * Asset Vite có hash trong tên nên không dựng được bằng `${baseUrl}${name}`;
 * factory này tra bảng tên → URL rồi tải ở luồng chính.
 */
class LocalBinaryDataFactory {
  async fetch({ kind, filename }) {
    const url = BINARY_MAPS[kind]?.[filename];
    if (!url) throw new Error(`pdf.js: thiếu dữ liệu ${kind} "${filename}"`);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`pdf.js: không tải được ${filename} (${response.status})`);
    return new Uint8Array(await response.arrayBuffer());
  }
}

let pdfJsPromise = null;

export async function loadPdfJs() {
  if (!pdfJsPromise) {
    pdfJsPromise = import('pdfjs-dist/legacy/build/pdf.mjs').catch((err) => {
      pdfJsPromise = null;
      throw err;
    });
  }
  const pdfjsLib = await pdfJsPromise;
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
  return pdfjsLib;
}

function toUint8Array(data) {
  if (data instanceof Uint8Array) return data;
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (ArrayBuffer.isView(data)) return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  throw new Error('Dữ liệu PDF không hợp lệ');
}

/**
 * Mở tài liệu PDF. Luôn truyền bản sao dữ liệu vì pdf.js chuyển (transfer)
 * ArrayBuffer sang worker và làm rỗng buffer của người gọi.
 *
 * Người gọi PHẢI gọi `destroyPdfDocument(pdf)` khi xong (hủy loadingTask và
 * worker riêng); nếu không mỗi lần mở lại để một worker sống mãi.
 *
 * @param {File|Blob|ArrayBuffer|Uint8Array} source
 * @param {{ password?: string, worker?: object }} [options]  `worker`: PDFWorker dùng chung
 *   (xem `createPdfWorker`) để nhiều tài liệu mở cùng lúc không mỗi cái một worker.
 */
export async function openPdfDocument(source, options = {}) {
  const pdfjsLib = await loadPdfJs();
  const bytes = (typeof Blob !== 'undefined' && source instanceof Blob)
    ? new Uint8Array(await source.arrayBuffer())
    : toUint8Array(source).slice();

  const loadingTask = pdfjsLib.getDocument({
    data: bytes,
    password: options.password,
    worker: options.worker,
    BinaryDataFactory: LocalBinaryDataFactory,
    useWorkerFetch: false,
    cMapPacked: true,
    isEvalSupported: false,
    enableXfa: false,
  });
  try {
    return await loadingTask.promise;
  } catch (err) {
    await loadingTask.destroy().catch(() => {});
    throw err;
  }
}

/**
 * Giải phóng tài liệu pdf.js. pdfjs-dist 6 bỏ `PDFDocumentProxy.destroy()`;
 * cách đúng là hủy `loadingTask` (worker dùng chung truyền vào thì không bị hủy).
 * Không bao giờ ném lỗi.
 */
export async function destroyPdfDocument(pdf) {
  if (!pdf) return;
  try {
    if (pdf.loadingTask && typeof pdf.loadingTask.destroy === 'function') await pdf.loadingTask.destroy();
    else if (typeof pdf.destroy === 'function') await pdf.destroy();
  } catch {
    // đã hủy hoặc worker đã chết — bỏ qua
  }
}

/**
 * Tạo một PDFWorker dùng chung. Người gọi phải `worker.destroy()` khi không cần
 * nữa (sau khi đã destroy các tài liệu dùng nó).
 */
export async function createPdfWorker() {
  const pdfjsLib = await loadPdfJs();
  return new pdfjsLib.PDFWorker();
}

/** pdf.js ném PasswordException khi PDF có mật khẩu mở tệp. */
export function isPdfPasswordError(err) {
  return err?.name === 'PasswordException';
}

/** pdf-lib ném EncryptedPDFError khi PDF có mã hóa (kể cả mật khẩu quyền hạn). */
export function isPdfLibEncryptedError(err) {
  return err?.name === 'EncryptedPDFError' || /is encrypted/i.test(err?.message || '');
}

export function isEncryptedPdfError(err) {
  return isPdfPasswordError(err) || isPdfLibEncryptedError(err);
}

export const ENCRYPTED_PDF_MESSAGE = Object.freeze({
  vi: 'PDF này được bảo vệ bằng mật khẩu hoặc mã hóa — hãy gỡ mật khẩu trước rồi tải lại.',
  en: 'This PDF is password-protected or encrypted — please remove the password first, then upload it again.',
  ja: 'このPDFはパスワードまたは暗号化で保護されています。先にパスワードを解除してから再度アップロードしてください。',
});

export function encryptedPdfMessage(lang = 'vi') {
  return ENCRYPTED_PDF_MESSAGE[lang] || ENCRYPTED_PDF_MESSAGE.vi;
}
