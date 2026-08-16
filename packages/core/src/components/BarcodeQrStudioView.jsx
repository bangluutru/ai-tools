import React, { useState, useEffect, useRef } from 'react';
import {
  IMAGE_INPUT_LIMITS,
  rejectionMessages,
  validateDocumentFiles,
  verifyDocumentSignature,
} from '../utils/documentFiles.js';
import { MiniAppError, MiniAppLayout } from './shared/MiniAppLayout.jsx';
import QRCodeStyling from 'qr-code-styling';
import JsBarcode from 'jsbarcode';
import JSZip from 'jszip';
import confetti from 'canvas-confetti';
import {
  QrCode,
  Barcode,
  Layers,
  Sparkles,
  Clipboard,
  Check,
  Download,
  ChevronDown,
  Upload,
  X,
  FileCode,
  Image as ImageIcon,
  History,
  Trash2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Globe,
  Wifi,
  Contact,
  Mail,
  MessageSquare,
  MapPin,
  Coins,
  FileText,
  Lock,
  Palette,
  Shapes,
  Layout,
  Sliders,
  Type,
  FileSpreadsheet,
  Archive,
  Loader2,
  ArrowRight,
  Save,
} from 'lucide-react';
import { validateAndFixBarcode } from '../utils/codecraft/checksumValidators.js';

