/**
 * WatermarkStudioTool.jsx
 * ========================================================================
 * Thin hub wrapper for Watermark Studio — the file watermarking miniapp.
 * Follows the ai-tools "ToolErrorBoundary → View" isolation pattern.
 */
import React from 'react';
import WatermarkStudioView from '@ai-tools/core/components/WatermarkStudioView';

export default function WatermarkStudioTool({ displayLang }) {
  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface">
      <WatermarkStudioView displayLang={displayLang} />
    </div>
  );
}
