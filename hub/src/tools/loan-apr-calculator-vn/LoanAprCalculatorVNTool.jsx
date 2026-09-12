/**
 * @file hub/src/tools/loan-apr-calculator-vn/LoanAprCalculatorVNTool.jsx
 * @description Wrapper tool for Vietnam Loan APR & EAR Calculator in Toolio Hub.
 */

import React from 'react';
import LoanAprCalculatorVNView from '@ai-tools/core/components/vietnam/LoanAprCalculatorVNView.jsx';

export default function LoanAprCalculatorVNTool({ displayLang }) {
  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface">
      <LoanAprCalculatorVNView displayLang={displayLang || 'vi'} />
    </div>
  );
}
