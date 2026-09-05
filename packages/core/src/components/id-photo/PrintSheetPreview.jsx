"use client";
import { useEffect, useRef } from "react";
import { renderPrintSheet } from '../../utils/id-photo/exportEngine.js';
import { useTranslation, format } from '../../utils/id-photo/i18n/index.jsx';
const PrintSheetPreview = ({
  singlePhotoCanvas,
  tiling,
  settings
}) => {
  const { t } = useTranslation();
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !singlePhotoCanvas) return;
    const rendered = renderPrintSheet(singlePhotoCanvas, tiling, settings, 150);
    canvas.width = rendered.width;
    canvas.height = rendered.height;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(rendered, 0, 0);
    }
  }, [singlePhotoCanvas, tiling, settings]);
  const isSingle = tiling.paper.id === "paper-single";
  return <div className="flex flex-col items-center">
      <div
    style={{
      aspectRatio: `${tiling.paperWidthMm} / ${tiling.paperHeightMm}`
    }}
    className="relative w-full max-w-[360px] overflow-hidden rounded-xl border-2 border-border-subtle bg-surface-subtle shadow-2xl ring-4 ring-primary-container/10 sm:max-w-[420px]"
  >
        <canvas
    ref={canvasRef}
    className="h-full w-full object-contain select-none"
  />

        {/* Paper & Count Badge */}
        <div className="pointer-events-none absolute bottom-2.5 right-2.5 flex items-center gap-1.5 rounded-lg bg-slate-900/85 px-2.5 py-1 text-[11px] font-medium text-white shadow-sm backdrop-blur-xs">
          <span>{tiling.paperWidthMm} × {tiling.paperHeightMm} mm</span>
          <span className="rounded bg-primary-container text-on-primary-container px-1 py-0.2 text-[10px] font-bold">
            {isSingle ? t.singleCount : format(t.sheetCount, { count: tiling.totalPhotos })}
          </span>
        </div>
      </div>
      <p className="mt-2 text-[11px] text-on-surface-variant">
        {t.printExactTip}
      </p>
    </div>;
};
export {
  PrintSheetPreview
};
