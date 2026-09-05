# Design System Specification: Modern Utility Workspace
**AI-Tools Master Hub (ai-tools)**  
*Single Source of Truth (SSOT) for UI/UX Architecture, Visual Tokens, and Component Standards*

---

## 1. Design Philosophy

The AI-Tools Master Hub operates on the **Modern Utility Workspace** design philosophy. It is a **Tool-First, Public Utility Workspace** built for immediate speed, functional clarity, and zero cognitive friction:

> **Find tool → Open → Process file → Download result.**

The interface is strictly **TOOL-FIRST**, NOT architecture-first or marketing-first. Users come to get work done, not to read about backend architecture or feature marketing.

---

### 1.1 The 6 Mandatory Design Rules

Every page, tool, execution state, and future mini-app MUST adhere to these six unbreakable rules:

1. **Rule 1: Tool-First UX (Task Speed over Architecture)**
   - Prioritize immediate utility above all else.
   - The primary interactive workspace (upload, dropzone, editor, or canvas) must be immediately visible and operable above the fold without scrolling past promotional banners or architecture explanations.

2. **Rule 2: No Duplicate Discovery Controls**
   - The application has exactly **ONE primary live search** in the global Header (`⌘K` or `/` shortcut, with clear `✕` button).
   - In-page duplicate search inputs, redundant category bars, and separate "Quick Access" sections are strictly prohibited.
   - Category filtering is unified into a single persistent subnav bar directly below the header.

3. **Rule 3: Minimal Architecture Messaging**
   - Eliminate architecture diagrams, metrics ribbons (e.g., "10/12 Chạy Offline", "0 KB Server", "<50ms Độ Trễ"), engine implementation tags (Wasm/native JS), and internal diagnostics (`PIPELINE ID: ...`).
   - Privacy assurance is communicated solely via a subtle, non-intrusive 1-line note:
     > *"Xử lý trực tiếp trên trình duyệt — tệp không được tải lên máy chủ."*

4. **Rule 4: Execution-State Normalization**
   - ALL execution states, step wizards, options forms, dropzones, modals, comparison sliders, and result lists MUST follow the exact same dark design tokens (`#090D16` canvas, `#171f33` containers, `#334155` borders, `#0ea5e9` cyan, `#4edea3` emerald).
   - Lingering light mode classes (`bg-white`, `border-slate-200`, `text-slate-900`, `bg-blue-50`, bright blue unstyled buttons) in inner components or dialogs are strictly prohibited.

5. **Rule 5: No Isolated Tool Themes**
   - Tools are parts of a single unified suite, not isolated third-party embeds.
   - All tools share identical surface luminance, border radii (`rounded-xl` / `rounded-lg`), font hierarchies, and icon styling (`lucide-react`). Custom unshared color palettes per tool are prohibited.

6. **Rule 6: Screen-Space Maximization**
   - Maximize screen real estate for the actual workspace, canvas, and file processing stages.
   - Non-functional marketing cards, SEO guide paragraphs, and "Assurance Guarantee" cards at the bottom of tools are prohibited.

---

### 1.2 Core Principles
1. **USABILITY > CONSISTENCY > CLARITY > VISUAL DECORATION**:
   - Every pixel, border, and badge must serve an operational purpose. Decorative elements (glows, scrims) must remain subtle, low-opacity, and non-distracting (`pointer-events-none`).
2. **Transparent Data Architecture (Zero-Inference Privacy)**:
   - 100% in-browser computation using WebAssembly (Wasm) and native Canvas/JS. Zero server storage, zero network payload leaks, full offline capability.
   - Communicated cleanly without visual noise.
3. **Frictionless Tool Discovery**:
   - Instant search accessibility (`⌘K` or `/`, with `ESC` to clear).
   - Instant category filtering with clear item counts.
4. **Predictable Workspace Mental Model**:
   - Every tool follows a streamlined 3-tier structural rhythm: *Context Header → Input & Config Workspace → Result Stage*.

---

## 2. Visual Hierarchy & Spatial System

The spatial rhythm is built strictly upon an **8px layout grid** with **4px micro-increments**.

