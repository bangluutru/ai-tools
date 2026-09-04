import React, { useState, useEffect } from 'react';
import { I18nProvider, useTranslation } from '../utils/id-photo/i18n/index.jsx';
import { MiniAppLayout, MiniAppHeader } from './shared/MiniAppLayout.jsx';
import { StepWizard } from './id-photo/StepWizard.jsx';
import { Step1Upload } from './id-photo/Step1Upload.jsx';
import { Step2Background } from './id-photo/Step2Background.jsx';
import { Step3Framing } from './id-photo/Step3Framing.jsx';
import { Step4Export } from './id-photo/Step4Export.jsx';
import { ConvenienceStoreModal } from './id-photo/ConvenienceStoreModal.jsx';
import { ID_STANDARDS } from '../utils/id-photo/standards.js';
import { Sparkles, HelpCircle, RotateCcw } from 'lucide-react';

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
    <MiniAppLayout width="wide" gap="normal" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-4">
        <MiniAppHeader
          title={t.appTitle || 'Chứng Minh Ảnh PRO'}
          subtitle={t.appSubtitle || 'Tách nền AI • Tự động căn chỉnh khuôn mặt • Xếp sheet in ảnh combini'}
          badge={t.privacyBadge || '100% Xử lý trong trình duyệt'}
          badgeIcon={<Sparkles className="w-3.5 h-3.5 text-blue-400" />}
          tone="blue"
        />
        <div className="flex items-center justify-center md:justify-end gap-2 self-center md:self-start">
          <button
            type="button"
            onClick={() => setIsGuideOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:border-slate-600 transition shadow-xs"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span>{t.guideButton || 'Cách in Combini (30¥)'}</span>
          </button>
          {originalImage && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-xs font-semibold text-red-300 hover:bg-red-500/20 hover:border-red-500/50 transition shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.resetButton || 'Làm lại'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Step Wizard Bar */}
      <StepWizard
        currentStep={currentStep}
        maxReachedStep={maxReachedStep}
        onStepClick={(step) => advanceToStep(step)}
      />

      {/* Main Content Workspace */}
      <div className="w-full">
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
      </div>

      {/* Convenience Store Modal */}
      <ConvenienceStoreModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </MiniAppLayout>
  );
}

export default function IdPhotoStudioView({ displayLang = 'vi' }) {
  return (
    <I18nProvider forcedLang={displayLang}>
      <IdPhotoAppContent />
    </I18nProvider>
  );
}
