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
              </div>
            </div>
          </div>
        </div>

        <p className="font-body-md text-body-md text-on-surface-variant max-w-4xl">
          Soạn thảo và chuẩn hóa văn bản hành chính theo tiêu chuẩn thể thức Nghị định 30/2020/NĐ-CP. Tự động nhận diện cấu trúc công văn, phân đoạn điều khoản, căn lề chuẩn quốc gia và kết xuất file Word (.docx) chuyên nghiệp.
        </p>
        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-secondary shrink-0" />
          <span>Xử lý trực tiếp trên trình duyệt — tệp không được tải lên máy chủ.</span>
        </div>
      </div>

      {/* CORE WORKSPACE VIEW */}
      <div className="w-full mb-space-12">
        <DocStudioApp displayLang={displayLang} />
      </div>
    </div>
  );
}
