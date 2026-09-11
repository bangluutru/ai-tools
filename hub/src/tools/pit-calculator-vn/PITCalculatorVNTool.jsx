/**
 * @file hub/src/tools/pit-calculator-vn/PITCalculatorVNTool.jsx
 * @description Wrapper tool for Vietnam PIT Calculator 2026 miniapp in Toolio Hub.
 */

import React from 'react';
import PITCalculatorVNView from '@ai-tools/core/components/vietnam/PITCalculatorVNView.jsx';

export default function PITCalculatorVNTool({ displayLang }) {
  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface">
      <PITCalculatorVNView displayLang={displayLang || 'vi'} />
    </div>
  );
}
