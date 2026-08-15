import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import JSZip from 'jszip';
import confetti from 'canvas-confetti';
import {
  UploadCloud,
  Zap,
  Scale,
  Sparkles,
  SlidersHorizontal,
  FileText,
  Download,
  Eye,
  Trash2,
  Loader2,
  TrendingDown,
  RotateCw,
  Archive,
  CheckCheck,
  Check,
  X,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Files,
  Trash,
} from 'lucide-react';

// =====================================================================
// Lazy dynamic loader for PDF.js and pdf-lib
// =====================================================================
let pdfJsPromise;
const loadPdfJs = () => {
  if (!pdfJsPromise) {
    pdfJsPromise = Promise.all([
      import('pdfjs-dist'),
      import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
    ]).then(([pdfjsLib, workerModule]) => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerModule.default;
      return pdfjsLib;
    });
  }
  return pdfJsPromise;
};

const loadPdfDocument = () => import('pdf-lib').then((module) => module.PDFDocument);

// =====================================================================
// Format bytes helper
// =====================================================================
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// =====================================================================
// Translations
// =====================================================================
const i18n = {
  vn: {
    title: 'Nén & Thu Nhỏ File PDF',
    subtitle: 'Nén và tối ưu hóa file PDF 100% trên trình duyệt, bảo mật riêng tư tuyệt đối.',
    selectPreset: 'Chọn Mức Độ Nén',
    recommendedBadge: 'Khuyên Dùng',
    customTitle: 'Bảng Điều Khiển Tinh Chỉnh (Custom Precision)',
    dpiLabel: 'Độ phân giải DPI',
    qualityLabel: 'Chất lượng ảnh JPEG',
    grayscaleLabel: 'Chuyển sang Trắng Đen (Grayscale)',
    grayscaleDesc: 'Giảm thêm 30-50% dung lượng cho tài liệu scan, hợp đồng',
    stripMetadataLabel: 'Xóa Metadata & Thông tin ẩn',
    stripMetadataDesc: 'Xóa thông tin tác giả, phần mềm tạo PDF và XML XMP',
    dropTitle: 'Kéo thả tệp PDF vào đây',
    dropHint: 'hoặc click để chọn tệp từ máy tính',
    multipleHint: 'Hỗ trợ nén nhiều file cùng lúc',
    privacyBadge: '100% Client-Side • Bảo mật',
    gpuBadge: 'In-Browser Canvas GPU',
    fileListTitle: 'Danh sách tệp',
    clearAll: 'Xóa tất cả',
    original: 'Gốc',
    compressed: 'Sau nén',
    recompress: 'Nén lại',
    downloadSingle: 'Tải PDF',
    compareBtn: 'So sánh Trước & Sau',
    statsCompleted: 'Đã hoàn tất nén',
    statsSavings: 'Tổng dung lượng tiết kiệm',
    statsDownloadAll: 'Tải tất cả tệp (.ZIP)',
    modalTitle: 'So sánh chất lượng',
    pageOf: 'Trang',
    prevPage: 'Trang trước',
    nextPage: 'Trang sau',
    origPageLabel: 'Trang Gốc (Original)',
    compPageLabel: 'Sau khi nén (Compressed)',
  },
  en: {
    title: 'PDF Slim Compressor',
    subtitle: 'Compress and optimize PDF files 100% in-browser with zero server uploads.',
    selectPreset: 'Select Compression Level',
    recommendedBadge: 'Recommended',
    customTitle: 'Custom Precision Controls',
    dpiLabel: 'DPI Resolution',
    qualityLabel: 'JPEG Quality',
    grayscaleLabel: 'Convert to Grayscale',
    grayscaleDesc: 'Extra 30-50% reduction for scanned docs and invoices',
    stripMetadataLabel: 'Strip Metadata & Hidden Tags',
    stripMetadataDesc: 'Remove author, producer, and XML metadata',
    dropTitle: 'Drag & drop PDF files here',
    dropHint: 'or click to browse files',
    multipleHint: 'Batch processing supported',
    privacyBadge: '100% Client-Side • Secure',
    gpuBadge: 'In-Browser Canvas GPU',
    fileListTitle: 'Files Queue',
    clearAll: 'Clear all',
    original: 'Original',
    compressed: 'Compressed',
    recompress: 'Re-compress',
    downloadSingle: 'Download PDF',
    compareBtn: 'Compare Before & After',
    statsCompleted: 'Completed',
    statsSavings: 'Total Space Saved',
    statsDownloadAll: 'Download All (.ZIP)',
    modalTitle: 'Quality Inspection',
    pageOf: 'Page',
    prevPage: 'Previous Page',
    nextPage: 'Next Page',
    origPageLabel: 'Original Page',
    compPageLabel: 'Compressed Page',
  },
  ja: {
    title: 'PDF 圧縮・最適化',
    subtitle: 'サーバー送信なし、100%ブラウザ上で完結する高セキュリティPDF圧縮。',
    selectPreset: '圧縮レベルを選択',
    recommendedBadge: 'おすすめ',
    customTitle: 'カスタム詳細設定',
    dpiLabel: 'DPI 解像度',
    qualityLabel: 'JPEG 画質',
    grayscaleLabel: 'グレースケール変換 (白黒化)',
    grayscaleDesc: 'スキャン文書や請求書の容量をさらに30〜50%削減',
    stripMetadataLabel: 'メタデータ削除',
    stripMetadataDesc: '作成者や埋め込み情報を削除してプライバシーを保護',
    dropTitle: 'PDFファイルをここにドラッグ＆ドロップ',
    dropHint: 'またはクリックしてファイルを選択',
    multipleHint: '複数ファイルの一括処理に対応',
    privacyBadge: '100% ローカル処理',
    gpuBadge: 'Canvas GPU 処理',
    fileListTitle: '処理対象ファイル',
    clearAll: 'すべてクリア',
    original: '元サイズ',
    compressed: '圧縮後',
    recompress: '再圧縮',
    downloadSingle: 'PDFダウンロード',
    compareBtn: '前後比較プレビュー',
    statsCompleted: '完了',
    statsSavings: '削減容量の合計',
    statsDownloadAll: 'すべてZIPで保存',
    modalTitle: '画質比較インスペクター',
    pageOf: 'ページ',
    prevPage: '前のページ',
    nextPage: '次のページ',
    origPageLabel: '元のページ',
    compPageLabel: '圧縮後のページ',
  },
};

