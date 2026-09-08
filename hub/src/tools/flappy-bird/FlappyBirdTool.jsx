import React from 'react';
import FlappyBirdView from '@ai-tools/core/components/FlappyBirdView.jsx';

export default function FlappyBirdTool({ displayLang }) {
  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface">
      <FlappyBirdView displayLang={displayLang} />
    </div>
  );
}
