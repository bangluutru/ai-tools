/**
 * @file @ai-tools/core Entrypoint
 * Re-exports primary components, utilities, hooks, and storage services.
 */

// Shared components
export { default as MiniAppLayout } from './components/shared/MiniAppLayout.jsx';
export { default as StandardToolLayout } from './components/shared/StandardToolLayout.jsx';
export { default as AccountingReconcileView } from './components/AccountingReconcileView.jsx';
export { default as BarcodeQrStudioView } from './components/BarcodeQrStudioView.jsx';
export { default as ExcelMappingView } from './components/ExcelMappingView.jsx';
export { default as IdPhotoStudioView } from './components/IdPhotoStudioView.jsx';
export { default as BusinessCardStudioView } from './components/BusinessCardStudioView.jsx';
export { default as OmniConvertView } from './components/OmniConvertView.jsx';
export { default as ScreenCaptureView } from './components/ScreenCaptureView.jsx';
export { default as WatermarkStudioView } from './components/WatermarkStudioView.jsx';
export { default as DocStudioApp } from './components/editor-studio/DocStudioApp.jsx';
export { default as CertificateStudioView } from './components/CertificateStudioView.jsx';
export { default as TaxCalculatorView } from './components/TaxCalculatorView.jsx';
export { default as JapanTaxSimulatorView } from './components/JapanTaxSimulatorView.jsx';
export { default as SocialInsuranceSimulatorView } from './components/insurance/SocialInsuranceSimulatorView.jsx';
export { default as SocialInsuranceEligibilityView } from './components/insurance/SocialInsuranceEligibilityView.jsx';
export { NationalPensionView } from './components/insurance/NationalPensionView.jsx';
export { default as DependentInsuranceView } from './components/insurance/DependentInsuranceView.jsx';
export { default as OvertimeCalculatorView } from './components/employment/OvertimeCalculatorView.jsx';
export { default as PaidLeaveCheckerView } from './components/employment/PaidLeaveCheckerView.jsx';
export { default as UnemploymentEligibilityView } from './components/employment/UnemploymentEligibilityView.jsx';
export { default as UnemploymentBenefitView } from './components/employment/UnemploymentBenefitView.jsx';
export { default as LeavingJobWizardView } from './components/employment/LeavingJobWizardView.jsx';
export { default as MaternityAllowanceView } from './components/family/MaternityAllowanceView.jsx';
export { default as ChildcareLeaveEligibilityView } from './components/family/ChildcareLeaveEligibilityView.jsx';
export { default as ChildcareBenefitView } from './components/family/ChildcareBenefitView.jsx';
export { default as ChildAllowanceView } from './components/family/ChildAllowanceView.jsx';
export { default as BirthWizardView } from './components/family/BirthWizardView.jsx';
export { default as MovingCostView } from './components/housing/MovingCostView.jsx';
export { default as FlappyBirdView } from './components/FlappyBirdView.jsx';
export { DocumentFinderView } from './components/documents/DocumentFinderView.jsx';
export { CertificateAcquisitionGuideView } from './components/documents/CertificateAcquisitionGuideView.jsx';
export { MyNumberProcedureGuideView } from './components/documents/MyNumberProcedureGuideView.jsx';
export { OfficialFormHelperView } from './components/documents/OfficialFormHelperView.jsx';
export { ProcedureRequirementCheckerView } from './components/documents/ProcedureRequirementCheckerView.jsx';
export { AdministrativeNavigatorView } from './components/documents/AdministrativeNavigatorView.jsx';
export { JapanLifeNavigatorView } from './components/navigator/JapanLifeNavigatorView.jsx';

// Core Hooks
export { useLocalStorage } from './hooks/useLocalStorage.js';
export { useOverflowDetect } from './hooks/useOverflowDetect.js';
export { useAntigravityAgent } from './hooks/useAntigravityAgent.js';

// Storage Service
export { default as storage } from './services/storage.js';

// Theme System (Single Source of Truth)
export {
  THEME_STORAGE_KEY,
  THEMES,
  getStoredThemePreference,
  setStoredThemePreference,
  getSystemTheme,
  resolveTheme,
  applyThemeToDom,
  applyTheme,
  initTheme,
  subscribeTheme,
  SKIN_STORAGE_KEY,
  SKINS,
  DEFAULT_SKIN,
  getStoredSkin,
  setStoredSkin,
  applySkinToDom,
  applySkin,
  initSkin,
  subscribeSkin,
} from './theme/themeManager.js';
export { useTheme, useSkin } from './theme/useTheme.js';

// Regulatory Foundation (Shared across JP, VN, etc.)
export * from './regulatory/index.js';

// Japan Life - Insurance Domain
export * from './japan/insurance/index.js';

// Japan Life - Employment Domain
export * from './japan/employment/index.js';

// Japan Life - Family & Child Domain
export * from './japan/family/index.js';

// Japan Life - Housing & Moving Domain
export * from './japan/housing/index.js';

// Life Event Foundation (Shared lifecycle runtime)
export * from './life-events/index.js';

// Japan Life - Administrative Procedures & Documents Domain
export * from './documents/index.js';

// Japan Life - Navigator Layer
export * from './navigator/index.js';

// Vietnam Life - Components
export { default as SalaryCalculatorVNView } from './components/vietnam/SalaryCalculatorVNView.jsx';
export { default as LoanAprCalculatorVNView } from './components/vietnam/LoanAprCalculatorVNView.jsx';
export { default as SocialInsuranceCalculatorVNView } from './components/vietnam/SocialInsuranceCalculatorVNView.jsx';
export { default as ElectricityCalculatorVNView } from './components/vietnam/ElectricityCalculatorVNView.jsx';

// Vietnam Life - Domain & Legal Engines
export * from './vietnam/index.js';

// Vietnam Consular in Japan - Components & Engines
export { default as VietnamConsularWorkspace } from './components/consular/VietnamConsularWorkspace.jsx';
export { default as ConsularHeader } from './components/consular/ConsularHeader.jsx';
export { default as ProcedureNavigatorPane } from './components/consular/ProcedureNavigatorPane.jsx';
export { default as ProcedureGuidePane } from './components/consular/ProcedureGuidePane.jsx';
export { default as DocumentWorkspacePane } from './components/consular/DocumentWorkspacePane.jsx';
export { default as StructuredFormEditor } from './components/consular/StructuredFormEditor.jsx';
export { default as A4PreviewViewport, A4_LOGICAL_WIDTH, A4_LOGICAL_HEIGHT, A4_ASPECT_RATIO } from './components/consular/A4PreviewViewport.jsx';
export { default as OfficialFormPreview } from './components/consular/OfficialFormPreview.jsx';
export { default as FormOutputToolbar } from './components/consular/FormOutputToolbar.jsx';
export { default as EasyFillForm } from './components/consular/EasyFillForm.jsx';
export * from './consular/index.js';
