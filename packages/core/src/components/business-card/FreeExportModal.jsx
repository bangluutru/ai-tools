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
import { BusinessCardPdfExporter } from "../../utils/business-card/pdfExporter.js";
import { PrintPackageService } from "../../utils/business-card/zipPackager.js";
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
  if (!isOpen) return null;
  const handleDownloadPdf = async () => {
    try {
      setIsExportingPdf(true);
      const pdfDoc = await BusinessCardPdfExporter.generatePrintPdf(project, {
        includeBleed: true,
        includeCropMarks: true,
        dpi: 300,
        colorMode: "cmyk_simulation"
      });
      const filename = `${project.title || "Meishi"}_300DPI_\u30C8\u30F3\u30DC\u4ED8.pdf`;
      pdfDoc.save(filename);
      setExportSuccessMsg(`\u0110\xE3 t\u1EA3i xu\u1ED1ng th\xE0nh c\xF4ng: ${filename}`);
      setTimeout(() => setExportSuccessMsg(null), 4e3);
    } catch (err) {
      console.error("Export PDF error:", err);
    } finally {
      setIsExportingPdf(false);
    }
  };
  const handleDownloadZip = async () => {
    try {
      setIsExportingZip(true);
      const zipBlob = await PrintPackageService.createPrintBundleZip(project, {
        quantity: 100
      });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.title || "Meishi"}_\u5165\u7A3F\u5B8C\u5168\u30D1\u30C3\u30B1\u30FC\u30B8.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportSuccessMsg("\u0110\xE3 t\u1EA1o v\xE0 t\u1EA3i g\xF3i ZIP ho\xE0n ch\u1EC9nh chu\u1EA9n nh\xE0 in!");
      setTimeout(() => setExportSuccessMsg(null), 4e3);
    } catch (err) {
      console.error("Export ZIP error:", err);
    } finally {
      setIsExportingZip(false);
    }
  };
  const handleDownloadProof = async (side) => {
    try {
      const proofUrl = await BusinessCardPdfExporter.generateProofPng(project, side);
      const a = document.createElement("a");
      a.href = proofUrl;
      a.download = `${project.title || "Meishi"}_Proof_${side}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error("Proof export error:", err);
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
              <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                {t("pfPassed")}
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
            <span className="text-xs font-medium text-on-surface-variant">Tải nhanh ảnh Proof duyệt mẫu (PNG):</span>
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
    /* Footer note */
  }
        <div className="px-6 py-3 bg-surface-canvas border-t border-border-subtle/50 flex items-center justify-between text-xs text-on-surface-variant">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{t("freeAppNotice")}</span>
          </div>
          <button
    onClick={onClose}
    className="font-semibold text-on-surface-variant hover:text-on-surface cursor-pointer"
  >
            {t("freeClose")}
          </button>
        </div>
      </div>
    </div>;
};
