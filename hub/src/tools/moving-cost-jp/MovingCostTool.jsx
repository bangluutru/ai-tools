/**
 * @file hub/src/tools/moving-cost-jp/MovingCostTool.jsx
 * @description Wrapper tool for Japan Moving Cost Simulator miniapp in Toolio Hub.
 */

import React from 'react';
import MovingCostView from '@ai-tools/core/components/housing/MovingCostView.jsx';

export default function MovingCostTool({ displayLang }) {
  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface">
      <MovingCostView lang={displayLang || 'ja'} />
    </div>
  );
}
