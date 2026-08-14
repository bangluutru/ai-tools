import React from 'react';
import PdfSplitterView from '@ai-tools/core/components/PdfSplitterView.jsx';

export default function PdfSplitTool({ displayLang }) {
  return (
    <div className="w-full">
      <PdfSplitterView displayLang={displayLang} />
    </div>
  );
}
