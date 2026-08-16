/**
 * WatermarkStudioTool.jsx
 * ========================================================================
 * Thin hub wrapper for Watermark Studio — the file watermarking miniapp.
 * Follows the ai-tools "ToolErrorBoundary → View" isolation pattern.
 */
import React from 'react';
import WatermarkStudioView from '@ai-tools/core/components/WatermarkStudioView';

export default function WatermarkStudioTool({ displayLang }) {
  return <WatermarkStudioView displayLang={displayLang} />;
}
