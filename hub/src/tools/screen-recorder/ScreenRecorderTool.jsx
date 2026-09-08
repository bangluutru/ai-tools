/**
 * ScreenRecorderTool.jsx
 * ========================================================================
 * Thin hub wrapper for Screen Recorder miniapp.
 * Follows the ai-tools standard isolation & layout pattern.
 */
import React from 'react';
import ScreenRecorderView from '@ai-tools/core/components/ScreenRecorderView.jsx';

export default function ScreenRecorderTool({ displayLang }) {
  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface">
      <ScreenRecorderView displayLang={displayLang} />
    </div>
  );
}
