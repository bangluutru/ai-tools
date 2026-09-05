import React from 'react';
import ExcelMappingView from '@ai-tools/core/components/ExcelMappingView.jsx';
import { uiTranslations } from '@ai-tools/core/utils/translations.js';
import { FileSpreadsheet, ShieldCheck, Layers, Sparkles, CheckCircle2 } from 'lucide-react';

export default function ExcelMappingTool({ displayLang }) {
  const langKey = displayLang === 'vi' ? 'vn' : displayLang;
  const t = uiTranslations[langKey] || uiTranslations.vn;

  return (
    <div className="flex flex-col w-full text-on-surface max-w-[1240px] mx-auto px-space-4 lg:px-space-6 py-space-6">
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
          Ánh Xạ Đơn Hàng Excel 3 Vùng
        </span>
      </nav>

      {/* TOOL HEADER */}
      <div className="flex flex-col gap-space-4 pb-space-6 border-b border-border-subtle/40 mb-space-6">
        <div className="flex flex-wrap items-center justify-between gap-space-4">
          <div className="flex items-center gap-space-3">
            <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary-container shadow-sm">
              <FileSpreadsheet className="w-7 h-7 text-primary-container" />
            </div>
            <div className="flex flex-col">
              <div className="flex flex-wrap items-center gap-space-2">
                <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
                  Ánh Xạ Đơn Hàng Excel 3 Vùng (Smart Order Mapping)
                </h1>
              </div>
            </div>
          </div>
        </div>

        <p className="font-body-md text-body-md text-on-surface-variant max-w-4xl">
          Tự động ánh xạ cột từ tệp đơn hàng khách hàng sang biểu mẫu đặt hàng của nhà cung cấp. Bảo toàn nguyên vẹn 100% định dạng, công thức tính toán và phần thông tin đầu trang (Header) lẫn chân trang (Footer).
        </p>
        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-secondary shrink-0" />
          <span>Xử lý trực tiếp trên trình duyệt — tệp không được tải lên máy chủ.</span>
        </div>
      </div>

      {/* CORE WORKSPACE VIEW */}
      <div className="w-full mb-space-12">
        <ExcelMappingView t={t} displayLang={displayLang} />
      </div>
    </div>
  );
}
