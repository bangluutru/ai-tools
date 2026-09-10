/**
 * @file hub/src/tools/family-immigration-guide-jp/FamilyImmigrationGuideTool.jsx
 * @description Wrapper tool for Japan Family Immigration Guide in Toolio Hub.
 */

import React from 'react';
import FamilyImmigrationGuideView from '@ai-tools/core/components/immigration/FamilyImmigrationGuideView.jsx';

export default function FamilyImmigrationGuideTool({ displayLang }) {
  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface">
      <FamilyImmigrationGuideView lang={displayLang || 'ja'} />
    </div>
  );
}
