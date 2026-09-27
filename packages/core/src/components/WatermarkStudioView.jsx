/**
 * WatermarkStudioView.jsx
 * ========================================================================
 * Self-contained Watermark Studio miniapp for the AI-Tools portal.
 * Adds text or image watermarks to PDF, DOCX, XLSX, PPTX, and images.
 *
 * Architecture:
 *   - All logic (engines, helpers, constants) inlined to keep crash isolation.
 *   - Uses only dependencies already in @ai-tools/core and hub package.json:
 *     pdf-lib, jszip, lucide-react, react.
 *   - 100% client-side processing — zero server uploads.
 *   - Redesigned to strictly match Modern Utility Workspace Design System.
 *
 * @module WatermarkStudioView
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  IMAGE_CONVERT_LIMITS,
  formatMiB,
  rejectionMessages,
  validateDocumentFiles,
  verifyDocumentSignature,
} from '../utils/documentFiles.js';
import { destroyPdfDocument, encryptedPdfMessage, isPdfLibEncryptedError, openPdfDocument } from '../utils/pdfjs.js';
import {
  NS as OOXML_NS,
  applyDocxWatermark,
  applyPptxWatermark,
  applyXlsxBackground,
  fitAspect,
} from '../utils/watermark/ooxmlWatermark.js';
import {
  ShieldCheck, HelpCircle, Sparkles, LayoutGrid,
  Zap, Check, UploadCloud, FileText, Image as ImageIcon, FileSpreadsheet,
  Presentation, CheckCircle2, AlertCircle, Loader2, Trash2, Download,
  Eye, Layers, ZoomIn, ZoomOut, Maximize2, Grid, Type, Palette,
  RotateCw, Bold, Italic, CaseUpper, Upload, Wand2, Stamp, Grid3X3,
  Sliders, Play, RefreshCw, Package, FileCheck, X, FileCheck2, Cpu,
  CheckCircle, Lock, Shield, ChevronLeft, ChevronRight, Contrast,
  Archive, FileCode2, Home, CheckSquare, Layers2
} from 'lucide-react';

// pdf-lib (~500 KB) và JSZip chỉ cần khi đóng dấu → nạp khi dùng để chunk đầu nhẹ.
const loadPdfLib = () => import('pdf-lib');
const loadJSZip = () => import('jszip').then(function (m) { return m.default; });

const MIB = 1024 * 1024;
/** Giới hạn đầu vào; .doc/.xls/.ppt/.csv (không phải OOXML) bị từ chối thay vì xử lý sai. */
const WATERMARK_LIMITS = Object.freeze({
  maxFiles: 50,
  maxFileBytes: 50 * MIB,
  maxTotalBytes: 100 * MIB,
  maxPixels: IMAGE_CONVERT_LIMITS.maxPixels,
  extensions: ['.pdf', '.docx', '.xlsx', '.pptx', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif', '.bmp', '.svg'],
});

// ========================================================================
// CONSTANTS & PRESETS
// ========================================================================

const DEFAULT_WATERMARK_CONFIG = {
  type: 'text',
  text: 'BẢO MẬT NỘI BỘ • KHÔNG SAO CHÉP',
  fontFamily: 'Inter, sans-serif',
  fontSize: 28,
  color: '#EF4444',
  bold: true,
  italic: false,
  allCaps: true,
  imageFile: null,
  imageDataUrl: null,
  imageScale: 0.4,
  removeWhiteBg: true,
  opacity: 0.28,
  rotation: -45,
  layoutMode: 'tiled',
  position: 'center',
  tileGapX: 160,
  tileGapY: 130,
  targetPages: 'all', // 'all' | 'first' | 'range' (chỉ áp dụng cho PDF)
  pageRange: '1',
  addTimestampHidden: false
};

const WATERMARK_PRESETS = [
  {
    id: 'confidential',
    name: '[BẢO MẬT NỘI BỘ]',
    description: 'Chữ đỏ cảnh báo in hoa, nghiêng 45°, độ mờ 25% chống sao chép',
    badge: 'Bảo mật',
    config: { type: 'text', text: 'TUYỆT MẬT / CONFIDENTIAL', color: '#EF4444', fontSize: 32, opacity: 0.25, rotation: -45, bold: true, layoutMode: 'tiled' }
  },
  {
    id: 'draft',
    name: '[DỰ THẢO - DRAFT]',
    description: 'Chữ xám trung tính, phù hợp tài liệu đang soạn thảo',
    badge: 'Soạn thảo',
    config: { type: 'text', text: 'BẢN NHÁP / DRAFT', color: '#94A3B8', fontSize: 36, opacity: 0.20, rotation: -45, bold: true, layoutMode: 'tiled', position: 'center' }
  },
  {
    id: 'sample',
    name: '[MẪU THỬ - SAMPLE]',
    description: 'Chữ xanh dương chuyên nghiệp, căn giữa trang',
    badge: 'Mẫu thử',
    config: { type: 'text', text: 'MẪU XEM TRƯỚC / SAMPLE', color: '#0EA5E9', fontSize: 30, opacity: 0.25, rotation: -30, bold: true, layoutMode: 'single', position: 'center' }
  },
  {
    id: 'internal',
    name: '[CHỈ LƯU HÀNH NỘI BỘ]',
    description: 'Cam hổ phách, lưới dày đặc chống chụp màn hình',
    badge: 'Nội bộ',
    config: { type: 'text', text: 'LƯU HÀNH NỘI BỘ - KHÔNG SAO CHÉP', color: '#F59E0B', fontSize: 26, opacity: 0.22, rotation: -35, bold: true, layoutMode: 'tiled' }
  },
  {
    id: 'approved',
    name: '[ĐÃ DUYỆT - APPROVED]',
    description: 'Xanh lá con dấu góc dưới, khẳng định tài liệu hợp lệ',
    badge: 'Phê duyệt',
    config: { type: 'text', text: '✓ ĐÃ DUYỆT / APPROVED', color: '#4EDEA3', fontSize: 28, opacity: 0.40, rotation: 0, bold: true, layoutMode: 'single', position: 'bottom-right' }
  },
  {
    id: 'copyright',
    name: 'BẢN QUYỀN TÁC GIẢ ©',
    description: 'Đóng dấu góc dưới dạng ngang tinh tế',
    badge: 'Bản quyền',
    config: { type: 'text', text: '© COPYRIGHT - ALL RIGHTS RESERVED', color: '#64748B', fontSize: 20, opacity: 0.35, rotation: 0, bold: false, layoutMode: 'single', position: 'bottom-center' }
  }
];

const COLOR_PALETTES = [
  { name: 'Đỏ bảo mật', hex: '#EF4444' },
  { name: 'Xám khói', hex: '#64748B' },
  { name: 'Xanh Navy', hex: '#0EA5E9' },
  { name: 'Hổ phách', hex: '#F59E0B' },
  { name: 'Xanh lục', hex: '#10B981' },
  { name: 'Đen tuyền', hex: '#000000' },
  { name: 'Trắng mờ (cho ảnh tối)', hex: '#FFFFFF' }
];

const FONT_OPTIONS = [
  { name: 'Inter (Khuyên dùng)', value: 'Inter, sans-serif' },
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { name: 'Roboto', value: 'Roboto, sans-serif' },
  { name: 'Courier New', value: '"Courier New", Courier, monospace' },
  { name: 'Impact', value: 'Impact, sans-serif' },
];

// ========================================================================
// UTILITY HELPERS
// ========================================================================

function hexToRgb(hex) {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) cleanHex = cleanHex.split('').map(c => c + c).join('');
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) return { r: 100, g: 100, b: 100 };
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function removeWhiteBackgroundFromCanvas(ctx, width, height, tolerance) {
  tolerance = tolerance || 40;
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (r >= 255 - tolerance && g >= 255 - tolerance && b >= 255 - tolerance) {
      const diff = Math.max(255 - r, 255 - g, 255 - b);
      data[i + 3] = diff === 0 ? 0 : Math.round((diff / tolerance) * data[i + 3]);
    }
  }
  ctx.putImageData(imgData, 0, 0);
}

function getFileCategory(filename, mimeType) {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  if (ext === 'pdf' || mimeType === 'application/pdf') return 'pdf';
  // Chỉ nhận định dạng OOXML thật: .doc/.xls/.ppt/.csv không phải gói ZIP nên
  // đưa vào engine DOCX/XLSX/PPTX chỉ ra lỗi khó hiểu.
  if (ext === 'docx') return 'docx';
  if (ext === 'xlsx') return 'xlsx';
  if (ext === 'pptx') return 'pptx';
  if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'bmp', 'gif', 'avif'].includes(ext)) return 'image';
  return 'unknown';
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function generateId() {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

function readFileAsArrayBuffer(file) {
  return new Promise(function (resolve, reject) {
    const reader = new FileReader();
    reader.onload = function () { resolve(reader.result); };
    reader.onerror = function () { reject(reader.error); };
    reader.readAsArrayBuffer(file);
  });
}

function readFileAsDataURL(file) {
  return new Promise(function (resolve, reject) {
    const reader = new FileReader();
    reader.onload = function () { resolve(reader.result); };
    reader.onerror = function () { reject(reader.error); };
    reader.readAsDataURL(file);
  });
}

function loadImageElement(src) {
  return new Promise(function (resolve, reject) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () { resolve(img); };
    img.onerror = function (e) { reject(e); };
    img.src = src;
  });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Thu hồi quá sớm (1s) làm Safari/Firefox hủy tải tệp lớn.
  setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
}

/** Kích thước ảnh; SVG không khai báo width/height có naturalWidth = 0. */
function imageSize(img) {
  const w = img.naturalWidth || img.width || 0;
  const h = img.naturalHeight || img.height || 0;
  if (w > 0 && h > 0) return { width: w, height: h };
  if (w > 0) return { width: w, height: w };
  if (h > 0) return { width: h, height: h };
  return { width: 512, height: 512 };
}

let watermarkImageCache = { src: null, promise: null };
/** Nạp ảnh logo watermark (có cache theo nguồn). */
async function loadWatermarkImage(config) {
  let src = config.imageDataUrl;
  if (!src && config.imageFile) src = await readFileAsDataURL(config.imageFile);
  if (!src) return null;
  if (watermarkImageCache.src !== src) {
    watermarkImageCache = { src: src, promise: loadImageElement(src) };
  }
  return watermarkImageCache.promise;
}

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

// ========================================================================
// IMAGE ENGINE
// ========================================================================

function getAnchorCoordinates(pos, width, height, padding) {
  const pad = Math.max(40, padding);
  switch (pos) {
    case 'top-left': return { x: pad, y: pad };
    case 'top-center': return { x: width / 2, y: pad };
    case 'top-right': return { x: width - pad, y: pad };
    case 'middle-left': return { x: pad, y: height / 2 };
    case 'middle-right': return { x: width - pad, y: height / 2 };
    case 'bottom-left': return { x: pad, y: height - pad };
    case 'bottom-center': return { x: width / 2, y: height - pad };
    case 'bottom-right': return { x: width - pad, y: height - pad };
    case 'center': default: return { x: width / 2, y: height / 2 };
  }
}

