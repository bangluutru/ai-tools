import React, { useEffect, useRef, useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  UploadCloud,
  ImageIcon,
  Zap,
  CheckCircle2,
  AlertCircle,
  Archive,
  Download,
  RefreshCw,
  Eye,
  ShieldCheck,
  ChevronRight,
  MoveHorizontal,
  Loader2,
  X
} from 'lucide-react';
import {
  convertImage,
  getEncoderSupport,
  SUPPORTED_TARGET_FORMATS,
} from '@ai-tools/core/utils/image/converter.js';
import { downloadAllAsZip } from '@ai-tools/core/utils/image/zipExporter.js';
import { formatSizeChange } from '@ai-tools/core/utils/image/formatters.js';
import { IMAGE_LIMITS, validateImageFiles } from '@ai-tools/core/utils/image/limits.js';
import { verifyDocumentSignature } from '@ai-tools/core/utils/documentFiles.js';
import { IMAGE_CONVERT_I18N, fmt } from './i18n.js';

const getFormatLabel = (format) =>
  SUPPORTED_TARGET_FORMATS[String(format || '').toLowerCase()]?.label || 'WebP';

const isDone = (item) => item.status === 'completed' || item.status === 'done';

const revokeItemUrls = (item) => {
  if (!item) return;
  if (item.outputUrl) URL.revokeObjectURL(item.outputUrl);
  if (item.webpUrl && item.webpUrl !== item.outputUrl) URL.revokeObjectURL(item.webpUrl);
  if (item.originalUrl) URL.revokeObjectURL(item.originalUrl);
};

const resolveMaxWidth = (resizeMode) =>
  resizeMode === '1920' ? 1920 : resizeMode === '1200' ? 1200 : '';

