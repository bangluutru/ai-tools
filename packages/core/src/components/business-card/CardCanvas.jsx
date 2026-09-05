import { useRef, useState, useEffect, useCallback } from "react";
import { RotateCw, Layers, Undo2, Redo2 } from "lucide-react";
import { ElementRenderer } from "./ElementRenderer.jsx";
import { useLanguage } from "../../utils/business-card/LanguageContext.jsx";
import { calculateSnap, calculateResize } from "../../utils/business-card/alignmentSnapper.js";

export const CardCanvas = ({
  project,
  activeSide,
  onToggleSide,
  onChangeSide,
  selectedElementId,
  selectedElementIds = [],
  onSelectElement,
  onSelectElements,
  onUpdateElement,
  onUpdateElements,
  onUndo,
  onRedo,
  onCommitHistory,
  canUndo = false,
  canRedo = false,
  scale,
  showBleedGuide,
  showTrimGuide,
  showSafeGuide,
}) => {
  const { t } = useLanguage();
  const containerRef = useRef(null);
  const trimContainerRef = useRef(null);
  const sideData = activeSide === "front" ? project.front : project.back;
  const dim = project.dimension;
  const isHoriz = project.orientation === "horizontal";
  const cardW = isHoriz ? dim.widthMm : dim.heightMm;
  const cardH = isHoriz ? dim.heightMm : dim.widthMm;
  const bleed = dim.bleedMm;
  const safeMargin = dim.safeMarginMm;
  const mmToPx = 3.7795275591 * scale;
  const [isFlipping, setIsFlipping] = useState(false);

  // Movement & Resize change tracking for clean single-step Undo/Redo commits
  const hasMovedRef = useRef(false);
  const hasResizedRef = useRef(false);

  // Normalize selected IDs
  const effectiveSelectedIds = Array.isArray(selectedElementIds) && selectedElementIds.length > 0
    ? selectedElementIds
    : selectedElementId
      ? [selectedElementId]
      : [];
  const isMultiSelected = effectiveSelectedIds.length > 1;

  useEffect(() => {
    setIsFlipping(true);
    const timer = setTimeout(() => setIsFlipping(false), 300);
    return () => clearTimeout(timer);
  }, [activeSide]);

  const [draggingElId, setDraggingElId] = useState(null);
  const [dragStartPos, setDragStartPos] = useState(null);
  const [resizingState, setResizingState] = useState(null);
  const [activeGuides, setActiveGuides] = useState([]);
  const [marqueeBox, setMarqueeBox] = useState(null);

  // Mouse Down to start moving an element (or multi-selection group)
  const handleMouseDownOnElement = (el, e) => {
    e.stopPropagation();
    hasMovedRef.current = false;
    const isMultiModifier = e.shiftKey || e.metaKey || e.ctrlKey;
    const isAlreadySelected = effectiveSelectedIds.includes(el.id);

    let nextSelectedIds;
    if (isMultiModifier) {
      if (isAlreadySelected) {
        nextSelectedIds = effectiveSelectedIds.filter((id) => id !== el.id);
      } else {
        nextSelectedIds = [...effectiveSelectedIds, el.id];
      }
      onSelectElements?.(nextSelectedIds);
    } else {
      if (isAlreadySelected && effectiveSelectedIds.length > 1) {
        nextSelectedIds = effectiveSelectedIds;
      } else {
        nextSelectedIds = [el.id];
        onSelectElement?.(el.id);
        onSelectElements?.([el.id]);
      }
    }

    setDraggingElId(el.id);

    if (nextSelectedIds.length > 1 && nextSelectedIds.includes(el.id)) {
      // Group drag initialization
      const elementsToDrag = sideData.elements
        .filter((item) => nextSelectedIds.includes(item.id))
        .map((item) => ({
          id: item.id,
          xMm: item.xMm,
          yMm: item.yMm,
          widthMm: item.widthMm,
          heightMm: item.heightMm,
        }));
      setDragStartPos({
        mouseX: e.clientX,
        mouseY: e.clientY,
        isMulti: true,
        elements: elementsToDrag,
        mainStart: {
          id: el.id,
          xMm: el.xMm,
          yMm: el.yMm,
          widthMm: el.widthMm,
          heightMm: el.heightMm,
        },
      });
    } else {
      // Single drag initialization
      setDragStartPos({
        mouseX: e.clientX,
        mouseY: e.clientY,
        isMulti: false,
        elX: el.xMm,
        elY: el.yMm,
      });
    }
  };

  // Mouse Down on canvas background to start marquee selection
  const handleCanvasMouseDown = (e) => {
    if (e.target.closest("button, input, select, textarea, [data-handle]")) return;

    const isMultiModifier = e.shiftKey || e.metaKey || e.ctrlKey;
    if (!isMultiModifier) {
      onSelectElement?.(null);
      onSelectElements?.([]);
    }

    setMarqueeBox({
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      active: true,
      initialSelectedIds: isMultiModifier ? effectiveSelectedIds : [],
    });
  };

  // Mouse Down on a resize handle
  const handleStartResize = useCallback(
    (el, handle, e) => {
      e.stopPropagation();
      hasResizedRef.current = false;
      onSelectElement?.(el.id);
      onSelectElements?.([el.id]);
      setResizingState({
        elId: el.id,
        handle,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startEl: { ...el },
      });
    },
    [onSelectElement, onSelectElements]
  );

  // Unified Mouse Move & Up handlers
  useEffect(() => {
    const handleMouseMove = (e) => {
      // 1. Moving Element(s) with Smart Snapping
      if (draggingElId && dragStartPos) {
        const deltaXPx = e.clientX - dragStartPos.mouseX;
        const deltaYPx = e.clientY - dragStartPos.mouseY;
        const deltaXMm = deltaXPx / mmToPx;
        const deltaYMm = deltaYPx / mmToPx;

        // A. Multi-element drag
        if (dragStartPos.isMulti && dragStartPos.elements) {
          const mainStart = dragStartPos.mainStart;
          const activeEl = sideData.elements.find((el) => el.id === draggingElId);
          if (!activeEl) return;

          const rawX = mainStart.xMm + deltaXMm;
          const rawY = mainStart.yMm + deltaYMm;

          // Snap main element against elements outside the selected group
          const unselectedElements = sideData.elements.filter(
            (el) => !effectiveSelectedIds.includes(el.id)
          );

          const snapped = calculateSnap({
            movingEl: { ...activeEl, xMm: rawX, yMm: rawY },
            allElements: unselectedElements,
            cardW,
            cardH,
            safeMargin,
            thresholdMm: 1.2,
          });

          setActiveGuides(snapped.guides);

          const effectiveDeltaXMm = snapped.xMm - mainStart.xMm;
          const effectiveDeltaYMm = snapped.yMm - mainStart.yMm;

          const updatedElements = dragStartPos.elements.map((startEl) => {
            const currentObj = sideData.elements.find((item) => item.id === startEl.id);
            return {
              ...currentObj,
              xMm: Math.round((startEl.xMm + effectiveDeltaXMm) * 10) / 10,
              yMm: Math.round((startEl.yMm + effectiveDeltaYMm) * 10) / 10,
            };
          });

          hasMovedRef.current = true;
          onUpdateElements?.(updatedElements, false);
          return;
        }

        // B. Single element drag
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
          thresholdMm: 1.2,
        });

        setActiveGuides(snapped.guides);
        hasMovedRef.current = true;
        onUpdateElement?.({
          ...activeEl,
          xMm: snapped.xMm,
          yMm: snapped.yMm,
        }, false);
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
          minH: 2,
        });

        const activeEl = sideData.elements.find((el) => el.id === resizingState.elId);
        if (activeEl) {
          hasResizedRef.current = true;
          onUpdateElement?.({
            ...activeEl,
            ...resized,
          }, false);
        }
        return;
      }

      // 3. Marquee Box Multi-Selection
      if (marqueeBox?.active) {
        setMarqueeBox((prev) => (prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null));

        if (trimContainerRef.current) {
          const trimRect = trimContainerRef.current.getBoundingClientRect();
          const leftPx = Math.min(marqueeBox.startX, e.clientX);
          const rightPx = Math.max(marqueeBox.startX, e.clientX);
          const topPx = Math.min(marqueeBox.startY, e.clientY);
          const bottomPx = Math.max(marqueeBox.startY, e.clientY);

          if (rightPx - leftPx > 3 || bottomPx - topPx > 3) {
            const minXMm = (leftPx - trimRect.left) / mmToPx;
            const maxXMm = (rightPx - trimRect.left) / mmToPx;
            const minYMm = (topPx - trimRect.top) / mmToPx;
            const maxYMm = (bottomPx - trimRect.top) / mmToPx;

            const marqueeSelected = sideData.elements
              .filter((el) => {
                const elRight = el.xMm + el.widthMm;
                const elBottom = el.yMm + el.heightMm;
                return (
                  el.xMm < maxXMm &&
                  elRight > minXMm &&
                  el.yMm < maxYMm &&
                  elBottom > minYMm
                );
              })
              .map((el) => el.id);

            const merged = Array.from(
              new Set([...(marqueeBox.initialSelectedIds || []), ...marqueeSelected])
            );
            onSelectElements?.(merged);
          }
        }
      }
    };

    const handleMouseUp = () => {
      if (hasMovedRef.current || hasResizedRef.current) {
        onCommitHistory?.();
        hasMovedRef.current = false;
        hasResizedRef.current = false;
      }
      setDraggingElId(null);
      setDragStartPos(null);
      setResizingState(null);
      setActiveGuides([]);
      setMarqueeBox(null);
    };

    if (draggingElId || resizingState || marqueeBox?.active) {
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
    marqueeBox,
    effectiveSelectedIds,
    mmToPx,
    cardW,
    cardH,
    safeMargin,
    onUpdateElement,
    onUpdateElements,
    onSelectElements,
    onCommitHistory,
    sideData.elements,
  ]);

  // Keyboard Nudge (Arrow Keys) & Precision Navigation
  useEffect(() => {
    if (effectiveSelectedIds.length === 0) return;
    const handleKeyDown = (e) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target?.tagName)) return;

      const stepMm = e.shiftKey ? 0.1 : 0.5;
      let deltaX = 0;
      let deltaY = 0;
      if (e.key === "ArrowLeft") deltaX = -stepMm;
      else if (e.key === "ArrowRight") deltaX = stepMm;
      else if (e.key === "ArrowUp") deltaY = -stepMm;
      else if (e.key === "ArrowDown") deltaY = stepMm;

      if (deltaX !== 0 || deltaY !== 0) {
        e.preventDefault();
        if (effectiveSelectedIds.length > 1) {
          const updated = sideData.elements
            .filter((el) => effectiveSelectedIds.includes(el.id))
            .map((el) => ({
              ...el,
              xMm: Math.round((el.xMm + deltaX) * 10) / 10,
              yMm: Math.round((el.yMm + deltaY) * 10) / 10,
            }));
          onUpdateElements?.(updated);
        } else {
          const activeEl = sideData.elements.find((el) => el.id === effectiveSelectedIds[0]);
          if (activeEl) {
            onUpdateElement?.({
              ...activeEl,
              xMm: Math.round((activeEl.xMm + deltaX) * 10) / 10,
              yMm: Math.round((activeEl.yMm + deltaY) * 10) / 10,
            });
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [effectiveSelectedIds, sideData.elements, onUpdateElement, onUpdateElements]);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleCanvasMouseDown}
      className="w-full h-full min-h-[520px] bg-surface-canvas overflow-auto flex items-center justify-center p-8 relative select-none"
    >
      {/* 1. TOP FLOATING QUICK-FLIP & UNDO/REDO TOOLBAR */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-surface-container/95 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-border-subtle shrink-0 whitespace-nowrap min-w-max">
        {/* Undo / Redo Group */}
        <div className="flex items-center gap-1 bg-surface-subtle p-1 rounded-lg border border-border-subtle shrink-0">
          <button
            type="button"
            id="btn-canvas-undo"
            onClick={(e) => {
              e.stopPropagation();
              onUndo?.();
            }}
            disabled={!canUndo}
            className={`p-1.5 rounded-md transition-all shrink-0 ${
              canUndo
                ? "text-on-surface hover:bg-surface-container hover:text-primary cursor-pointer shadow-xs"
                : "text-outline/40 cursor-not-allowed opacity-50"
            }`}
            title="Hoàn tác (Ctrl/Cmd+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            id="btn-canvas-redo"
            onClick={(e) => {
              e.stopPropagation();
              onRedo?.();
            }}
            disabled={!canRedo}
            className={`p-1.5 rounded-md transition-all shrink-0 ${
              canRedo
                ? "text-on-surface hover:bg-surface-container hover:text-primary cursor-pointer shadow-xs"
                : "text-outline/40 cursor-not-allowed opacity-50"
            }`}
            title="Làm lại (Ctrl/Cmd+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-5 w-px bg-border-subtle shrink-0" />

        {/* Front / Back Toggle Buttons */}
        <div className="flex items-center gap-1 bg-surface-subtle p-1 rounded-lg border border-border-subtle shrink-0">
          <button
            type="button"
            id="btn-canvas-side-front"
            onClick={(e) => {
              e.stopPropagation();
              onChangeSide?.("front");
            }}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
              activeSide === "front"
                ? "bg-surface-container text-primary shadow-xs border border-border-subtle/50"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
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
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
              activeSide === "back"
                ? "bg-surface-container text-primary shadow-xs border border-border-subtle/50"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {t("sideBack")}
          </button>
        </div>

        {/* Quick Flip Action Button */}
        <button
          type="button"
          id="btn-canvas-quick-flip"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSide?.();
          }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer group shrink-0 whitespace-nowrap"
          title={t("flipCard")}
        >
          <RotateCw className="w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-180 shrink-0" />
          <span className="whitespace-nowrap">{t("flipCard")}</span>
        </button>

        {/* Card Side Indicator Badge */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-on-surface-variant font-medium pl-2.5 border-l border-border-subtle shrink-0 whitespace-nowrap">
          <Layers className="w-3.5 h-3.5 text-outline shrink-0" />
          <span className="whitespace-nowrap">{activeSide === "front" ? t("currentSideFront") : t("currentSideBack")}</span>
        </div>
      </div>

      {/* Marquee Selection Drag Box Overlay */}
      {marqueeBox?.active && (() => {
        const left = Math.min(marqueeBox.startX, marqueeBox.currentX);
        const top = Math.min(marqueeBox.startY, marqueeBox.currentY);
        const width = Math.abs(marqueeBox.currentX - marqueeBox.startX);
        const height = Math.abs(marqueeBox.currentY - marqueeBox.startY);
        if (width < 3 && height < 3) return null;
        return (
          <div
            className="marquee-selection-box fixed border-2 border-dashed border-primary bg-primary/15 rounded-xs pointer-events-none z-50 transition-none"
            style={{ left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px` }}
          />
        );
      })()}

      {/* Centered Card Artwork Container with Flip Transition */}
      <div
        className={`relative shadow-2xl transition-all duration-300 ${
          isFlipping ? "scale-95 opacity-90" : "scale-100 opacity-100"
        }`}
        style={{
          width: `${(cardW + bleed * 2) * mmToPx}px`,
          height: `${(cardH + bleed * 2) * mmToPx}px`,
        }}
      >
        {/* Quick Flip Badge at Top-Right of Card */}
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

        {/* 1. BLEED GUIDE AREA (3mm on each side) */}
        {showBleedGuide && (
          <div
            className="absolute inset-0 border border-dashed border-red-400/80 pointer-events-none z-30"
            title="塗り足し線 (3mm外側) - 背景はこの枠まで延ばします"
          >
            <span className="absolute -top-4 left-0 text-[10px] font-mono text-red-600 bg-surface-container/90 px-1 rounded shadow-xs">
              塗り足し線 ({cardW + bleed * 2} × {cardH + bleed * 2}mm)
            </span>
          </div>
        )}

        {/* 2. ACTUAL TRIM / FINISHED CARD AREA (91x55mm) */}
        <div
          ref={trimContainerRef}
          className={`absolute rounded-sm overflow-hidden transition-colors ${
            sideData.paperTexture === "washi"
              ? "paper-texture-washi"
              : sideData.paperTexture === "kraft"
              ? "paper-texture-kraft"
              : "bg-surface-container"
          }`}
          style={{
            left: `${bleed * mmToPx}px`,
            top: `${bleed * mmToPx}px`,
            width: `${cardW * mmToPx}px`,
            height: `${cardH * mmToPx}px`,
            backgroundColor: sideData.backgroundColor || "#ffffff",
          }}
        >
          {/* TRIM LINE GUIDE (Cyan cut line) */}
          {showTrimGuide && (
            <div
              className="absolute inset-0 border border-cyan-500 pointer-events-none z-20"
              title="仕上がり線 (断裁線) - 実際の名刺サイズ"
            />
          )}

          {/* SAFE AREA GUIDE (Green dashed margin line 3mm inside) */}
          {showSafeGuide && (
            <div
              className="absolute border border-dashed border-emerald-500/80 pointer-events-none z-20"
              style={{
                left: `${safeMargin * mmToPx}px`,
                top: `${safeMargin * mmToPx}px`,
                right: `${safeMargin * mmToPx}px`,
                bottom: `${safeMargin * mmToPx}px`,
              }}
              title="セーフエリア - 重要文字・ロゴを収める推奨エリア"
            >
              <span className="absolute bottom-1 right-1 text-[9px] font-mono text-emerald-700 bg-surface-container/80 px-1 rounded">
                安全マージン 3mm
              </span>
            </div>
          )}

          {/* 3. SMART ALIGNMENT GUIDELINES OVERLAY */}
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

          {/* RENDER ACTIVE SIDE DESIGN ELEMENTS */}
          {sideData.elements.map((el) => {
            const isSelected = effectiveSelectedIds.includes(el.id);
            return (
              <div
                key={el.id}
                onMouseDown={(e) => handleMouseDownOnElement(el, e)}
              >
                <ElementRenderer
                  element={el}
                  isSelected={isSelected}
                  showHandles={isSelected && !isMultiSelected}
                  onSelect={(_e, isMulti) => {
                    if (isMulti) {
                      const next = effectiveSelectedIds.includes(el.id)
                        ? effectiveSelectedIds.filter((id) => id !== el.id)
                        : [...effectiveSelectedIds, el.id];
                      onSelectElements?.(next);
                    } else {
                      onSelectElement?.(el.id);
                      onSelectElements?.([el.id]);
                    }
                  }}
                  onStartResize={handleStartResize}
                  scale={scale}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
