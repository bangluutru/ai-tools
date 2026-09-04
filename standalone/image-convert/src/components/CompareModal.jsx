import React, { useState, useRef } from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import { formatBytes } from '../utils/formatters.js';

export default function CompareModal({ item, onClose }) {
  const [sliderPosition, setSliderPosition] = useState(50); // 0 to 100%
  const containerRef = useRef(null);

  if (!item) return null;

  const handleMove = (clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    let percentage = (x / rect.width) * 100;
    if (percentage < 0) percentage = 0;
    if (percentage > 100) percentage = 100;
    setSliderPosition(percentage);
  };

  const handleMouseMove = (e) => {
    if (e.buttons === 1) { // Left mouse button clicked/dragging
      handleMove(e.clientX);
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches && e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>So sánh chất lượng ảnh</h3>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Kéo thanh trượt để so sánh Ảnh gốc vs WebP
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="file-meta" style={{ padding: '0 4px' }}>
          <span>
            <strong>Ảnh gốc ({item.originalName.split('.').pop()?.toUpperCase()}):</strong> {formatBytes(item.originalSize)}
          </span>
          <span>
            <strong>Ảnh WebP:</strong> {formatBytes(item.webpSize)} (Giảm {item.savedPercent}%)
          </span>
        </div>

        <div
          ref={containerRef}
          className="compare-container"
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
          onClick={(e) => handleMove(e.clientX)}
        >
          {/* Converted WebP Image (Full Background) */}
          <img
            src={item.webpUrl}
            alt="WebP"
            className="compare-img"
          />
          <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.75)', color: 'var(--accent-primary)', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700 }}>
            WEBP ({formatBytes(item.webpSize)})
          </div>

          {/* Original Image (Clipped Overlay) */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              width: `${sliderPosition}%`,
              overflow: 'hidden',
            }}
          >
            <img
              src={item.originalUrl}
              alt="Original"
              className="compare-img"
              style={{
                width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%',
                maxWidth: 'none',
              }}
            />
            <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.75)', color: '#fff', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700 }}>
              GỐC ({formatBytes(item.originalSize)})
            </div>
          </div>

          {/* Vertical Slider Handle */}
          <div className="compare-slider-bar" style={{ left: `${sliderPosition}%` }}>
            <div className="compare-handle">
              <SlidersHorizontal size={18} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
