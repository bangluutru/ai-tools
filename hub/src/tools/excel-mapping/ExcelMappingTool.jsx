import React from 'react';
import ExcelMappingView from '../../components/ExcelMappingView';
import { uiTranslations } from '../../utils/translations';

export default function ExcelMappingTool({ displayLang }) {
  const langKey = displayLang === 'vi' ? 'vn' : displayLang;
  const t = uiTranslations[langKey] || uiTranslations.vn;

  return (
    <div className="w-full">
      <ExcelMappingView t={t} displayLang={displayLang} />
    </div>
  );
}
