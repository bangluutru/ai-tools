import React from "react";
import { FileText, Wand2, Palette, Check } from "lucide-react";
import { useLanguage } from "../../utils/business-card/LanguageContext.jsx";
export const WorkflowSteps = ({ currentStep, onStepClick }) => {
  const { t } = useLanguage();
  const steps = [
    {
      id: "input",
      title: t("step1Title"),
      sub: t("step1Sub"),
      icon: FileText
    },
    {
      id: "generate",
      title: t("step2Title"),
      sub: t("step2Sub"),
      icon: Wand2
    },
    {
      id: "editor",
      title: t("step3Title"),
      sub: t("step3Sub"),
      icon: Palette
    }
  ];
  const getStepIndex = (stepId) => steps.findIndex((s) => s.id === stepId);
  const currentIndex = getStepIndex(currentStep);
  return <div className="w-full bg-surface-canvas border-b border-border-subtle py-2.5 px-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {steps.map((step, idx) => {
    const isCompleted = idx < currentIndex;
    const isCurrent = step.id === currentStep;
    const Icon = step.icon;
    return <React.Fragment key={step.id}>
              <button
      onClick={() => onStepClick(step.id)}
      className={`flex items-center gap-2 group transition-all text-left focus:outline-none ${isCurrent ? "text-primary font-bold" : isCompleted ? "text-on-surface-variant hover:text-on-surface font-medium" : "text-outline hover:text-on-surface-variant"}`}
    >
                <div
      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all ${isCurrent ? "bg-primary-container text-white shadow-sm ring-4 ring-primary/20" : isCompleted ? "bg-emerald-500 text-white" : "bg-surface-subtle text-on-surface-variant group-hover:bg-slate-300"}`}
    >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                </div>
                <div className="hidden sm:block">
                  <div className="text-xs leading-none">{step.title}</div>
                  <div className="text-[10px] text-outline font-normal leading-tight mt-0.5">
                    {step.sub}
                  </div>
                </div>
              </button>

              {idx < steps.length - 1 && <div
      className={`h-0.5 flex-1 mx-2 sm:mx-4 transition-colors ${idx < currentIndex ? "bg-emerald-400" : "bg-surface-subtle"}`}
    />}
            </React.Fragment>;
  })}
      </div>
    </div>;
};
