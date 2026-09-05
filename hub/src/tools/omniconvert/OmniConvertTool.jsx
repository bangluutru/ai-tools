import React from 'react';
import OmniConvertView from '@ai-tools/core/components/OmniConvertView.jsx';

export default function OmniConvertTool({ displayLang }) {
  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface">
      <OmniConvertView displayLang={displayLang} />
    </div>
  );
}
