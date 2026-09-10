/**
 * @file hub/src/tools/leaving-japan-wizard-jp/LeavingJapanWizardTool.jsx
 * @description Wrapper tool for Japan Leaving Procedure Guide (Leaving Japan Wizard) in Toolio Hub.
 */

import React from 'react';
import LeavingJapanWizardView from '@ai-tools/core/components/immigration/LeavingJapanWizardView.jsx';

export default function LeavingJapanWizardTool({ displayLang }) {
  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface">
      <LeavingJapanWizardView lang={displayLang || 'ja'} />
    </div>
  );
}
