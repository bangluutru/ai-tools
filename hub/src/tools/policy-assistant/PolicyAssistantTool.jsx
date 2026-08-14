import React, { useState } from 'react';
import {
  HelpCircle, Calculator, FileText, Download, CheckCircle2,
  AlertCircle, ShieldCheck, MapPin, Users, Calendar, DollarSign,
  Printer, Sparkles, ChevronRight, BookOpen
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function PolicyAssistantTool({ displayLang }) {
  // Trạng thái cho Máy tính công tác phí
  const [region, setRegion] = useState('vung1');
  const [days, setDays] = useState(3);
  const [persons, setPersons] = useState(1);
  const [role, setRole] = useState('staff');
  const [hasFlight, setHasFlight] = useState(true);

  // Trạng thái cho Biểu mẫu đề xuất
  const [formData, setFormData] = useState({
    requesterName: 'Nguyễn Văn A',
    department: 'Phòng Phát triển Dự án',
    purpose: 'Khảo sát thị trường & Làm việc với đối tác tại địa phương',
    destination: 'Đà Nẵng & Hội An',
    startDate: '2026-05-20',
    endDate: '2026-05-23'
  });

  // Bảng định mức theo Thông tư & Quy chế nội bộ chuẩn (VND/ngày/người)
  const policyRates = {
    vung1: { name: 'Vùng I (Hà Nội, TP.HCM)', hotel: 1200000, food: 250000, taxi: 300000 },
    vung2: { name: 'Vùng II (Đà Nẵng, Hải Phòng, Cần Thơ)', hotel: 900000, food: 200000, taxi: 200000 },
    vung3: { name: 'Vùng III & IV (Các tỉnh/thành khác)', hotel: 700000, food: 150000, taxi: 150000 }
  };

  const currentRates = policyRates[region] || policyRates.vung2;
  const roleMultiplier = role === 'director' ? 1.5 : role === 'manager' ? 1.2 : 1.0;

  const hotelAllowance = Math.round(currentRates.hotel * (days > 1 ? days - 1 : 1) * persons * roleMultiplier);
  const foodAllowance = Math.round(currentRates.food * days * persons);
  const taxiAllowance = Math.round(currentRates.taxi * days * persons);
  const flightAllowance = hasFlight ? 3500000 * persons : 0;
  const totalEstimatedBudget = hotelAllowance + foodAllowance + taxiAllowance + flightAllowance;

  // Danh mục câu hỏi quy chế chi tiêu & hóa đơn
  const faqList = [
    {
      q: 'Hóa đơn từ 20 triệu đồng trở lên cần điều kiện gì để được thanh toán?',
      a: 'Theo quy định thuế và quy chế tài chính, các hóa đơn mua hàng hóa/dịch vụ từng lần có giá trị từ 20.000.000 VNĐ trở lên (đã bao gồm VAT) BẮT BUỘC phải có chứng từ thanh toán không dùng tiền mặt (Ủy nhiệm chi / Chuyển khoản từ tài khoản công ty sang tài khoản bên bán).'
    },
    {
      q: 'Quy định về thời hạn nộp hóa đơn thanh toán sau chuyến công tác?',
      a: 'Trong vòng tối đa 05 ngày làm việc kể từ ngày kết thúc chuyến công tác, người đề nghị phải nộp đầy đủ Bảng kê đề nghị thanh toán kèm hóa đơn điện tử (XML/PDF), vé máy bay, thẻ lên máy bay (boarding pass) và biên bản nghiệm thu (nếu có).'
    },
    {
      q: 'Vé máy bay điện tử cần những giấy tờ gì để hợp lệ?',
      a: 'Cần có: 1) Phiếu thu/Vé điện tử có mã đặt chỗ (PNR); 2) Hóa đơn GTGT điện tử (nếu có); 3) Thẻ lên máy bay (Boarding pass) hoặc Giấy xác nhận chuyến bay của hãng hàng không; 4) Chứng từ thanh toán ngân hàng.'
    },
    {
      q: 'Chi phí tiếp khách / ăn uống cùng đối tác cần chứng từ gì?',
      a: 'Phải có Giấy đề xuất tiếp khách được phê duyệt trước, Hóa đơn GTGT có bảng kê chi tiết món ăn/dịch vụ đính kèm, và danh sách người tham gia tiếp khách.'
    }
  ];

  // Xuất file Dự toán & Đề xuất chi tiêu ra Excel
  const exportBudgetExcel = () => {
    const rows = [
      ['CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM'],
      ['Độc lập - Tự do - Hạnh phúc'],
      ['---------------------------------'],
      ['BẢNG DỰ TOÁN CÔNG TÁC PHÍ & ĐỀ XUẤT TẠM ỨNG'],
      [`Ngày lập: ${new Date().toLocaleDateString('vi-VN')}`],
      [''],
      ['I. THÔNG TIN ĐỀ NGHỊ'],
      ['Họ và tên người đề xuất:', formData.requesterName],
      ['Bộ phận / Phòng ban:', formData.department],
      ['Địa điểm công tác:', formData.destination],
      ['Thời gian công tác:', `${formData.startDate} đến ${formData.endDate} (${days} ngày)`],
      ['Mục đích công tác:', formData.purpose],
      ['Số lượng nhân sự:', `${persons} người`],
      [''],
      ['II. CHI TIẾT ĐỊNH MỨC DỰ TOÁN CHI PHÍ (THEO QUY CHẾ)'],
      ['STT', 'Khoản Mục Chi Phí', 'Định Mức Quy Định', 'Số Lượng/Ngày', 'Thành Tiền (VNĐ)', 'Ghi Chú'],
      [1, 'Tiền phòng khách sạn / lưu trú', `${currentRates.hotel.toLocaleString('vi-VN')} đ/đêm`, `${days - 1} đêm x ${persons} người`, hotelAllowance, 'Hóa đơn GTGT tên công ty'],
      [2, 'Phụ cấp tiền ăn / lưu trú', `${currentRates.food.toLocaleString('vi-VN')} đ/ngày`, `${days} ngày x ${persons} người`, foodAllowance, 'Khoán theo ngày công tác'],
      [3, 'Chi phí đi lại nội đô (Taxi/Grab)', `${currentRates.taxi.toLocaleString('vi-VN')} đ/ngày`, `${days} ngày x ${persons} người`, taxiAllowance, 'Hóa đơn Xanh SM / Grab'],
      [4, 'Vé máy bay / Tàu xe di chuyển', 'Theo thực chi thực tế', `${persons} vé khứ hồi`, flightAllowance, 'Vé máy bay + Thẻ lên tàu'],
      [''],
      ['TỔNG CỘNG HẠN MỨC DỰ TOÁN (VNĐ):', '', '', '', totalEstimatedBudget, ''],
      [''],
      ['Người Đề Xuất', '', '', '', 'Kế Toán Trưởng', 'Ban Giám Đốc Phê Duyệt']
    ];

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dự Toán Công Tác Phí');
    XLSX.writeFile(wb, `Du_Toan_Cong_Tac_${formData.requesterName.replace(/\s+/g, '_')}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
            <HelpCircle className="text-purple-400" size={24} />
            Trợ Lý Quy Chế & Soạn Biểu Mẫu Công Tác Phí
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tra cứu định mức chi tiêu hợp lệ theo vùng, tự động tính toán dự toán công tác và xuất biểu mẫu đề xuất.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold">
            <ShieldCheck size={14} />
            Chuẩn Quy Định 2026
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Expense Calculator & Form Generator */}
        <div className="lg:col-span-2 space-y-6">
          {/* Calculator Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Calculator size={18} className="text-purple-400" />
              Máy Tính Hạn Mức Dự Toán Công Tác Phí
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1.5 font-medium">Địa bàn / Vùng công tác</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="vung1">Vùng I (Hà Nội, TP. Hồ Chí Minh)</option>
                  <option value="vung2">Vùng II (Đà Nẵng, Hải Phòng, Cần Thơ)</option>
                  <option value="vung3">Vùng III & IV (Các tỉnh/thành khác)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1.5 font-medium">Cấp bậc nhân sự</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="staff">Chuyên viên / Cán bộ nhân viên (1.0x)</option>
                  <option value="manager">Trưởng phòng / Quản lý dự án (1.2x)</option>
                  <option value="director">Ban Giám đốc / Lãnh đạo cấp cao (1.5x)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1.5 font-medium">Thời gian công tác (Ngày)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={days}
                  onChange={(e) => setDays(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1.5 font-medium">Số lượng nhân sự tham gia</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={persons}
                  onChange={(e) => setPersons(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 text-xs">
              <input
                type="checkbox"
                id="flightCheck"
                checked={hasFlight}
                onChange={(e) => setHasFlight(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-purple-500 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="flightCheck" className="text-slate-300 cursor-pointer">
                Bao gồm dự toán vé máy bay khứ hồi (ước tính 3.500.000 VNĐ / người)
              </label>
            </div>

            {/* Allowance Breakdown */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Hạn mức phòng khách sạn ({days > 1 ? days - 1 : 1} đêm):</span>
                <span className="font-semibold">{hotelAllowance.toLocaleString('vi-VN')} VNĐ</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Phụ cấp tiền ăn khoán ({days} ngày):</span>
                <span className="font-semibold">{foodAllowance.toLocaleString('vi-VN')} VNĐ</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Định mức đi lại taxi/xe nội đô:</span>
                <span className="font-semibold">{taxiAllowance.toLocaleString('vi-VN')} VNĐ</span>
              </div>
              {hasFlight && (
                <div className="flex justify-between text-slate-300">
                  <span>Dự toán vé máy bay ({persons} người):</span>
                  <span className="font-semibold">{flightAllowance.toLocaleString('vi-VN')} VNĐ</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-bold text-purple-400">
                <span>TỔNG DỰ TOÁN ĐƯỢC DUYỆT:</span>
                <span className="text-base text-emerald-400">{totalEstimatedBudget.toLocaleString('vi-VN')} VNĐ</span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={exportBudgetExcel}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition"
              >
                <Download size={14} />
                Xuất Bảng Dự Toán Đề Xuất (Excel)
              </button>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Policy FAQs */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <BookOpen size={18} className="text-amber-400" />
              Quy Định Thanh Toán Cốt Lõi
            </h3>

            <div className="space-y-3">
              {faqList.map((item, idx) => (
                <div key={idx} className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1.5 text-xs">
                  <p className="font-bold text-slate-200 flex items-start gap-1.5">
                    <ChevronRight size={14} className="text-purple-400 flex-shrink-0 mt-0.5" />
                    {item.q}
                  </p>
                  <p className="text-slate-400 leading-relaxed pl-5">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-xs text-purple-300 mt-4">
            💡 <strong>Lưu ý kiểm soát:</strong> Mọi khoản chi tiêu cần lưu giữ hóa đơn điện tử đầy đủ mã tra cứu và file XML gốc.
          </div>
        </div>
      </div>
    </div>
  );
}
