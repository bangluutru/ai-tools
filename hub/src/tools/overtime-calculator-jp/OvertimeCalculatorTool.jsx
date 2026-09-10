/**
 * @file hub/src/tools/overtime-calculator-jp/OvertimeCalculatorTool.jsx
 * @description Wrapper tool for Overtime Calculator miniapp in Toolio Hub.
 */

import React from 'react';
import OvertimeCalculatorView from '@ai-tools/core/components/employment/OvertimeCalculatorView.jsx';

export default function OvertimeCalculatorTool({ displayLang }) {
  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface">
      <OvertimeCalculatorView lang={displayLang || 'ja'} />
    </div>
  );
}
