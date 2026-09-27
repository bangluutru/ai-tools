/**
 * @file packages/core/src/components/tax/ProgressiveForm.jsx
 * @description Biểu mẫu nhập liệu lũy tiến theo từng hồ sơ (Progressive Disclosure) cho bộ mô phỏng thuế Nhật Bản.
 * Tự động ẩn/hiện trường dựa trên profile được chọn, hỗ trợ 3 ngôn ngữ bình đẳng (JA, VI, EN).
 */

import React, { useState } from 'react';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Building,
  Users,
  ShieldAlert,
  Coins,
  Receipt,
  PiggyBank,
} from 'lucide-react';
import {
  getSupportedYearsMeta,
  getAllPrefectures,
  getTaxRules,
  DEFAULT_TAX_YEAR,
} from '../../utils/tax/taxRulesRegistry.js';
import { BusinessCategories } from '../../utils/tax/engines/enterpriseTaxEngine.js';
import { SimplifiedTaxCategories } from '../../utils/tax/engines/consumptionTaxEngine.js';

export default function ProgressiveForm({
  formValues,
  onChangeField,
  profile,
  lang = 'ja',
  t,
}) {
  const [showAdvancedDeductions, setShowAdvancedDeductions] = useState(false);
  const [showConsumptionDetails, setShowConsumptionDetails] = useState(false);

  const yearsMeta = getSupportedYearsMeta();
  const selectedRules = getTaxRules(formValues.year || DEFAULT_TAX_YEAR);
  const spouseLimitMan = Math.round((selectedRules.incomeTax.deductions.spouseIncomeLimit || 0) / 10000);
  const prefectures = getAllPrefectures();

  // Helper formatting numbers with commas
  const formatInputNumber = (val) => {
    if (val === undefined || val === null || val === '') return '';
    return Number(val).toLocaleString();
  };

  const parseNumberInput = (str) => {
    const clean = String(str).replace(/[^\d]/g, '');
    return clean === '' ? 0 : Number(clean);
  };

  const isSalaryProfile = ['part_time', 'employee', 'employee_side'].includes(profile);
  const isBizProfile = ['sole_proprietor', 'freelance'].includes(profile);
  const isCorporate = profile === 'corporate';
  const hasSideIncome = profile === 'employee_side' || Boolean(formValues.hasSideIncome);

  return (
    <div className="bg-surface border border-border-subtle rounded-2xl p-4 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between pb-3 mb-5 border-b border-border-subtle">
        <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-black">
            2
          </span>
          {t?.stepBasic || '② Thông tin thu nhập & Thiết lập cơ bản'}
        </h2>
        <span className="text-xs text-on-surface-variant flex items-center gap-1 font-mono">
          <Coins className="w-3.5 h-3.5 text-rose-500" />
          JPY (円)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {/* Tax Year */}
        <div>
          <label htmlFor="tax-select-year" className="block text-xs font-semibold text-on-surface mb-1">
            {t?.yearLabel || 'Năm tính thuế'}
          </label>
          <select
            id="tax-select-year"
            aria-label={t?.yearLabel || 'Năm tính thuế'}
            value={formValues.year || DEFAULT_TAX_YEAR}
            onChange={(e) => onChangeField('year', Number(e.target.value))}
            className="w-full text-xs sm:text-sm bg-surface-container-low border border-border-subtle rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:ring-1 focus:ring-rose-500 font-medium"
          >
            {yearsMeta.map((y) => (
              <option key={y.year} value={y.year}>
                {y[`label_${lang}`] || y.label_ja}
                {y.year === DEFAULT_TAX_YEAR ? (lang === 'ja' ? ' • 今年' : lang === 'vi' ? ' • Năm nay' : ' • Current') : ''}
              </option>
            ))}
          </select>
          {Number(formValues.year || DEFAULT_TAX_YEAR) === 2026 && (
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 flex items-start gap-1 font-medium">
              <Sparkles className="w-3 h-3 shrink-0 mt-0.5" />
              {lang === 'ja'
                ? '基礎控除104万円（合計所得489万円以下）・給与所得控除最低74万円を反映。改正は令和8年12月1日施行のため、会社員は年末調整で精算されます。'
                : lang === 'vi'
                ? 'Áp dụng giảm trừ cơ bản 104 vạn (tổng thu nhập ≤489 vạn) & giảm trừ lương tối thiểu 74 vạn. Luật có hiệu lực 01/12/2026 nên người đi làm được điều chỉnh khi quyết toán cuối năm (年末調整).'
                : 'Reflects 1.04M basic deduction (total income ≤4.89M) and 740k minimum employment deduction. Enacted 1 Dec 2026, so employees get the difference at year-end adjustment.'}
            </p>
          )}
        </div>

        {/* Prefecture */}
        <div>
          <label htmlFor="tax-select-prefecture" className="block text-xs font-semibold text-on-surface mb-1">
            {t?.prefectureLabel || 'Tỉnh / Thành phố sinh sống'}
          </label>
          <select
            id="tax-select-prefecture"
            aria-label={t?.prefectureLabel || 'Tỉnh / Thành phố sinh sống'}
            value={formValues.prefecture || 'tokyo'}
            onChange={(e) => onChangeField('prefecture', e.target.value)}
            className="w-full text-xs sm:text-sm bg-surface-container-low border border-border-subtle rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:ring-1 focus:ring-rose-500 font-medium"
          >
            {prefectures.map((pref) => (
              <option key={pref.id} value={pref.id}>
                {lang === 'ja'
                  ? pref.name_ja
                  : `${pref[`name_${lang}`] || pref.name_en} (${pref.name_ja})`}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-on-surface-variant mt-1">
            {t?.prefectureHelp || 'Tỷ lệ BHYT và thuế cư trú均等割 áp dụng theo tỉnh.'}
          </p>
        </div>

        {/* Age */}
        <div>
          <label htmlFor="tax-input-age" className="block text-xs font-semibold text-on-surface mb-1">
            {t?.ageLabel || 'Độ tuổi'}
          </label>
          <input
            id="tax-input-age"
            aria-label={t?.ageLabel || 'Độ tuổi'}
            type="number"
            min={15}
            max={99}
            value={formValues.age ?? 30}
            onChange={(e) => onChangeField('age', Number(e.target.value))}
            className="w-full text-xs sm:text-sm bg-surface-container-low border border-border-subtle rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono font-medium"
          />
          <p className="text-[11px] text-on-surface-variant mt-1">
            {Number(formValues.age) >= 40 && Number(formValues.age) < 65 ? (
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                ⚠️ {lang === 'ja' ? '介護保険料（約1.6%）が加算されます' : lang === 'vi' ? 'Áp dụng thêm BH chăm sóc 介護保険 (khoảng 1.6%)' : 'Care insurance (~1.6%) applies (age 40-64)'}
              </span>
            ) : (
              t?.ageHelp || '40-64 tuổi sẽ tự động tính thêm 介護保険.'
            )}
          </p>
        </div>
      </div>

      {/* Profile-Driven Main Incomes */}
      <div className="space-y-4 pt-2">
        {/* 1. Salary Inputs */}
        {isSalaryProfile && (
          <div className="p-4 rounded-xl bg-surface-container-low/60 border border-border-subtle space-y-3">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-blue-500" />
              <h3 className="text-xs sm:text-sm font-bold text-on-surface">
                {t?.salaryLabel || 'Tiền lương hàng năm (Lương Gross - 源泉徴収前の総支給額)'}
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-on-surface-variant font-mono font-semibold">
                    ¥
                  </span>
                  <input
                    id="tax-input-salary"
                    aria-label={t?.salaryLabel || 'Tiền lương hàng năm (Lương Gross)'}
                    type="text"
                    value={formatInputNumber(formValues.salary)}
                    onChange={(e) => onChangeField('salary', parseNumberInput(e.target.value))}
                    placeholder={t?.salaryPlaceholder || '4,500,000'}
                    className="w-full text-sm font-mono font-bold bg-surface border border-border-subtle rounded-lg pl-7 pr-3 py-2 text-on-surface focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
                <p className="text-[11px] text-on-surface-variant mt-1">
                  {t?.salaryHelp || 'Đã bao gồm thưởng, chưa trừ thuế và bảo hiểm.'}
                </p>
              </div>

              <div className="flex flex-col justify-center space-y-2">
                <label className="inline-flex items-center gap-2 text-xs text-on-surface cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formValues.hasYearEndAdjustment !== false}
                    onChange={(e) => onChangeField('hasYearEndAdjustment', e.target.checked)}
                    className="rounded border-border-subtle text-rose-500 focus:ring-rose-500"
                  />
                  <span>
                    {lang === 'ja'
                      ? '会社で年末調整を受けた（受ける予定）'
                      : lang === 'vi'
                      ? 'Đã/Sẽ quyết toán thuế cuối năm tại công ty (年末調整)'
                      : 'Company performs year-end tax adjustment'}
                  </span>
                </label>

                <div className="flex items-center gap-2 text-xs text-on-surface">
                  <label htmlFor="tax-select-employers" className="text-on-surface-variant text-[11px]">
                    {lang === 'ja' ? '勤務先（雇用元）の数:' : lang === 'vi' ? 'Số nơi nhận lương:' : 'Number of employers:'}
                  </label>
                  <select
                    id="tax-select-employers"
                    aria-label={lang === 'ja' ? '勤務先（雇用元）の数' : lang === 'vi' ? 'Số nơi nhận lương' : 'Number of employers'}
                    value={formValues.employersCount || 1}
                    onChange={(e) => onChangeField('employersCount', Number(e.target.value))}
                    className="bg-surface border border-border-subtle rounded px-2 py-1 text-xs text-on-surface font-mono"
                  >
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3+</option>
                  </select>
                </div>
                {Number(formValues.employersCount) > 1 && (
                  <div className="space-y-1">
                    <label htmlFor="tax-input-secondary-salary" className="block text-on-surface-variant text-[11px]">
                      {lang === 'ja' ? '従たる給与（年末調整されない給与）の年間収入' : lang === 'vi' ? 'Lương phụ cả năm (nơi không quyết toán 年末調整)' : 'Secondary salary (not year-end adjusted)'}
                    </label>
                    <input
                      id="tax-input-secondary-salary"
                      type="text"
                      value={formatInputNumber(formValues.secondarySalary)}
                      onChange={(e) => onChangeField('secondarySalary', parseNumberInput(e.target.value))}
                      placeholder="0"
                      className="w-full max-w-[12rem] text-xs font-mono bg-surface border border-border-subtle rounded px-2 py-1"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. Side Income */}
        {hasSideIncome && (
          <div className="p-4 rounded-xl bg-surface-container-low/60 border border-indigo-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs sm:text-sm font-bold text-on-surface">
                  {lang === 'ja' ? '副業収入（雑所得・事業所得等）' : lang === 'vi' ? 'Thu nhập từ việc làm thêm / ngoài giờ (副業)' : 'Side Income (Freelance / Side Business)'}
                </h3>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-200 border border-indigo-200/60 dark:border-indigo-800/50 font-semibold">
                {lang === 'ja' ? '20万円ルール判定対象' : lang === 'vi' ? 'Xét quy tắc 20 vạn yên' : '200k JPY rule check'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-on-surface mb-1">
                  {t?.sideIncomeRevLabel || 'Doanh thu việc phụ (副業売上)'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-on-surface-variant font-mono">¥</span>
                  <input
                    type="text"
                    value={formatInputNumber(formValues.sideIncomeRevenue)}
                    onChange={(e) => onChangeField('sideIncomeRevenue', parseNumberInput(e.target.value))}
                    placeholder="600,000"
                    className="w-full text-xs sm:text-sm font-mono font-bold bg-surface border border-border-subtle rounded-lg pl-7 pr-3 py-2 text-on-surface focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-on-surface mb-1">
                  {t?.sideIncomeExpLabel || 'Chi phí việc phụ (副業経費)'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-on-surface-variant font-mono">¥</span>
                  <input
                    type="text"
                    value={formatInputNumber(formValues.sideIncomeExpenses)}
                    onChange={(e) => onChangeField('sideIncomeExpenses', parseNumberInput(e.target.value))}
                    placeholder="150,000"
                    className="w-full text-xs sm:text-sm font-mono font-bold bg-surface border border-border-subtle rounded-lg pl-7 pr-3 py-2 text-on-surface focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="text-[11px] text-on-surface-variant bg-surface p-2.5 rounded-lg border border-border-subtle">
              💡 {lang === 'ja'
                ? '副業の「利益（売上 − 経費）」が20万円以下の場合、確定申告（所得税）は不要ですが、市区町村への住民税申告は必要です。'
                : lang === 'vi'
                ? 'Lợi nhuận việc phụ (Doanh thu − Chi phí) dưới 20 vạn yên thì miễn nộp thuế thu nhập lên NTA, NHƯNG vẫn phải nộp tờ khai thuế cư trú tại Tòa thị chính.'
                : 'If side profit (Revenue - Expenses) <= 200,000 JPY, income tax return is exempt, but municipal resident tax return is still required.'}
            </div>
          </div>
        )}

        {/* 3. Business Revenue & Expenses (Sole Proprietor & Freelance) */}
        {isBizProfile && (
          <div className="p-4 rounded-xl bg-surface-container-low/60 border border-emerald-500/20 space-y-4">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-500" />
              <h3 className="text-xs sm:text-sm font-bold text-on-surface">
                {lang === 'ja' ? '事業収支・申告方式' : lang === 'vi' ? 'Thu chi kinh doanh & Hình thức khai thuế' : 'Business Revenue & Return Mode'}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-on-surface mb-1">
                  {t?.businessRevLabel || 'Doanh thu kinh doanh trong năm (chưa thuế)'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-on-surface-variant font-mono">¥</span>
                  <input
                    type="text"
                    value={formatInputNumber(formValues.businessRevenue)}
                    onChange={(e) => onChangeField('businessRevenue', parseNumberInput(e.target.value))}
                    placeholder={t?.businessRevPlaceholder || '8,000,000'}
                    className="w-full text-xs sm:text-sm font-mono font-bold bg-surface border border-border-subtle rounded-lg pl-7 pr-3 py-2 text-on-surface focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-on-surface mb-1">
                  {t?.businessExpLabel || 'Chi phí kinh doanh hợp lý (経費)'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-on-surface-variant font-mono">¥</span>
                  <input
                    type="text"
                    value={formatInputNumber(formValues.businessExpenses)}
                    onChange={(e) => onChangeField('businessExpenses', parseNumberInput(e.target.value))}
                    placeholder={t?.businessExpPlaceholder || '2,500,000'}
                    className="w-full text-xs sm:text-sm font-mono font-bold bg-surface border border-border-subtle rounded-lg pl-7 pr-3 py-2 text-on-surface focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Blue Return Selection */}
            <div>
              <label className="block text-[11px] font-semibold text-on-surface mb-1">
                {t?.blueReturnLabel || 'Hình thức khai thuế'}
              </label>
              <select
                value={formValues.blueReturnOption || (profile === 'sole_proprietor' ? 'etax_65' : 'white_0')}
                onChange={(e) => onChangeField('blueReturnOption', e.target.value)}
                className="w-full text-xs sm:text-sm bg-surface border border-border-subtle rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
              >
                <option value="etax_65">{t?.blueReturn_etax_65 || '青色申告（e-Tax・複式簿記・65万円控除）'}</option>
                <option value="paper_55">{t?.blueReturn_paper_55 || '青色申告（紙面提出・複式簿記・55万円控除）'}</option>
                <option value="simple_10">{t?.blueReturn_simple_10 || '青色申告（簡易簿記・10万円控除）'}</option>
                <option value="white_0">{t?.blueReturn_white_0 || '白色申告（控除なし）'}</option>
              </select>
            </div>

            {/* Business Category for Enterprise Tax */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-on-surface mb-1">
                  {t?.businessCatLabel || 'Phân loại ngành tính Thuế kinh doanh cá nhân'}
                </label>
                <select
                  value={formValues.businessCategoryId || 'type1_retail_dining'}
                  onChange={(e) => onChangeField('businessCategoryId', e.target.value)}
                  className="w-full text-xs bg-surface border border-border-subtle rounded-lg px-2.5 py-2 text-on-surface focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {BusinessCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat[`name_${lang}`] || cat.name_ja} [{cat.taxRateLabel}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-on-surface mb-1">
                  {t?.operatingMonthsLabel || 'Số tháng hoạt động trong năm'}
                </label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={formValues.operatingMonths || 12}
                  onChange={(e) => onChangeField('operatingMonths', Number(e.target.value))}
                  className="w-full text-xs bg-surface border border-border-subtle rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono font-bold"
                />
                <p className="text-[11px] text-on-surface-variant mt-1">
                  {lang === 'ja'
                    ? '事業主控除（年間290万円）が月割り計算されます。'
                    : lang === 'vi'
                    ? 'Mức miễn trừ 290 vạn yên được chia theo tỷ lệ số tháng thực tế.'
                    : '2.9M JPY deduction pro-rated by active months.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 4. Corporate Inputs */}
        {isCorporate && (
          <div className="p-4 rounded-xl bg-surface-container-low/60 border border-amber-500/20 space-y-3">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs sm:text-sm font-bold text-on-surface">
                {t?.corporateSection || 'Thông tin Doanh nghiệp / Pháp nhân (法人)'}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-on-surface mb-1">
                  {t?.corporateIncomeLabel || 'Lợi nhuận trước thuế (課税所得)'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-on-surface-variant font-mono">¥</span>
                  <input
                    type="text"
                    value={formatInputNumber(formValues.corporateIncome)}
                    onChange={(e) => onChangeField('corporateIncome', parseNumberInput(e.target.value))}
                    placeholder="6,000,000"
                    className="w-full text-xs sm:text-sm font-mono font-bold bg-surface border border-border-subtle rounded-lg pl-7 pr-3 py-2 text-on-surface focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-on-surface mb-1">
                  {t?.corporateCapitalLabel || 'Vốn điều lệ (資本金)'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-on-surface-variant font-mono">¥</span>
                  <input
                    type="text"
                    value={formatInputNumber(formValues.capital)}
                    onChange={(e) => onChangeField('capital', parseNumberInput(e.target.value))}
                    placeholder="10,000,000"
                    className="w-full text-xs sm:text-sm font-mono font-bold bg-surface border border-border-subtle rounded-lg pl-7 pr-3 py-2 text-on-surface focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-on-surface mb-1">
                  {t?.corporateEmployeesLabel || 'Số lượng nhân viên'}
                </label>
                <input
                  type="number"
                  min={1}
                  value={formValues.employeeCount || 5}
                  onChange={(e) => onChangeField('employeeCount', Number(e.target.value))}
                  className="w-full text-xs sm:text-sm font-mono font-bold bg-surface border border-border-subtle rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* 5. Consumption Tax Collapsible (for Biz & Corporate) */}
        {(isBizProfile || isCorporate) && (
          <div className="border border-border-subtle rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowConsumptionDetails(!showConsumptionDetails)}
              className="w-full flex items-center justify-between p-3 bg-surface-container-low hover:bg-surface-container-high/60 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-rose-500" />
                <span className="text-xs sm:text-sm font-bold text-on-surface">
                  {t?.consumptionTaxSection || 'Thiết lập Thuế tiêu thụ & Invoice (消費税)'}
                </span>
                {formValues.isInvoiceRegistered && (
                  <span className="text-[10px] bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 border border-rose-200/60 dark:border-rose-800/50 px-2 py-0.5 rounded font-bold">
                    INVOICE
                  </span>
                )}
              </div>
              {showConsumptionDetails ? (
                <ChevronUp className="w-4 h-4 text-on-surface-variant" />
              ) : (
                <ChevronDown className="w-4 h-4 text-on-surface-variant" />
              )}
            </button>

            {showConsumptionDetails && (
              <div className="p-4 bg-surface space-y-3 text-xs border-t border-border-subtle">
                <label className="inline-flex items-center gap-2 text-on-surface cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(formValues.isInvoiceRegistered)}
                    onChange={(e) => onChangeField('isInvoiceRegistered', e.target.checked)}
                    className="rounded border-border-subtle text-rose-500 focus:ring-rose-500"
                  />
                  <span className="font-semibold">
                    {t?.invoiceRegisteredLabel || 'Đã đăng ký hóa đơn hợp lệ (インボイス適格請求書発行事業者)'}
                  </span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-on-surface mb-1">
                      {t?.basePeriodSalesLabel || 'Doanh thu 2 năm trước (基準期間売上)'}
                    </label>
                    <input
                      type="text"
                      value={formatInputNumber(formValues.basePeriodSales)}
                      onChange={(e) => onChangeField('basePeriodSales', parseNumberInput(e.target.value))}
                      placeholder="0"
                      className="w-full font-mono bg-surface-container-low border border-border-subtle rounded px-2.5 py-1.5"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-on-surface mb-1">
                      {t?.consumptionMethodLabel || 'Phương pháp tính thuế tiêu thụ'}
                    </label>
                    <select
                      value={formValues.consumptionMethod || (formValues.isInvoiceRegistered ? 'special_20' : 'standard')}
                      onChange={(e) => onChangeField('consumptionMethod', e.target.value)}
                      className="w-full bg-surface-container-low border border-border-subtle rounded px-2.5 py-1.5 font-medium"
                    >
                      <option value="standard">{t?.consumption_standard || '本則課税（売上税額 − 実際の仕入税額）'}</option>
                      <option value="simplified">{t?.consumption_simplified || '簡易課税（みなし仕入率方式）'}</option>
                      <option value="special_20">{t?.consumption_special20 || 'インボイス2割特例（売上税額の20%納付）'}</option>
                    </select>
                  </div>
                </div>

                {formValues.consumptionMethod === 'simplified' && (
                  <div>
                    <label className="block text-[11px] font-medium text-on-surface mb-1">
                      {t?.simplifiedCatLabel || 'Nhóm ngành tính thuế giản dịch'}
                    </label>
                    <select
                      value={formValues.simplifiedCatId || 'cat5_service_it'}
                      onChange={(e) => onChangeField('simplifiedCatId', e.target.value)}
                      className="w-full bg-surface-container-low border border-border-subtle rounded px-2.5 py-1.5"
                    >
                      {SimplifiedTaxCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat[`name_${lang}`] || cat.name_ja} (Khấu trừ {(cat.rate * 100).toFixed(0)}%)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 6. Family & Deductions Collapsible */}
        <div className="border border-border-subtle rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowAdvancedDeductions(!showAdvancedDeductions)}
            className="w-full flex items-center justify-between p-3 bg-surface-container-low hover:bg-surface-container-high/60 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <PiggyBank className="w-4 h-4 text-emerald-500" />
              <span className="text-xs sm:text-sm font-bold text-on-surface">
                {t?.familySection || 'Giảm trừ gia cảnh, Người phụ thuộc & iDeCo (控除)'}
              </span>
              {(formValues.hasSpouse || formValues.dependentsCount > 0 || formValues.specificDependentsCount > 0 || formValues.elderlyDependentsCount > 0 || formValues.cohabitingElderlyParentsCount > 0 || formValues.idecoMonthly > 0) && (
                <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border border-emerald-200/60 dark:border-emerald-800/50 px-2 py-0.5 rounded font-bold">
                  {lang === 'ja' ? '適用中' : lang === 'vi' ? 'ĐÃ ÁP DỤNG' : 'APPLIED'}
                </span>
              )}
            </div>
            {showAdvancedDeductions ? (
              <ChevronUp className="w-4 h-4 text-on-surface-variant" />
            ) : (
              <ChevronDown className="w-4 h-4 text-on-surface-variant" />
            )}
          </button>

          {showAdvancedDeductions && (
            <div className="p-4 bg-surface space-y-3 text-xs border-t border-border-subtle">
              <div className="space-y-2">
                <label className="inline-flex items-center gap-2 text-on-surface cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(formValues.hasSpouse)}
                    onChange={(e) => onChangeField('hasSpouse', e.target.checked)}
                    className="rounded border-border-subtle text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>{t?.hasSpouseLabel || (lang === 'ja' ? '配偶者あり（配偶者控除・配偶者特別控除）' : lang === 'vi' ? 'Có vợ/chồng (配偶者控除・配偶者特別控除)' : 'Has spouse (spouse deduction)')}</span>
                </label>
                {formValues.hasSpouse && (
                  <div className="pl-6 space-y-1">
                    <label className="block text-[11px] font-semibold text-on-surface">
                      {lang === 'ja' ? '配偶者の合計所得金額（給与のみなら 給与収入 − 給与所得控除）' : lang === 'vi' ? 'Tổng thu nhập (合計所得) của vợ/chồng — nếu chỉ có lương: lương − giảm trừ lương' : "Spouse's total income (salary minus employment deduction)"}
                    </label>
                    <div className="relative max-w-xs">
                      <span className="absolute left-3 top-2 text-xs text-on-surface-variant font-mono">¥</span>
                      <input
                        type="text"
                        aria-label={lang === 'ja' ? '配偶者の合計所得金額' : lang === 'vi' ? 'Tổng thu nhập của vợ/chồng' : 'Spouse total income'}
                        value={formatInputNumber(formValues.spouseIncome)}
                        onChange={(e) => onChangeField('spouseIncome', parseNumberInput(e.target.value))}
                        placeholder="0"
                        className="w-full font-mono bg-surface-container-low border border-border-subtle rounded pl-7 pr-3 py-1.5 font-bold"
                      />
                    </div>
                    <label className="inline-flex items-center gap-2 text-on-surface cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={Boolean(formValues.spouseIsElderly)}
                        onChange={(e) => onChangeField('spouseIsElderly', e.target.checked)}
                        className="rounded border-border-subtle text-emerald-500 focus:ring-emerald-500"
                      />
                      <span>{lang === 'ja' ? '配偶者は70歳以上' : lang === 'vi' ? 'Vợ/chồng từ 70 tuổi' : 'Spouse aged 70+'}</span>
                    </label>
                    <p className="text-[11px] text-on-surface-variant">
                      {lang === 'ja'
                        ? `控除額は本人の合計所得（900万・950万・1,000万円超で段階的に減少・消失）と配偶者の所得（${spouseLimitMan}万円以下は配偶者控除、133万円以下は配偶者特別控除）で変わります。`
                        : lang === 'vi'
                        ? `Mức giảm trừ thay đổi theo tổng thu nhập của bạn (giảm dần khi trên 900/950 vạn, mất khi trên 1,000 vạn) và thu nhập của vợ/chồng (≤${spouseLimitMan} vạn: 配偶者控除; ≤133 vạn: 配偶者特別控除).`
                        : `Amount depends on your total income (phases down above 9M/9.5M, none above 10M) and your spouse's income (≤${spouseLimitMan}0k: spouse deduction; ≤1.33M: special spouse deduction).`}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { field: 'dependentsCount', label: t?.dependentsCountLabel || (lang === 'ja' ? '一般の扶養親族（16〜18歳・23〜69歳）' : lang === 'vi' ? 'Người phụ thuộc thông thường (16〜18, 23〜69 tuổi)' : 'General dependents (16-18, 23-69)') },
                    { field: 'specificDependentsCount', label: lang === 'ja' ? '特定扶養親族（19〜22歳）' : lang === 'vi' ? 'Phụ thuộc đặc định (19〜22 tuổi)' : 'Specified dependents (19-22)' },
                    { field: 'elderlyDependentsCount', label: lang === 'ja' ? '老人扶養親族（70歳以上・同居老親以外）' : lang === 'vi' ? 'Phụ thuộc cao tuổi (70+, không sống chung)' : 'Elderly dependents (70+, not cohabiting)' },
                    { field: 'cohabitingElderlyParentsCount', label: lang === 'ja' ? '同居老親等（70歳以上の父母等と同居）' : lang === 'vi' ? 'Cha mẹ/ông bà 70+ sống chung' : 'Cohabiting elderly parents (70+)' },
                  ].map(({ field, label }) => (
                    <div key={field} className="flex items-center justify-between gap-2">
                      <span className="text-on-surface font-medium text-[11px]">{label}</span>
                      <input
                        type="number"
                        min={0}
                        max={10}
                        aria-label={label}
                        value={formValues[field] || 0}
                        onChange={(e) => onChangeField(field, Number(e.target.value))}
                        className="w-16 font-mono bg-surface-container-low border border-border-subtle rounded px-2 py-1 text-center font-bold"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-on-surface-variant">
                  {lang === 'ja'
                    ? `年齢はその年の12月31日現在。扶養親族は合計所得${spouseLimitMan}万円以下が要件です。特定親族特別控除・障害者控除・ひとり親控除等は未対応です。`
                    : lang === 'vi'
                    ? `Tuổi tính tại 31/12 của năm. Người phụ thuộc phải có tổng thu nhập ≤${spouseLimitMan} vạn. Chưa hỗ trợ 特定親族特別控除, giảm trừ người khuyết tật, cha/mẹ đơn thân...`
                    : `Ages as of 31 Dec. Dependents must have total income ≤${spouseLimitMan}0k JPY. Special relative deduction, disability and single-parent deductions are not modeled.`}
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-on-surface mb-1">
                  {t?.idecoMonthlyLabel || 'Khoản đóng quỹ hưu trí tự nguyện iDeCo / Quỹ doanh nghiệp nhỏ (hàng tháng)'}
                </label>
                <div className="relative max-w-xs">
                  <span className="absolute left-3 top-2 text-xs text-on-surface-variant font-mono">¥</span>
                  <input
                    type="text"
                    value={formatInputNumber(formValues.idecoMonthly)}
                    onChange={(e) => onChangeField('idecoMonthly', parseNumberInput(e.target.value))}
                    placeholder="23,000"
                    className="w-full font-mono bg-surface-container-low border border-border-subtle rounded pl-7 pr-3 py-1.5 font-bold"
                  />
                </div>
                <p className="text-[11px] text-on-surface-variant mt-1">
                  {t?.idecoHelp || 'Toàn bộ khoản đóng iDeCo được khấu trừ trực tiếp vào thu nhập chịu thuế, giúp giảm thuế thu nhập và thuế cư trú.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
