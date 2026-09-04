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
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 sm:p-5 backdrop-blur-xs">
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {
    /* Header */
  }
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">{t.guideTitle}</h3>
          </div>
          <button
    onClick={onClose}
    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
  >
            <X className="h-5 w-5" />
          </button>
        </div>

        {
    /* Cost Comparison Callout */
  }
        <div className="bg-emerald-50 px-5 py-3 border-b border-emerald-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-800 text-xs sm:text-sm font-semibold">
            <Coins className="h-4 w-4 text-emerald-600" />
            <span>{t.convCostSave}</span>
          </div>
          <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-bold text-white">
            {t.convCostBadge}
          </span>
        </div>

        {
    /* Store Tabs */
  }
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-3">
          <button
    type="button"
    onClick={() => setActiveTab("seven")}
    className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs sm:text-sm font-bold transition ${activeTab === "seven" ? "border-emerald-600 text-emerald-700 bg-white rounded-t-lg" : "border-transparent text-slate-600 hover:text-slate-900"}`}
  >
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>セブン-イレブン (7-Eleven)</span>
          </button>
          <button
    type="button"
    onClick={() => setActiveTab("lawson")}
    className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs sm:text-sm font-bold transition ${activeTab === "lawson" ? "border-blue-600 text-blue-700 bg-white rounded-t-lg" : "border-transparent text-slate-600 hover:text-slate-900"}`}
  >
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <span>ローソン / ファミマ (Lawson / FamilyMart)</span>
          </button>
        </div>

        {
    /* Content Body */
  }
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === "seven" ? <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {t.convSeven}
              </h4>
              <ol className="space-y-2.5 text-xs text-slate-700">
                {t.convSevenSteps.map((step, idx) => <li key={idx} className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>)}
              </ol>
            </div> : <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {t.convLawsonFamima}
              </h4>
              <ol className="space-y-2.5 text-xs text-slate-700">
                {t.convLawsonSteps.map((step, idx) => <li key={idx} className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>)}
              </ol>
            </div>}

          {
    /* Important Print Settings Callout */
  }
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span>{t.convScaleNoteTitle}</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-800 ml-1">
              <li>{t.convScaleNote1}</li>
              <li>{t.convScaleNote2}</li>
            </ul>
          </div>
        </div>

        {
    /* Footer */
  }
        <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 flex justify-end">
          <button
    type="button"
    onClick={onClose}
    className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition"
  >
            {t.close}
          </button>
        </div>
      </div>
    </div>;
};
export {
  ConvenienceStoreModal
};
