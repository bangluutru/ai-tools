import React from 'react';
import TemplateOverlayView from '@ai-tools/core/components/TemplateOverlayView.jsx';

export default function PdfOverlayTool({ displayLang }) {
  return (
    <div className="w-full">
      <TemplateOverlayView displayLang={displayLang} />
    </div>
  );
}
