import React, { useState } from 'react';
import LegalDocumentView from '@ai-tools/core/components/LegalDocumentView.jsx';
import { Scale, Globe } from 'lucide-react';

export default function App() {
  const [displayLang, setDisplayLang] = useState('vi');

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      <header className="no-print bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between shadow-md border-b border-slate-800 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-900/40">
            <Scale size={20} />
          </div>
          <div>
            <h1 className="font-bold text-base leading-snug tracking-tight">DocStudio Legal</h1>
            <p className="text-xs text-slate-400">Soạn Thảo & Dịch Văn Bản Pháp Lý 2 Cột Song Ngữ</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
          <Globe size={14} className="text-slate-400 ml-2" />
          <button
            onClick={() => setDisplayLang('vi')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${displayLang === 'vi' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Tiếng Việt
          </button>
          <button
            onClick={() => setDisplayLang('en')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${displayLang === 'en' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            English
          </button>
          <button
            onClick={() => setDisplayLang('ja')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${displayLang === 'ja' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            日本語
          </button>
        </div>
      </header>

      <main className="flex-1">
        <LegalDocumentView displayLang={displayLang} onLangChange={setDisplayLang} />
      </main>
    </div>
  );
}
