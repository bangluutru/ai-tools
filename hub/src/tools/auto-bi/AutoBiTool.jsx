import React from 'react';
import AutoBiView from '@ai-tools/core/components/AutoBiView.jsx';

export default function AutoBiTool({ displayLang }) {
  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
      <AutoBiView displayLang={displayLang} />
    </div>
  );
}
