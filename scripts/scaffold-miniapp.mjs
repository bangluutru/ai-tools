#!/usr/bin/env node
/**
 * =========================================================================
 * MINIAPP SCAFFOLDING & PORTING ENGINE (MAIS Standard)
 * =========================================================================
 * Tạo mới miniapp trong Hub (In-Hub Creation) hoặc Phân tích khoảng cách &
 * tạo Adapter chuyển đổi cho Codebase bên ngoài (External Codebase Porting).
 *
 * Cách sử dụng:
 * 1. Chế độ tương tác (Interactive Prompt):
 *    npm run create:miniapp
 *
 * 2. Chế độ dòng lệnh trực tiếp (CLI Arguments):
 *    node scripts/scaffold-miniapp.mjs --mode=native --id=audio-cutter --name="Cắt Âm Thanh" --cat=utils
 *
 * 3. Chế độ phân tích & tích hợp codebase bên ngoài:
 *    node scripts/scaffold-miniapp.mjs --mode=external --source=./path/to/app --id=external-tool --cat=image
 * =========================================================================
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const hubDir = path.join(rootDir, 'hub');
const coreDir = path.join(rootDir, 'packages/core');

// Terminal Colors
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  magenta: '\x1b[35m',
};

// Helper to convert kebab-case to PascalCase
function toPascalCase(str) {
  let clean = str;
  if (clean.endsWith('-tool')) {
    clean = clean.slice(0, -5);
  }
  return clean
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

// Readline prompt helper
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    })
  );
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    mode: null,
    id: null,
    name: null,
    cat: null,
    desc: null,
    source: null,
    help: args.includes('--help') || args.includes('-h'),
  };

  for (const arg of args) {
    if (arg.startsWith('--mode=')) options.mode = arg.split('=')[1];
    else if (arg.startsWith('--id=')) options.id = arg.split('=')[1];
    else if (arg.startsWith('--name=')) options.name = arg.split('=')[1];
    else if (arg.startsWith('--cat=')) options.cat = arg.split('=')[1];
    else if (arg.startsWith('--desc=')) options.desc = arg.split('=')[1];
    else if (arg.startsWith('--source=')) options.source = arg.split('=')[1];
  }

  return options;
}

// -------------------------------------------------------------------------
// TEMPLATE GENERATORS (MAIS COMPLIANT BOILERPLATE)
// -------------------------------------------------------------------------

function generateHubWrapper(toolId, toolName, pascalName) {
  return `import React from 'react';
import { Sparkles, ShieldCheck, ArrowLeft } from 'lucide-react';
import ToolErrorBoundary from '../../components/ToolErrorBoundary';
import ${pascalName}View from '@ai-tools/core/components/${pascalName}View';

export default function ${pascalName}Tool({ displayLang = 'vi', onBackToHub }) {
  return (
    <ToolErrorBoundary toolId="${toolId}" onBackToHub={onBackToHub}>
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
          <span className="text-on-surface font-semibold">${toolName}</span>
        </nav>

        {/* TIER 1: CONTEXT HEADER */}
        <header className="flex flex-col gap-2 pb-6 border-b border-border-subtle/50 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-container/15 text-primary border border-primary/20 flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles size={20} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-on-surface">
                ${toolName}
              </h1>
              <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
                Xử lý dữ liệu trực tiếp trên trình duyệt, an toàn và tối ưu hiệu suất.
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
        <${pascalName}View displayLang={displayLang} />
      </div>
    </ToolErrorBoundary>
  );
}
`;
}

function generateCoreView(toolId, _toolName) {
  return `import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, CheckCircle2, Play, RotateCcw, Download, Loader2, Sliders, FileText } from 'lucide-react';

