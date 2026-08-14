import React, { useState } from 'react';
import {
  BarChart3, UploadCloud, Download, FileSpreadsheet, RefreshCw,
  TrendingUp, PieChart, Layers, ArrowUpRight, ArrowDownRight,
  Sparkles, CheckCircle2, ShieldCheck, Filter
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function AutoBiTool({ displayLang }) {
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

    const sortedGroups = Object.values(groupMap)
      .sort((a, b) => b.value - a.value);

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
      `Giá trị trung bình mỗi bản ghi đạt ${Math.round(avgVal).toLocaleString('vi-VN')} đơn vị.`
    ];

    setAnalysisResult({
      totalSum,
      validCount,
      avgVal,
      maxVal,
      minVal,
      sortedGroups,
      topGroups,
      insights
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
      ['STT', 'Tên Phân Loại', 'Tổng Giá Trị', 'Tỷ Trọng (%)', 'Số Lượng']
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
            <BarChart3 className="text-cyan-400" size={24} />
            Phân Tích Dữ Liệu & Báo Cáo Thông Minh (Auto-BI)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Nạp file Excel/CSV thô, tự động nhận diện chỉ số, vẽ biểu đồ tương tác và sinh báo cáo điều hành.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
            <ShieldCheck size={14} />
            100% Client Analytics
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      {!fileData ? (
        <div className="relative border-2 border-dashed border-slate-700 hover:border-cyan-500/60 bg-slate-900/40 hover:bg-slate-900/80 transition rounded-2xl p-10 text-center cursor-pointer group">
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center justify-center gap-3 pointer-events-none">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition duration-300">
              <FileSpreadsheet size={28} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">
                Kéo thả tệp dữ liệu <span className="text-cyan-400 font-bold">.XLSX, .XLS, .CSV</span> vào đây
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Tự động nhận diện trường dữ liệu và trực quan hóa ngay lập tức
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Trục phân loại (X):</span>
                <select
                  value={selectedDimension}
                  onChange={(e) => handleDimensionChange(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {columns.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400">Chỉ số tính toán (Y):</span>
                <select
                  value={selectedMetric}
                  onChange={(e) => handleMetricChange(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-cyan-400 font-semibold focus:outline-none focus:border-cyan-500"
                >
                  {columns.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportBIReport}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition"
              >
                <Download size={14} />
                Xuất Báo Cáo BI (Excel)
              </button>
              <label className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition">
                <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="hidden" />
                Đổi Tệp Khác
              </label>
            </div>
          </div>

          {/* Metric Summary Cards */}
          {analysisResult && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-400 font-medium">Tổng Quy Mô ({selectedMetric})</p>
                <p className="text-xl font-bold text-cyan-400 mt-1">{analysisResult.totalSum.toLocaleString('vi-VN')}</p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-400 font-medium">Giá Trị Trung Bình</p>
                <p className="text-xl font-bold text-slate-200 mt-1">{Math.round(analysisResult.avgVal).toLocaleString('vi-VN')}</p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-400 font-medium">Giá Trị Lớn Nhất</p>
                <p className="text-xl font-bold text-emerald-400 mt-1">{analysisResult.maxVal.toLocaleString('vi-VN')}</p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-400 font-medium">Tổng Số Bản Ghi</p>
                <p className="text-xl font-bold text-indigo-400 mt-1">{analysisResult.validCount.toLocaleString('vi-VN')}</p>
              </div>
            </div>
          )}

          {/* Chart & Insights Row */}
          {analysisResult && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Left 2 Cols: Bar Chart Visual */}
              <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <TrendingUp size={16} className="text-cyan-400" />
                    Biểu Đồ Xếp Hạng Top Đóng Góp ({selectedDimension})
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">Đơn vị: {selectedMetric}</span>
                </div>

                <div className="space-y-3 pt-2">
                  {analysisResult.topGroups.map((g, idx) => {
                    const topVal = analysisResult.topGroups[0]?.value || 1;
                    const barWidth = Math.max(5, Math.round((g.value / topVal) * 100));
                    const sharePct = analysisResult.totalSum > 0 ? ((g.value / analysisResult.totalSum) * 100).toFixed(1) : 0;

                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-300 font-medium truncate max-w-[240px]">
                            {idx + 1}. {g.name}
                          </span>
                          <span className="text-slate-200 font-mono font-bold">
                            {g.value.toLocaleString('vi-VN')}{' '}
                            <span className="text-[10px] text-cyan-400/80 font-normal">({sharePct}%)</span>
                          </span>
                        </div>
                        <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right 1 Col: Key Insights & AI Observations */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <Sparkles size={16} />
                    Nhận Xét & Insights Tự Động
                  </h3>

                  <div className="space-y-3 mt-4 text-xs text-slate-300">
                    {analysisResult.insights.map((ins, idx) => (
                      <div key={idx} className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 flex items-start gap-2.5">
                        <CheckCircle2 size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                        <span>{ins}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl text-xs text-cyan-300">
                  💡 <strong>Gợi ý hành động:</strong> Bạn có thể xuất báo cáo này để đính kèm vào slide thuyết trình hoặc gửi tóm tắt nhanh cho ban giám đốc.
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
