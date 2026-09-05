import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useTheme, THEMES } from '@ai-tools/core';

export default function ThemeToggle({ displayLang = 'vi', className = '' }) {
  const { themePreference, resolvedTheme, setTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef(null);

  const labels = {
    theme: {
      vi: 'Chế độ giao diện',
      en: 'Appearance theme',
      ja: '外観テーマ',
    },
    light: {
      vi: 'Giao diện Sáng',
      en: 'Light Mode',
      ja: 'ライトモード',
    },
    dark: {
      vi: 'Giao diện Tối',
      en: 'Dark Mode',
      ja: 'ダークモード',
    },
    system: {
      vi: 'Theo hệ thống',
      en: 'System Default',
      ja: 'システム連動',
    },
  };

  useEffect(() => {
    if (!dropdownOpen) return undefined;
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setDropdownOpen(false);
    };

    window.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownOpen]);

  const CurrentIcon =
    themePreference === THEMES.SYSTEM
      ? Monitor
      : resolvedTheme === THEMES.LIGHT
      ? Sun
      : Moon;

  const currentLabel =
    themePreference === THEMES.SYSTEM
      ? labels.system[displayLang] || 'Hệ thống'
      : resolvedTheme === THEMES.LIGHT
      ? labels.light[displayLang] || 'Sáng'
      : labels.dark[displayLang] || 'Tối';

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setDropdownOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface-subtle hover:bg-surface-container border border-border-subtle text-on-surface-variant hover:text-on-surface rounded-lg font-mono text-xs font-semibold transition-colors focus:outline-none focus:ring-1 focus:ring-primary-container"
        title={`${labels.theme[displayLang] || 'Chế độ giao diện'}: ${currentLabel}`}
        aria-label={labels.theme[displayLang] || 'Chế độ giao diện'}
        aria-haspopup="true"
        aria-expanded={dropdownOpen}
      >
        <CurrentIcon
          size={14}
          className={
            themePreference === THEMES.SYSTEM
              ? 'text-primary'
              : resolvedTheme === THEMES.LIGHT
              ? 'text-amber-500'
              : 'text-brand-cyan-bright'
          }
        />
        <span className="hidden md:inline capitalize text-[11px]">
          {themePreference === THEMES.SYSTEM
            ? (displayLang === 'vi' ? 'Hệ thống' : displayLang === 'en' ? 'Auto' : '自動')
            : resolvedTheme === THEMES.LIGHT
            ? (displayLang === 'vi' ? 'Sáng' : 'Light')
            : (displayLang === 'vi' ? 'Tối' : 'Dark')}
        </span>
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-44 bg-surface-container border border-border-subtle rounded-xl shadow-2xl z-50 p-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 text-[10px] font-bold text-outline uppercase tracking-wider border-b border-border-subtle/80">
            {labels.theme[displayLang] || 'Chế độ giao diện'}
          </div>

          <div className="space-y-0.5 pt-1">
            {/* Light Mode */}
            <button
              type="button"
              onClick={() => {
                setTheme(THEMES.LIGHT);
                setDropdownOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                themePreference === THEMES.LIGHT
                  ? 'bg-primary-container/20 text-primary font-bold'
                  : 'text-on-surface-variant hover:bg-surface-subtle hover:text-on-surface'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sun size={14} className="text-amber-500 shrink-0" />
                <span>{labels.light[displayLang] || 'Giao diện Sáng'}</span>
              </div>
              {themePreference === THEMES.LIGHT && (
                <Check size={14} className="text-primary shrink-0" />
              )}
            </button>

            {/* Dark Mode */}
            <button
              type="button"
              onClick={() => {
                setTheme(THEMES.DARK);
                setDropdownOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                themePreference === THEMES.DARK
                  ? 'bg-primary-container/20 text-primary font-bold'
                  : 'text-on-surface-variant hover:bg-surface-subtle hover:text-on-surface'
              }`}
            >
              <div className="flex items-center gap-2">
                <Moon size={14} className="text-brand-cyan-bright shrink-0" />
                <span>{labels.dark[displayLang] || 'Giao diện Tối'}</span>
              </div>
              {themePreference === THEMES.DARK && (
                <Check size={14} className="text-primary shrink-0" />
              )}
            </button>

            {/* System Mode */}
            <button
              type="button"
              onClick={() => {
                setTheme(THEMES.SYSTEM);
                setDropdownOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                themePreference === THEMES.SYSTEM
                  ? 'bg-primary-container/20 text-primary font-bold'
                  : 'text-on-surface-variant hover:bg-surface-subtle hover:text-on-surface'
              }`}
            >
              <div className="flex items-center gap-2">
                <Monitor size={14} className="text-primary shrink-0" />
                <span>{labels.system[displayLang] || 'Theo hệ thống'}</span>
              </div>
              {themePreference === THEMES.SYSTEM && (
                <Check size={14} className="text-primary shrink-0" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
