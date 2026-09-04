/**
 * IdPhotoStudioTool.jsx
 * ========================================================================
 * Thin hub wrapper for ID Photo Studio — the passport & ID photo miniapp.
 * Follows the ai-tools "ToolErrorBoundary -> View" isolation pattern.
 */
import React from 'react';
import IdPhotoStudioView from '@ai-tools/core/components/IdPhotoStudioView';

export default function IdPhotoStudioTool({ displayLang }) {
  return <IdPhotoStudioView displayLang={displayLang} />;
}
