/**
 * @file packages/core/src/components/consular/StructuredFormEditor.jsx
 * @description Trình soạn thảo và xuất bản biểu mẫu lãnh sự chuẩn hóa (Refined Document Workspace):
 *  - Tách bạch rõ rệt giữa Data Schema và Official Document Template
 *  - Xem trước A4 210mm x 297mm (mặc định Fit Page) với A4PreviewViewport
 *  - In / "Lưu thành PDF" bằng cách in chính bản xem trước HTML trong iframe cô lập (@page A4):
 *    giữ đúng dấu tiếng Việt và chữ Nhật. KHÔNG dùng pdf-lib ở đây (font chuẩn của pdf-lib làm mất dấu,
 *    và repo không có @pdf-lib/fontkit) → chunk lãnh sự không kéo theo pdf-lib (~438KB).
 */

import React, { useState, useEffect, useRef } from 'react';
import FormOutputToolbar from './FormOutputToolbar.jsx';
import EasyFillForm from './EasyFillForm.jsx';
import A4PreviewViewport from './A4PreviewViewport.jsx';
import OfficialFormPreview from './OfficialFormPreview.jsx';
import { sanitizeFilenamePart } from '../../consular/pdf/formValueFormat.js';
import { getConsularI18n } from '../../consular/i18n/consularI18n.js';

