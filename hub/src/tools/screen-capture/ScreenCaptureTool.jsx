import React from 'react';
import ScreenCaptureView from '@ai-tools/core/components/ScreenCaptureView.jsx';

export default function ScreenCaptureTool({ displayLang }) {
  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface">
      <ScreenCaptureView displayLang={displayLang} />
    </div>
  );
}
