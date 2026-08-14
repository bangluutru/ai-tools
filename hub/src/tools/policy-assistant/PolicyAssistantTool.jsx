import React from 'react';
import PolicyAssistantView from '@ai-tools/core/components/PolicyAssistantView.jsx';

export default function PolicyAssistantTool({ displayLang }) {
  return (
    <div className="w-full">
      <PolicyAssistantView displayLang={displayLang} />
    </div>
  );
}
