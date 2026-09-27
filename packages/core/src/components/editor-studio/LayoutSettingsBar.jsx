import React from 'react';
import { Type, AlignLeft, Maximize, PanelTop, PanelBottom, ChevronDown, Landmark } from 'lucide-react';
import {
    FONT_OPTIONS, SIZE_OPTIONS, SPACING_OPTIONS, MARGIN_OPTIONS, ND30_LAYOUT, isNd30Layout
} from '../../lib/editor-studio/layoutPresets';

const FONTS = FONT_OPTIONS;
const SIZES = SIZE_OPTIONS;
const SPACINGS = SPACING_OPTIONS;
const MARGINS = MARGIN_OPTIONS;

export default function LayoutSettingsBar({ config, onChange }) {
    const updateConfig = (key, value) => {
        onChange({ ...config, [key]: value });
    };

    const updateHeader = (key, value) => {
        onChange({ ...config, headerOptions: { ...config.headerOptions, [key]: value } });
    };

    const updateFooter = (key, value) => {
        onChange({ ...config, footerOptions: { ...config.footerOptions, [key]: value } });
    };

    const nd30Active = isNd30Layout(config);

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-4 shrink-0 flex flex-wrap items-center gap-1 p-2 text-sm z-10 sticky top-0">
            {/* --- ND30 preset --- */}
            <div className="flex items-center gap-2 px-3 border-r border-slate-200">
                <button
                    type="button"
                    onClick={() => onChange({ ...config, ...ND30_LAYOUT })}
                    aria-pressed={nd30Active}
                    title="Times New Roman 13pt, giãn dòng 1,3, lề trên/dưới 20 mm, trái 30 mm, phải 15 mm (Phụ lục I NĐ 30/2020/NĐ-CP). Chưa tự tạo khối quốc hiệu–tiêu ngữ, số/ký hiệu, nơi nhận — hãy tự kiểm tra thể thức."
                    className={`flex items-center gap-1.5 rounded-md py-1.5 px-2.5 text-xs font-semibold border transition-colors cursor-pointer ${nd30Active ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-indigo-300'}`}
                >
                    <Landmark size={14} /> {nd30Active ? 'Đang dùng: phông & lề NĐ30' : 'Áp dụng phông & lề NĐ30'}
                </button>
            </div>

            {/* --- Typography Section --- */}
            <div className="flex items-center gap-2 px-3 border-r border-slate-200">
                <Type size={16} className="text-slate-400" />

                <div className="relative group">
                    <select
                        value={config.fontFamily}
                        onChange={e => updateConfig('fontFamily', e.target.value)}
                        className="appearance-none bg-slate-50 border border-slate-200 hover:border-indigo-300 rounded-md py-1.5 pl-3 pr-8 text-xs font-medium text-slate-700 outline-none cursor-pointer transition-colors"
                    >
                        {FONTS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                </div>

                <div className="relative group">
                    <select
                        value={config.fontSize}
                        onChange={e => updateConfig('fontSize', e.target.value)}
                        className="appearance-none bg-slate-50 border border-slate-200 hover:border-indigo-300 rounded-md py-1.5 pl-3 pr-8 text-xs font-medium text-slate-700 outline-none cursor-pointer transition-colors"
                    >
                        {SIZES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                </div>
            </div>

            {/* --- Layout Section --- */}
            <div className="flex items-center gap-2 px-3 border-r border-slate-200">
                <div className="relative group flex items-center gap-1.5" title="Line Spacing">
                    <AlignLeft size={16} className="text-slate-400" />
                    <select
                        value={config.lineSpacing}
                        onChange={e => updateConfig('lineSpacing', e.target.value)}
                        className="appearance-none bg-slate-50 border border-slate-200 hover:border-indigo-300 rounded-md py-1.5 pl-3 pr-8 text-xs font-medium text-slate-700 outline-none cursor-pointer transition-colors"
                    >
                        {SPACINGS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                </div>

                <div className="relative group flex items-center gap-1.5" title="Page Margins">
                    <Maximize size={14} className="text-slate-400" />
                    <select
                        value={config.margins}
                        onChange={e => updateConfig('margins', e.target.value)}
                        className="appearance-none bg-slate-50 border border-slate-200 hover:border-indigo-300 rounded-md py-1.5 pl-3 pr-8 text-xs font-medium text-slate-700 outline-none cursor-pointer transition-colors"
                    >
                        {MARGINS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                </div>
            </div>

            {/* --- Headers & Footers Section --- */}
            <div className="flex items-center gap-3 px-3">
                <div className="flex items-center gap-2">
                    <PanelTop size={16} className={config.headerOptions.enabled ? 'text-indigo-600' : 'text-slate-400'} />
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-700">
                        <input
                            type="checkbox"
                            checked={config.headerOptions.enabled}
                            onChange={e => updateHeader('enabled', e.target.checked)}
                            className="accent-indigo-600 rounded cursor-pointer"
                        />
                        Header
                    </label>
                    {config.headerOptions.enabled && (
                        <input
                            type="text"
                            placeholder="Văn bản đầu trang..."
                            value={config.headerOptions.text}
                            onChange={e => updateHeader('text', e.target.value)}
                            className="w-32 bg-slate-50 border border-slate-200 rounded-md py-1 px-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <PanelBottom size={16} className={config.footerOptions.enabled ? 'text-indigo-600' : 'text-slate-400'} />
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-700">
                        <input
                            type="checkbox"
                            checked={config.footerOptions.enabled}
                            onChange={e => updateFooter('enabled', e.target.checked)}
                            className="accent-indigo-600 rounded cursor-pointer"
                        />
                        Footer
                    </label>
                    {config.footerOptions.enabled && (
                        <label className="flex items-center gap-1 cursor-pointer text-[10px] text-slate-500 bg-slate-50 py-1 px-2 rounded-md border border-slate-200">
                            <input
                                type="checkbox"
                                checked={config.footerOptions.pageNumbers}
                                onChange={e => updateFooter('pageNumbers', e.target.checked)}
                                className="accent-indigo-600 rounded cursor-pointer h-3 w-3"
                            />
                            Đánh số trang
                        </label>
                    )}
                </div>
            </div>
        </div>
    );
}
