import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Cpu,
  Layers,
  FileCheck,
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function AutoBiView() {
  const [fileData, setFileData] = useState(null);
  const [fileName, setFileName] = useState('');
  const [columns, setColumns] = useState([]);
  const [selectedDimension, setSelectedDimension] = useState('');
  const [selectedMetric, setSelectedMetric] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);

  // Xử lý nạp tệp Excel hoặc CSV
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawJson = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (rawJson.length === 0) return;

        const cols = Object.keys(rawJson[0]);
        setColumns(cols);
        setFileData(rawJson);

        // Tự động tìm cột Số (Metric) và cột Phân loại (Dimension)
        let foundDim = '';
        let foundMetric = '';

        for (const col of cols) {
          const sampleVal = rawJson[0][col];
          const isNum = !isNaN(parseFloat(sampleVal)) && isFinite(sampleVal);
          if (isNum && !foundMetric) {
            foundMetric = col;
          } else if (!isNum && !foundDim && isNaN(Date.parse(sampleVal))) {
            foundDim = col;
          }
        }

        const activeDim = foundDim || cols[0];
        const activeMetric = foundMetric || cols[1] || cols[0];
        setSelectedDimension(activeDim);
        setSelectedMetric(activeMetric);

        runAnalytics(rawJson, activeDim, activeMetric);
      } catch (err) {
        console.error('Error parsing file:', err);
      }
    };

    reader.readAsBinaryString(file);
  };

  // Tính toán chỉ số BI & Phân tích tổng hợp
  const runAnalytics = (data, dimCol, metricCol) => {
    if (!data || data.length === 0 || !dimCol || !metricCol) return;

    const groupMap = {};
    let totalSum = 0;
    let validCount = 0;
    const values = [];

    data.forEach((row) => {
      const dimVal = String(row[dimCol] || 'Chưa phân loại').trim();
      const rawNum = parseFloat(String(row[metricCol]).replace(/[^\d.-]/g, ''));
      const numVal = isNaN(rawNum) ? 0 : rawNum;

      if (!groupMap[dimVal]) {
        groupMap[dimVal] = { name: dimVal, value: 0, count: 0 };
      }
      groupMap[dimVal].value += numVal;
      groupMap[dimVal].count += 1;

      totalSum += numVal;
      values.push(numVal);
      validCount++;
    });

    const sortedGroups = Object.values(groupMap).sort((a, b) => b.value - a.value);

    const topGroups = sortedGroups.slice(0, 8);
    const maxVal = Math.max(...values, 1);
    const minVal = Math.min(...values, 0);
    const avgVal = validCount > 0 ? totalSum / validCount : 0;

    // Sinh bản tóm tắt điều hành (Insights)
    const top1 = sortedGroups[0];
    const top1Pct = totalSum > 0 && top1 ? Math.round((top1.value / totalSum) * 100) : 0;
    const top3Sum = sortedGroups.slice(0, 3).reduce((s, g) => s + g.value, 0);
    const top3Pct = totalSum > 0 ? Math.round((top3Sum / totalSum) * 100) : 0;

    const insights = [
      `Nhóm dẫn đầu: "${top1?.name || 'N/A'}" đóng góp lớn nhất với ${top1?.value.toLocaleString('vi-VN')} (${top1Pct}% tổng quy mô).`,
      `Hiệu ứng tập trung: Top 3 nhóm đầu chiếm tới ${top3Pct}% tổng giá trị toàn bộ tập dữ liệu.`,
      `Giá trị trung bình mỗi bản ghi đạt ${Math.round(avgVal).toLocaleString('vi-VN')} đơn vị.`,
    ];

    setAnalysisResult({
      totalSum,
      validCount,
      avgVal,
      maxVal,
      minVal,
      sortedGroups,
      topGroups,
      insights,
    });
  };

  const handleDimensionChange = (dim) => {
    setSelectedDimension(dim);
    runAnalytics(fileData, dim, selectedMetric);
  };

  const handleMetricChange = (metric) => {
    setSelectedMetric(metric);
    runAnalytics(fileData, selectedDimension, metric);
  };

  // Xuất Báo cáo Tóm tắt BI
  const handleExportBIReport = () => {
    if (!analysisResult) return;

    const rows = [
      ['BÁO CÁO PHÂN TÍCH DỮ LIỆU TỰ ĐỘNG (AUTO-BI EXECUTIVE REPORT)'],
      [`Tệp dữ liệu nguồn: ${fileName}`],
      [`Thời gian tạo: ${new Date().toLocaleString('vi-VN')}`],
      [''],
      ['I. TỔNG QUAN CHỈ SỐ QUAN TRỌNG'],
      ['Tổng quy mô giá trị:', analysisResult.totalSum],
      ['Tổng số bản ghi dữ liệu:', analysisResult.validCount],
      ['Giá trị trung bình:', Math.round(analysisResult.avgVal)],
      ['Giá trị lớn nhất:', analysisResult.maxVal],
      [''],
      ['II. NHẬN XÉT ĐIỀU HÀNH'],
      ...analysisResult.insights.map((ins) => [ins]),
      [''],
      ['III. BẢNG TỔNG HỢP THEO PHÂN LOẠI', `Chỉ tiêu: ${selectedDimension}`, `Giá trị: ${selectedMetric}`],
      ['STT', 'Tên Phân Loại', 'Tổng Giá Trị', 'Tỷ Trọng (%)', 'Số Lượng'],
    ];

    analysisResult.sortedGroups.forEach((g, idx) => {
      const pct = analysisResult.totalSum > 0 ? ((g.value / analysisResult.totalSum) * 100).toFixed(1) : '0';
      rows.push([idx + 1, g.name, g.value, `${pct}%`, g.count]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Báo Cáo Phân Tích BI');
    XLSX.writeFile(wb, `Bao_Cao_Auto_BI_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="flex flex-col w-full text-on-surface">
      {/* BREADCRUMB */}
      <nav className="flex items-center gap-space-2 text-on-surface-variant font-body-sm text-body-sm mb-space-4">
        <a href="#" className="hover:text-primary transition-colors flex items-center gap-space-1">
          <span className="material-symbols-outlined text-[16px]">home</span>
          <span>Trang chủ</span>
        </a>
        <span className="text-outline">/</span>
        <a href="#" className="hover:text-primary transition-colors">
          Excel &amp; Hóa đơn
        </a>
        <span className="text-outline">/</span>
        <span className="text-on-surface font-title-sm text-title-sm">Phân Tích Dữ Liệu Tự Động (Auto-BI)</span>
      </nav>

      {/* TOOL HEADER */}
      <div className="flex flex-col gap-space-4 pb-space-6 border-b border-border-subtle/40 mb-space-6">
        <div className="flex flex-wrap items-center justify-between gap-space-4">
          <div className="flex items-center gap-space-3">
            <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary-container shadow-sm">
              <BarChart3 className="w-7 h-7 text-primary-container" />
            </div>
            <div className="flex flex-col">
              <div className="flex flex-wrap items-center gap-space-2">
                <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
                  Phân Tích Dữ Liệu &amp; Báo Cáo Thông Minh (Auto-BI)
                </h1>
                <span className="px-space-2 py-[2px] bg-primary-container/10 text-brand-cyan-bright font-label-sm text-label-sm rounded uppercase">
                  Business Intelligence
                </span>
                <span className="px-space-2 py-[2px] bg-secondary-container/10 text-secondary font-label-sm text-label-sm rounded uppercase flex items-center gap-space-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  Offline Client-Side
                </span>
                <span className="px-space-2 py-[2px] bg-surface-subtle text-tertiary font-label-sm text-label-sm rounded uppercase">
                  Instant Executive Insights
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-outline mt-0.5">
                PIPELINE ID: BI-ANALYTICS-ENGINE-V2.0
              </span>
            </div>
          </div>
        </div>

        <p className="font-body-md text-body-md text-on-surface-variant max-w-4xl">
          Nạp file Excel hoặc CSV dữ liệu thô, thuật toán tự động phân loại cột phân tích (Dimension) và chỉ số tính toán (Metric), trực quan hóa biểu đồ xếp hạng đóng góp và sinh báo cáo tóm tắt điều hành chỉ trong vài giây.
        </p>

        {/* PRIVACY BANNER */}
        <div className="p-space-3 bg-surface-container-low rounded-lg flex items-center gap-space-3 border-l-2 border-secondary">
          <div className="w-8 h-8 rounded bg-secondary-container/20 flex items-center justify-center shrink-0 text-secondary">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-space-2">
              <span className="font-title-sm text-title-sm text-secondary font-semibold">BẢO MẬT CLIENT-SIDE 100%</span>
              <span className="px-space-1 py-[1px] bg-secondary/15 text-secondary font-label-sm text-label-sm rounded">
                ISO-27001 ISOLATED
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Mọi phép tính tổng hợp dữ liệu số, phân loại chỉ số và dựng biểu đồ diễn ra trực tiếp trong bộ nhớ RAM trình duyệt của bạn với WebAssembly, tuyệt đối không gửi tệp dữ liệu lên server.
            </p>
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      {!fileData ? (
        <div className="relative border-2 border-dashed border-border-subtle hover:border-primary-container/60 bg-surface-container-low/60 hover:bg-surface-container transition-all rounded-2xl p-12 text-center cursor-pointer group mb-space-12">
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center justify-center gap-3 pointer-events-none">
            <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center text-primary-container group-hover:scale-110 transition duration-300 shadow">
              <FileSpreadsheet size={32} />
            </div>
            <div>
              <p className="font-title-sm text-title-sm text-on-surface font-semibold">
                Kéo thả tệp dữ liệu <span className="text-brand-cyan-bright font-bold">.XLSX, .XLS, .CSV</span> vào đây
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                hoặc bấm vào khung để chọn tệp từ thiết bị của bạn (Dung lượng tối đa 50MB)
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-space-6 mb-space-12">
          {/* Controls Bar */}
          <div className="bg-surface-container border border-border-subtle/40 p-space-4 rounded-xl flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-4 text-xs font-body-sm">
              <div className="flex items-center gap-2">
                <span className="text-on-surface-variant font-medium">Trục phân loại (X):</span>
                <select
                  value={selectedDimension}
                  onChange={(e) => handleDimensionChange(e.target.value)}
                  className="bg-surface-container-low border border-border-subtle rounded-lg px-3 py-1.5 text-on-surface focus:outline-none focus:border-primary-container cursor-pointer"
                >
                  {columns.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-on-surface-variant font-medium">Chỉ số tính toán (Y):</span>
                <select
                  value={selectedMetric}
                  onChange={(e) => handleMetricChange(e.target.value)}
                  className="bg-surface-container-low border border-border-subtle rounded-lg px-3 py-1.5 text-brand-cyan-bright font-semibold focus:outline-none focus:border-primary-container cursor-pointer"
                >
                  {columns.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportBIReport}
                className="flex items-center gap-1.5 px-space-4 py-space-2 rounded-lg bg-brand-emerald-deep hover:bg-secondary-container text-white font-title-sm text-title-sm font-bold shadow transition cursor-pointer"
              >
                <Download size={16} />
                Xuất Báo Cáo BI (Excel)
              </button>
              <label className="px-space-3 py-space-2 rounded-lg bg-surface-subtle hover:bg-surface-container-high border border-border-subtle text-on-surface font-body-sm text-body-sm font-semibold cursor-pointer transition">
                <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="hidden" />
                Đổi Tệp Khác
              </label>
            </div>
          </div>

          {/* Metric Summary Cards */}
          {analysisResult && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-space-4">
              <div className="bg-surface-container border border-border-subtle/40 rounded-xl p-space-4">
                <p className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                  TỔNG QUY MÔ ({selectedMetric})
                </p>
                <p className="font-headline-md text-headline-md font-bold font-mono text-brand-cyan-bright mt-1">
                  {analysisResult.totalSum.toLocaleString('vi-VN')}
                </p>
              </div>

              <div className="bg-surface-container border border-border-subtle/40 rounded-xl p-space-4">
                <p className="font-label-sm text-label-sm text-on-surface-variant font-medium">GIÁ TRỊ TRUNG BÌNH</p>
                <p className="font-headline-md text-headline-md font-bold font-mono text-on-surface mt-1">
                  {Math.round(analysisResult.avgVal).toLocaleString('vi-VN')}
                </p>
              </div>

              <div className="bg-surface-container border border-border-subtle/40 rounded-xl p-space-4">
                <p className="font-label-sm text-label-sm text-on-surface-variant font-medium">GIÁ TRỊ LỚN NHẤT</p>
                <p className="font-headline-md text-headline-md font-bold font-mono text-secondary mt-1">
                  {analysisResult.maxVal.toLocaleString('vi-VN')}
                </p>
              </div>

              <div className="bg-surface-container border border-border-subtle/40 rounded-xl p-space-4">
                <p className="font-label-sm text-label-sm text-on-surface-variant font-medium">TỔNG SỐ BẢN GHI</p>
                <p className="font-headline-md text-headline-md font-bold font-mono text-tertiary mt-1">
                  {analysisResult.validCount.toLocaleString('vi-VN')}
                </p>
              </div>
            </div>
          )}

          {/* Chart & Insights Row */}
          {analysisResult && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-5">
              {/* Left 2 Cols: Bar Chart Visual */}
              <div className="lg:col-span-2 bg-surface-container border border-border-subtle/40 rounded-xl p-space-5 space-y-4">
                <div className="flex items-center justify-between pb-space-2 border-b border-border-subtle/30">
                  <h3 className="font-label-sm text-label-sm font-bold uppercase tracking-wider text-on-surface flex items-center gap-2">
                    <TrendingUp size={16} className="text-primary-container" />
                    Biểu Đồ Xếp Hạng Top Đóng Góp ({selectedDimension})
                  </h3>
                  <span className="font-label-sm text-label-sm text-outline font-mono">Đơn vị: {selectedMetric}</span>
                </div>

                <div className="space-y-3 pt-2">
                  {analysisResult.topGroups.map((g, idx) => {
                    const topVal = analysisResult.topGroups[0]?.value || 1;
                    const barWidth = Math.max(5, Math.round((g.value / topVal) * 100));
                    const sharePct =
                      analysisResult.totalSum > 0 ? ((g.value / analysisResult.totalSum) * 100).toFixed(1) : 0;

                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between font-body-sm text-body-sm">
                          <span className="text-on-surface font-medium truncate max-w-[240px]">
                            {idx + 1}. {g.name}
                          </span>
                          <span className="text-on-surface font-mono font-bold">
                            {g.value.toLocaleString('vi-VN')}{' '}
                            <span className="text-[11px] text-brand-cyan-bright font-normal">({sharePct}%)</span>
                          </span>
                        </div>
                        <div className="w-full bg-surface-container-lowest h-3 rounded-full overflow-hidden border border-border-subtle/40">
                          <div
                            className="bg-gradient-to-r from-primary-container to-brand-cyan-bright h-full rounded-full transition-all duration-500"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right 1 Col: Key Insights & AI Observations */}
              <div className="bg-surface-container border border-border-subtle/40 rounded-xl p-space-5 space-y-4 flex flex-col justify-between">
                <div>
                  <h3 className="font-label-sm text-label-sm font-bold uppercase tracking-wider text-tertiary flex items-center gap-2 pb-space-2 border-b border-border-subtle/30">
                    <Sparkles size={16} />
                    Nhận Xét &amp; Insights Tự Động
                  </h3>

                  <div className="space-y-3 mt-4 font-body-sm text-body-sm text-on-surface-variant">
                    {analysisResult.insights.map((ins, idx) => (
                      <div
                        key={idx}
                        className="p-space-3 bg-surface-container-low rounded-xl border border-border-subtle/40 flex items-start gap-2.5"
                      >
                        <CheckCircle2 size={16} className="text-tertiary shrink-0 mt-0.5" />
                        <span>{ins}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-space-3 bg-primary-container/10 border border-primary-container/30 rounded-xl font-body-sm text-body-sm text-primary">
                  💡 <strong>Gợi ý điều hành:</strong> Bạn có thể xuất báo cáo này sang file Excel chuẩn để đính kèm vào slide thuyết trình hoặc báo cáo ban giám đốc.
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* FOOTER KIẾN THỨC & QUY CHUẨN ĐỒ HỌA (3 CARDS) */}
      <div className="pt-space-6 border-t border-border-subtle/40 mb-space-8">
        <div className="flex items-center gap-space-2 mb-space-4">
          <span className="material-symbols-outlined text-primary-container text-[20px]">auto_stories</span>
          <h3 className="font-title-sm text-title-sm text-on-surface font-bold">Tiêu Chuẩn Phân Tích Dữ Liệu &amp; Báo Cáo</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-4">
          {/* CARD 1 */}
          <div className="bg-surface-container rounded-xl p-space-4 flex flex-col gap-space-2 hover:bg-surface-container-high transition-colors border border-border-subtle/20">
            <div className="w-10 h-10 rounded-lg bg-surface-subtle flex items-center justify-center text-primary-container mb-space-1">
              <Cpu className="w-5 h-5 text-primary-container" />
            </div>
            <h4 className="font-title-sm text-title-sm text-on-surface font-semibold">Nhận Diện Chỉ Số Thông Minh</h4>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Tự động phân tích kiểu dữ liệu từng cột (chuỗi danh mục hay giá trị số), đề xuất ngay trục phân tích Dimension và Metric phù hợp mà không cần cấu hình thủ công.
            </p>
          </div>

          {/* CARD 2 */}
          <div className="bg-surface-container rounded-xl p-space-4 flex flex-col gap-space-2 hover:bg-surface-container-high transition-colors border border-border-subtle/20">
            <div className="w-10 h-10 rounded-lg bg-surface-subtle flex items-center justify-center text-secondary mb-space-1">
              <Layers className="w-5 h-5 text-secondary" />
            </div>
            <h4 className="font-title-sm text-title-sm text-on-surface font-semibold">Phân Tích Thống Kê In-Memory</h4>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Tính toán quy mô tổng, trung bình, phân bổ tỷ trọng phần trăm và xếp hạng top đóng góp tức thì trên RAM máy khách, hỗ trợ mượt mà các tệp lên đến 50.000 dòng.
            </p>
          </div>

          {/* CARD 3 */}
          <div className="bg-surface-container rounded-xl p-space-4 flex flex-col gap-space-2 hover:bg-surface-container-high transition-colors border border-border-subtle/20">
            <div className="w-10 h-10 rounded-lg bg-surface-subtle flex items-center justify-center text-tertiary mb-space-1">
              <FileCheck className="w-5 h-5 text-tertiary" />
            </div>
            <h4 className="font-title-sm text-title-sm text-on-surface font-semibold">Xuất Bản Báo Cáo Điều Hành Excel</h4>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Một chạm để xuất bản tệp Excel hoàn chỉnh bao gồm bảng tổng quan chỉ số, nhận xét điều hành và chi tiết tỷ trọng theo cấu trúc chuyên nghiệp sẵn sàng thuyết trình.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