const PRESETS = [
  {
    id: 'maximum',
    title_vn: 'Nén Tối Đa',
    title_en: 'Maximum Compression',
    title_ja: '最大圧縮',
    sub_vn: 'Kích thước nhỏ nhất',
    sub_en: 'Smallest file size',
    sub_ja: '容量最小化',
    est: '-70% ~ -90%',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    icon: Zap,
    options: { dpi: 72, quality: 0.50, grayscale: false, stripMetadata: true, maxDimension: 1600 },
  },
  {
    id: 'balanced',
    title_vn: 'Cân Bằng',
    title_en: 'Balanced',
    title_ja: 'バランス',
    sub_vn: 'Khuyên Dùng',
    sub_en: 'Recommended',
    sub_ja: 'おすすめ',
    est: '-40% ~ -70%',
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    icon: Scale,
    options: { dpi: 144, quality: 0.75, grayscale: false, stripMetadata: true, maxDimension: 2400 },
  },
  {
    id: 'high-quality',
    title_vn: 'Chất Lượng Cao',
    title_en: 'High Quality',
    title_ja: '高品質',
    sub_vn: 'Nén Nhẹ / In Ấn',
    sub_en: 'Light / Print ready',
    sub_ja: '印刷・高精細',
    est: '-20% ~ -40%',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    icon: Sparkles,
    options: { dpi: 200, quality: 0.88, grayscale: false, stripMetadata: false, maxDimension: 3600 },
  },
  {
    id: 'custom',
    title_vn: 'Tùy Chỉnh Sâu',
    title_en: 'Custom Precision',
    title_ja: 'カスタム詳細',
    sub_vn: 'Chuyên Nghiệp',
    sub_en: 'Advanced controls',
    sub_ja: '詳細設定',
    est: 'Custom',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    icon: SlidersHorizontal,
    options: { dpi: 120, quality: 0.70, grayscale: false, stripMetadata: true, maxDimension: 2000 },
  },
];

