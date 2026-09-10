/**
 * @file hub/src/tools/certificate-acquisition-guide-jp/CertificateAcquisitionGuideTool.jsx
 * @description Wrapper tool for Certificate Acquisition Guide (証明書取得ガイド) in Toolio Hub.
 */

import React from 'react';
import { CertificateAcquisitionGuideView } from '@ai-tools/core/components/documents/CertificateAcquisitionGuideView.jsx';

export default function CertificateAcquisitionGuideTool({ displayLang }) {
  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface">
      <CertificateAcquisitionGuideView lang={displayLang || 'ja'} />
    </div>
  );
}
