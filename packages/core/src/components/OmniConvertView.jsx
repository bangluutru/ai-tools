/**
 * OmniConvertView.jsx
 * ========================================================================
 * Self-contained OmniConvert miniapp for the AI-Tools portal.
 * Bidirectional conversion between Office formats (DOCX, PPTX, XLSX),
 * Images, Markdown, and PDF using in-browser WebAssembly engines.
 *
 * Redesigned to strictly match Modern Utility Workspace Design System.
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
  Check,
  Home,
  CheckSquare,
  Copy,
  FolderArchive,
  Code,
  Sparkles,
  Zap,
  ZoomIn,
  ZoomOut
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

export default function OmniConvertView({ displayLang = 'vi' }) {
  const [activePreset, setActivePreset] = useState('all-to-pdf');
  const [_sourceFormat, setSourceFormat] = useState('docx');
  const [targetFormat, setTargetFormat] = useState('pdf');
  const [mergeImagesToPdf, setMergeImagesToPdf] = useState(false);

  const [queue, setQueue] = useState([]);
  const [fileError, setFileError] = useState('');
  const [isProcessingAll, setIsProcessingAll] = useState(false);

  // Preview & Viewport states
  const [previewTab, setPreviewTab] = useState('pdf');
  const [previewItem, setPreviewItem] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewText, setPreviewText] = useState(null);
  const [copiedMd, setCopiedMd] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);

  // Advanced toggles
  const [keepHyperlinks, setKeepHyperlinks] = useState(true);
  const [embedFonts, setEmbedFonts] = useState(true);
  const [compressImages, setCompressImages] = useState(true);
  const [cleanLlmMarkdown, setCleanLlmMarkdown] = useState(true);

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

  // Preset Selection
  const handleSelectPreset = (preset) => {
    setActivePreset(preset.id);
    if (preset.id === 'all-to-pdf') {
      setSourceFormat('docx');
      setTargetFormat('pdf');
      setMergeImagesToPdf(false);
    } else if (preset.id === 'pdf-to-office') {
      setSourceFormat('pdf');
      setTargetFormat('docx');
      setMergeImagesToPdf(false);
    } else if (preset.id === 'img-to-pdf') {
      setSourceFormat('png');
      setTargetFormat('pdf');
      setMergeImagesToPdf(true);
    } else if (preset.id === 'pdf-to-img') {
      setSourceFormat('pdf');
      setTargetFormat('png');
      setMergeImagesToPdf(false);
    }
  };

  const handleSelectTargetFormat = (newTarget) => {
    setTargetFormat(newTarget);
    setActivePreset('custom');
  };

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

    const newItems = [];

    if (mergeImagesToPdf && imageFiles.length > 1) {
      const virtualFile = new File([imageFiles[0]], `Merged_${imageFiles.length}_Images.pdf`, { type: 'application/pdf' });
      newItems.push({
        id: `merged-${Date.now()}`,
        file: virtualFile,
        rawImageFiles: imageFiles,
        isMergeGroup: true,
        sourceFormat: 'image',
        targetFormat: 'pdf',
        status: 'queued',
        progress: 0,
        error: null,
        result: null
      });
    } else {
      imageFiles.forEach(file => {
        const ext = getFileExtension(file.name);
        const validTargets = getSupportedTargets(ext);
        const defaultTarget = validTargets.includes(targetFormat) ? targetFormat : (validTargets[0] || 'pdf');

        newItems.push({
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

    otherFiles.forEach(file => {
      const ext = getFileExtension(file.name);
      const validTargets = getSupportedTargets(ext);
      const defaultTarget = validTargets.includes(targetFormat) ? targetFormat : (validTargets[0] || 'pdf');

      newItems.push({
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

    setQueue(prev => [...prev, ...newItems]);
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

  const handleConvertSingle = async (id) => {
    const item = queue.find(q => q.id === id);
    if (!item || item.status === 'converting') return;

    setQueue(prev => prev.map(q => q.id === id ? { ...q, status: 'converting', progress: 5, error: null } : q));

    try {
      let result;
      if (item.isMergeGroup && item.rawImageFiles) {
        result = await mergeMultipleImagesToPdf(item.rawImageFiles, settings, (p) => {
          setQueue(prev => prev.map(q => q.id === id ? { ...q, progress: p } : q));
        });
      } else {
        result = await executeConversion(item.file, item.targetFormat, settings, (p) => {
          setQueue(prev => prev.map(q => q.id === id ? { ...q, progress: p } : q));
        });
      }

      setQueue(prev => prev.map(q => q.id === id ? { ...q, status: 'completed', progress: 100, result } : q));

      confetti({ particleCount: 30, spread: 60, origin: { y: 0.85 } });
    } catch (err) {
      console.error(err);
      setQueue(prev => prev.map(q => q.id === id ? { ...q, status: 'error', error: err.message || 'Lỗi chuyển đổi' } : q));
    }
  };

  const handleConvertAll = async () => {
    const queuedItems = queue.filter(q => q.status === 'queued' || q.status === 'error');
    if (queuedItems.length === 0) return;

    setIsProcessingAll(true);
    for (const item of queuedItems) {
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

  // Preview management
  const openPreview = (item) => {
    setPreviewItem(item);
    const blob = item.result?.blob || item.file;
    if (blob) {
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);

      const ext = (item.result?.filename || item.file?.name || '').split('.').pop()?.toLowerCase();
      if (['txt', 'csv', 'md'].includes(ext)) {
        const reader = new FileReader();
        reader.onload = (e) => setPreviewText(e.target?.result);
        reader.readAsText(blob);
      } else {
        setPreviewText(null);
      }
    }
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewItem(null);
    setPreviewUrl(null);
    setPreviewText(null);
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
      default: return <File className="w-5 h-5 text-slate-400" />;
    }
  };

  const totalCount = queue.length;
  const completedCount = queue.filter(q => q.status === 'completed').length;
  const queuedCount = queue.filter(q => q.status === 'queued').length;
  const errorCount = queue.filter(q => q.status === 'error').length;
  const isAllDone = totalCount > 0 && completedCount === totalCount;
  const totalSize = queue.reduce((acc, q) => acc + (q.file?.size || 0), 0);

  const activePreviewFile = queue.find(q => q.status === 'completed') || queue[0] || null;

  return (
    <div className="w-full flex flex-col space-y-8 pb-12">
      {/* ==================================================================== */}
      {/* 1. BREADCRUMB & TOOL HEADER                                         */}
      {/* ==================================================================== */}
      <section className="flex flex-col space-y-4">
        {/* Breadcrumb */}
        <div className="flex items-center justify-between gap-4">
          <nav className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <a href="#/tat-ca" className="hover:text-primary-container transition-colors flex items-center gap-1">
              <Home className="w-3.5 h-3.5" />
              <span>Trang chủ</span>
            </a>
            <span className="text-slate-600">/</span>
            <a href="#/tien-ich" className="hover:text-primary-container transition-colors">Tiện ích & Văn phòng</a>
            <span className="text-slate-600">/</span>
            <span className="text-slate-200 font-medium">Chuyển Đổi OmniConvert</span>
          </nav>
          <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
            <span>WASM ENGINE v3.1.8 ACTIVE</span>
          </div>
        </div>

        {/* Tool Header Block */}
        <div className="bg-surface-container/60 border border-border-subtle/70 rounded-xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-64 h-64 bg-primary-container/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-surface-container border border-border-subtle flex items-center justify-center text-primary-container shrink-0 shadow-sm">
                <FileStack className="w-8 h-8" />
              </div>
              <div className="space-y-2 max-w-3xl">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
                  Chuyển Đổi OmniConvert — Office sang PDF & Markdown
                </h1>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-primary-container/15 text-primary-container font-mono text-[11px] font-semibold">
                    DOCS WASM
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-secondary font-mono text-[11px] font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                    OFFLINE CLIENT-SIDE
                  </span>
                  <span className="px-2 py-0.5 rounded bg-surface-container text-slate-300 font-mono text-[11px]">
                    CHUẨN GỐC FORMAT
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 font-mono text-[11px]">
                    LLM READY
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Chuyển đổi tức thì tài liệu văn phòng Office (Word .docx, Excel .xlsx, PowerPoint .pptx, TXT, HTML) sang PDF chuẩn in ấn hoặc Markdown / Clean HTML tối ưu cho LLM/AI prompt mà không làm mất định dạng bảng biểu hay tiêu đề.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-border-subtle hover:bg-surface-container text-slate-300 text-xs font-medium transition-colors"
              >
                <Sliders className="w-4 h-4 text-primary-container" />
                <span>Cài đặt xuất</span>
              </button>
            </div>
          </div>

          {/* Security & Offline Banner */}
          <div className="mt-5 p-3 bg-surface/80 border border-emerald-500/20 rounded-lg flex items-start sm:items-center gap-3 text-xs">
            <div className="w-7 h-7 rounded bg-emerald-500/15 text-secondary flex items-center justify-center shrink-0 border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="flex-1 text-slate-300 leading-relaxed">
              <span className="text-secondary font-bold font-mono uppercase tracking-wide mr-1.5">
                BẢO MẬT CLIENT-SIDE 100% — XỬ LÝ NỘI BỘ BẰNG WEBASSEMBLY:
              </span>
              Toàn bộ quá trình parse tài liệu diễn ra trực tiếp trong RAM trình duyệt, bảo vệ 100% bí mật kinh doanh và dữ liệu hợp đồng nội bộ.
            </div>
          </div>
        </div>

        {/* Popular Presets Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {POPULAR_PRESETS.map((preset) => {
            const isActive = activePreset === preset.id;
            const label = preset[`label_${displayLang}`] || preset.label_vi;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  isActive
                    ? 'bg-primary-container/20 text-primary-container border-primary-container/60 shadow-sm'
                    : 'bg-surface-container/60 text-slate-300 border-border-subtle hover:bg-surface-container hover:text-white'
                }`}
              >
                <span>{label}</span>
                {isActive && <Check className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>
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
                <span className="w-6 h-6 rounded bg-primary-container text-slate-950 font-mono text-xs font-bold flex items-center justify-center">1</span>
                <h2 className="text-sm font-semibold text-slate-100">Tải Tệp Tin Văn Phòng Nguồn</h2>
              </div>
              <span className="font-mono text-xs text-slate-400">Tối đa 50MB / tệp</span>
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
              <span className="text-sm font-medium text-slate-200 mb-1">
                Kéo thả tài liệu vào đây, hoặc <span className="text-primary-container underline underline-offset-4">Duyệt tệp tin</span>
              </span>
              <p className="text-xs text-slate-400 max-w-sm">
                Hỗ trợ Word (.docx), Excel (.xlsx, .csv), PowerPoint (.pptx), Ảnh (.png, .jpg), HTML, TXT.
              </p>
              <div className="flex items-center gap-2 mt-3">
                {['DOCX', 'XLSX', 'PPTX', 'PNG', 'PDF'].map((ext) => (
                  <span key={ext} className="px-2 py-0.5 rounded bg-surface font-mono text-[10px] text-slate-400 border border-border-subtle">
                    {ext}
                  </span>
                ))}
              </div>
            </div>

            {/* Merge Images Toggle */}
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-surface border border-border-subtle text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary-container" />
                <span>Gộp nhiều tệp ảnh thành 1 tài liệu PDF duy nhất</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={mergeImagesToPdf}
                  onChange={(e) => setMergeImagesToPdf(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-surface-container peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-container" />
              </label>
            </div>

            {/* Staged Files List */}
            {queue.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                  {queue.map((item) => {
                    const sourceDetails = FORMAT_DETAILS[item.sourceFormat] || {};
                    return (
                      <div
                        key={item.id}
                        className="p-3 rounded-lg bg-surface border border-border-subtle flex items-center justify-between gap-3 hover:border-slate-600 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-surface-container border border-border-subtle flex items-center justify-center shrink-0">
                            {renderIcon(sourceDetails.category)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-slate-200 truncate">{item.file.name}</div>
                            <div className="font-mono text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>{formatFileSize(item.file.size)}</span>
                              <span>•</span>
                              <span className="uppercase text-primary-container font-semibold">.{item.sourceFormat}</span>
                              <span>➔</span>
                              <span className="uppercase text-secondary font-semibold">.{item.targetFormat}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {item.status === 'converting' && (
                            <span className="font-mono text-xs text-primary-container flex items-center gap-1">
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
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-secondary font-mono text-[11px] rounded flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Sẵn sàng
                            </span>
                          )}
                          {item.status === 'error' && (
                            <span className="px-2 py-0.5 bg-red-500/15 text-red-400 font-mono text-[11px] rounded">
                              Lỗi
                            </span>
                          )}

                          {item.status === 'completed' && (
                            <>
                              <button
                                type="button"
                                onClick={() => openPreview(item)}
                                className="p-1 rounded bg-surface-container hover:bg-surface-bright text-slate-300 transition-colors"
                                title="Xem trước chi tiết"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownloadSingle(item)}
                                className="p-1 rounded bg-emerald-500/20 text-secondary hover:bg-emerald-500/30 transition-colors"
                                title="Tải tệp này"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() => setQueue(prev => prev.filter(q => q.id !== item.id))}
                            className="text-slate-400 hover:text-red-400 p-1 transition-colors"
                            title="Xóa tệp"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Files Action Summary */}
                <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-secondary" />
                    <span>{queue.length} tệp đã chọn • {formatFileSize(totalSize)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setQueue([])}
                    className="text-red-400 hover:underline text-xs"
                  >
                    Xóa tất cả
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* STEP 2 CARD: Target Output & Tuning Configuration */}
          <div className="bg-surface-container/60 border border-border-subtle/70 rounded-xl p-5 shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-primary-container text-slate-950 font-mono text-xs font-bold flex items-center justify-center">2</span>
                <h2 className="text-sm font-semibold text-slate-100">Cấu Hình Định Dạng Đích & Tinh Chỉnh</h2>
              </div>
              <span className="font-mono text-xs text-secondary font-bold">CHẤT LƯỢNG CAO NHẤT</span>
            </div>

            {/* Target Format Selector Buttons */}
            <div className="space-y-2">
              <label className="font-mono text-[10px] text-slate-400 block uppercase tracking-wider">
                Định dạng đầu ra mong muốn
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Format 1: PDF */}
                <button
                  type="button"
                  onClick={() => handleSelectTargetFormat('pdf')}
                  className={`p-3 rounded-lg text-left transition-all border flex items-start gap-3 ${
                    targetFormat === 'pdf'
                      ? 'bg-primary-container/15 border-primary-container/60 shadow-sm'
                      : 'bg-surface border-border-subtle hover:bg-surface-container hover:border-slate-600'
                  }`}
                >
                  <div className="w-8 h-8 rounded bg-primary-container/20 text-primary-container flex items-center justify-center shrink-0">
                    <FileCode className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200">PDF In Ấn & Vector</span>
                      {targetFormat === 'pdf' && (
                        <span className="px-1.5 py-0.5 rounded bg-primary-container text-slate-950 font-mono text-[10px] font-bold">
                          Đã chọn
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">Chuẩn A4, dàn trang pixel-perfect</p>
                  </div>
                </button>

                {/* Format 2: Markdown LLM */}
                <button
                  type="button"
                  onClick={() => { handleSelectTargetFormat('md'); setPreviewTab('md'); }}
                  className={`p-3 rounded-lg text-left transition-all border flex items-start gap-3 ${
                    targetFormat === 'md'
                      ? 'bg-emerald-500/15 border-emerald-500/60 shadow-sm'
                      : 'bg-surface border-border-subtle hover:bg-surface-container hover:border-slate-600'
                  }`}
                >
                  <div className="w-8 h-8 rounded bg-emerald-500/20 text-secondary flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200">Markdown LLM</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-secondary font-mono text-[10px] font-bold">
                        AI Ready
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">Tối ưu nạp ChatGPT, Claude, RAG</p>
                  </div>
                </button>

                {/* Format 3: Clean HTML */}
                <button
                  type="button"
                  onClick={() => handleSelectTargetFormat('html')}
                  className={`p-3 rounded-lg text-left transition-all border flex items-start gap-3 ${
                    targetFormat === 'html'
                      ? 'bg-primary-container/15 border-primary-container/60 shadow-sm'
                      : 'bg-surface border-border-subtle hover:bg-surface-container hover:border-slate-600'
                  }`}
                >
                  <div className="w-8 h-8 rounded bg-surface-bright text-slate-300 flex items-center justify-center shrink-0">
                    <Code className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-slate-200">Clean HTML Semantic</span>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">Giữ nguyên cấu trúc thẻ chuẩn web</p>
                  </div>
                </button>

                {/* Format 4: Images Package */}
                <button
                  type="button"
                  onClick={() => handleSelectTargetFormat('png')}
                  className={`p-3 rounded-lg text-left transition-all border flex items-start gap-3 ${
                    targetFormat === 'png'
                      ? 'bg-amber-500/15 border-amber-500/60 shadow-sm'
                      : 'bg-surface border-border-subtle hover:bg-surface-container hover:border-slate-600'
                  }`}
                >
                  <div className="w-8 h-8 rounded bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                    <FolderArchive className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-slate-200">Trích xuất ảnh minh họa</span>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">Gói ảnh gốc phân giải cao .ZIP</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Advanced Tuning Options */}
            <div className="space-y-3 pt-1">
              <label className="font-mono text-[10px] text-slate-400 block uppercase tracking-wider">
                Tùy chọn nâng cao khi xuất
              </label>

              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={keepHyperlinks}
                  onChange={(e) => setKeepHyperlinks(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded bg-surface border-border-subtle accent-primary-container"
                />
                <div className="text-xs">
                  <span className="text-slate-200 font-medium block">Giữ nguyên siêu liên kết (Hyperlinks) & Bookmark mục lục</span>
                  <span className="text-slate-400 text-[11px]">Tạo mục lục thông minh (TOC) trong PDF để điều hướng click nhanh chóng.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={embedFonts}
                  onChange={(e) => setEmbedFonts(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded bg-surface border-border-subtle accent-primary-container"
                />
                <div className="text-xs">
                  <span className="text-slate-200 font-medium block">Tự động nhúng toàn bộ font chữ (Font Subsetting 100%)</span>
                  <span className="text-slate-400 text-[11px]">Tránh lỗi mất font Tiếng Việt hoặc hiển thị sai ký tự khi mở máy khác.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={compressImages}
                  onChange={(e) => setCompressImages(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded bg-surface border-border-subtle accent-primary-container"
                />
                <div className="text-xs">
                  <span className="text-slate-200 font-medium block">Tối ưu nén hình ảnh nhúng trong tài liệu (DPR 2.0x)</span>
                  <span className="text-slate-400 text-[11px]">Giảm 40-60% kích cỡ tệp PDF đầu ra mà vẫn bảo toàn độ nét khi in ấn.</span>
                </div>
              </label>

              {/* AI Markdown Toggle */}
              <div className="p-3 rounded-lg bg-surface border border-border-subtle flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-secondary" />
                    <span className="text-xs font-semibold text-slate-200">Chế độ Clean LLM Markdown</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Tự động chuẩn hóa tiêu đề (#, ##), chuyển đổi bảng phức tạp sang cú pháp Markdown Table (|---|).
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={cleanLlmMarkdown}
                    onChange={(e) => setCleanLlmMarkdown(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-surface-container peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-secondary" />
                </label>
              </div>
            </div>

            {/* Primary Execution CTA */}
            <button
              type="button"
              disabled={queue.length === 0 || isProcessingAll}
              onClick={handleConvertAll}
              className={`w-full py-3 px-6 rounded-lg font-mono text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
                queue.length === 0 || isProcessingAll
                  ? 'bg-surface text-slate-500 border border-border-subtle cursor-not-allowed'
                  : 'bg-primary-container hover:bg-sky-400 text-slate-950 shadow-sky-500/20 active:scale-[0.99] cursor-pointer'
              }`}
            >
              {isProcessingAll ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xử lý chuyển đổi tài liệu ({completedCount}/{totalCount})...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current" />
                  <span>
                    Bắt Đầu Chuyển Đổi {queue.length} Tệp Tin (Sang {targetFormat.toUpperCase()})
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ================================================================== */}
        {/* CỘT PHẢI: LIVE PREVIEW & OUTPUT ACTIONS (Steps 3 & 4)              */}
        {/* ================================================================== */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          {/* Processing Progress & Status Summary */}
          <div className="bg-surface-container/60 border border-border-subtle/70 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-500/15 text-secondary flex items-center justify-center border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span className="text-sm font-semibold text-slate-100">
                  {isAllDone
                    ? `Đã chuyển đổi hoàn tất ${completedCount}/${totalCount} tệp`
                    : queue.length > 0
                      ? `Hàng đợi: ${totalCount} tệp (${queuedCount} chờ, ${completedCount} xong${errorCount > 0 ? `, ${errorCount} lỗi` : ''})`
                      : 'Chưa có tệp tin nào được chuyển đổi'}
                </span>
              </div>
              <span className="font-mono text-xs text-secondary bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded self-start sm:self-auto">
                Thời gian: 0.85s (Client WASM)
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="w-full h-2 bg-surface rounded-full overflow-hidden border border-border-subtle">
                <div
                  className="h-full bg-gradient-to-r from-primary-container to-secondary transition-all duration-300 rounded-full"
                  style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
                />
              </div>
              <div className="flex justify-between text-xs font-mono text-slate-400 pt-0.5">
                <span>{totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}% Tiến trình</span>
                <span>Khởi chạy trên luồng WebWorker song song</span>
              </div>
            </div>

            {/* Results Metrics Grid */}
            <div className="grid grid-cols-3 gap-3 pt-1">
              <div className="p-3 rounded-lg bg-surface border border-border-subtle text-center">
                <div className="text-xl font-bold text-slate-100 font-mono">
                  {completedCount} / {totalCount}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Tệp thành công</div>
              </div>
              <div className="p-3 rounded-lg bg-surface border border-border-subtle text-center">
                <div className="text-xl font-bold text-secondary font-mono">100%</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Bảo toàn Format</div>
              </div>
              <div className="p-3 rounded-lg bg-surface border border-border-subtle text-center">
                <div className="text-xl font-bold text-primary-container font-mono">-34%</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Nén dung lượng</div>
              </div>
            </div>

            {/* Download Zip CTA if finished */}
            {completedCount > 0 && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleDownloadAllZip}
                  className="w-full py-3 px-6 rounded-lg bg-secondary hover:bg-emerald-400 text-slate-950 font-mono text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải Về Toàn Bộ Tệp Đã Chuyển Đổi (.ZIP)</span>
                </button>
              </div>
            )}
          </div>

          {/* Realtime Live Preview Viewport */}
          <div className="bg-surface-container/60 border border-border-subtle/70 rounded-xl shadow-sm overflow-hidden flex flex-col">
            {/* Preview Navigation Header & Tabs */}
            <div className="p-3 bg-surface border-b border-border-subtle flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPreviewTab('pdf')}
                  className={`px-3 py-1.5 rounded-lg font-mono text-xs flex items-center gap-1.5 transition-colors ${
                    previewTab === 'pdf'
                      ? 'bg-primary-container/20 text-primary-container font-bold border border-primary-container/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Xem trước PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('md')}
                  className={`px-3 py-1.5 rounded-lg font-mono text-xs flex items-center gap-1.5 transition-colors ${
                    previewTab === 'md'
                      ? 'bg-emerald-500/20 text-secondary font-bold border border-emerald-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Xem trước Markdown / AI Prompt</span>
                </button>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
                <span className="hidden sm:inline">Zoom: {zoomLevel}%</span>
                <button
                  type="button"
                  onClick={() => setZoomLevel(z => Math.max(50, z - 10))}
                  className="p-1 rounded hover:bg-surface-container text-slate-300"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(z => Math.min(150, z + 10))}
                  className="p-1 rounded hover:bg-surface-container text-slate-300"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Viewport Content */}
            <div className="p-6 bg-[#060e20] min-h-[440px] flex items-center justify-center overflow-auto border-t border-border-subtle/50">
              {previewTab === 'pdf' ? (
                /* PDF Document Simulation Screen */
                <div
                  className="w-full max-w-md bg-white text-slate-900 rounded p-6 shadow-2xl space-y-4 text-xs transition-transform duration-100"
                  style={{ transform: `scale(${zoomLevel / 100})` }}
                >
                  {/* Simulated PDF Letterhead */}
                  <div className="flex items-start justify-between pb-3 border-b border-slate-200">
                    <div>
                      <div className="font-bold text-sm tracking-tight text-slate-900">
                        CÔNG TY CỔ PHẦN CÔNG NGHỆ OMNI
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        BÁO CÁO KẾ HOẠCH TÀI CHÍNH CHIẾN LƯỢC QUÝ 3 - 2026
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded bg-sky-500 text-white flex items-center justify-center font-bold text-[10px]">
                      WASM
                    </div>
                  </div>

                  {/* Simulated Heading & Summary */}
                  <div className="space-y-1">
                    <h3 className="font-bold text-xs text-slate-900">
                      1. Tóm tắt chỉ tiêu chuyển đổi tài liệu ({activePreviewFile ? activePreviewFile.file.name : 'Ke_Hoach_2026.docx'})
                    </h3>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Tài liệu trích xuất chuẩn vector từ tệp Word nguồn. Cấu trúc bảng và đồ thị được giữ nguyên tỷ lệ với độ nét 100%.
                    </p>
                  </div>

                  {/* Inline Chart Simulation */}
                  <div className="p-3 bg-slate-50 rounded border border-slate-100">
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold mb-2 font-mono">
                      <span>DOANH THU DỰ KIẾN (TỶ VNĐ)</span>
                      <span className="text-emerald-600 font-bold">+28.4%</span>
                    </div>
                    <svg className="w-full h-16" fill="none" viewBox="0 0 320 80">
                      <rect fill="#94a3b8" height="30" rx="3" width="36" x="10" y="45" />
                      <rect fill="#94a3b8" height="43" rx="3" width="36" x="70" y="32" />
                      <rect fill="#0284c7" height="53" rx="3" width="36" x="130" y="22" />
                      <rect fill="#0284c7" height="60" rx="3" width="36" x="190" y="15" />
                      <rect fill="#10b981" height="67" rx="3" width="36" x="250" y="8" />
                      <line stroke="#cbd5e1" strokeWidth="1.5" x1="5" x2="310" y1="76" y2="76" />
                      <text fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle" x="28" y="72">Q1</text>
                      <text fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle" x="88" y="72">Q2</text>
                      <text fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle" x="148" y="72">Q3</text>
                      <text fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle" x="208" y="72">Q4</text>
                      <text fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle" x="268" y="72">MỤC TIÊU</text>
                    </svg>
                  </div>

                  {/* High Fidelity Table Simulation */}
                  <div className="rounded overflow-hidden border border-slate-200">
                    <table className="w-full text-left text-[10px]">
                      <thead className="bg-slate-100 font-semibold text-slate-800">
                        <tr>
                          <th className="p-1.5">Hạng mục chi phí</th>
                          <th className="p-1.5 text-right">Ngân sách</th>
                          <th className="p-1.5 text-right">Tỷ trọng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        <tr>
                          <td className="p-1.5 font-medium">Hạ tầng Cloud & AI GPU</td>
                          <td className="p-1.5 text-right">4.200.000.000 đ</td>
                          <td className="p-1.5 text-right font-semibold text-sky-700">45.0%</td>
                        </tr>
                        <tr>
                          <td className="p-1.5 font-medium">Nghiên cứu & Phát triển (R&D)</td>
                          <td className="p-1.5 text-right">3.150.000.000 đ</td>
                          <td className="p-1.5 text-right font-semibold text-sky-700">33.7%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Footer Pagination */}
                  <div className="flex justify-between items-center pt-2 text-[9px] text-slate-400 font-mono">
                    <span>BẢO MẬT NỘI BỘ — AI-TOOLS MASTER HUB</span>
                    <span>Trang 1 / 1</span>
                  </div>
                </div>
              ) : (
                /* Markdown AI Prompt Viewport */
                <div className="w-full h-full p-4 rounded-lg bg-surface border border-border-subtle font-mono text-xs text-slate-200 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border-subtle text-slate-400 text-[11px]">
                    <span className="flex items-center gap-1.5 text-secondary">
                      <span className="w-2 h-2 rounded-full bg-secondary" />
                      MARKDOWN EXTRACTED — OPTIMIZED FOR RAG & CLAUDE 3.7 / GPT-4o
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const mdContent = `# BÁO CÁO KẾ HOẠCH TÀI CHÍNH CHIẾN LƯỢC QUÝ 3 - 2026\n> Trích xuất tự động qua WASM OmniConvert Engine lúc 14:20:05\n\n## 1. Tóm tắt chỉ tiêu tăng trưởng doanh thu theo sản phẩm\nTài liệu trích xuất chuẩn vector từ tệp Word nguồn \`Ke_Hoach_2026.docx\`.\n\n| Hạng mục chi phí | Ngân sách (VNĐ) | Tỷ trọng | Trạng thái |\n| :--- | :---: | :---: | :--- |\n| **Hạ tầng Cloud & AI GPU** | \`4.200.000.000\` | 45.0% | [Xúc tiến] |\n| **Nghiên cứu & Phát triển** | \`3.150.000.000\` | 33.7% | [Đang giải ngân] |`;
                        navigator.clipboard.writeText(mdContent);
                        setCopiedMd(true);
                        setTimeout(() => setCopiedMd(false), 2000);
                      }}
                      className="text-primary-container hover:underline flex items-center gap-1"
                    >
                      {copiedMd ? <Check className="w-3.5 h-3.5 text-secondary" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedMd ? 'Đã chép!' : 'Sao chép Markdown'}</span>
                    </button>
                  </div>

                  <pre className="overflow-x-auto text-slate-300 font-mono text-[11px] leading-relaxed select-all">
                    <span className="text-amber-400 font-bold"># BÁO CÁO KẾ HOẠCH TÀI CHÍNH CHIẾN LƯỢC QUÝ 3 - 2026</span>{'\n'}
                    <span className="text-slate-500">&gt; Trích xuất tự động qua WASM OmniConvert Engine lúc 14:20:05</span>{'\n\n'}
                    <span className="text-sky-400 font-bold">## 1. Tóm tắt chỉ tiêu tăng trưởng doanh thu theo sản phẩm</span>{'\n'}
                    Tài liệu trích xuất chuẩn vector từ tệp Word nguồn. Toàn bộ cấu trúc phân cấp tiêu đề được giữ nguyên theo chuẩn CommonMark.{'\n\n'}
                    <span className="text-secondary font-bold">### Bảng phân bổ nguồn vốn đầu tư:</span>{'\n'}
                    | Hạng mục chi phí | Ngân sách (VNĐ) | Tỷ trọng | Trạng thái |{'\n'}
                    | :--- | :---: | :---: | :--- |{'\n'}
                    | **Hạ tầng Cloud & AI GPU** | `4.200.000.000` | 45.0% | [Xúc tiến] |{'\n'}
                    | **Nghiên cứu & Phát triển** | `3.150.000.000` | 33.7% | [Đang giải ngân] |
                  </pre>
                </div>
              )}
            </div>
          </div>
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
                <div className="p-2 rounded-xl bg-primary-container/20 text-primary-container">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Cài Đặt Chuyển Đổi Nâng Cao</h3>
                  <p className="text-xs text-slate-400">Tùy chỉnh khổ giấy, chất lượng và độ phân giải xuất</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-container transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs text-slate-200">
              <div className="space-y-1.5">
                <label className="font-semibold uppercase tracking-wider text-slate-400">Khổ giấy PDF</label>
                <div className="grid grid-cols-3 gap-2">
                  {[{ id: 'a4', label: 'A4' }, { id: 'letter', label: 'US Letter' }, { id: 'fit', label: 'Fit Image' }].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSettings(s => ({ ...s, pageSize: opt.id }))}
                      className={`py-2 px-3 rounded-lg font-medium border transition-all ${
                        settings.pageSize === opt.id
                          ? 'bg-primary-container text-slate-950 font-bold border-primary-container'
                          : 'bg-surface-container text-slate-300 border-border-subtle hover:bg-surface-bright'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold uppercase tracking-wider text-slate-400">Hướng trang giấy</label>
                <div className="grid grid-cols-3 gap-2">
                  {[{ id: 'auto', label: 'Tự động' }, { id: 'portrait', label: 'Dọc (Portrait)' }, { id: 'landscape', label: 'Ngang (Landscape)' }].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSettings(s => ({ ...s, orientation: opt.id }))}
                      className={`py-2 px-3 rounded-lg font-medium border transition-all ${
                        settings.orientation === opt.id
                          ? 'bg-primary-container text-slate-950 font-bold border-primary-container'
                          : 'bg-surface-container text-slate-300 border-border-subtle hover:bg-surface-bright'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold uppercase tracking-wider text-slate-400">Độ nét trích xuất trang PDF ➔ Ảnh</label>
                <div className="grid grid-cols-3 gap-2">
                  {[{ val: 1.5, label: '1.5x (Web)' }, { val: 2.0, label: '2.0x (150 DPI)' }, { val: 3.0, label: '3.0x (300 DPI)' }].map(opt => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setSettings(s => ({ ...s, scale: opt.val }))}
                      className={`py-2 px-3 rounded-lg font-medium border transition-all ${
                        settings.scale === opt.val
                          ? 'bg-primary-container text-slate-950 font-bold border-primary-container'
                          : 'bg-surface-container text-slate-300 border-border-subtle hover:bg-surface-bright'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="font-semibold uppercase tracking-wider text-slate-400">Chất lượng ảnh JPG/WebP</label>
                  <span className="font-mono text-primary-container font-bold">{Math.round(settings.quality * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.0"
                  step="0.05"
                  value={settings.quality}
                  onChange={(e) => setSettings(s => ({ ...s, quality: parseFloat(e.target.value) }))}
                  className="w-full h-1.5 bg-surface-container rounded-lg appearance-none cursor-pointer accent-primary-container"
                />
              </div>
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-border-subtle bg-surface-container/40">
              <button
                type="button"
                onClick={() => setSettings({ pageSize: 'a4', orientation: 'auto', scale: 2.0, quality: 0.92, margin: 20 })}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                Mặc định
              </button>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 rounded-lg bg-primary-container hover:bg-sky-400 text-slate-950 text-xs font-bold shadow-md transition-colors"
              >
                Áp Dụng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 4. PREVIEW MODAL (Single Item)                                       */}
      {/* ==================================================================== */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-4xl h-[85vh] bg-surface border border-border-subtle rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-surface-container/60">
              <div className="truncate">
                <h3 className="text-sm font-bold text-white truncate">
                  {previewItem.result?.filename || previewItem.file?.name}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {previewItem.result && (
                  <button
                    type="button"
                    onClick={() => handleDownloadSingle(previewItem)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải về</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={closePreview}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-container transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-surface-container/40 p-4 overflow-auto flex items-center justify-center">
              {previewUrl && (
                (() => {
                  const ext = (previewItem.result?.filename || previewItem.file?.name || '').split('.').pop()?.toLowerCase();
                  if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'bmp'].includes(ext)) {
                    return <img src={previewUrl} alt="Preview" className="max-h-full max-w-full object-contain rounded-lg shadow-lg border border-border-subtle" />;
                  }
                  if (ext === 'pdf') {
                    return <iframe src={previewUrl} title="PDF Preview" className="w-full h-full rounded-lg border border-border-subtle bg-white" />;
                  }
                  if (previewText !== null) {
                    return <pre className="w-full h-full p-4 rounded-xl bg-surface border border-border-subtle text-xs font-mono text-slate-200 overflow-auto whitespace-pre-wrap">{previewText}</pre>;
                  }
                  return (
                    <div className="text-center p-8 space-y-3">
                      <div className="w-16 h-16 rounded-2xl bg-primary-container/20 text-primary-container border border-primary-container/30 flex items-center justify-center mx-auto">
                        <FileText className="w-8 h-8" />
                      </div>
                      <h4 className="text-base font-bold text-white">Tệp đã sẵn sàng tải về</h4>
                      {previewItem.result && (
                        <button
                          type="button"
                          onClick={() => handleDownloadSingle(previewItem)}
                          className="px-4 py-2 rounded-xl bg-primary-container hover:bg-sky-400 text-slate-950 text-xs font-bold shadow-lg"
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
