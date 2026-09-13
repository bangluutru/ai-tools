import React from 'react';
import { FileText, ExternalLink, Sparkles } from 'lucide-react';
import StructuredFormEditor from './StructuredFormEditor.jsx';
import { getFormById } from '../../consular/forms/index.js';
import { getConsularI18n } from '../../consular/i18n/consularI18n.js';

export default function DocumentWorkspacePane({
  activeFormId,
  procedure,
  onCloseForm,
  isExpanded = false,
  onToggleExpand,
  displayLang = 'vi',
}) {
  const t = getConsularI18n(displayLang);
  const formConfig = activeFormId ? getFormById(activeFormId) : null;

  if (formConfig) {
    return (
      <div className="h-full min-h-[600px]">
        <StructuredFormEditor
          formConfig={formConfig}
          onClose={onCloseForm}
          isExpanded={isExpanded}
          onToggleExpand={onToggleExpand}
          displayLang={displayLang}
        />
      </div>
    );
  }

  // Nếu không có form nào đang mở
  return (
    <div className="bg-surface-container-low border border-border-subtle rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between h-full min-h-[420px]">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-outline uppercase tracking-wider">
          <FileText size={15} className="text-primary" />
          <span>{t.workspaceEmpty.title}</span>
        </div>

        <div className="bg-surface-container p-4 rounded-xl border border-border-subtle space-y-2">
          <h4 className="text-sm font-bold text-on-surface">
            {procedure?.formId ? t.workspaceEmpty.readyTitle : t.workspaceEmpty.standardTitle}
          </h4>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            {procedure?.formId
              ? t.workspaceEmpty.readyDesc
              : t.workspaceEmpty.standardDesc}
          </p>
        </div>

        {procedure?.official_sources && procedure.official_sources.length > 0 && (
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-outline">
              {t.workspaceEmpty.officialPortalTitle}
            </span>
            <div className="space-y-1.5">
              {procedure.official_sources.map((src, i) => (
                <a
                  key={i}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container/60 hover:bg-surface-container border border-border-subtle/80 text-xs text-primary transition-colors"
                >
                  <span className="truncate">{src.title}</span>
                  <ExternalLink size={12} className="shrink-0 ml-2 text-outline" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs text-on-surface-variant space-y-1 mt-6">
        <div className="font-semibold text-primary flex items-center gap-1.5">
          <Sparkles size={13} />
          <span>{t.workspaceEmpty.privacyTitle}</span>
        </div>
        <p className="text-[11px] leading-relaxed text-outline">
          {t.workspaceEmpty.privacyDesc}
        </p>
      </div>
    </div>
  );
}
