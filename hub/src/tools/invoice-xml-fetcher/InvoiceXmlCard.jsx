import React, { useState } from 'react';
import {
  Download,
  ExternalLink,
  Copy,
  Check,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  HelpCircle,
  FileCode,
  Building,
  Calendar,
  Hash,
  Sparkles
} from 'lucide-react';
import { STATUS_TYPES, STATUS_LABELS } from '@ai-tools/core/utils/invoice/xmlFetcher/types.js';

export default function InvoiceXmlCard({ invoice, onDownload, onEdit, onDelete, displayLang = 'vi' }) {
  const [copied, setCopied] = useState(false);
  const [copiedMst, setCopiedMst] = useState(false);

  const handleCopyCode = async (e) => {
    e.stopPropagation();
    if (!invoice.lookupCode) return;
    try {
      await navigator.clipboard.writeText(invoice.lookupCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API is blocked
      const input = document.createElement('input');
      input.value = invoice.lookupCode;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyMst = async (e) => {
    e.stopPropagation();
    if (!invoice.sellerTaxCode) return;
    try {
      await navigator.clipboard.writeText(invoice.sellerTaxCode);
      setCopiedMst(true);
      setTimeout(() => setCopiedMst(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = invoice.sellerTaxCode;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopiedMst(true);
      setTimeout(() => setCopiedMst(false), 2000);
    }
  };

  const getStatusBadge = () => {
    const langKey = displayLang === 'ja' ? 'ja' : displayLang === 'en' ? 'en' : 'vn';
    const label = STATUS_LABELS[invoice.status]?.[langKey] || STATUS_LABELS[invoice.status]?.vn || 'Chưa nhận diện';

    switch (invoice.status) {
      case STATUS_TYPES.READY:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {label}
          </span>
        );
      case STATUS_TYPES.CAPTCHA_REQUIRED:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <ShieldAlert className="w-3.5 h-3.5" />
            {label}
          </span>
        );
      case STATUS_TYPES.MANUAL_REQUIRED:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <ExternalLink className="w-3.5 h-3.5" />
            {label}
          </span>
        );
      case STATUS_TYPES.UNSUPPORTED:
      case STATUS_TYPES.ERROR:
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3.5 h-3.5" />
            {label}
          </span>
        );
    }
  };

  const getProviderColor = () => {
    const id = invoice.providerId || 'generic';
    switch (id) {
      case 'hilo':
        return 'bg-emerald-600 text-white';
      case 'thaison':
        return 'bg-sky-600 text-white';
      case 'vnpt':
        return 'bg-blue-600 text-white';
      case 'viettel':
        return 'bg-red-600 text-white';
      case 'misa':
        return 'bg-amber-600 text-white';
      case 'fpt':
        return 'bg-orange-600 text-white';
      case 'bkav':
        return 'bg-rose-600 text-white';
      case 'easyinvoice':
        return 'bg-teal-600 text-white';
      default:
        return 'bg-surface-elevated text-content-muted border border-surface-subtle';
    }
  };

  return (
    <div className="bg-surface-card border border-surface-subtle rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
      {/* Top Bar: Provider & Status */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold uppercase tracking-wider ${getProviderColor()}`}>
              {invoice.providerName || 'Khác'}
            </span>
            {getStatusBadge()}
            {invoice.isOcr && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                title="Dữ liệu trích xuất qua công nghệ nhận diện quang học (OCR)"
              >
                <Sparkles className="w-3 h-3" />
                OCR
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onEdit(invoice)}
              className="p-1.5 rounded-lg text-content-muted hover:text-content hover:bg-surface-elevated transition-colors"
              title="Chỉnh sửa thông tin"
              aria-label="Chỉnh sửa thông tin"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(invoice.id)}
              className="p-1.5 rounded-lg text-content-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
              title="Xóa hóa đơn"
              aria-label="Xóa hóa đơn"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Invoice Main Info */}
        <h4 className="text-sm font-semibold text-content-title line-clamp-1 mb-1" title={invoice.sellerName || invoice.fileName}>
          {invoice.sellerName || invoice.fileName}
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-content-muted mb-4 py-2 border-y border-surface-subtle/60">
          <div className="flex items-center gap-1 truncate" title={`Số hóa đơn: ${invoice.invoiceNumber || 'Chưa rõ'}`}>
            <span title="Số hóa đơn" className="cursor-help inline-flex items-center">
              <Hash className="w-3.5 h-3.5 text-content-muted shrink-0" />
            </span>
            <span className="font-mono text-content">{invoice.invoiceNumber || 'Chưa rõ số'}</span>
          </div>
          <div className="flex items-center gap-1 truncate" title={`Ký hiệu mẫu hóa đơn (Symbol): ${invoice.invoiceSymbol || 'Chưa rõ'}`}>
            <span title="Ký hiệu mẫu hóa đơn (Symbol)" className="cursor-help inline-flex items-center">
              <FileCode className="w-3.5 h-3.5 text-content-muted shrink-0" />
            </span>
            <span className="font-mono text-content">{invoice.invoiceSymbol || 'Chưa rõ mẫu'}</span>
          </div>
          <div className="flex items-center justify-between gap-1 min-w-0" title={`Mã số thuế đơn vị bán hàng (MST): ${invoice.sellerTaxCode || 'Chưa rõ'}`}>
            <div className="flex items-center gap-1 truncate min-w-0">
              <span title="Mã số thuế đơn vị bán hàng (MST)" className="cursor-help inline-flex items-center">
                <Building className="w-3.5 h-3.5 text-content-muted shrink-0" />
              </span>
              <span className="font-mono text-content truncate">{invoice.sellerTaxCode || 'Chưa rõ MST'}</span>
            </div>
            {invoice.sellerTaxCode && (
              <button
                type="button"
                onClick={handleCopyMst}
                className="p-1 rounded hover:bg-surface-elevated text-content-muted hover:text-content transition-colors shrink-0"
                title={copiedMst ? 'Đã chép MST!' : 'Sao chép MST'}
                aria-label="Sao chép MST"
              >
                {copiedMst ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            )}
          </div>
          <div className="flex items-center gap-1 truncate" title={`Ngày lập hóa đơn: ${invoice.invoiceDate || 'Chưa rõ'}`}>
            <span title="Ngày lập hóa đơn" className="cursor-help inline-flex items-center">
              <Calendar className="w-3.5 h-3.5 text-content-muted shrink-0" />
            </span>
            <span className="text-content">{invoice.invoiceDate || 'Chưa rõ ngày'}</span>
          </div>
        </div>

        {/* Lookup Code & URL Section */}
        <div className="space-y-2 mb-4">
          {/* Lookup Code Box */}
          <div className="bg-surface-elevated border border-surface-subtle rounded-xl p-2.5 flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <span className="block text-[10px] uppercase font-semibold text-content-muted tracking-wider">
                Mã tra cứu / Mã bí mật
              </span>
              <span className="font-mono text-sm font-bold text-content truncate block">
                {invoice.lookupCode || (
                  <span className="text-content-muted font-normal italic">Không tìm thấy mã trong PDF</span>
                )}
              </span>
            </div>
            {invoice.lookupCode && (
              <button
                type="button"
                onClick={handleCopyCode}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shrink-0 ${
                  copied
                    ? 'bg-emerald-500 text-white'
                    : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white'
                }`}
                title="Sao chép mã tra cứu"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Đã chép!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy mã</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Lookup URL Box */}
          {invoice.lookupUrl ? (
            <div className="flex items-center justify-between text-xs px-2 text-content-muted">
              <span className="truncate flex-1 font-mono text-[11px] pr-2" title={invoice.lookupUrl}>
                {invoice.lookupUrl}
              </span>
              <a
                href={invoice.lookupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium shrink-0"
              >
                <span>Mở link</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ) : (
            <p className="text-[11px] text-content-muted italic px-2">
              Không tìm thấy đường link tra cứu trong file PDF
            </p>
          )}

          {/* Instruction Note */}
          {invoice.note && (
            <div className="text-[11px] text-content-muted bg-surface-elevated/50 p-2 rounded-lg border border-surface-subtle/50">
              {invoice.note}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-surface-subtle mt-auto">
        {invoice.status === STATUS_TYPES.READY ? (
          <button
            type="button"
            onClick={() => onDownload(invoice)}
            className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            Tải XML Hóa Đơn
          </button>
        ) : invoice.lookupUrl ? (
          <div className="flex items-center gap-2">
            <a
              href={invoice.lookupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors text-center"
            >
              <ExternalLink className="w-4 h-4" />
              Mở trang tra cứu
            </a>
            {invoice.lookupCode && (
              <button
                type="button"
                onClick={handleCopyCode}
                className="py-2 px-3 rounded-xl bg-surface-elevated hover:bg-surface-subtle text-content border border-surface-subtle font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
                title="Sao chép mã vào bộ nhớ đệm"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy mã
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onEdit(invoice)}
            className="w-full py-2 px-3 rounded-xl bg-surface-elevated hover:bg-surface-subtle text-content font-medium text-xs border border-surface-subtle flex items-center justify-center gap-1.5 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Bổ sung thông tin tra cứu
          </button>
        )}
      </div>
    </div>
  );
}
