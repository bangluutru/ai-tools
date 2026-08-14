import React from 'react';
import PdfMergerView from '@ai-tools/core/components/PdfMergerView';

export default function PdfMergeTool({ displayLang }) {
  return (
    <div className="w-full">
      <PdfMergerView displayLang={displayLang} />
    </div>
  );
}
