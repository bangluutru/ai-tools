/**
 * @file packages/core/src/components/immigration/ResidencePermitFeePanel.jsx
 * @description
 * Khối hiển thị lệ phí 在留許可 dùng chung (gia hạn / đổi tư cách / gia đình / vĩnh trú).
 * Dữ liệu lấy từ shared/immigrationFeeTable.js — KHÔNG hardcode số tiền trong UI.
 * - Hiển thị khoảng phí + bậc dự kiến (người dùng chọn thời hạn dự kiến, mặc định 1 năm)
 * - Thông báo nổi bật về mốc 01/10/2026 và chế độ giảm phí
 */

import React from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { PERIOD_OF_STAY_FEE_TIERS } from '../../japan/immigration/shared/immigrationFeeTable.js';

const LABELS = {
  vi: {
    title: 'Lệ phí khi được cấp phép',
    method: 'Hình thức nộp hồ sơ',
    counter: 'Tại quầy Cục XNC (tem 収入印紙)',
    online: 'Online (thanh toán combini / ngân hàng)',
    expected: 'Thời hạn lưu trú bạn dự kiến được cấp',
    range: 'Khoảng phí (tùy thời hạn được cấp)',
    likely: 'Mức phí nếu được cấp thời hạn đã chọn',
    paymentFee: 'Phí thanh toán online',
    total: 'Tổng phải trả',
    tiers: 'Bảng phí theo thời hạn được cấp (hồ sơ tiếp nhận từ 01/10/2026)',
    noteTitle: 'QUAN TRỌNG: Lệ phí thay đổi từ 01/10/2026',
    reduction: 'Chế độ giảm phí',
    official: 'Trang chính thức của Cục XNC',
    onlineNA: 'Vĩnh trú chỉ nộp tại quầy.',
    payable: 'Chỉ nộp khi được cấp phép; bị từ chối thì không mất phí.',
  },
  ja: {
    title: '許可時の手数料',
    method: '申請方法',
    counter: '窓口（収入印紙）',
    online: 'オンライン（コンビニ・銀行決済）',
    expected: '許可される見込みの在留期間',
    range: '手数料の幅（許可される在留期間で決定）',
    likely: '選択した在留期間の場合の手数料',
    paymentFee: '決済手数料',
    total: '支払額合計',
    tiers: '在留期間別の手数料（2026年10月1日以降受付分）',
    noteTitle: '重要：2026年10月1日から手数料が改定されます',
    reduction: '減額措置',
    official: '出入国在留管理庁 公式ページ',
    onlineNA: '永住許可申請は窓口のみです。',
    payable: '許可時のみ納付（不許可の場合は不要）。',
  },
  en: {
    title: 'Fee payable upon grant',
    method: 'Filing method',
    counter: 'Counter (revenue stamps)',
    online: 'Online (convenience store / bank payment)',
    expected: 'Period of stay you expect to be granted',
    range: 'Fee range (depends on period granted)',
    likely: 'Fee for the selected period',
    paymentFee: 'Online payment fee',
    total: 'Total payable',
    tiers: 'Fee by period granted (applications accepted from 1 Oct 2026)',
    noteTitle: 'IMPORTANT: Fees change on 1 Oct 2026',
    reduction: 'Fee reduction',
    official: 'Official ISA page',
    onlineNA: 'Permanent residence applications are counter-only.',
    payable: 'Paid only upon approval; no fee if denied.',
  },
};

const yen = (n) => `¥${Number(n || 0).toLocaleString('ja-JP')}`;

/**
 * @param {Object} props
 * @param {ReturnType<import('../../japan/immigration/shared/immigrationFeeTable.js').getResidencePermitFee>} props.fee
 * @param {'vi'|'ja'|'en'} [props.lang]
 * @param {string} [props.method]
 * @param {(m: string) => void} [props.onMethodChange]
 * @param {string} [props.expectedPeriod]
 * @param {(p: string) => void} [props.onExpectedPeriodChange]
 * @param {boolean} [props.showControls=true]
 */
