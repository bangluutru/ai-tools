/**
 * @file hub/src/tools/mynumber-procedure-guide-jp/MyNumberProcedureGuideTool.jsx
 * @description Wrapper tool for My Number Procedure Guide in Toolio Hub.
 */

import React from 'react';
import { MyNumberProcedureGuideView } from '@ai-tools/core/components/documents/MyNumberProcedureGuideView.jsx';

export default function MyNumberProcedureGuideTool({ displayLang }) {
  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface">
      <MyNumberProcedureGuideView lang={displayLang || 'ja'} />
    </div>
  );
}
