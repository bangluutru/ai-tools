import React from 'react';
import { Download, Eye, Trash2, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { formatBytes } from '../../utils/image/formatters.js';

export default function ImageCard({ item, onDownloadSingle, onCompare, onDelete }) {
  const isCompleted = item.status === 'completed';
  const isError = item.status === 'error';
  const isPending = item.status === 'processing';

  const ext = item.originalName.split('.').pop()?.toUpperCase() || 'IMG';

  const handleDownload = () => {
    if (isCompleted && item.webpBlob) {
      const link = document.createElement('a');
      link.href = item.webpUrl;
      link.download = item.webpFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="glass-panel image-card">
      <div className="thumbnail-area">
        <span className="badge-format">{ext}</span>
        <img
          src={item.originalUrl}
          alt={item.originalName}
          className="thumbnail-img"
          loading="lazy"
        />
        {isPending && (
          <div className="modal-backdrop" style={{ position: 'absolute', backdropFilter: 'blur(2px)' }}>
            <Loader2 size={32} className="spin" style={{ color: 'var(--accent-primary)' }} />
          </div>
        )}
      </div>

      <div className="card-details">
        <div className="filename" title={item.originalName}>
          {item.originalName}
        </div>

        {isCompleted && (
          <>
            <div className="file-meta">
              <span>Gốc: {formatBytes(item.originalSize)}</span>
              <span>WebP: <strong>{formatBytes(item.webpSize)}</strong></span>
            </div>

            <div className="file-meta">
              <span>{item.targetDimensions.width} × {item.targetDimensions.height}px</span>
              {item.savedPercent > 0 ? (
                <span className="savings-tag">Giảm {item.savedPercent}%</span>
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>+0%</span>
              )}
            </div>
          </>
        )}

        {isError && (
          <div style={{ color: 'var(--status-danger)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <AlertTriangle size={14} /> {item.errorMessage || 'Chuyển đổi thất bại'}
          </div>
        )}
      </div>

      <div className="card-actions">
        {isCompleted && (
          <>
            <button
              className="btn-secondary"
              onClick={() => onCompare(item)}
              title="So sánh ảnh gốc vs WebP"
            >
              <Eye size={14} /> So sánh
            </button>
            <button
              className="btn-primary"
              onClick={handleDownload}
              title="Tải về WebP"
            >
              <Download size={14} /> Tải
            </button>
          </>
        )}
        <button
          className="icon-btn btn-danger"
          onClick={() => onDelete(item.id)}
          title="Xóa ảnh này"
          style={{ width: '36px', height: '36px' }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
