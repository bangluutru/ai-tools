import React from 'react';
import ContractAuditorView from '@ai-tools/core/components/ContractAuditorView.jsx';

export default function ContractAuditorTool({ displayLang }) {
  return (
    <div className="w-full">
      <ContractAuditorView displayLang={displayLang} />
    </div>
  );
}
