import { useState } from "react";
import { Sparkles, ArrowRight, Layers } from "lucide-react";
import { TEMPLATE_DEFINITIONS } from "../../utils/business-card/templates.js";
import { useLanguage } from "../../utils/business-card/LanguageContext.jsx";
import { getLocalizedTemplate, getLocalizedCategory } from "../../utils/business-card/translations.js";
export const GenerationStep = ({
  profile,
  dimension,
  orientation,
  isDoubleSided: _isDoubleSided,
  onSelectTemplate,
  onOrientationChange
}) => {
  const { t, language } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [previewSideMap, setPreviewSideMap] = useState({});
  const categories = [
    { id: "all", label: getLocalizedCategory("all", language) },
    { id: "creative", label: getLocalizedCategory("creative", language) },
    { id: "minimal", label: getLocalizedCategory("minimal", language) },
    { id: "corporate", label: getLocalizedCategory("corporate", language) },
    { id: "traditional", label: getLocalizedCategory("traditional", language) },
    { id: "luxury", label: getLocalizedCategory("luxury", language) },
    { id: "tech", label: getLocalizedCategory("tech", language) },
    { id: "bilingual", label: getLocalizedCategory("bilingual", language) }
  ];
  const allTemplatesSorted = [...TEMPLATE_DEFINITIONS].sort((a, b) => {
    if (a.id === "yuka-minimal-lineart") return -1;
    if (b.id === "yuka-minimal-lineart") return 1;
    return 0;
  });
  const filteredTemplates = selectedCategory === "all" ? allTemplatesSorted : allTemplatesSorted.filter((t2) => t2.category === selectedCategory);
  const toggleSide = (templateId, e) => {
    e.stopPropagation();
    setPreviewSideMap((prev) => ({
      ...prev,
      [templateId]: prev[templateId] === "back" ? "front" : "back"
    }));
  };
  return <div className="max-w-7xl mx-auto px-4 py-8">
      {
    /* Header */
  }
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 pb-4 border-b border-border-subtle">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
            <span>{t("step2Title")}</span>
          </div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight font-display">
            {t("genTitle")}
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            {t("genSub")} ({profile.companyName || "yuka design"} / {profile.fullName || "\u3055\u3093\u3077\u308B \u3086\u304B"})
          </p>
        </div>

        {
    /* Orientation Toggle */
  }
        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="text-xs font-medium text-on-surface-variant">{t("labelOrientation")}:</span>
          <div className="bg-surface-subtle p-1 rounded-lg flex items-center gap-1">
            <button
    onClick={() => onOrientationChange("horizontal")}
    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${orientation === "horizontal" ? "bg-surface-container text-on-surface shadow-xs" : "text-on-surface-variant hover:text-on-surface"}`}
  >
              {t("orientHoriz")}
            </button>
            <button
    onClick={() => onOrientationChange("vertical")}
    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${orientation === "vertical" ? "bg-surface-container text-on-surface shadow-xs" : "text-on-surface-variant hover:text-on-surface"}`}
  >
              {t("orientVert")}
            </button>
          </div>
        </div>
      </div>

      {
    /* Style Filters */
  }
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 scrollbar-none">
        {categories.map((cat) => <button
    key={cat.id}
    onClick={() => setSelectedCategory(cat.id)}
    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${selectedCategory === cat.id ? "bg-slate-900 text-white shadow-xs" : "bg-surface-container text-on-surface-variant hover:bg-surface-subtle border border-border-subtle"}`}
  >
            {cat.label}
          </button>)}
      </div>

      {
    /* Template Proposals Grid */
  }
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => {
    const currentSide = previewSideMap[template.id] || "front";
    const cardData = template.generator(profile, dimension, orientation);
    const activeSideData = currentSide === "front" ? cardData.front : cardData.back;
    const isHoriz = orientation === "horizontal";
    const cardAspect = isHoriz ? "aspect-[91/55]" : "aspect-[55/91]";
    return <div
      key={template.id}
      id={`proposal-card-${template.id}`}
      onClick={() => onSelectTemplate(template)}
      className="bg-surface-container rounded-2xl border border-border-subtle hover:border-brand-500 hover:shadow-xl transition-all cursor-pointer group flex flex-col overflow-hidden"
    >
              {
      /* Card Preview Container */
    }
              <div className="p-5 bg-surface-subtle/70 border-b border-border-subtle/50 flex items-center justify-center min-h-[260px]">
                <div
      className={`w-full max-w-[320px] ${cardAspect} rounded-lg shadow-md group-hover:shadow-lg transition-all relative overflow-hidden flex flex-col justify-between p-3.5 select-none ${activeSideData.paperTexture === "washi" ? "paper-texture-washi" : "bg-surface-container"}`}
      style={{ backgroundColor: activeSideData.backgroundColor || "#ffffff" }}
    >
                  {
      /* Render Mock Mini Card Elements */
    }
                  <div className="w-full h-full relative">
                    {activeSideData.elements.slice(0, 10).map((el) => {
      const cardW = isHoriz ? dimension.widthMm : dimension.heightMm;
      const cardH = isHoriz ? dimension.heightMm : dimension.widthMm;
      const leftPercent = el.xMm / cardW * 100;
      const topPercent = el.yMm / cardH * 100;
      const widthPercent = el.widthMm / cardW * 100;
      if (el.type === "image") {
        return <div
          key={el.id}
          style={{
            position: "absolute",
            left: `${leftPercent}%`,
            top: `${topPercent}%`,
            width: `${widthPercent}%`,
            height: `${el.heightMm / cardH * 100}%`,
            zIndex: el.zIndex
          }}
        >
                            <img src={el.src} alt="" className="w-full h-full object-contain" />
                          </div>;
      }
      if (el.type === "shape") {
        return <div
          key={el.id}
          style={{
            position: "absolute",
            left: `${leftPercent}%`,
            top: `${topPercent}%`,
            width: `${widthPercent}%`,
            height: `${el.heightMm / cardH * 100}%`,
            backgroundColor: el.fill || "#2D2B2A",
            border: el.stroke ? `${el.strokeWidthMm || 1}px solid ${el.stroke}` : "none",
            borderRadius: el.borderRadiusMm ? `${el.borderRadiusMm * 2}px` : "0",
            zIndex: el.zIndex
          }}
        />;
      }
      if (el.type === "line") {
        return <div
          key={el.id}
          style={{
            position: "absolute",
            left: `${leftPercent}%`,
            top: `${topPercent}%`,
            width: `${widthPercent}%`,
            height: "1px",
            backgroundColor: el.stroke,
            zIndex: el.zIndex
          }}
        />;
      }
      if (el.type === "text") {
        const isMainName = el.fieldBinding === "fullName" || el.fontSizePt > 11;
        return <div
          key={el.id}
          className={`truncate ${el.verticalWriting ? "writing-v-rl" : ""}`}
          style={{
            position: "absolute",
            left: `${leftPercent}%`,
            top: `${topPercent}%`,
            maxWidth: `${widthPercent}%`,
            color: el.color,
            fontSize: isMainName ? "12px" : "7px",
            fontWeight: el.fontWeight || "normal",
            textAlign: el.align || "left",
            fontFamily: el.fontFamily,
            lineHeight: 1.15,
            zIndex: el.zIndex
          }}
        >
                            {el.content}
                          </div>;
      }
      if (el.type === "qr") {
        return <div
          key={el.id}
          className="bg-slate-900 rounded p-1 flex items-center justify-center text-[7px] text-white font-mono"
          style={{
            position: "absolute",
            left: `${leftPercent}%`,
            top: `${topPercent}%`,
            width: `${widthPercent}%`,
            height: `${el.heightMm / cardH * 100}%`,
            zIndex: el.zIndex
          }}
        >
                            QR
                          </div>;
      }
      return null;
    })}
                  </div>

                  {
      /* Badges on Card */
    }
                  <div className="absolute top-2 right-2 flex items-center gap-1 z-20">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-900/80 text-white backdrop-blur">
                      {currentSide === "front" ? t("frontSide") : t("backSide")}
                    </span>
                  </div>
                </div>
              </div>

              {
      /* Proposal Info & Select Action */
    }
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  {(() => {
      const loc = getLocalizedTemplate(template.id, language);
      return <>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h3 className="font-bold text-on-surface text-sm group-hover:text-primary transition-colors">
                            {loc.name}
                          </h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/30">
                            {loc.previewBadge}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant leading-normal line-clamp-2">
                          {loc.description}
                        </p>
                      </>;
    })()}
                </div>

                <div className="mt-4 pt-3 border-t border-border-subtle/50 flex items-center justify-between">
                  {
      /* Flip Front/Back Preview Button */
    }
                  <button
      type="button"
      id={`btn-flip-${template.id}`}
      onClick={(e) => toggleSide(template.id, e)}
      className="flex items-center gap-1 text-xs font-medium text-on-surface-variant hover:text-on-surface px-2.5 py-1 rounded bg-surface-subtle hover:bg-surface-subtle transition-colors"
    >
                    <Layers className="w-3 h-3 text-on-surface-variant" />
                    <span>{currentSide === "front" ? t("viewBack") : t("viewFront")}</span>
                  </button>

                  <div
      id={`btn-select-${template.id}`}
      className="flex items-center gap-1 text-xs font-bold text-primary group-hover:translate-x-1 transition-transform"
    >
                    <span>{t("editThisDesign")}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>;
  })}
      </div>
    </div>;
};
