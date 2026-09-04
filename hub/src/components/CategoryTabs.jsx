import React, { useRef } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { categories } from '../config/toolsRegistry';

export default function CategoryTabs({
  activeCategory,
  onSelectCategory,
  displayLang = 'vi',
  visibleCategoryIds,
  searchQuery = '',
  onSearchChange,
  totalResults = 0,
  categoryCounts = {}
}) {
  const searchInputRef = useRef(null);

  const getCategoryLabel = (cat) => {
    if (displayLang === 'en') return cat.label_en;
    if (displayLang === 'ja') return cat.label_ja;
    return cat.label_vn;
  };

  const placeholderText = {
    vi: 'Tìm nhanh theo tác vụ: Nén WebP, Hóa đơn điện tử, Ghép PDF, Ảnh thẻ...',
    en: 'Quick search by task: Compress WebP, Electronic Invoices, Merge PDF, ID Photo...',
    ja: 'タスクで素早く検索：WebP圧縮、電子請求書、PDF結合、証明写真...'
  }[displayLang] || 'Tìm nhanh theo tác vụ...';

  const filterLabel = {
    vi: 'Bộ lọc tác vụ:',
    en: 'Task Filter:',
    ja: 'フィルター:'
  }[displayLang] || 'Bộ lọc:';

  const resultsSuffix = {
    vi: 'kết quả',
    en: 'results',
    ja: '件'
  }[displayLang] || 'kết quả';

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      if (onSearchChange) onSearchChange('');
      searchInputRef.current?.blur();
    }
  };

  return (
    <div className="w-full bg-surface-container-low p-4 lg:p-5 rounded-xl border border-border-subtle shadow-md space-y-4">
      {/* Search Input Row */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-outline">
            <Search size={18} />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholderText}
            className="w-full pl-10 pr-24 py-3 bg-surface-container text-on-surface rounded-lg font-body-md text-sm placeholder:text-outline focus:outline-none focus:bg-surface-container-high transition-all shadow-inner border border-border-subtle/30 focus:border-primary-container/60"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1.5">
            {searchQuery ? (
              <button
                type="button"
                onClick={() => onSearchChange && onSearchChange('')}
                className="p-1 text-outline hover:text-on-surface transition-colors rounded"
                title="Xóa tìm kiếm"
              >
                <X size={15} />
              </button>
            ) : (
              <kbd className="hidden sm:inline-block px-2 py-[2px] bg-surface-subtle font-mono text-[11px] text-outline rounded shadow-sm">
                ESC
              </kbd>
            )}
          </div>
        </div>

        {/* Filter label & Results count */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-1.5 font-label-sm text-xs text-outline">
            <SlidersHorizontal size={14} />
            <span>{filterLabel}</span>
          </div>
          <span className="px-2.5 py-1 bg-primary-container/20 text-primary font-mono text-xs font-semibold rounded">
            {totalResults} {resultsSuffix}
          </span>
        </div>
      </div>

      {/* Filter Tabs Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories
          .filter((cat) => cat.id !== 'in-development' && (!visibleCategoryIds || visibleCategoryIds.has(cat.id)))
          .map((cat) => {
            const isActive = activeCategory === cat.id;
            const count = categoryCounts[cat.id];

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`filter-tab flex items-center gap-2 px-4 py-2 rounded-lg font-label-sm text-xs whitespace-nowrap transition-colors duration-150 ${
                  isActive
                    ? 'active bg-primary-container text-on-primary-container font-semibold shadow-sm'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span>{getCategoryLabel(cat)}</span>
                {typeof count === 'number' && (
                  <span className={`px-1.5 py-[1px] rounded text-[10px] font-mono ${
                    isActive ? 'bg-on-primary-container/20 text-on-primary-container' : 'bg-surface-subtle text-outline'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
      </div>
    </div>
  );
}
