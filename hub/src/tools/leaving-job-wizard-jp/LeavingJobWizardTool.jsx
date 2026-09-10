/**
 * @file hub/src/tools/leaving-job-wizard-jp/LeavingJobWizardTool.jsx
 * @description Wrapper tool for Japan Leaving Job Wizard & Orchestrator miniapp in Toolio Hub.
 */

import React from 'react';
import LeavingJobWizardView from '@ai-tools/core/components/employment/LeavingJobWizardView.jsx';

export default function LeavingJobWizardTool({ displayLang }) {
  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface">
      <LeavingJobWizardView lang={displayLang || 'ja'} />
    </div>
  );
}
