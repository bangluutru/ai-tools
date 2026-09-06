/**
 * Export Tax Calculation Report to CSV (Excel-compatible with UTF-8 BOM)
 */
export function exportTaxBreakdownToCsv(result, _displayLang = 'vi') {
  if (!result) return;

  const dateStr = new Date().toLocaleDateString('vi-VN');
  const bom = '\uFEFF'; // UTF-8 BOM for Excel to open Vietnamese characters properly

  const rows = [
    ['BẢNG TÍNH THUẾ THU NHẬP CÁ NHÂN (TNCN) NĂM 2026'],
    ['Căn cứ: Luật 109/2025/QH15 & NĐ 253/2026/NĐ-CP | Lương cơ sở 2,53tr (NĐ 161/2026)'],
    [`Ngày tính toán: ${dateStr}`],
    [''],
    ['CHỈ SỐ THU NHẬP', 'SỐ TIỀN (VNĐ)', 'GHI CHÚ'],
    ['1. Lương thỏa thuận (Gross)', result.gross, 'Tổng thu nhập trước thuế'],
    ['2. Bảo hiểm bắt buộc (NLĐ đóng 10,5%)', result.totalInsurance, 'BHXH 8% + BHYT 1,5% + BHTN 1%'],
    ['   - BHXH (8%)', result.insuranceDetails?.bhxh || 0, 'Trần đóng 50.600.000 ₫'],
    ['   - BHYT (1,5%)', result.insuranceDetails?.bhyt || 0, 'Trần đóng 50.600.000 ₫'],
    ['   - BHTN (1%)', result.insuranceDetails?.bhtn || 0, `Trần theo Vùng ${result.region || 1}`],
    ['3. Tổng các khoản giảm trừ', result.totalDeductions, 'Bản thân + Người phụ thuộc + Giảm trừ mới'],
    ['   - Giảm trừ bản thân', result.deductionsDetails?.personal || 15_500_000, 'NQ 110/2025/UBTVQH15: 15,5 tr/tháng'],
    ['   - Giảm trừ người phụ thuộc', result.deductionsDetails?.dependent || 0, `${result.deductionsDetails?.dependentsCount || 0} người x 6,2 tr/tháng`],
    ['   - Hưu trí tự nguyện', result.deductionsDetails?.pension || 0, 'Tối đa 3 tr/tháng'],
    ['   - Chi phí Y tế', result.deductionsDetails?.medical || 0, 'Tối đa 23 tr/năm'],
    ['   - Chi phí Giáo dục', result.deductionsDetails?.education || 0, 'Tối đa 24 tr/năm'],
    ['4. Thu nhập tính thuế (TNTT)', result.taxableIncome, '=(Gross) - (Bảo hiểm) - (Giảm trừ)'],
    ['5. Thuế TNCN phải nộp', result.pitTax, 'Áp dụng biểu thuế lũy tiến 5 bậc'],
    ['6. LƯƠNG THỰC NHẬN (NET)', result.net, '=(Gross) - (Bảo hiểm) - (Thuế TNCN)'],
    ['Thuế suất thực tế hiệu dụng', `${result.effectiveTaxRate}%`, '=(Thuế TNCN) / (Lương Gross)'],
    [''],
    ['BẢNG PHÂN BỔ THUẾ LŨY TIẾN TỪNG PHẦN 2026 (5 BẬC)'],
    ['Bậc thuế', 'Khoảng thu nhập tính thuế/tháng', 'Thuế suất', 'Thu nhập tính thuế bậc này', 'Tiền thuế bậc này']
  ];

  if (result.taxBreakdown && Array.isArray(result.taxBreakdown)) {
    result.taxBreakdown.forEach(b => {
      rows.push([
        `Bậc ${b.tier}`,
        b.label,
        `${(b.rate * 100).toFixed(0)}%`,
        b.taxableAmount,
        b.taxAmount
      ]);
    });
  }

  rows.push(['']);
  rows.push(['LƯU Ý PHÁP LÝ: Bảng tính mang tính chất tham khảo, vui lòng đối chiếu với ứng dụng eTax Mobile của Tổng cục Thuế.']);

  // Convert to CSV format
  const csvContent = bom + rows.map(row => 
    row.map(cell => {
      const str = String(cell ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(',')
  ).join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Bang_Tinh_Thue_TNCN_2026_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
