import { useRef } from "react";
import {
  Type,
  Minus,
  Square,
  Circle,
  QrCode,
  Upload,
  Layers,
  Sparkles
} from "lucide-react";
import { JAPANESE_PALETTE } from "../../utils/business-card/fonts.js";
import { useLanguage } from "../../utils/business-card/LanguageContext.jsx";
export const SidebarToolbar = ({
  onAddElement,
  activeSide,
  sideData,
  onUpdateSide
}) => {
  const { t } = useLanguage();
  const logoInputRef = useRef(null);
  const handleAddText = (type) => {
    const id = `el-text-${Date.now()}`;
    let newEl;
    if (type === "vertical") {
      newEl = {
        id,
        type: "text",
        content: "\u5F79\u54E1\u8077\u540D \u6C0F\u540D",
        fontFamily: '"Shippori Mincho", serif',
        fontSizePt: 14,
        fontWeight: "700",
        color: "#111827",
        align: "center",
        letterSpacingMm: 0.2,
        lineHeightRatio: 1.4,
        verticalWriting: true,
        xMm: 25,
        yMm: 12,
        widthMm: 8,
        heightMm: 35,
        zIndex: sideData.elements.length + 1
      };
    } else if (type === "name") {
      newEl = {
        id,
        type: "text",
        content: "\u65B0\u898F \u6C0F\u540D",
        fontFamily: '"Zen Kaku Gothic New", sans-serif',
        fontSizePt: 16,
        fontWeight: "700",
        color: "#0f172a",
        align: "left",
        letterSpacingMm: 0.3,
        lineHeightRatio: 1.1,
        xMm: 12,
        yMm: 24,
        widthMm: 45,
        heightMm: 7,
        zIndex: sideData.elements.length + 1
      };
    } else if (type === "company") {
      newEl = {
        id,
        type: "text",
        content: "\u682A\u5F0F\u4F1A\u793E \u30B5\u30F3\u30D7\u30EB\u4F01\u696D",
        fontFamily: '"Noto Sans JP", sans-serif',
        fontSizePt: 8.5,
        fontWeight: "700",
        color: "#0f2350",
        align: "left",
        letterSpacingMm: 0.1,
        lineHeightRatio: 1.2,
        xMm: 12,
        yMm: 10,
        widthMm: 55,
        heightMm: 5,
        zIndex: sideData.elements.length + 1
      };
    } else if (type === "title") {
      newEl = {
        id,
        type: "text",
        content: "\u4EE3\u8868\u53D6\u7DE0\u5F79 / CEO",
        fontFamily: '"Noto Sans JP", sans-serif',
        fontSizePt: 7,
        fontWeight: "400",
        color: "#64748b",
        align: "left",
        letterSpacingMm: 0.05,
        lineHeightRatio: 1.2,
        xMm: 12,
        yMm: 32,
        widthMm: 45,
        heightMm: 4,
        zIndex: sideData.elements.length + 1
      };
    } else {
      newEl = {
        id,
        type: "text",
        content: "TEL: 03-1234-5678\nEmail: info@sample.jp",
        fontFamily: "Inter, sans-serif",
        fontSizePt: 5.5,
        fontWeight: "400",
        color: "#475569",
        align: "left",
        letterSpacingMm: 0,
        lineHeightRatio: 1.35,
        xMm: 12,
        yMm: 40,
        widthMm: 55,
        heightMm: 8,
        zIndex: sideData.elements.length + 1
      };
    }
    onAddElement(newEl);
  };
  const handleAddShape = (shapeType) => {
    const id = `el-shape-${Date.now()}`;
    if (shapeType === "line") {
      onAddElement({
        id,
        type: "line",
        stroke: "#cbd5e1",
        strokeWidthMm: 0.25,
        xMm: 12,
        yMm: 38,
        widthMm: 65,
        heightMm: 0.25,
        zIndex: sideData.elements.length + 1
      });
    } else {
      onAddElement({
        id,
        type: "shape",
        shapeType: shapeType === "circle" ? "circle" : "rect",
        fill: "#0c8ee9",
        xMm: 12,
        yMm: 12,
        widthMm: shapeType === "circle" ? 8 : 16,
        heightMm: shapeType === "circle" ? 8 : 4,
        borderRadiusMm: 1,
        zIndex: sideData.elements.length + 1
      });
    }
  };
  const handleAddQr = () => {
    const id = `el-qr-${Date.now()}`;
    onAddElement({
      id,
      type: "qr",
      data: "https://meishi.studio",
      qrType: "url",
      foregroundColor: "#0f172a",
      backgroundColor: "#ffffff",
      xMm: 70,
      yMm: 34,
      widthMm: 14,
      heightMm: 14,
      zIndex: sideData.elements.length + 1
    });
  };
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result;
      const id = `el-logo-${Date.now()}`;
      onAddElement({
        id,
        type: "image",
        src,
        isLogo: true,
        xMm: 12,
        yMm: 8,
        widthMm: 14,
        heightMm: 14,
        fit: "contain",
        zIndex: sideData.elements.length + 1
      });
    };
    reader.readAsDataURL(file);
  };
  return <div className="w-64 bg-surface-container border-r border-border-subtle h-full p-4 overflow-y-auto space-y-5 select-none">
      <div className="flex items-center gap-1.5 pb-2 border-b border-border-subtle/50">
        <Layers className="w-4 h-4 text-primary" />
        <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
          {t("tbElementsTitle")} ({activeSide === "front" ? t("frontSide") : t("backSide")})
        </span>
      </div>

      {
    /* 1. TEXT ELEMENTS */
  }
      <div>
        <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">
          {t("tbText")}
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          <button
    onClick={() => handleAddText("name")}
    className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium text-on-surface-variant bg-surface-canvas hover:bg-primary/10 hover:text-primary rounded-lg border border-border-subtle transition-colors"
  >
            <Type className="w-3.5 h-3.5 text-primary" />
            <span>{t("tbAddName")}</span>
          </button>
          <button
    onClick={() => handleAddText("vertical")}
    className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium text-on-surface-variant bg-surface-canvas hover:bg-primary/10 hover:text-primary rounded-lg border border-border-subtle transition-colors"
    title="縦書きテキスト (vertical-rl)"
  >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{t("tbAddVerticalName")}</span>
          </button>
          <button
    onClick={() => handleAddText("company")}
    className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium text-on-surface-variant bg-surface-canvas hover:bg-primary/10 hover:text-primary rounded-lg border border-border-subtle transition-colors"
  >
            <Type className="w-3.5 h-3.5 text-on-surface-variant" />
            <span>{t("tbAddCompany")}</span>
          </button>
          <button
    onClick={() => handleAddText("title")}
    className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium text-on-surface-variant bg-surface-canvas hover:bg-primary/10 hover:text-primary rounded-lg border border-border-subtle transition-colors"
  >
            <Type className="w-3.5 h-3.5 text-on-surface-variant" />
            <span>{t("tbAddTitle")}</span>
          </button>
          <button
    onClick={() => handleAddText("contact")}
    className="col-span-2 flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-medium text-on-surface-variant bg-surface-canvas hover:bg-primary/10 hover:text-primary rounded-lg border border-border-subtle transition-colors"
  >
            <Type className="w-3.5 h-3.5 text-on-surface-variant" />
            <span>{t("tbAddContact")}</span>
          </button>
        </div>
      </div>

      {
    /* 2. SHAPES & LINES */
  }
      <div>
        <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">
          {t("tbShapes")}
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          <button
    onClick={() => handleAddShape("line")}
    className="flex flex-col items-center justify-center gap-1 p-2 text-xs font-medium text-on-surface-variant bg-surface-canvas hover:bg-primary/10 hover:text-primary rounded-lg border border-border-subtle transition-colors"
    title="Line"
  >
            <Minus className="w-4 h-4 text-on-surface-variant" />
            <span className="text-[10px]">{t("tbLine")}</span>
          </button>
          <button
    onClick={() => handleAddShape("rect")}
    className="flex flex-col items-center justify-center gap-1 p-2 text-xs font-medium text-on-surface-variant bg-surface-canvas hover:bg-primary/10 hover:text-primary rounded-lg border border-border-subtle transition-colors"
    title="Rectangle"
  >
            <Square className="w-4 h-4 text-on-surface-variant" />
            <span className="text-[10px]">{t("tbRect")}</span>
          </button>
          <button
    onClick={() => handleAddShape("circle")}
    className="flex flex-col items-center justify-center gap-1 p-2 text-xs font-medium text-on-surface-variant bg-surface-canvas hover:bg-primary/10 hover:text-primary rounded-lg border border-border-subtle transition-colors"
    title="Circle"
  >
            <Circle className="w-4 h-4 text-on-surface-variant" />
            <span className="text-[10px]">{t("tbCircle")}</span>
          </button>
        </div>
      </div>

      {
    /* 3. QR CODE & LOGO */
  }
      <div>
        <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">
          {t("tbMedia")}
        </label>
        <div className="space-y-1.5">
          <button
    onClick={handleAddQr}
    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-on-surface-variant bg-surface-canvas hover:bg-primary/10 hover:text-primary rounded-lg border border-border-subtle transition-colors"
  >
            <QrCode className="w-4 h-4 text-indigo-600" />
            <span>{t("tbAddQr")}</span>
          </button>

          <input
    type="file"
    ref={logoInputRef}
    onChange={handleLogoUpload}
    accept="image/*"
    className="hidden"
  />
          <button
    onClick={() => logoInputRef.current?.click()}
    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-on-surface-variant bg-surface-canvas hover:bg-primary/10 hover:text-primary rounded-lg border border-border-subtle transition-colors"
  >
            <Upload className="w-4 h-4 text-primary" />
            <span>{t("tbAddLogoCanvas")}</span>
          </button>
        </div>
      </div>

      {
    /* 4. BACKGROUND & PAPER TEXTURE */
  }
      <div className="pt-2 border-t border-border-subtle/50">
        <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">
          {t("tbPaperBg")}
        </label>
        
        {
    /* Paper Texture selector */
  }
        <div className="grid grid-cols-3 gap-1 mb-3">
          {[
    { id: "none", label: t("texMatte") },
    { id: "washi", label: t("texWashi") },
    { id: "kraft", label: t("texKraft") }
  ].map((tex) => <button
    key={tex.id}
    onClick={() => onUpdateSide({ paperTexture: tex.id })}
    className={`p-1.5 text-[10px] font-semibold rounded border transition-colors ${sideData.paperTexture === tex.id || !sideData.paperTexture && tex.id === "none" ? "border-brand-500 bg-primary/10 text-primary" : "border-border-subtle bg-surface-canvas text-on-surface-variant hover:bg-surface-subtle"}`}
  >
              {tex.label}
            </button>)}
        </div>

        {
    /* Quick Color Swatches */
  }
        <div className="flex flex-wrap gap-1">
          {JAPANESE_PALETTE.slice(0, 8).map((c) => <button
    key={c.name}
    title={c.name}
    onClick={() => onUpdateSide({ backgroundColor: c.hex })}
    style={{ backgroundColor: c.hex }}
    className="w-5 h-5 rounded-full border border-border-subtle hover:scale-110 transition-transform shadow-xs"
  />)}
        </div>
      </div>
    </div>;
};
