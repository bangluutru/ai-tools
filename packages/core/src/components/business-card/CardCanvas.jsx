import { useRef, useState, useEffect, useCallback } from "react";
import { RotateCw, Layers } from "lucide-react";
import { ElementRenderer } from "./ElementRenderer.jsx";
import { useLanguage } from "../../utils/business-card/LanguageContext.jsx";
import { calculateSnap, calculateResize } from "../../utils/business-card/alignmentSnapper.js";

export const CardCanvas = ({
  project,
  activeSide,
  onToggleSide,
  onChangeSide,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  scale,
  showBleedGuide,
  showTrimGuide,
  showSafeGuide
}) => {
  const { t } = useLanguage();
  const containerRef = useRef(null);
  const sideData = activeSide === "front" ? project.front : project.back;
  const dim = project.dimension;
  const isHoriz = project.orientation === "horizontal";
  const cardW = isHoriz ? dim.widthMm : dim.heightMm;
  const cardH = isHoriz ? dim.heightMm : dim.widthMm;
  const bleed = dim.bleedMm;
  const safeMargin = dim.safeMarginMm;
  const mmToPx = 3.7795275591 * scale;
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    setIsFlipping(true);
    const timer = setTimeout(() => setIsFlipping(false), 300);
    return () => clearTimeout(timer);
  }, [activeSide]);

  const [draggingElId, setDraggingElId] = useState(null);
  const [dragStartPos, setDragStartPos] = useState(null);
  const [resizingState, setResizingState] = useState(null);
  const [activeGuides, setActiveGuides] = useState([]);

  // Mouse Down to start moving an element
  const handleMouseDownOnElement = (el, e) => {
    e.stopPropagation();
    onSelectElement(el.id);
    setDraggingElId(el.id);
    setDragStartPos({
      mouseX: e.clientX,
      mouseY: e.clientY,
      elX: el.xMm,
      elY: el.yMm
    });
  };

  // Mouse Down on a resize handle
  const handleStartResize = useCallback((el, handle, e) => {
    e.stopPropagation();
    onSelectElement(el.id);
    setResizingState({
      elId: el.id,
      handle,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startEl: { ...el }
    });
  }, [onSelectElement]);

  // Unified Mouse Move & Up handlers
  useEffect(() => {
    const handleMouseMove = (e) => {
      // 1. Moving Element with Smart Snapping
      if (draggingElId && dragStartPos) {
        const deltaXPx = e.clientX - dragStartPos.mouseX;
        const deltaYPx = e.clientY - dragStartPos.mouseY;
        const deltaXMm = deltaXPx / mmToPx;
        const deltaYMm = deltaYPx / mmToPx;
        const activeEl = sideData.elements.find((el) => el.id === draggingElId);
        if (!activeEl) return;

        const rawX = dragStartPos.elX + deltaXMm;
        const rawY = dragStartPos.elY + deltaYMm;

        const snapped = calculateSnap({
          movingEl: { ...activeEl, xMm: rawX, yMm: rawY },
          allElements: sideData.elements,
          cardW,
          cardH,
          safeMargin,
          thresholdMm: 1.2
        });

        setActiveGuides(snapped.guides);
        onUpdateElement({
          ...activeEl,
          xMm: snapped.xMm,
          yMm: snapped.yMm
        });
        return;
      }

      // 2. Resizing Element via Handle
      if (resizingState) {
        const deltaXPx = e.clientX - resizingState.startMouseX;
        const deltaYPx = e.clientY - resizingState.startMouseY;
        const deltaXMm = deltaXPx / mmToPx;
        const deltaYMm = deltaYPx / mmToPx;

        const resized = calculateResize({
          startEl: resizingState.startEl,
          handle: resizingState.handle,
          deltaXMm,
          deltaYMm,
          minW: 3,
          minH: 2
        });

        const activeEl = sideData.elements.find((el) => el.id === resizingState.elId);
        if (activeEl) {
          onUpdateElement({
            ...activeEl,
            ...resized
          });
        }
      }
    };

    const handleMouseUp = () => {
      setDraggingElId(null);
      setDragStartPos(null);
      setResizingState(null);
      setActiveGuides([]);
    };

    if (draggingElId || resizingState) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    draggingElId,
    dragStartPos,
    resizingState,
    mmToPx,
    cardW,
    cardH,
    safeMargin,
    onUpdateElement,
    sideData.elements
  ]);

  // Keyboard Nudge (Arrow Keys) & Precision Navigation
  useEffect(() => {
    if (!selectedElementId) return;
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)) return;
      const activeEl = sideData.elements.find((el) => el.id === selectedElementId);
      if (!activeEl) return;

      const stepMm = e.shiftKey ? 0.1 : 0.5;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onUpdateElement({ ...activeEl, xMm: Math.round((activeEl.xMm - stepMm) * 10) / 10 });
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onUpdateElement({ ...activeEl, xMm: Math.round((activeEl.xMm + stepMm) * 10) / 10 });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        onUpdateElement({ ...activeEl, yMm: Math.round((activeEl.yMm - stepMm) * 10) / 10 });
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        onUpdateElement({ ...activeEl, yMm: Math.round((activeEl.yMm + stepMm) * 10) / 10 });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedElementId, sideData.elements, onUpdateElement]);

  return <div
    ref={containerRef}
    onClick={() => onSelectElement(null)}
    className="w-full h-full min-h-[520px] bg-surface-canvas overflow-auto flex items-center justify-center p-8 relative select-none"
  >
      {
    /* 1. TOP FLOATING QUICK-FLIP TOOLBAR */
  }
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-surface-container/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-lg border border-border-subtle">
        {
    /* Front / Back Toggle Buttons */
  }
        <div className="flex items-center gap-1 bg-surface-subtle p-0.5 rounded-full">
          <button
    type="button"
    id="btn-canvas-side-front"
    onClick={(e) => {
      e.stopPropagation();
      onChangeSide?.("front");
    }}
    className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${activeSide === "front" ? "bg-surface-container text-primary shadow-xs" : "text-on-surface-variant hover:text-on-surface"}`}
  >
            {t("sideFront")}
          </button>
          <button
    type="button"
    id="btn-canvas-side-back"
    onClick={(e) => {
      e.stopPropagation();
      onChangeSide?.("back");
    }}
    className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${activeSide === "back" ? "bg-surface-container text-primary shadow-xs" : "text-on-surface-variant hover:text-on-surface"}`}
  >
            {t("sideBack")}
          </button>
        </div>

        {
    /* Quick Flip Action Button */
  }
        <button
    type="button"
    id="btn-canvas-quick-flip"
    onClick={(e) => {
      e.stopPropagation();
      onToggleSide?.();
    }}
    className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white rounded-full text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer group"
    title={t("flipCard")}
  >
          <RotateCw className="w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-180" />
          <span>{t("flipCard")}</span>
        </button>

        {
    /* Card Side Indicator Badge */
  }
        <div className="hidden sm:flex items-center gap-1 text-[11px] text-on-surface-variant font-medium pl-1.5 border-l border-border-subtle">
          <Layers className="w-3.5 h-3.5 text-outline" />
          <span>{activeSide === "front" ? t("currentSideFront") : t("currentSideBack")}</span>
        </div>
      </div>

      {
    /* Centered Card Artwork Container with Flip Transition */
  }
      <div
    className={`relative shadow-2xl transition-all duration-300 ${isFlipping ? "scale-95 opacity-90" : "scale-100 opacity-100"}`}
    style={{
      width: `${(cardW + bleed * 2) * mmToPx}px`,
      height: `${(cardH + bleed * 2) * mmToPx}px`
    }}
  >
        {
    /* 2. FLOATING QUICK FLIP BADGE AT TOP-RIGHT OF CARD */
  }
        <button
    type="button"
    id="btn-card-corner-flip"
    onClick={(e) => {
      e.stopPropagation();
      onToggleSide?.();
    }}
    className="absolute -top-3.5 right-2 z-40 flex items-center gap-1.5 px-3 py-1 bg-surface-container/95 hover:bg-primary/10 text-on-surface-variant hover:text-primary border border-border-subtle/80 hover:border-brand-300 rounded-full text-[11px] font-semibold shadow-md backdrop-blur-xs transition-all cursor-pointer group hover:scale-105"
    title={activeSide === "front" ? t("flipToBack") : t("flipToFront")}
  >
          <RotateCw className="w-3 h-3 text-primary transition-transform duration-300 group-hover:rotate-180" />
          <span>{activeSide === "front" ? t("flipToBack") : t("flipToFront")}</span>
        </button>

        {
    /* 1. BLEED GUIDE AREA (3mm on each side) */
  }
        {showBleedGuide && <div
    className="absolute inset-0 border border-dashed border-red-400/80 pointer-events-none z-30"
    title="塗り足し線 (3mm外側) - 背景はこの枠まで延ばします"
  >
            <span className="absolute -top-4 left-0 text-[10px] font-mono text-red-600 bg-surface-container/90 px-1 rounded shadow-xs">
              塗り足し線 ({cardW + bleed * 2} × {cardH + bleed * 2}mm)
            </span>
          </div>}

        {
    /* 2. ACTUAL TRIM / FINISHED CARD AREA (91x55mm) */
  }
        <div
    className={`absolute rounded-sm overflow-hidden transition-colors ${sideData.paperTexture === "washi" ? "paper-texture-washi" : sideData.paperTexture === "kraft" ? "paper-texture-kraft" : "bg-surface-container"}`}
    style={{
      left: `${bleed * mmToPx}px`,
      top: `${bleed * mmToPx}px`,
      width: `${cardW * mmToPx}px`,
      height: `${cardH * mmToPx}px`,
      backgroundColor: sideData.backgroundColor || "#ffffff"
    }}
  >
          {
    /* TRIM LINE GUIDE (Cyan cut line) */
  }
          {showTrimGuide && <div
    className="absolute inset-0 border border-cyan-500 pointer-events-none z-20"
    title="仕上がり線 (断裁線) - 実際の名刺サイズ"
  />}

          {
    /* SAFE AREA GUIDE (Green dashed margin line 3mm inside) */
  }
          {showSafeGuide && <div
    className="absolute border border-dashed border-emerald-500/80 pointer-events-none z-20"
    style={{
      left: `${safeMargin * mmToPx}px`,
      top: `${safeMargin * mmToPx}px`,
      right: `${safeMargin * mmToPx}px`,
      bottom: `${safeMargin * mmToPx}px`
    }}
    title="セーフエリア - 重要文字・ロゴを収める推奨エリア"
  >
              <span className="absolute bottom-1 right-1 text-[9px] font-mono text-emerald-700 bg-surface-container/80 px-1 rounded">
                安全マージン 3mm
              </span>
            </div>}

          {
    /* 3. SMART ALIGNMENT GUIDELINES OVERLAY */
  }
          {activeGuides.map((guide, idx) => {
            if (guide.axis === "x") {
              return (
                <div
                  key={`guide-x-${idx}`}
                  className="smart-guide-line smart-guide-x absolute top-0 bottom-0 pointer-events-none z-30 flex flex-col items-center"
                  style={{ left: `${guide.posMm * mmToPx}px` }}
                >
                  <div className="w-[1px] h-full bg-cyan-500 shadow-[0_0_4px_rgba(6,182,212,0.9)]" />
                  <span className="absolute top-1 -translate-x-1/2 bg-cyan-600 text-white text-[9px] font-mono px-1 py-0.5 rounded shadow-xs whitespace-nowrap">
                    {guide.posMm}mm
                  </span>
                </div>
              );
            }
            if (guide.axis === "y") {
              return (
                <div
                  key={`guide-y-${idx}`}
                  className="smart-guide-line smart-guide-y absolute left-0 right-0 pointer-events-none z-30 flex items-center"
                  style={{ top: `${guide.posMm * mmToPx}px` }}
                >
                  <div className="h-[1px] w-full bg-cyan-500 shadow-[0_0_4px_rgba(6,182,212,0.9)]" />
                  <span className="absolute left-1 -translate-y-1/2 bg-cyan-600 text-white text-[9px] font-mono px-1 py-0.5 rounded shadow-xs whitespace-nowrap">
                    {guide.posMm}mm
                  </span>
                </div>
              );
            }
            return null;
          })}

          {
    /* RENDER ACTIVE SIDE DESIGN ELEMENTS */
  }
          {sideData.elements.map((el) => <div
    key={el.id}
    onMouseDown={(e) => handleMouseDownOnElement(el, e)}
  >
              <ElementRenderer
    element={el}
    isSelected={el.id === selectedElementId}
    onSelect={() => onSelectElement(el.id)}
    onStartResize={handleStartResize}
    scale={scale}
  />
            </div>)}
        </div>
      </div>
    </div>;
};
