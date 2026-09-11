/**
 * @file hub/src/tools/social-insurance-calculator-vn/SocialInsuranceCalculatorVNTool.jsx
 * @description Wrapper tool for Vietnam Social Insurance Calculator (BHXH, BHYT, BHTN) miniapp in Toolio Hub.
 */

import React from 'react';
import SocialInsuranceCalculatorVNView from '@ai-tools/core/components/vietnam/SocialInsuranceCalculatorVNView.jsx';

export default function SocialInsuranceCalculatorVNTool({ displayLang }) {
  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface">
      <SocialInsuranceCalculatorVNView displayLang={displayLang || 'vi'} />
    </div>
  );
}
