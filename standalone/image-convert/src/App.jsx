import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import Header from './components/Header.jsx';
import DropZone from './components/DropZone.jsx';
import SettingsBar from './components/SettingsBar.jsx';
import StatsOverview from './components/StatsOverview.jsx';
import ImageGrid from './components/ImageGrid.jsx';
import CompareModal from './components/CompareModal.jsx';
import { convertImageToWebP } from '@ai-tools/core/utils/image/converter.js';
import { downloadAllAsZip } from '@ai-tools/core/utils/image/zipExporter.js';

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('webp_theme') || 'dark');
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

  // Sync Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('webp_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const updateSettings = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  // Convert multiple files
  const processFiles = async (fileList, currentSettings = settings) => {
    setIsProcessing(true);

    const newItems = fileList.map(file => ({
      id: Math.random().toString(36).substring(2, 9),
      originalFile: file,
      originalName: file.name,
      originalSize: file.size,
      originalUrl: URL.createObjectURL(file),
      status: 'processing',
    }));

    setImages(prev => [...newItems, ...prev]);

    let successCount = 0;
    for (const item of newItems) {
      try {
        const result = await convertImageToWebP(item.originalFile, currentSettings);
        setImages(prev =>
          prev.map(img => (img.id === item.id ? { ...img, ...result, id: item.id } : img))
        );
        successCount++;
      } catch (err) {
        setImages(prev =>
          prev.map(img =>
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
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 }
        });
      } catch (e) {
        // Confetti fallback
      }
    }
  };

  // Re-apply current settings to all images
  const handleApplyToAll = async () => {
    if (images.length === 0 || isProcessing) return;
    const rawFiles = images.map(i => i.originalFile).filter(Boolean);
    setImages([]);
    await processFiles(rawFiles, settings);
  };

  const handleDownloadZip = async () => {
    await downloadAllAsZip(images);
  };

  const handleClearAll = () => {
    // Revoke object URLs to avoid memory leaks
    images.forEach(img => {
      if (img.webpUrl) URL.revokeObjectURL(img.webpUrl);
      if (img.originalUrl) URL.revokeObjectURL(img.originalUrl);
    });
    setImages([]);
  };

  const handleDeleteItem = (id) => {
    setImages(prev => {
      const target = prev.find(i => i.id === id);
      if (target) {
        if (target.webpUrl) URL.revokeObjectURL(target.webpUrl);
        if (target.originalUrl) URL.revokeObjectURL(target.originalUrl);
      }
      return prev.filter(i => i.id !== id);
    });
  };

  return (
    <div className="app-layout">
      <Header theme={theme} onToggleTheme={toggleTheme} />

      <DropZone
        onFilesSelected={processFiles}
        isProcessing={isProcessing}
      />

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

      <ImageGrid
        items={images}
        onCompare={setSelectedForCompare}
        onDelete={handleDeleteItem}
      />

      <CompareModal
        item={selectedForCompare}
        onClose={() => setSelectedForCompare(null)}
      />
    </div>
  );
}
