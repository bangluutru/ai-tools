import React, { useState } from 'react';
import { Sparkles, Search, Sun, Moon, Globe, Shield, Github } from 'lucide-react';

export default function Navbar({ theme, onToggleTheme, displayLang, onLangChange, onOpenSearch }) {
  const [langDropdown, setLangDropdown] = useState(false);

  return (
    <header className="no-print bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/80 sticky top-0 z-50 shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer select-none">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
            <Sparkles size={22} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                AI-Tools
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-black text-emerald-400 uppercase tracking-wider">
                HUB
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Miniapp Hub · minh bạch nơi xử lý dữ liệu</p>
          </div>
        </div>

        {/* Center Search Bar Trigger */}
        <button
          onClick={onOpenSearch}
          className="hidden md:flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-800/70 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60 text-xs font-medium w-72 lg:w-96 transition-all group shadow-inner"
        >
          <Search size={15} className="group-hover:text-emerald-400 transition-colors" />
          <span className="flex-1 text-left">Tìm nhanh công cụ (PDF, Ảnh, Excel...)...</span>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono text-slate-400">
            ⌘K
          </kbd>
        </button>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          {/* Mobile Search Button */}
          <button
            onClick={onOpenSearch}
            className="md:hidden p-2.5 rounded-xl bg-slate-800/70 text-slate-300 border border-slate-700/60 hover:text-white"
            aria-label="Search"
          >
            <Search size={18} />
          </button>

          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setLangDropdown(!langDropdown)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-bold transition-all"
            >
              <Globe size={15} className="text-emerald-400" />
              <span>{displayLang === 'vi' ? 'VI' : displayLang === 'en' ? 'EN' : 'JA'}</span>
            </button>

            {langDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setLangDropdown(false)} />
                <div className="absolute right-0 mt-2 w-36 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-1.5 overflow-hidden animate-in fade-in zoom-in-95">
                  <button
                    onClick={() => { onLangChange('vi'); setLangDropdown(false); }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${displayLang === 'vi' ? 'bg-emerald-600/20 text-emerald-400 font-bold' : 'text-slate-300 hover:bg-slate-800'}`}
                  >
                    Tiếng Việt
                  </button>
                  <button
                    onClick={() => { onLangChange('en'); setLangDropdown(false); }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${displayLang === 'en' ? 'bg-emerald-600/20 text-emerald-400 font-bold' : 'text-slate-300 hover:bg-slate-800'}`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => { onLangChange('ja'); setLangDropdown(false); }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${displayLang === 'ja' ? 'bg-emerald-600/20 text-emerald-400 font-bold' : 'text-slate-300 hover:bg-slate-800'}`}
                  >
                    日本語
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-700/60 transition-all"
            title={theme === 'dark' ? 'Chuyển sang Giao diện Sáng' : 'Chuyển sang Giao diện Tối'}
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </div>
    </header>
  );
}
