/**
 * @file hub/src/tools/affiliation-change-checker-jp/AffiliationChangeCheckerTool.jsx
 * @description Wrapper tool for Japan Affiliation Change Checker in Toolio Hub.
 */

import React from 'react';
import { AffiliationChangeCheckerView } from '@ai-tools/core/components/immigration/AffiliationChangeCheckerView.jsx';

export default function AffiliationChangeCheckerTool({ displayLang }) {
  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface">
      <AffiliationChangeCheckerView lang={displayLang || 'ja'} />
    </div>
  );
}
