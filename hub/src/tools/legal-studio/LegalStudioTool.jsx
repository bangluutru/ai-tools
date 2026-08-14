import React, { useState } from 'react';
import LegalDocumentView from '../../components/LegalDocumentView';

export default function LegalStudioTool({ displayLang: initialLang }) {
  const [displayLang, setDisplayLang] = useState(initialLang || 'vi');

  return (
    <div className="w-full">
      <LegalDocumentView displayLang={displayLang} onLangChange={setDisplayLang} />
    </div>
  );
}