### 2.1 Spacing Scale
| Token | Value | Tailwind Class | Primary Usage |
| :--- | :--- | :--- | :--- |
| `grid-unit` | 4px | `p-space-1`, `gap-1` | Micro padding, indicator dots, inline tags |
| `space-2` | 8px | `p-space-2`, `gap-2` | Badge padding, icon-text gap, compact list items |
| `space-3` | 12px | `p-space-3`, `gap-3` | Dropdown items, breadcrumbs, search input padding |
| `space-4` | 16px | `p-space-4`, `gap-4` | Mobile gutter, card padding, modal content gap |
| `space-5` | 20px | `p-space-5`, `gap-5` | Catalog tool card padding, panel headers |
| `space-6` | 24px | `p-space-6`, `gap-6` | Desktop gutter, section headers, prominent feature cards |
| `space-8` | 32px | `p-space-8`, `gap-8` | Major section breaks, workspace tier separations |
| `space-12` | 48px | `p-space-12`, `gap-12` | Empty state vertical spacing, hero top padding |

### 2.2 Surface Elevation & Layering
Rather than using heavy drop shadows, depth is achieved through **luminance stepping** and **1px subtle borders** (`border-border-subtle` / `#334155`):

```
+-------------------------------------------------------------+
| Layer 4: Modals & Tooltips       | #222a3d (container-high)  |
+-------------------------------------------------------------+
| Layer 3: Interactive Cards       | #171f33 (container)       |
+-------------------------------------------------------------+
| Layer 2: Filter & Group Rails    | #131b2e (container-low)   |
+-------------------------------------------------------------+
| Layer 1: Global App Canvas       | #090D16 (surface-canvas)  |
+-------------------------------------------------------------+
```

---

## 3. Layout Architecture

### 3.1 Global Container Constraints
- **Desktop Max Width**: `1240px` (`max-w-[1240px] mx-auto`)
- **Horizontal Padding**:
  - Desktop (>=1024px): `px-6` to `px-8` (24px to 32px)
  - Tablet (768px): `px-6` (24px)
  - Mobile (375px–390px): `px-4` (16px)

### 3.2 Home "Tool Discovery Hub" Layout Diagram
```
+-----------------------------------------------------------------------------------+
|  NAVBAR (h-16, fixed, backdrop-blur-xl, max-w-[1240px])                           |
|  [Logo: AI-Tools HUB]  [Search input: ⌘K or / (Clear ✕)]  [Lang] [Settings]       |
+-----------------------------------------------------------------------------------+
|  CATEGORY SUBNAV BAR (Tất cả | Công cụ PDF | Hình ảnh | Excel | Tiện ích)         |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  TOOL CATALOG GRID (Immediate 12-Tool Catalog Grid — Above the fold)              |
|  +--------------------+ +--------------------+ +--------------------+             |
|  | [Icon] Card Title  | | [Icon] Card Title  | | [Icon] Card Title  |             |
|  | Category Tag       | | Category Tag       | | Category Tag       |             |
|  | Description        | | Description        | | Description        |             |
|  | [Mở công cụ →]     | | [Mở công cụ →]     | | [Mở công cụ →]     |             |
|  +--------------------+ +--------------------+ +--------------------+             |
|  (All 12 tools instantly accessible without scrolling past promotional banners)   |
|                                                                                   |
|  FOOTER (max-w-[1240px], border-t, build info, data policy modal link)            |
+-----------------------------------------------------------------------------------+
```

---

## 4. Breakpoints & Responsive Strategy

| Breakpoint | Width | Grid System | Navigation Behavior | Key Adaptations |
| :--- | :--- | :--- | :--- | :--- |
| **Mobile** | `<768px` (375–390px) | 1 column (`grid-cols-1`) | Compact header, full-width search, horizontal subnav | 44px touch targets, action buttons sticky at bottom, breadcrumb truncated to current tool |
| **Tablet** | `768px–1023px` | 2 columns (`grid-cols-2`) | Condensed navbar, scrollable category pills | Dual-pane split views stack vertically when needed |
| **Desktop** | `1024px–1239px` | 3 columns (`grid-cols-3`) | Full horizontal navbar, inline ⌘K search bar | Side-by-side workspace panels, expanded table headers |
| **Wide Desktop**| `>=1240px` | 3 or 4 columns | Standard 1240px centered container | Complete workspace with side-by-side live previews |

---

## 5. Color Palette & Semantic Roles

All colors are implemented via CSS variables mapped directly to Tailwind utility tokens:

