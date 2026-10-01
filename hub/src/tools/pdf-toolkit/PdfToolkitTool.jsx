import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  FileText,
  UploadCloud,
  ChevronRight,
  ShieldCheck,
  Zap,
  Combine,
  Scissors,
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
  GripVertical,
  ArrowLeft,
  ArrowRight,
  Undo2,
  Minimize2
} from 'lucide-react';
import {
  PDF_MERGE_LIMITS,
  PDF_COMPRESS_LIMITS,
  validateDocumentFiles,
  verifyDocumentSignature,
  formatMiB
} from '@ai-tools/core/utils/documentFiles.js';

import {
  createPdfWorker,
  destroyPdfDocument,
  encryptedPdfMessage,
  isEncryptedPdfError,
  isPdfPasswordError,
  openPdfDocument,
} from '@ai-tools/core/utils/pdfjs.js';
import {
  buildPdf,
  ensurePdfName,
  normalizeRotation,
  parsePageRanges,
  rangeLabel,
  savedPercent,
} from './pdfToolkitCore.js';
import { getRouteQueryParam, setRouteQueryParam } from '../../utils/navigation';

const loadPdfLib = () => import('pdf-lib');
const loadCompressor = () => import('./pdfCompress.js');

const MODES = [
  { id: 'merge', label: 'Gộp PDF', sub: 'Merge', icon: Combine },
  { id: 'split', label: 'Tách trang', sub: 'Split', icon: Scissors },
  { id: 'compress', label: 'Nén PDF', sub: 'Compress', icon: Minimize2 },
  { id: 'organize', label: 'Sắp xếp', sub: 'Organize', icon: Layers },
];

const VALID_MODES = new Set(MODES.map((m) => m.id));

const SPLIT_OUTPUTS = ['ranges', 'single', 'every'];

const COMPRESS_LEVELS = ['light', 'balanced', 'strong'];

function detectInitialMode() {
  const tab = getRouteQueryParam('tab');
  if (tab && VALID_MODES.has(tab)) return tab;
  return 'merge';
}

const THUMB_SCALE = 0.3;

/** Mọi URL tạm đều được thu hồi bởi effect theo dõi `outputResult`. */
const blobUrl = (blob) => URL.createObjectURL(blob);


