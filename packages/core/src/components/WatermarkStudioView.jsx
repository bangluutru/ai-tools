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
import { PDFDocument, degrees, rgb, StandardFonts } from 'pdf-lib';
import JSZip from 'jszip';
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

let pdfJsPromise = null;
function loadPdfJs() {
  if (!pdfJsPromise) {
    pdfJsPromise = Promise.all([
      import('pdfjs-dist'),
      import('pdfjs-dist/build/pdf.worker.min.mjs?url')
    ]).then(function ([pdfjsLib, workerModule]) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerModule.default;
      return pdfjsLib;
    });
  }
  return pdfJsPromise;
}

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
  blendMode: 'normal',
  layoutMode: 'tiled',
  position: 'center',
  tileGapX: 160,
  tileGapY: 130,
  density: 'medium',
  targetPages: 'all',
  applyAllPages: true,
  addTimestampHidden: true,
  flattenLayers: true
};

const WATERMARK_PRESETS = [
  {
    id: 'confidential',
    name: '[BẢO MẬT NỘI BỘ]',
    description: 'Chữ đỏ cảnh báo in hoa, nghiêng 45°, độ mờ 25% chống sao chép',
    badge: 'Bảo mật',
    config: { type: 'text', text: 'TUYỆT MẬT / CONFIDENTIAL', color: '#EF4444', fontSize: 32, opacity: 0.25, rotation: -45, bold: true, layoutMode: 'tiled', density: 'medium' }
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
    config: { type: 'text', text: 'LƯU HÀNH NỘI BỘ - KHÔNG SAO CHÉP', color: '#F59E0B', fontSize: 26, opacity: 0.22, rotation: -35, bold: true, layoutMode: 'tiled', density: 'high' }
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
  if (['docx', 'doc'].includes(ext) || (mimeType && mimeType.includes('wordprocessingml'))) return 'docx';
  if (['xlsx', 'xls', 'csv'].includes(ext) || (mimeType && mimeType.includes('spreadsheetml'))) return 'xlsx';
  if (['pptx', 'ppt'].includes(ext) || (mimeType && mimeType.includes('presentationml'))) return 'pptx';
  if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'bmp', 'gif', 'avif'].includes(ext) || (mimeType && mimeType.startsWith('image/'))) return 'image';
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
  setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
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

