import { jsPDF } from 'jspdf';
function mmToPixels(mm, dpi = 300) {
  return Math.round(mm / 25.4 * dpi);
}
function renderSingleIdPhoto(compositeImage, standard, transform, targetDpi = 300, bgColor = "#FFFFFF", useVignette = false) {
  const targetW = mmToPixels(standard.widthMm, targetDpi);
  const targetH = mmToPixels(standard.heightMm, targetDpi);
  const dpiRatio = targetDpi / 300;
  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  const srcW = compositeImage instanceof HTMLImageElement ? compositeImage.naturalWidth : compositeImage.width;
  const srcH = compositeImage instanceof HTMLImageElement ? compositeImage.naturalHeight : compositeImage.height;
  if (useVignette) {
    const grad = ctx.createRadialGradient(
      targetW / 2,
      targetH * 0.38,
      targetW * 0.15,
      targetW / 2,
      targetH * 0.45,
      targetW * 0.85
    );
    grad.addColorStop(0, adjustBrightness(bgColor, 18));
    grad.addColorStop(1, adjustBrightness(bgColor, -18));
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = bgColor;
  }
  ctx.fillRect(0, 0, targetW, targetH);
  ctx.save();
  ctx.translate(targetW / 2 + transform.offsetX * dpiRatio, targetH / 2 + transform.offsetY * dpiRatio);
  ctx.rotate(transform.rotation * Math.PI / 180);
  const baseScale = Math.max(targetW / srcW, targetH / srcH);
  const totalScale = baseScale * transform.scale;
  const drawW = srcW * totalScale;
  const drawH = srcH * totalScale;
  const filters = [];
  if (transform.brightness !== 0) {
    filters.push(`brightness(${100 + transform.brightness}%)`);
  }
  if (transform.contrast !== 0) {
    filters.push(`contrast(${100 + transform.contrast}%)`);
  }
  if (transform.saturation !== 0) {
    filters.push(`saturate(${100 + transform.saturation}%)`);
  }
  if (filters.length > 0) {
    ctx.filter = filters.join(" ");
  }
  ctx.drawImage(compositeImage, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();
  if (transform.sharpness > 0) {
    applySharpness(ctx, targetW, targetH, transform.sharpness / 100);
  }
  return canvas;
}
function renderPrintSheet(singlePhotoCanvas, tiling, settings, targetDpi = 300) {
  const sheetW = mmToPixels(tiling.paperWidthMm, targetDpi);
  const sheetH = mmToPixels(tiling.paperHeightMm, targetDpi);
  const canvas = document.createElement("canvas");
  canvas.width = sheetW;
  canvas.height = sheetH;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, sheetW, sheetH);
  for (const photo of tiling.photos) {
    const xPx = mmToPixels(photo.xMm, targetDpi);
    const yPx = mmToPixels(photo.yMm, targetDpi);
    const wPx = mmToPixels(photo.widthMm, targetDpi);
    const hPx = mmToPixels(photo.heightMm, targetDpi);
    ctx.drawImage(singlePhotoCanvas, xPx, yPx, wPx, hPx);
    if (settings.showPhotoBorder) {
      ctx.strokeStyle = settings.borderColor || "rgba(0, 0, 0, 0.15)";
      ctx.lineWidth = Math.max(1, Math.round(targetDpi / 300));
      ctx.strokeRect(xPx, yPx, wPx, hPx);
    }
  }
  if (settings.showCuttingLines || settings.showCornerMarks) {
    drawCuttingGuides(ctx, tiling, settings, targetDpi);
  }
  return canvas;
}
async function exportPhotoBlob(canvas, format, dpi = 300) {
  if (format === "png") {
    return new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/png");
    });
  } else {
    const rawJpg = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.98);
    });
    return setJpegDpi(rawJpg, dpi);
  }
}
function drawCuttingGuides(ctx, tiling, settings, targetDpi) {
  const lineWidth = Math.max(1, Math.round(targetDpi / 300));
  ctx.save();
  ctx.lineWidth = lineWidth;
  if (settings.showCuttingLines) {
    ctx.strokeStyle = "#94A3B8";
    ctx.setLineDash([Math.round(4 * (targetDpi / 300)), Math.round(4 * (targetDpi / 300))]);
    for (const photo of tiling.photos) {
      const x = mmToPixels(photo.xMm, targetDpi);
      const y = mmToPixels(photo.yMm, targetDpi);
      const w = mmToPixels(photo.widthMm, targetDpi);
      const h = mmToPixels(photo.heightMm, targetDpi);
      ctx.strokeRect(x, y, w, h);
    }
    ctx.setLineDash([]);
  }
  if (settings.showCornerMarks) {
    ctx.strokeStyle = "#475569";
    const tickLen = mmToPixels(2.5, targetDpi);
    for (const photo of tiling.photos) {
      const x = mmToPixels(photo.xMm, targetDpi);
      const y = mmToPixels(photo.yMm, targetDpi);
      const w = mmToPixels(photo.widthMm, targetDpi);
      const h = mmToPixels(photo.heightMm, targetDpi);
      ctx.beginPath();
      ctx.moveTo(x - tickLen, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y - tickLen);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + w + tickLen, y);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w, y - tickLen);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - tickLen, y + h);
      ctx.lineTo(x, y + h);
      ctx.lineTo(x, y + h + tickLen);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + w + tickLen, y + h);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x + w, y + h + tickLen);
      ctx.stroke();
    }
  }
  ctx.restore();
}
function applySharpness(ctx, width, height, amount) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const copy = new Uint8ClampedArray(data);
  const a = amount * 0.4;
  const center = 1 + 4 * a;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const up = ((y - 1) * width + x) * 4;
      const down = ((y + 1) * width + x) * 4;
      const left = (y * width + (x - 1)) * 4;
      const right = (y * width + (x + 1)) * 4;
      for (let c = 0; c < 3; c++) {
        const val = copy[idx + c] * center - (copy[up + c] + copy[down + c] + copy[left + c] + copy[right + c]) * a;
        data[idx + c] = Math.min(255, Math.max(0, Math.round(val)));
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);
}
function setJpegDpi(blob, dpi = 300) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const buffer = reader.result;
      const view = new DataView(buffer);
      if (view.getUint16(0) !== 65496) {
        return resolve(blob);
      }
      const bytes = new Uint8Array(buffer);
      let app0Pos = -1;
      let offset = 2;
      while (offset < bytes.length - 1) {
        if (bytes[offset] === 255 && bytes[offset + 1] === 224) {
          app0Pos = offset;
          break;
        }
        if (bytes[offset] === 255 && (bytes[offset + 1] === 218 || bytes[offset + 1] === 217)) {
          break;
        }
        offset++;
      }
      if (app0Pos !== -1 && app0Pos + 18 <= bytes.length) {
        bytes[app0Pos + 13] = 1;
        bytes[app0Pos + 14] = dpi >> 8 & 255;
        bytes[app0Pos + 15] = dpi & 255;
        bytes[app0Pos + 16] = dpi >> 8 & 255;
        bytes[app0Pos + 17] = dpi & 255;
        return resolve(new Blob([bytes], { type: "image/jpeg" }));
      }
      const jfifHeader = new Uint8Array([
        255,
        224,
        0,
        16,
        // APP0, length 16
        74,
        70,
        73,
        70,
        0,
        // 'JFIF\0'
        1,
        1,
        // Version 1.1
        1,
        // Units: 1 = dots per inch
        dpi >> 8 & 255,
        dpi & 255,
        // Xdensity
        dpi >> 8 & 255,
        dpi & 255,
        // Ydensity
        0,
        0
        // Thumbnail X & Y
      ]);
      const newBytes = new Uint8Array(bytes.length + jfifHeader.length);
      newBytes.set(bytes.subarray(0, 2), 0);
      newBytes.set(jfifHeader, 2);
      newBytes.set(bytes.subarray(2), 2 + jfifHeader.length);
      resolve(new Blob([newBytes], { type: "image/jpeg" }));
    };
    reader.readAsArrayBuffer(blob);
  });
}
async function exportSheetPdf(singlePhotoCanvas, tiling, settings) {
  const doc = new jsPDF({
    orientation: tiling.orientation,
    unit: "mm",
    format: [tiling.paperWidthMm, tiling.paperHeightMm],
    compress: true
  });
  const photoJpegData = singlePhotoCanvas.toDataURL("image/jpeg", 0.98);
  for (const photo of tiling.photos) {
    doc.addImage(
      photoJpegData,
      "JPEG",
      photo.xMm,
      photo.yMm,
      photo.widthMm,
      photo.heightMm,
      void 0,
      "FAST"
    );
    if (settings.showPhotoBorder) {
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.15);
      doc.rect(photo.xMm, photo.yMm, photo.widthMm, photo.heightMm);
    }
  }
  if (settings.showCuttingLines) {
    doc.setDrawColor(150, 160, 175);
    doc.setLineWidth(0.2);
    doc.setLineDashPattern([1.5, 1.5], 0);
    for (const photo of tiling.photos) {
      doc.rect(photo.xMm, photo.yMm, photo.widthMm, photo.heightMm);
    }
    doc.setLineDashPattern([], 0);
  }
  if (settings.showCornerMarks) {
    doc.setDrawColor(80, 90, 105);
    doc.setLineWidth(0.25);
    const tick = 2.5;
    for (const photo of tiling.photos) {
      const x = photo.xMm;
      const y = photo.yMm;
      const w = photo.widthMm;
      const h = photo.heightMm;
      doc.line(x - tick, y, x, y);
      doc.line(x, y - tick, x, y);
      doc.line(x + w, y, x + w + tick, y);
      doc.line(x + w, y - tick, x + w, y);
      doc.line(x - tick, y + h, x, y + h);
      doc.line(x, y + h, x, y + h + tick);
      doc.line(x + w, y + h, x + w + tick, y + h);
      doc.line(x + w, y + h, x + w, y + h + tick);
    }
  }
  return doc.output("blob");
}
function adjustBrightness(hex, percent) {
  let num = parseInt(hex.replace("#", ""), 16);
  if (isNaN(num)) return hex;
  let r = (num >> 16) + Math.round(255 * percent / 100);
  let g = (num >> 8 & 255) + Math.round(255 * percent / 100);
  let b = (num & 255) + Math.round(255 * percent / 100);
  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
export {
  exportPhotoBlob,
  exportSheetPdf,
  mmToPixels,
  renderPrintSheet,
  renderSingleIdPhoto,
  setJpegDpi
};
