import React from 'react';
import TemplateOverlayView from '../../components/TemplateOverlayView';

export default function PdfOverlayTool({ displayLang }) {
  return (
    <div className="w-full">
      <TemplateOverlayView displayLang={displayLang} />
    </div>
  );
}
