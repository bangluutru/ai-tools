import React from 'react';
import BarcodeQrStudioView from '@ai-tools/core/components/BarcodeQrStudioView.jsx';

export default function BarcodeQrTool({ displayLang }) {
  return (
    <div className="w-full">
      <BarcodeQrStudioView displayLang={displayLang} />
    </div>
  );
}
