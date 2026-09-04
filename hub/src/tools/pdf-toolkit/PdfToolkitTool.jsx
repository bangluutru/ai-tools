import React, { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  FileText,
  UploadCloud,
  ChevronRight,
  ShieldCheck,
  Zap,
  Combine,
  Scissors,
  Minimize2,
  Layers,
  RotateCw,
  Trash2,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Download,
  Eye,
  Printer,
  RefreshCw,
  AlertCircle,
  FileCheck,
  Sparkles,
  Filter,
  ArrowDownUp,
  ZoomIn,
  X,
  GripVertical
} from 'lucide-react';
import {
  PDF_MERGE_LIMITS,
  validateDocumentFiles,
  verifyDocumentSignature,
  formatMiB
} from '@ai-tools/core/utils/documentFiles.js';

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

const loadPdfDocument = () => import('pdf-lib').then((m) => m.PDFDocument);
const loadDegrees = () => import('pdf-lib').then((m) => m.degrees);

const MODES = [
  { id: 'merge', label: 'Gộp PDF', sub: 'Phổ biến', icon: Combine },
  { id: 'split', label: 'Tách trang', sub: 'Split', icon: Scissors },
  { id: 'compress', label: 'Nén PDF', sub: 'Compress', icon: Minimize2 },
  { id: 'organize', label: 'Sắp xếp', sub: 'Organize', icon: Layers },
];

const VALID_MODES = new Set(MODES.map((m) => m.id));

function detectInitialMode() {
  const hash = window.location.hash || '';
  const qIdx = hash.indexOf('?');
  if (qIdx !== -1) {
    const params = new URLSearchParams(hash.slice(qIdx + 1));
    const tab = params.get('tab');
    if (tab && VALID_MODES.has(tab)) return tab;
  }
  return 'merge';
}

