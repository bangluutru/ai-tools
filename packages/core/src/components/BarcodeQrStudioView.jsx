import React, { useState, useEffect, useRef } from 'react';
import {
  IMAGE_INPUT_LIMITS,
  rejectionMessages,
  validateDocumentFiles,
  verifyDocumentSignature,
} from '../utils/documentFiles.js';
import { MiniAppError } from './shared/MiniAppLayout.jsx';
import {
  ToolBreadcrumb,
  PrivacyShieldPill,
} from './shared/StandardToolLayout.jsx';
import QRCodeStyling from 'qr-code-styling';
import JsBarcode from 'jsbarcode';
import JSZip from 'jszip';
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
  Globe,
  Wifi,
  Contact,
  Mail,
  MessageSquare,
  MapPin,
  Coins,
  FileText,
  FileSpreadsheet,
  Archive,
  Loader2,
  Save,
  ScanLine,
  Copy,
  FileDown,
  Zap,
  Store,
  ShieldCheck,
} from 'lucide-react';
import { validateAndFixBarcode } from '../utils/codecraft/checksumValidators.js';

// =====================================================================
// TRANSLATIONS
// =====================================================================
const i18n = {
  vi: {
    heroTitle: 'Tạo Mã QR & Barcode GS1 Chuẩn Quốc Tế',
    heroTagline: 'Tạo mã QR tĩnh/động, mã vạch EAN-13, Code 128, UPC-A, Data Matrix chuẩn bán lẻ và kho vận logistics. Tùy biến logo nhận diện, màu sắc, kiểm tra checksum GS1 và xuất bản in vector SVG/PDF độ phân giải cao 300 DPI.',
    tabQR: 'Mã QR Đa Năng',
    tabBarcode: 'EAN-13 / Code 128',
    tabBatch: 'Tạo Hàng Loạt (Batch CSV)',
    btnCopy: 'Sao chép ảnh mã vào Clipboard',
    btnCopied: 'Đã Sao Chép!',
    btnDownload: 'Tải Về',
    livePreview: 'Xem Trước Trực Quan',
    recentTitle: 'Lịch Sử Mã Đã Tạo',
    emptyHistory: 'Chưa có mã nào được lưu trong lịch sử',
    btnClearAll: 'Xóa hết',
    btnSaveHistory: 'Lưu vào lịch sử',
    saveSuccess: '✓ Đã lưu vào Lịch sử',
    copySuccess: '🎉 Đã sao chép vào Clipboard! Hãy dán Ctrl+V sang Word, Zalo, Photoshop...',
  },
  en: {
    heroTitle: 'Artistic QR Code & Industrial Barcode Studio',
    heroTagline: 'Generate styled QR with logos, dual gradients, and GS1 industrial 1D barcodes 100% client-side.',
    tabQR: 'Artistic QR Code',
    tabBarcode: 'GS1 Barcode 1D',
    tabBatch: 'Batch Mode (CSV)',
    btnCopy: 'Copy code image to Clipboard',
    btnCopied: 'Copied!',
    btnDownload: 'Download',
    livePreview: 'Live Visual Preview',
    recentTitle: 'Recently Generated Codes',
    emptyHistory: 'No saved history items yet',
    btnClearAll: 'Clear all',
    btnSaveHistory: 'Save to history',
    saveSuccess: '✓ Saved to History',
    copySuccess: '🎉 Copied to Clipboard! Press Ctrl+V to paste anywhere...',
  },
  ja: {
    heroTitle: '高精度QRコード＆産業用バーコード作成スタジオ',
    heroTagline: 'ロゴ埋め込みQRコード、カラーグラデーション、GS1産業用バーコードを100%ローカルで安全に作成。',
    tabQR: '多機能QRコード',
    tabBarcode: '産業用バーコード',
    tabBatch: '一括生成 (Batch CSV)',
    btnCopy: '画像をクリップボードにコピー',
    btnCopied: 'コピー完了！',
    btnDownload: '保存',
    livePreview: 'リアルタイムプレビュー',
    recentTitle: '作成履歴',
    emptyHistory: '保存された履歴はありません',
    btnClearAll: 'すべて削除',
    btnSaveHistory: '履歴に保存',
    saveSuccess: '✓ 履歴に保存しました',
    copySuccess: '🎉 クリップボードにコピーしました！Ctrl+Vで貼り付け可能です。',
  },
};

const BARCODE_SYMBOLOGIES = [
  { id: 'CODE128', name: 'Code 128', category: 'Logistics & Kho Vận', example: 'LOGIS-2026-VN', desc: 'Chuẩn mã vạch mật độ cao phổ biến nhất thế giới trong logistics và vận tải.' },
  { id: 'EAN13', name: 'EAN-13 (GS1)', category: 'Bán Lẻ Quốc Tế', example: '893850012345', desc: 'Chuẩn mã số thương phẩm quốc tế GS1 trên bao bì sản phẩm (13 số, tự tính check digit).' },
  { id: 'EAN8', name: 'EAN-8', category: 'Bán Lẻ Gói Nhỏ', example: '8938501', desc: 'Phiên bản rút gọn 8 chữ số cho bao bì sản phẩm nhỏ gọn.' },
  { id: 'UPC', name: 'UPC-A', category: 'Bán Lẻ Bắc Mỹ', example: '01234567890', desc: 'Chuẩn mã vạch bán lẻ bắt buộc tại thị trường Mỹ và Canada (12 số).' },
  { id: 'CODE39', name: 'Code 39', category: 'Công Nghiệp & Y Tế', example: 'PART-9901-A', desc: 'Chuẩn mã vạch chữ số trong ngành ô tô, quốc phòng và y tế.' },
  { id: 'ITF14', name: 'ITF-14', category: 'Bao Bì Thùng Carton', example: '1893850012345', desc: 'Chuẩn mã vạch thùng carton vận chuyển lớn (Interleaved 2 of 5, 14 số).' },
  { id: 'pharmacode', name: 'Pharmacode', category: 'Dược Phẩm', example: '12345', desc: 'Mã vạch kiểm soát đóng gói trong dây chuyền sản xuất thuốc và dược phẩm.' },
  { id: 'codabar', name: 'Codabar', category: 'Ngân Hàng Máu & Thư Viện', example: 'A12345678B', desc: 'Mã vạch chuyên dùng trong ngân hàng máu, thư viện và vận đơn hàng không.' },
  { id: 'MSI', name: 'MSI / Plessey', category: 'Kệ Hàng Kho', example: '1234567', desc: 'Mã vạch số kiểm kê kệ hàng siêu thị và quản lý vị trí kho bãi.' },
];

