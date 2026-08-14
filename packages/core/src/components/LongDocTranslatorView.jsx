import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
    ClipboardPaste,
    PlusCircle,
    Printer,
    Languages,
    AlertTriangle,
    Trash2,
    FileText,
    HardDrive,
    CheckCircle2,
    Globe,
    Type,
    Landmark,
    GraduationCap,
    RotateCcw,
    FileDown,
    Loader2
} from 'lucide-react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, convertInchesToTwip } from 'docx';
import { saveAs } from 'file-saver';
import { ZoomIn, ZoomOut } from 'lucide-react';
import DocToolbar from './DocToolbar';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useAntigravityAgent } from '../hooks/useAntigravityAgent';

// =====================================================================
// UI Translations for the EJV Translator module
// =====================================================================
const ejvUiText = {
    vn: {
        pasteLabel: 'Nhập văn bản nguồn cần dịch',
        appendBtn: 'Dịch tự động',
        clearBtn: 'Xóa toàn bộ',
        confirmClear: 'Bạn có chắc chắn muốn xóa toàn bộ văn bản đã dịch không?',
        printBtn: 'Xuất PDF / In',
        exportDocx: 'Xuất DOCX',
        saving: 'Đang lưu...',
        saved: 'Đã lưu',
        errorPrefix: 'Lỗi dịch thuật: ',
        placeholder: 'Nhập nội dung vào đây...',
        total: 'Tổng cộng',
        totalUnit: 'khối',
        empty: 'Nhập văn bản vào khung bên trái để dịch sang 3 ngôn ngữ',
        formatLabel: 'Định dạng',
        formatDefault: 'Mặc định',
        formatAdmin: 'Hành chính',
        formatAcademic: 'Học thuật',
        batchHint: 'Antigravity Agent sẽ tự động xử lý và trích xuất JSON.',
    },
    en: {
        pasteLabel: 'Input source text to translate',
        appendBtn: 'Auto Translate',
        clearBtn: 'Clear All',
        confirmClear: 'Are you sure you want to clear all translated text?',
        printBtn: 'Export PDF / Print',
        exportDocx: 'Export DOCX',
        promptGemini: 'Gemini',
        promptNotebook: 'NotebookLM',
        saving: 'Saving...',
        saved: 'Saved',
        errorPrefix: 'Translation error: ',
        placeholder: 'Enter text here...',
        total: 'Total',
        totalUnit: 'blocks',
        empty: 'Input text on the left to translate into 3 languages',
        formatLabel: 'Format',
        formatDefault: 'Default',
        formatAdmin: 'Administrative',
        formatAcademic: 'Academic',
        batchHint: 'Antigravity Agent will automatically process and extract JSON.',
    },
    jp: {
        pasteLabel: '翻訳元のテキストを入力',
        appendBtn: '自動翻訳',
        clearBtn: '全て削除',
        confirmClear: '翻訳されたテキストをすべて削除しますか？',
        printBtn: 'PDFに書き出す / 印刷',
        exportDocx: 'DOCX出力',
        saving: '保存中...',
        saved: '保存済み',
        errorPrefix: '翻訳エラー: ',
        placeholder: 'ここにテキストを入力...',
        total: '合計',
        totalUnit: 'ブロック',
        empty: '左側にテキストを入力して3言語に翻訳',
        formatLabel: 'フォーマット',
        formatDefault: 'デフォルト',
        formatAdmin: '行政文書',
        formatAcademic: '学術論文',
        batchHint: 'Antigravity Agentが自動的に処理し、JSONを抽出します。',
    },
};

const STORAGE_KEY = 'docstudio_ejv_blocks_v1';

// =====================================================================
// Format style definitions
// =====================================================================
const FORMAT_STYLES = {
    standard: {
        fontFamily: "'Inter', 'Noto Sans JP', sans-serif",
        fontSize: '11pt',
        lineHeight: '1.6',
        textAlign: 'left',
        h1Size: '18pt',
        h2Size: '15pt',
        h3Size: '13pt',
    },
    administrative: {
        fontFamily: "'Times New Roman', 'Noto Serif JP', serif",
        fontSize: '13pt',
        lineHeight: '1.5',
        textAlign: 'justify',
        h1Size: '16pt',
        h2Size: '14pt',
        h3Size: '13pt',
    },
    academic: {
        fontFamily: "'Arial', 'Noto Sans JP', sans-serif",
        fontSize: '11pt',
        lineHeight: '1.15',
        textAlign: 'left',
        h1Size: '14pt',
        h2Size: '12pt',
        h3Size: '11pt',
    },
};

