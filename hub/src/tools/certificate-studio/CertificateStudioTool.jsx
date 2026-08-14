import React, { useState, useEffect } from 'react';
import {
  FileText, ClipboardPaste, HardDrive, CheckCircle2,
  Trash2, Plus, Sparkles, BookOpen, Layers,
  ChevronDown, ChevronUp, SlidersHorizontal, Settings2,
  FileSpreadsheet
} from 'lucide-react';
import CertificatePage from '@ai-tools/core/components/CertificatePage.jsx';
import DocToolbar from '@ai-tools/core/components/DocToolbar.jsx';
import PageNavigator from '@ai-tools/core/components/PageNavigator.jsx';
import PageCard from '@ai-tools/core/components/PageCard.jsx';
import GoogleFontPicker from '@ai-tools/core/components/GoogleFontPicker.jsx';
import UndoToast from '@ai-tools/core/components/UndoToast.jsx';
import PromptHelper from '@ai-tools/core/components/PromptHelper.jsx';
import { CERT_PROMPT_TEXT, CERT_NOTEBOOKLM_PROMPT } from '@ai-tools/core/utils/prompts.js';
import { uiTranslations } from '@ai-tools/core/utils/translations.js';
import { getLangVal } from '@ai-tools/core/utils/lang.js';

export default function CertificateStudioTool({ displayLang }) {
  const [data, setData] = useState([]);
  const [jsonText, setJsonText] = useState('');
  const [parseError, setParseError] = useState(null);
  const [saveStatus, setSaveStatus] = useState('saved');
  const [promptSource, setPromptSource] = useState('gemini');
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [customFont, setCustomFont] = useState('Inter');
  const [undoItem, setUndoItem] = useState(null);

  const langKey = displayLang === 'vi' ? 'vn' : displayLang;
  const t = uiTranslations[langKey] || uiTranslations.vn;

  // Load initial mock or cached data
  useEffect(() => {
    const cached = localStorage.getItem('docstudio_cert_data');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setData(parsed);
        setJsonText(JSON.stringify(parsed, null, 2));
      } catch (e) {}
    } else {
      const defaultData = [
        {
          title_vn: 'PHIẾU KẾT QUẢ KIỂM NGHIỆM',
          title_en: 'CERTIFICATE OF ANALYSIS',
          page_number: '1/1',
          meta: [
            { key_vn: 'Tên mẫu:', key_en: 'Sample Name:', value_vn: 'Nước khoáng thiên nhiên' },
            { key_vn: 'Khách hàng:', key_en: 'Customer:', value_vn: 'Công ty Cổ phần Thực phẩm' },
            { key_vn: 'Ngày nhận mẫu:', key_en: 'Received Date:', value_vn: '14/08/2026' }
          ],
          table: {
            headers_vn: ['STT', 'Tên chỉ tiêu', 'Phương pháp thử', 'Kết quả'],
            headers_en: ['No.', 'Parameter', 'Test Method', 'Result'],
            rows_vn: [
              ['1', 'Độ pH (ở 25°C)', 'TCVN 6492:2011', '7.2'],
              ['2', 'Hàm lượng Magie (Mg)', 'SMEWW 3500-Mg B', '12.5 mg/L'],
              ['3', 'Hàm lượng Canxi (Ca)', 'SMEWW 3500-Ca B', '45.0 mg/L'],
              ['4', 'Tổng chất rắn hòa tan (TDS)', 'SMEWW 2540 C', '180 mg/L']
            ]
          },
          judgment_vn: 'ĐẠT TIÊU CHUẨN VỆ SINH AN TOÀN THỰC PHẨM',
          judgment_en: 'PASSED FOOD SAFETY STANDARDS'
        }
      ];
      setData(defaultData);
      setJsonText(JSON.stringify(defaultData, null, 2));
    }
  }, []);

  const handleJsonChange = (e) => {
    const text = e.target.value;
    setJsonText(text);
    try {
      if (!text.trim()) {
        setData([]);
        setParseError(null);
        return;
      }
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) {
        setParseError(t.errorNotArray);
        return;
      }
      setData(parsed);
      setParseError(null);
      localStorage.setItem('docstudio_cert_data', text);
      setSaveStatus('saved');
    } catch (err) {
      setParseError(err.message);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans text-slate-900">
      {/* LEFT PANEL */}
      <aside className="no-print w-full md:w-80 lg:w-96 bg-white border-r border-slate-200 h-screen sticky top-0 flex flex-col shadow-sm z-40">
        <div className="p-4 border-b border-slate-100 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shrink-0">
          <div className="flex items-center gap-2">
            <FileText size={20} />
            <h2 className="text-lg font-bold tracking-tight">Certificate Studio</h2>
          </div>
          <p className="text-xs text-indigo-200 mt-0.5">Soạn thảo & Xuất bản Bằng cấp / Chứng chỉ A4</p>
        </div>

        <div className="flex-grow overflow-y-auto p-4 space-y-4">
          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setPromptSource('gemini')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${promptSource === 'gemini' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              ✨ Gemini
            </button>
            <button
              onClick={() => setPromptSource('notebooklm')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${promptSource === 'notebooklm' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              📓 NotebookLM
            </button>
          </div>

          <PromptHelper
            title={promptSource === 'gemini' ? 'System Prompt cho Gemini' : 'System Prompt cho NotebookLM'}
            promptText={promptSource === 'gemini' ? CERT_PROMPT_TEXT : CERT_NOTEBOOKLM_PROMPT}
            description="Copy prompt này gửi cho AI kèm hình ảnh tài liệu để xuất JSON:"
          />

          <div>
            <label className="text-xs font-bold text-slate-600 flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1.5 uppercase tracking-wide">
                <ClipboardPaste size={13} /> {t.pasteLabel}
              </span>
            </label>
            <textarea
              value={jsonText}
              onChange={handleJsonChange}
              placeholder={t.placeholder}
              rows={12}
              className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none custom-scrollbar"
            />
            {parseError && (
              <p className="text-xs text-red-500 mt-1 font-medium bg-red-50 p-2 rounded-lg border border-red-200">
                {t.errorPrefix}{parseError}
              </p>
            )}
          </div>

          <GoogleFontPicker font={customFont} onFontChange={setCustomFont} />

          <button
            onClick={handlePrint}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 text-sm transition-all"
          >
            <FileText size={16} /> {t.printBtn} (A4)
          </button>
        </div>
      </aside>

      {/* RIGHT PREVIEW CANVAS */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto flex flex-col items-center">
        {data && data.length > 0 ? (
          <div className="space-y-8 print:space-y-0 w-full max-w-[210mm]">
            {data.map((page, idx) => (
              <div key={idx} className="bg-white shadow-2xl rounded-xl overflow-hidden print:shadow-none print:rounded-none">
                <CertificatePage
                  page={page}
                  pageIndex={idx}
                  totalPages={data.length}
                  displayLang={displayLang}
                  fontFamily={customFont}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="my-auto text-center text-slate-400 p-12 border-2 border-dashed border-slate-300 rounded-2xl">
            <FileText size={48} className="mx-auto mb-3 text-slate-300" />
            <p className="font-medium text-sm">{t.empty}</p>
          </div>
        )}
      </main>
    </div>
  );
}
