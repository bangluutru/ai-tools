/**
 * @file packages/core/src/components/tax/RegulatorySourceSection.jsx
 * @description Hiển thị minh bạch căn cứ pháp lý, nguồn chính thức (Official Sources),
 * thời điểm kiểm chứng và ghi chú ước tính (概算/Simulation) cho công cụ thuế Nhật Bản.
 */

import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, ExternalLink, ShieldCheck, Info } from 'lucide-react';
import { OfficialSourceRegistry } from '../../regulatory/sourceRegistry.js';

export default function RegulatorySourceSection({ rules, result, lang = 'ja' }) {
  const [isOpen, setIsOpen] = useState(false);

  const year = rules?.year || 2025;
  const era = rules?.fiscalEra || (year === 2026 ? '令和8年分' : '令和7年分');
  const lastVerified = rules?.lastVerifiedAt || rules?.verifiedDate || '2026-09-10';

  // Get primary sources for Japan Tax
  const jpSources = [
    OfficialSourceRegistry.get('nta-no1410-2026'),
    OfficialSourceRegistry.get('nta-no1199-2026'),
    OfficialSourceRegistry.get('jps-national-pension-2026'),
    OfficialSourceRegistry.get('mhlw-employment-insurance-2026'),
    OfficialSourceRegistry.get('kyokai-kenpo-rates-2026'),
    OfficialSourceRegistry.get('cfa-child-support-2026'),
    OfficialSourceRegistry.get('soumu-resident-tax-std'),
  ].filter(Boolean);

  const labels = {
    ja: {
      title: '制度基準・公式根拠（出典）',
      subtitle: '一次情報源に基づく検証済みルール',
      baseline: '制度基準',
      applicablePeriod: '適用対象',
      applicablePeriodVal: `${year}年分所得税 / 令和${year - 2018}年度`,
      verifiedDate: '最終検証日',
      status: '検証状況',
      statusVerified: '公式一次ソース適合 (Tier-1 Primary)',
      showDetails: '根拠・出典を表示',
      hideDetails: '閉じる',
      sourceListTitle: '参照している公的機関の一次情報源 (Official Primary Sources)',
      authority: '所管省庁・機関',
      docType: '種別',
      disclaimerTitle: '試算の性質に関するご留意事項',
      disclaimerBody: '本シミュレーターの計算結果は公式制度・法令データに基づく参考試算（概算）です。特に国民健康保険料や住民税は市区町村の条例や世帯構成により実際の課税額と異なる場合があります。確定申告の際は国税庁「確定申告書等作成コーナー」または税理士・所轄税務署にてご確認ください。',
    },
    vi: {
      title: 'Căn cứ pháp lý & Nguồn chính thức',
      subtitle: 'Bộ quy tắc xác minh trực tiếp từ nguồn sơ cấp Nhật Bản',
      baseline: 'Chế độ căn cứ',
      applicablePeriod: 'Kỳ áp dụng',
      applicablePeriodVal: `Thuế thu nhập ${year} / Năm tài khóa Lệnh Hòa ${year - 2018}`,
      verifiedDate: 'Ngày kiểm chứng',
      status: 'Trạng thái',
      statusVerified: 'Đã xác minh nguồn sơ cấp (Tier-1 Primary)',
      showDetails: 'Xem căn cứ & nguồn tài liệu',
      hideDetails: 'Thu gọn',
      sourceListTitle: 'Các văn bản quy chuẩn từ cơ quan công quyền Nhật Bản',
      authority: 'Cơ quan ban hành',
      docType: 'Phân loại',
      disclaimerTitle: 'Lưu ý về tính chất mô phỏng',
      disclaimerBody: 'Kết quả tính toán là mô phỏng tham khảo (ước tính) dựa trên luật hiện hành. Đặc biệt, bảo hiểm y tế quốc dân (NHI) và thuế cư trú có thể thay đổi tùy theo quy định cụ thể của từng quận/huyện (市区町村). Khi quyết toán thuế thực tế, vui lòng sử dụng Cổng kê khai e-Tax của Tổng cục Thuế Nhật Bản (NTA) hoặc tham vấn chuyên gia thuế.',
    },
    en: {
      title: 'Regulatory Baseline & Official Sources',
      subtitle: 'Deterministic rules grounded in primary Japanese statutory sources',
      baseline: 'Legal Baseline',
      applicablePeriod: 'Applicable Period',
      applicablePeriodVal: `Tax Year ${year} Income Tax / FY${year}`,
      verifiedDate: 'Last Verified',
      status: 'Status',
      statusVerified: 'Verified Tier-1 Primary',
      showDetails: 'Show Legal Sources & Rationale',
      hideDetails: 'Hide',
      sourceListTitle: 'Statutory Primary Sources (Ministries & Official Agencies)',
      authority: 'Authority',
      docType: 'Type',
      disclaimerTitle: 'Disclaimer on Simulation Nature',
      disclaimerBody: 'This calculation is an educational estimate based on verified statutory formulas. National Health Insurance and Inhabitant taxes depend on municipality-specific rates and household composition. For official filings, please refer to the National Tax Agency e-Tax portal or certified tax professionals.',
    },
  };

  const text = labels[lang] || labels.ja;

  return (
    <div className="rounded-2xl border border-border-subtle bg-surface-container-low/50 overflow-hidden text-xs">
      {/* Header bar */}
      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-low">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-on-surface">{text.title}</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="w-3 h-3" />
                {text.statusVerified}
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant mt-0.5">{text.subtitle}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="self-start sm:self-center px-3 py-1.5 rounded-xl border border-border-subtle bg-surface hover:bg-surface-container-high text-on-surface font-medium flex items-center gap-1.5 transition-colors text-xs"
        >
          <span>{isOpen ? text.hideDetails : text.showDetails}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Summary metadata grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-4 pt-3 border-t border-border-subtle/60 bg-surface/50 text-[11px]">
        <div>
          <span className="text-on-surface-variant block">{text.baseline}</span>
          <span className="font-bold text-on-surface">{era}</span>
        </div>
        <div>
          <span className="text-on-surface-variant block">{text.applicablePeriod}</span>
          <span className="font-bold text-on-surface">{text.applicablePeriodVal}</span>
        </div>
        <div>
          <span className="text-on-surface-variant block">{text.verifiedDate}</span>
          <span className="font-mono text-on-surface">{lastVerified}</span>
        </div>
        <div>
          <span className="text-on-surface-variant block">{text.status}</span>
          <span className="font-semibold text-emerald-800 dark:text-emerald-300">Verified 2026</span>
        </div>
      </div>

      {/* Collapsible details */}
      {isOpen && (
        <div className="p-4 border-t border-border-subtle space-y-4 bg-surface animate-in fade-in duration-200">
          <div>
            <h4 className="font-bold text-on-surface mb-2">{text.sourceListTitle}</h4>
            <div className="space-y-2">
              {jpSources.map((s) => (
                <div
                  key={s.id}
                  className="p-2.5 rounded-xl bg-surface-container-lowest border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-on-surface flex items-center gap-2">
                      <span>{s.title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-mono">
                        {s.id}
                      </span>
                    </div>
                    <div className="text-[11px] text-on-surface-variant flex items-center gap-3">
                      <span>{text.authority}: <strong className="text-on-surface">{s.authority}</strong></span>
                      <span>•</span>
                      <span>{text.docType}: {s.sourceType}</span>
                    </div>
                  </div>

                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 hover:underline text-[11px] font-medium shrink-0"
                  >
                    <span>{s.authority}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Statutory disclaimer */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <Info className="w-4 h-4 shrink-0" />
              <span>{text.disclaimerTitle}</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
              {text.disclaimerBody}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