function drawTextWatermark(ctx, width, height, config) {
  const text = config.allCaps ? config.text.toUpperCase() : config.text;
  if (!text.trim()) return;
  ctx.save();
  ctx.globalAlpha = config.opacity;
  ctx.fillStyle = config.color;
  const fontStyle = config.italic ? 'italic ' : '';
  const fontWeight = config.bold ? 'bold ' : 'normal ';
  const baseScale = Math.min(width, height) / 1000;
  const computedFontSize = Math.max(16, Math.round(config.fontSize * Math.max(0.8, baseScale)));
  ctx.font = fontStyle + fontWeight + computedFontSize + 'px ' + config.fontFamily;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const angleRad = (config.rotation * Math.PI) / 180;
  if (config.layoutMode === 'single') {
    const coords = getAnchorCoordinates(config.position, width, height, computedFontSize);
    ctx.save(); ctx.translate(coords.x, coords.y); ctx.rotate(angleRad); ctx.fillText(text, 0, 0); ctx.restore();
  } else {
    const textMetrics = ctx.measureText(text);
    const textW = textMetrics.width;
    const textH = computedFontSize;
    const gapX = Math.max(textW + 60, (config.tileGapX * width) / 500);
    const gapY = Math.max(textH * 3 + 40, (config.tileGapY * height) / 500);
    const diagonal = Math.sqrt(width * width + height * height);
    let row = 0;
    for (let y = -diagonal / 2; y < height + diagonal / 2; y += gapY) {
      const offsetX = (row % 2 === 1) ? gapX / 2 : 0;
      for (let x = -diagonal / 2 - gapX; x < width + diagonal / 2 + gapX; x += gapX) {
        ctx.save(); ctx.translate(x + offsetX, y); ctx.rotate(angleRad); ctx.fillText(text, 0, 0); ctx.restore();
      }
      row++;
    }
  }
  ctx.restore();
}

function drawImageWatermark(ctx, width, height, config, wmImg) {
  if (!wmImg) return;
  const natural = imageSize(wmImg);
  const wmWidth = natural.width;
  const wmHeight = natural.height;
  const offCanvas = document.createElement('canvas');
  offCanvas.width = wmWidth; offCanvas.height = wmHeight;
  const offCtx = offCanvas.getContext('2d');
  if (!offCtx) return;
  offCtx.drawImage(wmImg, 0, 0, wmWidth, wmHeight);
  if (config.removeWhiteBg) removeWhiteBackgroundFromCanvas(offCtx, wmWidth, wmHeight, 35);
  const targetScale = config.imageScale * (Math.min(width, height) / 800);
  const drawW = wmWidth * targetScale, drawH = wmHeight * targetScale;
  const angleRad = (config.rotation * Math.PI) / 180;
  ctx.save(); ctx.globalAlpha = config.opacity;
  if (config.layoutMode === 'single') {
    const coords = getAnchorCoordinates(config.position, width, height, Math.max(drawW, drawH) / 2);
    ctx.save(); ctx.translate(coords.x, coords.y); ctx.rotate(angleRad); ctx.drawImage(offCanvas, -drawW / 2, -drawH / 2, drawW, drawH); ctx.restore();
  } else {
    const gapX = Math.max(drawW + 40, (config.tileGapX * width) / 1000);
    const gapY = Math.max(drawH + 40, (config.tileGapY * height) / 1000);
    const diagonal = Math.sqrt(width * width + height * height);
    for (let x = -diagonal / 2; x < width + diagonal / 2; x += gapX) {
      for (let y = -diagonal / 2; y < height + diagonal / 2; y += gapY) {
        ctx.save(); ctx.translate(x, y); ctx.rotate(angleRad); ctx.drawImage(offCanvas, -drawW / 2, -drawH / 2, drawW, drawH); ctx.restore();
      }
    }
  }
  ctx.restore();
}