```css
:root {
  /* Canvas & Containers */
  --surface-canvas: #090D16;
  --surface-container: #171f33;
  --surface-container-low: #131b2e;
  --surface-container-high: #222a3d;
  --surface-subtle: #1E293B;
  --border-subtle: #334155;

  /* Primary Brand (Electric Sky Cyan) */
  --primary: #89ceff;
  --primary-container: #0ea5e9;
  --brand-cyan-bright: #38BDF8;

  /* Client Safety (Emerald) */
  --secondary: #4edea3;
  --secondary-container: #00a572;
  --brand-emerald-deep: #059669;

  /* Warning / Accounting Accent (Amber) */
  --tertiary: #ffb86e;
  --tertiary-container: #de8712;

  /* Error */
  --error: #ffb4ab;
  --error-container: #93000a;

  /* Text & Contrast */
  --on-surface: #dae2fd;
  --on-surface-variant: #bec8d2;
  --outline: #88929b;
}
```

### 5.1 Semantic Usage Rules
- **Canvas (`#090D16`)**: Deep, low-noise dark canvas that prevents visual fatigue.
- **Surface Container (`#171f33`)**: Standard card background with 1px `#334155` border.
- **Electric Cyan (`#0EA5E9`)**: Primary calls to action, focus rings, and general tool actions.
- **Safety Emerald (`#4edea3` / `#10B981`)**: Dedicated exclusively to privacy, client-side execution badges, Wasm safety, and success states.
- **Amber / Gold (`#ffb86e`)**: Accounting checks, disclaimers (`outputPurpose: 'reference'`), and cautionary notices.

---

## 6. Typography Scale & Hierarchy

- **Primary Font**: `Inter, system-ui, sans-serif`
- **Monospace Font**: `JetBrains Mono, monospace` (used for hashes, metrics, file sizes, and status codes).

| Token | Size | Line Height | Weight | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `display-lg` | 40px | 48px | Bold (700) | `-0.02em` | Main Hub Hero headline |
| `headline-lg`| 30px | 38px | SemiBold (600) | `-0.015em` | Tool page primary title |
| `headline-md`| 20px | 28px | SemiBold (600) | `-0.01em` | Section headers, card group titles |
| `title-sm` | 16px | 24px | SemiBold (600) | Normal | Tool card title, modal title |
| `body-lg` | 16px | 24px | Regular (400) | Normal | Hero descriptive paragraph |
| `body-md` | 14px | 20px | Regular (400) | Normal | Card descriptions, form labels, guides |
| `body-sm` | 12px | 18px | Regular (400) | Normal | Secondary hints, timestamps, footnotes |
| `label-md` | 12px | 16px | Medium (500) | `+0.04em` | Monospace tags, status pills |
| `label-sm` | 11px | 14px | SemiBold (600) | `+0.06em` | Badges, table header categories |

---

## 7. Component Architecture

The application is structured into a modular monorepo:
- `hub/`: Main application shell, routing, discovery hub, command palette, and lightweight tool wrappers.
- `packages/core/`: Reusable headless logic, file parsers, WebAssembly runners, and shared design system components.

### 7.1 Component Tree Diagram
```
hub/src/App.jsx
│
├── Navbar.jsx (Global bar, Live Search ⌘K or /, Language Switcher, Settings)
├── CategorySubnav (Tất cả, PDF, Hình ảnh, Excel, Tiện ích)
│
├── Case 1: Active Tool View
│   └── ToolContainer.jsx (Breadcrumb, tool switcher dropdown, subtle privacy note)
│       └── ToolErrorBoundary.jsx
│           └── Suspense Fallback
│               └── [ActiveToolComponent] (Wrapped in StandardToolLayout)
│
└── Case 2: Main Hub Dashboard
    ├── Tool Catalog Grid (Immediate 12 dynamic ToolCards above the fold)
    └── Footer (Build info, status, data policy link)
```

---

## 8. Navigation & Discovery

### 8.1 Universal App Bar (Navbar)
- **Height**: 64px (`h-16`), fixed at top with `backdrop-blur-xl bg-surface-canvas/90`.
- **Unified Live Search**: Real-time filter input with auto-focus shortcut (`/` or `⌘K`), clear button (`✕` or `ESC`), and active match count.
- **Language Switcher**: Cycling between Vietnamese (`VI`), English (`EN`), and Japanese (`JA`).

### 8.2 Category Subnav Bar
- Positioned directly beneath the Header.
- Clean category pills with item count badges (`Tất cả (12)`, `Công cụ PDF (2)`, `Hình ảnh & WebP (3)`, `Excel & Hóa đơn (3)`, `Tiện ích (4)`).
- Instant filtering with zero page reload.

