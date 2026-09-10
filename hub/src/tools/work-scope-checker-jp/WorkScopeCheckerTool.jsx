/**
 * @file hub/src/tools/work-scope-checker-jp/WorkScopeCheckerTool.jsx
 * @description Wrapper tool for Japan Work Scope Checker miniapp in Toolio Hub.
 */

import React from 'react';
import WorkScopeCheckerView from '@ai-tools/core/components/immigration/WorkScopeCheckerView.jsx';

export default function WorkScopeCheckerTool({ displayLang }) {
  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface">
      <WorkScopeCheckerView lang={displayLang || 'ja'} />
    </div>
  );
}
