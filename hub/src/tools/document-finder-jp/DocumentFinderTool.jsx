/**
 * @file hub/src/tools/document-finder-jp/DocumentFinderTool.jsx
 * @description Wrapper tool for Document Finder (必要書類ファインダー) in Toolio Hub.
 */

import React from 'react';
import { DocumentFinderView } from '@ai-tools/core/components/documents/DocumentFinderView.jsx';

export default function DocumentFinderTool({ displayLang }) {
  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface">
      <DocumentFinderView lang={displayLang || 'ja'} />
    </div>
  );
}
