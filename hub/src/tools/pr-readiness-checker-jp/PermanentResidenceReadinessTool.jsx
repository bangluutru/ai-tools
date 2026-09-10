/**
 * @file hub/src/tools/pr-readiness-checker-jp/PermanentResidenceReadinessTool.jsx
 * @description Wrapper tool for Japan Permanent Residence Readiness Checker in Toolio Hub.
 */

import React from 'react';
import PermanentResidenceReadinessView from '@ai-tools/core/components/immigration/PermanentResidenceReadinessView.jsx';

export default function PermanentResidenceReadinessTool({ displayLang }) {
  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface">
      <PermanentResidenceReadinessView lang={displayLang || 'ja'} />
    </div>
  );
}