// =====================================================================
// Block renderer
// =====================================================================
const BlockRenderer = ({ block, lang, style, effectiveStyle, isEditing, onEdit }) => {
    const fs = effectiveStyle || FORMAT_STYLES[style];
    const val = block[lang] || block.vn || block.en || block.ja || '';

    const baseStyle = {
        fontFamily: fs.fontFamily,
        fontSize: fs.fontSize,
        lineHeight: fs.lineHeight,
        textAlign: fs.textAlign,
    };

    switch (block.type) {
        case 'h1':
            return (
                <h1
                    style={{
                        ...baseStyle,
                        fontSize: fs.h1Size,
                        fontWeight: 'bold',
                        margin: '24pt 0 12pt 0',
                        textAlign: 'center',
                        textTransform: 'uppercase',
                    }}
                >
                    {val}
                </h1>
            );
        case 'h2':
            return (
                <h2
                    style={{
                        ...baseStyle,
                        fontSize: fs.h2Size,
                        fontWeight: 'bold',
                        margin: '18pt 0 8pt 0',
                    }}
                >
                    {val}
                </h2>
            );
        case 'h3':
            return (
                <h3
                    style={{
                        ...baseStyle,
                        fontSize: fs.h3Size,
                        fontWeight: 'bold',
                        margin: '12pt 0 6pt 0',
                    }}
                >
                    {val}
                </h3>
            );
        case 'p':
            return (
                <p
                    style={{
                        ...baseStyle,
                        margin: '0 0 8pt 0',
                        textIndent: style === 'administrative' ? '28pt' : '0',
                    }}
                >
                    {val}
                </p>
            );
        case 'ul': {
            const items = Array.isArray(val) ? val : [val];
            return (
                <ul style={{ ...baseStyle, margin: '4pt 0 8pt 20pt', listStyleType: 'disc' }}>
                    {items.map((item, i) => (
                        <li key={i} style={{ marginBottom: '2pt' }}>{item}</li>
                    ))}
                </ul>
            );
        }
        case 'ol': {
            const items = Array.isArray(val) ? val : [val];
            return (
                <ol style={{ ...baseStyle, margin: '4pt 0 8pt 20pt', listStyleType: 'decimal' }}>
                    {items.map((item, i) => (
                        <li key={i} style={{ marginBottom: '2pt' }}>{item}</li>
                    ))}
                </ol>
            );
        }
        case 'table': {
            const headers = block.headers?.[lang] || block.headers?.vn || [];
            const rows = block.rows?.[lang] || block.rows?.vn || [];
            return (
                <table
                    style={{
                        ...baseStyle,
                        width: '100%',
                        borderCollapse: 'collapse',
                        margin: '8pt 0',
                    }}
                >
                    {headers.length > 0 && (
                        <thead>
                            <tr>
                                {headers.map((h, i) => (
                                    <th
                                        key={i}
                                        style={{
                                            border: '1px solid #333',
                                            padding: '4pt 6pt',
                                            fontWeight: 'bold',
                                            backgroundColor: '#f0f0f0',
                                            textAlign: 'center',
                                        }}
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                    )}
                    <tbody>
                        {rows.map((row, ri) => (
                            <tr key={ri}>
                                {(Array.isArray(row) ? row : [row]).map((cell, ci) => (
                                    <td
                                        key={ci}
                                        style={{
                                            border: '1px solid #333',
                                            padding: '3pt 6pt',
                                        }}
                                    >
                                        {cell}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        }
        case 'blockquote':
            return (
                <blockquote
                    style={{
                        ...baseStyle,
                        margin: '8pt 0',
                        padding: '8pt 12pt',
                        borderLeft: '3pt solid #6366f1',
                        backgroundColor: '#f8f9ff',
                        fontStyle: 'italic',
                        color: '#475569',
                    }}
                >
                    {val}
                </blockquote>
            );
        case 'hr':
            return <hr style={{ margin: '16pt 0', border: 'none', borderTop: '1px solid #cbd5e1' }} />;
        case 'caption':
            return (
                <p
                    style={{
                        ...baseStyle,
                        fontSize: '9pt',
                        textAlign: 'center',
                        color: '#64748b',
                        fontStyle: 'italic',
                        margin: '4pt 0 12pt 0',
                    }}
                >
                    {val}
                </p>
            );
        default:
            return <p style={baseStyle}>{val}</p>;
    }

    // Note: editing is handled at the PaginatedPages level, not inside BlockRenderer
};


// =====================================================================
// LongDocTranslatorView — Main component
// =====================================================================
const LongDocTranslatorView = ({ displayLang: globalDisplayLang }) => {
    // --- State ---
    const [blocks, saveBlocks, removeBlocks, isLoaded] = useLocalStorage(STORAGE_KEY, [], 'translator');
    const [jsonInput, setJsonInput] = useState('');
    const [error, setError] = useState('');
    const [displayLang, setDisplayLang] = useState(globalDisplayLang || 'vn');
    const [formatStyle, setFormatStyle] = useState('standard');
    const [saveStatus, setSaveStatus] = useState('idle');
    const [zoomLevel, setZoomLevel] = useState(100);
    const [isEditing, setIsEditing] = useState(false);
    const [customFont, setCustomFont] = useState(null);
    const printRef = useRef(null);

    const { execute, isLoading } = useAntigravityAgent('/translate');

    const t = ejvUiText[displayLang] || ejvUiText.vn;

    // --- Translate via Agent ---
    const handleTranslate = async () => {
        try {
            setError('');
            const formData = new FormData();
            formData.append('text', jsonInput);
            formData.append('batch_index', 1);
            formData.append('total', 1);

            const result = await execute(formData, true);
            if (result && result.blocks) {
                saveBlocks([...blocks, ...result.blocks]);
                setJsonInput('');
                setSaveStatus('saved');
                setTimeout(() => setSaveStatus('idle'), 1500);
            }
        } catch (err) {
            setError(t.errorPrefix + err.message);
        }
    };

    // --- Clear all ---
    const handleClear = () => {
        if (window.confirm(t.confirmClear)) {
            saveBlocks([]);
        }
    };

    // --- Print ---
    const handlePrint = () => {
        setTimeout(() => {
            try { window.print(); } catch (e) { console.error('Print Error:', e); }
        }, 400);
    };

    // --- Export DOCX ---
    const handleExportDocx = async () => {
        const fs = FORMAT_STYLES[formatStyle];
        const children = [];

        for (const block of blocks) {
            const val = block[displayLang] || block.vn || block.en || block.ja || '';

            switch (block.type) {
                case 'h1':
                    children.push(new Paragraph({
                        children: [new TextRun({ text: val, bold: true, size: parseInt(fs.h1Size) * 2, font: fs.fontFamily.split(',')[0].replace(/'/g, '').trim() })],
                        heading: HeadingLevel.HEADING_1,
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 480, after: 240 },
                    }));
                    break;
                case 'h2':
                    children.push(new Paragraph({
                        children: [new TextRun({ text: val, bold: true, size: parseInt(fs.h2Size) * 2, font: fs.fontFamily.split(',')[0].replace(/'/g, '').trim() })],
                        heading: HeadingLevel.HEADING_2,
                        spacing: { before: 360, after: 160 },
                    }));
                    break;
                case 'h3':
                    children.push(new Paragraph({
                        children: [new TextRun({ text: val, bold: true, size: parseInt(fs.h3Size) * 2, font: fs.fontFamily.split(',')[0].replace(/'/g, '').trim() })],
                        heading: HeadingLevel.HEADING_3,
                        spacing: { before: 240, after: 120 },
                    }));
                    break;
                case 'p':
                    children.push(new Paragraph({
                        children: [new TextRun({ text: val, size: parseInt(fs.fontSize) * 2, font: fs.fontFamily.split(',')[0].replace(/'/g, '').trim() })],
                        spacing: { after: 160 },
                        alignment: formatStyle === 'administrative' ? AlignmentType.JUSTIFIED : AlignmentType.LEFT,
                        indent: formatStyle === 'administrative' ? { firstLine: convertInchesToTwip(0.4) } : undefined,
                    }));
                    break;
                case 'ul':
                case 'ol': {
                    const items = Array.isArray(val) ? val : [val];
                    items.forEach(item => {
                        children.push(new Paragraph({
                            children: [new TextRun({ text: item, size: parseInt(fs.fontSize) * 2, font: fs.fontFamily.split(',')[0].replace(/'/g, '').trim() })],
                            bullet: block.type === 'ul' ? { level: 0 } : undefined,
                            numbering: block.type === 'ol' ? { reference: 'default-numbering', level: 0 } : undefined,
                            spacing: { after: 40 },
                        }));
                    });
                    break;
                }
                case 'table': {
                    const headers = block.headers?.[displayLang] || block.headers?.vn || [];
                    const rows = block.rows?.[displayLang] || block.rows?.vn || [];
                    const tableRows = [];
                    if (headers.length > 0) {
                        tableRows.push(new TableRow({
                            children: headers.map(h => new TableCell({
                                children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: parseInt(fs.fontSize) * 2 })] })],
                                width: { size: Math.floor(100 / headers.length), type: WidthType.PERCENTAGE },
                            })),
                        }));
                    }
                    rows.forEach(row => {
                        const cells = Array.isArray(row) ? row : [row];
                        tableRows.push(new TableRow({
                            children: cells.map(cell => new TableCell({
                                children: [new Paragraph({ children: [new TextRun({ text: String(cell), size: parseInt(fs.fontSize) * 2 })] })],
                            })),
                        }));
                    });
                    if (tableRows.length > 0) {
                        children.push(new Table({ rows: tableRows, width: { size: 100, type: WidthType.PERCENTAGE } }));
                        children.push(new Paragraph({ text: '', spacing: { after: 160 } }));
                    }
                    break;
                }
                case 'blockquote':
                    children.push(new Paragraph({
                        children: [new TextRun({ text: val, italics: true, size: parseInt(fs.fontSize) * 2, color: '475569', font: fs.fontFamily.split(',')[0].replace(/'/g, '').trim() })],
                        indent: { left: convertInchesToTwip(0.5) },
                        border: { left: { style: BorderStyle.SINGLE, size: 6, color: '6366f1' } },
                        spacing: { before: 160, after: 160 },
                    }));
                    break;
                case 'hr':
                    children.push(new Paragraph({
                        border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'cbd5e1' } },
                        spacing: { before: 320, after: 320 },
                    }));
                    break;
                case 'caption':
                    children.push(new Paragraph({
                        children: [new TextRun({ text: val, italics: true, size: 18, color: '64748b', font: fs.fontFamily.split(',')[0].replace(/'/g, '').trim() })],
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 80, after: 240 },
                    }));
                    break;
                default:
                    children.push(new Paragraph({
                        children: [new TextRun({ text: val, size: parseInt(fs.fontSize) * 2 })],
                        spacing: { after: 160 },
                    }));
            }
        }

        const doc = new Document({
            sections: [{
                properties: {
                    page: {
                        margin: { top: convertInchesToTwip(1), bottom: convertInchesToTwip(1), left: convertInchesToTwip(0.79), right: convertInchesToTwip(0.59) },
                    },
                },
                children,
            }],
            numbering: {
                config: [{
                    reference: 'default-numbering',
                    levels: [{ level: 0, format: 'decimal', text: '%1.', alignment: AlignmentType.LEFT }],
                }],
            },
        });

        const blob = await Packer.toBlob(doc);
        const langLabel = displayLang === 'ja' ? 'JP' : displayLang.toUpperCase();
        saveAs(blob, `EJV_Document_${langLabel}.docx`);
    };

    // --- Language button style helper ---
    const langBtnClass = (lang) =>
        `px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${displayLang === lang
            ? 'bg-teal-600 text-white shadow-md'
            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
        }`;

    // --- Format button style helper ---
    const fmtBtnClass = (fmt) =>
        `flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${formatStyle === fmt
            ? 'bg-indigo-600 text-white shadow-md'
            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
        }`;

    // Compute effective FORMAT_STYLES with custom font override
    const effectiveFormatStyle = useMemo(() => {
        const base = FORMAT_STYLES[formatStyle];
        if (!customFont) return base;
        return { ...base, fontFamily: customFont };
    }, [formatStyle, customFont]);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900">
            {/* ================= LEFT PANEL ================= */}
            <aside className="no-print w-full md:w-80 lg:w-96 bg-white border-r border-slate-200 h-screen sticky top-0 flex flex-col shadow-sm z-[60]">

                {/* Brand Header */}
                <div className="p-5 border-b border-slate-100 bg-gradient-to-br from-teal-600 to-teal-800 shrink-0">
                    <div className="flex items-center gap-2.5 text-white mb-1">
                        <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                            <Globe size={18} strokeWidth={2.5} className="text-white" />
                        </div>
                        <h1 className="text-xl font-black tracking-tight uppercase italic">EJV Translator</h1>
                    </div>
                    <p className="text-[10px] text-teal-200 font-bold uppercase tracking-widest mt-0.5">
                        Long Document Translation
                    </p>
                </div>

                {/* Scrollable Body */}
                <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar">

                    {/* Batch hint */}
                    <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-xl">
                        <p className="text-[11px] text-teal-700 font-medium leading-relaxed">
                            💡 {t.batchHint}
                        </p>
                    </div>

                    {/* JSON Input */}
                    <section>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5 uppercase tracking-wide">
                                <ClipboardPaste size={13} /> {t.pasteLabel}
                            </label>
                            <div className="text-[10px] font-semibold">
                                {saveStatus === 'saving' && (
                                    <span className="animate-pulse flex items-center gap-1 text-amber-500">
                                        <HardDrive size={10} /> {t.saving}
                                    </span>
                                )}
                                {saveStatus === 'saved' && (
                                    <span className="flex items-center gap-1 text-emerald-500">
                                        <CheckCircle2 size={10} /> {t.saved}
                                    </span>
                                )}
                            </div>
                        </div>

                        <textarea
                            value={jsonInput}
                            onChange={(e) => setJsonInput(e.target.value)}
                            placeholder={t.placeholder}
                            className="w-full h-36 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono text-xs mb-2.5 outline-none transition-all resize-none shadow-inner text-slate-700"
                        />

                        <button
                            onClick={handleTranslate}
                            disabled={!jsonInput.trim() || isLoading}
                            className="w-full py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-[0.98] text-sm"
                        >
                            {isLoading ? <Loader2 size={15} className="animate-spin" /> : <PlusCircle size={15} />}
                            {t.appendBtn}
                        </button>

                        {error && (
                            <div className="mt-2.5 p-3 bg-red-50 border border-red-200 rounded-xl flex gap-2 items-start">
                                <AlertTriangle size={13} className="text-red-500 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-red-600 font-medium leading-relaxed">{error}</p>
                            </div>
                        )}
                    </section>

                    {/* Block Count */}
                    <section className="pt-3 border-t border-slate-100">
                        <div className="p-3 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-500">{t.total}:</span>
                            <div className="flex items-baseline gap-1.5">
                                <span className="font-black text-2xl text-slate-800">{blocks.length}</span>
                                <span className="text-xs text-slate-400">{t.totalUnit}</span>
                            </div>
                        </div>
                    </section>

                    {/* Block Count */}

                    {/* Clear All */}
                    {blocks.length > 0 && (
                        <div className="pt-3 border-t border-slate-100">
                            <button
                                onClick={handleClear}
                                className="w-full py-2.5 border border-red-100 text-red-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
                            >
                                <Trash2 size={12} /> {t.clearBtn}
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-slate-100 bg-slate-50 shrink-0">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <HardDrive size={10} />
                        <span>Lưu tại <code className="bg-white px-1 py-0.5 rounded border border-slate-200 text-slate-500">IndexedDB</code></span>
                    </div>
                </div>
            </aside>

            {/* ================= RIGHT PANEL — PREVIEW ================= */}
            <main className="flex-grow bg-slate-200 min-h-screen relative p-4 md:p-8 flex flex-col items-center">

                {/* Print styles */}
                <style>{`
                    @media print {
                        .no-print { display: none !important; }
                        body { background: white !important; margin: 0; padding: 0; }
                        main { padding: 0 !important; background: white !important; }
                        .ejv-page {
                            width: 210mm !important;
                            height: 297mm !important;
                            margin: 0 !important;
                            padding: 25mm 15mm 25mm 20mm !important;
                            box-shadow: none !important;
                            border: none !important;
                            border-radius: 0 !important;
                            page-break-after: always;
                            page-break-inside: avoid;
                            overflow: hidden !important;
                            position: relative;
                        }
                        .ejv-page:last-child {
                            page-break-after: auto;
                        }
                        .ejv-page-number {
                            position: absolute;
                            bottom: 12mm;
                            right: 15mm;
                        }
                    }
                    @page {
                        size: A4;
                        margin: 0;
                    }
                `}</style>

                {/* Floating Toolbar */}
                <DocToolbar
                    displayLang={displayLang}
                    onLangChange={setDisplayLang}
                    langOptions={['vn', 'en', 'ja']}
                    accentColor="teal"
                    showFontPicker={true}
                    currentFont={customFont || FORMAT_STYLES[formatStyle].fontFamily}
                    onFontChange={setCustomFont}
                    showEdit={true}
                    isEditing={isEditing}
                    onToggleEdit={() => setIsEditing(!isEditing)}
                    zoomLevel={zoomLevel}
                    onZoomChange={setZoomLevel}
                    onExportDocx={handleExportDocx}
                    onPrint={handlePrint}
                    disableActions={blocks.length === 0}
                    printLabel="PDF"
                />

                {/* Document Canvas */}
                <div id="print-area" ref={printRef} className="flex flex-col gap-8 pb-24 items-center w-full" style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center', transition: 'transform 0.2s ease' }}>
                    {blocks.length === 0 ? (
                        <div className="w-[210mm] min-h-[297mm] bg-white rounded-2xl shadow-sm border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-300 gap-5">
                            <Globe size={72} strokeWidth={1} />
                            <p className="text-lg font-medium italic text-center px-8">{t.empty}</p>
                        </div>
                    ) : (
                        <PaginatedPages
                            blocks={blocks}
                            lang={displayLang}
                            formatStyle={formatStyle}
                            effectiveStyle={effectiveFormatStyle}
                            isEditing={isEditing}
                            onBlockEdit={(idx, newVal) => {
                                const newBlocks = [...blocks];
                                const lang = displayLang === 'ja' ? 'ja' : displayLang;
                                newBlocks[idx] = { ...newBlocks[idx], [lang]: newVal };
                                saveBlocks(newBlocks);
                            }}
                        />
                    )}
                </div>
            </main>
        </div>
    );
};

// =====================================================================
// PaginatedPages — Renders blocks across A4 pages with page numbers
// Uses a hidden measurement container to calculate actual heights
// =====================================================================
const PAGE_CONTENT_HEIGHT_MM = 247; // 297mm - 25mm top - 25mm bottom
const PX_PER_MM = 3.7795; // 1mm ≈ 3.7795px at 96dpi
const SAFETY_BUFFER_MM = 5; // Safety buffer to prevent text clipping at page edges
const PAGE_CONTENT_HEIGHT_PX = (PAGE_CONTENT_HEIGHT_MM - SAFETY_BUFFER_MM) * PX_PER_MM;

const PaginatedPages = ({ blocks, lang, formatStyle, effectiveStyle, isEditing, onBlockEdit }) => {
    const [pages, setPages] = useState([]);
    const measureRef = useRef(null);

    useEffect(() => {
        // Use rAF to ensure DOM is ready for measurements
        const frame = requestAnimationFrame(() => {
            if (!measureRef.current) return;

            const container = measureRef.current;
            const children = container.children;
            if (children.length === 0) {
                setPages([]);
                return;
            }

            const newPages = [];
            let currentPage = [];
            let currentHeight = 0;

            for (let i = 0; i < children.length; i++) {
                const childHeight = children[i].getBoundingClientRect().height;

                // If adding this block would exceed page height, start a new page
                if (currentHeight + childHeight > PAGE_CONTENT_HEIGHT_PX && currentPage.length > 0) {
                    newPages.push({ indices: [...currentPage], oversized: false });
                    currentPage = [];
                    currentHeight = 0;
                }

                // If single block is taller than a page, mark it as oversized
                if (childHeight > PAGE_CONTENT_HEIGHT_PX && currentPage.length === 0) {
                    currentPage.push(i);
                    newPages.push({ indices: [...currentPage], oversized: true });
                    currentPage = [];
                    currentHeight = 0;
                    continue;
                }

                currentPage.push(i);
                currentHeight += childHeight;
            }

            // Add remaining blocks as last page
            if (currentPage.length > 0) {
                newPages.push({ indices: [...currentPage], oversized: false });
            }

            setPages(newPages);
        });

        return () => cancelAnimationFrame(frame);
    }, [blocks, lang, formatStyle]);

    const totalPages = pages.length || 1;

    return (
        <>
            {/* Hidden measurement container — renders all blocks to measure heights */}
            <div
                ref={measureRef}
                aria-hidden="true"
                style={{
                    position: 'absolute',
                    visibility: 'hidden',
                    width: '175mm', // 210mm - 20mm left - 15mm right
                    left: '-9999px',
                    top: 0,
                    pointerEvents: 'none',
                }}
            >
                {blocks.map((block, idx) => (
                    <div key={idx}>
                        <BlockRenderer block={block} lang={lang} style={formatStyle} />
                    </div>
                ))}
            </div>

            {/* Actual paginated pages */}
            {pages.map((page, pageIdx) => (
                <div
                    key={pageIdx}
                    className="ejv-page w-[210mm] bg-white shadow-xl rounded-sm relative"
                    style={{
                        padding: '25mm 15mm 25mm 20mm',
                        minHeight: '297mm',
                        height: page.oversized ? 'auto' : '297mm',
                        boxSizing: 'border-box',
                        overflow: 'visible',
                    }}
                >
                    {/* Page content */}
                    <div style={{ minHeight: page.oversized ? undefined : `${PAGE_CONTENT_HEIGHT_MM}mm`, maxHeight: page.oversized ? undefined : `${PAGE_CONTENT_HEIGHT_MM}mm`, overflow: 'visible' }}>
                        {page.indices.map((blockIdx) => (
                            isEditing ? (
                                <div key={blockIdx} className="group relative">
                                    <BlockRenderer
                                        block={blocks[blockIdx]}
                                        lang={lang}
                                        style={formatStyle}
                                        effectiveStyle={effectiveStyle}
                                    />
                                    <div
                                        className="absolute inset-0 cursor-text opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => {
                                            const val = blocks[blockIdx][lang] || blocks[blockIdx].vn || blocks[blockIdx].en || blocks[blockIdx].ja || '';
                                            const newVal = prompt('Edit text:', Array.isArray(val) ? val.join('\n') : val);
                                            if (newVal !== null && onBlockEdit) {
                                                onBlockEdit(blockIdx, blocks[blockIdx].type === 'ul' || blocks[blockIdx].type === 'ol' ? newVal.split('\n') : newVal);
                                            }
                                        }}
                                    >
                                        <div className="absolute inset-0 border-2 border-dashed border-amber-400 rounded bg-amber-50/30" />
                                    </div>
                                </div>
                            ) : (
                                <BlockRenderer
                                    key={blockIdx}
                                    block={blocks[blockIdx]}
                                    lang={lang}
                                    style={formatStyle}
                                    effectiveStyle={effectiveStyle}
                                />
                            )
                        ))}
                    </div>

                    {/* Page number — bottom-right */}
                    <div
                        className="ejv-page-number"
                        style={{
                            position: 'absolute',
                            bottom: '12mm',
                            right: '15mm',
                            fontSize: '9pt',
                            color: '#94a3b8',
                            fontFamily: "'Inter', sans-serif",
                        }}
                    >
                        {pageIdx + 1} / {totalPages}
                    </div>
                </div>
            ))}
        </>
    );
};

export default LongDocTranslatorView;
