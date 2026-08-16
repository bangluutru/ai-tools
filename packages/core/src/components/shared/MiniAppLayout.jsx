import React from 'react';
import { ShieldCheck } from 'lucide-react';

/**
 * Vỏ dùng chung cho mọi miniapp trong portal.
 *
 * Trước đây mỗi miniapp tự dựng phần vỏ của mình, dẫn tới ba ngôn ngữ thiết kế
 * khác nhau và vài miniapp còn mang nhãn hiệu riêng ngay bên trong portal. Vỏ
 * này giữ một bố cục duy nhất: cùng bề rộng, cùng khoảng cách, cùng kiểu tiêu đề.
 *
 * Không đặt `min-h-screen` ở đây — portal đã sở hữu chiều cao trang, miniapp chỉ
 * chiếm phần nội dung.
 */

const WIDTHS = {
  narrow: 'max-w-3xl',
  medium: 'max-w-5xl',
  default: 'max-w-6xl',
  wide: 'max-w-7xl',
  full: 'max-w-none',
};

// Bề rộng và khoảng cách là khác biệt hợp lệ giữa các miniapp; phần đệm, canh
// giữa và màu chữ thì không, nên chỉ hai thứ đầu mới mở ra thành tham số.
const GAPS = { tight: 'gap-4', normal: 'gap-6', loose: 'gap-8' };

export function MiniAppLayout({ children, width = 'default', gap = 'loose', className = '' }) {
  return (
    <div className={`${WIDTHS[width] ?? WIDTHS.default} mx-auto w-full px-4 py-8 flex flex-col ${GAPS[gap] ?? GAPS.loose} text-slate-100 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Tiêu đề miniapp. Tên công cụ đã có trên thanh điều hướng của portal, nên phần
 * này nói công cụ làm gì chứ không lặp lại thương hiệu.
 */
export function MiniAppHeader({ title, subtitle, badge, badgeIcon, tone = 'emerald' }) {
  const toneClass = {
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    teal: 'bg-teal-500/10 border-teal-500/20 text-teal-400',
    violet: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
    rose: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  }[tone] ?? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';

  return (
    <header className="text-center space-y-2">
      {badge && (
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold ${toneClass}`}>
          {badgeIcon ?? <ShieldCheck className="w-3.5 h-3.5" />}
          <span>{badge}</span>
        </div>
      )}
      <h2 className="text-2xl md:text-4xl font-extrabold text-slate-100 tracking-tight">{title}</h2>
      {subtitle && <p className="text-slate-400 text-sm max-w-2xl mx-auto">{subtitle}</p>}
    </header>
  );
}

/** Khối nội dung chuẩn: nền, viền và bo góc giống nhau ở mọi miniapp. */
export function MiniAppPanel({ children, className = '', padded = true }) {
  return (
    <section className={`rounded-2xl bg-slate-900/60 border border-slate-800 ${padded ? 'p-4 sm:p-6' : ''} ${className}`}>
      {children}
    </section>
  );
}

/** Dải báo lỗi thống nhất, thay cho mỗi miniapp một kiểu đỏ khác nhau. */
export function MiniAppError({ children }) {
  if (!children) return null;
  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
      {children}
    </div>
  );
}

export default MiniAppLayout;
