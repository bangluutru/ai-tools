import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Camera,
  Clipboard,
  Upload,
  Clock,
  Loader2,
  Maximize2,
  X,
  Move,
  Sparkles,
  Pencil,
  MoveUpRight,
  Square,
  Circle,
  Highlighter,
  EyeOff,
  Type,
  ListOrdered,
  Undo2,
  Redo2,
  Trash2,
  RotateCcw,
  Crop,
  Check,
  Download,
  ChevronDown,
  Image as ImageIcon,
  History,
  CheckCircle2,
  Zap,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

// =====================================================================
// Translations
// =====================================================================
const i18n = {
  vi: {
    heroBadge: 'Chụp & Tự Động Copy Clipboard',
    heroTitle: 'Chụp Màn Hình Siêu Tốc 1-Chạm',
    heroSubtitle: 'Bấm nút dưới đây để chụp, kéo chọn vùng mong muốn. Vừa nhả chuột là ảnh đã tự động có trong Clipboard để dán ngay!',
    btnStartSnip: '🎯 Bắt Đầu Chụp & Kéo Chọn Vùng',
    step1Title: 'Bấm Chụp',
    step1Desc: 'Chọn màn hình cần lấy',
    step2Title: 'Kéo Chọn Vùng',
    step2Desc: 'Khoanh vùng trên màn hình',
    step3Title: 'Tự Động Copy & Dán',
    step3Desc: 'Nhả chuột = Dán Ctrl+V ngay',
    btnCapture: 'Chụp Màn Hình',
    btnPreparing: 'Đang chuẩn bị...',
    timerInstant: '0s (Tức thì)',
    btnPaste: 'Dán Clipboard (Ctrl+V)',
    btnOpenFile: 'Mở File Ảnh',
    snipGuideTitle: 'Kéo chuột để chọn vùng',
    snipAutoCopyBadge: 'Nhả chuột = Tự động Copy Clipboard!',
    snipGuidePrompt: 'Kéo rê chuột trên ảnh để khoanh vùng cần chụp...',
    btnFullScreen: 'Lấy Toàn Màn Hình',
    bannerAutoCopied: '🎉 Đã Tự Động Copy Vào Clipboard! Bạn có thể dán (Ctrl+V) ngay sang Zalo, Slack, Word... hoặc dùng các công cụ dưới đây để vẽ thêm.',
    bannerLiveSynced: '🎉 Đã Tự Động Cập Nhật Vào Clipboard (Bao gồm đầy đủ mũi tên & nét vẽ vừa chỉnh sửa)! Bạn có thể dán (Ctrl+V) ngay sang Zalo, Slack, Word...',
    liveSyncBadge: 'Live Sync',
    btnResnip: 'Chọn Lại Vùng',
    btnCopy: '📋 Sao Chép (Copy)',
    btnCopied: 'Đã Sao Chép!',
    btnDownload: 'Tải Về',
    btnSnipAnother: '📸 Chụp Vùng Khác',
    sizeLabel: 'Kích thước:',
    recentTitle: 'Ảnh Đã Chụp Gần Đây',
    btnClearHistory: 'Xóa lịch sử',
    openSnapshot: 'Mở lại',
    tools: {
      pen: 'Bút Vẽ',
      arrow: 'Mũi Tên',
      rect: 'Hộp Vuông',
      circle: 'Hình Tròn',
      highlight: 'Dạ Quang',
      blur: 'Làm Mờ (Blur)',
      text: 'Văn Bản',
      step: 'Đánh Số Bước',
    },
  },
  en: {
    heroBadge: 'Capture & Instant Auto-Copy',
    heroTitle: 'Lightning-Fast Screen Snipping',
    heroSubtitle: 'Click below to capture and drag over the area. Release the mouse to auto-copy to clipboard instantly!',
    btnStartSnip: '🎯 Start Capture & Snip Area',
    step1Title: 'Click Capture',
    step1Desc: 'Select screen or window',
    step2Title: 'Drag to Snip',
    step2Desc: 'Highlight the area',
    step3Title: 'Auto-Copy & Paste',
    step3Desc: 'Release = Ctrl+V to paste',
    btnCapture: 'Capture Screen',
    btnPreparing: 'Preparing...',
    timerInstant: '0s (Instant)',
    btnPaste: 'Paste Clipboard (Ctrl+V)',
    btnOpenFile: 'Open Image',
    snipGuideTitle: 'Click & drag to select area',
    snipAutoCopyBadge: 'Release = Auto-Copy to Clipboard!',
    snipGuidePrompt: 'Click and drag over the image to snip...',
    btnFullScreen: 'Use Full Screen',
    bannerAutoCopied: '🎉 Auto-Copied to Clipboard! Press Ctrl+V to paste anywhere or annotate below.',
    bannerLiveSynced: '🎉 Clipboard Auto-Synced with latest annotations! Press Ctrl+V to paste into Slack, Zalo, Word, Figma...',
    liveSyncBadge: 'Live Sync',
    btnResnip: 'Resnip Area',
    btnCopy: '📋 Copy to Clipboard',
    btnCopied: 'Copied!',
    btnDownload: 'Download',
    btnSnipAnother: '📸 Snip Another Area',
    sizeLabel: 'Size:',
    recentTitle: 'Recent Snapshots',
    btnClearHistory: 'Clear history',
    openSnapshot: 'Open',
    tools: {
      pen: 'Brush',
      arrow: 'Arrow',
      rect: 'Rectangle',
      circle: 'Circle',
      highlight: 'Highlighter',
      blur: 'Blur/Mosaic',
      text: 'Text',
      step: 'Step ①②③',
    },
  },
  ja: {
    heroBadge: 'キャプチャ＆即時クリップボードコピー',
    heroTitle: 'ワンクリック高精度スクリーンキャプチャ',
    heroSubtitle: 'キャプチャ後にドラッグして領域を選択。マウスを離すだけでクリップボードに自動保存され、すぐに貼り付け可能！',
    btnStartSnip: '🎯 キャプチャを開始して領域を選択',
    step1Title: 'キャプチャ',
    step1Desc: '画面・ウィンドウを選択',
    step2Title: '領域を選択',
    step2Desc: '対象エリアをドラッグ',
    step3Title: '自動コピー＆貼付',
    step3Desc: 'マウスを離すだけでCtrl+V',
    btnCapture: '画面キャプチャ',
    btnPreparing: '準備中...',
    timerInstant: '0秒 (即時)',
    btnPaste: '貼付 (Ctrl+V)',
    btnOpenFile: '画像を開く',
    snipGuideTitle: 'ドラッグして領域を選択',
    snipAutoCopyBadge: 'マウスを離すと自動コピー！',
    snipGuidePrompt: '画像上をドラッグしてキャプチャ領域を指定...',
    btnFullScreen: '全画面を使用',
    bannerAutoCopied: '🎉 クリップボードに自動コピーされました！Ctrl+Vで貼り付けるか、以下で注釈を追加できます。',
    bannerLiveSynced: '🎉 編集内容（矢印・文字等）がクリップボードに自動反映されました！',
    liveSyncBadge: '同期中',
    btnResnip: '領域を再選択',
    btnCopy: '📋 コピー',
    btnCopied: 'コピー完了！',
    btnDownload: '保存',
    btnSnipAnother: '📸 別の領域をキャプチャ',
    sizeLabel: 'サイズ:',
    recentTitle: '最近のキャプチャ',
    btnClearHistory: '履歴をクリア',
    openSnapshot: '開く',
    tools: {
      pen: 'ペン',
      arrow: '矢印',
      rect: '四角形',
      circle: '円',
      highlight: '蛍光ペン',
      blur: 'ぼかし (モザイク)',
      text: 'テキスト',
      step: '連番 ①②③',
    },
  },
};

