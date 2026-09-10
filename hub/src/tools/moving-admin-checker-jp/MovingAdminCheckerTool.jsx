/**
 * @file hub/src/tools/moving-admin-checker-jp/MovingAdminCheckerTool.jsx
 * @description Wrapper tool for Japan Moving Administrative Procedure Checker in Toolio Hub.
 */

import React from 'react';
import MovingAdminCheckerView from '@ai-tools/core/components/housing/MovingAdminCheckerView.jsx';

export default function MovingAdminCheckerTool({ displayLang }) {
  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface">
      <MovingAdminCheckerView lang={displayLang || 'ja'} />
    </div>
  );
}
