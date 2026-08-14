import React from 'react';
import ExcelMappingView from '@ai-tools/core/components/ExcelMappingView';
import { uiTranslations } from '@ai-tools/core/utils/translations';

export default function ExcelMappingTool({ displayLang }) {
  const langKey = displayLang === 'vi' ? 'vn' : displayLang;
  const t = uiTranslations[langKey] || uiTranslations.vn;

  return (
    <div className="w-full">
      <ExcelMappingView t={t} displayLang={displayLang} />
    </div>
  );
}
