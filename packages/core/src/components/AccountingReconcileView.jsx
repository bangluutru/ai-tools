import React, { useState, useRef, useMemo } from 'react';
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  Download,
  FileX,
  Calculator,
  ShieldCheck,
  CheckCircle2,
  FileCheck,
  Cpu,
  Lock,
} from 'lucide-react';
import { reconcileAccountingData } from '../utils/accounting/reconcile.js';
import { reconcileWorkbooks } from '../utils/accounting/reconcilePipeline.js';
import { exportReconcileWorkbook } from '../utils/accounting/reconcileExport.js';
import {
  EXCEL_FILE_LIMITS,
  rejectionMessages,
  validateDocumentFiles,
  verifyDocumentSignature,
} from '../utils/documentFiles.js';

export default function AccountingReconcileView({ displayLang = 'vi' }) {
  const [files, setFiles] = useState({ 511: null, 33311: null, br: null });
  const [data, setData] = useState({ 511: [], 33311: [], br: [] });
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');
  const [fileError, setFileError] = useState('');
  const [diagnostics, setDiagnostics] = useState([]);

  const fileInputRef = useRef(null);

  /**
   * Đọc workbook thành map sheet -> mảng dòng. Giữ nguyên dòng trống
   * để chỉ số mảng khớp đúng số dòng thật trong Excel.
   */
  const readWorkbookRows = async (file, XLSX) => {
    if (!(await verifyDocumentSignature(file))) {
      throw new Error(`${file.name}: nội dung không khớp định dạng Excel`);
    }
    const workbook = XLSX.read(new Uint8Array(await file.arrayBuffer()), { type: 'array' });
    const sheetRows = {};
    for (const sheetName of workbook.SheetNames) {
      sheetRows[sheetName] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
    }
    return { sheetNames: workbook.SheetNames, sheetRows };
  };

  const handleFileUpload = async (event) => {
    const uploadedFiles = Array.from(event.target.files || []);
    if (uploadedFiles.length === 0) return;

    const validation = validateDocumentFiles(uploadedFiles, [], EXCEL_FILE_LIMITS);
    const errors = rejectionMessages(validation.rejected);
    if (validation.accepted.length === 0) {
      setFileError(errors.join(' • '));
      event.target.value = '';
      return;
    }

    setIsProcessing(true);

    try {
      const XLSX = await import('xlsx');

      const workbooks = [];
      for (const file of validation.accepted) {
        workbooks.push({ ...(await readWorkbookRows(file, XLSX)), sourceFile: file.name });
      }

      const outcome = reconcileWorkbooks(workbooks);

      setFiles((current) => ({ ...current, ...outcome.files }));
      setData((current) => ({
        511: outcome.data['511'].length > 0 ? outcome.data['511'] : current['511'],
        33311: outcome.data['33311'].length > 0 ? outcome.data['33311'] : current['33311'],
        br: outcome.data.br.length > 0 ? outcome.data.br : current.br,
      }));
      setDiagnostics(outcome.diagnostics);
      setFileError(errors.join(' • '));
    } catch (err) {
      console.error('Lỗi đọc file:', err);
      setFileError(err.message || 'Có lỗi xảy ra khi đọc file Excel.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeFile = (type) => {
    setFiles((prev) => ({ ...prev, [type]: null }));
    setData((prev) => ({ ...prev, [type]: [] }));
    setDiagnostics((prev) => prev.filter((entry) => entry.kind !== type));
    setFileError('');
  };

  // --- Reconciliation Logic ---
  const results = useMemo(() => {
    if (!data['511'].length && !data['33311'].length && !data.br.length) return null;
    return reconcileAccountingData(data);
  }, [data]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const exportExcel = async () => {
    if (!results) return;
    setFileError('');
    try {
      await exportReconcileWorkbook(results, { diagnostics });
    } catch (error) {
      console.error('Lỗi xuất Excel:', error);
      setFileError(error.message || 'Không xuất được file Excel.');
    }
  };

  const renderFileCard = (type, title, description) => {
    const file = files[type];
    const rowCount = data[type].length;

    return (
      <div
        className={`p-space-4 rounded-xl border transition-all ${
          file
            ? 'border-secondary/40 bg-secondary-container/10'
            : 'border-border-subtle/40 bg-surface-container-low'
        }`}
      >
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className={file ? 'text-secondary' : 'text-outline'} size={20} />
            <h3 className="font-title-sm text-title-sm text-on-surface font-semibold">{title}</h3>
          </div>
          {file && (
            <button
              type="button"
              onClick={() => removeFile(type)}
              className="text-on-surface-variant hover:text-error transition-colors p-1 cursor-pointer"
              title="Xóa tệp"
            >
              <FileX size={16} />
            </button>
          )}
        </div>

        {file ? (
          <div>
            <p className="text-body-sm text-secondary font-mono truncate" title={file.name}>
              {file.name}
            </p>
            <p className="text-label-sm text-on-surface-variant mt-1">Đã nạp {rowCount.toLocaleString('vi-VN')} dòng dữ liệu</p>
          </div>
        ) : (
          <p className="text-body-sm text-on-surface-variant text-[12px]">{description}</p>
        )}
      </div>
    );
  };

  const renderTable = (reportData, type) => {
    return (
      <div className="overflow-x-auto rounded-xl border border-border-subtle/40 bg-surface-container-lowest mt-4 shadow-sm">
        <table className="w-full text-sm text-left font-body-sm">
          <thead className="text-xs text-on-surface-variant uppercase bg-surface-container-low border-b border-border-subtle/40">
            <tr>
              <th className="px-4 py-3 font-semibold">Số HĐ</th>
              <th className="px-4 py-3 text-right font-semibold">{type === '511' ? '511 (Có)' : '33311 (Tổng)'}</th>
              {type === '33311' && <th className="px-4 py-3 text-right font-semibold">VAT Tặng</th>}
              <th className="px-4 py-3 text-right font-semibold">BR ({type === '511' ? 'Chưa thuế' : 'Thuế'})</th>
              <th className="px-4 py-3 text-right font-semibold">Chênh lệch</th>
              <th className="px-4 py-3 text-center font-semibold">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle/20">
            {reportData.map((row, idx) => (
              <tr key={`${row.invoice}-${idx}`} className="hover:bg-surface-container/50 transition-colors">
                <td className="px-4 py-3 font-mono font-medium text-on-surface">{row.invoice}</td>
                <td className="px-4 py-3 text-right text-on-surface font-mono">
                  {type === '511' ? formatCurrency(row.val511) : formatCurrency(row.val33311)}
                </td>
                {type === '33311' && (
                  <td className="px-4 py-3 text-right text-on-surface-variant font-mono">
                    {row.vatTang > 0 ? formatCurrency(row.vatTang) : '-'}
                  </td>
                )}
                <td className="px-4 py-3 text-right text-on-surface font-mono">{formatCurrency(row.valBR)}</td>
                <td
                  className={`px-4 py-3 text-right font-mono font-semibold ${
                    row.diff === 0 ? 'text-secondary' : 'text-error'
                  }`}
                >
                  {formatCurrency(row.diff)}
                </td>
                <td className="px-4 py-3 text-center">
                  {row.status === 'MATCH' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-label-sm font-semibold bg-secondary-container/20 text-secondary">
                      Khớp
                    </span>
                  )}
                  {row.status === 'DIFF' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-label-sm font-semibold bg-error-container/20 text-error">
                      Lệch
                    </span>
                  )}
                  {row.status === 'MISSING_BR' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-label-sm font-semibold bg-tertiary-container/20 text-tertiary">
                      Thiếu BR
                    </span>
                  )}
                  {row.status === 'MISSING_LEDGER' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-label-sm font-semibold bg-tertiary-container/20 text-tertiary">
                      Thiếu sổ
                    </span>
                  )}
                  {row.needsReview && (
                    <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded text-label-sm font-semibold bg-amber-500/20 text-amber-300">
                      Cần xác nhận
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {reportData.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-outline font-body-sm">
                  Không có dữ liệu đối chiếu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full text-on-surface max-w-[1240px] mx-auto">
      {/* BREADCRUMB */}
      <nav className="flex items-center gap-space-2 text-on-surface-variant font-body-sm text-body-sm mb-space-4">
        <a href="#" className="hover:text-primary transition-colors flex items-center gap-space-1">
          <span className="material-symbols-outlined text-[16px]">home</span>
          <span>Trang chủ</span>
        </a>
        <span className="text-outline">/</span>
        <a href="#" className="hover:text-primary transition-colors">
          Excel &amp; Hóa đơn
        </a>
        <span className="text-outline">/</span>
        <span className="text-on-surface font-title-sm text-title-sm">
          {displayLang === 'en' ? 'Accounting Reconciliation' : 'Đối Chiếu Kế Toán'}
        </span>
      </nav>

      {/* TOOL HEADER */}
      <div className="flex flex-col gap-space-4 pb-space-6 border-b border-border-subtle/40 mb-space-6">
        <div className="flex flex-wrap items-center justify-between gap-space-4">
          <div className="flex items-center gap-space-3">
            <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary-container shadow-sm">
              <Calculator className="w-7 h-7 text-primary-container" />
            </div>
            <div className="flex flex-col">
              <div className="flex flex-wrap items-center gap-space-2">
                <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
                  {displayLang === 'en' ? 'Accounting Reconciliation' : 'Đối Chiếu Kế Toán (511, 33311, BR)'}
                </h1>
              </div>
            </div>
          </div>
        </div>

        <p className="font-body-md text-body-md text-on-surface-variant max-w-4xl">
          {displayLang === 'en'
            ? 'Compare revenue and VAT between internal ledgers (511, 33311) and tax authority invoices (BR) with zero server upload.'
            : 'Tự động đối chiếu chênh lệch doanh thu và thuế GTGT giữa sổ kế toán nội bộ (TK 511, TK 33311) và bảng kê hóa đơn thuế (BR). Phát hiện ngay các hóa đơn thiếu, lệch số tiền hoặc chưa hạch toán.'}
        </p>
        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-secondary shrink-0" />
          <span>Xử lý trực tiếp trên trình duyệt — tệp không được tải lên máy chủ.</span>
        </div>
      </div>

      {/* ADVISORY ALERT */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-space-3 text-body-sm text-amber-200 mb-space-4 flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
        <span>Kết quả chỉ mang tính tham khảo kỹ thuật. Dữ liệu được xử lý cục bộ trên trình duyệt và cần kế toán kiểm tra đối chiếu trước khi lập báo cáo tài chính chính thức.</span>
      </div>

      {/* ERROR NOTICE */}
      {fileError && (
        <div className="rounded-xl border border-error/30 bg-error-container/20 p-space-3 text-body-sm text-error mb-space-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-error shrink-0" />
          <span>{fileError}</span>
        </div>
      )}

      {/* UPLOAD SECTION CARD */}
      <div className="bg-surface-container border border-border-subtle/40 rounded-xl p-space-6 mb-space-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-space-4 pb-space-4 border-b border-border-subtle/30">
          <div>
            <h2 className="font-title-sm text-title-sm text-on-surface font-bold flex items-center gap-2">
              <Upload size={20} className="text-primary-container" />
              {displayLang === 'en' ? 'Upload Accounting Workbooks' : 'Tải Lên 3 File Kế Toán'}
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
              Chọn cùng lúc 3 file: Sổ chi tiết 511, Sổ chi tiết 33311 và Bảng kê hóa đơn (BR)
            </p>
            <p className="font-label-sm text-label-sm text-outline mt-0.5">
              Hỗ trợ .xlsx, .xls • Tối đa 20 MiB/file, tổng 60 MiB • Xử lý hoàn toàn trong bộ nhớ RAM
            </p>
          </div>

          <div className="relative shrink-0">
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <button
              type="button"
              className="px-space-4 py-space-3 bg-primary-container hover:bg-brand-cyan-bright text-on-primary-container font-title-sm text-title-sm font-bold rounded-lg shadow transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Upload size={18} />
              {isProcessing ? 'Đang phân tích...' : 'Chọn 3 File Excel'}
            </button>
          </div>
        </div>

        {/* 3 File Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-4">
          {renderFileCard('511', 'Sổ Doanh Thu (TK 511)', 'Sổ chi tiết doanh thu bán hàng & dịch vụ TK 511')}
          {renderFileCard('33311', 'Sổ Thuế GTGT (TK 33311)', 'Sổ chi tiết thuế GTGT đầu ra phải nộp TK 33311')}
          {renderFileCard('br', 'Bảng Kê Hóa Đơn (BR)', 'File bảng kê hóa đơn thuế chứa sheet GTGT & MTT')}
        </div>

        {/* Diagnostics Table */}
        {diagnostics.length > 0 && (
          <div className="mt-space-5 rounded-xl border border-border-subtle/40 bg-surface-container-low overflow-hidden">
            <div className="px-space-4 py-space-2 border-b border-border-subtle/40 flex items-center gap-2 bg-surface-container">
              <AlertCircle size={15} className="text-primary-container" />
              <h4 className="font-label-sm text-label-sm font-bold uppercase tracking-wider text-on-surface">
                Chi tiết các Sheet &amp; Dòng dữ liệu đã đọc
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-body-sm">
                <thead className="text-on-surface-variant bg-surface-container/60 border-b border-border-subtle/30">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">Tên File</th>
                    <th className="px-3 py-2 text-left font-semibold">Tên Sheet</th>
                    <th className="px-3 py-2 text-center font-semibold">Dòng tiêu đề</th>
                    <th className="px-3 py-2 text-center font-semibold">Số dòng đọc được</th>
                    <th className="px-3 py-2 text-left font-semibold">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle/20">
                  {diagnostics.map((entry, index) => (
                    <tr key={`${entry.sourceFile}-${entry.sourceSheet}-${index}`}>
                      <td className="px-3 py-2 text-on-surface font-mono max-w-[16rem] truncate" title={entry.sourceFile}>
                        {entry.sourceFile}
                      </td>
                      <td className="px-3 py-2 text-on-surface-variant">{entry.sourceSheet || '-'}</td>
                      <td className="px-3 py-2 text-center text-on-surface-variant font-mono">{entry.headerRow ?? '-'}</td>
                      <td
                        className={`px-3 py-2 text-center font-mono font-semibold ${
                          entry.ok ? 'text-secondary' : 'text-error'
                        }`}
                      >
                        {entry.rowCount ?? 0}
                      </td>
                      <td className="px-3 py-2 text-on-surface-variant">{entry.reason || 'Đọc thành công'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* RESULTS SECTION CARD */}
      {results && (
        <div className="bg-surface-container border border-border-subtle/40 rounded-xl overflow-hidden shadow-sm mb-space-12">
          {/* Header */}
          <div className="p-space-4 sm:p-space-6 border-b border-border-subtle/40 flex flex-wrap justify-between items-center gap-4 bg-surface-container-high/40">
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold flex items-center gap-2">
              <Calculator size={22} className="text-primary-container" />
              Kết Quả Đối Chiếu 3 Chiều
            </h2>
            <button
              type="button"
              onClick={exportExcel}
              className="px-space-4 py-space-2 bg-brand-emerald-deep hover:bg-secondary-container text-white font-title-sm text-title-sm font-bold rounded-lg shadow flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Download size={16} />
              Xuất Báo Cáo Excel (.xlsx)
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-border-subtle/40 px-space-4 bg-surface-container-low/50">
            <button
              type="button"
              onClick={() => setActiveTab('summary')}
              className={`px-space-4 py-space-3 font-title-sm text-title-sm border-b-2 transition-colors cursor-pointer ${
                activeTab === 'summary'
                  ? 'border-primary-container text-primary-container font-bold'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Tổng hợp đối chiếu
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('511')}
              className={`px-space-4 py-space-3 font-title-sm text-title-sm border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === '511'
                  ? 'border-primary-container text-primary-container font-bold'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span>Đối chiếu Doanh thu 511</span>
              {results.summary.unmatched511 > 0 && (
                <span className="bg-error-container/20 text-error text-label-sm px-2 py-0.5 rounded-full font-semibold">
                  {results.summary.unmatched511} lệch
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('33311')}
              className={`px-space-4 py-space-3 font-title-sm text-title-sm border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === '33311'
                  ? 'border-primary-container text-primary-container font-bold'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span>Đối chiếu Thuế GTGT 33311</span>
              {results.summary.unmatched33311 > 0 && (
                <span className="bg-error-container/20 text-error text-label-sm px-2 py-0.5 rounded-full font-semibold">
                  {results.summary.unmatched33311} lệch
                </span>
              )}
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-space-6">
            {activeTab === 'summary' && (
              <div className="space-y-space-6">
                {/* 3 Summary Metric Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-space-4">
                  <div className="bg-surface-container-low border border-border-subtle/40 rounded-xl p-space-4">
                    <h4 className="text-on-surface-variant font-label-sm text-label-sm font-medium mb-2">
                      TỔNG SỐ HÓA ĐƠN PHÁT HIỆN
                    </h4>
                    <div className="font-headline-lg text-headline-lg font-mono font-bold text-on-surface">
                      {results.summary.total.toLocaleString('vi-VN')}
                    </div>
                  </div>

                  <div className="bg-surface-container-low border border-border-subtle/40 rounded-xl p-space-4">
                    <h4 className="text-on-surface-variant font-label-sm text-label-sm font-medium mb-2">
                      LỆCH DOANH THU (511)
                    </h4>
                    <div className="flex items-baseline gap-2">
                      <div
                        className={`font-headline-lg text-headline-lg font-mono font-bold ${
                          results.summary.unmatched511 > 0 ? 'text-error' : 'text-secondary'
                        }`}
                      >
                        {results.summary.unmatched511}
                      </div>
                      <div className="font-label-sm text-label-sm text-outline">/ {results.report511.length} HĐ</div>
                    </div>
                  </div>

                  <div className="bg-surface-container-low border border-border-subtle/40 rounded-xl p-space-4">
                    <h4 className="text-on-surface-variant font-label-sm text-label-sm font-medium mb-2">
                      LỆCH THUẾ GTGT (33311)
                    </h4>
                    <div className="flex items-baseline gap-2">
                      <div
                        className={`font-headline-lg text-headline-lg font-mono font-bold ${
                          results.summary.unmatched33311 > 0 ? 'text-error' : 'text-secondary'
                        }`}
                      >
                        {results.summary.unmatched33311}
                      </div>
                      <div className="font-label-sm text-label-sm text-outline">/ {results.report33311.length} HĐ</div>
                    </div>
                  </div>
                </div>

                {/* Warnings banner if any discrepancies */}
                {(results.summary.missingInBR > 0 ||
                  results.summary.missingInLedger > 0 ||
                  results.summary.needsReview > 0) && (
                  <div className="bg-tertiary-container/15 border border-tertiary/30 rounded-xl p-space-4 flex items-start gap-3">
                    <AlertCircle className="text-tertiary mt-0.5 shrink-0" size={22} />
                    <div>
                      <h4 className="font-title-sm text-title-sm text-tertiary font-bold">Cảnh báo thiếu sót hóa đơn</h4>
                      <ul className="mt-2 space-y-1 font-body-sm text-body-sm text-on-surface">
                        {results.summary.missingInBR > 0 && (
                          <li>
                            • Có <strong className="font-mono text-tertiary">{results.summary.missingInBR}</strong> hóa đơn đã hạch toán nhưng không có trên bảng kê BR.
                          </li>
                        )}
                        {results.summary.missingInLedger > 0 && (
                          <li>
                            • Có <strong className="font-mono text-tertiary">{results.summary.missingInLedger}</strong> hóa đơn trên bảng kê BR nhưng chưa được hạch toán trong sổ cái.
                          </li>
                        )}
                        {results.summary.needsReview > 0 && (
                          <li>
                            • Có <strong className="font-mono text-tertiary">{results.summary.needsReview}</strong> hóa đơn có nhiều dòng trùng số và cần kế toán xác nhận thêm.
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === '511' && renderTable(results.report511, '511')}

            {activeTab === '33311' && (
              <>
                <div className="bg-surface-container-low border border-border-subtle/40 rounded-xl p-space-3 mb-space-4 text-body-sm text-on-surface-variant flex items-center gap-2">
                  <AlertCircle size={16} className="text-primary-container shrink-0" />
                  <span>
                    <strong>Quy ước:</strong> Cột &quot;33311 (Tổng)&quot; là tổng số thuế của tất cả các dòng cùng một số hóa đơn. &quot;VAT Tặng&quot; là phần thuế bóc tách từ các dòng có diễn giải chứa từ khóa tặng/khuyến mại.
                  </span>
                </div>
                {renderTable(results.report33311, '33311')}
              </>
            )}
          </div>
        </div>
      )}


    </div>
  );
}
