import React from 'react';
import TaxCalculatorView from '@ai-tools/core/components/TaxCalculatorView.jsx';

export default function TaxCalculatorTool({ displayLang }) {
  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface">
      <TaxCalculatorView displayLang={displayLang} />
    </div>
  );
}
