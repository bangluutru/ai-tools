import React from 'react';
import { Sparkles, FileText, Image, FileSpreadsheet, Globe } from 'lucide-react';
import { categories } from '../config/toolsRegistry';

const iconMap = {
  Sparkles,
  FileText,
  Image,
  FileSpreadsheet,
  Globe
};

export default function CategoryTabs({ activeCategory, onSelectCategory, displayLang, visibleCategoryIds }) {
  const getCategoryLabel = (cat) => {
    if (displayLang === 'en') return cat.label_en;
    if (displayLang === 'ja') return cat.label_ja;
    return cat.label_vn;
  };

  return (
    <div className="flex items-center justify-center gap-2 overflow-x-auto py-4 px-2 custom-scrollbar">
      {categories.filter((cat) => cat.id === 'all' || visibleCategoryIds.has(cat.id)).map((cat) => {
        const Icon = iconMap[cat.icon] || Sparkles;
        const isActive = activeCategory === cat.id;

        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-200 border ${
              isActive
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/30 scale-105'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800'
            }`}
          >
            <Icon size={15} className={isActive ? 'text-white' : 'text-slate-400'} />
            <span>{getCategoryLabel(cat)}</span>
          </button>
        );
      })}
    </div>
  );
}