const i18n = {
  vi: {
    dropTitle: 'Kéo thả tệp vào đây, hoặc',
    dropBrowse: 'chọn từ thiết bị',
    dropHint: 'Hỗ trợ định dạng tài liệu, hình ảnh hoặc dữ liệu (Tối đa 25MB)',
    paramTitle: 'Tham Số Xử Lý',
    btnExecute: 'Bắt Đầu Xử Lý',
    btnProcessing: 'Đang xử lý...',
    btnReset: 'Đặt Lại',
    btnDownload: 'Tải Kết Quả',
    resultTitle: 'Kết Quả Thực Thi',
    successMsg: 'Xử lý hoàn tất thành công!',
  },
  en: {
    dropTitle: 'Drag and drop files here, or',
    dropBrowse: 'browse from device',
    dropHint: 'Supports documents, images or data files (Up to 25MB)',
    paramTitle: 'Processing Parameters',
    btnExecute: 'Start Processing',
    btnProcessing: 'Processing...',
    btnReset: 'Reset',
    btnDownload: 'Download Result',
    resultTitle: 'Execution Results',
    successMsg: 'Processing completed successfully!',
  },
  ja: {
    dropTitle: 'ここにファイルをドロップ、または',
    dropBrowse: '端末から選択',
    dropHint: 'ドキュメント、画像、データファイルをサポート（最大25MB）',
    paramTitle: '処理パラメータ',
    btnExecute: '処理を開始',
    btnProcessing: '処理中...',
    btnReset: 'リセット',
    btnDownload: '結果をダウンロード',
    resultTitle: '実行結果',
    successMsg: '処理が正常に完了しました！',
  },
};

