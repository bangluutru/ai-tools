import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import DropZone from '../../components/image/DropZone';
import SettingsBar from '../../components/image/SettingsBar';
import StatsOverview from '../../components/image/StatsOverview';
import ImageGrid from '../../components/image/ImageGrid';
import CompareModal from '../../components/image/CompareModal';
import { convertImageToWebP } from '@ai-tools/core/utils/image/converter.js';
import { downloadAllAsZip } from '@ai-tools/core/utils/image/zipExporter.js';
import { IMAGE_LIMITS, validateImageFiles } from '@ai-tools/core/utils/image/limits.js';

export default function ImageConvertTool() {
  const [settings, setSettings] = useState({
    quality: 0.8,
    maxWidth: '',
    maxHeight: '',
    keepAspectRatio: true,
    fillColor: null,
  });
  const [images, setImages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState(null);
  const [notice, setNotice] = useState('');
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
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

  const updateSettings = (newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const processFiles = async (fileList, currentSettings = settings) => {
    const { accepted, rejected } = validateImageFiles(fileList, imagesRef.current);
    setNotice(rejected.length > 0
      ? rejected.map(({ file, reason }) => `${file.name}: ${reason}`).join(' • ')
      : '');
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

    setImages((prev) => [...newItems, ...prev]);

    let successCount = 0;
    for (const item of newItems) {
      if (cancelRequestedRef.current) break;
      try {
        const result = await convertImageToWebP(item.originalFile, currentSettings);
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
        // Confetti is decorative; conversion has already succeeded.
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
    setNotice('');
  };

  const handleDeleteItem = (id) => {
    setImages((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) {
        if (target.webpUrl) URL.revokeObjectURL(target.webpUrl);
        if (target.originalUrl) URL.revokeObjectURL(target.originalUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-6">
      <div className="text-center mb-2">
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight">
          WebP Master & Nén Ảnh Tự Động
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Chuyển đổi PNG, JPG, GIF và WebP ngay trên trình duyệt; GIF động lấy frame đầu
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Tối đa {IMAGE_LIMITS.maxFiles} file, {Math.round(IMAGE_LIMITS.maxFileBytes / 1024 / 1024)} MiB/file, {Math.round(IMAGE_LIMITS.maxTotalBytes / 1024 / 1024)} MiB tổng cộng.
        </p>
      </div>

      {notice && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
          {notice}
        </div>
      )}

      {isProcessing && (
        <div className="flex items-center justify-between rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-xs text-cyan-100">
          <span>Đã xử lý {progress.completed}/{progress.total} ảnh</span>
          <button type="button" onClick={() => { cancelRequestedRef.current = true; }} className="font-bold text-red-300 hover:text-red-200">
            Dừng sau ảnh hiện tại
          </button>
        </div>
      )}

      <DropZone onFilesSelected={processFiles} isProcessing={isProcessing} />

      <SettingsBar
        settings={settings}
        onUpdateSettings={updateSettings}
        onApplyToAll={handleApplyToAll}
        hasImages={images.length > 0}
        isProcessing={isProcessing}
      />

      <StatsOverview
        items={images}
        onDownloadZip={handleDownloadZip}
        onClearAll={handleClearAll}
        isProcessing={isProcessing}
      />

      <ImageGrid items={images} onCompare={setSelectedForCompare} onDelete={handleDeleteItem} />

      <CompareModal item={selectedForCompare} onClose={() => setSelectedForCompare(null)} />
    </div>
  );
}