const PRESET_ICONS = [
  { name: 'WiFi', icon: '📶', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%238b5cf6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>' },
  { name: 'Link', icon: '🔗', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%2306b6d4" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>' },
  { name: 'Phone', icon: '📞', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%2310b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>' },
  { name: 'Email', icon: '✉️', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23f59e0b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>' },
  { name: 'Location', icon: '📍', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>' },
  { name: 'QR Pay', icon: '💳', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%233b82f6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>' },
  { name: 'Bitcoin', icon: '₿', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23f59e0b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11.767 19.089c4.924.868 6.14-6.025 1.216-6.894m-1.216 6.894L5.86 18.047m5.908 1.042-.347 1.97m1.563-8.864c3.9-.16 4.96-5.882.97-6.57m-.97 6.57L6.108 11.2m5.01-4.992L10.77 4.238m0 0-5.908-.958m5.908.958 1.563 8.864"/></svg>' },
];

const PRESET_COLOR_GRADIENTS = [
  { name: 'Sky Blue', c1: '#0ea5e9', c2: '#38bdf8', type: 'linear' },
  { name: 'Tím Indigo', c1: '#7c3aed', c2: '#06b6d4', type: 'linear' },
  { name: 'Hồng Hoàng Hôn', c1: '#ec4899', c2: '#f59e0b', type: 'linear' },
  { name: 'Xanh Lá Tươi', c1: '#059669', c2: '#10b981', type: 'linear' },
  { name: 'Xanh Đại Dương', c1: '#1d4ed8', c2: '#06b6d4', type: 'linear' },
  { name: 'Đen Tối Giản', c1: '#090D16', c2: '#171f33', type: 'linear' },
];

// Helper: Build QR payload string
function buildQRPayload(config) {
  switch (config.contentType) {
    case 'wifi':
      return `WIFI:T:${config.wifi.encryption};S:${config.wifi.ssid};P:${config.wifi.password};H:${config.wifi.hidden ? 'true' : 'false'};;`;
    case 'vcard':
      return [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `N:${config.vcard.lastName || ''};${config.vcard.firstName || ''};;;`,
        `FN:${[config.vcard.firstName, config.vcard.lastName].filter(Boolean).join(' ') || 'Contact'}`,
        config.vcard.organization ? `ORG:${config.vcard.organization}` : '',
        config.vcard.title ? `TITLE:${config.vcard.title}` : '',
        config.vcard.phone ? `TEL;TYPE=CELL:${config.vcard.phone}` : '',
        config.vcard.email ? `EMAIL:${config.vcard.email}` : '',
        config.vcard.website ? `URL:${config.vcard.website}` : '',
        config.vcard.address ? `ADR:;;${config.vcard.address};;;;` : '',
        config.vcard.note ? `NOTE:${config.vcard.note}` : '',
        'END:VCARD',
      ].filter(Boolean).join('\n');
    case 'email':
      return `mailto:${config.email.to || ''}?subject=${encodeURIComponent(config.email.subject || '')}&body=${encodeURIComponent(config.email.body || '')}`;
    case 'sms':
      return `smsto:${config.sms.phone || ''}:${config.sms.message || ''}`;
    case 'geo':
      return `https://www.google.com/maps?q=${config.geo.latitude || '21.028511'},${config.geo.longitude || '105.854444'}`;
    case 'crypto':
      return `${config.crypto.currency.toLowerCase()}:${config.crypto.address || ''}?amount=${config.crypto.amount || ''}`;
    case 'text':
    case 'url':
    default:
      return config.rawText || 'https://github.com/bangluutru/ai-tools';
  }
}

// Helper: Create styled QR code instance
function createQRStylingInstance(config, size = 400) {
  const data = buildQRPayload(config);
  const ecLevel = config.logoUrl ? 'H' : config.errorCorrection;

  return new QRCodeStyling({
    width: size,
    height: size,
    type: 'canvas',
    data: data || 'AI-Tools Studio',
    qrOptions: {
      errorCorrectionLevel: ecLevel,
    },
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
      margin: config.logoMargin || 4,
      crossOrigin: 'anonymous',
    },
    image: config.logoUrl || undefined,
  });
}

// Helper: Render framed QR code
async function renderQRWithFrameToCanvas(qrInstance, config, baseSize = 400) {
  const qrBlob = await qrInstance.getRawData('png');
  if (!qrBlob) throw new Error('Không thể render QR code.');

  const qrImg = new Image();
  const url = URL.createObjectURL(qrBlob);
  await new Promise((res, rej) => {
    qrImg.onload = res;
    qrImg.onerror = rej;
    qrImg.src = url;
  });

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
    URL.revokeObjectURL(url);
    return canvas;
  }

  const frameHeight = 65;
  const padding = 20;
  const totalW = baseSize + padding * 2;
  const totalH = baseSize + padding * 2 + frameHeight;

  canvas.width = totalW;
  canvas.height = totalH;

  ctx.fillStyle = config.bgTransparent ? '#0f172a' : config.bgColor;
  ctx.beginPath();
  ctx.roundRect(0, 0, totalW, totalH, 20);
  ctx.fill();

  ctx.strokeStyle = config.dotColor;
  ctx.lineWidth = 3;
  ctx.stroke();

  const qrTop = config.frameStyle === 'top' ? padding + frameHeight : padding;
  ctx.drawImage(qrImg, padding, qrTop, baseSize, baseSize);

  const bannerY = config.frameStyle === 'top' ? padding : totalH - padding - frameHeight + 8;
  ctx.fillStyle = config.dotColor;
  ctx.beginPath();
  ctx.roundRect(padding, bannerY, baseSize, frameHeight - 8, 14);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText((config.frameText || 'SCAN ME').toUpperCase(), totalW / 2, bannerY + (frameHeight - 8) / 2);

  URL.revokeObjectURL(url);
  return canvas;
}

export default function BarcodeQrStudioView({ displayLang = 'vi' }) {
  const langKey = displayLang === 'en' ? 'en' : displayLang === 'ja' ? 'ja' : 'vi';
  const t = i18n[langKey];

  const [mode, setMode] = useState('qr'); // 'qr' | 'barcode' | 'batch'
  const [isLabelPreview, setIsLabelPreview] = useState(false);
  const [scannedFeedback, setScannedFeedback] = useState(null);

  // QR Code Config
  const [fileError, setFileError] = useState('');
  const [qrConfig, setQrConfig] = useState({
    contentType: 'url',
    rawText: 'https://example.com/san-pham-2025',
    labelTitle: 'Menu Nhà Hàng & Bảng Giá',
    wifi: { ssid: 'Office_HighSpeed_5G', password: 'SecurePassword2026', encryption: 'WPA', hidden: false },
    vcard: { firstName: 'Hải Bằng', lastName: 'Trần', organization: 'AI-Tools Studio', title: 'Lead Architect', phone: '+84 912 345 678', email: 'bang@ai-tools.dev', website: 'https://github.com/bangluutru/ai-tools', address: 'Hà Nội', note: '' },
    email: { to: 'contact@ai-tools.dev', subject: 'Tư vấn giải pháp AI', body: 'Xin chào...' },
    sms: { phone: '0912345678', message: 'Xác nhận đơn hàng' },
    geo: { latitude: '21.028511', longitude: '105.854444' },
    crypto: { currency: 'BTC', address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', amount: '0.01' },
    errorCorrection: 'H',
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
    logoBackground: true,
    logoShape: 'circle',
    frameText: 'SCAN ME',
    frameStyle: 'none',
  });

  // Barcode Config
  const [barcodeConfig, setBarcodeConfig] = useState({
    symbology: 'EAN13',
    value: '893850123456',
    labelTitle: 'Sản Phẩm Tiêu Dùng Chuẩn GS1',
    barWidth: 2,
    barHeight: 70,
    displayValue: true,
    customText: '',
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
  const [batchRawInput, setBatchRawInput] = useState('PROD-001,Sản phẩm A\nPROD-002,Sản phẩm B\nPROD-003,Sản phẩm C\nPROD-004,Sản phẩm D');
  const [batchItems, setBatchItems] = useState([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);

  // Preview & Export states
  const [isCopied, setIsCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState('svg');
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);
  const [resolutionScale, setResolutionScale] = useState(2);
  const [currentCanvas, setCurrentCanvas] = useState(null);
  const [isTriggeringRender, setIsTriggeringRender] = useState(false);

  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('codecraft_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const qrContainerRef = useRef(null);
  const barcodeSvgRef = useRef(null);
  const logoInputRef = useRef(null);
  const batchFileInputRef = useRef(null);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('codecraft_history', JSON.stringify(history.slice(0, 20)));
    } catch {}
  }, [history]);

  // Render Preview
  useEffect(() => {
    let isCancelled = false;
    async function renderPreview() {
      if (mode === 'qr') {
        const qr = createQRStylingInstance(qrConfig, 400);
        try {
          const canvas = await renderQRWithFrameToCanvas(qr, qrConfig, 400);
          if (!isCancelled) {
            setCurrentCanvas(canvas);
            if (qrContainerRef.current) {
              qrContainerRef.current.innerHTML = '';
              canvas.className = 'max-w-full h-auto rounded-lg shadow-sm mx-auto transition-transform';
              qrContainerRef.current.appendChild(canvas);
            }
          }
        } catch (err) {
          console.warn('QR render notice:', err);
        }
      } else if (mode === 'barcode') {
        const validation = validateAndFixBarcode(barcodeConfig.symbology, barcodeConfig.value);
        if (barcodeSvgRef.current && validation.isValid) {
          try {
            JsBarcode(barcodeSvgRef.current, validation.value, {
              format: barcodeConfig.symbology,
              width: barcodeConfig.barWidth,
              height: barcodeConfig.barHeight,
              displayValue: barcodeConfig.displayValue,
              text: barcodeConfig.customText || undefined,
              textAlign: barcodeConfig.textAlign,
              textPosition: barcodeConfig.textPosition,
              fontSize: barcodeConfig.fontSize,
              textMargin: barcodeConfig.textMargin,
              lineColor: barcodeConfig.lineColor,
              background: barcodeConfig.bgTransparent ? 'transparent' : barcodeConfig.bgColor,
              margin: barcodeConfig.margin,
              flat: barcodeConfig.flat,
            });

            const canvas = document.createElement('canvas');
            JsBarcode(canvas, validation.value, {
              format: barcodeConfig.symbology,
              width: barcodeConfig.barWidth,
              height: barcodeConfig.barHeight,
              displayValue: barcodeConfig.displayValue,
              text: barcodeConfig.customText || undefined,
              textAlign: barcodeConfig.textAlign,
              textPosition: barcodeConfig.textPosition,
              fontSize: barcodeConfig.fontSize,
              textMargin: barcodeConfig.textMargin,
              lineColor: barcodeConfig.lineColor,
              background: barcodeConfig.bgTransparent ? 'transparent' : barcodeConfig.bgColor,
              margin: barcodeConfig.margin,
              flat: barcodeConfig.flat,
            });
            if (!isCancelled) setCurrentCanvas(canvas);
          } catch (err) {
            console.warn('Barcode render notice:', err);
          }
        }
      }
    }
    renderPreview();
    return () => { isCancelled = true; };
  }, [mode, qrConfig, barcodeConfig]);

  // Copy to Clipboard
  const handleCopyClipboard = async () => {
    if (!currentCanvas) return;
    try {
      currentCanvas.toBlob(async (blob) => {
        if (!blob) return;
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        setIsCopied(true);
        setToastMessage(t.copySuccess);
        confetti({ particleCount: 35, spread: 60, origin: { y: 0.85 }, colors: ['#0ea5e9', '#38bdf8', '#4edea3'] });
        setTimeout(() => setIsCopied(false), 3000);
        setTimeout(() => setToastMessage(null), 5000);
      }, 'image/png');
    } catch (err) {
      alert(`Copy error: ${err.message}`);
    }
  };

  // Download SVG
  const handleDownloadSVG = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `codecraft_${mode}_${timestamp}.svg`;
    if (mode === 'barcode' && barcodeSvgRef.current) {
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(barcodeSvgRef.current);
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } else if (mode === 'qr') {
      const qr = createQRStylingInstance(qrConfig, 600);
      qr.download({ name: `codecraft_qr_${timestamp}`, extension: 'svg' });
    }
  };

  // Download Raster
  const handleDownloadRaster = async (format) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `codecraft_${mode}_${timestamp}.${format === 'jpeg' ? 'jpg' : format}`;
    const mime = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';

    if (mode === 'qr') {
      const baseSize = 400 * resolutionScale;
      const qr = createQRStylingInstance(qrConfig, baseSize);
      const canvas = await renderQRWithFrameToCanvas(qr, qrConfig, baseSize);
      const a = document.createElement('a');
      a.href = canvas.toDataURL(mime, 0.95);
      a.download = filename;
      a.click();
    } else if (mode === 'barcode') {
      const canvas = document.createElement('canvas');
      const validation = validateAndFixBarcode(barcodeConfig.symbology, barcodeConfig.value);
      if (validation.isValid) {
        JsBarcode(canvas, validation.value, {
          format: barcodeConfig.symbology,
          width: barcodeConfig.barWidth * resolutionScale,
          height: barcodeConfig.barHeight * resolutionScale,
          displayValue: barcodeConfig.displayValue,
          text: barcodeConfig.customText || undefined,
          textAlign: barcodeConfig.textAlign,
          textPosition: barcodeConfig.textPosition,
          fontSize: barcodeConfig.fontSize * resolutionScale,
          textMargin: barcodeConfig.textMargin,
          lineColor: barcodeConfig.lineColor,
          background: barcodeConfig.bgTransparent ? 'transparent' : barcodeConfig.bgColor,
          margin: barcodeConfig.margin * resolutionScale,
          flat: barcodeConfig.flat,
        });
        const a = document.createElement('a');
        a.href = canvas.toDataURL(mime, 0.95);
        a.download = filename;
        a.click();
      }
    }
  };


  const handleTriggerRender = () => {
    setIsTriggeringRender(true);
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 }, colors: ['#0ea5e9', '#4edea3'] });
    setTimeout(() => setIsTriggeringRender(false), 600);
  };

  const simulateScan = () => {
    const rawData = mode === 'qr' ? buildQRPayload(qrConfig) : barcodeConfig.value;
    setScannedFeedback({
      content: rawData,
      time: '0.05s',
      timestamp: Date.now(),
    });
    confetti({ particleCount: 20, spread: 45, origin: { y: 0.6 }, colors: ['#4edea3', '#0ea5e9'] });
  };

  const handleSaveToHistory = () => {
    if (!currentCanvas) return;
    const title = mode === 'qr'
      ? `QR ${qrConfig.contentType.toUpperCase()} (${new Date().toLocaleTimeString()})`
      : `Barcode ${barcodeConfig.symbology}: ${barcodeConfig.value}`;
    const newItem = {
      id: Date.now().toString(),
      type: mode,
      timestamp: Date.now(),
      title,
      previewDataUrl: currentCanvas.toDataURL('image/png'),
      qrConfig: mode === 'qr' ? qrConfig : undefined,
      barcodeConfig: mode === 'barcode' ? barcodeConfig : undefined,
    };
    setHistory((prev) => [newItem, ...prev.filter((h) => h.previewDataUrl !== newItem.previewDataUrl)].slice(0, 20));
    setToastMessage(t.saveSuccess);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRestoreHistory = (item) => {
    setMode(item.type);
    if (item.type === 'qr' && item.qrConfig) setQrConfig(item.qrConfig);
    if (item.type === 'barcode' && item.barcodeConfig) setBarcodeConfig(item.barcodeConfig);
  };

  const handleDeleteHistory = (id) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const handleGenerateRandomBarcode = () => {
    const rand = '893' + Math.floor(100000000 + Math.random() * 900000000).toString();
    setBarcodeConfig((prev) => ({ ...prev, value: rand }));
  };

  // Batch Processor
  const handleProcessBatch = async () => {
    const lines = batchRawInput.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    setIsBatchProcessing(true);
    setBatchProgress(0);

    const results = [];
    for (let i = 0; i < lines.length; i++) {
      const parts = lines[i].split(/[,;\t]/);
      const code = parts[0]?.trim() || '';
      const label = parts[1]?.trim() || code;
      const item = { id: (i + 1).toString(), code, label, status: 'pending' };

      try {
        if (batchType === 'barcode') {
          const validation = validateAndFixBarcode(batchSymbology, code);
          if (validation.isValid) {
            const canvas = document.createElement('canvas');
            JsBarcode(canvas, validation.value, {
              format: batchSymbology,
              width: 2,
              height: 60,
              displayValue: true,
              text: label !== code ? `${label} - ${validation.value}` : validation.value,
              textAlign: 'center',
              textPosition: 'bottom',
              fontSize: 14,
              textMargin: 4,
              lineColor: '#090D16',
              background: '#ffffff',
              margin: 15,
            });
            item.status = 'success';
            item.dataUrl = canvas.toDataURL('image/png');
          } else {
            item.status = 'error';
            item.errorMessage = validation.error;
          }
        } else {
          const qr = createQRStylingInstance({ ...qrConfig, rawText: code }, 350);
          const canvas = await renderQRWithFrameToCanvas(qr, { ...qrConfig, rawText: code, frameText: label !== code ? label : 'SCAN ME', frameStyle: 'bottom' }, 350);
          item.status = 'success';
          item.dataUrl = canvas.toDataURL('image/png');
        }
      } catch (err) {
        item.status = 'error';
        item.errorMessage = err.message;
      }
      results.push(item);
      setBatchProgress(Math.round(((i + 1) / lines.length) * 100));
    }
    setBatchItems(results);
    setIsBatchProcessing(false);
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 }, colors: ['#0ea5e9', '#10b981', '#4edea3'] });
  };

  const handleDownloadZip = async () => {
    const successItems = batchItems.filter((it) => it.status === 'success' && it.dataUrl);
    if (successItems.length === 0) return;
    const zip = new JSZip();
    const folderName = `codecraft_batch_${batchType}_${Date.now()}`;
    const folder = zip.folder(folderName);
    successItems.forEach((it, idx) => {
      if (it.dataUrl) {
        const base64Data = it.dataUrl.replace(/^data:image\/png;base64,/, '');
        const filename = `${String(idx + 1).padStart(3, '0')}_${it.code.replace(/[^a-z0-9_-]/gi, '_')}.png`;
        folder.file(filename, base64Data, { base64: true });
      }
    });
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${folderName}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentSymbology = BARCODE_SYMBOLOGIES.find((s) => s.id === barcodeConfig.symbology);
  const barcodeValidation = validateAndFixBarcode(barcodeConfig.symbology, barcodeConfig.value);

  return (
    <div className="flex flex-col w-full text-on-surface">
      <MiniAppError>{fileError}</MiniAppError>

      {/* Hidden File Inputs */}
      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;
          const validation = validateDocumentFiles([file], [], IMAGE_INPUT_LIMITS);
          if (validation.accepted.length === 0 || !(await verifyDocumentSignature(file))) {
            setFileError(rejectionMessages(validation.rejected).join(' • ')
              || `${file.name}: nội dung không phải ảnh hợp lệ`);
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
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-surface-container border border-border-subtle rounded-xl shadow-2xl flex items-center gap-2 text-sm text-secondary animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. BREADCRUMB & TOOL HEADER */}
      <section className="w-full pb-8">
        <ToolBreadcrumb
          items={[
            { label: 'Trang chủ', href: '#' },
            { label: 'Tiện ích & Mã vạch', href: '#' },
            { label: 'Tạo Mã QR & Barcode GS1' },
          ]}
        />
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
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl lg:text-3xl font-bold text-on-surface tracking-tight">
                    {t.heroTitle}
                  </h1>
                  <span className="px-2 py-0.5 bg-primary-container/15 text-brand-cyan-bright text-xs font-semibold rounded uppercase">
                    GS1 Chuẩn Hoá
                  </span>
                  <span className="px-2 py-0.5 bg-secondary/15 text-secondary text-xs font-semibold rounded uppercase flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-ping" />
                    OFFLINE CANVAS
                  </span>
                </div>
                <p className="text-sm text-on-surface-variant max-w-3xl leading-relaxed">
                  {t.heroTagline}
                </p>
              </div>
            </div>
            <div className="shrink-0">
              <PrivacyShieldPill
                label="BẢO MẬT CLIENT-SIDE 100%"
                description="Xử lý cục bộ bằng WebAssembly & HTML5 Canvas/SVG, không gửi dữ liệu ra máy chủ."
              />
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
                <h2 className="text-base font-semibold text-on-surface">Loại Mã &amp; Dữ Liệu Nguồn</h2>
              </div>
              <span className="text-xs font-mono font-semibold text-primary">TIÊU CHUẨN ISO/IEC</span>
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
                <span className="truncate">Mã QR Đa Năng</span>
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
                <span className="truncate">EAN-13 / Code 128</span>
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
                <span className="truncate">Tạo Hàng Loạt</span>
              </button>
            </div>

            {/* Dynamic Form Fields */}
            {mode === 'qr' && (
              <div className="space-y-4">
                {/* Content Type Selector */}
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'url', label: 'URL Website', icon: Globe },
                    { id: 'wifi', label: 'Mạng Wi-Fi', icon: Wifi },
                    { id: 'vcard', label: 'Danh Thiếp vCard', icon: Contact },
                    { id: 'text', label: 'Văn Bản Tự Do', icon: FileText },
                    { id: 'email', label: 'Email', icon: Mail },
                    { id: 'sms', label: 'SMS', icon: MessageSquare },
                    { id: 'geo', label: 'Tọa Độ GPS', icon: MapPin },
                    { id: 'crypto', label: 'Crypto (BTC)', icon: Coins },
                  ].map((sub) => {
                    const isSubSelected = qrConfig.contentType === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setQrConfig((prev) => ({ ...prev, contentType: sub.id }))}
                        className={`py-1.5 px-2 rounded text-xs font-medium text-center transition-colors truncate cursor-pointer ${
                          isSubSelected
                            ? 'bg-surface-subtle border border-primary-container/40 text-primary'
                            : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        {sub.label}
                      </button>
                    );
                  })}
                </div>

                {/* Sub-inputs based on content type */}
                {qrConfig.contentType === 'url' && (
                  <div className="space-y-1">
                    <label className="block text-xs font-mono font-medium text-on-surface-variant uppercase">
                      ĐƯỜNG DẪN HOẶC NỘI DUNG MÃ HÓA
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={qrConfig.rawText}
                        onChange={(e) => setQrConfig((prev) => ({ ...prev, rawText: e.target.value }))}
                        placeholder="https://..."
                        className="w-full bg-surface-subtle border border-border-subtle text-on-surface rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary-container focus:bg-surface-container-high transition-colors"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-outline">
                        {qrConfig.rawText.length} ký tự
                      </span>
                    </div>
                  </div>
                )}

                {qrConfig.contentType === 'wifi' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="block text-xs font-mono text-on-surface-variant uppercase">Tên WiFi (SSID):</label>
                      <input
                        type="text"
                        value={qrConfig.wifi.ssid}
                        onChange={(e) => setQrConfig((prev) => ({ ...prev, wifi: { ...prev.wifi, ssid: e.target.value } }))}
                        className="w-full bg-surface-subtle border border-border-subtle text-on-surface rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary-container"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-mono text-on-surface-variant uppercase">Mật khẩu:</label>
                      <input
                        type="text"
                        value={qrConfig.wifi.password}
                        onChange={(e) => setQrConfig((prev) => ({ ...prev, wifi: { ...prev.wifi, password: e.target.value } }))}
                        className="w-full bg-surface-subtle border border-border-subtle text-on-surface rounded-lg px-4 py-2 text-sm font-mono focus:outline-none focus:border-primary-container"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-mono text-on-surface-variant uppercase">Mã hóa:</label>
                      <select
                        value={qrConfig.wifi.encryption}
                        onChange={(e) => setQrConfig((prev) => ({ ...prev, wifi: { ...prev.wifi, encryption: e.target.value } }))}
                        className="w-full bg-surface-subtle border border-border-subtle text-on-surface rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-container"
                      >
                        <option value="WPA">WPA / WPA2 / WPA3</option>
                        <option value="WEP">WEP</option>
                        <option value="nopass">Không có mật khẩu</option>
                      </select>
                    </div>
                  </div>
                )}

                {qrConfig.contentType === 'vcard' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-mono text-on-surface-variant uppercase">Họ &amp; Tên:</label>
                      <input
                        type="text"
                        value={qrConfig.vcard.firstName}
                        onChange={(e) => setQrConfig((prev) => ({ ...prev, vcard: { ...prev.vcard, firstName: e.target.value } }))}
                        className="w-full bg-surface-subtle border border-border-subtle text-on-surface rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-container"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-mono text-on-surface-variant uppercase">Số điện thoại:</label>
                      <input
                        type="tel"
                        value={qrConfig.vcard.phone}
                        onChange={(e) => setQrConfig((prev) => ({ ...prev, vcard: { ...prev.vcard, phone: e.target.value } }))}
                        className="w-full bg-surface-subtle border border-border-subtle text-on-surface rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary-container"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-mono text-on-surface-variant uppercase">Email:</label>
                      <input
                        type="email"
                        value={qrConfig.vcard.email}
                        onChange={(e) => setQrConfig((prev) => ({ ...prev, vcard: { ...prev.vcard, email: e.target.value } }))}
                        className="w-full bg-surface-subtle border border-border-subtle text-on-surface rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary-container"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-mono text-on-surface-variant uppercase">Tổ chức / Công ty:</label>
                      <input
                        type="text"
                        value={qrConfig.vcard.organization}
                        onChange={(e) => setQrConfig((prev) => ({ ...prev, vcard: { ...prev.vcard, organization: e.target.value } }))}
                        className="w-full bg-surface-subtle border border-border-subtle text-on-surface rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-container"
                      />
                    </div>
                  </div>
                )}

                {qrConfig.contentType === 'text' && (
                  <div className="space-y-1">
                    <label className="block text-xs font-mono text-on-surface-variant uppercase">Nội dung văn bản:</label>
                    <textarea
                      rows={3}
                      value={qrConfig.rawText}
                      onChange={(e) => setQrConfig((prev) => ({ ...prev, rawText: e.target.value }))}
                      className="w-full p-3 rounded-lg bg-surface-subtle border border-border-subtle text-on-surface text-sm font-mono resize-none focus:outline-none focus:border-primary-container"
                    />
                  </div>
                )}

                {/* Optional Title Label */}
                <div className="space-y-1">
                  <label className="block text-xs font-mono font-medium text-on-surface-variant uppercase">
                    TIÊU ĐỀ NHÃN SẢN PHẨM / CHÚ THÍCH IN ẤN
                  </label>
                  <input
                    type="text"
                    value={qrConfig.labelTitle}
                    onChange={(e) => setQrConfig((prev) => ({ ...prev, labelTitle: e.target.value, frameText: e.target.value }))}
                    placeholder="VD: Menu Nhà Hàng & Bảng Giá..."
                    className="w-full bg-surface-subtle border border-border-subtle text-on-surface rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary-container focus:bg-surface-container-high transition-colors"
                  />
                </div>
              </div>
            )}

            {mode === 'barcode' && (
              <div className="space-y-4">
                {/* Symbology Quick Selector */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-on-surface-variant uppercase">CHUẨN MÃ VẠCH (GS1 SYMBOLOGY)</span>
                    <span className="text-xs font-mono text-primary bg-primary-container/10 px-2 py-0.5 rounded border border-primary-container/20">
                      {currentSymbology?.category}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {BARCODE_SYMBOLOGIES.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setBarcodeConfig((prev) => ({ ...prev, symbology: s.id, value: s.example }))}
                        className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                          barcodeConfig.symbology === s.id
                            ? 'bg-primary-container/15 border-primary-container text-on-surface shadow-sm'
                            : 'bg-surface-subtle border-border-subtle text-on-surface-variant hover:text-on-surface hover:border-outline'
                        }`}
                      >
                        <div className="text-xs font-bold">{s.name}</div>
                        <div className="text-[10px] text-on-surface-variant truncate">{s.category}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Barcode Value Input */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-medium text-on-surface-variant uppercase">
                      DÃY SỐ MÃ VẠCH
                    </label>
                    {barcodeValidation.isValid && (
                      <span className="text-xs font-mono text-secondary flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Checksum GS1 tự tính hợp lệ
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={barcodeConfig.value}
                      onChange={(e) => setBarcodeConfig((prev) => ({ ...prev, value: e.target.value }))}
                      className="w-full bg-surface-subtle border border-border-subtle text-on-surface font-mono text-sm tracking-widest rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary-container"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateRandomBarcode}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-surface-container border border-border-subtle text-primary text-xs font-medium rounded hover:bg-surface-bright transition-colors"
                    >
                      Tạo Ngẫu Nhiên
                    </button>
                  </div>
                  <p className="text-xs text-outline">
                    {currentSymbology?.desc || "Đầu số '893' là mã quốc gia GS1 dành riêng cho Việt Nam."}
                  </p>
                </div>

                {/* Optional Label */}
                <div className="space-y-1">
                  <label className="block text-xs font-mono font-medium text-on-surface-variant uppercase">
                    TIÊU ĐỀ SẢN PHẨM / CHÚ THÍCH DƯỚI MÃ
                  </label>
                  <input
                    type="text"
                    value={barcodeConfig.labelTitle}
                    onChange={(e) => setBarcodeConfig((prev) => ({ ...prev, labelTitle: e.target.value, customText: e.target.value }))}
                    placeholder="VD: Bánh Tráng Tây Ninh 500g..."
                    className="w-full bg-surface-subtle border border-border-subtle text-on-surface rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary-container"
                  />
                </div>
              </div>
            )}

            {/* Toggles & Options */}
            <div className="pt-2 border-t border-border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-on-surface">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded bg-surface-subtle text-primary-container focus:ring-0"
                />
                <span>Mã hóa UTF-8 chuẩn (Tiếng Việt có dấu)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-on-surface-variant">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded bg-surface-subtle text-primary-container focus:ring-0"
                />
                <span>Kích hoạt GS1 Application Identifier (AI)</span>
              </label>
            </div>
          </div>

          {/* BƯỚC 2: TÙY BIẾN GIAO DIỆN & MỨC SỬA LỖI */}
          {mode !== 'batch' && (
            <div className="bg-surface-container border border-border-subtle rounded-xl p-6 shadow-md flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary-container text-on-primary-container text-xs flex items-center justify-center font-bold">2</span>
                  <h2 className="text-base font-semibold text-on-surface">Cấu Hình Đồ Họa &amp; Sửa Lỗi</h2>
                </div>
                <span className="text-xs font-mono font-semibold text-secondary">300 DPI HI-RES READY</span>
              </div>

              {mode === 'qr' ? (
                <>
                  {/* Sửa lỗi QR Level */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-mono text-on-surface-variant uppercase">
                        MỨC SỬA LỖI (REED-SOLOMON ERROR CORRECTION)
                      </label>
                      <span className="text-xs text-primary font-medium">Tối ưu cho In ấn &amp; Logo</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { lvl: 'L', text: 'L (7%)' },
                        { lvl: 'M', text: 'M (15%)' },
                        { lvl: 'Q', text: 'Q (25%)' },
                        { lvl: 'H', text: 'H (30% - Chèn Logo)' },
                      ].map((ec) => (
                        <button
                          key={ec.lvl}
                          type="button"
                          onClick={() => setQrConfig((prev) => ({ ...prev, errorCorrection: ec.lvl }))}
                          className={`py-2 px-2 rounded-lg text-xs font-medium text-center transition-all cursor-pointer ${
                            qrConfig.errorCorrection === ec.lvl
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
                      <label className="text-xs font-mono text-on-surface-variant uppercase">KIỂU MẮT QR (EYE CORNERS)</label>
                      <div className="grid grid-cols-3 gap-1 bg-surface-container-low p-1 rounded-lg border border-border-subtle">
                        {[
                          { id: 'square', label: 'Vuông' },
                          { id: 'extra-rounded', label: 'Bo tròn' },
                          { id: 'dot', label: 'Dots' },
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
                      <label className="text-xs font-mono text-on-surface-variant uppercase">KIỂU HẠT (DOT PATTERN)</label>
                      <select
                        value={qrConfig.dotType}
                        onChange={(e) => setQrConfig((prev) => ({ ...prev, dotType: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-surface-subtle border border-border-subtle text-on-surface text-xs focus:outline-none focus:border-primary-container"
                      >
                        <option value="rounded">Bo Góc (Rounded)</option>
                        <option value="dots">Chấm Tròn (Dots)</option>
                        <option value="square">Vuông Cạnh (Square)</option>
                        <option value="classy">Kim Cương (Classy)</option>
                        <option value="extra-rounded">Oval (Extra Rounded)</option>
                      </select>
                    </div>
                  </div>

                  {/* Màu Sắc */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-mono text-on-surface-variant uppercase">BẢNG MÀU MÃ VÀ NỀN</label>
                      <div className="flex items-center gap-1">
                        {['none', 'linear'].map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setQrConfig((prev) => ({ ...prev, gradientType: g }))}
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              qrConfig.gradientType === g ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant'
                            }`}
                          >
                            {g === 'none' ? 'Đơn sắc' : 'Gradient'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2 bg-surface-subtle border border-border-subtle p-2 rounded-lg">
                        <input
                          type="color"
                          value={qrConfig.dotColor}
                          onChange={(e) => setQrConfig((prev) => ({ ...prev, dotColor: e.target.value }))}
                          className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                        />
                        <span className="text-xs font-mono text-on-surface">Màu mã</span>
                      </div>
                      {qrConfig.gradientType !== 'none' && (
                        <div className="flex items-center gap-2 bg-surface-subtle border border-border-subtle p-2 rounded-lg">
                          <input
                            type="color"
                            value={qrConfig.dotColor2}
                            onChange={(e) => setQrConfig((prev) => ({ ...prev, dotColor2: e.target.value }))}
                            className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                          />
                          <span className="text-xs font-mono text-on-surface">Màu gradient</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 bg-surface-subtle border border-border-subtle p-2 rounded-lg">
                        <input
                          type="color"
                          value={qrConfig.bgColor}
                          disabled={qrConfig.bgTransparent}
                          onChange={(e) => setQrConfig((prev) => ({ ...prev, bgColor: e.target.value }))}
                          className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 disabled:opacity-30"
                        />
                        <span className="text-xs font-mono text-on-surface">Màu nền</span>
                      </div>
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
                      <label className="text-xs font-mono text-on-surface-variant uppercase">ĐÍNH KÈM LOGO TRUNG TÂM</label>
                      {qrConfig.logoUrl && (
                        <button
                          type="button"
                          onClick={() => setQrConfig((prev) => ({ ...prev, logoUrl: null }))}
                          className="text-xs text-error hover:underline flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" /> Bỏ logo
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
                            {qrConfig.logoUrl ? 'Logo tùy biến đã nạp' : 'Chưa chọn logo'}
                          </span>
                          <span className="text-xs font-mono text-secondary">Vùng an toàn: 18%</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => logoInputRef.current?.click()}
                            className="text-primary text-xs font-medium hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5" /> Tải ảnh logo riêng...
                          </button>
                          <div className="flex items-center gap-1">
                            {PRESET_ICONS.slice(0, 5).map((icon) => (
                              <button
                                key={icon.name}
                                type="button"
                                onClick={() => setQrConfig((prev) => ({ ...prev, logoUrl: icon.url }))}
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

                  {/* Slider Quiet Zone */}
                  <div className="space-y-1 pt-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-mono text-on-surface-variant uppercase">VIỀN BẢO VỆ (QUIET ZONE MARGIN)</span>
                      <span className="font-mono text-primary">{qrConfig.logoMargin} Modules (Tiêu chuẩn POS)</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="6"
                      value={qrConfig.logoMargin}
                      onChange={(e) => setQrConfig((prev) => ({ ...prev, logoMargin: parseInt(e.target.value, 10) }))}
                      className="w-full accent-primary-container h-1.5 bg-surface-subtle rounded-lg cursor-pointer"
                    />
                  </div>
                </>
              ) : (
                /* Barcode Graphic Controls */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-on-surface-variant">
                        <span>Độ rộng thanh (Bar Width):</span>
                        <span className="font-mono text-primary">{barcodeConfig.barWidth}px</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="4"
                        value={barcodeConfig.barWidth}
                        onChange={(e) => setBarcodeConfig((prev) => ({ ...prev, barWidth: parseInt(e.target.value, 10) }))}
                        className="w-full accent-primary-container"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-on-surface-variant">
                        <span>Chiều cao (Height):</span>
                        <span className="font-mono text-primary">{barcodeConfig.barHeight}px</span>
                      </div>
                      <input
                        type="range"
                        min="30"
                        max="140"
                        step="5"
                        value={barcodeConfig.barHeight}
                        onChange={(e) => setBarcodeConfig((prev) => ({ ...prev, barHeight: parseInt(e.target.value, 10) }))}
                        className="w-full accent-primary-container"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex items-center gap-2 bg-surface-subtle border border-border-subtle p-2 rounded-lg">
                      <input
                        type="color"
                        value={barcodeConfig.lineColor}
                        onChange={(e) => setBarcodeConfig((prev) => ({ ...prev, lineColor: e.target.value }))}
                        className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                      />
                      <span className="text-xs font-mono text-on-surface">Màu vạch</span>
                    </div>
                    <div className="flex items-center gap-2 bg-surface-subtle border border-border-subtle p-2 rounded-lg">
                      <input
                        type="color"
                        value={barcodeConfig.bgColor}
                        onChange={(e) => setBarcodeConfig((prev) => ({ ...prev, bgColor: e.target.value }))}
                        className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                      />
                      <span className="text-xs font-mono text-on-surface">Màu nền</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button: Trigger Render */}
              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleTriggerRender}
                  className={`w-full py-3 px-6 bg-primary-container hover:bg-brand-cyan-bright text-on-primary-container font-semibold rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all transform cursor-pointer ${
                    isTriggeringRender ? 'scale-98 brightness-110' : ''
                  }`}
                >
                  <Zap className="w-5 h-5 fill-current" />
                  <span>Tạo Mã &amp; Render Bản In Chuẩn Vector (.SVG / 300 DPI)</span>
                </button>
              </div>
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
                    Mã Vạch Barcode
                  </button>
                  <button
                    type="button"
                    onClick={() => setBatchType('qr')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${batchType === 'qr' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant'}`}
                  >
                    Mã QR Code
                  </button>
                </div>

                {batchType === 'barcode' && (
                  <select
                    value={batchSymbology}
                    onChange={(e) => setBatchSymbology(e.target.value)}
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
                    <span>Tải CSV / TXT</span>
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
                        <span>Đang xử lý ({batchProgress}%)...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>Bắt Đầu Tạo Hàng Loạt</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-on-surface-variant">DỮ LIỆU DANH SÁCH (MỖI DÒNG 1 MÃ / CỘT TÊN PHẨY PHÂN CÁCH)</label>
                <textarea
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
                      Đã tạo thành công {batchItems.filter((i) => i.status === 'success').length} / {batchItems.length} mã
                    </span>
                    <button
                      type="button"
                      onClick={handleDownloadZip}
                      className="px-4 py-2 rounded-lg bg-secondary text-surface-canvas text-xs font-extrabold shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <Archive className="w-4 h-4" />
                      <span>Tải Về File ZIP (.zip)</span>
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
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 bg-surface-canvas/80 text-error rounded transition-opacity"
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
                  Đơn Bản
                </button>
                <button
                  type="button"
                  onClick={() => setIsLabelPreview(true)}
                  className={`px-2 py-0.5 text-xs font-semibold rounded cursor-pointer ${
                    isLabelPreview ? 'bg-surface-container-high text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Khổ Tem In
                </button>
              </div>
            </div>

            {/* Dynamic Container QR / Barcode Canvas */}
            <div className="w-full aspect-square bg-surface-light rounded-xl p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-inner transition-all">
              {/* Actual Canvas or SVG Container */}
              <div className="flex flex-col items-center justify-center gap-3 w-full h-full">
                {mode === 'qr' ? (
                  <div ref={qrContainerRef} className="w-56 h-56 flex items-center justify-center" />
                ) : (
                  <div className="w-full flex items-center justify-center py-4">
                    <svg ref={barcodeSvgRef} className="max-w-full h-auto" />
                  </div>
                )}
                {/* Dynamic Label Footer inside print visual */}
                <span className="text-[#090D16] text-sm font-semibold tracking-tight text-center max-w-[90%] truncate">
                  {mode === 'qr' ? qrConfig.labelTitle : barcodeConfig.labelTitle}
                </span>
              </div>

              {/* Label Dimension Overlay */}
              {isLabelPreview && (
                <div className="absolute top-3 left-3 bg-[#1E293B] text-white px-2.5 py-1 rounded text-xs font-mono shadow-md border border-slate-700">
                  Khổ tem: 50 × 30 mm | 300 DPI
                </div>
              )}
            </div>

            {/* Scanner Simulator */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={simulateScan}
                className="py-2.5 px-4 bg-surface-subtle hover:bg-surface-container-high border border-border-subtle text-on-surface rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <ScanLine className="w-4 h-4 text-secondary" />
                <span>Quét thử bằng giả lập scanner máy ảnh</span>
              </button>

              {scannedFeedback && (
                <div className="p-3 bg-surface-container-low border border-border-subtle rounded-lg flex items-center gap-2 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
                  <div className="flex-1 truncate text-on-surface-variant">
                    <span className="text-secondary font-medium">✓ Đọc thành công ({scannedFeedback.time})</span> •{' '}
                    <span className="text-on-surface font-mono">{scannedFeedback.content}</span>
                  </div>
                </div>
              )}
            </div>

            {/* BẢNG THÔNG SỐ KỸ THUẬT MÃ */}
            <div className="p-4 bg-surface-container-low border border-border-subtle rounded-lg space-y-2">
              <div className="flex items-center justify-between text-on-surface font-semibold text-xs pb-1 border-b border-border-subtle">
                <span>Thông Số Kỹ Thuật Đồ Họa</span>
                <span className="font-mono text-primary">TIÊU CHUẨN ISO/IEC</span>
              </div>
              <div className="grid grid-cols-2 gap-y-2 text-xs">
                <div>
                  <span className="text-outline block font-mono text-[11px]">LOẠI MÃ</span>
                  <span className="text-on-surface font-medium font-mono">
                    {mode === 'qr' ? 'QR Code Model 2' : barcodeConfig.symbology}
                  </span>
                </div>
                <div>
                  <span className="text-outline block font-mono text-[11px]">KÍCH THƯỚC MA TRẬN</span>
                  <span className="text-on-surface font-medium font-mono">
                    {mode === 'qr' ? '33 × 33 Modules' : `${barcodeConfig.barHeight}px × ${barcodeConfig.barWidth}px`}
                  </span>
                </div>
                <div>
                  <span className="text-outline block font-mono text-[11px]">MỨC BẢO VỆ DỮ LIỆU</span>
                  <span className="text-secondary font-medium font-mono">
                    {mode === 'qr' ? `Mức ${qrConfig.errorCorrection} (Reed-Solomon)` : 'Checksum Modulo-10'}
                  </span>
                </div>
                <div>
                  <span className="text-outline block font-mono text-[11px]">KÍCH THƯỚC IN GỢI Ý</span>
                  <span className="text-on-surface font-medium font-mono">
                    35 × 35 mm (Chuẩn POS)
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
                className="w-full py-3 px-4 bg-brand-emerald-deep hover:bg-secondary text-on-secondary font-semibold text-sm rounded-lg shadow-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <FileDown className="w-5 h-5" />
                <span>Tải Mã Vector (.SVG Siêu Nét In Ấn)</span>
              </button>

              {/* 2-Col Format & Resolution */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadRaster('png')}
                  className="py-2.5 px-3 bg-surface-subtle hover:bg-surface-container-high border border-border-subtle text-on-surface text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4 text-primary" />
                  <span>Tải PNG 2048px</span>
                </button>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowFormatDropdown(!showFormatDropdown)}
                    className="w-full py-2.5 px-3 bg-surface-subtle hover:bg-surface-container-high border border-border-subtle text-on-surface text-xs font-semibold rounded-lg flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>.{selectedFormat.toUpperCase()} ({resolutionScale}x)</span>
                    <ChevronDown className="w-4 h-4 text-outline" />
                  </button>

                  {showFormatDropdown && (
                    <div className="absolute right-0 bottom-full mb-1 w-48 rounded-xl bg-surface-container border border-border-subtle shadow-2xl p-2 z-30 space-y-2">
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-outline uppercase block px-2">Định dạng file</span>
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
                          <span className="text-[10px] font-mono text-outline uppercase block px-2">Độ phân giải</span>
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
                  className="py-2.5 px-3 bg-surface-container-low hover:bg-surface-container-high border border-border-subtle text-on-surface-variant hover:text-on-surface text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Copy className="w-4 h-4 text-primary" />
                  <span>{isCopied ? t.btnCopied : 'Sao chép ảnh'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveToHistory}
                  className="py-2.5 px-3 bg-surface-container-low hover:bg-surface-container-high border border-border-subtle text-on-surface-variant hover:text-on-surface text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4 text-secondary" />
                  <span>Lưu lịch sử</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. TOOL TIPS & QUY CHUẨN KỸ THUẬT (3 Cột cuối trang) */}
      <section className="w-full mt-12 pt-8 border-t border-border-subtle">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-2 h-6 bg-primary-container rounded" />
          <h3 className="text-xl font-bold text-on-surface tracking-tight">
            Quy Chuẩn Kỹ Thuật Mã Hóa &amp; In Ấn Thương Mại
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-container border border-border-subtle rounded-xl p-6 shadow-sm flex flex-col gap-3">
            <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary-container">
              <Store className="w-6 h-6" />
            </div>
            <h4 className="text-base font-semibold text-on-surface">Tiêu Chuẩn GS1 &amp; Tem Bán Lẻ</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Mã vạch chuẩn GS1 EAN-13 yêu cầu độ phóng đại từ 80% đến 200% (tương đương chiều rộng 30mm - 74mm). Mã nước Việt Nam &apos;893&apos; đi cùng số kiểm tra Checksum Modulo-10 tự động đảm bảo mọi máy đọc POS tại siêu thị và cửa hàng tiện lợi nhận diện tức thì trong lần quét đầu tiên.
            </p>
          </div>

          <div className="bg-surface-container border border-border-subtle rounded-xl p-6 shadow-sm flex flex-col gap-3">
            <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-secondary">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="text-base font-semibold text-on-surface">Mức Sửa Lỗi H (30%) &amp; Logo</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Khi chèn logo thương hiệu ở tâm QR Code, 10% đến 20% các khối dữ liệu bị che khuất. Khuyến cáo luôn kích hoạt mức sửa lỗi H (High - 30%) sử dụng thuật toán bù sai số Reed-Solomon, giúp mã giữ nguyên khả năng giải mã ngay cả khi tem dán ngoài trời bị rách nhẹ hoặc trầy xước.
            </p>
          </div>

          <div className="bg-surface-container border border-border-subtle rounded-xl p-6 shadow-sm flex flex-col gap-3">
            <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-brand-cyan-bright">
              <Layers className="w-6 h-6" />
            </div>
            <h4 className="text-base font-semibold text-on-surface">Định Dạng Vector SVG Siêu Nét</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Khác với file ảnh Bitmap (JPEG/PNG) dễ bị nhòe vỡ hạt khi phóng to, file xuất SVG lưu trữ tọa độ toán học hình học thuần túy. Điều này cho phép bạn chuyển tiếp thẳng đến các nhà xưởng in ống đồng, in Flexo hoặc in laser tem nhiệt mà không phải xử lý lại nét vector thủ công.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
