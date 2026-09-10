/**
 * @file hub/src/tools/paid-leave-checker-jp/PaidLeaveCheckerTool.jsx
 * @description Wrapper tool for Paid Leave Checker miniapp in Toolio Hub.
 */

import React from 'react';
import PaidLeaveCheckerView from '@ai-tools/core/components/employment/PaidLeaveCheckerView.jsx';

export default function PaidLeaveCheckerTool({ displayLang }) {
  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface">
      <PaidLeaveCheckerView lang={displayLang || 'ja'} />
    </div>
  );
}
