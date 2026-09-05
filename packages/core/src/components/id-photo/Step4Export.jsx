"use client";
import { useMemo, useState } from "react";
import { useTranslation } from '../../utils/id-photo/i18n/index.jsx';
import { PAPER_SIZES } from '../../utils/id-photo/paperSizes.js';
import { calculateSheetTiling } from '../../utils/id-photo/packingEngine.js';
import {
  exportPhotoBlob,
  exportSheetPdf,
  renderPrintSheet,
  renderSingleIdPhoto
} from '../../utils/id-photo/exportEngine.js';
import { PrintSheetPreview } from './PrintSheetPreview.jsx';
import { ConvenienceStoreModal } from './ConvenienceStoreModal.jsx';
import {
  Printer,
  Download,
  FileText,
  HelpCircle,
  ArrowLeft,
  Scissors,
  Check,
  Loader2,
  Sparkles
} from "lucide-react";
const Step4Export = ({
  compositeImage,
  standard,
  transform,
  bgColor = "#FFFFFF",
  useVignette = false,
  onBack
}) => {
  const { t, language, format } = useTranslation();
  const [selectedPaper, setSelectedPaper] = useState(PAPER_SIZES[0]);
  const [exportFormat, setExportFormat] = useState("png");
  const [exportDpi, setExportDpi] = useState(300);
  const [settings, setSettings] = useState({
    showCuttingLines: true,
    showCornerMarks: true,
    showPhotoBorder: true,
    borderColor: "rgba(0,0,0,0.18)",
    gapMm: 2,
    exportDpi: 300
  });
  const [isExporting, setIsExporting] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const singlePhotoCanvas = useMemo(() => {
    return renderSingleIdPhoto(compositeImage, standard, transform, 300, bgColor, useVignette);
  }, [compositeImage, standard, transform, bgColor, useVignette]);
  const tiling = useMemo(() => {
    return calculateSheetTiling(selectedPaper, standard, settings.gapMm, 3.5);
  }, [selectedPaper, standard, settings.gapMm]);
  const handleDownloadImage = async () => {
    setIsExporting(true);
    try {
      const ext = exportFormat === "png" ? "png" : "jpg";
      let blob;
      let filename;
      if (selectedPaper.id === "paper-single") {
        filename = `id-photo-${standard.widthMm}x${standard.heightMm}mm-${exportDpi}dpi.${ext}`;
        const photoCanvas = renderSingleIdPhoto(
          compositeImage,
          standard,
          transform,
          exportDpi,
          bgColor,
          useVignette
        );
        blob = await exportPhotoBlob(photoCanvas, exportFormat, exportDpi);
      } else {
        filename = `print-sheet-${selectedPaper.id}-${tiling.paperWidthMm}x${tiling.paperHeightMm}mm-${exportDpi}dpi.${ext}`;
        const photoCanvas = renderSingleIdPhoto(
          compositeImage,
          standard,
          transform,
          exportDpi,
          bgColor,
          useVignette
        );
        const sheetCanvas = renderPrintSheet(photoCanvas, tiling, settings, exportDpi);
        blob = await exportPhotoBlob(sheetCanvas, exportFormat, exportDpi);
      }
      triggerDownload(blob, filename);
    } catch (err) {
      console.error("Export Image error:", err);
    } finally {
      setIsExporting(false);
    }
  };
  const handleDownloadPdf = async () => {
    setIsExporting(true);
    try {
      const filename = `print-sheet-${selectedPaper.id}-${tiling.paperWidthMm}x${tiling.paperHeightMm}mm.pdf`;
      const highResPhoto = renderSingleIdPhoto(
        compositeImage,
        standard,
        transform,
        exportDpi,
        bgColor,
        useVignette
      );
      const pdfBlob = await exportSheetPdf(highResPhoto, tiling, settings);
      triggerDownload(pdfBlob, filename);
    } catch (err) {
      console.error("Export PDF error:", err);
    } finally {
      setIsExporting(false);
    }
  };
  const triggerDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  const isSingle = selectedPaper.id === "paper-single";
  return <div className="mx-auto max-w-5xl space-y-6">
      {
    /* Title */
  }
      <div className="text-center">
        <h2 className="text-xl font-bold tracking-tight text-on-surface sm:text-2xl">
          {t.exportTitle}
        </h2>
        <p className="mt-1 text-xs text-on-surface-variant sm:text-sm">
          {t.exportSubtitle}
        </p>
      </div>

      {/* Convenience Store Callout Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-border-subtle bg-surface-container p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-container text-on-primary-container shadow-xs">
            <Printer className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-on-surface">
              {t.combiniBannerTitle}
            </h4>
            <p className="text-[11px] text-on-surface-variant">
              {t.combiniBannerSub}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsGuideOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-surface-subtle border border-border-subtle px-3.5 py-2 text-xs font-bold text-on-surface shadow-2xs hover:bg-surface-container-high transition active:scale-95 whitespace-nowrap cursor-pointer"
        >
          <HelpCircle className="h-4 w-4 text-brand-cyan-bright" />
          <span>{t.printGuideCallout}</span>
        </button>
      </div>

      {/* Main Grid: Sheet Preview on Left, Options on Right */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12 items-start">
        {/* Left: Sheet Preview */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border-subtle bg-surface-container p-4 sm:p-6 md:col-span-6">
          <PrintSheetPreview
            singlePhotoCanvas={singlePhotoCanvas}
            tiling={tiling}
            settings={settings}
          />
        </div>

        {/* Right: Paper Selector, Export Options & Download Actions */}
        <div className="space-y-4 md:col-span-6">
          {/* Paper Size Selector */}
          <div className="rounded-2xl border border-border-subtle bg-surface-container p-5 shadow-xs space-y-3">
            <h3 className="text-xs sm:text-sm font-bold text-on-surface">
              {t.selectPaper}
            </h3>

            <div className="space-y-2">
              {PAPER_SIZES.map((paper) => {
                const isSelected = selectedPaper.id === paper.id;
                return (
                  <button
                    key={paper.id}
                    type="button"
                    onClick={() => setSelectedPaper(paper)}
                    className={`flex w-full items-start justify-between rounded-xl border p-3 text-left transition cursor-pointer ${
                      isSelected
                        ? "border-brand-cyan-bright bg-primary-container/20 ring-1 ring-brand-cyan-bright/50 shadow-2xs"
                        : "border-border-subtle bg-surface-container hover:border-border-subtle hover:bg-surface-subtle"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-on-surface text-xs sm:text-sm">
                          {paper.name[language] || paper.name.ja}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-on-surface-variant">
                        {paper.description[language] || paper.description.ja}
                      </p>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-brand-cyan-bright stroke-[2.5] shrink-0 mt-0.5" />}
                  </button>
                );
              })}
            </div>

            {/* Tiling Summary */}
            <div className="rounded-xl bg-surface-subtle p-3 text-center border border-border-subtle">
              <span className="text-xs font-semibold text-on-surface-variant">
                {isSingle ? format(t.singleSummary, { dpi: exportDpi }) : format(t.sheetSummary, {
                  paper: selectedPaper.name[language] || selectedPaper.name.ja,
                  count: tiling.totalPhotos
                })}
              </span>
            </div>
          </div>

          {/* Export Format & Resolution (DPI) Selection Card */}
          <div className="rounded-2xl border border-border-subtle bg-surface-container p-5 shadow-xs space-y-4">
            {/* Format Selection */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="h-3.5 w-3.5 text-brand-cyan-bright" />
                <h3 className="text-xs sm:text-sm font-bold text-on-surface">
                  {t.exportFormatTitle}
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setExportFormat("png")}
                  className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    exportFormat === "png"
                      ? "border-brand-cyan-bright bg-primary-container/20 ring-1 ring-brand-cyan-bright/50 text-on-surface font-medium shadow-2xs"
                      : "border-border-subtle bg-surface-container hover:bg-surface-subtle text-on-surface-variant"
                  }`}
                >
                  <span className="text-xs font-bold flex items-center gap-1 text-on-surface">
                    PNG (Lossless)
                    {exportFormat === "png" && <Check className="h-3 w-3 text-brand-cyan-bright stroke-[3]" />}
                  </span>
                  <span className="text-[10px] text-on-surface-variant mt-0.5 leading-tight">
                    {t.formatPng}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setExportFormat("jpeg")}
                  className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    exportFormat === "jpeg"
                      ? "border-brand-cyan-bright bg-primary-container/20 ring-1 ring-brand-cyan-bright/50 text-on-surface font-medium shadow-2xs"
                      : "border-border-subtle bg-surface-container hover:bg-surface-subtle text-on-surface-variant"
                  }`}
                >
                  <span className="text-xs font-bold flex items-center gap-1 text-on-surface">
                    JPG (JFIF DPI)
                    {exportFormat === "jpeg" && <Check className="h-3 w-3 text-brand-cyan-bright stroke-[3]" />}
                  </span>
                  <span className="text-[10px] text-on-surface-variant mt-0.5 leading-tight">
                    {t.formatJpg}
                  </span>
                </button>
              </div>
            </div>

            {/* DPI Selection */}
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-on-surface mb-2">
                {t.exportDpiTitle}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setExportDpi(300)}
                  className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    exportDpi === 300
                      ? "border-brand-cyan-bright bg-primary-container/20 ring-1 ring-brand-cyan-bright/50 text-on-surface font-medium shadow-2xs"
                      : "border-border-subtle bg-surface-container hover:bg-surface-subtle text-on-surface-variant"
                  }`}
                >
                  <span className="text-xs font-bold flex items-center gap-1 text-on-surface">
                    300 DPI
                    {exportDpi === 300 && <Check className="h-3 w-3 text-brand-cyan-bright stroke-[3]" />}
                  </span>
                  <span className="text-[10px] text-on-surface-variant mt-0.5 leading-tight">
                    {t.dpiStandard}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setExportDpi(600)}
                  className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    exportDpi === 600
                      ? "border-brand-cyan-bright bg-primary-container/20 ring-1 ring-brand-cyan-bright/50 text-on-surface font-medium shadow-2xs"
                      : "border-border-subtle bg-surface-container hover:bg-surface-subtle text-on-surface-variant"
                  }`}
                >
                  <span className="text-xs font-bold flex items-center gap-1 text-on-surface">
                    600 DPI (Ultra HD)
                    {exportDpi === 600 && <Check className="h-3 w-3 text-brand-cyan-bright stroke-[3]" />}
                  </span>
                  <span className="text-[10px] text-on-surface-variant mt-0.5 leading-tight">
                    {t.dpiUltra}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Cutting Guidelines Options */}
          {!isSingle && (
            <div className="rounded-2xl border border-border-subtle bg-surface-container p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <Scissors className="h-4 w-4 text-on-surface-variant" />
                <h3 className="text-xs sm:text-sm font-bold text-on-surface">
                  {t.cuttingOptionsTitle}
                </h3>
              </div>

              <div className="space-y-2.5">
                {/* Dashed cutting lines */}
                <label className="flex items-center justify-between cursor-pointer text-xs text-on-surface">
                  <span>{t.showCuttingLines}</span>
                  <input
                    type="checkbox"
                    checked={settings.showCuttingLines}
                    onChange={(e) => setSettings({ ...settings, showCuttingLines: e.target.checked })}
                    className="h-4 w-4 rounded border-border-subtle bg-surface-subtle text-brand-cyan-bright focus:ring-brand-cyan-bright"
                  />
                </label>

                {/* Corner tick marks */}
                <label className="flex items-center justify-between cursor-pointer text-xs text-on-surface">
                  <span>{t.showCornerMarks}</span>
                  <input
                    type="checkbox"
                    checked={settings.showCornerMarks}
                    onChange={(e) => setSettings({ ...settings, showCornerMarks: e.target.checked })}
                    className="h-4 w-4 rounded border-border-subtle bg-surface-subtle text-brand-cyan-bright focus:ring-brand-cyan-bright"
                  />
                </label>

                {/* Photo outline border */}
                <label className="flex items-center justify-between cursor-pointer text-xs text-on-surface">
                  <span>{t.showPhotoBorder}</span>
                  <input
                    type="checkbox"
                    checked={settings.showPhotoBorder}
                    onChange={(e) => setSettings({ ...settings, showPhotoBorder: e.target.checked })}
                    className="h-4 w-4 rounded border-border-subtle bg-surface-subtle text-brand-cyan-bright focus:ring-brand-cyan-bright"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Download Action Buttons */}
          <div className="rounded-2xl border border-border-subtle bg-surface-container p-5 shadow-xs space-y-3">
            {/* Image Download (PNG or JPG) */}
            <button
              type="button"
              disabled={isExporting}
              onClick={handleDownloadImage}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-container text-on-primary-container px-5 py-3 text-xs sm:text-sm font-bold shadow-md hover:bg-primary-container/80 active:scale-95 disabled:opacity-50 transition cursor-pointer"
            >
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              <span>
                {isSingle ? t.downloadSingle : exportFormat === "png" ? format(t.downloadPng, { dpi: exportDpi }) : format(t.downloadJpg, { dpi: exportDpi })}
              </span>
            </button>

            {/* Vector PDF Download */}
            {!isSingle && (
              <button
                type="button"
                disabled={isExporting}
                onClick={handleDownloadPdf}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border-subtle bg-surface-subtle px-5 py-2.5 text-xs sm:text-sm font-bold text-on-surface shadow-2xs hover:bg-surface-container-high active:scale-95 disabled:opacity-50 transition cursor-pointer"
              >
                <FileText className="h-4 w-4 text-brand-cyan-bright" />
                <span>{t.downloadPdf}</span>
              </button>
            )}
          </div>

          {/* Back Button */}
          <div className="flex items-center justify-start pt-1">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 rounded-xl border border-border-subtle bg-surface-subtle px-4 py-2.5 text-xs font-semibold text-on-surface shadow-2xs hover:bg-surface-container-high transition cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{t.prevStep}</span>
            </button>
          </div>
        </div>
      </div>

      {
    /* Convenience Store Modal */
  }
      <ConvenienceStoreModal
    isOpen={isGuideOpen}
    onClose={() => setIsGuideOpen(false)}
  />
    </div>;
};
export {
  Step4Export
};