async function processImageWatermark(imageFile, config) {
  const dataUrl = await readFileAsDataURL(imageFile);
  const baseImg = await loadImageElement(dataUrl);
  const canvas = document.createElement('canvas');
  const { width, height } = imageSize(baseImg);
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context error');
  const mimeType = outputImageMime(imageFile);
  if (mimeType === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(baseImg, 0, 0, width, height);
  if (config.type === 'text') drawTextWatermark(ctx, width, height, config);
  else if (config.type === 'image' && (config.imageDataUrl || config.imageFile)) {
    const wmImg = await loadWatermarkImage(config);
    if (wmImg) drawImageWatermark(ctx, width, height, config, wmImg);
  }
  return new Promise(function (resolve, reject) {
    canvas.toBlob(function (blob) { if (blob) resolve(blob); else reject(new Error('Image export error')); }, mimeType, 0.95);
  });
}

/** Chỉ JPEG/WebP được mã hóa lại đúng định dạng; GIF/BMP/AVIF/SVG → PNG. */
function outputImageMime(file) {
  const type = (file && file.type) || '';
  const ext = ((file && file.name) || '').split('.').pop().toLowerCase();
  if (type === 'image/jpeg' || type === 'image/jpg' || ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (type === 'image/webp' || ext === 'webp') return 'image/webp';
  return 'image/png';
}

const MIME_EXT = { 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/png': 'png' };

/** Tên tệp kết quả: đuôi theo định dạng thực tế của blob (ảnh GIF → .png…). */
function resultFileName(item, blob) {
  const dot = item.name.lastIndexOf('.');
  const stem = dot > 0 ? item.name.slice(0, dot) : item.name;
  let ext = dot > 0 ? item.name.slice(dot + 1) : '';
  if (item.category === 'image' && blob && MIME_EXT[blob.type]) {
    const current = ext.toLowerCase() === 'jpeg' ? 'jpg' : ext.toLowerCase();
    if (current !== MIME_EXT[blob.type]) ext = MIME_EXT[blob.type];
  }
  return 'watermarked_' + stem + (ext ? '.' + ext : '');
}

// ========================================================================
// PDF ENGINE
// ========================================================================

async function generateWatermarkImage(config, targetWidth, targetHeight) {
  const canvas = document.createElement('canvas');
  const dpr = 2;
  canvas.width = targetWidth * dpr; canvas.height = targetHeight * dpr;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas error');
  ctx.scale(dpr, dpr);
  if (config.type === 'text') {
    const text = config.allCaps ? config.text.toUpperCase() : config.text;
    ctx.fillStyle = config.color;
    const fontStyle = config.italic ? 'italic ' : '';
    const fontWeight = config.bold ? 'bold ' : 'normal ';
    ctx.font = fontStyle + fontWeight + config.fontSize + 'px ' + config.fontFamily;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const metrics = ctx.measureText(text);
    const textW = Math.max(100, metrics.width + 40);
    const textH = Math.max(50, config.fontSize * 1.6);
    const stampCanvas = document.createElement('canvas');
    stampCanvas.width = textW * dpr; stampCanvas.height = textH * dpr;
    const sCtx = stampCanvas.getContext('2d');
    if (sCtx) {
      sCtx.scale(dpr, dpr); sCtx.fillStyle = config.color;
      sCtx.font = fontStyle + fontWeight + config.fontSize + 'px ' + config.fontFamily;
      sCtx.textAlign = 'center'; sCtx.textBaseline = 'middle';
      sCtx.fillText(text, textW / 2, textH / 2);
      return { dataUrl: stampCanvas.toDataURL('image/png'), width: textW, height: textH };
    }
  } else if (config.type === 'image' && (config.imageDataUrl || config.imageFile)) {
    const img = await loadWatermarkImage(config);
    if (img) {
      const natural = imageSize(img);
      const w = natural.width * config.imageScale;
      const h = natural.height * config.imageScale;
      const stampCanvas2 = document.createElement('canvas');
      stampCanvas2.width = Math.max(1, Math.round(w * dpr)); stampCanvas2.height = Math.max(1, Math.round(h * dpr));
      const sCtx2 = stampCanvas2.getContext('2d');
      if (sCtx2) {
        sCtx2.scale(dpr, dpr); sCtx2.drawImage(img, 0, 0, w, h);
        if (config.removeWhiteBg) removeWhiteBackgroundFromCanvas(sCtx2, stampCanvas2.width, stampCanvas2.height, 35);
        return { dataUrl: stampCanvas2.toDataURL('image/png'), width: w, height: h };
      }
    }
  }
  return { dataUrl: canvas.toDataURL('image/png'), width: targetWidth, height: targetHeight };
}

function getPdfAnchorCoordinates(pos, pageWidth, pageHeight) {
  const pad = 60;
  switch (pos) {
    case 'top-left': return { x: pad, y: pageHeight - pad };
    case 'top-center': return { x: pageWidth / 2, y: pageHeight - pad };
    case 'top-right': return { x: pageWidth - pad, y: pageHeight - pad };
    case 'middle-left': return { x: pad, y: pageHeight / 2 };
    case 'middle-right': return { x: pageWidth - pad, y: pageHeight / 2 };
    case 'bottom-left': return { x: pad, y: pad };
    case 'bottom-center': return { x: pageWidth / 2, y: pad };
    case 'bottom-right': return { x: pageWidth - pad, y: pad };
    case 'center': default: return { x: pageWidth / 2, y: pageHeight / 2 };
  }
}

/**
 * Chỉ số trang (0-based) cần đóng dấu theo cấu hình. `pageRange` dạng "1-3, 5, 8-".
 * Ném lỗi nếu dải không hợp lệ thay vì âm thầm đóng dấu cả tệp.
 */
function selectPdfPages(config, pageCount) {
  if (config.targetPages === 'first') return [0];
  if (config.targetPages !== 'range') return Array.from({ length: pageCount }, function (_, i) { return i; });
  const picked = new Set();
  const parts = String(config.pageRange || '').split(',').map(function (p) { return p.trim(); }).filter(Boolean);
  for (const part of parts) {
    const m = part.match(/^(\d+)\s*(?:-\s*(\d*))?$/);
    if (!m) throw new Error('Dải trang không hợp lệ: "' + part + '"');
    const start = Number(m[1]);
    const end = part.includes('-') ? (m[2] ? Number(m[2]) : pageCount) : start;
    if (start < 1 || end < start) throw new Error('Dải trang không hợp lệ: "' + part + '"');
    for (let p = start; p <= Math.min(end, pageCount); p++) picked.add(p - 1);
  }
  if (picked.size === 0) throw new Error('Dải trang không khớp trang nào của tệp (có ' + pageCount + ' trang).');
  return Array.from(picked).sort(function (a, b) { return a - b; });
}

async function processPdfWatermark(pdfFile, config, onProgress) {
  const { PDFDocument, degrees } = await loadPdfLib();
  const arrayBuffer = await readFileAsArrayBuffer(pdfFile);
  let pdfDoc;
  try {
    pdfDoc = await PDFDocument.load(arrayBuffer);
  } catch (err) {
    if (isPdfLibEncryptedError(err)) throw new Error(encryptedPdfMessage('vi'));
    throw err;
  }
  const pages = pdfDoc.getPages();
  const pageCount = pages.length;
  const targetIndices = selectPdfPages(config, pageCount);
  const firstPage = pages[0];
  const size = firstPage.getSize();
  const watermarkStamp = await generateWatermarkImage(config, size.width, size.height);
  const pngResponse = await fetch(watermarkStamp.dataUrl);
  const pngBytes = await pngResponse.arrayBuffer();
  const embeddedPng = await pdfDoc.embedPng(pngBytes);
  const stampW = watermarkStamp.width, stampH = watermarkStamp.height;
  const rotationAngle = -config.rotation;
  const rad = (rotationAngle * Math.PI) / 180;
  const cosA = Math.cos(rad);
  const sinA = Math.sin(rad);
  const centerOffsetX = (stampW / 2) * cosA - (stampH / 2) * sinA;
  const centerOffsetY = (stampW / 2) * sinA + (stampH / 2) * cosA;

  for (let t = 0; t < targetIndices.length; t++) {
    const page = pages[targetIndices[t]];
    const pgSize = page.getSize();
    if (config.layoutMode === 'single') {
      const center = getPdfAnchorCoordinates(config.position, pgSize.width, pgSize.height);
      page.drawImage(embeddedPng, {
        x: center.x - centerOffsetX,
        y: center.y - centerOffsetY,
        width: stampW,
        height: stampH,
        rotate: degrees(rotationAngle),
        opacity: config.opacity
      });
    } else {
      const gapX = Math.max(stampW + 60, (config.tileGapX * pgSize.width) / 500);
      const gapY = Math.max(stampH * 2 + 40, (config.tileGapY * pgSize.height) / 500);
      const diagonal = Math.sqrt(pgSize.width * pgSize.width + pgSize.height * pgSize.height);
      let row = 0;
      for (let y = -diagonal / 2; y < pgSize.height + diagonal / 2; y += gapY) {
        const offsetX = (row % 2 === 1) ? gapX / 2 : 0;
        for (let x = -diagonal / 2 - gapX; x < pgSize.width + diagonal / 2 + gapX; x += gapX) {
          page.drawImage(embeddedPng, {
            x: (x + offsetX) - centerOffsetX,
            y: y - centerOffsetY,
            width: stampW,
            height: stampH,
            rotate: degrees(rotationAngle),
            opacity: config.opacity
          });
        }
        row++;
      }
    }
    if (onProgress) onProgress(Math.round(((t + 1) / targetIndices.length) * 100));
  }
  if (config.addTimestampHidden) {
    // Ghi thời điểm đóng dấu vào metadata (Keywords/ModDate) — ai có tệp đều đọc/sửa được.
    const stampedAt = new Date();
    const existing = pdfDoc.getKeywords();
    pdfDoc.setKeywords([existing, 'watermarked:' + stampedAt.toISOString()].filter(Boolean));
    pdfDoc.setModificationDate(stampedAt);
  }
  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}

// ========================================================================
// DOCX ENGINE
// ========================================================================

/** Ảnh logo đã khử nền (nếu chọn) dưới dạng PNG bytes + kích thước gốc. */
async function prepareLogoPng(config) {
  const img = await loadWatermarkImage(config);
  if (!img) throw new Error('Chưa chọn ảnh logo làm watermark');
  const natural = imageSize(img);
  const canvas = document.createElement('canvas');
  canvas.width = natural.width; canvas.height = natural.height;
  const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Canvas error');
  ctx.drawImage(img, 0, 0, natural.width, natural.height);
  if (config.removeWhiteBg) removeWhiteBackgroundFromCanvas(ctx, canvas.width, canvas.height, 35);
  const pngBlob = await new Promise(function (resolve) { canvas.toBlob(function (b) { resolve(b); }, 'image/png'); });
  if (!pngBlob) throw new Error('Không xuất được ảnh logo');
  return { bytes: new Uint8Array(await readFileAsArrayBuffer(pngBlob)), width: natural.width, height: natural.height };
}

const VML_NS_ATTRS = ' xmlns:w="' + OOXML_NS.w + '" xmlns:r="' + OOXML_NS.r + '" xmlns:v="' + OOXML_NS.v + '" xmlns:o="' + OOXML_NS.o + '"';

async function processDocxWatermark(docxFile, config) {
  const JSZip = await loadJSZip();
  const zip = await JSZip.loadAsync(await readFileAsArrayBuffer(docxFile));
  const rotation = Math.round(config.rotation);
  const opacity = config.opacity.toFixed(2);
  let watermark;
  if (config.type === 'text') {
    const text = config.allCaps ? config.text.toUpperCase() : config.text;
    const escapedText = escapeXml(text);
    const font = escapeXml(config.fontFamily.split(',')[0].replace(/['"]/g, '').trim());
    const weight = config.bold ? 'bold' : 'normal';
    const style = config.italic ? 'italic' : 'normal';
    const color = escapeXml(config.color);
    watermark = {
      paragraphXml: function () {
        return '<w:p' + VML_NS_ATTRS + '><w:pPr><w:pStyle w:val="Header"/></w:pPr><w:r><w:rPr><w:noProof/></w:rPr><w:pict><v:shapetype id="_x0000_t136" coordsize="21600,21600" o:spt="136" adj="10800" path="m@7,l@8,m@5,21600l@6,21600e"><v:textpath on="t" fitshape="t"/><v:path textpathok="t" o:connecttype="custom"/><o:lock v:ext="edit" text="t" shapetype="t"/></v:shapetype><v:shape id="WatermarkStudioText" o:spid="_x0000_s2049" type="#_x0000_t136" style="position:absolute;margin-left:0;margin-top:0;width:468pt;height:156pt;z-index:-251657216;mso-position-horizontal:center;mso-position-horizontal-relative:margin;mso-position-vertical:center;mso-position-vertical-relative:margin;rotation:' + rotation + '" o:allowincell="f" fillcolor="' + color + '" stroked="f"><v:fill opacity="' + opacity + '"/><v:textpath style="font-family:&quot;' + font + '&quot;;font-weight:' + weight + ';font-style:' + style + '" string="' + escapedText + '"/></v:shape></w:pict></w:r></w:p>';
      }
    };
  } else {
    const logo = await prepareLogoPng(config);
    // Giữ tỉ lệ ảnh gốc: logo vuông cũ bị ép thành hình vuông.
    const box = fitAspect(logo.width, logo.height, Math.max(20, 350 * config.imageScale));
    watermark = {
      image: { bytes: logo.bytes, ext: 'png' },
      paragraphXml: function (relId) {
        return '<w:p' + VML_NS_ATTRS + '><w:pPr><w:pStyle w:val="Header"/></w:pPr><w:r><w:rPr><w:noProof/></w:rPr><w:pict><v:shape id="WatermarkStudioImage" o:spid="_x0000_s2050" type="#_x0000_t75" style="position:absolute;margin-left:0;margin-top:0;width:' + box.width + 'pt;height:' + box.height + 'pt;z-index:-251657216;mso-position-horizontal:center;mso-position-horizontal-relative:margin;mso-position-vertical:center;mso-position-vertical-relative:margin;rotation:' + rotation + '" o:allowincell="f" stroked="f"><v:imagedata r:id="' + relId + '" o:title="watermark"/><v:fill opacity="' + opacity + '"/></v:shape></w:pict></w:r></w:p>';
      }
    };
  }
  await applyDocxWatermark(zip, watermark);
  return await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', compression: 'DEFLATE', compressionOptions: { level: 6 } });
}

// ========================================================================
// XLSX ENGINE
// ========================================================================

async function createExcelWatermarkImageBlob(config) {
  const canvas = document.createElement('canvas');
  const tileWidth = 700, tileHeight = 500;
  canvas.width = tileWidth; canvas.height = tileHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas error');
  ctx.clearRect(0, 0, tileWidth, tileHeight);
  if (config.type === 'text') {
    const text = config.allCaps ? config.text.toUpperCase() : config.text;
    ctx.save(); ctx.globalAlpha = config.opacity; ctx.fillStyle = config.color;
    const fontStyle = config.italic ? 'italic ' : '';
    const fontWeight = config.bold ? 'bold ' : 'normal ';
    ctx.font = fontStyle + fontWeight + config.fontSize + 'px ' + config.fontFamily;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.translate(tileWidth / 2, tileHeight / 2);
    ctx.rotate((config.rotation * Math.PI) / 180);
    ctx.fillText(text, 0, 0); ctx.restore();
  } else {
    const img = await loadWatermarkImage(config);
    if (img) {
      const natural = imageSize(img);
      const w = natural.width * config.imageScale;
      const h = natural.height * config.imageScale;
      ctx.save(); ctx.globalAlpha = config.opacity;
      ctx.translate(tileWidth / 2, tileHeight / 2);
      ctx.rotate((config.rotation * Math.PI) / 180);
      const offCanvas = document.createElement('canvas');
      offCanvas.width = natural.width; offCanvas.height = natural.height;
      const offCtx = offCanvas.getContext('2d');
      if (offCtx) {
        offCtx.drawImage(img, 0, 0, natural.width, natural.height);
        if (config.removeWhiteBg) removeWhiteBackgroundFromCanvas(offCtx, offCanvas.width, offCanvas.height, 35);
        ctx.drawImage(offCanvas, -w / 2, -h / 2, w, h);
      }
      ctx.restore();
    }
  }
  return new Promise(function (resolve) { canvas.toBlob(function (blob) { resolve(blob); }, 'image/png'); });
}

async function processXlsxWatermark(xlsxFile, config) {
  const JSZip = await loadJSZip();
  const zip = await JSZip.loadAsync(await readFileAsArrayBuffer(xlsxFile));
  const imgBlob = await createExcelWatermarkImageBlob(config);
  const imgBytes = new Uint8Array(await readFileAsArrayBuffer(imgBlob));
  await applyXlsxBackground(zip, imgBytes);
  return await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', compression: 'DEFLATE', compressionOptions: { level: 6 } });
}

// ========================================================================
// PPTX ENGINE
// ========================================================================

const PPTX_NS_ATTRS = ' xmlns:p="' + OOXML_NS.p + '" xmlns:a="' + OOXML_NS.a + '" xmlns:r="' + OOXML_NS.r + '"';

async function processPptxWatermark(pptxFile, config) {
  const JSZip = await loadJSZip();
  const zip = await JSZip.loadAsync(await readFileAsArrayBuffer(pptxFile));
  const opacityValue = Math.round(config.opacity * 100000);
  const rotValue = Math.round(config.rotation * 60000);
  const rgbVal = hexToRgb(config.color);
  const hexColor = ((1 << 24) + (rgbVal.r << 16) + (rgbVal.g << 8) + rgbVal.b).toString(16).slice(1).toUpperCase();
  let watermark;
  if (config.type === 'text') {
    const text = config.allCaps ? config.text.toUpperCase() : config.text;
    const escapedText = escapeXml(text);
    const font = escapeXml(config.fontFamily.split(',')[0].replace(/['"]/g, '').trim());
    const szVal = Math.round(config.fontSize * 100);
    watermark = {
      shapeXml: function (ctx) {
        // Hộp chữ chiếm 80% x 40% slide, căn giữa theo kích thước slide thật (p:sldSz).
        const cx = Math.round(ctx.slideSize.cx * 0.8), cy = Math.round(ctx.slideSize.cy * 0.4);
        const offX = Math.round((ctx.slideSize.cx - cx) / 2), offY = Math.round((ctx.slideSize.cy - cy) / 2);
        return '<p:sp' + PPTX_NS_ATTRS + '><p:nvSpPr><p:cNvPr id="' + ctx.id + '" name="WatermarkText ' + ctx.id + '"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm rot="' + rotValue + '"><a:off x="' + offX + '" y="' + offY + '"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr><p:txBody><a:bodyPr wrap="square" lIns="0" tIns="0" rIns="0" bIns="0" anchor="ctr"/><a:lstStyle/><a:p><a:pPr algn="ctr"/><a:r><a:rPr lang="vi-VN" sz="' + szVal + '" b="' + (config.bold ? 1 : 0) + '" i="' + (config.italic ? 1 : 0) + '"><a:solidFill><a:srgbClr val="' + hexColor + '"><a:alpha val="' + opacityValue + '"/></a:srgbClr></a:solidFill><a:latin typeface="' + font + '"/><a:ea typeface="' + font + '"/><a:cs typeface="' + font + '"/></a:rPr><a:t>' + escapedText + '</a:t></a:r></a:p></p:txBody></p:sp>';
      }
    };
  } else {
    const logo = await prepareLogoPng(config);
    watermark = {
      image: { bytes: logo.bytes, ext: 'png' },
      shapeXml: function (ctx) {
        const longSide = Math.min(ctx.slideSize.cx, ctx.slideSize.cy) * 0.75 * Math.min(1.5, config.imageScale * 1.6);
        const box = fitAspect(logo.width, logo.height, longSide);
        const offX = Math.round((ctx.slideSize.cx - box.width) / 2), offY = Math.round((ctx.slideSize.cy - box.height) / 2);
        return '<p:pic' + PPTX_NS_ATTRS + '><p:nvPicPr><p:cNvPr id="' + ctx.id + '" name="WatermarkPicture ' + ctx.id + '"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="' + ctx.relId + '"><a:alphaModFix amt="' + opacityValue + '"/></a:blip><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr><a:xfrm rot="' + rotValue + '"><a:off x="' + offX + '" y="' + offY + '"/><a:ext cx="' + box.width + '" cy="' + box.height + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>';
      }
    };
  }
  await applyPptxWatermark(zip, watermark);
  return await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', compression: 'DEFLATE', compressionOptions: { level: 6 } });
}

// ========================================================================
// WATERMARK PROCESSOR (Router)
// ========================================================================

async function processFileItem(item, config, onProgress) {
  const category = item.category || getFileCategory(item.name, item.file.type);
  let resultBlob;
  switch (category) {
    case 'pdf': resultBlob = await processPdfWatermark(item.file, config, onProgress); break;
    case 'image': if (onProgress) onProgress(30); resultBlob = await processImageWatermark(item.file, config); if (onProgress) onProgress(100); break;
    case 'docx': if (onProgress) onProgress(30); resultBlob = await processDocxWatermark(item.file, config); if (onProgress) onProgress(100); break;
    case 'xlsx': if (onProgress) onProgress(30); resultBlob = await processXlsxWatermark(item.file, config); if (onProgress) onProgress(100); break;
    case 'pptx': if (onProgress) onProgress(30); resultBlob = await processPptxWatermark(item.file, config); if (onProgress) onProgress(100); break;
    default: throw new Error('Unsupported format: .' + item.extension);
  }
  return { resultBlob: resultBlob, resultName: resultFileName(item, resultBlob) };
}

// ========================================================================
// SAMPLE FILE GENERATORS
// ========================================================================

async function createSamplePdf() {
  const { PDFDocument, rgb, StandardFonts } = await loadPdfLib();
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  page.drawText('CONG TY CO PHAN CONG NGHE WATERMARK STUDIO', { x: 50, y: 780, size: 14, font: font, color: rgb(0.1, 0.2, 0.4) });
  page.drawText('BAO CAO TAI CHINH & HOAT DONG KINH DOANH 2026', { x: 50, y: 750, size: 16, font: font, color: rgb(0.2, 0.2, 0.2) });
  for (let i = 0; i < 8; i++) {
    page.drawText('Muc ' + (i + 1) + ': Noi dung chi tiet ve ke hoach trien khai.', { x: 50, y: 680 - i * 35, size: 11, font: regularFont, color: rgb(0.3, 0.3, 0.3) });
  }
  const pdfBytes = await pdfDoc.save();
  return new File([pdfBytes], 'Hop_Dong_Dich_Vu_Bao_Mat_2026.pdf', { type: 'application/pdf' });
}

async function createSampleDocx() {
  const JSZip = await loadJSZip();
  const zip = new JSZip();
  zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  zip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  zip.file('word/document.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>HOP DONG NGUYEN TAC CUNG CAP DICH VU</w:t></w:r></w:p><w:p><w:r><w:t>So: 88/2026/HDNT-WMSTUDIO</w:t></w:r></w:p><w:sectPr/></w:body></w:document>');
  zip.file('word/_rels/document.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>');
  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  return new File([blob], 'Hop_Dong_Dich_Vu.docx', { type: blob.type });
}

async function createSampleImage() {
  const canvas = document.createElement('canvas');
  canvas.width = 1200; canvas.height = 800;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 1200, 800);
    grad.addColorStop(0, '#1e1b4b'); grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 1200, 800);
    ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 4; ctx.strokeRect(60, 60, 1080, 680);
    ctx.fillStyle = '#0ea5e9'; ctx.beginPath(); ctx.arc(600, 350, 100, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 36px Inter, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('BAN VE THIET KE KIEN TRUC 4K', 600, 520);
  }
  const blob = await new Promise(function (resolve) { canvas.toBlob(function (b) { resolve(b); }, 'image/png'); });
  return new File([blob], 'Ban_Ve_Thiet_Ke_Villa.png', { type: 'image/png' });
}

async function generateAllSampleFiles() {
  const results = await Promise.all([createSamplePdf(), createSampleImage(), createSampleDocx()]);
  const makeItem = function (file, cat, ext) {
    return { id: generateId(), file: file, name: file.name, size: file.size, category: cat, extension: ext, status: 'pending', progress: 0 };
  };
  return [makeItem(results[0], 'pdf', 'pdf'), makeItem(results[1], 'image', 'png'), makeItem(results[2], 'docx', 'docx')];
}

function createSampleStampSvg(type) {
  if (type === 'confidential') return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><circle cx="150" cy="150" r="140" fill="none" stroke="%23EF4444" stroke-width="8" stroke-dasharray="10 5"/><circle cx="150" cy="150" r="120" fill="none" stroke="%23EF4444" stroke-width="4"/><text x="150" y="155" font-family="Arial, sans-serif" font-weight="900" font-size="28" fill="%23EF4444" text-anchor="middle">CONFIDENTIAL</text></svg>';
  if (type === 'approved') return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect x="15" y="15" width="270" height="270" rx="20" fill="none" stroke="%234EDEA3" stroke-width="8"/><text x="150" y="155" font-family="Arial, sans-serif" font-weight="900" font-size="32" fill="%234EDEA3" text-anchor="middle">APPROVED</text></svg>';
  return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><circle cx="150" cy="150" r="135" fill="none" stroke="%230EA5E9" stroke-width="6"/><polygon points="150,40 180,110 255,115 200,165 215,240 150,200 85,240 100,165 45,115 120,110" fill="none" stroke="%230EA5E9" stroke-width="4"/><text x="150" y="270" font-family="Arial, sans-serif" font-weight="700" font-size="18" fill="%230EA5E9" text-anchor="middle">OFFICIAL STAMP</text></svg>';
}

// ========================================================================
// MAIN VIEW COMPONENT — WatermarkStudioView
// ========================================================================

export default function WatermarkStudioView({ displayLang = 'vi' } = {}) {
  const [config, setConfig] = useState(DEFAULT_WATERMARK_CONFIG);
  const [fileItems, setFileItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [controlTab, setControlTab] = useState('text');
  const [contrastMode, setContrastMode] = useState(false);
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(false);
  const [bgImage, setBgImage] = useState(null);
  const wmImageInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [notice, setNotice] = useState('');
  const fileInputRef = useRef(null);

  const stats = useMemo(function () {
    return {
      total: fileItems.length,
      done: fileItems.filter(function (i) { return i.status === 'done'; }).length,
      error: fileItems.filter(function (i) { return i.status === 'error'; }).length,
      processing: isProcessing
    };
  }, [fileItems, isProcessing]);

  const activeFile = useMemo(function () {
    return fileItems.find(function (i) { return i.id === selectedId; }) || fileItems[0] || null;
  }, [fileItems, selectedId]);

  useEffect(function () {
    let isMounted = true;
    if (activeFile && activeFile.category === 'image') {
      readFileAsDataURL(activeFile.file).then(function (url) {
        const img = new Image(); img.crossOrigin = 'anonymous';
        img.onload = function () { if (isMounted) setBgImage(img); };
        img.onerror = function () { if (isMounted) setBgImage(null); };
        img.src = url;
      }).catch(function () {
        if (isMounted) setBgImage(null);
      });
    } else if (activeFile && activeFile.category === 'pdf') {
      readFileAsArrayBuffer(activeFile.file).then(async function (buffer) {
        let pdf = null;
        try {
          pdf = await openPdfDocument(buffer);
          const page = await pdf.getPage(1);
          const viewport = page.getViewport({ scale: 1.5 });
          const offscreenCanvas = document.createElement('canvas');
          offscreenCanvas.width = viewport.width;
          offscreenCanvas.height = viewport.height;
          const offscreenCtx = offscreenCanvas.getContext('2d');
          if (offscreenCtx) {
            offscreenCtx.fillStyle = '#ffffff';
            offscreenCtx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
            await page.render({ canvasContext: offscreenCtx, viewport }).promise;
            const dataUrl = offscreenCanvas.toDataURL('image/png');
            const img = new Image();
            img.onload = function () { if (isMounted) setBgImage(img); };
            img.onerror = function () { if (isMounted) setBgImage(null); };
            img.src = dataUrl;
          }
          page.cleanup();
        } catch (err) {
          console.warn('PDF preview render error, using document mockup fallback:', err);
          if (isMounted) setBgImage(null);
        } finally {
          destroyPdfDocument(pdf);
        }
      }).catch(function (err) {
        console.warn('Error reading PDF file for preview:', err);
        if (isMounted) setBgImage(null);
      });
    } else {
      Promise.resolve().then(function () {
        if (isMounted) setBgImage(null);
      });
    }
    return function () { isMounted = false; };
  }, [activeFile]);

  useEffect(function () {
    const canvas = canvasRef.current; if (!canvas) return undefined;
    const ctx = canvas.getContext('2d'); if (!ctx) return undefined;
    // Ảnh logo nạp bất đồng bộ: vẽ toàn bộ khung trong MỘT lần sau khi ảnh sẵn
    // sàng, và bỏ kết quả nếu cấu hình đã đổi (tránh lần vẽ cũ đè lên lần mới).
    let cancelled = false;
    const render = function (wmImg) {
    if (cancelled) return;
    let width = 540, height = 760;
    if (bgImage) {
      const imgAspect = bgImage.naturalWidth / bgImage.naturalHeight;
      if (imgAspect >= 1) { width = 640; height = Math.round(640 / imgAspect); }
      else { height = 760; width = Math.round(760 * imgAspect); }
    }
    canvas.width = width; canvas.height = height;

    if (bgImage) {
      ctx.drawImage(bgImage, 0, 0, width, height);
    } else {
      ctx.fillStyle = contrastMode ? '#0b1326' : '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Render document lines
      ctx.fillStyle = contrastMode ? '#1e293b' : '#f1f5f9';
      ctx.fillRect(40, 40, 160, 20);
      ctx.fillRect(40, 68, 100, 10);

      let startY = 120;
      for (let i = 0; i < 14; i++) {
        ctx.fillStyle = contrastMode ? '#171f33' : (i % 4 === 0 ? '#e2e8f0' : '#f8fafc');
        ctx.fillRect(40, startY, i % 3 === 0 ? width - 140 : width - 80, 10);
        startY += 22;
      }
      ctx.strokeStyle = contrastMode ? '#334155' : '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.strokeRect(40, startY + 15, width - 80, 90);

      ctx.fillStyle = contrastMode ? '#64748b' : '#94a3b8';
      ctx.font = '11px Inter, sans-serif';
      const docLabel = activeFile ? (activeFile.name + ' (' + activeFile.category.toUpperCase() + ')') : 'Watermark Studio — AI-Tools Master Hub';
      ctx.fillText(docLabel, 40, height - 30);
    }

    if (showGrid) {
      ctx.save();
      ctx.strokeStyle = contrastMode ? 'rgba(56, 189, 248, 0.2)' : 'rgba(14, 165, 233, 0.2)';
      ctx.lineWidth = 1;
      for (let gx = 0; gx < width; gx += 40) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, height); ctx.stroke(); }
      for (let gy = 0; gy < height; gy += 40) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(width, gy); ctx.stroke(); }
      ctx.restore();
    }

    if (config.type === 'text') drawTextWatermark(ctx, width, height, config);
    else if (config.type === 'image') drawImageWatermark(ctx, width, height, config, wmImg);
    };
    if (config.type === 'image' && (config.imageDataUrl || config.imageFile)) {
      loadWatermarkImage(config).then(render).catch(function () { render(null); });
    } else {
      render(null);
    }
    return function () { cancelled = true; };
  }, [config, bgImage, showGrid, contrastMode, activeFile]);

  const handleFilesAdded = useCallback(function (newItems) {
    setFileItems(function (prev) { return prev.concat(newItems); });
    if (!selectedId && newItems.length > 0) setSelectedId(newItems[0].id);
  }, [selectedId]);

  const handleLoadSamples = useCallback(async function () {
    const samples = await generateAllSampleFiles();
    setFileItems(function (prev) { return prev.concat(samples); });
    setSelectedId(samples[0].id);
  }, []);

  const handleRemoveFile = useCallback(function (id) {
    setFileItems(function (prev) {
      const remaining = prev.filter(function (i) { return i.id !== id; });
      if (selectedId === id) setSelectedId(remaining.length > 0 ? remaining[0].id : null);
      return remaining;
    });
  }, [selectedId]);

  const handleClearAll = useCallback(function () {
    setFileItems([]);
    setSelectedId(null);
    setNotice('');
  }, []);

  // Đổi cấu hình thì kết quả đã đóng dấu không còn khớp → đưa về "Sẵn sàng".
  const invalidateResults = useCallback(function () {
    setFileItems(function (prev) {
      if (!prev.some(function (i) { return i.status === 'done' || i.status === 'error'; })) return prev;
      return prev.map(function (i) {
        return (i.status === 'done' || i.status === 'error')
          ? Object.assign({}, i, { status: 'pending', progress: 0, resultBlob: null, resultName: null, errorMessage: null })
          : i;
      });
    });
  }, []);

  const handleApplyPreset = useCallback(function (preset) {
    setConfig(function (prev) { return Object.assign({}, prev, preset.config); });
    invalidateResults();
  }, [invalidateResults]);

  const handleConfigChange = useCallback(function (updates) {
    setConfig(function (prev) { return Object.assign({}, prev, updates); });
    invalidateResults();
  }, [invalidateResults]);

  const handleProcessAll = useCallback(async function () {
    if (fileItems.length === 0 || isProcessing) return;
    setIsProcessing(true);
    const updatedItems = fileItems.map(function (i) { return Object.assign({}, i); });
    for (let i = 0; i < updatedItems.length; i++) {
      const item = updatedItems[i];
      item.status = 'processing';
      item.progress = 10;
      setFileItems(updatedItems.slice());
      try {
        const result = await processFileItem(item, config, function (prog) {
          item.progress = prog;
          setFileItems(updatedItems.slice());
        });
        item.status = 'done';
        item.progress = 100;
        item.resultBlob = result.resultBlob;
        item.resultName = result.resultName;
        item.errorMessage = null;
      } catch (err) {
        console.error('Error processing ' + item.name + ':', err);
        item.status = 'error';
        item.errorMessage = err.message || 'Lỗi không xác định';
      }
      setFileItems(updatedItems.slice());
    }
    setIsProcessing(false);
    setIsExportOpen(true);
  }, [fileItems, isProcessing, config]);

  const handleDownloadZip = useCallback(async function () {
    const doneItems = fileItems.filter(function (i) { return i.status === 'done' && i.resultBlob; });
    if (doneItems.length === 0) return;
    const JSZip = await loadJSZip();
    const zip = new JSZip();
    const usedNames = new Set();
    for (let i = 0; i < doneItems.length; i++) {
      // Hai tệp trùng tên (từ hai thư mục) trước đây ghi đè nhau trong ZIP.
      const original = doneItems[i].resultName || ('watermarked_' + doneItems[i].name);
      const dot = original.lastIndexOf('.');
      const stem = dot > 0 ? original.slice(0, dot) : original;
      const ext = dot > 0 ? original.slice(dot) : '';
      let entry = original;
      let n = 2;
      while (usedNames.has(entry.toLowerCase())) entry = stem + ' (' + (n++) + ')' + ext;
      usedNames.add(entry.toLowerCase());
      zip.file(entry, doneItems[i].resultBlob);
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, 'watermark_studio_batch.zip');
  }, [fileItems]);

  const processFiles = useCallback(async function (incoming) {
    const validation = validateDocumentFiles(incoming, fileItems, WATERMARK_LIMITS);
    const problems = rejectionMessages(validation.rejected);
    const files = [];
    for (const file of validation.accepted) {
      if (await verifyDocumentSignature(file)) files.push(file);
      else problems.push(file.name + ': nội dung không khớp phần mở rộng');
    }
    setNotice(problems.join(' • '));
    if (files.length === 0) return;
    const newItems = files.map(function (file) {
      const ext = (file.name.split('.').pop() || '').toLowerCase();
      return {
        id: generateId(),
        file: file,
        name: file.name,
        size: file.size,
        category: getFileCategory(file.name, file.type),
        extension: ext,
        status: 'pending',
        progress: 0
      };
    });
    handleFilesAdded(newItems);
  }, [handleFilesAdded, fileItems]);

  const handleWmImageChange = useCallback(async function (e) {
    const input = e.target;
    const file = input.files && input.files[0];
    input.value = '';
    if (!file) return;
    if (file.size > 15 * MIB) {
      setNotice(file.name + ': logo vượt 15 MiB');
      return;
    }
    const dataUrl = await readFileAsDataURL(file);
    handleConfigChange({ type: 'image', imageFile: file, imageDataUrl: dataUrl });
  }, [handleConfigChange]);

  const handleTabClick = useCallback(function (tab) {
    setControlTab(tab);
    if (tab === 'text' && config.type !== 'text') handleConfigChange({ type: 'text' });
    else if (tab === 'image' && config.type !== 'image') handleConfigChange({ type: 'image' });
  }, [config.type, handleConfigChange]);

  const renderFileIcon = function (cat) {
    switch (cat) {
      case 'pdf': return <FileText className="w-5 h-5 text-red-400" />;
      case 'docx': return <FileText className="w-5 h-5 text-blue-400" />;
      case 'xlsx': return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
      case 'pptx': return <Presentation className="w-5 h-5 text-amber-400" />;
      default: return <ImageIcon className="w-5 h-5 text-purple-400" />;
    }
  };

  const hasFiles = stats.total > 0;
  const isAllDone = stats.total > 0 && stats.done === stats.total;

  return (
    <div className="w-full flex flex-col space-y-8 pb-12">
      {/* ==================================================================== */}
      {/* 1. BREADCRUMB & TOOL HEADER                                         */}
      {/* ==================================================================== */}
      <section className="flex flex-col space-y-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-on-surface-variant text-xs font-mono">
          <a href="#/tat-ca" className="hover:text-primary transition-colors flex items-center gap-1">
            <Home className="w-3.5 h-3.5" />
            <span>Trang chủ</span>
          </a>
          <span className="text-outline-variant">/</span>
          <a href="#/hinh-anh-webp" className="hover:text-primary transition-colors">Hình ảnh & WebP</a>
          <span className="text-outline-variant">/</span>
          <span className="text-on-surface font-medium">
            {displayLang === 'en' ? 'Document Watermark' : displayLang === 'ja' ? '文書透かし・押印' : 'Đóng Dấu Tài Liệu'}
          </span>
        </nav>

        {/* Header Content & Badges */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3">
              <span>
                {displayLang === 'en' ? 'Document Watermark' : displayLang === 'ja' ? '文書透かし・押印' : 'Đóng Dấu Tài Liệu'}
              </span>
            </h1>
            <p className="text-sm text-on-surface-variant max-w-4xl leading-relaxed">
              {displayLang === 'en'
                ? 'Stamp a text or logo watermark onto batches of images (PNG, JPG, WebP…), PDF and Microsoft Office files (DOCX, XLSX, PPTX) with adjustable rotation, opacity and tiling — right in your browser.'
                : displayLang === 'ja'
                  ? '画像（PNG・JPG・WebPなど）、PDF、Microsoft Office（DOCX・XLSX・PPTX）に文字やロゴの透かしを一括で入れます。回転・不透明度・タイル配置を調整でき、すべてブラウザ内で処理します。'
                  : 'Đóng dấu văn bản hoặc logo lên hàng loạt ảnh (PNG, JPG, WebP…), tài liệu PDF và Microsoft Office (DOCX, XLSX, PPTX) với góc xoay, độ trong suốt và kiểu lặp tùy chỉnh — xử lý ngay trong trình duyệt.'}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-on-surface-variant pt-2">
              <ShieldCheck className="w-3.5 h-3.5 text-secondary shrink-0" />
              <span>Xử lý trực tiếp trên trình duyệt — tệp không được tải lên máy chủ.</span>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 2. WORKSPACE 2 CỘT CHUẨN                                             */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================================================================== */}
        {/* CỘT TRÁI: INPUT & CONFIGURATION (5 Cols on large screens)          */}
        {/* ================================================================== */}
        <div className="lg:col-span-6 xl:col-span-5 flex flex-col space-y-6">
          {/* BƯỚC 1: TẢI TỆP TIN CẦN ĐÓNG DẤU */}
          <section className="bg-surface-container/60 border border-border-subtle/70 p-5 rounded-xl space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-primary text-on-primary flex items-center justify-center font-mono text-xs font-bold">1</span>
                <h2 className="text-sm font-semibold text-on-surface">Tải tệp tin cần đóng dấu</h2>
              </div>
              <span className="font-mono text-xs text-on-surface-variant">Tối đa {WATERMARK_LIMITS.maxFiles} tệp / {formatMiB(WATERMARK_LIMITS.maxTotalBytes)} MiB</span>
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={function (e) { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={function (e) { e.preventDefault(); setIsDragOver(false); }}
              onDrop={function (e) {
                e.preventDefault();
                setIsDragOver(false);
                if (isProcessing) return;
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  processFiles(Array.from(e.dataTransfer.files));
                }
              }}
              onClick={function () { if (!isProcessing && fileInputRef.current) fileInputRef.current.click(); }}
              className={'relative group cursor-pointer border-2 border-dashed rounded-xl p-6 text-center flex flex-col items-center justify-center gap-2 transition-all ' +
                (isDragOver
                  ? 'border-primary-container bg-primary-container/10 scale-[0.99]'
                  : 'border-border-subtle bg-surface/60 hover:bg-surface hover:border-primary-container/60')}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={WATERMARK_LIMITS.extensions.join(',')}
                className="hidden"
                onChange={function (e) {
                  const picked = e.target.files ? Array.from(e.target.files) : [];
                  // Reset để chọn lại đúng tệp đó vẫn kích hoạt onChange.
                  e.target.value = '';
                  if (picked.length > 0) processFiles(picked);
                }}
              />
              <div className="w-12 h-12 rounded-xl bg-surface-container border border-border-subtle flex items-center justify-center text-primary-container group-hover:scale-105 transition-transform">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-on-surface">
                  Kéo thả tệp hoặc <span className="text-primary-container underline underline-offset-4">chọn từ thiết bị</span>
                </p>
                <p className="text-xs text-on-surface-variant">Hỗ trợ PDF, DOCX, XLSX, PPTX, PNG, JPG, WebP, GIF, AVIF, BMP, SVG (không nhận .doc/.xls/.ppt/.csv)</p>
              </div>

              {/* Sample Files Loader Button */}
              <div className="pt-2" onClick={function (e) { e.stopPropagation(); }}>
                <button
                  type="button"
                  onClick={handleLoadSamples}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-container hover:bg-surface-bright text-on-surface-variant hover:text-on-surface border border-border-subtle transition-colors shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Nạp 3 tệp mẫu demo</span>
                </button>
              </div>
            </div>

            {notice && (
              <div role="alert" className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{notice}</span>
              </div>
            )}

            {/* File List (Batch Queue) */}
            {fileItems.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs font-mono text-on-surface-variant px-1">
                  <span>DANH SÁCH HÀNG ĐỢI XỬ LÝ ({fileItems.length} TỆP)</span>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-error font-medium hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa tất cả</span>
                  </button>
                </div>

                <div tabIndex={0} role="region" aria-label="Danh sách tệp chờ đóng dấu" className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                  {fileItems.map(function (item) {
                    const isSelected = item.id === selectedId;
                    return (
                      <div
                        key={item.id}
                        onClick={function () { setSelectedId(item.id); }}
                        className={'relative flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ' +
                          (isSelected
                            ? 'bg-primary-container/10 border-primary-container/60 shadow-sm'
                            : 'bg-surface/80 border-border-subtle hover:border-slate-600')}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center shrink-0 border border-border-subtle">
                            {renderFileIcon(item.category)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-on-surface truncate">{item.name}</p>
                            <span className="text-[11px] font-mono text-on-surface-variant">{formatFileSize(item.size)} • {item.extension.toUpperCase()}</span>
                            {item.status === 'error' && item.errorMessage && (
                              <p className="text-[11px] text-red-400 break-words">{item.errorMessage}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {item.status === 'processing' && (
                            <div className="flex items-center gap-1.5 text-xs text-primary">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span className="font-mono">{item.progress}%</span>
                            </div>
                          )}
                          {item.status === 'done' && (
                            <span className="px-2 py-0.5 bg-emerald-500/15 text-secondary font-mono text-[11px] font-semibold rounded flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Xong
                            </span>
                          )}
                          {item.status === 'error' && (
                            <span className="px-2 py-0.5 bg-red-500/15 text-red-400 font-mono text-[11px] rounded flex items-center gap-1" title={item.errorMessage || ''}>
                              <AlertCircle className="w-3 h-3" /> Lỗi
                            </span>
                          )}
                          {item.status === 'pending' && (
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-secondary font-mono text-[11px] rounded flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Sẵn sàng
                            </span>
                          )}

                          {item.status === 'done' && item.resultBlob && (
                            <button
                              type="button"
                              onClick={function (e) {
                                e.stopPropagation();
                                downloadBlob(item.resultBlob, item.resultName || ('watermarked_' + item.name));
                              }}
                              className="p-1 rounded bg-emerald-500/20 text-secondary hover:bg-emerald-500/30 transition-colors"
                              aria-label={`Tải tệp ${item.name}`}
                              title="Tải tệp này"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={function (e) {
                              e.stopPropagation();
                              handleRemoveFile(item.id);
                            }}
                            className="text-on-surface-variant hover:text-red-400 p-1 transition-colors"
                            aria-label={`Xóa tệp ${item.name}`}
                            title="Xóa tệp"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {item.status === 'processing' && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-surface-container overflow-hidden rounded-b-lg">
                            <div className="h-full bg-primary transition-all duration-200" style={{ width: item.progress + '%' }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Summary Bar */}
                <div className="p-3 bg-surface/50 border border-border-subtle/60 rounded-lg flex items-center justify-between text-xs text-on-surface-variant">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-secondary" />
                    <span>{fileItems.length} tệp trong hàng đợi</span>
                  </div>
                  <span className="font-mono text-primary">Đóng dấu đồng loạt</span>
                </div>
              </div>
            )}
          </section>

          {/* BƯỚC 2: CẤU HÌNH KIỂU DẤU BẢN QUYỀN */}
          <section className="bg-surface-container/60 border border-border-subtle/70 p-5 rounded-xl space-y-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-primary text-on-primary flex items-center justify-center font-mono text-xs font-bold">2</span>
                <h2 className="text-sm font-semibold text-on-surface">Cấu hình kiểu dấu & tùy biến chi tiết</h2>
              </div>
              <button
                type="button"
                onClick={function () { setIsHelpOpen(true); }}
                aria-label="Hướng dẫn sử dụng"
                className="text-on-surface-variant hover:text-on-surface transition-colors"
                title="Hướng dẫn"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs: Text vs Logo */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-surface rounded-lg border border-border-subtle">
              <button
                type="button"
                onClick={function () { handleTabClick('text'); }}
                className={'py-2 px-3 rounded-md font-mono text-xs transition-colors flex items-center justify-center gap-2 ' +
                  (controlTab === 'text'
                    ? 'bg-primary text-on-primary font-bold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container')}
              >
                <Type className="w-4 h-4" />
                <span>Văn bản (Text)</span>
              </button>
              <button
                type="button"
                onClick={function () { handleTabClick('image'); }}
                className={'py-2 px-3 rounded-md font-mono text-xs transition-colors flex items-center justify-center gap-2 ' +
                  (controlTab === 'image'
                    ? 'bg-primary text-on-primary font-bold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container')}
              >
                <ImageIcon className="w-4 h-4" />
                <span>Logo / Con dấu (Image)</span>
              </button>
            </div>

            {/* Text Input Field */}
            {controlTab === 'text' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-on-surface">
                    <label htmlFor="watermarkText" className="font-medium">Nội dung con dấu văn bản:</label>
                    <span className="font-mono text-[11px] text-on-surface-variant">Độ dài: {config.text.length} ký tự</span>
                  </div>
                  <input
                    id="watermarkText"
                    type="text"
                    value={config.text}
                    onChange={function (e) { handleConfigChange({ text: e.target.value }); }}
                    className="w-full bg-surface text-on-surface px-3 py-2.5 rounded-lg border border-border-subtle text-xs font-medium focus:outline-none focus:border-primary transition-colors"
                    placeholder="Nhập nội dung đóng dấu..."
                  />
                </div>

                {/* Quick Presets */}
                <div className="space-y-2">
                  <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">MẪU ĐÓNG DẤU NHANH (QUICK PRESETS):</span>
                  <div className="flex flex-wrap gap-1.5">
                    {WATERMARK_PRESETS.map(function (preset) {
                      const isActive = config.text === preset.config.text;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={function () { handleApplyPreset(preset); }}
                          className={'px-2.5 py-1 rounded font-mono text-[11px] transition-colors border ' +
                            (isActive
                              ? 'bg-primary text-on-primary border-primary font-bold shadow-sm'
                              : 'bg-surface hover:bg-surface-container text-on-surface-variant border-border-subtle hover:text-on-surface')}
                        >
                          {preset.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Font & Style */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="watermark-font-select" className="block text-xs text-on-surface-variant mb-1 font-medium">Phông chữ</label>
                    <select
                      id="watermark-font-select"
                      aria-label="Chọn phông chữ dấu chìm"
                      value={config.fontFamily}
                      onChange={function (e) { handleConfigChange({ fontFamily: e.target.value }); }}
                      className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-on-surface text-xs focus:outline-none focus:border-primary cursor-pointer"
                    >
                      {FONT_OPTIONS.map(function (f) {
                        return <option key={f.value} value={f.value} className="bg-surface text-on-surface">{f.name}</option>;
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-on-surface-variant mb-1 font-medium">Định dạng</label>
                    <div className="flex items-center gap-1.5">
                      {[
                        { key: 'bold', icon: <Bold className="w-3.5 h-3.5" />, label: 'Đậm' },
                        { key: 'italic', icon: <Italic className="w-3.5 h-3.5" />, label: 'Nghiêng' },
                        { key: 'allCaps', icon: <CaseUpper className="w-3.5 h-3.5" />, label: 'Hoa' }
                      ].map(function (btn) {
                        return (
                          <button
                            key={btn.key}
                            type="button"
                            onClick={function () {
                              const upd = {}; upd[btn.key] = !config[btn.key];
                              handleConfigChange(upd);
                            }}
                            className={'flex-1 py-2 rounded-lg border text-xs font-mono font-medium flex items-center justify-center gap-1 transition-all ' +
                              (config[btn.key]
                                ? 'bg-primary text-on-primary border-primary font-bold shadow-sm'
                                : 'bg-surface text-on-surface-variant border-border-subtle hover:text-on-surface')}
                          >
                            {btn.icon}
                            <span>{btn.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Logo / Image Tab */}
            {controlTab === 'image' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1.5 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-primary" />
                    <span>Tải Logo / Con Dấu từ máy</span>
                  </label>
                  <input
                    ref={wmImageInputRef}
                    type="file"
                    aria-label="Tải Logo / Con Dấu từ máy"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    className="hidden"
                    onChange={handleWmImageChange}
                  />
                  {config.imageDataUrl ? (
                    <div className="p-3 rounded-lg bg-surface border border-border-subtle flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded bg-surface-container border border-border-subtle p-1 flex items-center justify-center overflow-hidden shrink-0">
                          <img src={config.imageDataUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-200">{(config.imageFile && config.imageFile.name) || 'Con dấu logo'}</p>
                          <p className="text-[11px] text-secondary flex items-center gap-1 mt-0.5">
                            <Check className="w-3 h-3" /> Đã nạp thành công
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={function () { wmImageInputRef.current && wmImageInputRef.current.click(); }}
                          aria-label="Đổi logo khác"
                          className="px-2.5 py-1.5 rounded bg-surface-container text-xs text-on-surface hover:bg-surface-bright transition-colors"
                        >
                          Đổi
                        </button>
                        <button
                          type="button"
                          onClick={function () { handleConfigChange({ imageFile: null, imageDataUrl: null, type: 'text' }); }}
                          aria-label="Xóa logo"
                          className="p-1.5 rounded text-on-surface-variant hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={function () { wmImageInputRef.current && wmImageInputRef.current.click(); }}
                      className="cursor-pointer p-4 rounded-lg border border-dashed border-border-subtle bg-surface hover:bg-surface-container hover:border-primary/60 transition-all text-center flex flex-col items-center justify-center gap-1.5"
                    >
                      <div className="w-9 h-9 rounded-lg bg-primary-container/10 border border-primary-container/20 flex items-center justify-center text-primary">
                        <Upload className="w-4 h-4" />
                      </div>
                      <p className="text-xs font-medium text-on-surface">Chọn tệp Logo (PNG trong suốt, SVG, JPG)</p>
                    </div>
                  )}
                </div>

                {/* Sample Seals */}
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1.5 flex items-center gap-1.5">
                    <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Con dấu mẫu có sẵn</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { type: 'confidential', label: 'Tuyệt Mật', color: 'text-red-400' },
                      { type: 'approved', label: 'Phê Duyệt', color: 'text-secondary' },
                      { type: 'seal', label: 'Ngôi Sao', color: 'text-primary' }
                    ].map(function (s) {
                      return (
                        <button
                          key={s.type}
                          type="button"
                          onClick={function () {
                            handleConfigChange({ type: 'image', imageFile: null, imageDataUrl: createSampleStampSvg(s.type) });
                          }}
                          className="p-2 rounded-lg bg-surface hover:bg-surface-container border border-border-subtle text-center transition-all"
                        >
                          <div className={s.color + ' text-xs font-bold'}>{s.label}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Image Scale Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between font-mono text-xs">
                    <span className="text-on-surface-variant">Thu phóng Logo</span>
                    <span className="text-primary font-bold">{Math.round(config.imageScale * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    aria-label="Thu phóng Logo"
                    min="0.1"
                    max="1.5"
                    step="0.05"
                    value={config.imageScale}
                    onChange={function (e) { handleConfigChange({ imageScale: parseFloat(e.target.value) }); }}
                    className="w-full accent-primary h-1.5 bg-surface rounded-lg cursor-pointer"
                  />
                </div>

                {/* Remove White Bg Checkbox */}
                <label className="flex items-center gap-2.5 cursor-pointer p-2 rounded-lg bg-surface border border-border-subtle">
                  <input
                    type="checkbox"
                    aria-label="Tự động khử nền trắng"
                    checked={config.removeWhiteBg}
                    onChange={function (e) { handleConfigChange({ removeWhiteBg: e.target.checked }); }}
                    className="w-4 h-4 rounded accent-primary cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-medium text-on-surface block">Tự động khử nền trắng</span>
                    <span className="text-[11px] text-on-surface-variant block">Thích hợp cho logo scan có nền trắng</span>
                  </div>
                </label>
              </div>
            )}

            {/* Display Mode / Position */}
            <div className="space-y-2 pt-1">
              <label className="text-xs text-on-surface font-medium">Kiểu hiển thị & Bố cục vị trí:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={function () { handleConfigChange({ layoutMode: 'tiled', rotation: -45 }); }}
                  className={'p-3 rounded-lg flex flex-col items-center justify-center gap-1.5 text-center transition-colors border ' +
                    (config.layoutMode === 'tiled'
                      ? 'bg-primary text-on-primary border-primary font-bold shadow-sm'
                      : 'bg-surface text-on-surface-variant border-border-subtle hover:bg-surface-container hover:text-on-surface')}
                >
                  <Grid3X3 className="w-5 h-5" />
                  <span className="font-mono text-[11px] font-semibold">Lặp ma trận 45°</span>
                </button>
                <button
                  type="button"
                  onClick={function () { handleConfigChange({ layoutMode: 'single', position: 'center', rotation: 0 }); }}
                  className={'p-3 rounded-lg flex flex-col items-center justify-center gap-1.5 text-center transition-colors border ' +
                    (config.layoutMode === 'single' && config.position === 'center'
                      ? 'bg-primary text-on-primary border-primary font-bold shadow-sm'
                      : 'bg-surface text-on-surface-variant border-border-subtle hover:bg-surface-container hover:text-on-surface')}
                >
                  <Stamp className="w-5 h-5" />
                  <span className="font-mono text-[11px]">Tâm chính giữa</span>
                </button>
                <button
                  type="button"
                  onClick={function () { handleConfigChange({ layoutMode: 'single', position: 'bottom-right', rotation: 0 }); }}
                  className={'p-3 rounded-lg flex flex-col items-center justify-center gap-1.5 text-center transition-colors border ' +
                    (config.layoutMode === 'single' && config.position === 'bottom-right'
                      ? 'bg-primary text-on-primary border-primary font-bold shadow-sm'
                      : 'bg-surface text-on-surface-variant border-border-subtle hover:bg-surface-container hover:text-on-surface')}
                >
                  <RotateCw className="w-5 h-5" />
                  <span className="font-mono text-[11px]">Góc dưới phải</span>
                </button>
              </div>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                Bố cục (lặp/vị trí/khoảng cách) chỉ áp dụng cho PDF và ảnh. DOCX và PPTX luôn đặt một dấu ở giữa trang/slide; XLSX dùng ảnh nền lặp lại của sheet (chỉ hiện trên màn hình, không in ra giấy).
              </p>
            </div>

            {/* Sliders Matrix */}
            <div className="space-y-4 pt-1">
              {/* Opacity */}
              <div className="space-y-1">
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-on-surface-variant">Độ trong suốt (Opacity)</span>
                  <span className="text-primary font-bold">{Math.round(config.opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  aria-label="Độ trong suốt (Opacity)"
                  min="0.05"
                  max="1.0"
                  step="0.01"
                  value={config.opacity}
                  onChange={function (e) { handleConfigChange({ opacity: parseFloat(e.target.value) }); }}
                  className="w-full accent-primary h-1.5 bg-surface rounded-lg cursor-pointer"
                />
              </div>

              {/* Font Size (if text) */}
              {controlTab === 'text' && (
                <div className="space-y-1">
                  <div className="flex justify-between font-mono text-xs">
                    <span className="text-on-surface-variant">Cỡ chữ (Font Size)</span>
                    <span className="text-on-surface-variant">{config.fontSize} px</span>
                  </div>
                  <input
                    type="range"
                    aria-label="Cỡ chữ (Font Size)"
                    min="14"
                    max="72"
                    step="2"
                    value={config.fontSize}
                    onChange={function (e) { handleConfigChange({ fontSize: parseInt(e.target.value, 10) }); }}
                    className="w-full accent-primary h-1.5 bg-surface rounded-lg cursor-pointer"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Angle */}
                <div className="space-y-1">
                  <div className="flex justify-between font-mono text-xs">
                    <span className="text-on-surface-variant">Góc xoay</span>
                    <span className="text-on-surface-variant">{config.rotation}°</span>
                  </div>
                  <input
                    type="range"
                    aria-label="Góc xoay"
                    min="-90"
                    max="90"
                    step="5"
                    value={config.rotation}
                    onChange={function (e) { handleConfigChange({ rotation: parseInt(e.target.value, 10) }); }}
                    className="w-full accent-primary h-1.5 bg-surface rounded-lg cursor-pointer"
                  />
                </div>

                {/* Tile Spacing */}
                <div className="space-y-1">
                  <div className="flex justify-between font-mono text-xs">
                    <span className="text-on-surface-variant">Khoảng cách lặp</span>
                    <span className="text-on-surface-variant">{config.tileGapX} px</span>
                  </div>
                  <input
                    type="range"
                    aria-label="Khoảng cách lặp"
                    min="60"
                    max="300"
                    step="10"
                    value={config.tileGapX}
                    onChange={function (e) { handleConfigChange({ tileGapX: parseInt(e.target.value, 10), tileGapY: Math.round(parseInt(e.target.value, 10) * 0.8) }); }}
                    className="w-full accent-primary h-1.5 bg-surface rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Color Palette Picker (for text) */}
            {controlTab === 'text' && (
              <div className="space-y-2">
                <span className="text-xs text-on-surface font-medium">Bảng màu dấu bảo mật:</span>
                <div className="flex items-center gap-2.5">
                  {COLOR_PALETTES.map(function (pal) {
                    const isSelected = config.color.toLowerCase() === pal.hex.toLowerCase();
                    return (
                      <button
                        key={pal.hex}
                        type="button"
                        onClick={function () { handleConfigChange({ color: pal.hex }); }}
                        className={'w-8 h-8 rounded-full transition-transform flex items-center justify-center shadow-md border ' +
                          (isSelected ? 'scale-110 ring-2 ring-primary-container ring-offset-2 ring-offset-surface-canvas border-white' : 'hover:scale-105 border-border-subtle')}
                        style={{ backgroundColor: pal.hex }}
                        title={pal.name}
                      >
                        {isSelected && <Check className={'w-4 h-4 ' + (pal.hex === '#FFFFFF' ? 'text-slate-900' : 'text-white')} />}
                      </button>
                    );
                  })}
                  <input
                    type="color"
                    aria-label="Màu tùy chỉnh"
                    value={config.color}
                    onChange={function (e) { handleConfigChange({ color: e.target.value }); }}
                    className="w-8 h-8 rounded-full border border-border-subtle bg-surface cursor-pointer p-0.5"
                    title="Màu tùy chỉnh"
                  />
                </div>
              </div>
            )}

            {/* Advanced Options (PDF) */}
            <div className="p-3 bg-surface rounded-lg border border-border-subtle space-y-2">
              <label htmlFor="watermark-target-pages" className="block text-xs text-on-surface font-medium">Trang cần đóng dấu (chỉ áp dụng cho PDF)</label>
              <select
                id="watermark-target-pages"
                value={config.targetPages}
                onChange={function (e) { handleConfigChange({ targetPages: e.target.value }); }}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-on-surface text-xs cursor-pointer"
              >
                <option value="all">Tất cả các trang</option>
                <option value="first">Chỉ trang đầu tiên</option>
                <option value="range">Dải trang tùy chọn…</option>
              </select>
              {config.targetPages === 'range' && (
                <input
                  type="text"
                  aria-label="Dải trang cần đóng dấu"
                  value={config.pageRange}
                  onChange={function (e) { handleConfigChange({ pageRange: e.target.value }); }}
                  placeholder="VD: 1-3, 5, 8-"
                  className="w-full bg-surface text-on-surface px-3 py-2 rounded-lg border border-border-subtle text-xs focus:outline-none focus:border-primary"
                />
              )}
              <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={config.addTimestampHidden}
                  onChange={function (e) { handleConfigChange({ addTimestampHidden: e.target.checked }); }}
                  className="w-4 h-4 mt-0.5 accent-primary-container rounded cursor-pointer"
                />
                <span className="text-xs text-on-surface">
                  Ghi thời điểm đóng dấu vào thuộc tính (metadata) tệp PDF
                  <span className="block text-[11px] text-on-surface-variant">Chỉ là ghi chú trong tệp, ai có tệp cũng xem/sửa được — không phải cơ chế chống rò rỉ.</span>
                </span>
              </label>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                Watermark được chèn thành lớp ảnh/hình phía trên tài liệu; người có phần mềm chỉnh sửa PDF/Office vẫn có thể xóa được.
              </p>
            </div>

            {/* PRIMARY EXECUTION CTA */}
            <div className="pt-2">
              <button
                type="button"
                id="startWatermarkBtn"
                disabled={!hasFiles || stats.processing}
                onClick={handleProcessAll}
                className={'w-full py-3 px-6 rounded-lg font-mono text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-2 ' +
                  (!hasFiles || stats.processing
                    ? 'bg-surface text-slate-500 border border-border-subtle cursor-not-allowed'
                    : 'bg-primary hover:bg-primary/90 text-on-primary shadow-primary/20 active:scale-[0.99]')}
              >
                {stats.processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang đóng dấu tài liệu...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-current" />
                    <span>Bắt Đầu Đóng Dấu {hasFiles ? fileItems.length : 0} Tệp Tin</span>
                  </>
                )}
              </button>
            </div>
          </section>
        </div>

        {/* ================================================================== */}
        {/* CỘT PHẢI: LIVE PREVIEW & OUTPUT RESULTS (7 Cols on large screens)  */}
        {/* ================================================================== */}
        <div className="lg:col-span-6 xl:col-span-7 flex flex-col space-y-6">
          {/* INTERACTIVE LIVE PREVIEW CANVAS CARD */}
          <section className="bg-surface-container/60 border border-border-subtle/70 p-5 rounded-xl space-y-4 shadow-sm">
            {/* Preview Header & Mini Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary-container animate-pulse" />
                <h3 className="text-sm font-semibold text-on-surface">Xem trước trực quan thời gian thực</h3>
              </div>

              {/* Mini Toolbar Controls */}
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-on-surface-variant px-1">
                  {activeFile && activeFile.category === 'pdf' ? 'Xem trước trang 1' : activeFile && ['docx', 'xlsx', 'pptx'].indexOf(activeFile.category) >= 0 ? 'Mô phỏng bố cục' : 'Xem trước'}
                </span>

                {/* Zoom */}
                <div className="flex items-center bg-surface border border-border-subtle rounded px-2 py-1 gap-1 font-mono text-xs text-on-surface-variant">
                  <button
                    type="button"
                    aria-label="Thu nhỏ xem trước"
                    onClick={function () { setZoom(function (z) { return Math.max(0.4, z - 0.1); }); }}
                    className="hover:text-primary transition-colors"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-center">{Math.round(zoom * 100)}%</span>
                  <button
                    type="button"
                    aria-label="Phóng to xem trước"
                    onClick={function () { setZoom(function (z) { return Math.min(1.8, z + 0.1); }); }}
                    className="hover:text-primary transition-colors"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Grid toggle */}
                <button
                  type="button"
                  aria-label="Bật/Tắt lưới căn chỉnh"
                  onClick={function () { setShowGrid(!showGrid); }}
                  className={'p-1.5 rounded border transition-colors ' +
                    (showGrid
                      ? 'bg-primary text-on-primary border-primary'
                      : 'bg-surface text-on-surface-variant border-border-subtle hover:text-on-surface')}
                  title="Bật/Tắt lưới căn chỉnh"
                >
                  <Grid className="w-3.5 h-3.5" />
                </button>

                {/* Background Mode Toggle */}
                <button
                  type="button"
                  aria-label="Chuyển nền kiểm tra tương phản"
                  onClick={function () { setContrastMode(!contrastMode); }}
                  className={'p-1.5 rounded border transition-colors ' +
                    (contrastMode
                      ? 'bg-primary text-on-primary border-primary'
                      : 'bg-surface text-on-surface-variant border-border-subtle hover:text-on-surface')}
                  title="Chuyển nền kiểm tra tương phản"
                >
                  <Contrast className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Simulated Document A4 Stage */}
            <div className="w-full bg-[#060e20] p-6 rounded-xl flex items-center justify-center overflow-auto min-h-[480px] border border-border-subtle/50">
              <div
                className="transition-transform duration-100 ease-out origin-center shadow-2xl rounded overflow-hidden"
                style={{ transform: 'scale(' + zoom + ')' }}
              >
                <canvas ref={canvasRef} className="block max-w-full h-auto shadow-2xl" />
              </div>
            </div>

            {/* File Switcher inside preview */}
            <div className="flex items-center justify-between font-mono text-xs text-on-surface-variant pt-1">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-secondary" />
                <span>
                  Đang hiển thị mẫu: {activeFile ? activeFile.name : 'Hop_Dong_Dich_Vu_Bao_Mat_2026.pdf'}
                </span>
              </span>
              {fileItems.length > 1 && (
                <div className="flex gap-2">
                  {fileItems.slice(0, 3).map(function (item) {
                    if (item.id === activeFile?.id) return null;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={function () { setSelectedId(item.id); }}
                        className="text-primary hover:underline truncate max-w-[140px]"
                      >
                        Xem {item.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* THẺ KẾT QUẢ XỬ LÝ & BỘ NÚT TẢI VỀ */}
          <section className="bg-surface-container/60 border border-border-subtle/70 p-5 rounded-xl space-y-4 shadow-sm">
            {/* Status Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-secondary">
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-mono text-xs font-semibold">
                  {isAllDone
                    ? 'ĐÃ ĐÓNG DẤU HOÀN TẤT ' + stats.done + '/' + stats.total + ' TỆP'
                    : hasFiles
                      ? 'SẴN SÀNG ĐÓNG DẤU ' + stats.total + ' TỆP TIN'
                      : 'CHƯA CÓ TỆP TIN NÀO ĐƯỢC CHỌN'}
                </span>
              </div>
              <span className="font-mono text-xs text-on-surface-variant">
                {hasFiles ? 'Kích thước: ' + formatFileSize(fileItems.reduce(function (a, b) { return a + b.size; }, 0)) : '0 MB'}
              </span>
            </div>

            {/* Summary Metrics Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-surface border border-border-subtle rounded-lg flex flex-col">
                <span className="font-mono text-[10px] text-on-surface-variant uppercase">TỔNG TỆP TIN</span>
                <span className="text-xl font-bold text-on-surface font-mono mt-0.5">
                  {stats.done} / {stats.total}
                </span>
                <span className="text-xs text-secondary mt-0.5">
                  {stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0}% hoàn tất
                </span>
              </div>

              <div className="p-3 bg-surface border border-border-subtle rounded-lg flex flex-col">
                <span className="font-mono text-[10px] text-on-surface-variant uppercase">TỆP LỖI</span>
                <span className={'text-xl font-bold font-mono mt-0.5 ' + (stats.error > 0 ? 'text-red-400' : 'text-on-surface')}>
                  {stats.error}
                </span>
                <span className="text-xs text-on-surface-variant mt-0.5">Di chuột vào nhãn “Lỗi” để xem lý do</span>
              </div>

              <div className="p-3 bg-surface border border-border-subtle rounded-lg flex flex-col">
                <span className="font-mono text-[10px] text-on-surface-variant uppercase">ĐỊNH DẠNG XUẤT</span>
                <span className="text-sm font-bold text-primary font-mono mt-0.5">Giữ như tệp gốc</span>
                <span className="text-xs text-on-surface-variant mt-0.5">JPG/WebP nén lại ở 95%; GIF/BMP/AVIF/SVG → PNG</span>
              </div>
            </div>

            {/* Action Export Buttons */}
            <div className="space-y-2 pt-2">
              {/* Primary Emerald CTA */}
              <button
                type="button"
                disabled={!isAllDone}
                onClick={handleDownloadZip}
                className={'w-full py-3 px-6 rounded-lg font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 ' +
                  (isAllDone
                    ? 'bg-secondary hover:bg-secondary/90 text-on-secondary shadow-lg shadow-emerald-500/20 active:scale-[0.99] cursor-pointer'
                    : 'bg-surface text-slate-500 border border-border-subtle cursor-not-allowed')}
              >
                <Archive className="w-4 h-4" />
                <span>Tải Toàn Bộ Tệp Đã Đóng Dấu (.ZIP)</span>
              </button>

              {/* Secondary Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={function () { setZoom(1); }}
                  className="py-2 px-3 bg-surface hover:bg-surface-container border border-border-subtle text-on-surface-variant hover:text-on-surface rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Vừa khung hình</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="py-2 px-3 bg-surface hover:bg-surface-container border border-border-subtle text-on-surface-variant hover:text-on-surface rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Đóng dấu tệp mới</span>
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. FOOTER KIẾN THỨC & TIÊU CHUẨN KỸ THUẬT                            */}
      {/* ==================================================================== */}


      {/* ==================================================================== */}
      {/* 4. EXPORT MODAL                                                      */}
      {/* ==================================================================== */}
      {isExportOpen && (function () {
        const successfulItems = fileItems.filter(function (i) { return i.status === 'done' && i.resultBlob; });
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-surface border border-border-subtle rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-on-surface flex flex-col max-h-[90vh]">
              <button
                type="button"
                aria-label="Đóng cửa sổ xuất"
                onClick={function () { setIsExportOpen(false); }}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-secondary shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface">Đóng Dấu Hoàn Tất!</h3>
                  <p className="text-xs text-on-surface-variant">{successfulItems.length}/{fileItems.length} tệp đã xử lý thành công{stats.error > 0 ? ' • ' + stats.error + ' tệp lỗi' : ''}</p>
                </div>
              </div>

              <div
                tabIndex={0}
                role="region"
                aria-label="Danh sách tệp đã xử lý thành công"
                className="flex-1 overflow-y-auto space-y-2 my-3 pr-1 max-h-[260px] focus:outline-none focus:ring-1 focus:ring-primary/40"
              >
                {successfulItems.map(function (item) {
                  return (
                    <div key={item.id} className="p-3 rounded-xl bg-surface-container/60 border border-border-subtle flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileCheck className="w-4 h-4 text-secondary shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-on-surface truncate">{item.name}</p>
                          <p className="text-[11px] font-mono text-outline">{formatFileSize(item.resultBlob ? item.resultBlob.size : item.size)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        aria-label={'Tải tệp ' + item.name}
                        onClick={function () { downloadBlob(item.resultBlob, item.resultName || ('watermarked_' + item.name)); }}
                        className="px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-bright border border-border-subtle text-on-surface text-xs font-medium flex items-center gap-1 transition-colors shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Tải</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-border-subtle flex flex-col sm:flex-row gap-2 mt-2">
                <button
                  type="button"
                  onClick={handleDownloadZip}
                  className="flex-1 py-3 px-4 rounded-xl bg-secondary hover:bg-secondary/90 text-on-secondary font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <Package className="w-4 h-4" />
                  <span>Tải Về Gói ZIP ({successfulItems.length})</span>
                </button>
                <button
                  type="button"
                  onClick={function () { setIsExportOpen(false); }}
                  className="py-3 px-4 rounded-xl bg-surface hover:bg-surface-container border border-border-subtle text-on-surface-variant hover:text-on-surface text-xs font-medium transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ==================================================================== */}
      {/* 5. HELP MODAL                                                        */}
      {/* ==================================================================== */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-surface border border-border-subtle rounded-2xl max-w-xl w-full p-6 shadow-2xl relative text-on-surface flex flex-col max-h-[90vh]">
            <button
              type="button"
              aria-label="Đóng cửa sổ hướng dẫn"
              onClick={function () { setIsHelpOpen(false); }}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary-container/20 border border-primary-container/30 flex items-center justify-center text-primary">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-on-surface">Hướng Dẫn Sử Dụng Watermark Studio</h3>
                <p className="text-xs text-on-surface-variant">Đóng dấu văn bản/logo cho PDF, Office và ảnh</p>
              </div>
            </div>

            <div
              tabIndex={0}
              role="region"
              aria-label="Nội dung hướng dẫn chi tiết"
              className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary/40"
            >
              <div className="p-3.5 rounded-xl bg-surface-container/60 border border-border-subtle">
                <h4 className="font-semibold text-on-surface flex items-center gap-1.5 mb-1.5">
                  <ShieldCheck className="w-4 h-4 text-secondary" />
                  <span>100% An Toàn & Client-Side</span>
                </h4>
                <p className="leading-relaxed text-outline">
                  Tệp được xử lý ngay trong trình duyệt bằng Canvas API, pdf-lib và JSZip (JavaScript); dữ liệu không được gửi lên máy chủ.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container/60 border border-border-subtle">
                <h4 className="font-semibold text-on-surface flex items-center gap-1.5 mb-1.5">
                  <FileCheck2 className="w-4 h-4 text-primary" />
                  <span>Khả Năng Hỗ Trợ Đa Định Dạng</span>
                </h4>
                <ul className="space-y-1.5 text-on-surface-variant">
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-red-400" /><span><strong>PDF:</strong> Chèn ảnh PNG watermark (raster) lên các trang được chọn</span></li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-blue-400" /><span><strong>DOCX:</strong> Chèn watermark vào header mọi section (luôn ở giữa trang)</span></li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /><span><strong>XLSX:</strong> Đặt ảnh nền cho mọi sheet — chỉ hiện trên màn hình, <strong>không in ra giấy</strong></span></li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-amber-400" /><span><strong>PPTX:</strong> Chèn hộp chữ/ảnh bán trong suốt giữa từng slide (xóa được trong PowerPoint)</span></li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-purple-400" /><span><strong>Ảnh:</strong> Giữ nguyên kích thước; JPG/WebP nén lại, GIF/BMP/AVIF/SVG xuất PNG</span></li>
                </ul>
              </div>
            </div>

            <div className="pt-3 border-t border-border-subtle mt-3 text-right">
              <button
                type="button"
                onClick={function () { setIsHelpOpen(false); }}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-bold text-xs transition-colors"
              >
                Đã Hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
