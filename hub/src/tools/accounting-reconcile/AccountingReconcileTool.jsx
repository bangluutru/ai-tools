import React from 'react';
import AccountingReconcileView from '@ai-tools/core/components/AccountingReconcileView.jsx';

export default function AccountingReconcileTool({ displayLang }) {
  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface">
      <AccountingReconcileView displayLang={displayLang} />
    </div>
  );
}
