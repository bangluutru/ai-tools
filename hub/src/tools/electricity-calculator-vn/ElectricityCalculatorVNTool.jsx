/**
 * @file hub/src/tools/electricity-calculator-vn/ElectricityCalculatorVNTool.jsx
 * @description Wrapper tool for Vietnam Electricity Calculator miniapp in Toolio Hub.
 */

import React from 'react';
import ElectricityCalculatorVNView from '@ai-tools/core/components/vietnam/ElectricityCalculatorVNView.jsx';

export default function ElectricityCalculatorVNTool({ displayLang }) {
  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface">
      <ElectricityCalculatorVNView displayLang={displayLang || 'vi'} />
    </div>
  );
}
