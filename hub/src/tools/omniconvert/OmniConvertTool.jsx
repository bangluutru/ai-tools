import React from 'react';
import OmniConvertView from '@ai-tools/core/components/OmniConvertView.jsx';

export default function OmniConvertTool({ displayLang }) {
  return (
    <div className="w-full">
      <OmniConvertView displayLang={displayLang} />
    </div>
  );
}
