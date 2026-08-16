import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  CONVERT_LIMITS,
  rejectionMessages,
  validateDocumentFiles,
  verifyDocumentSignature,
} from '../utils/documentFiles.js';
import { MiniAppError, MiniAppLayout } from './shared/MiniAppLayout.jsx';
import confetti from 'canvas-confetti';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { 
  FileStack, 
  UploadCloud, 
  Layers, 
  Play, 
  Download, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Eye, 
  ArrowRight, 
  ArrowLeftRight, 
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
  Check 
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

const I18N = {
  vi: {
    title: 'Chuyển Đổi Tài Liệu & Ảnh ⇄ PDF',
    subtitle: 'Chuyển đổi 2 chiều giữa DOCX, PPTX, XLSX, Ảnh và PDF. 100% xử lý trên trình duyệt, riêng tư tuyệt đối.',
    inputFormat: 'Định dạng Đầu vào (Gốc)',
    outputFormat: 'Định dạng Đầu ra (Đích)',
    dropTitle: 'Kéo thả tệp vào đây hoặc',
    browse: 'chọn từ máy',
    pasteHint: 'Hỗ trợ kéo thả nhiều tệp hoặc dán trực tiếp bằng',
    mergeImages: 'Gộp nhiều tệp ảnh thành 1 tệp PDF duy nhất',
    queueTitle: 'Danh sách tệp',
    ready: 'Đang chờ',
    completed: 'Đã xong',
    failed: 'Lỗi',
    convertAll: 'Chuyển đổi tất cả',
    downloadZip: 'Tải ZIP tất cả',
    clearAll: 'Xóa danh sách',
    convertBtn: 'Chuyển đổi',
    downloadBtn: 'Tải về',
    retryBtn: 'Thử lại',
    previewBtn: 'Xem trước',
    settingsTitle: 'Cài đặt chuyển đổi',
    settingsSub: 'Tùy chỉnh khổ giấy, chất lượng và độ phân giải xuất',
    pageSize: 'Khổ giấy PDF',
    orientation: 'Hướng trang giấy',
    dpiScale: 'Độ nét trích xuất trang PDF ➔ Ảnh',
    imgQuality: 'Chất lượng ảnh JPG/WebP',
    margins: 'Khoảng cách lề trang (Margin)',
    close: 'Đóng',
    apply: 'Áp dụng',
    reset: 'Mặc định',
    privateBadge: '100% Xử lý cục bộ — Riêng tư tuyệt đối'
  },
  en: {
    title: 'Universal Document & Image ⇄ PDF Converter',
    subtitle: 'Bidirectional conversion between DOCX, PPTX, XLSX, Images and PDF. 100% in-browser, fully private.',
    inputFormat: 'Input Format (Source)',
    outputFormat: 'Output Format (Target)',
    dropTitle: 'Drag & drop files here or',
    browse: 'browse device',
    pasteHint: 'Supports multi-file upload or paste directly with',
    mergeImages: 'Merge multiple images into a single PDF document',
    queueTitle: 'File Queue',
    ready: 'Queued',
    completed: 'Done',
    failed: 'Failed',
    convertAll: 'Convert All',
    downloadZip: 'Download All (ZIP)',
    clearAll: 'Clear Queue',
    convertBtn: 'Convert',
    downloadBtn: 'Download',
    retryBtn: 'Retry',
    previewBtn: 'Preview',
    settingsTitle: 'Conversion Settings',
    settingsSub: 'Customize page size, quality, and resolution',
    pageSize: 'PDF Page Size',
    orientation: 'Page Orientation',
    dpiScale: 'PDF to Image Render DPI',
    imgQuality: 'JPG/WebP Quality',
    margins: 'Page Margins',
    close: 'Close',
    apply: 'Apply',
    reset: 'Reset Defaults',
    privateBadge: '100% In-Browser & Private'
  },
  ja: {
    title: '万能ファイル・画像 ⇄ PDF 相互変換',
    subtitle: 'DOCX、PPTX、XLSX、画像とPDFをブラウザ上で100%相互変換。完全ローカル処理で安全。',
    inputFormat: '変換元フォーマット',
    outputFormat: '変換先フォーマット',
    dropTitle: 'ファイルをここにドラッグ＆ドロップ、または',
    browse: 'ファイルを選択',
    pasteHint: '複数ファイルの一括追加やスクリーンショット貼り付けに対応',
    mergeImages: '複数の画像ファイルを1つのPDFに結合する',
    queueTitle: '変換キュー',
    ready: '待機中',
    completed: '完了',
    failed: 'エラー',
    convertAll: 'すべて変換',
    downloadZip: 'ZIPで一括ダウンロード',
    clearAll: 'すべてクリア',
    convertBtn: '変換する',
    downloadBtn: 'ダウンロード',
    retryBtn: '再試行',
    previewBtn: 'プレビュー',
    settingsTitle: '変換設定',
    settingsSub: '用紙サイズ、画質、解像度の詳細設定',
    pageSize: 'PDF 用紙サイズ',
    orientation: '用紙の向き',
    dpiScale: 'PDF ➔ 画像抽出 解像度',
    imgQuality: 'JPG/WebP 画質',
    margins: '余白設定',
    close: '閉じる',
    apply: '適用',
    reset: '初期設定に戻す',
    privateBadge: '100% ブラウザ内完結・完全プライベート'
  }
};

export default function OmniConvertView({ displayLang = 'vi' }) {
  const lang = I18N[displayLang] || I18N.vi;

  const [activePreset, setActivePreset] = useState('all-to-pdf');
  const [sourceFormat, setSourceFormat] = useState('docx');
  const [targetFormat, setTargetFormat] = useState('pdf');
  const [mergeImagesToPdf, setMergeImagesToPdf] = useState(false);

  const [queue, setQueue] = useState([]);

  const [fileError, setFileError] = useState('');
  const [isProcessingAll, setIsProcessingAll] = useState(false);

  const [previewItem, setPreviewItem] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewText, setPreviewText] = useState(null);

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

  // Handle preset selection
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

  const handleSelectSourceFormat = (newSource) => {
    setSourceFormat(newSource);
    const validTargets = getSupportedTargets(newSource);
    if (validTargets.length > 0 && !validTargets.includes(targetFormat)) {
      setTargetFormat(validTargets[0]);
    }
    setActivePreset('custom');
  };

  const handleSelectTargetFormat = (newTarget) => {
    setTargetFormat(newTarget);
    setActivePreset('custom');
  };

  const handleSwapFormats = () => {
    const validTargets = getSupportedTargets(targetFormat);
    if (validTargets.includes(sourceFormat)) {
      const prev = sourceFormat;
      setSourceFormat(targetFormat);
      setTargetFormat(prev);
      setActivePreset('custom');
    }
  };

  const handleFilesSelected = useCallback(async (files) => {
    if (!files || files.length === 0) return;

    // Cùng bộ kiểm tra với các miniapp khác: giới hạn số lượng/dung lượng và
    // đối chiếu magic byte trước khi đưa vào engine chuyển đổi.
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

  // Paste listener for clipboard screenshots
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

      confetti({ particleCount: 35, spread: 60, origin: { y: 0.85 } });
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

    confetti({ particleCount: 90, spread: 90, origin: { y: 0.6 } });
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

  // Preview Modal
  const openPreview = (item) => {
    setPreviewItem(item);
    const blob = item.result?.blob || item.file;
    if (blob) {
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);

      const ext = (item.result?.filename || item.file?.name || '').split('.').pop()?.toLowerCase();
      if (['txt', 'csv'].includes(ext)) {
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
      case 'document': return <FileText className="w-5 h-5 text-blue-400" />;
      case 'spreadsheet': return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
      case 'presentation': return <Presentation className="w-5 h-5 text-orange-400" />;
      case 'image': return <ImageIcon className="w-5 h-5 text-purple-400" />;
      case 'pdf': return <FileCode className="w-5 h-5 text-red-400" />;
      default: return <File className="w-5 h-5 text-slate-400" />;
    }
  };

  const supportedTargets = getSupportedTargets(sourceFormat);
  const sourceOptions = ['docx', 'pptx', 'xlsx', 'pdf', 'png', 'jpg', 'webp', 'svg'];

  const totalCount = queue.length;
  const completedCount = queue.filter(q => q.status === 'completed').length;
  const queuedCount = queue.filter(q => q.status === 'queued').length;
  const errorCount = queue.filter(q => q.status === 'error').length;

  return (
    <MiniAppLayout width="medium" gap="normal">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 via-blue-500 to-cyan-400 p-0.5 shadow-lg shadow-brand-500/20 flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-slate-950/40 rounded-[14px] backdrop-blur-sm flex items-center justify-center">
              <FileStack className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-white tracking-tight">{lang.title}</h2>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                Client-Side
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{lang.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>{lang.privateBadge}</span>
          </div>

          <button
            onClick={() => setIsSettingsOpen(true)}
            title={lang.settingsTitle}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors"
          >
            <Sliders className="w-4 h-4 text-brand-400" />
            <span className="hidden sm:inline">{lang.settingsTitle}</span>
          </button>
        </div>
      </div>

      {/* Preset Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {POPULAR_PRESETS.map((preset) => {
          const isActive = activePreset === preset.id;
          const label = preset[`label_${displayLang}`] || preset.label_vi;
          return (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 border ${
                isActive
                  ? 'bg-brand-500 text-white border-brand-400 shadow-lg shadow-brand-500/25 scale-[1.02]'
                  : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800 hover:border-slate-700'
              }`}
            >
              <span>{label}</span>
              {isActive && <Check className="w-3.5 h-3.5" />}
            </button>
          );
        })}
      </div>

      {/* Format Selector Matrix */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex-1 w-full space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {lang.inputFormat}
            </label>
            <div className="relative">
              <select
                value={sourceFormat}
                onChange={(e) => handleSelectSourceFormat(e.target.value)}
                className="w-full bg-slate-950/90 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none cursor-pointer"
              >
                {sourceOptions.map((ext) => (
                  <option key={ext} value={ext}>
                    .{ext.toUpperCase()} — {FORMAT_DETAILS[ext]?.[`name_${displayLang}`] || FORMAT_DETAILS[ext]?.name_vi || ext}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                <span className="text-xs">▼</span>
              </div>
            </div>
          </div>

          <div className="flex sm:flex-col items-center justify-center pt-3 sm:pt-4">
            <button
              onClick={handleSwapFormats}
              title="Swap"
              className="p-2.5 rounded-full bg-slate-800 hover:bg-brand-600 text-slate-300 hover:text-white border border-slate-700 hover:border-brand-500 shadow-md transition-all duration-200 hover:rotate-180"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 w-full space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {lang.outputFormat}
            </label>
            <div className="relative">
              <select
                value={targetFormat}
                onChange={(e) => handleSelectTargetFormat(e.target.value)}
                className="w-full bg-slate-950/90 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none cursor-pointer"
              >
                {supportedTargets.map((ext) => (
                  <option key={ext} value={ext}>
                    .{ext.toUpperCase()} — {FORMAT_DETAILS[ext]?.[`name_${displayLang}`] || FORMAT_DETAILS[ext]?.name_vi || ext}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                <span className="text-xs">▼</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Drop Zone */}
      <div className="space-y-3">
        <MiniAppError>{fileError}</MiniAppError>
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
          className={`relative group cursor-pointer rounded-3xl p-8 sm:p-10 text-center transition-all duration-300 border-2 border-dashed ${
            isDragOver
              ? 'border-brand-400 bg-brand-500/10 scale-[1.01] shadow-2xl shadow-brand-500/20'
              : 'border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/70'
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

          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600/30 to-blue-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center mx-auto mb-3.5 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-7 h-7" />
          </div>

          <h3 className="text-sm sm:text-base font-bold text-white mb-1">
            {lang.dropTitle} <span className="text-brand-400 underline underline-offset-4">{lang.browse}</span>
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
            {lang.pasteHint} <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[11px] text-slate-300 font-mono">Ctrl+V</kbd>.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-lg mx-auto">
            {['docx', 'pptx', 'xlsx', 'pdf', 'png', 'jpg', 'webp', 'svg'].map((ext) => (
              <span
                key={ext}
                className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/60"
              >
                .{ext}
              </span>
            ))}
          </div>
        </div>

        {/* Merge Images Switch */}
        <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-brand-400" />
            <span>{lang.mergeImages}</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={mergeImagesToPdf}
              onChange={(e) => setMergeImagesToPdf(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-500"></div>
          </label>
        </div>
      </div>

      {/* File Queue */}
      {queue.length > 0 && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-bold text-white">
                {lang.queueTitle} ({totalCount})
              </span>
              <div className="flex items-center space-x-2 text-xs">
                {completedCount > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    {completedCount} {lang.completed}
                  </span>
                )}
                {queuedCount > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                    {queuedCount} {lang.ready}
                  </span>
                )}
                {errorCount > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 font-medium">
                    {errorCount} {lang.failed}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              {queuedCount > 0 && (
                <button
                  onClick={handleConvertAll}
                  disabled={isProcessingAll}
                  className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-600/25 transition-all disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{lang.convertAll}</span>
                </button>
              )}

              {completedCount > 0 && (
                <button
                  onClick={handleDownloadAllZip}
                  className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{lang.downloadZip}</span>
                </button>
              )}

              <button
                onClick={() => setQueue([])}
                disabled={isProcessingAll}
                title={lang.clearAll}
                className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors disabled:opacity-40"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            {queue.map((item) => {
              const sourceDetails = FORMAT_DETAILS[item.sourceFormat] || {};
              const targets = getSupportedTargets(item.sourceFormat);

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${sourceDetails.color || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                        {renderIcon(sourceDetails.category)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-semibold text-white truncate" title={item.file.name}>
                          {item.file.name}
                        </h4>
                        <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                          <span>{formatFileSize(item.file.size)}</span>
                          <span>•</span>
                          <span className="uppercase font-semibold text-slate-300">.{item.sourceFormat}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 hidden sm:block" />
                      <div className="relative">
                        <select
                          value={item.targetFormat}
                          disabled={item.status === 'converting' || item.status === 'completed'}
                          onChange={(e) => {
                            const newT = e.target.value;
                            setQueue(prev => prev.map(q => q.id === item.id ? { ...q, targetFormat: newT } : q));
                          }}
                          className="bg-slate-950 border border-slate-700 text-white rounded-xl px-2.5 py-1.5 text-xs font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed appearance-none pr-6"
                        >
                          {targets.map((ext) => (
                            <option key={ext} value={ext}>.{ext.toUpperCase()}</option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                          <span className="text-[10px]">▼</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      {item.status === 'queued' && (
                        <button
                          onClick={() => handleConvertSingle(item.id)}
                          className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md transition-colors"
                        >
                          {lang.convertBtn}
                        </button>
                      )}

                      {item.status === 'converting' && (
                        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-medium">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>{item.progress}%</span>
                        </div>
                      )}

                      {item.status === 'completed' && (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => openPreview(item)}
                            title={lang.previewBtn}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadSingle(item)}
                            title={lang.downloadBtn}
                            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>{lang.downloadBtn}</span>
                          </button>
                        </div>
                      )}

                      {item.status === 'error' && (
                        <button
                          onClick={() => handleConvertSingle(item.id)}
                          title={lang.retryBtn}
                          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-xs font-medium transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>{lang.retryBtn}</span>
                        </button>
                      )}

                      <button
                        onClick={() => setQueue(prev => prev.filter(q => q.id !== item.id))}
                        disabled={item.status === 'converting'}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors disabled:opacity-40"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {item.status === 'converting' && (
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-brand-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}

                  {item.status === 'error' && item.error && (
                    <div className="flex items-start space-x-2 p-2.5 rounded-xl bg-red-950/40 border border-red-800/40 text-xs text-red-300">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <span>{item.error}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-4xl h-[85vh] bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
              <div className="truncate">
                <h3 className="text-sm font-bold text-white truncate">
                  {previewItem.result?.filename || previewItem.file?.name}
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                {previewItem.result && (
                  <button
                    onClick={() => handleDownloadSingle(previewItem)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{lang.downloadBtn}</span>
                  </button>
                )}
                <button
                  onClick={closePreview}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-950/60 p-4 overflow-auto flex items-center justify-center">
              {previewUrl && (
                (() => {
                  const ext = (previewItem.result?.filename || previewItem.file?.name || '').split('.').pop()?.toLowerCase();
                  if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'bmp'].includes(ext)) {
                    return <img src={previewUrl} alt="Preview" className="max-h-full max-w-full object-contain rounded-lg shadow-lg border border-slate-800" />;
                  }
                  if (ext === 'pdf') {
                    return <iframe src={previewUrl} title="PDF Preview" className="w-full h-full rounded-lg border border-slate-800 bg-white" />;
                  }
                  if (previewText !== null) {
                    return <pre className="w-full h-full p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200 overflow-auto whitespace-pre-wrap">{previewText}</pre>;
                  }
                  return (
                    <div className="text-center p-8 space-y-3">
                      <div className="w-16 h-16 rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20 flex items-center justify-center mx-auto">
                        <FileText className="w-8 h-8" />
                      </div>
                      <h4 className="text-base font-bold text-white">Tệp đã sẵn sàng tải về</h4>
                      {previewItem.result && (
                        <button onClick={() => handleDownloadSingle(previewItem)} className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg">
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

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{lang.settingsTitle}</h3>
                  <p className="text-xs text-slate-400">{lang.settingsSub}</p>
                </div>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-sm text-slate-200">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">{lang.pageSize}</label>
                <div className="grid grid-cols-3 gap-2">
                  {[{ id: 'a4', label: 'A4' }, { id: 'letter', label: 'US Letter' }, { id: 'fit', label: 'Fit Image' }].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setSettings(s => ({ ...s, pageSize: opt.id }))}
                      className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                        settings.pageSize === opt.id ? 'bg-brand-600 text-white border-brand-500' : 'bg-slate-950/60 text-slate-300 border-slate-800'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">{lang.orientation}</label>
                <div className="grid grid-cols-3 gap-2">
                  {[{ id: 'auto', label: 'Auto' }, { id: 'portrait', label: 'Portrait' }, { id: 'landscape', label: 'Landscape' }].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setSettings(s => ({ ...s, orientation: opt.id }))}
                      className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                        settings.orientation === opt.id ? 'bg-brand-600 text-white border-brand-500' : 'bg-slate-950/60 text-slate-300 border-slate-800'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">{lang.dpiScale}</label>
                <div className="grid grid-cols-3 gap-2">
                  {[{ val: 1.5, label: '1.5x (Web)' }, { val: 2.0, label: '2.0x (150 DPI)' }, { val: 3.0, label: '3.0x (300 DPI)' }].map(opt => (
                    <button
                      key={opt.val}
                      onClick={() => setSettings(s => ({ ...s, scale: opt.val }))}
                      className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                        settings.scale === opt.val ? 'bg-brand-600 text-white border-brand-500' : 'bg-slate-950/60 text-slate-300 border-slate-800'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-semibold uppercase tracking-wider text-slate-400">{lang.imgQuality}</label>
                  <span className="font-mono text-brand-400 font-bold">{Math.round(settings.quality * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.0"
                  step="0.05"
                  value={settings.quality}
                  onChange={(e) => setSettings(s => ({ ...s, quality: parseFloat(e.target.value) }))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/40">
              <button
                onClick={() => setSettings({ pageSize: 'a4', orientation: 'auto', scale: 2.0, quality: 0.92, margin: 20 })}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                {lang.reset}
              </button>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md transition-colors"
              >
                {lang.apply}
              </button>
            </div>
          </div>
        </div>
      )}
    </MiniAppLayout>
  );
}
