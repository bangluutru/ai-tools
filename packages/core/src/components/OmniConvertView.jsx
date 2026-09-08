/**
 * OmniConvertView.jsx
 * ========================================================================
 * Self-contained OmniConvert miniapp for the AI-Tools portal.
 * Bidirectional conversion between Office formats (DOCX, PPTX, XLSX),
 * Images, Markdown, and PDF using in-browser WebAssembly engines.
 *
 * Fully reactive queue grouping, multiple re-conversions, dynamic real-time
 * preview (PDF canvas, Excel sheets, Word text, Images), and custom pairs.
 *
 * @module OmniConvertView
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  CONVERT_LIMITS,
  rejectionMessages,
  validateDocumentFiles,
  verifyDocumentSignature,
} from '../utils/documentFiles.js';
import confetti from 'canvas-confetti';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { 
  FileStack, 
  UploadCloud, 
  Layers, 
  Download, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Eye, 
  Sliders, 
  X, 
  FileText, 
  FileSpreadsheet, 
  Presentation, 
  Image as ImageIcon, 
  FileCode, 
  File, 
  ShieldCheck, 
  RefreshCw, 
  RotateCcw,
  Check,
  Home,
  CheckSquare,
  Copy,
  FolderArchive,
  Code,
  Sparkles,
  Zap,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import { 
  FORMAT_DETAILS, 
  POPULAR_PRESETS, 
  getFileExtension, 
  getSupportedTargets 
} from '../utils/omniconvert/formats.js';
import { 
  executeConversion, 
  mergeMultipleImagesToPdf 
} from '../utils/omniconvert/engineRouter.js';
import { 
  loadPdfDocument, 
  renderPdfPageToCanvas 
} from '../utils/omniconvert/pdfHelper.js';

// Target Format Definitions with Rich Metadata
const TARGET_FORMAT_OPTIONS = [
  {
    id: 'pdf',
    title: 'PDF Tài Liệu & In Ấn',
    ext: '.pdf',
    desc: 'Chuẩn A4 vector, dàn trang pixel-perfect',
    icon: FileCode,
    color: 'text-red-400 bg-red-500/20'
  },
  {
    id: 'docx',
    title: 'Microsoft Word',
    ext: '.docx',
    desc: 'Giữ nguyên đề mục, văn bản & bảng biểu',
    icon: FileText,
    color: 'text-sky-400 bg-sky-500/20'
  },
  {
    id: 'xlsx',
    title: 'Excel Bảng Tính',
    ext: '.xlsx',
    desc: 'Bóc tách cấu trúc bảng sang các sheet',
    icon: FileSpreadsheet,
    color: 'text-emerald-400 bg-emerald-500/20'
  },
  {
    id: 'pptx',
    title: 'PowerPoint Thuyết Trình',
    ext: '.pptx',
    desc: 'Tạo slide trình chiếu 16:9 sắc nét từ các trang',
    icon: Presentation,
    color: 'text-orange-400 bg-orange-500/20'
  },
  {
    id: 'png',
    title: 'Ảnh PNG Trong Suốt',
    ext: '.png',
    desc: 'Trích xuất ảnh phân giải cao, hỗ trợ alpha',
    icon: ImageIcon,
    color: 'text-purple-400 bg-purple-500/20'
  },
  {
    id: 'jpg',
    title: 'Ảnh JPEG Chất Lượng Cao',
    ext: '.jpg',
    desc: 'Nén chất lượng cao, tối ưu dung lượng',
    icon: ImageIcon,
    color: 'text-pink-400 bg-pink-500/20'
  },
  {
    id: 'webp',
    title: 'Ảnh WebP Thế Hệ Mới',
    ext: '.webp',
    desc: 'Siêu nhẹ, tốc độ tải tối ưu cho web',
    icon: ImageIcon,
    color: 'text-cyan-400 bg-cyan-500/20'
  },
  {
    id: 'txt',
    title: 'Văn Bản Thuần',
    ext: '.txt',
    desc: 'Trích xuất toàn bộ văn bản nhanh gọn',
    icon: FileText,
    color: 'text-on-surface-variant bg-surface-container'
  },
  {
    id: 'md',
    title: 'Markdown (.md)',
    ext: '.md',
    desc: 'Định dạng nhẹ, giữ trọn vẹn ngữ nghĩa, đề mục & bảng biểu',
    icon: FileCode,
    color: 'text-indigo-400 bg-indigo-500/20'
  },
  {
    id: 'html',
    title: 'Trang Web HTML',
    ext: '.html',
    desc: 'Trang web độc lập có stylesheet CSS sang trọng',
    icon: FileCode,
    color: 'text-amber-400 bg-amber-500/20'
  },
  {
    id: 'csv',
    title: 'Bảng Dữ Liệu CSV',
    ext: '.csv',
    desc: 'Bảng phân tách dấu phẩy cho hệ thống dữ liệu',
    icon: FileSpreadsheet,
    color: 'text-teal-400 bg-teal-500/20'
  }
];

export default function OmniConvertView({ displayLang = 'vi' }) {
  const [activePreset, setActivePreset] = useState('all-to-pdf');
  const [_sourceFormat, setSourceFormat] = useState('docx');
  const [targetFormat, setTargetFormat] = useState('pdf');
  const [mergeImagesToPdf, setMergeImagesToPdf] = useState(false);
  const [customSourceFilter, setCustomSourceFilter] = useState('all');

  const [queue, setQueue] = useState([]);
  const [fileError, setFileError] = useState('');
  const [isProcessingAll, setIsProcessingAll] = useState(false);

  // Active Preview selection
  const [activePreviewId, setActivePreviewId] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(100);

  // Modal preview item
  const [previewModalItem, setPreviewModalItem] = useState(null);
  const [previewModalUrl, setPreviewModalUrl] = useState(null);

  // Advanced toggles & settings
  const [keepHyperlinks, setKeepHyperlinks] = useState(true);
  const [embedFonts, setEmbedFonts] = useState(true);
  const [compressImages, setCompressImages] = useState(true);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({
    pageSize: 'a4',
    orientation: 'auto',
    scale: 2.0,
    quality: 0.92,
    margin: 20
  });

  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Reactive Merge Toggle Handler
  const handleToggleMergeImages = (shouldMerge) => {
    setMergeImagesToPdf(shouldMerge);

    setQueue((prevQueue) => {
      const imageExts = ['png', 'jpg', 'jpeg', 'webp', 'svg', 'bmp'];

      if (shouldMerge) {
        // Collect all image files to merge into 1 item
        const imageFilesToMerge = [];
        const nonMergeItems = [];

        for (const item of prevQueue) {
          if (item.isMergeGroup) {
            imageFilesToMerge.push(...(item.rawImageFiles || []));
          } else if (imageExts.includes(item.sourceFormat)) {
            imageFilesToMerge.push(item.file);
          } else {
            nonMergeItems.push(item);
          }
        }

        if (imageFilesToMerge.length > 0) {
          const mergedItem = {
            id: `merged-${Date.now()}`,
            file: new File(
              [imageFilesToMerge[0]],
              `Merged_${imageFilesToMerge.length}_Images.pdf`,
              { type: 'application/pdf' }
            ),
            rawImageFiles: imageFilesToMerge,
            isMergeGroup: true,
            sourceFormat: 'image',
            targetFormat: 'pdf',
            status: 'queued',
            progress: 0,
            error: null,
            result: null
          };
          return [mergedItem, ...nonMergeItems];
        }
        return prevQueue;
      } else {
        // Unbundle any merged groups back into individual items
        const unbundledItems = [];
        for (const item of prevQueue) {
          if (item.isMergeGroup && item.rawImageFiles) {
            item.rawImageFiles.forEach((f) => {
              const ext = getFileExtension(f.name);
              unbundledItems.push({
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                file: f,
                sourceFormat: ext,
                targetFormat: 'pdf',
                status: 'queued',
                progress: 0,
                error: null,
                result: null
              });
            });
          } else {
            unbundledItems.push(item);
          }
        }
        return unbundledItems;
      }
    });
  };

  // Preset Selection
  const handleSelectPreset = (preset) => {
    setActivePreset(preset.id);
    if (preset.id === 'all-to-pdf') {
      setSourceFormat('docx');
      handleSelectTargetFormat('pdf');
      handleToggleMergeImages(false);
    } else if (preset.id === 'pdf-to-office') {
      setSourceFormat('pdf');
      handleSelectTargetFormat('docx');
      handleToggleMergeImages(false);
    } else if (preset.id === 'img-to-pdf') {
      setSourceFormat('png');
      handleSelectTargetFormat('pdf');
      handleToggleMergeImages(true);
    } else if (preset.id === 'pdf-to-img') {
      setSourceFormat('pdf');
      handleSelectTargetFormat('png');
      handleToggleMergeImages(false);
    } else if (preset.id === 'to-markdown') {
      setSourceFormat('docx');
      handleSelectTargetFormat('md');
      handleToggleMergeImages(false);
    } else if (preset.id === 'custom') {
      setCustomSourceFilter('all');
    }
  };

  // Select target format and update compatible items in queue
  const handleSelectTargetFormat = (newTarget) => {
    setTargetFormat(newTarget);
    setQueue((prevQueue) =>
      prevQueue.map((item) => {
        if (item.isMergeGroup) return item; // Merge groups always target PDF
        const validTargets = getSupportedTargets(item.sourceFormat);
        if (validTargets.includes(newTarget)) {
          return {
            ...item,
            targetFormat: newTarget,
            status: 'queued',
            progress: 0,
            result: null,
            error: null
          };
        }
        return item;
      })
    );
  };

  // Handle individual item target format change
  const handleItemTargetChange = (id, newTarget) => {
    setQueue((prev) =>
      prev.map((q) =>
        q.id === id
          ? { ...q, targetFormat: newTarget, status: 'queued', progress: 0, result: null, error: null }
          : q
      )
    );
  };

  // Handle individual item reset / re-convert
  const handleResetSingle = (id) => {
    setQueue((prev) =>
      prev.map((q) =>
        q.id === id
          ? { ...q, status: 'queued', progress: 0, result: null, error: null }
          : q
      )
    );
  };

  // Handle files upload
  const handleFilesSelected = useCallback(async (files) => {
    if (!files || files.length === 0) return;

    const validation = validateDocumentFiles(files, [], CONVERT_LIMITS);
    const rejected = rejectionMessages(validation.rejected);
    const checked = [];
    for (const file of validation.accepted) {
      if (await verifyDocumentSignature(file)) checked.push(file);
      else rejected.push(`${file.name}: nội dung không khớp phần mở rộng`);
    }
    setFileError(rejected.join(' • '));
    if (checked.length === 0) return;
    files = checked;

    const imageExts = ['png', 'jpg', 'jpeg', 'webp', 'svg', 'bmp'];
    const imageFiles = files.filter(f => imageExts.includes(getFileExtension(f.name)));
    const otherFiles = files.filter(f => !imageExts.includes(getFileExtension(f.name)));

    setQueue((prevQueue) => {
      let updatedQueue = [...prevQueue];

      // Handle image files
      if (imageFiles.length > 0) {
        if (mergeImagesToPdf) {
          const existingMergeIdx = updatedQueue.findIndex((q) => q.isMergeGroup);
          if (existingMergeIdx >= 0) {
            const existing = updatedQueue[existingMergeIdx];
            const combinedImages = [...existing.rawImageFiles, ...imageFiles];
            updatedQueue[existingMergeIdx] = {
              ...existing,
              rawImageFiles: combinedImages,
              file: new File(
                [combinedImages[0]],
                `Merged_${combinedImages.length}_Images.pdf`,
                { type: 'application/pdf' }
              ),
              status: 'queued',
              progress: 0,
              result: null,
              error: null
            };
          } else {
            updatedQueue.unshift({
              id: `merged-${Date.now()}`,
              file: new File(
                [imageFiles[0]],
                `Merged_${imageFiles.length}_Images.pdf`,
                { type: 'application/pdf' }
              ),
              rawImageFiles: imageFiles,
              isMergeGroup: true,
              sourceFormat: 'image',
              targetFormat: 'pdf',
              status: 'queued',
              progress: 0,
              error: null,
              result: null
            });
          }
        } else {
          imageFiles.forEach((file) => {
            const ext = getFileExtension(file.name);
            const validTargets = getSupportedTargets(ext);
            const defaultTarget = validTargets.includes(targetFormat) ? targetFormat : (validTargets[0] || 'pdf');
            updatedQueue.push({
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              file,
              sourceFormat: ext,
              targetFormat: defaultTarget,
              status: 'queued',
              progress: 0,
              error: null,
              result: null
            });
          });
        }
      }

      // Handle other non-image files
      otherFiles.forEach((file) => {
        const ext = getFileExtension(file.name);
        const validTargets = getSupportedTargets(ext);
        const defaultTarget = validTargets.includes(targetFormat) ? targetFormat : (validTargets[0] || 'pdf');
        updatedQueue.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          sourceFormat: ext,
          targetFormat: defaultTarget,
          status: 'queued',
          progress: 0,
          error: null,
          result: null
        });
      });

      return updatedQueue;
    });
  }, [mergeImagesToPdf, targetFormat]);

  // Handle Clipboard Paste
  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const pastedFiles = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].kind === 'file') {
          const file = items[i].getAsFile();
          if (file) pastedFiles.push(file);
        }
      }

      if (pastedFiles.length > 0) {
        handleFilesSelected(pastedFiles);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleFilesSelected]);

  // Convert Single Item
  const handleConvertSingle = async (id) => {
    const item = queue.find(q => q.id === id);
    if (!item || item.status === 'converting') return;

    setQueue(prev => prev.map(q => q.id === id ? { ...q, status: 'converting', progress: 10, error: null } : q));

    try {
      let result;
      if (item.isMergeGroup && item.rawImageFiles) {
        result = await mergeMultipleImagesToPdf(item.rawImageFiles, settings, (p) => {
          setQueue(prev => prev.map(q => q.id === id ? { ...q, progress: Math.max(10, p) } : q));
        });
        result.filename = item.file.name;
      } else {
        result = await executeConversion(item.file, item.targetFormat, settings, (p) => {
          setQueue(prev => prev.map(q => q.id === id ? { ...q, progress: Math.max(10, p) } : q));
        });
      }

      setQueue(prev => prev.map(q => q.id === id ? { ...q, status: 'completed', progress: 100, result } : q));
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.85 } });
    } catch (err) {
      console.error('Conversion failed for item:', item, err);
      setQueue(prev => prev.map(q => q.id === id ? { ...q, status: 'error', error: err.message || 'Lỗi chuyển đổi tệp' } : q));
    }
  };

  // Convert All Items (Supports Re-conversion)
  const handleConvertAll = async () => {
    if (queue.length === 0 || isProcessingAll) return;

    // If all items are completed or no queued/error items, reset all to queued
    const hasPending = queue.some(q => q.status === 'queued' || q.status === 'error');
    let itemsToProcess = queue;

    if (!hasPending) {
      itemsToProcess = queue.map(q => ({ ...q, status: 'queued', progress: 0, result: null, error: null }));
      setQueue(itemsToProcess);
    }

    setIsProcessingAll(true);
    for (const item of itemsToProcess) {
      await handleConvertSingle(item.id);
    }
    setIsProcessingAll(false);

    confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });
  };

  const handleDownloadSingle = (item) => {
    if (!item.result?.blob) return;
    saveAs(item.result.blob, item.result.filename);
  };

  const handleDownloadAllZip = async () => {
    const completedItems = queue.filter(q => q.status === 'completed' && q.result?.blob);
    if (completedItems.length === 0) return;

    if (completedItems.length === 1) {
      handleDownloadSingle(completedItems[0]);
      return;
    }

    const zip = new JSZip();
    const folder = zip.folder('OmniConvert_Files');

    for (let i = 0; i < completedItems.length; i++) {
      const item = completedItems[i];
      const buffer = await item.result.blob.arrayBuffer();
      folder.file(item.result.filename, buffer);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `OmniConvert_Bundle_${Date.now()}.zip`);
  };

  // Preview Modal management
  const openModalPreview = (item) => {
    setPreviewModalItem(item);
    const blob = item.result?.blob || item.file;
    if (blob) {
      const url = URL.createObjectURL(blob);
      setPreviewModalUrl(url);
    }
  };

  const closeModalPreview = () => {
    if (previewModalUrl) URL.revokeObjectURL(previewModalUrl);
    setPreviewModalItem(null);
    setPreviewModalUrl(null);
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const renderIcon = (cat) => {
    switch (cat) {
      case 'document': return <FileText className="w-5 h-5 text-sky-400" />;
      case 'spreadsheet': return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
      case 'presentation': return <Presentation className="w-5 h-5 text-amber-400" />;
      case 'image': return <ImageIcon className="w-5 h-5 text-purple-400" />;
      case 'pdf': return <FileCode className="w-5 h-5 text-red-400" />;
      default: return <File className="w-5 h-5 text-on-surface-variant" />;
    }
  };

  const totalCount = queue.length;
  const completedCount = queue.filter(q => q.status === 'completed').length;
  const queuedCount = queue.filter(q => q.status === 'queued').length;
  const errorCount = queue.filter(q => q.status === 'error').length;
  const isAllDone = totalCount > 0 && completedCount === totalCount;
  const totalSize = queue.reduce((acc, q) => {
    if (q.isMergeGroup && q.rawImageFiles) {
      return acc + q.rawImageFiles.reduce((sub, f) => sub + (f.size || 0), 0);
    }
    return acc + (q.file?.size || 0);
  }, 0);

  // Active preview item
  const currentPreviewItem = queue.find(q => q.id === activePreviewId) || queue[0] || null;

  // Determine available target format choices for Step 2
  const availableTargetOptions = (() => {
    if (activePreset === 'custom') {
      if (customSourceFilter === 'all') return TARGET_FORMAT_OPTIONS;
      const validForFilter = getSupportedTargets(customSourceFilter);
      return TARGET_FORMAT_OPTIONS.filter(opt => validForFilter.includes(opt.id));
    }

    if (queue.length > 0) {
      const allValidTargets = Array.from(new Set(queue.flatMap(q => {
        if (q.isMergeGroup) return ['pdf'];
        return getSupportedTargets(q.sourceFormat);
      })));
      const filtered = TARGET_FORMAT_OPTIONS.filter(opt => allValidTargets.includes(opt.id));
      if (filtered.length > 0) return filtered;
    }

    // Default by preset
    if (activePreset === 'pdf-to-office') {
      return TARGET_FORMAT_OPTIONS.filter(opt => ['docx', 'xlsx', 'pptx', 'png', 'txt'].includes(opt.id));
    }
    if (activePreset === 'img-to-pdf') {
      return TARGET_FORMAT_OPTIONS.filter(opt => ['pdf', 'png', 'jpg', 'webp'].includes(opt.id));
    }
    if (activePreset === 'pdf-to-img') {
      return TARGET_FORMAT_OPTIONS.filter(opt => ['png', 'jpg', 'webp'].includes(opt.id));
    }
    if (activePreset === 'to-markdown') {
      return TARGET_FORMAT_OPTIONS.filter(opt => ['md', 'txt', 'html', 'pdf', 'docx'].includes(opt.id));
    }
    return TARGET_FORMAT_OPTIONS.filter(opt => ['pdf', 'txt', 'md'].includes(opt.id));
  })();

  return (
    <div className="w-full flex flex-col space-y-8 pb-12">
      {/* ==================================================================== */}
      {/* 1. BREADCRUMB & TOOL HEADER                                         */}
      {/* ==================================================================== */}
      <section className="flex flex-col space-y-4">
        {/* Breadcrumb */}
        <div className="flex items-center justify-between gap-4">
          <nav className="flex items-center gap-2 text-xs font-mono text-on-surface-variant">
            <a href="#/tat-ca" className="hover:text-primary transition-colors flex items-center gap-1">
              <Home className="w-3.5 h-3.5" />
              <span>Trang chủ</span>
            </a>
            <span className="text-outline">/</span>
            <a href="#/tien-ich" className="hover:text-primary transition-colors">Tiện ích &amp; Văn phòng</a>
            <span className="text-outline">/</span>
            <span className="text-on-surface font-medium">
              {displayLang === 'en' ? 'Universal File Converter' : displayLang === 'ja' ? '万能ファイル変換' : 'Chuyển Đổi Đa Năng'}
            </span>
          </nav>
          <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] text-on-surface-variant">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
            <span>WASM ENGINE v3.2.0 ACTIVE</span>
          </div>
        </div>

        {/* Tool Header Block */}
        <div className="bg-surface-container border border-border-subtle rounded-xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-64 h-64 bg-primary-container/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-surface-container-high border border-border-subtle flex items-center justify-center text-primary-container shrink-0 shadow-sm">
                <FileStack className="w-8 h-8 text-primary-container" />
              </div>
              <div className="space-y-2 max-w-3xl">
                <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
                  {displayLang === 'en' ? 'Universal File Converter' : displayLang === 'ja' ? '万能ファイル変換' : 'Chuyển Đổi Đa Năng'}
                </h1>
                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                  Chuyển đổi đa chiều tài liệu văn phòng Office (Word .docx, Excel .xlsx, PowerPoint .pptx, TXT, CSV), bộ ảnh và PDF chuẩn vector. Hỗ trợ gộp ảnh, xuất slide thuyết trình, bóc tách bảng tính và xem trước trực tiếp 100% trên trình duyệt.
                </p>
                <div className="flex items-center gap-1.5 text-xs text-on-surface-variant pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-secondary shrink-0" />
                  <span>Xử lý trực tiếp trên trình duyệt bằng WebAssembly — tệp không tải lên máy chủ.</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                aria-label="Cài đặt thông số xuất tài liệu"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-subtle border border-border-subtle hover:bg-surface-container text-on-surface text-xs font-medium transition-colors cursor-pointer"
              >
                <Sliders className="w-4 h-4 text-primary-container" />
                <span>Cài đặt xuất</span>
              </button>
            </div>
          </div>
        </div>

        {/* Popular Presets Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {POPULAR_PRESETS.map((preset) => {
            const isActive = activePreset === preset.id;
            const langKey = displayLang === 'vi' ? 'vn' : displayLang;
            const label = preset[`label_${langKey}`] || preset.label_vn || preset.label_en || preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                aria-label={label}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                  isActive
                    ? 'bg-primary text-on-primary border-primary shadow-sm'
                    : 'bg-surface-container text-on-surface-variant border-border-subtle hover:bg-surface-subtle hover:text-on-surface'
                }`}
              >
                <span>{label}</span>
                {isActive && <Check className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>

        {/* Custom Mode Filter Sub-bar */}
        {activePreset === 'custom' && (
          <div className="p-3 rounded-xl bg-surface-container border border-border-subtle flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-on-surface">Chế độ Tùy chọn tự do:</span>
              <span className="text-xs text-on-surface-variant">Lọc tệp nguồn mong muốn:</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'pdf', label: 'PDF' },
                { id: 'docx', label: 'Word (.docx)' },
                { id: 'xlsx', label: 'Excel (.xlsx)' },
                { id: 'pptx', label: 'PowerPoint (.pptx)' },
                { id: 'png', label: 'Ảnh (.png/.jpg)' },
                { id: 'txt', label: 'Văn bản (.txt)' },
                { id: 'csv', label: 'Bảng CSV' },
                { id: 'md', label: 'Markdown (.md)' }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setCustomSourceFilter(f.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-colors ${
                    customSourceFilter === f.id
                      ? 'bg-primary text-on-primary font-bold shadow-sm'
                      : 'bg-surface text-on-surface-variant hover:bg-surface-bright hover:text-on-surface border border-border-subtle'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ==================================================================== */}
      {/* 2. WORKSPACE 2 CỘT CHUẨN                                             */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================================================================== */}
        {/* CỘT TRÁI: INPUT & CONFIGURATION (Steps 1 & 2)                      */}
        {/* ================================================================== */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          {/* STEP 1 CARD: File Uploader & Selection */}
          <div className="bg-surface-container/60 border border-border-subtle/70 rounded-xl p-5 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-primary text-on-primary font-mono text-xs font-bold flex items-center justify-center">1</span>
                <h2 className="text-sm font-semibold text-on-surface">Tải Tệp Tin Văn Phòng &amp; Ảnh</h2>
              </div>
              <span className="font-mono text-xs text-on-surface-variant">Tối đa 50MB / tệp</span>
            </div>

            {/* Error banner */}
            {fileError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{fileError}</span>
              </div>
            )}

            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                if (e.dataTransfer.files?.length > 0) {
                  handleFilesSelected(Array.from(e.dataTransfer.files));
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                isDragOver
                  ? 'border-primary-container bg-primary-container/10 scale-[0.99]'
                  : 'border-border-subtle bg-surface/60 hover:bg-surface hover:border-primary-container/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(e) => {
                  if (e.target.files?.length > 0) {
                    handleFilesSelected(Array.from(e.target.files));
                    e.target.value = '';
                  }
                }}
                className="hidden"
                accept=".docx,.pptx,.xlsx,.xls,.pdf,.png,.jpg,.jpeg,.webp,.svg,.bmp,.txt,.csv"
              />
              <div className="w-12 h-12 rounded-full bg-surface-container border border-border-subtle flex items-center justify-center text-primary-container mb-2">
                <UploadCloud className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-on-surface mb-1">
                Kéo thả tài liệu vào đây, hoặc <span className="text-primary-container underline underline-offset-4">Duyệt tệp tin</span>
              </span>
              <p className="text-xs text-on-surface-variant max-w-sm">
                Hỗ trợ Word (.docx), Excel (.xlsx, .csv), PowerPoint (.pptx), PDF, Ảnh (.png, .jpg, .webp), TXT.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3">
                {['DOCX', 'XLSX', 'PPTX', 'PDF', 'PNG', 'JPG', 'WEBP', 'TXT', 'CSV'].map((ext) => (
                  <span key={ext} className="px-2 py-0.5 rounded bg-surface font-mono text-[10px] text-on-surface-variant border border-border-subtle">
                    {ext}
                  </span>
                ))}
              </div>
            </div>

            {/* Merge Images Toggle with Active Count */}
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-surface border border-border-subtle text-xs text-on-surface-variant">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary-container" />
                <span className="text-on-surface font-medium">Gộp nhiều tệp ảnh thành 1 tài liệu PDF duy nhất</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  aria-label="Gộp nhiều tệp ảnh thành 1 tài liệu PDF duy nhất"
                  checked={mergeImagesToPdf}
                  onChange={(e) => handleToggleMergeImages(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-surface-container peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-surface-container-lowest after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface-container-lowest after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-container" />
              </label>
            </div>

            {/* Staged Files List */}
            {queue.length > 0 && (
              <div className="space-y-2 pt-1">
                <div tabIndex={0} role="region" aria-label="Danh sách tệp chờ chuyển đổi" className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {queue.map((item) => {
                    const isSelected = item.id === (activePreviewId || queue[0]?.id);
                    const sourceDetails = FORMAT_DETAILS[item.sourceFormat] || {};
                    const validTargets = item.isMergeGroup ? ['pdf'] : getSupportedTargets(item.sourceFormat);

                    return (
                      <div
                        key={item.id}
                        onClick={() => setActivePreviewId(item.id)}
                        className={`p-3 rounded-lg bg-surface border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-primary shadow-sm bg-primary-container/5'
                            : 'border-border-subtle hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-9 h-9 rounded-lg bg-surface-container border border-border-subtle flex items-center justify-center shrink-0">
                              {item.isMergeGroup ? <Layers className="w-5 h-5 text-primary" /> : renderIcon(sourceDetails.category)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-semibold text-on-surface truncate flex items-center gap-1.5">
                                <span className="truncate">{item.file.name}</span>
                                {item.isMergeGroup && (
                                  <span className="px-1.5 py-0.2 rounded bg-primary text-on-primary font-mono text-[10px] shrink-0">
                                    {item.rawImageFiles?.length || 0} ảnh
                                  </span>
                                )}
                              </div>
                              <div className="font-mono text-[11px] text-on-surface-variant flex items-center gap-2 mt-1 flex-wrap">
                                <span>{formatFileSize(item.file.size)}</span>
                                <span>•</span>
                                <span className="uppercase text-primary font-semibold">.{item.sourceFormat}</span>
                                <span>➔</span>
                                {/* Per-item target selector */}
                                <select
                                  value={item.targetFormat}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => handleItemTargetChange(item.id, e.target.value)}
                                  className="bg-surface-container border border-border-subtle rounded px-1.5 py-0.5 text-[11px] font-mono font-bold text-secondary uppercase cursor-pointer hover:border-secondary transition-colors"
                                  aria-label={`Chọn định dạng xuất cho tệp ${item.file.name}`}
                                >
                                  {validTargets.map((t) => (
                                    <option key={t} value={t}>.{t.toUpperCase()}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                            {item.status === 'converting' && (
                              <span className="font-mono text-xs text-primary flex items-center gap-1">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>{item.progress}%</span>
                              </span>
                            )}
                            {item.status === 'completed' && (
                              <span className="px-2 py-0.5 bg-emerald-500/15 text-secondary font-mono text-[11px] rounded flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Xong
                              </span>
                            )}
                            {item.status === 'queued' && (
                              <span className="px-2 py-0.5 bg-surface-container text-on-surface-variant font-mono text-[11px] rounded flex items-center gap-1">
                                Sẵn sàng
                              </span>
                            )}
                            {item.status === 'error' && (
                              <span className="px-2 py-0.5 bg-red-500/15 text-red-400 font-mono text-[11px] rounded" title={item.error || 'Lỗi'}>
                                Lỗi
                              </span>
                            )}

                            {/* Re-convert single button */}
                            {item.status === 'completed' && (
                              <button
                                type="button"
                                onClick={() => handleResetSingle(item.id)}
                                className="p-1 rounded bg-surface-container hover:bg-surface-bright text-on-surface-variant transition-colors"
                                aria-label={`Chuyển đổi lại ${item.file.name}`}
                                title="Chuyển đổi lại tệp này"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {item.status === 'completed' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => openModalPreview(item)}
                                  className="p-1 rounded bg-surface-container hover:bg-surface-bright text-on-surface-variant transition-colors"
                                  aria-label={`Xem trước chi tiết tệp ${item.file.name}`}
                                  title="Xem trước chi tiết"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadSingle(item)}
                                  className="p-1 rounded bg-emerald-500/20 text-secondary hover:bg-emerald-500/30 transition-colors"
                                  aria-label={`Tải tệp ${item.file.name}`}
                                  title="Tải tệp này"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}

                            <button
                              type="button"
                              onClick={() => setQueue(prev => prev.filter(q => q.id !== item.id))}
                              className="text-on-surface-variant hover:text-red-400 p-1 transition-colors"
                              aria-label={`Xóa tệp ${item.file.name}`}
                              title="Xóa tệp"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Files Action Summary */}
                <div className="flex items-center justify-between pt-1 text-xs text-on-surface-variant">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-secondary" />
                    <span>{queue.length} mục trong hàng đợi • {formatFileSize(totalSize)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setQueue([]); setActivePreviewId(null); }}
                    className="text-error font-medium hover:underline text-xs cursor-pointer"
                  >
                    Xóa tất cả
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* STEP 2 CARD: Dynamic Target Output Configuration */}
          <div className="bg-surface-container/60 border border-border-subtle/70 rounded-xl p-5 shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-primary text-on-primary font-mono text-xs font-bold flex items-center justify-center">2</span>
                <h2 className="text-sm font-semibold text-on-surface">Cấu Hình Định Dạng Đích &amp; Tinh Chỉnh</h2>
              </div>
              <span className="font-mono text-xs text-secondary font-bold">100% CLIENT-SIDE</span>
            </div>

            {/* Target Format Selector Buttons */}
            <div className="space-y-2">
              <label className="font-mono text-[10px] text-on-surface-variant block uppercase tracking-wider">
                Định dạng đầu ra mong muốn ({availableTargetOptions.length} định dạng hỗ trợ)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-1">
                {availableTargetOptions.map((opt) => {
                  const IconComponent = opt.icon;
                  const isSelected = targetFormat === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectTargetFormat(opt.id)}
                      className={`p-3 rounded-xl text-left transition-all border flex items-start gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-primary-container/15 border-primary shadow-sm ring-1 ring-primary/50'
                          : 'bg-surface border-border-subtle hover:bg-surface-container hover:border-slate-600'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg ${opt.color} flex items-center justify-center shrink-0`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-on-surface truncate">{opt.title}</span>
                          {isSelected && (
                            <span className="px-1.5 py-0.5 rounded bg-primary text-on-primary font-mono text-[9px] font-bold shrink-0">
                              Đã chọn
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-on-surface-variant line-clamp-1 mt-0.5">{opt.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Advanced Tuning Options */}
            <div className="space-y-3 pt-1 border-t border-border-subtle">
              <label className="font-mono text-[10px] text-on-surface-variant block uppercase tracking-wider">
                Tùy chọn xuất nâng cao
              </label>

              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  aria-label="Giữ nguyên siêu liên kết (Hyperlinks) & Bookmark mục lục"
                  checked={keepHyperlinks}
                  onChange={(e) => setKeepHyperlinks(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded bg-surface border-border-subtle accent-primary"
                />
                <div className="text-xs">
                  <span className="text-on-surface font-medium block">Giữ nguyên siêu liên kết (Hyperlinks) &amp; Mục lục</span>
                  <span className="text-on-surface-variant text-[11px]">Bảo toàn liên kết web và dàn mục lục phân cấp của tài liệu nguồn.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  aria-label="Tự động nhúng font chữ Unicode toàn diện"
                  checked={embedFonts}
                  onChange={(e) => setEmbedFonts(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded bg-surface border-border-subtle accent-primary"
                />
                <div className="text-xs">
                  <span className="text-on-surface font-medium block">Tự động nhúng font chữ Unicode toàn diện</span>
                  <span className="text-on-surface-variant text-[11px]">Tránh lỗi nhảy dòng hoặc hiển thị ô vuông khi mở file trên máy tính khác.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  aria-label="Tối ưu nén hình ảnh nhúng trong tài liệu"
                  checked={compressImages}
                  onChange={(e) => setCompressImages(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded bg-surface border-border-subtle accent-primary"
                />
                <div className="text-xs">
                  <span className="text-on-surface font-medium block">Tối ưu dung lượng hình ảnh nhúng</span>
                  <span className="text-on-surface-variant text-[11px]">Tự động nén thông minh giảm kích cỡ tệp mà vẫn đảm bảo độ nét in ấn.</span>
                </div>
              </label>
            </div>

            {/* Primary Execution CTA */}
            <button
              type="button"
              disabled={queue.length === 0 || isProcessingAll}
              onClick={handleConvertAll}
              className={`w-full py-3.5 px-6 rounded-xl font-mono text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                queue.length === 0 || isProcessingAll
                  ? 'bg-surface text-on-surface-variant/50 border border-border-subtle cursor-not-allowed'
                  : isAllDone
                  ? 'bg-secondary hover:bg-secondary/90 text-on-secondary shadow-secondary/20 active:scale-[0.99]'
                  : 'bg-primary hover:bg-primary/90 text-on-primary shadow-primary/20 active:scale-[0.99]'
              }`}
            >
              {isProcessingAll ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xử lý chuyển đổi ({completedCount}/{totalCount})...</span>
                </>
              ) : isAllDone ? (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Chuyển Đổi Lại {queue.length} Tệp Tin (Sang .{targetFormat.toUpperCase()})</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current" />
                  <span>
                    Bắt Đầu Chuyển Đổi {queuedCount > 0 ? queuedCount : queue.length} Tệp Tin (Sang .{targetFormat.toUpperCase()})
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ================================================================== */}
        {/* CỘT PHẢI: REALTIME PREVIEW VIEWPORT & PROGRESS                     */}
        {/* ================================================================== */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          {/* Processing Progress & Status Summary */}
          <div className="bg-surface-container/60 border border-border-subtle/70 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-500/15 text-secondary flex items-center justify-center border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span className="text-sm font-semibold text-on-surface">
                  {isAllDone
                    ? `Đã chuyển đổi hoàn tất ${completedCount}/${totalCount} tệp`
                    : queue.length > 0
                      ? `Hàng đợi: ${totalCount} tệp (${queuedCount} chờ, ${completedCount} xong${errorCount > 0 ? `, ${errorCount} lỗi` : ''})`
                      : 'Chưa có tệp tin nào trong hàng đợi'}
                </span>
              </div>
              <span className="font-mono text-xs text-secondary bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded self-start sm:self-auto">
                Client-Side WASM
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="w-full h-2 bg-surface rounded-full overflow-hidden border border-border-subtle">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300 rounded-full"
                  style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
                />
              </div>
              <div className="flex justify-between text-xs font-mono text-on-surface-variant pt-0.5">
                <span>{totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}% Hoàn thành</span>
                <span>{completedCount} / {totalCount} tệp sẵn sàng</span>
              </div>
            </div>

            {/* Download Zip CTA if finished */}
            {completedCount > 0 && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleDownloadAllZip}
                  className="w-full py-3 px-6 rounded-xl bg-secondary hover:bg-secondary/90 text-on-secondary font-mono text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-secondary/20 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải Về Toàn Bộ Tệp Đã Chuyển Đổi (.ZIP)</span>
                </button>
              </div>
            )}
          </div>

          {/* Realtime Live Preview Viewport */}
          <DynamicRealtimePreviewViewport
            activeItem={currentPreviewItem}
            zoomLevel={zoomLevel}
            setZoomLevel={setZoomLevel}
            onDownloadSingle={handleDownloadSingle}
            displayLang={displayLang}
          />
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. SETTINGS MODAL                                                    */}
      {/* ==================================================================== */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-surface border border-border-subtle rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-surface-container/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary text-on-primary">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">Cài Đặt Chuyển Đổi Nâng Cao</h3>
                  <p className="text-xs text-on-surface-variant">Tùy chỉnh khổ giấy, chất lượng và độ phân giải xuất</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                aria-label="Đóng cửa sổ cài đặt"
                className="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-subtle transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs text-on-surface">
              <div className="space-y-1.5">
                <label className="font-semibold uppercase tracking-wider text-on-surface-variant">Khổ giấy PDF</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[{ id: 'a4', label: 'A4' }, { id: 'letter', label: 'US Letter' }, { id: 'fit', label: 'Khớp kích thước ảnh' }].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSettings(s => ({ ...s, pageSize: opt.id }))}
                      className={`py-2 px-3 rounded-lg font-medium border transition-all cursor-pointer ${
                        settings.pageSize === opt.id
                          ? 'bg-primary text-on-primary font-bold border-primary'
                          : 'bg-surface-container text-on-surface-variant border-border-subtle hover:bg-surface-bright'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold uppercase tracking-wider text-on-surface-variant">Hướng trang giấy</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[{ id: 'auto', label: 'Tự động' }, { id: 'portrait', label: 'Dọc (Portrait)' }, { id: 'landscape', label: 'Ngang (Landscape)' }].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSettings(s => ({ ...s, orientation: opt.id }))}
                      className={`py-2 px-3 rounded-lg font-medium border transition-all cursor-pointer ${
                        settings.orientation === opt.id
                          ? 'bg-primary text-on-primary font-bold border-primary'
                          : 'bg-surface-container text-on-surface-variant border-border-subtle hover:bg-surface-bright'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold uppercase tracking-wider text-on-surface-variant">Độ nét trích xuất trang PDF ➔ Ảnh / PPTX</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[{ val: 1.5, label: '1.5x (Web)' }, { val: 2.0, label: '2.0x (150 DPI)' }, { val: 3.0, label: '3.0x (300 DPI)' }].map(opt => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setSettings(s => ({ ...s, scale: opt.val }))}
                      className={`py-2 px-3 rounded-lg font-medium border transition-all cursor-pointer ${
                        settings.scale === opt.val
                          ? 'bg-primary text-on-primary font-bold border-primary'
                          : 'bg-surface-container text-on-surface-variant border-border-subtle hover:bg-surface-bright'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="font-semibold uppercase tracking-wider text-on-surface-variant">Chất lượng nén ảnh JPG / WebP</label>
                  <span className="font-mono text-primary font-bold">{Math.round(settings.quality * 100)}%</span>
                </div>
                <input
                  type="range"
                  aria-label="Chất lượng ảnh JPG/WebP"
                  min="0.5"
                  max="1.0"
                  step="0.05"
                  value={settings.quality}
                  onChange={(e) => setSettings(s => ({ ...s, quality: parseFloat(e.target.value) }))}
                  className="w-full h-1.5 bg-surface-container rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-border-subtle bg-surface-container/40">
              <button
                type="button"
                onClick={() => setSettings({ pageSize: 'a4', orientation: 'auto', scale: 2.0, quality: 0.92, margin: 20 })}
                className="text-xs text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              >
                Mặc định
              </button>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold shadow-md transition-colors cursor-pointer"
              >
                Áp Dụng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 4. PREVIEW MODAL (Full Window Inspector)                             */}
      {/* ==================================================================== */}
      {previewModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-4xl h-[85vh] bg-surface border border-border-subtle rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-surface-container/60">
              <div className="truncate">
                <h3 className="text-sm font-bold text-on-surface truncate">
                  {previewModalItem.result?.filename || previewModalItem.file?.name}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {previewModalItem.result && (
                  <button
                    type="button"
                    onClick={() => handleDownloadSingle(previewModalItem)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/90 text-on-secondary text-xs font-bold shadow-md transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải về</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeModalPreview}
                  aria-label="Đóng cửa sổ xem trước"
                  className="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-subtle transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-surface-container/40 p-4 overflow-auto flex items-center justify-center">
              {previewModalUrl && (
                (() => {
                  const ext = (previewModalItem.result?.filename || previewModalItem.file?.name || '').split('.').pop()?.toLowerCase();
                  if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'bmp'].includes(ext)) {
                    return <img src={previewModalUrl} alt="Preview" className="max-h-full max-w-full object-contain rounded-lg shadow-lg border border-border-subtle" />;
                  }
                  if (ext === 'pdf') {
                    return <iframe src={previewModalUrl} title="PDF Preview" className="w-full h-full rounded-lg border border-border-subtle bg-surface-container-lowest" />;
                  }
                  return (
                    <div className="text-center p-8 space-y-3">
                      <div className="w-16 h-16 rounded-2xl bg-primary text-on-primary flex items-center justify-center mx-auto shadow-md">
                        <FileText className="w-8 h-8" />
                      </div>
                      <h4 className="text-base font-bold text-on-surface">Tệp đã sẵn sàng</h4>
                      {previewModalItem.result && (
                        <button
                          type="button"
                          onClick={() => handleDownloadSingle(previewModalItem)}
                          className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold shadow-lg cursor-pointer"
                        >
                          Tải tệp .{ext?.toUpperCase()}
                        </button>
                      )}
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Realtime Dynamic Preview Viewport
 * Renders actual uploaded file contents (images, rendered PDF canvas, Excel tables, Docx text)
 */
function DynamicRealtimePreviewViewport({ activeItem, zoomLevel, setZoomLevel, onDownloadSingle, displayLang }) {
  const [previewTab, setPreviewTab] = useState('source'); // 'source' or 'result'
  const [isLoading, setIsLoading] = useState(false);
  const [previewState, setPreviewState] = useState(null);
  const [pdfPage, setPdfPage] = useState(1);
  const [pdfTotalPages, setPdfTotalPages] = useState(1);
  const [activeSheetIdx, setActiveSheetIdx] = useState(0);

  // Auto switch tab when completed
  useEffect(() => {
    if (activeItem?.result?.blob) {
      setPreviewTab('result');
    } else {
      setPreviewTab('source');
    }
  }, [activeItem?.id, activeItem?.status]);

  useEffect(() => {
    setPdfPage(1);
    setActiveSheetIdx(0);
  }, [activeItem?.id, previewTab]);

  useEffect(() => {
    if (!activeItem) {
      setPreviewState(null);
      return;
    }

    let isCancelled = false;
    const isResult = previewTab === 'result' && activeItem.result?.blob;
    const blob = isResult ? activeItem.result.blob : activeItem.file;
    const filename = isResult ? activeItem.result.filename : (activeItem.file?.name || '');
    const ext = getFileExtension(filename) || (isResult ? activeItem.targetFormat : activeItem.sourceFormat);

    const loadContent = async () => {
      setIsLoading(true);
      try {
        // 1. Merge Group Source Preview
        if (activeItem.isMergeGroup && !isResult) {
          const thumbnails = (activeItem.rawImageFiles || []).map(f => ({
            name: f.name,
            size: f.size,
            url: URL.createObjectURL(f)
          }));
          if (!isCancelled) {
            setPreviewState({ type: 'merge-group', thumbnails, filename });
          }
          return;
        }

        // 2. Images
        const imageExts = ['png', 'jpg', 'jpeg', 'webp', 'svg', 'bmp'];
        if (imageExts.includes(ext)) {
          const url = URL.createObjectURL(blob);
          if (!isCancelled) {
            setPreviewState({ type: 'image', url, filename });
          }
          return;
        }

        // 3. PDF
        if (ext === 'pdf') {
          const pdfDoc = await loadPdfDocument(blob);
          if (isCancelled) return;
          setPdfTotalPages(pdfDoc.numPages);
          const safePage = Math.min(Math.max(1, pdfPage), pdfDoc.numPages);
          const canvas = await renderPdfPageToCanvas(pdfDoc, safePage, 1.5);
          if (isCancelled) return;
          const dataUrl = canvas.toDataURL('image/png');
          if (!isCancelled) {
            setPreviewState({ type: 'pdf', dataUrl, page: safePage, total: pdfDoc.numPages, filename });
          }
          return;
        }

        // 4. Excel / Spreadsheet
        if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
          const arrayBuffer = await blob.arrayBuffer();
          if (isCancelled) return;
          const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
          const sheetNames = workbook.SheetNames || [];
          const sheetName = sheetNames[activeSheetIdx] || sheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: false });
          if (!isCancelled) {
            setPreviewState({
              type: 'spreadsheet',
              sheetNames,
              activeSheetName: sheetName,
              headers: rawData[0] || [],
              rows: rawData.slice(1, 40),
              totalRows: Math.max(0, rawData.length - 1),
              filename
            });
          }
          return;
        }

        // 5. Word DOCX
        if (ext === 'docx') {
          const arrayBuffer = await blob.arrayBuffer();
          if (isCancelled) return;
          const mammothResult = await mammoth.convertToHtml({ arrayBuffer });
          if (!isCancelled) {
            setPreviewState({
              type: 'docx',
              html: mammothResult.value || '<p>Không có nội dung văn bản trong tệp.</p>',
              filename
            });
          }
          return;
        }

        // 6. Markdown (.md)
        if (ext === 'md') {
          const text = await blob.text();
          if (!isCancelled) {
            setPreviewState({ type: 'markdown', markdown: text.slice(0, 50000), filename });
          }
          return;
        }

        // 7. HTML (.html)
        if (ext === 'html') {
          const text = await blob.text();
          if (!isCancelled) {
            setPreviewState({ type: 'html', html: text, filename });
          }
          return;
        }

        // 8. Text
        if (ext === 'txt') {
          const text = await blob.text();
          if (!isCancelled) {
            setPreviewState({ type: 'text', text: text.slice(0, 30000), filename });
          }
          return;
        }

        // 7. PPTX
        if (ext === 'pptx') {
          const arrayBuffer = await blob.arrayBuffer();
          if (isCancelled) return;
          const zip = await JSZip.loadAsync(arrayBuffer);
          const slideEntries = [];
          zip.folder('ppt/slides')?.forEach((_rel, entry) => {
            if (/slide\d+\.xml$/i.test(entry.name)) slideEntries.push(entry);
          });
          let slideTexts = [];
          if (slideEntries.length > 0) {
            const slideXml = await slideEntries[0].async('text');
            const textMatches = slideXml.match(/<a:t>([^<]+)<\/a:t>/g) || [];
            slideTexts = textMatches.map(m => m.replace(/<\/?a:t>/g, '').trim()).filter(Boolean);
          }
          if (!isCancelled) {
            setPreviewState({
              type: 'pptx',
              totalSlides: slideEntries.length,
              slideTitle: slideTexts[0] || 'Slide 1',
              slideBody: slideTexts.slice(1),
              filename
            });
          }
          return;
        }

        // Default Fallback
        if (!isCancelled) {
          setPreviewState({ type: 'ready', filename, ext, size: blob.size });
        }
      } catch (err) {
        console.warn('Preview error:', err);
        if (!isCancelled) {
          setPreviewState({ type: 'error', error: err.message || 'Không thể xem trước tệp này', filename });
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    loadContent();

    return () => {
      isCancelled = true;
      if (previewState?.url) URL.revokeObjectURL(previewState.url);
      if (previewState?.thumbnails) {
        previewState.thumbnails.forEach(t => URL.revokeObjectURL(t.url));
      }
    };
  }, [activeItem?.id, activeItem?.status, previewTab, pdfPage, activeSheetIdx]);

  return (
    <div className="bg-surface-container/60 border border-border-subtle/70 rounded-xl shadow-sm overflow-hidden flex flex-col">
      {/* Viewport Header */}
      <div className="p-3 bg-surface border-b border-border-subtle flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setPreviewTab('source')}
            className={`px-3 py-1.5 rounded-lg font-mono text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
              previewTab === 'source'
                ? 'bg-primary text-on-primary font-bold shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span>Tệp Nguồn {activeItem ? `(.${activeItem.sourceFormat?.toUpperCase()})` : ''}</span>
          </button>
          {activeItem?.result && (
            <button
              type="button"
              onClick={() => setPreviewTab('result')}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                previewTab === 'result'
                  ? 'bg-secondary text-on-secondary font-bold shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Kết Quả Đã Xuất (.{activeItem.targetFormat?.toUpperCase()})</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-on-surface-variant">
          <span className="hidden sm:inline">Zoom: {zoomLevel}%</span>
          <button
            type="button"
            onClick={() => setZoomLevel(z => Math.max(50, z - 10))}
            className="p-1 rounded hover:bg-surface-container text-on-surface-variant cursor-pointer"
            aria-label="Thu nhỏ xem trước"
            title="Thu nhỏ"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel(z => Math.min(150, z + 10))}
            className="p-1 rounded hover:bg-surface-container text-on-surface-variant cursor-pointer"
            aria-label="Phóng to xem trước"
            title="Phóng to"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Viewport Content */}
      <div className="p-6 bg-surface-container-high min-h-[460px] flex items-center justify-center overflow-auto border-t border-border-subtle/50 relative">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 text-on-surface-variant">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
            <span className="text-xs font-mono">Đang đọc và dựng nội dung xem trước...</span>
          </div>
        ) : !activeItem ? (
          <div className="flex flex-col items-center justify-center text-center p-8 text-on-surface-variant">
            <div className="w-16 h-16 rounded-2xl bg-surface-container border border-border-subtle flex items-center justify-center text-primary-container mb-3 shadow-inner">
              <FileStack className="w-8 h-8 opacity-60" />
            </div>
            <h3 className="text-sm font-bold text-on-surface mb-1">Chưa Có Tệp Tin Xem Trước</h3>
            <p className="text-xs text-on-surface-variant max-w-sm leading-relaxed">
              Tải lên tài liệu Word, Excel, PowerPoint, PDF hoặc hình ảnh để xem trước trực tiếp tại khung này.
            </p>
          </div>
        ) : previewState?.type === 'merge-group' ? (
          /* Group of Images Preview */
          <div className="w-full max-w-2xl space-y-4" style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}>
            <div className="p-3 bg-surface-container/80 rounded-xl border border-border-subtle flex items-center justify-between text-xs text-on-surface">
              <span className="font-semibold">Bộ ảnh chuẩn bị gộp ({previewState.thumbnails.length} tệp)</span>
              <span className="text-primary font-mono font-bold">➔ Xuất sang 1 file PDF</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {previewState.thumbnails.map((img, idx) => (
                <div key={idx} className="bg-surface rounded-lg p-2 border border-border-subtle flex flex-col items-center gap-1.5">
                  <div className="w-full h-24 bg-surface-container rounded overflow-hidden flex items-center justify-center">
                    <img src={img.url} alt={img.name} className="max-h-full max-w-full object-cover" />
                  </div>
                  <span className="text-[10px] font-mono text-on-surface truncate w-full text-center">{img.name}</span>
                </div>
              ))}
            </div>
          </div>
        ) : previewState?.type === 'image' ? (
          /* Real Image Preview */
          <div className="flex flex-col items-center justify-center" style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}>
            <img
              src={previewState.url}
              alt={previewState.filename}
              className="max-h-[460px] max-w-full object-contain rounded-xl shadow-2xl border border-border-subtle"
            />
            <span className="font-mono text-[11px] text-on-surface-variant mt-2">{previewState.filename}</span>
          </div>
        ) : previewState?.type === 'pdf' ? (
          /* Real PDF Canvas Preview with Page Controls */
          <div className="flex flex-col items-center justify-center space-y-3" style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}>
            {previewState.total > 1 && (
              <div className="flex items-center gap-3 bg-surface-container/90 px-3 py-1.5 rounded-xl border border-border-subtle text-xs font-mono text-on-surface">
                <button
                  type="button"
                  disabled={pdfPage <= 1}
                  onClick={() => setPdfPage(p => Math.max(1, p - 1))}
                  className="p-1 rounded hover:bg-surface disabled:opacity-30 cursor-pointer"
                  title="Trang trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span>Trang {pdfPage} / {previewState.total}</span>
                <button
                  type="button"
                  disabled={pdfPage >= previewState.total}
                  onClick={() => setPdfPage(p => Math.min(previewState.total, p + 1))}
                  className="p-1 rounded hover:bg-surface disabled:opacity-30 cursor-pointer"
                  title="Trang sau"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
            <img
              src={previewState.dataUrl}
              alt={`PDF Page ${pdfPage}`}
              className="max-h-[500px] max-w-full rounded shadow-2xl border border-border-subtle bg-surface-container-lowest"
            />
          </div>
        ) : previewState?.type === 'spreadsheet' ? (
          /* Real Spreadsheet Table Preview */
          <div className="w-full max-w-2xl bg-surface rounded-xl border border-border-subtle p-4 space-y-3 text-xs text-on-surface" style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}>
            {previewState.sheetNames.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border-subtle">
                {previewState.sheetNames.map((name, sIdx) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setActiveSheetIdx(sIdx)}
                    className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                      activeSheetIdx === sIdx
                        ? 'bg-secondary text-on-secondary font-bold'
                        : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
            <div className="overflow-x-auto max-h-[380px] rounded border border-border-subtle">
              <table className="w-full text-left font-mono text-[11px] border-collapse">
                <thead className="bg-surface-container font-bold text-on-surface sticky top-0">
                  <tr>
                    <th className="p-2 border border-border-subtle text-center w-8 bg-surface-container-high">#</th>
                    {previewState.headers.map((h, i) => (
                      <th key={i} className="p-2 border border-border-subtle truncate max-w-[140px]">{String(h)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewState.rows.map((row, rIdx) => (
                    <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-surface' : 'bg-surface-container/40'}>
                      <td className="p-2 border border-border-subtle text-center text-on-surface-variant">{rIdx + 1}</td>
                      {previewState.headers.map((_, cIdx) => (
                        <td key={cIdx} className="p-2 border border-border-subtle truncate max-w-[140px]">
                          {String(row[cIdx] !== undefined ? row[cIdx] : '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between text-[11px] text-on-surface-variant font-mono">
              <span>Hiển thị tối đa 40 dòng đầu</span>
              <span>Tổng: {previewState.totalRows} hàng</span>
            </div>
          </div>
        ) : previewState?.type === 'docx' ? (
          /* Real Word Document Preview in Sheet Container */
          <div
            className="w-full max-w-xl bg-surface-container-lowest text-on-surface p-8 rounded-xl shadow-2xl text-xs overflow-auto max-h-[460px] leading-relaxed prose prose-sm"
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
            dangerouslySetInnerHTML={{ __html: previewState.html }}
          />
        ) : previewState?.type === 'markdown' ? (
          /* Real Markdown Document Preview */
          <div
            className="w-full max-w-xl bg-surface-container-lowest text-on-surface p-6 rounded-xl shadow-2xl border border-border-subtle text-xs overflow-auto max-h-[460px] leading-relaxed space-y-3"
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
          >
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <span className="font-mono text-xs font-bold text-primary truncate">{previewState.filename}</span>
              <span className="px-2 py-0.5 rounded bg-primary/15 text-primary font-mono text-[10px] font-bold uppercase">Markdown</span>
            </div>
            <pre
              tabIndex={0}
              className="font-mono text-xs text-on-surface overflow-auto whitespace-pre-wrap select-all leading-relaxed"
            >
              {previewState.markdown}
            </pre>
          </div>
        ) : previewState?.type === 'html' ? (
          /* Real HTML Document Preview */
          <div
            className="w-full max-w-xl bg-surface-container-lowest text-on-surface p-6 rounded-xl shadow-2xl border border-border-subtle text-xs overflow-auto max-h-[460px] leading-relaxed space-y-3"
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
          >
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <span className="font-mono text-xs font-bold text-amber-400 truncate">{previewState.filename}</span>
              <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 font-mono text-[10px] font-bold uppercase">HTML</span>
            </div>
            <iframe
              title="HTML Preview"
              srcDoc={previewState.html}
              className="w-full h-[360px] rounded border border-border-subtle bg-surface-container-lowest"
              sandbox="allow-same-origin"
            />
          </div>
        ) : previewState?.type === 'text' ? (
          /* Real Text Monospace Preview */
          <pre
            tabIndex={0}
            className="w-full max-w-xl max-h-[440px] p-4 bg-surface rounded-xl border border-border-subtle font-mono text-xs text-on-surface overflow-auto whitespace-pre-wrap select-all"
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
          >
            {previewState.text}
          </pre>
        ) : previewState?.type === 'pptx' ? (
          /* Real PPTX Slide Preview */
          <div className="w-full max-w-lg bg-surface-container-lowest text-on-surface rounded-xl p-6 shadow-2xl border-t-8 border-orange-500 space-y-3 text-xs" style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}>
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <span className="font-bold text-sm text-on-surface truncate">{previewState.slideTitle}</span>
              <span className="text-[10px] font-mono text-on-surface-variant">{previewState.totalSlides} Slide</span>
            </div>
            <div className="space-y-1.5 text-on-surface max-h-[260px] overflow-auto py-2">
              {previewState.slideBody.length > 0 ? (
                previewState.slideBody.map((b, idx) => (
                  <p key={idx} className="leading-relaxed">• {b}</p>
                ))
              ) : (
                <p className="italic text-on-surface-variant">Slide không chứa nội dung văn bản ngoài tiêu đề.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center p-8 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-surface-container text-primary border border-border-subtle flex items-center justify-center mx-auto">
              <File className="w-8 h-8" />
            </div>
            <h4 className="text-sm font-bold text-on-surface">{previewState?.filename || activeItem.file.name}</h4>
            <p className="text-xs text-on-surface-variant">Tệp đã sẵn sàng trong hàng đợi.</p>
            {activeItem.result && (
              <button
                type="button"
                onClick={() => onDownloadSingle(activeItem)}
                className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/90 text-on-secondary text-xs font-bold shadow-md cursor-pointer"
              >
                Tải về tệp kết quả
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
