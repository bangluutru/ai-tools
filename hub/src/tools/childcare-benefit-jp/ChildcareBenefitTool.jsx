/**
 * @file hub/src/tools/childcare-benefit-jp/ChildcareBenefitTool.jsx
 * @description Wrapper tool for Japan Childcare Leave Benefit Simulator (育児休業給付金シミュレーター) in Toolio Hub.
 */

import React from 'react';
import ChildcareBenefitView from '@ai-tools/core/components/family/ChildcareBenefitView.jsx';

export default function ChildcareBenefitTool({ displayLang }) {
  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface">
      <ChildcareBenefitView lang={displayLang || 'ja'} />
    </div>
  );
}
