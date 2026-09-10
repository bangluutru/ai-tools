/**
 * @file packages/core/src/utils/tax/export/csvExporter.js
 * @description Xuất dữ liệu mô phỏng thuế sang định dạng CSV có UTF-8 BOM (\uFEFF)
 * để đảm bảo tương thích 100% với Microsoft Excel tiếng Nhật, không bị lỗi font (Mojibake).
 */

/**
 * Tạo nội dung CSV và kích hoạt tải về trên trình duyệt
 * @param {object} params
 * @param {object} params.calcResult - Kết quả tính toán tổng hợp
 * @param {object} params.formValues - Dữ liệu người dùng đã nhập
 * @param {string} [params.lang='ja'] - Ngôn ngữ xuất (ja, vi, en)
 */
export function exportTaxSimulationCsv(arg1, arg2) {
  let calcResult, formValues, lang;
  if (arg1 && arg1.calcResult) {
    calcResult = arg1.calcResult;
    formValues = arg1.formValues || {};
    lang = arg1.lang || 'ja';
  } else {
    calcResult = arg1 || {};
    formValues = (typeof arg2 === 'object' && arg2 !== null) ? arg2 : {};
    lang = typeof arg2 === 'string' ? arg2 : (arg1?.lang || 'ja');
  }

  const profile = formValues.profile || calcResult.profile || 'employee';
  const prefecture = formValues.prefecture || calcResult.prefecture || 'tokyo';

  const rows = [];
  const now = new Date().toLocaleDateString(lang === 'vi' ? 'vi-VN' : lang === 'ja' ? 'ja-JP' : 'en-US');

  // Tiêu đề báo cáo
  const title = lang === 'vi'
    ? 'BÁO CÁO MÔ PHỎNG THUẾ & BẢO HIỂM XÃ HỘI NHẬT BẢN'
    : lang === 'en'
    ? 'JAPAN TAX & SOCIAL INSURANCE SIMULATION REPORT'
    : '日本の税金・社会保険料 試算シミュレーションレポート';

  rows.push([title]);
  rows.push([lang === 'vi' ? 'Ngày xuất' : lang === 'en' ? 'Export Date' : '出力日時', now]);
  rows.push([lang === 'vi' ? 'Năm tính thuế' : lang === 'en' ? 'Tax Year' : '対象税年度', `${calcResult.year || 2025}年（${calcResult.rules?.fiscalEra || '令和7年度'}）`]);
  rows.push([lang === 'vi' ? 'Hoàn cảnh làm việc' : lang === 'en' ? 'Profile' : '働き方区分', profile]);
  rows.push([lang === 'vi' ? 'Tỉnh/Thành phố' : lang === 'en' ? 'Prefecture' : '居住地・所在地', prefecture]);
  rows.push([]);

  // 1. TỔNG QUAN (KPI SUMMARY)
  rows.push([lang === 'vi' ? '--- CHỈ SỐ TỔNG QUAN ---' : lang === 'en' ? '--- SUMMARY OVERVIEW ---' : '--- 概算サマリー ---']);
  rows.push([
    lang === 'vi' ? 'Khoản mục' : lang === 'en' ? 'Category' : '項目',
    lang === 'vi' ? 'Số tiền (JPY)' : lang === 'en' ? 'Amount (JPY)' : '金額（円）',
    lang === 'vi' ? 'Ghi chú' : lang === 'en' ? 'Notes' : '備考',
  ]);
  rows.push([
    lang === 'vi' ? 'Tổng thu nhập / Doanh thu' : lang === 'en' ? 'Gross Earnings / Sales' : '年間総収入 / 売上高',
    calcResult.summary.grossEarnings,
    lang === 'vi' ? 'Thu nhập gộp' : lang === 'en' ? 'Total gross' : '総収入',
  ]);
  rows.push([
    lang === 'vi' ? 'Tổng tiền thuế (税金)' : lang === 'en' ? 'Total Public Taxes' : '概算 税金合計',
    calcResult.summary.totalTaxes,
    lang === 'vi' ? 'Thuế thu nhập + Cư trú + Kinh doanh + Tiêu thụ' : lang === 'en' ? 'Income + Resident + Enterprise + Consumption' : '所得税・住民税・事業税・消費税等',
  ]);
  rows.push([
    lang === 'vi' ? 'Tổng bảo hiểm xã hội (社会保険料)' : lang === 'en' ? 'Total Social Insurance' : '概算 社会保険料合計',
    calcResult.summary.totalSocialInsurance,
    lang === 'vi' ? 'BHYT, Hưu trí, Thất nghiệp' : lang === 'en' ? 'Health, Pension, Employment' : '健康保険・年金・雇用保険等',
  ]);
  rows.push([
    lang === 'vi' ? 'Thu nhập thực nhận / Khả dụng' : lang === 'en' ? 'Net Take-Home Pay' : '概算 手取り額 / 可処分所得',
    calcResult.summary.netTakeHome,
    lang === 'vi' ? 'Sau khi trừ thuế và bảo hiểm' : lang === 'en' ? 'After taxes and social insurance' : '公的負担差引後',
  ]);
  rows.push([
    lang === 'vi' ? 'Tỷ lệ gánh nặng công thực tế' : lang === 'en' ? 'Effective Public Burden Rate' : '実効公的負担率',
    `${(calcResult.summary.effectiveBurdenRate * 100).toFixed(1)}%`,
    lang === 'vi' ? '(Thuế + BHXH) / Tổng thu nhập' : lang === 'en' ? '(Taxes + Insurance) / Gross' : '（税＋社保）÷ 総収入',
  ]);
  rows.push([]);

  // 2. CHI TIẾT CÁC KHOẢN THUẾ (TAX BREAKDOWN)
  rows.push([lang === 'vi' ? '--- CHI TIẾT CÁC KHOẢN THUẾ (税金) ---' : lang === 'en' ? '--- TAXES BREAKDOWN ---' : '--- 公租公課（税金）の内訳 ---']);
  rows.push([
    lang === 'vi' ? 'Loại thuế' : lang === 'en' ? 'Tax Name' : '税目',
    lang === 'vi' ? 'Số tiền (JPY)' : lang === 'en' ? 'Amount (JPY)' : '金額（円）',
    lang === 'vi' ? 'Cơ quan thu' : lang === 'en' ? 'Tax Authority' : '管轄機関',
  ]);
  rows.push(['所得税（国税・基準額）', calcResult.incomeTax.baseIncomeTax, '税務署']);
  rows.push(['復興特別所得税（基準額の2.1%）', calcResult.incomeTax.reconstructionTax, '税務署']);
  rows.push(['住民税 所得割（地方税）', calcResult.residentTax.incomeLevy, '市区町村・都道府県']);
  rows.push(['住民税 均等割（地方税）', calcResult.residentTax.perCapitaFlat, '市区町村・都道府県']);
  rows.push(['森林環境税（国税）', calcResult.residentTax.forestryTax, '自治体代行徴収']);

  if (calcResult.enterpriseTax && calcResult.enterpriseTax.enterpriseTax > 0) {
    rows.push(['個人事業税（都道県税）', calcResult.enterpriseTax.enterpriseTax, '都税・県税事務所']);
  }
  if (calcResult.consumptionTax && calcResult.consumptionTax.payableTax > 0) {
    rows.push(['消費税及び地方消費税', calcResult.consumptionTax.payableTax, '税務署']);
  }
  if (calcResult.corporateTax && calcResult.corporateTax.totalCorporateTax > 0) {
    rows.push(['法人税（国税）', calcResult.corporateTax.corporateTax, '税務署']);
    rows.push(['地方法人税（国税）', calcResult.corporateTax.localCorporateTax, '税務署']);
    rows.push(['法人住民税（地方税）', calcResult.corporateTax.corporateResidentTax, '都税事務所・市区町村']);
    rows.push(['法人事業税・特別事業税（地方税等）', calcResult.corporateTax.enterpriseTax + calcResult.corporateTax.specialEnterpriseTax, '都税・県税事務所']);
  }
  rows.push([]);

  // 3. CHI TIẾT BẢO HIỂM XÃ HỘI (SOCIAL INSURANCE BREAKDOWN)
  rows.push([lang === 'vi' ? '--- CHI TIẾT BẢO HIỂM XÃ HỘI (社会保険料) ---' : lang === 'en' ? '--- SOCIAL INSURANCE BREAKDOWN ---' : '--- 社会保障（社会保険料）の内訳 ---']);
  rows.push([
    lang === 'vi' ? 'Chế độ bảo hiểm' : lang === 'en' ? 'Insurance Type' : '保険種目',
    lang === 'vi' ? 'Số tiền tự đóng (JPY)' : lang === 'en' ? 'Employee Share (JPY)' : '本人負担額（円）',
    lang === 'vi' ? 'Phần công ty đóng cùng (JPY)' : lang === 'en' ? 'Employer Share (JPY)' : '事業者折半負担額（円）',
  ]);

  if (calcResult.socialInsurance.isCompanyEmployee) {
    rows.push(['健康保険（協会けんぽ）', calcResult.socialInsurance.healthInsurance, calcResult.socialInsurance.healthInsurance]);
    if (calcResult.socialInsurance.careInsurance > 0) {
      rows.push(['介護保険（40歳以上）', calcResult.socialInsurance.careInsurance, calcResult.socialInsurance.careInsurance]);
    }
    rows.push(['厚生年金保険', calcResult.socialInsurance.welfarePension, calcResult.socialInsurance.welfarePension]);
    rows.push(['雇用保険（労働者負担分）', calcResult.socialInsurance.employmentInsurance, Math.floor(calcResult.socialInsurance.employmentInsurance * 1.58)]);
  } else {
    rows.push(['国民健康保険', calcResult.socialInsurance.nationalHealthInsurance, 0]);
    rows.push(['国民年金', calcResult.socialInsurance.nationalPension, 0]);
  }
  rows.push([]);

  // 4. TUYÊN BỐ MIỄN TRỪ
  rows.push([lang === 'vi' ? '--- TUYÊN BỐ MIỄN TRỪ TRÁCH NHIỆM ---' : lang === 'en' ? '--- DISCLAIMER ---' : '--- 免責事項 ---']);
  const disclaimerText = lang === 'vi'
    ? 'Kết quả mô phỏng mang tính chất giáo dục và tham khảo định hướng, không phải là quyết toán thuế chính thức và không thay thế cho tư vấn thuế của chuyên viên thuế (税理士).'
    : lang === 'en'
    ? 'This simulation is for educational purposes only. It is not an official tax return and does not substitute for advice from a certified tax accountant (Zeirishi).'
    : '本シミュレーションは教育および概算把握を目的としており、確定申告そのものや税理士による個別税務相談ではありません。';
  rows.push([disclaimerText]);

  // Chuyển mảng thành định dạng CSV
  const csvContent = rows
    .map((r) =>
      r
        .map((cell) => {
          const str = String(cell === null || cell === undefined ? '' : cell);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    )
    .join('\r\n');

  // Thêm UTF-8 BOM (\uFEFF) cho Microsoft Excel tiếng Nhật
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `japan_tax_simulation_${calcResult.year}_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