export default function ImageConvertTool({ displayLang = 'vi' } = {}) {
  const t = IMAGE_CONVERT_I18N[displayLang === 'en' ? 'en' : displayLang === 'ja' ? 'ja' : 'vi'];

  // Định dạng trình duyệt thực sự mã hoá được (Safari không mã hoá WebP qua canvas).
  const [encoderSupport] = useState(() =>
    typeof document === 'undefined' ? { webp: true, jpg: true, avif: true } : getEncoderSupport()
  );

  const [settings, setSettings] = useState(() => ({
    quality: 0.85,
    maxWidth: '',
    maxHeight: '',
    keepAspectRatio: true,
    targetFormat: encoderSupport.webp ? 'webp' : 'jpg', // webp | avif | jpg
    resizeMode: 'original' // original | 1920 | 1200
  }));

  const [images, setImages] = useState([]);
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [splitPos, setSplitPos] = useState(50);
  const [notice, setNotice] = useState('');
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);
  // Mỗi lần xoá tất cả / rời trang tăng "thế hệ"; vòng lặp đang chạy thấy lệch thì dừng.
  const runGenerationRef = useRef(0);
  const cancelRequestedRef = useRef(false);
  const deletedIdsRef = useRef(new Set());
  const imagesRef = useRef(images);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => () => {
    cancelRequestedRef.current = true;
    runGenerationRef.current += 1;
    imagesRef.current.forEach(revokeItemUrls);
  }, []);

  const activeImage = useMemo(() => {
    if (!images.length) return null;
    return images.find((img) => img.id === selectedImageId) || images[0];
  }, [images, selectedImageId]);

  const stats = useMemo(() => {
    // So sánh trên CÙNG một tập tệp: chỉ các tệp đã nén xong.
    const convertedItems = images.filter(isDone);
    const totalOriginal = convertedItems.reduce((acc, cur) => acc + (cur.originalSize || 0), 0);
    const totalOutput = convertedItems.reduce(
      (acc, cur) => acc + (cur.outputSize ?? cur.webpSize ?? 0),
      0
    );
    const savedBytes = totalOriginal - totalOutput;
    const savedPercent =
      totalOriginal > 0 ? Math.round((savedBytes / totalOriginal) * 1000) / 10 : 0;
    const outputFormats = [...new Set(convertedItems.map((item) => item.targetFormat))];

    return {
      totalOriginal,
      totalOutput,
      totalWebp: totalOutput, // backward-compat alias
      savedBytes,
      savedPercent,
      outputFormats,
      completedCount: convertedItems.length,
      totalCount: images.length,
    };
  }, [images]);

  const formatSize = (bytes) => {
    if (!bytes && bytes !== 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  /** Chạy tuần tự danh sách item; bỏ kết quả của item đã bị xoá và thu hồi URL của nó. */
  const runConversions = async (items, conversionSettings) => {
    const generation = runGenerationRef.current;
    cancelRequestedRef.current = false;
    setIsProcessing(true);
    setProgress({ completed: 0, total: items.length });

    let successCount = 0;
    for (const item of items) {
      if (cancelRequestedRef.current || generation !== runGenerationRef.current) break;
      if (deletedIdsRef.current.has(item.id) || !item.originalFile) {
        setProgress((curr) => ({ ...curr, completed: curr.completed + 1 }));
        continue;
      }
      try {
        const result = await convertImage(item.originalFile, conversionSettings);
        const stale =
          generation !== runGenerationRef.current || deletedIdsRef.current.has(item.id);
        if (stale) {
          // Kết quả về muộn cho một item đã bị xoá: không giữ URL mồ côi.
          URL.revokeObjectURL(result.outputUrl);
          continue;
        }
        setImages((prev) =>
          prev.map((img) => (img.id === item.id ? { ...img, ...result, id: item.id } : img))
        );
        successCount++;
      } catch (err) {
        if (generation === runGenerationRef.current) {
          setImages((prev) =>
            prev.map((img) =>
              img.id === item.id
                ? { ...img, status: 'error', errorMessage: err.message || t.convertError }
                : img
            )
          );
        }
      }
      setProgress((current) => ({ ...current, completed: current.completed + 1 }));
    }

    if (generation === runGenerationRef.current) {
      setIsProcessing(false);
      // Item bị dừng giữa chừng không còn "đang nén".
      setImages((prev) =>
        prev.map((img) => (img.status === 'processing' ? { ...img, status: 'cancelled' } : img))
      );
    }

    if (successCount > 0) {
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      } catch {
        // decorative
      }
    }
  };

  const buildConversionSettings = (current) => ({
    ...current,
    targetFormat: current.targetFormat || 'webp',
    maxWidth: resolveMaxWidth(current.resizeMode),
  });

  const processFiles = async (fileList, currentSettings = settings) => {
    if (isProcessing) return;
    const validation = validateImageFiles(fileList, imagesRef.current);
    const problems = validation.rejected.map(({ file, reason }) => `${file.name}: ${reason}`);

    const accepted = [];
    for (const file of validation.accepted) {
      if (await verifyDocumentSignature(file)) accepted.push(file);
      else problems.push(`${file.name}: ${t.notImage}`);
    }

    setNotice(problems.join(' • '));
    if (accepted.length === 0) return;

    const newItems = accepted.map((file) => ({
      id: crypto.randomUUID(),
      originalFile: file,
      originalName: file.name,
      originalSize: file.size,
      originalUrl: URL.createObjectURL(file),
      status: 'processing',
    }));

    setImages((prev) => [...newItems, ...prev]);
    if (!selectedImageId && newItems.length > 0) setSelectedImageId(newItems[0].id);

    await runConversions(newItems, buildConversionSettings(currentSettings));
  };

  const handleApplyToAll = async () => {
    if (images.length === 0 || isProcessing) return;
    const targets = imagesRef.current.filter((img) => img.originalFile);

    // Thu hồi output cũ trước khi nén lại (ngoài updater để không chạy hai lần).
    imagesRef.current.forEach((img) => {
      if (img.outputUrl) URL.revokeObjectURL(img.outputUrl);
      if (img.webpUrl && img.webpUrl !== img.outputUrl) URL.revokeObjectURL(img.webpUrl);
    });
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        status: 'processing',
        outputUrl: null,
        webpUrl: null,
        outputBlob: null,
        webpBlob: null,
        fallbackFrom: null,
      }))
    );

    await runConversions(targets, buildConversionSettings(settings));
  };

  const handleDownloadZip = async () => {
    if (isZipping) return;
    const formats = stats.outputFormats;
    const label = formats.length === 1 ? SUPPORTED_TARGET_FORMATS[formats[0]]?.ext.replace('.', '') || 'images' : 'images';
    setIsZipping(true);
    try {
      await downloadAllAsZip(images, `${label}-images.zip`);
    } catch (err) {
      setNotice(`${t.zipError}${err?.message ? `: ${err.message}` : ''}`);
    } finally {
      setIsZipping(false);
    }
  };

  const handleClearAll = () => {
    cancelRequestedRef.current = true;
    runGenerationRef.current += 1;
    images.forEach(revokeItemUrls);
    deletedIdsRef.current = new Set();
    setImages([]);
    setSelectedImageId(null);
    setNotice('');
    setIsProcessing(false);
    setProgress({ completed: 0, total: 0 });
  };

  const handleDeleteItem = (id, e) => {
    if (e) e.stopPropagation();
    deletedIdsRef.current.add(id);
    revokeItemUrls(imagesRef.current.find((i) => i.id === id));
    setImages((prev) => {
      const next = prev.filter((i) => i.id !== id);
      if (selectedImageId === id) {
        setSelectedImageId(next[0]?.id || null);
      }
      return next;
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (isProcessing) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const unsupportedFormats = ['webp', 'avif'].filter((f) => !encoderSupport[f]).map(getFormatLabel);

  const formatOptions = [
    { id: 'webp', name: 'WebP', sub: t.fmtWebpSub },
    { id: 'avif', name: 'AVIF', sub: t.fmtAvifSub },
    { id: 'jpg', name: t.fmtJpgName, sub: t.fmtJpgSub },
  ];

  const activeWarnings = [];
  if (activeImage && isDone(activeImage)) {
    if (activeImage.fallbackFrom) {
      activeWarnings.push(
        fmt(t.warnFallback, { from: getFormatLabel(activeImage.fallbackFrom), to: getFormatLabel(activeImage.targetFormat) })
      );
    }
    if (activeImage.animatedSourceFlattened) activeWarnings.push(t.warnAnimated);
    if (activeImage.downscaledForDevice && activeImage.targetDimensions) {
      activeWarnings.push(
        fmt(t.warnDownscaled, { w: activeImage.targetDimensions.width, h: activeImage.targetDimensions.height })
      );
    }
  }

  const activeOutputUrl = activeImage?.outputUrl || activeImage?.webpUrl;
  const activeFormatLabel = activeImage && isDone(activeImage) ? getFormatLabel(activeImage.targetFormat) : getFormatLabel(settings.targetFormat);
  const outputFormatsLabel = stats.outputFormats.map(getFormatLabel).join(' / ') || getFormatLabel(settings.targetFormat);

  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface">
      {/* 1. Breadcrumb Navigation */}
      <nav className="flex items-center gap-space-2 text-on-surface-variant font-label-md text-label-md mb-space-4">
        <a className="hover:text-primary transition-colors flex items-center gap-1" href="#">
          <span>{t.home}</span>
        </a>
        <ChevronRight size={14} className="text-outline shrink-0" />
        <a className="hover:text-primary transition-colors" href="#">
          {t.category}
        </a>
        <ChevronRight size={14} className="text-outline shrink-0" />
        <span className="text-primary font-semibold">{t.title}</span>
      </nav>

      {/* 2. Tool Header & Privacy Assurance */}
      <section className="bg-surface-container rounded-xl p-space-6 mb-space-6 border border-border-subtle shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-space-6 relative overflow-hidden">
        <div className="flex items-start gap-space-4 z-10">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center text-surface-canvas shadow-lg shrink-0">
            <ImageIcon size={30} className="text-surface-canvas" />
          </div>
          <div className="space-y-1">
            <h1 className="font-headline-lg text-xl sm:text-2xl text-on-surface font-semibold tracking-tight">
              {t.title}
            </h1>
            <p className="font-body-sm text-xs sm:text-sm text-on-surface-variant max-w-2xl leading-relaxed">
              {t.subtitle}
            </p>
          </div>
        </div>

        {/* Subtle Privacy Note */}
        <div className="z-10 flex items-center gap-1.5 text-xs text-outline shrink-0">
          <ShieldCheck size={15} className="text-secondary shrink-0" />
          <span>{t.privacy}</span>
        </div>
      </section>

      {notice && (
        <div role="alert" className="mb-space-4 rounded-xl border border-tertiary-container/30 bg-tertiary-container/10 px-4 py-3 text-xs text-tertiary flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* 3. Workspace Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-6 items-start mb-space-8">
        {/* Left Column: Input & Compression Pipeline Settings (6 cols) */}
        <div className="lg:col-span-6 flex flex-col space-y-space-6">
          {/* Unified FileUploader Card */}
          <div className="bg-surface-container rounded-xl p-space-6 border border-border-subtle shadow-md space-y-space-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-primary text-on-primary flex items-center justify-center font-label-sm text-label-sm font-bold">
                  1
                </span>
                <h2 className="font-title-sm text-title-sm text-on-surface">{t.step1}</h2>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                {fmt(t.filesSelected, { n: images.length, max: IMAGE_LIMITS.maxFiles })}
              </span>
            </div>

            {/* Dropzone */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
              multiple
              disabled={isProcessing}
              aria-label={t.uploadAria}
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) processFiles(Array.from(e.target.files));
                e.target.value = '';
              }}
            />
            <div
              role="button"
              tabIndex={isProcessing ? -1 : 0}
              aria-disabled={isProcessing}
              onClick={() => !isProcessing && fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (!isProcessing && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragOver={(e) => { e.preventDefault(); if (!isProcessing) setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`bg-surface-subtle border-2 border-dashed rounded-xl p-space-8 text-center flex flex-col items-center justify-center space-y-space-3 group relative overflow-hidden transition-all ${
                isProcessing
                  ? 'opacity-60 cursor-not-allowed border-border-subtle'
                  : isDragging
                    ? 'cursor-pointer border-primary-container bg-surface-container-high'
                    : 'cursor-pointer border-border-subtle hover:bg-surface-container-high hover:border-primary-container/60'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-surface-container border border-border-subtle flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                {isProcessing ? (
                  <Loader2 size={24} className="text-brand-cyan-bright animate-spin" />
                ) : (
                  <UploadCloud size={24} className="text-brand-cyan-bright" />
                )}
              </div>
              <div className="space-y-1">
                <p className="font-title-sm text-body-md text-on-surface">
                  {isProcessing ? (
                    t.dropBusy
                  ) : (
                    <>
                      {t.dropTitle} <span className="text-primary-container hover:underline font-semibold">{t.dropAction}</span>
                    </>
                  )}
                </p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {fmt(t.dropHint, { mb: Math.round(IMAGE_LIMITS.maxFileBytes / 1024 / 1024) })}
                </p>
              </div>
            </div>

            {/* Uploaded Files List Preview */}
            {images.length > 0 && (
              <div className="space-y-space-2 pt-space-2 max-h-64 overflow-y-auto">
                {images.map((item) => {
                  const isSelected = item.id === activeImage?.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedImageId(item.id)}
                      className={`flex items-center justify-between p-space-3 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-surface-container-high border-primary-container/50 shadow-sm'
                          : 'bg-surface-subtle border-border-subtle hover:bg-surface-container-high'
                      }`}
                    >
                      <div className="flex items-center gap-space-3 min-w-0">
                        <div className="w-9 h-9 rounded bg-surface-container flex items-center justify-center text-primary shrink-0 overflow-hidden border border-border-subtle">
                          {item.outputUrl || item.webpUrl || item.originalUrl ? (
                            <img src={item.outputUrl || item.webpUrl || item.originalUrl} alt={item.originalName} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon size={18} />
                          )}
                        </div>
                        <div className="truncate">
                          <p className="font-title-sm text-body-md text-on-surface truncate">
                            {item.originalName}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="font-label-sm text-label-sm text-on-surface-variant">
                              {formatSize(item.originalSize)}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-outline" />
                            {isDone(item) ? (
                              <span className={`font-label-sm text-label-sm ${item.savedPercent < 0 ? 'text-tertiary' : 'text-secondary'}`}>
                                {getFormatLabel(item.targetFormat)} {formatSize(item.outputSize ?? item.webpSize)} ({formatSizeChange(item.savedPercent)})
                                {(item.fallbackFrom || item.animatedSourceFlattened || item.downscaledForDevice) && (
                                  <AlertCircle size={12} className="inline ml-1 text-tertiary align-[-2px]" />
                                )}
                              </span>
                            ) : item.status === 'processing' ? (
                              <span className="font-label-sm text-label-sm text-brand-cyan-bright animate-pulse">
                                {t.compressing}
                              </span>
                            ) : item.status === 'cancelled' ? (
                              <span className="font-label-sm text-label-sm text-outline">—</span>
                            ) : (
                              <span className="font-label-sm text-label-sm text-error" title={item.errorMessage}>{t.failed}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteItem(item.id, e)}
                        className="p-space-1 text-on-surface-variant hover:text-error transition-colors rounded"
                        title={t.deleteFile}
                        aria-label={t.deleteFile}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Compression Settings Panel */}
          <div className="bg-surface-container rounded-xl p-space-6 border border-border-subtle shadow-md space-y-space-5">
            <div className="flex items-center justify-between pb-space-2 border-b border-border-subtle/50">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-primary text-on-primary flex items-center justify-center font-label-sm text-label-sm font-bold">
                  2
                </span>
                <h2 className="font-title-sm text-title-sm text-on-surface">{t.step2}</h2>
              </div>
              <span className="font-label-sm text-label-sm text-secondary flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                {t.ready}
              </span>
            </div>

            {/* Target Output Format Toggle */}
            <div className="space-y-space-2">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase">
                {t.outputFormat}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-2">
                {formatOptions.map((opt) => {
                  const supported = encoderSupport[opt.id] !== false;
                  const selected = settings.targetFormat === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={!supported}
                      aria-pressed={selected}
                      onClick={() => setSettings((s) => ({ ...s, targetFormat: opt.id }))}
                      className={`flex flex-col items-center py-space-3 px-space-2 rounded-lg font-title-sm text-body-md transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                        selected
                          ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
                          : 'bg-surface-subtle hover:bg-surface-container-high text-on-surface'
                      }`}
                    >
                      <span>{opt.name}</span>
                      <span className={`font-label-sm text-[10px] ${selected ? 'text-white font-medium' : 'text-on-surface-variant'}`}>
                        {supported ? opt.sub : t.fmtUnsupported}
                      </span>
                    </button>
                  );
                })}
              </div>
              {unsupportedFormats.length > 0 && (
                <p className="font-body-sm text-[11px] text-tertiary">
                  {fmt(t.formatUnsupportedNote, { list: unsupportedFormats.join(', ') })}
                </p>
              )}
            </div>

            {/* Quality Control Slider */}
            <div className="space-y-space-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label htmlFor="quality-slider" className="font-label-md text-label-md text-on-surface-variant uppercase cursor-pointer">
                    {t.quality}
                  </label>
                  <span className="px-space-1 py-[1px] bg-secondary text-on-secondary font-label-sm text-label-sm font-semibold rounded">
                    {t.recommended}
                  </span>
                </div>
                <span className="font-label-md text-label-md text-primary font-bold">
                  {Math.round(settings.quality * 100)}%
                </span>
              </div>
              <input
                id="quality-slider"
                type="range"
                min="40"
                max="100"
                aria-label={t.qualityAria}
                value={Math.round(settings.quality * 100)}
                onChange={(e) => setSettings((s) => ({ ...s, quality: Number(e.target.value) / 100 }))}
                className="w-full accent-primary-container bg-surface-subtle h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-on-surface-variant font-label-sm text-label-sm">
                <span>{t.qLow}</span>
                <span>{t.qMid}</span>
                <span>{t.qHigh}</span>
              </div>
            </div>

            {/* Resize Dimension Options */}
            <div className="space-y-space-2">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase">
                {t.resize}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-2">
                {[
                  { id: 'original', name: t.resizeOriginal, sub: t.resizeOriginalSub },
                  { id: '1920', name: 'Full HD', sub: fmt(t.resizeMax, { n: 1920 }) },
                  { id: '1200', name: 'Web', sub: fmt(t.resizeMax, { n: 1200 }) },
                ].map((opt) => (
                  <label key={opt.id} className="flex items-center gap-space-2 p-space-3 bg-surface-subtle border border-border-subtle rounded-lg cursor-pointer hover:bg-surface-container-high transition-colors">
                    <input
                      type="radio"
                      name="resizeMode"
                      checked={settings.resizeMode === opt.id}
                      onChange={() => setSettings((s) => ({ ...s, resizeMode: opt.id }))}
                      className="accent-primary-container"
                    />
                    <div className="flex flex-col">
                      <span className="font-title-sm text-body-md text-on-surface">{opt.name}</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">{opt.sub}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Primary Action Trigger */}
            <div className="pt-space-2 flex gap-space-2">
              <button
                type="button"
                disabled={images.length === 0 || isProcessing}
                onClick={handleApplyToAll}
                className="flex-1 py-space-4 px-space-6 bg-primary-container hover:bg-brand-cyan-bright disabled:opacity-50 disabled:cursor-not-allowed text-on-primary-container font-title-sm text-title-sm font-semibold rounded-xl shadow-lg flex items-center justify-center gap-space-2 transition-all transform active:scale-[0.99] cursor-pointer"
              >
                <Zap size={20} />
                <span>
                  {isProcessing
                    ? fmt(t.startBusy, { done: progress.completed, total: progress.total })
                    : images.length > 0
                    ? fmt(t.startN, { n: images.length })
                    : t.startEmpty}
                </span>
              </button>
              {isProcessing && (
                <button
                  type="button"
                  onClick={() => { cancelRequestedRef.current = true; }}
                  className="px-space-4 rounded-xl border border-border-subtle bg-surface-subtle hover:bg-surface-container-high text-on-surface font-title-sm text-body-md"
                >
                  {t.cancel}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Comparison Preview & Metrics (6 cols) */}
        <div className="lg:col-span-6 flex flex-col space-y-space-6">
          {/* Live Quality Split Comparison Viewer */}
          <div className="bg-surface-container rounded-xl p-space-6 border border-border-subtle shadow-md space-y-space-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye size={20} className="text-secondary" />
                <h2 className="font-title-sm text-title-sm text-on-surface">{t.compareTitle}</h2>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-subtle border border-border-subtle px-space-2 py-[2px] rounded">
                {t.compareBadge}
              </span>
            </div>

            {/* Split Slider Visual Box: hai lớp cùng kích thước, lớp "sau" được cắt bằng clip-path */}
            <div className="relative w-full h-[320px] rounded-xl overflow-hidden select-none bg-surface-subtle border border-border-subtle group">
              {activeImage?.originalUrl ? (
                <>
                  {/* Before Image Layer (Original) */}
                  <div
                    className="absolute inset-0 bg-contain bg-no-repeat bg-center"
                    style={{ backgroundImage: `url(${activeImage.originalUrl})` }}
                  />

                  {/* After Image Layer (Compressed) — identical box, clipped from the right */}
                  <div
                    className="absolute inset-0 bg-contain bg-no-repeat bg-center"
                    style={{
                      backgroundImage: `url(${activeOutputUrl || activeImage.originalUrl})`,
                      clipPath: `inset(0 ${100 - splitPos}% 0 0)`,
                    }}
                  />

                  <span className="absolute top-3 right-3 bg-surface-container-lowest/90 backdrop-blur-md px-space-2 py-1 rounded font-label-sm text-label-sm text-on-surface border border-border-subtle pointer-events-none">
                    {t.original}: {formatSize(activeImage.originalSize)}
                  </span>
                  <span className="absolute top-3 left-3 bg-primary-container text-on-primary-container px-space-2 py-1 rounded font-label-sm text-label-sm font-semibold shadow pointer-events-none">
                    {activeOutputUrl && isDone(activeImage)
                      ? `${activeFormatLabel}: ${formatSize(activeImage.outputSize ?? activeImage.webpSize)} (${formatSizeChange(activeImage.savedPercent)})`
                      : t.processingLayer}
                  </span>

                  {/* Vertical Split Bar with Drag Indicator */}
                  <div
                    className="absolute top-0 bottom-0 w-[2px] -translate-x-1/2 bg-surface-container-lowest shadow-sm flex items-center justify-center pointer-events-none"
                    style={{ left: `${splitPos}%` }}
                  >
                    <div className="w-8 h-8 rounded-full bg-surface-container-lowest text-on-surface border border-border-subtle flex items-center justify-center shadow-xl">
                      <MoveHorizontal size={18} />
                    </div>
                  </div>

                  {/* Range Controller for Accessible Scrubbing */}
                  <input
                    type="range"
                    min="0"
                    max="100"
                    aria-label={t.compareAria}
                    value={splitPos}
                    onChange={(e) => setSplitPos(Number(e.target.value))}
                    className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-20"
                  />
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-on-surface-variant">
                  <ImageIcon size={48} className="text-outline mb-2 opacity-50" />
                  <p className="font-title-sm text-body-md text-on-surface">{t.emptyTitle}</p>
                  <p className="font-body-sm text-body-sm text-outline mt-1">{t.emptyDesc}</p>
                </div>
              )}
            </div>

            {activeWarnings.length > 0 && (
              <ul className="space-y-1 text-xs text-tertiary">
                {activeWarnings.map((w) => (
                  <li key={w} className="flex items-start gap-1.5">
                    <AlertCircle size={14} className="shrink-0 mt-[1px]" />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            )}

            <p className="font-body-sm text-body-sm text-on-surface-variant text-center">
              {fmt(t.compareHint, { fmt: activeFormatLabel })}
            </p>
          </div>

          {/* Compression Metrics Result Card */}
          <div className="bg-surface-container rounded-xl p-space-6 border border-border-subtle shadow-md space-y-space-5">
            <div className="flex items-center justify-between pb-space-2 border-b border-border-subtle/50">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                <h2 className="font-title-sm text-title-sm text-on-surface">{t.resultTitle}</h2>
              </div>
              <span className="font-label-sm text-label-sm text-secondary bg-secondary/10 border border-secondary/20 px-space-2 py-[2px] rounded flex items-center gap-1">
                <CheckCircle2 size={14} /> {fmt(t.done, { done: stats.completedCount, total: stats.totalCount })}
              </span>
            </div>

            {/* Inline Data Visual Graphic: Savings Ratio Chart */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-4">
              <div className="p-space-3 bg-surface-subtle border border-border-subtle rounded-lg flex flex-col justify-between">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase">{t.originalSize}</span>
                <span className="font-headline-md text-headline-md text-on-surface mt-1">
                  {formatSize(stats.totalOriginal)}
                </span>
                <span className="font-label-sm text-label-sm text-outline">{fmt(t.originalSizeSub, { n: stats.completedCount })}</span>
              </div>
              <div className="p-space-3 bg-surface-subtle border border-border-subtle rounded-lg flex flex-col justify-between">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase">{t.outputSize}</span>
                <span className="font-headline-md text-headline-md text-primary mt-1">
                  {formatSize(stats.totalOutput)}
                </span>
                <span className="font-label-sm text-label-sm text-primary">
                  {outputFormatsLabel}
                </span>
              </div>
              <div className={`p-space-3 rounded-lg flex flex-col justify-between border ${stats.savedBytes < 0 ? 'bg-tertiary/10 border-tertiary/20' : 'bg-secondary/10 border-secondary/20'}`}>
                <span className={`font-label-md text-label-md uppercase ${stats.savedBytes < 0 ? 'text-tertiary' : 'text-secondary'}`}>{t.savings}</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className={`font-headline-md text-headline-md font-bold ${stats.savedBytes < 0 ? 'text-tertiary' : 'text-secondary'}`}>
                    {formatSizeChange(stats.savedPercent)}
                  </span>
                  <span className={`font-label-sm text-label-sm ${stats.savedBytes < 0 ? 'text-tertiary' : 'text-secondary'}`}>
                    ({stats.savedBytes >= 0 ? `-${formatSize(stats.savedBytes)}` : `+${formatSize(Math.abs(stats.savedBytes))}`})
                  </span>
                </div>
                <span className={`font-label-sm text-label-sm ${stats.savedBytes < 0 ? 'text-tertiary' : 'text-secondary'}`}>
                  {stats.completedCount === 0 ? '—' : stats.savedBytes < 0 ? t.savingsBigger : t.savingsSmaller}
                </span>
              </div>
            </div>

            {/* Pipeline Execution Track */}
            <div className="space-y-space-1">
              <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
                <span>{t.progress}</span>
                <span>
                  {stats.totalCount > 0 ? Math.round((stats.completedCount / stats.totalCount) * 100) : 0}% ({stats.completedCount}/{stats.totalCount})
                </span>
              </div>
              <div className="w-full h-2 bg-surface-subtle rounded-full overflow-hidden border border-border-subtle">
                <div
                  className="h-full bg-gradient-to-r from-primary-container to-secondary rounded-full transition-all duration-300"
                  style={{
                    width: `${stats.totalCount > 0 ? (stats.completedCount / stats.totalCount) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Action Bar Downloads */}
            <div className="flex flex-col sm:flex-row items-center gap-space-3 pt-space-2">
              <button
                type="button"
                disabled={stats.completedCount === 0 || isZipping}
                onClick={handleDownloadZip}
                className="w-full sm:flex-1 py-space-3 px-space-4 bg-secondary text-surface-canvas hover:bg-secondary/90 disabled:opacity-40 disabled:cursor-not-allowed font-title-sm text-title-sm font-semibold rounded-lg flex items-center justify-center gap-space-2 shadow-md transition-colors cursor-pointer"
              >
                {isZipping ? <Loader2 size={20} className="animate-spin" /> : <Archive size={20} />}
                <span>{isZipping ? t.zipping : t.downloadZip}</span>
              </button>

              {activeOutputUrl && isDone(activeImage) && (
                <a
                  href={activeOutputUrl}
                  download={
                    activeImage.outputFilename ||
                    `compressed_${activeImage.originalName.replace(/\.[^/.]+$/, '')}${SUPPORTED_TARGET_FORMATS[activeImage.targetFormat]?.ext || '.webp'}`
                  }
                  className="w-full sm:w-auto py-space-3 px-space-4 bg-surface-subtle hover:bg-surface-container-high border border-border-subtle text-on-surface font-title-sm text-title-sm rounded-lg flex items-center justify-center gap-space-2 transition-colors cursor-pointer"
                >
                  <Download size={18} />
                  <span>{fmt(t.downloadOne, { fmt: activeFormatLabel })}</span>
                </a>
              )}

              <button
                type="button"
                onClick={handleClearAll}
                disabled={images.length === 0}
                className="w-full sm:w-auto p-space-3 bg-surface-subtle hover:bg-surface-container-high border border-border-subtle text-on-surface-variant hover:text-on-surface rounded-lg transition-colors flex items-center justify-center disabled:opacity-30"
                title={t.clearAll}
                aria-label={t.clearAll}
              >
                <RefreshCw size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
