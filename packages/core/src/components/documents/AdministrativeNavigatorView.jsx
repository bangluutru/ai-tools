/**
 * @file AdministrativeNavigatorView.jsx
 * Unified Search, Disambiguation & Navigation Hub for Japan Administrative Procedures & Documents.
 * Built with StandardToolLayout, high-contrast dark/light mode tokens, WCAG 2.1 AA.
 */

import React, { useState, useMemo } from 'react';
import {
  Compass,
  Search,
  FileSearch,
  Store,
  IdCard,
  FileText,
  ClipboardCheck,
  ArrowRight,
  HelpCircle,
  AlertTriangle,
  Building2,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import StandardToolLayout from '../shared/StandardToolLayout.jsx';
import { searchAdministrativeDomain } from '../../documents/search/adminSearchEngine.js';

export function AdministrativeNavigatorView({ lang = 'vi' }) {
  const [query, setQuery] = useState('');

  const searchResult = useMemo(() => {
    return searchAdministrativeDomain(query);
  }, [query]);

  const quickPills = [
    { label: '住民票', q: '住民票' },
    { label: 'Chứng nhận thuế (課税/納税)', q: 'thuế' },
    { label: 'Hộ tịch (戸籍謄本)', q: 'hộ tịch' },
    { label: 'Thẻ My Number', q: 'マイナンバー' },
    { label: 'Gia hạn visa (在留更新)', q: 'visa' },
    { label: 'Phiếu Gensen (源泉徴収票)', q: '源泉徴収票' },
  ];

  const quickTools = [
    {
      toolId: 'document-finder-jp',
      titleJa: '必要書類ファインダー',
      titleI18n: {
        ja: '必要書類ファインダー',
        vi: 'Tôi cần chuẩn bị giấy gì?',
        en: 'What documents do I need?',
      },
      descI18n: {
        ja: 'ビザ更新、転入、児童手当等に必要な公的証明書を判定',
        vi: 'Tra cứu danh mục giấy tờ bắt buộc, có điều kiện theo thủ tục',
        en: 'Find required documents by procedure or intent',
      },
      icon: FileSearch,
      accentColor: 'text-primary',
    },
    {
      toolId: 'certificate-acquisition-guide-jp',
      titleJa: '証明書取得ガイド',
      titleI18n: {
        ja: '証明書取得ガイド',
        vi: 'Giấy này lấy ở đâu, bằng cách nào?',
        en: 'Where & how do I obtain this certificate?',
      },
      descI18n: {
        ja: '市役所、コンビニ交付、郵送、税務署、会社の取得手順',
        vi: 'Hướng dẫn quầy hành chính, in tại combini, bưu điện, cơ quan thuế',
        en: 'Step-by-step acquisition via counter, kiosk, or mail',
      },
      icon: Store,
      accentColor: 'text-secondary',
    },
    {
      toolId: 'mynumber-procedure-guide-jp',
      titleJa: 'マイナンバー手続きガイド',
      titleI18n: {
        ja: 'マイナンバー手続きガイド',
        vi: 'Thủ tục Thẻ My Number & Mã PIN',
        en: 'My Number Procedures & PIN Reset',
      },
      descI18n: {
        ja: '在留期間延長時のカード更新、暗証番号ロック解除、紛失停止',
        vi: 'Gia hạn thẻ khi đổi visa, mở khóa mã PIN, xử lý mất thẻ khẩn cấp',
        en: 'Card extension on visa renewal, PIN unlock, emergency stop',
      },
      icon: IdCard,
      accentColor: 'text-warning-strong',
    },
    {
      toolId: 'official-form-helper-jp',
      titleJa: '公的フォームヘルパー',
      titleI18n: {
        ja: '公的フォームヘルパー',
        vi: 'Trợ lý điền mẫu đơn công quyền',
        en: 'Official Government Form Helper',
      },
      descI18n: {
        ja: '申請書PDFの各記入欄の意味・記載例・ローカル下書き作成',
        vi: 'Giải thích chi tiết từng ô của đơn xin visa, chuyển nhà, trợ cấp',
        en: 'Field explanation, formatting guide, and client-side draft',
      },
      icon: FileText,
      accentColor: 'text-primary',
    },
    {
      toolId: 'procedure-requirement-checker-jp',
      titleJa: '手続き要件チェッカー',
      titleI18n: {
        ja: '手続き要件チェッカー',
        vi: 'Kiểm tra hồ sơ đã đủ điều kiện nộp chưa?',
        en: 'Procedure Readiness & Document Checker',
      },
      descI18n: {
        ja: '期限、書類の鮮度（3か月以内等）、手数料の準備状況を自己診断',
        vi: 'Tự đánh giá 3 chiều: Thời hạn, độ tươi giấy tờ và lệ phí trước khi nộp',
        en: 'Self-assess timing, 3-month document freshness, and fee prep',
      },
      icon: ClipboardCheck,
      accentColor: 'text-secondary',
    },
  ];

  const t = {
    title: {
      ja: '行政手続・書類ナビ',
      vi: 'Điều hướng Thủ tục hành chính & Giấy tờ (Admin Navigator)',
      en: 'Administrative Procedures & Documents Navigator',
    },
    subtitle: {
      ja: '日本の公的証明書、行政手続き、マイナンバーに関する疑問をワンストップで検索・案内します。',
      vi: 'Cổng tra cứu thông minh về giấy tờ công quyền Nhật Bản, thủ tục hành chính, thuế và thẻ My Number.',
      en: 'One-stop search and navigation for official certificates, government procedures, and My Number in Japan.',
    },
    searchPlaceholder: {
      ja: '質問やキーワードを入力（例：住民票 取り方、所得証明、ビザ更新、暗証番号 忘れた）...',
      vi: 'Nhập câu hỏi hoặc từ khóa (vd: lấy 住民票 ở đâu, giấy thuế, gia hạn visa, quên mã PIN)...',
      en: 'Enter question or keyword (e.g. resident record, tax certificate, renew visa, forgot PIN)...',
    },
    quickToolsHeading: {
      ja: '目的別の専用ツール',
      vi: 'Công cụ chuyên dụng theo từng nhu cầu',
      en: 'Dedicated Administrative Tools',
    },
    searchResultsHeading: {
      ja: '検索結果',
      vi: 'Kết quả tìm kiếm',
      en: 'Search Results',
    },
  };

  return (
    <StandardToolLayout
      title={t.title[lang] || t.title.vi}
      description={t.subtitle[lang] || t.subtitle.vi}
      iconName="Compass"
      activeTab="calculator"
      showLayoutToggle={false}
    >
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* 1. Large Multilingual Search Bar */}
        <section className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 shadow-sm space-y-4">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.searchPlaceholder[lang] || t.searchPlaceholder.vi}
              className="w-full bg-surface border border-outline-variant rounded-2xl px-5 py-4 pl-12 text-base text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
            />
            <Search className="w-5 h-5 text-on-surface-variant absolute left-4 top-4.5" />
          </div>

          {/* Suggestion Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-semibold text-on-surface-variant mr-1">Gợi ý nhanh:</span>
            {quickPills.map((pill, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setQuery(pill.q)}
                className="px-3 py-1 rounded-full text-xs bg-surface border border-outline-variant hover:border-primary/50 text-on-surface transition-colors"
              >
                {pill.label}
              </button>
            ))}
          </div>
        </section>

        {/* 2. Disambiguation Card if triggered */}
        {searchResult.disambiguationCard && (
          <section className="bg-warning/10 border-2 border-warning/40 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-warning-strong flex-shrink-0" />
              <h3 className="text-base font-bold text-on-surface">
                {searchResult.disambiguationCard.titleI18n[lang] ||
                  searchResult.disambiguationCard.titleI18n.vi}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {searchResult.disambiguationCard.options.map((opt, idx) => (
                <div
                  key={idx}
                  className="bg-surface p-4 rounded-xl border border-outline-variant/80 flex flex-col justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-primary block mb-1">
                      {opt.titleJa}
                    </span>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {opt.descI18n[lang] || opt.descI18n.vi}
                    </p>
                  </div>

                  <a
                    href={`#/${opt.targetTool}`}
                    className="mt-3 text-xs font-bold text-primary flex items-center gap-1 hover:underline"
                  >
                    <span>Xem cách lấy giấy này</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 3. Search Results List (if query active) */}
        {query.trim() && (
          <section className="bg-surface-container border border-outline-variant rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-on-surface flex items-center justify-between">
              <span>{t.searchResultsHeading[lang] || t.searchResultsHeading.vi} cho "{query}":</span>
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-xs text-on-surface-variant hover:text-on-surface"
              >
                Xóa tìm kiếm
              </button>
            </h3>

            {/* Document Matches */}
            {searchResult.matchedDocuments.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-primary uppercase tracking-wide">
                  Giấy tờ phù hợp ({searchResult.matchedDocuments.length}):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {searchResult.matchedDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-surface p-3.5 rounded-xl border border-outline-variant flex items-center justify-between"
                    >
                      <div>
                        <h5 className="font-bold text-sm text-on-surface">
                          {doc.canonicalNameJa}
                        </h5>
                        <p className="text-xs text-on-surface-variant">
                          {doc.nameI18n[lang] || doc.nameI18n.vi}
                        </p>
                      </div>

                      <a
                        href={`#/certificate-acquisition-guide-jp`}
                        className="px-2.5 py-1 text-xs font-semibold bg-primary/10 text-primary rounded-lg hover:bg-primary/20"
                      >
                        Lấy ở đâu?
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Procedure Matches */}
            {searchResult.matchedProcedures.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-outline-variant/60">
                <span className="text-xs font-bold text-secondary uppercase tracking-wide">
                  Thủ tục hành chính phù hợp ({searchResult.matchedProcedures.length}):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {searchResult.matchedProcedures.map((proc) => (
                    <div
                      key={proc.id}
                      className="bg-surface p-3.5 rounded-xl border border-outline-variant flex items-center justify-between"
                    >
                      <div>
                        <h5 className="font-bold text-sm text-on-surface">
                          {proc.titleJa}
                        </h5>
                        <p className="text-xs text-on-surface-variant">
                          {proc.titleI18n[lang] || proc.titleI18n.vi}
                        </p>
                      </div>

                      <a
                        href={`#/document-finder-jp`}
                        className="px-2.5 py-1 text-xs font-semibold bg-secondary/10 text-secondary rounded-lg hover:bg-secondary/20"
                      >
                        Cần giấy gì?
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!searchResult.hasResults && (
              <p className="text-xs text-on-surface-variant py-4 text-center">
                Không tìm thấy giấy tờ hoặc thủ tục khớp với từ khóa. Vui lòng thử từ khóa khác hoặc chọn từ danh mục chuyên dụng bên dưới.
              </p>
            )}
          </section>
        )}

        {/* 4. Dedicated Quick Tools Grid */}
        <section className="space-y-4">
          <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
            <Compass className="w-4 h-4 text-primary" />
            {t.quickToolsHeading[lang] || t.quickToolsHeading.vi}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickTools.map((tool) => {
              const IconComp = tool.icon;
              return (
                <a
                  key={tool.toolId}
                  href={`#/${tool.toolId}`}
                  className="p-5 rounded-2xl bg-surface border border-outline-variant hover:border-primary/50 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2.5 rounded-xl bg-surface-container-high ${tool.accentColor}`}>
                        <IconComp className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-on-surface-variant group-hover:text-primary flex items-center gap-1 transition-colors">
                        Mở công cụ <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>

                    <h4 className="font-bold text-base text-on-surface group-hover:text-primary transition-colors">
                      {tool.titleI18n[lang] || tool.titleI18n.vi}
                    </h4>
                    <span className="text-xs text-on-surface-variant block mt-0.5 font-medium">
                      {tool.titleJa}
                    </span>
                    <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
                      {tool.descI18n[lang] || tool.descI18n.vi}
                    </p>
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      </div>
    </StandardToolLayout>
  );
}

export default AdministrativeNavigatorView;
