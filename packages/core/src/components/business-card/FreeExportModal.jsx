import { useState } from "react";
import {
  X,
  FileText,
  Archive,
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Printer
} from "lucide-react";
import { BusinessCardPdfExporter, computePrintLayout } from "../../utils/business-card/pdfExporter.js";
import { PrintPackageService, downloadBlob } from "../../utils/business-card/zipPackager.js";
import { useLanguage } from "../../utils/business-card/LanguageContext.jsx";
export const FreeExportModal = ({
  isOpen,
  onClose,
  project,
  preflight
}) => {
  const { t } = useLanguage();
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState(null);
  const [exportErrorMsg, setExportErrorMsg] = useState(null);
  const [printMode, setPrintMode] = useState("tonbo");
  if (!isOpen) return null;
  const layout = computePrintLayout(project, { mode: printMode });
  const baseName = (project.title || "business-card").replace(/[\\/:*?"<>|]+/g, "_");
  const flash = (msg) => {
    setExportErrorMsg(null);
    setExportSuccessMsg(msg);
    setTimeout(() => setExportSuccessMsg(null), 4e3);
  };
  const fail = (err) => {
    console.error("Export error:", err);
    setExportSuccessMsg(null);
    setExportErrorMsg(t("exportFailedMsg"));
  };
  const handleDownloadPdf = async () => {
    try {
      setIsExportingPdf(true);
      const pdfDoc = await BusinessCardPdfExporter.generatePrintPdf(project, { mode: printMode });
      const filename = `${baseName}_300dpi_${printMode === "tonbo" ? "tonbo" : "bleed"}_${layout.pageW}x${layout.pageH}mm.pdf`;
      downloadBlob(pdfDoc.output("blob"), filename);
      flash(t("exportDownloadedMsg").replace("{file}", filename));
    } catch (err) {
      fail(err);
    } finally {
      setIsExportingPdf(false);
    }
  };
  const handleDownloadZip = async () => {
    try {
      setIsExportingZip(true);
      const zipBlob = await PrintPackageService.createPrintBundleZip(project, { mode: printMode });
      const filename = `${baseName}_print_package.zip`;
      downloadBlob(zipBlob, filename);
      flash(t("exportDownloadedMsg").replace("{file}", filename));
    } catch (err) {
      fail(err);
    } finally {
      setIsExportingZip(false);
    }
  };
  const handleDownloadProof = async (side) => {
    try {
      const blob = await BusinessCardPdfExporter.generateProofPngBlob(project, side);
      const filename = `${baseName}_proof_${side}_300dpi.png`;
      downloadBlob(blob, filename);
      flash(t("exportDownloadedMsg").replace("{file}", filename));
    } catch (err) {
      fail(err);
    }
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div
    className="bg-surface-container-high rounded-2xl shadow-2xl max-w-2xl w-full border border-border-subtle overflow-hidden flex flex-col max-h-[90vh]"
    onClick={(e) => e.stopPropagation()}
  >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-surface-container">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-container text-white flex items-center justify-center shadow-md shadow-brand-500/20">
              <Printer className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-on-surface">
                {t("freeExportModalTitle")}
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {t("freeExportModalSub")}
              </p>
            </div>
          </div>
          <button
            id="btn-close-free-export"
            onClick={onClose}
            className="p-1.5 rounded-lg text-outline hover:text-on-surface-variant hover:bg-surface-subtle transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert */}
        {exportSuccessMsg && <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span className="font-medium">{exportSuccessMsg}</span>
          </div>}
        {exportErrorMsg && <div role="alert" className="mx-6 mt-4 p-3 rounded-xl bg-error/10 border border-error/30 text-error text-xs">
            {exportErrorMsg}
          </div>}

        {/* Body Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Preflight status badge */}
          {preflight && <div className="p-3.5 rounded-xl bg-surface-container border border-border-subtle flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-semibold text-on-surface">
                  {t("pfTitle").split("(")[0]}:
                </span>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {preflight.score} / 100 {t("scoreUnit")}
                </span>
              </div>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${preflight.passed ? "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/20" : "text-tertiary bg-tertiary/10 border-tertiary/30"}`}>
                {preflight.passed ? t("pfPassed") : t("pfWarning")}
              </span>
            </div>}

          {/* 3 Core Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl border border-border-subtle bg-surface-container hover:border-primary/40 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2.5">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-on-surface mb-1">
                {t("freeFeature1Title")}
              </h3>
              <p className="text-[11px] text-on-surface-variant leading-normal">
                {t("freeFeature1Desc")}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border-subtle bg-surface-container hover:border-secondary/40 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center mb-2.5">
                <ImageIcon className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-on-surface mb-1">
                {t("freeFeature2Title")}
              </h3>
              <p className="text-[11px] text-on-surface-variant leading-normal">
                {t("freeFeature2Desc")}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border-subtle bg-surface-container hover:border-tertiary/40 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-tertiary/10 text-tertiary flex items-center justify-center mb-2.5">
                <Archive className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-on-surface mb-1">
                {t("freeFeature3Title")}
              </h3>
              <p className="text-[11px] text-on-surface-variant leading-normal">
                {t("freeFeature3Desc")}
              </p>
            </div>
          </div>

          {/* Print layout mode */}
          <fieldset className="p-3.5 rounded-xl border border-border-subtle bg-surface-container space-y-2">
            <legend className="px-1 text-xs font-bold text-on-surface">{t("printModeLabel")}</legend>
            {["tonbo", "bleed"].map((mode) => {
    const l = computePrintLayout(project, { mode });
    return <label key={mode} className="flex items-start gap-2 text-xs cursor-pointer">
                  <input type="radio" name="bc-print-mode" className="mt-0.5" checked={printMode === mode} onChange={() => setPrintMode(mode)} />
                  <span>
                    <span className="font-semibold text-on-surface">{t(mode === "tonbo" ? "printModeTonbo" : "printModeBleed")}</span>
                    <span className="block text-[11px] text-on-surface-variant">
                      {t("printModePageSize").replace("{page}", `${l.pageW} × ${l.pageH}`).replace("{trim}", `${l.trimW} × ${l.trimH}`)}
                    </span>
                  </span>
                </label>;
  })}
            <p className="text-[11px] text-on-surface-variant">{t("printModeHint")}</p>
          </fieldset>

          {/* Primary Action Buttons */}
          <div className="space-y-3 pt-2">
            {/* Download Print-Ready PDF */}
            <button
              id="btn-modal-download-pdf"
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="w-full py-3 px-4 rounded-xl bg-primary hover:brightness-110 text-on-primary font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              <span>{isExportingPdf ? t("btnExporting") : t("btnDownloadPdfFree")}</span>
            </button>

            {/* Download Complete ZIP Package */}
            <button
              id="btn-modal-download-zip"
              onClick={handleDownloadZip}
              disabled={isExportingZip}
              className="w-full py-3 px-4 rounded-xl bg-surface-container-highest hover:bg-surface-subtle border border-border-strong text-on-surface font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Archive className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <span>{isExportingZip ? t("btnExporting") : t("btnDownloadZipFree")}</span>
            </button>
          </div>

          {
    /* Secondary: Proof PNGs */
  }
          <div className="pt-2 border-t border-border-subtle/50 flex items-center justify-between">
            <span className="text-xs font-medium text-on-surface-variant">{t("proofQuickLabel")}</span>
            <div className="flex items-center gap-2">
              <button
    onClick={() => handleDownloadProof("front")}
    className="px-2.5 py-1 text-xs font-medium text-on-surface-variant hover:bg-surface-subtle border border-border-subtle rounded-lg transition-colors"
  >
                {t("sideFront")}
              </button>
              {project.isDoubleSided && <button
    onClick={() => handleDownloadProof("back")}
    className="px-2.5 py-1 text-xs font-medium text-on-surface-variant hover:bg-surface-subtle border border-border-subtle rounded-lg transition-colors"
  >
                  {t("sideBack")}
                </button>}
            </div>
          </div>
        </div>

        {
    /* Footer */
  }
        <div className="px-6 py-3 bg-surface-canvas border-t border-border-subtle/50 flex items-center justify-end text-xs text-on-surface-variant">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-border-subtle bg-surface-subtle hover:bg-surface-container-high font-semibold text-on-surface transition cursor-pointer"
          >
            {t("freeClose")}
          </button>
        </div>
      </div>
    </div>;
};
