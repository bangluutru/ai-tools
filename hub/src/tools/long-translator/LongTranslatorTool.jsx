import React from 'react';
import LongDocTranslatorView from '@ai-tools/core/components/LongDocTranslatorView';

export default function LongTranslatorTool({ displayLang }) {
  return (
    <div className="w-full">
      <LongDocTranslatorView displayLang={displayLang} />
    </div>
  );
}
