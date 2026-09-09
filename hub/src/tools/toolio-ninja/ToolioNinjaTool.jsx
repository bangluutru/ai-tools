import React from 'react';
import ToolioNinjaView from '@ai-tools/core/components/ToolioNinjaView.jsx';

export default function ToolioNinjaTool({ displayLang }) {
  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface">
      <ToolioNinjaView displayLang={displayLang} />
    </div>
  );
}
