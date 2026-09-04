"use client";
import { useTranslation } from '../../utils/id-photo/i18n/index.jsx';
import { Upload, Sparkles, Crop, Printer, Check } from "lucide-react";
const StepWizard = ({
  currentStep,
  onStepClick,
  maxReachedStep
}) => {
  const { t } = useTranslation();
  const steps = [
    { num: 1, label: t.step1, icon: Upload },
    { num: 2, label: t.step2, icon: Sparkles },
    { num: 3, label: t.step3, icon: Crop },
    { num: 4, label: t.step4, icon: Printer }
  ];
  return <nav aria-label="Progress" className="w-full bg-white border-b border-slate-200/80 py-2.5 px-3 sm:py-3.5 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <ol className="flex items-center justify-between">
          {steps.map((step, idx) => {
    const isCurrent = currentStep === step.num;
    const isCompleted = step.num < currentStep;
    const isClickable = step.num <= maxReachedStep;
    const Icon = step.icon;
    return <li key={step.num} className="relative flex flex-1 items-center">
                {
      /* Connecting bar */
    }
                {idx > 0 && <div
      className={`absolute top-4 -left-1/2 w-full h-0.5 -translate-y-1/2 transition-colors sm:top-5 ${step.num <= currentStep ? "bg-blue-600" : "bg-slate-200"}`}
      style={{ zIndex: 0 }}
    />}

                <button
      type="button"
      disabled={!isClickable}
      onClick={() => isClickable && onStepClick(step.num)}
      className={`group relative z-10 flex flex-col items-center mx-auto text-center transition-all ${isClickable ? "cursor-pointer hover:opacity-90" : "cursor-not-allowed opacity-50"}`}
    >
                  <span
      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all sm:h-10 sm:w-10 sm:text-sm ${isCompleted ? "bg-blue-600 text-white shadow-xs" : isCurrent ? "bg-blue-600 text-white ring-4 ring-blue-100 shadow-sm" : "bg-slate-100 text-slate-500 border border-slate-300"}`}
    >
                    {isCompleted ? <Check className="h-4 w-4 stroke-[3]" /> : <Icon className="h-4 w-4" />}
                  </span>
                  <span
      className={`mt-1 text-[11px] font-medium tracking-tight sm:text-xs ${isCurrent ? "font-bold text-blue-700" : isCompleted ? "text-slate-700" : "text-slate-400"}`}
    >
                    {step.label}
                  </span>
                </button>
              </li>;
  })}
        </ol>
      </div>
    </nav>;
};
export {
  StepWizard
};
