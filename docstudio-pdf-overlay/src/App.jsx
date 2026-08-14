import React, { useState } from 'react';
import TemplateOverlayView from './components/TemplateOverlayView';
import { Printer, Globe } from 'lucide-react';

export default function App() {
  const [displayLang, setDisplayLang] = useState('vi');

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      <header className="no-print bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between shadow-md border-b border-slate-800 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-fuchsia-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-fuchsia-900/40">
            <Printer size={20} />
          </div>
          <div>
            <h1 className="font-bold text-base leading-snug tracking-tight">DocStudio PDF Overlay</h1>
            <p className="text-xs text-slate-400">Đè Dữ Liệu Lên Form / Canvas PDF Template</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
          <Globe size={14} className="text-slate-400 ml-2" />
          <button
            onClick={() => setDisplayLang('vi')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${displayLang === 'vi' ? 'bg-fuchsia-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Tiếng Việt
          </button>
          <button
            onClick={() => setDisplayLang('en')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${displayLang === 'en' ? 'bg-fuchsia-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            English
          </button>
          <button
            onClick={() => setDisplayLang('ja')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${displayLang === 'ja' ? 'bg-fuchsia-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            日本語
          </button>
        </div>
      </header>

      <main className="flex-1">
        <TemplateOverlayView displayLang={displayLang} />
      </main>
    </div>
  );
}
