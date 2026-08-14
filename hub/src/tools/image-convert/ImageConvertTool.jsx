import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import DropZone from '../../components/image/DropZone';
import SettingsBar from '../../components/image/SettingsBar';
import StatsOverview from '../../components/image/StatsOverview';
import ImageGrid from '../../components/image/ImageGrid';
import CompareModal from '../../components/image/CompareModal';
import { convertImageToWebP } from '@ai-tools/core/utils/image/converter.js';
import { downloadAllAsZip } from '@ai-tools/core/utils/image/zipExporter.js';

export default function ImageConvertTool({ displayLang }) {
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

  const updateSettings = (newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const processFiles = async (fileList, currentSettings = settings) => {
    setIsProcessing(true);

    const newItems = fileList.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      originalFile: file,
      originalName: file.name,
      originalSize: file.size,
      originalUrl: URL.createObjectURL(file),
      status: 'processing',
    }));

    setImages((prev) => [...newItems, ...prev]);

    let successCount = 0;
    for (const item of newItems) {
      try {
        const result = await convertImageToWebP(item.originalFile, currentSettings);
        setImages((prev) =>
          prev.map((img) => (img.id === item.id ? { ...result, id: item.id } : img))
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
    }

    setIsProcessing(false);

    if (successCount > 0) {
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      } catch (e) {}
    }
  };

  const handleApplyToAll = async () => {
    if (images.length === 0 || isProcessing) return;
    const rawFiles = images.map((i) => i.originalFile).filter(Boolean);
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
          Chuyển đổi PNG, JPG, GIF, SVG sang WebP với chất lượng cao nhất — 100% bảo mật trên trình duyệt
        </p>
      </div>

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
