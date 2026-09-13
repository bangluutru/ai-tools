import React from 'react';
import { Search, MapPin, ShieldCheck, Trash2, Globe } from 'lucide-react';
import { JAPAN_PREFECTURES, getOfficeForPrefecture } from '../../consular/jurisdictions/japanPrefectures.js';
import { getConsularI18n } from '../../consular/i18n/consularI18n.js';

export default function ConsularHeader({
  selectedPrefectureId,
  onSelectPrefecture,
  searchQuery,
  onSearchChange,
  onClearDrafts,
  currentOffice,
  displayLang = 'vi',
}) {
  const t = getConsularI18n(displayLang);
  const activeOffice = currentOffice || getOfficeForPrefecture(selectedPrefectureId);

  // Format label cho từng tỉnh thành theo ngôn ngữ
  const formatPrefectureLabel = (p) => {
    if (displayLang === 'ja') {
      return `${p.code}. ${p.name_ja} (${p.name_en})`;
    }
    if (displayLang === 'en') {
      return `${p.code}. ${p.name_en} (${p.name_ja})`;
    }
    return `${p.code}. ${p.name_vi} (${p.name_ja}) - ${p.name_en}`;
  };

  const officeName = activeOffice?.name?.[displayLang] || activeOffice?.name?.vi || activeOffice?.name;

  return (
    <header className="bg-surface-container-low/70 backdrop-blur-md border-b border-border-subtle p-4 sm:p-5 rounded-2xl mb-6 shadow-xs space-y-4">
      {/* Hàng 1: Tiêu đề & Cam kết bảo mật */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-2xs font-bold text-lg">
            🇻🇳
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-on-surface tracking-tight">
                {t.header.title}
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                {t.header.badge}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant line-clamp-1">
              {t.header.subtitle}
            </p>
          </div>
        </div>

        {/* Cam kết Privacy & Nút Xóa dữ liệu */}
        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
            <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span>{t.header.privacyBadge}</span>
          </div>

          <button
            type="button"
            onClick={onClearDrafts}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-outline hover:text-error hover:bg-error/10 border border-border-subtle transition-colors cursor-pointer"
            title={t.header.clearDraftsConfirm}
          >
            <Trash2 size={13} />
            <span>{t.header.clearDrafts}</span>
          </button>
        </div>
      </div>

      {/* Hàng 2: Chọn Tỉnh thành cư trú & Ô tìm kiếm */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
        {/* Bộ chọn Tỉnh thành Nhật Bản */}
        <div className="md:col-span-5 flex items-center gap-2 bg-surface-container px-3 py-2 rounded-xl border border-border-subtle focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <MapPin size={16} className="text-rose-500 shrink-0" />
          <div className="flex-1 flex flex-col">
            <label htmlFor="pref-selector" className="text-[10px] uppercase font-bold tracking-wider text-outline">
              {t.header.prefectureLabel}
            </label>
            <select
              id="pref-selector"
              value={selectedPrefectureId || ''}
              onChange={(e) => onSelectPrefecture?.(e.target.value)}
              className="bg-transparent text-xs font-semibold text-on-surface outline-none cursor-pointer py-0.5"
            >
              <option value="">{t.header.prefecturePlaceholder}</option>
              {JAPAN_PREFECTURES.map((p) => (
                <option key={p.code} value={p.code}>
                  {formatPrefectureLabel(p)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Ô Tìm kiếm nhanh theo từ khóa & alias */}
        <div className="md:col-span-7 flex items-center gap-2 bg-surface-container px-3 py-2 rounded-xl border border-border-subtle focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <Search size={16} className="text-outline shrink-0" />
          <input
            type="text"
            value={searchQuery || ''}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={t.header.searchPlaceholder}
            className="w-full bg-transparent text-xs text-on-surface placeholder:text-outline/60 outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange?.('')}
              className="text-xs text-outline hover:text-on-surface px-1 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Hiển thị cơ quan thẩm quyền tương ứng với Tỉnh thành đã chọn */}
      {activeOffice && (
        <div className="flex items-center justify-between gap-3 text-xs bg-primary/5 dark:bg-primary/10 border border-primary/20 px-3 py-2 rounded-xl text-primary flex-wrap">
          <div className="flex items-center gap-2">
            <Globe size={14} className="shrink-0" />
            <span>
              {t.header.jurisdictionNotice} <strong>{officeName}</strong> ({activeOffice.city})
            </span>
          </div>
          <div className="text-[11px] text-on-surface-variant">
            {t.header.hotline} <span className="font-mono font-semibold">{activeOffice.hotline}</span> | {t.header.workingHours} {activeOffice.workingHours.submission}
          </div>
        </div>
      )}
    </header>
  );
}
