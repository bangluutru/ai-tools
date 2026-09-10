/**
 * @file hub/src/tools/procedure-requirement-checker-jp/ProcedureRequirementCheckerTool.jsx
 * @description Wrapper tool for Procedure Requirement Checker in Toolio Hub.
 */

import React from 'react';
import { ProcedureRequirementCheckerView } from '@ai-tools/core/components/documents/ProcedureRequirementCheckerView.jsx';

export default function ProcedureRequirementCheckerTool({ displayLang }) {
  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface">
      <ProcedureRequirementCheckerView lang={displayLang || 'ja'} />
    </div>
  );
}
