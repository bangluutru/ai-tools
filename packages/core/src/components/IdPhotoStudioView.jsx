import React, { useState, useEffect } from 'react';
import { I18nProvider, useTranslation } from '../utils/id-photo/i18n/index.jsx';
import { ToolBreadcrumb } from './shared/StandardToolLayout.jsx';
import { StepWizard } from './id-photo/StepWizard.jsx';
import { Step1Upload } from './id-photo/Step1Upload.jsx';
import { Step2Background } from './id-photo/Step2Background.jsx';
import { Step3Framing } from './id-photo/Step3Framing.jsx';
import { Step4Export } from './id-photo/Step4Export.jsx';
import { ConvenienceStoreModal } from './id-photo/ConvenienceStoreModal.jsx';
import { ID_STANDARDS } from '../utils/id-photo/standards.js';
import {
  Contact,
  HelpCircle,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

function IdPhotoAppContent() {
  const { t } = useTranslation();

  const [currentStep, setCurrentStep] = useState(1);
  const [maxReachedStep, setMaxReachedStep] = useState(1);

  // Workflow State
  const [originalImage, setOriginalImage] = useState(null);
  const [compositeImage, setCompositeImage] = useState(null);
  const [_maskCanvas, setMaskCanvas] = useState(null);
  const [detectedFace, setDetectedFace] = useState(null);

  const [selectedBgColor, setSelectedBgColor] = useState('#FFFFFF');
  const [useVignette, setUseVignette] = useState(false);

  const [selectedStandard, setSelectedStandard] = useState(ID_STANDARDS[0]);
  const [transform, setTransform] = useState({
    scale: 1.0,
    offsetX: 0,
    offsetY: 0,
    rotation: 0,
    brightness: 0,
    contrast: 0,
    saturation: 0,
    sharpness: 15,
  });

  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Memory cleanup on unmount
  useEffect(() => {
    return () => {
      // Discard image references
      setOriginalImage(null);
      setCompositeImage(null);
      setMaskCanvas(null);
    };
  }, []);

  const advanceToStep = (step) => {
    setCurrentStep(step);
    if (step > maxReachedStep) {
      setMaxReachedStep(step);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 1 Complete
  const handleImageSelected = (img) => {
    setOriginalImage(img);
    setCompositeImage(null);
    setMaskCanvas(null);
    setDetectedFace(null);
    advanceToStep(2);
  };

  // Step 2 Complete
  const handleCompositeReady = (
    composite,
    mask,
    bgColor,
    vignette = false
  ) => {
    setCompositeImage(composite);
    setMaskCanvas(mask);
    setSelectedBgColor(bgColor);
    setUseVignette(vignette);
    advanceToStep(3);
  };

  // Step 3 Complete
  const handleFramingComplete = (standard, newTransform) => {
    setSelectedStandard(standard);
    setTransform(newTransform);
    advanceToStep(4);
  };

  // Reset
  const handleReset = () => {
    if (window.confirm(t.confirmReset || 'Bạn có chắc muốn làm lại từ đầu?')) {
      setOriginalImage(null);
      setCompositeImage(null);
      setMaskCanvas(null);
      setDetectedFace(null);
      setCurrentStep(1);
      setMaxReachedStep(1);
    }
  };

  return (
    <div className="flex flex-col w-full text-on-surface">
      {/* 1. BREADCRUMB & TOOL HEADER */}
      <section className="w-full pb-8">
        <ToolBreadcrumb
          items={[
            { label: 'Trang chủ', href: '#' },
            { label: 'Hình ảnh & WebP', href: '#' },
            { label: 'Tạo Ảnh Thẻ & Hộ Chiếu ICAO' },
          ]}
        />
        <div className="bg-surface-container border border-border-subtle rounded-xl p-6 shadow-xl relative overflow-hidden mt-3">
          {/* Ambient Glow */}
          <div className="absolute -right-20 -top-20 w-96 h-96 bg-primary-container/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-40 -bottom-24 w-80 h-80 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-surface-container-high border border-border-subtle flex items-center justify-center text-brand-cyan-bright shrink-0 shadow-md">
                <Contact className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl lg:text-3xl font-bold text-on-surface tracking-tight">
                    {t.appTitle || 'Tạo Ảnh Thẻ & Hộ Chiếu ICAO'}
                  </h1>
                </div>
                <p className="text-sm text-on-surface-variant max-w-3xl leading-relaxed">
                  {t.appSubtitle || 'Cắt ghép ảnh thẻ theo tiêu chuẩn quốc tế ICAO, tự động xóa nền thông minh và thay phông xanh/trắng, dàn trang in ấn 3x4, 4x6, hộ chiếu trực tiếp trên trình duyệt mà không cần cài đặt Photoshop.'}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-3 shrink-0">
              <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                <ShieldCheck className="w-3.5 h-3.5 text-secondary shrink-0" />
                <span>Xử lý trực tiếp trên trình duyệt — tệp không được tải lên máy chủ.</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsGuideOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle bg-surface-subtle text-xs font-semibold text-on-surface hover:bg-surface-container-high transition cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4 text-brand-cyan-bright" />
                  <span>{t.guideButton || 'Cách in Combini (30¥)'}</span>
                </button>
                {originalImage && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-error/30 bg-error-container/20 text-xs font-semibold text-error hover:bg-error-container/40 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{t.resetButton || 'Làm lại'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. STEP WIZARD BAR */}
      <section className="w-full mb-6">
        <StepWizard
          currentStep={currentStep}
          maxReachedStep={maxReachedStep}
          onStepClick={(step) => advanceToStep(step)}
        />
      </section>

      {/* 3. MAIN WORKSPACE */}
      <section className="w-full">
        {currentStep === 1 && (
          <Step1Upload onImageSelected={handleImageSelected} />
        )}

        {currentStep === 2 && originalImage && (
          <Step2Background
            originalImage={originalImage}
            onCompositeReady={handleCompositeReady}
            onBack={() => advanceToStep(1)}
          />
        )}

        {currentStep === 3 && compositeImage && (
          <Step3Framing
            compositeImage={compositeImage}
            initialFace={detectedFace}
            onFramingComplete={handleFramingComplete}
            onBack={() => advanceToStep(2)}
            bgColor={selectedBgColor}
            useVignette={useVignette}
          />
        )}

        {currentStep === 4 && compositeImage && (
          <Step4Export
            compositeImage={compositeImage}
            standard={selectedStandard}
            transform={transform}
            bgColor={selectedBgColor}
            useVignette={useVignette}
            onBack={() => advanceToStep(3)}
          />
        )}
      </section>

      {/* Convenience Store Modal */}
      <ConvenienceStoreModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}

export default function IdPhotoStudioView({ displayLang = 'vi' }) {
  return (
    <I18nProvider forcedLang={displayLang}>
      <IdPhotoAppContent />
    </I18nProvider>
  );
}
