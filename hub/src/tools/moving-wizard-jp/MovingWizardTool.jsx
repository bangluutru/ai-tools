/**
 * @file hub/src/tools/moving-wizard-jp/MovingWizardTool.jsx
 * @description Wrapper tool for Japan Moving Guide & Orchestrator in Toolio Hub.
 */

import React from 'react';
import MovingWizardView from '@ai-tools/core/components/housing/MovingWizardView.jsx';

export default function MovingWizardTool({ displayLang }) {
  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface">
      <MovingWizardView lang={displayLang || 'ja'} />
    </div>
  );
}
