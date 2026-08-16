import { useState, useRef, useCallback } from 'react';
import { MiniAppHeader, MiniAppLayout } from './shared/MiniAppLayout.jsx';
import {
    PDF_SPLIT_LIMITS,
    formatMiB,
    rejectionMessages,
    validateDocumentFiles,
    verifyDocumentSignature,
} from '../utils/documentFiles.js';
import {
    Upload,
    Scissors,
    FileDown,
    Layers,
    Trash2,
    CheckSquare,
    Square,
    X,
} from 'lucide-react';

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
// UI Translations
// =====================================================================
const uiText = {
    vn: {
        title: 'Tách & Trích Xuất Trang PDF',
        subtitle: 'Chọn đúng những trang cần giữ, tải riêng từng trang hoặc ghép lại thành một tệp.',
        privacyBadge: '100% Client-Side • Bảo mật',
        dropZone: 'Kéo thả file PDF vào đây',
        dropHint: 'hoặc click để chọn file',
        pages: 'trang',
        selected: 'đã chọn',
        selectAll: 'Chọn tất cả',
        deselectAll: 'Bỏ chọn',
        downloadIndividual: 'Tải riêng lẻ',
        downloadMerged: 'Ghép thành 1 file',
        processing: 'Đang xử lý PDF...',
        downloadPage: 'Tải trang',
        page: 'Trang',
    },
    en: {
        title: 'Split & Extract PDF Pages',
        subtitle: 'Pick the pages you need, download them individually or merge them into one file.',
        privacyBadge: '100% Client-Side • Secure',
        dropZone: 'Drag & drop PDF file here',
        dropHint: 'or click to choose file',
        pages: 'pages',
        selected: 'selected',
        selectAll: 'Select all',
        deselectAll: 'Deselect',
        downloadIndividual: 'Download individual',
        downloadMerged: 'Merge into 1 file',
        processing: 'Processing PDF...',
        downloadPage: 'Download page',
        page: 'Page',
    },
    jp: {
        title: 'PDFページの分割・抽出',
        subtitle: '必要なページを選び、個別にダウンロードまたは1つのファイルに結合します。',
        privacyBadge: '100% ローカル処理・安全',
        dropZone: 'PDFファイルをここにドラッグ＆ドロップ',
        dropHint: 'またはクリックしてファイルを選択',
        pages: 'ページ',
        selected: '選択中',
        selectAll: 'すべて選択',
        deselectAll: '選択解除',
        downloadIndividual: '個別ダウンロード',
        downloadMerged: '1ファイルに結合',
        processing: 'PDF処理中...',
        downloadPage: 'ページをダウンロード',
        page: 'ページ',
    },
};

