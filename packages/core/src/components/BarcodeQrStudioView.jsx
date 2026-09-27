import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  IMAGE_INPUT_LIMITS,
  rejectionMessages,
  validateDocumentFiles,
  verifyDocumentSignature,
} from '../utils/documentFiles.js';
import { MiniAppError } from './shared/MiniAppLayout.jsx';
import { ToolBreadcrumb } from './shared/StandardToolLayout.jsx';
import QRCodeStyling from 'qr-code-styling';
import JsBarcode from 'jsbarcode';
import confetti from 'canvas-confetti';
import {
  QrCode,
  Barcode,
  Layers,
  Check,
  ChevronDown,
  Upload,
  X,
  Image as ImageIcon,
  History,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Archive,
  Loader2,
  Save,
  ScanLine,
  Copy,
  FileDown,
  Zap,
  ShieldCheck,
  Shuffle,
} from 'lucide-react';
import { validateAndFixBarcode } from '../utils/codecraft/checksumValidators.js';
import {
  CRYPTO_SCHEMES,
  buildQrPayload,
  emptyQrContent,
  quietZoneMarginPx,
  splitCsvLine,
  toUtf8ByteString,
} from '../utils/codecraft/qrPayload.js';
import { BARCODE_I18N } from '../utils/codecraft/i18n.js';
import { canvasToBlob, writeCanvasToClipboard } from '../utils/screenCapture/clipboardImage.js';
import { downloadBlob, extensionForMime } from '../utils/screenCapture/download.js';

// =====================================================================
// TRANSLATIONS
// =====================================================================
const i18n = BARCODE_I18N;

const BARCODE_SYMBOLOGIES = [
  { id: 'CODE128', name: 'Code 128', example: 'LOGIS-2026-VN', detector: 'code_128' },
  { id: 'GS1_128', name: 'GS1-128', example: '(01)09506000134352(17)261231(10)LOT42', detector: 'code_128' },
  { id: 'EAN13', name: 'EAN-13 (GS1)', example: '893850012345', detector: 'ean_13', randomLength: 12 },
  { id: 'EAN8', name: 'EAN-8', example: '8938501', detector: 'ean_8', randomLength: 7 },
  { id: 'UPC', name: 'UPC-A', example: '01234567890', detector: 'upc_a', randomLength: 11 },
  { id: 'CODE39', name: 'Code 39', example: 'PART-9901-A', detector: 'code_39' },
  { id: 'ITF14', name: 'ITF-14', example: '1893850012345', detector: 'itf', randomLength: 13 },
  { id: 'pharmacode', name: 'Pharmacode', example: '12345', detector: null },
  { id: 'codabar', name: 'Codabar', example: 'A12345678B', detector: 'codabar' },
  { id: 'MSI', name: 'MSI / Plessey', example: '1234567', detector: null },
];

const GTIN_SYMBOLOGIES = new Set(['EAN13', 'EAN8', 'UPC', 'ITF14']);

