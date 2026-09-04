/**
 * WatermarkStudioView.jsx
 * ========================================================================
 * Self-contained Watermark Studio miniapp for the AI-Tools portal.
 * Adds text or image watermarks to PDF, DOCX, XLSX, PPTX, and images.
 *
 * Architecture:
 *   - All logic (engines, helpers, constants) inlined to keep crash isolation.
 *   - Uses only dependencies already in @ai-tools/core and hub package.json:
 *     pdf-lib, jszip, lucide-react, canvas-confetti, react.
 *   - 100% client-side processing — zero server uploads.
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
  CheckCircle
} from 'lucide-react';

// ========================================================================
// CONSTANTS & PRESETS
// ========================================================================

const DEFAULT_WATERMARK_CONFIG = {
  type: 'text',
  text: 'BẢN QUYỀN / CONFIDENTIAL',
  fontFamily: 'Inter, sans-serif',
  fontSize: 48,
  color: '#EF4444',
  bold: true,
  italic: false,
  allCaps: true,
  imageFile: null,
  imageDataUrl: null,
  imageScale: 0.4,
  removeWhiteBg: true,
  opacity: 0.25,
  rotation: -45,
  blendMode: 'normal',
  layoutMode: 'tiled',
  position: 'center',
  tileGapX: 180,
  tileGapY: 140,
  density: 'medium',
  targetPages: 'all'
};

const WATERMARK_PRESETS = [
  {
    id: 'confidential', name: 'TUYỆT MẬT (CONFIDENTIAL)',
    description: 'Chữ đỏ cảnh báo in hoa, nghiêng 45°, độ mờ 25% chống sao chép',
    badge: 'Bảo mật',
    config: { type: 'text', text: 'TUYỆT MẬT / CONFIDENTIAL', color: '#EF4444', fontSize: 52, opacity: 0.28, rotation: -45, bold: true, layoutMode: 'tiled', density: 'medium' }
  },
  {
    id: 'draft', name: 'BẢN NHÁP (DRAFT)',
    description: 'Chữ xám trung tính, phù hợp tài liệu đang soạn thảo',
    badge: 'Soạn thảo',
    config: { type: 'text', text: 'BẢN NHÁP / DRAFT', color: '#64748B', fontSize: 56, opacity: 0.20, rotation: -45, bold: true, layoutMode: 'single', position: 'center' }
  },
  {
    id: 'sample', name: 'MẪU THỬ (SAMPLE)',
    description: 'Chữ xanh dương chuyên nghiệp, căn giữa trang',
    badge: 'Mẫu thử',
    config: { type: 'text', text: 'MẪU XEM TRƯỚC / SAMPLE', color: '#3B82F6', fontSize: 44, opacity: 0.30, rotation: -30, bold: true, layoutMode: 'single', position: 'center' }
  },
  {
    id: 'internal', name: 'LƯU HÀNH NỘI BỘ',
    description: 'Cam hổ phách, lưới dày đặc chống chụp màn hình',
    badge: 'Nội bộ',
    config: { type: 'text', text: 'LƯU HÀNH NỘI BỘ - KHÔNG SAO CHÉP', color: '#F59E0B', fontSize: 36, opacity: 0.22, rotation: -35, bold: true, layoutMode: 'tiled', density: 'high' }
  },
  {
    id: 'approved', name: 'ĐÃ PHÊ DUYỆT (APPROVED)',
    description: 'Xanh lá con dấu góc dưới, khẳng định tài liệu hợp lệ',
    badge: 'Phê duyệt',
    config: { type: 'text', text: '✓ ĐÃ DUYỆT / APPROVED', color: '#10B981', fontSize: 38, opacity: 0.45, rotation: 0, bold: true, layoutMode: 'single', position: 'bottom-right' }
  },
  {
    id: 'copyright', name: 'BẢN QUYỀN TÁC GIẢ ©',
    description: 'Đóng dấu góc dưới dạng ngang tinh tế',
    badge: 'Bản quyền',
    config: { type: 'text', text: '© COPYRIGHT - ALL RIGHTS RESERVED', color: '#475569', fontSize: 24, opacity: 0.35, rotation: 0, bold: false, layoutMode: 'single', position: 'bottom-center' }
  }
];

const COLOR_PALETTES = [
  { name: 'Đỏ Cảnh Báo', hex: '#EF4444' },
  { name: 'Xám Tinh Tế', hex: '#64748B' },
  { name: 'Xanh Doanh Nghiệp', hex: '#3B82F6' },
  { name: 'Navy Đậm', hex: '#1E3A8A' },
  { name: 'Cam Nổi Bật', hex: '#F59E0B' },
  { name: 'Xanh Lá', hex: '#10B981' },
  { name: 'Tím Sang Trọng', hex: '#8B5CF6' },
  { name: 'Đen Thuần', hex: '#000000' },
  { name: 'Trắng', hex: '#FFFFFF' },
];

const FONT_OPTIONS = [
  { name: 'Inter', value: 'Inter, sans-serif' },
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { name: 'Roboto', value: 'Roboto, sans-serif' },
  { name: 'Courier', value: '"Courier New", Courier, monospace' },
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
    var reader = new FileReader();
    reader.onload = function () { resolve(reader.result); };
    reader.onerror = function () { reject(reader.error); };
    reader.readAsArrayBuffer(file);
  });
}

function readFileAsDataURL(file) {
  return new Promise(function (resolve, reject) {
    var reader = new FileReader();
    reader.onload = function () { resolve(reader.result); };
    reader.onerror = function () { reject(reader.error); };
    reader.readAsDataURL(file);
  });
}

function loadImageElement(src) {
  return new Promise(function (resolve, reject) {
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () { resolve(img); };
    img.onerror = function (e) { reject(e); };
    img.src = src;
  });
}

function downloadBlob(blob, filename) {
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
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
  var pad = Math.max(40, padding);
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
  var text = config.allCaps ? config.text.toUpperCase() : config.text;
  if (!text.trim()) return;
  ctx.save();
  ctx.globalAlpha = config.opacity;
  ctx.fillStyle = config.color;
  var fontStyle = config.italic ? 'italic ' : '';
  var fontWeight = config.bold ? 'bold ' : 'normal ';
  var baseScale = Math.min(width, height) / 1000;
  var computedFontSize = Math.max(16, Math.round(config.fontSize * Math.max(0.8, baseScale)));
  ctx.font = fontStyle + fontWeight + computedFontSize + 'px ' + config.fontFamily;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  var angleRad = (config.rotation * Math.PI) / 180;
  if (config.layoutMode === 'single') {
    var coords = getAnchorCoordinates(config.position, width, height, computedFontSize);
    ctx.save(); ctx.translate(coords.x, coords.y); ctx.rotate(angleRad); ctx.fillText(text, 0, 0); ctx.restore();
  } else {
    var gapX = Math.max(80, config.tileGapX * baseScale);
    var gapY = Math.max(60, config.tileGapY * baseScale);
    var diagonal = Math.sqrt(width * width + height * height);
    for (var x = -diagonal / 2; x < width + diagonal / 2; x += gapX) {
      for (var y = -diagonal / 2; y < height + diagonal / 2; y += gapY) {
        ctx.save(); ctx.translate(x, y); ctx.rotate(angleRad); ctx.fillText(text, 0, 0); ctx.restore();
      }
    }
  }
  ctx.restore();
}

async function drawImageWatermark(ctx, width, height, config) {
  var imgSource = config.imageDataUrl;
  if (!imgSource && config.imageFile) imgSource = await readFileAsDataURL(config.imageFile);
  if (!imgSource) return;
  var wmImg = await loadImageElement(imgSource);
  var wmWidth = wmImg.naturalWidth || wmImg.width;
  var wmHeight = wmImg.naturalHeight || wmImg.height;
  var offCanvas = document.createElement('canvas');
  offCanvas.width = wmWidth; offCanvas.height = wmHeight;
  var offCtx = offCanvas.getContext('2d');
  if (!offCtx) return;
  offCtx.drawImage(wmImg, 0, 0, wmWidth, wmHeight);
  if (config.removeWhiteBg) removeWhiteBackgroundFromCanvas(offCtx, wmWidth, wmHeight, 35);
  var targetScale = config.imageScale * (Math.min(width, height) / 800);
  var drawW = wmWidth * targetScale, drawH = wmHeight * targetScale;
  var angleRad = (config.rotation * Math.PI) / 180;
  ctx.save(); ctx.globalAlpha = config.opacity;
  if (config.layoutMode === 'single') {
    var coords = getAnchorCoordinates(config.position, width, height, Math.max(drawW, drawH) / 2);
    ctx.save(); ctx.translate(coords.x, coords.y); ctx.rotate(angleRad); ctx.drawImage(offCanvas, -drawW / 2, -drawH / 2, drawW, drawH); ctx.restore();
  } else {
    var gapX = Math.max(drawW + 40, (config.tileGapX * width) / 1000);
    var gapY = Math.max(drawH + 40, (config.tileGapY * height) / 1000);
    var diagonal = Math.sqrt(width * width + height * height);
    for (var x = -diagonal / 2; x < width + diagonal / 2; x += gapX) {
      for (var y = -diagonal / 2; y < height + diagonal / 2; y += gapY) {
        ctx.save(); ctx.translate(x, y); ctx.rotate(angleRad); ctx.drawImage(offCanvas, -drawW / 2, -drawH / 2, drawW, drawH); ctx.restore();
      }
    }
  }
  ctx.restore();
}

async function processImageWatermark(imageFile, config) {
  var dataUrl = await readFileAsDataURL(imageFile);
  var baseImg = await loadImageElement(dataUrl);
  var canvas = document.createElement('canvas');
  var width = baseImg.naturalWidth || baseImg.width;
  var height = baseImg.naturalHeight || baseImg.height;
  canvas.width = width; canvas.height = height;
  var ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context error');
  ctx.drawImage(baseImg, 0, 0, width, height);
  if (config.type === 'text') await drawTextWatermark(ctx, width, height, config);
  else if (config.type === 'image' && (config.imageDataUrl || config.imageFile)) await drawImageWatermark(ctx, width, height, config);
  var mimeType = 'image/png';
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
  var canvas = document.createElement('canvas');
  var dpr = 2;
  canvas.width = targetWidth * dpr; canvas.height = targetHeight * dpr;
  var ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas error');
  ctx.scale(dpr, dpr);
  if (config.type === 'text') {
    var text = config.allCaps ? config.text.toUpperCase() : config.text;
    ctx.fillStyle = config.color;
    var fontStyle = config.italic ? 'italic ' : '';
    var fontWeight = config.bold ? 'bold ' : 'normal ';
    ctx.font = fontStyle + fontWeight + config.fontSize + 'px ' + config.fontFamily;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    var metrics = ctx.measureText(text);
    var textW = Math.max(100, metrics.width + 40);
    var textH = Math.max(50, config.fontSize * 1.6);
    var stampCanvas = document.createElement('canvas');
    stampCanvas.width = textW * dpr; stampCanvas.height = textH * dpr;
    var sCtx = stampCanvas.getContext('2d');
    if (sCtx) {
      sCtx.scale(dpr, dpr); sCtx.fillStyle = config.color;
      sCtx.font = fontStyle + fontWeight + config.fontSize + 'px ' + config.fontFamily;
      sCtx.textAlign = 'center'; sCtx.textBaseline = 'middle';
      sCtx.fillText(text, textW / 2, textH / 2);
      return { dataUrl: stampCanvas.toDataURL('image/png'), width: textW, height: textH };
    }
  } else if (config.type === 'image' && (config.imageDataUrl || config.imageFile)) {
    var src = config.imageDataUrl;
    if (!src && config.imageFile) src = await readFileAsDataURL(config.imageFile);
    if (src) {
      var img = await loadImageElement(src);
      var w = (img.naturalWidth || img.width) * config.imageScale;
      var h = (img.naturalHeight || img.height) * config.imageScale;
      var stampCanvas2 = document.createElement('canvas');
      stampCanvas2.width = w * dpr; stampCanvas2.height = h * dpr;
      var sCtx2 = stampCanvas2.getContext('2d');
      if (sCtx2) {
        sCtx2.scale(dpr, dpr); sCtx2.drawImage(img, 0, 0, w, h);
        if (config.removeWhiteBg) removeWhiteBackgroundFromCanvas(sCtx2, w * dpr, h * dpr, 35);
        return { dataUrl: stampCanvas2.toDataURL('image/png'), width: w, height: h };
      }
    }
  }
  return { dataUrl: canvas.toDataURL('image/png'), width: targetWidth, height: targetHeight };
}

function getPdfAnchorCoordinates(pos, pageWidth, pageHeight, stampWidth, stampHeight) {
  var pad = 40;
  switch (pos) {
    case 'top-left': return { x: pad, y: pageHeight - stampHeight - pad };
    case 'top-center': return { x: (pageWidth - stampWidth) / 2, y: pageHeight - stampHeight - pad };
    case 'top-right': return { x: pageWidth - stampWidth - pad, y: pageHeight - stampHeight - pad };
    case 'middle-left': return { x: pad, y: (pageHeight - stampHeight) / 2 };
    case 'middle-right': return { x: pageWidth - stampWidth - pad, y: (pageHeight - stampHeight) / 2 };
    case 'bottom-left': return { x: pad, y: pad };
    case 'bottom-center': return { x: (pageWidth - stampWidth) / 2, y: pad };
    case 'bottom-right': return { x: pageWidth - stampWidth - pad, y: pad };
    case 'center': default: return { x: (pageWidth - stampWidth) / 2, y: (pageHeight - stampHeight) / 2 };
  }
}

async function processPdfWatermark(pdfFile, config, onProgress) {
  var arrayBuffer = await readFileAsArrayBuffer(pdfFile);
  var pdfDoc = await PDFDocument.load(arrayBuffer);
  var pages = pdfDoc.getPages();
  var pageCount = pages.length;
  var firstPage = pages[0];
  var size = firstPage.getSize();
  var watermarkStamp = await generateWatermarkImage(config, size.width, size.height);
  var pngResponse = await fetch(watermarkStamp.dataUrl);
  var pngBytes = await pngResponse.arrayBuffer();
  var embeddedPng = await pdfDoc.embedPng(pngBytes);
  var stampW = watermarkStamp.width, stampH = watermarkStamp.height;
  var rotationAngle = config.rotation;
  for (var i = 0; i < pageCount; i++) {
    var page = pages[i];
    var pgSize = page.getSize();
    if (config.layoutMode === 'single') {
      var coords = getPdfAnchorCoordinates(config.position, pgSize.width, pgSize.height, stampW, stampH);
      page.drawImage(embeddedPng, { x: coords.x, y: coords.y, width: stampW, height: stampH, rotate: degrees(rotationAngle), opacity: config.opacity });
    } else {
      var gapX = Math.max(stampW + 60, config.tileGapX);
      var gapY = Math.max(stampH + 60, config.tileGapY);
      var diagonal = Math.sqrt(pgSize.width * pgSize.width + pgSize.height * pgSize.height);
      for (var x = -diagonal / 2; x < pgSize.width + diagonal / 2; x += gapX) {
        for (var y = -diagonal / 2; y < pgSize.height + diagonal / 2; y += gapY) {
          page.drawImage(embeddedPng, { x: x, y: y, width: stampW, height: stampH, rotate: degrees(rotationAngle), opacity: config.opacity });
        }
      }
    }
    if (onProgress) onProgress(Math.round(((i + 1) / pageCount) * 100));
  }
  var pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}

// ========================================================================
// DOCX ENGINE
// ========================================================================

async function processDocxWatermark(docxFile, config) {
  var arrayBuffer = await readFileAsArrayBuffer(docxFile);
  var zip = await JSZip.loadAsync(arrayBuffer);
  var headerRelId = 'rIdWatermarkHeader';
  var rotation = Math.round(config.rotation);
  var opacity = config.opacity.toFixed(2);
  var color = config.color;
  var headerXmlContent = '';
  if (config.type === 'text') {
    var text = config.allCaps ? config.text.toUpperCase() : config.text;
    var escapedText = escapeXml(text);
    var font = config.fontFamily.split(',')[0].replace(/['"]/g, '');
    var weight = config.bold ? 'bold' : 'normal';
    var style = config.italic ? 'italic' : 'normal';
    headerXmlContent = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><w:p><w:pPr><w:pStyle w:val="Header"/></w:pPr><w:r><w:rPr><w:noProof/></w:rPr><w:pict><v:shapetype id="_x0000_t136" coordsize="21600,21600" o:spt="136" path="m@7,l@8,m@5,21600l@6,21600e"><v:textpath on="t" fitshape="t"/><v:path textpathok="t"/></v:shapetype><v:shape id="WatermarkStudioText" type="#_x0000_t136" style="position:absolute;margin-left:0;margin-top:0;width:468pt;height:260pt;z-index:-251657216;mso-position-horizontal:center;mso-position-horizontal-relative:margin;mso-position-vertical:center;mso-position-vertical-relative:margin;rotation:' + rotation + '" fillcolor="' + color + '" stroked="f"><v:fill opacity="' + opacity + '"/><v:textpath style="font-family:\'' + font + '\';font-weight:' + weight + ';font-style:' + style + '" string="' + escapedText + '"/></v:shape></w:pict></w:r></w:p></w:hdr>';
  } else {
    var dataUrl = config.imageDataUrl;
    if (!dataUrl && config.imageFile) dataUrl = await readFileAsDataURL(config.imageFile);
    if (!dataUrl) throw new Error('No watermark image selected for DOCX');
    var img = await loadImageElement(dataUrl);
    var canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width; canvas.height = img.naturalHeight || img.height;
    var ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Canvas error');
    ctx.drawImage(img, 0, 0);
    if (config.removeWhiteBg) removeWhiteBackgroundFromCanvas(ctx, canvas.width, canvas.height, 35);
    var pngBlob = await new Promise(function (resolve) { canvas.toBlob(function (b) { resolve(b); }, 'image/png'); });
    var pngBytes = await readFileAsArrayBuffer(pngBlob);
    zip.file('word/media/watermark_logo.png', pngBytes);
    var headerRelsXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdLogo" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/watermark_logo.png"/></Relationships>';
    zip.file('word/_rels/header_wm.xml.rels', headerRelsXml);
    var imgScale = Math.round(350 * config.imageScale);
    headerXmlContent = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><w:p><w:pPr><w:pStyle w:val="Header"/></w:pPr><w:r><w:rPr><w:noProof/></w:rPr><w:pict><v:shape id="WatermarkStudioImage" style="position:absolute;margin-left:0;margin-top:0;width:' + imgScale + 'pt;height:' + imgScale + 'pt;z-index:-251657216;mso-position-horizontal:center;mso-position-horizontal-relative:margin;mso-position-vertical:center;mso-position-vertical-relative:margin;rotation:' + rotation + '" stroked="f"><v:imagedata r:id="rIdLogo" o:title="watermark"/><v:fill opacity="' + opacity + '"/></v:shape></w:pict></w:r></w:p></w:hdr>';
  }
  zip.file('word/header_wm.xml', headerXmlContent);
  var contentTypesFile = zip.file('[Content_Types].xml');
  if (contentTypesFile) {
    var ct = await contentTypesFile.async('text');
    if (!ct.includes('PartName="/word/header_wm.xml"')) {
      ct = ct.replace('</Types>', '  <Override PartName="/word/header_wm.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>\n</Types>');
      zip.file('[Content_Types].xml', ct);
    }
  }
  var docRelsFile = zip.file('word/_rels/document.xml.rels');
  if (docRelsFile) {
    var dr = await docRelsFile.async('text');
    if (!dr.includes(headerRelId)) {
      dr = dr.replace('</Relationships>', '  <Relationship Id="' + headerRelId + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header_wm.xml"/>\n</Relationships>');
      zip.file('word/_rels/document.xml.rels', dr);
    }
  }
  var documentFile = zip.file('word/document.xml');
  if (documentFile) {
    var docXml = await documentFile.async('text');
    var headerRefTag = '<w:headerReference w:type="default" r:id="' + headerRelId + '"/>';
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
  var canvas = document.createElement('canvas');
  var tileWidth = 700, tileHeight = 500;
  canvas.width = tileWidth; canvas.height = tileHeight;
  var ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas error');
  ctx.clearRect(0, 0, tileWidth, tileHeight);
  if (config.type === 'text') {
    var text = config.allCaps ? config.text.toUpperCase() : config.text;
    ctx.save(); ctx.globalAlpha = config.opacity; ctx.fillStyle = config.color;
    var fontStyle = config.italic ? 'italic ' : '';
    var fontWeight = config.bold ? 'bold ' : 'normal ';
    ctx.font = fontStyle + fontWeight + config.fontSize + 'px ' + config.fontFamily;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.translate(tileWidth / 2, tileHeight / 2);
    ctx.rotate((config.rotation * Math.PI) / 180);
    ctx.fillText(text, 0, 0); ctx.restore();
  } else {
    var src = config.imageDataUrl;
    if (!src && config.imageFile) src = await readFileAsDataURL(config.imageFile);
    if (src) {
      var img = await loadImageElement(src);
      var w = (img.naturalWidth || img.width) * config.imageScale;
      var h = (img.naturalHeight || img.height) * config.imageScale;
      ctx.save(); ctx.globalAlpha = config.opacity;
      ctx.translate(tileWidth / 2, tileHeight / 2);
      ctx.rotate((config.rotation * Math.PI) / 180);
      var offCanvas = document.createElement('canvas');
      offCanvas.width = img.naturalWidth || img.width; offCanvas.height = img.naturalHeight || img.height;
      var offCtx = offCanvas.getContext('2d');
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
  var arrayBuffer = await readFileAsArrayBuffer(xlsxFile);
  var zip = await JSZip.loadAsync(arrayBuffer);
  var imgBlob = await createExcelWatermarkImageBlob(config);
  var imgBytes = await readFileAsArrayBuffer(imgBlob);
  zip.file('xl/media/watermark_bg.png', imgBytes);
  var contentTypesFile = zip.file('[Content_Types].xml');
  if (contentTypesFile) {
    var ct = await contentTypesFile.async('text');
    if (!ct.includes('Extension="png"')) {
      ct = ct.replace('</Types>', '  <Default Extension="png" ContentType="image/png"/>\n</Types>');
      zip.file('[Content_Types].xml', ct);
    }
  }
  var sheetFiles = Object.keys(zip.files).filter(function (p) { return p.startsWith('xl/worksheets/sheet') && p.endsWith('.xml'); });
  var bgRelId = 'rIdWatermarkBg';
  for (var si = 0; si < sheetFiles.length; si++) {
    var sheetPath = sheetFiles[si];
    var sheetNum = sheetPath.replace('xl/worksheets/', '').replace('.xml', '');
    var relsPath = 'xl/worksheets/_rels/' + sheetNum + '.xml.rels';
    var relsXml = '';
    var existingRelsFile = zip.file(relsPath);
    if (existingRelsFile) {
      relsXml = await existingRelsFile.async('text');
      if (!relsXml.includes(bgRelId)) {
        relsXml = relsXml.replace('</Relationships>', '  <Relationship Id="' + bgRelId + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/watermark_bg.png"/>\n</Relationships>');
      }
    } else {
      relsXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="' + bgRelId + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/watermark_bg.png"/></Relationships>';
    }
    zip.file(relsPath, relsXml);
    var sheetFile = zip.file(sheetPath);
    if (sheetFile) {
      var sheetXml = await sheetFile.async('text');
      var pictureTag = '<picture r:id="' + bgRelId + '"/>';
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
  var arrayBuffer = await readFileAsArrayBuffer(pptxFile);
  var zip = await JSZip.loadAsync(arrayBuffer);
  var slideFiles = Object.keys(zip.files).filter(function (p) { return p.startsWith('ppt/slides/slide') && p.endsWith('.xml'); });
  var opacityValue = Math.round(config.opacity * 100000);
  var rotValue = Math.round(config.rotation * 60000);
  var rgbVal = hexToRgb(config.color);
  var hexColor = ((1 << 24) + (rgbVal.r << 16) + (rgbVal.g << 8) + rgbVal.b).toString(16).slice(1).toUpperCase();
  if (config.type === 'text') {
    var text = config.allCaps ? config.text.toUpperCase() : config.text;
    var escapedText = escapeXml(text);
    var font = config.fontFamily.split(',')[0].replace(/['"]/g, '');
    var szVal = Math.round(config.fontSize * 100);
    for (var i = 0; i < slideFiles.length; i++) {
      var slidePath = slideFiles[i];
      var slideFile = zip.file(slidePath);
      if (!slideFile) continue;
      var slideXml = await slideFile.async('text');
      var shapeId = 9990 + i;
      var watermarkShapeXml = '<p:sp xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><p:nvSpPr><p:cNvPr id="' + shapeId + '" name="WatermarkText_' + shapeId + '"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm rot="' + rotValue + '"><a:off x="914400" y="1028700"/><a:ext cx="7315200" cy="3086100"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr><p:txBody><a:bodyPr wrap="square" lIns="0" tIns="0" rIns="0" bIns="0" anchor="ctr"/><a:lstStyle/><a:p><a:pPr algn="ctr"/><a:r><a:rPr lang="vi-VN" sz="' + szVal + '" b="' + (config.bold ? 1 : 0) + '" i="' + (config.italic ? 1 : 0) + '"><a:solidFill><a:srgbClr val="' + hexColor + '"><a:alpha val="' + opacityValue + '"/></a:srgbClr></a:solidFill><a:latin typeface="' + font + '"/><a:ea typeface="' + font + '"/><a:cs typeface="' + font + '"/></a:rPr><a:t>' + escapedText + '</a:t></a:r></a:p></p:txBody></p:sp>';
      if (slideXml.includes('</p:spTree>')) {
        slideXml = slideXml.replace('</p:spTree>', watermarkShapeXml + '\n    </p:spTree>');
        zip.file(slidePath, slideXml);
      }
    }
  } else {
    var dataUrl = config.imageDataUrl;
    if (!dataUrl && config.imageFile) dataUrl = await readFileAsDataURL(config.imageFile);
    if (!dataUrl) throw new Error('No watermark image for PPTX');
    var img = await loadImageElement(dataUrl);
    var canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width; canvas.height = img.naturalHeight || img.height;
    var ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Canvas error');
    ctx.drawImage(img, 0, 0);
    if (config.removeWhiteBg) removeWhiteBackgroundFromCanvas(ctx, canvas.width, canvas.height, 35);
    var pngBlob = await new Promise(function (resolve) { canvas.toBlob(function (b) { resolve(b); }, 'image/png'); });
    var pngBytes = await readFileAsArrayBuffer(pngBlob);
    zip.file('ppt/media/watermark_logo.png', pngBytes);
    var ctFile = zip.file('[Content_Types].xml');
    if (ctFile) {
      var ctText = await ctFile.async('text');
      if (!ctText.includes('Extension="png"')) {
        ctText = ctText.replace('</Types>', '  <Default Extension="png" ContentType="image/png"/>\n</Types>');
        zip.file('[Content_Types].xml', ctText);
      }
    }
    var imgRelId = 'rIdWatermarkImg';
    var picScale = config.imageScale;
    var picW = Math.round(3657600 * picScale), picH = Math.round(3657600 * picScale);
    var slideWidthEmu = 9144000, slideHeightEmu = 5143500;
    var offX = Math.round((slideWidthEmu - picW) / 2), offY = Math.round((slideHeightEmu - picH) / 2);
    for (var j = 0; j < slideFiles.length; j++) {
      var sPath = slideFiles[j];
      var slideNum = sPath.replace('ppt/slides/', '').replace('.xml', '');
      var relsPath = 'ppt/slides/_rels/' + slideNum + '.xml.rels';
      var relsXml = '';
      var existingRels = zip.file(relsPath);
      if (existingRels) {
        relsXml = await existingRels.async('text');
        if (!relsXml.includes(imgRelId)) {
          relsXml = relsXml.replace('</Relationships>', '  <Relationship Id="' + imgRelId + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/watermark_logo.png"/>\n</Relationships>');
        }
      } else {
        relsXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="' + imgRelId + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/watermark_logo.png"/></Relationships>';
      }
      zip.file(relsPath, relsXml);
      var sFile = zip.file(sPath);
      if (sFile) {
        var sXml = await sFile.async('text');
        var picId = 8880 + j;
        var picShapeXml = '<p:pic xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><p:nvPicPr><p:cNvPr id="' + picId + '" name="WatermarkPicture_' + picId + '"/><p:cNvPicPr/><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="' + imgRelId + '" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><a:alphaModFix amt="' + opacityValue + '"/></a:blip><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr><a:xfrm rot="' + rotValue + '"><a:off x="' + offX + '" y="' + offY + '"/><a:ext cx="' + picW + '" cy="' + picH + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>';
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
  var category = item.category || getFileCategory(item.name, item.file.type);
  var resultBlob;
  switch (category) {
    case 'pdf': resultBlob = await processPdfWatermark(item.file, config, onProgress); break;
    case 'image': if (onProgress) onProgress(30); resultBlob = await processImageWatermark(item.file, config); if (onProgress) onProgress(100); break;
    case 'docx': if (onProgress) onProgress(30); resultBlob = await processDocxWatermark(item.file, config); if (onProgress) onProgress(100); break;
    case 'xlsx': if (onProgress) onProgress(30); resultBlob = await processXlsxWatermark(item.file, config); if (onProgress) onProgress(100); break;
    case 'pptx': if (onProgress) onProgress(30); resultBlob = await processPptxWatermark(item.file, config); if (onProgress) onProgress(100); break;
    default: throw new Error('Unsupported format: .' + item.extension);
  }
  var resultUrl = URL.createObjectURL(resultBlob);
  return { resultBlob: resultBlob, resultUrl: resultUrl };
}

// ========================================================================
// SAMPLE FILE GENERATOR
// ========================================================================

async function createSamplePdf() {
  var pdfDoc = await PDFDocument.create();
  var page = pdfDoc.addPage([595, 842]);
  var font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  var regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  page.drawText('CONG TY CO PHAN CONG NGHE WATERMARK STUDIO', { x: 50, y: 780, size: 14, font: font, color: rgb(0.1, 0.2, 0.4) });
  page.drawText('BAO CAO TAI CHINH & HOAT DONG KINH DOANH 2026', { x: 50, y: 750, size: 16, font: font, color: rgb(0.2, 0.2, 0.2) });
  for (var i = 0; i < 8; i++) {
    page.drawText('Muc ' + (i + 1) + ': Noi dung chi tiet ve ke hoach trien khai.', { x: 50, y: 680 - i * 35, size: 11, font: regularFont, color: rgb(0.3, 0.3, 0.3) });
  }
  var pdfBytes = await pdfDoc.save();
  return new File([pdfBytes], 'Bao_Cao_Tai_Chinh_2026.pdf', { type: 'application/pdf' });
}

async function createSampleDocx() {
  var zip = new JSZip();
  zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  zip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  zip.file('word/document.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>HOP DONG NGUYEN TAC CUNG CAP DICH VU</w:t></w:r></w:p><w:p><w:r><w:t>So: 88/2026/HDNT-WMSTUDIO</w:t></w:r></w:p><w:sectPr/></w:body></w:document>');
  zip.file('word/_rels/document.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>');
  var blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  return new File([blob], 'Hop_Dong_Dich_Vu.docx', { type: blob.type });
}

async function createSampleXlsx() {
  var zip = new JSZip();
  zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>');
  zip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
  zip.file('xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Doanh Thu" sheetId="1" r:id="rIdSheet1"/></sheets></workbook>');
  zip.file('xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdSheet1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>');
  zip.file('xl/worksheets/sheet1.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>BANG KE CHI PHI DU AN</t></is></c></row></sheetData></worksheet>');
  var blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  return new File([blob], 'Bang_Ke_Chi_Phi.xlsx', { type: blob.type });
}

async function createSamplePptx() {
  var zip = new JSZip();
  zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/><Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/></Types>');
  zip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/></Relationships>');
  zip.file('ppt/presentation.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><p:sldIdLst><p:sldId id="256" r:id="rIdSlide1"/></p:sldIdLst></p:presentation>');
  zip.file('ppt/_rels/presentation.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdSlide1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/></Relationships>');
  zip.file('ppt/slides/slide1.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr><p:sp><p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:t>KE HOACH CHIEN LUOC</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld></p:sld>');
  var blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
  return new File([blob], 'Ke_Hoach_Chien_Luoc.pptx', { type: blob.type });
}

async function createSampleImage() {
  var canvas = document.createElement('canvas');
  canvas.width = 1200; canvas.height = 800;
  var ctx = canvas.getContext('2d');
  if (ctx) {
    var grad = ctx.createLinearGradient(0, 0, 1200, 800);
    grad.addColorStop(0, '#1e1b4b'); grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 1200, 800);
    ctx.strokeStyle = '#4338ca'; ctx.lineWidth = 4; ctx.strokeRect(60, 60, 1080, 680);
    ctx.fillStyle = '#6366f1'; ctx.beginPath(); ctx.arc(600, 350, 100, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 36px Inter, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('ANH BAN QUYEN SAN PHAM', 600, 520);
  }
  var blob = await new Promise(function (resolve) { canvas.toBlob(function (b) { resolve(b); }, 'image/png'); });
  return new File([blob], 'Anh_Mau_Thiet_Ke.png', { type: 'image/png' });
}

async function generateAllSampleFiles() {
  var results = await Promise.all([createSamplePdf(), createSampleDocx(), createSampleXlsx(), createSamplePptx(), createSampleImage()]);
  var makeItem = function (file, cat, ext) { return { id: generateId(), file: file, name: file.name, size: file.size, category: cat, extension: ext, status: 'pending', progress: 0 }; };
  return [makeItem(results[0], 'pdf', 'pdf'), makeItem(results[1], 'docx', 'docx'), makeItem(results[2], 'xlsx', 'xlsx'), makeItem(results[3], 'pptx', 'pptx'), makeItem(results[4], 'image', 'png')];
}

// ========================================================================
// SVG STAMP GENERATOR
// ========================================================================

function createSampleStampSvg(type) {
  if (type === 'confidential') return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><circle cx="150" cy="150" r="140" fill="none" stroke="%23EF4444" stroke-width="8" stroke-dasharray="10 5"/><circle cx="150" cy="150" r="120" fill="none" stroke="%23EF4444" stroke-width="4"/><text x="150" y="155" font-family="Arial, sans-serif" font-weight="900" font-size="28" fill="%23EF4444" text-anchor="middle">CONFIDENTIAL</text></svg>';
  if (type === 'approved') return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect x="15" y="15" width="270" height="270" rx="20" fill="none" stroke="%2310B981" stroke-width="8"/><text x="150" y="155" font-family="Arial, sans-serif" font-weight="900" font-size="32" fill="%2310B981" text-anchor="middle">APPROVED</text></svg>';
  return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><circle cx="150" cy="150" r="135" fill="none" stroke="%233B82F6" stroke-width="6"/><polygon points="150,40 180,110 255,115 200,165 215,240 150,200 85,240 100,165 45,115 120,110" fill="none" stroke="%233B82F6" stroke-width="4"/><text x="150" y="270" font-family="Arial, sans-serif" font-weight="700" font-size="18" fill="%233B82F6" text-anchor="middle">OFFICIAL STAMP</text></svg>';
}

// ========================================================================
// MAIN VIEW COMPONENT — WatermarkStudioView
// ========================================================================

export default function WatermarkStudioView({ displayLang: _displayLang }) {
  var [config, setConfig] = useState(DEFAULT_WATERMARK_CONFIG);
  var [fileItems, setFileItems] = useState([]);
  var [selectedId, setSelectedId] = useState(null);
  var [isProcessing, setIsProcessing] = useState(false);
  var [isExportOpen, setIsExportOpen] = useState(false);
  var [isHelpOpen, setIsHelpOpen] = useState(false);
  var [controlTab, setControlTab] = useState('text');
  var canvasRef = useRef(null);
  var [zoom, setZoom] = useState(1);
  var [showGrid, setShowGrid] = useState(false);
  var [bgImage, setBgImage] = useState(null);
  var wmImageInputRef = useRef(null);
  var [isDragOver, setIsDragOver] = useState(false);
  var fileInputRef = useRef(null);

  var stats = useMemo(function () { return { total: fileItems.length, done: fileItems.filter(function (i) { return i.status === 'done'; }).length, error: fileItems.filter(function (i) { return i.status === 'error'; }).length, processing: isProcessing }; }, [fileItems, isProcessing]);
  var activeFile = useMemo(function () { return fileItems.find(function (i) { return i.id === selectedId; }) || fileItems[0] || null; }, [fileItems, selectedId]);

  useEffect(function () {
    var isMounted = true;
    if (activeFile && activeFile.category === 'image') {
      readFileAsDataURL(activeFile.file).then(function (url) {
        var img = new Image(); img.crossOrigin = 'anonymous';
        img.onload = function () { if (isMounted) setBgImage(img); };
        img.src = url;
      });
    } else {
      Promise.resolve().then(function () {
        if (isMounted) setBgImage(null);
      });
    }
    return function () { isMounted = false; };
  }, [activeFile]);

  useEffect(function () {
    var canvas = canvasRef.current; if (!canvas) return;
    var ctx = canvas.getContext('2d'); if (!ctx) return;
    var width = 600, height = 800;
    if (bgImage) {
      var imgAspect = bgImage.naturalWidth / bgImage.naturalHeight;
      if (imgAspect >= 1) { width = 750; height = Math.round(750 / imgAspect); }
      else { height = 800; width = Math.round(800 * imgAspect); }
    }
    canvas.width = width; canvas.height = height;
    if (bgImage) { ctx.drawImage(bgImage, 0, 0, width, height); }
    else {
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(50, 50, 180, 24); ctx.fillRect(50, 85, 120, 12);
      var startY = 140;
      for (var i = 0; i < 14; i++) { ctx.fillRect(50, startY, i % 3 === 0 ? width - 160 : width - 100, 10); startY += 24; }
      ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1;
      ctx.strokeRect(50, startY + 20, width - 100, 120);
      ctx.fillRect(50, height - 60, width - 100, 1);
      ctx.fillStyle = '#94a3b8'; ctx.font = '11px Inter, sans-serif';
      ctx.fillText('Watermark Studio Preview', 50, height - 35);
    }
    if (showGrid) {
      ctx.save(); ctx.strokeStyle = 'rgba(99, 102, 241, 0.15)'; ctx.lineWidth = 1;
      for (var gx = 0; gx < width; gx += 50) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, height); ctx.stroke(); }
      for (var gy = 0; gy < height; gy += 50) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(width, gy); ctx.stroke(); }
      ctx.restore();
    }
    if (config.type === 'text') drawTextWatermark(ctx, width, height, config);
    else if (config.type === 'image') drawImageWatermark(ctx, width, height, config);
  }, [config, bgImage, showGrid]);

  var handleFilesAdded = useCallback(function (newItems) {
    setFileItems(function (prev) { return prev.concat(newItems); });
    if (!selectedId && newItems.length > 0) setSelectedId(newItems[0].id);
  }, [selectedId]);

  var handleLoadSamples = useCallback(async function () {
    var samples = await generateAllSampleFiles();
    setFileItems(function (prev) { return prev.concat(samples); });
    setSelectedId(samples[0].id);
  }, []);

  var handleRemoveFile = useCallback(function (id) {
    setFileItems(function (prev) {
      var remaining = prev.filter(function (i) { return i.id !== id; });
      if (selectedId === id) setSelectedId(remaining.length > 0 ? remaining[0].id : null);
      return remaining;
    });
  }, [selectedId]);

  var handleClearAll = useCallback(function () { setFileItems([]); setSelectedId(null); }, []);
  var handleApplyPreset = useCallback(function (preset) { setConfig(function (prev) { return Object.assign({}, prev, preset.config); }); }, []);
  var handleConfigChange = useCallback(function (updates) { setConfig(function (prev) { return Object.assign({}, prev, updates); }); }, []);

  var handleProcessAll = useCallback(async function () {
    if (fileItems.length === 0 || isProcessing) return;
    setIsProcessing(true);
    var updatedItems = fileItems.slice();
    for (var i = 0; i < updatedItems.length; i++) {
      var item = updatedItems[i];
      item.status = 'processing'; item.progress = 10;
      setFileItems(updatedItems.slice());
      try {
        var result = await processFileItem(item, config, function (prog) { item.progress = prog; setFileItems(updatedItems.slice()); });
        item.status = 'done'; item.progress = 100; item.resultBlob = result.resultBlob; item.resultUrl = result.resultUrl;
      } catch (err) {
        console.error('Error processing ' + item.name + ':', err);
        item.status = 'error'; item.errorMessage = err.message || 'Unknown error';
      }
      setFileItems(updatedItems.slice());
    }
    setIsProcessing(false); setIsExportOpen(true);
  }, [fileItems, isProcessing, config]);

  var handleDownloadZip = useCallback(async function () {
    var doneItems = fileItems.filter(function (i) { return i.status === 'done' && i.resultBlob; });
    if (doneItems.length === 0) return;
    var zip = new JSZip();
    for (var i = 0; i < doneItems.length; i++) zip.file('watermarked_' + doneItems[i].name, doneItems[i].resultBlob);
    var zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, 'watermark_studio_batch.zip');
  }, [fileItems]);

  var processFiles = useCallback(function (files) {
    var newItems = files.map(function (file) {
      var ext = (file.name.split('.').pop() || '').toLowerCase();
      return { id: generateId(), file: file, name: file.name, size: file.size, category: getFileCategory(file.name, file.type), extension: ext, status: 'pending', progress: 0 };
    });
    handleFilesAdded(newItems);
  }, [handleFilesAdded]);

  var handleWmImageChange = useCallback(async function (e) {
    if (e.target.files && e.target.files[0]) {
      var file = e.target.files[0];
      var dataUrl = await readFileAsDataURL(file);
      handleConfigChange({ type: 'image', imageFile: file, imageDataUrl: dataUrl });
    }
  }, [handleConfigChange]);

  var handleTabClick = useCallback(function (tab) {
    setControlTab(tab);
    if (tab === 'text' && config.type !== 'text') handleConfigChange({ type: 'text' });
    else if (tab === 'image' && config.type !== 'image') handleConfigChange({ type: 'image' });
  }, [config.type, handleConfigChange]);

  var renderFileIcon = function (cat) {
    switch (cat) {
      case 'pdf': return React.createElement(FileText, { className: 'w-5 h-5 text-red-400' });
      case 'docx': return React.createElement(FileText, { className: 'w-5 h-5 text-blue-400' });
      case 'xlsx': return React.createElement(FileSpreadsheet, { className: 'w-5 h-5 text-emerald-400' });
      case 'pptx': return React.createElement(Presentation, { className: 'w-5 h-5 text-amber-400' });
      default: return React.createElement(ImageIcon, { className: 'w-5 h-5 text-purple-400' });
    }
  };

  var samplePhrases = ['CONFIDENTIAL', 'BẢN NHÁP / DRAFT', 'BẢN QUYỀN ©', 'LƯU HÀNH NỘI BỘ'];
  var quickAngles = [{ label: 'Nghiêng -45°', value: -45 }, { label: 'Nghiêng 45°', value: 45 }, { label: 'Ngang 0°', value: 0 }, { label: 'Dọc 90°', value: 90 }];
  var anchorPositions = [
    { id: 'top-left', label: 'Trên Trái' }, { id: 'top-center', label: 'Trên Giữa' }, { id: 'top-right', label: 'Trên Phải' },
    { id: 'middle-left', label: 'Giữa Trái' }, { id: 'center', label: 'Chính Giữa' }, { id: 'middle-right', label: 'Giữa Phải' },
    { id: 'bottom-left', label: 'Dưới Trái' }, { id: 'bottom-center', label: 'Dưới Giữa' }, { id: 'bottom-right', label: 'Dưới Phải' },
  ];
  var hasFiles = stats.total > 0;
  var isAllDone = stats.total > 0 && stats.done === stats.total;

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-40 px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-1 ring-indigo-400/30"><Sparkles className="w-5 h-5 text-white" /></div>
            <div>
              <div className="flex items-center gap-2"><h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">Watermark <span className="text-indigo-400">Studio</span></h1><span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">v2.0</span></div>
              <p className="text-xs text-slate-400 items-center gap-1.5 hidden sm:flex"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /><span>100% Client-side</span></p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50"><span className="text-red-400 font-semibold">PDF</span><span>•</span><span className="text-blue-400 font-semibold">DOCX</span><span>•</span><span className="text-emerald-400 font-semibold">XLSX</span><span>•</span><span className="text-amber-400 font-semibold">PPTX</span><span>•</span><span className="text-purple-400 font-semibold">ẢNH</span></div>
            <button onClick={function () { setIsHelpOpen(true); }} className="p-2 rounded-lg bg-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60 transition-colors"><HelpCircle className="w-4 h-4" /></button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 lg:p-6 mx-auto w-full max-w-7xl">
        {/* Presets Bar */}
        <div className="mb-4">
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-3 backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300"><Zap className="w-3.5 h-3.5 text-amber-400" /><span>Mẫu Nhanh (1-Click Presets)</span></div>
            </div>
            <div className="flex flex-wrap gap-2">
              {WATERMARK_PRESETS.map(function (preset) { return (
                <button key={preset.id} onClick={function () { handleApplyPreset(preset); }} className={'group px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ' + (config.text === preset.config.text ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50 shadow-sm shadow-indigo-500/20' : 'bg-slate-800/50 text-slate-300 border-slate-700/50 hover:bg-slate-800 hover:text-white hover:border-slate-600')}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: preset.config.color || '#6366f1' }} /><span>{preset.name}</span>
                  {config.text === preset.config.text && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                </button>
              ); })}
            </div>
          </div>
        </div>

        {/* 2-Column Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5">
          {/* Left Column */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* DropZone */}
            <div onDragOver={function (e) { e.preventDefault(); setIsDragOver(true); }} onDragLeave={function (e) { e.preventDefault(); setIsDragOver(false); }} onDrop={function (e) { e.preventDefault(); setIsDragOver(false); if (e.dataTransfer.files && e.dataTransfer.files.length > 0) processFiles(Array.from(e.dataTransfer.files)); }} onClick={function () { fileInputRef.current && fileInputRef.current.click(); }} className={'relative cursor-pointer rounded-2xl border-2 border-dashed transition-all p-6 sm:p-8 text-center flex flex-col items-center justify-center gap-3 overflow-hidden ' + (isDragOver ? 'border-indigo-500 bg-indigo-500/10 scale-[0.99] shadow-lg shadow-indigo-500/20' : 'border-slate-700/70 bg-slate-900/40 hover:border-indigo-500/60 hover:bg-slate-900/60')}>
              <input ref={fileInputRef} type="file" multiple accept=".pdf,.docx,.xlsx,.pptx,.png,.jpg,.jpeg,.webp,.svg,.bmp,.gif" className="hidden" onChange={function (e) { if (e.target.files && e.target.files.length > 0) processFiles(Array.from(e.target.files)); }} />
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600/20 to-sky-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400"><UploadCloud className="w-8 h-8" /></div>
              <div><h3 className="text-base font-semibold text-slate-100 mb-1">Kéo thả file hoặc <span className="text-indigo-400 underline underline-offset-4">Chọn</span></h3><p className="text-xs text-slate-400">PDF, DOCX, XLSX, PPTX, PNG, JPG, WebP, SVG</p></div>
              <div className="flex flex-wrap justify-center items-center gap-2 pt-1">
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-md bg-red-500/10 text-red-300 border border-red-500/20"><FileText className="w-3 h-3 text-red-400" /> PDF</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20"><FileText className="w-3 h-3 text-blue-400" /> DOCX</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"><FileSpreadsheet className="w-3 h-3 text-emerald-400" /> XLSX</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20"><Presentation className="w-3 h-3 text-amber-400" /> PPTX</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20"><ImageIcon className="w-3 h-3 text-purple-400" /> Ảnh</span>
              </div>
              <div className="pt-2" onClick={function (e) { e.stopPropagation(); }}>
                <button type="button" onClick={handleLoadSamples} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors shadow-sm"><Sparkles className="w-3.5 h-3.5 text-amber-400" /><span>Nạp 5 file mẫu demo</span></button>
              </div>
            </div>

            {/* File Queue */}
            {fileItems.length > 0 && (
              <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-md">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/70"><div className="flex items-center gap-2"><Layers className="w-4 h-4 text-indigo-400" /><h3 className="text-sm font-semibold text-slate-200">Hàng đợi ({fileItems.length})</h3></div><button onClick={handleClearAll} className="text-xs text-slate-400 hover:text-red-400 transition-colors flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /><span>Xóa hết</span></button></div>
                <div className="mt-3 space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {fileItems.map(function (item) {
                    var isSelected = item.id === selectedId;
                    return (
                      <div key={item.id} onClick={function () { setSelectedId(item.id); }} className={'group relative p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ' + (isSelected ? 'bg-indigo-950/40 border-indigo-500/50 shadow-sm' : 'bg-slate-900/40 border-slate-800 hover:border-slate-700')}>
                        <div className="flex items-center gap-3 min-w-0 flex-1"><div className="w-9 h-9 rounded-lg bg-slate-800/70 border border-slate-700/50 flex items-center justify-center shrink-0">{renderFileIcon(item.category)}</div><div className="min-w-0 flex-1"><p className="text-xs font-medium text-slate-200 truncate">{item.name}</p><span className="text-[11px] text-slate-400">{formatFileSize(item.size)}</span></div></div>
                        <div className="flex items-center gap-2 shrink-0">
                          {item.status === 'processing' && <div className="flex items-center gap-1.5 text-xs text-indigo-400"><Loader2 className="w-4 h-4 animate-spin" /><span className="font-mono">{item.progress}%</span></div>}
                          {item.status === 'done' && <div className="flex items-center gap-1 text-xs text-emerald-400 font-medium"><CheckCircle2 className="w-4 h-4" /><span>Xong</span></div>}
                          {item.status === 'error' && <div className="flex items-center gap-1 text-xs text-red-400 font-medium"><AlertCircle className="w-4 h-4" /><span>Lỗi</span></div>}
                          {item.status === 'pending' && <span className="text-xs text-slate-500">Chờ</span>}
                          {item.status === 'done' && item.resultBlob && <button type="button" onClick={function (e) { e.stopPropagation(); downloadBlob(item.resultBlob, 'watermarked_' + item.name); }} className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs transition-colors"><Download className="w-4 h-4" /></button>}
                          <button type="button" onClick={function (e) { e.stopPropagation(); handleRemoveFile(item.id); }} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                        {item.status === 'processing' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-950 rounded-b-xl overflow-hidden"><div className="h-full bg-indigo-500 transition-all duration-200" style={{ width: item.progress + '%' }} /></div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Watermark Controls */}
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-md flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3"><div className="flex items-center gap-2"><Sliders className="w-4 h-4 text-indigo-400" /><h3 className="text-sm font-semibold text-slate-200">Tùy Chỉnh Watermark</h3></div></div>
              <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-slate-950/80 border border-slate-800/80 mb-4">
                {[{ id: 'text', icon: <Type className="w-3.5 h-3.5" />, label: 'Văn bản' }, { id: 'image', icon: <ImageIcon className="w-3.5 h-3.5" />, label: 'Logo' }, { id: 'style', icon: <Palette className="w-3.5 h-3.5" />, label: 'Màu' }, { id: 'layout', icon: <LayoutGrid className="w-3.5 h-3.5" />, label: 'Bố cục' }].map(function (tab) { return (
                  <button key={tab.id} type="button" onClick={function () { handleTabClick(tab.id); }} className={'py-2 px-1 rounded-lg text-xs font-medium flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ' + (controlTab === tab.id ? 'bg-indigo-600 text-white shadow-sm font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60')}>{tab.icon}<span>{tab.label}</span></button>
                ); })}
              </div>
              <div className="flex-1">
                {controlTab === 'text' && (
                  <div className="space-y-4">
                    <div><label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5"><Type className="w-3.5 h-3.5 text-indigo-400" /><span>Nội dung</span></label><input type="text" value={config.text} onChange={function (e) { handleConfigChange({ text: e.target.value }); }} placeholder="Nhập nội dung đóng dấu..." className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700/70 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-medium" /><div className="flex flex-wrap gap-1.5 mt-2">{samplePhrases.map(function (p) { return <button key={p} type="button" onClick={function () { handleConfigChange({ text: p }); }} className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800/60 hover:bg-slate-700/80 text-slate-400 hover:text-slate-200 border border-slate-700/50 transition-colors">+ {p}</button>; })}</div></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div><label className="block text-xs font-semibold text-slate-300 mb-1.5">Font</label><select value={config.fontFamily} onChange={function (e) { handleConfigChange({ fontFamily: e.target.value }); }} className="w-full px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-700/70 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer">{FONT_OPTIONS.map(function (f) { return <option key={f.value} value={f.value} className="bg-slate-900 text-slate-200">{f.name}</option>; })}</select></div>
                      <div><label className="block text-xs font-semibold text-slate-300 mb-1.5">Kiểu chữ</label><div className="flex items-center gap-1.5">{[{ key: 'bold', icon: <Bold className="w-3.5 h-3.5" />, label: 'Đậm' }, { key: 'italic', icon: <Italic className="w-3.5 h-3.5" />, label: 'Nghiêng' }, { key: 'allCaps', icon: <CaseUpper className="w-3.5 h-3.5" />, label: 'In hoa' }].map(function (btn) { return <button key={btn.key} type="button" onClick={function () { var upd = {}; upd[btn.key] = !config[btn.key]; handleConfigChange(upd); }} className={'flex-1 py-2 px-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-1 transition-all ' + (config[btn.key] ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50 shadow-sm' : 'bg-slate-950/60 text-slate-400 border-slate-700/60 hover:text-slate-200')}>{btn.icon}<span>{btn.label}</span></button>; })}</div></div>
                    </div>
                    <div><div className="flex items-center justify-between mb-1.5"><label className="text-xs font-semibold text-slate-300">Cỡ chữ</label><span className="text-xs font-mono text-indigo-400 font-semibold">{config.fontSize} px</span></div><input type="range" min="16" max="120" step="2" value={config.fontSize} onChange={function (e) { handleConfigChange({ fontSize: parseInt(e.target.value, 10) }); }} className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer" /></div>
                  </div>
                )}
                {controlTab === 'image' && (
                  <div className="space-y-4">
                    <div><label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5 text-indigo-400" /><span>Tải Logo / Con Dấu</span></label><input ref={wmImageInputRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="hidden" onChange={handleWmImageChange} />
                      {config.imageDataUrl ? (
                        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-700/70 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3"><div className="w-14 h-14 rounded-lg bg-slate-900 border border-slate-700/60 p-1 flex items-center justify-center overflow-hidden shrink-0"><img src={config.imageDataUrl} alt="Preview" className="max-w-full max-h-full object-contain" /></div><div><p className="text-xs font-medium text-slate-200">{(config.imageFile && config.imageFile.name) || 'Con dấu mẫu'}</p><p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5"><Check className="w-3 h-3" /> Sẵn sàng</p></div></div>
                          <div className="flex items-center gap-1.5"><button type="button" onClick={function () { wmImageInputRef.current && wmImageInputRef.current.click(); }} className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-200 hover:bg-slate-700 transition-colors">Đổi</button><button type="button" onClick={function () { handleConfigChange({ imageFile: null, imageDataUrl: null, type: 'text' }); }} className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button></div>
                        </div>
                      ) : (
                        <div onClick={function () { wmImageInputRef.current && wmImageInputRef.current.click(); }} className="cursor-pointer p-4 rounded-xl border border-dashed border-slate-700/80 bg-slate-950/50 hover:bg-slate-900/60 hover:border-indigo-500/60 transition-all text-center flex flex-col items-center justify-center gap-2"><div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400"><Upload className="w-5 h-5" /></div><p className="text-xs font-medium text-slate-200">Chọn file Logo</p></div>
                      )}
                    </div>
                    <div><label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5"><Wand2 className="w-3.5 h-3.5 text-amber-400" /><span>Con dấu mẫu</span></label><div className="grid grid-cols-3 gap-2">{[{ type: 'confidential', label: 'Tuyệt Mật', color: 'text-red-400', hover: 'hover:border-red-500/40' }, { type: 'approved', label: 'Phê Duyệt', color: 'text-emerald-400', hover: 'hover:border-emerald-500/40' }, { type: 'seal', label: 'Ngôi Sao', color: 'text-blue-400', hover: 'hover:border-blue-500/40' }].map(function (s) { return <button key={s.type} type="button" onClick={function () { handleConfigChange({ type: 'image', imageFile: null, imageDataUrl: createSampleStampSvg(s.type) }); }} className={'p-2 rounded-xl bg-slate-950/60 hover:bg-slate-900 border border-slate-800 ' + s.hover + ' text-center transition-all'}><div className={s.color + ' text-xs font-bold'}>{s.label}</div></button>; })}</div></div>
                    <div><div className="flex items-center justify-between mb-1.5"><label className="text-xs font-semibold text-slate-300">Thu phóng</label><span className="text-xs font-mono text-indigo-400 font-semibold">{Math.round(config.imageScale * 100)}%</span></div><input type="range" min="0.1" max="1.5" step="0.05" value={config.imageScale} onChange={function (e) { handleConfigChange({ imageScale: parseFloat(e.target.value) }); }} className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer" /></div>
                    <label className="flex items-center gap-2.5 cursor-pointer p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors"><input type="checkbox" checked={config.removeWhiteBg} onChange={function (e) { handleConfigChange({ removeWhiteBg: e.target.checked }); }} className="w-4 h-4 rounded accent-indigo-500" /><div><span className="text-xs font-medium text-slate-200 block">Khử nền trắng</span><span className="text-[11px] text-slate-400 block">Cho logo scan nền trắng</span></div></label>
                  </div>
                )}
                {controlTab === 'style' && (
                  <div className="space-y-4">
                    <div><div className="flex items-center justify-between mb-2"><label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5"><Palette className="w-3.5 h-3.5 text-indigo-400" /><span>Màu sắc</span></label><span className="text-xs font-mono text-slate-400 uppercase">{config.color}</span></div><div className="grid grid-cols-5 sm:grid-cols-9 gap-1.5 mb-2.5">{COLOR_PALETTES.map(function (pal) { return <button key={pal.hex} type="button" onClick={function () { handleConfigChange({ color: pal.hex }); }} className={'h-8 rounded-lg border flex items-center justify-center transition-transform hover:scale-105 ' + (config.color.toLowerCase() === pal.hex.toLowerCase() ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900 border-white' : 'border-slate-700/60')} style={{ backgroundColor: pal.hex }} title={pal.name}>{config.color.toLowerCase() === pal.hex.toLowerCase() && <Check className={'w-4 h-4 ' + (pal.hex === '#FFFFFF' ? 'text-slate-900' : 'text-white')} />}</button>; })}</div><div className="flex items-center gap-2"><input type="color" value={config.color} onChange={function (e) { handleConfigChange({ color: e.target.value }); }} className="w-9 h-9 rounded-lg border border-slate-700 bg-slate-900 cursor-pointer p-0.5" /><input type="text" value={config.color} onChange={function (e) { handleConfigChange({ color: e.target.value }); }} className="flex-1 px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-700/70 text-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50" /></div></div>
                    <div><div className="flex items-center justify-between mb-1.5"><label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5"><Eye className="w-3.5 h-3.5 text-indigo-400" /><span>Opacity</span></label><span className="text-xs font-mono text-indigo-400 font-semibold">{Math.round(config.opacity * 100)}%</span></div><input type="range" min="0.05" max="1.0" step="0.01" value={config.opacity} onChange={function (e) { handleConfigChange({ opacity: parseFloat(e.target.value) }); }} className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer" /><div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono"><span>5%</span><span>25-30%</span><span>100%</span></div></div>
                    <div><div className="flex items-center justify-between mb-1.5"><label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5"><RotateCw className="w-3.5 h-3.5 text-indigo-400" /><span>Góc xoay</span></label><span className="text-xs font-mono text-indigo-400 font-semibold">{config.rotation}°</span></div><div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2.5">{quickAngles.map(function (a) { return <button key={a.value} type="button" onClick={function () { handleConfigChange({ rotation: a.value }); }} className={'py-1.5 px-2 rounded-lg border text-xs font-medium transition-all ' + (config.rotation === a.value ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50' : 'bg-slate-950/60 text-slate-400 border-slate-700/60 hover:text-slate-200')}>{a.label}</button>; })}</div><input type="range" min="-180" max="180" step="5" value={config.rotation} onChange={function (e) { handleConfigChange({ rotation: parseInt(e.target.value, 10) }); }} className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer" /></div>
                  </div>
                )}
                {controlTab === 'layout' && (
                  <div className="space-y-4">
                    <div><label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5"><LayoutGrid className="w-3.5 h-3.5 text-indigo-400" /><span>Bố cục</span></label><div className="grid grid-cols-2 gap-2"><button type="button" onClick={function () { handleConfigChange({ layoutMode: 'tiled' }); }} className={'p-3 rounded-xl border text-left transition-all ' + (config.layoutMode === 'tiled' ? 'bg-indigo-600/20 border-indigo-500 text-slate-100 shadow-sm' : 'bg-slate-950/60 border-slate-700/60 text-slate-400 hover:text-slate-200')}><div className="flex items-center gap-2 mb-1"><Grid3X3 className="w-4 h-4 text-indigo-400" /><span className="text-xs font-bold">Phủ Lưới</span></div><p className="text-[11px] text-slate-400">Lặp lại chéo trang</p></button><button type="button" onClick={function () { handleConfigChange({ layoutMode: 'single' }); }} className={'p-3 rounded-xl border text-left transition-all ' + (config.layoutMode === 'single' ? 'bg-indigo-600/20 border-indigo-500 text-slate-100 shadow-sm' : 'bg-slate-950/60 border-slate-700/60 text-slate-400 hover:text-slate-200')}><div className="flex items-center gap-2 mb-1"><Stamp className="w-4 h-4 text-amber-400" /><span className="text-xs font-bold">Dấu Đơn</span></div><p className="text-[11px] text-slate-400">Một dấu chỉ định</p></button></div></div>
                    {config.layoutMode === 'single' && <div><label className="block text-xs font-semibold text-slate-300 mb-1.5">Vị trí</label><div className="grid grid-cols-3 gap-1.5 p-3 rounded-xl bg-slate-950/70 border border-slate-700/70 max-w-[280px] mx-auto">{anchorPositions.map(function (anchor) { return <button key={anchor.id} type="button" onClick={function () { handleConfigChange({ position: anchor.id }); }} className={'h-12 rounded-lg border text-[11px] font-medium flex items-center justify-center transition-all ' + (config.position === anchor.id ? 'bg-indigo-600 text-white border-indigo-400 shadow-md font-bold' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200')}>{anchor.label}</button>; })}</div></div>}
                    {config.layoutMode === 'tiled' && <div className="space-y-3"><div><label className="block text-xs font-semibold text-slate-300 mb-1.5">Mật độ</label><div className="grid grid-cols-3 gap-1.5">{[{ id: 'low', label: 'Thưa', gapX: 240, gapY: 200 }, { id: 'medium', label: 'Chuẩn', gapX: 180, gapY: 140 }, { id: 'high', label: 'Dày', gapX: 120, gapY: 90 }].map(function (d) { return <button key={d.id} type="button" onClick={function () { handleConfigChange({ density: d.id, tileGapX: d.gapX, tileGapY: d.gapY }); }} className={'py-2 rounded-lg border text-xs font-medium transition-all ' + (config.density === d.id ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50' : 'bg-slate-950/60 text-slate-400 border-slate-700/60 hover:text-slate-200')}>{d.label}</button>; })}</div></div><div><div className="flex items-center justify-between mb-1.5"><label className="text-xs font-semibold text-slate-300">Gap X</label><span className="text-xs font-mono text-indigo-400 font-semibold">{config.tileGapX} px</span></div><input type="range" min="80" max="350" step="10" value={config.tileGapX} onChange={function (e) { handleConfigChange({ tileGapX: parseInt(e.target.value, 10) }); }} className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer" /></div><div><div className="flex items-center justify-between mb-1.5"><label className="text-xs font-semibold text-slate-300">Gap Y</label><span className="text-xs font-mono text-indigo-400 font-semibold">{config.tileGapY} px</span></div><input type="range" min="60" max="300" step="10" value={config.tileGapY} onChange={function (e) { handleConfigChange({ tileGapY: parseInt(e.target.value, 10) }); }} className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer" /></div></div>}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Preview */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="sticky top-20 flex-1 flex flex-col">
              <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 flex flex-col h-full backdrop-blur-md">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
                  <div className="flex items-center gap-2"><Eye className="w-4 h-4 text-indigo-400" /><h3 className="text-sm font-semibold text-slate-200">Live Preview</h3>{activeFile && <span className="text-[11px] text-slate-400 bg-slate-800/70 px-2 py-0.5 rounded border border-slate-700/60 max-w-[220px] truncate">{activeFile.name}</span>}</div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={function () { setShowGrid(!showGrid); }} className={'p-1.5 rounded-lg text-xs border transition-colors ' + (showGrid ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/40' : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200')}><Grid className="w-3.5 h-3.5" /></button>
                    <button onClick={function () { setZoom(function (z) { return Math.max(0.4, z - 0.1); }); }} className="p-1.5 rounded-lg bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/60 transition-colors"><ZoomOut className="w-3.5 h-3.5" /></button>
                    <span className="text-[11px] font-mono text-slate-400 px-1">{Math.round(zoom * 100)}%</span>
                    <button onClick={function () { setZoom(function (z) { return Math.min(2.0, z + 0.1); }); }} className="p-1.5 rounded-lg bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/60 transition-colors"><ZoomIn className="w-3.5 h-3.5" /></button>
                    <button onClick={function () { setZoom(1); }} className="p-1.5 rounded-lg bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/60 transition-colors"><Maximize2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="flex-1 bg-slate-950/70 rounded-xl border border-slate-800/60 overflow-auto flex items-center justify-center p-6 min-h-[380px] lg:min-h-[480px]"><div className="transition-transform duration-100 ease-out origin-center shadow-2xl rounded-lg overflow-hidden border border-slate-700/40" style={{ transform: 'scale(' + zoom + ')' }}><canvas ref={canvasRef} className="block max-w-full h-auto" /></div></div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="sticky bottom-4 z-30">
          <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-4 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                {stats.processing ? <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400"><Loader2 className="w-4 h-4 animate-spin" /></div> : isAllDone ? <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400"><CheckCircle2 className="w-4 h-4" /></div> : <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-400"><Sparkles className="w-4 h-4" /></div>}
                <div><div className="text-xs font-semibold text-slate-200">{stats.processing ? 'Đang xử lý (' + stats.done + '/' + stats.total + ')...' : isAllDone ? 'Hoàn tất ' + stats.done + ' file!' : hasFiles ? 'Sẵn sàng ' + stats.total + ' file' : 'Chưa có file'}</div><div className="text-[11px] text-slate-400">{hasFiles ? '100% bảo mật client-side' : 'Kéo thả hoặc nạp mẫu'}</div></div>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {hasFiles && !stats.processing && <button type="button" onClick={handleClearAll} className="px-3 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-medium transition-colors flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" /><span className="hidden md:inline">Đặt lại</span></button>}
              {isAllDone && <button type="button" onClick={handleDownloadZip} className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25"><Download className="w-4 h-4" /><span>ZIP ({stats.done})</span></button>}
              <button type="button" disabled={!hasFiles || stats.processing} onClick={handleProcessAll} className={'flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ' + (!hasFiles || stats.processing ? 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 text-white shadow-lg shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98]')}>{stats.processing ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Đang Xử Lý...</span></> : <><Play className="w-4 h-4 fill-white" /><span>Đóng Dấu{stats.total > 1 ? ' (' + stats.total + ')' : ''}</span></>}</button>
            </div>
          </div>
        </div>
      </main>

      {/* Export Modal */}
      {isExportOpen && (function () {
        var successfulItems = fileItems.filter(function (i) { return i.status === 'done' && i.resultBlob; });
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-slate-100 flex flex-col max-h-[90vh]">
              <button type="button" onClick={function () { setIsExportOpen(false); }} className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"><X className="w-5 h-5" /></button>
              <div className="flex items-center gap-3 mb-4"><div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0"><CheckCircle2 className="w-6 h-6" /></div><div><h3 className="text-base font-bold text-white">Thành Công!</h3><p className="text-xs text-slate-400">{successfulItems.length} file đã xử lý</p></div></div>
              <div className="flex-1 overflow-y-auto space-y-2 my-3 pr-1 max-h-[260px]">{successfulItems.map(function (item) { return <div key={item.id} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3"><div className="flex items-center gap-2.5 min-w-0"><FileCheck className="w-4 h-4 text-emerald-400 shrink-0" /><div className="min-w-0"><p className="text-xs font-medium text-slate-200 truncate">{item.name}</p><p className="text-[11px] text-slate-400">{formatFileSize(item.size)}</p></div></div><button type="button" onClick={function () { downloadBlob(item.resultBlob, 'watermarked_' + item.name); }} className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 transition-colors shrink-0"><Download className="w-3.5 h-3.5" /><span>Tải</span></button></div>; })}</div>
              <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row gap-2 mt-2"><button type="button" onClick={handleDownloadZip} className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"><Package className="w-4 h-4" /><span>Tải ZIP</span></button><button type="button" onClick={function () { setIsExportOpen(false); }} className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors">Đóng</button></div>
            </div>
          </div>
        );
      })()}

      {/* Help Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative text-slate-100 flex flex-col max-h-[90vh]">
            <button type="button" onClick={function () { setIsHelpOpen(false); }} className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"><X className="w-5 h-5" /></button>
            <div className="flex items-center gap-2.5 mb-4"><div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400"><Zap className="w-5 h-5" /></div><div><h3 className="text-base font-bold text-white">Hướng Dẫn</h3><p className="text-xs text-slate-400">Watermark Studio v2.0</p></div></div>
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs text-slate-300">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800"><h4 className="font-semibold text-slate-100 flex items-center gap-1.5 mb-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /><span>100% Client-Side</span></h4><p className="leading-relaxed text-slate-400">File không rời trình duyệt.</p></div>
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800"><h4 className="font-semibold text-slate-100 flex items-center gap-1.5 mb-1.5"><FileCheck2 className="w-4 h-4 text-indigo-400" /><span>Định Dạng</span></h4>
                <ul className="space-y-1.5 text-slate-400">
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-red-400" /><span><strong>PDF</strong> — vector text chuẩn</span></li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-blue-400" /><span><strong>DOCX</strong> — header watermark OpenXML</span></li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /><span><strong>XLSX</strong> — background toàn sheet</span></li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-amber-400" /><span><strong>PPTX</strong> — shape mỗi slide</span></li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-purple-400" /><span><strong>Ảnh</strong> — giữ nguyên chất lượng</span></li>
                </ul>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-800 mt-3 text-right"><button type="button" onClick={function () { setIsHelpOpen(false); }} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors">Đã Hiểu</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
