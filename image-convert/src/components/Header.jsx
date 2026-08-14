import React from 'react';
import { Image, Sun, Moon, Zap, ShieldCheck } from 'lucide-react';

export default function Header({ theme, onToggleTheme }) {
  return (
    <header className="app-header glass-panel">
      <div className="brand">
        <div className="brand-icon">
          <Image size={24} />
        </div>
        <div>
          <div className="brand-title">WebP Master</div>
          <div className="brand-subtitle">Chuyển đổi ảnh sang WebP siêu tốc & bảo mật Client-side</div>
        </div>
      </div>

      <div className="header-actions">
        <div className="supported-badge" style={{ margin: 0 }}>
          <ShieldCheck size={14} style={{ color: 'var(--accent-primary)' }} />
          <span>100% Client-side</span>
        </div>
        <button
          className="icon-btn"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Chuyển sang Chế độ Sáng' : 'Chuyển sang Chế độ Tối'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
