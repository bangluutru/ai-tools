import React from 'react';
import NationalPensionView from '@ai-tools/core/components/insurance/NationalPensionView.jsx';

export default function NationalPensionTool({ displayLang }) {
  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface">
      <NationalPensionView lang={displayLang || 'ja'} />
    </div>
  );
}
