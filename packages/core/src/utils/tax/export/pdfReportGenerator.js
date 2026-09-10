/**
 * @file packages/core/src/utils/tax/export/pdfReportGenerator.js
 * @description Trình tạo tài liệu báo cáo thuế A4 chuyên nghiệp bằng jsPDF chạy trực tiếp client-side.
 * Không phụ thuộc server, bảo vệ quyền riêng tư 100%.
 */

/**
 * Tạo và tải về file PDF báo cáo mô phỏng thuế Nhật Bản
 * @param {object} params
 * @param {object} params.calcResult - Kết quả tính toán tổng hợp
 * @param {object} params.formValues - Dữ liệu người dùng
 * @param {string} [params.lang='ja'] - Ngôn ngữ hiển thị
 */
export async function generateTaxPdfReport(arg1, arg2) {
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

  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.getPageWidth();
  const pageHeight = doc.getPageHeight();
  const margin = 15;
  let y = margin;

  // 1. HEADER BANNER
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, y, pageWidth - margin * 2, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  const titleText = lang === 'vi'
    ? 'JAPAN TAX & FINANCIAL SIMULATOR REPORT'
    : lang === 'en'
    ? 'JAPAN TAX & FINANCIAL SIMULATOR REPORT'
    : 'JAPAN TAX & SOCIAL INSURANCE REPORT';
  doc.text(titleText, margin + 6, y + 10);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tax Year: ${calcResult.year} (${calcResult.rules.fiscalEra})  |  Generated: ${new Date().toLocaleDateString()}`, margin + 6, y + 18);

  y += 30;

  // 2. PROFILE & REGION META
  doc.setFillColor(241, 245, 249); // slate-100
  doc.roundedRect(margin, y, pageWidth - margin * 2, 16, 2, 2, 'F');
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(9);
  doc.text(`Profile: ${formValues.profile.toUpperCase()}   |   Prefecture: ${formValues.prefecture.toUpperCase()}   |   Calculation Mode: Deterministic Engine`, margin + 5, y + 10);

  y += 22;

  // 3. KPI CARDS ROW (4 ô tóm tắt)
  const cardWidth = (pageWidth - margin * 2 - 9) / 4;
  const cards = [
    { label: 'Gross Revenue', value: `JPY ${calcResult.summary.grossEarnings.toLocaleString()}`, color: [2, 132, 199] },
    { label: 'Total Taxes', value: `JPY ${calcResult.summary.totalTaxes.toLocaleString()}`, color: [239, 68, 68] },
    { label: 'Total Social Ins.', value: `JPY ${calcResult.summary.totalSocialInsurance.toLocaleString()}`, color: [245, 158, 11] },
    { label: 'Net Take-Home', value: `JPY ${calcResult.summary.netTakeHome.toLocaleString()}`, color: [16, 185, 129] },
  ];

  cards.forEach((card, idx) => {
    const x = margin + idx * (cardWidth + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y, cardWidth, 20, 2, 2, 'FD');

    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(card.label, x + 4, y + 6);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(card.color[0], card.color[1], card.color[2]);
    doc.text(card.value, x + 4, y + 15);
  });

  y += 26;

  // 4. TAX BREAKDOWN SECTION
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Public Taxes Breakdown (Shotokuzei, Juminzei, etc.)', margin, y);
  y += 5;

  const taxRows = [
    ['National Income Tax (Base)', `JPY ${calcResult.incomeTax.baseIncomeTax.toLocaleString()}`],
    ['Reconstruction Surtax (2.1%)', `JPY ${calcResult.incomeTax.reconstructionTax.toLocaleString()}`],
    ['Resident Tax (Income Levy)', `JPY ${calcResult.residentTax.incomeLevy.toLocaleString()}`],
    ['Resident Tax (Per Capita Levy)', `JPY ${calcResult.residentTax.perCapitaFlat.toLocaleString()}`],
    ['National Forest Environment Tax', `JPY ${calcResult.residentTax.forestryTax.toLocaleString()}`],
  ];

  if (calcResult.enterpriseTax?.enterpriseTax > 0) {
    taxRows.push(['Individual Enterprise Tax (Jigyōzei)', `JPY ${calcResult.enterpriseTax.enterpriseTax.toLocaleString()}`]);
  }
  if (calcResult.consumptionTax?.payableTax > 0) {
    taxRows.push(['Consumption Tax & Local Consumption Tax', `JPY ${calcResult.consumptionTax.payableTax.toLocaleString()}`]);
  }
  if (calcResult.corporateTax?.totalCorporateTax > 0) {
    taxRows.push(['Corporate Taxes Suite (Hōjinzei + Jūminzei + Jigyōzei)', `JPY ${calcResult.corporateTax.totalCorporateTax.toLocaleString()}`]);
  }

  taxRows.forEach(([name, val], idx) => {
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
    doc.rect(margin, y, pageWidth - margin * 2, 6, 'F');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(name, margin + 4, y + 4.2);

    doc.setFont('helvetica', 'bold');
    doc.text(val, pageWidth - margin - 35, y + 4.2);
    y += 6;
  });

  y += 6;

  // 5. SOCIAL INSURANCE SECTION
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Social Insurance Breakdown (Shakai Hoken / Kokumin Nenkin)', margin, y);
  y += 5;

  const socialRows = [];
  if (calcResult.socialInsurance.isCompanyEmployee) {
    socialRows.push(['Health Insurance (Kyōkai Kenpo Employee Share)', `JPY ${calcResult.socialInsurance.healthInsurance.toLocaleString()}`]);
    if (calcResult.socialInsurance.careInsurance > 0) {
      socialRows.push(['Long-Term Care Insurance (Kaigo Hoken - Age 40+)', `JPY ${calcResult.socialInsurance.careInsurance.toLocaleString()}`]);
    }
    socialRows.push(['Employees Welfare Pension (Kōsei Nenkin - Employee 9.15%)', `JPY ${calcResult.socialInsurance.welfarePension.toLocaleString()}`]);
    socialRows.push(['Employment Insurance (Koyō Hoken - Employee 0.6%)', `JPY ${calcResult.socialInsurance.employmentInsurance.toLocaleString()}`]);
  } else {
    socialRows.push(['National Health Insurance (Kokumin Kenkō Hoken)', `JPY ${calcResult.socialInsurance.nationalHealthInsurance.toLocaleString()}`]);
    socialRows.push(['National Pension (Kokumin Nenkin)', `JPY ${calcResult.socialInsurance.nationalPension.toLocaleString()}`]);
  }

  socialRows.forEach(([name, val], idx) => {
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
    doc.rect(margin, y, pageWidth - margin * 2, 6, 'F');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(name, margin + 4, y + 4.2);

    doc.setFont('helvetica', 'bold');
    doc.text(val, pageWidth - margin - 35, y + 4.2);
    y += 6;
  });

  y += 10;

  // 6. OFFICIAL SOURCE & LEGAL NOTICE
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 22, 2, 2, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Statutory Basis & Verification:', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(`Official Source: ${calcResult.rules.officialSource}`, margin + 4, y + 11);
  doc.text(`Rules Engine Verified: ${calcResult.rules.verifiedDate}  |  National Tax Agency Japan & Local Tax Acts`, margin + 4, y + 16);

  // 7. FOOTER DISCLAIMER
  const footerY = pageHeight - 16;
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, footerY - 2, pageWidth - margin, footerY - 2);

  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'DISCLAIMER: Educational estimate only. Does not replace official tax return filing or certified tax accountant (Zeirishi) advice.',
    margin,
    footerY + 3
  );
  doc.text('Client-Side Local-Only Calculation  |  AI-Tools Ecosystem', margin, footerY + 7);

  // Lưu file
  doc.save(`japan_tax_report_${calcResult.year}_${Date.now()}.pdf`);
}
