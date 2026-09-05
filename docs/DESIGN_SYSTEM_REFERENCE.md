# 🎨 BẢNG THAM CHIẾU THIẾT KẾ UI/UX & KHO MẪU COMPONENT CHUẨN (DESIGN SYSTEM REFERENCE & PATTERN BOOK)
**AI-Tools Master Hub (`ai-tools`)**  
*Tài liệu tham chiếu thiết kế và mã nguồn mẫu (Component Snippets) dành cho Nhà phát triển & AI Agent khi khởi tạo hoặc tinh chỉnh giao diện miniapp.*

---

## 📌 1. TỔNG QUAN HỆ THỐNG DESIGN TOKENS

Mọi miniapp trong Hub đều hoạt động trên nền tảng **Cascading CSS Variables** định nghĩa tại [design.md](file:///Users/tranhaibang/.gemini/antigravity-ide/scratch/ai-tools/design.md).  
**Quy tắc bất biến**: Tuyệt đối không hardcode mã hex (`#ffffff`, `#000000`) hay class màu tĩnh của Tailwind (`bg-white`, `text-black`, `bg-slate-50`, `border-slate-200`). Mọi thuộc tính màu sắc, bề mặt, viền phải sử dụng CSS Tokens:

### 1.1. Bảng Tra Cứu Màu Sắc & Bề Mặt (Surface & Color Tokens)

| Vai trò ngữ nghĩa | CSS Token Variable | Tailwind Utility Class | Dark Mode (Mặc định) | Light Mode | Ứng dụng thực tế |
|:---|:---|:---|:---|:---|:---|
| **Nền Canvas Toàn Trang** | `--surface-canvas` | `bg-surface-canvas` | `#090D16` | `#F8FAFC` | Nền phía sau khung làm việc |
| **Thẻ / Khung Chứa Chính** | `--surface-container` | `bg-surface-container` | `#171f33` | `#FFFFFF` | Thẻ panel, card cấu hình, dropzone |
| **Bề Mặt Nâng Cao / Dropdown**| `--surface-container-high`| `bg-surface-container-high`| `#222a3d` | `#F1F5F9` | Popup, dropdown menu, active tab |
| **Bề Mặt Mờ Nhẹ / Chip Tag** | `--surface-subtle` | `bg-surface-subtle` | `#1E293B` | `#E2E8F0` | Tag phụ, ô tìm kiếm, button ghost |
| **Đường Viền Tinh Tế (1px)** | `--border-subtle` | `border-border-subtle` | `#334155` | `#CBD5E1` | Viền ngăn cách giữa các panel |
| **Màu Nhấn Chính (Primary)** | `--primary` | `text-primary`, `bg-primary` | `#89ceff` | `#0284C7` | Icon nổi bật, liên kết, focus ring |
| **Nút Bấm Chính** | `--primary-container` | `bg-primary-container` | `#0ea5e9` | `#0284C7` | Nút hành động chính (Process, Convert) |
| **Chữ Trên Nền Chính** | `--on-primary-container` | `text-on-primary-container`| `#ffffff` | `#ffffff` | Nhãn chữ trên nút chính |
| **Bảo Mật / Khách Hàng** | `--secondary` | `text-secondary`, `bg-secondary`| `#4edea3` | `#059669` | Privacy badge, trạng thái thành công |
| **Cảnh Báo / Tham Khảo** | `--tertiary` | `text-tertiary` | `#ffb86e` | `#D97706` | Lưu ý kế toán, cảnh báo tham khảo |
| **Lỗi / Nguy Hiểm** | `--error` | `text-error`, `bg-error-container`| `#ffb4ab` | `#DC2626` | Báo lỗi nạp file, nút hủy/xóa |
| **Chữ Chính (High Contrast)** | `--on-surface` | `text-on-surface` | `#dae2fd` | `#0F172A` | Tiêu đề H1-H3, nhãn quan trọng |
| **Chữ Phụ / Gợi Ý** | `--on-surface-variant` | `text-on-surface-variant` | `#bec8d2` | `#475569` | Mô tả, placeholder, nhãn phụ |
| **Nhãn Mờ / Ký Tự Monospace**| `--outline` | `text-outline` | `#88929b` | `#64748B` | Timestamp, kích thước byte, hash |

---

### 1.2. Typography & Khoảng Cách Chuẩn

- **Phông chữ giao diện chính:** `Inter, system-ui, -apple-system, sans-serif` (`font-sans`).
- **Phông chữ thông số kỹ thuật:** `JetBrains Mono, Menlo, monospace` (`font-mono`) — bắt buộc cho kích thước byte, DPI, mã hex, mã số hóa đơn, hash SHA-256.
- **Quy tắc cỡ chữ mobile:** Ô nhập liệu (`<input>`, `<select>`, `<textarea>`) bắt buộc dùng `text-base sm:text-sm` để chống phóng to tự động trên iOS Safari.
- **Kích thước vùng bấm (Touch Target):** Các nút hành động chính, tab điều hướng phải có chiều cao tối thiểu `h-11` (44px) hoặc `h-10` (40px) trên mobile.

---

## 🧩 2. KHO MẪU COMPONENT THỰC CHIẾN (COPY-PASTE READY)

Dưới đây là 10 mẫu giao diện chuẩn hóa sẵn sàng sao chép vào mã nguồn miniapp mới:

### Mẫu 1: Khung Chứa Wrapper & Context Header Chuẩn 3 Tầng
*Sử dụng tại `hub/src/tools/<id>/<ToolName>Tool.jsx`*

```jsx
import React from 'react';
import { Sparkles, ShieldCheck, ArrowLeft } from 'lucide-react';
import ToolErrorBoundary from '../../components/ToolErrorBoundary';
import MyToolView from '@ai-tools/core/components/MyToolView';

export default function MyToolTool({ displayLang = 'vi', onBackToHub }) {
  return (
    <ToolErrorBoundary toolId="my-tool" onBackToHub={onBackToHub}>
      <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface">
        {/* BREADCRUMB */}
        <nav className="flex items-center gap-2 text-xs text-on-surface-variant mb-4">
          <button
            type="button"
            onClick={onBackToHub}
            className="hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Trang chủ</span>
          </button>
          <span className="text-outline">/</span>
          <span className="text-on-surface font-semibold">Tên Công Cụ Của Bạn</span>
        </nav>

        {/* TIER 1: CONTEXT HEADER */}
        <header className="flex flex-col gap-2 pb-6 border-b border-border-subtle/50 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-container/15 text-primary border border-primary/20 flex items-center justify-center shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-on-surface">
                Tên Công Cụ Của Bạn
              </h1>
              <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
                Mô tả cô đọng mục đích và kết quả công cụ mang lại cho người dùng trong 1 câu ngắn gọn.
              </p>
            </div>
          </div>

          {/* PRIVACY 1-LINE BADGE */}
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant pt-1">
            <ShieldCheck size={14} className="text-secondary shrink-0" />
            <span>Xử lý trực tiếp trên trình duyệt — tệp không được tải lên máy chủ.</span>
          </div>
        </header>

        {/* CORE WORKSPACE VIEW */}
        <MyToolView displayLang={displayLang} />
      </div>
    </ToolErrorBoundary>
  );
}
```

---

### Mẫu 2: Dual-Contract Dropzone (Kéo Thả Chuột + Thẻ Input Ẩn)
*Chuẩn hóa theo Mục 3.7 MAIS: Cho phép kéo thả chuột và hỗ trợ script kiểm thử tự động nạp tệp qua `input[type="file"]`.*

```jsx
import React, { useState, useRef } from 'react';
import { UploadCloud, FileType, CheckCircle2 } from 'lucide-react';

export function DualContractDropzone({ onFileAccepted, accept = '.png,.jpg,.jpeg', maxSizeMB = 20 }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragOver(true);
    else if (e.type === 'dragleave') setIsDragOver(false);
  };

  const processFile = (file) => {
    if (!file) return;
    setSelectedFile(file);
    if (onFileAccepted) onFileAccepted(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer?.files?.[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e) => {
    if (e.target?.files?.[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`relative rounded-2xl border-2 border-dashed p-8 transition-all duration-200 cursor-pointer text-center flex flex-col items-center justify-center min-h-[180px] select-none ${
        isDragOver
          ? 'border-primary-container bg-primary-container/10 scale-[0.99]'
          : 'border-border-subtle hover:border-primary/50 bg-surface-container/60 hover:bg-surface-container'
      }`}
    >
      {/* BẮT BUỘC: Thẻ input file ẩn cho kiểm thử tự động và trợ năng */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
        aria-label="Tải tệp lên"
      />

      <div className="w-12 h-12 rounded-xl bg-surface-subtle border border-border-subtle flex items-center justify-center text-primary mb-3 shadow-inner">
        <UploadCloud size={24} />
      </div>

      {selectedFile ? (
        <div className="flex items-center gap-2 text-secondary font-medium text-sm">
          <CheckCircle2 size={16} />
          <span className="font-mono">{selectedFile.name}</span>
          <span className="text-outline text-xs">
            ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
          </span>
        </div>
      ) : (
        <>
          <p className="font-semibold text-sm text-on-surface">
            Kéo &amp; thả tệp vào đây, hoặc <span className="text-primary hover:underline">chọn từ thiết bị</span>
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            Hỗ trợ định dạng {accept} (Dung lượng tối đa {maxSizeMB}MB)
          </p>
        </>
      )}
    </div>
  );
}
```

---

### Mẫu 3: Thanh Điều Hướng Tiến Trình (Step Wizard Navigation)

```jsx
import React from 'react';
import { Check } from 'lucide-react';

export function StepWizard({ currentStep = 1, onSelectStep }) {
  const steps = [
    { id: 1, title: 'Nạp Tệp' },
    { id: 2, title: 'Cấu Hình & Tinh Chỉnh' },
    { id: 3, title: 'Kết Quả & Tải Về' },
  ];

  return (
    <div className="w-full flex items-center justify-between pb-6 mb-6 border-b border-border-subtle/40 overflow-x-auto">
      <div className="flex items-center gap-2 sm:gap-4 min-w-[320px]">
        {steps.map((step, idx) => {
          const isDone = currentStep > step.id;
          const isActive = currentStep === step.id;
          return (
            <React.Fragment key={step.id}>
              <button
                type="button"
                onClick={() => onSelectStep && isDone && onSelectStep(step.id)}
                disabled={!isDone && !isActive}
                className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed ${
                  isActive
                    ? 'bg-primary-container text-on-primary-container shadow-sm'
                    : isDone
                    ? 'bg-surface-subtle text-secondary hover:bg-surface-container'
                    : 'text-outline bg-transparent'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[11px] ${
                  isActive ? 'bg-white/20' : isDone ? 'bg-secondary/20 text-secondary' : 'bg-surface-subtle text-outline'
                }`}>
                  {isDone ? <Check size={12} strokeWidth={3} /> : step.id}
                </span>
                <span>{step.title}</span>
              </button>
              {idx < steps.length - 1 && (
                <div className="w-6 h-[1px] bg-border-subtle/60 shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
```

---

### Mẫu 4: Khung Tùy Chỉnh Tham Số (Settings & Parameters Card)

```jsx
import React from 'react';
import { Sliders, HelpCircle } from 'lucide-react';

export function ParameterSetupCard({ quality, setQuality, outputFormat, setOutputFormat }) {
  return (
    <div className="bg-surface-container border border-border-subtle rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-border-subtle/50 pb-3">
        <div className="flex items-center gap-2 text-on-surface font-semibold text-sm">
          <Sliders size={16} className="text-primary" />
          <span>Tham Số Xử Lý</span>
        </div>
        <span className="text-[11px] font-mono text-outline">Chất lượng: {quality}%</span>
      </div>

      {/* Slider Control */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-on-surface-variant">
          <label htmlFor="quality-slider" className="font-medium">Mức nén / Tỷ lệ chất lượng</label>
          <span className="font-mono text-primary font-bold">{quality}%</span>
        </div>
        <input
          id="quality-slider"
          type="range"
          min="10"
          max="100"
          value={quality}
          onChange={(e) => setQuality(Number(e.target.value))}
          className="w-full h-1.5 bg-surface-subtle rounded-lg appearance-none cursor-pointer accent-primary"
        />
      </div>

      {/* Select Control with iOS Zoom Prevention */}
      <div className="space-y-1.5">
        <label htmlFor="format-select" className="text-xs font-medium text-on-surface-variant flex items-center gap-1">
          <span>Định dạng đầu ra</span>
          <HelpCircle size={12} className="text-outline" />
        </label>
        <select
          id="format-select"
          value={outputFormat}
          onChange={(e) => setOutputFormat(e.target.value)}
          className="w-full bg-surface-subtle border border-border-subtle text-on-surface text-base sm:text-sm rounded-lg px-3 py-2 outline-none focus:border-primary-container transition-colors"
        >
          <option value="webp">WebP (Tối ưu dung lượng tốt nhất)</option>
          <option value="jpeg">JPEG (Tương thích phổ biến)</option>
          <option value="png">PNG (Giữ nguyên trong suốt)</option>
        </select>
      </div>
    </div>
  );
}
```

---

### Mẫu 5: Nhóm Nút Hành Động Chuẩn (Action Button Group)

```jsx
import React from 'react';
import { Play, RotateCcw, Download, Loader2 } from 'lucide-react';

export function ActionBar({ onExecute, onReset, isProcessing, canExecute, onDownload, hasResult }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border-subtle/50">
      <button
        type="button"
        onClick={onReset}
        disabled={isProcessing}
        className="h-11 sm:h-10 px-4 rounded-xl border border-border-subtle bg-surface-subtle hover:bg-surface-container text-on-surface-variant hover:text-on-surface text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
      >
        <RotateCcw size={14} />
        <span>Đặt Lại</span>
      </button>

      <div className="flex items-center gap-2">
        {hasResult && (
          <button
            type="button"
            onClick={onDownload}
            className="h-11 sm:h-10 px-4 rounded-xl bg-secondary text-surface-canvas hover:brightness-110 text-xs font-bold transition-all shadow flex items-center gap-2 cursor-pointer"
          >
            <Download size={15} />
            <span>Tải Kết Quả</span>
          </button>
        )}

        <button
          type="button"
          onClick={onExecute}
          disabled={!canExecute || isProcessing}
          className="h-11 sm:h-10 px-5 rounded-xl bg-primary-container text-on-primary-container hover:brightness-105 active:scale-[0.98] text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
        >
          {isProcessing ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Đang Xử Lý...</span>
            </>
          ) : (
            <>
              <Play size={15} fill="currentColor" />
              <span>Bắt Đầu Xử Lý</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
```

---

### Mẫu 6: Bảng Dữ Liệu Kết Quả Không Tràn Ngang (Responsive Data Grid)
*Đảm bảo nguyên tắc Zero Horizontal Overflow trên mobile.*

```jsx
import React from 'react';
import { FileText, CheckCircle } from 'lucide-react';

export function ResponsiveResultsTable({ items = [] }) {
  if (items.length === 0) return null;

  return (
    <div className="bg-surface-container border border-border-subtle rounded-xl overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-border-subtle/50 flex items-center justify-between">
        <span className="text-xs font-bold text-on-surface">Danh Sách Kết Quả</span>
        <span className="text-[11px] font-mono text-outline">{items.length} mục</span>
      </div>

      {/* BẮT BUỘC: overflow-x-auto để bảng nhiều cột không đẩy rộng toàn trang mobile */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-on-surface">
          <thead className="bg-surface-subtle/60 text-on-surface-variant font-semibold border-b border-border-subtle/50">
            <tr>
              <th className="p-3">#</th>
              <th className="p-3">Tên Tệp</th>
              <th className="p-3">Kích Thước Gốc</th>
              <th className="p-3">Kích Thước Sau</th>
              <th className="p-3">Tỷ Lệ Giảm</th>
              <th className="p-3 text-right">Trạng Thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle/30">
            {items.map((row, idx) => (
              <tr key={idx} className="hover:bg-surface-subtle/40 transition-colors">
                <td className="p-3 font-mono text-outline">{idx + 1}</td>
                <td className="p-3 font-medium flex items-center gap-2">
                  <FileText size={14} className="text-primary shrink-0" />
                  <span className="truncate max-w-[160px] sm:max-w-xs">{row.name}</span>
                </td>
                <td className="p-3 font-mono text-outline">{row.originalSize}</td>
                <td className="p-3 font-mono text-on-surface font-semibold">{row.newSize}</td>
                <td className="p-3 font-mono text-secondary font-semibold">-{row.ratio}%</td>
                <td className="p-3 text-right">
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-secondary bg-secondary/10 px-2 py-0.5 rounded">
                    <CheckCircle size={10} /> Đạt
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

### Mẫu 7: Quản Lý Đa Ngôn Ngữ Chuẩn Hóa (i18n Dictionary)

```jsx
const translations = {
  vi: {
    dropTitle: 'Kéo thả tệp vào đây',
    dropSub: 'Hỗ trợ tệp PNG, JPG',
    btnProcess: 'Bắt đầu xử lý',
    btnReset: 'Đặt lại',
    statusDone: 'Hoàn tất thành công!',
  },
  en: {
    dropTitle: 'Drag and drop files here',
    dropSub: 'Supports PNG, JPG',
    btnProcess: 'Start Processing',
    btnReset: 'Reset',
    statusDone: 'Completed successfully!',
  },
  ja: {
    dropTitle: 'ここにファイルをドロップ',
    dropSub: 'PNG、JPG対応',
    btnProcess: '処理を開始',
    btnReset: 'リセット',
    statusDone: '正常に完了しました！',
  },
};

export function useToolI18n(displayLang = 'vi') {
  return translations[displayLang] || translations.vi;
}
```

---

### Mẫu 8: Quản Lý Bộ Nhớ LocalStorage An Toàn (Namespaced Storage)

```jsx
// BẮT BUỘC: Tiền tố namespace ai_tools_<id>_* để chống ghi đè dữ liệu miniapp khác
const STORAGE_PREFIX = 'ai_tools_my-tool_';

export const storage = {
  get: (key, fallback = null) => {
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
    } catch (err) {
      console.warn('Storage write failed', err);
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
    } catch {
      /* noop */
    }
  }
};
```

---

### Mẫu 9: Chống Rò Rỉ RAM Khi Xử Lý Tệp Lớn (Blob Lifecycle)

```jsx
import { useEffect, useRef } from 'react';

export function useObjectUrl(fileOrBlob) {
  const urlRef = useRef(null);

  useEffect(() => {
    if (!fileOrBlob) return;
    const url = URL.createObjectURL(fileOrBlob);
    urlRef.current = url;

    // BẮT BUỘC: Thu hồi ObjectURL khi component unmount hoặc tệp thay đổi
    return () => {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };
  }, [fileOrBlob]);

  return urlRef.current;
}
```

---

### Mẫu 10: Cơ Chế Đóng Gói Tải Về Hàng Loạt (JSZip Batch Export)

```jsx
import JSZip from 'jszip';

export async function exportFilesAsZip(files = [], zipName = 'results.zip') {
  const zip = new JSZip();
  files.forEach((item) => {
    zip.file(item.fileName, item.blobData);
  });
  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = zipName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```