const COLORS = [
  { value: '#ef4444', label: 'Đỏ' },
  { value: '#f59e0b', label: 'Cam/Vàng' },
  { value: '#10b981', label: 'Xanh Lá' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#8b5cf6', label: 'Tím' },
  { value: '#ec4899', label: 'Hồng' },
  { value: '#ffffff', label: 'Trắng' },
  { value: '#0f172a', label: 'Đen' },
];

const LINE_WIDTHS = [
  { width: 3, label: '3px' },
  { width: 6, label: '6px' },
  { width: 10, label: '10px' },
  { width: 16, label: '16px' },
];

// Helper: Copy canvas to clipboard
async function copyCanvasToClipboard(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error('Không thể tạo image blob từ canvas.'));
        return;
      }
      try {
        if (!navigator.clipboard || !navigator.clipboard.write) {
          throw new Error('Clipboard API không được hỗ trợ trên trình duyệt này.');
        }
        const clipboardItem = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([clipboardItem]);
        resolve(true);
      } catch (err) {
        reject(err);
      }
    }, 'image/png');
  });
}

// Helper: Capture display media
async function captureDisplayMedia(countdownSeconds = 0) {
  if (countdownSeconds > 0) {
    await new Promise((resolve) => setTimeout(resolve, countdownSeconds * 1000));
  }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
    throw new Error('Trình duyệt không hỗ trợ Web Screen Capture API.');
  }

  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: { displaySurface: 'monitor', frameRate: { ideal: 30, max: 60 } },
    audio: false,
  });

  const video = document.createElement('video');
  video.srcObject = stream;
  video.autoplay = true;
  video.muted = true;

  return new Promise((resolve, reject) => {
    video.onloadedmetadata = async () => {
      try {
        await video.play();
        await new Promise((r) => setTimeout(r, 150));

        const width = video.videoWidth;
        const height = video.videoHeight;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Không thể khởi tạo Canvas 2D.');

        ctx.drawImage(video, 0, 0, width, height);
        stream.getTracks().forEach((track) => track.stop());
        video.srcObject = null;

        const dataUrl = canvas.toDataURL('image/png');
        const img = new Image();
        img.onload = () => resolve({ dataUrl, width, height, image: img });
        img.onerror = (err) => reject(err);
        img.src = dataUrl;
      } catch (err) {
        stream.getTracks().forEach((track) => track.stop());
        reject(err);
      }
    };
    video.onerror = (err) => {
      stream.getTracks().forEach((track) => track.stop());
      reject(err);
    };
  });
}

// Helper: Read clipboard image
async function readImageFromClipboard() {
  if (!navigator.clipboard || !navigator.clipboard.read) {
    throw new Error('Trình duyệt chưa cấp quyền đọc Clipboard.');
  }
  const items = await navigator.clipboard.read();
  for (const item of items) {
    for (const type of item.types) {
      if (type.startsWith('image/')) {
        const blob = await item.getType(type);
        const dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
        const img = new Image();
        return new Promise((resolve, reject) => {
          img.onload = () => resolve({ dataUrl, width: img.naturalWidth, height: img.naturalHeight, image: img });
          img.onerror = (err) => reject(err);
          img.src = dataUrl;
        });
      }
    }
  }
  return null;
}

