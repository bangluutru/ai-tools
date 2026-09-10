/**
 * @file hub/src/tools/administrative-navigator-jp/AdministrativeNavigatorTool.jsx
 * @description Wrapper tool for Administrative Navigator in Toolio Hub.
 */

import React from 'react';
import { AdministrativeNavigatorView } from '@ai-tools/core/components/documents/AdministrativeNavigatorView.jsx';

export default function AdministrativeNavigatorTool({ displayLang }) {
  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface">
      <AdministrativeNavigatorView lang={displayLang || 'ja'} />
    </div>
  );
}