// =====================================================================
// TRANSLATIONS
// =====================================================================
const i18n = {
  vi: {
    heroTitle: 'Bộ Tạo Mã QR Nghệ Thuật & Mã Vạch Chuẩn Công Nghiệp',
    heroTagline: 'Tạo mã QR nhúng logo, gradient màu và mã vạch 1D GS1 công nghiệp 100% offline, bảo mật tuyệt đối.',
    tabQR: 'Mã QR Cao Cấp & Nhúng Logo',
    tabBarcode: 'Mã Vạch Chuẩn Công Nghiệp',
    tabBatch: 'Tạo Hàng Loạt (Batch CSV)',
    btnCopy: '📋 Sao Chép (Copy)',
    btnCopied: 'Đã Sao Chép!',
    btnDownload: 'Tải Về',
    livePreview: 'Xem Trước Trực Tiếp',
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
    tabQR: 'Artistic QR with Custom Logo',
    tabBarcode: 'Industrial 1D Barcode',
    tabBatch: 'Batch Mode (CSV / List)',
    btnCopy: '📋 Copy to Clipboard',
    btnCopied: 'Copied!',
    btnDownload: 'Download',
    livePreview: 'Live Preview',
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
    tabQR: '高機能QRコード (ロゴ埋め込み)',
    tabBarcode: '産業用バーコード',
    tabBatch: '一括生成 (Batch CSV)',
    btnCopy: '📋 コピー',
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
  { name: 'Tím Indigo', c1: '#7c3aed', c2: '#06b6d4', type: 'linear' },
  { name: 'Hồng Hoàng Hôn', c1: '#ec4899', c2: '#f59e0b', type: 'linear' },
  { name: 'Xanh Lá Tươi', c1: '#059669', c2: '#10b981', type: 'linear' },
  { name: 'Xanh Đại Dương', c1: '#1d4ed8', c2: '#06b6d4', type: 'linear' },
  { name: 'Đen Huyền Bí', c1: '#0f172a', c2: '#334155', type: 'linear' },
  { name: 'Đỏ Ruby', c1: '#dc2626', c2: '#7c3aed', type: 'linear' },
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
      return config.rawText || 'https://google.com';
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
    data: data || 'CodeCraft Studio',
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
  ctx.font = 'bold 20px Plus Jakarta Sans, Inter, sans-serif';
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

  // QR Code Config
  const [fileError, setFileError] = useState('');
  const [qrConfig, setQrConfig] = useState({
    contentType: 'url',
    rawText: 'https://github.com/bangluutru/ai-tools',
    wifi: { ssid: 'Office_HighSpeed_5G', password: 'SecurePassword2026', encryption: 'WPA', hidden: false },
    vcard: { firstName: 'Hải Bằng', lastName: 'Trần', organization: 'Antigravity AI Lab', title: 'Lead Architect', phone: '+84 912 345 678', email: 'bang@antigravity.ai', website: 'https://github.com/bangluutru', address: 'Hà Nội', note: '' },
    email: { to: 'contact@antigravity.ai', subject: 'Tư vấn giải pháp AI', body: 'Xin chào...' },
    sms: { phone: '0912345678', message: 'Xác nhận đơn hàng' },
    geo: { latitude: '21.028511', longitude: '105.854444' },
    crypto: { currency: 'BTC', address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', amount: '0.01' },
    errorCorrection: 'M',
    dotType: 'rounded',
    cornerSquareType: 'extra-rounded',
    cornerDotType: 'dot',
    dotColor: '#7c3aed',
    dotColor2: '#06b6d4',
    gradientType: 'linear',
    gradientRotation: 45,
    cornerSquareColor: '#7c3aed',
    cornerDotColor: '#06b6d4',
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
    symbology: 'CODE128',
    value: 'CODECRAFT-2026',
    barWidth: 2,
    barHeight: 70,
    displayValue: true,
    customText: '',
    textAlign: 'center',
    textPosition: 'bottom',
    fontSize: 16,
    textMargin: 6,
    lineColor: '#000000',
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
  const [selectedFormat, setSelectedFormat] = useState('png');
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);
  const [resolutionScale, setResolutionScale] = useState(2);
  const [currentCanvas, setCurrentCanvas] = useState(null);

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
              canvas.className = 'max-w-full h-auto rounded-2xl shadow-xl mx-auto';
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
        confetti({ particleCount: 35, spread: 60, origin: { y: 0.85 }, colors: ['#8b5cf6', '#06b6d4', '#10b981'] });
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

  const handleDownload = () => {
    if (selectedFormat === 'svg') handleDownloadSVG();
    else handleDownloadRaster(selectedFormat);
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

  /** Nạp lại cấu hình đã lưu để chỉnh tiếp thay vì gõ lại từ đầu. */
  const handleRestoreHistory = (item) => {
    setMode(item.type);
    if (item.type === 'qr' && item.qrConfig) setQrConfig(item.qrConfig);
    if (item.type === 'barcode' && item.barcodeConfig) setBarcodeConfig(item.barcodeConfig);
  };

  const handleDeleteHistory = (id) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
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
              lineColor: '#000000',
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
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 }, colors: ['#f59e0b', '#10b981', '#06b6d4'] });
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
    <MiniAppLayout width="wide" gap="normal">
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

      {/* Mode Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
        {[
          { id: 'qr', title: t.tabQR, subtitle: 'Gradient, logo, wifi, vCard...', icon: QrCode, badge: 'LOGO & GRADIENT', grad: 'from-brand-600 to-indigo-600' },
          { id: 'barcode', title: t.tabBarcode, subtitle: 'Code128, EAN-13, UPC, ITF-14...', icon: Barcode, badge: 'GS1 STANDARD', grad: 'from-cyan-600 to-teal-600' },
          { id: 'batch', title: t.tabBatch, subtitle: 'Sinh hàng loạt & xuất file ZIP', icon: Layers, badge: 'BULK ZIP', grad: 'from-amber-600 to-orange-600' },
        ].map((item) => {
          const isSelected = mode === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setMode(item.id)}
              className={`p-4 rounded-3xl border transition-all duration-200 text-left flex items-center justify-between cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 border-brand-500 shadow-xl shadow-brand-500/10 ring-2 ring-brand-500/30'
                  : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center space-x-3.5">
                <div className={`p-3 rounded-2xl ${isSelected ? `bg-gradient-to-tr ${item.grad} text-white shadow-lg` : 'bg-slate-800 text-slate-400'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-xs sm:text-sm font-extrabold ${isSelected ? 'text-white' : 'text-slate-200'}`}>{item.title}</h3>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{item.subtitle}</p>
                </div>
              </div>
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border hidden sm:inline-block ${
                isSelected ? 'bg-brand-500/20 border-brand-500/40 text-brand-300' : 'bg-slate-800/60 border-slate-700/60 text-slate-400'
              }`}>
                {item.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Workspace (2-Column) */}
      {mode !== 'batch' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form & Controls */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            {mode === 'qr' ? (
              <>
                {/* QR Content Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {[
                    { id: 'url', label: 'Website', icon: Globe },
                    { id: 'wifi', label: 'WiFi', icon: Wifi },
                    { id: 'vcard', label: 'vCard', icon: Contact },
                    { id: 'email', label: 'Email', icon: Mail },
                    { id: 'sms', label: 'SMS', icon: MessageSquare },
                    { id: 'geo', label: 'Bản Đồ', icon: MapPin },
                    { id: 'crypto', label: 'Crypto', icon: Coins },
                    { id: 'text', label: 'Văn Bản', icon: FileText },
                  ].map((tab) => {
                    const isSelected = qrConfig.contentType === tab.id;
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setQrConfig((prev) => ({ ...prev, contentType: tab.id }))}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
                          isSelected ? 'bg-brand-600 text-white shadow-md' : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* QR Content Input Field */}
                <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-md space-y-3">
                  {qrConfig.contentType === 'url' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">Đường dẫn Website (URL):</label>
                      <input
                        type="url"
                        value={qrConfig.rawText}
                        onChange={(e) => setQrConfig((prev) => ({ ...prev, rawText: e.target.value }))}
                        placeholder="https://example.com"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                  )}

                  {qrConfig.contentType === 'wifi' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-xs font-bold text-slate-300">Tên WiFi (SSID):</label>
                        <input
                          type="text"
                          value={qrConfig.wifi.ssid}
                          onChange={(e) => setQrConfig((prev) => ({ ...prev, wifi: { ...prev.wifi, ssid: e.target.value } }))}
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-300">Mật khẩu:</label>
                        <input
                          type="text"
                          value={qrConfig.wifi.password}
                          onChange={(e) => setQrConfig((prev) => ({ ...prev, wifi: { ...prev.wifi, password: e.target.value } }))}
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-300">Mã hóa:</label>
                        <select
                          value={qrConfig.wifi.encryption}
                          onChange={(e) => setQrConfig((prev) => ({ ...prev, wifi: { ...prev.wifi, encryption: e.target.value } }))}
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
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
                        <label className="text-xs font-bold text-slate-300">Họ & Tên:</label>
                        <input
                          type="text"
                          value={qrConfig.vcard.firstName}
                          onChange={(e) => setQrConfig((prev) => ({ ...prev, vcard: { ...prev.vcard, firstName: e.target.value } }))}
                          placeholder="Trần Hải Bằng"
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-300">Số điện thoại:</label>
                        <input
                          type="tel"
                          value={qrConfig.vcard.phone}
                          onChange={(e) => setQrConfig((prev) => ({ ...prev, vcard: { ...prev.vcard, phone: e.target.value } }))}
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-300">Email:</label>
                        <input
                          type="email"
                          value={qrConfig.vcard.email}
                          onChange={(e) => setQrConfig((prev) => ({ ...prev, vcard: { ...prev.vcard, email: e.target.value } }))}
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-300">Công ty:</label>
                        <input
                          type="text"
                          value={qrConfig.vcard.organization}
                          onChange={(e) => setQrConfig((prev) => ({ ...prev, vcard: { ...prev.vcard, organization: e.target.value } }))}
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {qrConfig.contentType === 'text' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">Nội dung văn bản:</label>
                      <textarea
                        rows={3}
                        value={qrConfig.rawText}
                        onChange={(e) => setQrConfig((prev) => ({ ...prev, rawText: e.target.value }))}
                        className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono resize-none focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* QR Customizer: Logo & Styling */}
                <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-md space-y-4">
                  {/* Logo Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
                      <ImageIcon className="w-4 h-4 text-brand-400" />
                      <span>Logo & Biểu Tượng Trung Tâm</span>
                    </div>
                    {qrConfig.logoUrl && (
                      <button
                        type="button"
                        onClick={() => setQrConfig((prev) => ({ ...prev, logoUrl: null }))}
                        className="text-xs text-red-400 hover:text-red-300 flex items-center space-x-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Bỏ logo</span>
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition flex items-center space-x-2 shadow-sm"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Tải Ảnh Riêng</span>
                    </button>
                    {PRESET_ICONS.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => setQrConfig((prev) => ({ ...prev, logoUrl: p.url }))}
                        className={`p-2 rounded-xl border text-xs flex items-center space-x-1 ${
                          qrConfig.logoUrl === p.url ? 'bg-brand-500/20 border-brand-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'
                        }`}
                      >
                        <span>{p.icon}</span>
                        <span className="text-[11px] hidden sm:inline">{p.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Colors & Gradient */}
                  <div className="pt-3 border-t border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">Màu Sắc & Gradient:</span>
                      <div className="flex items-center space-x-2">
                        {['none', 'linear', 'radial'].map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setQrConfig((prev) => ({ ...prev, gradientType: g }))}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                              qrConfig.gradientType === g ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {g === 'none' ? 'Đơn Sắc' : g === 'linear' ? 'Linear' : 'Radial'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-slate-400">Màu 1:</span>
                        <input
                          type="color"
                          value={qrConfig.dotColor}
                          onChange={(e) => setQrConfig((prev) => ({ ...prev, dotColor: e.target.value }))}
                          className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                        />
                      </div>
                      {qrConfig.gradientType !== 'none' && (
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-slate-400">Màu 2:</span>
                          <input
                            type="color"
                            value={qrConfig.dotColor2}
                            onChange={(e) => setQrConfig((prev) => ({ ...prev, dotColor2: e.target.value }))}
                            className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                          />
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-slate-400">Nền:</span>
                        <input
                          type="color"
                          value={qrConfig.bgColor}
                          disabled={qrConfig.bgTransparent}
                          onChange={(e) => setQrConfig((prev) => ({ ...prev, bgColor: e.target.value }))}
                          className="w-7 h-7 rounded cursor-pointer bg-transparent border-0 disabled:opacity-30"
                        />
                      </div>
                    </div>

                    {/* Presets */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {PRESET_COLOR_GRADIENTS.map((p) => (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() => setQrConfig((prev) => ({ ...prev, dotColor: p.c1, dotColor2: p.c2, gradientType: p.type }))}
                          className="px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-sm"
                          style={{ background: `linear-gradient(135deg, ${p.c1}, ${p.c2})` }}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dot Shapes */}
                  <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1.5">Kiểu Chấm:</label>
                      <select
                        value={qrConfig.dotType}
                        onChange={(e) => setQrConfig((prev) => ({ ...prev, dotType: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                      >
                        <option value="rounded">Bo Góc (Rounded)</option>
                        <option value="dots">Chấm Tròn (Dots)</option>
                        <option value="square">Vuông (Square)</option>
                        <option value="classy">Kim Cương (Classy)</option>
                        <option value="extra-rounded">Oval (Extra Rounded)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1.5">Mắt Định Vị:</label>
                      <select
                        value={qrConfig.cornerSquareType}
                        onChange={(e) => setQrConfig((prev) => ({ ...prev, cornerSquareType: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                      >
                        <option value="extra-rounded">Bo Tròn</option>
                        <option value="square">Vuông Cạnh</option>
                        <option value="dot">Chấm Lớn</option>
                      </select>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Barcode Controls */
              <div className="flex flex-col gap-4">
                <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-md space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">Chuẩn Mã Vạch Công Nghiệp (Symbology):</span>
                    <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-500/30">
                      {currentSymbology?.category}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {BARCODE_SYMBOLOGIES.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setBarcodeConfig((prev) => ({ ...prev, symbology: s.id, value: s.example }))}
                        className={`p-3 rounded-2xl border text-left cursor-pointer ${
                          barcodeConfig.symbology === s.id
                            ? 'bg-cyan-600 text-white border-cyan-400 shadow-md ring-2 ring-cyan-400/30'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="text-xs font-extrabold">{s.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{s.category}</div>
                      </button>
                    ))}
                  </div>

                  {currentSymbology && (
                    <p className="text-xs text-slate-300 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                      ℹ️ {currentSymbology.desc}
                    </p>
                  )}
                </div>

                <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-md space-y-3">
                  <label className="text-xs font-bold text-slate-300">Dữ liệu mã vạch:</label>
                  <input
                    type="text"
                    value={barcodeConfig.value}
                    onChange={(e) => setBarcodeConfig((prev) => ({ ...prev, value: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-mono font-bold tracking-wider focus:outline-none focus:border-cyan-500"
                  />

                  {barcodeValidation.error && (
                    <div className={`p-2.5 rounded-xl border flex items-center space-x-2 text-xs ${
                      barcodeValidation.isValid ? 'bg-amber-950/60 border-amber-500/40 text-amber-300' : 'bg-red-950/60 border-red-500/40 text-red-300'
                    }`}>
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{barcodeValidation.error}</span>
                    </div>
                  )}

                  {barcodeValidation.isValid && !barcodeValidation.error && (
                    <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center space-x-2 text-xs text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Định dạng hợp lệ & chuẩn kiểm tra GS1 chính xác</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800">
                    <div>
                      <div className="flex justify-between text-xs text-slate-300 mb-1">
                        <span>Độ rộng:</span>
                        <span className="font-mono text-cyan-400">{barcodeConfig.barWidth}px</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="4"
                        value={barcodeConfig.barWidth}
                        onChange={(e) => setBarcodeConfig((prev) => ({ ...prev, barWidth: parseInt(e.target.value, 10) }))}
                        className="w-full accent-cyan-500"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-slate-300 mb-1">
                        <span>Chiều cao:</span>
                        <span className="font-mono text-cyan-400">{barcodeConfig.barHeight}px</span>
                      </div>
                      <input
                        type="range"
                        min="30"
                        max="150"
                        step="5"
                        value={barcodeConfig.barHeight}
                        onChange={(e) => setBarcodeConfig((prev) => ({ ...prev, barHeight: parseInt(e.target.value, 10) }))}
                        className="w-full accent-cyan-500"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-slate-300 mb-1">
                        <span>Vùng đệm:</span>
                        <span className="font-mono text-cyan-400">{barcodeConfig.margin}px</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="40"
                        value={barcodeConfig.margin}
                        onChange={(e) => setBarcodeConfig((prev) => ({ ...prev, margin: parseInt(e.target.value, 10) }))}
                        className="w-full accent-cyan-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Live Sticky Preview */}
          <div className="lg:col-span-5 flex flex-col gap-4 sticky top-24">
            {toastMessage && (
              <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border border-emerald-500/50 text-emerald-300 text-xs font-semibold shadow-xl flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{toastMessage}</span>
                </div>
              </div>
            )}

            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-2xl flex flex-col items-center justify-center space-y-6">
              <div className="w-full flex items-center justify-between text-xs text-slate-400">
                <span className="font-extrabold uppercase text-slate-300">{t.livePreview}</span>
                <span className="font-mono text-brand-400 font-bold">
                  {mode === 'qr' ? 'ISO/IEC 18004' : `GS1 ${barcodeConfig.symbology}`}
                </span>
              </div>

              <div className="w-full min-h-[280px] flex items-center justify-center p-4 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-inner overflow-hidden">
                {/* key bắt buộc: canvas QR do qr-code-styling chèn bằng appendChild
                    nên React không quản lý nó. Hai nhánh cùng là <div> ở cùng vị
                    trí thì React tái dùng đúng node cũ, và canvas chèn tay sống
                    sót sang tab mã vạch — preview vẫn hiện QR. Đặt key khác nhau
                    buộc React thay hẳn node, xoá luôn canvas mồ côi. */}
                {mode === 'qr' ? (
                  <div key="preview-qr" ref={qrContainerRef} className="flex items-center justify-center" />
                ) : (
                  <div key="preview-barcode" className="flex items-center justify-center overflow-x-auto max-w-full p-2">
                    <svg ref={barcodeSvgRef} className="max-w-full h-auto" />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="w-full flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyClipboard}
                    className={`flex-1 py-3 px-4 rounded-2xl font-extrabold text-xs shadow-xl transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95 ${
                      isCopied ? 'bg-emerald-600 text-white' : 'bg-gradient-to-r from-brand-600 to-cyan-600 text-white shadow-brand-500/20'
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>{t.btnCopied}</span>
                      </>
                    ) : (
                      <>
                        <Clipboard className="w-4 h-4" />
                        <span>{t.btnCopy}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveToHistory}
                    className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                  >
                    <Save className="w-4 h-4 text-brand-400" />
                  </button>
                </div>

                {/* Lịch sử: trước đây mã đã lưu chỉ nằm trong localStorage mà
                    người dùng không có cách nào xem hay dùng lại. */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      {t.btnSaveHistory}
                    </span>
                    {history.length > 0 && (
                      <span className="text-[10px] text-slate-500">{history.length}/20</span>
                    )}
                  </div>
                  {history.length === 0 ? (
                    <p className="text-[11px] text-slate-500 py-2 text-center">{t.emptyHistory}</p>
                  ) : (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {history.map((item) => (
                        <div key={item.id} className="relative shrink-0 group">
                          <button
                            type="button"
                            onClick={() => handleRestoreHistory(item)}
                            title={item.title}
                            className="block w-16 h-16 rounded-xl border border-slate-700 bg-white overflow-hidden hover:border-brand-500 transition"
                          >
                            <img src={item.previewDataUrl} alt={item.title} className="w-full h-full object-contain" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteHistory(item.id)}
                            aria-label={`Xoá ${item.title}`}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-800 border border-slate-600 text-slate-400 hover:text-rose-400 hover:border-rose-500 text-[10px] leading-none opacity-0 group-hover:opacity-100 transition"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1 flex items-center rounded-2xl bg-slate-800 border border-slate-700">
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="flex-1 px-4 py-2.5 text-slate-200 hover:text-white font-bold text-xs flex items-center justify-center space-x-2 rounded-l-2xl"
                    >
                      <Download className="w-4 h-4 text-cyan-400" />
                      <span>{t.btnDownload}</span>
                      <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-cyan-300 font-mono font-bold">
                        .{selectedFormat}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowFormatDropdown(!showFormatDropdown)}
                      className="px-2.5 py-2.5 text-slate-400 hover:text-white border-l border-slate-700 rounded-r-2xl"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>

                    {showFormatDropdown && (
                      <div className="absolute right-0 top-full mt-2 w-44 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-1.5 z-30 space-y-1">
                        {['png', 'svg', 'jpeg', 'webp'].map((fmt) => (
                          <button
                            key={fmt}
                            type="button"
                            onClick={() => {
                              setSelectedFormat(fmt);
                              setShowFormatDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold uppercase font-mono transition flex items-center justify-between ${
                              selectedFormat === fmt ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <span>.{fmt}</span>
                            {selectedFormat === fmt && <Check className="w-3.5 h-3.5" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedFormat !== 'svg' && (
                    <div className="flex items-center p-1 rounded-2xl bg-slate-800 border border-slate-700 text-xs">
                      {[1, 2, 4].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setResolutionScale(s)}
                          className={`px-2 py-1 rounded-xl font-mono font-bold ${
                            resolutionScale === s ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {s}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Batch Mode */
        <div className="w-full flex flex-col gap-6">
          <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center p-1 rounded-2xl bg-slate-800 border border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setBatchType('barcode')}
                  className={`px-3.5 py-2 rounded-xl font-bold ${batchType === 'barcode' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}
                >
                  Mã Vạch Barcode
                </button>
                <button
                  type="button"
                  onClick={() => setBatchType('qr')}
                  className={`px-3.5 py-2 rounded-xl font-bold ${batchType === 'qr' ? 'bg-brand-600 text-white' : 'text-slate-400'}`}
                >
                  Mã QR Code
                </button>
              </div>

              {batchType === 'barcode' && (
                <select
                  value={batchSymbology}
                  onChange={(e) => setBatchSymbology(e.target.value)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold"
                >
                  {BARCODE_SYMBOLOGIES.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <button
                type="button"
                onClick={() => batchFileInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition flex items-center space-x-2"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Tải CSV / TXT</span>
              </button>

              <button
                type="button"
                onClick={handleProcessBatch}
                disabled={isBatchProcessing}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-extrabold shadow-lg transition flex items-center space-x-2 disabled:opacity-50"
              >
                {isBatchProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang xử lý ({batchProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Layers className="w-4 h-4" />
                    <span>⚡ Bắt Đầu Tạo Hàng Loạt</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-2">
            <textarea
              rows={4}
              value={batchRawInput}
              onChange={(e) => setBatchRawInput(e.target.value)}
              className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none"
            />
          </div>

          {batchItems.length > 0 && (
            <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-200">
                  Đã tạo {batchItems.filter((i) => i.status === 'success').length} / {batchItems.length} mã
                </div>
                <button
                  type="button"
                  onClick={handleDownloadZip}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-black shadow-lg flex items-center space-x-2"
                >
                  <Archive className="w-4 h-4" />
                  <span>📦 Tải Về File ZIP (.zip)</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-[400px] overflow-y-auto">
                {batchItems.map((item) => (
                  <div key={item.id} className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1">
                    {item.status === 'success' && item.dataUrl ? (
                      <div className="w-full bg-white p-1.5 rounded-xl aspect-square flex items-center justify-center">
                        <img src={item.dataUrl} alt={item.code} className="max-w-full max-h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-full bg-red-950/40 p-2 rounded-xl aspect-square flex items-center justify-center text-red-400 text-[10px]">
                        {item.errorMessage}
                      </div>
                    )}
                    <div className="text-xs font-mono font-bold text-slate-200 truncate">{item.code}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </MiniAppLayout>
  );
}
