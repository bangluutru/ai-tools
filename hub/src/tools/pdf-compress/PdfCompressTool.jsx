import React from 'react';
import PdfCompressorView from '@ai-tools/core/components/PdfCompressorView.jsx';

export default function PdfCompressTool({ displayLang }) {
  return (
    <div className="w-full">
      <PdfCompressorView displayLang={displayLang} />
    </div>
  );
}
