import React from 'react';
import ScreenCaptureView from '@ai-tools/core/components/ScreenCaptureView.jsx';

export default function ScreenCaptureTool({ displayLang }) {
  return (
    <div className="w-full">
      <ScreenCaptureView displayLang={displayLang} />
    </div>
  );
}
