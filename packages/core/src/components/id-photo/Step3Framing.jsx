"use client";
import { useEffect, useState } from "react";
import { useTranslation } from '../../utils/id-photo/i18n/index.jsx';
import { ID_STANDARDS, createCustomStandard } from '../../utils/id-photo/standards.js';
import { computeAutoFraming, detectFace } from '../../utils/id-photo/faceDetection.js';
import { validateFraming } from '../../utils/id-photo/validation.js';
import { PhotoCanvas } from './PhotoCanvas.jsx';
import { ValidationCard } from './ValidationCard.jsx';
import {
  Sparkles,
  Sliders,
  Eye,
  RotateCw,
  Sun,
  Contrast,
  ArrowRight,
  ArrowLeft,
  RotateCcw
} from "lucide-react";
const Step3Framing = ({
  compositeImage,
  initialFace,
  bgColor = "#FFFFFF",
  useVignette = false,
  onFramingComplete,
  onBack
}) => {
  const { t, language } = useTranslation();
  const [activeCategory, setActiveCategory] = useState("japan");
  const [selectedStandard, setSelectedStandard] = useState(ID_STANDARDS[0]);
  const [customW, setCustomW] = useState(35);
  const [customH, setCustomH] = useState(45);
  const [showGuides, setShowGuides] = useState(true);
  const [face, setFace] = useState(initialFace);
  const [transform, setTransform] = useState({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    rotation: 0,
    brightness: 0,
    contrast: 0,
    saturation: 0,
    sharpness: 15
  });
  useEffect(() => {
    if (!face && compositeImage) {
      detectFace(compositeImage).then((detected) => {
        if (detected) {
          setFace(detected);
          const auto = computeAutoFraming(
            detected,
            compositeImage.width,
            compositeImage.height,
            selectedStandard
          );
          setTransform((prev) => ({
            ...prev,
            ...auto
          }));
        }
      });
    }
  }, [compositeImage, face, selectedStandard]);
  const handleAutoAlign = () => {
    if (!face || !compositeImage) return;
    const auto = computeAutoFraming(
      face,
      compositeImage.width,
      compositeImage.height,
      selectedStandard
    );
    setTransform((prev) => ({
      ...prev,
      ...auto
    }));
  };
  const handleReset = () => {
    setTransform({
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
      brightness: 0,
      contrast: 0,
      saturation: 0,
      sharpness: 15
    });
  };
  const handleSelectStandard = (std) => {
    setSelectedStandard(std);
    if (face && compositeImage) {
      const auto = computeAutoFraming(
        face,
        compositeImage.width,
        compositeImage.height,
        std
      );
      setTransform((prev) => ({
        ...prev,
        ...auto
      }));
    }
  };
  const handleCustomDimensionChange = (w, h) => {
    setCustomW(w);
    setCustomH(h);
    const customStd = createCustomStandard(w, h);
    setSelectedStandard(customStd);
  };
  const validation = validateFraming(
    face,
    compositeImage.width,
    compositeImage.height,
    selectedStandard,
    transform
  );
  const categoryTabs = [
    { id: "japan", label: t.categoryJapan },
    { id: "international", label: t.categoryInternational },
    { id: "vietnam", label: t.categoryVietnam },
    { id: "custom", label: t.categoryCustom }
  ];
  const filteredStandards = ID_STANDARDS.filter((s) => s.category === activeCategory);
  return <div className="mx-auto max-w-5xl space-y-6">
      {
    /* Title */
  }
      <div className="text-center">
        <h2 className="text-xl font-bold tracking-tight text-on-surface sm:text-2xl">
          {t.framingTitle}
        </h2>
        <p className="mt-1 text-xs text-on-surface-variant sm:text-sm">
          {t.framingSubtitle}
        </p>
      </div>

      {
    /* Standards Category Tabs */
  }
      <div className="flex flex-wrap items-center justify-center gap-1.5 border-b border-border-subtle pb-3">
        {categoryTabs.map((tab) => <button
    key={tab.id}
    type="button"
    onClick={() => setActiveCategory(tab.id)}
    className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${activeCategory === tab.id ? "bg-primary-container text-on-primary-container shadow-xs" : "bg-surface-subtle text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"}`}
  >
            {tab.label}
          </button>)}
      </div>

      {
    /* Standards List / Custom Picker */
  }
      {activeCategory === "custom" ? <div className="mx-auto flex max-w-md items-center justify-center gap-4 rounded-2xl border border-border-subtle bg-surface-container p-4 shadow-xs">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-on-surface-variant">{t.widthMm}</label>
            <input
    type="number"
    min="15"
    max="150"
    value={customW}
    onChange={(e) => handleCustomDimensionChange(Number(e.target.value), customH)}
    className="w-20 rounded-lg border border-border-subtle bg-surface-subtle px-2.5 py-1.5 text-center font-mono text-xs font-bold text-on-surface"
  />
          </div>
          <span className="text-on-surface-variant font-bold">×</span>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-on-surface-variant">{t.heightMm}</label>
            <input
    type="number"
    min="15"
    max="200"
    value={customH}
    onChange={(e) => handleCustomDimensionChange(customW, Number(e.target.value))}
    className="w-20 rounded-lg border border-border-subtle bg-surface-subtle px-2.5 py-1.5 text-center font-mono text-xs font-bold text-on-surface"
  />
          </div>
        </div> : <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3">
          {filteredStandards.map((std) => {
    const isSelected = selectedStandard.id === std.id;
    return <button
      key={std.id}
      type="button"
      onClick={() => handleSelectStandard(std)}
      className={`flex flex-col justify-between rounded-xl border p-3 text-left transition cursor-pointer ${isSelected ? "border-brand-cyan-bright bg-primary-container/20 ring-1 ring-brand-cyan-bright/50 shadow-xs" : "border-border-subtle bg-surface-container hover:border-border-subtle hover:bg-surface-subtle"}`}
    >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-on-surface text-xs sm:text-sm">
                    {std.name[language] || std.name.ja}
                  </span>
                  <span className="rounded bg-surface-subtle px-1.5 py-0.5 font-mono text-[10px] font-semibold text-on-surface-variant">
                    {std.widthMm}×{std.heightMm}mm
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-on-surface-variant line-clamp-2">
                  {std.description[language] || std.description.ja}
                </p>
              </button>;
  })}
        </div>}

      {
    /* Main Workspace: Interactive Canvas + Controls */
  }
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12 items-start">
        {
    /* Left: Canvas */
  }
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border-subtle bg-surface-container p-4 sm:p-6 md:col-span-6">
          <PhotoCanvas
    compositeImage={compositeImage}
    standard={selectedStandard}
    transform={transform}
    onTransformChange={setTransform}
    showGuides={showGuides}
    bgColor={bgColor}
    useVignette={useVignette}
  />

          {
    /* Guidelines Toggle */
  }
          <div className="mt-4 flex items-center gap-2">
            <button
    type="button"
    onClick={() => setShowGuides((prev) => !prev)}
    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${showGuides ? "bg-primary-container text-on-primary-container shadow-xs" : "bg-surface-subtle text-on-surface-variant hover:bg-surface-container-high"}`}
  >
              <Eye className="h-3.5 w-3.5" />
              <span>{t.overlayGuides}</span>
            </button>

            <button
    type="button"
    onClick={handleAutoAlign}
    className="flex items-center gap-1 rounded-lg bg-surface-subtle border border-border-subtle px-3 py-1.5 text-xs font-semibold text-brand-cyan-bright shadow-2xs hover:bg-surface-container-high cursor-pointer"
  >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{t.autoAlignBtn}</span>
            </button>
          </div>
        </div>

        {
    /* Right: Sliders & Validation */
  }
        <div className="space-y-4 md:col-span-6">
          {
    /* Validation Feedback Card */
  }
          <ValidationCard
    validation={validation}
    onAutoAlign={handleAutoAlign}
  />

          {
    /* Adjustment Sliders */
  }
          <div className="rounded-2xl border border-border-subtle bg-surface-container p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2.5">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-brand-cyan-bright" />
                <h3 className="text-xs sm:text-sm font-bold text-on-surface">
                  {t.fineTuningTitle}
                </h3>
              </div>
              <button
    type="button"
    onClick={handleReset}
    className="flex items-center gap-1 text-[11px] text-on-surface-variant hover:text-on-surface cursor-pointer"
  >
                <RotateCcw className="h-3 w-3" />
                <span>{t.resetAdjustments}</span>
              </button>
            </div>

            {
    /* Zoom Slider */
  }
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-on-surface">
                <span className="font-medium">{t.zoom}</span>
                <span className="font-mono text-on-surface-variant">{Math.round(transform.scale * 100)}%</span>
              </div>
              <input
    type="range"
    min="0.5"
    max="2.5"
    step="0.05"
    value={transform.scale}
    onChange={(e) => setTransform({ ...transform, scale: Number(e.target.value) })}
    className="h-1.5 w-full cursor-pointer accent-brand-cyan-bright"
  />
            </div>

            {
    /* Rotation / Straighten Slider */
  }
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-on-surface">
                <div className="flex items-center gap-1">
                  <RotateCw className="h-3.5 w-3.5 text-on-surface-variant" />
                  <span className="font-medium">{t.rotate}</span>
                </div>
                <span className="font-mono text-on-surface-variant">{transform.rotation}°</span>
              </div>
              <input
    type="range"
    min="-15"
    max="15"
    step="0.2"
    value={transform.rotation}
    onChange={(e) => setTransform({ ...transform, rotation: Number(e.target.value) })}
    className="h-1.5 w-full cursor-pointer accent-brand-cyan-bright"
  />
            </div>

            {
    /* Pan Vertical Slider */
  }
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-on-surface">
                <span className="font-medium">{t.panY}</span>
                <span className="font-mono text-on-surface-variant">{transform.offsetY}px</span>
              </div>
              <input
    type="range"
    min="-150"
    max="150"
    step="1"
    value={transform.offsetY}
    onChange={(e) => setTransform({ ...transform, offsetY: Number(e.target.value) })}
    className="h-1.5 w-full cursor-pointer accent-brand-cyan-bright"
  />
            </div>

            {
    /* Print Enhancements: Sharpness */
  }
            <div className="border-t border-border-subtle pt-3 space-y-1">
              <div className="flex justify-between text-xs text-on-surface">
                <span className="font-medium">{t.sharpness}</span>
                <span className="font-mono text-on-surface-variant">{transform.sharpness}%</span>
              </div>
              <input
    type="range"
    min="0"
    max="60"
    value={transform.sharpness}
    onChange={(e) => setTransform({ ...transform, sharpness: Number(e.target.value) })}
    className="h-1.5 w-full cursor-pointer accent-brand-cyan-bright"
  />
            </div>

            {
    /* Brightness & Contrast */
  }
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-on-surface">
                  <span className="flex items-center gap-1">
                    <Sun className="h-3 w-3 text-on-surface-variant" />
                    {t.brightness}
                  </span>
                  <span className="font-mono text-on-surface-variant">{transform.brightness}</span>
                </div>
                <input
    type="range"
    min="-30"
    max="30"
    value={transform.brightness}
    onChange={(e) => setTransform({ ...transform, brightness: Number(e.target.value) })}
    className="h-1.5 w-full cursor-pointer accent-brand-cyan-bright"
  />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-on-surface">
                  <span className="flex items-center gap-1">
                    <Contrast className="h-3 w-3 text-on-surface-variant" />
                    {t.contrast}
                  </span>
                  <span className="font-mono text-on-surface-variant">{transform.contrast}</span>
                </div>
                <input
    type="range"
    min="-30"
    max="30"
    value={transform.contrast}
    onChange={(e) => setTransform({ ...transform, contrast: Number(e.target.value) })}
    className="h-1.5 w-full cursor-pointer accent-brand-cyan-bright"
  />
              </div>
            </div>
          </div>

          {
    /* Navigation Buttons */
  }
          <div className="flex items-center justify-between pt-2">
            <button
    type="button"
    onClick={onBack}
    className="flex items-center gap-1.5 rounded-xl border border-border-subtle bg-surface-subtle px-4 py-2.5 text-xs font-semibold text-on-surface shadow-2xs hover:bg-surface-container-high transition cursor-pointer"
  >
              <ArrowLeft className="h-4 w-4" />
              <span>{t.prevStep}</span>
            </button>

            <button
    type="button"
    onClick={() => onFramingComplete(selectedStandard, transform)}
    className="flex items-center gap-1.5 rounded-xl bg-primary-container text-on-primary-container px-6 py-2.5 text-xs font-bold shadow-md hover:bg-primary-container/80 active:scale-95 transition cursor-pointer"
  >
              <span>{t.nextStep}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>;
};
export {
  Step3Framing
};
