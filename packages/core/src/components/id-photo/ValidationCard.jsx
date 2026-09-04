"use client";
import { useTranslation } from '../../utils/id-photo/i18n/index.jsx';
import { CheckCircle2, AlertTriangle, Info, Sparkles, Check } from "lucide-react";
const ValidationCard = ({
  validation,
  onAutoAlign
}) => {
  const { t, language } = useTranslation();
  const isAllValid = validation.hasFace && validation.isTiltAcceptable && validation.isFaceRatioAcceptable && validation.isResolutionAcceptable;
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-3.5">
      {
    /* Header */
  }
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isAllValid ? <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Check className="h-4 w-4 stroke-[3]" />
            </div> : <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <AlertTriangle className="h-4 w-4 stroke-[2.5]" />
            </div>}
          <h3 className="text-xs sm:text-sm font-bold text-slate-900">
            {t.validationTitle}
          </h3>
        </div>

        {
    /* 1-Click Auto Align Button */
  }
        <button
    type="button"
    onClick={onAutoAlign}
    className="flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-600/20 hover:bg-blue-100 active:scale-95 transition"
  >
          <Sparkles className="h-3.5 w-3.5 text-blue-600" />
          <span>{t.autoAlignBtn}</span>
        </button>
      </div>

      {
    /* Metrics Row */
  }
      <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-2.5 text-center text-xs">
        {
    /* Head Tilt */
  }
        <div className="space-y-0.5">
          <span className="text-[10px] text-slate-500 font-medium">{t.valTiltLabel}</span>
          <div className="flex items-center justify-center gap-1 font-mono font-bold">
            <span
    className={validation.isTiltAcceptable ? "text-emerald-700" : "text-amber-600"}
  >
              {validation.tiltAngleDeg}°
            </span>
            {validation.isTiltAcceptable ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
          </div>
        </div>

        {
    /* Face Height Ratio */
  }
        <div className="space-y-0.5 border-x border-slate-200">
          <span className="text-[10px] text-slate-500 font-medium">{t.valSizeLabel}</span>
          <div className="flex items-center justify-center gap-1 font-mono font-bold">
            <span
    className={validation.isFaceRatioAcceptable ? "text-emerald-700" : "text-amber-600"}
  >
              {validation.faceHeightRatio}%
            </span>
            {validation.isFaceRatioAcceptable ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
          </div>
        </div>

        {
    /* Print DPI */
  }
        <div className="space-y-0.5">
          <span className="text-[10px] text-slate-500 font-medium">{t.valDpiLabel}</span>
          <div className="flex items-center justify-center gap-1 font-mono font-bold">
            <span
    className={validation.isResolutionAcceptable ? "text-emerald-700" : "text-amber-600"}
  >
              {validation.effectiveDpi} DPI
            </span>
            {validation.isResolutionAcceptable ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
          </div>
        </div>
      </div>

      {
    /* Warnings & Suggestions List */
  }
      {validation.warnings.length > 0 ? <div className="space-y-2">
          {validation.warnings.map((warn, i) => <div
    key={i}
    className={`flex items-start gap-2 rounded-xl p-2.5 text-xs ${warn.severity === "error" ? "bg-rose-50 text-rose-800 border border-rose-200" : warn.severity === "warning" ? "bg-amber-50 text-amber-900 border border-amber-200" : "bg-blue-50 text-blue-800 border border-blue-200"}`}
  >
              {warn.severity === "warning" ? <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" /> : warn.severity === "error" ? <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" /> : <Info className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />}
              <p className="leading-snug">
                {warn.message[language] || warn.message.ja}
              </p>
            </div>)}
        </div> : <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-2.5 text-xs text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{t.valAllGood}</span>
        </div>}
    </div>;
};
export {
  ValidationCard
};