// Helper: Download canvas
function downloadCanvas(canvas, format = 'png') {
  const mimeType = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
  const extension = format === 'jpeg' ? 'jpg' : format;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `snapcraft_${timestamp}.${extension}`;
  const dataUrl = canvas.toDataURL(mimeType, format === 'jpeg' ? 0.92 : 0.95);
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export default function ScreenCaptureView({ displayLang = 'vi' }) {
  const langKey = displayLang === 'en' ? 'en' : displayLang === 'ja' ? 'ja' : 'vi';
  const t = i18n[langKey];

  // Workflow Stage: 'idle' | 'snipping' | 'editing'
  const [stage, setStage] = useState('idle');

  // Image states
  const [rawCaptureImage, setRawCaptureImage] = useState(null);
  const [baseImage, setBaseImage] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [currentCanvas, setCurrentCanvas] = useState(null);

  // Tools state
  const [activeTool, setActiveTool] = useState('pen');
  const [color, setColor] = useState('#ef4444');
  const [lineWidth, setLineWidth] = useState(4);
  const [stepCounter, setStepCounter] = useState(1);

  // Drawing in-progress states
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [currentPoint, setCurrentPoint] = useState(null);
  const [currentPenPoints, setCurrentPenPoints] = useState([]);
  const [textInputPosition, setTextInputPosition] = useState(null);
  const [textInputValue, setTextInputValue] = useState('');

  // Snipping in-progress states
  const [isSelecting, setIsSelecting] = useState(false);
  const [snipStart, setSnipStart] = useState(null);
  const [snipSelection, setSnipSelection] = useState(null);

  // Capture & History states
  const [isCapturing, setIsCapturing] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [selectedFormat, setSelectedFormat] = useState('png');
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('snapcraft_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const fileInputRef = useRef(null);
  const editorCanvasRef = useRef(null);
  const snipCanvasRef = useRef(null);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('snapcraft_history', JSON.stringify(history.slice(0, 12)));
    } catch {}
  }, [history]);

  const handleSaveToHistory = useCallback((dataUrl, w, h) => {
    const newItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      dataUrl,
      width: w,
      height: h,
      title: `Snapshot ${new Date().toLocaleTimeString()}`,
    };
    setHistory((prev) => [newItem, ...prev.filter((h) => h.dataUrl !== dataUrl)].slice(0, 12));
  }, []);

  // Load new raw capture helper -> enter snipping phase immediately
  const handleNewRawCapture = useCallback((img) => {
    setRawCaptureImage(img);
    setAnnotations([]);
    setRedoStack([]);
    setSnipSelection(null);
    setStage('snipping');
  }, []);

  // Handle Capture Action
  const handleCapture = async (count = 0) => {
    setIsCapturing(true);
    try {
      const result = await captureDisplayMedia(count);
      handleNewRawCapture(result.image);
    } catch (err) {
      if (err.name !== 'NotAllowedError' && err.message !== 'Permission denied') {
        console.error('Capture error:', err);
        alert(`Capture error: ${err.message}`);
      }
    } finally {
      setIsCapturing(false);
    }
  };

  // Handle Paste from Clipboard
  const handlePasteClipboard = async () => {
    try {
      const result = await readImageFromClipboard();
      if (result) {
        handleNewRawCapture(result.image);
      } else {
        alert(langKey === 'vi' ? 'Không tìm thấy ảnh trong Clipboard!' : 'No image in clipboard!');
      }
    } catch (err) {
      console.error('Paste error:', err);
      alert(`Paste error: ${err.message}`);
    }
  };

  // Handle Upload local file
  const handleUploadFile = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const img = new Image();
      img.onload = () => handleNewRawCapture(img);
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // AUTO-COPY on Area Confirmation -> Enter Editing Phase
  const handleConfirmArea = useCallback(async (croppedImg) => {
    setBaseImage(croppedImg);
    setAnnotations([]);
    setRedoStack([]);
    setStage('editing');

    try {
      const canvas = document.createElement('canvas');
      canvas.width = croppedImg.naturalWidth;
      canvas.height = croppedImg.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(croppedImg, 0, 0);
        await copyCanvasToClipboard(canvas);

        confetti({
          particleCount: 30,
          spread: 55,
          origin: { y: 0.8 },
          colors: ['#7c3aed', '#06b6d4', '#10b981'],
        });

        const dataUrl = canvas.toDataURL('image/png');
        handleSaveToHistory(dataUrl, canvas.width, canvas.height);
      }
    } catch (err) {
      console.warn('Auto-clipboard notice:', err);
    }
  }, [handleSaveToHistory]);

  // LIVE AUTO-SYNC TO CLIPBOARD ON ANNOTATIONS CHANGE
  useEffect(() => {
    if (stage !== 'editing' || !currentCanvas || !baseImage) return;

    const timer = setTimeout(async () => {
      try {
        await copyCanvasToClipboard(currentCanvas);
        const dataUrl = currentCanvas.toDataURL('image/png');
        handleSaveToHistory(dataUrl, currentCanvas.width, currentCanvas.height);
      } catch (err) {
        console.warn('Live sync notice:', err);
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [annotations, stage, currentCanvas, baseImage, handleSaveToHistory]);

  // Manual Copy Button Handler
  const handleManualCopy = async () => {
    if (!currentCanvas) return;
    try {
      await copyCanvasToClipboard(currentCanvas);
      setIsCopied(true);
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.85 }, colors: ['#7c3aed', '#06b6d4', '#10b981'] });
      setTimeout(() => setIsCopied(false), 3000);
    } catch (err) {
      alert(`Copy error: ${err.message}`);
    }
  };

  // Render Snipping Selector Canvas
  useEffect(() => {
    if (stage !== 'snipping' || !rawCaptureImage || !snipCanvasRef.current) return;
    const canvas = snipCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (canvas.width !== rawCaptureImage.naturalWidth || canvas.height !== rawCaptureImage.naturalHeight) {
      canvas.width = rawCaptureImage.naturalWidth;
      canvas.height = rawCaptureImage.naturalHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(rawCaptureImage, 0, 0);

    if (snipSelection && snipSelection.w > 2 && snipSelection.h > 2) {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(0, 0, canvas.width, snipSelection.y);
      ctx.fillRect(0, snipSelection.y + snipSelection.h, canvas.width, canvas.height - (snipSelection.y + snipSelection.h));
      ctx.fillRect(0, snipSelection.y, snipSelection.x, snipSelection.h);
      ctx.fillRect(snipSelection.x + snipSelection.w, snipSelection.y, canvas.width - (snipSelection.x + snipSelection.w), snipSelection.h);

      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 4]);
      ctx.strokeRect(snipSelection.x, snipSelection.y, snipSelection.w, snipSelection.h);

      const handleSize = 10;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#0891b2';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      [
        { x: snipSelection.x, y: snipSelection.y },
        { x: snipSelection.x + snipSelection.w, y: snipSelection.y },
        { x: snipSelection.x, y: snipSelection.y + snipSelection.h },
        { x: snipSelection.x + snipSelection.w, y: snipSelection.y + snipSelection.h },
      ].forEach((c) => {
        ctx.fillRect(c.x - handleSize / 2, c.y - handleSize / 2, handleSize, handleSize);
        ctx.strokeRect(c.x - handleSize / 2, c.y - handleSize / 2, handleSize, handleSize);
      });
      ctx.restore();
    } else {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
  }, [stage, rawCaptureImage, snipSelection]);

  // Snipping pointer handlers
  const getSnipCoords = (e) => {
    const canvas = snipCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: Math.max(0, Math.min(canvas.width, (e.clientX - rect.left) * scaleX)),
      y: Math.max(0, Math.min(canvas.height, (e.clientY - rect.top) * scaleY)),
    };
  };

  const handleSnipPointerDown = (e) => {
    const pt = getSnipCoords(e);
    setIsSelecting(true);
    setSnipStart(pt);
    setSnipSelection({ x: pt.x, y: pt.y, w: 0, h: 0 });
  };

  const handleSnipPointerMove = (e) => {
    if (!isSelecting || !snipStart) return;
    const pt = getSnipCoords(e);
    const x = Math.min(snipStart.x, pt.x);
    const y = Math.min(snipStart.y, pt.y);
    const w = Math.abs(pt.x - snipStart.x);
    const h = Math.abs(pt.y - snipStart.y);
    setSnipSelection({ x, y, w, h });
  };

  const handleSnipPointerUp = () => {
    setIsSelecting(false);
    if (snipSelection && snipSelection.w >= 15 && snipSelection.h >= 15) {
      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = Math.round(snipSelection.w);
      cropCanvas.height = Math.round(snipSelection.h);
      const cropCtx = cropCanvas.getContext('2d');
      if (!cropCtx) return;

      cropCtx.drawImage(
        rawCaptureImage,
        snipSelection.x,
        snipSelection.y,
        snipSelection.w,
        snipSelection.h,
        0,
        0,
        snipSelection.w,
        snipSelection.h
      );

      const croppedImg = new Image();
      croppedImg.onload = () => handleConfirmArea(croppedImg);
      croppedImg.src = cropCanvas.toDataURL('image/png');
    }
  };

  // Render Editor Canvas
  const drawArrow = (ctx, fromX, fromY, toX, toY, arrowColor, width) => {
    const headlen = Math.max(width * 3.5, 14);
    const angle = Math.atan2(toY - fromY, toX - fromX);
    ctx.save();
    ctx.strokeStyle = arrowColor;
    ctx.fillStyle = arrowColor;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  const drawBlurRect = (ctx, x, y, w, h) => {
    if (w === 0 || h === 0) return;
    const rx = Math.min(x, x + w);
    const ry = Math.min(y, y + h);
    const rw = Math.abs(w);
    const rh = Math.abs(h);
    const blockSize = 14;
    try {
      const imgData = ctx.getImageData(rx, ry, rw, rh);
      const data = imgData.data;
      for (let py = 0; py < rh; py += blockSize) {
        for (let px = 0; px < rw; px += blockSize) {
          let red = 0, green = 0, blue = 0, count = 0;
          for (let dy = 0; dy < blockSize && py + dy < rh; dy++) {
            for (let dx = 0; dx < blockSize && px + dx < rw; dx++) {
              const idx = ((py + dy) * rw + (px + dx)) * 4;
              red += data[idx];
              green += data[idx + 1];
              blue += data[idx + 2];
              count++;
            }
          }
          if (count > 0) {
            red = Math.floor(red / count);
            green = Math.floor(green / count);
            blue = Math.floor(blue / count);
            for (let dy = 0; dy < blockSize && py + dy < rh; dy++) {
              for (let dx = 0; dx < blockSize && px + dx < rw; dx++) {
                const idx = ((py + dy) * rw + (px + dx)) * 4;
                data[idx] = red;
                data[idx + 1] = green;
                data[idx + 2] = blue;
              }
            }
          }
        }
      }
      ctx.putImageData(imgData, rx, ry);
    } catch {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(rx, ry, rw, rh);
    }
  };

  const renderEditorCanvas = useCallback(() => {
    if (stage !== 'editing' || !baseImage || !editorCanvasRef.current) return;
    const canvas = editorCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (canvas.width !== baseImage.naturalWidth || canvas.height !== baseImage.naturalHeight) {
      canvas.width = baseImage.naturalWidth;
      canvas.height = baseImage.naturalHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(baseImage, 0, 0);

    annotations.forEach((ann) => {
      ctx.save();
      if (ann.type === 'pen' && ann.points && ann.points.length > 0) {
        ctx.strokeStyle = ann.color;
        ctx.lineWidth = ann.lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(ann.points[0].x, ann.points[0].y);
        for (let i = 1; i < ann.points.length; i++) ctx.lineTo(ann.points[i].x, ann.points[i].y);
        ctx.stroke();
      } else if (ann.type === 'highlight' && ann.points && ann.points.length > 0) {
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = ann.color;
        ctx.lineWidth = ann.lineWidth * 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(ann.points[0].x, ann.points[0].y);
        for (let i = 1; i < ann.points.length; i++) ctx.lineTo(ann.points[i].x, ann.points[i].y);
        ctx.stroke();
        ctx.restore();
      } else if (ann.type === 'arrow') {
        drawArrow(ctx, ann.startX, ann.startY, ann.endX, ann.endY, ann.color, ann.lineWidth);
      } else if (ann.type === 'rect') {
        ctx.strokeStyle = ann.color;
        ctx.lineWidth = ann.lineWidth;
        ctx.strokeRect(ann.startX, ann.startY, ann.endX - ann.startX, ann.endY - ann.startY);
      } else if (ann.type === 'circle') {
        const rx = Math.abs(ann.endX - ann.startX) / 2;
        const ry = Math.abs(ann.endY - ann.startY) / 2;
        const cx = Math.min(ann.startX, ann.endX) + rx;
        const cy = Math.min(ann.startY, ann.endY) + ry;
        ctx.strokeStyle = ann.color;
        ctx.lineWidth = ann.lineWidth;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (ann.type === 'blur') {
        drawBlurRect(ctx, ann.startX, ann.startY, ann.endX - ann.startX, ann.endY - ann.startY);
      } else if (ann.type === 'text' && ann.text) {
        const fontSize = Math.max(ann.lineWidth * 4, 18);
        ctx.font = `bold ${fontSize}px Inter, sans-serif`;
        const metrics = ctx.measureText(ann.text);
        const padding = 8;
        const textH = fontSize + padding;
        const textW = metrics.width + padding * 2;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = ann.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(ann.startX, ann.startY - fontSize, textW, textH, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.fillText(ann.text, ann.startX + padding, ann.startY - fontSize / 4);
      } else if (ann.type === 'step' && ann.stepNumber) {
        const radius = Math.max(ann.lineWidth * 3.5, 18);
        ctx.fillStyle = ann.color;
        ctx.beginPath();
        ctx.arc(ann.startX, ann.startY, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.round(radius * 1.1)}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ann.stepNumber.toString(), ann.startX, ann.startY);
      }
      ctx.restore();
    });

    if (isDrawing && startPoint && currentPoint) {
      ctx.save();
      if (activeTool === 'pen') {
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(currentPenPoints[0]?.x || startPoint.x, currentPenPoints[0]?.y || startPoint.y);
        for (let i = 1; i < currentPenPoints.length; i++) ctx.lineTo(currentPenPoints[i].x, currentPenPoints[i].y);
        ctx.stroke();
      } else if (activeTool === 'highlight') {
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth * 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(currentPenPoints[0]?.x || startPoint.x, currentPenPoints[0]?.y || startPoint.y);
        for (let i = 1; i < currentPenPoints.length; i++) ctx.lineTo(currentPenPoints[i].x, currentPenPoints[i].y);
        ctx.stroke();
      } else if (activeTool === 'arrow') {
        drawArrow(ctx, startPoint.x, startPoint.y, currentPoint.x, currentPoint.y, color, lineWidth);
      } else if (activeTool === 'rect') {
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.strokeRect(startPoint.x, startPoint.y, currentPoint.x - startPoint.x, currentPoint.y - startPoint.y);
      } else if (activeTool === 'circle') {
        const rx = Math.abs(currentPoint.x - startPoint.x) / 2;
        const ry = Math.abs(currentPoint.y - startPoint.y) / 2;
        const cx = Math.min(startPoint.x, currentPoint.x) + rx;
        const cy = Math.min(startPoint.y, currentPoint.y) + ry;
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (activeTool === 'blur') {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(startPoint.x, startPoint.y, currentPoint.x - startPoint.x, currentPoint.y - startPoint.y);
      }
      ctx.restore();
    }

    setCurrentCanvas(canvas);
  }, [stage, baseImage, annotations, isDrawing, startPoint, currentPoint, currentPenPoints, activeTool, color, lineWidth]);

  useEffect(() => {
    renderEditorCanvas();
  }, [renderEditorCanvas]);

  // Editor pointer handlers
  const getEditorCoords = (e) => {
    const canvas = editorCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleEditorPointerDown = (e) => {
    if (!baseImage) return;
    const pt = getEditorCoords(e);
    setIsDrawing(true);
    setStartPoint(pt);
    setCurrentPoint(pt);

    if (activeTool === 'pen' || activeTool === 'highlight') {
      setCurrentPenPoints([pt]);
    } else if (activeTool === 'text') {
      setTextInputPosition(pt);
      setTextInputValue('');
      setIsDrawing(false);
    } else if (activeTool === 'step') {
      setAnnotations((prev) => [
        ...prev,
        { id: Date.now().toString(), type: 'step', startX: pt.x, startY: pt.y, endX: pt.x, endY: pt.y, color, lineWidth, stepNumber: stepCounter },
      ]);
      setStepCounter((s) => s + 1);
      setIsDrawing(false);
    }
  };

  const handleEditorPointerMove = (e) => {
    if (!isDrawing || !startPoint) return;
    const pt = getEditorCoords(e);
    setCurrentPoint(pt);
    if (activeTool === 'pen' || activeTool === 'highlight') {
      setCurrentPenPoints((prev) => [...prev, pt]);
    }
  };

  const handleEditorPointerUp = () => {
    if (!isDrawing || !startPoint || !currentPoint) {
      setIsDrawing(false);
      return;
    }
    if (activeTool === 'pen' || activeTool === 'highlight') {
      if (currentPenPoints.length > 0) {
        setAnnotations((prev) => [
          ...prev,
          { id: Date.now().toString(), type: activeTool, startX: startPoint.x, startY: startPoint.y, endX: currentPoint.x, endY: currentPoint.y, points: currentPenPoints, color, lineWidth },
        ]);
      }
    } else if (activeTool === 'arrow' || activeTool === 'rect' || activeTool === 'circle' || activeTool === 'blur') {
      const dist = Math.hypot(currentPoint.x - startPoint.x, currentPoint.y - startPoint.y);
      if (dist > 4) {
        setAnnotations((prev) => [
          ...prev,
          { id: Date.now().toString(), type: activeTool, startX: startPoint.x, startY: startPoint.y, endX: currentPoint.x, endY: currentPoint.y, color, lineWidth },
        ]);
      }
    }
    setIsDrawing(false);
    setCurrentPenPoints([]);
  };

  const handleTextSubmit = () => {
    if (textInputPosition && textInputValue.trim()) {
      setAnnotations((prev) => [
        ...prev,
        { id: Date.now().toString(), type: 'text', startX: textInputPosition.x, startY: textInputPosition.y, endX: textInputPosition.x, endY: textInputPosition.y, color, lineWidth, text: textInputValue.trim() },
      ]);
    }
    setTextInputPosition(null);
    setTextInputValue('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-6">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleUploadFile(e.target.files[0]);
            e.target.value = '';
          }
        }}
      />

      {/* Top Capture Bar */}
      <div className="w-full p-4 sm:p-6 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={() => handleCapture(countdown)}
            disabled={isCapturing}
            className="flex-1 sm:flex-none px-6 py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-brand-500/25 transition-all duration-200 flex items-center justify-center space-x-2.5 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
          >
            {isCapturing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{t.btnPreparing}</span>
              </>
            ) : (
              <>
                <Camera className="w-5 h-5" />
                <span>{t.btnCapture}</span>
              </>
            )}
          </button>

          <div className="flex items-center space-x-1.5 p-1.5 rounded-2xl bg-slate-800/80 border border-slate-700/70 text-xs">
            <Clock className="w-4 h-4 text-slate-400 ml-1.5" />
            {[0, 3, 5].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => setCountdown(sec)}
                className={`px-2.5 py-1.5 rounded-xl font-bold transition-all ${
                  countdown === sec ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sec === 0 ? t.timerInstant : `${sec}s`}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={handlePasteClipboard}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold border border-slate-700 transition flex items-center justify-center space-x-2 shadow-sm"
          >
            <Clipboard className="w-4 h-4 text-cyan-400" />
            <span>{t.btnPaste}</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold border border-slate-700 transition flex items-center justify-center space-x-2 shadow-sm"
          >
            <Upload className="w-4 h-4 text-brand-400" />
            <span>{t.btnOpenFile}</span>
          </button>
        </div>
      </div>

      {/* Phase 1: Snipping Area Selection Mode */}
      {stage === 'snipping' && rawCaptureImage && (
        <div className="w-full flex flex-col gap-3 animate-in fade-in duration-300">
          <div className="w-full p-4 rounded-2xl bg-gradient-to-r from-brand-900/80 via-slate-900 to-cyan-900/80 border border-brand-500/50 backdrop-blur-xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-2xl bg-brand-500/20 text-brand-300 border border-brand-500/40 animate-pulse">
                <Move className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <span>{t.snipGuideTitle}</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {t.snipAutoCopyBadge}
                  </span>
                </h3>
                <p className="text-xs text-slate-300">
                  {snipSelection && snipSelection.w > 10 && snipSelection.h > 10
                    ? `${Math.round(snipSelection.w)} × ${Math.round(snipSelection.h)} px`
                    : t.snipGuidePrompt}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => handleConfirmArea(rawCaptureImage)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs border border-slate-700 transition flex items-center space-x-2 cursor-pointer active:scale-95 shadow-sm"
              >
                <Maximize2 className="w-4 h-4 text-cyan-400" />
                <span>{t.btnFullScreen}</span>
              </button>

              <button
                type="button"
                onClick={() => setStage(baseImage ? 'editing' : 'idle')}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400 border border-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="relative w-full rounded-3xl bg-slate-950 border border-slate-800 p-2 sm:p-4 flex items-center justify-center overflow-auto min-h-[450px] max-h-[75vh] shadow-inner select-none cursor-crosshair">
            <canvas
              ref={snipCanvasRef}
              onPointerDown={handleSnipPointerDown}
              onPointerMove={handleSnipPointerMove}
              onPointerUp={handleSnipPointerUp}
              onPointerCancel={handleSnipPointerUp}
              className="max-w-full max-h-[70vh] object-contain rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Phase 2: Annotation & Export Studio */}
      {stage === 'editing' && baseImage && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-300">
          <div className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-slate-900 to-emerald-950/90 border border-emerald-500/60 text-emerald-300 text-xs font-semibold shadow-xl flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{annotations.length > 0 ? t.bannerLiveSynced : t.bannerAutoCopied}</span>
            </div>
            <div className="hidden sm:flex items-center space-x-1 text-[11px] text-emerald-400 bg-emerald-900/40 px-2 py-0.5 rounded-full border border-emerald-500/30">
              <Sparkles className="w-3 h-3" />
              <span>{t.liveSyncBadge}</span>
            </div>
          </div>

          {/* Annotation Toolbar */}
          <div className="w-full p-3 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'pen', label: t.tools.pen, icon: Pencil },
                { id: 'arrow', label: t.tools.arrow, icon: MoveUpRight },
                { id: 'rect', label: t.tools.rect, icon: Square },
                { id: 'circle', label: t.tools.circle, icon: Circle },
                { id: 'highlight', label: t.tools.highlight, icon: Highlighter },
                { id: 'blur', label: t.tools.blur, icon: EyeOff },
                { id: 'text', label: t.tools.text, icon: Type },
                { id: 'step', label: t.tools.step, icon: ListOrdered },
              ].map((toolItem) => {
                const isSelected = activeTool === toolItem.id;
                const Icon = toolItem.icon;
                return (
                  <button
                    key={toolItem.id}
                    type="button"
                    onClick={() => setActiveTool(toolItem.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20 ring-2 ring-brand-500/30'
                        : 'bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{toolItem.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center space-x-3 border-x border-slate-800 px-3">
              <div className="flex items-center space-x-1.5">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    style={{ backgroundColor: c.value }}
                    className={`w-6 h-6 rounded-full transition-transform border ${
                      color === c.value
                        ? 'ring-2 ring-brand-400 ring-offset-2 ring-offset-slate-900 scale-110 border-white'
                        : 'border-slate-600 hover:scale-105'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl">
                {LINE_WIDTHS.map((lw) => (
                  <button
                    key={lw.width}
                    type="button"
                    onClick={() => setLineWidth(lw.width)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold transition ${
                      lineWidth === lw.width ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {lw.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => setStage('snipping')}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 text-xs font-bold border border-slate-700 transition flex items-center space-x-1.5"
              >
                <Crop className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{t.btnResnip}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (annotations.length > 0) {
                    setRedoStack((prev) => [...prev, annotations[annotations.length - 1]]);
                    setAnnotations((prev) => prev.slice(0, -1));
                  }
                }}
                disabled={annotations.length === 0}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-30 transition"
              >
                <Undo2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (redoStack.length > 0) {
                    setAnnotations((prev) => [...prev, redoStack[redoStack.length - 1]]);
                    setRedoStack((prev) => prev.slice(0, -1));
                  }
                }}
                disabled={redoStack.length === 0}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-30 transition"
              >
                <Redo2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setAnnotations([])}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-amber-400 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Canvas Editor */}
          <div className="relative w-full rounded-3xl bg-slate-950 border border-slate-800 p-2 sm:p-4 flex items-center justify-center overflow-auto min-h-[400px] max-h-[75vh] shadow-inner">
            <div className="relative inline-block select-none">
              <canvas
                ref={editorCanvasRef}
                onPointerDown={handleEditorPointerDown}
                onPointerMove={handleEditorPointerMove}
                onPointerUp={handleEditorPointerUp}
                onPointerCancel={handleEditorPointerUp}
                className="max-w-full max-h-[70vh] object-contain rounded-2xl shadow-2xl cursor-crosshair"
              />

              {textInputPosition && (
                <div
                  className="absolute z-30 p-2 rounded-xl bg-slate-900 border border-brand-500 shadow-2xl flex items-center space-x-2 animate-in fade-in"
                  style={{
                    left: `${(textInputPosition.x / (baseImage.naturalWidth || 1)) * 100}%`,
                    top: `${(textInputPosition.y / (baseImage.naturalHeight || 1)) * 100}%`,
                    transform: 'translate(-50%, -100%)',
                  }}
                >
                  <input
                    type="text"
                    autoFocus
                    value={textInputValue}
                    placeholder="Nhập ghi chú..."
                    onChange={(e) => setTextInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleTextSubmit();
                      if (e.key === 'Escape') setTextInputPosition(null);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-400"
                  />
                  <button
                    type="button"
                    onClick={handleTextSubmit}
                    className="px-2.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold"
                  >
                    OK
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Actions: Copy to Clipboard, Download & Snip Another */}
          <div className="w-full p-4 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => handleCapture(countdown)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-brand-300 hover:text-white font-extrabold text-xs border border-slate-700 transition flex items-center space-x-2 shadow-sm"
              >
                <Camera className="w-4 h-4" />
                <span>{t.btnSnipAnother}</span>
              </button>

              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <ImageIcon className="w-4 h-4 text-brand-400" />
                <span>
                  {t.sizeLabel}{' '}
                  <strong className="text-slate-200 font-mono">
                    {baseImage ? `${baseImage.naturalWidth} × ${baseImage.naturalHeight} px` : ''}
                  </strong>
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleManualCopy}
                className={`flex-1 sm:flex-none px-6 py-3 rounded-2xl font-extrabold text-xs shadow-xl transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer active:scale-95 ${
                  isCopied
                    ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                    : 'bg-gradient-to-r from-brand-600 via-brand-500 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 text-white shadow-brand-500/25'
                }`}
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>{t.btnCopied}</span>
                  </>
                ) : (
                  <>
                    <Clipboard className="w-4 h-4" />
                    <span>{t.btnCopy}</span>
                  </>
                )}
              </button>

              <div className="relative flex items-center rounded-2xl bg-slate-800 border border-slate-700/80 overflow-visible">
                <button
                  type="button"
                  onClick={() => currentCanvas && downloadCanvas(currentCanvas, selectedFormat)}
                  className="px-4 py-3 text-slate-200 hover:text-white font-bold text-xs flex items-center space-x-1.5 hover:bg-slate-700/50 transition rounded-l-2xl"
                >
                  <Download className="w-4 h-4 text-brand-400" />
                  <span>{t.btnDownload}</span>
                  <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-brand-300 font-mono font-bold">
                    .{selectedFormat}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowFormatDropdown(!showFormatDropdown)}
                  className="px-2 py-3 text-slate-400 hover:text-white border-l border-slate-700 hover:bg-slate-700/50 transition rounded-r-2xl"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {showFormatDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-32 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-1 z-30 space-y-1">
                    {['png', 'jpeg', 'webp'].map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => {
                          setSelectedFormat(fmt);
                          setShowFormatDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold uppercase font-mono transition flex items-center justify-between ${
                          selectedFormat === fmt ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span>.{fmt}</span>
                        {selectedFormat === fmt && <Check className="w-3 h-3" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phase 0 / Idle State: Ultra-Intuitive Hero Landing */}
      {stage === 'idle' && (
        <div className="w-full flex flex-col items-center justify-center py-12 px-4 rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-900/60 to-slate-950 border border-slate-800 shadow-2xl text-center space-y-8">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/25 text-brand-300 text-xs font-extrabold tracking-wide">
              <Zap className="w-3.5 h-3.5 text-brand-400" />
              <span>{t.heroBadge}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              {t.heroTitle}
            </h2>
            <p className="text-sm text-slate-400 max-w-lg mx-auto">
              {t.heroSubtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleCapture(countdown)}
            disabled={isCapturing}
            className="relative group px-8 sm:px-10 py-5 rounded-3xl bg-gradient-to-r from-brand-600 via-indigo-600 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 text-white font-black text-base sm:text-lg shadow-2xl shadow-brand-500/30 transition-all duration-300 flex items-center space-x-3 cursor-pointer active:scale-95"
          >
            <Camera className="w-6 h-6 group-hover:rotate-12 transition-transform" />
            <span>{t.btnStartSnip}</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl w-full pt-4">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center space-x-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-black text-sm flex-shrink-0">
                1
              </div>
              <div>
                <div className="text-xs font-bold text-slate-200">{t.step1Title}</div>
                <div className="text-[11px] text-slate-400">{t.step1Desc}</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center space-x-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black text-sm flex-shrink-0">
                2
              </div>
              <div>
                <div className="text-xs font-bold text-slate-200">{t.step2Title}</div>
                <div className="text-[11px] text-slate-400">{t.step2Desc}</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center space-x-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-sm flex-shrink-0">
                3
              </div>
              <div>
                <div className="text-xs font-bold text-slate-200">{t.step3Title}</div>
                <div className="text-[11px] text-slate-400">{t.step3Desc}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Gallery */}
      {history.length > 0 && (
        <div className="w-full p-5 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <History className="w-4 h-4 text-brand-400" />
              <span>{t.recentTitle} ({history.length})</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setHistory([]);
                localStorage.removeItem('snapcraft_history');
              }}
              className="text-xs text-slate-400 hover:text-red-400 flex items-center space-x-1 p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.btnClearHistory}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  const img = new Image();
                  img.onload = () => {
                    setRawCaptureImage(img);
                    setBaseImage(img);
                    setAnnotations([]);
                    setRedoStack([]);
                    setStage('editing');
                  };
                  img.src = item.dataUrl;
                }}
                className="group relative rounded-2xl bg-slate-950 border border-slate-800 hover:border-brand-500 overflow-hidden cursor-pointer transition-all duration-200 shadow-md flex flex-col justify-between"
              >
                <div className="aspect-video w-full bg-slate-900 overflow-hidden flex items-center justify-center">
                  <img
                    src={item.dataUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
                <div className="p-2 bg-slate-900/80 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-mono">{item.width}×{item.height}</span>
                  <span className="group-hover:text-brand-400 font-bold transition">
                    {t.openSnapshot} →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
