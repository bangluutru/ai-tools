/**
 * @file packages/core/src/components/consular/A4PreviewViewport.jsx
 * @description Khung nhìn tài liệu A4 chuẩn tỷ lệ vật lý (210mm x 297mm).
 * Kiến trúc 2 tầng độc lập:
 *   Preview Viewport -> Scaled A4 Stage -> Canonical A4 Document
 * Tuyệt đối không để responsive CSS làm méo mó hình học tỷ lệ A4 (210/297 ≈ 0.7071).
 */

import React, { useRef, useState, useLayoutEffect, useCallback } from 'react';
import {
  A4_LOGICAL_WIDTH,
  A4_LOGICAL_HEIGHT,
  A4_ASPECT_RATIO,
} from '../../consular/pdf/formTemplateRegistry.js';

export { A4_LOGICAL_WIDTH, A4_LOGICAL_HEIGHT, A4_ASPECT_RATIO };

export default function A4PreviewViewport({
  children,
  zoomMode = 'fit_page', // 'fit_page' | 'fit_width' | '100%'
  manualScaleDelta = 0,   // Điều chỉnh tăng giảm thủ công từ icon +/-
  className = '',
}) {
  const viewportRef = useRef(null);
  const [computedScale, setComputedScale] = useState(0.7);

  const calculateScale = useCallback(() => {
    if (!viewportRef.current) return;
    const { clientWidth, clientHeight } = viewportRef.current;

    // Khoảng đệm an toàn quanh tờ giấy (padding lề)
    const paddingX = 24;
    const paddingY = 24;
    const availW = Math.max(clientWidth - paddingX, 120);
    const availH = Math.max(clientHeight - paddingY, 120);

    const widthScale = availW / A4_LOGICAL_WIDTH;
    const heightScale = availH / A4_LOGICAL_HEIGHT;

    let baseScale = 1;
    if (zoomMode === 'fit_page') {
      // Mặc định Fit Page: Trang A4 phải nằm gọn cả chiều rộng và chiều cao trong khung nhìn
      baseScale = Math.min(widthScale, heightScale, 1.1);
    } else if (zoomMode === 'fit_width') {
      baseScale = widthScale;
    } else if (zoomMode === '100%') {
      baseScale = 1;
    }

    const finalScale = Math.max(baseScale + manualScaleDelta, 0.25);
    setComputedScale(finalScale);
  }, [zoomMode, manualScaleDelta]);

  // Sử dụng ResizeObserver để cập nhật tức thì khi pane resize, expand, hoặc browser đổi kích thước
  useLayoutEffect(() => {
    calculateScale();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', calculateScale);
      return () => window.removeEventListener('resize', calculateScale);
    }

    const observer = new ResizeObserver(() => {
      calculateScale();
    });

    if (viewportRef.current) {
      observer.observe(viewportRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [calculateScale]);

  const scaledWidth = Math.round(A4_LOGICAL_WIDTH * computedScale);
  const scaledHeight = Math.round(A4_LOGICAL_HEIGHT * computedScale);

  return (
    <div
      ref={viewportRef}
      tabIndex={0}
      role="region"
      aria-label="Khu vực xem trước bản in A4"
      className={`a4-preview-viewport w-full h-full min-h-[580px] max-h-[calc(100vh-170px)] bg-slate-100/90 dark:bg-slate-900/80 p-3 sm:p-5 flex justify-center items-start overflow-auto select-text relative custom-scrollbar focus:outline-none focus:ring-1 focus:ring-primary/40 ${className}`}
    >
      {/* Tầng 2: Scaled Stage — kích thước hình học chuẩn theo hệ số scale */}
      <div
        className="a4-preview-stage transition-transform duration-100 ease-out shrink-0 my-auto shadow-2xl rounded-xs"
        style={{
          width: `${scaledWidth}px`,
          height: `${scaledHeight}px`,
        }}
      >
        {/* Tầng 3: Canonical A4 Document — Giữ nguyên kích thước vật lý logic 794px x 1123px */}
        <div
          className="a4-document origin-top-left bg-white text-black select-text"
          style={{
            width: `${A4_LOGICAL_WIDTH}px`,
            height: `${A4_LOGICAL_HEIGHT}px`,
            minHeight: `${A4_LOGICAL_HEIGHT}px`,
            maxHeight: `${A4_LOGICAL_HEIGHT}px`,
            transform: `scale(${computedScale})`,
            transformOrigin: 'top left',
            boxSizing: 'border-box',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