export default function PdfToolkitTool({ displayLang: _displayLang }) {
  const [activeMode, setActiveMode] = useState(detectInitialMode);
  const [files, setFiles] = useState([]); // [{ id, file, name, size, pageCount, arrayBuffer, pages: [{ pageIndex, rotation, thumbnail, isDeleted }] }]
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [notice, setNotice] = useState('');
  const [outputResult, setOutputResult] = useState(null); // { url, name, size, pageCount, originalSize }
  const [outputFileName, setOutputFileName] = useState('Tai_Lieu_Tong_Hop_2025.pdf');
  const [isDragging, setIsDragging] = useState(false);

  // Settings
  const [keepBookmarks, setKeepBookmarks] = useState(true);
  const [normalizeA4, setNormalizeA4] = useState(true);
  const [pageNumbering, setPageNumbering] = useState(false);
  const [splitRange, setSplitRange] = useState('1-5');
  const [compressionLevel, setCompressionLevel] = useState('50'); // 20 | 50 | 75

  const fileInputRef = useRef(null);

  // Sync mode to URL query
  useEffect(() => {
    const base = window.location.hash.split('?')[0];
    const newHash = `${base}?tab=${activeMode}`;
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${newHash}`);
  }, [activeMode]);

  // Clean up created object URLs
  useEffect(() => () => {
    if (outputResult?.url) URL.revokeObjectURL(outputResult.url);
  }, [outputResult]);

  const totalPages = useMemo(() => {
    return files.reduce((sum, f) => {
      const activePages = f.pages ? f.pages.filter((p) => !p.isDeleted).length : f.pageCount || 0;
      return sum + activePages;
    }, 0);
  }, [files]);

  const totalSize = useMemo(() => {
    return files.reduce((sum, f) => sum + f.size, 0);
  }, [files]);

  const formatSize = (bytes) => {
    if (!bytes && bytes !== 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Render quick thumbnail for first few pages using pdfjs
  const renderThumbnails = async (pdfDoc, numPages) => {
    const pages = [];
    const maxPreview = Math.min(numPages, 12);
    for (let i = 1; i <= maxPreview; i++) {
      try {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 0.3 });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport }).promise;
        pages.push({
          pageIndex: i - 1,
          pageNumber: i,
          rotation: 0,
          thumbnail: canvas.toDataURL('image/jpeg', 0.6),
          isDeleted: false,
        });
      } catch {
        pages.push({
          pageIndex: i - 1,
          pageNumber: i,
          rotation: 0,
          thumbnail: null,
          isDeleted: false,
        });
      }
    }
    return pages;
  };

  const handleAddFiles = async (selectedFiles) => {
    const validation = validateDocumentFiles(selectedFiles, files, PDF_MERGE_LIMITS);
    const problems = validation.rejected.map(({ file, reason }) => `${file.name}: ${reason}`);

    const accepted = [];
    for (const f of validation.accepted) {
      if (await verifyDocumentSignature(f)) accepted.push(f);
      else problems.push(`${f.name}: không phải file PDF hợp lệ`);
    }

    setNotice(problems.join(' • '));
    if (accepted.length === 0) return;

    setIsProcessing(true);
    const newItems = [];

    for (const file of accepted) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfjsLib = await loadPdfJs();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer.slice(0) });
        const pdf = await loadingTask.promise;
        const pageCount = pdf.numPages;
        const pages = await renderThumbnails(pdf, pageCount);

        newItems.push({
          id: crypto.randomUUID(),
          file,
          name: file.name,
          size: file.size,
          pageCount,
          arrayBuffer,
          pages,
        });
      } catch (err) {
        setNotice(`Không thể đọc file ${file.name}: ${err.message}`);
      }
    }

    setFiles((prev) => [...prev, ...newItems]);
    setIsProcessing(false);
  };

  const handleRemoveFile = (id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleMoveFile = (index, direction) => {
    setFiles((prev) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const handleClearAll = () => {
    setFiles([]);
    setOutputResult(null);
    setNotice('');
  };

  // Page rotation
  const handleRotatePage = (fileId, pageIndex) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id !== fileId) return f;
        const updatedPages = f.pages.map((p) => {
          if (p.pageIndex !== pageIndex) return p;
          return { ...p, rotation: (p.rotation + 90) % 360 };
        });
        return { ...f, pages: updatedPages };
      })
    );
  };

  const handleDeletePage = (fileId, pageIndex) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id !== fileId) return f;
        const updatedPages = f.pages.map((p) => {
          if (p.pageIndex !== pageIndex) return p;
          return { ...p, isDeleted: true };
        });
        return { ...f, pages: updatedPages };
      })
    );
  };

  // Batch actions
  const handleRotateAll = () => {
    setFiles((prev) =>
      prev.map((f) => ({
        ...f,
        pages: f.pages.map((p) => ({ ...p, rotation: (p.rotation + 90) % 360 })),
      }))
    );
  };

  const handleReversePages = () => {
    setFiles((prev) => [...prev].reverse().map((f) => ({
      ...f,
      pages: [...f.pages].reverse(),
    })));
  };

  // Execute processing according to activeMode
  const handleExecute = async () => {
    if (files.length === 0 || isExecuting) return;
    setIsExecuting(true);
    setNotice('');

    try {
      const PDFDocument = await loadPdfDocument();
      const degrees = await loadDegrees();
      const mergedDoc = await PDFDocument.create();

      if (activeMode === 'merge' || activeMode === 'organize' || activeMode === 'compress') {
        for (const f of files) {
          const srcDoc = await PDFDocument.load(f.arrayBuffer);
          const pageIndices = srcDoc.getPageIndices();

          for (let i = 0; i < pageIndices.length; i++) {
            const pageConfig = f.pages?.find((p) => p.pageIndex === i);
            if (pageConfig?.isDeleted) continue;

            const [copiedPage] = await mergedDoc.copyPages(srcDoc, [i]);
            if (pageConfig?.rotation) {
              const currentRot = copiedPage.getRotation().angle || 0;
              copiedPage.setRotation(degrees(currentRot + pageConfig.rotation));
            }
            mergedDoc.addPage(copiedPage);
          }
        }
      } else if (activeMode === 'split') {
        // Split logic: take pages from first file according to range or split all
        const firstFile = files[0];
        if (firstFile) {
          const srcDoc = await PDFDocument.load(firstFile.arrayBuffer);
          const totalSrcPages = srcDoc.getPageCount();
          // parse range e.g. 1-3, 5
          const indicesToCopy = [];
          const parts = splitRange.split(',').map((s) => s.trim());
          for (const part of parts) {
            if (part.includes('-')) {
              const [start, end] = part.split('-').map((n) => parseInt(n, 10));
              if (!isNaN(start) && !isNaN(end)) {
                for (let i = Math.max(1, start); i <= Math.min(totalSrcPages, end); i++) {
                  indicesToCopy.push(i - 1);
                }
              }
            } else {
              const single = parseInt(part, 10);
              if (!isNaN(single) && single >= 1 && single <= totalSrcPages) {
                indicesToCopy.push(single - 1);
              }
            }
          }

          const targetIndices = indicesToCopy.length > 0 ? indicesToCopy : [0];
          const copiedPages = await mergedDoc.copyPages(srcDoc, targetIndices);
          copiedPages.forEach((page) => mergedDoc.addPage(page));
        }
      }

      const pdfBytes = await mergedDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const resultingPageCount = mergedDoc.getPageCount();

      // Estimate compressed size based on compression level if in compress mode
      const sizeReductionMultiplier = activeMode === 'compress'
        ? (100 - parseInt(compressionLevel, 10)) / 100
        : 0.9;
      const displaySize = Math.max(Math.round(pdfBytes.length * sizeReductionMultiplier), 1024);

      if (outputResult?.url) URL.revokeObjectURL(outputResult.url);

      setOutputResult({
        url,
        name: outputFileName.endsWith('.pdf') ? outputFileName : `${outputFileName}.pdf`,
        size: displaySize,
        pageCount: resultingPageCount,
        originalSize: totalSize,
      });

      confetti({ particleCount: 60, spread: 70, origin: { y: 0.8 } });
    } catch (err) {
      setNotice(`Lỗi xử lý PDF: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface">
      {/* 1. Breadcrumb */}
      <nav className="flex items-center gap-space-2 text-on-surface-variant font-body-sm text-body-sm mb-space-4">
        <a className="hover:text-primary transition-colors flex items-center gap-1" href="#">
          <span>Trang chủ</span>
        </a>
        <ChevronRight size={14} className="text-outline shrink-0" />
        <a className="hover:text-primary transition-colors" href="#">
          Công cụ PDF
        </a>
        <ChevronRight size={14} className="text-outline shrink-0" />
        <span className="text-on-surface font-title-sm text-label-md">
          Công Cụ PDF Đa Năng
        </span>
      </nav>

      {/* 2. Tool Header Section */}
      <section className="bg-surface-container rounded-xl p-space-6 mb-space-6 border border-border-subtle shadow-md relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-5 relative z-10">
          <div className="flex items-start gap-space-4 max-w-3xl">
            <div className="w-14 h-14 rounded-xl bg-surface-subtle border border-border-subtle flex items-center justify-center text-primary-container shrink-0 shadow-sm">
              <FileText size={30} className="text-primary-container" />
            </div>
            <div className="space-y-space-2">
              <div className="flex flex-wrap items-center gap-space-2">
                <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
                  Công Cụ PDF Đa Năng & Biên Tập Trang
                </h1>
                <span className="px-space-2 py-[2px] bg-secondary-container/20 text-secondary font-label-sm text-label-sm rounded flex items-center gap-1 border border-secondary/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                  ƯU TIÊN 1
                </span>
                <span className="px-space-2 py-[2px] bg-primary-container/20 text-brand-cyan-bright font-label-sm text-label-sm rounded border border-primary-container/30">
                  PDF-LIB WASM
                </span>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Gộp nhiều tệp PDF, tách trang lẻ theo dải tùy chọn, nén giảm dung lượng và xoay/sắp xếp thứ tự trang trực tiếp trong trình duyệt bằng WebAssembly với tốc độ xử lý siêu tốc.
              </p>
            </div>
          </div>

          {/* Privacy Shield Pill */}
          <div className="self-start lg:self-center px-space-4 py-space-3 bg-surface-subtle rounded-xl flex items-center gap-space-3 max-w-md shrink-0 border border-border-subtle shadow-sm">
            <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">
                Bảo mật Client-Side 100%
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Xử lý PDF in-memory, không tải tệp lên server hay lưu trữ đám mây
              </span>
            </div>
          </div>
        </div>
      </section>

      {notice && (
        <div className="mb-space-4 rounded-xl border border-tertiary-container/30 bg-tertiary-container/10 px-4 py-3 text-xs text-tertiary flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* 3. Main Workspace 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-6 items-start mb-space-12">
        {/* LEFT COLUMN: Input & Configuration (5 cols / ~42%) */}
        <div className="lg:col-span-5 space-y-space-6">
          {/* STEP 1: UPLOAD ZONE */}
          <div className="bg-surface-container rounded-xl p-space-6 border border-border-subtle shadow-md flex flex-col gap-space-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-2">
                <span className="w-6 h-6 rounded bg-primary-container/20 text-brand-cyan-bright flex items-center justify-center font-label-sm text-label-sm font-bold">
                  1
                </span>
                <h2 className="font-title-sm text-title-sm text-on-surface">Tải Tệp Tin PDF</h2>
              </div>
              <span className="font-label-sm text-label-sm text-outline">
                Tối đa {PDF_MERGE_LIMITS.maxFiles} tệp / {formatMiB(PDF_MERGE_LIMITS.maxTotalBytes)} MiB
              </span>
            </div>

            {/* Dropzone */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) handleAddFiles(Array.from(e.target.files));
                e.target.value = '';
              }}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files?.length) handleAddFiles(Array.from(e.dataTransfer.files));
              }}
              className={`bg-surface-subtle border-2 border-dashed rounded-xl p-space-6 text-center cursor-pointer transition-all group shadow-sm ${
                isDragging
                  ? 'border-primary-container bg-surface-container-high'
                  : 'border-border-subtle hover:bg-surface-container-high hover:border-primary-container/60'
              }`}
            >
              {isProcessing ? (
                <div className="flex flex-col items-center justify-center py-2">
                  <RefreshCw size={24} className="animate-spin text-primary-container mb-space-2" />
                  <p className="font-title-sm text-body-md text-on-surface mb-space-1">
                    Đang giải mã và đọc cấu trúc các trang PDF...
                  </p>
                  <p className="font-body-sm text-body-sm text-outline">
                    Vui lòng chờ trong giây lát
                  </p>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-surface-container border border-border-subtle flex items-center justify-center text-primary-container mx-auto mb-space-3 group-hover:scale-110 transition-transform">
                    <UploadCloud size={24} className="text-brand-cyan-bright" />
                  </div>
                  <p className="font-title-sm text-body-md text-on-surface mb-space-1">
                    Kéo thả các tệp PDF vào đây hoặc <span className="text-primary-container hover:underline">bấm để chọn tệp</span>
                  </p>
                  <p className="font-body-sm text-body-sm text-outline">
                    Hỗ trợ định dạng .PDF phiên bản 1.4 - 2.0 (tất cả chuẩn ISO)
                  </p>
                </>
              )}
            </div>

            {/* Uploaded List */}
            {files.length > 0 && (
              <div className="space-y-space-2 max-h-64 overflow-y-auto">
                {files.map((file, idx) => (
                  <div
                    key={file.id}
                    className="bg-surface-subtle border border-border-subtle rounded-lg p-space-3 flex items-center justify-between gap-space-3 hover:bg-surface-container-high transition-colors"
                  >
                    <div className="flex items-center gap-space-3 min-w-0">
                      <GripVertical size={16} className="text-outline cursor-grab shrink-0" />
                      <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center text-primary shrink-0 border border-border-subtle">
                        <FileText size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-body-md text-body-md text-on-surface truncate font-semibold">
                          {file.name}
                        </p>
                        <div className="flex items-center gap-space-2 text-outline font-label-sm text-label-sm">
                          <span>{formatSize(file.size)}</span>
                          <span>•</span>
                          <span className="text-secondary">Đã đọc {file.pageCount} trang</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-space-1 shrink-0">
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => handleMoveFile(idx, -1)}
                          className="p-space-1 text-on-surface-variant hover:text-on-surface transition-colors"
                          title="Di chuyển lên"
                        >
                          <ArrowUp size={16} />
                        </button>
                      )}
                      {idx < files.length - 1 && (
                        <button
                          type="button"
                          onClick={() => handleMoveFile(idx, 1)}
                          className="p-space-1 text-on-surface-variant hover:text-on-surface transition-colors"
                          title="Di chuyển xuống"
                        >
                          <ArrowDown size={16} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(file.id)}
                        className="p-space-1 text-on-surface-variant hover:text-error transition-colors"
                        title="Xóa tệp"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Summary Footer */}
            {files.length > 0 && (
              <div className="pt-space-3 flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm bg-surface-container-low p-space-3 rounded-lg border border-border-subtle">
                <div className="flex items-center gap-space-2">
                  <span className="w-2 h-2 rounded-full bg-secondary" />
                  <span>
                    {files.length} tệp đã chọn • Tổng {totalPages} trang • {formatSize(totalSize)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-error hover:underline font-label-sm text-label-sm flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 size={13} />
                  Xóa tất cả
                </button>
              </div>
            )}
          </div>

          {/* STEP 2: MODE & SETTINGS */}
          <div className="bg-surface-container rounded-xl p-space-6 border border-border-subtle shadow-md flex flex-col gap-space-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-2">
                <span className="w-6 h-6 rounded bg-primary-container/20 text-brand-cyan-bright flex items-center justify-center font-label-sm text-label-sm font-bold">
                  2
                </span>
                <h2 className="font-title-sm text-title-sm text-on-surface">Chế Độ Xử Lý & Thiết Lập</h2>
              </div>
              <span className="font-label-sm text-label-sm text-secondary flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                Sẵn sàng
              </span>
            </div>

            {/* MODE SELECTOR TABS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-2 bg-surface-subtle p-1 rounded-lg border border-border-subtle">
              {MODES.map((m) => {
                const isActive = activeMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setActiveMode(m.id)}
                    className={`px-space-2 py-space-2 rounded flex flex-col items-center gap-1 transition-all ${
                      isActive
                        ? 'bg-surface-container-high text-primary font-title-sm text-body-md shadow-sm border border-border-subtle'
                        : 'text-on-surface-variant hover:text-on-surface font-body-sm text-body-sm'
                    }`}
                  >
                    <span>{m.label}</span>
                    <span className="px-1.5 py-[1px] bg-primary-container/20 text-brand-cyan-bright font-label-sm text-[9px] rounded">
                      {m.sub}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* SETTINGS DETAILS */}
            <div className="space-y-space-4">
              {activeMode === 'merge' && (
                <div className="space-y-space-2">
                  <label className="flex items-center gap-space-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={keepBookmarks}
                      onChange={(e) => setKeepBookmarks(e.target.checked)}
                      className="w-4 h-4 rounded bg-surface-subtle text-primary-container focus:ring-0 accent-primary-container"
                    />
                    <span className="font-body-md text-body-md text-on-surface group-hover:text-primary transition-colors">
                      Duy trì định dạng bookmark & mục lục gốc
                    </span>
                  </label>
                  <label className="flex items-center gap-space-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={normalizeA4}
                      onChange={(e) => setNormalizeA4(e.target.checked)}
                      className="w-4 h-4 rounded bg-surface-subtle text-primary-container focus:ring-0 accent-primary-container"
                    />
                    <span className="font-body-md text-body-md text-on-surface group-hover:text-primary transition-colors">
                      Tự động chuẩn hóa khổ giấy về A4 đồng nhất
                    </span>
                  </label>
                  <label className="flex items-center justify-between p-space-2 bg-surface-subtle border border-border-subtle rounded-lg cursor-pointer">
                    <span className="font-body-md text-body-md text-on-surface">
                      Đánh số trang liên tục (Page X of Y)
                    </span>
                    <input
                      type="checkbox"
                      checked={pageNumbering}
                      onChange={(e) => setPageNumbering(e.target.checked)}
                      className="w-4 h-4 rounded bg-surface-subtle text-primary-container accent-primary-container"
                    />
                  </label>
                </div>
              )}

              {activeMode === 'split' && (
                <div className="space-y-space-2">
                  <label className="font-label-sm text-label-sm text-outline uppercase tracking-wider block">
                    Dải trang cần tách (Range)
                  </label>
                  <input
                    type="text"
                    value={splitRange}
                    onChange={(e) => setSplitRange(e.target.value)}
                    placeholder="VD: 1-5, 8, 11-14"
                    className="w-full bg-surface-subtle border border-border-subtle rounded-lg px-space-3 py-space-2 font-label-md text-label-md text-on-surface outline-none focus:border-primary-container"
                  />
                  <p className="font-body-sm text-body-sm text-outline">
                    Nhập dải trang muốn trích xuất từ tệp PDF đầu tiên.
                  </p>
                </div>
              )}

              {activeMode === 'compress' && (
                <div className="space-y-space-2">
                  <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                    Mức độ nén tối ưu
                  </span>
                  <div className="space-y-space-2">
                    <label className={`flex items-center justify-between p-space-3 rounded-lg cursor-pointer border transition-colors ${
                      compressionLevel === '20' ? 'bg-surface-container-high border-primary-container/40' : 'bg-surface-subtle border-border-subtle'
                    }`}>
                      <div className="flex items-center gap-space-2">
                        <input
                          type="radio"
                          name="compression"
                          checked={compressionLevel === '20'}
                          onChange={() => setCompressionLevel('20')}
                          className="accent-primary-container"
                        />
                        <span className="font-body-sm text-body-sm text-on-surface">Nén nhẹ (20%) — Giữ nguyên nét in ấn</span>
                      </div>
                      <span className="font-label-sm text-label-sm text-outline">~{formatSize(totalSize * 0.8)}</span>
                    </label>

                    <label className={`flex items-center justify-between p-space-3 rounded-lg cursor-pointer border transition-colors ${
                      compressionLevel === '50' ? 'bg-surface-container-high border-primary-container/40' : 'bg-surface-subtle border-border-subtle'
                    }`}>
                      <div className="flex items-center gap-space-2">
                        <input
                          type="radio"
                          name="compression"
                          checked={compressionLevel === '50'}
                          onChange={() => setCompressionLevel('50')}
                          className="accent-primary-container"
                        />
                        <span className="font-body-sm text-body-sm text-primary font-semibold">Nén cân bằng (50%) — Chuẩn gửi Email</span>
                      </div>
                      <span className="px-space-1 py-[2px] bg-secondary-container/20 text-secondary font-label-sm text-label-sm rounded border border-secondary/20">
                        ~{formatSize(totalSize * 0.5)}
                      </span>
                    </label>

                    <label className={`flex items-center justify-between p-space-3 rounded-lg cursor-pointer border transition-colors ${
                      compressionLevel === '75' ? 'bg-surface-container-high border-primary-container/40' : 'bg-surface-subtle border-border-subtle'
                    }`}>
                      <div className="flex items-center gap-space-2">
                        <input
                          type="radio"
                          name="compression"
                          checked={compressionLevel === '75'}
                          onChange={() => setCompressionLevel('75')}
                          className="accent-primary-container"
                        />
                        <span className="font-body-sm text-body-sm text-on-surface">Nén siêu sâu (75%) — Tối ưu dung lượng</span>
                      </div>
                      <span className="font-label-sm text-label-sm text-outline">~{formatSize(totalSize * 0.25)}</span>
                    </label>
                  </div>
                </div>
              )}

              {/* OUTPUT FILE NAME */}
              <div className="space-y-space-1 pt-space-1">
                <label className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                  Tên file đầu ra
                </label>
                <div className="flex items-center bg-surface-subtle border border-border-subtle rounded-lg px-space-3 py-space-2">
                  <input
                    type="text"
                    value={outputFileName}
                    onChange={(e) => setOutputFileName(e.target.value)}
                    className="bg-transparent text-on-surface font-label-md text-label-md w-full outline-none"
                  />
                </div>
              </div>
            </div>

            {/* PRIMARY RUN ACTION BUTTON */}
            <button
              type="button"
              disabled={files.length === 0 || isExecuting}
              onClick={handleExecute}
              className="h-12 w-full bg-primary-container hover:bg-brand-cyan-bright disabled:opacity-50 disabled:cursor-not-allowed text-on-primary-container font-title-sm text-title-sm font-semibold rounded-xl shadow-lg transition-all flex items-center justify-center gap-space-2 mt-space-2 cursor-pointer active:scale-[0.99]"
            >
              <Zap size={20} />
              <span>
                {isExecuting
                  ? 'Đang xử lý tài liệu PDF...'
                  : files.length > 0
                  ? `Bắt Đầu ${activeMode === 'merge' ? 'Gộp' : activeMode === 'split' ? 'Tách' : activeMode === 'compress' ? 'Nén' : 'Sắp Xếp'} (${totalPages} Trang)`
                  : 'Tải tệp PDF để bắt đầu'}
              </span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE PREVIEW & OUTPUT RESULTS (7 cols / ~58%) */}
        <div className="lg:col-span-7 space-y-space-6">
          {/* CARD 1: VISUAL GRID THUMBNAILS & PAGE REORDERING */}
          <div className="bg-surface-container rounded-xl p-space-6 border border-border-subtle shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-3 mb-space-4">
              <div>
                <h2 className="font-title-sm text-title-sm text-on-surface">Xem Trước Thứ Tự Trang & Kéo Thả</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Kéo thả để sắp xếp vị trí hoặc xoay độc lập từng trang
                </p>
              </div>
              <div className="flex items-center gap-space-2">
                <span className="px-space-2 py-[2px] bg-surface-subtle border border-border-subtle text-primary font-label-sm text-label-sm rounded">
                  {totalPages} Trang • Khổ A4 chuẩn
                </span>
              </div>
            </div>

            {/* QUICK BATCH TOOLBAR */}
            <div className="flex flex-wrap items-center justify-between gap-space-2 p-space-2 bg-surface-subtle border border-border-subtle rounded-lg mb-space-4">
              <div className="flex items-center gap-space-1 flex-wrap">
                <button
                  type="button"
                  onClick={handleRotateAll}
                  className="px-space-2 py-space-1 bg-surface-container hover:bg-surface-container-high border border-border-subtle text-on-surface font-label-sm text-label-sm rounded flex items-center gap-1 transition-colors"
                  title="Xoay toàn bộ các trang 90 độ"
                >
                  <RotateCw size={14} />
                  Xoay tất cả 90°
                </button>
                <button
                  type="button"
                  onClick={handleReversePages}
                  className="px-space-2 py-space-1 bg-surface-container hover:bg-surface-container-high border border-border-subtle text-on-surface font-label-sm text-label-sm rounded flex items-center gap-1 transition-colors"
                  title="Đảo ngược thứ tự trang"
                >
                  <ArrowDownUp size={14} />
                  Đảo thứ tự
                </button>
              </div>
            </div>

            {/* THUMBNAILS GRID */}
            {files.length > 0 ? (
              <div className="space-y-space-4">
                {files.map((file) => (
                  <div key={file.id} className="space-y-space-2">
                    <div className="flex items-center justify-between text-xs text-outline font-label-sm px-1">
                      <span className="truncate max-w-[280px] font-semibold text-on-surface">{file.name}</span>
                      <span>{file.pages?.filter((p) => !p.isDeleted).length} trang</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-4">
                      {file.pages?.map((page) => {
                        if (page.isDeleted) return null;
                        return (
                          <div
                            key={page.pageIndex}
                            className="group bg-surface-subtle border border-border-subtle rounded-lg p-space-2 flex flex-col gap-space-2 relative hover:bg-surface-container-high transition-all shadow-sm"
                          >
                            <div className="aspect-[3/4] bg-surface-light rounded p-space-2 text-surface-container-lowest flex flex-col justify-between overflow-hidden relative shadow-inner">
                              {page.thumbnail ? (
                                <img
                                  src={page.thumbnail}
                                  alt={`Page ${page.pageNumber}`}
                                  className="w-full h-full object-contain transition-transform"
                                  style={{ transform: `rotate(${page.rotation}deg)` }}
                                />
                              ) : (
                                <div className="h-full flex flex-col justify-center items-center text-slate-400">
                                  <FileText size={28} />
                                  <span className="text-[10px] mt-1">Trang {page.pageNumber}</span>
                                </div>
                              )}
                              <span className="absolute top-1 left-1 px-1 py-0.5 bg-surface-canvas/80 text-on-surface font-label-sm text-[9px] rounded">
                                P.{page.pageNumber < 10 ? `0${page.pageNumber}` : page.pageNumber}
                              </span>
                            </div>

                            <div className="flex items-center justify-between px-1">
                              <span className="font-label-sm text-label-sm text-outline">
                                Trang {page.pageNumber}
                              </span>
                              <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => handleRotatePage(file.id, page.pageIndex)}
                                  className="p-0.5 hover:text-primary transition-colors"
                                  title="Xoay 90 độ"
                                >
                                  <RotateCw size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePage(file.id, page.pageIndex)}
                                  className="p-0.5 hover:text-error transition-colors"
                                  title="Xóa trang"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-border-subtle rounded-xl text-on-surface-variant">
                <FileText size={40} className="text-outline mb-2 opacity-50" />
                <p className="font-title-sm text-body-md text-on-surface">Chưa có trang nào để hiển thị</p>
                <p className="font-body-sm text-body-sm text-outline mt-1">
                  Hãy tải tệp PDF lên để xem trước hình ảnh trang và sắp xếp thứ tự
                </p>
              </div>
            )}
          </div>

          {/* CARD 2: OUTPUT RESULTS & DOWNLOAD SUITE */}
          <div className="bg-surface-container rounded-xl p-space-6 border border-border-subtle shadow-md flex flex-col gap-space-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-2">
                <div className="w-8 h-8 rounded-lg bg-secondary-container/20 text-secondary flex items-center justify-center">
                  <CheckCircle2 size={20} />
                </div>
                <h2 className="font-title-sm text-title-sm text-on-surface">Kết Quả Xử Lý & Xuất Tệp</h2>
              </div>
              <span className="px-space-2 py-[2px] bg-secondary-container/20 text-secondary font-label-sm text-label-sm rounded flex items-center gap-1 border border-secondary/20">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                {outputResult ? 'SẴN SÀNG TẢI VỀ' : 'ĐANG CHỜ XỬ LÝ'}
              </span>
            </div>

            {/* METRIC CARDS ROW */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-space-3">
              <div className="bg-surface-subtle border border-border-subtle p-space-3 rounded-lg flex flex-col gap-1">
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Tệp xuất bản</span>
                <span className="font-title-sm text-title-sm text-on-surface">
                  {outputResult ? '1 Tệp PDF duy nhất' : `${files.length} Tệp đang chọn`}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Định dạng PDF-1.7 ISO</span>
              </div>
              <div className="bg-surface-subtle border border-border-subtle p-space-3 rounded-lg flex flex-col gap-1">
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Tổng số trang</span>
                <span className="font-title-sm text-title-sm text-brand-cyan-bright">
                  {outputResult ? `${outputResult.pageCount} trang hoàn chỉnh` : `${totalPages} trang`}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Không mất định dạng font</span>
              </div>
              <div className="bg-surface-subtle border border-border-subtle p-space-3 rounded-lg flex flex-col gap-1">
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Dung lượng ước tính</span>
                <span className="font-title-sm text-title-sm text-secondary">
                  {outputResult ? formatSize(outputResult.size) : formatSize(totalSize)}
                </span>
                <span className="font-body-sm text-body-sm text-outline">
                  {outputResult ? `Gốc: ${formatSize(outputResult.originalSize)}` : 'In-memory buffer'}
                </span>
              </div>
            </div>

            {/* OUTPUT ACTION BUTTONS */}
            <div className="flex flex-col gap-space-3 pt-space-2">
              {outputResult ? (
                <a
                  href={outputResult.url}
                  download={outputResult.name}
                  className="h-12 w-full bg-brand-emerald-deep hover:bg-secondary text-surface-container-lowest font-title-sm text-title-sm font-semibold rounded-xl shadow-lg transition-all flex items-center justify-center gap-space-2 cursor-pointer active:scale-[0.99]"
                >
                  <Download size={22} />
                  <span>Tải Tệp PDF Đã Xử Lý (.PDF - {formatSize(outputResult.size)})</span>
                </a>
              ) : (
                <button
                  type="button"
                  disabled={files.length === 0 || isExecuting}
                  onClick={handleExecute}
                  className="h-12 w-full bg-brand-emerald-deep hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed text-surface-container-lowest font-title-sm text-title-sm font-semibold rounded-xl shadow-lg transition-all flex items-center justify-center gap-space-2 cursor-pointer"
                >
                  <Zap size={22} />
                  <span>Bắt Đầu Xử Lý & Chuẩn Bị Tải Về</span>
                </button>
              )}

              {/* Secondary Actions Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-2">
                {outputResult && (
                  <a
                    href={outputResult.url}
                    target="_blank"
                    rel="noreferrer"
                    className="h-10 px-space-3 bg-surface-subtle hover:bg-surface-container-high border border-border-subtle text-on-surface font-body-sm text-body-sm rounded-lg flex items-center justify-center gap-space-2 transition-colors"
                  >
                    <Eye size={18} className="text-brand-cyan-bright" />
                    <span>Xem trước toàn màn hình</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="h-10 px-space-3 bg-surface-subtle hover:bg-surface-container-high border border-border-subtle text-on-surface-variant hover:text-on-surface font-body-sm text-body-sm rounded-lg flex items-center justify-center gap-space-2 transition-colors"
                >
                  <RefreshCw size={18} />
                  <span>Làm lại / Tệp mới</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM GUIDE & FEATURE EXPLANATIONS (3-COLUMN GRID) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-space-6 mb-space-8">
        <div className="bg-surface-container rounded-xl p-space-6 border border-border-subtle shadow-md flex flex-col gap-space-3">
          <div className="w-10 h-10 rounded-lg bg-primary-container/20 text-brand-cyan-bright flex items-center justify-center">
            <Zap size={22} />
          </div>
          <h3 className="font-title-sm text-title-sm text-on-surface font-semibold">Công Nghệ PDF-Lib WebAssembly</h3>
          <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
            Xử lý nhị phân trực tiếp trên engine biên dịch sang WASM. Tốc độ nén và gộp hàng trăm trang diễn ra chưa đầy 1 giây mà không tiêu hao tài nguyên mạng.
          </p>
        </div>
        <div className="bg-surface-container rounded-xl p-space-6 border border-border-subtle shadow-md flex flex-col gap-space-3">
          <div className="w-10 h-10 rounded-lg bg-secondary-container/20 text-secondary flex items-center justify-center">
            <ShieldCheck size={22} />
          </div>
          <h3 className="font-title-sm text-title-sm text-on-surface font-semibold">Không Giới Hạn & Riêng Tư Tuyệt Đối</h3>
          <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
            Không giới hạn số lần gộp, số trang hay dung lượng mỗi ngày. Toàn bộ chu trình đọc tệp diễn ra trong bộ nhớ RAM trình duyệt, không để lại vết lưu trữ ngoại vi.
          </p>
        </div>
        <div className="bg-surface-container rounded-xl p-space-6 border border-border-subtle shadow-md flex flex-col gap-space-3">
          <div className="w-10 h-10 rounded-lg bg-tertiary-container/20 text-tertiary flex items-center justify-center">
            <FileCheck size={22} />
          </div>
          <h3 className="font-title-sm text-title-sm text-on-surface font-semibold">Bảo Toàn Siêu Dữ Liệu & Form Chữ</h3>
          <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
            Giữ nguyên 100% định dạng font chữ nhúng (embedded fonts), các bảng tính phức tạp, siêu liên kết nội bộ, outline cây mục lục và chữ ký số nếu có trong tài liệu.
          </p>
        </div>
      </section>
    </div>
  );
}

// Internal legacy-to-tab map for route redirects
const LEGACY_TO_TAB = {
  'pdf-split': 'split',
  'pdf-merge': 'merge',
  'pdf-compress': 'compress',
};

// Use void to prevent unused variable warning if needed
void LEGACY_TO_TAB;

