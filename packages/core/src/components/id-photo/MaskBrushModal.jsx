"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from '../../utils/id-photo/i18n/index.jsx';
import { Eraser, Paintbrush, Undo, Redo, Check, X, ZoomIn, ZoomOut } from "lucide-react";
import { applyBrushToMask } from '../../utils/id-photo/backgroundRemoval.js';
const MaskBrushModal = ({
  isOpen,
  onClose,
  originalImage,
  maskCanvas,
  onApplyMask
}) => {
  const { t } = useTranslation();
  const canvasRef = useRef(null);
  const [mode, setMode] = useState("erase");
  const [brushRadius, setBrushRadius] = useState(20);
  const [brushSoftness, setBrushSoftness] = useState(0.5);
  const [isDrawing, setIsDrawing] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const workingMaskRef = useRef(null);

  const renderEditorCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const workingMask = workingMaskRef.current;
    if (!canvas || !workingMask || !originalImage) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = workingMask.width;
    canvas.height = workingMask.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(originalImage, 0, 0);
    const overlay = document.createElement("canvas");
    overlay.width = canvas.width;
    overlay.height = canvas.height;
    const oCtx = overlay.getContext("2d");
    oCtx.fillStyle = "rgba(239, 68, 68, 0.45)";
    oCtx.fillRect(0, 0, overlay.width, overlay.height);
    oCtx.globalCompositeOperation = "destination-out";
    oCtx.drawImage(workingMask, 0, 0);
    ctx.drawImage(overlay, 0, 0);
  }, [originalImage]);

  useEffect(() => {
    if (!isOpen || !maskCanvas) return;
    const working = document.createElement("canvas");
    working.width = maskCanvas.width;
    working.height = maskCanvas.height;
    const ctx = working.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(maskCanvas, 0, 0);
    workingMaskRef.current = working;
    const initialData = ctx.getImageData(0, 0, working.width, working.height);
    
    requestAnimationFrame(() => {
      setHistory([initialData]);
      setHistoryIndex(0);
      setZoom(1);
      renderEditorCanvas();
    });
  }, [isOpen, maskCanvas, renderEditorCanvas]);

  const saveHistoryState = () => {
    if (!workingMaskRef.current) return;
    const ctx = workingMaskRef.current.getContext("2d", { willReadFrequently: true });
    const data = ctx.getImageData(0, 0, workingMaskRef.current.width, workingMaskRef.current.height);
    const newHist = history.slice(0, historyIndex + 1);
    newHist.push(data);
    if (newHist.length > 15) newHist.shift();
    setHistory(newHist);
    setHistoryIndex(newHist.length - 1);
  };
  const handleUndo = () => {
    if (historyIndex > 0 && workingMaskRef.current) {
      const newIdx = historyIndex - 1;
      const ctx = workingMaskRef.current.getContext("2d", { willReadFrequently: true });
      ctx.putImageData(history[newIdx], 0, 0);
      setHistoryIndex(newIdx);
      renderEditorCanvas();
    }
  };
  const handleRedo = () => {
    if (historyIndex < history.length - 1 && workingMaskRef.current) {
      const newIdx = historyIndex + 1;
      const ctx = workingMaskRef.current.getContext("2d", { willReadFrequently: true });
      ctx.putImageData(history[newIdx], 0, 0);
      setHistoryIndex(newIdx);
      renderEditorCanvas();
    }
  };
  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;
    if ("touches" in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ("clientX" in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };
  const handlePointerDown = (e) => {
    const coords = getCanvasCoordinates(e);
    if (!coords || !workingMaskRef.current) return;
    setIsDrawing(true);
    applyBrushToMask(
      workingMaskRef.current,
      coords.x,
      coords.y,
      brushRadius,
      mode,
      brushSoftness
    );
    renderEditorCanvas();
  };
  const handlePointerMove = (e) => {
    if (!isDrawing || !workingMaskRef.current) return;
    const coords = getCanvasCoordinates(e);
    if (!coords) return;
    applyBrushToMask(
      workingMaskRef.current,
      coords.x,
      coords.y,
      brushRadius,
      mode,
      brushSoftness
    );
    renderEditorCanvas();
  };
  const handlePointerUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveHistoryState();
    }
  };
  const handleSave = () => {
    if (workingMaskRef.current) {
      onApplyMask(workingMaskRef.current);
    }
    onClose();
  };
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-2 sm:p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[96vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-slate-900 text-white shadow-2xl ring-1 ring-white/10">
        {
    /* Header */
  }
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <div className="flex items-center gap-2">
            <Paintbrush className="h-4 w-4 text-blue-400" />
            <h3 className="font-semibold text-sm sm:text-base">{t.maskModalTitle}</h3>
          </div>
          <button
    onClick={onClose}
    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
  >
            <X className="h-5 w-5" />
          </button>
        </div>

        {
    /* Toolbar */
  }
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-900/90 px-4 py-2.5 text-xs">
          {
    /* Tool Selection */
  }
          <div className="flex items-center gap-1.5 rounded-lg bg-slate-800 p-1">
            <button
    onClick={() => setMode("erase")}
    className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition ${mode === "erase" ? "bg-rose-600 text-white shadow-xs" : "text-slate-300 hover:text-white"}`}
  >
              <Eraser className="h-3.5 w-3.5" />
              <span>{t.brushErase}</span>
            </button>
            <button
    onClick={() => setMode("restore")}
    className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition ${mode === "restore" ? "bg-blue-600 text-white shadow-xs" : "text-slate-300 hover:text-white"}`}
  >
              <Paintbrush className="h-3.5 w-3.5" />
              <span>{t.brushRestore}</span>
            </button>
          </div>

          {
    /* Brush Size & Softness Sliders */
  }
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px]">{t.brushSize}</span>
              <input
    type="range"
    min="5"
    max="80"
    value={brushRadius}
    onChange={(e) => setBrushRadius(Number(e.target.value))}
    className="h-1.5 w-20 cursor-pointer accent-blue-500 sm:w-28"
  />
              <span className="w-5 text-[11px] text-slate-300">{brushRadius}</span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px]">{t.brushSoftness}</span>
              <input
    type="range"
    min="0"
    max="1"
    step="0.1"
    value={brushSoftness}
    onChange={(e) => setBrushSoftness(Number(e.target.value))}
    className="h-1.5 w-16 cursor-pointer accent-blue-500"
  />
            </div>
          </div>

          {
    /* Undo / Redo & Zoom */
  }
          <div className="flex items-center gap-1.5">
            <button
    onClick={handleUndo}
    disabled={historyIndex <= 0}
    className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800 disabled:opacity-30"
    title={t.undo}
  >
              <Undo className="h-4 w-4" />
            </button>
            <button
    onClick={handleRedo}
    disabled={historyIndex >= history.length - 1}
    className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800 disabled:opacity-30"
    title={t.redo}
  >
              <Redo className="h-4 w-4" />
            </button>
            <div className="h-4 w-px bg-slate-700 mx-1" />
            <button
    onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
    className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800"
  >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
    onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
    className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800"
  >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
        </div>

        {
    /* Canvas Workspace */
  }
        <div className="relative flex-1 overflow-auto bg-slate-950 p-4 flex items-center justify-center min-h-[350px]">
          <div
    style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
    className="transition-transform duration-75"
  >
            <canvas
    ref={canvasRef}
    onMouseDown={handlePointerDown}
    onMouseMove={handlePointerMove}
    onMouseUp={handlePointerUp}
    onMouseLeave={handlePointerUp}
    onTouchStart={handlePointerDown}
    onTouchMove={handlePointerMove}
    onTouchEnd={handlePointerUp}
    className="max-h-[60vh] max-w-full cursor-crosshair rounded-lg border border-slate-700 shadow-xl"
  />
          </div>
        </div>

        {
    /* Footer */
  }
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900 px-4 py-3">
          <p className="text-[11px] text-slate-400">
            {t.maskBrushTip}
          </p>
          <div className="flex items-center gap-2">
            <button
    type="button"
    onClick={onClose}
    className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
  >
              {t.cancel}
            </button>
            <button
    type="button"
    onClick={handleSave}
    className="flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 shadow-xs"
  >
              <Check className="h-4 w-4" />
              <span>{t.saveMask}</span>
            </button>
          </div>
        </div>
      </div>
    </div>;
};
export {
  MaskBrushModal
};