### 8.3 Tool Container Navigation
When a user launches any tool:
- **Back Navigation**: "Về Trang Chủ" button with back arrow.
- **Breadcrumb**: Clickable trail: `AI-Tools Hub` > `[Danh Mục]` > `[Tên Công Cụ]`.
- **Quick Switcher Dropdown**: Allows instant switching between any of the 12 active tools without returning to the home screen.
- **Subtle Privacy Note**: Minimal 1-line reassurance: *"Xử lý trực tiếp trên trình duyệt — tệp không được tải lên máy chủ."*

---

## 9. Tool Page Standard Layout

All active tools share the standardized **Streamlined 3-Tier Workspace Architecture**:

```
+-------------------------------------------------------------------------------+
| TIER 1: CONTEXT HEADER & PRIVACY STATUS                                       |
| [ Trang chủ > Danh mục > Tên Tool ]                                           |
|                                                                               |
| +---------------------------------------------------------------------------+ |
| | [Icon] Tool Title                                                         | |
| |        Concise tool description (1-2 lines)...                             | |
| |        • Xử lý trực tiếp trên trình duyệt — tệp không tải lên máy chủ.     | |
| +---------------------------------------------------------------------------+ |
+-------------------------------------------------------------------------------+
| TIER 2: INPUT & CONFIGURATION WORKSPACE (Maximum Screen Real Estate)          |
| +------------------------------------+ +------------------------------------+ |
| | [DropZone: Drag & Drop Files]      | | [Parameters & Settings Panel]      | |
| | Max size limits, format tags       | | Sliders, checkboxes, options       | |
| +------------------------------------+ +------------------------------------+ |
+-------------------------------------------------------------------------------+
| TIER 3: PROCESSING & RESULTS STAGE                                            |
| +---------------------------------------------------------------------------+ |
| | [Status: Hoàn tất]                  [Nút Tải Tất Cả] [Xóa/Làm lại]         | |
| | Grid of Processed Items with Preview, Diff, Compare, and Download triggers | |
| +---------------------------------------------------------------------------+ |
+-------------------------------------------------------------------------------+
```

### 9.1 Shared Component Code Example
```jsx
import {
  StandardToolLayout,
  ToolHeader,
  SectionCard,
  FileUploader,
  ResultCard
} from '@ai-tools/core/components/shared/StandardToolLayout.jsx';

export default function ExampleTool() {
  return (
    <StandardToolLayout
      category="Hình ảnh & WebP"
      toolName="WebP Master"
    >
      <ToolHeader
        icon={ImageIcon}
        title="WebP Master & Nén Ảnh"
        description="Nén ảnh hàng loạt với WebAssembly trực tiếp trên trình duyệt."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <SectionCard title="Nạp Tệp Tin" className="lg:col-span-7">
          <FileUploader onFilesSelected={handleFiles} />
        </SectionCard>
        <SectionCard title="Cấu Hình Nén" className="lg:col-span-5">
          {/* Controls */}
        </SectionCard>
      </div>

      {/* Results rendered dynamically when processed */}
    </StandardToolLayout>
  );
}
```

---

## 10. Forms, Upload, & Input Controls

### 10.1 Drag & Drop Zone
- **Border**: 2px dashed `border-border-subtle` transitioning to `border-primary-container` on drag-over.
- **Feedback**: Subtle scale-down (`scale-[0.99]`) and glow (`bg-primary-container/10`).
- **File Validation**:
  - Validates file extensions and MIME types.
  - **Magic-Byte Signature Verification** (`verifyDocumentSignature`): Verifies file headers (PNG `\x89PNG`, PDF `%PDF`, ZIP `PK\x03\x04`) to prevent file-renaming attacks.

### 10.2 Controls & Inputs
- Text inputs & selects use `bg-surface-container text-on-surface border border-border-subtle rounded-lg`.
- Focus states: `focus:border-primary-container focus:outline-none`.

---

## 11. Progress, Status, & Feedback

- **Multi-File Progress**: Displayed as `Đã xử lý {done}/{total}` with progress percentage and file name ticker.
- **Cancellation**: "Dừng sau ảnh hiện tại" button to abort long batch jobs gracefully without freezing browser memory.
- **Notice Banners**:
  - Reference Output Disclaimer (`border-tertiary/20 bg-tertiary/10 text-tertiary`).
  - Error Notification (`border-error/30 bg-error-container/20 text-error`).