/** Thumbnail chỉ render khi thẻ trang cuộn vào khung nhìn. */
function LazyThumbnail({ fileId, pageIndex, pageNumber, rotation, thumbnail, requestThumbnail }) {
  const ref = useRef(null);
  useEffect(() => {
    if (thumbnail) return undefined;
    const el = ref.current;
    if (!el) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      requestThumbnail(fileId, pageIndex);
      return undefined;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        requestThumbnail(fileId, pageIndex);
      }
    }, { rootMargin: '300px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [fileId, pageIndex, thumbnail, requestThumbnail]);

  return (
    <div ref={ref} className="w-full h-full">
      {thumbnail ? (
        <img
          src={thumbnail}
          alt={`Page ${pageNumber}`}
          draggable={false}
          className="w-full h-full object-contain transition-transform select-none pointer-events-none"
          style={{ transform: `rotate(${rotation}deg)` }}
        />
      ) : (
        <div className="h-full flex flex-col justify-center items-center text-outline select-none">
          <FileText size={28} />
          <span className="text-[10px] mt-1">Trang {pageNumber}</span>
        </div>
      )}
    </div>
  );
}

export default function PdfToolkitTool({ displayLang = 'vi' } = {}) {
  const tr = (vi, en, ja) => (displayLang === 'en' ? en : displayLang === 'ja' ? ja : vi);
  const [activeMode, setActiveModeState] = useState(detectInitialMode);
  const [files, setFilesState] = useState([]); // [{ id, file, name, size, pageCount, arrayBuffer, pages: [{ id, pageIndex, pageNumber, rotation, isDeleted }] }]
  const [thumbs, setThumbs] = useState({}); // `${fileId}:${pageIndex}` → dataURL
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [notice, setNotice] = useState('');
  const [outputResult, setOutputResult] = useState(null); // { url, name, size, pageCount, fileCount, isZip, originalSize }
  const [outputFileName, setOutputFileName] = useState('Tai_Lieu_Tong_Hop.pdf');
  const [isDragging, setIsDragging] = useState(false);
  const [draggedPage, setDraggedPage] = useState(null); // { fileId, index }
  const [dragOverTarget, setDragOverTarget] = useState(null); // { fileId, index }

  // Settings
  const [normalizeA4, setNormalizeA4State] = useState(false);
  const [pageNumbering, setPageNumberingState] = useState(false);
  const [splitRange, setSplitRangeState] = useState('1-5');
  const [splitOutput, setSplitOutputState] = useState('ranges');
  const [splitFileId, setSplitFileIdState] = useState(null);
  const [compressLevel, setCompressLevelState] = useState('balanced');
  const [compressProgress, setCompressProgress] = useState(null); // { fileName, index, total, done, images }

  const fileInputRef = useRef(null);
  const docsRef = useRef(new Map()); // fileId → Promise<PDFDocumentProxy>
  const workerRef = useRef(null); // Promise<PDFWorker>
  const thumbQueueRef = useRef(Promise.resolve());
  const thumbPendingRef = useRef(new Set());

  // Mọi thay đổi đầu vào/thiết lập làm kết quả cũ không còn đúng → xóa kết quả.
  const setFiles = useCallback((updater) => {
    setFilesState(updater);
    setOutputResult(null);
  }, []);
  const withReset = (setter) => (value) => { setter(value); setOutputResult(null); };
  const setActiveMode = withReset(setActiveModeState);
  const setNormalizeA4 = withReset(setNormalizeA4State);
  const setPageNumbering = withReset(setPageNumberingState);
  const setSplitRange = withReset(setSplitRangeState);
  const setSplitOutput = withReset(setSplitOutputState);
  const setSplitFileId = withReset(setSplitFileIdState);
  const setCompressLevel = withReset(setCompressLevelState);

  const getWorker = useCallback(() => {
    if (!workerRef.current) workerRef.current = createPdfWorker();
    return workerRef.current;
  }, []);

  const releaseDoc = useCallback((fileId) => {
    const docPromise = docsRef.current.get(fileId);
    docsRef.current.delete(fileId);
    if (docPromise) docPromise.then((doc) => destroyPdfDocument(doc)).catch(() => {});
  }, []);

  // Giải phóng mọi tài liệu pdf.js và worker khi rời công cụ.
  useEffect(() => {
    const docs = docsRef.current;
    return () => {
      const pending = Array.from(docs.values());
      docs.clear();
      Promise.allSettled(pending.map((p) => p.then((doc) => destroyPdfDocument(doc))))
        .then(() => workerRef.current?.then((w) => w.destroy()))
        .catch(() => {});
    };
  }, []);

  // Sync mode to URL query
  useEffect(() => {
    setRouteQueryParam('tab', activeMode);
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

  const totalSourcePages = useMemo(() => files.reduce((sum, f) => sum + (f.pageCount || 0), 0), [files]);

  const totalSize = useMemo(() => {
    return files.reduce((sum, f) => sum + f.size, 0);
  }, [files]);

  const splitFile = files.find((f) => f.id === splitFileId) || files[0] || null;

  const formatSize = (bytes) => {
    if (!bytes && bytes !== 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const requestThumbnail = useCallback((fileId, pageIndex) => {
    const key = `${fileId}:${pageIndex}`;
    if (thumbPendingRef.current.has(key)) return;
    thumbPendingRef.current.add(key);
    // Render tuần tự: nhiều trang cùng lúc làm treo luồng chính.
    thumbQueueRef.current = thumbQueueRef.current.then(async () => {
      const docPromise = docsRef.current.get(fileId);
      if (!docPromise) return;
      try {
        const pdf = await docPromise;
        const page = await pdf.getPage(pageIndex + 1);
        const viewport = page.getViewport({ scale: THUMB_SCALE });
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.floor(viewport.width));
        canvas.height = Math.max(1, Math.floor(viewport.height));
        const ctx = canvas.getContext('2d', { alpha: false });
        // PDF không tô nền: canvas trong suốt → JPEG ra nền đen.
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport }).promise;
        page.cleanup();
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        canvas.width = 0;
        canvas.height = 0;
        if (docsRef.current.get(fileId) === docPromise) {
          setThumbs((prev) => ({ ...prev, [key]: dataUrl }));
        }
      } catch {
        thumbPendingRef.current.delete(key);
      }
    });
  }, []);

  const handleAddFiles = async (selectedFiles) => {
    if (isProcessing || isExecuting) return;
    const isCompress = activeMode === 'compress';
    const validation = validateDocumentFiles(selectedFiles, files, isCompress ? PDF_COMPRESS_LIMITS : PDF_MERGE_LIMITS);
    const problems = validation.rejected.map(({ file, reason }) => `${file.name}: ${reason}`);

    const accepted = [];
    for (const f of validation.accepted) {
      if (await verifyDocumentSignature(f)) accepted.push(f);
      else problems.push(`${f.name}: ${tr('không phải file PDF hợp lệ', 'not a valid PDF file', '有効なPDFファイルではありません')}`);
    }

    if (accepted.length === 0) {
      setNotice(problems.join(' • '));
      return;
    }

    setIsProcessing(true);
    const newItems = [];
    let runningPages = totalSourcePages;

    for (const file of accepted) {
      const id = crypto.randomUUID();
      try {
        const arrayBuffer = await file.arrayBuffer();
        const worker = await getWorker();
        const docPromise = openPdfDocument(arrayBuffer, { worker });
        const pdf = await docPromise;
        const pageCount = pdf.numPages;
        if (!isCompress && runningPages + pageCount > PDF_MERGE_LIMITS.maxPages) {
          await destroyPdfDocument(pdf);
          problems.push(`${file.name}: ${tr(
            `vượt giới hạn ${PDF_MERGE_LIMITS.maxPages} trang/lần xử lý`,
            `exceeds the ${PDF_MERGE_LIMITS.maxPages}-page limit per job`,
            `1回あたり${PDF_MERGE_LIMITS.maxPages}ページの上限を超えています`,
          )}`);
          continue;
        }
        runningPages += pageCount;
        docsRef.current.set(id, docPromise);

        const pages = Array.from({ length: pageCount }, (_, i) => ({
          id: `page-${i + 1}-${Math.random().toString(36).slice(2, 8)}`,
          pageIndex: i,
          pageNumber: i + 1,
          rotation: 0,
          isDeleted: false,
        }));

        newItems.push({ id, file, name: file.name, size: file.size, pageCount, arrayBuffer, pages });

        if (files.length === 0 && newItems.length === 1) {
          const rawName = file.name.replace(/\.[^/.]+$/, '');
          setOutputFileName(activeMode === 'organize' ? `${rawName}_Organized.pdf` : `${rawName}_Processed.pdf`);
        }
      } catch (err) {
        problems.push(isPdfPasswordError(err)
          ? `${file.name}: ${encryptedPdfMessage(displayLang)}`
          : `${file.name}: ${tr('không đọc được', 'could not be read', '読み込めません')} (${err.message})`);
      }
    }

    setNotice(problems.join(' • '));
    if (newItems.length) setFiles((prev) => [...prev, ...newItems]);
    setIsProcessing(false);
  };

  const handleRemoveFile = (id) => {
    releaseDoc(id);
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
    for (const id of Array.from(docsRef.current.keys())) releaseDoc(id);
    thumbPendingRef.current.clear();
    setThumbs({});
    setFiles([]);
    setNotice('');
  };

  // Page rotation
  const handleRotatePage = (fileId, pageIndex) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id !== fileId) return f;
        const updatedPages = f.pages.map((p) => {
          if (p.pageIndex !== pageIndex) return p;
          return { ...p, rotation: normalizeRotation(p.rotation + 90) };
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

  const handleRestorePage = (fileId, pageIndex) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id !== fileId || !f.pages) return f;
        const updatedPages = f.pages.map((p) => {
          if (p.pageIndex !== pageIndex) return p;
          return { ...p, isDeleted: false };
        });
        return { ...f, pages: updatedPages };
      })
    );
  };

  // Page reordering handlers
  const handleMovePage = (fileId, fromIndex, toIndex) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id !== fileId || !f.pages) return f;
        if (toIndex < 0 || toIndex >= f.pages.length || fromIndex === toIndex) return f;
        const newPages = [...f.pages];
        const [movedItem] = newPages.splice(fromIndex, 1);
        newPages.splice(toIndex, 0, movedItem);
        return { ...f, pages: newPages };
      })
    );
  };

  const handleResetPageOrder = (fileId) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id !== fileId || !f.pages) return f;
        const sortedPages = [...f.pages].sort((a, b) => a.pageIndex - b.pageIndex);
        return { ...f, pages: sortedPages };
      })
    );
  };

  const handlePageDrop = (targetFileId, targetIndex) => {
    if (!draggedPage) return;
    if (draggedPage.fileId === targetFileId) {
      handleMovePage(targetFileId, draggedPage.index, targetIndex);
    }
    setDraggedPage(null);
    setDragOverTarget(null);
  };

  const handlePageDragEnd = () => {
    setDraggedPage(null);
    setDragOverTarget(null);
  };

  // Batch actions
  const handleRotateAll = () => {
    setFiles((prev) =>
      prev.map((f) => ({
        ...f,
        pages: f.pages.map((p) => ({ ...p, rotation: normalizeRotation(p.rotation + 90) })),
      }))
    );
  };

  const handleReversePages = () => {
    setFiles((prev) => [...prev].reverse().map((f) => ({
      ...f,
      pages: [...f.pages].reverse(),
    })));
  };

  /** Danh sách tệp cần xuất: [{ name, pages: [{ sourceKey, pageIndex, rotation }] }]. */
  const planOutputs = () => {
    if (activeMode !== 'split') {
      const pages = files.flatMap((f) => (f.pages || [])
        .filter((p) => !p.isDeleted)
        .map((p) => ({ sourceKey: f.id, pageIndex: p.pageIndex, rotation: p.rotation })));
      return { outputs: [{ name: ensurePdfName(outputFileName), pages }], warnings: [] };
    }

    const source = splitFile;
    if (!source) return { outputs: [], warnings: [] };
    const byNumber = new Map(source.pages.map((p) => [p.pageNumber, p]));
    const baseName = source.name.replace(/\.[^/.]+$/, '');
    const warnings = [];
    let ranges;
    if (splitOutput === 'every') {
      ranges = source.pages.slice().sort((a, b) => a.pageNumber - b.pageNumber).map((p) => [p.pageNumber]);
    } else {
      const parsed = parsePageRanges(splitRange, source.pageCount);
      if (parsed.errors.length) {
        throw new Error(tr(
          `Dải trang không hợp lệ: ${parsed.errors.filter((e) => e !== 'empty').join(', ') || '(trống)'}. Ví dụ hợp lệ: 1-3, 5, 8- (tệp có ${source.pageCount} trang).`,
          `Invalid page range: ${parsed.errors.filter((e) => e !== 'empty').join(', ') || '(empty)'}. Valid example: 1-3, 5, 8- (file has ${source.pageCount} pages).`,
          `ページ範囲が無効です: ${parsed.errors.filter((e) => e !== 'empty').join(', ') || '（空）'}。例: 1-3, 5, 8-（全${source.pageCount}ページ）`,
        ));
      }
      ranges = parsed.ranges;
    }

    let skipped = 0;
    const toItems = (numbers) => numbers
      .map((n) => byNumber.get(n))
      .filter((p) => {
        if (p && !p.isDeleted) return true;
        skipped += 1;
        return false;
      })
      .map((p) => ({ sourceKey: source.id, pageIndex: p.pageIndex, rotation: p.rotation }));

    let outputs;
    if (splitOutput === 'single') {
      outputs = [{ name: ensurePdfName(outputFileName), pages: toItems(ranges.flat()) }];
    } else {
      outputs = ranges.map((numbers) => ({
        name: ensurePdfName(`${baseName}_p${rangeLabel(numbers)}`),
        pages: toItems(numbers),
      })).filter((o) => o.pages.length > 0);
    }
    if (skipped > 0) {
      warnings.push(tr(
        `Đã bỏ qua ${skipped} trang bạn đã loại bỏ.`,
        `Skipped ${skipped} page(s) you removed.`,
        `削除済みの${skipped}ページをスキップしました。`,
      ));
    }
    return { outputs, warnings };
  };

  /** Nén từng tệp tuần tự (tiết kiệm RAM); tệp lỗi không làm hỏng cả lô. */
  const runCompress = async () => {
    const { compressPdf, compressedName, createBrowserCodec } = await loadCompressor();
    const PDFLib = await loadPdfLib();
    const codec = createBrowserCodec();
    const items = [];
    for (let i = 0; i < files.length; i += 1) {
      const f = files[i];
      setCompressProgress({ fileName: f.name, index: i + 1, total: files.length, done: 0, images: 0 });
      try {
        const res = await compressPdf(PDFLib, f.arrayBuffer, {
          preset: compressLevel,
          codec,
          onProgress: ({ done, total }) => setCompressProgress({ fileName: f.name, index: i + 1, total: files.length, done, images: total }),
        });
        items.push({ id: f.id, name: f.name, outName: compressedName(f.name), ...res });
      } catch (err) {
        items.push({
          id: f.id,
          name: f.name,
          error: isEncryptedPdfError(err) ? encryptedPdfMessage(displayLang) : (err?.message || String(err)),
        });
      }
    }
    const ok = items.filter((it) => !it.error);
    if (ok.length === 0) throw new Error(items[0]?.error || 'COMPRESS_FAILED');

    let blob;
    let name;
    if (ok.length === 1) {
      blob = new Blob([ok[0].bytes], { type: 'application/pdf' });
      name = ok[0].outName;
    } else {
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();
      const used = new Set();
      for (const it of ok) {
        let entry = it.outName;
        let n = 2;
        while (used.has(entry.toLowerCase())) entry = it.outName.replace(/\.pdf$/i, ` (${n++}).pdf`);
        used.add(entry.toLowerCase());
        zip.file(entry, it.bytes);
      }
      blob = await zip.generateAsync({ type: 'blob' });
      name = 'PDF_compressed.zip';
    }

    // Không giữ bản sao byte của kết quả trong state: chỉ giữ số liệu hiển thị.
    const summary = items.map(({ bytes, ...rest }) => rest);
    setOutputResult({
      url: blobUrl(blob),
      name,
      size: blob.size,
      pageCount: ok.reduce((sum, it) => sum + it.pageCount, 0),
      fileCount: ok.length,
      isZip: ok.length > 1,
      originalSize: ok.reduce((sum, it) => sum + it.originalSize, 0),
      compressItems: summary,
    });

    const notes = [];
    const failed = items.length - ok.length;
    if (failed > 0) {
      notes.push(tr(`${failed} tệp không nén được (xem chi tiết bên dưới).`, `${failed} file(s) could not be compressed (see details below).`, `${failed}件のファイルは圧縮できませんでした（詳細は下記）。`));
    }
    if (ok.some((it) => it.signed)) {
      notes.push(tr('Có tệp chứa chữ ký số: chữ ký sẽ không còn hiệu lực sau khi nén.', 'Some files contain digital signatures: they are no longer valid after compression.', '電子署名を含むファイルがあります。圧縮後は署名が無効になります。'));
    }
    setNotice(notes.join(' • '));
    if (ok.some((it) => !it.unchanged)) confetti({ particleCount: 60, spread: 70, origin: { y: 0.8 } });
  };

  // Execute processing according to activeMode
  const handleExecute = async () => {
    if (files.length === 0 || isExecuting || isProcessing) return;
    setIsExecuting(true);
    setNotice('');
    setOutputResult(null);

    try {
      if (activeMode === 'compress') {
        await runCompress();
        return;
      }
      if (
        totalSize > PDF_MERGE_LIMITS.maxTotalBytes
        || files.some((f) => f.size > PDF_MERGE_LIMITS.maxFileBytes)
        || totalSourcePages > PDF_MERGE_LIMITS.maxPages
      ) {
        throw new Error(tr(
          `Vượt giới hạn gộp/tách: tối đa ${formatMiB(PDF_MERGE_LIMITS.maxFileBytes)} MiB mỗi tệp, ${formatMiB(PDF_MERGE_LIMITS.maxTotalBytes)} MiB và ${PDF_MERGE_LIMITS.maxPages} trang tổng cộng. Hãy bỏ bớt tệp (chế độ Nén PDF cho phép tệp lớn hơn).`,
          `Over the merge/split limits: max ${formatMiB(PDF_MERGE_LIMITS.maxFileBytes)} MiB per file, ${formatMiB(PDF_MERGE_LIMITS.maxTotalBytes)} MiB and ${PDF_MERGE_LIMITS.maxPages} pages in total. Remove some files (Compress mode allows larger files).`,
          `結合・分割の上限を超えています: 1ファイル${formatMiB(PDF_MERGE_LIMITS.maxFileBytes)} MiB、合計${formatMiB(PDF_MERGE_LIMITS.maxTotalBytes)} MiB・${PDF_MERGE_LIMITS.maxPages}ページまで。ファイルを減らしてください（圧縮モードはより大きなファイルに対応）。`,
        ));
      }
      const { outputs, warnings } = planOutputs();
      const nonEmpty = outputs.filter((o) => o.pages.length > 0);
      if (nonEmpty.length === 0) {
        throw new Error(tr('Không còn trang nào để xuất.', 'There are no pages left to export.', '出力するページがありません。'));
      }

      const PDFLib = await loadPdfLib();
      const sources = files.map((f) => ({ key: f.id, bytes: f.arrayBuffer }));
      const built = [];
      for (const output of nonEmpty) {
        const { bytes, pageCount } = await buildPdf(PDFLib, sources, output.pages, {
          normalizeA4,
          pageNumbering,
          title: output.name.replace(/\.pdf$/i, ''),
        });
        built.push({ name: output.name, bytes, pageCount });
      }

      let blob;
      let name;
      if (built.length === 1) {
        blob = new Blob([built[0].bytes], { type: 'application/pdf' });
        name = built[0].name;
      } else {
        const { default: JSZip } = await import('jszip');
        const zip = new JSZip();
        const used = new Set();
        for (const item of built) {
          let entry = item.name;
          let n = 2;
          while (used.has(entry.toLowerCase())) entry = item.name.replace(/\.pdf$/i, ` (${n++}).pdf`);
          used.add(entry.toLowerCase());
          zip.file(entry, item.bytes);
        }
        blob = await zip.generateAsync({ type: 'blob' });
        name = `${(splitFile?.name || 'document').replace(/\.[^/.]+$/, '')}_split.zip`;
      }

      setOutputResult({
        url: blobUrl(blob),
        name,
        size: blob.size,
        pageCount: built.reduce((sum, b) => sum + b.pageCount, 0),
        fileCount: built.length,
        isZip: built.length > 1,
        originalSize: activeMode === 'split' ? (splitFile?.size || 0) : totalSize,
      });
      if (warnings.length) setNotice(warnings.join(' • '));

      confetti({ particleCount: 60, spread: 70, origin: { y: 0.8 } });
    } catch (err) {
      setNotice(isEncryptedPdfError(err)
        ? encryptedPdfMessage(displayLang)
        : `${tr('Lỗi xử lý PDF', 'PDF processing error', 'PDF処理エラー')}: ${err.message}`);
    } finally {
      setIsExecuting(false);
      setCompressProgress(null);
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
          {displayLang === 'en' ? 'PDF Multi-Tool' : displayLang === 'ja' ? '万能PDFツール' : 'Công Cụ PDF Đa Năng'}
        </span>
      </nav>

      {/* 2. Tool Header Section */}
      <section className="bg-surface-container rounded-xl p-space-6 mb-space-6 border border-border-subtle shadow-md relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-5 relative z-10">
          <div className="flex items-start gap-space-4 max-w-3xl">
            <div className="w-14 h-14 rounded-xl bg-surface-subtle border border-border-subtle flex items-center justify-center text-primary-container shrink-0 shadow-sm">
              <FileText size={30} className="text-primary-container" />
            </div>
            <div className="space-y-1">
              <h1 className="font-headline-lg text-xl sm:text-2xl text-on-surface font-semibold tracking-tight">
                {displayLang === 'en' ? 'PDF Multi-Tool' : displayLang === 'ja' ? '万能PDFツール' : 'Công Cụ PDF Đa Năng'}
              </h1>
              <p className="font-body-sm text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                {tr(
                  'Gộp nhiều tệp PDF, tách trang theo dải tùy chọn, giảm dung lượng, xoay/xóa và sắp xếp thứ tự trang, chuẩn hóa khổ A4 và đánh số trang — trực tiếp trong trình duyệt.',
                  'Merge PDFs, split pages by custom ranges, shrink file size, rotate/remove and reorder pages, normalize to A4 and add page numbers — right in your browser.',
                  '複数のPDFの結合、ページ範囲での分割、ファイルサイズの削減、ページの回転・削除・並べ替え、A4への統一、ページ番号の付与をブラウザ内で行います。',
                )}
              </p>
            </div>
          </div>

          {/* Subtle Privacy Note */}
          <div className="self-start lg:self-center flex items-center gap-1.5 text-xs text-outline shrink-0">
            <ShieldCheck size={15} className="text-secondary shrink-0" />
            <span>{tr('Xử lý trực tiếp trên trình duyệt — tệp không được tải lên máy chủ.', 'Processed in your browser — files are never uploaded.', 'ブラウザ内で処理され、ファイルはアップロードされません。')}</span>
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
                {activeMode === 'compress'
                  ? tr(
                    `Tối đa ${PDF_COMPRESS_LIMITS.maxFiles} tệp / ${formatMiB(PDF_COMPRESS_LIMITS.maxFileBytes)} MiB mỗi tệp`,
                    `Up to ${PDF_COMPRESS_LIMITS.maxFiles} files / ${formatMiB(PDF_COMPRESS_LIMITS.maxFileBytes)} MiB each`,
                    `最大${PDF_COMPRESS_LIMITS.maxFiles}ファイル／1ファイル${formatMiB(PDF_COMPRESS_LIMITS.maxFileBytes)} MiB`,
                  )
                  : `Tối đa ${PDF_MERGE_LIMITS.maxFiles} tệp / ${formatMiB(PDF_MERGE_LIMITS.maxTotalBytes)} MiB / ${PDF_MERGE_LIMITS.maxPages} trang`}
              </span>
            </div>

            {/* Dropzone */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              multiple
              disabled={isProcessing || isExecuting}
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) handleAddFiles(Array.from(e.target.files));
                e.target.value = '';
              }}
            />
            <div
              role="button"
              tabIndex={isProcessing || isExecuting ? -1 : 0}
              aria-disabled={isProcessing || isExecuting}
              onClick={() => { if (!isProcessing && !isExecuting) fileInputRef.current?.click(); }}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !isProcessing && !isExecuting) {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragOver={(e) => { e.preventDefault(); if (!isProcessing && !isExecuting) setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (isProcessing || isExecuting) return;
                if (e.dataTransfer.files?.length) handleAddFiles(Array.from(e.dataTransfer.files));
              }}
              className={`bg-surface-subtle border-2 border-dashed rounded-xl p-space-6 text-center transition-all group shadow-sm ${
                isProcessing || isExecuting ? 'cursor-wait opacity-70' : 'cursor-pointer'
              } ${
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
                    {tr('Tệp .PDF không đặt mật khẩu', 'Unprotected .PDF files', 'パスワードなしの .PDF ファイル')}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-2 bg-surface-subtle p-1 rounded-lg border border-border-subtle">
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
                    <span className="px-1.5 py-[1px] bg-primary-container text-on-primary-container font-label-sm text-[9px] font-semibold rounded">
                      {m.sub}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* SETTINGS DETAILS */}
            <div className="space-y-space-4">
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
                    {tr(
                      'Số trang theo thứ tự gốc (nhãn "Gốc: P.xx"). "8-" là từ trang 8 đến hết. Trang đã xoay/loại bỏ được áp dụng.',
                      'Original page numbers (the "Gốc: P.xx" label). "8-" means page 8 to the end. Rotations/removals are applied.',
                      '元のページ番号（「Gốc: P.xx」表示）。「8-」は8ページ目から最後まで。回転・削除が反映されます。',
                    )}
                  </p>
                  {files.length > 1 && (
                    <select
                      value={splitFile?.id || ''}
                      onChange={(e) => setSplitFileId(e.target.value)}
                      aria-label={tr('Tệp cần tách', 'File to split', '分割するファイル')}
                      className="w-full bg-surface-subtle border border-border-subtle rounded-lg px-space-3 py-space-2 text-on-surface text-body-sm"
                    >
                      {files.map((f) => <option key={f.id} value={f.id}>{f.name} ({f.pageCount})</option>)}
                    </select>
                  )}
                  <div className="grid grid-cols-1 gap-1" role="radiogroup" aria-label={tr('Kiểu xuất khi tách', 'Split output', '分割の出力形式')}>
                    {SPLIT_OUTPUTS.map((opt) => (
                      <label key={opt} className="flex items-center gap-2 text-body-sm text-on-surface cursor-pointer">
                        <input
                          type="radio"
                          name="split-output"
                          value={opt}
                          checked={splitOutput === opt}
                          onChange={() => setSplitOutput(opt)}
                          className="accent-primary-container"
                        />
                        {opt === 'ranges' && tr('Mỗi dải một tệp PDF (nhiều dải → ZIP)', 'One PDF per range (several ranges → ZIP)', '範囲ごとに1つのPDF（複数ならZIP）')}
                        {opt === 'single' && tr('Gộp các dải vào một tệp PDF', 'All ranges into one PDF', '全範囲を1つのPDFに')}
                        {opt === 'every' && tr('Tách mỗi trang thành một tệp (ZIP)', 'Every page as its own PDF (ZIP)', '1ページずつ別PDF（ZIP）')}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {activeMode === 'compress' && (
                <div className="space-y-space-3">
                  <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider block">
                    {tr('Mức nén', 'Compression level', '圧縮レベル')}
                  </span>
                  <div className="grid grid-cols-1 gap-space-2" role="radiogroup" aria-label={tr('Mức nén PDF', 'PDF compression level', 'PDF圧縮レベル')}>
                    {COMPRESS_LEVELS.map((level) => {
                      const selected = compressLevel === level;
                      return (
                        <label
                          key={level}
                          className={`flex items-start gap-space-3 p-space-3 rounded-lg cursor-pointer border transition-colors min-h-11 ${
                            selected ? 'bg-surface-container-high border-primary-container' : 'bg-surface-subtle border-border-subtle hover:bg-surface-container-high'
                          }`}
                        >
                          <input
                            type="radio"
                            name="compress-level"
                            value={level}
                            checked={selected}
                            onChange={() => setCompressLevel(level)}
                            className="mt-1 accent-primary-container"
                          />
                          <span className="min-w-0">
                            <span className="block text-body-sm font-semibold text-on-surface">
                              {level === 'light' && tr('Nén nhẹ — giữ nét in ấn', 'Light — print quality', '軽め — 印刷品質を維持')}
                              {level === 'balanced' && tr('Cân bằng — khuyên dùng', 'Balanced — recommended', 'バランス — おすすめ')}
                              {level === 'strong' && tr('Nén mạnh — dung lượng nhỏ nhất', 'Strong — smallest size', '強め — 最小サイズ')}
                            </span>
                            <span className="block text-[12px] text-on-surface-variant text-pretty">
                              {level === 'light' && tr('Ảnh giảm còn tối đa 200 dpi, chất lượng cao. Phù hợp tài liệu cần in.', 'Images capped at 200 dpi, high quality. Good for documents you will print.', '画像は最大200dpi・高画質。印刷する書類向け。')}
                              {level === 'balanced' && tr('Ảnh giảm còn 150 dpi, đủ nét để đọc và gửi email.', 'Images reduced to 150 dpi, sharp enough to read and email.', '画像を150dpiに縮小。閲覧やメール添付に十分な鮮明さ。')}
                              {level === 'strong' && tr('Ảnh giảm còn 96 dpi, chất lượng thấp hơn. Phù hợp xem trên màn hình.', 'Images reduced to 96 dpi at lower quality. Good for on-screen viewing.', '画像を96dpiに縮小し画質は低め。画面での閲覧向け。')}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <p className="font-body-sm text-[11px] text-outline text-pretty">
                    {tr(
                      'Chữ, vector, liên kết và mục lục được giữ nguyên; chỉ ảnh nhúng bị giảm độ phân giải. Tệp toàn chữ có thể giảm ít. Tệp không nhỏ đi sẽ được giữ nguyên như bản gốc.',
                      'Text, vectors, links and bookmarks are preserved; only embedded images are downsampled. Text-only files may shrink less. If a file cannot get smaller, the original is kept.',
                      '文字・ベクター・リンク・しおりはそのまま。埋め込み画像のみ解像度を下げます。文字だけのPDFは縮小幅が小さい場合があります。小さくならない場合は元のファイルを保持します。',
                    )}
                  </p>
                </div>
              )}

              {activeMode === 'organize' && (
                <div className="space-y-space-3">
                  <div className="p-space-3 bg-surface-subtle border border-border-subtle rounded-lg space-y-space-2">
                    <div className="flex items-center gap-space-2 text-primary font-semibold text-body-sm">
                      <Layers size={16} />
                      <span>Hướng dẫn sắp xếp trang</span>
                    </div>
                    <ul className="text-body-sm text-on-surface-variant space-y-1 text-[13px] leading-relaxed">
                      <li>• <strong>Kéo thả</strong> thẻ trang chuột để đổi vị trí trực quan.</li>
                      <li>• Hoặc bấm nút mũi tên <strong>⬅️ ➡️</strong> trên từng thẻ trang (thuận tiện trên điện thoại/cảm ứng).</li>
                      <li>• <strong>Huy hiệu xanh (#01, #02...)</strong> là thứ tự trang mới sẽ xuất bản.</li>
                      <li>• Có thể xoay 90° hoặc xóa bớt các trang không cần thiết.</li>
                    </ul>
                  </div>

                </div>
              )}

              {/* COMMON OUTPUT OPTIONS (không áp dụng cho nén) */}
              {activeMode !== 'compress' && (
              <>
              <div className="space-y-space-2">
                <label className="flex items-start gap-space-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={normalizeA4}
                    onChange={(e) => setNormalizeA4(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded bg-surface-subtle text-primary-container focus:ring-0 accent-primary-container"
                  />
                  <span className="font-body-md text-body-md text-on-surface group-hover:text-primary transition-colors">
                    {tr('Chuẩn hóa mọi trang về khổ A4 (co giãn vừa khổ, giữ tỉ lệ)', 'Normalize every page to A4 (scaled to fit, aspect kept)', '全ページをA4に統一（縦横比を保って拡縮）')}
                    <span className="block text-[11px] text-outline">
                      {tr('Trang ngang dùng A4 ngang. Liên kết/ô biểu mẫu trên trang sẽ không còn tác dụng.', 'Landscape pages use landscape A4. Links/form fields on the page stop working.', '横長ページは横向きA4。ページ上のリンク・フォームは無効になります。')}
                    </span>
                  </span>
                </label>
                <label className="flex items-center gap-space-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={pageNumbering}
                    onChange={(e) => setPageNumbering(e.target.checked)}
                    className="w-4 h-4 rounded bg-surface-subtle text-primary-container focus:ring-0 accent-primary-container"
                  />
                  <span className="font-body-md text-body-md text-on-surface group-hover:text-primary transition-colors">
                    {tr('Đánh số trang liên tục ở chân trang (X / Y)', 'Add continuous page numbers in the footer (X / Y)', 'フッターに通しページ番号（X / Y）を付ける')}
                  </span>
                </label>
                <p className="font-body-sm text-[11px] text-outline">
                  {tr('Lưu ý: bookmark/mục lục của tệp gốc không được giữ lại trong tệp xuất.', 'Note: bookmarks/outlines of the source files are not kept in the output.', '注: 元ファイルのしおり（目次）は出力に引き継がれません。')}
                </p>
              </div>

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
                    aria-label="Tên file đầu ra"
                    className="bg-transparent text-on-surface font-label-md text-label-md w-full outline-none"
                  />
                </div>
              </div>
              </>
              )}
            </div>

            {/* PRIMARY RUN ACTION BUTTON */}
            <button
              type="button"
              disabled={files.length === 0 || isExecuting || isProcessing}
              onClick={handleExecute}
              className="h-12 w-full bg-primary-container hover:bg-brand-cyan-bright disabled:opacity-50 disabled:cursor-not-allowed text-on-primary-container font-title-sm text-title-sm font-semibold rounded-xl shadow-lg transition-all flex items-center justify-center gap-space-2 mt-space-2 cursor-pointer active:scale-[0.99]"
            >
              <Zap size={20} />
              <span>
                {isExecuting
                  ? (activeMode === 'compress' && compressProgress
                    ? tr(
                      `Đang nén ${compressProgress.index}/${compressProgress.total}${compressProgress.images ? ` — ảnh ${compressProgress.done}/${compressProgress.images}` : ''}...`,
                      `Compressing ${compressProgress.index}/${compressProgress.total}${compressProgress.images ? ` — image ${compressProgress.done}/${compressProgress.images}` : ''}...`,
                      `圧縮中 ${compressProgress.index}/${compressProgress.total}${compressProgress.images ? ` — 画像 ${compressProgress.done}/${compressProgress.images}` : ''}...`,
                    )
                    : 'Đang xử lý tài liệu PDF...')
                  : files.length > 0
                  ? activeMode === 'compress'
                    ? tr(`Bắt Đầu Nén (${files.length} Tệp)`, `Compress (${files.length} file${files.length > 1 ? 's' : ''})`, `圧縮を開始（${files.length}ファイル）`)
                  : activeMode === 'organize'
                    ? `Bắt Đầu Sắp Xếp (${totalPages} Trang)`
                    : activeMode === 'merge'
                    ? (files.length === 1 ? `Lưu & Xuất File (${totalPages} Trang)` : `Bắt Đầu Gộp (${totalPages} Trang)`)
                    : `Bắt Đầu Tách (${splitFile?.name || ''})`
                  : 'Tải tệp PDF để bắt đầu'}
              </span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE PREVIEW & OUTPUT RESULTS (7 cols / ~58%) */}
        <div className="lg:col-span-7 space-y-space-6">
          {activeMode === 'compress' ? (
          /* CARD 1 (nén): danh sách tệp và kết quả trước/sau */
          <div className="bg-surface-container rounded-xl p-space-6 border border-border-subtle shadow-md">
            <div className="mb-space-4">
              <h2 className="font-title-sm text-title-sm text-on-surface">{tr('Dung Lượng Trước & Sau Khi Nén', 'File Size Before & After', '圧縮前後のファイルサイズ')}</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant text-pretty">
                {tr('Kết quả tính trên tệp thật sau khi nén, không phải ước lượng.', 'Figures are measured on the real compressed files, not estimates.', '推定ではなく、実際に圧縮したファイルのサイズです。')}
              </p>
            </div>
            {files.length > 0 ? (
              <ul className="space-y-space-3">
                {files.map((file) => {
                  const item = outputResult?.compressItems?.find((it) => it.id === file.id);
                  const pct = item && !item.error ? savedPercent(item.originalSize, item.newSize) : 0;
                  return (
                    <li key={file.id} className="bg-surface-subtle border border-border-subtle rounded-lg p-space-3 space-y-space-2">
                      <div className="flex items-center justify-between gap-space-3">
                        <div className="flex items-center gap-space-2 min-w-0">
                          <FileText size={16} className="text-primary shrink-0" />
                          <span className="truncate font-semibold text-on-surface text-body-sm">{file.name}</span>
                        </div>
                        <span className="text-xs text-outline shrink-0">{file.pageCount} {tr('trang', 'pages', 'ページ')}</span>
                      </div>
                      {item?.error ? (
                        <p className="text-xs text-error flex items-start gap-1">
                          <AlertCircle size={14} className="shrink-0 mt-0.5" />
                          <span className="min-w-0 break-words">{item.error}</span>
                        </p>
                      ) : item ? (
                        <>
                          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-body-sm">
                            <span className="text-on-surface-variant">
                              {formatSize(item.originalSize)} <span aria-hidden="true">→</span> <strong className="text-on-surface">{formatSize(item.newSize)}</strong>
                            </span>
                            <span className={`font-semibold ${item.unchanged ? 'text-on-surface-variant' : 'text-secondary'}`}>
                              {item.unchanged
                                ? tr('Đã tối ưu sẵn — giữ nguyên', 'Already optimized — kept as is', '最適化済み — そのまま')
                                : tr(`Giảm ${pct}%`, `Saved ${pct}%`, `${pct}%削減`)}
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-surface-container-high overflow-hidden" role="img" aria-label={tr(`Giảm ${pct}% dung lượng`, `${pct}% smaller`, `${pct}%削減`)}>
                            <div className="h-full bg-secondary" style={{ width: `${Math.max(2, 100 - pct)}%` }} />
                          </div>
                          <p className="text-[11px] text-outline">
                            {tr(
                              `Ảnh: nén lại ${item.images.optimized}/${item.images.total}`,
                              `Images: ${item.images.optimized}/${item.images.total} recompressed`,
                              `画像: ${item.images.optimized}/${item.images.total}件を再圧縮`,
                            )}
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-outline">{formatSize(file.size)} — {tr('chờ nén', 'waiting', '待機中')}</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-border-subtle rounded-xl text-on-surface-variant">
                <Minimize2 size={40} className="text-outline mb-2 opacity-50" />
                <p className="font-title-sm text-body-md text-on-surface">{tr('Chưa có tệp nào để nén', 'No files to compress yet', '圧縮するファイルがありません')}</p>
                <p className="font-body-sm text-body-sm text-outline mt-1 text-pretty">
                  {tr('Tải tệp PDF lên, chọn mức nén rồi bấm Bắt Đầu Nén.', 'Upload PDFs, pick a level, then press Compress.', 'PDFをアップロードし、レベルを選んで圧縮を開始してください。')}
                </p>
              </div>
            )}
          </div>
          ) : (
          /* CARD 1: VISUAL GRID THUMBNAILS & PAGE REORDERING */
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
                  {totalPages} Trang{normalizeA4 ? ' • Xuất khổ A4' : ''}
                </span>
              </div>
            </div>

            {/* QUICK BATCH TOOLBAR */}
            <div className="flex flex-wrap items-center justify-between gap-space-2 p-space-2 bg-surface-subtle border border-border-subtle rounded-lg mb-space-4">
              <div className="flex items-center gap-space-1 flex-wrap">
                <button
                  type="button"
                  onClick={handleRotateAll}
                  className="px-space-2 py-space-1 bg-surface-container hover:bg-surface-container-high border border-border-subtle text-on-surface font-label-sm text-label-sm rounded flex items-center gap-1 transition-colors cursor-pointer"
                  title="Xoay toàn bộ các trang 90 độ"
                >
                  <RotateCw size={14} />
                  Xoay tất cả 90°
                </button>
                <button
                  type="button"
                  onClick={handleReversePages}
                  className="px-space-2 py-space-1 bg-surface-container hover:bg-surface-container-high border border-border-subtle text-on-surface font-label-sm text-label-sm rounded flex items-center gap-1 transition-colors cursor-pointer"
                  title="Đảo ngược thứ tự trang"
                >
                  <ArrowDownUp size={14} />
                  Đảo thứ tự
                </button>
                {activeMode === 'organize' && files.some((f) => f.pages?.length > 1) && (
                  <button
                    type="button"
                    onClick={() => files.forEach((f) => handleResetPageOrder(f.id))}
                    className="px-space-2 py-space-1 bg-surface-container hover:bg-surface-container-high border border-border-subtle text-on-surface font-label-sm text-label-sm rounded flex items-center gap-1 transition-colors cursor-pointer"
                    title="Khôi phục thứ tự các trang về ban đầu"
                  >
                    <Undo2 size={14} />
                    Thứ tự gốc
                  </button>
                )}
              </div>
              {activeMode === 'organize' && (
                <span className="text-[11px] font-label-sm text-primary flex items-center gap-1">
                  <Layers size={13} />
                  Kéo thả hoặc dùng ⬅️ ➡️ để đổi vị trí
                </span>
              )}
            </div>

            {/* THUMBNAILS GRID */}
            {files.length > 0 ? (
              <div className="space-y-space-4">
                {files.map((file) => (
                  <div key={file.id} className="space-y-space-2">
                    <div className="flex items-center justify-between text-xs text-outline font-label-sm px-1">
                      <span className="truncate max-w-[280px] font-semibold text-on-surface">{file.name}</span>
                      <div className="flex items-center gap-2">
                        <span>{file.pages?.filter((p) => !p.isDeleted).length} trang hoạt động</span>
                        {activeMode === 'organize' && (
                          <button
                            type="button"
                            onClick={() => handleResetPageOrder(file.id)}
                            className="text-primary hover:underline cursor-pointer text-[11px]"
                            title="Khôi phục thứ tự gốc của tệp này"
                          >
                            Đặt lại
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-space-4">
                      {file.pages?.map((page, pageIdx) => {
                        const isDeleted = page.isDeleted;
                        const isBeingDragged = draggedPage?.fileId === file.id && draggedPage?.index === pageIdx;
                        const isDropTarget = dragOverTarget?.fileId === file.id && dragOverTarget?.index === pageIdx;

                        return (
                          <div
                            key={page.id || `${page.pageIndex}-${pageIdx}`}
                            draggable={!isDeleted}
                            onDragStart={(e) => {
                              if (isDeleted) return;
                              setDraggedPage({ fileId: file.id, index: pageIdx });
                              e.dataTransfer.effectAllowed = 'move';
                              e.dataTransfer.setData('text/plain', String(pageIdx));
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = 'move';
                              if (dragOverTarget?.index !== pageIdx || dragOverTarget?.fileId !== file.id) {
                                setDragOverTarget({ fileId: file.id, index: pageIdx });
                              }
                            }}
                            onDragLeave={() => {
                              if (dragOverTarget?.index === pageIdx && dragOverTarget?.fileId === file.id) {
                                setDragOverTarget(null);
                              }
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              handlePageDrop(file.id, pageIdx);
                            }}
                            onDragEnd={handlePageDragEnd}
                            className={`group bg-surface-subtle border rounded-lg p-space-2 flex flex-col gap-space-2 relative transition-all shadow-sm ${
                              isBeingDragged
                                ? 'opacity-40 scale-95 border-dashed border-primary-container'
                                : isDropTarget
                                ? 'border-primary-container ring-2 ring-primary-container/40 bg-primary-container/10 scale-[1.02]'
                                : 'border-border-subtle hover:bg-surface-container-high'
                            } ${isDeleted ? 'opacity-50 grayscale' : ''}`}
                          >
                            <div className="aspect-[3/4] bg-surface-light rounded p-space-2 text-surface-container-lowest flex flex-col justify-between overflow-hidden relative shadow-inner">
                              <LazyThumbnail
                                fileId={file.id}
                                pageIndex={page.pageIndex}
                                pageNumber={page.pageNumber}
                                rotation={page.rotation}
                                thumbnail={thumbs[`${file.id}:${page.pageIndex}`]}
                                requestThumbnail={requestThumbnail}
                              />

                              {/* Top-left: New order position badge */}
                              <span
                                className="absolute top-1 left-1 px-1.5 py-0.5 bg-primary-container text-on-primary-container font-label-sm text-[10px] font-bold rounded shadow-sm flex items-center gap-0.5"
                                title={`Thứ tự trang mới: Vị trí #${pageIdx + 1}`}
                              >
                                #{pageIdx + 1 < 10 ? `0${pageIdx + 1}` : pageIdx + 1}
                              </span>

                              {/* Top-right: Drag handle indicator */}
                              {!isDeleted && (
                                <span
                                  className="absolute top-1 right-1 p-0.5 bg-surface-canvas/70 hover:bg-surface-canvas text-on-surface rounded cursor-grab active:cursor-grabbing transition-colors"
                                  title="Kéo thả để đổi vị trí"
                                >
                                  <GripVertical size={13} />
                                </span>
                              )}

                              {/* Deleted indicator overlay */}
                              {isDeleted && (
                                <div className="absolute inset-0 bg-surface-canvas/85 flex flex-col items-center justify-center gap-1 p-2 text-center">
                                  <span className="text-[11px] font-semibold text-error">Đã loại bỏ</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRestorePage(file.id, page.pageIndex)}
                                    className="px-2 py-0.5 bg-primary-container text-on-primary-container text-[10px] font-medium rounded hover:bg-brand-cyan-bright transition-colors cursor-pointer"
                                  >
                                    Khôi phục
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Card Footer: Original Page Info & Control Buttons */}
                            <div className="flex items-center justify-between px-1 gap-1">
                              <span
                                className="font-label-sm text-[11px] text-outline truncate"
                                title={`Trang gốc: P.${page.pageNumber}`}
                              >
                                Gốc: P.{page.pageNumber < 10 ? `0${page.pageNumber}` : page.pageNumber}
                              </span>

                              {!isDeleted && (
                                <div className="flex items-center gap-0.5 opacity-90 group-hover:opacity-100 transition-opacity">
                                  {/* Move Previous (Left) Button */}
                                  <button
                                    type="button"
                                    disabled={pageIdx === 0}
                                    onClick={() => handleMovePage(file.id, pageIdx, pageIdx - 1)}
                                    className="p-1 hover:text-primary disabled:opacity-30 disabled:hover:text-inherit transition-colors cursor-pointer"
                                    title="Di chuyển sang trước (⬅️)"
                                    aria-label="Di chuyển sang trước"
                                  >
                                    <ArrowLeft size={13} />
                                  </button>

                                  {/* Move Next (Right) Button */}
                                  <button
                                    type="button"
                                    disabled={pageIdx === file.pages.length - 1}
                                    onClick={() => handleMovePage(file.id, pageIdx, pageIdx + 1)}
                                    className="p-1 hover:text-primary disabled:opacity-30 disabled:hover:text-inherit transition-colors cursor-pointer"
                                    title="Di chuyển sang sau (➡️)"
                                    aria-label="Di chuyển sang sau"
                                  >
                                    <ArrowRight size={13} />
                                  </button>

                                  {/* Rotate Button */}
                                  <button
                                    type="button"
                                    onClick={() => handleRotatePage(file.id, page.pageIndex)}
                                    className="p-1 hover:text-primary transition-colors cursor-pointer"
                                    title="Xoay 90 độ"
                                    aria-label="Xoay trang 90 độ"
                                  >
                                    <RotateCw size={13} />
                                  </button>

                                  {/* Delete / Exclude Button */}
                                  <button
                                    type="button"
                                    onClick={() => handleDeletePage(file.id, page.pageIndex)}
                                    className="p-1 hover:text-error transition-colors cursor-pointer"
                                    title="Loại bỏ trang này khỏi file xuất"
                                    aria-label="Loại bỏ trang"
                                  >
                                    <X size={13} />
                                  </button>
                                </div>
                              )}
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
          )}

          {/* CARD 2: OUTPUT RESULTS & DOWNLOAD SUITE */}
          <div className="bg-surface-container rounded-xl p-space-6 border border-border-subtle shadow-md flex flex-col gap-space-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-2">
                <div className="w-8 h-8 rounded-lg bg-surface-container-high text-secondary border border-secondary/30 flex items-center justify-center">
                  <CheckCircle2 size={20} />
                </div>
                <h2 className="font-title-sm text-title-sm text-on-surface">Kết Quả Xử Lý & Xuất Tệp</h2>
              </div>
              <span className="px-space-2 py-[2px] bg-surface-container-high text-secondary font-label-sm text-label-sm rounded flex items-center gap-1 border border-secondary/30">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                {outputResult ? 'SẴN SÀNG TẢI VỀ' : 'ĐANG CHỜ XỬ LÝ'}
              </span>
            </div>

            {/* METRIC CARDS ROW */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-space-3">
              <div className="bg-surface-subtle border border-border-subtle p-space-3 rounded-lg flex flex-col gap-1">
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Tệp xuất bản</span>
                <span className="font-title-sm text-title-sm text-on-surface">
                  {outputResult
                    ? (outputResult.isZip ? `${outputResult.fileCount} tệp PDF (ZIP)` : '1 tệp PDF')
                    : `${files.length} Tệp đang chọn`}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">{outputResult?.isZip ? 'Gói .ZIP' : 'Tệp .PDF'}</span>
              </div>
              <div className="bg-surface-subtle border border-border-subtle p-space-3 rounded-lg flex flex-col gap-1">
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Tổng số trang</span>
                <span className="font-title-sm text-title-sm text-brand-cyan-bright">
                  {outputResult ? `${outputResult.pageCount} trang hoàn chỉnh` : `${totalPages} trang`}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">{normalizeA4 && activeMode !== 'compress' ? 'Khổ A4' : 'Giữ khổ trang gốc'}</span>
              </div>
              <div className="bg-surface-subtle border border-border-subtle p-space-3 rounded-lg flex flex-col gap-1">
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                  {outputResult ? 'Dung lượng thực tế' : 'Dung lượng ban đầu'}
                </span>
                <span className="font-title-sm text-title-sm text-secondary">
                  {outputResult ? formatSize(outputResult.size) : formatSize(totalSize)}
                </span>
                <span className="font-body-sm text-body-sm text-outline">
                  {outputResult ? (
                    `Gốc: ${formatSize(outputResult.originalSize)}${activeMode === 'compress' ? ` • ${tr(`giảm ${savedPercent(outputResult.originalSize, outputResult.size)}%`, `${savedPercent(outputResult.originalSize, outputResult.size)}% smaller`, `${savedPercent(outputResult.originalSize, outputResult.size)}%削減`)}` : ''}`
                  ) : (
                    'Chưa xuất tệp'
                  )}
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
                  <span>{outputResult.isZip ? 'Tải gói ZIP' : 'Tải tệp đã xử lý'} ({outputResult.isZip ? '.ZIP' : '.PDF'} - {formatSize(outputResult.size)})</span>
                </a>
              ) : (
                <button
                  type="button"
                  disabled={files.length === 0 || isExecuting || isProcessing}
                  onClick={handleExecute}
                  className="h-12 w-full bg-brand-emerald-deep hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed text-surface-container-lowest font-title-sm text-title-sm font-semibold rounded-xl shadow-lg transition-all flex items-center justify-center gap-space-2 cursor-pointer"
                >
                  <Zap size={22} />
                  <span>
                    {isExecuting
                      ? 'Đang xử lý...'
                      : activeMode === 'organize'
                      ? `Lưu & Tải File Đã Sắp Xếp (${totalPages} Trang)`
                      : activeMode === 'merge'
                      ? (files.length === 1 ? `Lưu & Tải File (${totalPages} Trang)` : `Bắt Đầu Gộp File (${totalPages} Trang)`)
                      : activeMode === 'compress'
                      ? tr('Bắt Đầu Nén & Chuẩn Bị Tải Về', 'Compress & Prepare Download', '圧縮してダウンロードを準備')
                      : 'Bắt Đầu Tách & Chuẩn Bị Tải Về'}
                  </span>
                </button>
              )}

              {/* Secondary Actions Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-2">
                {outputResult && !outputResult.isZip && (
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

    </div>
  );
}
