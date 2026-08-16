import React, { useState, useRef, useMemo } from 'react';
import { MiniAppHeader, MiniAppLayout } from './shared/MiniAppLayout.jsx';
import { Upload, FileSpreadsheet, AlertCircle, Download, FileX, Calculator } from 'lucide-react';
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
   * (blankrows mặc định) để chỉ số mảng khớp đúng số dòng thật trong Excel —
   * bằng chứng "dòng N" phải chỉ đúng dòng người dùng mở ra xem.
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
      setFileError(errors.join(' \u2022 '));
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

      // Cùng một pipeline với bộ golden test, nên kết quả kế toán đã duyệt
      // chính là kết quả hiển thị ở đây.
      const outcome = reconcileWorkbooks(workbooks);

      setFiles((current) => ({ ...current, ...outcome.files }));
      setData((current) => ({
        511: outcome.data['511'].length > 0 ? outcome.data['511'] : current['511'],
        33311: outcome.data['33311'].length > 0 ? outcome.data['33311'] : current['33311'],
        br: outcome.data.br.length > 0 ? outcome.data.br : current.br,
      }));
      setDiagnostics(outcome.diagnostics);
      setFileError(errors.join(' \u2022 '));
    } catch (err) {
      console.error('L\u1ed7i \u0111\u1ecdc file:', err);
      setFileError(err.message || 'C\u00f3 l\u1ed7i x\u1ea3y ra khi \u0111\u1ecdc file Excel.');
    } finally {
      setIsProcessing(false);
      // Reset input so the same files can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeFile = (type) => {
    setFiles(prev => ({ ...prev, [type]: null }));
    setData(prev => ({ ...prev, [type]: [] }));
    setDiagnostics(prev => prev.filter((entry) => entry.kind !== type));
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
      <div className={`p-4 rounded-xl border ${file ? 'border-green-500 bg-green-500/10' : 'border-slate-700 bg-slate-800'}`}>
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className={file ? "text-green-400" : "text-slate-400"} size={20} />
            <h3 className="font-medium text-slate-200">{title}</h3>
          </div>
          {file && (
            <button onClick={() => removeFile(type)} className="text-slate-400 hover:text-red-400 transition-colors">
              <FileX size={16} />
            </button>
          )}
        </div>
        
        {file ? (
          <div>
            <p className="text-sm text-green-300 truncate" title={file.name}>{file.name}</p>
            <p className="text-xs text-slate-400 mt-1">Đã nạp {rowCount} dòng dữ liệu</p>
          </div>
        ) : (
          <p className="text-xs text-slate-400">{description}</p>
        )}
      </div>
    );
  };

  const renderTable = (reportData, type) => {
    return (
      <div className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-900 mt-4">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-400 uppercase bg-slate-800 border-b border-slate-700">
            <tr>
              <th className="px-4 py-3">Số HĐ</th>
              <th className="px-4 py-3 text-right">{type === '511' ? '511 (Có)' : '33311 (Tổng)'}</th>
              {type === '33311' && <th className="px-4 py-3 text-right">VAT Tặng</th>}
              <th className="px-4 py-3 text-right">BR ({type === '511' ? 'Chưa thuế' : 'Thuế'})</th>
              <th className="px-4 py-3 text-right">Chênh lệch</th>
              <th className="px-4 py-3 text-center">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {reportData.map((row, idx) => (
              <tr key={`${row.invoice}-${idx}`} className="border-b border-slate-800 hover:bg-slate-800/50">
                <td className="px-4 py-3 font-medium text-slate-200">{row.invoice}</td>
                <td className="px-4 py-3 text-right text-slate-300">
                  {type === '511' ? formatCurrency(row.val511) : formatCurrency(row.val33311)}
                </td>
                {type === '33311' && (
                  <td className="px-4 py-3 text-right text-slate-400">
                    {row.vatTang > 0 ? formatCurrency(row.vatTang) : '-'}
                  </td>
                )}
                <td className="px-4 py-3 text-right text-slate-300">{formatCurrency(row.valBR)}</td>
                <td className={`px-4 py-3 text-right font-medium ${row.diff === 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(row.diff)}
                </td>
                <td className="px-4 py-3 text-center">
                  {row.status === 'MATCH' && <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-900/50 text-green-400">Khớp</span>}
                  {row.status === 'DIFF' && <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-900/50 text-red-400">Lệch</span>}
                  {row.status === 'MISSING_BR' && <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-900/50 text-orange-400">Thiếu BR</span>}
                  {row.status === 'MISSING_LEDGER' && <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-900/50 text-orange-400">Thiếu sổ</span>}
                  {row.needsReview && <span className="ml-1 inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-amber-900/50 text-amber-300">Cần xác nhận</span>}
                </td>
              </tr>
            ))}
            {reportData.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">Không có dữ liệu đối chiếu</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <MiniAppLayout gap="normal">
      <MiniAppHeader
        title={displayLang === 'en' ? 'Accounting Reconciliation' : 'Đối Chiếu Kế Toán'}
        subtitle={displayLang === 'en'
          ? 'Compare revenue and VAT between internal ledgers (511, 33311) and tax authority invoices (BR).'
          : 'Tự động đối chiếu chênh lệch doanh thu và thuế GTGT giữa sổ kế toán nội bộ và bảng kê hóa đơn thuế.'}
        badge={displayLang === 'en' ? '100% Client-Side • Secure' : '100% Client-Side • Bảo mật'}
        tone="blue"
      />
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
        Kết quả chỉ mang tính tham khảo. Dữ liệu được xử lý trên trình duyệt và cần kế toán kiểm tra trước khi sử dụng.
      </div>
      {fileError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {fileError}
        </div>
      )}
      
      {/* Upload Section */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Upload size={24} className="text-blue-400" />
              {displayLang === 'en' ? 'Upload Files' : 'Tải lên File Kế Toán'}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Chọn cùng lúc 3 file: Sổ 511, Sổ 33311 và Bảng kê hóa đơn (BR)
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Tối đa 20 MiB/file, tổng 60 MiB; xử lý cục bộ, không tải lên máy chủ.
            </p>
          </div>
          
          <div className="relative">
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-2">
              <Upload size={18} />
              {isProcessing ? 'Đang đọc...' : 'Chọn 3 File Excel'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {renderFileCard('511', 'Sổ Doanh Thu (511)', 'Sổ chi tiết tài khoản 511')}
          {renderFileCard('33311', 'Sổ Thuế (33311)', 'Sổ chi tiết tài khoản 33311')}
          {renderFileCard('br', 'Bảng Kê (BR)', 'File BR chứa sheet GTGT & MTT')}
        </div>

        {diagnostics.length > 0 && (
          <div className="mt-5 rounded-xl border border-slate-700 bg-slate-900/60 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-700/80 flex items-center gap-2">
              <AlertCircle size={15} className="text-slate-400" />
              <h4 className="text-xs font-bold uppercase tracking-wide text-slate-300">
                Công cụ đã đọc gì từ file của bạn
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-slate-400 bg-slate-800/60">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">File</th>
                    <th className="px-3 py-2 text-left font-semibold">Sheet</th>
                    <th className="px-3 py-2 text-center font-semibold">Dòng tiêu đề</th>
                    <th className="px-3 py-2 text-center font-semibold">Số dòng đọc được</th>
                    <th className="px-3 py-2 text-left font-semibold">Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {diagnostics.map((entry, index) => (
                    <tr key={`${entry.sourceFile}-${entry.sourceSheet}-${index}`} className="border-t border-slate-800">
                      <td className="px-3 py-2 text-slate-300 max-w-[16rem] truncate" title={entry.sourceFile}>
                        {entry.sourceFile}
                      </td>
                      <td className="px-3 py-2 text-slate-400">{entry.sourceSheet || '-'}</td>
                      <td className="px-3 py-2 text-center text-slate-400">{entry.headerRow ?? '-'}</td>
                      <td className={`px-3 py-2 text-center font-semibold ${entry.ok ? 'text-green-400' : 'text-red-400'}`}>
                        {entry.rowCount ?? 0}
                      </td>
                      <td className="px-3 py-2 text-slate-400">{entry.reason || 'Đọc thành công'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Results Section */}
      {results && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/80">
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Calculator size={24} className="text-indigo-400" />
              Kết quả đối chiếu
            </h2>
            <button 
              onClick={exportExcel}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-emerald-500/20 flex items-center gap-2"
            >
              <Download size={16} />
              Xuất Excel
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-700 px-4">
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'summary' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              Tổng hợp
            </button>
            <button
              onClick={() => setActiveTab('511')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === '511' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              Đối chiếu 511
              {results.summary.unmatched511 > 0 && (
                <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full">{results.summary.unmatched511} lệch</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('33311')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === '33311' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              Đối chiếu 33311
              {results.summary.unmatched33311 > 0 && (
                <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full">{results.summary.unmatched33311} lệch</span>
              )}
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'summary' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Summary Card 1 */}
                  <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
                    <h4 className="text-slate-400 text-sm font-medium mb-4">Tổng số hóa đơn phát hiện</h4>
                    <div className="text-4xl font-bold text-slate-100">{results.summary.total}</div>
                  </div>
                  
                  {/* Summary Card 2 */}
                  <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
                    <h4 className="text-slate-400 text-sm font-medium mb-4">Lệch Doanh Thu (511)</h4>
                    <div className="flex items-end gap-3">
                      <div className={`text-4xl font-bold ${results.summary.unmatched511 > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {results.summary.unmatched511}
                      </div>
                      <div className="text-slate-500 mb-1">/ {results.report511.length} HĐ</div>
                    </div>
                  </div>

                  {/* Summary Card 3 */}
                  <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
                    <h4 className="text-slate-400 text-sm font-medium mb-4">Lệch Thuế (33311)</h4>
                    <div className="flex items-end gap-3">
                      <div className={`text-4xl font-bold ${results.summary.unmatched33311 > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {results.summary.unmatched33311}
                      </div>
                      <div className="text-slate-500 mb-1">/ {results.report33311.length} HĐ</div>
                    </div>
                  </div>
                </div>

                {(results.summary.missingInBR > 0 || results.summary.missingInLedger > 0 || results.summary.needsReview > 0) && (
                  <div className="bg-orange-950/30 border border-orange-900/50 rounded-xl p-5 flex items-start gap-4">
                    <AlertCircle className="text-orange-500 mt-0.5" size={24} />
                    <div>
                      <h4 className="text-orange-400 font-medium text-lg">Cảnh báo thiếu sót hóa đơn</h4>
                      <ul className="mt-2 space-y-1 text-slate-300">
                        {results.summary.missingInBR > 0 && (
                          <li>• Có <strong>{results.summary.missingInBR}</strong> hóa đơn đã hạch toán nhưng không có trên bảng kê BR.</li>
                        )}
                        {results.summary.missingInLedger > 0 && (
                          <li>• Có <strong>{results.summary.missingInLedger}</strong> hóa đơn trên bảng kê BR nhưng chưa được hạch toán (hoặc hạch toán sai số HĐ).</li>
                        )}
                        {results.summary.needsReview > 0 && (
                          <li>• Có <strong>{results.summary.needsReview}</strong> số hóa đơn có nhiều bản ghi BR và cần xác nhận trước khi kết luận.</li>
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
                <div className="bg-indigo-900/20 border border-indigo-900/50 rounded-lg p-4 mb-4 text-sm text-indigo-300">
                  <strong>Lưu ý:</strong> Cột "33311 (Tổng)" là tổng của tất cả các dòng cùng một số hóa đơn. "VAT Tặng" là phần thuế bóc tách từ các dòng có diễn giải chứa từ "tặng".
                </div>
                {renderTable(results.report33311, '33311')}
              </>
            )}
          </div>
        </div>
      )}
    </MiniAppLayout>
  );
}
