/**
 * Codec ảnh/nén chạy trong trình duyệt cho pdfCompressCore: giải mã & nén lại
 * JPEG bằng canvas, Flate bằng CompressionStream. Xử lý hoàn toàn cục bộ.
 */

async function pipeThrough(stream, bytes) {
  const out = new Response(new Blob([bytes]).stream().pipeThrough(stream));
  return new Uint8Array(await out.arrayBuffer());
}

export const inflate = (bytes) => pipeThrough(new DecompressionStream('deflate'), bytes);
export const deflate = (bytes) => pipeThrough(new CompressionStream('deflate'), bytes);

function makeCanvas(width, height) {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(width, height);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

async function canvasToJpeg(canvas, quality) {
  const blob = canvas.convertToBlob
    ? await canvas.convertToBlob({ type: 'image/jpeg', quality })
    : await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
  if (!blob) return null;
  return new Uint8Array(await blob.arrayBuffer());
}

function releaseCanvas(canvas) {
  canvas.width = 0;
  canvas.height = 0;
}

/** Vẽ nguồn lên canvas đích trên nền trắng (JPEG không có kênh alpha). */
function drawScaled(source, width, height) {
  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, width, height);
  return canvas;
}

async function jpegToJpeg(bytes, { width, height, quality }) {
  const blob = new Blob([bytes], { type: 'image/jpeg' });
  let bitmap;
  try {
    // EXIF xoay ảnh không có tác dụng trong PDF: tắt để ảnh không bị xoay.
    bitmap = await createImageBitmap(blob, { imageOrientation: 'none' });
  } catch {
    bitmap = await createImageBitmap(blob);
  }
  try {
    const canvas = drawScaled(bitmap, width, height);
    const jpeg = await canvasToJpeg(canvas, quality);
    releaseCanvas(canvas);
    return jpeg;
  } finally {
    bitmap.close?.();
  }
}

async function rgbaToJpeg(rgba, srcWidth, srcHeight, { width, height, quality }) {
  const source = makeCanvas(srcWidth, srcHeight);
  source.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(rgba.buffer, rgba.byteOffset, rgba.byteLength), srcWidth, srcHeight), 0, 0);
  try {
    if (width === srcWidth && height === srcHeight) {
      const jpeg = await canvasToJpeg(source, quality);
      return jpeg;
    }
    const canvas = drawScaled(source, width, height);
    const jpeg = await canvasToJpeg(canvas, quality);
    releaseCanvas(canvas);
    return jpeg;
  } finally {
    releaseCanvas(source);
  }
}

export function createBrowserCodec() {
  return { jpegToJpeg, rgbaToJpeg, inflate, deflate };
}
