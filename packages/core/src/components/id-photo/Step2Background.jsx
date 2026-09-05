"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from '../../utils/id-photo/i18n/index.jsx';
import {
  generateSubjectMask,
  renderCompositeImage
} from '../../utils/id-photo/backgroundRemoval.js';
import { MaskBrushModal } from './MaskBrushModal.jsx';
import {
  Sparkles,
  Palette,
  Paintbrush,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
  Sliders,
  Zap,
  RefreshCw
} from "lucide-react";
const Step2Background = ({
  originalImage,
  onCompositeReady,
  onBack
}) => {
  const { t, format } = useTranslation();
  const previewCanvasRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [progressMsg, setProgressMsg] = useState(t.processingAi);
  const [progressPercent, setProgressPercent] = useState(20);
  const [engine, setEngine] = useState("imgly_hd");
  const [engineUsed, setEngineUsed] = useState("imgly_hd");
  const [maskCanvas, setMaskCanvas] = useState(null);
  const [selectedBgColor, setSelectedBgColor] = useState("#FFFFFF");
  const [useVignette, setUseVignette] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isFallback, setIsFallback] = useState(false);
  const [threshold, _setThreshold] = useState(0.45);
  const [featherPx, setFeatherPx] = useState(1.2);
  const [chokePx, setChokePx] = useState(0.8);
  const [defringe, setDefringe] = useState(true);
  const [isBrushModalOpen, setIsBrushModalOpen] = useState(false);
  const colorPresets = [
    { label: t.colorWhite, value: "#FFFFFF", border: true },
    { label: t.colorLightBlue, value: "#5A9BD5" },
    { label: t.colorBlue, value: "#2563EB" },
    { label: t.colorGray, value: "#E5E7EB" }
  ];
  useEffect(() => {
    let isMounted = true;
    async function runSegmentation() {
      setIsProcessing(true);
      setProgressPercent(10);
      setProgressMsg(t.loadingModel);
      setIsFallback(false);
      try {
        const result = await generateSubjectMask(originalImage, {
          engine,
          threshold,
          onProgress: (p) => {
            if (isMounted) {
              setProgressPercent(p);
              setProgressMsg(format(t.extractingSubject, { percent: p }));
            }
          }
        });
        if (isMounted) {
          setMaskCanvas(result.maskCanvas);
          setEngineUsed(result.engineUsed);
          if (result.isFallback) {
            setIsFallback(true);
          }
        }
      } catch (err) {
        console.error("Segmentation error:", err);
      } finally {
        if (isMounted) {
          setIsProcessing(false);
        }
      }
    }
    runSegmentation();
    return () => {
      isMounted = false;
    };
  }, [originalImage, engine, retryCount, threshold, t.loadingModel, t.extractingSubject, format]);
  useEffect(() => {
    if (!maskCanvas || !previewCanvasRef.current) return;
    const composite = renderCompositeImage(
      originalImage,
      maskCanvas,
      selectedBgColor,
      useVignette,
      featherPx,
      chokePx,
      defringe
    );
    const preview = previewCanvasRef.current;
    preview.width = composite.width;
    preview.height = composite.height;
    const ctx = preview.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, preview.width, preview.height);
      ctx.drawImage(composite, 0, 0);
    }
  }, [originalImage, maskCanvas, selectedBgColor, useVignette, featherPx, chokePx, defringe]);
  const handleNext = () => {
    if (!maskCanvas) return;
    const finalComposite = renderCompositeImage(
      originalImage,
      maskCanvas,
      selectedBgColor,
      useVignette,
      featherPx,
      chokePx,
      defringe
    );
    onCompositeReady(finalComposite, maskCanvas, selectedBgColor, useVignette);
  };
  const handleApplyEditedMask = (newMask) => {
    setMaskCanvas(newMask);
  };
  return <div className="mx-auto max-w-5xl space-y-6">
      {
    /* Title */
  }
      <div className="text-center">
        <h2 className="text-xl font-bold tracking-tight text-on-surface sm:text-2xl">
          {t.bgTitle}
        </h2>
        <p className="mt-1 text-xs text-on-surface-variant sm:text-sm">
          {t.bgSubtitle}
        </p>
      </div>

      {/* Engine Switcher Bar */}
      <div className="mx-auto flex max-w-lg items-center justify-center rounded-2xl border border-border-subtle bg-surface-container p-1.5 shadow-xs">
        <button
          type="button"
          onClick={() => setEngine("imgly_hd")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-bold transition ${engine === "imgly_hd" ? "bg-primary-container text-on-primary-container shadow-xs" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-subtle"}`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>{t.engineStudioHd}</span>
        </button>

        <button
          type="button"
          onClick={() => setEngine("mediapipe_fast")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-bold transition ${engine === "mediapipe_fast" ? "bg-primary-container text-on-primary-container shadow-xs" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-subtle"}`}
        >
          <Zap className="h-3.5 w-3.5" />
          <span>{t.engineMediaPipe}</span>
        </button>
      </div>

      {/* Main Grid: Preview on Left, Options on Right */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12 items-start">
        {/* Left: Live Cutout Preview */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border-subtle bg-surface-container p-4 sm:p-6 md:col-span-6">
          <div className="relative aspect-3/4 w-full max-w-[340px] overflow-hidden rounded-xl border border-border-subtle bg-surface-subtle shadow-md">
            {isProcessing ? (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-surface-subtle p-6 text-center text-on-surface-variant">
                <Loader2 className="h-8 w-8 animate-spin text-brand-cyan-bright" />
                <p className="text-xs font-bold text-on-surface">{progressMsg}</p>
                {/* Progress bar */}
                <div className="w-48 bg-surface-container-high h-1.5 rounded-full overflow-hidden mt-1">
                  <div
                    className="bg-brand-cyan-bright h-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-[11px] text-on-surface-variant/80">
                  {engine === "imgly_hd" ? t.engineStudioHdDesc : t.engineFastDesc}
                </span>
              </div>
            ) : (
              <canvas
                ref={previewCanvasRef}
                className="h-full w-full object-cover"
              />
            )}
          </div>

          {/* Action Row Under Canvas */}
          {!isProcessing && maskCanvas && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setIsBrushModalOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-border-subtle bg-surface-subtle px-3.5 py-2 text-xs font-semibold text-on-surface shadow-2xs hover:bg-surface-container-high hover:text-brand-cyan-bright active:scale-95 transition"
              >
                <Paintbrush className="h-3.5 w-3.5 text-brand-cyan-bright" />
                <span>{t.refineMaskBtn}</span>
              </button>

              <button
                type="button"
                onClick={() => setRetryCount((c) => c + 1)}
                title={t.reExtractBtn}
                className="flex items-center gap-1.5 rounded-lg border border-border-subtle bg-surface-subtle px-3 py-2 text-xs font-medium text-on-surface-variant shadow-2xs hover:bg-surface-container-high hover:text-on-surface active:scale-95 transition"
              >
                <RefreshCw className="h-3.5 w-3.5 text-on-surface-variant" />
                <span>{t.reExtractBtn}</span>
              </button>

              {isFallback ? (
                <span className="rounded-md bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 text-[11px] font-bold text-amber-400">
                  {t.fallbackBadge}
                </span>
              ) : (
                <span className="rounded-md bg-secondary/15 border border-secondary/30 px-2.5 py-1 text-[11px] font-bold text-secondary">
                  {engineUsed === "imgly_hd" ? "✨ Studio HD" : "⚡ MediaPipe Fast"} {t.appliedBadge}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right: Color Selection & Advanced Matting Controls */}
        <div className="space-y-4 md:col-span-6">
          {/* Preset Palettes */}
          <div className="rounded-2xl border border-border-subtle bg-surface-container p-4 sm:p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <Palette className="h-4 w-4 text-brand-cyan-bright" />
              <h3 className="text-sm font-bold text-on-surface">
                {t.colorPaletteTitle}
              </h3>
            </div>

            <div className="space-y-2">
              {colorPresets.map((preset) => {
                const isSelected = selectedBgColor.toLowerCase() === preset.value.toLowerCase();
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setSelectedBgColor(preset.value)}
                    className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition ${isSelected ? "border-brand-cyan-bright bg-primary-container/20 ring-1 ring-brand-cyan-bright/50 shadow-2xs" : "border-border-subtle bg-surface-subtle/50 hover:border-border-subtle hover:bg-surface-subtle"}`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="h-5 w-5 rounded-full shadow-inner ring-1 ring-border-subtle"
                        style={{ backgroundColor: preset.value }}
                      />
                      <span className="text-xs font-semibold text-on-surface">
                        {preset.label}
                      </span>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-brand-cyan-bright stroke-[2.5]" />}
                  </button>
                );
              })}

              {/* Custom Color Input */}
              <div className="flex items-center justify-between rounded-xl border border-border-subtle bg-surface-subtle/50 p-2.5">
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={selectedBgColor}
                    onChange={(e) => setSelectedBgColor(e.target.value)}
                    className="h-6 w-6 cursor-pointer rounded-md border-0 bg-transparent"
                  />
                  <span className="text-xs font-semibold text-on-surface">
                    {t.colorCustom}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-on-surface-variant">HEX:</span>
                  <input
                    type="text"
                    value={selectedBgColor}
                    onChange={(e) => setSelectedBgColor(e.target.value)}
                    className="w-20 rounded border border-border-subtle bg-surface-container px-1.5 py-0.5 text-center font-mono text-xs uppercase text-on-surface"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Matting & Clean Boundary Controls */}
          <div className="rounded-2xl border border-border-subtle bg-surface-container p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2 border-b border-border-subtle pb-2">
              <Sliders className="h-4 w-4 text-brand-cyan-bright" />
              <h3 className="text-xs sm:text-sm font-bold text-on-surface">
                {t.mattingTuningTitle}
              </h3>
            </div>

            {/* Edge Choke (Anti-Halo) */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-on-surface-variant">
                <span className="font-medium text-on-surface">{t.chokeLabel}</span>
                <span className="font-mono text-on-surface-variant">{chokePx}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="3"
                step="0.2"
                value={chokePx}
                onChange={(e) => setChokePx(Number(e.target.value))}
                className="h-1.5 w-full cursor-pointer accent-brand-cyan-bright"
              />
              <p className="text-[10px] text-on-surface-variant/80">{t.chokeSub}</p>
            </div>

            {/* Feather Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-on-surface-variant">
                <span className="font-medium text-on-surface">{t.featherOption}</span>
                <span className="font-mono text-on-surface-variant">{featherPx}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="4"
                step="0.2"
                value={featherPx}
                onChange={(e) => setFeatherPx(Number(e.target.value))}
                className="h-1.5 w-full cursor-pointer accent-brand-cyan-bright"
              />
            </div>

            {/* Defringe Checkbox */}
            <label className="flex items-center justify-between cursor-pointer pt-1 border-t border-border-subtle text-xs">
              <div>
                <span className="font-medium text-on-surface">{t.defringeLabel}</span>
                <p className="text-[10px] text-on-surface-variant">{t.defringeSub}</p>
              </div>
              <input
                type="checkbox"
                checked={defringe}
                onChange={(e) => setDefringe(e.target.checked)}
                className="h-4 w-4 rounded border-border-subtle bg-surface-subtle text-brand-cyan-bright focus:ring-brand-cyan-bright"
              />
            </label>

            {/* Vignette Toggle */}
            <label className="flex items-center justify-between cursor-pointer pt-1 text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span className="font-medium text-on-surface">
                  {t.vignetteOption}
                </span>
              </div>
              <input
                type="checkbox"
                checked={useVignette}
                onChange={(e) => setUseVignette(e.target.checked)}
                className="h-4 w-4 rounded border-border-subtle bg-surface-subtle text-brand-cyan-bright focus:ring-brand-cyan-bright"
              />
            </label>
          </div>

          {/* Navigation Action Bar */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 rounded-xl border border-border-subtle bg-surface-subtle px-4 py-2.5 text-xs font-semibold text-on-surface shadow-2xs hover:bg-surface-container-high transition cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{t.prevStep}</span>
            </button>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleNext}
              className="flex items-center gap-1.5 rounded-xl bg-primary-container text-on-primary-container px-6 py-2.5 text-xs font-bold shadow-md hover:bg-primary-container/80 active:scale-95 disabled:opacity-50 transition cursor-pointer"
            >
              <span>{t.nextStep}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {
    /* Manual Mask Brush Modal */
  }
      {isBrushModalOpen && maskCanvas && <MaskBrushModal
    isOpen={isBrushModalOpen}
    onClose={() => setIsBrushModalOpen(false)}
    originalImage={originalImage}
    maskCanvas={maskCanvas}
    onApplyMask={handleApplyEditedMask}
  />}
    </div>;
};
export {
  Step2Background
};