const PRESET_ICONS = [
  { name: 'WiFi', icon: '📶', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%238b5cf6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>' },
  { name: 'Link', icon: '🔗', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%2306b6d4" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>' },
  { name: 'Phone', icon: '📞', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%2310b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>' },
  { name: 'Email', icon: '✉️', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23f59e0b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>' },
  { name: 'Location', icon: '📍', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>' },
];

const PRESET_COLOR_GRADIENTS = [
  { name: 'Sky Blue', c1: '#0ea5e9', c2: '#38bdf8', type: 'linear' },
  { name: 'Indigo', c1: '#7c3aed', c2: '#06b6d4', type: 'linear' },
  { name: 'Sunset', c1: '#ec4899', c2: '#f59e0b', type: 'linear' },
  { name: 'Green', c1: '#059669', c2: '#10b981', type: 'linear' },
  { name: 'Ocean', c1: '#1d4ed8', c2: '#06b6d4', type: 'linear' },
  { name: 'Mono', c1: '#090D16', c2: '#171f33', type: 'linear' },
];

const QR_PREVIEW_SIZE = 400;
const QR_PNG_TARGET = 2048;
const BARCODE_PNG_TARGET = 2048;

function createQrOptions(config, data, size, margin) {
  const ecLevel = config.logoUrl ? 'H' : config.errorCorrection;
  return {
    width: size,
    height: size,
    type: 'canvas',
    margin,
    // qr-code-styling ghi byte bằng charCode & 0xFF → truyền chuỗi byte UTF-8.
    data: toUtf8ByteString(data),
    qrOptions: { errorCorrectionLevel: ecLevel },
    dotsOptions: {
      type: config.dotType,
      color: config.gradientType === 'none' ? config.dotColor : undefined,
      gradient: config.gradientType !== 'none' ? {
        type: config.gradientType,
        rotation: (config.gradientRotation * Math.PI) / 180,
        colorStops: [
          { offset: 0, color: config.dotColor },
          { offset: 1, color: config.dotColor2 },
        ],
      } : undefined,
    },
    cornersSquareOptions: {
      type: config.cornerSquareType,
      color: config.cornerSquareColor || config.dotColor,
    },
    cornersDotOptions: {
      type: config.cornerDotType,
      color: config.cornerDotColor || config.dotColor,
    },
    backgroundOptions: {
      color: config.bgTransparent ? 'transparent' : config.bgColor,
    },
    imageOptions: {
      hideBackgroundDots: true,
      imageSize: config.logoSize || 0.22,
      margin: config.logoMargin ?? 4,
      crossOrigin: 'anonymous',
    },
    image: config.logoUrl || undefined,
  };
}

/**
 * Tạo QR với đúng số mô-đun lề tĩnh (quiet zone). Cần biết moduleCount trước,
 * nên dựng một lần để đo rồi cập nhật lề.
 * @returns {{ qr: QRCodeStyling, moduleCount: number }}
 */
function createQRStylingInstance(config, data, size = QR_PREVIEW_SIZE, type = 'canvas') {
  const qr = new QRCodeStyling({ ...createQrOptions(config, data, size, 0), type });
  const moduleCount = qr._qr?.getModuleCount?.() || 0;
  const margin = quietZoneMarginPx(size, moduleCount, config.quietZone ?? 4);
  if (margin > 0) qr.update({ margin });
  return { qr, moduleCount };
}

// Helper: Render framed QR code
async function renderQRWithFrameToCanvas(qrInstance, config, baseSize = QR_PREVIEW_SIZE) {
  const qrBlob = await qrInstance.getRawData('png');
  if (!qrBlob) throw new Error('QR render failed');

  const qrImg = new Image();
  const url = URL.createObjectURL(qrBlob);
  try {
    await new Promise((res, rej) => {
      qrImg.onload = res;
      qrImg.onerror = rej;
      qrImg.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');

  if (config.frameStyle === 'none') {
    canvas.width = baseSize;
    canvas.height = baseSize;
    if (!config.bgTransparent) {
      ctx.fillStyle = config.bgColor;
      ctx.fillRect(0, 0, baseSize, baseSize);
    }
    ctx.drawImage(qrImg, 0, 0, baseSize, baseSize);
    return canvas;
  }

  // Khung chữ co giãn theo kích thước xuất để bản 2048px không bị chữ tí hon.
  const k = baseSize / QR_PREVIEW_SIZE;
  const frameHeight = Math.round(65 * k);
  const padding = Math.round(20 * k);
  const totalW = baseSize + padding * 2;
  const totalH = baseSize + padding * 2 + frameHeight;

  canvas.width = totalW;
  canvas.height = totalH;

  ctx.fillStyle = config.bgTransparent ? '#0f172a' : config.bgColor;
  ctx.beginPath();
  ctx.roundRect(0, 0, totalW, totalH, 20 * k);
  ctx.fill();

  ctx.strokeStyle = config.dotColor;
  ctx.lineWidth = 3 * k;
  ctx.stroke();

  const qrTop = config.frameStyle === 'top' ? padding + frameHeight : padding;
  ctx.drawImage(qrImg, padding, qrTop, baseSize, baseSize);

  const bannerY = config.frameStyle === 'top' ? padding : totalH - padding - frameHeight + 8 * k;
  ctx.fillStyle = config.dotColor;
  ctx.beginPath();
  ctx.roundRect(padding, bannerY, baseSize, frameHeight - 8 * k, 14 * k);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(20 * k)}px Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText((config.frameText || 'SCAN ME').toUpperCase(), totalW / 2, bannerY + (frameHeight - 8 * k) / 2);

  return canvas;
}

function barcodeRenderOptions(cfg, validation, scale = 1) {
  return {
    format: validation.format || cfg.symbology,
    ean128: Boolean(validation.ean128),
    width: cfg.barWidth * scale,
    height: cfg.barHeight * scale,
    displayValue: cfg.displayValue,
    // Dòng chữ dưới mã (HRI) phải là chính dữ liệu — tiêu đề sản phẩm hiển thị riêng.
    text: validation.text || undefined,
    textAlign: cfg.textAlign,
    textPosition: cfg.textPosition,
    fontSize: cfg.fontSize * scale,
    textMargin: cfg.textMargin * scale,
    lineColor: cfg.lineColor,
    background: cfg.bgTransparent ? 'transparent' : cfg.bgColor,
    margin: cfg.margin * scale,
    flat: cfg.flat,
  };
}

function clearSvg(svg) {
  if (!svg) return;
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  svg.removeAttribute('width');
  svg.removeAttribute('height');
  svg.removeAttribute('viewBox');
}

/** Phủ nền trắng (JPEG không có alpha) và/hoặc thêm lề trắng (giúp máy quét). */
function flattenOnWhite(canvas, pad = 0) {
  const out = document.createElement('canvas');
  out.width = canvas.width + pad * 2;
  out.height = canvas.height + pad * 2;
  const ctx = out.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(canvas, pad, pad);
  return out;
}

function normalizeScanValue(value) {
  // Bỏ ký hiệu nhận dạng ]C1/]Q3… và ký tự phân cách GS (FNC1) mà máy quét trả về.
  return String(value ?? '')
    .replace(/^\][A-Za-z]\d/, '')
    .replace(/[\x1d\xcf]/g, '') // eslint-disable-line no-control-regex
    .trim();
}

function randomDigits(length) {
  let out = '893';
  while (out.length < length) out += Math.floor(Math.random() * 10);
  return out.slice(0, length);
}

function safeTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

export default function BarcodeQrStudioView({ displayLang = 'vi' }) {
  const langKey = displayLang === 'en' ? 'en' : displayLang === 'ja' ? 'ja' : 'vi';
  const t = i18n[langKey];

  const [mode, setMode] = useState('qr'); // 'qr' | 'barcode' | 'batch'
  const [isLabelPreview, setIsLabelPreview] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  // QR Code Config — không có dữ liệu mẫu ẩn: mọi thứ được mã hoá đều hiển thị trên form.
  const [fileError, setFileError] = useState('');
  const [qrConfig, setQrConfig] = useState(() => ({
    ...emptyQrContent(),
    contentType: 'url',
    rawText: 'https://example.com',
    labelTitle: '',
    errorCorrection: 'M',
    dotType: 'rounded',
    cornerSquareType: 'extra-rounded',
    cornerDotType: 'dot',
    dotColor: '#0ea5e9',
    dotColor2: '#38bdf8',
    gradientType: 'none',
    gradientRotation: 45,
    cornerSquareColor: '#090D16',
    cornerDotColor: '#0ea5e9',
    bgColor: '#ffffff',
    bgTransparent: false,
    logoUrl: null,
    logoSize: 0.22,
    logoMargin: 4,
    quietZone: 4,
    frameText: 'SCAN ME',
    frameStyle: 'none',
  }));

  // Barcode Config
  const [barcodeConfig, setBarcodeConfig] = useState({
    symbology: 'EAN13',
    value: '893850123456',
    labelTitle: '',
    barWidth: 2,
    barHeight: 70,
    displayValue: true,
    textAlign: 'center',
    textPosition: 'bottom',
    fontSize: 16,
    textMargin: 6,
    lineColor: '#090D16',
    bgColor: '#ffffff',
    bgTransparent: false,
    margin: 15,
    flat: false,
  });

  // Batch Config
  const [batchType, setBatchType] = useState('barcode');
  const [batchSymbology, setBatchSymbology] = useState('CODE128');
  const [batchRawInput, setBatchRawInput] = useState('PROD-001,Product A\nPROD-002,Product B\nPROD-003,Product C');
  const [batchItems, setBatchItems] = useState([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [isZipping, setIsZipping] = useState(false);

  // Preview & Export states
  const [isCopied, setIsCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState('svg');
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);
  const [resolutionScale, setResolutionScale] = useState(2);
  const [currentCanvas, setCurrentCanvas] = useState(null);
  // `source` = object cấu hình đã tạo ra bản xem trước hiện tại; lệch nhau = bản xem trước đã cũ.
  const [renderState, setRenderState] = useState({ source: null, error: null, moduleCount: 0 });

  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('codecraft_history');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const qrContainerRef = useRef(null);
  const barcodeSvgRef = useRef(null);
  const logoInputRef = useRef(null);
  const batchFileInputRef = useRef(null);

  const qrPayload = useMemo(
    () => buildQrPayload(qrConfig, { familyNameFirst: langKey !== 'en' }),
    [qrConfig, langKey]
  );
  const barcodeValidation = useMemo(
    () => validateAndFixBarcode(barcodeConfig.symbology, barcodeConfig.value, langKey),
    [barcodeConfig.symbology, barcodeConfig.value, langKey]
  );

  const activeSource = mode === 'qr' ? qrConfig : mode === 'barcode' ? barcodeConfig : null;
  const inputValid = mode === 'qr' ? qrPayload.ok : mode === 'barcode' ? barcodeValidation.isValid : false;
  const canExport =
    inputValid && Boolean(currentCanvas) && renderState.source === activeSource && !renderState.error;
  const inputError =
    mode === 'qr'
      ? (!qrPayload.ok ? t.payloadErrors[qrPayload.errorCode] || t.payloadErrors.TEXT_REQUIRED : null)
      : mode === 'barcode' && !barcodeValidation.isValid
        ? barcodeValidation.error
        : null;
  const previewError = inputError || (renderState.source === activeSource ? renderState.error : null);

  // Save history to localStorage (cắt bớt mục cũ nếu vượt hạn mức ~5MB).
  useEffect(() => {
    let list = history.slice(0, 20);
    while (list.length > 0) {
      try {
        localStorage.setItem('codecraft_history', JSON.stringify(list));
        return;
      } catch {
        list = list.slice(0, -1);
      }
    }
    try {
      localStorage.removeItem('codecraft_history');
    } catch {}
  }, [history]);

  // Render Preview
  useEffect(() => {
    let isCancelled = false;
    async function renderPreview() {
      if (mode === 'qr') {
        if (!qrPayload.ok) {
          if (qrContainerRef.current) qrContainerRef.current.innerHTML = '';
          return;
        }
        try {
          const { qr, moduleCount } = createQRStylingInstance(qrConfig, qrPayload.payload, QR_PREVIEW_SIZE);
          const canvas = await renderQRWithFrameToCanvas(qr, qrConfig, QR_PREVIEW_SIZE);
          if (isCancelled) return;
          setCurrentCanvas(canvas);
          setRenderState({ source: qrConfig, error: null, moduleCount });
          if (qrContainerRef.current) {
            qrContainerRef.current.innerHTML = '';
            canvas.className = 'max-w-full h-auto rounded-lg shadow-sm mx-auto transition-transform';
            qrContainerRef.current.appendChild(canvas);
          }
        } catch (err) {
          if (isCancelled) return;
          console.warn('QR render notice:', err);
          if (qrContainerRef.current) qrContainerRef.current.innerHTML = '';
          const tooLong = /overflow|length/i.test(String(err?.message || err));
          setRenderState({ source: qrConfig, error: tooLong ? t.errQrTooLong : t.errRender, moduleCount: 0 });
        }
      } else if (mode === 'barcode') {
        if (qrContainerRef.current) {
          qrContainerRef.current.innerHTML = '';
        }
        if (!barcodeValidation.isValid) {
          // Không để mã vạch cũ nằm lại (và bị tải về) khi dữ liệu mới không hợp lệ.
          clearSvg(barcodeSvgRef.current);
          return;
        }
        if (!barcodeSvgRef.current) return;
        try {
          const options = barcodeRenderOptions(barcodeConfig, barcodeValidation);
          JsBarcode(barcodeSvgRef.current, barcodeValidation.value, options);
          const canvas = document.createElement('canvas');
          JsBarcode(canvas, barcodeValidation.value, options);
          if (!isCancelled) {
            setCurrentCanvas(canvas);
            setRenderState({ source: barcodeConfig, error: null, moduleCount: 0 });
          }
        } catch (err) {
          console.warn('Barcode render notice:', err);
          clearSvg(barcodeSvgRef.current);
          if (!isCancelled) {
            setRenderState({ source: barcodeConfig, error: t.errRender, moduleCount: 0 });
          }
        }
      }
    }
    renderPreview();
    return () => { isCancelled = true; };
  }, [mode, qrConfig, barcodeConfig, qrPayload, barcodeValidation, t]);

  const showToast = (message, ms = 4000) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), ms);
  };

  const clipboardErrorText = (err) => {
    if (err?.code === 'UNSUPPORTED') return t.errClipUnsupported;
    if (err?.code === 'DENIED') return t.errClipDenied;
    return `${t.errClipFailed}${err?.message ? `: ${err.message}` : ''}`;
  };

  // Copy to Clipboard — gọi đồng bộ trong cú bấm để Safari không chặn.
  const handleCopyClipboard = () => {
    if (!canExport) return;
    writeCanvasToClipboard(currentCanvas)
      .then(() => {
        setIsCopied(true);
        setFileError('');
        showToast(t.copySuccess);
        confetti({ particleCount: 35, spread: 60, origin: { y: 0.85 }, colors: ['#0ea5e9', '#38bdf8', '#4edea3'] });
        setTimeout(() => setIsCopied(false), 3000);
      })
      .catch((err) => setFileError(clipboardErrorText(err)));
  };

  // Download SVG
  const handleDownloadSVG = async () => {
    if (!canExport) return;
    const timestamp = safeTimestamp();
    try {
      if (mode === 'barcode' && barcodeSvgRef.current) {
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(barcodeSvgRef.current);
        downloadBlob(new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' }), `codecraft_barcode_${timestamp}.svg`);
      } else if (mode === 'qr') {
        const { qr } = createQRStylingInstance(qrConfig, qrPayload.payload, 600, 'svg');
        const blob = await qr.getRawData('svg');
        if (!blob) throw new Error('SVG');
        downloadBlob(blob, `codecraft_qr_${timestamp}.svg`);
        if (qrConfig.frameStyle !== 'none') showToast(t.noticeSvgNoFrame, 5000);
      }
    } catch (err) {
      setFileError(`${t.errExport}${err?.message ? `: ${err.message}` : ''}`);
    }
  };

  /**
   * Download Raster. `targetPx` = cạnh (QR) hoặc chiều rộng (mã vạch) mong muốn;
   * không truyền thì dùng hệ số phóng `resolutionScale`.
   */
  const handleDownloadRaster = async (format, targetPx = null) => {
    if (!canExport) return;
    const mime = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
    let canvas = null;
    try {
      if (mode === 'qr') {
        const baseSize = targetPx || QR_PREVIEW_SIZE * resolutionScale;
        const { qr } = createQRStylingInstance(qrConfig, qrPayload.payload, baseSize);
        canvas = await renderQRWithFrameToCanvas(qr, qrConfig, baseSize);
      } else if (mode === 'barcode') {
        const scale = targetPx
          ? Math.max(1, Math.round(targetPx / Math.max(1, currentCanvas.width)))
          : resolutionScale;
        canvas = document.createElement('canvas');
        JsBarcode(canvas, barcodeValidation.value, barcodeRenderOptions(barcodeConfig, barcodeValidation, scale));
      }
      if (!canvas) return;
      const source = mime === 'image/jpeg' ? flattenOnWhite(canvas) : canvas;
      const blob = await canvasToBlob(source, mime, 0.95);
      // Safari trả PNG khi xin WebP: đặt đuôi tệp theo định dạng thật.
      const ext = extensionForMime(blob.type, 'png');
      downloadBlob(blob, `codecraft_${mode}_${source.width}px_${safeTimestamp()}.${ext}`);
      const requested = format === 'jpeg' ? 'jpg' : format;
      if (ext !== requested) showToast(t.noticeFormatFallback.replace('{requested}', requested.toUpperCase()).replace('{actual}', ext.toUpperCase()), 5000);
      if (source !== canvas) {
        source.width = 0;
        source.height = 0;
      }
    } catch (err) {
      setFileError(`${t.errExport}${err?.message ? `: ${err.message}` : ''}`);
    } finally {
      if (canvas) {
        canvas.width = 0;
        canvas.height = 0;
      }
    }
  };

  // Kiểm tra quét THẬT bằng BarcodeDetector (Chrome/Edge/Android, Safari 17+ trên một số nền tảng).
  const handleVerifyScan = async () => {
    if (!canExport) return;
    const Detector = typeof window !== 'undefined' ? window.BarcodeDetector : undefined;
    if (!Detector) {
      setScanResult({ status: 'unsupported', source: activeSource });
      return;
    }
    const detectorFormat = mode === 'qr'
      ? 'qr_code'
      : BARCODE_SYMBOLOGIES.find((s) => s.id === barcodeConfig.symbology)?.detector;
    setIsScanning(true);
    let padded = null;
    try {
      const supported = (await Detector.getSupportedFormats?.()) || [];
      if (!detectorFormat || (supported.length && !supported.includes(detectorFormat))) {
        setScanResult({ status: 'formatUnsupported', source: activeSource });
        return;
      }
      padded = flattenOnWhite(currentCanvas, 24);
      const detector = new Detector({ formats: [detectorFormat] });
      const started = performance.now();
      const results = await detector.detect(padded);
      const elapsed = ((performance.now() - started) / 1000).toFixed(2);
      if (!results.length) {
        setScanResult({ status: 'notFound', time: elapsed, source: activeSource });
        return;
      }
      const decoded = results[0].rawValue;
      const expected = mode === 'qr' ? qrPayload.payload : barcodeValidation.value;
      const match = normalizeScanValue(decoded) === normalizeScanValue(expected);
      setScanResult({ status: match ? 'match' : 'mismatch', content: decoded, time: elapsed, source: activeSource });
      if (match) confetti({ particleCount: 20, spread: 45, origin: { y: 0.6 }, colors: ['#4edea3', '#0ea5e9'] });
    } catch (err) {
      setScanResult({ status: 'error', content: err?.message || String(err), source: activeSource });
    } finally {
      if (padded) {
        padded.width = 0;
        padded.height = 0;
      }
      setIsScanning(false);
    }
  };

  const handleSaveToHistory = () => {
    if (!canExport) return;
    const title = mode === 'qr'
      ? `QR ${qrConfig.contentType.toUpperCase()} (${new Date().toLocaleTimeString()})`
      : `${barcodeConfig.symbology}: ${barcodeValidation.text || barcodeValidation.value}`;
    const newItem = {
      id: Date.now().toString(),
      type: mode,
      timestamp: Date.now(),
      title,
      previewDataUrl: currentCanvas.toDataURL('image/png'),
      // Logo tải lên có thể rất nặng: không lưu vào localStorage.
      qrConfig: mode === 'qr'
        ? { ...qrConfig, logoUrl: qrConfig.logoUrl && qrConfig.logoUrl.length > 100_000 ? null : qrConfig.logoUrl }
        : undefined,
      barcodeConfig: mode === 'barcode' ? barcodeConfig : undefined,
    };
    setHistory((prev) => [newItem, ...prev.filter((h) => h.previewDataUrl !== newItem.previewDataUrl)].slice(0, 20));
    showToast(t.saveSuccess, 3000);
  };

  const handleRestoreHistory = (item) => {
    setMode(item.type);
    if (item.type === 'qr' && item.qrConfig) setQrConfig({ ...emptyQrContent(), quietZone: 4, ...item.qrConfig });
    if (item.type === 'barcode' && item.barcodeConfig) setBarcodeConfig(item.barcodeConfig);
  };

  const handleDeleteHistory = (id) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const handleGenerateRandomBarcode = () => {
    const sym = BARCODE_SYMBOLOGIES.find((s) => s.id === barcodeConfig.symbology);
    if (!sym?.randomLength) return;
    setBarcodeConfig((prev) => ({ ...prev, value: randomDigits(sym.randomLength) }));
  };

  // Batch Processor
  const handleProcessBatch = async () => {
    const lines = batchRawInput.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    setIsBatchProcessing(true);
    setBatchProgress(0);

    const results = [];
    for (let i = 0; i < lines.length; i++) {
      const parts = splitCsvLine(lines[i]);
      const code = parts[0] || '';
      const label = parts[1] || '';
      const item = { id: (i + 1).toString(), code, label, status: 'pending' };

      try {
        if (batchType === 'barcode') {
          const validation = validateAndFixBarcode(batchSymbology, code, langKey);
          if (validation.isValid) {
            const canvas = document.createElement('canvas');
            const baseCfg = { ...barcodeConfig, symbology: batchSymbology, barWidth: 2, barHeight: 60, fontSize: 14, textMargin: 4, lineColor: '#090D16', bgColor: '#ffffff', bgTransparent: false, margin: 15, displayValue: true };
            const options = barcodeRenderOptions(baseCfg, validation);
            // Mã GTIN/GS1 phải in đúng dãy số dưới vạch; mã nội bộ được ghép thêm nhãn.
            if (label && !GTIN_SYMBOLOGIES.has(batchSymbology) && batchSymbology !== 'GS1_128') {
              options.text = `${label} - ${validation.text || validation.value}`;
            }
            JsBarcode(canvas, validation.value, options);
            item.status = 'success';
            item.dataUrl = canvas.toDataURL('image/png');
            canvas.width = 0;
            canvas.height = 0;
          } else {
            item.status = 'error';
            item.errorMessage = validation.error;
          }
        } else {
          // Hàng loạt QR: mỗi dòng là một chuỗi văn bản/URL (Wi-Fi/vCard hàng loạt chưa hỗ trợ).
          const payload = buildQrPayload({ contentType: 'text', rawText: code });
          if (!payload.ok) throw new Error(t.payloadErrors.TEXT_REQUIRED);
          const batchCfg = { ...qrConfig, frameText: label || 'SCAN ME', frameStyle: 'bottom' };
          const { qr } = createQRStylingInstance(batchCfg, payload.payload, 350);
          const canvas = await renderQRWithFrameToCanvas(qr, batchCfg, 350);
          item.status = 'success';
          item.dataUrl = canvas.toDataURL('image/png');
          canvas.width = 0;
          canvas.height = 0;
        }
      } catch (err) {
        item.status = 'error';
        item.errorMessage = /overflow|length/i.test(String(err?.message || err)) ? t.errQrTooLong : err?.message || String(err);
      }
      results.push(item);
      setBatchProgress(Math.round(((i + 1) / lines.length) * 100));
    }
    setBatchItems(results);
    setIsBatchProcessing(false);
    if (results.some((r) => r.status === 'success')) {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 }, colors: ['#0ea5e9', '#10b981', '#4edea3'] });
    }
  };

  const handleDownloadZip = async () => {
    const successItems = batchItems.filter((it) => it.status === 'success' && it.dataUrl);
    if (successItems.length === 0 || isZipping) return;
    setIsZipping(true);
    try {
      // Nạp JSZip khi cần, không đưa vào bundle ban đầu.
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();
      const folderName = `codecraft_batch_${batchType}_${Date.now()}`;
      const folder = zip.folder(folderName);
      const used = new Set();
      successItems.forEach((it, idx) => {
        const base64Data = it.dataUrl.replace(/^data:image\/png;base64,/, '');
        let filename = `${String(idx + 1).padStart(3, '0')}_${it.code.replace(/[^a-z0-9_-]/gi, '_').slice(0, 60)}.png`;
        while (used.has(filename)) filename = filename.replace(/\.png$/, '_1.png');
        used.add(filename);
        folder.file(filename, base64Data, { base64: true });
      });
      const content = await zip.generateAsync({ type: 'blob' });
      downloadBlob(content, `${folderName}.zip`);
    } catch (err) {
      setFileError(`${t.errZip}${err?.message ? `: ${err.message}` : ''}`);
    } finally {
      setIsZipping(false);
    }
  };

  const currentSymbology = BARCODE_SYMBOLOGIES.find((s) => s.id === barcodeConfig.symbology);
  const labelCls = 'block text-xs font-mono font-medium text-on-surface-variant uppercase';
  const inputCls =
    'w-full bg-surface-subtle border border-border-subtle text-on-surface rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-container';
  const updateQr = (section, field, value) =>
    setQrConfig((prev) => ({ ...prev, [section]: { ...prev[section], [field]: value } }));


  return (
    <div className="flex flex-col w-full text-on-surface">
      <MiniAppError>{fileError}</MiniAppError>

      {/* Hidden File Inputs */}
      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        aria-label={t.logoUploadAria}
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;
          const validation = validateDocumentFiles([file], [], IMAGE_INPUT_LIMITS);
          if (validation.accepted.length === 0 || !(await verifyDocumentSignature(file))) {
            setFileError(rejectionMessages(validation.rejected).join(' • ')
              || `${file.name}: ${t.errNotImage}`);
            return;
          }
          setFileError('');
          const r = new FileReader();
          r.onload = () => setQrConfig((prev) => ({ ...prev, logoUrl: r.result }));
          r.readAsDataURL(file);
        }}
      />
      <input
        ref={batchFileInputRef}
        type="file"
        accept=".csv,.txt"
        aria-label={t.batchUploadAria}
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            const r = new FileReader();
            r.onload = () => setBatchRawInput(r.result);
            r.readAsText(e.target.files[0]);
            e.target.value = '';
          }
        }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div role="status" className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-surface-container border border-border-subtle rounded-xl shadow-2xl flex items-center gap-2 text-sm text-secondary animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. BREADCRUMB & TOOL HEADER */}
      <section className="w-full pb-8">
        <ToolBreadcrumb category={t.breadcrumbCategory} toolName={t.heroTitle} />
        <div className="bg-surface-container border border-border-subtle rounded-xl p-6 shadow-xl relative overflow-hidden mt-3">
          {/* Ambient Glow */}
          <div className="absolute -right-20 -top-20 w-96 h-96 bg-primary-container/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-40 -bottom-24 w-80 h-80 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-surface-container-high border border-border-subtle flex items-center justify-center text-primary-container shrink-0 shadow-md">
                <QrCode className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h1 className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight">
                  {t.heroTitle}
                </h1>
                <p className="text-xs sm:text-sm text-on-surface-variant max-w-3xl leading-relaxed">
                  {t.heroTagline}
                </p>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-1.5 text-xs text-outline">
              <ShieldCheck size={15} className="text-secondary shrink-0" />
              <span>{t.privacyNote}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. WORKSPACE CONTAINER */}
      <section className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI: INPUT & CẤU HÌNH (7 Cột) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* BƯỚC 1: CHỌN LOẠI MÃ & NHẬP DỮ LIỆU */}
          <div className="bg-surface-container border border-border-subtle rounded-xl p-6 shadow-md flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary-container text-on-primary-container text-xs flex items-center justify-center font-bold">1</span>
                <h2 className="text-base font-semibold text-on-surface">{t.step1Title}</h2>
              </div>
            </div>

            {/* Segmented Mode Tabs */}
            <div className="grid grid-cols-3 gap-2 bg-surface-container-low p-1 rounded-lg border border-border-subtle">
              <button
                type="button"
                onClick={() => setMode('qr')}
                className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold text-center transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  mode === 'qr'
                    ? 'bg-surface-container-high text-on-surface shadow-sm border border-border-subtle'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <QrCode className="w-4 h-4 text-primary-container" />
                <span className="truncate">{t.tabQR}</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('barcode')}
                className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold text-center transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  mode === 'barcode'
                    ? 'bg-surface-container-high text-on-surface shadow-sm border border-border-subtle'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <Barcode className="w-4 h-4 text-primary-container" />
                <span className="truncate">{t.tabBarcode}</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('batch')}
                className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold text-center transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  mode === 'batch'
                    ? 'bg-surface-container-high text-on-surface shadow-sm border border-border-subtle'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <Layers className="w-4 h-4 text-primary-container" />
                <span className="truncate">{t.tabBatch}</span>
              </button>
            </div>

            {/* Dynamic Form Fields */}
            {mode === 'qr' && (
              <div className="space-y-4">
                {/* Content Type Selector */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {['url', 'wifi', 'vcard', 'text', 'email', 'sms', 'geo', 'crypto'].map((id) => {
                    const isSubSelected = qrConfig.contentType === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setQrConfig((prev) => ({ ...prev, contentType: id }))}
                        aria-pressed={isSubSelected}
                        className={`py-1.5 px-2 rounded text-xs font-medium text-center transition-colors truncate cursor-pointer ${
                          isSubSelected
                            ? 'bg-surface-subtle border border-primary-container/40 text-primary'
                            : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        {t.contentTypes[id]}
                      </button>
                    );
                  })}
                </div>

                {/* Sub-inputs based on content type */}
                {qrConfig.contentType === 'url' && (
                  <div className="space-y-1">
                    <label htmlFor="qr-url" className={labelCls}>{t.fields.url}</label>
                    <div className="relative">
                      <input
                        id="qr-url"
                        type="url"
                        inputMode="url"
                        value={qrConfig.rawText}
                        onChange={(e) => setQrConfig((prev) => ({ ...prev, rawText: e.target.value }))}
                        placeholder="https://..."
                        className={`${inputCls} pr-20`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-outline">
                        {qrConfig.rawText.length} {t.chars}
                      </span>
                    </div>
                  </div>
                )}

                {qrConfig.contentType === 'text' && (
                  <div className="space-y-1">
                    <label htmlFor="qr-text" className={labelCls}>{t.fields.text}</label>
                    <textarea
                      id="qr-text"
                      rows={3}
                      value={qrConfig.rawText}
                      onChange={(e) => setQrConfig((prev) => ({ ...prev, rawText: e.target.value }))}
                      className={`${inputCls} resize-none font-mono`}
                    />
                  </div>
                )}

                {qrConfig.contentType === 'wifi' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2 space-y-1">
                      <label htmlFor="qr-wifi-ssid" className={labelCls}>{t.fields.ssid}</label>
                      <input id="qr-wifi-ssid" type="text" value={qrConfig.wifi.ssid} onChange={(e) => updateQr('wifi', 'ssid', e.target.value)} className={inputCls} />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="qr-wifi-password" className={labelCls}>{t.fields.password}</label>
                      <input id="qr-wifi-password" type="text" autoComplete="off" disabled={qrConfig.wifi.encryption === 'nopass'} value={qrConfig.wifi.password} onChange={(e) => updateQr('wifi', 'password', e.target.value)} className={`${inputCls} font-mono disabled:opacity-40`} />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="qr-wifi-enc" className={labelCls}>{t.fields.encryption}</label>
                      <select id="qr-wifi-enc" value={qrConfig.wifi.encryption} onChange={(e) => updateQr('wifi', 'encryption', e.target.value)} className={inputCls}>
                        <option value="WPA">WPA / WPA2 / WPA3</option>
                        <option value="WEP">WEP</option>
                        <option value="nopass">{t.fields.noPassword}</option>
                      </select>
                    </div>
                    <label className="sm:col-span-2 flex items-center gap-2 text-xs text-on-surface cursor-pointer select-none">
                      <input type="checkbox" checked={qrConfig.wifi.hidden} onChange={(e) => updateQr('wifi', 'hidden', e.target.checked)} className="w-4 h-4 rounded" />
                      <span>{t.fields.hiddenNetwork}</span>
                    </label>
                  </div>
                )}

                {qrConfig.contentType === 'vcard' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      ['lastName', 'text'],
                      ['firstName', 'text'],
                      ['phone', 'tel'],
                      ['email', 'email'],
                      ['organization', 'text'],
                      ['title', 'text'],
                      ['website', 'url'],
                      ['address', 'text'],
                    ].map(([field, type]) => (
                      <div key={field} className="space-y-1">
                        <label htmlFor={`qr-vcard-${field}`} className={labelCls}>{t.vcard[field]}</label>
                        <input id={`qr-vcard-${field}`} type={type} value={qrConfig.vcard[field]} onChange={(e) => updateQr('vcard', field, e.target.value)} className={inputCls} />
                      </div>
                    ))}
                    <div className="sm:col-span-2 space-y-1">
                      <label htmlFor="qr-vcard-note" className={labelCls}>{t.vcard.note}</label>
                      <textarea id="qr-vcard-note" rows={2} value={qrConfig.vcard.note} onChange={(e) => updateQr('vcard', 'note', e.target.value)} className={`${inputCls} resize-none`} />
                    </div>
                  </div>
                )}

                {qrConfig.contentType === 'email' && (
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1">
                      <label htmlFor="qr-email-to" className={labelCls}>{t.fields.emailTo}</label>
                      <input id="qr-email-to" type="email" multiple value={qrConfig.email.to} onChange={(e) => updateQr('email', 'to', e.target.value)} placeholder="name@example.com" className={inputCls} />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="qr-email-subject" className={labelCls}>{t.fields.emailSubject}</label>
                      <input id="qr-email-subject" type="text" value={qrConfig.email.subject} onChange={(e) => updateQr('email', 'subject', e.target.value)} className={inputCls} />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="qr-email-body" className={labelCls}>{t.fields.emailBody}</label>
                      <textarea id="qr-email-body" rows={3} value={qrConfig.email.body} onChange={(e) => updateQr('email', 'body', e.target.value)} className={`${inputCls} resize-none`} />
                    </div>
                  </div>
                )}

                {qrConfig.contentType === 'sms' && (
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1">
                      <label htmlFor="qr-sms-phone" className={labelCls}>{t.fields.smsPhone}</label>
                      <input id="qr-sms-phone" type="tel" value={qrConfig.sms.phone} onChange={(e) => updateQr('sms', 'phone', e.target.value)} placeholder="+84912345678" className={`${inputCls} font-mono`} />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="qr-sms-message" className={labelCls}>{t.fields.smsMessage}</label>
                      <textarea id="qr-sms-message" rows={3} value={qrConfig.sms.message} onChange={(e) => updateQr('sms', 'message', e.target.value)} className={`${inputCls} resize-none`} />
                    </div>
                  </div>
                )}

                {qrConfig.contentType === 'geo' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label htmlFor="qr-geo-lat" className={labelCls}>{t.fields.latitude}</label>
                      <input id="qr-geo-lat" type="text" inputMode="decimal" value={qrConfig.geo.latitude} onChange={(e) => updateQr('geo', 'latitude', e.target.value)} placeholder="21.028511" className={`${inputCls} font-mono`} />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="qr-geo-lng" className={labelCls}>{t.fields.longitude}</label>
                      <input id="qr-geo-lng" type="text" inputMode="decimal" value={qrConfig.geo.longitude} onChange={(e) => updateQr('geo', 'longitude', e.target.value)} placeholder="105.854444" className={`${inputCls} font-mono`} />
                    </div>
                    <p className="sm:col-span-2 text-[11px] text-on-surface-variant">{t.fields.geoHint}</p>
                  </div>
                )}

                {qrConfig.contentType === 'crypto' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label htmlFor="qr-crypto-cur" className={labelCls}>{t.fields.currency}</label>
                      <select id="qr-crypto-cur" value={qrConfig.crypto.currency} onChange={(e) => updateQr('crypto', 'currency', e.target.value)} className={inputCls}>
                        {Object.keys(CRYPTO_SCHEMES).map((cur) => (
                          <option key={cur} value={cur}>{cur} ({CRYPTO_SCHEMES[cur]}:)</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <label htmlFor="qr-crypto-addr" className={labelCls}>{t.fields.walletAddress}</label>
                      <input id="qr-crypto-addr" type="text" autoComplete="off" spellCheck={false} value={qrConfig.crypto.address} onChange={(e) => updateQr('crypto', 'address', e.target.value)} className={`${inputCls} font-mono`} />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="qr-crypto-amount" className={labelCls}>{t.fields.amount}</label>
                      <input id="qr-crypto-amount" type="text" inputMode="decimal" value={qrConfig.crypto.amount} onChange={(e) => updateQr('crypto', 'amount', e.target.value)} placeholder="0.001" className={`${inputCls} font-mono`} />
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <label htmlFor="qr-crypto-label" className={labelCls}>{t.fields.cryptoLabel}</label>
                      <input id="qr-crypto-label" type="text" value={qrConfig.crypto.label} onChange={(e) => updateQr('crypto', 'label', e.target.value)} className={inputCls} />
                    </div>
                    <p className="sm:col-span-3 text-[11px] text-on-surface-variant">{t.fields.cryptoHint}</p>
                  </div>
                )}

                {/* Encoded payload preview: người dùng thấy chính xác dữ liệu sẽ được mã hoá */}
                {qrPayload.ok && qrConfig.contentType !== 'url' && qrConfig.contentType !== 'text' && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-on-surface-variant">{t.showPayload}</summary>
                    <pre className="mt-1 p-2 rounded bg-surface-container-low border border-border-subtle font-mono text-[11px] text-on-surface whitespace-pre-wrap break-all">{qrPayload.payload}</pre>
                  </details>
                )}

                {/* Optional Title Label */}
                <div className="space-y-1">
                  <label htmlFor="qr-label-title" className={labelCls}>{t.fields.labelTitle}</label>
                  <input
                    id="qr-label-title"
                    type="text"
                    value={qrConfig.labelTitle}
                    onChange={(e) => setQrConfig((prev) => ({ ...prev, labelTitle: e.target.value, frameText: e.target.value || 'SCAN ME' }))}
                    placeholder={t.fields.labelPlaceholder}
                    className={inputCls}
                  />
                </div>
              </div>
            )}

            {mode === 'barcode' && (
              <div className="space-y-4">
                {/* Symbology Quick Selector */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={labelCls}>{t.fields.symbology}</span>
                    <span className="text-xs font-mono text-primary bg-primary-container/10 px-2 py-0.5 rounded border border-primary-container/20">
                      {t.symbologies[barcodeConfig.symbology]?.category}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {BARCODE_SYMBOLOGIES.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setBarcodeConfig((prev) => ({ ...prev, symbology: s.id, value: s.example }))}
                        aria-pressed={barcodeConfig.symbology === s.id}
                        className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                          barcodeConfig.symbology === s.id
                            ? 'bg-primary-container/15 border-primary-container text-on-surface shadow-sm'
                            : 'bg-surface-subtle border-border-subtle text-on-surface-variant hover:text-on-surface hover:border-outline'
                        }`}
                      >
                        <div className="text-xs font-bold">{s.name}</div>
                        <div className="text-[10px] text-on-surface-variant truncate">{t.symbologies[s.id]?.category}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Barcode Value Input */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <label htmlFor="barcode-value" className={labelCls}>{t.fields.barcodeValue}</label>
                    {barcodeValidation.isValid && (
                      <span className="text-xs font-mono text-secondary flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {barcodeValidation.autoFixed
                          ? t.checkDigitComputed.replace('{digit}', barcodeValidation.computedCheckDigit)
                          : GTIN_SYMBOLOGIES.has(barcodeConfig.symbology)
                            ? t.checkDigitValid
                            : t.valueValid}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      id="barcode-value"
                      type="text"
                      value={barcodeConfig.value}
                      onChange={(e) => setBarcodeConfig((prev) => ({ ...prev, value: e.target.value }))}
                      aria-invalid={!barcodeValidation.isValid}
                      aria-describedby="barcode-value-help"
                      className={`w-full bg-surface-subtle border text-on-surface font-mono text-sm tracking-widest rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary-container ${
                        currentSymbology?.randomLength ? 'pr-32' : ''
                      } ${barcodeValidation.isValid ? 'border-border-subtle' : 'border-error/60'}`}
                    />
                    {currentSymbology?.randomLength && (
                      <button
                        type="button"
                        onClick={handleGenerateRandomBarcode}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-surface-container border border-border-subtle text-primary text-xs font-medium rounded hover:bg-surface-bright transition-colors flex items-center gap-1.5"
                      >
                        <Shuffle className="w-3.5 h-3.5" />
                        <span>{t.randomSample}</span>
                      </button>
                    )}
                  </div>
                  {!barcodeValidation.isValid && (
                    <div role="alert" className="flex flex-wrap items-center gap-2 text-[11px] text-error">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span className="flex-1 min-w-0">{barcodeValidation.error}</span>
                      {barcodeValidation.suggestedValue && (
                        <button
                          type="button"
                          onClick={() => setBarcodeConfig((prev) => ({ ...prev, value: barcodeValidation.suggestedValue }))}
                          className="px-2 py-0.5 rounded border border-error/40 hover:bg-error/10 font-semibold cursor-pointer"
                        >
                          {t.fixCheckDigit.replace('{value}', barcodeValidation.suggestedValue)}
                        </button>
                      )}
                    </div>
                  )}
                  <p id="barcode-value-help" className="text-[11px] text-on-surface-variant font-mono">
                    {t.symbologies[barcodeConfig.symbology]?.desc}
                  </p>
                </div>

                {/* Optional Label */}
                <div className="space-y-1">
                  <label htmlFor="barcode-label-title" className={labelCls}>{t.fields.barcodeLabel}</label>
                  <input
                    id="barcode-label-title"
                    type="text"
                    value={barcodeConfig.labelTitle}
                    onChange={(e) => setBarcodeConfig((prev) => ({ ...prev, labelTitle: e.target.value }))}
                    placeholder={t.fields.barcodeLabelPlaceholder}
                    className={inputCls}
                  />
                  <p className="text-[11px] text-on-surface-variant">{t.fields.barcodeLabelHint}</p>
                </div>
              </div>
            )}

            {mode === 'qr' && (
              <p className="pt-2 border-t border-border-subtle text-[11px] text-on-surface-variant">{t.utf8Note}</p>
            )}
          </div>

          {/* BƯỚC 2: TÙY BIẾN GIAO DIỆN & MỨC SỬA LỖI */}
          {mode !== 'batch' && (
            <div className="bg-surface-container border border-border-subtle rounded-xl p-6 shadow-md flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary-container text-on-primary-container text-xs flex items-center justify-center font-bold">2</span>
                  <h2 className="text-base font-semibold text-on-surface">{t.step2Title}</h2>
                </div>
              </div>

              {mode === 'qr' ? (
                <>
                  {/* Sửa lỗi QR Level */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-on-surface-variant uppercase">{t.ecTitle}</span>
                      {qrConfig.logoUrl && <span className="text-xs text-primary font-medium">{t.ecForcedByLogo}</span>}
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { lvl: 'L', text: 'L (7%)' },
                        { lvl: 'M', text: 'M (15%)' },
                        { lvl: 'Q', text: 'Q (25%)' },
                        { lvl: 'H', text: 'H (30%)' },
                      ].map((ec) => (
                        <button
                          key={ec.lvl}
                          type="button"
                          onClick={() => setQrConfig((prev) => ({ ...prev, errorCorrection: ec.lvl }))}
                          disabled={Boolean(qrConfig.logoUrl)}
                          className={`py-2 px-2 rounded-lg text-xs font-medium text-center transition-all cursor-pointer disabled:cursor-not-allowed ${
                            (qrConfig.logoUrl ? 'H' : qrConfig.errorCorrection) === ec.lvl
                              ? 'bg-primary-container text-on-primary-container font-bold shadow-sm'
                              : 'bg-surface-container-low border border-border-subtle text-on-surface-variant hover:text-on-surface'
                          }`}
                        >
                          {ec.text}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Kiểu mắt & Kiểu chấm */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <span className="text-xs font-mono text-on-surface-variant uppercase">{t.eyeStyle}</span>
                      <div className="grid grid-cols-3 gap-1 bg-surface-container-low p-1 rounded-lg border border-border-subtle">
                        {[
                          { id: 'square', label: t.eyeSquare },
                          { id: 'extra-rounded', label: t.eyeRounded },
                          { id: 'dot', label: t.eyeDot },
                        ].map((pat) => (
                          <button
                            key={pat.id}
                            type="button"
                            onClick={() => setQrConfig((prev) => ({ ...prev, cornerSquareType: pat.id, cornerDotType: pat.id }))}
                            className={`py-1 text-center text-xs rounded transition-colors ${
                              qrConfig.cornerSquareType === pat.id
                                ? 'bg-surface-container-high text-on-surface font-semibold shadow-sm'
                                : 'text-on-surface-variant hover:text-on-surface'
                            }`}
                          >
                            {pat.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="qr-dot-type" className="text-xs font-mono text-on-surface-variant uppercase">{t.dotStyle}</label>
                      <select
                        id="qr-dot-type"
                        value={qrConfig.dotType}
                        onChange={(e) => setQrConfig((prev) => ({ ...prev, dotType: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-surface-subtle border border-border-subtle text-on-surface text-xs focus:outline-none focus:border-primary-container"
                      >
                        {['rounded', 'dots', 'square', 'classy', 'extra-rounded'].map((d) => (
                          <option key={d} value={d}>{t.dotTypes[d]}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Màu Sắc */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-on-surface-variant uppercase">{t.colorsTitle}</span>
                      <div className="flex items-center gap-1.5 bg-surface-subtle p-0.5 rounded-lg border border-border-subtle">
                        {['none', 'linear'].map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setQrConfig((prev) => ({ ...prev, gradientType: g }))}
                            className={`px-2.5 py-1 text-[11px] font-semibold rounded cursor-pointer transition ${
                              qrConfig.gradientType === g
                                ? 'bg-primary-container text-on-primary-container shadow-xs'
                                : 'text-on-surface-variant hover:text-on-surface'
                            }`}
                          >
                            {g === 'none' ? t.solidColor : t.gradient}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="flex items-center gap-2 bg-surface-subtle border border-border-subtle p-2 rounded-lg cursor-pointer">
                        <input
                          type="color"
                          value={qrConfig.dotColor}
                          onChange={(e) => setQrConfig((prev) => ({ ...prev, dotColor: e.target.value }))}
                          aria-label={t.codeColor}
                          className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                        />
                        <span className="text-xs font-mono text-on-surface">{t.codeColor}</span>
                      </label>
                      {qrConfig.gradientType !== 'none' && (
                        <label className="flex items-center gap-2 bg-surface-subtle border border-border-subtle p-2 rounded-lg cursor-pointer">
                          <input
                            type="color"
                            value={qrConfig.dotColor2}
                            onChange={(e) => setQrConfig((prev) => ({ ...prev, dotColor2: e.target.value }))}
                            aria-label={t.gradientColor}
                            className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                          />
                          <span className="text-xs font-mono text-on-surface">{t.gradientColor}</span>
                        </label>
                      )}
                      <label className="flex items-center gap-2 bg-surface-subtle border border-border-subtle p-2 rounded-lg cursor-pointer">
                        <input
                          type="color"
                          value={qrConfig.bgColor}
                          disabled={qrConfig.bgTransparent}
                          onChange={(e) => setQrConfig((prev) => ({ ...prev, bgColor: e.target.value }))}
                          aria-label={t.bgColor}
                          className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 disabled:opacity-30"
                        />
                        <span className="text-xs font-mono text-on-surface">{t.bgColor}</span>
                      </label>
                    </div>

                    {/* Gradient Presets */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {PRESET_COLOR_GRADIENTS.map((p) => (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() => setQrConfig((prev) => ({ ...prev, dotColor: p.c1, dotColor2: p.c2, gradientType: p.type }))}
                          className="px-2.5 py-1 rounded text-xs font-semibold text-white shadow-sm cursor-pointer"
                          style={{ background: `linear-gradient(135deg, ${p.c1}, ${p.c2})` }}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Chèn Logo */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-on-surface-variant uppercase">{t.logoTitle}</span>
                      {qrConfig.logoUrl && (
                        <button
                          type="button"
                          onClick={() => setQrConfig((prev) => ({ ...prev, logoUrl: null }))}
                          className="text-xs text-error hover:underline flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" /> {t.removeLogo}
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-4 p-3 bg-surface-container-low border border-border-subtle rounded-lg">
                      <div className="w-12 h-12 rounded-lg bg-surface-container border border-border-subtle flex items-center justify-center text-primary-container shrink-0">
                        {qrConfig.logoUrl ? (
                          <img src={qrConfig.logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
                        ) : (
                          <ImageIcon className="w-6 h-6" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-on-surface truncate">
                            {qrConfig.logoUrl ? t.logoLoaded : t.logoNone}
                          </span>
                          {qrConfig.logoUrl && (
                            <span className="text-xs font-mono text-secondary">{t.logoArea.replace('{n}', Math.round((qrConfig.logoSize || 0.22) * 100))}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => logoInputRef.current?.click()}
                            className="text-primary text-xs font-medium hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5" /> {t.uploadLogo}
                          </button>
                          <div className="flex items-center gap-1">
                            {PRESET_ICONS.slice(0, 5).map((icon) => (
                              <button
                                key={icon.name}
                                type="button"
                                onClick={() => setQrConfig((prev) => ({ ...prev, logoUrl: icon.url }))}
                                aria-label={icon.name}
                                title={icon.name}
                                className="px-1.5 py-0.5 rounded bg-surface-subtle text-xs hover:bg-surface-container-high"
                              >
                                {icon.icon}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Slider Quiet Zone (lề tĩnh thật của mã QR, tính theo mô-đun) */}
                  <div className="space-y-1 pt-2">
                    <div className="flex justify-between items-center text-xs">
                      <label htmlFor="qr-quiet-zone" className="font-mono text-on-surface-variant uppercase">{t.quietZone}</label>
                      <span className="font-mono text-primary">
                        {t.quietZoneValue.replace('{n}', qrConfig.quietZone)}
                      </span>
                    </div>
                    <input
                      id="qr-quiet-zone"
                      type="range"
                      min="0"
                      max="8"
                      value={qrConfig.quietZone}
                      onChange={(e) => setQrConfig((prev) => ({ ...prev, quietZone: parseInt(e.target.value, 10) }))}
                      className="w-full accent-primary-container h-1.5 bg-surface-subtle rounded-lg cursor-pointer"
                    />
                    {qrConfig.quietZone < 4 && (
                      <p className="text-[11px] text-tertiary">{t.quietZoneWarn}</p>
                    )}
                  </div>

                  {/* Khoảng cách quanh logo (px) — chỉ có ý nghĩa khi có logo */}
                  {qrConfig.logoUrl && (
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <label htmlFor="qr-logo-margin" className="font-mono text-on-surface-variant uppercase">{t.logoMargin}</label>
                        <span className="font-mono text-primary">{qrConfig.logoMargin}px</span>
                      </div>
                      <input
                        id="qr-logo-margin"
                        type="range"
                        min="0"
                        max="12"
                        value={qrConfig.logoMargin}
                        onChange={(e) => setQrConfig((prev) => ({ ...prev, logoMargin: parseInt(e.target.value, 10) }))}
                        className="w-full accent-primary-container h-1.5 bg-surface-subtle rounded-lg cursor-pointer"
                      />
                    </div>
                  )}
                </>
              ) : (
                /* Barcode Graphic Controls */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-on-surface-variant">
                        <span>{t.barWidth}</span>
                        <span className="font-mono text-primary">{barcodeConfig.barWidth}px</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="4"
                        value={barcodeConfig.barWidth}
                        onChange={(e) => setBarcodeConfig((prev) => ({ ...prev, barWidth: parseInt(e.target.value, 10) }))}
                        aria-label={t.barWidth}
                        className="w-full accent-primary-container"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-on-surface-variant">
                        <span>{t.barHeight}</span>
                        <span className="font-mono text-primary">{barcodeConfig.barHeight}px</span>
                      </div>
                      <input
                        type="range"
                        min="30"
                        max="140"
                        step="5"
                        value={barcodeConfig.barHeight}
                        onChange={(e) => setBarcodeConfig((prev) => ({ ...prev, barHeight: parseInt(e.target.value, 10) }))}
                        aria-label={t.barHeight}
                        className="w-full accent-primary-container"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-2">
                    <label className="flex items-center gap-2 bg-surface-subtle border border-border-subtle p-2 rounded-lg cursor-pointer">
                      <input
                        type="color"
                        value={barcodeConfig.lineColor}
                        onChange={(e) => setBarcodeConfig((prev) => ({ ...prev, lineColor: e.target.value }))}
                        aria-label={t.lineColor}
                        className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                      />
                      <span className="text-xs font-mono text-on-surface">{t.lineColor}</span>
                    </label>
                    <label className="flex items-center gap-2 bg-surface-subtle border border-border-subtle p-2 rounded-lg cursor-pointer">
                      <input
                        type="color"
                        value={barcodeConfig.bgColor}
                        onChange={(e) => setBarcodeConfig((prev) => ({ ...prev, bgColor: e.target.value }))}
                        aria-label={t.bgColor}
                        className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                      />
                      <span className="text-xs font-mono text-on-surface">{t.bgColor}</span>
                    </label>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Batch Mode View */}
          {mode === 'batch' && (
            <div className="bg-surface-container border border-border-subtle rounded-xl p-6 shadow-md space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 bg-surface-container-low p-1 rounded-lg border border-border-subtle">
                  <button
                    type="button"
                    onClick={() => setBatchType('barcode')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${batchType === 'barcode' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant'}`}
                  >
                    {t.batchBarcode}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBatchType('qr')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${batchType === 'qr' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant'}`}
                  >
                    {t.batchQr}
                  </button>
                </div>

                {batchType === 'barcode' && (
                  <select
                    value={batchSymbology}
                    onChange={(e) => setBatchSymbology(e.target.value)}
                    aria-label={t.fields.symbology}
                    className="px-3 py-1.5 rounded-lg bg-surface-subtle border border-border-subtle text-on-surface text-xs font-mono focus:outline-none focus:border-primary-container"
                  >
                    {BARCODE_SYMBOLOGIES.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => batchFileInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-lg bg-surface-subtle hover:bg-surface-container-high text-on-surface text-xs font-semibold border border-border-subtle transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-secondary" />
                    <span>{t.batchUpload}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleProcessBatch}
                    disabled={isBatchProcessing}
                    className="px-5 py-2 rounded-lg bg-primary-container text-on-primary-container text-xs font-bold shadow-md transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {isBatchProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{t.batchProcessing.replace('{n}', batchProgress)}</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>{t.batchStart}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="batch-input" className="text-xs font-mono text-on-surface-variant">{t.batchInputLabel}</label>
                <p className="text-[11px] text-on-surface-variant">{batchType === 'qr' ? t.batchQrNote : t.batchBarcodeNote}</p>
                <textarea
                  id="batch-input"
                  rows={5}
                  value={batchRawInput}
                  onChange={(e) => setBatchRawInput(e.target.value)}
                  className="w-full p-3 rounded-lg bg-surface-subtle border border-border-subtle text-on-surface font-mono text-xs focus:outline-none focus:border-primary-container"
                />
              </div>

              {batchItems.length > 0 && (
                <div className="pt-3 border-t border-border-subtle space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-on-surface">
                      {t.batchDone
                        .replace('{ok}', batchItems.filter((i) => i.status === 'success').length)
                        .replace('{total}', batchItems.length)}
                    </span>
                    <button
                      type="button"
                      onClick={handleDownloadZip}
                      disabled={isZipping || !batchItems.some((i) => i.status === 'success')}
                      className="px-4 py-2 rounded-lg bg-secondary text-surface-canvas text-xs font-extrabold shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isZipping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
                      <span>{t.batchZip}</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-[300px] overflow-y-auto">
                    {batchItems.map((item) => (
                      <div key={item.id} className="p-2 rounded-lg bg-surface-subtle border border-border-subtle text-center space-y-1">
                        {item.status === 'success' && item.dataUrl ? (
                          <div className="w-full bg-white p-1 rounded aspect-square flex items-center justify-center">
                            <img src={item.dataUrl} alt={item.code} className="max-w-full max-h-full object-contain" />
                          </div>
                        ) : (
                          <div className="w-full bg-error/20 p-2 rounded aspect-square flex items-center justify-center text-error text-[10px]">
                            {item.errorMessage}
                          </div>
                        )}
                        <div className="text-[11px] font-mono font-semibold text-on-surface truncate">{item.code}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Saved History Bar */}
          {history.length > 0 && (
            <div className="bg-surface-container border border-border-subtle rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-on-surface">
                  <History className="w-4 h-4 text-primary" />
                  <span>{t.recentTitle} ({history.length})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setHistory([])}
                  className="text-xs text-on-surface-variant hover:text-error transition-colors cursor-pointer"
                >
                  {t.btnClearAll}
                </button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                {history.slice(0, 6).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleRestoreHistory(item)}
                    className="p-1.5 rounded-lg bg-surface-subtle border border-border-subtle hover:border-primary-container cursor-pointer transition-all text-center group relative"
                  >
                    <div className="w-full aspect-square bg-white rounded p-1 flex items-center justify-center mb-1">
                      <img src={item.previewDataUrl} alt={item.title} className="max-w-full max-h-full object-contain" />
                    </div>
                    <div className="text-[10px] text-on-surface-variant truncate font-mono">{item.title}</div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteHistory(item.id);
                      }}
                      aria-label={t.deleteItem}
                      className="absolute top-1 right-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 p-1 bg-surface-canvas/80 text-error rounded transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CỘT PHẢI: LIVE PREVIEW & XUẤT BẢN IN (5 Cột) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-surface-container border border-border-subtle rounded-xl p-6 shadow-md flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-on-surface flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                {t.livePreview}
              </span>
              <div className="flex items-center gap-1 bg-surface-container-low border border-border-subtle p-1 rounded">
                <button
                  type="button"
                  onClick={() => setIsLabelPreview(false)}
                  className={`px-2 py-0.5 text-xs font-semibold rounded cursor-pointer ${
                    !isLabelPreview ? 'bg-surface-container-high text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {t.previewSingle}
                </button>
                <button
                  type="button"
                  onClick={() => setIsLabelPreview(true)}
                  className={`px-2 py-0.5 text-xs font-semibold rounded cursor-pointer ${
                    isLabelPreview ? 'bg-surface-container-high text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {t.previewLabel}
                </button>
              </div>
            </div>

            {/* Dynamic Container QR / Barcode Canvas */}
            <div className={`w-full aspect-square bg-surface-container-lowest border border-border-subtle rounded-xl p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-inner transition-all ${
              isLabelPreview ? 'ring-2 ring-primary/40 ring-offset-2 ring-offset-surface-canvas' : ''
            }`}>
              {/* Actual Canvas or SVG Container */}
              {previewError && mode !== 'batch' && (
                <div role="alert" className="absolute inset-x-4 top-4 z-10 p-3 rounded-lg bg-error-container/90 border border-error/40 text-error text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{previewError}</span>
                </div>
              )}
              <div className={`flex flex-col items-center justify-center gap-3 w-full h-full ${previewError && mode !== 'batch' ? 'opacity-0' : ''}`}>
                {mode === 'qr' || (mode === 'batch' && batchType === 'qr') ? (
                  <div key="preview-qr-container" ref={qrContainerRef} className="w-56 h-56 flex items-center justify-center transition-all" />
                ) : (
                  <div key="preview-barcode-container" className="w-full flex items-center justify-center py-4 transition-all">
                    <svg ref={barcodeSvgRef} className="max-w-full h-auto" />
                  </div>
                )}
                {/* Dynamic Label Footer inside print visual */}
                {((mode === 'qr' ? qrConfig.labelTitle : barcodeConfig.labelTitle)?.trim()) ? (
                  <div className="flex items-center justify-center px-3.5 py-1.5 rounded-md bg-surface-container-high/90 border border-border-subtle max-w-[90%] shadow-sm mt-1">
                    <span className="text-on-surface font-semibold text-xs sm:text-sm tracking-tight text-center truncate">
                      {mode === 'qr' ? qrConfig.labelTitle : barcodeConfig.labelTitle}
                    </span>
                  </div>
                ) : null}
              </div>

              {/* Label Dimension Overlay */}
              {isLabelPreview && (
                <div className="absolute top-3 left-3 bg-[#1E293B] text-white px-2.5 py-1 rounded text-xs font-mono shadow-md border border-slate-700">
                  {t.labelSizeBadge}
                </div>
              )}
            </div>

            {/* Scanner Simulator */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleVerifyScan}
                disabled={!canExport || isScanning}
                className="py-2.5 px-4 bg-surface-subtle hover:bg-surface-container-high border border-border-subtle text-on-surface rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4 text-secondary" />}
                <span>{t.scanButton}</span>
              </button>

              {scanResult && scanResult.source === activeSource && (
                <div
                  role="status"
                  className={`p-3 bg-surface-container-low border rounded-lg flex items-start gap-2 text-xs ${
                    scanResult.status === 'match' ? 'border-secondary/40' : 'border-tertiary/40'
                  }`}
                >
                  {scanResult.status === 'match' ? (
                    <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-tertiary shrink-0" />
                  )}
                  <div className="flex-1 min-w-0 text-on-surface-variant break-all">
                    <span className={scanResult.status === 'match' ? 'text-secondary font-medium' : 'text-tertiary font-medium'}>
                      {t.scanStatus[scanResult.status]}
                      {scanResult.time ? ` (${scanResult.time}s)` : ''}
                    </span>
                    {scanResult.content ? (
                      <>
                        {' • '}
                        <span className="text-on-surface font-mono">{scanResult.content}</span>
                      </>
                    ) : null}
                  </div>
                </div>
              )}
            </div>

            {/* BẢNG THÔNG SỐ KỸ THUẬT MÃ */}
            <div className="p-4 bg-surface-container-low border border-border-subtle rounded-lg space-y-2">
              <div className="flex items-center justify-between text-on-surface font-semibold text-xs pb-1 border-b border-border-subtle">
                <span>{t.specsTitle}</span>
              </div>
              <div className="grid grid-cols-2 gap-y-2 text-xs">
                <div>
                  <span className="text-outline block font-mono text-[11px]">{t.specType}</span>
                  <span className="text-on-surface font-medium font-mono">
                    {mode === 'qr' ? 'QR Code Model 2' : currentSymbology?.name || barcodeConfig.symbology}
                  </span>
                </div>
                <div>
                  <span className="text-outline block font-mono text-[11px]">{mode === 'qr' ? t.specMatrix : t.specImageSize}</span>
                  <span className="text-on-surface font-medium font-mono">
                    {!canExport
                      ? '—'
                      : mode === 'qr'
                        ? renderState.moduleCount
                          ? `${renderState.moduleCount} × ${renderState.moduleCount} ${t.modules}`
                          : '—'
                        : `${currentCanvas.width} × ${currentCanvas.height}px`}
                  </span>
                </div>
                <div>
                  <span className="text-outline block font-mono text-[11px]">{t.specProtection}</span>
                  <span className="text-secondary font-medium font-mono">
                    {mode === 'qr'
                      ? `${qrConfig.logoUrl ? 'H' : qrConfig.errorCorrection} (Reed-Solomon)`
                      : GTIN_SYMBOLOGIES.has(barcodeConfig.symbology)
                        ? 'GS1 Mod-10'
                        : barcodeConfig.symbology === 'CODE128' || barcodeConfig.symbology === 'GS1_128'
                          ? 'Mod-103'
                          : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-outline block font-mono text-[11px]">{t.specQuietZone}</span>
                  <span className="text-on-surface font-medium font-mono">
                    {mode === 'qr' ? t.quietZoneValue.replace('{n}', qrConfig.quietZone) : `${barcodeConfig.margin}px`}
                  </span>
                </div>
              </div>
            </div>

            {/* HỆ THỐNG ACTION BUTTONS TẢI VỀ */}
            <div className="space-y-2">
              {/* Primary SVG Download */}
              <button
                type="button"
                onClick={handleDownloadSVG}
                disabled={!canExport}
                className="w-full py-3 px-4 bg-primary-container hover:opacity-90 text-on-primary-container font-semibold text-sm rounded-lg shadow-md flex items-center justify-center gap-2 transition-opacity cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FileDown className="w-5 h-5" />
                <span>{t.downloadSvg}</span>
              </button>

              {/* 2-Col Format & Resolution */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadRaster('png', mode === 'qr' ? QR_PNG_TARGET : BARCODE_PNG_TARGET)}
                  disabled={!canExport}
                  className="py-2.5 px-3 bg-surface-subtle hover:bg-surface-container-high border border-border-subtle text-on-surface text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ImageIcon className="w-4 h-4 text-primary" />
                  <span>{mode === 'qr' ? t.downloadPng2048Qr : t.downloadPng2048Barcode}</span>
                </button>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowFormatDropdown(!showFormatDropdown)}
                    disabled={!canExport}
                    className="w-full py-2.5 px-3 bg-surface-subtle hover:bg-surface-container-high border border-border-subtle text-on-surface text-xs font-semibold rounded-lg flex items-center justify-between transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span>.{selectedFormat.toUpperCase()} ({resolutionScale}x)</span>
                    <ChevronDown className="w-4 h-4 text-outline" />
                  </button>

                  {showFormatDropdown && (
                    <div className="absolute right-0 bottom-full mb-1 w-48 rounded-xl bg-surface-container border border-border-subtle shadow-2xl p-2 z-30 space-y-2">
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-outline uppercase block px-2">{t.fileFormat}</span>
                        {['png', 'svg', 'jpeg', 'webp'].map((fmt) => (
                          <button
                            key={fmt}
                            type="button"
                            onClick={() => {
                              setSelectedFormat(fmt);
                              setShowFormatDropdown(false);
                              if (fmt !== 'svg') handleDownloadRaster(fmt);
                              else handleDownloadSVG();
                            }}
                            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-mono uppercase transition flex items-center justify-between cursor-pointer ${
                              selectedFormat === fmt ? 'bg-primary-container text-on-primary-container font-bold' : 'text-on-surface-variant hover:bg-surface-subtle'
                            }`}
                          >
                            <span>.{fmt}</span>
                            {selectedFormat === fmt && <Check className="w-3.5 h-3.5" />}
                          </button>
                        ))}
                      </div>
                      {selectedFormat !== 'svg' && (
                        <div className="pt-2 border-t border-border-subtle space-y-1">
                          <span className="text-[10px] font-mono text-outline uppercase block px-2">
                            {t.resolution}{mode === 'qr' ? ` (${QR_PREVIEW_SIZE * resolutionScale}px)` : ''}
                          </span>
                          <div className="grid grid-cols-3 gap-1 px-1">
                            {[1, 2, 4].map((scale) => (
                              <button
                                key={scale}
                                type="button"
                                onClick={() => setResolutionScale(scale)}
                                className={`py-1 text-center text-xs font-mono rounded cursor-pointer ${
                                  resolutionScale === scale ? 'bg-primary text-on-primary font-bold' : 'bg-surface-subtle text-on-surface-variant'
                                }`}
                              >
                                {scale}x
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Copy & Save Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleCopyClipboard}
                  disabled={!canExport}
                  className="py-2.5 px-3 bg-surface-container-low hover:bg-surface-container-high border border-border-subtle text-on-surface-variant hover:text-on-surface text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Copy className="w-4 h-4 text-primary" />
                  <span>{isCopied ? t.btnCopied : t.btnCopy}</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveToHistory}
                  disabled={!canExport}
                  className="py-2.5 px-3 bg-surface-container-low hover:bg-surface-container-high border border-border-subtle text-on-surface-variant hover:text-on-surface text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4 text-secondary" />
                  <span>{t.btnSaveHistory}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
