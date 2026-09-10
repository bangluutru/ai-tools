/**
 * @file hub/src/tools/residence-renewal-guide-jp/ResidenceRenewalGuideTool.jsx
 * @description Wrapper tool for Japan Residence Renewal Guide miniapp in Toolio Hub.
 */

import React from 'react';
import { ResidenceRenewalGuideView } from '@ai-tools/core/components/immigration/ResidenceRenewalGuideView.jsx';

export default function ResidenceRenewalGuideTool({ displayLang }) {
  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface">
      <ResidenceRenewalGuideView lang={displayLang || 'ja'} />
    </div>
  );
}
