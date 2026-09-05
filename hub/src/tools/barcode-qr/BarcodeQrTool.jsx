import React from 'react';
import BarcodeQrStudioView from '@ai-tools/core/components/BarcodeQrStudioView.jsx';

export default function BarcodeQrTool({ displayLang }) {
  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface">
      <BarcodeQrStudioView displayLang={displayLang} />
    </div>
  );
}
