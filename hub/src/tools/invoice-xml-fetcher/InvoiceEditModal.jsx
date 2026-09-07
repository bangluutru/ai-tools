import React, { useState } from 'react';
import { X, Check, RefreshCw, Globe, Key, Building2, Calendar, FileText, Hash } from 'lucide-react';

export default function InvoiceEditModal({ invoice, onClose, onSave }) {
  const [formData, setFormData] = useState({
    lookupUrl: invoice.lookupUrl || '',
    lookupCode: invoice.lookupCode || '',
    sellerTaxCode: invoice.sellerTaxCode || '',
    sellerName: invoice.sellerName || '',
    invoiceSymbol: invoice.invoiceSymbol || '',
    invoiceNumber: invoice.invoiceNumber || '',
    invoiceDate: invoice.invoiceDate || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-modal-title"
    >
      <div className="w-full max-w-lg bg-surface-card border border-surface-subtle rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-subtle">
          <div>
            <h3 id="edit-modal-title" className="text-lg font-semibold text-content-title">
              Chỉnh Sửa Thông Tin Tra Cứu
            </h3>
            <p className="text-xs text-content-muted truncate max-w-sm">
              {invoice.fileName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-content-muted hover:text-content hover:bg-surface-elevated transition-colors"
            title="Đóng"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-content-muted mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Đường dẫn trang tra cứu (URL)
            </label>
            <input
              type="text"
              name="lookupUrl"
              value={formData.lookupUrl}
              onChange={handleChange}
              placeholder="https://tracuu.vnpt-invoice.com.vn hoặc https://gsm-einvoice.hilo.com.vn/"
              className="w-full px-3.5 py-2 text-sm rounded-lg bg-surface-elevated border border-surface-subtle focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-content font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-content-muted mb-1.5 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-500" />
              Mã tra cứu / Mã bí mật
            </label>
            <input
              type="text"
              name="lookupCode"
              value={formData.lookupCode}
              onChange={handleChange}
              placeholder="Nhập mã tra cứu từ hóa đơn"
              className="w-full px-3.5 py-2 text-sm rounded-lg bg-surface-elevated border border-surface-subtle focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-content font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-content-muted mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-content-muted" />
                Mã số thuế (MST)
              </label>
              <input
                type="text"
                name="sellerTaxCode"
                value={formData.sellerTaxCode}
                onChange={handleChange}
                placeholder="0101234567"
                className="w-full px-3 py-2 text-sm rounded-lg bg-surface-elevated border border-surface-subtle focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-content font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-content-muted mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-content-muted" />
                Ngày hóa đơn
              </label>
              <input
                type="text"
                name="invoiceDate"
                value={formData.invoiceDate}
                onChange={handleChange}
                placeholder="YYYY-MM-DD hoặc DD/MM/YYYY"
                className="w-full px-3 py-2 text-sm rounded-lg bg-surface-elevated border border-surface-subtle focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-content font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-content-muted mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-content-muted" />
                Ký hiệu (Symbol)
              </label>
              <input
                type="text"
                name="invoiceSymbol"
                value={formData.invoiceSymbol}
                onChange={handleChange}
                placeholder="1C26TAA"
                className="w-full px-3 py-2 text-sm rounded-lg bg-surface-elevated border border-surface-subtle focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-content font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-content-muted mb-1.5 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-content-muted" />
                Số hóa đơn
              </label>
              <input
                type="text"
                name="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={handleChange}
                placeholder="12345678"
                className="w-full px-3 py-2 text-sm rounded-lg bg-surface-elevated border border-surface-subtle focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-content font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-content-muted mb-1.5">
              Tên đơn vị bán
            </label>
            <input
              type="text"
              name="sellerName"
              value={formData.sellerName}
              onChange={handleChange}
              placeholder="Tên công ty phát hành hóa đơn"
              className="w-full px-3 py-2 text-sm rounded-lg bg-surface-elevated border border-surface-subtle focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-content"
            />
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-subtle mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-xl text-content-muted hover:text-content hover:bg-surface-elevated transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Cập nhật & Thử lại
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
