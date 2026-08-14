import React from 'react';
import { Download, Trash2, TrendingDown, CheckCircle2 } from 'lucide-react';
import { formatBytes, calculateSavedPercent } from '@ai-tools/core/utils/image/formatters.js';

export default function StatsOverview({ items, onDownloadZip, onClearAll, isProcessing }) {
  if (!items || items.length === 0) return null;

  const completedItems = items.filter(i => i.status === 'completed');
  const totalOriginal = completedItems.reduce((acc, curr) => acc + (curr.originalSize || 0), 0);
  const totalWebP = completedItems.reduce((acc, curr) => acc + (curr.webpSize || 0), 0);
  const totalSaved = Math.max(0, totalOriginal - totalWebP);
  const totalPercent = calculateSavedPercent(totalOriginal, totalWebP);

  return (
    <div className="glass-panel stats-banner">
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
        <div className="stat-pill">
          <CheckCircle2 size={18} style={{ color: 'var(--accent-primary)' }} />
          <span>Đã chuyển đổi: <strong className="stat-value">{completedItems.length} / {items.length}</strong> ảnh</span>
        </div>

        <div className="stat-pill">
          <span>Tổng dung lượng gốc: <strong>{formatBytes(totalOriginal)}</strong> → WebP: <strong className="stat-value">{formatBytes(totalWebP)}</strong></span>
        </div>

        {totalSaved > 0 && (
          <div className="stat-pill" style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '4px 12px', borderRadius: '20px' }}>
            <TrendingDown size={16} style={{ color: 'var(--status-success)' }} />
            <span>Tiết kiệm: <strong className="stat-value" style={{ color: 'var(--status-success)' }}>{formatBytes(totalSaved)} ({totalPercent}%)</strong></span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          className="btn-danger btn-secondary"
          onClick={onClearAll}
          disabled={isProcessing}
          title="Xóa danh sách ảnh"
        >
          <Trash2 size={16} /> Xóa tất cả
        </button>

        <button
          className="btn-primary"
          onClick={onDownloadZip}
          disabled={completedItems.length === 0 || isProcessing}
        >
          <Download size={16} /> Tải tất cả dạng ZIP ({completedItems.length})
        </button>
      </div>
    </div>
  );
}
