import {
  Trash2,
  Copy,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Sliders,
  ShieldCheck,
  Layers
} from "lucide-react";
import { FONT_OPTIONS, JAPANESE_PALETTE } from "../../utils/business-card/fonts.js";
import { useLanguage } from "../../utils/business-card/LanguageContext.jsx";
import { getLocalizedCardDimension } from "../../utils/business-card/translations.js";
import { alignElementToCard, alignMultipleElements } from "../../utils/business-card/alignmentSnapper.js";

export const PropertyInspector = ({
  selectedElements = [],
  selectedElement,
  onUpdateElement,
  onUpdateElements,
  onDeleteElement,
  onDeleteElements,
  onDuplicateElement,
  onDuplicateElements,
  project
}) => {
  const { t, language } = useLanguage();

  // Multi-Selection Panel
  if (selectedElements && selectedElements.length > 1) {
    const minX = Math.min(...selectedElements.map((e) => e.xMm));
    const maxX = Math.max(...selectedElements.map((e) => e.xMm + e.widthMm));
    const minY = Math.min(...selectedElements.map((e) => e.yMm));
    const maxY = Math.max(...selectedElements.map((e) => e.yMm + e.heightMm));
    const groupW = Math.round((maxX - minX) * 10) / 10;
    const groupH = Math.round((maxY - minY) * 10) / 10;

    const handleAlignGroup = (alignment) => {
      const aligned = alignMultipleElements(selectedElements, alignment);
      onUpdateElements?.(aligned);
    };

    return (
      <div className="w-72 bg-surface-container border-l border-border-subtle h-full p-4 overflow-y-auto select-none space-y-5">
        {/* Multi-Selection Header */}
        <div className="flex items-center justify-between pb-2 border-b border-border-subtle/50">
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
              {language === "ja"
                ? `${selectedElements.length}個の要素を選択中`
                : language === "en"
                ? `${selectedElements.length} Items Selected`
                : `Đã chọn ${selectedElements.length} đối tượng`}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              id="btn-multi-duplicate"
              onClick={() => onDuplicateElements?.(selectedElements)}
              className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-subtle rounded transition-colors cursor-pointer"
              title={t("btnDuplicate") || "Nhân bản nhóm"}
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              id="btn-multi-delete"
              onClick={() => onDeleteElements?.(selectedElements.map((e) => e.id))}
              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors cursor-pointer"
              title={t("btnDelete") || "Xóa nhóm"}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Group Alignment Bar */}
        <div>
          <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">
            {t("piAlignQuick")} (Nhóm)
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              id="btn-multi-align-left"
              onClick={() => handleAlignGroup("left")}
              className="py-1.5 px-2 bg-surface-canvas hover:bg-primary/10 hover:text-primary rounded border border-border-subtle text-[11px] font-medium transition-colors cursor-pointer text-center"
              title={t("piAlignLeft")}
            >
              {t("piAlignLeft")}
            </button>
            <button
              type="button"
              id="btn-multi-align-center-h"
              onClick={() => handleAlignGroup("center-h")}
              className="py-1.5 px-2 bg-surface-canvas hover:bg-primary/10 hover:text-primary rounded border border-border-subtle text-[11px] font-medium transition-colors cursor-pointer text-center"
              title={t("piAlignCenterH")}
            >
              {t("piAlignCenterH")}
            </button>
            <button
              type="button"
              id="btn-multi-align-right"
              onClick={() => handleAlignGroup("right")}
              className="py-1.5 px-2 bg-surface-canvas hover:bg-primary/10 hover:text-primary rounded border border-border-subtle text-[11px] font-medium transition-colors cursor-pointer text-center"
              title={t("piAlignRight")}
            >
              {t("piAlignRight")}
            </button>
            <button
              type="button"
              id="btn-multi-align-top"
              onClick={() => handleAlignGroup("top")}
              className="py-1.5 px-2 bg-surface-canvas hover:bg-primary/10 hover:text-primary rounded border border-border-subtle text-[11px] font-medium transition-colors cursor-pointer text-center"
              title={t("piAlignTop")}
            >
              {t("piAlignTop")}
            </button>
            <button
              type="button"
              id="btn-multi-align-center-v"
              onClick={() => handleAlignGroup("center-v")}
              className="py-1.5 px-2 bg-surface-canvas hover:bg-primary/10 hover:text-primary rounded border border-border-subtle text-[11px] font-medium transition-colors cursor-pointer text-center"
              title={t("piAlignCenterV")}
            >
              {t("piAlignCenterV")}
            </button>
            <button
              type="button"
              id="btn-multi-align-bottom"
              onClick={() => handleAlignGroup("bottom")}
              className="py-1.5 px-2 bg-surface-canvas hover:bg-primary/10 hover:text-primary rounded border border-border-subtle text-[11px] font-medium transition-colors cursor-pointer text-center"
              title={t("piAlignBottom")}
            >
              {t("piAlignBottom")}
            </button>
          </div>
        </div>

        {/* Even Distribution (if 3+ items) */}
        {selectedElements.length >= 3 && (
          <div>
            <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">
              Dãn cách đều
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="btn-multi-distribute-h"
                onClick={() => handleAlignGroup("distribute-h")}
                className="py-1.5 px-2 bg-surface-canvas hover:bg-primary/10 hover:text-primary rounded border border-border-subtle text-[11px] font-medium transition-colors cursor-pointer text-center"
              >
                Dãn đều ngang
              </button>
              <button
                type="button"
                id="btn-multi-distribute-v"
                onClick={() => handleAlignGroup("distribute-v")}
                className="py-1.5 px-2 bg-surface-canvas hover:bg-primary/10 hover:text-primary rounded border border-border-subtle text-[11px] font-medium transition-colors cursor-pointer text-center"
              >
                Dãn đều dọc
              </button>
            </div>
          </div>
        )}

        {/* Group Geometry Info */}
        <div className="pt-3 border-t border-border-subtle/50">
          <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">
            Khung bao nhóm
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded bg-surface-canvas border border-border-subtle">
              <span className="text-outline text-[10px] block">Rộng × Cao</span>
              <span className="font-bold text-on-surface">{groupW} × {groupH} mm</span>
            </div>
            <div className="p-2 rounded bg-surface-canvas border border-border-subtle">
              <span className="text-outline text-[10px] block">Vị trí (X, Y)</span>
              <span className="font-bold text-on-surface">{minX}, {minY} mm</span>
            </div>
          </div>
        </div>

        {/* Selected Elements List */}
        <div className="pt-3 border-t border-border-subtle/50">
          <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">
            Danh sách ({selectedElements.length})
          </label>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {selectedElements.map((el, i) => (
              <div
                key={el.id}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-surface-canvas border border-border-subtle text-xs"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                    {i + 1}
                  </span>
                  <span className="truncate text-on-surface font-medium">
                    {el.type === "text"
                      ? el.content?.slice(0, 18) || "Văn bản"
                      : el.type === "shape"
                      ? `Hình khối (${el.shapeType || "rect"})`
                      : el.type === "qr"
                      ? "Mã QR"
                      : el.type === "image"
                      ? "Hình ảnh / Logo"
                      : "Đối tượng"}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-outline shrink-0">
                  {el.widthMm}×{el.heightMm}mm
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!selectedElement) {
    return <div className="w-72 bg-surface-container border-l border-border-subtle h-full p-5 overflow-y-auto select-none space-y-5">
        <div className="flex items-center gap-1.5 pb-2 border-b border-border-subtle/50">
          <Sliders className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
            {t("propCardSpecs")}
          </span>
        </div>

        <div className="space-y-3 text-xs text-on-surface-variant">
          <div className="p-3 rounded-xl bg-surface-canvas border border-border-subtle">
            <span className="text-outline block text-[10px] uppercase font-bold">{t("propTrimSize")}</span>
            <span className="font-bold text-on-surface text-sm">
              {project.orientation === "horizontal" ? project.dimension.widthMm : project.dimension.heightMm} × {project.orientation === "horizontal" ? project.dimension.heightMm : project.dimension.widthMm} mm
            </span>
            <span className="text-[11px] text-on-surface-variant block mt-0.5">
              {getLocalizedCardDimension(project.dimension.id, language).name}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface-canvas border border-border-subtle">
            <span className="text-outline block text-[10px] uppercase font-bold">{t("propBleedSetting")}</span>
            <span className="font-bold text-on-surface text-sm">±{project.dimension.bleedMm} mm</span>
            <span className="text-[11px] text-on-surface-variant block mt-0.5">
              {(project.orientation === "horizontal" ? project.dimension.widthMm : project.dimension.heightMm) + project.dimension.bleedMm * 2} × {(project.orientation === "horizontal" ? project.dimension.heightMm : project.dimension.widthMm) + project.dimension.bleedMm * 2} mm
            </span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
            <div className="flex items-center gap-1.5 font-bold mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{t("propSafeRule")}</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              {t("propSafeDesc")}
            </p>
          </div>
        </div>

        <div className="text-center pt-8 text-outline text-xs">
          {t("propSelectPrompt")}
        </div>
      </div>;
  }
  const updateProp = (props) => {
    onUpdateElement({
      ...selectedElement,
      ...props
    });
  };
  return <div className="w-72 bg-surface-container border-l border-border-subtle h-full p-4 overflow-y-auto select-none space-y-5">
      {
    /* Element Header & Actions */
  }
      <div className="flex items-center justify-between pb-2 border-b border-border-subtle/50">
        <div className="flex items-center gap-1.5">
          <Type className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
            {t("propTitle")}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
    onClick={() => onDuplicateElement(selectedElement)}
    className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-subtle rounded transition-colors"
    title={t("btnDuplicate")}
  >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
    onClick={() => onDeleteElement(selectedElement.id)}
    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
    title={t("btnDelete")}
  >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {
    /* 1. TEXT SPECIFIC SETTINGS */
  }
      {selectedElement.type === "text" && <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
              {t("propTextContent")}
            </label>
            <textarea
    rows={3}
    value={selectedElement.content}
    onChange={(e) => updateProp({ content: e.target.value })}
    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary"
  />
          </div>

          {
    /* Font Family Dropdown */
  }
          <div>
            <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
              {t("propFontFamily")}
            </label>
            <select
    value={selectedElement.fontFamily}
    onChange={(e) => updateProp({ fontFamily: e.target.value })}
    className="w-full px-2 py-1.5 text-xs rounded-lg border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary bg-surface-container"
  >
              {FONT_OPTIONS.map((font) => <option key={font.name} value={font.family}>
                  {font.nameJp} ({font.name})
                </option>)}
            </select>
          </div>

          {
    /* Font Size & Weight */
  }
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                {t("propFontSize")}
              </label>
              <div className="flex items-center gap-1">
                <input
    type="number"
    step="0.5"
    min="4"
    max="48"
    value={selectedElement.fontSizePt}
    onChange={(e) => updateProp({ fontSizePt: parseFloat(e.target.value) || 6 })}
    className="w-full px-2 py-1.5 text-xs rounded-lg border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary"
  />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                {t("propFontWeight")}
              </label>
              <select
    value={selectedElement.fontWeight || "400"}
    onChange={(e) => updateProp({ fontWeight: e.target.value })}
    className="w-full px-2 py-1.5 text-xs rounded-lg border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary bg-surface-container"
  >
                <option value="300">Light</option>
                <option value="400">Regular</option>
                <option value="500">Medium</option>
                <option value="600">SemiBold</option>
                <option value="700">Bold</option>
              </select>
            </div>
          </div>

          {
    /* Text Alignment & Vertical Writing Toggle */
  }
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                {t("propTextAlign")}
              </label>
              <div className="flex items-center gap-0.5 bg-surface-subtle p-0.5 rounded-lg">
                <button
    type="button"
    onClick={() => updateProp({ align: "left" })}
    className={`p-1 rounded ${selectedElement.align === "left" ? "bg-surface-container shadow-xs text-primary" : "text-on-surface-variant"}`}
  >
                  <AlignLeft className="w-3.5 h-3.5" />
                </button>
                <button
    type="button"
    onClick={() => updateProp({ align: "center" })}
    className={`p-1 rounded ${selectedElement.align === "center" ? "bg-surface-container shadow-xs text-primary" : "text-on-surface-variant"}`}
  >
                  <AlignCenter className="w-3.5 h-3.5" />
                </button>
                <button
    type="button"
    onClick={() => updateProp({ align: "right" })}
    className={`p-1 rounded ${selectedElement.align === "right" ? "bg-surface-container shadow-xs text-primary" : "text-on-surface-variant"}`}
  >
                  <AlignRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {
    /* Vertical Writing Switch (縦書き) */
  }
            <div className="flex items-center justify-between p-2 rounded-lg bg-surface-canvas border border-border-subtle">
              <div className="text-xs">
                <span className="font-bold text-on-surface block">{t("propVerticalWriting")}</span>
                <span className="text-[10px] text-on-surface-variant">{t("propVerticalWritingSub")}</span>
              </div>
              <button
    type="button"
    onClick={() => updateProp({ verticalWriting: !selectedElement.verticalWriting })}
    className={`w-9 h-5 rounded-full transition-colors relative ${selectedElement.verticalWriting ? "bg-primary-container" : "bg-slate-300"}`}
  >
                <div
    className={`w-4 h-4 rounded-full bg-surface-container transition-transform transform ${selectedElement.verticalWriting ? "translate-x-4" : "translate-x-0.5"}`}
  />
              </button>
            </div>
          </div>

          {
    /* Text Color Swatches */
  }
          <div>
            <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
              {t("propTextColor")}
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {JAPANESE_PALETTE.map((c) => <button
    key={c.name}
    type="button"
    title={c.name}
    onClick={() => updateProp({ color: c.hex })}
    style={{ backgroundColor: c.hex }}
    className={`w-5 h-5 rounded-full border border-border-subtle transition-transform ${selectedElement.color === c.hex ? "scale-125 ring-2 ring-primary" : "hover:scale-110"}`}
  />)}
            </div>
          </div>
        </div>}

      {
    /* 2. QR CODE SETTINGS */
  }
      {selectedElement.type === "qr" && <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
              {t("propQrData")}
            </label>
            <input
    type="text"
    value={selectedElement.data}
    onChange={(e) => updateProp({ data: e.target.value })}
    className="w-full px-2 py-1.5 text-xs rounded-lg border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary"
  />
          </div>
        </div>}

      {
    /* 3. SHAPE & LINE SETTINGS */
  }
      {(selectedElement.type === "shape" || selectedElement.type === "line") && <div className="space-y-4">
          {selectedElement.type === "shape" && <div>
              <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                {language === "vi" ? "M\xE0u t\xF4 (Fill)" : language === "en" ? "Fill Color" : "\u5857\u308A\u3064\u3076\u3057\u8272"}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {JAPANESE_PALETTE.map((c) => <button
    key={c.name}
    type="button"
    title={c.name}
    onClick={() => updateProp({ fill: c.hex })}
    style={{ backgroundColor: c.hex }}
    className="w-5 h-5 rounded-full border border-border-subtle hover:scale-110 transition-transform"
  />)}
              </div>
            </div>}

          <div>
            <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
              {language === "vi" ? "\u0110\u1ED9 d\xE0y n\xE9t (mm)" : language === "en" ? "Stroke Width (mm)" : "\u7DDA\u306E\u592A\u3055 (mm)"}
            </label>
            <input
    type="number"
    step="0.1"
    min="0.1"
    max="5"
    value={selectedElement.strokeWidthMm || 0.2}
    onChange={(e) => updateProp({ strokeWidthMm: parseFloat(e.target.value) || 0.2 })}
    className="w-full px-2 py-1.5 text-xs rounded-lg border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary"
  />
          </div>
        </div>}

      {
    /* 4. QUICK ALIGNMENT TOOLBAR */
  }
      <div className="pt-3 border-t border-border-subtle/50">
        <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">
          {t("piAlignQuick")}
        </label>
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          <button
            type="button"
            id="btn-align-center-h"
            onClick={() => {
              const isHoriz = project.orientation === "horizontal";
              const cardW = isHoriz ? project.dimension.widthMm : project.dimension.heightMm;
              const cardH = isHoriz ? project.dimension.heightMm : project.dimension.widthMm;
              const updated = alignElementToCard(selectedElement, 'center-h', {
                cardW,
                cardH,
                safeMargin: project.dimension.safeMarginMm
              });
              onUpdateElement(updated);
            }}
            className="py-1.5 px-2 bg-surface-canvas hover:bg-primary/10 hover:text-primary rounded border border-border-subtle text-[11px] font-medium transition-colors cursor-pointer text-center"
            title={t("piAlignCenterH")}
          >
            {t("piAlignCenterH")}
          </button>
          <button
            type="button"
            id="btn-align-center-v"
            onClick={() => {
              const isHoriz = project.orientation === "horizontal";
              const cardW = isHoriz ? project.dimension.widthMm : project.dimension.heightMm;
              const cardH = isHoriz ? project.dimension.heightMm : project.dimension.widthMm;
              const updated = alignElementToCard(selectedElement, 'center-v', {
                cardW,
                cardH,
                safeMargin: project.dimension.safeMarginMm
              });
              onUpdateElement(updated);
            }}
            className="py-1.5 px-2 bg-surface-canvas hover:bg-primary/10 hover:text-primary rounded border border-border-subtle text-[11px] font-medium transition-colors cursor-pointer text-center"
            title={t("piAlignCenterV")}
          >
            {t("piAlignCenterV")}
          </button>
          <button
            type="button"
            id="btn-align-left"
            onClick={() => {
              const isHoriz = project.orientation === "horizontal";
              const cardW = isHoriz ? project.dimension.widthMm : project.dimension.heightMm;
              const cardH = isHoriz ? project.dimension.heightMm : project.dimension.widthMm;
              const updated = alignElementToCard(selectedElement, 'left', {
                cardW,
                cardH,
                safeMargin: project.dimension.safeMarginMm
              });
              onUpdateElement(updated);
            }}
            className="py-1.5 px-2 bg-surface-canvas hover:bg-primary/10 hover:text-primary rounded border border-border-subtle text-[11px] font-medium transition-colors cursor-pointer text-center"
            title={t("piAlignLeft")}
          >
            {t("piAlignLeft")}
          </button>
          <button
            type="button"
            id="btn-align-right"
            onClick={() => {
              const isHoriz = project.orientation === "horizontal";
              const cardW = isHoriz ? project.dimension.widthMm : project.dimension.heightMm;
              const cardH = isHoriz ? project.dimension.heightMm : project.dimension.widthMm;
              const updated = alignElementToCard(selectedElement, 'right', {
                cardW,
                cardH,
                safeMargin: project.dimension.safeMarginMm
              });
              onUpdateElement(updated);
            }}
            className="py-1.5 px-2 bg-surface-canvas hover:bg-primary/10 hover:text-primary rounded border border-border-subtle text-[11px] font-medium transition-colors cursor-pointer text-center"
            title={t("piAlignRight")}
          >
            {t("piAlignRight")}
          </button>
          <button
            type="button"
            id="btn-align-top"
            onClick={() => {
              const isHoriz = project.orientation === "horizontal";
              const cardW = isHoriz ? project.dimension.widthMm : project.dimension.heightMm;
              const cardH = isHoriz ? project.dimension.heightMm : project.dimension.widthMm;
              const updated = alignElementToCard(selectedElement, 'top', {
                cardW,
                cardH,
                safeMargin: project.dimension.safeMarginMm
              });
              onUpdateElement(updated);
            }}
            className="py-1.5 px-2 bg-surface-canvas hover:bg-primary/10 hover:text-primary rounded border border-border-subtle text-[11px] font-medium transition-colors cursor-pointer text-center"
            title={t("piAlignTop")}
          >
            {t("piAlignTop")}
          </button>
          <button
            type="button"
            id="btn-align-bottom"
            onClick={() => {
              const isHoriz = project.orientation === "horizontal";
              const cardW = isHoriz ? project.dimension.widthMm : project.dimension.heightMm;
              const cardH = isHoriz ? project.dimension.heightMm : project.dimension.widthMm;
              const updated = alignElementToCard(selectedElement, 'bottom', {
                cardW,
                cardH,
                safeMargin: project.dimension.safeMarginMm
              });
              onUpdateElement(updated);
            }}
            className="py-1.5 px-2 bg-surface-canvas hover:bg-primary/10 hover:text-primary rounded border border-border-subtle text-[11px] font-medium transition-colors cursor-pointer text-center"
            title={t("piAlignBottom")}
          >
            {t("piAlignBottom")}
          </button>
        </div>
      </div>

      {
    /* 5. PRECISE MILLIMETER COORDINATES */
  }
      <div className="pt-3 border-t border-border-subtle/50">
        <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">
          {t("propPositionMm")}
        </label>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-outline text-[10px]">X (mm):</span>
            <input
    type="number"
    step="0.5"
    value={selectedElement.xMm}
    onChange={(e) => updateProp({ xMm: parseFloat(e.target.value) || 0 })}
    className="w-full px-2 py-1 text-xs rounded border border-border-subtle"
  />
          </div>
          <div>
            <span className="text-outline text-[10px]">Y (mm):</span>
            <input
    type="number"
    step="0.5"
    value={selectedElement.yMm}
    onChange={(e) => updateProp({ yMm: parseFloat(e.target.value) || 0 })}
    className="w-full px-2 py-1 text-xs rounded border border-border-subtle"
  />
          </div>
          <div>
            <span className="text-outline text-[10px]">W (mm):</span>
            <input
    type="number"
    step="0.5"
    value={selectedElement.widthMm}
    onChange={(e) => updateProp({ widthMm: parseFloat(e.target.value) || 5 })}
    className="w-full px-2 py-1 text-xs rounded border border-border-subtle"
  />
          </div>
          <div>
            <span className="text-outline text-[10px]">H (mm):</span>
            <input
    type="number"
    step="0.5"
    value={selectedElement.heightMm}
    onChange={(e) => updateProp({ heightMm: parseFloat(e.target.value) || 5 })}
    className="w-full px-2 py-1 text-xs rounded border border-border-subtle"
  />
          </div>
        </div>
      </div>
    </div>;
};