---

## 12. Results, Preview, & Output

- **Comparison Modals**: Side-by-side or slider comparison (original vs. compressed/processed).
- **Batch Export**: Single-click export of multiple outputs bundled into ZIP files with zero server roundtrips (`JSZip` + `file-saver`).
- **Print Optimization**: CSS `@media print` rules ensure certificates, ID photos, and invoices render cleanly without UI artifacts.

---

## 13. Iconography & Visual Accents

- **Unified Library**: Exclusively `lucide-react`.
- **System Rule**: **NO raw emoji characters as functional icons**. Emojis can lead to platform-dependent font rendering discrepancies and inconsistent alignment.
- **Accents**: Subtle ambient radial glows (`w-32 h-32 blur-3xl opacity-20 pointer-events-none`) anchored to card top-right corners.

---

## 14. Micro-interactions & Motion

- **Transition Durations**: All interactive states use `transition-all duration-200 ease-out`.
- **Hover Lift**: Cards lift slightly (`hover:-translate-y-1`) with a soft shadow elevation (`hover:shadow-lg`).
- **Directional Hints**: Action icons translate slightly (`group-hover:translate-x-1`) on card hover.

---

## 15. Dark Mode & Theming

- **Pure Dark Palette**: Standardized around `#090D16` canvas.
- **Contrast Ratios**:
  - Primary text (`#dae2fd`) on canvas (`#090D16`): Contrast ratio > 12:1 (exceeds WCAG AAA standard).
  - Secondary text (`#bec8d2`) on container (`#171f33`): Contrast ratio > 7:1.

---

## 16. Accessibility & Keyboard Navigation

- **Command Palette**: Triggered anywhere via `⌘K` or `Ctrl+K`.
- **Escape Key (`ESC`)**: Closes modals, dismisses command palette, and clears search input.
- **Focus Rings**: Clear high-contrast focus rings (`focus:ring-2 focus:ring-primary-container`).
- **Touch Ergonomics**: All interactive mobile buttons provide a minimum touch target of 44x44px.

---

## 17. Performance & Assets

- **Code Splitting**: All 12 miniapp tools are dynamically loaded via `React.lazy()`:
  ```javascript
  const ImageConvertTool = lazy(() => import('./tools/image-convert/ImageConvertTool'));
  ```
- **Isolated Development Sandboxes**: Experimental/paused tools are kept in `hub/src/tools-in-development/` and excluded from production bundles.
- **Web Workers**: Heavy parsing (PDF.js worker, ONNX runtime SIMD) runs in dedicated Web Worker threads, preventing UI lockup.

---

## 18. Information Architecture & Routes

The application uses hash-based client routing compatible with static hosting (Cloudflare Pages):

| Route Hash | Target Tool | Processing Type |
| :--- | :--- | :--- |
| `#/` or empty | Tool Discovery Hub | Hub Portal |
| `#/tools/id-photo-studio` | Tạo Ảnh Thẻ & Hộ Chiếu | Client-Side (AI Segmenter) |
| `#/tools/image-convert` | WebP Master & Nén Ảnh | Client-Side (Wasm/Canvas) |
| `#/tools/screen-capture` | Chụp Màn Hình 1-Chạm | Client-Side (Screen API) |
| `#/tools/barcode-qr` | QR Art & Barcode Studio | Client-Side (SVG/Canvas) |
| `#/tools/pdf-toolkit` | PDF Multi-Tool (Split/Merge/Compress)| Client-Side (pdf-lib) |
| `#/tools/omniconvert` | Chuyển Đổi OmniConvert | Client-Side (Docx/Xlsx/PDF) |
| `#/tools/excel-mapping` | Tự Động Hóa Mapping Excel | Client-Side (SheetJS) |
| `#/tools/editor-studio` | Soạn Thảo Template Nâng Cao | Client-Side (Docx Engine) |
| `#/tools/invoice-studio` | Xử Lý Hóa Đơn & Đề Nghị TT | Client-Side (XML/PDF Parser) |
| `#/tools/auto-bi` | Phân Tích Dữ Liệu Auto-BI | Client-Side (Analytics) |
| `#/tools/accounting-reconcile`| Đối Chiếu Kế Toán Doanh Thu | Client-Side (Excel Cross-check)|
| `#/tools/watermark-studio`| Đóng Dấu Bản Quyền Watermark | Client-Side (pdf-lib/Canvas) |

