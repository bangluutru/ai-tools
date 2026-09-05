/**
 * BusinessCardStudioTool.jsx
 * ========================================================================
 * Thin hub wrapper for Business Card Studio — the commercial business card miniapp.
 * Follows the ai-tools "ToolErrorBoundary → View" isolation pattern.
 */
import React from 'react';
import BusinessCardStudioView from '@ai-tools/core/components/BusinessCardStudioView';

export default function BusinessCardStudioTool({ displayLang, onBackToHub }) {
  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface">
      <BusinessCardStudioView displayLang={displayLang} onBackToHub={onBackToHub} />
    </div>
  );
}
