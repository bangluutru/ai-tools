import React from 'react';
import { ShieldCheck } from 'lucide-react';

export {
  ToolBreadcrumb,
  StatusBadge,
  PrivacyShieldPill,
  ToolHeader,
  SectionCard,
  ToolWorkspace,
  FileUploader,
  ResultCard,
  AssuranceCards,
  StandardToolLayout,
} from './StandardToolLayout.jsx';

/**
 * Vỏ dùng chung cho mọi miniapp trong portal - Modern Utility Workspace.
 * Đồng bộ với chuẩn 1240px, border 1px tinh tế và surface tokens.
 */

const WIDTHS = {
  narrow: 'max-w-3xl',
  medium: 'max-w-5xl',
  default: 'max-w-[1240px]',
  wide: 'max-w-[1240px]',
  full: 'max-w-none',
};

const GAPS = { tight: 'gap-4', normal: 'gap-6', loose: 'gap-8' };

export function MiniAppLayout({ children, width = 'default', gap = 'loose', className = '' }) {
  return (
    <div className={`${WIDTHS[width] ?? WIDTHS.default} mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col ${GAPS[gap] ?? GAPS.loose} text-on-surface ${className}`}>
      {children}
    </div>
  );
}

/**
 * Tiêu đề miniapp theo chuẩn Modern Utility Workspace.
 */
export function MiniAppHeader({ title, subtitle, badge, badgeIcon, tone = 'emerald' }) {
  const toneClass = {
    emerald: 'bg-secondary/10 border-secondary/20 text-secondary',
    teal: 'bg-primary-container/10 border-primary-container/20 text-primary',
    violet: 'bg-purple-500/10 border-purple-500/20 text-purple-300',
    rose: 'bg-error-container/20 border-error-container/30 text-error',
    blue: 'bg-primary-container/20 border-primary-container/30 text-brand-cyan-bright',
  }[tone] ?? 'bg-secondary/10 border-secondary/20 text-secondary';

  return (
    <header className="text-center space-y-2 mb-2">
      {badge && (
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold ${toneClass}`}>
          {badgeIcon ?? <ShieldCheck className="w-3.5 h-3.5" />}
          <span>{badge}</span>
        </div>
      )}
      <h2 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">{title}</h2>
      {subtitle && <p className="text-on-surface-variant text-sm max-w-2xl mx-auto">{subtitle}</p>}
    </header>
  );
}

/** Khối nội dung chuẩn: nền surface-container, viền border-subtle. */
export function MiniAppPanel({ children, className = '', padded = true }) {
  return (
    <section className={`rounded-xl bg-surface-container border border-border-subtle shadow-md ${padded ? 'p-4 sm:p-6' : ''} ${className}`}>
      {children}
    </section>
  );
}

/** Dải báo lỗi thống nhất. */
export function MiniAppError({ children }) {
  if (!children) return null;
  return (
    <div className="rounded-xl border border-error/30 bg-error-container/20 px-4 py-3 text-sm text-error">
      {children}
    </div>
  );
}

export default MiniAppLayout;

