"use client";
import { useEffect, useRef } from "react";
import { useTranslation } from '../../utils/id-photo/i18n/index.jsx';
import { adjustBrightness, mmToPixels } from '../../utils/id-photo/exportEngine.js';
const PhotoCanvas = ({
  compositeImage,
  standard,
  transform,
  onTransformChange,
  showGuides,
  bgColor = "#FFFFFF",
  useVignette = false
}) => {
  const { t } = useTranslation();
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const isDraggingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const startOffsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !compositeImage) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drawGuidelines = (targetCtx, w, h, std) => {
      targetCtx.save();
      targetCtx.strokeStyle = "rgba(59, 130, 246, 0.4)";
      targetCtx.lineWidth = 2;
      targetCtx.setLineDash([6, 6]);
      targetCtx.beginPath();
      targetCtx.moveTo(w / 2, 0);
      targetCtx.lineTo(w / 2, h);
      targetCtx.stroke();
      const topMarginAvg = (std.topMarginPercentMin + std.topMarginPercentMax) / 2 / 100 * h;
      targetCtx.strokeStyle = "rgba(239, 68, 68, 0.7)";
      targetCtx.beginPath();
      targetCtx.moveTo(0, topMarginAvg);
      targetCtx.lineTo(w, topMarginAvg);
      targetCtx.stroke();
      targetCtx.fillStyle = "rgba(239, 68, 68, 0.9)";
      targetCtx.font = "bold 11px sans-serif";
      targetCtx.fillText(t.guideCrown, 10, topMarginAvg - 6);
      const faceHeightAvg = (std.faceHeightPercentMin + std.faceHeightPercentMax) / 2 / 100 * h;
      const chinY = topMarginAvg + faceHeightAvg;
      targetCtx.strokeStyle = "rgba(16, 185, 129, 0.8)";
      targetCtx.beginPath();
      targetCtx.moveTo(0, chinY);
      targetCtx.lineTo(w, chinY);
      targetCtx.stroke();
      targetCtx.fillStyle = "rgba(16, 185, 129, 0.9)";
      targetCtx.font = "bold 11px sans-serif";
      targetCtx.fillText(t.guideChin, 10, chinY + 16);
      targetCtx.strokeStyle = "rgba(59, 130, 246, 0.35)";
      targetCtx.setLineDash([]);
      targetCtx.beginPath();
      const ovalCenterY = (topMarginAvg + chinY) / 2;
      const ovalRadiusY = faceHeightAvg / 2;
      const ovalRadiusX = faceHeightAvg * 0.75 / 2;
      targetCtx.ellipse(w / 2, ovalCenterY, ovalRadiusX, ovalRadiusY, 0, 0, Math.PI * 2);
      targetCtx.stroke();
      targetCtx.restore();
    };

    const targetW = mmToPixels(standard.widthMm, 300);
    const targetH = mmToPixels(standard.heightMm, 300);
    const dpr = typeof window !== "undefined" ? Math.max(window.devicePixelRatio || 1, 2) : 2;
    canvas.width = targetW * dpr;
    canvas.height = targetH * dpr;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    const srcW = compositeImage.width;
    const srcH = compositeImage.height;
    if (useVignette) {
      const grad = ctx.createRadialGradient(
        targetW / 2,
        targetH * 0.38,
        Math.min(targetW, targetH) * 0.15,
        targetW / 2,
        targetH * 0.45,
        Math.max(targetW, targetH) * 0.72
      );
      grad.addColorStop(0, bgColor);
      grad.addColorStop(0.65, adjustBrightness(bgColor, -8));
      grad.addColorStop(1, adjustBrightness(bgColor, -22));
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = bgColor;
    }
    ctx.fillRect(0, 0, targetW, targetH);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, targetW, targetH);
    ctx.clip();
    const scale = transform.scale;
    const drawW = srcW * scale;
    const drawH = srcH * scale;
    const drawX = targetW / 2 + transform.offsetX;
    const drawY = targetH / 2 + transform.offsetY;
    ctx.translate(drawX, drawY);
    ctx.rotate(transform.rotation * Math.PI / 180);
    const filters = [];
    if (transform.brightness !== 0) filters.push(`brightness(${100 + transform.brightness}%)`);
    if (transform.contrast !== 0) filters.push(`contrast(${100 + transform.contrast}%)`);
    if (transform.saturation !== 0) filters.push(`saturate(${100 + transform.saturation}%)`);
    if (filters.length > 0) ctx.filter = filters.join(" ");
    ctx.drawImage(compositeImage, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
    if (showGuides) {
      drawGuidelines(ctx, targetW, targetH, standard);
    }
    ctx.restore();
  }, [compositeImage, standard, transform, showGuides, bgColor, useVignette, t]);
  const handlePointerDown = (clientX, clientY) => {
    isDraggingRef.current = true;
    startPosRef.current = { x: clientX, y: clientY };
    startOffsetRef.current = { x: transform.offsetX, y: transform.offsetY };
  };
  const handlePointerMove = (clientX, clientY) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    const dx = clientX - startPosRef.current.x;
    const dy = clientY - startPosRef.current.y;
    const rect = containerRef.current.getBoundingClientRect();
    const scaleFactor = mmToPixels(standard.widthMm, 300) / rect.width;
    onTransformChange({
      ...transform,
      offsetX: Math.round(startOffsetRef.current.x + dx * scaleFactor),
      offsetY: Math.round(startOffsetRef.current.y + dy * scaleFactor)
    });
  };
  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };
  return <div className="flex flex-col items-center">
      <div
    ref={containerRef}
    onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
    onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
    onMouseUp={handlePointerUp}
    onMouseLeave={handlePointerUp}
    onTouchStart={(e) => {
      if (e.touches.length === 1) {
        handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
      }
    }}
    onTouchMove={(e) => {
      if (e.touches.length === 1) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }}
    onTouchEnd={handlePointerUp}
    style={{ aspectRatio: `${standard.widthMm} / ${standard.heightMm}` }}
    className="relative w-full max-w-[320px] cursor-grab active:cursor-grabbing overflow-hidden rounded-xl border-2 border-blue-500/80 bg-white shadow-xl ring-4 ring-blue-500/10 sm:max-w-[360px]"
  >
        <canvas
    ref={canvasRef}
    className="h-full w-full object-cover select-none pointer-events-none"
  />

        {
    /* Dimension indicator badge */
  }
        <div className="pointer-events-none absolute bottom-2.5 right-2.5 rounded-md bg-slate-900/85 px-2 py-1 font-mono text-[11px] font-medium text-white shadow-sm backdrop-blur-xs">
          {standard.widthMm} × {standard.heightMm} mm
        </div>
      </div>
      <p className="mt-2 text-[11px] text-slate-500">
        {t.dragTip}
      </p>
    </div>;
};
export {
  PhotoCanvas
};
