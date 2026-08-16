import React from 'react';
import AccountingReconcileView from '@ai-tools/core/components/AccountingReconcileView.jsx';

export default function AccountingReconcileTool({ displayLang }) {
  return (
    <div className="w-full">
      <AccountingReconcileView displayLang={displayLang} />
    </div>
  );
}
