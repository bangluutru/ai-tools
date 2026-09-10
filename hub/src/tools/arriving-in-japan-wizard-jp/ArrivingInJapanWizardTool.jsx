/**
 * @file hub/src/tools/arriving-in-japan-wizard-jp/ArrivingInJapanWizardTool.jsx
 * @description Wrapper tool for Japan Newcomer Setup Guide (Arriving in Japan Wizard) in Toolio Hub.
 */

import React from 'react';
import ArrivingInJapanWizardView from '@ai-tools/core/components/immigration/ArrivingInJapanWizardView.jsx';

export default function ArrivingInJapanWizardTool({ displayLang }) {
  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface">
      <ArrivingInJapanWizardView lang={displayLang || 'ja'} />
    </div>
  );
}
