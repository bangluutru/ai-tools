import React from 'react';
import DocStudioApp from '@ai-tools/core/components/editor-studio/DocStudioApp.jsx';
import { FileText, ShieldCheck, FileCheck, CheckCircle2, Award } from 'lucide-react';

export default function EditorStudioTool({ displayLang }) {
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
          Tiện ích &amp; Studio
        </a>
        <span className="text-outline">/</span>
        <span className="text-on-surface font-title-sm text-title-sm">
          Soạn Thảo &amp; Chuẩn Hóa Văn Bản (Document Studio)
        </span>
      </nav>

      {/* TOOL HEADER */}
      <div className="flex flex-col gap-space-4 pb-space-6 border-b border-border-subtle/40 mb-space-6">
        <div className="flex flex-wrap items-center justify-between gap-space-4">
          <div className="flex items-center gap-space-3">
            <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary-container shadow-sm">
              <FileText className="w-7 h-7 text-primary-container" />
            </div>
            <div className="flex flex-col">
              <div className="flex flex-wrap items-center gap-space-2">
                <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
                  Soạn Thảo &amp; Chuẩn Hóa Văn Bản (Document Studio)
                </h1>
                <span className="px-space-2 py-[2px] bg-primary-container/10 text-brand-cyan-bright font-label-sm text-label-sm rounded uppercase">
                  Document Studio
                </span>
                <span className="px-space-2 py-[2px] bg-secondary-container/10 text-secondary font-label-sm text-label-sm rounded uppercase flex items-center gap-space-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  Offline Client-Side
                </span>
                <span className="px-space-2 py-[2px] bg-surface-subtle text-tertiary font-label-sm text-label-sm rounded uppercase">
                  Schema-Driven DOCX
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-outline mt-0.5">
                PIPELINE ID: DOC-STUDIO-STANDARDS-V2.5
              </span>
            </div>
          </div>
        </div>

        <p className="font-body-md text-body-md text-on-surface-variant max-w-4xl">
          Soạn thảo và chuẩn hóa văn bản hành chính theo tiêu chuẩn thể thức Nghị định 30/2020/NĐ-CP. Tự động nhận diện cấu trúc công văn, phân đoạn điều khoản, căn lề chuẩn quốc gia và kết xuất file Word (.docx) chuyên nghiệp.
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
              Mọi tài liệu, hợp đồng hay công văn nội bộ được phân tích và sinh mã XML DOCX hoàn toàn trong bộ nhớ RAM trình duyệt của bạn, không gửi bản thảo lên server.
            </p>
          </div>
        </div>
      </div>

      {/* CORE WORKSPACE VIEW */}
      <div className="w-full mb-space-12">
        <DocStudioApp displayLang={displayLang} />
      </div>

      {/* FOOTER KIẾN THỨC & QUY CHUẨN ĐỒ HỌA (3 CARDS) */}
      <div className="pt-space-6 border-t border-border-subtle/40 mb-space-8">
        <div className="flex items-center gap-space-2 mb-space-4">
          <span className="material-symbols-outlined text-primary-container text-[20px]">auto_stories</span>
          <h3 className="font-title-sm text-title-sm text-on-surface font-bold">Tiêu Chuẩn Thể Thức Văn Bản &amp; Kỹ Thuật Soạn Thảo</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-4">
          {/* CARD 1 */}
          <div className="bg-surface-container rounded-xl p-space-4 flex flex-col gap-space-2 hover:bg-surface-container-high transition-colors border border-border-subtle/20">
            <div className="w-10 h-10 rounded-lg bg-surface-subtle flex items-center justify-center text-primary-container mb-space-1">
              <Award className="w-5 h-5 text-primary-container" />
            </div>
            <h4 className="font-title-sm text-title-sm text-on-surface font-semibold">Chuẩn Nghị Định 30/2020/NĐ-CP</h4>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Tự động định dạng đúng quy cách Quốc hiệu, Tiêu ngữ, Tên cơ quan ban hành, Trích yếu nội dung và Khung nơi nhận theo đúng tiêu chuẩn hành chính quốc gia.
            </p>
          </div>

          {/* CARD 2 */}
          <div className="bg-surface-container rounded-xl p-space-4 flex flex-col gap-space-2 hover:bg-surface-container-high transition-colors border border-border-subtle/20">
            <div className="w-10 h-10 rounded-lg bg-surface-subtle flex items-center justify-center text-secondary mb-space-1">
              <FileCheck className="w-5 h-5 text-secondary" />
            </div>
            <h4 className="font-title-sm text-title-sm text-on-surface font-semibold">Định Dạng Schema-Driven</h4>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Dữ liệu được mô hình hóa thành cây đối tượng JSON phân cấp (Schema) trước khi kết xuất, bảo đảm file Word không bao giờ bị lệch lề hay vỡ bảng biểu khi mở trên Microsoft Office.
            </p>
          </div>

          {/* CARD 3 */}
          <div className="bg-surface-container rounded-xl p-space-4 flex flex-col gap-space-2 hover:bg-surface-container-high transition-colors border border-border-subtle/20">
            <div className="w-10 h-10 rounded-lg bg-surface-subtle flex items-center justify-center text-tertiary mb-space-1">
              <CheckCircle2 className="w-5 h-5 text-tertiary" />
            </div>
            <h4 className="font-title-sm text-title-sm text-on-surface font-semibold">Xem Trước Trực Quan Thời Gian Thực</h4>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Hai khung nhìn song song (Split View) cho phép vừa gõ nội dung thô vừa theo dõi bản in A4 chuẩn xác với kích thước lề, cỡ chữ và giãn dòng theo thời gian thực.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
