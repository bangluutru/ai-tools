import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  IMAGE_INPUT_LIMITS,
  rejectionMessages,
  validateDocumentFiles,
  verifyDocumentSignature,
} from '../utils/documentFiles.js';
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
  Crop,
  Check,
  Download,
  ChevronDown,
  Image as ImageIcon,
  History,
  CheckCircle2,
  Zap,
  ShieldCheck,
  RefreshCw,
  Copy,
  Keyboard,
  Layers,
  ChevronRight,
} from 'lucide-react';

// =====================================================================
// Translations & Design Constants
// =====================================================================
const i18n = {
  vi: {
    breadcrumbCategory: 'Tiện ích & Studio',
    toolTitle: 'Chụp Màn Hình & Chú Thích Studio',
    pipelineId: 'PIPELINE ID: CAPTURE-ANNOTATE-V2.4.8-STU',
    tagStudio: 'Studio',
    tagOffline: 'Offline Client-Side',
    tagVector: 'Vector Annotate',
    btnDrafts: 'Lịch sử nháp',
    btnShortcuts: 'Phím tắt',
    toolDesc:
      'Chụp trực tiếp từ màn hình/cửa sổ/tab hoặc dán nhanh ảnh chụp màn hình (Ctrl+V) từ Clipboard. Thêm đánh số bước tự động (1, 2, 3), làm mờ che vùng nhạy cảm (Blur/Pixelate), viền mũi tên, hộp nổi bật, bo góc mượt mà và xuất ảnh sắc nét chuẩn HD/Retina.',
    privacyTitle: 'BẢO MẬT CLIENT-SIDE 100%',
    privacyBadge: 'ISO-27001 ISOLATED',
    privacyDesc:
      'Toàn bộ xử lý hình ảnh và gắn nhãn vẽ vector diễn ra trực tiếp trong bộ nhớ RAM trình duyệt của bạn với Canvas API, không gửi bất kỳ ảnh màn hình nào lên server.',
    step1Title: 'Thu Nhận & Tải Ảnh Màn Hình',
    step1Ready: 'Sẵn sàng',
    btnCaptureApi: 'Chụp Màn Hình / Tab (Screen Capture API)',
    btnPreparing: 'Đang khởi tạo máy ảnh...',
    timerInstant: '0s (Tức thì)',
    dropzoneTitle: 'Bấm Ctrl + V để dán trực tiếp từ Clipboard',
    dropzoneSubtitle: 'hoặc kéo thả tệp ảnh (PNG, JPG, WebP tối đa 50MB)',
    loadedBadge: 'ĐÃ NẠP SẴN SÀNG',
    btnReplace: 'Thay ảnh',
    btnClear: 'Xóa ảnh',
    step2Title: 'Hộp Công Cụ Chú Thích & Tùy Biến',
    step2Badge: 'VECTOR GRAPHICS',
    tools: {
      step: 'Đánh số bước',
      stepSub: 'Tự động (1, 2, 3)',
      arrow: 'Mũi tên chỉ dẫn',
      arrowSub: 'Arrow & Callout',
      rect: 'Khung nổi bật',
      rectSub: 'Focus Rectangle',
      circle: 'Hình tròn',
      circleSub: 'Oval & Circle',
      blur: 'Làm mờ & Che',
      blurSub: 'Blur / Pixelate',
      pen: 'Bút vẽ',
      penSub: 'Freehand Line',
      highlight: 'Dạ quang',
      highlightSub: 'Glow Highlight',
      text: 'Thêm chữ viết',
      textSub: 'Rich Text Note',
    },
    labelAccentColor: 'Màu sắc điểm nhấn:',
    labelStepStyle: 'Kiểu dáng số bước:',
    stepStyleSolid: 'Nền đặc',
    stepStyleOutline: 'Viền nét',
    stepStyleGlow: 'Hào quang',
    labelBlurIntensity: 'Cường độ làm mờ bảo mật:',
    labelCornerRadius: 'Bo góc ảnh xuất khẩu:',
    labelEffects: 'Viền đệm & Đổ bóng:',
    softShadow: 'Soft Shadow',
    paddingCanvas: 'Padding 32px',
    primaryCta: 'Kết Xuất Ảnh Chú Thích Siêu Nét (.PNG / Retina)',
    previewTitle: 'Khung Trực Quan Tương Tác',
    previewBadge: 'LIVE WORKSPACE',
    btnUndo: 'Hoàn tác (Ctrl+Z)',
    btnRedo: 'Làm lại (Ctrl+Y)',
    btnClearAll: 'Xóa tất cả lớp vẽ',
    btnResnip: 'Cắt / Chọn lại vùng',
    btnFullScreen: 'Lấy toàn màn hình',
    snipGuideTitle: 'Kéo chuột để chọn vùng cần cắt',
    snipAutoCopyBadge: 'Nhả chuột = Tự động Copy Clipboard!',
    bannerLiveSynced: '🎉 Đã tự động cập nhật vào Clipboard (Bao gồm đầy đủ nét vẽ vừa chỉnh sửa)!',
    bannerAutoCopied: '🎉 Đã tự động copy vào Clipboard! Nhấn Ctrl+V để dán ngay hoặc vẽ thêm chú thích bên dưới.',
    metricDimensions: 'KÍCH THƯỚC THÀNH PHẨM',
    metricScale: 'Scale 2x Retina UHD',
    metricSize: 'DUNG LƯỢNG ƯỚC TÍNH',
    metricLossless: 'Nén lossless PNG',
    metricLayers: 'LỚP CHÚ THÍCH (LAYERS)',
    metricActive: 'Lớp Active',
    btnDownloadEmerald: 'Tải Ảnh PNG Siêu Nét (Độ phân giải cao)',
    btnCopy: 'Sao chép ảnh (Ctrl+C)',
    btnCopied: 'Đã Sao Chép!',
    assuranceTitle: 'Tiêu Chuẩn Đồ Họa & Bảo Mật Dữ Liệu',
    card1Title: 'Chụp Chuẩn Screen Capture API',
    card1Desc:
      'Bảo đảm tỷ lệ điểm ảnh chuẩn Retina với DPR 2.0x hoặc 3.0x gốc từ hệ thống. Ảnh giữ nguyên độ sắc nét cao nhất, văn bản hiển thị trong suốt không bị mờ nhòe răng cưa ngay cả khi trình chiếu trên màn hình 4K.',
    card2Title: 'Bảo Vệ Quyền Riêng Tư (Censorship)',
    card2Desc:
      'Thuật toán che mờ tác động trực tiếp lên mảng byte điểm ảnh (RGBA pixel data) trên Canvas trước khi render, bảo đảm dữ liệu số thẻ, mật khẩu hoặc danh tính cá nhân không thể bị dịch ngược hay khôi phục.',
    card3Title: 'Khung Ảnh Chuẩn Khổ Truyền Thông',
    card3Desc:
      'Tự động thiết lập vùng viền đệm mềm mại (Padding 32px Canvas) cùng hiệu ứng đổ bóng đa lớp studio (Soft Shadow). Ảnh xuất bản sẵn sàng để nhúng ngay vào tài liệu kỹ thuật, Notion, Slack hoặc Jira.',
    emptyStagePrompt: 'Chưa có ảnh nào được nạp',
    emptyStageDesc: 'Bấm nút chụp màn hình, dán ảnh từ Clipboard (Ctrl+V) hoặc tải tệp lên để bắt đầu biên tập chú thích.',
  },
  en: {
    breadcrumbCategory: 'Utilities & Studio',
    toolTitle: 'Screen Capture & Annotation Studio',
    pipelineId: 'PIPELINE ID: CAPTURE-ANNOTATE-V2.4.8-STU',
    tagStudio: 'Studio',
    tagOffline: 'Offline Client-Side',
    tagVector: 'Vector Annotate',
    btnDrafts: 'Draft History',
    btnShortcuts: 'Shortcuts',
    toolDesc:
      'Capture directly from screen/window/tab or paste screenshots (Ctrl+V) from Clipboard. Add auto step numbers (1, 2, 3), blur/pixelate sensitive areas, arrows, focus boxes, smooth corners, and export ultra-sharp HD/Retina images.',
    privacyTitle: '100% CLIENT-SIDE PRIVACY',
    privacyBadge: 'ISO-27001 ISOLATED',
    privacyDesc:
      'All image processing and vector annotation take place directly in your browser memory via the Canvas API. No screenshots are ever sent to any server.',
    step1Title: 'Acquire & Load Screenshot',
    step1Ready: 'Ready',
    btnCaptureApi: 'Capture Screen / Tab (Screen Capture API)',
    btnPreparing: 'Initializing display capture...',
    timerInstant: '0s (Instant)',
    dropzoneTitle: 'Press Ctrl + V to paste directly from Clipboard',
    dropzoneSubtitle: 'or drag and drop an image file (PNG, JPG, WebP up to 50MB)',
    loadedBadge: 'READY LOADED',
    btnReplace: 'Replace',
    btnClear: 'Remove',
    step2Title: 'Annotation & Customization Toolbox',
    step2Badge: 'VECTOR GRAPHICS',
    tools: {
      step: 'Step counter',
      stepSub: 'Auto (1, 2, 3)',
      arrow: 'Guide arrow',
      arrowSub: 'Arrow & Callout',
      rect: 'Focus frame',
      rectSub: 'Focus Rectangle',
      circle: 'Circle',
      circleSub: 'Oval & Circle',
      blur: 'Blur & Mask',
      blurSub: 'Blur / Pixelate',
      pen: 'Brush',
      penSub: 'Freehand Line',
      highlight: 'Highlighter',
      highlightSub: 'Glow Highlight',
      text: 'Text note',
      textSub: 'Rich Text Note',
    },
    labelAccentColor: 'Accent Color:',
    labelStepStyle: 'Step Badge Style:',
    stepStyleSolid: 'Solid',
    stepStyleOutline: 'Outline',
    stepStyleGlow: 'Glow',
    labelBlurIntensity: 'Censorship Blur Intensity:',
    labelCornerRadius: 'Export Corner Radius:',
    labelEffects: 'Padding & Shadow:',
    softShadow: 'Soft Shadow',
    paddingCanvas: 'Padding 32px',
    primaryCta: 'Export Ultra-Sharp Annotation Image (.PNG / Retina)',
    previewTitle: 'Interactive Live Viewport',
    previewBadge: 'LIVE WORKSPACE',
    btnUndo: 'Undo (Ctrl+Z)',
    btnRedo: 'Redo (Ctrl+Y)',
    btnClearAll: 'Clear all layers',
    btnResnip: 'Resnip / Crop area',
    btnFullScreen: 'Use Full Screen',
    snipGuideTitle: 'Drag over image to select region',
    snipAutoCopyBadge: 'Release mouse = Auto-Copied to Clipboard!',
    bannerLiveSynced: '🎉 Clipboard automatically updated with your latest annotations!',
    bannerAutoCopied: '🎉 Auto-copied to Clipboard! Press Ctrl+V to paste into Slack/Zalo or annotate below.',
    metricDimensions: 'FINAL DIMENSIONS',
    metricScale: 'Scale 2x Retina UHD',
    metricSize: 'ESTIMATED SIZE',
    metricLossless: 'Lossless PNG',
    metricLayers: 'ANNOTATION LAYERS',
    metricActive: 'Active Layers',
    btnDownloadEmerald: 'Download Ultra-HD PNG Image',
    btnCopy: 'Copy Image (Ctrl+C)',
    btnCopied: 'Copied!',
    assuranceTitle: 'Graphic Standards & Data Security',
    card1Title: 'Retina-Calibrated Screen Capture API',
    card1Desc:
      'Guarantees system-native DPR 2.0x/3.0x pixel ratios. Images preserve pristine clarity and crisp typography without blur on 4K monitors.',
    card2Title: 'Privacy-First Pixel Censorship',
    card2Desc:
      'The blur algorithm operates directly on Canvas RGBA pixel byte arrays, preventing reversal or recovery of masked confidential information.',
    card3Title: 'Publication-Ready Studio Framing',
    card3Desc:
      'Automatically applies 32px canvas padding with multi-layer ambient shadow, ready for direct embedding into Notion, Slack, Jira, or technical wikis.',
    emptyStagePrompt: 'No screenshot loaded yet',
    emptyStageDesc: 'Click the capture button, paste from clipboard (Ctrl+V), or upload an image file to start editing.',
  },
};

