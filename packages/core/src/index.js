/**
 * @file @ai-tools/core Entrypoint
 * Re-exports primary components, utilities, hooks, and storage services.
 */

// Shared components
export { default as MiniAppLayout } from './components/shared/MiniAppLayout.jsx';
export { default as StandardToolLayout } from './components/shared/StandardToolLayout.jsx';
export { default as AccountingReconcileView } from './components/AccountingReconcileView.jsx';
export { default as AutoBiView } from './components/AutoBiView.jsx';
export { default as BarcodeQrStudioView } from './components/BarcodeQrStudioView.jsx';
export { default as ExcelMappingView } from './components/ExcelMappingView.jsx';
export { default as IdPhotoStudioView } from './components/IdPhotoStudioView.jsx';
export { default as BusinessCardStudioView } from './components/BusinessCardStudioView.jsx';
export { default as OmniConvertView } from './components/OmniConvertView.jsx';
export { default as ScreenCaptureView } from './components/ScreenCaptureView.jsx';
export { default as WatermarkStudioView } from './components/WatermarkStudioView.jsx';
export { default as DocStudioApp } from './components/editor-studio/DocStudioApp.jsx';
export { default as CertificateStudioView } from './components/CertificateStudioView.jsx';

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
} from './theme/themeManager.js';
export { useTheme } from './theme/useTheme.js';

