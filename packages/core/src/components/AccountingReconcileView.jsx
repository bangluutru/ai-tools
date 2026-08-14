import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Download, FileX, Calculator, ArrowRight, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';

// Utility to normalize invoice numbers (strip leading zeros)
const normalizeInvoice = (inv) => {
  if (!inv) return '';
  return String(inv).replace(/^0+/, '').trim();
};

export default function AccountingReconcileView({ displayLang = 'vi' }) {
  const [files, setFiles] = useState({ 511: null, 33311: null, br: null });
  const [data, setData] = useState({ 511: [], 33311: [], br: [] });
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');
  
  const fileInputRef = useRef(null);

  // Auto-detect file type based on contents
  const processExcelFile = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          resolve(workbook);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileUpload = async (event) => {
    const uploadedFiles = Array.from(event.target.files);
    if (uploadedFiles.length === 0) return;

    setIsProcessing(true);
    
    const newFiles = { ...files };
    const newData = { ...data };

    try {
      for (const file of uploadedFiles) {
        const wb = await processExcelFile(file);
        const firstSheetName = wb.SheetNames[0];
        const firstSheet = wb.Sheets[firstSheetName];
        
        // Convert to array of arrays to check headers
        const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, blankrows: false });
        
        if (rows.length < 2) continue;

        const isBR = firstSheetName.includes('BR');
        
        // Detect file type
        let fileType = null;
        if (isBR) {
          fileType = 'br';
        } else {
          // Check row 1 or 2 for "511" or "33311"
          const headerText = (rows[0]?.join(' ') || '') + ' ' + (rows[1]?.join(' ') || '');
          if (headerText.includes('511')) fileType = '511';
          else if (headerText.includes('33311')) fileType = '33311';
        }

        if (fileType) {
          newFiles[fileType] = file;
          
          if (fileType === '511' || fileType === '33311') {
            // Sổ chi tiết có header ở dòng 4 (index 3)
            // Cột D (index 3) là Số hoá đơn, Cột H (index 7) là Phát sinh Có
            // Cột E (index 4) là Diễn giải (chỉ dùng cho 33311 để check VAT hàng tặng)
            const extractedData = [];
            for (let i = 4; i < rows.length; i++) {
              const row = rows[i];
              if (!row || row.length < 8) continue;
              
              const invoiceRaw = row[3];
              const valueRaw = row[7];
              const descRaw = row[4] || '';
              
              if (invoiceRaw && valueRaw !== undefined) {
                extractedData.push({
                  invoice: normalizeInvoice(invoiceRaw),
                  originalInvoice: invoiceRaw,
                  value: parseFloat(valueRaw) || 0,
                  desc: String(descRaw)
                });
              }
            }
            newData[fileType] = extractedData;
            
          } else if (fileType === 'br') {
            // BR có 2 sheets
            const brData = [];
            
            // Sheet 1: BR GTGT
            const gtgtSheet = wb.Sheets[wb.SheetNames[0]];
            const gtgtRows = XLSX.utils.sheet_to_json(gtgtSheet, { header: 1, blankrows: false });
            for (let i = 5; i < gtgtRows.length; i++) {
              const row = gtgtRows[i];
              // D(3) = Hóa đơn, K(10) = Chưa thuế, L(11) = Thuế
              if (!row || !row[3]) continue;
              
              const invoice = normalizeInvoice(row[3]);
              if (invoice && invoice !== 'undefined') {
                brData.push({
                  invoice,
                  originalInvoice: row[3],
                  type: 'GTGT',
                  chuaThue: parseFloat(row[10]) || 0,
                  thue: parseFloat(row[11]) || 0
                });
              }
            }

            // Sheet 2: BR MTT (if exists)
            if (wb.SheetNames.length > 1) {
              const mttSheet = wb.Sheets[wb.SheetNames[1]];
              const mttRows = XLSX.utils.sheet_to_json(mttSheet, { header: 1, blankrows: false });
              for (let i = 5; i < mttRows.length; i++) {
                const row = mttRows[i];
                // D(3) = Hóa đơn, L(11) = Chưa thuế, M(12) = Thuế
                if (!row || !row[3]) continue;
                
                const invoice = normalizeInvoice(row[3]);
                if (invoice && invoice !== 'undefined') {
                  brData.push({
                    invoice,
                    originalInvoice: row[3],
                    type: 'MTT',
                    chuaThue: parseFloat(row[11]) || 0,
                    thue: parseFloat(row[12]) || 0
                  });
                }
              }
            }
            
            newData.br = brData;
          }
        }
      }
      
      setFiles(newFiles);
      setData(newData);
    } catch (err) {
      console.error("Lỗi đọc file:", err);
      alert("Có lỗi xảy ra khi đọc file Excel.");
    } finally {
      setIsProcessing(false);
      // Reset input so the same files can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeFile = (type) => {
    setFiles(prev => ({ ...prev, [type]: null }));
    setData(prev => ({ ...prev, [type]: [] }));
  };

  // --- Reconciliation Logic ---
  const results = useMemo(() => {
    if (!data['511'].length && !data['33311'].length && !data.br.length) return null;

    const allInvoices = new Set([
      ...data['511'].map(item => item.invoice),
      ...data['33311'].map(item => item.invoice),
      ...data.br.map(item => item.invoice)
    ]);

    const report511 = [];
    const report33311 = [];
    let summary = {
      total: allInvoices.size,
      matched511: 0,
      unmatched511: 0,
      matched33311: 0,
      unmatched33311: 0,
      missingInBR: 0,
      missingInLedger: 0
    };

    allInvoices.forEach(inv => {
      // Find in BR (should be 1)
      const brMatch = data.br.find(item => item.invoice === inv);
      
      // Find in 511 (should be 1)
      const matches511 = data['511'].filter(item => item.invoice === inv);
      const val511 = matches511.reduce((sum, item) => sum + item.value, 0);
      
      // Find in 33311 (can be multiple)
      const matches33311 = data['33311'].filter(item => item.invoice === inv);
      const val33311 = matches33311.reduce((sum, item) => sum + item.value, 0);
      
      // Check for missing
      const inLedger = matches511.length > 0 || matches33311.length > 0;
      if (inLedger && !brMatch) summary.missingInBR++;
      if (brMatch && !inLedger) summary.missingInLedger++;

      // 511 Reconciliation
      if (matches511.length > 0 || brMatch) {
        const brVal = brMatch ? brMatch.chuaThue : 0;
        const diff = val511 - brVal;
        
        if (diff === 0) summary.matched511++;
        else summary.unmatched511++;

        report511.push({
          invoice: inv,
          val511,
          valBR: brVal,
          diff,
          status: diff === 0 ? 'MATCH' : (brMatch ? 'DIFF' : 'MISSING_BR')
        });
      }

      // 33311 Reconciliation
      if (matches33311.length > 0 || brMatch) {
        const brVal = brMatch ? brMatch.thue : 0;
        const diff = val33311 - brVal;
        const vatTang = matches33311
          .filter(item => item.desc.toLowerCase().includes('tặng'))
          .reduce((sum, item) => sum + item.value, 0);

        if (diff === 0) summary.matched33311++;
        else summary.unmatched33311++;

        report33311.push({
          invoice: inv,
          val33311,
          vatTang,
          valBR: brVal,
          diff,
          status: diff === 0 ? 'MATCH' : (brMatch ? 'DIFF' : 'MISSING_BR')
        });
      }
    });

    return {
      report511: report511.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff)), // Diff first
      report33311: report33311.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff)),
      summary
    };
  }, [data]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const exportExcel = () => {
    if (!results) return;

    const wb = XLSX.utils.book_new();
    
    // Summary Sheet
    const summaryData = [
      ['BÁO CÁO ĐỐI CHIẾU KẾ TOÁN'],
      [],
      ['Tổng số hoá đơn', results.summary.total],
      [],
      ['ĐỐI CHIẾU DOANH THU (511 vs BR)'],
      ['Số hoá đơn khớp', results.summary.matched511],
      ['Số hoá đơn lệch', results.summary.unmatched511],
      [],
      ['ĐỐI CHIẾU THUẾ (33311 vs BR)'],
      ['Số hoá đơn khớp', results.summary.matched33311],
      ['Số hoá đơn lệch', results.summary.unmatched33311],
      [],
      ['CẢNH BÁO THIẾU SÓT'],
      ['Có trên sổ, thiếu trên BR', results.summary.missingInBR],
      ['Có trên BR, thiếu trên sổ', results.summary.missingInLedger]
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Tổng hợp");

    // 511 Sheet
    const ws511 = XLSX.utils.json_to_sheet(results.report511.map(r => ({
      'Số HĐ': r.invoice,
      'Sổ 511 (Phát sinh Có)': r.val511,
      'Bảng kê BR (Chưa thuế)': r.valBR,
      'Chênh lệch': r.diff,
      'Trạng thái': r.status === 'MATCH' ? 'Khớp' : (r.status === 'DIFF' ? 'Lệch' : 'Thiếu trên BR')
    })));
    XLSX.utils.book_append_sheet(wb, ws511, "Đối chiếu 511");

    // 33311 Sheet
    const ws333 = XLSX.utils.json_to_sheet(results.report33311.map(r => ({
      'Số HĐ': r.invoice,
      'Sổ 33311 (Tổng VAT)': r.val33311,
      'Trong đó VAT hàng tặng': r.vatTang,
      'Bảng kê BR (Thuế)': r.valBR,
      'Chênh lệch': r.diff,
      'Trạng thái': r.status === 'MATCH' ? 'Khớp' : (r.status === 'DIFF' ? 'Lệch' : 'Thiếu trên BR')
    })));
    XLSX.utils.book_append_sheet(wb, ws333, "Đối chiếu 33311");

    XLSX.writeFile(wb, "Ket_qua_doi_chieu.xlsx");
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
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      
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

                {(results.summary.missingInBR > 0 || results.summary.missingInLedger > 0) && (
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
    </div>
  );
}