export default function PdfCompressorView({ displayLang = 'vi' }) {
  const langKey = displayLang === 'en' ? 'en' : displayLang === 'ja' ? 'ja' : 'vn';
  const t = i18n[langKey];

  const [activePreset, setActivePreset] = useState('balanced');
  const [customOptions, setCustomOptions] = useState({
    dpi: 120,
    quality: 0.70,
    grayscale: false,
    stripMetadata: true,
    maxDimension: 2000,
  });

  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [comparisonItem, setComparisonItem] = useState(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const fileInputRef = useRef(null);

  const currentOptions = useMemo(() => {
    if (activePreset === 'custom') {
      return customOptions;
    }
    const found = PRESETS.find((p) => p.id === activePreset);
    return found ? found.options : PRESETS[1].options;
  }, [activePreset, customOptions]);

  // Clean up blob URLs on unmount
  useEffect(() => {
    return () => {
      files.forEach((f) => {
        if (f.compressedUrl) URL.revokeObjectURL(f.compressedUrl);
      });
    };
  }, []);

  // Compression core execution
  const processSingleFile = useCallback(async (item, options) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === item.id ? { ...f, status: 'compressing', progress: 5 } : f
      )
    );

    try {
      const [pdfjsLib, PDFDocument] = await Promise.all([
        loadPdfJs(),
        loadPdfDocument(),
      ]);

      const arrayBuffer = await item.file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer),
      });

      const pdfJsDoc = await loadingTask.promise;
      const totalPages = pdfJsDoc.numPages;

      const newPdfDoc = await PDFDocument.create();
      if (options.stripMetadata) {
        newPdfDoc.setTitle('');
        newPdfDoc.setAuthor('');
        newPdfDoc.setSubject('');
        newPdfDoc.setKeywords([]);
        newPdfDoc.setProducer('AI Tools PDF Slim');
      }

      const origPreviews = [];
      const compPreviews = [];

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdfJsDoc.getPage(pageNum);
        const unscaledViewport = page.getViewport({ scale: 1.0 });
        const originalWidthPoints = unscaledViewport.width;
        const originalHeightPoints = unscaledViewport.height;

        let scale = options.dpi / 72;
        if (options.maxDimension) {
          const maxDim = Math.max(originalWidthPoints * scale, originalHeightPoints * scale);
          if (maxDim > options.maxDimension) {
            scale = scale * (options.maxDimension / maxDim);
          }
        }

        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) throw new Error(`Cannot initialize Canvas context for page ${pageNum}`);

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        await page.render({ canvasContext: ctx, viewport }).promise;

        if (pageNum <= 3) {
          origPreviews.push(canvas.toDataURL('image/jpeg', 0.9));
        }

        if (options.grayscale) {
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imgData.data;
          for (let i = 0; i < data.length; i += 4) {
            const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
            data[i] = gray;
            data[i + 1] = gray;
            data[i + 2] = gray;
          }
          ctx.putImageData(imgData, 0, 0);
        }

        const jpegDataUrl = canvas.toDataURL('image/jpeg', options.quality);
        if (pageNum <= 3) {
          compPreviews.push(jpegDataUrl);
        }

        const base64Data = jpegDataUrl.split(',')[1];
        const binaryString = window.atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const embeddedImage = await newPdfDoc.embedJpg(bytes);
        const newPage = newPdfDoc.addPage([originalWidthPoints, originalHeightPoints]);
        newPage.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: originalWidthPoints,
          height: originalHeightPoints,
        });

        const percent = Math.round((pageNum / totalPages) * 100);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? { ...f, currentPage: pageNum, totalPages, progress: Math.max(10, percent) }
              : f
          )
        );

        canvas.width = 0;
        canvas.height = 0;
      }

      const compressedPdfBytes = await newPdfDoc.save({ useObjectStreams: true });
      const blob = new Blob([compressedPdfBytes.buffer], { type: 'application/pdf' });
      const compressedSize = blob.size;
      const originalSize = item.file.size;
      const reductionPercentage =
        originalSize > 0
          ? Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100))
          : 0;

      const url = URL.createObjectURL(blob);

      setFiles((prev) =>
        prev.map((f) =>
          f.id === item.id
            ? {
                ...f,
                status: 'completed',
                progress: 100,
                compressedBlob: blob,
                compressedUrl: url,
                compressedSize,
                reductionPercentage,
                previewOriginalPages: origPreviews,
                previewCompressedPages: compPreviews,
              }
            : f
        )
      );

      if (reductionPercentage >= 50) {
        try {
          confetti({ particleCount: 35, spread: 60, origin: { y: 0.8 }, colors: ['#0d9488', '#14b8a6', '#10b981'] });
        } catch {}
      }
    } catch (err) {
      console.error('Lỗi khi nén PDF:', err);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === item.id
            ? { ...f, status: 'error', progress: 0, errorMessage: err.message || 'Lỗi xử lý file PDF' }
            : f
        )
      );
    }
  }, []);

  const handleFilesSelected = async (newFiles) => {
    const newItems = newFiles.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      name: file.name,
      originalSize: file.size,
      compressedSize: null,
      status: 'idle',
      progress: 0,
      currentPage: 0,
      totalPages: 0,
      previewOriginalPages: [],
      previewCompressedPages: [],
      compressedBlob: null,
      compressedUrl: null,
      reductionPercentage: null,
      appliedPreset: activePreset,
    }));

    setFiles((prev) => [...prev, ...newItems]);
    setIsProcessing(true);

    for (const item of newItems) {
      await processSingleFile(item, currentOptions);
    }

    setIsProcessing(false);
  };

  const handleRecompress = async (item) => {
    setIsProcessing(true);
    await processSingleFile(item, currentOptions);
    setIsProcessing(false);
  };

  const handleRemoveFile = (id) => {
    setFiles((prev) => {
      const item = prev.find((f) => f.id === id);
      if (item?.compressedUrl) URL.revokeObjectURL(item.compressedUrl);
      return prev.filter((f) => f.id !== id);
    });
  };

  const handleClearAll = () => {
    files.forEach((f) => {
      if (f.compressedUrl) URL.revokeObjectURL(f.compressedUrl);
    });
    setFiles([]);
  };

  const handleDownloadSingle = (item) => {
    if (!item.compressedBlob) return;
    const baseName = item.name.replace(/\.pdf$/i, '');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(item.compressedBlob);
    a.download = `${baseName}_slim.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadAllZip = async () => {
    const completedItems = files.filter((f) => f.status === 'completed' && f.compressedBlob);
    if (completedItems.length === 0) return;

    setIsZipping(true);
    try {
      const zip = new JSZip();
      completedItems.forEach((item) => {
        if (item.compressedBlob) {
          const baseName = item.name.replace(/\.pdf$/i, '');
          zip.file(`${baseName}_slim.pdf`, item.compressedBlob);
        }
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(zipBlob);
      a.download = `pdf_slim_compressed_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Lỗi tạo ZIP:', err);
    } finally {
      setIsZipping(false);
    }
  };

  // Batch stats
  const stats = useMemo(() => {
    let completed = 0;
    let totalOrig = 0;
    let totalComp = 0;
    files.forEach((f) => {
      if (f.status === 'completed' && f.compressedSize !== null) {
        completed += 1;
        totalOrig += f.originalSize;
        totalComp += f.compressedSize;
      }
    });
    const saved = Math.max(0, totalOrig - totalComp);
    const reduction = totalOrig > 0 ? Math.round((saved / totalOrig) * 100) : 0;
    return { completed, totalOrig, totalComp, saved, reduction };
  }, [files]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{t.privacyBadge}</span>
        </div>
        <h2 className="text-2xl md:text-4xl font-extrabold text-slate-100 tracking-tight">
          {t.title}
        </h2>
        <p className="text-slate-400 text-sm max-w-2xl mx-auto">
          {t.subtitle}
        </p>
      </div>

      {/* Preset Selector Panel */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            {t.selectPreset}
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESETS.map((preset) => {
            const isSelected = activePreset === preset.id;
            const isRec = preset.id === 'balanced';
            const Icon = preset.icon;

            const pTitle =
              langKey === 'en' ? preset.title_en : langKey === 'ja' ? preset.title_ja : preset.title_vn;
            const pSub =
              langKey === 'en' ? preset.sub_en : langKey === 'ja' ? preset.sub_ja : preset.sub_vn;

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setActivePreset(preset.id)}
                disabled={isProcessing}
                className={`relative text-left p-4 rounded-2xl transition-all duration-200 flex flex-col justify-between border ${
                  isSelected
                    ? 'bg-slate-800/90 border-teal-500 shadow-lg shadow-teal-500/10 ring-2 ring-teal-500/30'
                    : 'bg-slate-800/40 hover:bg-slate-800/70 border-slate-700/60'
                } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {isRec && (
                  <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 text-[10px] font-bold text-white uppercase tracking-wider shadow-sm">
                    {t.recommendedBadge}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-slate-700/50 border border-slate-600/50 text-teal-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center text-white">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <div className="font-bold text-slate-100 text-sm mb-0.5">{pTitle}</div>
                  <div className="text-xs text-slate-400 mb-2">{pSub}</div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Ước tính:</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${preset.badgeColor}`}>
                    {preset.est}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom Settings Panel */}
        {activePreset === 'custom' && (
          <div className="mt-4 p-5 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-700/60 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <SlidersHorizontal className="w-4 h-4" />
              <span>{t.customTitle}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* DPI Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-300">
                  <span>{t.dpiLabel} ({customOptions.dpi} DPI)</span>
                  <span className="text-slate-400 font-mono">
                    {customOptions.dpi <= 72 ? 'Email/Min' : customOptions.dpi <= 150 ? 'Standard' : 'Print'}
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="300"
                  step="10"
                  value={customOptions.dpi}
                  disabled={isProcessing}
                  onChange={(e) => setCustomOptions({ ...customOptions, dpi: parseInt(e.target.value, 10) })}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
                />
              </div>

              {/* Quality Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-300">
                  <span>{t.qualityLabel} ({Math.round(customOptions.quality * 100)}%)</span>
                  <span className="text-slate-400 font-mono">
                    {customOptions.quality < 0.6 ? 'Low' : customOptions.quality <= 0.8 ? 'Medium' : 'High'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.95"
                  step="0.05"
                  value={customOptions.quality}
                  disabled={isProcessing}
                  onChange={(e) => setCustomOptions({ ...customOptions, quality: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
                />
              </div>

              {/* Grayscale */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-slate-700/50">
                <div>
                  <div className="text-xs font-semibold text-slate-200">{t.grayscaleLabel}</div>
                  <div className="text-[11px] text-slate-400">{t.grayscaleDesc}</div>
                </div>
                <input
                  type="checkbox"
                  checked={customOptions.grayscale}
                  disabled={isProcessing}
                  onChange={(e) => setCustomOptions({ ...customOptions, grayscale: e.target.checked })}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 bg-slate-700 border-slate-600"
                />
              </div>

              {/* Strip Metadata */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-slate-700/50">
                <div>
                  <div className="text-xs font-semibold text-slate-200">{t.stripMetadataLabel}</div>
                  <div className="text-[11px] text-slate-400">{t.stripMetadataDesc}</div>
                </div>
                <input
                  type="checkbox"
                  checked={customOptions.stripMetadata}
                  disabled={isProcessing}
                  onChange={(e) => setCustomOptions({ ...customOptions, stripMetadata: e.target.checked })}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 bg-slate-700 border-slate-600"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Drop Zone */}
      <div
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (isProcessing) return;
          const pdfs = [];
          if (e.dataTransfer.files) {
            for (let i = 0; i < e.dataTransfer.files.length; i++) {
              const file = e.dataTransfer.files[i];
              if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                pdfs.push(file);
              }
            }
          }
          if (pdfs.length > 0) handleFilesSelected(pdfs);
        }}
        className={`w-full rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 border-2 border-dashed bg-slate-900/40 hover:bg-slate-800/60 border-slate-700 hover:border-teal-500/60 ${
          isProcessing ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          disabled={isProcessing}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              const pdfs = [];
              for (let i = 0; i < e.target.files.length; i++) {
                const file = e.target.files[i];
                if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                  pdfs.push(file);
                }
              }
              if (pdfs.length > 0) handleFilesSelected(pdfs);
              e.target.value = '';
            }
          }}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center">
            <UploadCloud className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-100 mb-1">{t.dropTitle}</h3>
            <p className="text-xs sm:text-sm text-slate-400">{t.dropHint}</p>
          </div>
          <div className="text-[11px] text-slate-500 pt-1">
            {t.multipleHint}
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      {stats.completed > 0 && (
        <div className="w-full p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-teal-500/30 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6 text-center sm:text-left">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-400">{t.statsCompleted}</div>
                <div className="text-lg font-extrabold text-slate-100">
                  {stats.completed} / {files.length} tệp
                </div>
              </div>
            </div>

            <div className="h-8 w-px bg-slate-800 hidden sm:block" />

            <div>
              <div className="text-xs text-slate-400">{t.statsSavings}</div>
              <div className="flex items-baseline space-x-2">
                <span className="text-xl font-black text-emerald-400">
                  {formatBytes(stats.saved)}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  -{stats.reduction}%
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownloadAllZip}
            disabled={isZipping || stats.completed === 0}
            className="w-full md:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            {isZipping ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang tạo ZIP...</span>
              </>
            ) : (
              <>
                <Archive className="w-4 h-4" />
                <span>{t.statsDownloadAll}</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Files List */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-slate-200 text-xs font-bold uppercase tracking-wider">
              <Files className="w-4 h-4 text-teal-400" />
              <span>{t.fileListTitle} ({files.length})</span>
            </div>
            <button
              type="button"
              onClick={handleClearAll}
              disabled={isProcessing}
              className="text-xs text-slate-400 hover:text-red-400 flex items-center space-x-1 p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <Trash className="w-3.5 h-3.5" />
              <span>{t.clearAll}</span>
            </button>
          </div>

          <div className="space-y-3">
            {files.map((item) => {
              const isCompleted = item.status === 'completed';
              const isComp = item.status === 'compressing';
              const isErr = item.status === 'error';

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition flex flex-col space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start space-x-3 min-w-0">
                      <div className={`p-2.5 rounded-xl border flex-shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : isComp
                          ? 'bg-teal-500/10 text-teal-400 border-teal-500/20 animate-pulse'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-slate-100 truncate max-w-md">
                          {item.name}
                        </h4>
                        <div className="flex items-center flex-wrap gap-2 text-xs text-slate-400 mt-1">
                          <span>{t.original}: <strong className="text-slate-300">{formatBytes(item.originalSize)}</strong></span>
                          {isCompleted && item.compressedSize !== null && (
                            <>
                              <span>→</span>
                              <span>{t.compressed}: <strong className="text-emerald-400">{formatBytes(item.compressedSize)}</strong></span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 flex-shrink-0">
                      {isCompleted && item.reductionPercentage !== null && (
                        <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                          <TrendingDown className="w-3.5 h-3.5" />
                          <span>-{item.reductionPercentage}%</span>
                        </div>
                      )}
                      {isComp && (
                        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-400 text-xs font-medium">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>{item.currentPage ? `${t.pageOf} ${item.currentPage}/${item.totalPages}` : 'Processing...'}</span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(item.id)}
                        disabled={isComp}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {isComp && (
                    <div className="w-full space-y-1">
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-150 rounded-full"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {isErr && (
                    <div className="text-xs text-red-400 bg-red-950/40 p-2.5 rounded-lg border border-red-800/40">
                      {item.errorMessage}
                    </div>
                  )}

                  {isCompleted && (
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center space-x-2">
                        {item.previewOriginalPages.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setComparisonItem(item);
                              setCurrentPageIndex(0);
                              setZoomLevel(1);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium border border-slate-700 transition flex items-center space-x-1.5"
                          >
                            <Eye className="w-3.5 h-3.5 text-teal-400" />
                            <span>{t.compareBtn}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRecompress(item)}
                          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition"
                          title={t.recompress}
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDownloadSingle(item)}
                        className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-semibold shadow transition flex items-center space-x-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{t.downloadSingle}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Comparison Modal */}
      {comparisonItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-100 truncate">
                  {t.modalTitle}: {comparisonItem.name}
                </h3>
                <p className="text-xs text-slate-400">
                  {t.original}: {formatBytes(comparisonItem.originalSize)} → {t.compressed}:{' '}
                  <span className="text-emerald-400 font-semibold">{formatBytes(comparisonItem.compressedSize)}</span>{' '}
                  (-{comparisonItem.reductionPercentage}%)
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
                  <button
                    onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.5))}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="px-2 text-xs font-mono text-slate-300">{Math.round(zoomLevel * 100)}%</span>
                  <button
                    onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 2.5))}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={() => setComparisonItem(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-6 bg-slate-950/40">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="space-y-2 text-center">
                  <div className="text-xs font-bold text-slate-300 bg-slate-800/80 py-1.5 rounded-lg">
                    {t.origPageLabel}
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 flex items-center justify-center min-h-[350px] overflow-hidden">
                    {comparisonItem.previewOriginalPages[currentPageIndex] && (
                      <img
                        src={comparisonItem.previewOriginalPages[currentPageIndex]}
                        alt="Original"
                        className="max-h-[460px] object-contain rounded transition-transform"
                        style={{ transform: `scale(${zoomLevel})` }}
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-center">
                  <div className="text-xs font-bold text-emerald-300 bg-emerald-950/40 py-1.5 rounded-lg border border-emerald-800/40">
                    {t.compPageLabel}
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 flex items-center justify-center min-h-[350px] overflow-hidden">
                    {comparisonItem.previewCompressedPages[currentPageIndex] && (
                      <img
                        src={comparisonItem.previewCompressedPages[currentPageIndex]}
                        alt="Compressed"
                        className="max-h-[460px] object-contain rounded transition-transform"
                        style={{ transform: `scale(${zoomLevel})` }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {comparisonItem.previewOriginalPages.length > 1 && (
              <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {t.pageOf} {currentPageIndex + 1} / {comparisonItem.previewOriginalPages.length}
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    disabled={currentPageIndex === 0}
                    onClick={() => setCurrentPageIndex((p) => Math.max(p - 1, 0))}
                    className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs disabled:opacity-30 flex items-center space-x-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>{t.prevPage}</span>
                  </button>
                  <button
                    disabled={currentPageIndex >= comparisonItem.previewOriginalPages.length - 1}
                    onClick={() => setCurrentPageIndex((p) => Math.min(p + 1, comparisonItem.previewOriginalPages.length - 1))}
                    className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs disabled:opacity-30 flex items-center space-x-1"
                  >
                    <span>{t.nextPage}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
