/**
 * Ghi ảnh canvas vào Clipboard theo cách chạy được trên Safari lẫn Chromium.
 *
 * Safari chỉ cho `navigator.clipboard.write` khi lệnh được gọi đồng bộ ngay
 * trong thao tác của người dùng. Gọi nó bên trong callback của `toBlob` (như
 * trước đây) làm mất "user activation" nên Safari từ chối mà không báo gì.
 * Vì vậy ClipboardItem được tạo NGAY LẬP TỨC với giá trị là Promise<Blob>;
 * trình duyệt nào không nhận Promise (Chromium < 98, Firefox cũ) thì thử lại
 * bằng Blob đã resolve.
 */

export class ClipboardImageError extends Error {
  constructor(code, message, cause) {
    super(message);
    this.name = 'ClipboardImageError';
    this.code = code;
    if (cause) this.cause = cause;
  }
}

export function canvasToBlob(canvas, type = 'image/png', quality) {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new ClipboardImageError('ENCODE_FAILED', 'Canvas could not be encoded'));
      }, type, quality);
    } catch (err) {
      reject(new ClipboardImageError('ENCODE_FAILED', err?.message || 'Canvas could not be encoded', err));
    }
  });
}

export function isImageClipboardSupported() {
  return (
    typeof navigator !== 'undefined' &&
    Boolean(navigator.clipboard?.write) &&
    typeof ClipboardItem !== 'undefined'
  );
}

/**
 * @param {HTMLCanvasElement} canvas
 * @returns {Promise<void>} reject với ClipboardImageError (code: UNSUPPORTED | DENIED | ENCODE_FAILED | WRITE_FAILED)
 */
export function writeCanvasToClipboard(canvas) {
  if (!canvas) {
    return Promise.reject(new ClipboardImageError('ENCODE_FAILED', 'No canvas to copy'));
  }
  if (!isImageClipboardSupported()) {
    return Promise.reject(
      new ClipboardImageError('UNSUPPORTED', 'This browser cannot write images to the clipboard')
    );
  }

  // Bắt đầu mã hoá ngay, nhưng KHÔNG await trước khi gọi clipboard.write.
  const blobPromise = canvasToBlob(canvas, 'image/png');
  // Tránh "unhandled rejection" khi nhánh thử lại không cần tới promise này.
  blobPromise.catch(() => {});

  const writeResolved = async () => {
    const blob = await blobPromise;
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
  };

  const classify = (err) => {
    if (err instanceof ClipboardImageError) return err;
    if (err?.name === 'NotAllowedError' || err?.name === 'SecurityError') {
      return new ClipboardImageError('DENIED', err.message || 'Clipboard permission denied', err);
    }
    return new ClipboardImageError('WRITE_FAILED', err?.message || 'Clipboard write failed', err);
  };

  let item;
  try {
    item = new ClipboardItem({ 'image/png': blobPromise });
  } catch {
    return writeResolved().catch((err) => {
      throw classify(err);
    });
  }

  return navigator.clipboard.write([item]).then(
    () => undefined,
    async (err) => {
      // Quyền bị từ chối thì thử lại cũng vô ích.
      if (err?.name === 'NotAllowedError' || err?.name === 'SecurityError') throw classify(err);
      try {
        await writeResolved();
      } catch (retryErr) {
        throw classify(retryErr);
      }
    }
  );
}
