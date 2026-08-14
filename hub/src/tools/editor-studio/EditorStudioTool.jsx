import React from 'react';
import DocStudioApp from '../../components/docstudio/DocStudioApp';

export default function EditorStudioTool({ displayLang }) {
  return (
    <div className="w-full">
      <DocStudioApp displayLang={displayLang} />
    </div>
  );
}
