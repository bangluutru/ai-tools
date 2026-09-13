/**
 * @file packages/core/src/components/consular/FormOutputToolbar.jsx
 * @description Thanh công cụ điều khiển biểu mẫu lãnh sự chuẩn hóa:
 *  - Chuyển tab Easy Fill ↔ Bản in A4
 *  - Bộ chọn Zoom (Fit page, Fit width, 100%) & nút tăng giảm zoom
 *  - Điều hướng trang đa kỳ (Page 1/2, < Trước, Sau >)
 *  - Tách biệt rõ ràng 2 hành động: [Tải PDF] và [In]
 *  - Điều khiển Phóng to (12 cột) và Làm lại (Reset)
 */

import React from 'react';
import {
  Printer,
  Download,
  RotateCcw,
  Eye,
  Edit3,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { getConsularI18n } from '../../consular/i18n/consularI18n.js';

export default function FormOutputToolbar({
  formConfig,
  activeTab,
  onTabChange,
  zoomMode,
  onZoomModeChange,
  onZoomIn,
  onZoomOut,
  currentPage,
  totalPages = 1,
  onPageChange,
  onDownloadPdf,
  onPrint,
  isGeneratingPdf = false,
  isExpanded = false,
  onToggleExpand,
  onReset,
  displayLang = 'vi',
}) {
  const t = getConsularI18n(displayLang);
  const formTitle = formConfig?.title?.[displayLang] || formConfig?.title?.vi || formConfig?.title || 'FORM';

  return (
    <div className="no-print bg-surface-container-lowest border-b border-border-subtle p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-2.5">
      {/* Thông tin biểu mẫu */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
          {formConfig?.code || 'FORM'}
        </div>
        <div className="min-w-0">
          <h3 className="text-xs sm:text-sm font-bold text-on-surface truncate">
            {formTitle}
          </h3>
          <div className="text-[10.5px] text-outline flex items-center gap-1.5 flex-wrap">
            <span className="truncate">{formConfig?.standardBasis || formConfig?.legal_basis}</span>
            <span>•</span>
            <span className="font-mono text-[9.5px] text-emerald-700 dark:text-emerald-400 font-semibold">
              {t.editor.verifiedSha}
            </span>
          </div>
        </div>
      </div>

      {/* Cụm điều khiển tương tác */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap ml-auto">
        {/* Switch tab: Easy Fill ↔ Bản in A4 */}
        <div className="flex items-center bg-surface-container rounded-lg p-1 text-xs border border-border-subtle">
          <button
            type="button"
            onClick={() => onTabChange('easy_fill')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
              activeTab === 'easy_fill'
                ? 'bg-primary text-on-primary shadow-2xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Edit3 size={12} />
            <span>{t.editor.easyFillTab}</span>
          </button>
          <button
            type="button"
            onClick={() => onTabChange('preview')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-primary text-on-primary shadow-2xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Eye size={12} />
            <span>{t.editor.previewTab}</span>
          </button>
        </div>

        {/* Các điều khiển chỉ hiển thị ở tab Preview */}
        {activeTab === 'preview' && (
          <>
            {/* Bộ điều hướng trang (Nếu form có nhiều trang, ví dụ TK02 có 2 trang) */}
            {totalPages > 1 && (
              <div className="flex items-center bg-surface-container rounded-lg px-2 py-1 text-xs border border-border-subtle gap-1 text-on-surface font-medium">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => onPageChange(currentPage - 1)}
                  className="p-0.5 rounded hover:bg-surface-subtle disabled:opacity-30 disabled:pointer-events-none cursor-pointer text-on-surface-variant hover:text-on-surface"
                  title="Trang trước"
                >
                  <ChevronLeft size={13} />
                </button>
                <span className="text-[11px] font-mono whitespace-nowrap px-1">
                  Trang {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => onPageChange(currentPage + 1)}
                  className="p-0.5 rounded hover:bg-surface-subtle disabled:opacity-30 disabled:pointer-events-none cursor-pointer text-on-surface-variant hover:text-on-surface"
                  title="Trang tiếp"
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            )}

            {/* Menu chọn Zoom Mode */}
            <div className="flex items-center bg-surface-container rounded-lg p-0.5 text-xs border border-border-subtle">
              <button
                type="button"
                onClick={onZoomOut}
                className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-subtle cursor-pointer"
                title="Thu nhỏ xem trước"
              >
                <ZoomOut size={12} />
              </button>
              <select
                id="consular-zoom-select"
                aria-label="Tỷ lệ thu phóng bản in A4"
                value={zoomMode}
                onChange={(e) => onZoomModeChange(e.target.value)}
                className="bg-transparent border-none text-[11px] font-semibold text-on-surface px-1.5 py-0.5 outline-none cursor-pointer"
              >
                <option value="fit_page" className="bg-surface-container text-on-surface">
                  Fit page
                </option>
                <option value="fit_width" className="bg-surface-container text-on-surface">
                  Fit width
                </option>
                <option value="100%" className="bg-surface-container text-on-surface">
                  100%
                </option>
              </select>
              <button
                type="button"
                onClick={onZoomIn}
                className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-subtle cursor-pointer"
                title="Phóng to xem trước"
              >
                <ZoomIn size={12} />
              </button>
            </div>

            {/* Nút Tải PDF */}
            <button
              type="button"
              onClick={onDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-surface-container hover:bg-surface-container-high border border-border-subtle text-primary transition-colors cursor-pointer disabled:opacity-50"
              title="Tải file PDF chính thức đã điền về máy"
            >
              <Download size={13} />
              <span>Tải PDF</span>
            </button>

            {/* Nút In ấn */}
            <button
              type="button"
              onClick={onPrint}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-on-primary hover:bg-primary/90 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
              title="In bản khai A4 qua hộp thoại máy in hệ thống"
            >
              <Printer size={13} />
              <span>{t.editor.printBtn}</span>
            </button>
          </>
        )}

        {/* Nút Phóng to / Thu nhỏ không gian soạn thảo */}
        {onToggleExpand && (
          <button
            type="button"
            onClick={onToggleExpand}
            className="p-1.5 rounded-lg text-outline hover:text-primary hover:bg-primary/10 border border-border-subtle transition-colors cursor-pointer"
            title={isExpanded ? t.editor.restoreBtn : t.editor.maximizeBtn}
          >
            {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        )}

        {/* Nút Làm lại dữ liệu */}
        <button
          type="button"
          onClick={onReset}
          className="p-1.5 rounded-lg text-outline hover:text-error hover:bg-error/10 border border-border-subtle transition-colors cursor-pointer"
          title={t.editor.resetBtn}
        >
          <RotateCcw size={13} />
        </button>
      </div>
    </div>
  );
}
