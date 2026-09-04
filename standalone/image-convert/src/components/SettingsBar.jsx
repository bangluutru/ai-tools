import React from 'react';
import { Sliders, Maximize2, Palette, RefreshCw } from 'lucide-react';

export default function SettingsBar({ settings, onUpdateSettings, onApplyToAll, hasImages, isProcessing }) {
  const handleQualityChange = (e) => {
    onUpdateSettings({ quality: parseFloat(e.target.value) });
  };

  const handleMaxWidthChange = (e) => {
    const val = e.target.value ? parseInt(e.target.value, 10) : '';
    onUpdateSettings({ maxWidth: val });
  };

  const handleMaxHeightChange = (e) => {
    const val = e.target.value ? parseInt(e.target.value, 10) : '';
    onUpdateSettings({ maxHeight: val });
  };

  const handleAspectToggle = (e) => {
    onUpdateSettings({ keepAspectRatio: e.target.checked });
  };

  const handleColorChange = (e) => {
    onUpdateSettings({ fillColor: e.target.value || null });
  };

  return (
    <div className="glass-panel controls-bar">
      {/* Quality Control */}
      <div className="control-group">
        <div className="control-label">
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sliders size={16} /> Chất lượng WebP (Quality):
          </span>
          <span className="control-value">{Math.round(settings.quality * 100)}%</span>
        </div>
        <input
          type="range"
          min="0.05"
          max="1.0"
          step="0.05"
          value={settings.quality}
          onChange={handleQualityChange}
          className="range-slider"
        />
      </div>

      {/* Resize Dimensions */}
      <div className="control-group">
        <div className="control-label">
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Maximize2 size={16} /> Max Width / Height (px):
          </span>
        </div>
        <div className="input-row">
          <input
            type="number"
            placeholder="Rộng (Ví dụ: 1920)"
            value={settings.maxWidth || ''}
            onChange={handleMaxWidthChange}
            className="number-input"
            min="1"
          />
          <input
            type="number"
            placeholder="Cao (Ví dụ: 1080)"
            value={settings.maxHeight || ''}
            onChange={handleMaxHeightChange}
            className="number-input"
            min="1"
          />
        </div>
        <label className="toggle-switch" style={{ marginTop: '4px' }}>
          <input
            type="checkbox"
            checked={settings.keepAspectRatio}
            onChange={handleAspectToggle}
          />
          <span>Giữ nguyên tỷ lệ chiều rộng/cao</span>
        </label>
      </div>

      {/* Background Fill & Action */}
      <div className="control-group" style={{ justifyContent: 'space-between' }}>
        <div className="control-label">
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Palette size={16} /> Nền ảnh trong suốt:
          </span>
        </div>
        <select
          className="number-input"
          value={settings.fillColor || ''}
          onChange={handleColorChange}
        >
          <option value="">Giữ nguyên trong suốt (Alpha Channel)</option>
          <option value="#ffffff">Điền nền Trắng (#FFFFFF)</option>
          <option value="#000000">Điền nền Đen (#000000)</option>
        </select>

        {hasImages && (
          <button
            className="btn-secondary"
            onClick={onApplyToAll}
            disabled={isProcessing}
            style={{ marginTop: '8px', width: '100%' }}
          >
            <RefreshCw size={14} className={isProcessing ? 'spin' : ''} />
            Áp dụng lại cài đặt cho tất cả ảnh
          </button>
        )}
      </div>
    </div>
  );
}