export function ResidencePermitFeePanel({
  fee,
  lang = 'vi',
  method = 'counter',
  onMethodChange,
  expectedPeriod = '1y',
  onExpectedPeriodChange,
  showControls = true,
}) {
  if (!fee) return null;
  const t = LABELS[lang] || LABELS.vi;
  const pick = (base) => fee[`${base}_${lang === 'ja' ? 'ja' : lang === 'en' ? 'en' : 'vi'}`];
  const tierLabel = (tier) => (lang === 'ja' ? tier.label_ja : lang === 'en' ? tier.label_en : tier.label_vi);
  const isPermanent = fee.procedure === 'permanent';

  return (
    <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/30 shadow-sm space-y-4">
      <h3 className="text-sm font-bold text-primary">{t.title}</h3>

      <div role="note" className="p-3 rounded-xl border bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
        <div className="space-y-1">
          <p className="text-xs font-bold">{t.noteTitle}</p>
          <p className="text-xs leading-relaxed">{pick('transitionNote')}</p>
          <p className="text-xs leading-relaxed">
            <span className="font-semibold">{t.reduction}: </span>
            {pick('reductionNote')}
          </p>
        </div>
      </div>

      {showControls && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {!isPermanent && onMethodChange && (
            <label className="space-y-1 block">
              <span className="text-xs font-semibold text-on-surface-variant">{t.method}</span>
              <select
                aria-label={t.method}
                value={method}
                onChange={(e) => onMethodChange(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant/50 text-on-surface rounded-lg px-3 py-2 text-xs"
              >
                <option value="counter">{t.counter}</option>
                <option value="online">{t.online}</option>
              </select>
            </label>
          )}
          {!isPermanent && onExpectedPeriodChange && (
            <label className="space-y-1 block">
              <span className="text-xs font-semibold text-on-surface-variant">{t.expected}</span>
              <select
                aria-label={t.expected}
                value={expectedPeriod}
                onChange={(e) => onExpectedPeriodChange(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant/50 text-on-surface rounded-lg px-3 py-2 text-xs"
              >
                {PERIOD_OF_STAY_FEE_TIERS.map((tier) => (
                  <option key={tier.id} value={tier.id}>{tierLabel(tier)}</option>
                ))}
              </select>
            </label>
          )}
        </div>
      )}

      {fee.dependsOnGrantedPeriod ? (
        <div className="space-y-2">
          <div className="text-xs text-on-surface-variant">{t.range}</div>
          <div className="text-xl font-black text-on-surface">{yen(fee.range.min)} – {yen(fee.range.max)}</div>
          <div className="text-xs text-on-surface-variant">{t.likely}: <span className="font-bold text-on-surface">{yen(fee.amount)}</span></div>
          {fee.onlinePaymentFee > 0 && (
            <div className="text-xs text-on-surface-variant">
              {t.paymentFee}: {yen(fee.onlinePaymentFee)} · {t.total}: <span className="font-bold">{yen(fee.totalPayable)}</span>
            </div>
          )}
          <details className="text-xs">
            <summary className="cursor-pointer font-semibold text-primary">{t.tiers}</summary>
            <table className="w-full mt-2 text-left">
              <tbody>
                {fee.tiers.map((tier) => (
                  <tr key={tier.id} className={tier.isExpected ? 'font-bold text-primary' : 'text-on-surface'}>
                    <td className="py-0.5 pr-2">{tierLabel(tier)}</td>
                    <td className="py-0.5 text-right">{yen(tier.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </div>
      ) : (
        <div className="text-2xl font-black text-on-surface">{yen(fee.amount)}</div>
      )}

      {fee.onlineNotAvailable && <p className="text-xs text-on-surface-variant">{t.onlineNA}</p>}
      <p className="text-[11px] text-on-surface-variant">{pick('paymentMethod')} · {t.payable}</p>
      <div className="flex flex-wrap gap-3 text-[11px]">
        <a href={fee.officialUrl} target="_blank" rel="noopener noreferrer" className="text-primary inline-flex items-center gap-1 hover:underline">
          {t.official} <ExternalLink className="w-3 h-3" />
        </a>
        <a href={fee.reductionUrl} target="_blank" rel="noopener noreferrer" className="text-primary inline-flex items-center gap-1 hover:underline">
          {t.reduction} <ExternalLink className="w-3 h-3" />
        </a>
      </div>
      <div className="text-[10px] font-mono text-outline">{fee.legalBasis}</div>
    </div>
  );
}

export default ResidencePermitFeePanel;
