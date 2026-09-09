import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  UploadCloud,
  FileCode,
  Download,
  Trash2,
  ShieldCheck,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Info,
  Layers,
  Sparkles,
  Archive
} from 'lucide-react';
import JSZip from 'jszip';
import {
  STATUS_TYPES,
  STATUS_LABELS,
  XML_FETCHER_LIMITS,
  parsePdfToText,
  extractCandidateUrls,
  extractCandidateLookupCode,
  extractInvoiceMetadataFromText,
  detectProvider,
  buildStandardXmlFilename,
  attemptDirectXmlDownload,
  sanitizeLookupUrl,
  sanitizeLookupCode,
  recognizeImage,
  recognizeScannedPdf,
} from '@ai-tools/core/utils/invoice/xmlFetcher/index.js';
import InvoiceXmlCard from './InvoiceXmlCard.jsx';
import InvoiceEditModal from './InvoiceEditModal.jsx';

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

export default function InvoiceXmlFetcherTool({ displayLang = 'vi' }) {
  const [invoices, setInvoices] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  /**
   * Processes a single invoice file (PDF or Image) into an invoice item
   */
  const processFile = async (file, pdfjsLib) => {
    try {
      const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp)$/i.test(file.name);
      let text = '';
      let isOcr = false;

      if (isImage) {
        isOcr = true;
        const ocrResult = await recognizeImage(file);
        text = ocrResult.text || '';
      } else {
        const buffer = await file.arrayBuffer();
        text = await parsePdfToText(buffer, pdfjsLib);
        // Fallback for scanned PDF without digital text layer (< 20 characters)
        if (!text || text.trim().length < 20) {
          try {
            const ocrResult = await recognizeScannedPdf(buffer, pdfjsLib);
            if (ocrResult.text && ocrResult.text.trim().length > 0) {
              text = ocrResult.text;
              isOcr = true;
            }
          } catch (ocrErr) {
            console.warn('Scanned PDF OCR attempt failed:', ocrErr);
          }
        }
      }

      if (!text || text.trim().length === 0) {
        return {
          id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          fileName: file.name,
          fileSize: file.size,
          rawText: '',
          isOcr,
          status: STATUS_TYPES.UNSUPPORTED,
          note: isImage
            ? 'Hình ảnh mờ hoặc không thể nhận diện ký tự qua OCR. Cần nhập thông tin tra cứu thủ công.'
            : 'PDF scan ảnh hoặc không có lớp ký tự rõ nét. Cần nhập thông tin tra cứu thủ công.',
          lookupUrl: '',
          lookupCode: '',
          sellerTaxCode: '',
          sellerName: '',
          invoiceSymbol: '',
          invoiceNumber: '',
          invoiceDate: '',
          providerId: 'generic',
          providerName: 'Chưa nhận diện',
          xmlContent: null,
          xmlFilename: null,
        };
      }

      const urls = extractCandidateUrls(text);
      const primaryUrl = urls[0] || '';
      const provider = detectProvider(primaryUrl, text);
      const lookupCode = extractCandidateLookupCode(text, provider);
      const metadata = extractInvoiceMetadataFromText(text);
      const lookupUrl = provider.buildLookupUrl(primaryUrl, lookupCode, {
        sellerTaxCode: metadata.sellerTaxCode,
        invoiceNumber: metadata.invoiceNumber,
        symbol: metadata.invoiceSymbol,
      });

      let status = provider.getLookupStatus({ url: lookupUrl, code: lookupCode });
      let note = provider.getInstructions({ url: lookupUrl, code: lookupCode });
      let xmlContent = null;
      let xmlFilename = null;

      // Level B: Attempt safe direct download if provider can do so without CAPTCHA
      if (status === STATUS_TYPES.READY) {
        const downloadResult = await attemptDirectXmlDownload({
          provider,
          url: primaryUrl,
          code: lookupCode,
          taxCode: metadata.sellerTaxCode,
          expectedInvoice: metadata,
        });

        if (downloadResult.success) {
          xmlContent = downloadResult.xmlContent;
          xmlFilename = buildStandardXmlFilename(metadata);
          note = 'Đã tải thành công file XML tự động';
        } else {
          status = downloadResult.status || STATUS_TYPES.MANUAL_REQUIRED;
          note = downloadResult.note || 'Cần truy cập website nhà cung cấp để tải file XML.';
        }
      }

      return {
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        fileName: file.name,
        fileSize: file.size,
        rawText: text,
        isOcr,
        status,
        note,
        lookupUrl: lookupUrl || primaryUrl,
        lookupCode,
        sellerTaxCode: metadata.sellerTaxCode || '',
        sellerName: metadata.sellerName || '',
        invoiceSymbol: metadata.invoiceSymbol || '',
        invoiceNumber: metadata.invoiceNumber || '',
        invoiceDate: metadata.invoiceDate || '',
        providerId: provider.id,
        providerName: provider.name,
        xmlContent,
        xmlFilename,
      };
    } catch (err) {
      return {
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        fileName: file.name,
        fileSize: file.size,
        rawText: '',
        isOcr: false,
        status: STATUS_TYPES.ERROR,
        note: `Lỗi đọc file: ${err.message || 'Không thể giải mã nội dung'}`,
        lookupUrl: '',
        lookupCode: '',
        sellerTaxCode: '',
        sellerName: '',
        invoiceSymbol: '',
        invoiceNumber: '',
        invoiceDate: '',
        providerId: 'generic',
        providerName: 'Khác',
        xmlContent: null,
        xmlFilename: null,
      };
    }
  };

  /**
   * Handles multi-file upload with queue processing
   */
  const handleFiles = useCallback(async (filesList) => {
    const validFiles = Array.from(filesList).filter((f) => {
      const name = f.name.toLowerCase();
      return (
        name.endsWith('.pdf') ||
        name.endsWith('.jpg') ||
        name.endsWith('.jpeg') ||
        name.endsWith('.png') ||
        name.endsWith('.webp') ||
        f.type === 'application/pdf' ||
        f.type.startsWith('image/')
      );
    });

    if (validFiles.length === 0) return;

    const maxAllowedFiles = XML_FETCHER_LIMITS?.MAX_BATCH_FILES || XML_FETCHER_LIMITS?.maxFiles || 50;
    if (validFiles.length > maxAllowedFiles) {
      alert(`Vui lòng chọn tối đa ${maxAllowedFiles} file mỗi đợt.`);
      return;
    }

    setIsProcessing(true);
    setProcessingProgress({ current: 0, total: validFiles.length });

    try {
      const pdfjsLib = await loadPdfJs();
      const results = [];
      const batchSize = 2;

      for (let i = 0; i < validFiles.length; i += batchSize) {
        const slice = validFiles.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          slice.map((file) => processFile(file, pdfjsLib))
        );
        results.push(...batchResults);
        setProcessingProgress({
          current: Math.min(i + batchSize, validFiles.length),
          total: validFiles.length,
        });
      }

      setInvoices((prev) => [...prev, ...results]);
    } catch (err) {
      console.error('Error during batch invoice processing:', err);
    } finally {
      setIsProcessing(false);
      setProcessingProgress({ current: 0, total: 0 });
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  /**
   * Triggers download of an individual XML file
   */
  const handleDownloadSingleXml = (invoice) => {
    if (!invoice.xmlContent) return;
    const filename = invoice.xmlFilename || buildStandardXmlFilename(invoice);
    const blob = new Blob([invoice.xmlContent], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * Generates a zip archive with all ready XMLs
   */
  const handleDownloadAllZip = async () => {
    const readyItems = invoices.filter((item) => item.status === STATUS_TYPES.READY && item.xmlContent);
    if (readyItems.length === 0) return;

    const zip = new JSZip();
    for (const item of readyItems) {
      const filename = item.xmlFilename || buildStandardXmlFilename(item);
      zip.file(filename, item.xmlContent);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invoices-xml.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * Saves edited metadata and retries status evaluation
   */
  const handleSaveEdit = async (updatedData) => {
    if (!editingInvoice) return;

    const cleanUrl = sanitizeLookupUrl(updatedData.lookupUrl);
    const cleanCode = sanitizeLookupCode(updatedData.lookupCode);
    const provider = detectProvider(cleanUrl, editingInvoice.rawText || '');
    let status = provider.getLookupStatus({ url: cleanUrl, code: cleanCode });
    let note = provider.getInstructions({ url: cleanUrl, code: cleanCode });
    let xmlContent = editingInvoice.xmlContent;
    let xmlFilename = editingInvoice.xmlFilename;

    const metadata = {
      sellerTaxCode: updatedData.sellerTaxCode,
      sellerName: updatedData.sellerName,
      invoiceSymbol: updatedData.invoiceSymbol,
      invoiceNumber: updatedData.invoiceNumber,
      invoiceDate: updatedData.invoiceDate,
    };

    if (status === STATUS_TYPES.READY && !xmlContent) {
      const downloadResult = await attemptDirectXmlDownload({
        provider,
        url: cleanUrl,
        code: cleanCode,
        taxCode: metadata.sellerTaxCode,
        expectedInvoice: metadata,
      });

      if (downloadResult.success) {
        xmlContent = downloadResult.xmlContent;
        xmlFilename = buildStandardXmlFilename(metadata);
        note = 'Đã tải thành công file XML tự động';
      } else {
        status = downloadResult.status || STATUS_TYPES.MANUAL_REQUIRED;
        note = downloadResult.note || note;
      }
    }

    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === editingInvoice.id
          ? {
              ...inv,
              ...metadata,
              lookupUrl: cleanUrl,
              lookupCode: cleanCode,
              providerId: provider.id,
              providerName: provider.name,
              status,
              note,
              xmlContent,
              xmlFilename,
            }
          : inv
      )
    );

    setEditingInvoice(null);
  };

  const handleDeleteItem = (id) => {
    setInvoices((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAll = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ danh sách hóa đơn đã tải?')) {
      setInvoices([]);
    }
  };

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((item) => {
      // Filter by status tab
      if (statusFilter === 'READY' && item.status !== STATUS_TYPES.READY) return false;
      if (
        statusFilter === 'MANUAL' &&
        item.status !== STATUS_TYPES.CAPTCHA_REQUIRED &&
        item.status !== STATUS_TYPES.MANUAL_REQUIRED
      )
        return false;
      if (statusFilter === 'ERROR' && item.status !== STATUS_TYPES.ERROR && item.status !== STATUS_TYPES.UNSUPPORTED)
        return false;

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = (item.sellerName || '').toLowerCase().includes(query);
        const matchFile = (item.fileName || '').toLowerCase().includes(query);
        const matchCode = (item.lookupCode || '').toLowerCase().includes(query);
        const matchMst = (item.sellerTaxCode || '').toLowerCase().includes(query);
        const matchNumber = (item.invoiceNumber || '').toLowerCase().includes(query);
        return matchName || matchFile || matchCode || matchMst || matchNumber;
      }

      return true;
    });
  }, [invoices, statusFilter, searchQuery]);

  // Status statistics
  const stats = useMemo(() => {
    const total = invoices.length;
    const ready = invoices.filter((i) => i.status === STATUS_TYPES.READY).length;
    const manual = invoices.filter(
      (i) => i.status === STATUS_TYPES.CAPTCHA_REQUIRED || i.status === STATUS_TYPES.MANUAL_REQUIRED
    ).length;
    const error = invoices.filter(
      (i) => i.status === STATUS_TYPES.UNSUPPORTED || i.status === STATUS_TYPES.ERROR
    ).length;
    return { total, ready, manual, error };
  }, [invoices]);

  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface space-y-6">
      {/* Privacy Guarantee Banner */}
      <div className="bg-surface-card border border-surface-subtle rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
        <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="text-xs text-content-muted leading-relaxed flex-1">
          <span className="font-semibold text-content block text-sm mb-0.5">
            100% Xử Lý Trực Tiếp Trong Trình Duyệt (Client-Safe)
          </span>
          Toàn bộ file PDF và ảnh hóa đơn được giải mã trực tiếp trên thiết bị của bạn. Không gửi tài liệu hay thông tin tài chính lên bất kỳ máy chủ nào.
        </div>
      </div>

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf,image/*,.png,.jpg,.jpeg,.webp"
        multiple
        aria-label="Tải file PDF hoặc ảnh hóa đơn"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            const filesArray = Array.from(e.target.files);
            handleFiles(filesArray);
          }
          e.target.value = '';
        }}
      />

      {/* Hero Dropzone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-blue-500 bg-blue-500/5 scale-[0.99]'
            : 'border-surface-subtle hover:border-blue-500/40 bg-surface-card hover:bg-surface-elevated/40 shadow-sm'
        }`}
      >
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner">
            <UploadCloud className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-content-title">
              Kéo thả file PDF hoặc ảnh chụp hóa đơn vào đây
            </h3>
            <p className="text-xs text-content-muted mt-1 max-w-md mx-auto">
              Hỗ trợ file PDF & ảnh chụp (JPG, PNG, WEBP, bản scan OCR). Tự nhận diện VNPT, Viettel, MISA, GSM (Hilo), Petrolimex, FPT, BKAV, EasyInvoice...
            </p>
          </div>
          <div className="pt-2">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors">
              <FileCode className="w-4 h-4" />
              Chọn file PDF hoặc ảnh từ máy tính
            </span>
          </div>
        </div>

        {isProcessing && (
          <div className="absolute inset-0 bg-surface-card/90 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center space-y-3 z-10">
            <RefreshCw className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
            <p className="text-sm font-medium text-content">
              Đang phân tích tài liệu... ({processingProgress.current}/{processingProgress.total})
            </p>
          </div>
        )}
      </div>

      {/* Summary and Controls Bar (Visible when there are items) */}
      {invoices.length > 0 && (
        <div className="space-y-4">
          {/* Summary stats & bulk actions */}
          <div className="bg-surface-card border border-surface-subtle rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-content-title mr-1">Trạng thái:</span>
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  statusFilter === 'ALL'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-surface-elevated text-content-muted hover:text-content'
                }`}
              >
                Tất cả ({stats.total})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('READY')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  statusFilter === 'READY'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-surface-elevated text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                }`}
              >
                Sẵn sàng tải XML ({stats.ready})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('MANUAL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  statusFilter === 'MANUAL'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-surface-elevated text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
                }`}
              >
                Cần tra cứu trực tiếp ({stats.manual})
              </button>
              {stats.error > 0 && (
                <button
                  type="button"
                  onClick={() => setStatusFilter('ERROR')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                    statusFilter === 'ERROR'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-surface-elevated text-rose-600 dark:text-rose-400 hover:bg-rose-500/10'
                  }`}
                >
                  Chưa rõ mã ({stats.error})
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {stats.ready > 0 && (
                <button
                  type="button"
                  onClick={handleDownloadAllZip}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Archive className="w-3.5 h-3.5" />
                  Tải {stats.ready} file XML (.zip)
                </button>
              )}
              <button
                type="button"
                onClick={handleClearAll}
                className="px-3 py-1.5 rounded-xl bg-surface-elevated hover:bg-rose-500/10 text-content-muted hover:text-rose-600 font-medium text-xs border border-surface-subtle flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Xóa danh sách
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-content-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo số hóa đơn, ký hiệu, mã số thuế hoặc tên người bán..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-surface-card border border-surface-subtle focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-content shadow-sm"
            />
          </div>

          {/* Invoices Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInvoices.map((inv) => (
              <InvoiceXmlCard
                key={inv.id}
                invoice={inv}
                displayLang={displayLang}
                onDownload={handleDownloadSingleXml}
                onEdit={(item) => setEditingInvoice(item)}
                onDelete={handleDeleteItem}
              />
            ))}
          </div>

          {filteredInvoices.length === 0 && (
            <div className="text-center py-12 bg-surface-card border border-surface-subtle rounded-2xl p-6">
              <p className="text-sm text-content-muted">
                Không tìm thấy hóa đơn nào khớp với bộ lọc hoặc từ khóa tìm kiếm.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editingInvoice && (
        <InvoiceEditModal
          invoice={editingInvoice}
          onClose={() => setEditingInvoice(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}
