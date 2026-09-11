/**
 * @file hub/src/tools/salary-calculator-vn/SalaryCalculatorVNTool.jsx
 * @description Wrapper tool for Vietnam Salary Calculator (Gross ↔ Net) miniapp in Toolio Hub.
 */

import React from 'react';
import SalaryCalculatorVNView from '@ai-tools/core/components/vietnam/SalaryCalculatorVNView.jsx';

export default function SalaryCalculatorVNTool({ displayLang }) {
  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface">
      <SalaryCalculatorVNView displayLang={displayLang || 'vi'} />
    </div>
  );
}
