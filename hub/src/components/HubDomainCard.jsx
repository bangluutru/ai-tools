import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import {
  ToolboxIllustration,
  SakuraIllustration,
  LotusIllustration,
} from '../assets/illustrations/index.jsx';

const ILLUSTRATION_MAP = {
  ToolboxIllustration,
  SakuraIllustration,
  LotusIllustration,
};

export default function HubDomainCard({
  id,
  title,
  subtitle,
  description,
  toolCount = 0,
  status,
  accentColor = '#0284c7',
  illustration = 'ToolboxIllustration',
  displayLang = 'vi',
  onSelect,
}) {
  const isComingSoon = status === 'coming_soon' || toolCount === 0;
  const IllustrationComponent = ILLUSTRATION_MAP[illustration] || ToolboxIllustration;

  const getCountLabel = () => {
    if (isComingSoon) {
      if (displayLang === 'ja') return '近日公開';
      if (displayLang === 'en') return 'Coming Soon';
      return 'Sắp có';
    }
    if (displayLang === 'ja') return `${toolCount} ツール →`;
    if (displayLang === 'en') return `${toolCount} tools →`;
    return `${toolCount} công cụ →`;
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect?.(id);
    }
  };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(id)}
      onKeyDown={handleKeyDown}
      className={`group relative flex flex-col justify-between p-6 sm:p-7 rounded-2xl bg-surface-container hover:bg-surface-container-high border border-border-subtle hover:border-primary-container/50 transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer overflow-hidden select-none outline-none focus-visible:ring-2 focus-visible:ring-primary`}
      aria-label={`${title} - ${getCountLabel()}`}
    >
      {/* Ambient background glow */}
      <div
        className="absolute -top-14 -right-14 w-36 h-36 rounded-full blur-3xl opacity-10 group-hover:opacity-25 transition-opacity pointer-events-none"
        style={{ backgroundColor: accentColor }}
      />

      {/* Decorative Vector Silhouette in top right */}
      <div className="absolute top-4 right-4 w-20 h-20 sm:w-24 sm:h-24 opacity-20 group-hover:opacity-35 group-hover:scale-105 transition-all duration-300 pointer-events-none">
        <IllustrationComponent />
      </div>

      <div className="relative z-10 space-y-4">
        {/* Top Header Badge */}
        <div className="flex items-center justify-between">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider font-label-sm border shadow-2xs ${
              id === 'japan-life'
                ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30'
                : id === 'vietnam-life'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                : 'bg-primary/10 text-primary dark:text-sky-300 border-primary/30'
            }`}
          >
            {isComingSoon && <Sparkles size={13} className="animate-pulse" />}
            <span>{subtitle}</span>
          </span>
        </div>

        {/* Main Title & Description */}
        <div className="space-y-2 pt-1">
          <h2 className="font-title-lg text-2xl sm:text-[26px] font-bold text-on-surface tracking-tight group-hover:text-primary transition-colors flex items-center gap-2">
            <span>{title}</span>
          </h2>
          <p className="font-body-sm text-xs sm:text-sm text-on-surface-variant line-clamp-3 leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      {/* Footer CTA & Dynamic Tool Count */}
      <div className="relative z-10 pt-6 mt-4 border-t border-border-subtle/70 flex items-center justify-between">
        <span
          className={`font-label-sm text-sm font-bold flex items-center gap-1.5 transition-transform duration-200 ${
            isComingSoon
              ? 'text-outline font-medium'
              : 'text-on-surface group-hover:text-primary group-hover:translate-x-1'
          }`}
        >
          <span>{getCountLabel()}</span>
          {!isComingSoon && (
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          )}
        </span>
      </div>
    </article>
  );
}
