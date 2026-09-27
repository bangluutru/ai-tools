/**
 * @file packages/core/src/components/tax/TaxBreakdownTable.jsx
 * @description Bảng kê chi tiết từng loại thuế và bảo hiểm xã hội (Itemized Tax & Social Security Breakdown).
 * Hỗ trợ nút xem giải thích 3 tầng [?] trực tiếp cho từng khoản mục.
 */

import React from 'react';
import {
  HelpCircle,
  Scale,
  HeartPulse,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';
import { formatPercent, formatRatePeriods, formatYen } from '../../utils/tax/knowledge/rateLabels.js';

export default function TaxBreakdownTable({
  result,
  onSelectTaxDetail,
  lang = 'ja',
  t,
}) {
  if (!result) return null;

  const {
    incomeTax = {},
    residentTax = {},
    enterpriseTax,
    consumptionTax,
    corporateTax,
    socialInsurance = {},
    summary = {},
  } = result;

  const formatJPY = formatYen;
  const L = (ja, vi, en) => (lang === 'ja' ? ja : lang === 'vi' ? vi : en);

  // 1. Build List of Public Taxes
  const taxItems = [];

  // Income Tax & Reconstruction Tax
  if (incomeTax.totalIncomeTax > 0 || incomeTax.baseIncomeTax > 0) {
    const reconRate = result.rules?.incomeTax?.reconstructionTaxRate ?? 0.021;
    taxItems.push({
      id: 'income_tax',
      name_ja: '所得税',
      name_vi: 'Thuế thu nhập cá nhân (所得税)',
      name_en: 'National Income Tax',
      baseLabel: `${formatJPY(incomeTax.taxableIncome)} (${L('課税所得', 'Thu nhập chịu thuế', 'Taxable income')})`,
      rateLabel: `${formatPercent(incomeTax.marginalRate || incomeTax.bracket?.rate || 0)} (${L('累進税率', 'Lũy tiến', 'Progressive')})`,
      amount: incomeTax.baseIncomeTax,
    });

    taxItems.push({
      id: 'income_tax',
      name_ja: '復興特別所得税',
      name_vi: 'Thuế tái thiết động đất (復興特別所得税)',
      name_en: 'Reconstruction Special Income Tax',
      baseLabel: `${formatJPY(incomeTax.baseIncomeTax)} (${L('基準所得税額', 'Số thuế TNCN gốc', 'Base income tax')})`,
      rateLabel: formatPercent(reconRate),
      amount: incomeTax.reconstructionTax,
    });

    if (incomeTax.roundingAdjustment) {
      taxItems.push({
        id: 'income_tax',
        name_ja: '端数処理（100円未満切捨て）',
        name_vi: 'Làm tròn (bỏ phần dưới 100 yên)',
        name_en: 'Rounding (below 100 JPY truncated)',
        baseLabel: formatJPY(incomeTax.baseIncomeTax + incomeTax.reconstructionTax),
        rateLabel: '—',
        amount: incomeTax.roundingAdjustment,
      });
    }
  }

  // Resident Tax
  if (residentTax.totalResidentTax > 0) {
    const prefRate = residentTax.prefectureRate ?? 0;
    const muniRate = residentTax.municipalRate ?? 0;
    if (residentTax.incomeLevy > 0) {
      const credit = residentTax.adjustmentCredit?.total || 0;
      taxItems.push({
        id: 'resident_tax',
        name_ja: '住民税（所得割）',
        name_vi: 'Thuế cư trú phần tính theo thu nhập (所得割)',
        name_en: 'Resident Tax (Income-levied portion)',
        baseLabel: `${formatJPY(residentTax.taxableIncome)} (${L('住民税課税所得', 'Thu nhập tính thuế cư trú', 'Resident taxable income')})${credit > 0 ? ` − ${L('調整控除', 'điều chỉnh', 'adj. credit')} ${formatJPY(credit)}` : ''}`,
        rateLabel: `${formatPercent(prefRate + muniRate)} (${L('都道府県', 'Tỉnh', 'Pref')} ${formatPercent(prefRate)}＋${L('市区町村', 'Xã', 'Muni')} ${formatPercent(muniRate)})`,
        amount: residentTax.incomeLevy,
      });
    }

    taxItems.push({
      id: 'resident_tax',
      name_ja: '住民税（均等割）',
      name_vi: 'Thuế cư trú phần đồng đều (均等割)',
      name_en: 'Resident Tax (Per-capita levy)',
      baseLabel: residentTax.perCapitaSurcharge > 0
        ? L(`定額（標準4,000円＋県独自の超過課税${residentTax.perCapitaSurcharge.toLocaleString()}円）`, `Cố định (chuẩn 4,000 + phụ thu tỉnh ${residentTax.perCapitaSurcharge.toLocaleString()} yên)`, `Flat (4,000 standard + prefectural surcharge ${residentTax.perCapitaSurcharge.toLocaleString()})`)
        : L('定額（道府県民税＋市区町村民税）', 'Mức cố định (Tỉnh + Xã/Phường)', 'Flat rate (prefecture + municipality)'),
      rateLabel: `${formatJPY(residentTax.perCapitaFlat)} / ${L('年', 'năm', 'yr')}`,
      amount: residentTax.perCapitaFlat,
    });

    if (residentTax.forestryTax > 0) {
      taxItems.push({
        id: 'resident_tax',
        name_ja: '森林環境税（国税）',
        name_vi: 'Thuế môi trường rừng (森林環境税)',
        name_en: 'Forest Environment Tax (national)',
        baseLabel: L('住民税均等割と併せて徴収', 'Thu cùng thuế cư trú', 'Collected with resident tax'),
        rateLabel: `${formatJPY(residentTax.forestryTax)} / ${L('年', 'năm', 'yr')}`,
        amount: residentTax.forestryTax,
      });
    }
  }

  // Enterprise Tax (if applicable)
  if (enterpriseTax && enterpriseTax.enterpriseTax > 0) {
    const catName = enterpriseTax.category?.[`name_${lang}`] || enterpriseTax.category?.name_ja || '';
    taxItems.push({
      id: 'enterprise_tax',
      name_ja: '個人事業税',
      name_vi: 'Thuế kinh doanh cá nhân (個人事業税)',
      name_en: 'Individual Enterprise Tax',
      baseLabel: `${formatJPY(enterpriseTax.taxableIncome)} (${L('事業主控除後', 'Sau giảm trừ chủ kinh doanh', 'After proprietor deduction')} ${formatJPY(enterpriseTax.proprietorDeduction)})`,
      rateLabel: `${formatPercent(enterpriseTax.rate)}${catName ? ` (${catName})` : ''}`,
      amount: enterpriseTax.enterpriseTax,
    });
  }

  // Consumption Tax (if applicable)
  if (consumptionTax && consumptionTax.payableTax > 0) {
    const methodLabels = {
      special_20: L('2割特例', 'Đặc lệ 20%', '20% special rule'),
      simplified: L('簡易課税', 'Khai giản dịch (簡易課税)', 'Simplified method'),
      standard: L('本則課税', 'Khai tiêu chuẩn (本則課税)', 'Standard method'),
    };
    taxItems.push({
      id: 'consumption_tax',
      name_ja: '消費税及び地方消費税',
      name_vi: 'Thuế tiêu thụ & Thuế tiêu thụ địa phương (消費税)',
      name_en: 'Consumption Tax & Local Consumption Tax',
      baseLabel: `${formatJPY(consumptionTax.taxableSales)} (${methodLabels[consumptionTax.calcMethod] || consumptionTax.calcMethod})`,
      rateLabel: formatPercent(consumptionTax.taxRate || 0),
      amount: consumptionTax.payableTax,
    });
  }

  // Corporate Taxes (if applicable)
  if (corporateTax && corporateTax.totalCorporateTax > 0) {
    const ct = result.rules?.corporateTax || {};
    taxItems.push({
      id: 'corporate_tax',
      name_ja: '法人税・地方法人税',
      name_vi: 'Thuế doanh nghiệp & Thuế DN địa phương (法人税)',
      name_en: 'Corporate Tax & Local Corporate Tax',
      baseLabel: `${formatJPY(corporateTax.taxableIncome)} (${L('所得金額', 'Lợi nhuận tính thuế', 'Taxable profit')})`,
      rateLabel: corporateTax.taxableIncome <= 8000000
        ? `${formatPercent(ct.nationalRateBelow8M || 0)} (${L('軽減税率', 'thuế suất ưu đãi', 'reduced')})`
        : `${formatPercent(ct.nationalRateBelow8M || 0)} / ${formatPercent(ct.nationalRateAbove8M || 0)}`,
      amount: corporateTax.corporateTax + corporateTax.localCorporateTax,
    });

    taxItems.push({
      id: 'corporate_tax',
      name_ja: '法人住民税（法人税割＋均等割）',
      name_vi: 'Thuế cư trú pháp nhân (法人住民税)',
      name_en: 'Corporate Inhabitant Tax',
      baseLabel: L(`均等割 ${formatJPY(corporateTax.residentPerCapita)}（赤字でも課税）＋法人税割`, `Đồng đều ${formatJPY(corporateTax.residentPerCapita)} (lỗ vẫn đóng) + tính theo thuế`, `Per-capita ${formatJPY(corporateTax.residentPerCapita)} (even in loss) + tax levy`),
      rateLabel: `${formatPercent(ct.residentTaxInhabitantRate || 0)} + ${L('均等割', 'đồng đều', 'per-capita')}`,
      amount: corporateTax.corporateResidentTax,
    });

    taxItems.push({
      id: 'corporate_tax',
      name_ja: '法人事業税・特別法人事業税',
      name_vi: 'Thuế kinh doanh pháp nhân (法人事業税)',
      name_en: 'Corporate Enterprise Tax',
      baseLabel: formatJPY(corporateTax.taxableIncome),
      rateLabel: (ct.enterpriseTaxIncomeRates || []).map((r) => formatPercent(r.rate)).join(' / ') || '—',
      amount: corporateTax.enterpriseTax + corporateTax.specialEnterpriseTax,
    });
  }

  // 2. Build List of Social Insurance Items
  const socialItems = [];
  const si = socialInsurance;
  const estimateSuffix = si.isEstimated ? L('（概算）', ' (ước tính)', ' (estimate)') : '';
  if (si.isCompanyEmployee) {
    const std = si.standardMonthly || {};
    const kenpoBase = `${L('標準報酬月額', 'Lương chuẩn tháng', 'Standard monthly remuneration')} ${formatJPY(std.kenpo)} × 12${estimateSuffix}`;
    if (si.healthInsurance > 0) {
      socialItems.push({
        id: 'social_insurance',
        name_ja: '健康保険料（本人負担分）',
        name_vi: 'BHYT công ty (Phần NLĐ đóng - 健康保険)',
        name_en: 'Health Insurance (Employee share)',
        baseLabel: kenpoBase,
        rateLabel: `${formatRatePeriods(si.rates?.health, { share: 0.5, lang })} (${L('折半後', 'NLĐ 50%', 'employee 50%')})`,
        amount: si.healthInsurance,
      });
    }
    if (si.childSupportContribution > 0) {
      socialItems.push({
        id: 'social_insurance',
        name_ja: '子ども・子育て支援金（本人負担分）',
        name_vi: 'Tiền hỗ trợ nuôi dạy trẻ em (子ども・子育て支援金)',
        name_en: 'Child & Family Support Levy (Employee share)',
        baseLabel: `${kenpoBase.replace(' × 12', ` × ${si.childSupportMonths || 0}`)}`,
        rateLabel: formatRatePeriods(si.rates?.childSupport, { share: 0.5, lang }),
        amount: si.childSupportContribution,
      });
    }
    if (si.careInsurance > 0) {
      socialItems.push({
        id: 'social_insurance',
        name_ja: '介護保険料（第2号被保険者・40〜64歳）',
        name_vi: 'Bảo hiểm chăm sóc dài hạn (介護保険 - 40〜64 tuổi)',
        name_en: 'Long-term Care Insurance (Age 40-64)',
        baseLabel: kenpoBase,
        rateLabel: formatRatePeriods(si.rates?.care, { share: 0.5, lang }),
        amount: si.careInsurance,
      });
    }
    if (si.welfarePension > 0) {
      socialItems.push({
        id: 'social_insurance',
        name_ja: '厚生年金保険料（本人負担分）',
        name_vi: 'Hưu trí phúc lợi (厚生年金 - Phần NLĐ)',
        name_en: 'Employees Pension (Employee share)',
        baseLabel: `${L('標準報酬月額', 'Lương chuẩn tháng', 'Standard monthly remuneration')} ${formatJPY(std.pension)} × 12${estimateSuffix}`,
        rateLabel: formatPercent(si.rates?.pensionEmployee || 0),
        amount: si.welfarePension,
      });
    }
    if (si.employmentInsurance > 0) {
      socialItems.push({
        id: 'social_insurance',
        name_ja: '雇用保険料（本人負担分）',
        name_vi: 'Bảo hiểm thất nghiệp (雇用保険 - NLĐ đóng)',
        name_en: 'Employment Insurance (Employee share)',
        baseLabel: `${L('賃金総額', 'Tổng tiền lương', 'Total gross wages')} ${formatJPY(si.monthlySalaryAssumed)} × 12`,
        rateLabel: formatRatePeriods(si.rates?.employmentEmployee, { lang }),
        amount: si.employmentInsurance,
      });
    }
  } else {
    if (si.nationalHealthInsurance > 0) {
      socialItems.push({
        id: 'social_insurance',
        name_ja: '国民健康保険料（概算）',
        name_vi: 'BHYT Quốc dân (国民健康保険 - ước tính)',
        name_en: 'National Health Insurance (estimate)',
        baseLabel: L('前年の所得（旧ただし書き所得）', 'Thu nhập năm trước', 'Previous-year income'),
        rateLabel: L('市区町村により異なる', 'Khác nhau theo địa phương', 'Varies by municipality'),
        amount: si.nationalHealthInsurance,
      });
    }
    if (si.nationalPension > 0) {
      const npm = si.nationalPensionMonthly || {};
      socialItems.push({
        id: 'social_insurance',
        name_ja: '国民年金保険料',
        name_vi: 'Hưu trí Quốc dân (国民年金)',
        name_en: 'National Pension',
        baseLabel: L('定額（月額）', 'Mức cố định theo tháng', 'Flat monthly premium'),
        rateLabel: npm.previous && npm.previous !== npm.current
          ? `${formatJPY(npm.previous)} × ${npm.previousMonths} + ${formatJPY(npm.current)} × ${npm.currentMonths}`
          : `${formatJPY(npm.current)} × 12`,
        amount: si.nationalPension,
      });
    }
  }

  return (
    <div className="bg-surface border border-border-subtle rounded-2xl p-4 sm:p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
        <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-black">
            3
          </span>
          {t?.tabBreakdown || 'Bảng kê chi tiết các nghĩa vụ tài chính'}
        </h2>
        <span className="text-xs text-on-surface-variant">
          💡 {lang === 'ja' ? '「？」ボタンを押すと計算式と公式解説が確認できます' : lang === 'vi' ? 'Bấm nút [?] để xem công thức & cơ sở pháp lý' : 'Click [?] for formula trace & legal basis'}
        </span>
      </div>

      {/* Group A: Public Taxes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <Scale className="w-4 h-4" />
            {t?.taxSectionTitle || 'Công khố & Thuế (公租公課)'}
          </h3>
          <span className="text-xs font-mono font-bold text-rose-700 dark:text-rose-300">
            {formatJPY(summary.totalTaxes)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border-subtle text-on-surface-variant bg-surface-container-low/60">
                <th className="py-2.5 px-3 font-semibold rounded-l-lg">{lang === 'ja' ? '税目 / 区分' : lang === 'vi' ? 'Loại thuế / Hạng mục' : 'Tax Type'}</th>
                <th className="py-2.5 px-3 font-semibold">{lang === 'ja' ? '課税対象 / 算出根拠' : lang === 'vi' ? 'Căn cứ tính' : 'Taxable Base'}</th>
                <th className="py-2.5 px-3 font-semibold">{lang === 'ja' ? '適用税率' : lang === 'vi' ? 'Thuế suất' : 'Rate'}</th>
                <th className="py-2.5 px-3 font-semibold text-right">{lang === 'ja' ? '概算税額' : lang === 'vi' ? 'Số tiền' : 'Amount'}</th>
                <th className="py-2.5 px-2 font-semibold text-center rounded-r-lg w-12">{lang === 'ja' ? '解説' : lang === 'vi' ? 'Chi tiết' : 'Info'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/60">
              {taxItems.map((item, idx) => {
                const displayName = item[`name_${lang}`] || item.name_ja;
                return (
                  <tr key={idx} className="hover:bg-surface-container-low/40 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-on-surface">
                      <div className="flex flex-col">
                        <span>{displayName}</span>
                        {lang !== 'ja' && (
                          <span className="text-[10px] text-on-surface-variant font-mono">
                            ({item.name_ja})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-on-surface-variant font-mono text-[11px]">{item.baseLabel}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-on-surface font-medium">{item.rateLabel}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700 dark:text-rose-300">
                      {formatJPY(item.amount)}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => onSelectTaxDetail(item.id)}
                        className="p-1 rounded-md text-on-surface-variant hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                        aria-label={lang === 'ja' ? `${displayName}の計算根拠と公式解説を見る` : lang === 'vi' ? `Xem giải thích và công thức ${displayName}` : `View calculation basis and official guide for ${displayName}`}
                        title={lang === 'ja' ? '計算根拠と公式解説を見る' : lang === 'vi' ? 'Xem giải thích & công thức' : 'View formula & guide'}
                      >
                        <HelpCircle className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Group B: Social Insurance */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
            <HeartPulse className="w-4 h-4" />
            {t?.socialSectionTitle || 'Bảo trợ xã hội & Bảo hiểm (社会保障・社会保険料)'}
          </h3>
          <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
            {formatJPY(summary.totalSocialInsurance)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border-subtle text-on-surface-variant bg-surface-container-low/60">
                <th className="py-2.5 px-3 font-semibold rounded-l-lg">{lang === 'ja' ? '保険種別' : lang === 'vi' ? 'Loại bảo hiểm' : 'Insurance Type'}</th>
                <th className="py-2.5 px-3 font-semibold">{lang === 'ja' ? '算定基礎' : lang === 'vi' ? 'Căn cứ tính' : 'Base'}</th>
                <th className="py-2.5 px-3 font-semibold">{lang === 'ja' ? '料率・負担比率' : lang === 'vi' ? 'Tỷ lệ đóng' : 'Rate'}</th>
                <th className="py-2.5 px-3 font-semibold text-right">{lang === 'ja' ? '本人負担額' : lang === 'vi' ? 'Số tiền đóng' : 'Amount'}</th>
                <th className="py-2.5 px-2 font-semibold text-center rounded-r-lg w-12">{lang === 'ja' ? '解説' : lang === 'vi' ? 'Chi tiết' : 'Info'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/60">
              {socialItems.map((item, idx) => {
                const displayName = item[`name_${lang}`] || item.name_ja;
                return (
                  <tr key={idx} className="hover:bg-surface-container-low/40 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-on-surface">
                      <div className="flex flex-col">
                        <span>{displayName}</span>
                        {lang !== 'ja' && (
                          <span className="text-[10px] text-on-surface-variant font-mono">
                            ({item.name_ja})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-on-surface-variant font-mono text-[11px]">{item.baseLabel}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-on-surface font-medium">{item.rateLabel}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {formatJPY(item.amount)}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => onSelectTaxDetail('social_insurance')}
                        className="p-1 rounded-md text-on-surface-variant hover:text-indigo-600 hover:bg-indigo-500/10 transition-colors"
                        aria-label={lang === 'ja' ? '社会保険料の計算根拠と公式解説を見る' : lang === 'vi' ? 'Xem giải thích và công thức bảo hiểm xã hội' : 'View calculation basis and official guide for social insurance'}
                        title={lang === 'ja' ? '計算根拠と公式解説を見る' : lang === 'vi' ? 'Xem giải thích & công thức' : 'View formula & guide'}
                      >
                        <HelpCircle className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Footer Line */}
      <div className="p-3.5 rounded-xl bg-surface-container-low border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
        <span className="font-semibold text-on-surface">
          {t?.grandTotalLabel || 'Tổng toàn bộ nghĩa vụ công (Thuế ＋ BHXH):'}
        </span>
        <div className="flex items-center gap-3">
          <span className="font-mono font-black text-sm text-on-surface">
            {formatJPY(summary.totalFinancialBurden)}
          </span>
          <span className="text-[11px] text-on-surface-variant font-mono">
            ({summary.grossEarnings > 0 ? ((summary.totalFinancialBurden / summary.grossEarnings) * 100).toFixed(1) : 0}% {lang === 'ja' ? 'の負担比率' : lang === 'vi' ? 'tổng thu nhập' : 'of gross'})
          </span>
        </div>
      </div>
    </div>
  );
}