const COLOR_PALETTE = [
  { value: '#0ea5e9', label: 'Sky Blue (Primary)' },
  { value: '#10b981', label: 'Emerald Green' },
  { value: '#f59e0b', label: 'Amber Orange' },
  { value: '#ef4444', label: 'Rose Red' },
  { value: '#8b5cf6', label: 'Indigo Purple' },
  { value: '#64748b', label: 'Slate Gray' },
];

const CORNER_OPTIONS = [
  { value: 0, label: '0px' },
  { value: 8, label: '8px' },
  { value: 16, label: '16px' },
  { value: 24, label: '24px' },
];

// Helper: Copy canvas to clipboard as image/png
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

// Helper: Format bytes
function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 KB';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function ScreenCaptureView({ displayLang = 'vi' }) {
  const langKey = displayLang === 'en' ? 'en' : 'vi';
  const t = i18n[langKey];

  // Workflow Stage: 'idle' | 'snipping' | 'editing'
  const [fileError, setFileError] = useState('');
  const [stage, setStage] = useState('idle');

  // Image states
  const [rawCaptureImage, setRawCaptureImage] = useState(null);
  const [baseImage, setBaseImage] = useState(null);
  const [loadedFileName, setLoadedFileName] = useState('screenshot_capture.png');
  const [loadedFileSize, setLoadedFileSize] = useState(0);

  // Annotations
  const [annotations, setAnnotations] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [currentCanvas, setCurrentCanvas] = useState(null);

  // Tools state
  const [activeTool, setActiveTool] = useState('step'); // default 'step' per mockup
  const [color, setColor] = useState('#0ea5e9'); // default primary sky blue
  const [stepBadgeStyle, setStepBadgeStyle] = useState('solid'); // 'solid' | 'outline' | 'glow'
  const [blurIntensity, setBlurIntensity] = useState(12);
  const [cornerRadius, setCornerRadius] = useState(16);
  const [enableSoftShadow, setEnableSoftShadow] = useState(true);
  const [enablePadding, setEnablePadding] = useState(true);
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
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [zoomFit, setZoomFit] = useState(true);

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
      localStorage.setItem('snapcraft_history', JSON.stringify(history.slice(0, 16)));
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
    setHistory((prev) => [newItem, ...prev.filter((h) => h.dataUrl !== dataUrl)].slice(0, 16));
  }, []);

  // Load new raw capture helper -> enter snipping phase immediately
  const handleNewRawCapture = useCallback((img, fileName = 'screenshot_capture.png', sizeBytes = 0) => {
    setRawCaptureImage(img);
    setLoadedFileName(fileName);
    setLoadedFileSize(sizeBytes || Math.round(img.naturalWidth * img.naturalHeight * 0.8));
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
      const timeStr = new Date().toISOString().replace(/[:.]/g, '-').slice(11, 19);
      handleNewRawCapture(result.image, `screenshot_${timeStr}.png`);
    } catch (err) {
      if (err.name !== 'NotAllowedError' && err.message !== 'Permission denied') {
        console.error('Capture error:', err);
        setFileError(`Capture error: ${err.message}`);
      }
    } finally {
      setIsCapturing(false);
    }
  };

  // Handle Paste from Clipboard
  const handlePasteClipboard = useCallback(async () => {
    try {
      const result = await readImageFromClipboard();
      if (result) {
        const timeStr = new Date().toISOString().replace(/[:.]/g, '-').slice(11, 19);
        handleNewRawCapture(result.image, `clipboard_${timeStr}.png`);
      } else {
        setFileError(langKey === 'vi' ? 'Không tìm thấy ảnh trong Clipboard!' : 'No image in clipboard!');
      }
    } catch (err) {
      console.error('Paste error:', err);
      setFileError(`Paste error: ${err.message}`);
    }
  }, [handleNewRawCapture, langKey]);

  // Global paste event listener
  useEffect(() => {
    const onWindowPaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = () => {
              const img = new Image();
              img.onload = () => {
                const timeStr = new Date().toISOString().replace(/[:.]/g, '-').slice(11, 19);
                handleNewRawCapture(img, `clipboard_${timeStr}.png`, blob.size);
              };
              img.src = reader.result;
            };
            reader.readAsDataURL(blob);
            e.preventDefault();
            break;
          }
        }
      }
    };
    window.addEventListener('paste', onWindowPaste);
    return () => window.removeEventListener('paste', onWindowPaste);
  }, [handleNewRawCapture]);

  // Handle Upload local file
  const handleUploadFile = async (file) => {
    const validation = validateDocumentFiles([file], [], IMAGE_INPUT_LIMITS);
    if (validation.accepted.length === 0) {
      setFileError(rejectionMessages(validation.rejected).join(' • '));
      return;
    }
    if (!(await verifyDocumentSignature(file))) {
      setFileError(`${file.name}: nội dung không phải ảnh hợp lệ`);
      return;
    }
    setFileError('');

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const img = new Image();
      img.onload = () => handleNewRawCapture(img, file.name, file.size);
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // AUTO-COPY on Area Confirmation -> Enter Editing Phase
  const handleConfirmArea = useCallback(
    async (croppedImg) => {
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
            particleCount: 25,
            spread: 50,
            origin: { y: 0.8 },
            colors: ['#0ea5e9', '#4edea3', '#ffb86e'],
          });

          const dataUrl = canvas.toDataURL('image/png');
          handleSaveToHistory(dataUrl, canvas.width, canvas.height);
        }
      } catch (err) {
        console.warn('Auto-clipboard notice:', err);
      }
    },
    [handleSaveToHistory]
  );

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
      ctx.fillStyle = 'rgba(9, 13, 22, 0.65)';
      ctx.fillRect(0, 0, canvas.width, snipSelection.y);
      ctx.fillRect(0, snipSelection.y + snipSelection.h, canvas.width, canvas.height - (snipSelection.y + snipSelection.h));
      ctx.fillRect(0, snipSelection.y, snipSelection.x, snipSelection.h);
      ctx.fillRect(snipSelection.x + snipSelection.w, snipSelection.y, canvas.width - (snipSelection.x + snipSelection.w), snipSelection.h);

      ctx.strokeStyle = '#0ea5e9';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 4]);
      ctx.strokeRect(snipSelection.x, snipSelection.y, snipSelection.w, snipSelection.h);

      const handleSize = 10;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#0284c7';
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
      ctx.fillStyle = 'rgba(9, 13, 22, 0.4)';
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

  // Render Editor Canvas Helpers
  const drawArrow = (ctx, fromX, fromY, toX, toY, arrowColor, width) => {
    const headlen = Math.max(width * 3.5, 16);
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

  const drawBlurRect = useCallback((ctx, x, y, w, h) => {
    if (w === 0 || h === 0) return;
    const rx = Math.min(x, x + w);
    const ry = Math.min(y, y + h);
    const rw = Math.abs(w);
    const rh = Math.abs(h);
    const blockSize = Math.max(4, blurIntensity);
    try {
      const imgData = ctx.getImageData(rx, ry, rw, rh);
      const data = imgData.data;
      for (let py = 0; py < rh; py += blockSize) {
        for (let px = 0; px < rw; px += blockSize) {
          let red = 0,
            green = 0,
            blue = 0,
            count = 0;
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
      ctx.fillStyle = 'rgba(11, 19, 38, 0.85)';
      ctx.fillRect(rx, ry, rw, rh);
    }
  }, [blurIntensity]);

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
        ctx.lineWidth = ann.lineWidth || 4;
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
        ctx.lineWidth = (ann.lineWidth || 4) * 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(ann.points[0].x, ann.points[0].y);
        for (let i = 1; i < ann.points.length; i++) ctx.lineTo(ann.points[i].x, ann.points[i].y);
        ctx.stroke();
        ctx.restore();
      } else if (ann.type === 'arrow') {
        drawArrow(ctx, ann.startX, ann.startY, ann.endX, ann.endY, ann.color, ann.lineWidth || 4);
      } else if (ann.type === 'rect') {
        ctx.strokeStyle = ann.color;
        ctx.lineWidth = ann.lineWidth || 4;
        ctx.strokeRect(ann.startX, ann.startY, ann.endX - ann.startX, ann.endY - ann.startY);
      } else if (ann.type === 'circle') {
        const rx = Math.abs(ann.endX - ann.startX) / 2;
        const ry = Math.abs(ann.endY - ann.startY) / 2;
        const cx = Math.min(ann.startX, ann.endX) + rx;
        const cy = Math.min(ann.startY, ann.endY) + ry;
        ctx.strokeStyle = ann.color;
        ctx.lineWidth = ann.lineWidth || 4;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (ann.type === 'blur') {
        drawBlurRect(ctx, ann.startX, ann.startY, ann.endX - ann.startX, ann.endY - ann.startY);
      } else if (ann.type === 'text' && ann.text) {
        const fontSize = Math.max((ann.lineWidth || 4) * 4, 18);
        ctx.font = `bold ${fontSize}px Inter, sans-serif`;
        const metrics = ctx.measureText(ann.text);
        const padding = 8;
        const textH = fontSize + padding;
        const textW = metrics.width + padding * 2;
        ctx.fillStyle = 'rgba(11, 19, 38, 0.9)';
        ctx.strokeStyle = ann.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(ann.startX, ann.startY - fontSize, textW, textH, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.fillText(ann.text, ann.startX + padding, ann.startY - fontSize / 4);
      } else if (ann.type === 'step' && ann.stepNumber) {
        const radius = Math.max((ann.lineWidth || 4) * 3.5, 18);
        if (ann.badgeStyle === 'outline') {
          ctx.fillStyle = 'rgba(11, 19, 38, 0.85)';
          ctx.beginPath();
          ctx.arc(ann.startX, ann.startY, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = ann.color;
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.fillStyle = ann.color;
        } else if (ann.badgeStyle === 'glow') {
          ctx.shadowColor = ann.color;
          ctx.shadowBlur = 12;
          ctx.fillStyle = ann.color;
          ctx.beginPath();
          ctx.arc(ann.startX, ann.startY, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = '#ffffff';
        } else {
          // Solid
          ctx.fillStyle = ann.color;
          ctx.beginPath();
          ctx.arc(ann.startX, ann.startY, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = '#ffffff';
        }
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
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(currentPenPoints[0]?.x || startPoint.x, currentPenPoints[0]?.y || startPoint.y);
        for (let i = 1; i < currentPenPoints.length; i++) ctx.lineTo(currentPenPoints[i].x, currentPenPoints[i].y);
        ctx.stroke();
      } else if (activeTool === 'highlight') {
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = color;
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(currentPenPoints[0]?.x || startPoint.x, currentPenPoints[0]?.y || startPoint.y);
        for (let i = 1; i < currentPenPoints.length; i++) ctx.lineTo(currentPenPoints[i].x, currentPenPoints[i].y);
        ctx.stroke();
      } else if (activeTool === 'arrow') {
        drawArrow(ctx, startPoint.x, startPoint.y, currentPoint.x, currentPoint.y, color, 4);
      } else if (activeTool === 'rect') {
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.strokeRect(startPoint.x, startPoint.y, currentPoint.x - startPoint.x, currentPoint.y - startPoint.y);
      } else if (activeTool === 'circle') {
        const rx = Math.abs(currentPoint.x - startPoint.x) / 2;
        const ry = Math.abs(currentPoint.y - startPoint.y) / 2;
        const cx = Math.min(startPoint.x, currentPoint.x) + rx;
        const cy = Math.min(startPoint.y, currentPoint.y) + ry;
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (activeTool === 'blur') {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(startPoint.x, startPoint.y, currentPoint.x - startPoint.x, currentPoint.y - startPoint.y);
      }
      ctx.restore();
    }

    setCurrentCanvas(canvas);
  }, [
    stage,
    baseImage,
    annotations,
    isDrawing,
    startPoint,
    currentPoint,
    currentPenPoints,
    activeTool,
    color,
    drawBlurRect,
  ]);

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
        {
          id: Date.now().toString(),
          type: 'step',
          startX: pt.x,
          startY: pt.y,
          endX: pt.x,
          endY: pt.y,
          color,
          badgeStyle: stepBadgeStyle,
          lineWidth: 4,
          stepNumber: stepCounter,
        },
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
          {
            id: Date.now().toString(),
            type: activeTool,
            startX: startPoint.x,
            startY: startPoint.y,
            endX: currentPoint.x,
            endY: currentPoint.y,
            points: currentPenPoints,
            color,
            lineWidth: 4,
          },
        ]);
      }
    } else if (
      activeTool === 'arrow' ||
      activeTool === 'rect' ||
      activeTool === 'circle' ||
      activeTool === 'blur'
    ) {
      const dist = Math.hypot(currentPoint.x - startPoint.x, currentPoint.y - startPoint.y);
      if (dist > 4) {
        setAnnotations((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            type: activeTool,
            startX: startPoint.x,
            startY: startPoint.y,
            endX: currentPoint.x,
            endY: currentPoint.y,
            color,
            lineWidth: 4,
          },
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
        {
          id: Date.now().toString(),
          type: 'text',
          startX: textInputPosition.x,
          startY: textInputPosition.y,
          endX: textInputPosition.x,
          endY: textInputPosition.y,
          color,
          lineWidth: 4,
          text: textInputValue.trim(),
        },
      ]);
    }
    setTextInputPosition(null);
    setTextInputValue('');
  };

  // Helper to generate the export-ready canvas (incorporating padding & soft shadow if toggled)
  const getExportCanvas = () => {
    if (!currentCanvas) return null;
    if (!enablePadding && cornerRadius === 0) {
      return currentCanvas;
    }

    const padding = enablePadding ? 32 : 0;
    const finalW = currentCanvas.width + padding * 2;
    const finalH = currentCanvas.height + padding * 2;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = finalW;
    exportCanvas.height = finalH;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return currentCanvas;

    if (enablePadding) {
      // Elegant dark studio gradient canvas frame
      const grad = ctx.createLinearGradient(0, 0, finalW, finalH);
      grad.addColorStop(0, '#171f33');
      grad.addColorStop(0.5, '#0b1326');
      grad.addColorStop(1, '#131b2e');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, finalW, finalH);
    }

    ctx.save();
    if (enableSoftShadow) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 12;
    }

    if (cornerRadius > 0) {
      ctx.beginPath();
      ctx.roundRect(padding, padding, currentCanvas.width, currentCanvas.height, cornerRadius);
      ctx.clip();
    }

    ctx.drawImage(currentCanvas, padding, padding);
    ctx.restore();

    return exportCanvas;
  };

  // Manual Copy Handler with visual feedback
  const handleManualCopy = async () => {
    const canvasToCopy = getExportCanvas() || currentCanvas;
    if (!canvasToCopy) return;
    try {
      await copyCanvasToClipboard(canvasToCopy);
      setIsCopied(true);
      confetti({
        particleCount: 30,
        spread: 55,
        origin: { y: 0.85 },
        colors: ['#0ea5e9', '#4edea3', '#ffb86e'],
      });
      setTimeout(() => setIsCopied(false), 2500);
    } catch (err) {
      setFileError(`Copy error: ${err.message}`);
    }
  };

  // Export / Download Handler
  const handleDownload = (format = selectedFormat) => {
    const canvasToExport = getExportCanvas() || currentCanvas;
    if (!canvasToExport) return;

    const mimeType = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
    const extension = format === 'jpeg' ? 'jpg' : format;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `snapcraft_${timestamp}.${extension}`;
    const dataUrl = canvasToExport.toDataURL(mimeType, format === 'jpeg' ? 0.92 : 0.95);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    confetti({
      particleCount: 25,
      spread: 50,
      origin: { y: 0.85 },
      colors: ['#059669', '#4edea3', '#38bdf8'],
    });
  };

  // Compute metrics for the strip
  const previewWidth = baseImage ? baseImage.naturalWidth : rawCaptureImage ? rawCaptureImage.naturalWidth : 0;
  const previewHeight = baseImage ? baseImage.naturalHeight : rawCaptureImage ? rawCaptureImage.naturalHeight : 0;
  const layerCount = annotations.length;

  return (
    <div className="flex flex-col w-full text-on-surface">
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

      {/* ERROR BANNER */}
      {fileError && (
        <div className="mb-space-4 p-space-3 bg-error-container/20 border border-error/30 rounded-xl flex items-center justify-between gap-space-3 text-error">
          <div className="flex items-center gap-space-2 text-sm">
            <span className="font-semibold">Lỗi:</span>
            <span>{fileError}</span>
          </div>
          <button
            type="button"
            onClick={() => setFileError('')}
            className="p-1 hover:bg-error-container/40 rounded transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* BREADCRUMB */}
      <nav className="flex items-center gap-space-2 text-on-surface-variant font-body-sm text-body-sm mb-space-4">
        <a href="#" className="hover:text-primary transition-colors flex items-center gap-space-1">
          <span className="material-symbols-outlined text-[16px]">home</span>
          <span>Trang chủ</span>
        </a>
        <span className="text-outline">/</span>
        <a href="#" className="hover:text-primary transition-colors">
          {t.breadcrumbCategory}
        </a>
        <span className="text-outline">/</span>
        <span className="text-on-surface font-title-sm text-title-sm">{t.toolTitle}</span>
      </nav>

      {/* TOOL HEADER */}
      <div className="flex flex-col gap-space-4 pb-space-6 border-b border-border-subtle/40 mb-space-6">
        <div className="flex flex-wrap items-center justify-between gap-space-4">
          <div className="flex items-center gap-space-3">
            <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary-container shadow-sm">
              <Camera className="w-7 h-7 text-primary-container" />
            </div>
            <div className="flex flex-col">
              <div className="flex flex-wrap items-center gap-space-2">
                <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
                  {t.toolTitle}
                </h1>
                <span className="px-space-2 py-[2px] bg-primary-container/10 text-brand-cyan-bright font-label-sm text-label-sm rounded uppercase">
                  {t.tagStudio}
                </span>
                <span className="px-space-2 py-[2px] bg-secondary-container/10 text-secondary font-label-sm text-label-sm rounded uppercase flex items-center gap-space-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  {t.tagOffline}
                </span>
                <span className="px-space-2 py-[2px] bg-surface-subtle text-tertiary font-label-sm text-label-sm rounded uppercase">
                  {t.tagVector}
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-outline mt-0.5">{t.pipelineId}</span>
            </div>
          </div>

          <div className="flex items-center gap-space-2">
            <button
              type="button"
              onClick={() => setShowHistoryModal(!showHistoryModal)}
              className="flex items-center gap-space-1 px-space-3 py-space-1 bg-surface-subtle hover:bg-surface-container-high text-on-surface font-body-sm text-body-sm rounded-lg transition-colors cursor-pointer"
            >
              <History className="w-4 h-4 text-outline" />
              <span>{t.btnDrafts} ({history.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setShowShortcutsModal(!showShortcutsModal)}
              className="flex items-center gap-space-1 px-space-3 py-space-1 bg-surface-subtle hover:bg-surface-container-high text-on-surface font-body-sm text-body-sm rounded-lg transition-colors cursor-pointer"
            >
              <Keyboard className="w-4 h-4 text-outline" />
              <span>{t.btnShortcuts}</span>
            </button>
          </div>
        </div>

        <p className="font-body-md text-body-md text-on-surface-variant max-w-4xl">{t.toolDesc}</p>

        {/* PRIVACY BANNER */}
        <div className="p-space-3 bg-surface-container-low rounded-lg flex items-center gap-space-3 border-l-2 border-secondary">
          <div className="w-8 h-8 rounded bg-secondary-container/20 flex items-center justify-center shrink-0 text-secondary">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-space-2">
              <span className="font-title-sm text-title-sm text-secondary font-semibold">{t.privacyTitle}</span>
              <span className="px-space-1 py-[1px] bg-secondary/15 text-secondary font-label-sm text-label-sm rounded">
                {t.privacyBadge}
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">{t.privacyDesc}</p>
          </div>
        </div>
      </div>

      {/* WORKSPACE 2 CỘT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-6 mb-space-12">
        {/* CỘT TRÁI (INPUT & CONFIGURATION) - 5 CỘT */}
        <div className="lg:col-span-5 flex flex-col gap-space-5">
          {/* BƯỚC 1: THU NHẬN & TẢI ẢNH */}
          <div className="bg-surface-container rounded-xl p-space-4 shadow-sm flex flex-col gap-space-4 border border-border-subtle/30">
            <div className="flex items-center justify-between pb-space-2 border-b border-border-subtle/30">
              <div className="flex items-center gap-space-2">
                <span className="w-6 h-6 rounded bg-primary-container text-on-primary-container font-label-sm text-label-sm flex items-center justify-center font-bold">
                  1
                </span>
                <h2 className="font-title-sm text-title-sm text-on-surface">{t.step1Title}</h2>
              </div>
              <span className="font-label-sm text-label-sm text-secondary flex items-center gap-space-1">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> {t.step1Ready}
              </span>
            </div>

            {/* Screen Capture API Button with countdown selector */}
            <div className="flex flex-col gap-space-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCapture(countdown)}
                  disabled={isCapturing}
                  className="flex-1 py-space-3 px-space-4 bg-surface-subtle hover:bg-surface-bright text-on-surface rounded-lg flex items-center justify-center gap-space-2 transition-all group border border-border-subtle cursor-pointer disabled:opacity-50"
                >
                  {isCapturing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-primary-container" />
                      <span className="font-title-sm text-title-sm">{t.btnPreparing}</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-5 h-5 text-primary-container group-hover:scale-110 transition-transform" />
                      <span className="font-title-sm text-title-sm">{t.btnCaptureApi}</span>
                    </>
                  )}
                </button>

                {/* Delay Timer Select */}
                <div className="flex items-center bg-surface-container-low p-1 rounded-lg border border-border-subtle/40">
                  <Clock className="w-4 h-4 text-outline ml-1" />
                  {[0, 3, 5].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setCountdown(sec)}
                      className={`px-2 py-1 rounded text-label-sm font-semibold transition ${
                        countdown === sec
                          ? 'bg-primary-container text-on-primary-container'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {sec === 0 ? '0s' : `${sec}s`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Drag & drop / Ctrl+V Paste Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleUploadFile(e.dataTransfer.files[0]);
                  }
                }}
                className="border-2 border-dashed border-border-subtle hover:border-primary-container/60 bg-surface-container-low/60 rounded-lg p-space-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-surface-subtle flex items-center justify-center text-on-surface-variant group-hover:text-primary transition-colors mb-space-2">
                  <Clipboard className="w-5 h-5" />
                </div>
                <p className="font-body-md text-body-md text-on-surface font-medium">
                  Bấm{' '}
                  <kbd className="px-space-1 py-[1px] bg-surface-container rounded font-label-sm text-label-sm text-primary">
                    Ctrl + V
                  </kbd>{' '}
                  để dán trực tiếp từ Clipboard
                </p>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-1">{t.dropzoneSubtitle}</p>
              </div>
            </div>

            {/* Thẻ ảnh đang nạp */}
            {(baseImage || rawCaptureImage) && (
              <div className="bg-surface-container-high rounded-lg p-space-3 flex items-center justify-between border border-border-subtle/40 animate-in fade-in">
                <div className="flex items-center gap-space-3 min-w-0">
                  <div className="w-10 h-10 rounded bg-surface-subtle flex items-center justify-center text-primary-container shrink-0">
                    <ImageIcon className="w-5 h-5 text-primary-container" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-space-2">
                      <span className="font-title-sm text-title-sm text-on-surface truncate font-mono">
                        {loadedFileName}
                      </span>
                      <span className="px-space-1 py-[1px] bg-secondary-container/20 text-secondary font-label-sm text-label-sm rounded uppercase font-semibold">
                        {t.loadedBadge}
                      </span>
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Dung lượng: {formatBytes(loadedFileSize)} • Độ phân giải: {previewWidth} × {previewHeight} Retina
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-space-1 shrink-0 ml-space-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-space-2 text-on-surface-variant hover:text-on-surface rounded hover:bg-surface-subtle transition-colors cursor-pointer"
                    title={t.btnReplace}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRawCaptureImage(null);
                      setBaseImage(null);
                      setAnnotations([]);
                      setRedoStack([]);
                      setStage('idle');
                    }}
                    className="p-space-2 text-on-surface-variant hover:text-error rounded hover:bg-surface-subtle transition-colors cursor-pointer"
                    title={t.btnClear}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* BƯỚC 2: HỘP CÔNG CỤ CHÚ THÍCH & TÙY BIẾN ĐỒ HỌA */}
          <div className="bg-surface-container rounded-xl p-space-4 shadow-sm flex flex-col gap-space-4 border border-border-subtle/30">
            <div className="flex items-center justify-between pb-space-2 border-b border-border-subtle/30">
              <div className="flex items-center gap-space-2">
                <span className="w-6 h-6 rounded bg-primary-container text-on-primary-container font-label-sm text-label-sm flex items-center justify-center font-bold">
                  2
                </span>
                <h2 className="font-title-sm text-title-sm text-on-surface">{t.step2Title}</h2>
              </div>
              <span className="font-label-sm text-label-sm text-outline uppercase">{t.step2Badge}</span>
            </div>

            {/* Tool Selection Grid (6 công cụ per mockup) */}
            <div className="grid grid-cols-3 gap-space-2">
              {[
                { id: 'step', label: t.tools.step, sub: t.tools.stepSub, icon: ListOrdered },
                { id: 'arrow', label: t.tools.arrow, sub: t.tools.arrowSub, icon: MoveUpRight },
                { id: 'rect', label: t.tools.rect, sub: t.tools.rectSub, icon: Square },
                { id: 'blur', label: t.tools.blur, sub: t.tools.blurSub, icon: EyeOff },
                { id: 'pen', label: t.tools.pen, sub: t.tools.penSub, icon: Pencil },
                { id: 'text', label: t.tools.text, sub: t.tools.textSub, icon: Type },
              ].map((toolItem) => {
                const isActive = activeTool === toolItem.id;
                const Icon = toolItem.icon;
                return (
                  <button
                    key={toolItem.id}
                    type="button"
                    onClick={() => setActiveTool(toolItem.id)}
                    className={`tool-btn flex flex-col items-center justify-center p-space-2 rounded-lg text-center transition-all cursor-pointer ${
                      isActive
                        ? 'bg-surface-subtle border-2 border-primary-container text-primary-container'
                        : 'bg-surface-subtle hover:bg-surface-bright text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-1" />
                    <span className="font-label-sm text-label-sm font-semibold">{toolItem.label}</span>
                    <span className="font-body-sm text-body-sm text-outline text-[10px] leading-tight mt-0.5">
                      {toolItem.sub}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* CẤU HÌNH CHI TIẾT CÔNG CỤ ĐANG CHỌN */}
            <div className="p-space-3 bg-surface-container-low rounded-lg flex flex-col gap-space-3 border border-border-subtle/30">
              {/* Bảng màu chọn nhanh */}
              <div className="flex items-center justify-between">
                <label className="font-body-sm text-body-sm text-on-surface-variant">{t.labelAccentColor}</label>
                <div className="flex items-center gap-space-2">
                  {COLOR_PALETTE.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setColor(c.value)}
                      title={c.label}
                      style={{ backgroundColor: c.value }}
                      className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                        color === c.value
                          ? 'ring-2 ring-primary-container ring-offset-2 ring-offset-surface-container-low scale-110'
                          : 'hover:scale-110'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Kiểu dáng số bước (hiển thị khi chọn tool step) */}
              <div className="flex items-center justify-between">
                <label className="font-body-sm text-body-sm text-on-surface-variant">{t.labelStepStyle}</label>
                <div className="flex items-center gap-space-1 bg-surface-container p-1 rounded-lg">
                  {[
                    { id: 'solid', label: t.stepStyleSolid },
                    { id: 'outline', label: t.stepStyleOutline },
                    { id: 'glow', label: t.stepStyleGlow },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setStepBadgeStyle(st.id)}
                      className={`px-space-2 py-0.5 rounded font-label-sm text-label-sm transition cursor-pointer ${
                        stepBadgeStyle === st.id
                          ? 'bg-primary-container text-on-primary-container font-semibold'
                          : 'hover:bg-surface-subtle text-on-surface-variant'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cường độ làm mờ nhạy cảm */}
              <div className="flex flex-col gap-space-1">
                <div className="flex items-center justify-between">
                  <label className="font-body-sm text-body-sm text-on-surface-variant">{t.labelBlurIntensity}</label>
                  <span className="font-label-sm text-label-sm text-brand-cyan-bright">
                    Pixelate {blurIntensity}px
                  </span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="24"
                  value={blurIntensity}
                  onChange={(e) => setBlurIntensity(Number(e.target.value))}
                  className="w-full accent-primary-container bg-surface-subtle rounded-lg cursor-pointer h-1.5"
                />
                <div className="flex justify-between font-label-sm text-label-sm text-outline text-[10px]">
                  <span>Nhẹ (4px)</span>
                  <span>Tiêu chuẩn (12px)</span>
                  <span>Che đặc (24px)</span>
                </div>
              </div>

              {/* Hiệu ứng viền nền & Canvas */}
              <div className="pt-space-2 border-t border-border-subtle/30 flex flex-col gap-space-2">
                <div className="flex items-center justify-between">
                  <span className="font-body-sm text-body-sm text-on-surface-variant">{t.labelCornerRadius}</span>
                  <div className="flex items-center gap-space-1">
                    {CORNER_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setCornerRadius(opt.value)}
                        className={`px-space-2 py-0.5 rounded font-label-sm text-label-sm transition cursor-pointer ${
                          cornerRadius === opt.value
                            ? 'bg-primary-container text-on-primary-container font-semibold'
                            : 'bg-surface-subtle hover:bg-surface-container text-on-surface-variant'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-body-sm text-body-sm text-on-surface-variant">{t.labelEffects}</span>
                  <div className="flex items-center gap-space-3">
                    <label className="inline-flex items-center gap-space-1 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={enableSoftShadow}
                        onChange={(e) => setEnableSoftShadow(e.target.checked)}
                        className="accent-primary-container rounded"
                      />
                      <span className="font-body-sm text-body-sm text-on-surface">{t.softShadow}</span>
                    </label>
                    <label className="inline-flex items-center gap-space-1 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={enablePadding}
                        onChange={(e) => setEnablePadding(e.target.checked)}
                        className="accent-primary-container rounded"
                      />
                      <span className="font-body-sm text-body-sm text-on-surface">{t.paddingCanvas}</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* PRIMARY CTA NỔI BẬT DUY NHẤT */}
            <button
              type="button"
              onClick={() => handleDownload('png')}
              disabled={!baseImage && !rawCaptureImage}
              className="w-full py-space-3 px-space-4 bg-primary-container hover:bg-brand-cyan-bright text-on-primary-container font-title-sm text-title-sm font-bold rounded-lg shadow-lg flex items-center justify-center gap-space-2 transition-all group cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              <span>{t.primaryCta}</span>
            </button>
          </div>
        </div>

        {/* CỘT PHẢI (LIVE CANVAS PREVIEW & OUTPUT ACTIONS) - 7 CỘT */}
        <div className="lg:col-span-7 flex flex-col gap-space-5">
          {/* LIVE CANVAS PREVIEW CONTAINER */}
          <div className="bg-surface-container rounded-xl p-space-4 shadow-sm flex flex-col gap-space-3 border border-border-subtle/30">
            {/* Canvas Header Controls */}
            <div className="flex flex-wrap items-center justify-between gap-space-2 pb-space-2 border-b border-border-subtle/30">
              <div className="flex items-center gap-space-2">
                <Layers className="w-5 h-5 text-primary-container" />
                <span className="font-title-sm text-title-sm text-on-surface">{t.previewTitle}</span>
                <span className="px-space-1 py-[1px] bg-surface-subtle font-label-sm text-label-sm text-outline rounded">
                  {t.previewBadge}
                </span>
              </div>

              {/* Canvas Mini Toolbar */}
              <div className="flex items-center gap-space-1">
                <div className="flex items-center bg-surface-container-low rounded-lg p-0.5 mr-space-2 border border-border-subtle/30">
                  <button
                    type="button"
                    onClick={() => setZoomFit(false)}
                    className={`px-space-2 py-0.5 rounded font-label-sm text-label-sm transition cursor-pointer ${
                      !zoomFit ? 'bg-surface-subtle text-on-surface font-semibold' : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    100%
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomFit(true)}
                    className={`px-space-2 py-0.5 rounded font-label-sm text-label-sm transition cursor-pointer ${
                      zoomFit ? 'bg-surface-subtle text-on-surface font-semibold' : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Vừa khung
                  </button>
                </div>

                {stage === 'editing' && (
                  <button
                    type="button"
                    onClick={() => setStage('snipping')}
                    className="p-space-1 px-2 text-on-surface-variant hover:text-primary-container rounded hover:bg-surface-subtle transition-colors flex items-center gap-1 font-label-sm text-label-sm cursor-pointer"
                    title={t.btnResnip}
                  >
                    <Crop className="w-4 h-4" />
                    <span className="hidden sm:inline">{t.btnResnip}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (annotations.length > 0) {
                      setRedoStack((prev) => [...prev, annotations[annotations.length - 1]]);
                      setAnnotations((prev) => prev.slice(0, -1));
                    }
                  }}
                  disabled={annotations.length === 0}
                  className="p-space-1 text-on-surface-variant hover:text-on-surface rounded hover:bg-surface-subtle transition-colors flex items-center cursor-pointer disabled:opacity-30"
                  title={t.btnUndo}
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
                  className="p-space-1 text-on-surface-variant hover:text-on-surface rounded hover:bg-surface-subtle transition-colors flex items-center cursor-pointer disabled:opacity-30"
                  title={t.btnRedo}
                >
                  <Redo2 className="w-4 h-4" />
                </button>

                <span className="w-[1px] h-4 bg-border-subtle mx-1"></span>

                <button
                  type="button"
                  onClick={() => setAnnotations([])}
                  disabled={annotations.length === 0}
                  className="p-space-1 text-on-surface-variant hover:text-error rounded hover:bg-surface-subtle transition-colors flex items-center cursor-pointer disabled:opacity-30"
                  title={t.btnClearAll}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* STAGE CONTAINER */}
            <div className="relative w-full bg-gradient-to-br from-surface-container-highest via-surface-canvas to-surface-container-low p-space-4 sm:p-space-6 rounded-xl flex items-center justify-center overflow-hidden shadow-2xl min-h-[380px] max-h-[72vh]">
              {/* STAGE A: Snipping Phase */}
              {stage === 'snipping' && rawCaptureImage && (
                <div className="relative w-full flex flex-col items-center gap-3">
                  <div className="w-full flex items-center justify-between bg-surface-container-low/90 backdrop-blur px-3 py-2 rounded-lg border border-border-subtle/50 text-xs">
                    <div className="flex items-center gap-2">
                      <Move className="w-4 h-4 text-primary-container animate-pulse" />
                      <span className="font-semibold text-on-surface">{t.snipGuideTitle}</span>
                      <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-secondary-container/20 text-secondary text-[11px] font-semibold">
                        {t.snipAutoCopyBadge}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleConfirmArea(rawCaptureImage)}
                        className="px-2.5 py-1 rounded bg-surface-subtle hover:bg-surface-bright text-on-surface text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
                      >
                        <Maximize2 className="w-3.5 h-3.5 text-primary-container" />
                        <span>{t.btnFullScreen}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setStage(baseImage ? 'editing' : 'idle')}
                        className="p-1 rounded hover:bg-surface-subtle text-outline hover:text-error transition cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="relative max-w-full max-h-[60vh] overflow-auto flex items-center justify-center select-none cursor-crosshair rounded-xl border border-border-subtle/40 bg-surface-container-lowest shadow-2xl">
                    <canvas
                      ref={snipCanvasRef}
                      onPointerDown={handleSnipPointerDown}
                      onPointerMove={handleSnipPointerMove}
                      onPointerUp={handleSnipPointerUp}
                      onPointerCancel={handleSnipPointerUp}
                      className="max-w-full max-h-[58vh] object-contain"
                    />
                  </div>
                </div>
              )}

              {/* STAGE B: Editing Phase */}
              {stage === 'editing' && baseImage && (
                <div
                  className={`relative w-full max-w-2xl flex items-center justify-center transition-all ${
                    enablePadding ? 'p-space-6' : 'p-0'
                  }`}
                >
                  <div
                    className={`relative inline-block overflow-hidden transition-all ${
                      enableSoftShadow ? 'shadow-2xl' : ''
                    } border border-border-subtle/50 bg-surface-container-lowest`}
                    style={{ borderRadius: `${cornerRadius}px` }}
                  >
                    <canvas
                      ref={editorCanvasRef}
                      onPointerDown={handleEditorPointerDown}
                      onPointerMove={handleEditorPointerMove}
                      onPointerUp={handleEditorPointerUp}
                      onPointerCancel={handleEditorPointerUp}
                      className={`select-none cursor-crosshair block ${
                        zoomFit ? 'max-w-full max-h-[58vh] object-contain' : 'w-auto h-auto'
                      }`}
                    />

                    {/* Pop-up Text Note Input */}
                    {textInputPosition && (
                      <div
                        className="absolute z-30 p-2 rounded-xl bg-surface-container-high border border-primary-container shadow-2xl flex items-center space-x-2 animate-in fade-in"
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
                          className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary-container"
                        />
                        <button
                          type="button"
                          onClick={handleTextSubmit}
                          className="px-2.5 py-1.5 rounded-lg bg-primary-container hover:bg-brand-cyan-bright text-on-primary-container text-xs font-bold cursor-pointer"
                        >
                          OK
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STAGE C: Idle Empty State */}
              {stage === 'idle' && (
                <div className="flex flex-col items-center justify-center text-center p-space-6 max-w-md">
                  <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center text-primary-container mb-space-3 shadow-inner">
                    <Camera className="w-8 h-8 text-primary-container" />
                  </div>
                  <h3 className="font-title-sm text-title-sm text-on-surface font-semibold mb-1">
                    {t.emptyStagePrompt}
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-4">
                    {t.emptyStageDesc}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCapture(countdown)}
                      className="px-space-3 py-space-2 rounded-lg bg-primary-container hover:bg-brand-cyan-bright text-on-primary-container font-title-sm text-title-sm font-bold flex items-center gap-1.5 cursor-pointer shadow"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Chụp màn hình ngay</span>
                    </button>
                    <button
                      type="button"
                      onClick={handlePasteClipboard}
                      className="px-space-3 py-space-2 rounded-lg bg-surface-subtle hover:bg-surface-bright text-on-surface font-title-sm text-title-sm font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Clipboard className="w-4 h-4 text-secondary" />
                      <span>Dán Clipboard</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* BẢNG THÔNG SỐ XUẤT BẢN & METRIC STRIP */}
            <div className="grid grid-cols-3 gap-space-3 p-space-3 bg-surface-container-low rounded-lg border border-border-subtle/40">
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-outline">{t.metricDimensions}</span>
                <span className="font-title-sm text-title-sm text-on-surface font-mono font-bold mt-0.5">
                  {previewWidth > 0 ? `${previewWidth} × ${previewHeight}` : 'Chưa có'}
                </span>
                <span className="font-label-sm text-label-sm text-primary">{t.metricScale}</span>
              </div>
              <div className="flex flex-col border-l border-border-subtle/40 pl-space-3">
                <span className="font-label-sm text-label-sm text-outline">{t.metricSize}</span>
                <span className="font-title-sm text-title-sm text-on-surface font-mono font-bold mt-0.5">
                  {loadedFileSize > 0 ? formatBytes(loadedFileSize) : '~840 KB'}
                </span>
                <span className="font-label-sm text-label-sm text-secondary">{t.metricLossless}</span>
              </div>
              <div className="flex flex-col border-l border-border-subtle/40 pl-space-3">
                <span className="font-label-sm text-label-sm text-outline">{t.metricLayers}</span>
                <span className="font-title-sm text-title-sm text-on-surface font-mono font-bold mt-0.5">
                  {layerCount} {t.metricActive}
                </span>
                <span className="font-label-sm text-label-sm text-tertiary">
                  {layerCount > 0 ? `${layerCount} vector layers` : 'Trống'}
                </span>
              </div>
            </div>

            {/* BỘ ACTION BUTTONS XUẤT BẢN */}
            <div className="flex flex-col sm:flex-row items-center gap-space-3 pt-space-2">
              {/* NÚT CHÍNH EMERALD */}
              <button
                type="button"
                onClick={() => handleDownload(selectedFormat)}
                disabled={!baseImage && !rawCaptureImage}
                className="w-full sm:flex-1 py-space-3 px-space-4 bg-brand-emerald-deep hover:bg-secondary-container text-white font-title-sm text-title-sm font-bold rounded-lg shadow-md flex items-center justify-center gap-space-2 transition-all group cursor-pointer disabled:opacity-50"
              >
                <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>{t.btnDownloadEmerald}</span>
              </button>

              {/* CÁC NÚT PHỤ */}
              <div className="flex items-center gap-space-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleManualCopy}
                  disabled={!baseImage && !rawCaptureImage}
                  className={`flex-1 sm:flex-initial py-space-3 px-space-4 rounded-lg font-body-sm text-body-sm font-semibold flex items-center justify-center gap-space-1.5 transition-colors cursor-pointer disabled:opacity-50 ${
                    isCopied
                      ? 'bg-secondary-container text-white'
                      : 'bg-surface-subtle hover:bg-surface-bright text-on-surface'
                  }`}
                  title="Sao chép nhanh vào Clipboard"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>{t.btnCopied}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-brand-cyan-bright" />
                      <span>{t.btnCopy}</span>
                    </>
                  )}
                </button>

                {/* Dropdown Format Selector */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowFormatDropdown(!showFormatDropdown)}
                    disabled={!baseImage && !rawCaptureImage}
                    className="p-space-3 bg-surface-subtle hover:bg-surface-bright text-on-surface font-label-sm text-label-sm font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <span className="uppercase">.{selectedFormat}</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>

                  {showFormatDropdown && (
                    <div className="absolute right-0 bottom-full mb-2 w-28 rounded-xl bg-surface-container-high border border-border-subtle shadow-2xl p-1 z-30 flex flex-col gap-1">
                      {['png', 'jpeg', 'webp'].map((fmt) => (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() => {
                            setSelectedFormat(fmt);
                            setShowFormatDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold uppercase font-mono transition flex items-center justify-between cursor-pointer ${
                            selectedFormat === fmt
                              ? 'bg-primary-container text-on-primary-container'
                              : 'text-on-surface-variant hover:bg-surface-subtle hover:text-on-surface'
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
        </div>
      </div>

      {/* FOOTER KIẾN THỨC & QUY CHUẨN ĐỒ HỌA (3 CARDS) */}
      <div className="pt-space-6 border-t border-border-subtle/40 mb-space-8">
        <div className="flex items-center gap-space-2 mb-space-4">
          <span className="material-symbols-outlined text-primary-container text-[20px]">auto_stories</span>
          <h3 className="font-title-sm text-title-sm text-on-surface font-bold">{t.assuranceTitle}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-4">
          {/* CARD 1 */}
          <div className="bg-surface-container rounded-xl p-space-4 flex flex-col gap-space-2 hover:bg-surface-container-high transition-colors border border-border-subtle/20">
            <div className="w-10 h-10 rounded-lg bg-surface-subtle flex items-center justify-center text-primary-container mb-space-1">
              <Camera className="w-5 h-5 text-primary-container" />
            </div>
            <h4 className="font-title-sm text-title-sm text-on-surface font-semibold">{t.card1Title}</h4>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{t.card1Desc}</p>
          </div>

          {/* CARD 2 */}
          <div className="bg-surface-container rounded-xl p-space-4 flex flex-col gap-space-2 hover:bg-surface-container-high transition-colors border border-border-subtle/20">
            <div className="w-10 h-10 rounded-lg bg-surface-subtle flex items-center justify-center text-secondary mb-space-1">
              <ShieldCheck className="w-5 h-5 text-secondary" />
            </div>
            <h4 className="font-title-sm text-title-sm text-on-surface font-semibold">{t.card2Title}</h4>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{t.card2Desc}</p>
          </div>

          {/* CARD 3 */}
          <div className="bg-surface-container rounded-xl p-space-4 flex flex-col gap-space-2 hover:bg-surface-container-high transition-colors border border-border-subtle/20">
            <div className="w-10 h-10 rounded-lg bg-surface-subtle flex items-center justify-center text-tertiary mb-space-1">
              <Sparkles className="w-5 h-5 text-tertiary" />
            </div>
            <h4 className="font-title-sm text-title-sm text-on-surface font-semibold">{t.card3Title}</h4>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{t.card3Desc}</p>
          </div>
        </div>
      </div>

      {/* DRAFT HISTORY MODAL */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-surface-container rounded-2xl border border-border-subtle p-space-6 max-w-3xl w-full max-h-[80vh] flex flex-col gap-space-4 shadow-2xl">
            <div className="flex items-center justify-between pb-space-3 border-b border-border-subtle/40">
              <div className="flex items-center gap-space-2">
                <History className="w-5 h-5 text-primary-container" />
                <h3 className="font-title-sm text-title-sm text-on-surface font-bold">
                  {t.btnDrafts} ({history.length})
                </h3>
              </div>
              <div className="flex items-center gap-space-2">
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setHistory([]);
                      localStorage.removeItem('snapcraft_history');
                    }}
                    className="px-2.5 py-1 text-xs text-error hover:bg-error-container/20 rounded transition cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa toàn bộ</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(false)}
                  className="p-1 rounded text-outline hover:text-on-surface transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 grid grid-cols-2 sm:grid-cols-3 gap-space-3 p-1">
              {history.length === 0 ? (
                <div className="col-span-full py-12 text-center text-outline text-sm">
                  Chưa có ảnh nháp nào được lưu trong lịch sử phiên làm việc.
                </div>
              ) : (
                history.map((item) => (
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
                        setShowHistoryModal(false);
                      };
                      img.src = item.dataUrl;
                    }}
                    className="group relative rounded-xl bg-surface-container-high border border-border-subtle/50 hover:border-primary-container overflow-hidden cursor-pointer transition flex flex-col justify-between shadow-sm"
                  >
                    <div className="aspect-video w-full bg-surface-canvas overflow-hidden flex items-center justify-center">
                      <img
                        src={item.dataUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="p-2 bg-surface-container/90 flex items-center justify-between text-[11px] text-on-surface-variant">
                      <span className="font-mono">{item.width}×{item.height}</span>
                      <span className="group-hover:text-primary-container font-semibold flex items-center gap-0.5">
                        Mở <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SHORTCUTS MODAL */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-surface-container rounded-2xl border border-border-subtle p-space-6 max-w-md w-full shadow-2xl flex flex-col gap-space-4">
            <div className="flex items-center justify-between pb-space-3 border-b border-border-subtle/40">
              <div className="flex items-center gap-space-2">
                <Keyboard className="w-5 h-5 text-primary-container" />
                <h3 className="font-title-sm text-title-sm text-on-surface font-bold">{t.btnShortcuts}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowShortcutsModal(false)}
                className="p-1 rounded text-outline hover:text-on-surface transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-space-3 font-body-sm text-body-sm">
              <div className="flex items-center justify-between py-1 border-b border-border-subtle/20">
                <span className="text-on-surface-variant">Dán ảnh từ Clipboard</span>
                <kbd className="px-2 py-0.5 rounded bg-surface-subtle font-mono text-primary font-bold">
                  Ctrl + V
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-border-subtle/20">
                <span className="text-on-surface-variant">Sao chép ảnh đã chú thích</span>
                <kbd className="px-2 py-0.5 rounded bg-surface-subtle font-mono text-primary font-bold">
                  Ctrl + C
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-border-subtle/20">
                <span className="text-on-surface-variant">Hoàn tác nét vẽ (Undo)</span>
                <kbd className="px-2 py-0.5 rounded bg-surface-subtle font-mono text-on-surface font-bold">
                  Ctrl + Z
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-border-subtle/20">
                <span className="text-on-surface-variant">Làm lại nét vẽ (Redo)</span>
                <kbd className="px-2 py-0.5 rounded bg-surface-subtle font-mono text-on-surface font-bold">
                  Ctrl + Y
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-on-surface-variant">Hủy nhập ghi chú văn bản</span>
                <kbd className="px-2 py-0.5 rounded bg-surface-subtle font-mono text-on-surface font-bold">
                  Esc
                </kbd>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
