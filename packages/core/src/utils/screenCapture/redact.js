/**
 * Che vùng nhạy cảm trên ảnh chụp màn hình — thuần tính toán, test được bằng node.
 *
 * Lỗi cũ: toạ độ chuột là số thực (vd 137.4 × 18.6). getImageData làm tròn
 * kích thước ảnh trả về, nhưng vòng lặp lại đánh chỉ số theo độ rộng thực
 * (`rw`) nên gần như toàn bộ byte không bị đụng tới và chữ vẫn đọc được.
 * Ở đây vùng luôn được quy về số nguyên, kẹp trong canvas, và mọi chỉ số tính
 * theo `imageData.width`.
 */

/** Khối pixel nhỏ nhất: dưới mức này chữ cỡ 12–14px vẫn có thể đoán lại được. */
export const REDACT_MIN_BLOCK = 10;
/** Từ mức này trở lên vùng được tô kín một màu (không còn thông tin gì). */
export const REDACT_FILL_THRESHOLD = 32;
export const REDACT_FILL_COLOR = Object.freeze([15, 23, 42]);

/**
 * Quy một hình chữ nhật (có thể âm / số thực) về vùng pixel nguyên nằm trong canvas.
 * Lấy floor ở cạnh trái/trên và ceil ở cạnh phải/dưới để vùng che không bao giờ
 * nhỏ hơn vùng người dùng kéo.
 * @returns {{x:number,y:number,width:number,height:number}|null}
 */
export function normalizeRedactRect(x, y, w, h, canvasWidth, canvasHeight) {
  const values = [x, y, w, h, canvasWidth, canvasHeight].map(Number);
  if (values.some((v) => !Number.isFinite(v))) return null;
  const [nx, ny, nw, nh, cw, ch] = values;
  const left = Math.max(0, Math.floor(Math.min(nx, nx + nw)));
  const top = Math.max(0, Math.floor(Math.min(ny, ny + nh)));
  const right = Math.min(Math.floor(cw), Math.ceil(Math.max(nx, nx + nw)));
  const bottom = Math.min(Math.floor(ch), Math.ceil(Math.max(ny, ny + nh)));
  const width = right - left;
  const height = bottom - top;
  if (width < 1 || height < 1) return null;
  return { x: left, y: top, width, height };
}

/** Cường độ người dùng chọn → kích thước khối thực tế (không bao giờ dưới REDACT_MIN_BLOCK). */
export function effectiveBlockSize(intensity) {
  const n = Math.round(Number(intensity) || 0);
  return Math.max(REDACT_MIN_BLOCK, n);
}

/**
 * Pixelate (hoặc tô kín) một ImageData tại chỗ.
 * Mỗi khối được thay bằng màu trung bình, alpha = 255 để không lộ nội dung
 * phía dưới qua độ trong suốt.
 * @param {{data: Uint8ClampedArray|number[], width:number, height:number}} imageData
 * @param {number} blockSize
 * @param {{fill?: boolean, fillColor?: number[]}} [options]
 */
export function pixelateImageData(imageData, blockSize, options = {}) {
  const { data, width, height } = imageData;
  if (!data || !width || !height) return imageData;
  const fill = options.fill || blockSize >= REDACT_FILL_THRESHOLD;

  if (fill) {
    const [r, g, b] = options.fillColor || REDACT_FILL_COLOR;
    for (let i = 0; i < width * height * 4; i += 4) {
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
    return imageData;
  }

  const block = effectiveBlockSize(blockSize);
  for (let by = 0; by < height; by += block) {
    const yEnd = Math.min(height, by + block);
    for (let bx = 0; bx < width; bx += block) {
      const xEnd = Math.min(width, bx + block);
      let red = 0;
      let green = 0;
      let blue = 0;
      let count = 0;
      for (let py = by; py < yEnd; py++) {
        for (let px = bx; px < xEnd; px++) {
          const idx = (py * width + px) * 4;
          red += data[idx];
          green += data[idx + 1];
          blue += data[idx + 2];
          count++;
        }
      }
      red = Math.round(red / count);
      green = Math.round(green / count);
      blue = Math.round(blue / count);
      for (let py = by; py < yEnd; py++) {
        for (let px = bx; px < xEnd; px++) {
          const idx = (py * width + px) * 4;
          data[idx] = red;
          data[idx + 1] = green;
          data[idx + 2] = blue;
          data[idx + 3] = 255;
        }
      }
    }
  }
  return imageData;
}

/**
 * Áp dụng vùng che lên context 2D. Nếu không đọc được pixel (canvas bị "taint")
 * thì tô kín thay vì bỏ qua — thà mất chi tiết còn hơn lộ dữ liệu.
 * @returns {boolean} true nếu có vùng được che
 */
export function applyRedaction(ctx, rect, intensity) {
  const canvasWidth = ctx?.canvas?.width;
  const canvasHeight = ctx?.canvas?.height;
  const area = normalizeRedactRect(rect.x, rect.y, rect.w, rect.h, canvasWidth, canvasHeight);
  if (!area) return false;
  try {
    const imgData = ctx.getImageData(area.x, area.y, area.width, area.height);
    pixelateImageData(imgData, intensity);
    ctx.putImageData(imgData, area.x, area.y);
  } catch {
    const [r, g, b] = REDACT_FILL_COLOR;
    ctx.save?.();
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(area.x, area.y, area.width, area.height);
    ctx.restore?.();
  }
  return true;
}
