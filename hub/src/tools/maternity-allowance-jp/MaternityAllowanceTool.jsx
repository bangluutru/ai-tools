/**
 * @file hub/src/tools/maternity-allowance-jp/MaternityAllowanceTool.jsx
 * @description Wrapper tool for Japan Maternity Allowance Simulator (出産手当金シミュレーター) in Toolio Hub.
 */

import React from 'react';
import MaternityAllowanceView from '@ai-tools/core/components/family/MaternityAllowanceView.jsx';

export default function MaternityAllowanceTool({ displayLang }) {
  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface">
      <MaternityAllowanceView lang={displayLang || 'ja'} />
    </div>
  );
}
