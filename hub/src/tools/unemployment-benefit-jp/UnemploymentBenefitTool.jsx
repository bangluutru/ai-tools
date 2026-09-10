/**
 * @file hub/src/tools/unemployment-benefit-jp/UnemploymentBenefitTool.jsx
 * @description Wrapper tool for Unemployment Benefit Simulator miniapp in Toolio Hub.
 */

import React from 'react';
import UnemploymentBenefitView from '@ai-tools/core/components/employment/UnemploymentBenefitView.jsx';

export default function UnemploymentBenefitTool({ displayLang }) {
  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface">
      <UnemploymentBenefitView lang={displayLang || 'ja'} />
    </div>
  );
}
