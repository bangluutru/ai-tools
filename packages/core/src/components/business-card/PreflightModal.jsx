import {
  X,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Wrench
} from "lucide-react";
import { PreflightVerificationService } from "../../utils/business-card/preflightChecker.js";
import { useLanguage } from "../../utils/business-card/LanguageContext.jsx";
export const PreflightModal = ({
  isOpen,
  onClose,
  project,
  preflight,
  onUpdateProject
}) => {
  const { t, language } = useLanguage();
  if (!isOpen) return null;
  const handleFixIssue = (issue) => {
    const fixed = PreflightVerificationService.applyAutoFix(project, issue);
    onUpdateProject(fixed);
  };
  return <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface-container-high rounded-3xl max-w-2xl w-full border border-border-subtle shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {
    /* Modal Header */
  }
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-surface-canvas">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${preflight.passed ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-on-surface">
                {t("pfTitle")}
              </h2>
              <p className="text-xs text-on-surface-variant">
                {t("pfSub")}
              </p>
            </div>
          </div>

          <button
            id="btn-close-preflight"
            onClick={onClose}
            className="p-1.5 rounded-lg text-outline hover:text-on-surface-variant hover:bg-surface-subtle transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {
    /* Score Banner */
  }
        <div className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              {t("pfScoreLabel")}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-bold font-mono text-emerald-400">{preflight.score}</span>
              <span className="text-outline text-sm">/ 100 {t("scoreUnit")}</span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              {preflight.passed ? t("pfPassMsg") : t("pfWarnMsg")}
            </p>
          </div>

          <div className="text-right">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${preflight.passed ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-amber-500/20 text-amber-300 border border-amber-500/30"}`}>
              {preflight.passed ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              <span>{preflight.passed ? t("pfStatusPass") : t("pfStatusWarn")}</span>
            </div>
          </div>
        </div>

        {
    /* Print Rules Guide Graphic */
  }
        <div className="px-6 py-3 bg-surface-subtle/70 border-b border-border-subtle flex items-center justify-around text-[11px] text-on-surface-variant">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span>{t("pfGuideBleed")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
            <span>{t("pfGuideTrim")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>{t("pfGuideSafe")}</span>
          </div>
        </div>

        {
    /* Issues List */
  }
        <div className="p-6 max-h-80 overflow-y-auto space-y-3">
          {preflight.issues.length === 0 ? <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-on-surface text-sm">{t("pfNoIssues")}</p>
              <p className="text-xs text-on-surface-variant mt-1">
                {t("pfNoIssuesSub")}
              </p>
            </div> : preflight.issues.map((issue) => <div
    key={issue.id}
    className={`p-3.5 rounded-2xl border flex items-start justify-between gap-3 text-xs transition-all ${issue.severity === "critical" ? "bg-red-50/60 border-red-200 text-red-900" : issue.severity === "warning" ? "bg-amber-50/60 border-amber-200 text-amber-900" : "bg-blue-50/60 border-blue-200 text-blue-900"}`}
  >
                <div className="flex items-start gap-2.5">
                  {issue.severity === "critical" ? <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />}
                  <div>
                    <div className="font-bold text-on-surface flex items-center gap-2">
                      <span>{language === "en" ? issue.title : issue.titleJp}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-container-high/80 border text-on-surface-variant">
                        {issue.side === "front" ? t("frontSide") : t("backSide")}
                      </span>
                    </div>
                    <p className="text-on-surface-variant text-[11px] mt-0.5 leading-normal">
                      {language === "en" ? issue.description : issue.descriptionJp}
                    </p>
                  </div>
                </div>

                {issue.autoFixAvailable && <button
    onClick={() => handleFixIssue(issue)}
    className="flex-shrink-0 flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-surface-container-high border border-border-subtle hover:bg-primary/10 hover:border-brand-300 hover:text-primary text-on-surface-variant shadow-xs transition-colors"
  >
                    <Wrench className="w-3 h-3" />
                    <span>{t("btnAutoFix")}</span>
                  </button>}
              </div>)}
        </div>

        {
    /* Modal Footer */
  }
        <div className="px-6 py-3 border-t border-border-subtle bg-surface-canvas flex items-center justify-end">
          <button
    id="btn-close-preflight"
    onClick={onClose}
    className="px-5 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-colors"
  >
            {t("btnClose")}
          </button>
        </div>
      </div>
    </div>;
};
