import React, { useState, useEffect } from 'react';
import {
  Building2,
  Phone,
  Clock,
  ExternalLink,
  CheckSquare,
  Square,
  AlertCircle,
  FileText,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { getOfficeForPrefecture } from '../../consular/jurisdictions/japanPrefectures.js';
import { getConsularI18n } from '../../consular/i18n/consularI18n.js';

export default function ProcedureGuidePane({
  procedure,
  journey,
  selectedPrefectureId,
  onOpenForm,
  onNavigateToTool,
  displayLang = 'vi',
}) {
  const t = getConsularI18n(displayLang);
  const [checkedDocs, setCheckedDocs] = useState({});

  // Khôi phục checklist từ localStorage
  useEffect(() => {
    if (!procedure?.id) return;
    try {
      const saved = localStorage.getItem(`consular_checklist_${procedure.id}`);
      if (saved) {
        setCheckedDocs(JSON.parse(saved));
      } else {
        setCheckedDocs({});
      }
    } catch {
      setCheckedDocs({});
    }
  }, [procedure?.id]);

  const toggleDoc = (docIndex) => {
    if (!procedure?.id) return;
    setCheckedDocs((prev) => {
      const updated = { ...prev, [docIndex]: !prev[docIndex] };
      try {
        localStorage.setItem(
          `consular_checklist_${procedure.id}`,
          JSON.stringify(updated)
        );
      } catch (err) {
        console.error('Error saving checklist', err);
      }
      return updated;
    });
  };

  const activeOffice = getOfficeForPrefecture(selectedPrefectureId);
  const officeName = activeOffice?.name?.[displayLang] || activeOffice?.name?.vi || activeOffice?.name;
  const officeAddr = activeOffice?.address?.[displayLang] || activeOffice?.address?.vi || activeOffice?.address;

  // Nếu đang xem Hành trình đời sống (Life Journey)
  if (journey) {
    const journeyTitle = journey.title?.[displayLang] || journey.title?.vi || journey.title;
    const journeyDesc = journey.description?.[displayLang] || journey.description?.vi || journey.description || journey.subtitle;

    return (
      <section className="bg-surface-container-low border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 mb-1">
            <Sparkles size={13} />
            <span>{t.guide.tagJourney}</span>
          </div>
          <h2 className="text-lg font-bold text-on-surface">
            {journeyTitle}
          </h2>
          <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
            {journeyDesc}
          </p>
        </div>

        {/* Timeline các bước */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-outline">
            {t.guide.journeyTimelineTitle}
          </h3>
          <div className="relative border-l-2 border-primary/30 ml-2.5 space-y-4 py-1">
            {journey.timelineSteps.map((step) => {
              const stepTitle = step.title?.[displayLang] || step.title?.vi || step.title;
              const stepDesc = step.desc?.[displayLang] || step.desc?.vi || step.desc;

              return (
                <div key={step.order} className="relative pl-5">
                  <div className="absolute -left-[8px] top-1 w-3.5 h-3.5 rounded-full bg-surface-canvas border-2 border-primary flex items-center justify-center text-[8px] font-bold text-primary">
                    {step.order}
                  </div>

                  <div className="bg-surface-container/60 border border-border-subtle p-3 rounded-xl space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <span className="text-xs font-bold text-on-surface">
                        {stepTitle}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-container-highest text-primary">
                        {step.timeframe}
                      </span>
                    </div>

                    <div className="text-[11px] text-outline flex items-center gap-1 font-medium">
                      <Building2 size={11} />
                      <span>{step.actor}</span>
                    </div>

                    <p className="text-[11.5px] text-on-surface-variant leading-relaxed">
                      {stepDesc}
                    </p>

                    <div className="pt-1 flex flex-wrap gap-2">
                      {step.integratedFormId && (
                        <button
                          type="button"
                          onClick={() => onOpenForm?.(step.integratedFormId)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-primary text-on-primary hover:bg-primary/90 transition-colors shadow-2xs cursor-pointer"
                        >
                          <FileText size={12} />
                          <span>{t.guide.openFormBtn}</span>
                        </button>
                      )}
                      {step.relatedToolId && (
                        <button
                          type="button"
                          onClick={() => onNavigateToTool?.(step.relatedToolId)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-surface-container-highest text-on-surface hover:bg-surface-container transition-colors border border-border-subtle cursor-pointer"
                        >
                          <span>{step.relatedToolId}</span>
                          <ArrowRight size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // Nếu chưa chọn thủ tục nào
  if (!procedure) {
    return (
      <div className="bg-surface-container-low border border-border-subtle rounded-2xl p-6 text-center flex flex-col items-center justify-center min-h-[360px] text-outline">
        <FileText size={36} className="opacity-30 mb-2" />
        <p className="text-xs font-semibold text-on-surface">
          {displayLang === 'ja' ? '左側のリストから手続きを選択してください' : displayLang === 'en' ? 'Select a procedure from the left sidebar' : 'Chọn một thủ tục từ danh sách bên trái'}
        </p>
      </div>
    );
  }

  const completedDocsCount = procedure.required_documents?.filter(
    (_, idx) => checkedDocs[idx]
  ).length || 0;
  const totalDocsCount = procedure.required_documents?.length || 0;
  const procTitle = procedure.title?.[displayLang] || procedure.title?.vi || procedure.title;
  const procSummary = procedure.summary?.[displayLang] || procedure.summary?.vi || procedure.summary;

  return (
    <article className="bg-surface-container-low border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
      {/* Tiêu đề & Thông tin thẩm tra */}
      <div className="space-y-1.5 border-b border-border-subtle pb-3">
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
            <ShieldCheck size={11} />
            <span>{procedure.last_verified}</span>
          </span>
          <span className="text-[10px] text-outline font-mono">
            {procedure.id}
          </span>
        </div>

        <h2 className="text-base sm:text-lg font-bold text-on-surface leading-snug">
          {procTitle}
        </h2>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          {procSummary}
        </p>
      </div>

      {/* Box Thẩm quyền tiếp nhận theo Tỉnh thành (Gọn gàng) */}
      <div className="bg-surface-container p-3 rounded-xl border border-border-subtle/80 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
            <Building2 size={14} />
            <span>{t.guide.competentOffice}</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary/10 text-primary font-medium">
            {t.guide.submissionMethods}
          </span>
        </div>

        <div className="text-xs text-on-surface space-y-1">
          <div className="font-bold text-xs text-on-surface">
            {officeName}
          </div>
          <div className="text-on-surface-variant text-[11px] flex items-start gap-1">
            <MapPin size={11} className="shrink-0 mt-0.5 text-outline" />
            <span>{officeAddr}</span>
          </div>
          <div className="text-[11px] text-on-surface-variant flex items-center gap-3 pt-0.5">
            <span className="flex items-center gap-1 font-mono">
              <Phone size={10} />
              {activeOffice.hotline}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={10} />
              {activeOffice.workingHours.submission}
            </span>
          </div>
        </div>
      </div>

      {/* Checklist hồ sơ cần chuẩn bị */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-outline flex items-center gap-1">
            <CheckSquare size={13} className="text-primary" />
            <span>{t.guide.requiredDocuments} ({completedDocsCount}/{totalDocsCount})</span>
          </h3>
          <span className="text-[10.5px] text-outline">
            {t.guide.processingTime} <strong className="text-on-surface">{procedure.processing_time}</strong>
          </span>
        </div>

        <div className="space-y-1.5">
          {procedure.required_documents?.map((doc, idx) => {
            const isChecked = !!checkedDocs[idx];

            return (
              <div
                key={idx}
                className={`p-2.5 rounded-xl border transition-all flex items-start gap-2.5 ${
                  isChecked
                    ? 'bg-emerald-500/5 border-emerald-500/30'
                    : 'bg-surface-container/50 border-border-subtle/70 hover:bg-surface-container'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleDoc(idx)}
                  className="mt-0.5 text-primary hover:text-primary/80 transition-transform active:scale-95 cursor-pointer"
                  aria-label={isChecked ? 'Bỏ chọn' : 'Đánh dấu'}
                >
                  {isChecked ? (
                    <CheckSquare size={15} className="text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Square size={15} className="text-outline" />
                  )}
                </button>

                <div className="flex-1 text-xs space-y-0.5">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className={`font-semibold ${isChecked ? 'line-through text-outline' : 'text-on-surface'}`}>
                      {doc.name}
                    </span>
                    <span className="px-1.5 py-0.2 text-[9.5px] font-medium rounded bg-surface-container-highest text-outline">
                      {doc.quantity} • {doc.originalOrCopy}
                    </span>
                  </div>

                  {doc.note && (
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">
                      {doc.note}
                    </p>
                  )}

                  {doc.isForm && doc.formId && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => onOpenForm?.(doc.formId)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-[10.5px] font-semibold rounded bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors cursor-pointer"
                      >
                        <FileText size={11} />
                        <span>{t.guide.openFormBtn}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trình tự thực hiện (Thu gọn, súc tích) */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-outline flex items-center gap-1">
          <Calendar size={13} className="text-primary" />
          <span>{t.guide.fourStepsTitle}</span>
        </h3>
        <div className="space-y-1.5">
          {procedure.steps?.map((step) => (
            <div
              key={step.step}
              className="flex items-start gap-2.5 p-2 rounded-xl bg-surface-container/40 border border-border-subtle text-xs"
            >
              <div className="w-4 h-4 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                {step.step}
              </div>
              <div className="space-y-0.5">
                <div className="font-bold text-on-surface text-[11.5px]">
                  {step.title}
                </div>
                <div className="text-on-surface-variant text-[11px] leading-relaxed">
                  {step.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Nguồn pháp lý & Website chính thức */}
      <div className="pt-2 border-t border-border-subtle flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="text-outline text-[11px]">
          <span>{t.guide.officialSources}</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {procedure.official_sources?.map((source, idx) => (
            <a
              key={idx}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline font-medium text-[10.5px]"
            >
              <span>{source.title}</span>
              <ExternalLink size={10} />
            </a>
          ))}
        </div>
      </div>
    </article>
  );
}