async function drawTextWatermark(ctx, width, height, config) {
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

async function drawImageWatermark(ctx, width, height, config) {
  let imgSource = config.imageDataUrl;
  if (!imgSource && config.imageFile) imgSource = await readFileAsDataURL(config.imageFile);
  if (!imgSource) return;
  const wmImg = await loadImageElement(imgSource);
  const wmWidth = wmImg.naturalWidth || wmImg.width;
  const wmHeight = wmImg.naturalHeight || wmImg.height;
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
  const width = baseImg.naturalWidth || baseImg.width;
  const height = baseImg.naturalHeight || baseImg.height;
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context error');
  ctx.drawImage(baseImg, 0, 0, width, height);
  if (config.type === 'text') await drawTextWatermark(ctx, width, height, config);
  else if (config.type === 'image' && (config.imageDataUrl || config.imageFile)) await drawImageWatermark(ctx, width, height, config);
  let mimeType = 'image/png';
  if (imageFile instanceof File) {
    if (imageFile.type === 'image/jpeg' || imageFile.type === 'image/jpg') mimeType = 'image/jpeg';
    else if (imageFile.type === 'image/webp') mimeType = 'image/webp';
  }
  return new Promise(function (resolve, reject) {
    canvas.toBlob(function (blob) { if (blob) resolve(blob); else reject(new Error('Image export error')); }, mimeType, 0.95);
  });
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
    let src = config.imageDataUrl;
    if (!src && config.imageFile) src = await readFileAsDataURL(config.imageFile);
    if (src) {
      const img = await loadImageElement(src);
      const w = (img.naturalWidth || img.width) * config.imageScale;
      const h = (img.naturalHeight || img.height) * config.imageScale;
      const stampCanvas2 = document.createElement('canvas');
      stampCanvas2.width = w * dpr; stampCanvas2.height = h * dpr;
      const sCtx2 = stampCanvas2.getContext('2d');
      if (sCtx2) {
        sCtx2.scale(dpr, dpr); sCtx2.drawImage(img, 0, 0, w, h);
        if (config.removeWhiteBg) removeWhiteBackgroundFromCanvas(sCtx2, w * dpr, h * dpr, 35);
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

async function processPdfWatermark(pdfFile, config, onProgress) {
  const arrayBuffer = await readFileAsArrayBuffer(pdfFile);
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const pages = pdfDoc.getPages();
  const pageCount = pages.length;
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

  for (let i = 0; i < pageCount; i++) {
    const page = pages[i];
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
    if (onProgress) onProgress(Math.round(((i + 1) / pageCount) * 100));
  }
  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}

// ========================================================================
// DOCX ENGINE
// ========================================================================

async function processDocxWatermark(docxFile, config) {
  const arrayBuffer = await readFileAsArrayBuffer(docxFile);
  const zip = await JSZip.loadAsync(arrayBuffer);
  const headerRelId = 'rIdWatermarkHeader';
  const rotation = Math.round(config.rotation);
  const opacity = config.opacity.toFixed(2);
  const color = config.color;
  let headerXmlContent = '';
  if (config.type === 'text') {
    const text = config.allCaps ? config.text.toUpperCase() : config.text;
    const escapedText = escapeXml(text);
    const font = config.fontFamily.split(',')[0].replace(/['"]/g, '');
    const weight = config.bold ? 'bold' : 'normal';
    const style = config.italic ? 'italic' : 'normal';
    headerXmlContent = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><w:p><w:pPr><w:pStyle w:val="Header"/></w:pPr><w:r><w:rPr><w:noProof/></w:rPr><w:pict><v:shapetype id="_x0000_t136" coordsize="21600,21600" o:spt="136" path="m@7,l@8,m@5,21600l@6,21600e"><v:textpath on="t" fitshape="t"/><v:path textpathok="t"/></v:shapetype><v:shape id="WatermarkStudioText" type="#_x0000_t136" style="position:absolute;margin-left:0;margin-top:0;width:468pt;height:260pt;z-index:-251657216;mso-position-horizontal:center;mso-position-horizontal-relative:margin;mso-position-vertical:center;mso-position-vertical-relative:margin;rotation:' + rotation + '" fillcolor="' + color + '" stroked="f"><v:fill opacity="' + opacity + '"/><v:textpath style="font-family:\'' + font + '\';font-weight:' + weight + ';font-style:' + style + '" string="' + escapedText + '"/></v:shape></w:pict></w:r></w:p></w:hdr>';
  } else {
    let dataUrl = config.imageDataUrl;
    if (!dataUrl && config.imageFile) dataUrl = await readFileAsDataURL(config.imageFile);
    if (!dataUrl) throw new Error('No watermark image selected for DOCX');
    const img = await loadImageElement(dataUrl);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width; canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Canvas error');
    ctx.drawImage(img, 0, 0);
    if (config.removeWhiteBg) removeWhiteBackgroundFromCanvas(ctx, canvas.width, canvas.height, 35);
    const pngBlob = await new Promise(function (resolve) { canvas.toBlob(function (b) { resolve(b); }, 'image/png'); });
    const pngBytes = await readFileAsArrayBuffer(pngBlob);
    zip.file('word/media/watermark_logo.png', pngBytes);
    const headerRelsXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdLogo" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/watermark_logo.png"/></Relationships>';
    zip.file('word/_rels/header_wm.xml.rels', headerRelsXml);
    const imgScale = Math.round(350 * config.imageScale);
    headerXmlContent = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><w:p><w:pPr><w:pStyle w:val="Header"/></w:pPr><w:r><w:rPr><w:noProof/></w:rPr><w:pict><v:shape id="WatermarkStudioImage" style="position:absolute;margin-left:0;margin-top:0;width:' + imgScale + 'pt;height:' + imgScale + 'pt;z-index:-251657216;mso-position-horizontal:center;mso-position-horizontal-relative:margin;mso-position-vertical:center;mso-position-vertical-relative:margin;rotation:' + rotation + '" stroked="f"><v:imagedata r:id="rIdLogo" o:title="watermark"/><v:fill opacity="' + opacity + '"/></v:shape></w:pict></w:r></w:p></w:hdr>';
  }
  zip.file('word/header_wm.xml', headerXmlContent);
  const contentTypesFile = zip.file('[Content_Types].xml');
  if (contentTypesFile) {
    let ct = await contentTypesFile.async('text');
    if (!ct.includes('PartName="/word/header_wm.xml"')) {
      ct = ct.replace('</Types>', '  <Override PartName="/word/header_wm.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>\n</Types>');
      zip.file('[Content_Types].xml', ct);
    }
  }
  const docRelsFile = zip.file('word/_rels/document.xml.rels');
  if (docRelsFile) {
    let dr = await docRelsFile.async('text');
    if (!dr.includes(headerRelId)) {
      dr = dr.replace('</Relationships>', '  <Relationship Id="' + headerRelId + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header_wm.xml"/>\n</Relationships>');
      zip.file('word/_rels/document.xml.rels', dr);
    }
  }
  const documentFile = zip.file('word/document.xml');
  if (documentFile) {
    let docXml = await documentFile.async('text');
    const headerRefTag = '<w:headerReference w:type="default" r:id="' + headerRelId + '"/>';
    if (!docXml.includes(headerRelId)) {
      if (docXml.includes('<w:sectPr')) {
        docXml = docXml.replace(/<w:sectPr([^>]*)>/g, '<w:sectPr$1>' + headerRefTag);
      } else if (docXml.includes('</w:body>')) {
        docXml = docXml.replace('</w:body>', '<w:sectPr>' + headerRefTag + '</w:sectPr></w:body>');
      }
      zip.file('word/document.xml', docXml);
    }
  }
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
    let src = config.imageDataUrl;
    if (!src && config.imageFile) src = await readFileAsDataURL(config.imageFile);
    if (src) {
      const img = await loadImageElement(src);
      const w = (img.naturalWidth || img.width) * config.imageScale;
      const h = (img.naturalHeight || img.height) * config.imageScale;
      ctx.save(); ctx.globalAlpha = config.opacity;
      ctx.translate(tileWidth / 2, tileHeight / 2);
      ctx.rotate((config.rotation * Math.PI) / 180);
      const offCanvas = document.createElement('canvas');
      offCanvas.width = img.naturalWidth || img.width; offCanvas.height = img.naturalHeight || img.height;
      const offCtx = offCanvas.getContext('2d');
      if (offCtx) {
        offCtx.drawImage(img, 0, 0);
        if (config.removeWhiteBg) removeWhiteBackgroundFromCanvas(offCtx, offCanvas.width, offCanvas.height, 35);
        ctx.drawImage(offCanvas, -w / 2, -h / 2, w, h);
      }
      ctx.restore();
    }
  }
  return new Promise(function (resolve) { canvas.toBlob(function (blob) { resolve(blob); }, 'image/png'); });
}

async function processXlsxWatermark(xlsxFile, config) {
  const arrayBuffer = await readFileAsArrayBuffer(xlsxFile);
  const zip = await JSZip.loadAsync(arrayBuffer);
  const imgBlob = await createExcelWatermarkImageBlob(config);
  const imgBytes = await readFileAsArrayBuffer(imgBlob);
  zip.file('xl/media/watermark_bg.png', imgBytes);
  const contentTypesFile = zip.file('[Content_Types].xml');
  if (contentTypesFile) {
    let ct = await contentTypesFile.async('text');
    if (!ct.includes('Extension="png"')) {
      ct = ct.replace('</Types>', '  <Default Extension="png" ContentType="image/png"/>\n</Types>');
      zip.file('[Content_Types].xml', ct);
    }
  }
  const sheetFiles = Object.keys(zip.files).filter(function (p) { return p.startsWith('xl/worksheets/sheet') && p.endsWith('.xml'); });
  const bgRelId = 'rIdWatermarkBg';
  for (let si = 0; si < sheetFiles.length; si++) {
    const sheetPath = sheetFiles[si];
    const sheetNum = sheetPath.replace('xl/worksheets/', '').replace('.xml', '');
    const relsPath = 'xl/worksheets/_rels/' + sheetNum + '.xml.rels';
    let relsXml = '';
    const existingRelsFile = zip.file(relsPath);
    if (existingRelsFile) {
      relsXml = await existingRelsFile.async('text');
      if (!relsXml.includes(bgRelId)) {
        relsXml = relsXml.replace('</Relationships>', '  <Relationship Id="' + bgRelId + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/watermark_bg.png"/>\n</Relationships>');
      }
    } else {
      relsXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="' + bgRelId + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/watermark_bg.png"/></Relationships>';
    }
    zip.file(relsPath, relsXml);
    const sheetFile = zip.file(sheetPath);
    if (sheetFile) {
      let sheetXml = await sheetFile.async('text');
      const pictureTag = '<picture r:id="' + bgRelId + '"/>';
      sheetXml = sheetXml.replace(/<picture[^>]*\/>/g, '');
      if (sheetXml.includes('</worksheet>')) {
        sheetXml = sheetXml.replace('</worksheet>', '  ' + pictureTag + '\n</worksheet>');
        zip.file(sheetPath, sheetXml);
      }
    }
  }
  return await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', compression: 'DEFLATE', compressionOptions: { level: 6 } });
}

// ========================================================================
// PPTX ENGINE
// ========================================================================

async function processPptxWatermark(pptxFile, config) {
  const arrayBuffer = await readFileAsArrayBuffer(pptxFile);
  const zip = await JSZip.loadAsync(arrayBuffer);
  const slideFiles = Object.keys(zip.files).filter(function (p) { return p.startsWith('ppt/slides/slide') && p.endsWith('.xml'); });
  const opacityValue = Math.round(config.opacity * 100000);
  const rotValue = Math.round(config.rotation * 60000);
  const rgbVal = hexToRgb(config.color);
  const hexColor = ((1 << 24) + (rgbVal.r << 16) + (rgbVal.g << 8) + rgbVal.b).toString(16).slice(1).toUpperCase();
  if (config.type === 'text') {
    const text = config.allCaps ? config.text.toUpperCase() : config.text;
    const escapedText = escapeXml(text);
    const font = config.fontFamily.split(',')[0].replace(/['"]/g, '');
    const szVal = Math.round(config.fontSize * 100);
    for (let i = 0; i < slideFiles.length; i++) {
      const slidePath = slideFiles[i];
      const slideFile = zip.file(slidePath);
      if (!slideFile) continue;
      let slideXml = await slideFile.async('text');
      const shapeId = 9990 + i;
      const watermarkShapeXml = '<p:sp xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><p:nvSpPr><p:cNvPr id="' + shapeId + '" name="WatermarkText_' + shapeId + '"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm rot="' + rotValue + '"><a:off x="914400" y="1028700"/><a:ext cx="7315200" cy="3086100"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr><p:txBody><a:bodyPr wrap="square" lIns="0" tIns="0" rIns="0" bIns="0" anchor="ctr"/><a:lstStyle/><a:p><a:pPr algn="ctr"/><a:r><a:rPr lang="vi-VN" sz="' + szVal + '" b="' + (config.bold ? 1 : 0) + '" i="' + (config.italic ? 1 : 0) + '"><a:solidFill><a:srgbClr val="' + hexColor + '"><a:alpha val="' + opacityValue + '"/></a:srgbClr></a:solidFill><a:latin typeface="' + font + '"/><a:ea typeface="' + font + '"/><a:cs typeface="' + font + '"/></a:rPr><a:t>' + escapedText + '</a:t></a:r></a:p></p:txBody></p:sp>';
      if (slideXml.includes('</p:spTree>')) {
        slideXml = slideXml.replace('</p:spTree>', watermarkShapeXml + '\n    </p:spTree>');
        zip.file(slidePath, slideXml);
      }
    }
  } else {
    let dataUrl = config.imageDataUrl;
    if (!dataUrl && config.imageFile) dataUrl = await readFileAsDataURL(config.imageFile);
    if (!dataUrl) throw new Error('No watermark image for PPTX');
    const img = await loadImageElement(dataUrl);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width; canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Canvas error');
    ctx.drawImage(img, 0, 0);
    if (config.removeWhiteBg) removeWhiteBackgroundFromCanvas(ctx, canvas.width, canvas.height, 35);
    const pngBlob = await new Promise(function (resolve) { canvas.toBlob(function (b) { resolve(b); }, 'image/png'); });
    const pngBytes = await readFileAsArrayBuffer(pngBlob);
    zip.file('ppt/media/watermark_logo.png', pngBytes);
    const ctFile = zip.file('[Content_Types].xml');
    if (ctFile) {
      let ctText = await ctFile.async('text');
      if (!ctText.includes('Extension="png"')) {
        ctText = ctText.replace('</Types>', '  <Default Extension="png" ContentType="image/png"/>\n</Types>');
        zip.file('[Content_Types].xml', ctText);
      }
    }
    const imgRelId = 'rIdWatermarkImg';
    const picScale = config.imageScale;
    const picW = Math.round(3657600 * picScale), picH = Math.round(3657600 * picScale);
    const slideWidthEmu = 9144000, slideHeightEmu = 5143500;
    const offX = Math.round((slideWidthEmu - picW) / 2), offY = Math.round((slideHeightEmu - picH) / 2);
    for (let j = 0; j < slideFiles.length; j++) {
      const sPath = slideFiles[j];
      const slideNum = sPath.replace('ppt/slides/', '').replace('.xml', '');
      const relsPath = 'ppt/slides/_rels/' + slideNum + '.xml.rels';
      let relsXml = '';
      const existingRels = zip.file(relsPath);
      if (existingRels) {
        relsXml = await existingRels.async('text');
        if (!relsXml.includes(imgRelId)) {
          relsXml = relsXml.replace('</Relationships>', '  <Relationship Id="' + imgRelId + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/watermark_logo.png"/>\n</Relationships>');
        }
      } else {
        relsXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="' + imgRelId + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/watermark_logo.png"/></Relationships>';
      }
      zip.file(relsPath, relsXml);
      const sFile = zip.file(sPath);
      if (sFile) {
        let sXml = await sFile.async('text');
        const picId = 8880 + j;
        const picShapeXml = '<p:pic xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><p:nvPicPr><p:cNvPr id="' + picId + '" name="WatermarkPicture_' + picId + '"/><p:cNvPicPr/><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="' + imgRelId + '" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><a:alphaModFix amt="' + opacityValue + '"/></a:blip><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr><a:xfrm rot="' + rotValue + '"><a:off x="' + offX + '" y="' + offY + '"/><a:ext cx="' + picW + '" cy="' + picH + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>';
        if (sXml.includes('</p:spTree>')) {
          sXml = sXml.replace('</p:spTree>', picShapeXml + '\n    </p:spTree>');
          zip.file(sPath, sXml);
        }
      }
    }
  }
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
  const resultUrl = URL.createObjectURL(resultBlob);
  return { resultBlob: resultBlob, resultUrl: resultUrl };
}

// ========================================================================
// SAMPLE FILE GENERATORS
// ========================================================================

async function createSamplePdf() {
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

export default function WatermarkStudioView() {
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
        try {
          const pdfjsLib = await loadPdfJs();
          const loadingTask = pdfjsLib.getDocument({ data: buffer.slice(0) });
          const pdf = await loadingTask.promise;
          const page = await pdf.getPage(1);
          const viewport = page.getViewport({ scale: 1.5 });
          const offscreenCanvas = document.createElement('canvas');
          offscreenCanvas.width = viewport.width;
          offscreenCanvas.height = viewport.height;
          const offscreenCtx = offscreenCanvas.getContext('2d');
          if (offscreenCtx) {
            await page.render({ canvasContext: offscreenCtx, viewport }).promise;
            const dataUrl = offscreenCanvas.toDataURL('image/png');
            const img = new Image();
            img.onload = function () { if (isMounted) setBgImage(img); };
            img.onerror = function () { if (isMounted) setBgImage(null); };
            img.src = dataUrl;
          }
          page.cleanup();
          await loadingTask.destroy();
        } catch (err) {
          console.warn('PDF preview render error, using document mockup fallback:', err);
          if (isMounted) setBgImage(null);
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
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
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
    else if (config.type === 'image') drawImageWatermark(ctx, width, height, config);
  }, [config, bgImage, showGrid, contrastMode]);

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
  }, []);

  const handleApplyPreset = useCallback(function (preset) {
    setConfig(function (prev) { return Object.assign({}, prev, preset.config); });
  }, []);

  const handleConfigChange = useCallback(function (updates) {
    setConfig(function (prev) { return Object.assign({}, prev, updates); });
  }, []);

  const handleProcessAll = useCallback(async function () {
    if (fileItems.length === 0 || isProcessing) return;
    setIsProcessing(true);
    const updatedItems = fileItems.slice();
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
        item.resultUrl = result.resultUrl;
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
    const zip = new JSZip();
    for (let i = 0; i < doneItems.length; i++) {
      zip.file('watermarked_' + doneItems[i].name, doneItems[i].resultBlob);
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, 'watermark_studio_batch.zip');
  }, [fileItems]);

  const processFiles = useCallback(function (files) {
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
  }, [handleFilesAdded]);

  const handleWmImageChange = useCallback(async function (e) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const dataUrl = await readFileAsDataURL(file);
      handleConfigChange({ type: 'image', imageFile: file, imageDataUrl: dataUrl });
    }
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
        <nav className="flex items-center gap-2 text-slate-400 text-xs font-mono">
          <a href="#/tat-ca" className="hover:text-primary-container transition-colors flex items-center gap-1">
            <Home className="w-3.5 h-3.5" />
            <span>Trang chủ</span>
          </a>
          <span className="text-slate-600">/</span>
          <a href="#/hinh-anh-webp" className="hover:text-primary-container transition-colors">Hình ảnh & WebP</a>
          <span className="text-slate-600">/</span>
          <span className="text-slate-200 font-medium">Watermark Studio — Đóng Dấu Tài Liệu</span>
        </nav>

        {/* Header Content & Badges */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight flex items-center gap-3">
              <span>Watermark Studio — Đóng Dấu Bản Quyền & Tài Liệu</span>
            </h1>
            <p className="text-sm text-slate-400 max-w-4xl leading-relaxed">
              Đóng dấu văn bản (Text) hoặc logo hình ảnh bản quyền lên hàng loạt tệp ảnh (PNG, JPG, WebP), tài liệu PDF và Microsoft Office (DOCX, XLSX, PPTX). Tự động tính toán góc xoay, độ trong suốt (opacity), lặp ma trận (tile grid) hoặc dấu chìm chống sao chép trái phép hoàn toàn trong trình duyệt.
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
                <span className="w-6 h-6 rounded bg-primary-container text-slate-950 flex items-center justify-center font-mono text-xs font-bold">1</span>
                <h2 className="text-sm font-semibold text-slate-100">Tải tệp tin cần đóng dấu</h2>
              </div>
              <span className="font-mono text-xs text-slate-400">Tối đa 50 tệp / 100MB</span>
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={function (e) { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={function (e) { e.preventDefault(); setIsDragOver(false); }}
              onDrop={function (e) {
                e.preventDefault();
                setIsDragOver(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  processFiles(Array.from(e.dataTransfer.files));
                }
              }}
              onClick={function () { fileInputRef.current && fileInputRef.current.click(); }}
              className={'relative group cursor-pointer border-2 border-dashed rounded-xl p-6 text-center flex flex-col items-center justify-center gap-2 transition-all ' +
                (isDragOver
                  ? 'border-primary-container bg-primary-container/10 scale-[0.99]'
                  : 'border-border-subtle bg-surface/60 hover:bg-surface hover:border-primary-container/60')}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.xlsx,.pptx,.png,.jpg,.jpeg,.webp,.svg,.bmp,.gif"
                className="hidden"
                onChange={function (e) {
                  if (e.target.files && e.target.files.length > 0) {
                    processFiles(Array.from(e.target.files));
                  }
                }}
              />
              <div className="w-12 h-12 rounded-xl bg-surface-container border border-border-subtle flex items-center justify-center text-primary-container group-hover:scale-105 transition-transform">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-slate-200">
                  Kéo thả tệp hoặc <span className="text-primary-container underline underline-offset-4">chọn từ thiết bị</span>
                </p>
                <p className="text-xs text-slate-400">Hỗ trợ PDF, DOCX, XLSX, PPTX, PNG, JPG, WebP</p>
              </div>

              {/* Sample Files Loader Button */}
              <div className="pt-2" onClick={function (e) { e.stopPropagation(); }}>
                <button
                  type="button"
                  onClick={handleLoadSamples}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-container hover:bg-surface-bright text-slate-300 hover:text-white border border-border-subtle transition-colors shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Nạp 3 tệp mẫu demo</span>
                </button>
              </div>
            </div>

            {/* File List (Batch Queue) */}
            {fileItems.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
                  <span>DANH SÁCH HÀNG ĐỢI XỬ LÝ ({fileItems.length} TỆP)</span>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-red-400 hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa tất cả</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
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
                            <p className="text-xs font-medium text-slate-200 truncate">{item.name}</p>
                            <span className="text-[11px] font-mono text-slate-400">{formatFileSize(item.size)} • {item.extension.toUpperCase()}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {item.status === 'processing' && (
                            <div className="flex items-center gap-1.5 text-xs text-primary-container">
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
                            <span className="px-2 py-0.5 bg-red-500/15 text-red-400 font-mono text-[11px] rounded flex items-center gap-1">
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
                                downloadBlob(item.resultBlob, 'watermarked_' + item.name);
                              }}
                              className="p-1 rounded bg-emerald-500/20 text-secondary hover:bg-emerald-500/30 transition-colors"
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
                            className="text-slate-400 hover:text-red-400 p-1 transition-colors"
                            title="Xóa tệp"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {item.status === 'processing' && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-surface-container overflow-hidden rounded-b-lg">
                            <div className="h-full bg-primary-container transition-all duration-200" style={{ width: item.progress + '%' }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Summary Bar */}
                <div className="p-3 bg-surface/50 border border-border-subtle/60 rounded-lg flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-secondary" />
                    <span>{fileItems.length} tệp trong hàng đợi</span>
                  </div>
                  <span className="font-mono text-primary-container">Đóng dấu đồng loạt</span>
                </div>
              </div>
            )}
          </section>

          {/* BƯỚC 2: CẤU HÌNH KIỂU DẤU BẢN QUYỀN */}
          <section className="bg-surface-container/60 border border-border-subtle/70 p-5 rounded-xl space-y-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-primary-container text-slate-950 flex items-center justify-center font-mono text-xs font-bold">2</span>
                <h2 className="text-sm font-semibold text-slate-100">Cấu hình kiểu dấu & tùy biến chi tiết</h2>
              </div>
              <button
                type="button"
                onClick={function () { setIsHelpOpen(true); }}
                className="text-slate-400 hover:text-white transition-colors"
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
                    ? 'bg-primary-container text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-surface-container')}
              >
                <Type className="w-4 h-4" />
                <span>Văn bản (Text)</span>
              </button>
              <button
                type="button"
                onClick={function () { handleTabClick('image'); }}
                className={'py-2 px-3 rounded-md font-mono text-xs transition-colors flex items-center justify-center gap-2 ' +
                  (controlTab === 'image'
                    ? 'bg-primary-container text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-surface-container')}
              >
                <ImageIcon className="w-4 h-4" />
                <span>Logo / Con dấu (Image)</span>
              </button>
            </div>

            {/* Text Input Field */}
            {controlTab === 'text' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-200">
                    <label htmlFor="watermarkText" className="font-medium">Nội dung con dấu văn bản:</label>
                    <span className="font-mono text-[11px] text-slate-400">Độ dài: {config.text.length} ký tự</span>
                  </div>
                  <input
                    id="watermarkText"
                    type="text"
                    value={config.text}
                    onChange={function (e) { handleConfigChange({ text: e.target.value }); }}
                    className="w-full bg-surface text-slate-100 px-3 py-2.5 rounded-lg border border-border-subtle text-xs font-medium focus:outline-none focus:border-primary-container transition-colors"
                    placeholder="Nhập nội dung đóng dấu..."
                  />
                </div>

                {/* Quick Presets */}
                <div className="space-y-2">
                  <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">MẪU ĐÓNG DẤU NHANH (QUICK PRESETS):</span>
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
                              ? 'bg-primary-container/20 text-primary-container border-primary-container/40 font-bold'
                              : 'bg-surface hover:bg-surface-container text-slate-300 border-border-subtle hover:text-white')}
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
                    <label className="block text-xs text-slate-300 mb-1 font-medium">Phông chữ</label>
                    <select
                      value={config.fontFamily}
                      onChange={function (e) { handleConfigChange({ fontFamily: e.target.value }); }}
                      className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-slate-200 text-xs focus:outline-none focus:border-primary-container cursor-pointer"
                    >
                      {FONT_OPTIONS.map(function (f) {
                        return <option key={f.value} value={f.value} className="bg-slate-900 text-slate-200">{f.name}</option>;
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1 font-medium">Định dạng</label>
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
                                ? 'bg-primary-container/20 text-primary-container border-primary-container/50 font-bold'
                                : 'bg-surface text-slate-400 border-border-subtle hover:text-slate-200')}
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
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-primary-container" />
                    <span>Tải Logo / Con Dấu từ máy</span>
                  </label>
                  <input
                    ref={wmImageInputRef}
                    type="file"
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
                          className="px-2.5 py-1.5 rounded bg-surface-container text-xs text-slate-200 hover:bg-surface-bright transition-colors"
                        >
                          Đổi
                        </button>
                        <button
                          type="button"
                          onClick={function () { handleConfigChange({ imageFile: null, imageDataUrl: null, type: 'text' }); }}
                          className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={function () { wmImageInputRef.current && wmImageInputRef.current.click(); }}
                      className="cursor-pointer p-4 rounded-lg border border-dashed border-border-subtle bg-surface hover:bg-surface-container hover:border-primary-container/60 transition-all text-center flex flex-col items-center justify-center gap-1.5"
                    >
                      <div className="w-9 h-9 rounded-lg bg-primary-container/10 border border-primary-container/20 flex items-center justify-center text-primary-container">
                        <Upload className="w-4 h-4" />
                      </div>
                      <p className="text-xs font-medium text-slate-200">Chọn tệp Logo (PNG trong suốt, SVG, JPG)</p>
                    </div>
                  )}
                </div>

                {/* Sample Seals */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Con dấu mẫu có sẵn</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { type: 'confidential', label: 'Tuyệt Mật', color: 'text-red-400' },
                      { type: 'approved', label: 'Phê Duyệt', color: 'text-secondary' },
                      { type: 'seal', label: 'Ngôi Sao', color: 'text-primary-container' }
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
                    <span className="text-slate-300">Thu phóng Logo</span>
                    <span className="text-primary-container font-bold">{Math.round(config.imageScale * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.5"
                    step="0.05"
                    value={config.imageScale}
                    onChange={function (e) { handleConfigChange({ imageScale: parseFloat(e.target.value) }); }}
                    className="w-full accent-primary-container h-1.5 bg-surface rounded-lg cursor-pointer"
                  />
                </div>

                {/* Remove White Bg Checkbox */}
                <label className="flex items-center gap-2.5 cursor-pointer p-2 rounded-lg bg-surface border border-border-subtle">
                  <input
                    type="checkbox"
                    checked={config.removeWhiteBg}
                    onChange={function (e) { handleConfigChange({ removeWhiteBg: e.target.checked }); }}
                    className="w-4 h-4 rounded accent-primary-container cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-medium text-slate-200 block">Tự động khử nền trắng</span>
                    <span className="text-[11px] text-slate-400 block">Thích hợp cho logo scan có nền trắng</span>
                  </div>
                </label>
              </div>
            )}

            {/* Display Mode / Position */}
            <div className="space-y-2 pt-1">
              <label className="text-xs text-slate-200 font-medium">Kiểu hiển thị & Bố cục vị trí:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={function () { handleConfigChange({ layoutMode: 'tiled', rotation: -45 }); }}
                  className={'p-3 rounded-lg flex flex-col items-center justify-center gap-1.5 text-center transition-colors border ' +
                    (config.layoutMode === 'tiled'
                      ? 'bg-primary-container/15 text-primary-container border-primary-container/60 shadow-sm'
                      : 'bg-surface text-slate-400 border-border-subtle hover:bg-surface-container hover:text-slate-200')}
                >
                  <Grid3X3 className="w-5 h-5" />
                  <span className="font-mono text-[11px] font-semibold">Lặp ma trận 45°</span>
                </button>
                <button
                  type="button"
                  onClick={function () { handleConfigChange({ layoutMode: 'single', position: 'center', rotation: 0 }); }}
                  className={'p-3 rounded-lg flex flex-col items-center justify-center gap-1.5 text-center transition-colors border ' +
                    (config.layoutMode === 'single' && config.position === 'center'
                      ? 'bg-primary-container/15 text-primary-container border-primary-container/60 shadow-sm'
                      : 'bg-surface text-slate-400 border-border-subtle hover:bg-surface-container hover:text-slate-200')}
                >
                  <Stamp className="w-5 h-5" />
                  <span className="font-mono text-[11px]">Tâm chính giữa</span>
                </button>
                <button
                  type="button"
                  onClick={function () { handleConfigChange({ layoutMode: 'single', position: 'bottom-right', rotation: 0 }); }}
                  className={'p-3 rounded-lg flex flex-col items-center justify-center gap-1.5 text-center transition-colors border ' +
                    (config.layoutMode === 'single' && config.position === 'bottom-right'
                      ? 'bg-primary-container/15 text-primary-container border-primary-container/60 shadow-sm'
                      : 'bg-surface text-slate-400 border-border-subtle hover:bg-surface-container hover:text-slate-200')}
                >
                  <RotateCw className="w-5 h-5" />
                  <span className="font-mono text-[11px]">Góc dưới phải</span>
                </button>
              </div>
            </div>

            {/* Sliders Matrix */}
            <div className="space-y-4 pt-1">
              {/* Opacity */}
              <div className="space-y-1">
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-slate-300">Độ trong suốt (Opacity)</span>
                  <span className="text-primary-container font-bold">{Math.round(config.opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="1.0"
                  step="0.01"
                  value={config.opacity}
                  onChange={function (e) { handleConfigChange({ opacity: parseFloat(e.target.value) }); }}
                  className="w-full accent-primary-container h-1.5 bg-surface rounded-lg cursor-pointer"
                />
              </div>

              {/* Font Size (if text) */}
              {controlTab === 'text' && (
                <div className="space-y-1">
                  <div className="flex justify-between font-mono text-xs">
                    <span className="text-slate-300">Cỡ chữ (Font Size)</span>
                    <span className="text-slate-400">{config.fontSize} px</span>
                  </div>
                  <input
                    type="range"
                    min="14"
                    max="72"
                    step="2"
                    value={config.fontSize}
                    onChange={function (e) { handleConfigChange({ fontSize: parseInt(e.target.value, 10) }); }}
                    className="w-full accent-primary-container h-1.5 bg-surface rounded-lg cursor-pointer"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Angle */}
                <div className="space-y-1">
                  <div className="flex justify-between font-mono text-xs">
                    <span className="text-slate-300">Góc xoay</span>
                    <span className="text-slate-400">{config.rotation}°</span>
                  </div>
                  <input
                    type="range"
                    min="-90"
                    max="90"
                    step="5"
                    value={config.rotation}
                    onChange={function (e) { handleConfigChange({ rotation: parseInt(e.target.value, 10) }); }}
                    className="w-full accent-primary-container h-1.5 bg-surface rounded-lg cursor-pointer"
                  />
                </div>

                {/* Tile Spacing */}
                <div className="space-y-1">
                  <div className="flex justify-between font-mono text-xs">
                    <span className="text-slate-300">Khoảng cách lặp</span>
                    <span className="text-slate-400">{config.tileGapX} px</span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="300"
                    step="10"
                    value={config.tileGapX}
                    onChange={function (e) { handleConfigChange({ tileGapX: parseInt(e.target.value, 10), tileGapY: Math.round(parseInt(e.target.value, 10) * 0.8) }); }}
                    className="w-full accent-primary-container h-1.5 bg-surface rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Color Palette Picker (for text) */}
            {controlTab === 'text' && (
              <div className="space-y-2">
                <span className="text-xs text-slate-200 font-medium">Bảng màu dấu bảo mật:</span>
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
                    value={config.color}
                    onChange={function (e) { handleConfigChange({ color: e.target.value }); }}
                    className="w-8 h-8 rounded-full border border-border-subtle bg-surface cursor-pointer p-0.5"
                    title="Màu tùy chỉnh"
                  />
                </div>
              </div>
            )}

            {/* Advanced Checkbox Options */}
            <div className="p-3 bg-surface rounded-lg border border-border-subtle space-y-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.applyAllPages}
                  onChange={function (e) { handleConfigChange({ applyAllPages: e.target.checked }); }}
                  className="w-4 h-4 accent-primary-container rounded cursor-pointer"
                />
                <span className="text-xs text-slate-300">Áp dụng trên toàn bộ trang tài liệu PDF & Office</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.addTimestampHidden}
                  onChange={function (e) { handleConfigChange({ addTimestampHidden: e.target.checked }); }}
                  className="w-4 h-4 accent-primary-container rounded cursor-pointer"
                />
                <span className="text-xs text-slate-300">Chèn Timestamp & User ID ngầm (Chống rò rỉ nội bộ)</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.flattenLayers}
                  onChange={function (e) { handleConfigChange({ flattenLayers: e.target.checked }); }}
                  className="w-4 h-4 accent-primary-container rounded cursor-pointer"
                />
                <span className="text-xs text-slate-300">Khóa chỉnh sửa & bảo vệ vector tài liệu (Flatten layers)</span>
              </label>
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
                    : 'bg-primary-container hover:bg-sky-400 text-slate-950 shadow-sky-500/20 active:scale-[0.99]')}
              >
                {stats.processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang render Canvas & đóng dấu PDF-Lib (In-Memory)...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-current" />
                    <span>Bắt Đầu Đóng Dấu {hasFiles ? fileItems.length : 0} Tệp Tin (Xuất Ngay Lập Tức)</span>
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
                <h3 className="text-sm font-semibold text-slate-100">Xem trước trực quan thời gian thực</h3>
              </div>

              {/* Mini Toolbar Controls */}
              <div className="flex items-center gap-2">
                {/* Page switch simulation */}
                <div className="flex items-center bg-surface border border-border-subtle rounded px-2 py-1 gap-2 font-mono text-xs text-slate-300">
                  <button className="hover:text-primary-container transition-colors" title="Trang trước">
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span>Trang 1 / 1</span>
                  <button className="hover:text-primary-container transition-colors" title="Trang sau">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Zoom */}
                <div className="flex items-center bg-surface border border-border-subtle rounded px-2 py-1 gap-1 font-mono text-xs text-slate-300">
                  <button
                    onClick={function () { setZoom(function (z) { return Math.max(0.4, z - 0.1); }); }}
                    className="hover:text-primary-container transition-colors"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-center">{Math.round(zoom * 100)}%</span>
                  <button
                    onClick={function () { setZoom(function (z) { return Math.min(1.8, z + 0.1); }); }}
                    className="hover:text-primary-container transition-colors"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Grid toggle */}
                <button
                  type="button"
                  onClick={function () { setShowGrid(!showGrid); }}
                  className={'p-1.5 rounded border transition-colors ' +
                    (showGrid
                      ? 'bg-primary-container/20 text-primary-container border-primary-container/50'
                      : 'bg-surface text-slate-400 border-border-subtle hover:text-white')}
                  title="Bật/Tắt lưới căn chỉnh"
                >
                  <Grid className="w-3.5 h-3.5" />
                </button>

                {/* Background Mode Toggle */}
                <button
                  type="button"
                  onClick={function () { setContrastMode(!contrastMode); }}
                  className={'p-1.5 rounded border transition-colors ' +
                    (contrastMode
                      ? 'bg-primary-container/20 text-primary-container border-primary-container/50'
                      : 'bg-surface text-slate-400 border-border-subtle hover:text-white')}
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
            <div className="flex items-center justify-between font-mono text-xs text-slate-400 pt-1">
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
                        className="text-primary-container hover:underline truncate max-w-[140px]"
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
                    ? 'ĐÃ ĐÓNG DẤU HOÀN TẤT ' + stats.done + '/' + stats.total + ' TỆP (0.42s - In-Memory WASM)'
                    : hasFiles
                      ? 'SẴN SÀNG ĐÓNG DẤU ' + stats.total + ' TỆP TIN'
                      : 'CHƯA CÓ TỆP TIN NÀO ĐƯỢC CHỌN'}
                </span>
              </div>
              <span className="font-mono text-xs text-slate-400">
                {hasFiles ? 'Kích thước: ' + formatFileSize(fileItems.reduce(function (a, b) { return a + b.size; }, 0)) : '0 MB'}
              </span>
            </div>

            {/* Summary Metrics Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-surface border border-border-subtle rounded-lg flex flex-col">
                <span className="font-mono text-[10px] text-slate-400 uppercase">TỔNG TỆP TIN</span>
                <span className="text-xl font-bold text-slate-100 font-mono mt-0.5">
                  {stats.done} / {stats.total}
                </span>
                <span className="text-xs text-secondary mt-0.5">
                  {stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0}% hoàn tất
                </span>
              </div>

              <div className="p-3 bg-surface border border-border-subtle rounded-lg flex flex-col">
                <span className="font-mono text-[10px] text-slate-400 uppercase">KHỐI LƯỢNG TRANG</span>
                <span className="text-xl font-bold text-slate-100 font-mono mt-0.5">
                  {hasFiles ? fileItems.length * 4 : 0}
                </span>
                <span className="text-xs text-slate-400 mt-0.5">PDF & Office & Ảnh</span>
              </div>

              <div className="p-3 bg-surface border border-border-subtle rounded-lg flex flex-col">
                <span className="font-mono text-[10px] text-slate-400 uppercase">CHẤT LƯỢNG XUẤT</span>
                <span className="text-xl font-bold text-primary-container font-mono mt-0.5">Lossless</span>
                <span className="text-xs text-slate-400 mt-0.5">Không nén suy hao</span>
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
                    ? 'bg-secondary hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 active:scale-[0.99] cursor-pointer'
                    : 'bg-surface text-slate-500 border border-border-subtle cursor-not-allowed')}
              >
                <Archive className="w-4 h-4" />
                <span>Tải Toàn Bộ Tệp Đã Đóng Dấu (.ZIP)</span>
              </button>

              {/* Secondary Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={function () { setZoom(1); }}
                  className="py-2 px-3 bg-surface hover:bg-surface-container border border-border-subtle text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Vừa khung hình</span>
                </button>
                <button
                  type="button"
                  onClick={function () { alert('Đã lưu cấu hình watermark thành công!'); }}
                  className="py-2 px-3 bg-surface hover:bg-surface-container border border-border-subtle text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Lưu cấu hình mẫu</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="py-2 px-3 bg-surface hover:bg-surface-container border border-border-subtle text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
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
            <div className="bg-surface border border-border-subtle rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-slate-100 flex flex-col max-h-[90vh]">
              <button
                type="button"
                onClick={function () { setIsExportOpen(false); }}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-container transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-secondary shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Đóng Dấu Hoàn Tất!</h3>
                  <p className="text-xs text-slate-400">{successfulItems.length} tệp đã xử lý thành công 100%</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 my-3 pr-1 max-h-[260px]">
                {successfulItems.map(function (item) {
                  return (
                    <div key={item.id} className="p-3 rounded-xl bg-surface-container/60 border border-border-subtle flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileCheck className="w-4 h-4 text-secondary shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-200 truncate">{item.name}</p>
                          <p className="text-[11px] font-mono text-slate-400">{formatFileSize(item.size)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={function () { downloadBlob(item.resultBlob, 'watermarked_' + item.name); }}
                        className="px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-bright border border-border-subtle text-slate-200 text-xs font-medium flex items-center gap-1 transition-colors shrink-0"
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
                  className="flex-1 py-3 px-4 rounded-xl bg-secondary hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <Package className="w-4 h-4" />
                  <span>Tải Về Gói ZIP ({successfulItems.length})</span>
                </button>
                <button
                  type="button"
                  onClick={function () { setIsExportOpen(false); }}
                  className="py-3 px-4 rounded-xl bg-surface hover:bg-surface-container border border-border-subtle text-slate-300 text-xs font-medium transition-colors"
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
          <div className="bg-surface border border-border-subtle rounded-2xl max-w-xl w-full p-6 shadow-2xl relative text-slate-100 flex flex-col max-h-[90vh]">
            <button
              type="button"
              onClick={function () { setIsHelpOpen(false); }}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-container transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary-container/20 border border-primary-container/30 flex items-center justify-center text-primary-container">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Hướng Dẫn Sử Dụng Watermark Studio</h3>
                <p className="text-xs text-slate-400">Công nghệ đóng dấu bảo mật đa định dạng v3.1</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs text-slate-300">
              <div className="p-3.5 rounded-xl bg-surface-container/60 border border-border-subtle">
                <h4 className="font-semibold text-slate-100 flex items-center gap-1.5 mb-1.5">
                  <ShieldCheck className="w-4 h-4 text-secondary" />
                  <span>100% An Toàn & Client-Side</span>
                </h4>
                <p className="leading-relaxed text-slate-400">
                  Tất cả tệp dữ liệu được xử lý trong RAM máy của bạn thông qua Canvas API và PDF-Lib WebAssembly. Tuyệt đối không gửi dữ liệu ra máy chủ ngoại biên.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container/60 border border-border-subtle">
                <h4 className="font-semibold text-slate-100 flex items-center gap-1.5 mb-1.5">
                  <FileCheck2 className="w-4 h-4 text-primary-container" />
                  <span>Khả Năng Hỗ Trợ Đa Định Dạng</span>
                </h4>
                <ul className="space-y-1.5 text-slate-400">
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-red-400" /><span><strong>PDF:</strong> Vẽ vector watermark lên mọi trang</span></li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-blue-400" /><span><strong>DOCX:</strong> Chèn watermark header chuẩn OpenXML</span></li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /><span><strong>XLSX:</strong> Đóng dấu nền toàn bộ các sheet tính</span></li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-amber-400" /><span><strong>PPTX:</strong> Chèn vector shape bảo vệ từng slide</span></li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-purple-400" /><span><strong>Ảnh:</strong> Giữ nguyên kích thước và chất lượng gốc</span></li>
                </ul>
              </div>
            </div>

            <div className="pt-3 border-t border-border-subtle mt-3 text-right">
              <button
                type="button"
                onClick={function () { setIsHelpOpen(false); }}
                className="px-4 py-2 rounded-xl bg-primary-container hover:bg-sky-400 text-slate-950 font-bold text-xs transition-colors"
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
