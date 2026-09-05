"use client";
import { useState } from "react";
import { useTranslation } from '../../utils/id-photo/i18n/index.jsx';
import { X, AlertCircle, Printer, Coins } from "lucide-react";
const ConvenienceStoreModal = ({
  isOpen,
  onClose
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("seven");
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 sm:p-5 backdrop-blur-xs">
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-surface-container-high border border-border-subtle shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
          <div className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-brand-cyan-bright" />
            <h3 className="text-base font-bold text-on-surface">{t.guideTitle}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-subtle hover:text-on-surface cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cost Comparison Callout */}
        <div className="bg-secondary/10 px-5 py-3 border-b border-secondary/20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-secondary text-xs sm:text-sm font-semibold">
            <Coins className="h-4 w-4 text-secondary" />
            <span>{t.convCostSave}</span>
          </div>
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-surface-canvas">
            {t.convCostBadge}
          </span>
        </div>

        {/* Store Tabs */}
        <div className="flex border-b border-border-subtle bg-surface-subtle px-5 pt-3">
          <button
            type="button"
            onClick={() => setActiveTab("seven")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === "seven"
                ? "border-secondary text-secondary bg-surface-container-high rounded-t-lg"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-secondary" />
            <span>セブン-イレブン (7-Eleven)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("lawson")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === "lawson"
                ? "border-brand-cyan-bright text-brand-cyan-bright bg-surface-container-high rounded-t-lg"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-brand-cyan-bright" />
            <span>ローソン / ファミマ (Lawson / FamilyMart)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === "seven" ? (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                {t.convSeven}
              </h4>
              <ol className="space-y-2.5 text-xs text-on-surface-variant">
                {t.convSevenSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 rounded-xl border border-border-subtle bg-surface-subtle/50 p-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-bold text-surface-canvas">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed text-on-surface">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                {t.convLawsonFamima}
              </h4>
              <ol className="space-y-2.5 text-xs text-on-surface-variant">
                {t.convLawsonSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 rounded-xl border border-border-subtle bg-surface-subtle/50 p-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-container text-[11px] font-bold text-on-primary-container">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed text-on-surface">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Important Print Settings Callout */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-300 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertCircle className="h-4 w-4 text-amber-400" />
              <span>{t.convScaleNoteTitle}</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-200/90 ml-1">
              <li>{t.convScaleNote1}</li>
              <li>{t.convScaleNote2}</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border-subtle bg-surface-subtle px-5 py-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high border border-border-subtle px-4 py-2 text-xs font-semibold transition cursor-pointer"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
export {
  ConvenienceStoreModal
};
