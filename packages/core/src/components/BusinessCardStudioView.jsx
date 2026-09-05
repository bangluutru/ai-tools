import React, { useState, useEffect } from 'react';
import {
  Contact,
  ShieldCheck,
  AlertTriangle,
  Download,
  Save,
  Users,
  Printer,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { LanguageProvider, useLanguage } from '../utils/business-card/LanguageContext.jsx';
import { ToolBreadcrumb } from './shared/StandardToolLayout.jsx';
import { DEFAULT_CARD_DIMENSION } from '../utils/business-card/cardSizes.js';
import { SAMPLE_PROFILES } from '../utils/business-card/samples.js';
import { TEMPLATE_DEFINITIONS } from '../utils/business-card/templates.js';
import { PreflightVerificationService } from '../utils/business-card/preflightChecker.js';
import { StorageService } from '../utils/business-card/storage.js';
import { BusinessCardPdfExporter } from '../utils/business-card/pdfExporter.js';
import { WorkflowSteps } from './business-card/WorkflowSteps.jsx';
import { InputStep } from './business-card/InputStep.jsx';
import { GenerationStep } from './business-card/GenerationStep.jsx';
import { EditorStep } from './business-card/EditorStep.jsx';
import { FreeExportModal } from './business-card/FreeExportModal.jsx';
import { PreflightModal } from './business-card/PreflightModal.jsx';
import { BatchEmployeeModal } from './business-card/BatchEmployeeModal.jsx';

function BusinessCardStudioContent({ onBackToHub }) {
  const { t } = useLanguage();

  const defaultProfile = SAMPLE_PROFILES[0].profile;

  const createInitialProject = () => {
    const dim = DEFAULT_CARD_DIMENSION;
    const initialTmpl = TEMPLATE_DEFINITIONS[0];
    const generated = initialTmpl.generator(defaultProfile, dim, 'horizontal');

    return {
      id: `proj-${Date.now()}`,
      title: `${defaultProfile.companyName} - ${defaultProfile.fullName}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dimension: dim,
      orientation: 'horizontal',
      isDoubleSided: true,
      profile: defaultProfile,
      front: generated.front,
      back: generated.back,
      styleCategory: initialTmpl.category,
      templateId: initialTmpl.id,
    };
  };

  const [project, setProject] = useState(() => {
    const saved = StorageService.getActiveProject();
    return saved || createInitialProject();
  });

  const [activeStep, setActiveStep] = useState('input');
  const [selectedStyle, setSelectedStyle] = useState('Minimal Modern');

  // Modals state
  const [isPreflightOpen, setIsPreflightOpen] = useState(false);
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [isFreeExportOpen, setIsFreeExportOpen] = useState(false);
  const [saveToast, setSaveToast] = useState(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Compute live preflight status
  const preflight = PreflightVerificationService.inspect(project);

  // Save project to storage
  const handleSaveProject = () => {
    StorageService.saveProject(project);
    setSaveToast(t('savedToast') || 'Đã lưu dự án vào bộ nhớ máy.');
    setTimeout(() => setSaveToast(null), 3000);
  };

  // Reset project
  const handleReset = () => {
    if (window.confirm('Bạn có chắc muốn làm lại dự án danh thiếp mới từ đầu?')) {
      const fresh = createInitialProject();
      setProject(fresh);
      setActiveStep('input');
    }
  };

  // Profile Change Handler
  const handleProfileChange = (updatedProfile) => {
    const tmpl =
      TEMPLATE_DEFINITIONS.find((t) => t.id === project.templateId) ||
      TEMPLATE_DEFINITIONS[0];
    const regenerated = tmpl.generator(
      updatedProfile,
      project.dimension,
      project.orientation
    );

    setProject((prev) => ({
      ...prev,
      profile: updatedProfile,
      title: `${updatedProfile.companyName || '名刺'} - ${updatedProfile.fullName || '無題'}`,
      front: regenerated.front,
      back: regenerated.back,
    }));
  };

  // Dimension Change
  const handleDimensionChange = (dim) => {
    const tmpl =
      TEMPLATE_DEFINITIONS.find((t) => t.id === project.templateId) ||
      TEMPLATE_DEFINITIONS[0];
    const regenerated = tmpl.generator(
      project.profile,
      dim,
      project.orientation
    );

    setProject((prev) => ({
      ...prev,
      dimension: dim,
      front: regenerated.front,
      back: regenerated.back,
    }));
  };

  // Orientation Change
  const handleOrientationChange = (orientation) => {
    const tmpl =
      TEMPLATE_DEFINITIONS.find((t) => t.id === project.templateId) ||
      TEMPLATE_DEFINITIONS[0];
    const regenerated = tmpl.generator(
      project.profile,
      project.dimension,
      orientation
    );

    setProject((prev) => ({
      ...prev,
      orientation,
      front: regenerated.front,
      back: regenerated.back,
    }));
  };

  // Double-sided toggle
  const handleDoubleSidedChange = (isDoubleSided) => {
    setProject((prev) => ({
      ...prev,
      isDoubleSided,
    }));
  };

  // Select Proposal Template
  const handleSelectTemplate = (template) => {
    const generated = template.generator(
      project.profile,
      project.dimension,
      project.orientation
    );

    setProject((prev) => ({
      ...prev,
      templateId: template.id,
      styleCategory: template.category,
      front: generated.front,
      back: generated.back,
    }));

    setActiveStep('editor');
  };

  // Direct PDF Export
  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      const pdfDoc = await BusinessCardPdfExporter.generatePrintPdf(project, {
        includeBleed: true,
        includeCropMarks: true,
        dpi: 300,
        colorMode: 'cmyk_simulation',
      });
      pdfDoc.save(`${project.title || 'Meishi'}_print_artwork_300dpi_tonbo.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="w-full text-on-surface flex flex-col selection:bg-primary-container selection:text-on-primary-container">
      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-surface-container-high text-on-surface border border-border-subtle px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <span className="w-2 h-2 rounded-full bg-secondary" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* BREADCRUMB */}
      <ToolBreadcrumb
        title={t('brandTitle') || 'Tạo Danh Thiếp & Namecard AI'}
        onBackToHub={onBackToHub}
      />

      {/* CONTEXT HEADER */}
      <section className="w-full mb-6">
        <div className="relative overflow-hidden rounded-2xl bg-surface-container border border-border-subtle p-6 lg:p-8 shadow-sm">
          {/* Ambient Glow */}
          <div className="absolute -right-20 -top-20 w-96 h-96 bg-primary-container/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-40 -bottom-24 w-80 h-80 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-surface-container-high border border-border-subtle flex items-center justify-center text-primary shrink-0 shadow-md">
                <Contact className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl lg:text-3xl font-bold text-on-surface tracking-tight">
                    {t('brandTitle') || 'Tạo Danh Thiếp & Namecard AI'}
                  </h1>
                  <span className="text-[11px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-secondary/10 text-secondary border border-secondary/20">
                    {t('freeAppBadge') || '100% Client-Side'}
                  </span>
                </div>
                <p className="text-sm text-on-surface-variant max-w-3xl leading-relaxed">
                  {t('heroSub') ||
                    'Thiết kế và xuất file in danh thiếp thương mại 300 DPI kèm bù xén (Bleed 3mm) và dấu xén chuẩn Nhật (Tonbo). Tự động trích xuất màu sắc & thông tin từ ảnh chụp cũ bằng AI OCR, hỗ trợ 28 phong cách và in hàng loạt nhân viên.'}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-3 shrink-0">
              <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                <ShieldCheck className="w-3.5 h-3.5 text-secondary shrink-0" />
                <span>Xử lý trực tiếp trên trình duyệt — tệp không được tải lên máy chủ.</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {/* Preflight Badge Button */}
                <button
                  type="button"
                  onClick={() => setIsPreflightOpen(true)}
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                    preflight.passed
                      ? 'bg-secondary/10 text-secondary border-secondary/30 hover:bg-secondary/20'
                      : 'bg-tertiary/10 text-tertiary border-tertiary/30 hover:bg-tertiary/20'
                  }`}
                  title="Preflight Quality Check"
                >
                  {preflight.passed ? (
                    <ShieldCheck className="w-4 h-4 text-secondary" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-tertiary" />
                  )}
                  <span>
                    {t('preflightScore') || 'Kiểm định in'}: {preflight.score}/100
                  </span>
                </button>

                {/* Batch Employees */}
                <button
                  type="button"
                  onClick={() => setIsBatchOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle bg-surface-subtle text-xs font-semibold text-on-surface hover:bg-surface-container-high transition cursor-pointer"
                  title="Nạp danh sách nhân viên qua CSV"
                >
                  <Users className="w-4 h-4 text-primary" />
                  <span>{t('btnBatch') || 'Tạo nhân viên (CSV)'}</span>
                </button>

                {/* Save */}
                <button
                  type="button"
                  onClick={handleSaveProject}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle bg-surface-subtle text-xs font-semibold text-on-surface hover:bg-surface-container-high transition cursor-pointer"
                  title="Lưu vào bộ nhớ máy"
                >
                  <Save className="w-3.5 h-3.5 text-on-surface-variant" />
                  <span>{t('btnSave') || 'Lưu'}</span>
                </button>

                {/* Quick PDF Export */}
                <button
                  type="button"
                  disabled={isExportingPdf}
                  onClick={handleExportPdf}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle bg-surface-subtle text-xs font-semibold text-on-surface hover:bg-surface-container-high transition cursor-pointer disabled:opacity-50"
                  title="Tải nhanh PDF in 300 DPI"
                >
                  <Download className="w-3.5 h-3.5 text-secondary" />
                  <span>{t('btnExportPdf') || 'PDF 300 DPI'}</span>
                </button>

                {/* Commercial Print Suite */}
                <button
                  type="button"
                  id="btn-header-free-export"
                  onClick={() => setIsFreeExportOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary-container text-on-primary-container text-xs font-bold shadow hover:brightness-105 transition cursor-pointer"
                  title="Mở bộ xuất bản nhà in (PDF, PNG Proofs, ZIP bundle)"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{t('btnFreeExport') || 'Bộ xuất file in'}</span>
                </button>

                {/* Reset */}
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border-subtle bg-surface-subtle text-xs font-medium text-on-surface-variant hover:text-error hover:border-error/30 transition cursor-pointer"
                  title="Bắt đầu lại"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WORKFLOW STEPS INDICATOR */}
      <section className="w-full mb-6">
        <WorkflowSteps
          currentStep={activeStep}
          onStepClick={(step) => setActiveStep(step)}
        />
      </section>

      {/* MAIN STEP BODY */}
      <main className="w-full pb-12">
        {activeStep === 'input' && (
          <InputStep
            profile={project.profile}
            selectedDimension={project.dimension}
            orientation={project.orientation}
            isDoubleSided={project.isDoubleSided}
            selectedStyle={selectedStyle}
            onProfileChange={handleProfileChange}
            onDimensionChange={handleDimensionChange}
            onOrientationChange={handleOrientationChange}
            onDoubleSidedChange={handleDoubleSidedChange}
            onStyleChange={setSelectedStyle}
            onProceedToGenerate={() => setActiveStep('generate')}
          />
        )}

        {activeStep === 'generate' && (
          <GenerationStep
            profile={project.profile}
            dimension={project.dimension}
            orientation={project.orientation}
            isDoubleSided={project.isDoubleSided}
            onSelectTemplate={handleSelectTemplate}
            onOrientationChange={handleOrientationChange}
          />
        )}

        {activeStep === 'editor' && (
          <EditorStep
            project={project}
            preflight={preflight}
            onUpdateProject={setProject}
            onOpenPreflight={() => setIsPreflightOpen(true)}
            onOpenFreeExport={() => setIsFreeExportOpen(true)}
          />
        )}
      </main>

      {/* MODALS */}
      <FreeExportModal
        isOpen={isFreeExportOpen}
        onClose={() => setIsFreeExportOpen(false)}
        project={project}
        preflight={preflight}
      />

      <PreflightModal
        isOpen={isPreflightOpen}
        onClose={() => setIsPreflightOpen(false)}
        project={project}
        preflight={preflight}
        onUpdateProject={setProject}
      />

      <BatchEmployeeModal
        isOpen={isBatchOpen}
        onClose={() => setIsBatchOpen(false)}
        masterProject={project}
      />
    </div>
  );
}

export default function BusinessCardStudioView({ displayLang = 'vi', onBackToHub }) {
  return (
    <LanguageProvider initialLang={displayLang}>
      <BusinessCardStudioContent onBackToHub={onBackToHub} />
    </LanguageProvider>
  );
}
