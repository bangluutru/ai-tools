/**
 * @file packages/core/src/components/consular/StructuredFormEditor.jsx
 * @description Trình soạn thảo và xuất bản biểu mẫu lãnh sự chuẩn hóa (Refined Document Workspace):
 *  - Tách bạch rõ rệt giữa Data Schema và Official Document Template
 *  - Tích hợp pipeline SSOT PDF Generator (pdf-lib) cho cả Preview, Tải file và In ấn
 *  - Xem trước A4 chuẩn hình học 210mm x 297mm (mặc định Fit Page) với A4PreviewViewport
 *  - In ấn qua iframe cô lập, không dùng window.print() trực tiếp trên DOM của Toolio
 */

import React, { useState, useEffect, useCallback } from 'react';
import FormOutputToolbar from './FormOutputToolbar.jsx';
import EasyFillForm from './EasyFillForm.jsx';
import A4PreviewViewport from './A4PreviewViewport.jsx';
import OfficialFormPreview from './OfficialFormPreview.jsx';
import { generateOfficialFormPdf } from '../../consular/pdf/generateOfficialFormPdf.js';
import { getConsularI18n } from '../../consular/i18n/consularI18n.js';

export default function StructuredFormEditor({
  formConfig,
  onClose,
  isExpanded = false,
  onToggleExpand,
  displayLang = 'vi',
}) {
  const t = getConsularI18n(displayLang);
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
  const handleChange = useCallback((fieldId, value, transform) => {
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
  }, [formConfig?.id]);

  // Reset form về mặc định
  const handleReset = useCallback(() => {
    if (window.confirm(t.editor.resetConfirm)) {
      const init = formConfig?.initialValues || {};
      setFormData(init);
      try {
        localStorage.removeItem(`consular_form_${formConfig?.id}`);
      } catch (err) {
        console.error('Error clearing form data', err);
      }
    }
  }, [formConfig?.id, formConfig?.initialValues, t.editor.resetConfirm]);

  // Xử lý zoom
  const handleZoomIn = () => setManualScaleDelta((prev) => Math.min(prev + 0.1, 0.5));
  const handleZoomOut = () => setManualScaleDelta((prev) => Math.max(prev - 0.1, -0.4));
  const handleZoomModeChange = (mode) => {
    setZoomMode(mode);
    setManualScaleDelta(0);
  };

  // Tải file PDF chính thức đã điền
  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      const result = await generateOfficialFormPdf({
        formId: formConfig.id,
        formData,
        lang: displayLang,
      });

      if (result?.blob) {
        const url = URL.createObjectURL(result.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      }
    } catch (err) {
      console.error('Lỗi khi sinh file PDF lãnh sự', err);
      alert('Không thể tạo file PDF. Vui lòng kiểm tra lại thông tin nhập.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // In ấn biểu mẫu cô lập qua iframe ẩn từ PDF byte stream
  const handlePrint = async () => {
    try {
      setIsGeneratingPdf(true);
      const result = await generateOfficialFormPdf({
        formId: formConfig.id,
        formData,
        lang: displayLang,
      });

      if (result?.blob) {
        const url = URL.createObjectURL(result.blob);
        let printFrame = document.getElementById('consular-print-frame');
        if (!printFrame) {
          printFrame = document.createElement('iframe');
          printFrame.id = 'consular-print-frame';
          printFrame.style.position = 'fixed';
          printFrame.style.right = '0';
          printFrame.style.bottom = '0';
          printFrame.style.width = '0';
          printFrame.style.height = '0';
          printFrame.style.border = '0';
          document.body.appendChild(printFrame);
        }

        printFrame.src = url;
        printFrame.onload = () => {
          try {
            printFrame.contentWindow.focus();
            printFrame.contentWindow.print();
          } catch (e) {
            // Fallback mở cửa sổ riêng
            const win = window.open(url, '_blank');
            if (win) win.print();
          }
          setTimeout(() => URL.revokeObjectURL(url), 10000);
        };
      }
    } catch (err) {
      console.error('Lỗi khi chuẩn bị in ấn biểu mẫu', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (!formConfig) return null;

  const fields = formConfig.fields || (formConfig.sections?.flatMap((s) => s.fields)) || [];

  return (
    <div className="bg-surface-container-low border border-border-subtle rounded-2xl overflow-hidden shadow-xs flex flex-col h-full min-h-[600px]">
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
        onDownloadPdf={handleDownloadPdf}
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
            />
          </A4PreviewViewport>
        )}
      </div>
    </div>
  );
}
