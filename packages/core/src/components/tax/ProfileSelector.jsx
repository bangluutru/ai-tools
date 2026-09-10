/**
 * @file packages/core/src/components/tax/ProfileSelector.jsx
 * @description Trình chọn 6 hoàn cảnh làm việc (User Profiles) cho bộ mô phỏng thuế Nhật Bản.
 * Ưu tiên công bằng cả 3 ngôn ngữ (JA, VI, EN) với nhãn tiếng Nhật chính thức.
 */

import React from 'react';
import {
  Clock,
  Briefcase,
  TrendingUp,
  Laptop,
  Store,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { UserProfiles } from '../../utils/tax/engines/taxContextEngine.js';

const ICON_MAP = {
  Clock,
  Briefcase,
  TrendingUp,
  Laptop,
  Store,
  Building2,
};

export default function ProfileSelector({ selectedProfile, onSelectProfile, lang = 'ja', t }) {
  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-black">
              1
            </span>
            {t?.selectProfile || '① hoàn cảnh & hình thức làm việc'}
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {t?.selectProfileDesc || 'Chọn phương thức thu nhập chính để hiển thị chính xác câu hỏi liên quan.'}
          </p>
        </div>
        <span className="mt-2 sm:mt-0 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-full w-fit">
          ✓ {UserProfiles.find((p) => p.id === selectedProfile)?.[`name_${lang}`] || selectedProfile}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {UserProfiles.map((p) => {
          const isSelected = selectedProfile === p.id;
          const IconComponent = ICON_MAP[p.icon] || Briefcase;
          const name = p[`name_${lang}`] || p.name_ja;
          const desc = p[`desc_${lang}`] || p.desc_ja;

          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelectProfile(p.id)}
              className={`relative flex items-start gap-3 p-3.5 rounded-xl text-left transition-all border outline-none ${
                isSelected
                  ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-500 dark:border-rose-500/80 shadow-sm ring-1 ring-rose-500/30'
                  : 'bg-surface hover:bg-surface-container-high/40 border-border-subtle hover:border-outline-variant/60'
              }`}
            >
              <div
                className={`p-2 rounded-lg shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-rose-600 text-white'
                    : 'bg-surface-container-high text-on-surface-variant'
                }`}
              >
                <IconComponent className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`text-sm font-bold tracking-tight ${
                      isSelected ? 'text-rose-700 dark:text-rose-300' : 'text-on-surface'
                    }`}
                  >
                    {name}
                  </span>
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0" />
                  )}
                </div>

                {/* Always retain Japanese statutory term if current language is not Japanese */}
                {lang !== 'ja' && (
                  <span className="inline-block text-[11px] font-semibold text-on-surface-variant mb-1">
                    ({p.name_ja})
                  </span>
                )}

                <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                  {desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