*Legacy redirects are automatically mapped (e.g. `#/tools/pdf-split` → `#/tools/pdf-toolkit?tab=split`).*

---

## 19. Edge Cases & Error Handling

1. **Tool Crashes**: Handled by `ToolErrorBoundary` with an isolated failure screen, preventing the entire portal from crashing.
2. **Memory Leaks**: All canvas blobs, object URLs, and worker streams call `URL.revokeObjectURL()` upon unmounting.
3. **Corrupt Files**: Detected immediately with user-facing diagnostic banners (`MiniAppError`).

---

## 20. Cross-Browser & Device Matrix

| Browser / Environment | Engine | Support Level | Notes |
| :--- | :--- | :--- | :--- |
| Google Chrome (Desktop/Mobile) | Blink | Tier 1 (100%) | Full SIMD WebAssembly & Clipboard API support |
| Apple Safari (macOS/iOS) | WebKit | Tier 1 (100%) | iOS Safari dvh viewport and touch fixes verified |
| Mozilla Firefox | Gecko | Tier 1 (100%) | Full compatibility with canvas workers |
| Microsoft Edge | Blink | Tier 1 (100%) | Enterprise Windows compliant |

---

## 21. Internationalization (i18n)

The portal supports three operating languages:
- **Tiếng Việt (`vi`)**: Default locale for all accounting, VAT invoices, and local standard formats.
- **English (`en`)**: International developer and office productivity mode.
- **Japanese (`ja`)**: Specialized formatting for corporate documents and photo size requirements (e.g., My Number cards, Rirekisho).

---

## 22. Technical Architecture & Constraints

- **Framework**: React 19 + Vite 7 + Tailwind CSS 3.
- **Build Target**: Static distribution deployed to Cloudflare Pages.
- **Testing Verification**: 100% test pass rate across 154 unit tests (`packages/core/tests` and `hub/tests`).
- **Zero Lint Errors**: Strict ESLint configuration across all 11 monorepo workspaces.

---

## 23. Anti-Patterns & Strict Prohibitions

1. **PROHIBITED: Emojis as System Icons**
   - *Violation*: `<button>🚀 Bắt đầu</button>`
   - *Standard*: `<button><Rocket size={16} /> Bắt đầu</button>`
2. **PROHIBITED: Inconsistent Outer Layout Wrappers**
   - *Violation*: Full-width uncontained sections stretching to 2560px on wide monitors.
   - *Standard*: All standard tool views must be contained within `max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8`.
3. **PROHIBITED: Silent Server Uploads**
   - *Violation*: Uploading documents to cloud APIs without an explicit modal or badge declaration.
   - *Standard*: 100% client-side execution by default; cloud actions must be explicitly classified.
4. **PROHIBITED: Distracting Visual Decoration**
   - *Violation*: Intense neon glows, large spinning animations, and obstructive banners.
   - *Standard*: Subtle 1px borders, gentle 200ms transitions, and subdued background scrims.
5. **PROHIBITED: Duplicate Discovery Controls**
   - *Violation*: Adding in-page search bars, duplicate category dropdowns, or "Quick Access" sections when Header search and Category Subnav already exist.
   - *Standard*: Rely strictly on the unified Header Search (`⌘K` / `/`) and the Category Subnav.
6. **PROHIBITED: Non-Functional Assurance & Marketing Cards Pushing Tools Below the Fold**
   - *Violation*: Adding 3-column SEO/Assurance footer cards, large 3-line privacy callouts, or hero banners inside tool workspaces.
   - *Standard*: Tool workspace must start immediately above the fold with a 1-line subtle privacy note.
7. **PROHIBITED: Exposing Engine Internals & Diagnostics**
   - *Violation*: Displaying `PIPELINE ID: ...`, `Wasm Engine`, `Native JS`, or metrics ribbons (`10/12 Offline`, `0 KB Server`).
   - *Standard*: Users care about task completion; hide internal telemetry and pipeline architecture.
8. **PROHIBITED: Lingering Light-Mode Tokens in Execution States**
   - *Violation*: Using `bg-white`, `border-slate-200`, `text-slate-900`, `bg-blue-50`, or bright unstyled buttons in inner execution components, step wizards, or modals.
   - *Standard*: Every single inner screen, dropzone, slider, table, modal, and badge MUST use the shared dark utility design tokens (`bg-surface-container`, `border-border-subtle`, `text-on-surface`, `bg-surface-subtle`, `text-on-surface-variant`).
