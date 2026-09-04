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
                <span className="px-space-2 py-[2px] bg-primary-container/10 text-brand-cyan-bright font-label-sm text-label-sm rounded uppercase">
                  3-Zone Engine
                </span>
                <span className="px-space-2 py-[2px] bg-secondary-container/10 text-secondary font-label-sm text-label-sm rounded uppercase flex items-center gap-space-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  Offline Client-Side
                </span>
                <span className="px-space-2 py-[2px] bg-surface-subtle text-tertiary font-label-sm text-label-sm rounded uppercase">
                  Fuzzy Auto-Map
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-outline mt-0.5">
                PIPELINE ID: EXCEL-MAPPING-3ZONE-V2.2
              </span>
            </div>
          </div>
        </div>

        <p className="font-body-md text-body-md text-on-surface-variant max-w-4xl">
          Tự động ánh xạ cột từ tệp đơn hàng khách hàng sang biểu mẫu đặt hàng của nhà cung cấp. Bảo toàn nguyên vẹn 100% định dạng, công thức tính toán và phần thông tin đầu trang (Header) lẫn chân trang (Footer).
        </p>

        {/* PRIVACY BANNER */}
        <div className="p-space-3 bg-surface-container-low rounded-lg flex items-center gap-space-3 border-l-2 border-secondary">
          <div className="w-8 h-8 rounded bg-secondary-container/20 flex items-center justify-center shrink-0 text-secondary">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-space-2">
              <span className="font-title-sm text-title-sm text-secondary font-semibold">BẢO MẬT CLIENT-SIDE 100%</span>
              <span className="px-space-1 py-[1px] bg-secondary/15 text-secondary font-label-sm text-label-sm rounded">
                ISO-27001 ISOLATED
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Toàn bộ quá trình đọc, khớp trường và kết xuất workbook Excel diễn ra hoàn toàn trên thiết bị của bạn. Không gửi đơn hàng hay dữ liệu giá sang bất kỳ server nào.
            </p>
          </div>
        </div>
      </div>

      {/* CORE WORKSPACE VIEW */}
      <div className="w-full mb-space-12">
        <ExcelMappingView t={t} displayLang={displayLang} />
      </div>

      {/* FOOTER KIẾN THỨC & QUY CHUẨN ĐỒ HỌA (3 CARDS) */}
      <div className="pt-space-6 border-t border-border-subtle/40 mb-space-8">
        <div className="flex items-center gap-space-2 mb-space-4">
          <span className="material-symbols-outlined text-primary-container text-[20px]">auto_stories</span>
          <h3 className="font-title-sm text-title-sm text-on-surface font-bold">Tiêu Chuẩn Đồ Họa &amp; Xử Lý Biểu Mẫu 3 Vùng</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-4">
          {/* CARD 1 */}
          <div className="bg-surface-container rounded-xl p-space-4 flex flex-col gap-space-2 hover:bg-surface-container-high transition-colors border border-border-subtle/20">
            <div className="w-10 h-10 rounded-lg bg-surface-subtle flex items-center justify-center text-primary-container mb-space-1">
              <Layers className="w-5 h-5 text-primary-container" />
            </div>
            <h4 className="font-title-sm text-title-sm text-on-surface font-semibold">Động Cơ Phân Vùng 3 Lớp Độc Quyền</h4>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Tách biệt hoàn toàn Header Zone (thông tin đại lý, ngày lập), Product Rows (danh mục hàng hóa) và Footer Zone (chữ ký, điều khoản thanh toán) để không bao giờ làm vỡ layout Excel mẫu.
            </p>
          </div>

          {/* CARD 2 */}
          <div className="bg-surface-container rounded-xl p-space-4 flex flex-col gap-space-2 hover:bg-surface-container-high transition-colors border border-border-subtle/20">
            <div className="w-10 h-10 rounded-lg bg-surface-subtle flex items-center justify-center text-secondary mb-space-1">
              <Sparkles className="w-5 h-5 text-secondary" />
            </div>
            <h4 className="font-title-sm text-title-sm text-on-surface font-semibold">Tự Động Khớp Trường (Fuzzy Auto-Map)</h4>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Nhận diện thông minh các tiêu đề cột tiếng Việt và tiếng Anh (Mã hàng ↔ SKU, Số lượng ↔ Qty, Đơn giá ↔ Price) với độ chính xác cao mà không cần người dùng chọn từng trường.
            </p>
          </div>

          {/* CARD 3 */}
          <div className="bg-surface-container rounded-xl p-space-4 flex flex-col gap-space-2 hover:bg-surface-container-high transition-colors border border-border-subtle/20">
            <div className="w-10 h-10 rounded-lg bg-surface-subtle flex items-center justify-center text-tertiary mb-space-1">
              <CheckCircle2 className="w-5 h-5 text-tertiary" />
            </div>
            <h4 className="font-title-sm text-title-sm text-on-surface font-semibold">Lưu Hồ Sơ Khớp (Profile Memory)</h4>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Ghi nhớ quy tắc khớp trường theo từng nhà cung cấp vào bộ nhớ trình duyệt (localStorage). Các lần xử lý đơn hàng tiếp theo chỉ mất 1 giây để hoàn tất.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