export default function ${toPascalCase(toolId)}View({ displayLang = 'vi' }) {
  const t = i18n[displayLang] || i18n.vi;
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasResult, setHasResult] = useState(false);
  const [quality, setQuality] = useState(85);
  const fileInputRef = useRef(null);

  // Storage namespace pattern: ai_tools_<id>_*
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ai_tools_${toolId}_quality');
      if (saved) setQuality(Number(saved));
    } catch {
      /* noop */
    }
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragOver(true);
    else if (e.type === 'dragleave') setIsDragOver(false);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer?.files?.[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setHasResult(false);
    }
  };

  const handleInputChange = (e) => {
    if (e.target?.files?.[0]) {
      setSelectedFile(e.target.files[0]);
      setHasResult(false);
    }
  };

  const handleExecute = () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setHasResult(true);
      try {
        localStorage.setItem('ai_tools_${toolId}_quality', String(quality));
      } catch {
        /* noop */
      }
    }, 1200);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setHasResult(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownload = () => {
    if (!selectedFile) return;
    const blob = new Blob(['Mock processed content for ' + selectedFile.name], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'processed_' + selectedFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* TIER 2: INPUT & PARAMETERS SETUP */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Dropzone Column */}
        <div className="lg:col-span-7">
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={\`relative rounded-2xl border-2 border-dashed p-8 transition-all duration-200 cursor-pointer text-center flex flex-col items-center justify-center min-h-[220px] select-none \${
              isDragOver
                ? 'border-primary-container bg-primary-container/10 scale-[0.99]'
                : 'border-border-subtle hover:border-primary/50 bg-surface-container/60 hover:bg-surface-container'
            }\`}
          >
            {/* Dual Contract hidden input for accessibility & automated testing */}
            <input
              ref={fileInputRef}
              type="file"
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
                  {t.dropTitle} <span className="text-primary hover:underline">{t.dropBrowse}</span>
                </p>
                <p className="text-xs text-on-surface-variant mt-1">
                  {t.dropHint}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Parameters Column */}
        <div className="lg:col-span-5">
          <div className="bg-surface-container border border-border-subtle rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle/50 pb-3">
              <div className="flex items-center gap-2 text-on-surface font-semibold text-sm">
                <Sliders size={16} className="text-primary" />
                <span>{t.paramTitle}</span>
              </div>
              <span className="text-[11px] font-mono text-outline">{quality}%</span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-on-surface-variant">
                <span>Chất lượng xử lý</span>
                <span className="font-mono text-primary font-bold">{quality}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full h-1.5 bg-surface-subtle rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            <div className="pt-2">
              <p className="text-xs text-outline font-mono">
                Mọi xử lý thực hiện cục bộ qua WebAssembly / Browser API.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ACTION BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border-subtle/50">
        <button
          type="button"
          onClick={handleReset}
          disabled={!selectedFile || isProcessing}
          className="h-11 sm:h-10 px-4 rounded-xl border border-border-subtle bg-surface-subtle hover:bg-surface-container text-on-surface-variant hover:text-on-surface text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-40"
        >
          <RotateCcw size={14} />
          <span>{t.btnReset}</span>
        </button>

        <div className="flex items-center gap-3">
          {hasResult && (
            <button
              type="button"
              onClick={handleDownload}
              className="h-11 sm:h-10 px-5 rounded-xl bg-secondary text-surface-canvas hover:brightness-110 text-xs font-bold transition-all shadow flex items-center gap-2 cursor-pointer"
            >
              <Download size={15} />
              <span>{t.btnDownload}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExecute}
            disabled={!selectedFile || isProcessing}
            className="h-11 sm:h-10 px-6 rounded-xl bg-primary-container text-on-primary-container hover:brightness-105 active:scale-[0.98] text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
          >
            {isProcessing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{t.btnProcessing}</span>
              </>
            ) : (
              <>
                <Play size={15} fill="currentColor" />
                <span>{t.btnExecute}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* TIER 3: RESULT & EXPORT STAGE */}
      {hasResult && (
        <div className="bg-surface-container border border-border-subtle rounded-2xl p-5 shadow-sm space-y-3 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-border-subtle/40 pb-3">
            <span className="text-xs font-bold text-on-surface flex items-center gap-2">
              <CheckCircle2 size={16} className="text-secondary" />
              <span>{t.resultTitle}</span>
            </span>
            <span className="text-[11px] text-secondary font-mono bg-secondary/10 px-2 py-0.5 rounded">
              READY
            </span>
          </div>

          <div className="p-4 rounded-xl bg-surface-subtle/60 border border-border-subtle/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText size={20} className="text-primary" />
              <div>
                <p className="text-xs font-bold text-on-surface font-mono">{selectedFile?.name}</p>
                <p className="text-[11px] text-outline mt-0.5">{t.successMsg}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDownload}
              className="px-3.5 py-1.5 rounded-lg bg-surface-container border border-border-subtle hover:border-primary text-xs font-semibold text-primary transition-colors flex items-center gap-1.5"
            >
              <Download size={13} />
              <span>Tải về</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
`;
}

// -------------------------------------------------------------------------
// AUTO-WIRING ENGINE (REGISTRY & APP.JSX)
// -------------------------------------------------------------------------

function registerInToolsRegistry(toolId, toolName, category) {
  const registryPath = path.join(hubDir, 'src/config/toolsRegistry.js');
  let content = fs.readFileSync(registryPath, 'utf8');

  // Check if tool already exists
  if (content.includes(`id: '${toolId}'`)) {
    console.log(`  ${c.yellow}ℹ Tool ID "${toolId}" đã tồn tại trong toolsRegistry.js.${c.reset}`);
    return;
  }

  // 1. Add tool governance entry
  const govMarker = 'const toolGovernance = {';
  const govIdx = content.indexOf(govMarker);
  if (govIdx !== -1) {
    const insertGovPos = govIdx + govMarker.length;
    const govEntry = `\n  '${toolId}': {\n    readiness: 'beta',\n    processing: 'browser',\n    outputPurpose: 'utility'\n  },`;
    content = content.slice(0, insertGovPos) + govEntry + content.slice(insertGovPos);
  }

  // 2. Add tool definition
  const toolsArrayMarker = 'const toolDefinitions = [';
  const markerIdx = content.indexOf(toolsArrayMarker);
  if (markerIdx === -1) {
    throw new Error('Không tìm thấy "const toolDefinitions = [" trong toolsRegistry.js');
  }

  const insertPos = markerIdx + toolsArrayMarker.length;
  const newToolEntry = `
  {
    id: '${toolId}',
    name_vn: '${toolName}',
    name_en: '${toolName}',
    name_ja: '${toolName}',
    desc_vn: 'Công cụ ${toolName} xử lý dữ liệu trực tiếp trên trình duyệt.',
    desc_en: '${toolName} utility with in-browser privacy-first processing.',
    desc_ja: '${toolName} ブラウザ内で安全かつ高速にデータを処理するツール。',
    category: '${category}',
    icon: 'Sparkles',
    gradient: 'from-blue-600 to-cyan-500',
    color: '#0ea5e9',
    tags: ['${toolId}']
  },`;

  content = content.slice(0, insertPos) + newToolEntry + content.slice(insertPos);
  fs.writeFileSync(registryPath, content, 'utf8');
  console.log(`  ${c.green}✔${c.reset} Đã tự động đăng ký metadata vào toolsRegistry.js`);
}

function registerInAppJsx(toolId, pascalName) {
  const appPath = path.join(hubDir, 'src/App.jsx');
  let content = fs.readFileSync(appPath, 'utf8');

  if (content.includes(`${pascalName}Tool`)) {
    console.log(`  ${c.yellow}ℹ Component ${pascalName}Tool đã được nối dây trong App.jsx.${c.reset}`);
    return;
  }

  // 1. Add lazy import
  const lazyImportMarker = 'const toolComponentMap = {';
  const lazyImportPos = content.indexOf(lazyImportMarker);
  if (lazyImportPos === -1) {
    throw new Error('Không tìm thấy "toolComponentMap" trong hub/src/App.jsx');
  }

  const importLine = `const ${pascalName}Tool = lazy(() => import('./tools/${toolId}/${pascalName}Tool'));\n`;
  content = content.slice(0, lazyImportPos) + importLine + content.slice(lazyImportPos);

  // 2. Add to toolComponentMap
  const mapMarker = 'const toolComponentMap = {';
  const mapPos = content.indexOf(mapMarker) + mapMarker.length;
  const mapEntry = `\n  '${toolId}': ${pascalName}Tool,`;
  content = content.slice(0, mapPos) + mapEntry + content.slice(mapPos);

  fs.writeFileSync(appPath, content, 'utf8');
  console.log(`  ${c.green}✔${c.reset} Đã tự động nối dây dynamic route trong hub/src/App.jsx`);
}

// -------------------------------------------------------------------------
// EXTERNAL CODEBASE GAP SCANNER
// -------------------------------------------------------------------------

function scanExternalCodebase(sourceDir) {
  const findings = {
    totalFiles: 0,
    bgWhite: [],
    textBlack: [],
    rawEmojis: [],
    reactRouter: [],
    serverApis: [],
    unnamespacedStorage: [],
    globalCss: [],
  };

  function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      if (['node_modules', 'dist', 'build', '.git'].includes(ent.name)) continue;
      const fullPath = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        scanDir(fullPath);
      } else if (/\.(jsx?|tsx?|html|css)$/.test(ent.name)) {
        findings.totalFiles++;
        const content = fs.readFileSync(fullPath, 'utf8');
        const rel = path.relative(sourceDir, fullPath);
        const lines = content.split('\n');

        lines.forEach((line, idx) => {
          const lineNum = idx + 1;
          if (/\bbg-white\b/.test(line)) findings.bgWhite.push({ file: rel, lineNum, line: line.trim() });
          if (/\btext-(black|slate-900)\b/.test(line)) findings.textBlack.push({ file: rel, lineNum, line: line.trim() });
          if (/<button[^>]*>.*[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}].*<\/button>/u.test(line)) {
            findings.rawEmojis.push({ file: rel, lineNum, line: line.trim() });
          }
          if (/from ['"]react-router-dom['"]|useNavigate|BrowserRouter/.test(line)) {
            findings.reactRouter.push({ file: rel, lineNum, line: line.trim() });
          }
          if (/axios\.(get|post)|fetch\(['"]https?:\/\//.test(line)) {
            findings.serverApis.push({ file: rel, lineNum, line: line.trim() });
          }
          if (/localStorage\.(getItem|setItem)\(['"][a-zA-Z0-9_-]+['"]\)/.test(line) && !line.includes('ai_tools_')) {
            findings.unnamespacedStorage.push({ file: rel, lineNum, line: line.trim() });
          }
          if (ent.name.endsWith('.css') && /(^|\s)(body|html|\*)\s*\{/.test(line)) {
            findings.globalCss.push({ file: rel, lineNum, line: line.trim() });
          }
        });
      }
    }
  }

  scanDir(sourceDir);
  return findings;
}

// -------------------------------------------------------------------------
// MAIN EXECUTION LOGIC
// -------------------------------------------------------------------------

async function run() {
  console.log(`\n${c.bold}${c.cyan}================================================================${c.reset}`);
  console.log(`${c.bold}${c.cyan}  🚀 AI-TOOLS MINIAPP SCAFFOLDING & PORTING ENGINE (MAIS)       ${c.reset}`);
  console.log(`${c.gray}  Hệ thống tạo mới và tích hợp codebase chuẩn hóa kiến trúc Hub ${c.reset}`);
  console.log(`${c.bold}${c.cyan}================================================================${c.reset}\n`);

  const opts = parseArgs();

  let mode = opts.mode;
  if (!mode) {
    if (opts.source) {
      mode = 'external';
    } else {
      console.log(`${c.bold}Lựa chọn chế độ khởi tạo:${c.reset}`);
      console.log(`  ${c.green}1. In-Hub Creation${c.reset}: Tạo mới miniapp trực tiếp từ đầu trong Hub`);
      console.log(`  ${c.yellow}2. External Porting${c.reset}: Tích hợp & phân tích codebase bên ngoài vào Hub\n`);
      const choice = await askQuestion('Nhập lựa chọn (1 hoặc 2) [Mặc định: 1]: ');
      mode = choice.trim() === '2' ? 'external' : 'native';
    }
  }

  // -----------------------------------------------------------------------
  // MODE 1: NATIVE IN-HUB CREATION
  // -----------------------------------------------------------------------
  if (mode === 'native') {
    console.log(`\n${c.bold}${c.green}▶ Chế độ: Khởi Tạo Mới Miniapp Trong Hub (In-Hub Creation)${c.reset}`);

    let toolId = opts.id;
    while (!toolId) {
      toolId = await askQuestion('Nhập Tool ID (slug, ví dụ: audio-cutter): ');
      toolId = toolId.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    }

    let toolName = opts.name;
    while (!toolName) {
      toolName = await askQuestion('Nhập Tên Hiển Thị (ví dụ: Cắt Ghép Âm Thanh): ');
    }

    let category = opts.cat;
    const validCats = ['pdf', 'image', 'office', 'utils', 'ai'];
    while (!category || !validCats.includes(category)) {
      console.log(`Danh mục hợp lệ: ${validCats.join(', ')}`);
      category = await askQuestion('Chọn danh mục [Mặc định: utils]: ');
      if (!category) category = 'utils';
    }

    const pascalName = toPascalCase(toolId);
    console.log(`\n${c.cyan}Đang khởi tạo miniapp [${toolId}] (${pascalName})...${c.reset}`);

    // 1. Create Hub Wrapper
    const hubToolDir = path.join(hubDir, 'src/tools', toolId);
    fs.mkdirSync(hubToolDir, { recursive: true });
    const hubWrapperPath = path.join(hubToolDir, `${pascalName}Tool.jsx`);
    fs.writeFileSync(hubWrapperPath, generateHubWrapper(toolId, toolName, pascalName), 'utf8');
    console.log(`  ${c.green}✔${c.reset} Đã tạo Wrapper: hub/src/tools/${toolId}/${pascalName}Tool.jsx`);

    // 2. Create Core View
    const coreViewPath = path.join(coreDir, 'src/components', `${pascalName}View.jsx`);
    fs.writeFileSync(coreViewPath, generateCoreView(toolId, toolName), 'utf8');
    console.log(`  ${c.green}✔${c.reset} Đã tạo Core View: packages/core/src/components/${pascalName}View.jsx`);

    // 3. Auto-wire in Registry & App.jsx
    registerInToolsRegistry(toolId, toolName, category);
    registerInAppJsx(toolId, pascalName);

    console.log(`\n${c.bold}${c.green}🎉 KHỞI TẠO MINIAPP THÀNH CÔNG!${c.reset}`);
    console.log(`\n${c.bold}Các bước tiếp theo:${c.reset}`);
    console.log(`  1. Mở code tại: ${c.cyan}packages/core/src/components/${pascalName}View.jsx${c.reset} để phát triển logic`);
    console.log(`  2. Chạy rà soát tĩnh: ${c.cyan}node scripts/audit-miniapp.mjs ${toolId}${c.reset}`);
    console.log(`  3. Kiểm thử trên trình duyệt: ${c.cyan}npm run test:browser:tool -- ${toolId}${c.reset}`);
    return;
  }

  // -----------------------------------------------------------------------
  // MODE 2: EXTERNAL CODEBASE PORTING
  // -----------------------------------------------------------------------
  if (mode === 'external') {
    console.log(`\n${c.bold}${c.yellow}▶ Chế độ: Tích Hợp Codebase Bên Ngoài (External Codebase Porting)${c.reset}`);

    let sourcePath = opts.source;
    while (!sourcePath) {
      sourcePath = await askQuestion('Nhập đường dẫn thư mục codebase bên ngoài: ');
    }

    const absSource = path.resolve(process.cwd(), sourcePath);
    if (!fs.existsSync(absSource)) {
      console.error(`${c.red}✖ Không tìm thấy thư mục nguồn tại: ${absSource}${c.reset}`);
      process.exit(1);
    }

    let toolId = opts.id;
    while (!toolId) {
      toolId = await askQuestion('Nhập Tool ID mới trong Hub (ví dụ: my-ported-tool): ');
      toolId = toolId.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    }

    let toolName = opts.name;
    while (!toolName) {
      toolName = await askQuestion('Nhập Tên Hiển Thị trong Hub: ');
    }

    let category = opts.cat || 'utils';

    console.log(`\n${c.cyan}Đang quét phân tích khoảng cách tích hợp (Porting Gap Analysis)...${c.reset}`);
    const findings = scanExternalCodebase(absSource);

    console.log(`\n${c.bold}=== 📋 BÁO CÁO PHÂN TÍCH KHOẢNG CÁCH TÍCH HỢP (PORTING GAP REPORT) ===${c.reset}`);
    console.log(`  Đã quét tổng cộng: ${c.bold}${findings.totalFiles}${c.reset} tệp nguồn.\n`);

    const hasIssues =
      findings.bgWhite.length > 0 ||
      findings.textBlack.length > 0 ||
      findings.rawEmojis.length > 0 ||
      findings.reactRouter.length > 0 ||
      findings.serverApis.length > 0 ||
      findings.unnamespacedStorage.length > 0 ||
      findings.globalCss.length > 0;

    if (!hasIssues) {
      console.log(`  ${c.green}✔ Tuyệt vời! Codebase không có xung đột nghiêm trọng nào với chuẩn MAIS.${c.reset}`);
    } else {
      if (findings.bgWhite.length > 0) {
        console.log(`  ${c.red}✖ Class tĩnh "bg-white"${c.reset} (${findings.bgWhite.length} vị trí):`);
        findings.bgWhite.slice(0, 3).forEach((f) => console.log(`    - ${f.file}:${f.lineNum} -> Thay bằng "bg-surface-container"`));
        if (findings.bgWhite.length > 3) console.log(`    ... và ${findings.bgWhite.length - 3} vị trí khác.`);
      }

      if (findings.textBlack.length > 0) {
        console.log(`  ${c.red}✖ Class tĩnh "text-black / text-slate-900"${c.reset} (${findings.textBlack.length} vị trí):`);
        findings.textBlack.slice(0, 3).forEach((f) => console.log(`    - ${f.file}:${f.lineNum} -> Thay bằng "text-on-surface"`));
      }

      if (findings.rawEmojis.length > 0) {
        console.log(`  ${c.yellow}⚠ Raw emoji trong Button${c.reset} (${findings.rawEmojis.length} vị trí):`);
        findings.rawEmojis.slice(0, 3).forEach((f) => console.log(`    - ${f.file}:${f.lineNum} -> Thay bằng icon từ "lucide-react"`));
      }

      if (findings.reactRouter.length > 0) {
        console.log(`  ${c.red}✖ Router xung đột (react-router-dom)${c.reset} (${findings.reactRouter.length} vị trí):`);
        findings.reactRouter.slice(0, 3).forEach((f) => console.log(`    - ${f.file}:${f.lineNum} -> Chuyển thành Tab/Step Wizard nội bộ`));
      }

      if (findings.serverApis.length > 0) {
        console.log(`  ${c.yellow}⚠ Lệnh gọi API máy chủ${c.reset} (${findings.serverApis.length} vị trí):`);
        findings.serverApis.slice(0, 3).forEach((f) => console.log(`    - ${f.file}:${f.lineNum} -> Cần chuyển sang Client-side offline hoặc Cloudflare proxy`));
      }

      if (findings.unnamespacedStorage.length > 0) {
        console.log(`  ${c.yellow}⚠ LocalStorage chưa có namespace${c.reset} (${findings.unnamespacedStorage.length} vị trí):`);
        findings.unnamespacedStorage.slice(0, 3).forEach((f) => console.log(`    - ${f.file}:${f.lineNum} -> Đổi key thành "ai_tools_${toolId}_*"`));
      }

      if (findings.globalCss.length > 0) {
        console.log(`  ${c.red}✖ CSS Leak toàn cục${c.reset} (${findings.globalCss.length} vị trí):`);
        findings.globalCss.forEach((f) => console.log(`    - ${f.file}:${f.lineNum} -> Xóa reset body/html/*`));
      }
    }

    console.log(`\n${c.cyan}Đang tạo Hub Adapter Wrapper chuẩn hóa cho miniapp [${toolId}]...${c.reset}`);
    const pascalName = toPascalCase(toolId);

    // 1. Create Hub Wrapper with Error Boundary
    const hubToolDir = path.join(hubDir, 'src/tools', toolId);
    fs.mkdirSync(hubToolDir, { recursive: true });
    const hubWrapperPath = path.join(hubToolDir, `${pascalName}Tool.jsx`);
    fs.writeFileSync(hubWrapperPath, generateHubWrapper(toolId, toolName, pascalName), 'utf8');

    // 2. Create Core View Adapter stub
    const coreViewPath = path.join(coreDir, 'src/components', `${pascalName}View.jsx`);
    if (!fs.existsSync(coreViewPath)) {
      fs.writeFileSync(coreViewPath, generateCoreView(toolId, toolName), 'utf8');
    }

    // 3. Auto-wire in Registry & App.jsx
    registerInToolsRegistry(toolId, toolName, category);
    registerInAppJsx(toolId, pascalName);

    console.log(`\n${c.bold}${c.green}🎉 ĐÃ THIẾT LẬP KHUNG KẾT NỐI (ADAPTER) THÀNH CÔNG!${c.reset}`);
    console.log(`\n${c.bold}Các bước hoàn tất tích hợp:${c.reset}`);
    console.log(`  1. Đọc cẩm nang đối chiếu quy tắc tại: ${c.cyan}docs/MINIAPP_DEV_GUIDE.md${c.reset}`);
    console.log(`  2. Di chuyển logic nghiệp vụ từ codebase ngoài vào: ${c.cyan}packages/core/src/components/${pascalName}View.jsx${c.reset}`);
    console.log(`  3. Áp dụng bảng tra cứu ${c.cyan}docs/DESIGN_SYSTEM_REFERENCE.md${c.reset} để thay thế các class màu/icon`);
    console.log(`  4. Chạy kiểm tra: ${c.cyan}node scripts/audit-miniapp.mjs ${toolId}${c.reset}`);
  }
}

run().catch((err) => {
  console.error(`\n${c.red}✖ Lỗi:${c.reset}`, err.message);
  process.exit(1);
});
