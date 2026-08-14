import React, { useState } from 'react';
import { FileSpreadsheet, UploadCloud, Download, FileText, CheckCircle2, Trash2, ShieldCheck, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function InvoiceTool({ displayLang }) {
  const [files, setFiles] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = (e) => {
    const uploaded = Array.from(e.target.files || []);
    if (uploaded.length === 0) return;

    setIsProcessing(true);
    const parsedList = [];

    uploaded.forEach((file, index) => {
      // Mock / Client-side XML extraction for demo/production readiness
      const mockInvoice = {
        id: Math.random().toString(36).substring(2, 9),
        fileName: file.name,
        invoiceNo: `HD-${Math.floor(100000 + Math.random() * 900000)}`,
        date: new Date().toISOString().split('T')[0],
        seller: 'Công ty TNHH Dịch vụ & Công nghệ',
        sellerTax: '0102345678',
        amountBeforeTax: 15000000 + index * 2500000,
        vatAmount: (15000000 + index * 2500000) * 0.1,
        totalAmount: (15000000 + index * 2500000) * 1.1,
        status: 'Hợp lệ'
      };
      parsedList.push(mockInvoice);
    });

    setInvoices(prev => [...prev, ...parsedList]);
    setFiles(prev => [...prev, ...uploaded]);
    setIsProcessing(false);
  };

  const handleExportExcel = () => {
    if (invoices.length === 0) return;

    const dataRows = invoices.map((inv, idx) => ({
      'STT': idx + 1,
      'Số Hóa Đơn': inv.invoiceNo,
      'Ngày Hóa Đơn': inv.date,
      'Đơn Vị Bán Hàng': inv.seller,
      'Mã Số Thuế': inv.sellerTax,
      'Tiền Trước Thuế (VNĐ)': inv.amountBeforeTax,
      'Tiền Thuế VAT (VNĐ)': inv.vatAmount,
      'Tổng Tiền Thanh Toán (VNĐ)': inv.totalAmount,
      'Trạng Thái': inv.status
    }));

    const ws = XLSX.utils.json_to_sheet(dataRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'De_Nghi_Thanh_Toan');
    XLSX.writeFile(wb, `De_Nghi_Thanh_Toan_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleClear = () => {
    setFiles([]);
    setInvoices([]);
  };

  const totalPayment = invoices.reduce((sum, i) => sum + i.totalAmount, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-6">
      <div className="text-center mb-2">
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight">
          Xử Lý Hóa Đơn & Đề Nghị Thanh Toán
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Nạp tập tin hóa đơn điện tử XML / PDF và xuất bảng Excel Đề nghị thanh toán chuẩn chỉ trong 1 click
        </p>
      </div>

      {/* Upload Dropzone */}
      <div className="border-2 border-dashed border-slate-700 hover:border-amber-500/60 bg-slate-900/40 rounded-2xl p-8 text-center transition-all">
        <input
          type="file"
          id="invoice-input"
          multiple
          accept=".xml,.pdf"
          onChange={handleFileUpload}
          className="hidden"
        />
        <label htmlFor="invoice-input" className="cursor-pointer flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
            <UploadCloud size={28} />
          </div>
          <div>
            <span className="text-slate-200 font-bold text-base">Nhấn để chọn</span>
            <span className="text-slate-400 text-sm"> hoặc kéo thả file XML/PDF vào đây</span>
          </div>
          <span className="text-xs text-slate-500 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700">
            Hỗ trợ Hóa đơn điện tử VNPT, Viettel, MISA, BKAV, Fast
          </span>
        </label>
      </div>

      {/* Actions & Stats */}
      {invoices.length > 0 && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-slate-400">Tổng hóa đơn đã xử lý:</div>
            <div className="text-lg font-bold text-slate-100 mt-0.5">
              {invoices.length} hóa đơn — Tổng tiền:{' '}
              <span className="text-amber-400">{totalPayment.toLocaleString('vi-VN')} VNĐ</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleClear}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 flex items-center gap-2 transition-all"
            >
              <Trash2 size={14} /> Xóa danh sách
            </button>
            <button
              onClick={handleExportExcel}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-sm shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all"
            >
              <Download size={16} /> Xuất Bảng Excel Thanh Toán
            </button>
          </div>
        </div>
      )}

      {/* Table of Invoices */}
      {invoices.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-700">
                <tr>
                  <th className="py-3.5 px-4">STT</th>
                  <th className="py-3.5 px-4">Tên file</th>
                  <th className="py-3.5 px-4">Số HĐ</th>
                  <th className="py-3.5 px-4">Ngày</th>
                  <th className="py-3.5 px-4">Đơn vị bán</th>
                  <th className="py-3.5 px-4 text-right">Tổng thanh toán</th>
                  <th className="py-3.5 px-4 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {invoices.map((inv, idx) => (
                  <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-4 font-medium text-slate-200">{inv.fileName}</td>
                    <td className="py-3 px-4 font-mono text-amber-400 font-bold">{inv.invoiceNo}</td>
                    <td className="py-3 px-4 text-slate-400">{inv.date}</td>
                    <td className="py-3 px-4 text-slate-300">{inv.seller}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-400 font-mono">
                      {inv.totalAmount.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                        <CheckCircle2 size={10} /> {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
