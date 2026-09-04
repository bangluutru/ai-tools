"use client";
import React from 'react';
import { useTranslation } from '../../utils/id-photo/i18n/index.jsx';
import { Upload, Sparkles, Crop, Printer, Check } from "lucide-react";

const StepWizard = ({
  currentStep,
  onStepClick,
  maxReachedStep,
}) => {
  const { t } = useTranslation();
  const steps = [
    { num: 1, label: t.step1, icon: Upload },
    { num: 2, label: t.step2, icon: Sparkles },
    { num: 3, label: t.step3, icon: Crop },
    { num: 4, label: t.step4, icon: Printer },
  ];

  return (
    <nav aria-label="Progress" className="w-full bg-surface-container border border-border-subtle rounded-xl py-3 px-4 sm:py-4 sm:px-6 shadow-sm">
      <div className="mx-auto max-w-4xl">
        <ol className="flex items-center justify-between">
          {steps.map((step, idx) => {
            const isCurrent = currentStep === step.num;
            const isCompleted = step.num < currentStep;
            const isClickable = step.num <= maxReachedStep;
            const Icon = step.icon;

            return (
              <li key={step.num} className="relative flex flex-1 items-center">
                {/* Connecting bar */}
                {idx > 0 && (
                  <div
                    className={`absolute top-4 -left-1/2 w-full h-0.5 -translate-y-1/2 transition-colors sm:top-5 ${
                      step.num <= currentStep ? "bg-primary-container" : "bg-border-subtle"
                    }`}
                    style={{ zIndex: 0 }}
                  />
                )}

                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && onStepClick(step.num)}
                  className={`group relative z-10 flex flex-col items-center mx-auto text-center transition-all ${
                    isClickable ? "cursor-pointer hover:opacity-90" : "cursor-not-allowed opacity-50"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all sm:h-10 sm:w-10 sm:text-sm ${
                      isCompleted
                        ? "bg-secondary text-surface-canvas shadow-xs"
                        : isCurrent
                        ? "bg-primary-container text-on-primary-container ring-4 ring-primary-container/20 shadow-md"
                        : "bg-surface-subtle text-on-surface-variant border border-border-subtle"
                    }`}
                  >
                    {isCompleted ? <Check className="h-4 w-4 stroke-[3]" /> : <Icon className="h-4 w-4" />}
                  </span>
                  <span
                    className={`mt-1.5 text-[11px] font-medium tracking-tight sm:text-xs ${
                      isCurrent
                        ? "font-bold text-primary"
                        : isCompleted
                        ? "text-on-surface"
                        : "text-on-surface-variant"
                    }`}
                  >
                    {step.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
};

export { StepWizard };
