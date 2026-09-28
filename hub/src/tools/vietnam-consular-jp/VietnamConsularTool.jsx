/**
 * @file hub/src/tools/vietnam-consular-jp/VietnamConsularTool.jsx
 * @description Vietnam Consular Procedure Workspace in Japan for Toolio Hub.
 */

import React from 'react';
import { getRouteQueryParam } from '../../utils/navigation';
import VietnamConsularWorkspace from '@ai-tools/core/components/consular/VietnamConsularWorkspace.jsx';

function readInitialProcedureId() {
  try {
    const id = getRouteQueryParam('procedureId');
    return id && /^vn_[a-z0-9_]+$/.test(id) ? id : undefined;
  } catch {
    return undefined;
  }
}

export default function VietnamConsularTool({ displayLang = 'vi', onSelectTool }) {
  const initialProcedureId = typeof window !== 'undefined' ? readInitialProcedureId() : undefined;
  return (
    <div className="w-full max-w-[1240px] mx-auto text-on-surface">
      <VietnamConsularWorkspace
        initialProcedureId={initialProcedureId}
        onNavigateToTool={onSelectTool}
        displayLang={displayLang}
      />
    </div>
  );
}
