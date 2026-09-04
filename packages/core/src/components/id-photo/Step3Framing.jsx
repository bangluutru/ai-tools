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
        <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          {t.framingTitle}
        </h2>
        <p className="mt-1 text-xs text-slate-600 sm:text-sm">
          {t.framingSubtitle}
        </p>
      </div>

      {
    /* Standards Category Tabs */
  }
      <div className="flex flex-wrap items-center justify-center gap-1.5 border-b border-slate-200 pb-3">
        {categoryTabs.map((tab) => <button
    key={tab.id}
    type="button"
    onClick={() => setActiveCategory(tab.id)}
    className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition ${activeCategory === tab.id ? "bg-blue-600 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"}`}
  >
            {tab.label}
          </button>)}
      </div>

      {
    /* Standards List / Custom Picker */
  }
      {activeCategory === "custom" ? <div className="mx-auto flex max-w-md items-center justify-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-700">{t.widthMm}</label>
            <input
    type="number"
    min="15"
    max="150"
    value={customW}
    onChange={(e) => handleCustomDimensionChange(Number(e.target.value), customH)}
    className="w-20 rounded-lg border border-slate-300 px-2.5 py-1.5 text-center font-mono text-xs font-bold"
  />
          </div>
          <span className="text-slate-400 font-bold">×</span>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-700">{t.heightMm}</label>
            <input
    type="number"
    min="15"
    max="200"
    value={customH}
    onChange={(e) => handleCustomDimensionChange(customW, Number(e.target.value))}
    className="w-20 rounded-lg border border-slate-300 px-2.5 py-1.5 text-center font-mono text-xs font-bold"
  />
          </div>
        </div> : <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3">
          {filteredStandards.map((std) => {
    const isSelected = selectedStandard.id === std.id;
    return <button
      key={std.id}
      type="button"
      onClick={() => handleSelectStandard(std)}
      className={`flex flex-col justify-between rounded-xl border p-3 text-left transition ${isSelected ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20 shadow-xs" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"}`}
    >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs sm:text-sm">
                    {std.name[language] || std.name.ja}
                  </span>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-700">
                    {std.widthMm}×{std.heightMm}mm
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">
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
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-900/5 p-4 sm:p-6 md:col-span-6">
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
    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${showGuides ? "bg-blue-600 text-white shadow-xs" : "bg-slate-200/80 text-slate-700 hover:bg-slate-300"}`}
  >
              <Eye className="h-3.5 w-3.5" />
              <span>{t.overlayGuides}</span>
            </button>

            <button
    type="button"
    onClick={handleAutoAlign}
    className="flex items-center gap-1 rounded-lg bg-white border border-slate-300 px-3 py-1.5 text-xs font-semibold text-blue-600 shadow-2xs hover:bg-slate-50"
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
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-blue-600" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  {t.fineTuningTitle}
                </h3>
              </div>
              <button
    type="button"
    onClick={handleReset}
    className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-900"
  >
                <RotateCcw className="h-3 w-3" />
                <span>{t.resetAdjustments}</span>
              </button>
            </div>

            {
    /* Zoom Slider */
  }
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-700">
                <span className="font-medium">{t.zoom}</span>
                <span className="font-mono text-slate-500">{Math.round(transform.scale * 100)}%</span>
              </div>
              <input
    type="range"
    min="0.5"
    max="2.5"
    step="0.05"
    value={transform.scale}
    onChange={(e) => setTransform({ ...transform, scale: Number(e.target.value) })}
    className="h-1.5 w-full cursor-pointer accent-blue-600"
  />
            </div>

            {
    /* Rotation / Straighten Slider */
  }
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-700">
                <div className="flex items-center gap-1">
                  <RotateCw className="h-3.5 w-3.5 text-slate-500" />
                  <span className="font-medium">{t.rotate}</span>
                </div>
                <span className="font-mono text-slate-500">{transform.rotation}°</span>
              </div>
              <input
    type="range"
    min="-15"
    max="15"
    step="0.2"
    value={transform.rotation}
    onChange={(e) => setTransform({ ...transform, rotation: Number(e.target.value) })}
    className="h-1.5 w-full cursor-pointer accent-blue-600"
  />
            </div>

            {
    /* Pan Vertical Slider */
  }
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-700">
                <span className="font-medium">{t.panY}</span>
                <span className="font-mono text-slate-500">{transform.offsetY}px</span>
              </div>
              <input
    type="range"
    min="-150"
    max="150"
    value={transform.offsetY}
    onChange={(e) => setTransform({ ...transform, offsetY: Number(e.target.value) })}
    className="h-1.5 w-full cursor-pointer accent-blue-600"
  />
            </div>

            {
    /* Print Enhancements: Sharpness */
  }
            <div className="border-t border-slate-100 pt-3 space-y-1">
              <div className="flex justify-between text-xs text-slate-700">
                <span className="font-medium">{t.sharpness}</span>
                <span className="font-mono text-slate-500">{transform.sharpness}%</span>
              </div>
              <input
    type="range"
    min="0"
    max="60"
    value={transform.sharpness}
    onChange={(e) => setTransform({ ...transform, sharpness: Number(e.target.value) })}
    className="h-1.5 w-full cursor-pointer accent-blue-600"
  />
            </div>

            {
    /* Brightness & Contrast */
  }
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-600">
                  <span className="flex items-center gap-1">
                    <Sun className="h-3 w-3" />
                    {t.brightness}
                  </span>
                  <span className="font-mono">{transform.brightness}</span>
                </div>
                <input
    type="range"
    min="-30"
    max="30"
    value={transform.brightness}
    onChange={(e) => setTransform({ ...transform, brightness: Number(e.target.value) })}
    className="h-1.5 w-full cursor-pointer accent-blue-600"
  />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-600">
                  <span className="flex items-center gap-1">
                    <Contrast className="h-3 w-3" />
                    {t.contrast}
                  </span>
                  <span className="font-mono">{transform.contrast}</span>
                </div>
                <input
    type="range"
    min="-30"
    max="30"
    value={transform.contrast}
    onChange={(e) => setTransform({ ...transform, contrast: Number(e.target.value) })}
    className="h-1.5 w-full cursor-pointer accent-blue-600"
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
    className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
  >
              <ArrowLeft className="h-4 w-4" />
              <span>{t.prevStep}</span>
            </button>

            <button
    type="button"
    onClick={() => onFramingComplete(selectedStandard, transform)}
    className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-500 active:scale-95 transition"
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
