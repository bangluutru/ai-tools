/**
 * @file hub/src/tools/child-allowance-jp/ChildAllowanceTool.jsx
 * @description Wrapper tool for Japan Child Allowance Checker (児童手当チェッカー) in Toolio Hub.
 */

import React from 'react';
import ChildAllowanceView from '@ai-tools/core/components/family/ChildAllowanceView.jsx';

export default function ChildAllowanceTool({ displayLang }) {
  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface">
      <ChildAllowanceView lang={displayLang || 'ja'} />
    </div>
  );
}
