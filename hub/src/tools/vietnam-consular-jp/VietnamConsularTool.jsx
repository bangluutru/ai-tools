/**
 * @file hub/src/tools/vietnam-consular-jp/VietnamConsularTool.jsx
 * @description Vietnam Consular Procedure Workspace in Japan for Toolio Hub.
 */

import React from 'react';
import { VietnamConsularWorkspace } from '@ai-tools/core';

export default function VietnamConsularTool({ displayLang = 'vi', onSelectTool }) {
  return (
    <div className="w-full max-w-[1240px] mx-auto text-on-surface">
      <VietnamConsularWorkspace
        onNavigateToTool={onSelectTool}
        displayLang={displayLang}
      />
    </div>
  );
}
