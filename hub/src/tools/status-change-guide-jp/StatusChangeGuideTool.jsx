/**
 * @file hub/src/tools/status-change-guide-jp/StatusChangeGuideTool.jsx
 * @description Wrapper tool for Japan Status Change Guide in Toolio Hub.
 */

import React from 'react';
import StatusChangeGuideView from '@ai-tools/core/components/immigration/StatusChangeGuideView.jsx';

export default function StatusChangeGuideTool({ displayLang }) {
  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface">
      <StatusChangeGuideView lang={displayLang || 'ja'} />
    </div>
  );
}
