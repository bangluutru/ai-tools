import React from 'react';
import DocStudioApp from '@ai-tools/core/components/editor-studio/DocStudioApp.jsx';

export default function EditorStudioTool({ displayLang }) {
  return (
    <div className="w-full">
      <DocStudioApp displayLang={displayLang} />
    </div>
  );
}