export default function StructuredFormEditor({
  formConfig,
  onClose,
  isExpanded = false,
  onToggleExpand,
  displayLang = 'vi',
  officeCity = null,
}) {
  const t = getConsularI18n(displayLang);
  const printRootRef = useRef(null);
  const [activeTab, setActiveTab] = useState('easy_fill'); // 'easy_fill' | 'preview'
  const [formData, setFormData] = useState({});
  const [zoomMode, setZoomMode] = useState('fit_page'); // 'fit_page' | 'fit_width' | '100%'
  const [manualScaleDelta, setManualScaleDelta] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Số lượng trang của biểu mẫu (TK02 có 2 trang)
  const totalPages = formConfig?.code === 'TK02' ? 2 : 1;

  // Khôi phục dữ liệu từ localStorage
  useEffect(() => {
    if (!formConfig?.id) return;
    try {
      const saved = localStorage.getItem(`consular_form_${formConfig.id}`);
      if (saved) {
        setFormData(JSON.parse(saved));
      } else {
        setFormData(formConfig.initialValues || {});
      }
    } catch {
      setFormData(formConfig.initialValues || {});
    }
  }, [formConfig?.id, formConfig?.initialValues]);

  // Cập nhật giá trị trường dữ liệu
  const handleChange = (fieldId, value, transform) => {
    const finalVal = transform ? transform(value) : value;
    setFormData((prev) => {
      const updated = { ...prev, [fieldId]: finalVal };
      try {
        localStorage.setItem(
          `consular_form_${formConfig.id}`,
          JSON.stringify(updated)
        );
      } catch (err) {
        console.error('Error saving consular form data', err);
      }
      return updated;
    });
  };

  // Reset form về mặc định
  const handleReset = () => {
    if (window.confirm(t.editor.resetConfirm)) {
      const init = formConfig?.initialValues || {};
      setFormData(init);
      try {
        localStorage.removeItem(`consular_form_${formConfig?.id}`);
      } catch (err) {
        console.error('Error clearing form data', err);
      }
    }
  };

  // Xử lý zoom
  const handleZoomIn = () => setManualScaleDelta((prev) => Math.min(prev + 0.1, 0.5));
  const handleZoomOut = () => setManualScaleDelta((prev) => Math.max(prev - 0.1, -0.4));
  const handleZoomModeChange = (mode) => {
    setZoomMode(mode);
    setManualScaleDelta(0);
  };

  // In bản xem trước HTML (Unicode đầy đủ) qua iframe cô lập — người dùng chọn "Lưu thành PDF" để tải file.
  const handlePrint = () => {
    const root = printRootRef.current;
    if (!root) return;
    setIsGeneratingPdf(true);
    try {
      const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
        .map((node) => node.outerHTML)
        .join('\n');
      const nameSource = formData.applicantName || formData.mandatorName || formData.father_name || formData.maleFullName || 'BAN_NHAP';
      const docTitle = `${sanitizeFilenamePart(formConfig?.code || 'FORM').toUpperCase()}_${sanitizeFilenamePart(nameSource).toUpperCase().slice(0, 40) || 'BAN_NHAP'}`;

      let printFrame = document.getElementById('consular-print-frame');
      if (!printFrame) {
        printFrame = document.createElement('iframe');
        printFrame.id = 'consular-print-frame';
        printFrame.setAttribute('aria-hidden', 'true');
        Object.assign(printFrame.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' });
        document.body.appendChild(printFrame);
      }
      const doc = printFrame.contentDocument;
      doc.open();
      doc.write(`<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${docTitle}</title>${styles}<style>
@page { size: A4; margin: 0; }
html, body { margin: 0; padding: 0; background: #fff !important; }
.consular-print-page { width: 210mm; height: 297mm; overflow: hidden; background: #fff; color: #000; page-break-after: always; break-after: page; }
.consular-print-page:last-child { page-break-after: auto; break-after: auto; }
</style></head><body>${root.innerHTML}</body></html>`);
      doc.close();
      setTimeout(() => {
        try {
          printFrame.contentWindow.focus();
          printFrame.contentWindow.print();
        } catch (err) {
          console.error('Lỗi khi in bản nháp', err);
        } finally {
          setIsGeneratingPdf(false);
        }
      }, 400);
    } catch (err) {
      console.error('Lỗi khi chuẩn bị in ấn biểu mẫu', err);
      setIsGeneratingPdf(false);
    }
  };

  if (!formConfig) return null;

  const fields = formConfig.fields || (formConfig.sections?.flatMap((s) => s.fields)) || [];

  return (
    <div className="relative bg-surface-container-low border border-border-subtle rounded-2xl overflow-hidden shadow-xs flex flex-col h-full min-h-[600px]">
      {/* Header thanh công cụ Form */}
      <FormOutputToolbar
        formConfig={formConfig}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === 'preview') {
            // Đảm bảo về trang 1 và Fit page khi chuyển tab
            setCurrentPage(1);
          }
        }}
        zoomMode={zoomMode}
        onZoomModeChange={handleZoomModeChange}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onPrint={handlePrint}
        isGeneratingPdf={isGeneratingPdf}
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
        onReset={handleReset}
        displayLang={displayLang}
      />

      {/* Vùng nội dung chính: Easy Fill hoặc Bản in A4 */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {activeTab === 'easy_fill' ? (
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <EasyFillForm
              fields={fields}
              formData={formData}
              onChange={handleChange}
              onGoToPreview={() => {
                setActiveTab('preview');
                setCurrentPage(1);
              }}
              displayLang={displayLang}
            />
          </div>
        ) : (
          <A4PreviewViewport
            zoomMode={zoomMode}
            manualScaleDelta={manualScaleDelta}
          >
            <OfficialFormPreview
              formConfig={formConfig}
              formData={formData}
              currentPage={currentPage}
              displayLang={displayLang}
              officeCity={officeCity}
            />
          </A4PreviewViewport>
        )}
      </div>

      {/* Bản dựng ẩn toàn bộ các trang để in (không hiển thị trên màn hình) */}
      <div
        ref={printRootRef}
        aria-hidden="true"
        style={{ position: 'absolute', left: '-10000px', top: 0, width: '210mm', pointerEvents: 'none' }}
      >
        {Array.from({ length: totalPages }, (_, i) => (
          <div key={i} className="consular-print-page bg-white text-black" style={{ width: '210mm', height: '297mm' }}>
            <OfficialFormPreview
              formConfig={formConfig}
              formData={formData}
              currentPage={i + 1}
              displayLang={displayLang}
              officeCity={officeCity}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
