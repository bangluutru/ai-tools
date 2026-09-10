import React from 'react';
import JapanTaxSimulatorView from '@ai-tools/core/components/JapanTaxSimulatorView.jsx';

export default function JapanTaxSimulatorTool({ displayLang }) {
  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface">
      <JapanTaxSimulatorView displayLang={displayLang} />
    </div>
  );
}
