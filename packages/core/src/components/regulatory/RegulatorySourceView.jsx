/**
 * @file packages/core/src/components/regulatory/RegulatorySourceView.jsx
 * @description Component chung hiển thị minh bạch căn cứ pháp lý, nguồn chính thức (Official Sources),
 * thời điểm thẩm định và ghi chú quy chuẩn cho toàn bộ các công cụ pháp lý (Tax, Insurance, v.v.).
 */

import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, ExternalLink, ShieldCheck, Info } from 'lucide-react';
import { OfficialSourceRegistry } from '../../regulatory/sourceRegistry.js';

export default function RegulatorySourceView({
  sourceIds = [],
  sources: customSources = null,
  applicablePeriodText = '令和8年度（2026年4月〜2027年3月）',
  era = '令和8年度',
  lastVerified = '2026-09-10',
  disclaimer = null,
  lang = 'ja',
}) {
  const [isOpen, setIsOpen] = useState(false);

  // Lấy danh sách nguồn từ sourceIds hoặc sources (hỗ trợ cả mảng string ID và mảng object)
  const rawList = customSources && customSources.length > 0
    ? customSources
    : (sourceIds && sourceIds.length > 0 ? sourceIds : []);

  const resolvedSources = rawList
    .map((item) => {
      if (typeof item === 'string') {
        return OfficialSourceRegistry.get(item) || {
          id: item,
          title: item,
          authority: '',
          url: '#',
          sourceType: 'official'
        };
      }
      return item;
    })
    .filter(Boolean);

  const labels = {
    ja: {
      title: '制度基準・公式根拠（出典）',
      subtitle: '公的機関の一次情報源に基づく検証済みルール',
      baseline: '制度基準',
      applicablePeriod: '適用対象',
      verifiedDate: '最終検証日',
      status: '検証状況',
      statusVerified: '公式一次ソース適合 (Tier-1 Primary)',
      showDetails: '根拠・出典を表示',
      hideDetails: '閉じる',
      sourceListTitle: '参照している公的機関の一次情報源 (Official Primary Sources)',
      authority: '所管省庁・機関',
      docType: '種別',
      disclaimerTitle: '試算の性質に関するご留意事項',
      defaultDisclaimer:
        '本シミュレーターの計算結果は公式制度・法令データに基づく参考試算（概算）です。実際の給与控除額は、標準報酬月額の決定時期（定時決定・随時改定）や端数処理、加入する健康保険組合により異なる場合があります。',
    },
    vi: {
      title: 'Căn cứ pháp lý & Nguồn chính thức',
      subtitle: 'Bộ quy tắc xác minh trực tiếp từ nguồn sơ cấp công quyền Nhật Bản',
      baseline: 'Chế độ căn cứ',
      applicablePeriod: 'Kỳ áp dụng',
      verifiedDate: 'Ngày đối chiếu',
      status: 'Trạng thái',
      statusVerified: 'Chuẩn nguồn sơ cấp (Tier-1 Primary)',
      showDetails: 'Xem chi tiết căn cứ & nguồn',
      hideDetails: 'Thu gọn',
      sourceListTitle: 'Các nguồn dữ liệu sơ cấp được trích dẫn (Official Primary Sources)',
      authority: 'Cơ quan ban hành',
      docType: 'Loại tài liệu',
      disclaimerTitle: 'Lưu ý về tính chất mô phỏng',
      defaultDisclaimer:
        'Kết quả tính toán là mô phỏng tham khảo dựa trên quy chuẩn pháp luật chính thức. Số tiền khấu trừ bảng lương thực tế có thể chênh lệch nhỏ tùy thuộc vào thời điểm xét định thù lao định kỳ (tháng 4-6) hoặc công đoàn bảo hiểm riêng.',
    },
    en: {
      title: 'Statutory Basis & Official Sources',
      subtitle: 'Rules verified against official Tier-1 primary sources',
      baseline: 'Statutory Base',
      applicablePeriod: 'Applicable Period',
      verifiedDate: 'Last Verified',
      status: 'Status',
      statusVerified: 'Verified Tier-1 Primary',
      showDetails: 'Show Legal Sources & Rationale',
      hideDetails: 'Hide',
      sourceListTitle: 'Statutory Primary Sources (Ministries & Official Agencies)',
      authority: 'Authority',
      docType: 'Type',
      disclaimerTitle: 'Disclaimer on Simulation Nature',
      defaultDisclaimer:
        'Calculations are educational estimates based on statutory rules. Actual payroll deductions may slightly differ depending on regular determination timing and health insurance union rules.',
    },
  };

  const text = labels[lang] || labels.ja;
  const activeDisclaimer = disclaimer || text.defaultDisclaimer;

  return (
    <div className="rounded-2xl border border-border-subtle bg-surface-container-low/50 overflow-hidden text-xs">
      {/* Header bar */}
      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-low">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
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
          className="self-start sm:self-center px-3 py-1.5 rounded-xl border border-border-subtle bg-surface hover:bg-surface-container-high text-on-surface font-medium flex items-center gap-1.5 transition-colors text-xs cursor-pointer"
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
          <span className="font-bold text-on-surface">{applicablePeriodText}</span>
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
          {resolvedSources.length > 0 && (
            <div>
              <h4 className="font-bold text-on-surface mb-2">{text.sourceListTitle}</h4>
              <div className="space-y-2">
                {resolvedSources.map((s) => (
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
                        <span>
                          {text.authority}: <strong className="text-on-surface">{s.authority}</strong>
                        </span>
                        <span>•</span>
                        <span>{text.docType}: {s.sourceType}</span>
                      </div>
                    </div>

                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline text-[11px] font-medium shrink-0"
                    >
                      <span>{s.authority}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Statutory disclaimer */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <Info className="w-4 h-4 shrink-0" />
              <span>{text.disclaimerTitle}</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
              {activeDisclaimer}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
