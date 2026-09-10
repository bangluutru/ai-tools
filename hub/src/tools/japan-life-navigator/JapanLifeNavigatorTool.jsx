/**
 * @file hub/src/tools/japan-life-navigator/JapanLifeNavigatorTool.jsx
 * @description Wrapper tool for Japan Life Navigator in Toolio Hub.
 */

import React from 'react';
import { JapanLifeNavigatorView } from '@ai-tools/core';

export default function JapanLifeNavigatorTool({ displayLang }) {
  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface">
      <JapanLifeNavigatorView lang={displayLang || 'vi'} />
    </div>
  );
}