// =====================================================================
// PdfSplitterView — PDF Page Splitter & Merger
// =====================================================================
const PdfSplitterView = ({ displayLang = 'vn' }) => {
    const t = uiText[displayLang] || uiText.vn;
    const [pdfFile, setPdfFile] = useState(null);        // ArrayBuffer
    const [fileName, setFileName] = useState('');
    const [pageCount, setPageCount] = useState(0);
    const [thumbnails, setThumbnails] = useState([]);     // base64 data URLs
    const [selected, setSelected] = useState(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [fileError, setFileError] = useState('');
    const fileInputRef = useRef(null);

    // --- Generate thumbnails from PDF ---
    const generateThumbnails = useCallback(async (arrayBuffer) => {
        setIsLoading(true);
        try {
            const pdfjsLib = await loadPdfJs();
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer.slice(0) });
            const pdf = await loadingTask.promise;
            const count = pdf.numPages;
            if (count > PDF_SPLIT_LIMITS.maxPages) {
                // Giải phóng worker qua loadingTask: PDFDocumentProxy không có destroy().
                await loadingTask.destroy();
                throw new Error(`PDF vượt giới hạn ${PDF_SPLIT_LIMITS.maxPages} trang`);
            }
            setPageCount(count);

            const thumbs = [];
            for (let i = 1; i <= count; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 0.4 });
                const canvas = document.createElement('canvas');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const ctx = canvas.getContext('2d');
                await page.render({ canvasContext: ctx, viewport }).promise;
                thumbs.push(canvas.toDataURL('image/jpeg', 0.7));
                page.cleanup();
            }
            await loadingTask.destroy();
            setThumbnails(thumbs);
            setSelected(new Set());
        } catch (e) {
            console.error('PDF parse error:', e);
            setFileError(e.message || 'Không thể đọc file PDF');
            setPdfFile(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // --- File upload handler ---
    const handleFile = useCallback(async (file) => {
        if (!file) return;
        try {
            const validation = validateDocumentFiles([file], [], PDF_SPLIT_LIMITS);
            if (validation.accepted.length === 0) {
                setFileError(rejectionMessages(validation.rejected).join(' • '));
                return;
            }
            if (!(await verifyDocumentSignature(file))) {
                setFileError(`${file.name}: nội dung không phải PDF hợp lệ`);
                return;
            }
            setFileError('');
            setFileName(file.name);
            const buffer = await file.arrayBuffer();
            setPdfFile(buffer);
            await generateThumbnails(buffer);
        } catch (error) {
            setFileError(error.message || 'Không thể đọc file PDF');
        }
    }, [generateThumbnails]);

    // --- Drag & Drop ---
    const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = () => setIsDragging(false);
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        handleFile(file);
    };

    // --- Toggle page selection ---
    const togglePage = (index) => {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(index) ? next.delete(index) : next.add(index);
            return next;
        });
    };

    // --- Select/Deselect all ---
    const selectAll = () => {
        const allPages = new Set();
        for (let i = 0; i < pageCount; i++) allPages.add(i);
        setSelected(allPages);
    };
    const deselectAll = () => setSelected(new Set());

    // --- Download helper ---
    const downloadBlob = (bytes, name) => {
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.click();
        URL.revokeObjectURL(url);
    };

    // --- Extract single page as PDF ---
    const extractPage = async (pageIndex) => {
        if (!pdfFile) return;
        const PDFDocument = await loadPdfDocument();
        const srcDoc = await PDFDocument.load(pdfFile);
        const newDoc = await PDFDocument.create();
        const [copied] = await newDoc.copyPages(srcDoc, [pageIndex]);
        newDoc.addPage(copied);
        const bytes = await newDoc.save();
        const baseName = fileName.replace('.pdf', '');
        downloadBlob(bytes, `${baseName}_page${pageIndex + 1}.pdf`);
    };

    // --- Download selected pages as individual PDFs ---
    const downloadIndividual = async () => {
        if (!pdfFile || selected.size === 0) return;
        const sortedPages = [...selected].sort((a, b) => a - b);
        for (const pageIndex of sortedPages) {
            await extractPage(pageIndex);
            // Small delay between downloads
            await new Promise(r => setTimeout(r, 300));
        }
    };

    // --- Merge selected pages into one PDF ---
    const downloadMerged = async () => {
        if (!pdfFile || selected.size === 0) return;
        const PDFDocument = await loadPdfDocument();
        const srcDoc = await PDFDocument.load(pdfFile);
        const newDoc = await PDFDocument.create();
        const sortedPages = [...selected].sort((a, b) => a - b);
        const copiedPages = await newDoc.copyPages(srcDoc, sortedPages);
        copiedPages.forEach(page => newDoc.addPage(page));
        const bytes = await newDoc.save();
        const baseName = fileName.replace('.pdf', '');
        downloadBlob(bytes, `${baseName}_merged_${sortedPages.map(p => p + 1).join('-')}.pdf`);
    };

    // --- Clear ---
    const clearAll = () => {
        setPdfFile(null);
        setFileName('');
        setPageCount(0);
        setThumbnails([]);
        setSelected(new Set());
        setFileError('');
    };

    const selectedCount = selected.size;

    return (
        <MiniAppLayout>
            <MiniAppHeader
                title={t.title}
                subtitle={t.subtitle}
                badge={t.privacyBadge}
                tone="rose"
            />

            <div className="w-full">
                {fileError && (
                    <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                        {fileError}
                    </div>
                )}
                {/* Upload Zone */}
                {!pdfFile ? (
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`w-full min-h-[400px] border-3 border-dashed rounded-2xl flex flex-col items-center justify-center gap-5 cursor-pointer transition-all ${isDragging
                            ? 'border-rose-400 bg-rose-50 scale-[1.01]'
                            : 'border-slate-700 bg-slate-900 hover:border-rose-300 hover:bg-rose-50/30'
                            }`}
                    >
                        <Upload size={64} strokeWidth={1.2} className={isDragging ? 'text-rose-400' : 'text-slate-300'} />
                        <div className="text-center">
                            <p className="text-lg font-bold text-slate-400">{t.dropZone}</p>
                            <p className="text-sm text-slate-400 mt-1">{t.dropHint}</p>
                            <p className="text-xs text-slate-400 mt-2">
                                Tối đa {formatMiB(PDF_SPLIT_LIMITS.maxFileBytes)} MiB và {PDF_SPLIT_LIMITS.maxPages} trang; file không rời khỏi trình duyệt.
                            </p>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            onChange={(e) => handleFile(e.target.files[0])}
                        />
                    </div>
                ) : (
                    <>
                        {/* Toolbar */}
                        <div className="bg-slate-900 rounded-2xl shadow-lg border border-slate-800 p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3 flex-wrap">
                                <div className="bg-slate-800 px-3 py-2 rounded-xl text-sm font-mono text-slate-300 max-w-[200px] truncate border border-slate-800">
                                    {fileName}
                                </div>
                                <span className="text-sm text-slate-400">
                                    {pageCount} {t.pages} · <strong className="text-rose-600">{selectedCount}</strong> {t.selected}
                                </span>
                                <div className="flex gap-1">
                                    <button
                                        onClick={selectAll}
                                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                                    >
                                        {t.selectAll}
                                    </button>
                                    <button
                                        onClick={deselectAll}
                                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                                    >
                                        {t.deselectAll}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                                <button
                                    onClick={downloadIndividual}
                                    disabled={selectedCount === 0}
                                    className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 text-white font-bold rounded-xl shadow-md hover:bg-rose-700 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                                >
                                    <FileDown size={14} /> {t.downloadIndividual}
                                </button>
                                <button
                                    onClick={downloadMerged}
                                    disabled={selectedCount === 0}
                                    className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                                >
                                    <Layers size={14} /> {t.downloadMerged}
                                </button>
                                <button
                                    onClick={clearAll}
                                    className="flex items-center gap-1.5 px-3 py-2.5 border border-red-500/30 text-red-400 hover:bg-red-50 hover:text-red-600 font-bold rounded-xl transition-all text-sm"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Loading */}
                        {isLoading && (
                            <div className="flex items-center justify-center py-20">
                                <div className="animate-spin w-10 h-10 border-4 border-rose-200 border-t-rose-600 rounded-full" />
                                <span className="ml-4 text-slate-400 font-medium">{t.processing}</span>
                            </div>
                        )}

                        {/* Thumbnails Grid */}
                        {!isLoading && thumbnails.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                {thumbnails.map((thumb, index) => {
                                    const isSelected = selected.has(index);
                                    return (
                                        <div
                                            key={index}
                                            onClick={() => togglePage(index)}
                                            className={`relative cursor-pointer group rounded-xl overflow-hidden shadow-md border-3 transition-all hover:shadow-lg hover:scale-[1.02] ${isSelected
                                                ? 'border-rose-500 ring-2 ring-rose-200 bg-rose-50'
                                                : 'border-transparent bg-slate-900 hover:border-slate-700'
                                                }`}
                                        >
                                            {/* Selection badge */}
                                            <div className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-md flex items-center justify-center transition-all ${isSelected
                                                ? 'bg-rose-500 text-white shadow-md'
                                                : 'bg-slate-900/80 text-slate-400 border border-slate-800 group-hover:border-slate-400'
                                                }`}>
                                                {isSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                                            </div>

                                            {/* Page number */}
                                            <div className="absolute top-2 right-2 z-10 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                                                {index + 1}
                                            </div>

                                            {/* Download single page */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); extractPage(index); }}
                                                className="absolute bottom-2 right-2 z-10 bg-white/90 backdrop-blur-sm text-slate-300 hover:text-rose-600 hover:bg-white p-1.5 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-all border border-slate-800"
                                                title={`${t.downloadPage} ${index + 1}`}
                                            >
                                                <FileDown size={12} />
                                            </button>

                                            {/* Thumbnail image */}
                                            <img
                                                src={thumb}
                                                alt={`${t.page} ${index + 1}`}
                                                className="w-full h-auto"
                                                draggable={false}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>
        </MiniAppLayout>
    );
};

export default PdfSplitterView;
