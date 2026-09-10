import React from 'react';
import SocialInsuranceSimulatorView from '@ai-tools/core/components/insurance/SocialInsuranceSimulatorView.jsx';

export default function SocialInsuranceSimulatorTool({ displayLang }) {
  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface">
      <SocialInsuranceSimulatorView lang={displayLang || 'ja'} />
    </div>
  );
}
