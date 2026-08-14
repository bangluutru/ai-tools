import React from 'react';
import AutoBiView from '@ai-tools/core/components/AutoBiView.jsx';

export default function AutoBiTool({ displayLang }) {
  return (
    <div className="w-full">
      <AutoBiView displayLang={displayLang} />
    </div>
  );
}
