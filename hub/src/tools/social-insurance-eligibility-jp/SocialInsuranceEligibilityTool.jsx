import React from 'react';
import SocialInsuranceEligibilityView from '@ai-tools/core/components/insurance/SocialInsuranceEligibilityView.jsx';

export default function SocialInsuranceEligibilityTool({ displayLang }) {
  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface">
      <SocialInsuranceEligibilityView lang={displayLang || 'ja'} />
    </div>
  );
}
