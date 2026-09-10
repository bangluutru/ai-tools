/**
 * @file hub/src/tools/birth-wizard-jp/BirthWizardTool.jsx
 * @description Wrapper tool for Japan Birth & Childcare Wizard (妊娠・出産・育児総合ガイド) in Toolio Hub.
 */

import React from 'react';
import BirthWizardView from '@ai-tools/core/components/family/BirthWizardView.jsx';

export default function BirthWizardTool({ displayLang }) {
  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface">
      <BirthWizardView lang={displayLang || 'ja'} />
    </div>
  );
}
