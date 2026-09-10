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

  const formatJPY = (amount) => {
    return '¥' + Math.round(amount || 0).toLocaleString();
  };

  // 1. Build List of Public Taxes
  const taxItems = [];

  // Income Tax & Reconstruction Tax
  if (incomeTax.baseIncomeTax > 0 || incomeTax.totalIncomeTax > 0) {
    taxItems.push({
      id: 'income_tax',
      name_ja: '所得税',
      name_vi: 'Thuế thu nhập cá nhân (所得税)',
      name_en: 'National Income Tax',
      baseLabel: `${formatJPY(incomeTax.taxableIncome)} (${lang === 'ja' ? '課税所得' : lang === 'vi' ? 'Thu nhập chịu thuế' : 'Taxable income'})`,
      rateLabel: `${incomeTax.marginalRate ? (incomeTax.marginalRate * 100).toFixed(0) + '%' : '5% - 45%'} (${lang === 'ja' ? '累進税率' : lang === 'vi' ? 'Lũy tiến' : 'Progressive'})`,
      amount: incomeTax.baseIncomeTax,
    });

    taxItems.push({
      id: 'income_tax',
      name_ja: '復興特別所得税',
      name_vi: 'Thuế tái thiết động đất (復興特別所得税)',
      name_en: 'Reconstruction Special Income Tax',
      baseLabel: `${formatJPY(incomeTax.baseIncomeTax)} (${lang === 'ja' ? '基準所得税額' : lang === 'vi' ? 'Số thuế TNCN gốc' : 'Base income tax'})`,
      rateLabel: '2.1%',
      amount: incomeTax.reconstructionTax,
    });
  }

  // Resident Tax
  if (residentTax.totalResidentTax > 0) {
    taxItems.push({
      id: 'resident_tax',
      name_ja: '住民税（所得割）',
      name_vi: 'Thuế cư trú phần tính theo thu nhập (所得割)',
      name_en: 'Resident Tax (Income-levied portion)',
      baseLabel: `${formatJPY(residentTax.taxableIncomeResident)} (${lang === 'ja' ? '住民税課税所得' : lang === 'vi' ? 'Thu nhập tính thuế cư trú' : 'Resident taxable income'})`,
      rateLabel: `${((residentTax.prefRate + residentTax.muniRate) * 100).toFixed(0)}% (${lang === 'ja' ? '都道府県4%＋市区町村6%' : lang === 'vi' ? 'Tỉnh 4% + Xã 6%' : 'Pref 4% + Muni 6%'})`,
      amount: residentTax.incomeLevy,
    });

    taxItems.push({
      id: 'resident_tax',
      name_ja: '住民税（均等割＋森林環境税）',
      name_vi: 'Thuế cư trú phần đồng đều & Thuế rừng (均等割・森林税)',
      name_en: 'Resident Tax (Per-capita levy & Forest Tax)',
      baseLabel: lang === 'ja' ? '定額負担（全住民一律）' : lang === 'vi' ? 'Mức cố định áp dụng cho cư dân' : 'Flat rate per inhabitant',
      rateLabel: `${formatJPY(residentTax.perCapitaTotal)} / ${lang === 'ja' ? '年' : lang === 'vi' ? 'năm' : 'yr'}`,
      amount: residentTax.perCapitaTotal,
    });
  }

  // Enterprise Tax (if applicable)
  if (enterpriseTax && enterpriseTax.enterpriseTax > 0) {
    taxItems.push({
      id: 'enterprise_tax',
      name_ja: '個人事業税',
      name_vi: 'Thuế kinh doanh cá nhân (個人事業税)',
      name_en: 'Individual Enterprise Tax',
      baseLabel: `${formatJPY(enterpriseTax.taxableBusinessIncome)} (${lang === 'ja' ? '控除後所得' : lang === 'vi' ? 'Sau trừ 290 vạn' : 'After 2.9M deduction'})`,
      rateLabel: `${(enterpriseTax.taxRate * 100).toFixed(0)}% (${enterpriseTax.categoryName_ja})`,
      amount: enterpriseTax.enterpriseTax,
    });
  }

  // Consumption Tax (if applicable)
  if (consumptionTax && consumptionTax.payableTax > 0) {
    taxItems.push({
      id: 'consumption_tax',
      name_ja: '消費税及び地方消費税',
      name_vi: 'Thuế tiêu thụ & Thuế tiêu thụ địa phương (消費税)',
      name_en: 'Consumption Tax & Local Consumption Tax',
      baseLabel: `${formatJPY(consumptionTax.taxableSales)} (${consumptionTax.methodName_ja})`,
      rateLabel: consumptionTax.is20PercentRule ? '20%特例' : '10% (国7.8%＋地2.2%)',
      amount: consumptionTax.payableTax,
    });
  }

  // Corporate Taxes (if applicable)
  if (corporateTax && corporateTax.totalCorporateTax > 0) {
    taxItems.push({
      id: 'corporate_tax',
      name_ja: '法人税・地方法人税',
      name_vi: 'Thuế doanh nghiệp & Thuế DN địa phương (法人税)',
      name_en: 'Corporate Tax & Local Corporate Tax',
      baseLabel: `${formatJPY(corporateTax.corporateIncome)} (${lang === 'ja' ? '所得金額' : lang === 'vi' ? 'Lợi nhuận tính thuế' : 'Taxable profit'})`,
      rateLabel: corporateTax.corporateIncome <= 8000000 ? '15% (軽減税率)' : '15% / 23.2%',
      amount: corporateTax.corporateNationalTax + corporateTax.localCorporateTax,
    });

    taxItems.push({
      id: 'corporate_tax',
      name_ja: '法人住民税（法人税割＋均等割）',
      name_vi: 'Thuế cư trú pháp nhân (法人住民税)',
      name_en: 'Corporate Inhabitant Tax',
      baseLabel: lang === 'ja' ? '均等割（赤字でも7万円）＋税割' : lang === 'vi' ? 'Đồng đều (lỗ vẫn đóng 7 vạn) + tính theo thuế' : 'Per-capita (min 70k even in loss) + tax levy',
      rateLabel: '7.0% + 均等割',
      amount: corporateTax.corporateResidentTax,
    });

    taxItems.push({
      id: 'corporate_tax',
      name_ja: '法人事業税・特別法人事業税',
      name_vi: 'Thuế kinh doanh pháp nhân (法人事業税)',
      name_en: 'Corporate Enterprise Tax',
      baseLabel: formatJPY(corporateTax.corporateIncome),
      rateLabel: '約 3.5% 〜 7.0%',
      amount: corporateTax.corporateEnterpriseTax + corporateTax.specialEnterpriseTax,
    });
  }

  // 2. Build List of Social Insurance Items
  const socialItems = [];
  if (socialInsurance.healthInsurance > 0) {
    socialItems.push({
      id: 'social_insurance',
      name_ja: socialInsurance.isCompanySocial ? '健康保険料（本人負担分）' : '国民健康保険料',
      name_vi: socialInsurance.isCompanySocial ? 'BHYT công ty (Phần NLĐ đóng - 健康保険)' : 'BHYT Quốc dân (国民健康保険)',
      name_en: socialInsurance.isCompanySocial ? 'Health Insurance (Employee 50%)' : 'National Health Insurance',
      baseLabel: socialInsurance.isCompanySocial ? '標準報酬月額 (労使折半 50/50)' : '前年総所得金額',
      rateLabel: `約 ${(socialInsurance.healthRate * 100).toFixed(2)}%`,
      amount: socialInsurance.healthInsurance,
    });
  }

  if (socialInsurance.careInsurance > 0) {
    socialItems.push({
      id: 'social_insurance',
      name_ja: '介護保険料（第2号被保険者・40〜64歳）',
      name_vi: 'Bảo hiểm chăm sóc người cao tuổi (介護保険 - Từ 40 tuổi)',
      name_en: 'Nursing Care Insurance (Age 40-64)',
      baseLabel: lang === 'ja' ? '40歳以上65歳未満一律' : lang === 'vi' ? 'Bắt buộc với người từ 40-64 tuổi' : 'Compulsory age 40-64',
      rateLabel: `約 ${(socialInsurance.careRate * 100).toFixed(2)}%`,
      amount: socialInsurance.careInsurance,
    });
  }

  if (socialInsurance.pensionInsurance > 0) {
    socialItems.push({
      id: 'social_insurance',
      name_ja: socialInsurance.isCompanySocial ? '厚生年金保険料（本人負担分）' : '国民年金保険料',
      name_vi: socialInsurance.isCompanySocial ? 'Bảo hiểm hưu trí Kosei Nenkin (厚生年金 - NLĐ 50%)' : 'Bảo hiểm hưu trí Quốc dân (国民年金)',
      name_en: socialInsurance.isCompanySocial ? 'Employees Pension (Kosei Nenkin 50%)' : 'National Pension (Kokumin Nenkin)',
      baseLabel: socialInsurance.isCompanySocial ? '標準報酬月額 (上限65万円・労使折半)' : '法定定額（月額16,980円）',
      rateLabel: socialInsurance.isCompanySocial ? '9.15% (折半後)' : '定額',
      amount: socialInsurance.pensionInsurance,
    });
  }

  if (socialInsurance.employmentInsurance > 0) {
    socialItems.push({
      id: 'social_insurance',
      name_ja: '雇用保険料（本人負担分）',
      name_vi: 'Bảo hiểm thất nghiệp (雇用保険 - NLĐ đóng)',
      name_en: 'Employment Insurance (Employee share)',
      baseLabel: lang === 'ja' ? '賃金総額' : lang === 'vi' ? 'Tổng tiền lương thực lĩnh' : 'Total gross wages',
      rateLabel: '0.6% (一般事業)',
      amount: socialInsurance.employmentInsurance,
    });
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
