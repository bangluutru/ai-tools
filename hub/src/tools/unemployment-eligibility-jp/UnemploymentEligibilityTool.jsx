/**
 * @file hub/src/tools/unemployment-eligibility-jp/UnemploymentEligibilityTool.jsx
 * @description Wrapper tool for Unemployment Eligibility Checker miniapp in Toolio Hub.
 */

import React from 'react';
import UnemploymentEligibilityView from '@ai-tools/core/components/employment/UnemploymentEligibilityView.jsx';

export default function UnemploymentEligibilityTool({ displayLang }) {
  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface">
      <UnemploymentEligibilityView lang={displayLang || 'ja'} />
    </div>
  );
}
