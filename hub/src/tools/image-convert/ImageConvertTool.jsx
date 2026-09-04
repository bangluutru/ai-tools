import React, { useEffect, useRef, useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  UploadCloud,
  ImageIcon,
  Sliders,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  Archive,
  Download,
  Trash2,
  RefreshCw,
  Eye,
  Layers,
  ShieldCheck,
  ChevronRight,
  Maximize2,
  MoveHorizontal,
  X
} from 'lucide-react';
import { convertImageToWebP } from '@ai-tools/core/utils/image/converter.js';
import { downloadAllAsZip } from '@ai-tools/core/utils/image/zipExporter.js';
import { IMAGE_LIMITS, validateImageFiles } from '@ai-tools/core/utils/image/limits.js';
import { verifyDocumentSignature } from '@ai-tools/core/utils/documentFiles.js';

export default function ImageConvertTool() {
  const [settings, setSettings] = useState({
    quality: 0.85,
    maxWidth: '',
    maxHeight: '',
    keepAspectRatio: true,
    targetFormat: 'webp', // webp | avif | jpg
    resizeMode: 'original' // original | 1920 | 1200
  });

  const [images, setImages] = useState([]);
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [splitPos, setSplitPos] = useState(50);
  const [notice, setNotice] = useState('');
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);
  const cancelRequestedRef = useRef(false);
  const imagesRef = useRef(images);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => () => {
    imagesRef.current.forEach((image) => {
      if (image.webpUrl) URL.revokeObjectURL(image.webpUrl);
      if (image.originalUrl) URL.revokeObjectURL(image.originalUrl);
    });
  }, []);

  const activeImage = useMemo(() => {
    if (!images.length) return null;
    return images.find((img) => img.id === selectedImageId) || images[0];
  }, [images, selectedImageId]);

  const stats = useMemo(() => {
    const totalOriginal = images.reduce((acc, cur) => acc + cur.originalSize, 0);
    const convertedItems = images.filter((item) => item.status === 'done');
    const totalWebp = convertedItems.reduce((acc, cur) => acc + (cur.webpSize || 0), 0);
    const savedBytes = totalOriginal > 0 && totalWebp > 0 ? totalOriginal - totalWebp : 0;
    const savedPercent = totalOriginal > 0 && totalWebp > 0
      ? Math.round((savedBytes / totalOriginal) * 100)
      : 0;

    return {
      totalOriginal,
      totalWebp,
      savedBytes,
      savedPercent,
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

  const processFiles = async (fileList, currentSettings = settings) => {
    const validation = validateImageFiles(fileList, imagesRef.current);
    const problems = validation.rejected.map(({ file, reason }) => `${file.name}: ${reason}`);

    const accepted = [];
    for (const file of validation.accepted) {
      if (await verifyDocumentSignature(file)) accepted.push(file);
      else problems.push(`${file.name}: nội dung không phải ảnh hợp lệ`);
    }

    setNotice(problems.join(' • '));
    if (accepted.length === 0) return;

    setIsProcessing(true);
    cancelRequestedRef.current = false;
    setProgress({ completed: 0, total: accepted.length });

    const newItems = accepted.map((file) => ({
      id: crypto.randomUUID(),
      originalFile: file,
      originalName: file.name,
      originalSize: file.size,
      originalUrl: URL.createObjectURL(file),
      status: 'processing',
    }));

    setImages((prev) => {
      const updated = [...newItems, ...prev];
      if (!selectedImageId && newItems.length > 0) {
        setSelectedImageId(newItems[0].id);
      }
      return updated;
    });

    let successCount = 0;
    for (const item of newItems) {
      if (cancelRequestedRef.current) break;
      try {
        const resizeSettings = {
          ...currentSettings,
          maxWidth: currentSettings.resizeMode === '1920' ? 1920 : currentSettings.resizeMode === '1200' ? 1200 : '',
        };
        const result = await convertImageToWebP(item.originalFile, resizeSettings);
        setImages((prev) =>
          prev.map((img) => (img.id === item.id ? { ...img, ...result, id: item.id } : img))
        );
        successCount++;
      } catch (err) {
        setImages((prev) =>
          prev.map((img) =>
            img.id === item.id
              ? { ...img, status: 'error', errorMessage: err.message || 'Lỗi chuyển đổi' }
              : img
          )
        );
      }
      setProgress((current) => ({ ...current, completed: current.completed + 1 }));
    }

    setIsProcessing(false);

    if (successCount > 0) {
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      } catch {
        // decorative
      }
    }
  };

  const handleApplyToAll = async () => {
    if (images.length === 0 || isProcessing) return;
    const rawFiles = images.map((i) => i.originalFile).filter(Boolean);
    images.forEach((image) => {
      if (image.webpUrl) URL.revokeObjectURL(image.webpUrl);
      if (image.originalUrl) URL.revokeObjectURL(image.originalUrl);
    });
    setImages([]);
    await processFiles(rawFiles, settings);
  };

  const handleDownloadZip = async () => {
    await downloadAllAsZip(images);
  };

  const handleClearAll = () => {
    images.forEach((img) => {
      if (img.webpUrl) URL.revokeObjectURL(img.webpUrl);
      if (img.originalUrl) URL.revokeObjectURL(img.originalUrl);
    });
    setImages([]);
    setSelectedImageId(null);
    setNotice('');
  };

  const handleDeleteItem = (id, e) => {
    if (e) e.stopPropagation();
    setImages((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) {
        if (target.webpUrl) URL.revokeObjectURL(target.webpUrl);
        if (target.originalUrl) URL.revokeObjectURL(target.originalUrl);
      }
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface">
      {/* 1. Breadcrumb Navigation */}
      <nav className="flex items-center gap-space-2 text-on-surface-variant font-label-md text-label-md mb-space-4">
        <a className="hover:text-primary transition-colors flex items-center gap-1" href="#">
          <span>Trang chủ</span>
        </a>
        <ChevronRight size={14} className="text-outline shrink-0" />
        <a className="hover:text-primary transition-colors" href="#">
          Hình ảnh & WebP
        </a>
        <ChevronRight size={14} className="text-outline shrink-0" />
        <span className="text-primary font-semibold">WebP Master & Nén Ảnh</span>
      </nav>

      {/* 2. Tool Header & Privacy Assurance */}
      <section className="bg-surface-container rounded-xl p-space-6 mb-space-6 border border-border-subtle shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-space-6 relative overflow-hidden">
        <div className="flex items-start gap-space-4 z-10">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center text-surface-canvas shadow-lg shrink-0">
            <ImageIcon size={30} className="text-surface-canvas" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-space-2">
              <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
                WebP Master & Nén Ảnh Đa Năng
              </h1>
              <span className="px-space-2 py-[2px] bg-primary/10 text-brand-cyan-bright font-label-sm text-label-sm rounded uppercase border border-primary/20">
                WASM ENGINE
              </span>
              <span className="flex items-center gap-1 px-space-2 py-[2px] bg-secondary/10 text-secondary font-label-sm text-label-sm rounded uppercase border border-secondary/20">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                ƯU TIÊN
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl leading-relaxed">
              Chuyển đổi định dạng PNG, JPG sang WebP thế hệ mới và nén tối ưu dung lượng hàng loạt trực tiếp trong trình duyệt với engine WASM đa luồng.
            </p>
          </div>
        </div>

        {/* Privacy Metric Badge */}
        <div className="z-10 bg-surface-subtle border border-border-subtle px-space-4 py-space-3 rounded-xl flex items-center gap-space-3 shrink-0 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-secondary uppercase font-semibold">
              Bảo mật Client-side 100%
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Ảnh không gửi lên server, xử lý nội bộ
            </span>
          </div>
        </div>

        {/* Ambient Subtle Glow */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      </section>

      {notice && (
        <div className="mb-space-4 rounded-xl border border-tertiary-container/30 bg-tertiary-container/10 px-4 py-3 text-xs text-tertiary flex items-center gap-2">
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
                <span className="w-6 h-6 rounded bg-primary-container/20 text-brand-cyan-bright flex items-center justify-center font-label-sm text-label-sm font-bold">
                  1
                </span>
                <h2 className="font-title-sm text-title-sm text-on-surface">Tải tệp tin nguồn</h2>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                {images.length} / {IMAGE_LIMITS.maxFiles} tệp đã chọn
              </span>
            </div>

            {/* Dropzone */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) processFiles(Array.from(e.target.files));
                e.target.value = '';
              }}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`bg-surface-subtle border-2 border-dashed rounded-xl p-space-8 text-center cursor-pointer flex flex-col items-center justify-center space-y-space-3 group relative overflow-hidden transition-all ${
                isDragging ? 'border-primary-container bg-surface-container-high' : 'border-border-subtle hover:bg-surface-container-high hover:border-primary-container/60'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-surface-container border border-border-subtle flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <UploadCloud size={24} className="text-brand-cyan-bright" />
              </div>
              <div className="space-y-1">
                <p className="font-title-sm text-body-md text-on-surface">
                  Kéo thả ảnh hoặc <span className="text-primary-container hover:underline font-semibold">bấm để chọn file</span>
                </p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Hỗ trợ PNG, JPG, WEBP, AVIF (Tối đa {Math.round(IMAGE_LIMITS.maxFileBytes / 1024 / 1024)}MB/file)
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
                          {item.webpUrl || item.originalUrl ? (
                            <img src={item.webpUrl || item.originalUrl} alt={item.originalName} className="w-full h-full object-cover" />
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
                            {item.status === 'done' ? (
                              <span className="font-label-sm text-label-sm text-secondary">
                                {formatSize(item.webpSize)} ({item.savings > 0 ? `-${item.savings}%` : 'Tối ưu'})
                              </span>
                            ) : item.status === 'processing' ? (
                              <span className="font-label-sm text-label-sm text-brand-cyan-bright animate-pulse">
                                Đang nén...
                              </span>
                            ) : (
                              <span className="font-label-sm text-label-sm text-error">Lỗi</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteItem(item.id, e)}
                        className="p-space-1 text-on-surface-variant hover:text-error transition-colors rounded"
                        title="Xóa tệp"
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
                <span className="w-6 h-6 rounded bg-primary-container/20 text-brand-cyan-bright flex items-center justify-center font-label-sm text-label-sm font-bold">
                  2
                </span>
                <h2 className="font-title-sm text-title-sm text-on-surface">Cấu hình nén & Định dạng đích</h2>
              </div>
              <span className="font-label-sm text-label-sm text-secondary flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                Sẵn sàng
              </span>
            </div>

            {/* Target Output Format Toggle */}
            <div className="space-y-space-2">
              <label className="font-label-md text-label-md text-on-surface-variant uppercase">
                ĐỊNH DẠNG ĐẦU RA
              </label>
              <div className="grid grid-cols-3 gap-space-2">
                <button
                  type="button"
                  onClick={() => setSettings((s) => ({ ...s, targetFormat: 'webp' }))}
                  className={`flex flex-col items-center py-space-3 px-space-2 rounded-lg font-title-sm text-body-md transition-all ${
                    settings.targetFormat === 'webp'
                      ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
                      : 'bg-surface-subtle hover:bg-surface-container-high text-on-surface'
                  }`}
                >
                  <span>WebP</span>
                  <span className="font-label-sm text-[10px] opacity-80">Phổ biến nhất</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSettings((s) => ({ ...s, targetFormat: 'avif' }))}
                  className={`flex flex-col items-center py-space-3 px-space-2 rounded-lg font-title-sm text-body-md transition-all ${
                    settings.targetFormat === 'avif'
                      ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
                      : 'bg-surface-subtle hover:bg-surface-container-high text-on-surface'
                  }`}
                >
                  <span>AVIF</span>
                  <span className="font-label-sm text-[10px] opacity-80">Tối đa nén</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSettings((s) => ({ ...s, targetFormat: 'jpg' }))}
                  className={`flex flex-col items-center py-space-3 px-space-2 rounded-lg font-title-sm text-body-md transition-all ${
                    settings.targetFormat === 'jpg'
                      ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
                      : 'bg-surface-subtle hover:bg-surface-container-high text-on-surface'
                  }`}
                >
                  <span>JPEG Tối ưu</span>
                  <span className="font-label-sm text-[10px] opacity-80">Tương thích</span>
                </button>
              </div>
            </div>

            {/* Quality Control Slider */}
            <div className="space-y-space-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="font-label-md text-label-md text-on-surface-variant uppercase">
                    MỨC ĐỘ CHẤT LƯỢNG (QUALITY)
                  </label>
                  <span className="px-space-1 py-[1px] bg-secondary/10 text-secondary font-label-sm text-label-sm rounded border border-secondary/20">
                    Khuyên Dùng
                  </span>
                </div>
                <span className="font-label-md text-label-md text-primary font-bold">
                  {Math.round(settings.quality * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="40"
                max="100"
                value={Math.round(settings.quality * 100)}
                onChange={(e) => setSettings((s) => ({ ...s, quality: Number(e.target.value) / 100 }))}
                className="w-full accent-primary-container bg-surface-subtle h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-on-surface-variant font-label-sm text-label-sm">
                <span>Siêu nhẹ (40%)</span>
                <span>Cân bằng (85%)</span>
                <span>Không suy hao (100%)</span>
              </div>
            </div>

            {/* Resize Dimension Options */}
            <div className="space-y-space-2">
              <label className="font-label-md text-label-md text-on-surface-variant uppercase">
                THAY ĐỔI ĐỘ PHÂN GIẢI (RESIZE)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-2">
                <label className="flex items-center gap-space-2 p-space-3 bg-surface-subtle border border-border-subtle rounded-lg cursor-pointer hover:bg-surface-container-high transition-colors">
                  <input
                    type="radio"
                    name="resizeMode"
                    checked={settings.resizeMode === 'original'}
                    onChange={() => setSettings((s) => ({ ...s, resizeMode: 'original' }))}
                    className="accent-primary-container"
                  />
                  <div className="flex flex-col">
                    <span className="font-title-sm text-body-md text-on-surface">Gốc</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Giữ nguyên</span>
                  </div>
                </label>
                <label className="flex items-center gap-space-2 p-space-3 bg-surface-subtle border border-border-subtle rounded-lg cursor-pointer hover:bg-surface-container-high transition-colors">
                  <input
                    type="radio"
                    name="resizeMode"
                    checked={settings.resizeMode === '1920'}
                    onChange={() => setSettings((s) => ({ ...s, resizeMode: '1920' }))}
                    className="accent-primary-container"
                  />
                  <div className="flex flex-col">
                    <span className="font-title-sm text-body-md text-on-surface">Full HD</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Tối đa 1920px</span>
                  </div>
                </label>
                <label className="flex items-center gap-space-2 p-space-3 bg-surface-subtle border border-border-subtle rounded-lg cursor-pointer hover:bg-surface-container-high transition-colors">
                  <input
                    type="radio"
                    name="resizeMode"
                    checked={settings.resizeMode === '1200'}
                    onChange={() => setSettings((s) => ({ ...s, resizeMode: '1200' }))}
                    className="accent-primary-container"
                  />
                  <div className="flex flex-col">
                    <span className="font-title-sm text-body-md text-on-surface">Web Content</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Tối đa 1200px</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Primary Action Trigger */}
            <div className="pt-space-2">
              <button
                type="button"
                disabled={images.length === 0 || isProcessing}
                onClick={handleApplyToAll}
                className="w-full py-space-4 px-space-6 bg-primary-container hover:bg-brand-cyan-bright disabled:opacity-50 disabled:cursor-not-allowed text-on-primary-container font-title-sm text-title-sm font-semibold rounded-xl shadow-lg flex items-center justify-center gap-space-2 transition-all transform active:scale-[0.99] cursor-pointer"
              >
                <Zap size={20} />
                <span>
                  {isProcessing
                    ? `Đang xử lý ${progress.completed}/${progress.total}...`
                    : images.length > 0
                    ? `Bắt đầu nén ${images.length} ảnh (Áp dụng thiết lập)`
                    : 'Tải ảnh lên để bắt đầu nén'}
                </span>
              </button>
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
                <h2 className="font-title-sm text-title-sm text-on-surface">So sánh chất lượng trực quan</h2>
              </div>
              <span className="font-label-sm text-label-sm text-secondary bg-secondary/10 border border-secondary/20 px-space-2 py-[2px] rounded">
                1:1 Zoom Pixel
              </span>
            </div>

            {/* Split Slider Visual Box */}
            <div className="relative w-full h-[320px] rounded-xl overflow-hidden select-none bg-surface-subtle border border-border-subtle group">
              {activeImage?.originalUrl ? (
                <>
                  {/* Before Image Layer (Original) */}
                  <div
                    className="absolute inset-0 bg-contain bg-no-repeat bg-center"
                    style={{ backgroundImage: `url(${activeImage.originalUrl})` }}
                  >
                    <span className="absolute top-3 left-3 bg-surface-container-lowest/90 backdrop-blur-md px-space-2 py-1 rounded font-label-sm text-label-sm text-on-surface border border-border-subtle">
                      GỐC: {formatSize(activeImage.originalSize)}
                    </span>
                  </div>

                  {/* After Image Layer (WebP Compressed) */}
                  <div
                    className="absolute inset-y-0 left-0 overflow-hidden"
                    style={{ width: `${splitPos}%` }}
                  >
                    <div
                      className="w-[600px] h-[320px] max-w-none bg-contain bg-no-repeat bg-center"
                      style={{
                        backgroundImage: `url(${activeImage.webpUrl || activeImage.originalUrl})`,
                      }}
                    >
                      <span className="absolute top-3 left-3 bg-primary-container text-on-primary-container px-space-2 py-1 rounded font-label-sm text-label-sm font-semibold shadow">
                        WEBP ({Math.round(settings.quality * 100)}%): {formatSize(activeImage.webpSize || activeImage.originalSize)}
                      </span>
                    </div>
                  </div>

                  {/* Vertical Split Bar with Drag Indicator */}
                  <div
                    className="absolute top-0 bottom-0 w-[2px] bg-white cursor-ew-resize flex items-center justify-center pointer-events-none"
                    style={{ left: `${splitPos}%` }}
                  >
                    <div className="w-8 h-8 rounded-full bg-white text-surface-canvas flex items-center justify-center shadow-xl">
                      <MoveHorizontal size={18} />
                    </div>
                  </div>

                  {/* Range Controller for Accessible Scrubbing */}
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={splitPos}
                    onChange={(e) => setSplitPos(Number(e.target.value))}
                    className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-20"
                  />
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-on-surface-variant">
                  <ImageIcon size={48} className="text-outline mb-2 opacity-50" />
                  <p className="font-title-sm text-body-md text-on-surface">Chưa có ảnh nào được nạp</p>
                  <p className="font-body-sm text-body-sm text-outline mt-1">
                    Tải ảnh lên ở cột bên trái để so sánh chi tiết độ nét trước và sau khi nén
                  </p>
                </div>
              )}
            </div>

            <p className="font-body-sm text-body-sm text-on-surface-variant text-center">
              Kéo thanh gạt sang trái/phải để kiểm chứng độ sắc nét vi mô giữa định dạng gốc và WebP.
            </p>
          </div>

          {/* Compression Metrics Result Card */}
          <div className="bg-surface-container rounded-xl p-space-6 border border-border-subtle shadow-md space-y-space-5">
            <div className="flex items-center justify-between pb-space-2 border-b border-border-subtle/50">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                <h2 className="font-title-sm text-title-sm text-on-surface">Kết quả tối ưu dung lượng</h2>
              </div>
              <span className="font-label-sm text-label-sm text-secondary bg-secondary/10 border border-secondary/20 px-space-2 py-[2px] rounded flex items-center gap-1">
                <CheckCircle2 size={14} /> Hoàn tất {stats.completedCount}/{stats.totalCount}
              </span>
            </div>

            {/* Inline Data Visual Graphic: Savings Ratio Chart */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-4">
              <div className="p-space-3 bg-surface-subtle border border-border-subtle rounded-lg flex flex-col justify-between">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase">DUNG LƯỢNG GỐC</span>
                <span className="font-headline-md text-headline-md text-on-surface mt-1">
                  {formatSize(stats.totalOriginal)}
                </span>
                <span className="font-label-sm text-label-sm text-outline">{stats.totalCount} tệp tổng cộng</span>
              </div>
              <div className="p-space-3 bg-surface-subtle border border-border-subtle rounded-lg flex flex-col justify-between">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase">SAU KHI NÉN</span>
                <span className="font-headline-md text-headline-md text-primary mt-1">
                  {formatSize(stats.totalWebp)}
                </span>
                <span className="font-label-sm text-label-sm text-primary">WebP Quality {Math.round(settings.quality * 100)}%</span>
              </div>
              <div className="p-space-3 bg-secondary/10 border border-secondary/20 rounded-lg flex flex-col justify-between">
                <span className="font-label-md text-label-md text-secondary uppercase">TIẾT KIỆM ĐƯỢC</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-headline-md text-headline-md text-secondary font-bold">
                    -{stats.savedPercent}%
                  </span>
                  <span className="font-label-sm text-label-sm text-secondary">
                    (-{formatSize(stats.savedBytes)})
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-secondary">Tốc độ tải web nhanh hơn</span>
              </div>
            </div>

            {/* Pipeline Execution Track */}
            <div className="space-y-space-1">
              <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
                <span>Tiến trình hoàn thành</span>
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
                disabled={stats.completedCount === 0}
                onClick={handleDownloadZip}
                className="w-full sm:flex-1 py-space-3 px-space-4 bg-secondary text-surface-canvas hover:bg-secondary/90 disabled:opacity-40 disabled:cursor-not-allowed font-title-sm text-title-sm font-semibold rounded-lg flex items-center justify-center gap-space-2 shadow-md transition-colors cursor-pointer"
              >
                <Archive size={20} />
                <span>Tải về tất cả (.ZIP)</span>
              </button>

              {activeImage?.webpUrl && (
                <a
                  href={activeImage.webpUrl}
                  download={`compressed_${activeImage.originalName.replace(/\.[^/.]+$/, '')}.webp`}
                  className="w-full sm:w-auto py-space-3 px-space-4 bg-surface-subtle hover:bg-surface-container-high border border-border-subtle text-on-surface font-title-sm text-title-sm rounded-lg flex items-center justify-center gap-space-2 transition-colors"
                >
                  <Download size={18} />
                  <span>Tải ảnh đang chọn</span>
                </a>
              )}

              <button
                type="button"
                onClick={handleClearAll}
                disabled={images.length === 0}
                className="w-full sm:w-auto p-space-3 bg-surface-subtle hover:bg-surface-container-high border border-border-subtle text-on-surface-variant hover:text-on-surface rounded-lg transition-colors flex items-center justify-center disabled:opacity-30"
                title="Xóa tất cả / Làm mới"
              >
                <RefreshCw size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Section: Tips & Technical SEO Knowledge Accordion */}
      <section className="bg-surface-container rounded-xl p-space-6 border border-border-subtle shadow-md space-y-space-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-6 bg-primary-container rounded" />
          <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">
            Hướng dẫn tối ưu WebP & Điểm số Google Core Web Vitals
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-4 pt-space-2">
          <div className="p-space-4 bg-surface-subtle border border-border-subtle rounded-lg space-y-space-2">
            <div className="flex items-center gap-2 text-secondary font-title-sm text-title-sm">
              <Zap size={18} />
              <h4>Tăng điểm LCP (Largest Contentful Paint)</h4>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Giảm dung lượng ảnh Hero xuống dưới 200KB bằng WebP giúp khung hình nội dung lớn nhất hiển thị nhanh hơn 1.8s trên kết nối di động 4G.
            </p>
          </div>
          <div className="p-space-4 bg-surface-subtle border border-border-subtle rounded-lg space-y-space-2">
            <div className="flex items-center gap-2 text-primary font-title-sm text-title-sm">
              <Layers size={18} />
              <h4>Hỗ trợ kênh Alpha trong suốt</h4>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              WebP giữ trọn vẹn lớp nền trong suốt (Transparency) như PNG-24 nhưng nén nhẹ hơn từ 60% đến 80%, lý tưởng cho logo, icon và banner vector.
            </p>
          </div>
          <div className="p-space-4 bg-surface-subtle border border-border-subtle rounded-lg space-y-space-2">
            <div className="flex items-center gap-2 text-brand-cyan-bright font-title-sm text-title-sm">
              <ShieldCheck size={18} />
              <h4>Độ tương thích trình duyệt</h4>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Định dạng WebP hiện được hỗ trợ trên 97.4% trình duyệt toàn cầu (bao gồm Safari iOS, Chrome, Edge và Firefox hiện đại).
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
