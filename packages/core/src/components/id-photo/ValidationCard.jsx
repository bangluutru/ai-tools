"use client";
import { useTranslation } from '../../utils/id-photo/i18n/index.jsx';
import { CheckCircle2, AlertTriangle, Info, Sparkles, Check } from "lucide-react";
const ValidationCard = ({
  validation,
  onAutoAlign
}) => {
  const { t, language } = useTranslation();
  const isAllValid = validation.hasFace && validation.isTiltAcceptable && validation.isFaceRatioAcceptable && validation.isResolutionAcceptable;
  return <div className="rounded-2xl border border-border-subtle bg-surface-container p-4 sm:p-5 shadow-xs space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isAllValid ? (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary/20 text-secondary">
              <Check className="h-4 w-4 stroke-[3]" />
            </div>
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
              <AlertTriangle className="h-4 w-4 stroke-[2.5]" />
            </div>
          )}
          <h3 className="text-xs sm:text-sm font-bold text-on-surface">
            {t.validationTitle}
          </h3>
        </div>

        {/* 1-Click Auto Align Button */}
        <button
          type="button"
          onClick={onAutoAlign}
          className="flex items-center gap-1 rounded-lg bg-surface-subtle px-2.5 py-1.5 text-xs font-semibold text-brand-cyan-bright border border-border-subtle hover:bg-surface-container-high active:scale-95 transition cursor-pointer"
        >
          <Sparkles className="h-3.5 w-3.5 text-brand-cyan-bright" />
          <span>{t.autoAlignBtn}</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-2 rounded-xl bg-surface-subtle border border-border-subtle/50 p-2.5 text-center text-xs">
        {/* Head Tilt */}
        <div className="space-y-0.5">
          <span className="text-[10px] text-on-surface-variant font-medium">{t.valTiltLabel}</span>
          <div className="flex items-center justify-center gap-1 font-mono font-bold">
            <span className={validation.isTiltAcceptable ? "text-secondary" : "text-amber-400"}>
              {validation.tiltAngleDeg}°
            </span>
            {validation.isTiltAcceptable ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-secondary" />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            )}
          </div>
        </div>

        {/* Face Height Ratio */}
        <div className="space-y-0.5 border-x border-border-subtle">
          <span className="text-[10px] text-on-surface-variant font-medium">{t.valSizeLabel}</span>
          <div className="flex items-center justify-center gap-1 font-mono font-bold">
            <span className={validation.isFaceRatioAcceptable ? "text-secondary" : "text-amber-400"}>
              {validation.faceHeightRatio}%
            </span>
            {validation.isFaceRatioAcceptable ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-secondary" />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            )}
          </div>
        </div>

        {/* Print DPI */}
        <div className="space-y-0.5">
          <span className="text-[10px] text-on-surface-variant font-medium">{t.valDpiLabel}</span>
          <div className="flex items-center justify-center gap-1 font-mono font-bold">
            <span className={validation.isResolutionAcceptable ? "text-secondary" : "text-amber-400"}>
              {validation.effectiveDpi} DPI
            </span>
            {validation.isResolutionAcceptable ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-secondary" />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            )}
          </div>
        </div>
      </div>

      {/* Warnings & Suggestions List */}
      {validation.warnings.length > 0 ? (
        <div className="space-y-2">
          {validation.warnings.map((warn, i) => (
            <div
              key={i}
              className={`flex items-start gap-2 rounded-xl p-2.5 text-xs ${
                warn.severity === "error"
                  ? "bg-error-container/20 text-error border border-error/30"
                  : warn.severity === "warning"
                  ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                  : "bg-primary-container/15 text-brand-cyan-bright border border-primary-container/30"
              }`}
            >
              {warn.severity === "warning" ? (
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
              ) : warn.severity === "error" ? (
                <AlertTriangle className="h-4 w-4 shrink-0 text-error mt-0.5" />
              ) : (
                <Info className="h-4 w-4 shrink-0 text-brand-cyan-bright mt-0.5" />
              )}
              <p className="leading-snug">
                {warn.message[language] || warn.message.ja}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl bg-secondary/15 text-secondary border border-secondary/30 p-2.5 text-xs">
          <CheckCircle2 className="h-4 w-4 text-secondary shrink-0" />
          <span>{t.valAllGood}</span>
        </div>
      )}
    </div>;
};
export {
  ValidationCard
};
