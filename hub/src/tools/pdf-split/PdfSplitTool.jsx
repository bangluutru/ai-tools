import React from 'react';
import PdfSplitterView from '../../components/PdfSplitterView';

export default function PdfSplitTool({ displayLang }) {
  return (
    <div className="w-full">
      <PdfSplitterView displayLang={displayLang} />
    </div>
  );
}
