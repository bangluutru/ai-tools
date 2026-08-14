import React from 'react';
import AccountingReconcileView from '@ai-tools/core/components/AccountingReconcileView.jsx';

export default function AccountingReconcileTool({ displayLang }) {
  return (
    <div className="w-full">
      <div className="max-w-6xl mx-auto px-4 py-8 mb-4">
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight text-center">
          {displayLang === 'en' ? 'Accounting Reconciliation' : 'Đối Chiếu Kế Toán'}
        </h2>
        <p className="text-slate-400 text-center mt-2">
          {displayLang === 'en' 
            ? 'Compare revenue and VAT between internal ledgers (511, 33311) and tax authority invoices (BR).'
            : 'Tự động đối chiếu chênh lệch doanh thu và thuế GTGT giữa sổ kế toán nội bộ và bảng kê hóa đơn thuế.'}
        </p>
      </div>
      <AccountingReconcileView displayLang={displayLang} />
    </div>
  );
}
