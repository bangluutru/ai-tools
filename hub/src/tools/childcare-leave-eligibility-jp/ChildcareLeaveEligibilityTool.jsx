/**
 * @file hub/src/tools/childcare-leave-eligibility-jp/ChildcareLeaveEligibilityTool.jsx
 * @description Wrapper tool for Japan Childcare Leave & Benefit Checker (育児休業・給付チェッカー) in Toolio Hub.
 */

import React from 'react';
import ChildcareLeaveEligibilityView from '@ai-tools/core/components/family/ChildcareLeaveEligibilityView.jsx';

export default function ChildcareLeaveEligibilityTool({ displayLang }) {
  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface">
      <ChildcareLeaveEligibilityView lang={displayLang || 'ja'} />
    </div>
  );
}
