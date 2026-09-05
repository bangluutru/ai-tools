import React, { useState } from 'react';
import CertificateStudioView from '@ai-tools/core/components/CertificateStudioView.jsx';

export default function App() {
  const [displayLang] = useState('vi');

  return (
    <CertificateStudioView displayLang={displayLang} />
  );
}
