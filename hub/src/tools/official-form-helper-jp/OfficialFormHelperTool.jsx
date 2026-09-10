/**
 * @file hub/src/tools/official-form-helper-jp/OfficialFormHelperTool.jsx
 * @description Wrapper tool for Official Form Helper in Toolio Hub.
 */

import React from 'react';
import { OfficialFormHelperView } from '@ai-tools/core/components/documents/OfficialFormHelperView.jsx';

export default function OfficialFormHelperTool({ displayLang }) {
  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface">
      <OfficialFormHelperView lang={displayLang || 'ja'} />
    </div>
  );
}
