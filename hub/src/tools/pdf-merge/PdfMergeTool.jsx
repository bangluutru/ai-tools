import React from 'react';
import PdfMergerView from '../../components/PdfMergerView';

export default function PdfMergeTool({ displayLang }) {
  return (
    <div className="w-full">
      <PdfMergerView displayLang={displayLang} />
    </div>
  );
}
