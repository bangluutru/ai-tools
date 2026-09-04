import React, { useState, useEffect } from 'react';
import { I18nProvider, useTranslation } from '../utils/id-photo/i18n/index.jsx';
import { ToolBreadcrumb, PrivacyShieldPill } from './shared/StandardToolLayout.jsx';
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
  Award,
  Sparkles,
  Printer,
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
                  <span className="px-2 py-0.5 bg-brand-emerald-deep/20 text-secondary text-xs font-semibold rounded flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                    ƯU TIÊN 1
                  </span>
                  <span className="px-2 py-0.5 bg-primary-container/20 text-brand-cyan-bright text-xs font-semibold rounded uppercase font-mono">
                    CHUẨN ICAO 9303
                  </span>
                </div>
                <p className="text-sm text-on-surface-variant max-w-3xl leading-relaxed">
                  {t.appSubtitle || 'Cắt ghép ảnh thẻ theo tiêu chuẩn quốc tế ICAO, tự động xóa nền thông minh và thay phông xanh/trắng, dàn trang in ấn 3x4, 4x6, hộ chiếu trực tiếp trên trình duyệt mà không cần cài đặt Photoshop.'}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-3 shrink-0">
              <PrivacyShieldPill
                label="BẢO MẬT CLIENT-SIDE 100%"
                description="Xử lý WebAssembly & AI nội bộ, không tải ảnh lên máy chủ."
              />
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

      {/* 4. TECHNICAL GUIDANCE (3 COLS) */}
      <section className="w-full mt-12 pt-8 border-t border-border-subtle">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-2 h-6 bg-primary-container rounded" />
          <h3 className="text-xl font-bold text-on-surface tracking-tight">
            Quy Chuẩn Chụp Ảnh Hộ Chiếu Quốc Tế &amp; Thẻ Căn Cước
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-container border border-border-subtle rounded-xl p-6 shadow-sm flex flex-col gap-3">
            <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary-container">
              <Award className="w-6 h-6" />
            </div>
            <h4 className="text-base font-semibold text-on-surface">Sinh Trắc Học ICAO Doc 9303</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Tỷ lệ khuôn mặt phải chiếm từ 70% đến 80% tổng chiều dọc bức ảnh. Hai mắt mở to, nhìn thẳng vào ống kính máy ảnh, không cười hở răng, không đeo kính phản quang hoặc trang sức che khuất vành tai.
            </p>
          </div>

          <div className="bg-surface-container border border-border-subtle rounded-xl p-6 shadow-sm flex flex-col gap-3">
            <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-secondary">
              <Printer className="w-6 h-6" />
            </div>
            <h4 className="text-base font-semibold text-on-surface">Độ Phân Giải Chuẩn 300 DPI</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Bảng dàn trang xuất ra ở mật độ điểm ảnh 300 DPI không bị nén vỡ hình. Bạn chỉ cần lưu file vào USB hoặc gửi Zalo truyền file tới tiệm in ảnh để in trực tiếp trên giấy Lab DNP hoặc máy in Epson chuẩn màu.
            </p>
          </div>

          <div className="bg-surface-container border border-border-subtle rounded-xl p-6 shadow-sm flex flex-col gap-3">
            <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-brand-cyan-bright">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="text-base font-semibold text-on-surface">An Toàn Dữ Liệu Tuyệt Đối</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Toàn bộ thuật toán xóa nền AI và nhận diện sinh trắc học được biên dịch sang WebAssembly và chạy trực tiếp trên bộ nhớ trình duyệt của bạn. Ảnh chân dung cá nhân không bao giờ tải lên bất kỳ máy chủ nào.
            </p>
          </div>
        </div>
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
