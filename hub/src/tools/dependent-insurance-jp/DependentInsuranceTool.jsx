import React from 'react';
import DependentInsuranceView from '@ai-tools/core/components/insurance/DependentInsuranceView.jsx';

export default function DependentInsuranceTool({ displayLang }) {
  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface">
      <DependentInsuranceView lang={displayLang || 'ja'} />
    </div>
  );
}
