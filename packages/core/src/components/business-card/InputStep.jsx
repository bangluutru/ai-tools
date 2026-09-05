import { useState, useRef } from "react";
import {
  UploadCloud,
  Sparkles,
  Building2,
  User,
  MapPin,
  Check,
  FileText,
  Sliders,
  Image as ImageIcon
} from "lucide-react";
import { CARD_DIMENSIONS, getDimensionDisplay } from "../../utils/business-card/cardSizes.js";
import { SAMPLE_PROFILES } from "../../utils/business-card/samples.js";
import { JAPANESE_PALETTE } from "../../utils/business-card/fonts.js";
import { BusinessCardOcrService } from "../../utils/business-card/ocrParser.js";
import { useLanguage } from "../../utils/business-card/LanguageContext.jsx";
export const InputStep = ({
  profile,
  selectedDimension,
  orientation,
  isDoubleSided,
  selectedStyle,
  onProfileChange,
  onDimensionChange,
  onOrientationChange,
  onDoubleSidedChange,
  onStyleChange,
  onProceedToGenerate
}) => {
  const { t, language } = useLanguage();
  const [isScanningOcr, setIsScanningOcr] = useState(false);
  const [ocrSuccessMsg, setOcrSuccessMsg] = useState(null);
  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const updateField = (key, value) => {
    onProfileChange({
      ...profile,
      [key]: value
    });
  };
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanningOcr(true);
    setOcrSuccessMsg(null);
    try {
      const result = await BusinessCardOcrService.extractFromImage(file);
      onProfileChange({
        ...profile,
        ...result.profile,
        brandColors: result.detectedColors.length ? result.detectedColors : profile.brandColors
      });
      setOcrSuccessMsg(
        language === "vi" ? `\u0110\xE3 qu\xE9t AI th\xE0nh c\xF4ng: \u0110\u1ED9 tin c\u1EADy ${(result.confidence * 100).toFixed(0)}%. Vui l\xF2ng ki\u1EC3m tra bi\u1EC3u m\u1EABu b\xEAn d\u01B0\u1EDBi.` : language === "en" ? `AI OCR Complete: ${(result.confidence * 100).toFixed(0)}% confidence. Please verify the extracted fields below.` : `AI\u30B9\u30AD\u30E3\u30F3\u5B8C\u4E86: \u8A8D\u8B58\u7CBE\u5EA6 ${(result.confidence * 100).toFixed(0)}% \u3067\u60C5\u5831\u3092\u62BD\u51FA\u3057\u307E\u3057\u305F\u3002\u4E0B\u306E\u5165\u529B\u6B04\u3067\u5185\u5BB9\u3092\u3054\u78BA\u8A8D\u304F\u3060\u3055\u3044\u3002`
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsScanningOcr(false);
    }
  };
  const handleLoadPreset = (presetId) => {
    const found = SAMPLE_PROFILES.find((p) => p.id === presetId);
    if (!found) return;
    onProfileChange(found.profile);
    onStyleChange(found.recommendedStyle);
    if (presetId === "kyoto-artisan" || presetId === "yuka-design") {
      onOrientationChange("vertical");
    } else {
      onOrientationChange("horizontal");
    }
    setOcrSuccessMsg(
      language === "vi" ? `\u0110\xE3 n\u1EA1p h\u1ED3 s\u01A1 m\u1EABu: ${found.label}` : language === "en" ? `Loaded sample profile: ${found.labelEn || found.label}` : `\u30B5\u30F3\u30D7\u30EB\u30C7\u30FC\u30BF\u300C${found.label}\u300D\u3092\u9069\u7528\u3057\u307E\u3057\u305F\u3002`
    );
  };
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const logoUrl = event.target?.result;
      updateField("logoUrl", logoUrl);
      const colors = await BusinessCardOcrService.extractDominantColors(logoUrl);
      if (colors.length) {
        updateField("brandColors", colors);
      }
    };
    reader.readAsDataURL(file);
  };
  return <div className="max-w-6xl mx-auto px-4 py-8">
      {
    /* Intro Hero */
  }
      <div className="text-center max-w-3xl mx-auto mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight font-display">
          {t("heroTitle")}
        </h1>
        <p className="text-sm text-on-surface-variant mt-2">
          {t("heroSub")}
        </p>

        {
    /* 1-Click Test Presets */
  }
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs font-semibold text-on-surface-variant mr-1">{t("quickSamples")}</span>
          {SAMPLE_PROFILES.map((preset) => <button
    key={preset.id}
    id={`preset-btn-${preset.id}`}
    onClick={() => handleLoadPreset(preset.id)}
    className={`text-xs px-3 py-1 rounded-full border transition-all ${preset.id === "yuka-design" ? "bg-amber-50 text-amber-800 border-amber-300 font-semibold shadow-xs hover:bg-amber-100" : "bg-surface-subtle/70 hover:bg-primary/10 hover:text-primary hover:border-brand-300 border-border-subtle text-on-surface-variant"}`}
  >
              {language === "vi" ? preset.labelVi?.split(" ")[0] || preset.label.split(" ")[0] : language === "en" ? preset.labelEn?.split("-")[0].trim() || preset.label : preset.label.split(" ")[0]}
              {preset.id === "yuka-design" ? "" : ""}
            </button>)}
        </div>
      </div>

      {ocrSuccessMsg && <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center flex-shrink-0">
            <Check className="w-3.5 h-3.5" />
          </div>
          <p className="flex-1 font-medium">{ocrSuccessMsg}</p>
        </div>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {
    /* LEFT COLUMN: Input Mode (OCR Dropzone + Manual Form) */
  }
        <div className="lg:col-span-8 space-y-6">
          {
    /* Card 1: OCR Photo Upload Dropzone */
  }
          <div className="bg-surface-container rounded-2xl p-6 border border-border-subtle shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-primary flex items-center justify-center">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-on-surface">
                    {t("ocrCardTitle")}
                  </h2>
                  <p className="text-xs text-on-surface-variant">
                    {t("ocrCardSub")}
                  </p>
                </div>
              </div>
            </div>

            <input
    type="file"
    ref={fileInputRef}
    onChange={handleFileUpload}
    accept="image/*"
    className="hidden"
  />

            <div
    onClick={() => fileInputRef.current?.click()}
    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${isScanningOcr ? "border-brand-500 bg-primary/10/50" : "border-border-subtle hover:border-brand-500 hover:bg-surface-canvas/80"}`}
  >
              {isScanningOcr ? <div className="flex flex-col items-center justify-center py-4">
                  <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-sm font-semibold text-primary">{t("ocrScanning")}</p>
                </div> : <div className="flex flex-col items-center justify-center">
                  <UploadCloud className="w-10 h-10 text-outline mb-2" />
                  <p className="text-sm font-semibold text-on-surface-variant">
                    {t("ocrDropzoneText")}
                  </p>
                  <p className="text-xs text-on-surface-variant mt-1">
                    {t("ocrDropzoneSub")}
                  </p>
                </div>}
            </div>
          </div>

          {
    /* Card 2: Structured Editable Form Fields */
  }
          <div className="bg-surface-container rounded-2xl p-6 border border-border-subtle shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle/50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-on-surface">{t("formTitle")}</h2>
                  <p className="text-xs text-on-surface-variant">
                    {t("formSub")}
                  </p>
                </div>
              </div>
            </div>

            {
    /* 1. Person Info */
  }
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">
                <User className="w-3.5 h-3.5 text-primary" />
                <span>{t("secPersonal")}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    {t("labelFullName")} <span className="text-red-500">*</span>
                  </label>
                  <input
    type="text"
    value={profile.fullName}
    onChange={(e) => updateField("fullName", e.target.value)}
    placeholder="例: 田中 健二 / さんぷる ゆか"
    className="w-full px-3 py-2 text-sm rounded-lg border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary"
  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    {t("labelFullNameKana")}
                  </label>
                  <input
    type="text"
    value={profile.fullNameKana || ""}
    onChange={(e) => updateField("fullNameKana", e.target.value)}
    placeholder="例: たなか けんじ / さんぷる ゆか"
    className="w-full px-3 py-2 text-sm rounded-lg border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary"
  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    {t("labelFullNameEn")}
                  </label>
                  <input
    type="text"
    value={profile.fullNameEn || ""}
    onChange={(e) => updateField("fullNameEn", e.target.value)}
    placeholder="例: Kenji Tanaka / Yuka Sample"
    className="w-full px-3 py-2 text-sm rounded-lg border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary"
  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    {t("labelJobTitle")} <span className="text-red-500">*</span>
                  </label>
                  <input
    type="text"
    value={profile.jobTitle}
    onChange={(e) => updateField("jobTitle", e.target.value)}
    placeholder="例: 代表取締役 CEO / designer"
    className="w-full px-3 py-2 text-sm rounded-lg border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary"
  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    {t("labelDepartment")}
                  </label>
                  <input
    type="text"
    value={profile.department || ""}
    onChange={(e) => updateField("department", e.target.value)}
    placeholder="例: 経営企画本部"
    className="w-full px-3 py-2 text-sm rounded-lg border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary"
  />
                </div>
              </div>
            </div>

            {
    /* 2. Company Info */
  }
            <div className="pt-3 border-t border-border-subtle/50">
              <div className="flex items-center gap-1.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">
                <Building2 className="w-3.5 h-3.5 text-primary" />
                <span>{t("secCompany")}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    {t("labelCompanyName")} <span className="text-red-500">*</span>
                  </label>
                  <input
    type="text"
    value={profile.companyName}
    onChange={(e) => updateField("companyName", e.target.value)}
    placeholder="例: 株式会社グローバルイノベーション / yuka design"
    className="w-full px-3 py-2 text-sm rounded-lg border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary"
  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    {t("labelCompanyNameEn")}
                  </label>
                  <input
    type="text"
    value={profile.companyNameEn || ""}
    onChange={(e) => updateField("companyNameEn", e.target.value)}
    placeholder="例: Global Innovation Solutions Inc."
    className="w-full px-3 py-2 text-sm rounded-lg border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary"
  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    {t("labelLogo")}
                  </label>
                  <input
    type="file"
    ref={logoInputRef}
    onChange={handleLogoUpload}
    accept="image/*"
    className="hidden"
  />
                  <div className="flex items-center gap-2">
                    <button
    type="button"
    onClick={() => logoInputRef.current?.click()}
    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-on-surface-variant bg-surface-subtle hover:bg-surface-subtle rounded-lg border border-border-subtle transition-colors"
  >
                      <ImageIcon className="w-3.5 h-3.5 text-on-surface-variant" />
                      <span>{profile.logoUrl ? t("btnChangeLogo") : t("btnUploadLogo")}</span>
                    </button>
                    {profile.logoUrl && <div className="w-9 h-9 p-1 bg-surface-container border border-border-subtle rounded-lg flex items-center justify-center">
                        <img src={profile.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                      </div>}
                  </div>
                </div>
              </div>
            </div>

            {
    /* 3. Address & Contacts */
  }
            <div className="pt-3 border-t border-border-subtle/50">
              <div className="flex items-center gap-1.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span>{t("secAddress")}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">{t("labelPostal")}</label>
                  <input
    type="text"
    value={profile.postalCode}
    onChange={(e) => updateField("postalCode", e.target.value)}
    placeholder="例: 〒100-0005"
    className="w-full px-3 py-2 text-sm rounded-lg border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary"
  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">{t("labelBuilding")}</label>
                  <input
    type="text"
    value={profile.building || ""}
    onChange={(e) => updateField("building", e.target.value)}
    placeholder="例: パークタワー 14F"
    className="w-full px-3 py-2 text-sm rounded-lg border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary"
  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">{t("labelAddress")}</label>
                  <input
    type="text"
    value={profile.address}
    onChange={(e) => updateField("address", e.target.value)}
    placeholder="例: 東京都千代田区丸の内1-1-1"
    className="w-full px-3 py-2 text-sm rounded-lg border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary"
  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">{t("labelPhone")}</label>
                  <input
    type="text"
    value={profile.phone}
    onChange={(e) => updateField("phone", e.target.value)}
    placeholder="例: 03-5555-0199 / 090-1234-5678"
    className="w-full px-3 py-2 text-sm rounded-lg border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary"
  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">{t("labelMobile")}</label>
                  <input
    type="text"
    value={profile.mobile || ""}
    onChange={(e) => updateField("mobile", e.target.value)}
    placeholder="例: 090-1234-5678"
    className="w-full px-3 py-2 text-sm rounded-lg border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary"
  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">{t("labelEmail")}</label>
                  <input
    type="email"
    value={profile.email}
    onChange={(e) => updateField("email", e.target.value)}
    placeholder="例: k.tanaka@global-innov.co.jp"
    className="w-full px-3 py-2 text-sm rounded-lg border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary"
  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">{t("labelWebsite")}</label>
                  <input
    type="text"
    value={profile.website}
    onChange={(e) => updateField("website", e.target.value)}
    placeholder="例: https://www.global-innov.co.jp"
    className="w-full px-3 py-2 text-sm rounded-lg border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary"
  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {
    /* RIGHT COLUMN: Print Specification & Style Preferences */
  }
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface-container rounded-2xl p-6 border border-border-subtle shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-border-subtle/50">
              <Sliders className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider">
                {t("secPrintSpecs")}
              </h2>
            </div>

            {
    /* 1. Card Dimension Preset */
  }
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-2">
                {t("labelStandardSize")}
              </label>
              <div className="space-y-2">
                {CARD_DIMENSIONS.map((dim) => {
    const localizedDim = getDimensionDisplay(dim, language);
    return <div
      key={dim.id}
      onClick={() => onDimensionChange(dim)}
      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${selectedDimension.id === dim.id ? "border-brand-500 bg-primary/10/50 ring-2 ring-primary/20" : "border-border-subtle hover:border-border-subtle bg-surface-container"}`}
    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-on-surface">
                          {localizedDim.name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-subtle text-on-surface-variant">
                          {dim.widthMm} × {dim.heightMm} mm
                        </span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant mt-1 leading-normal">
                        {localizedDim.description}
                      </p>
                    </div>;
  })}
              </div>
            </div>

            {
    /* 2. Orientation (横型 vs 縦型) */
  }
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-2">
                {t("labelOrientation")}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
    type="button"
    onClick={() => onOrientationChange("horizontal")}
    className={`p-3 rounded-xl border text-center font-bold text-xs transition-all ${orientation === "horizontal" ? "border-brand-500 bg-primary/10 text-primary ring-2 ring-primary/20" : "border-border-subtle text-on-surface-variant hover:bg-surface-canvas"}`}
  >
                  <div className="w-8 h-5 border-2 border-current rounded mx-auto mb-1" />
                  <span>{t("orientHoriz")}</span>
                </button>
                <button
    type="button"
    onClick={() => onOrientationChange("vertical")}
    className={`p-3 rounded-xl border text-center font-bold text-xs transition-all ${orientation === "vertical" ? "border-brand-500 bg-primary/10 text-primary ring-2 ring-primary/20" : "border-border-subtle text-on-surface-variant hover:bg-surface-canvas"}`}
  >
                  <div className="w-5 h-8 border-2 border-current rounded mx-auto mb-1" />
                  <span>{t("orientVert")}</span>
                </button>
              </div>
            </div>

            {
    /* 3. Single-sided vs Double-sided */
  }
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-2">
                {t("labelPrintSide")}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
    type="button"
    onClick={() => onDoubleSidedChange(false)}
    className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition-all ${!isDoubleSided ? "border-brand-500 bg-primary/10 text-primary" : "border-border-subtle text-on-surface-variant hover:bg-surface-canvas"}`}
  >
                  {t("sideSingle")}
                </button>
                <button
    type="button"
    onClick={() => onDoubleSidedChange(true)}
    className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition-all ${isDoubleSided ? "border-brand-500 bg-primary/10 text-primary ring-2 ring-primary/20" : "border-border-subtle text-on-surface-variant hover:bg-surface-canvas"}`}
  >
                  {t("sideDouble")}
                </button>
              </div>
            </div>

            {
    /* 4. Preferred Design Style */
  }
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-2">
                {t("labelPreferredStyle")}
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
    { id: "Minimal Modern", label: language === "vi" ? "T\u1ED1i gi\u1EA3n" : language === "en" ? "Minimal" : "\u30DF\u30CB\u30DE\u30EB" },
    { id: "Corporate Trust", label: language === "vi" ? "Doanh nghi\u1EC7p" : language === "en" ? "Corporate" : "\u30B3\u30FC\u30DD\u30EC\u30FC\u30C8" },
    { id: "Japanese Traditional", label: language === "vi" ? "Phong c\xE1ch Nh\u1EADt" : language === "en" ? "JP Traditional" : "\u548C\u98A8\u30FB\u4F1D\u7D71" },
    { id: "Executive Luxury", label: language === "vi" ? "Sang tr\u1ECDng cao c\u1EA5p" : language === "en" ? "Executive Luxury" : "\u9AD8\u7D1A\u30FB\u7B94\u62BC\u3057\u8ABF" },
    { id: "Tech Innovator", label: language === "vi" ? "C\xF4ng ngh\u1EC7" : language === "en" ? "Tech Innovator" : "\u30C6\u30C3\u30AF\u30FB\u5148\u9032" },
    { id: "Yuka Minimalist Line-Art", label: language === "vi" ? "Yuka N\xE9t v\u1EBD" : language === "en" ? "Yuka Line-Art" : "Yuka \u7DDA\u753B\u30DF\u30CB\u30DE\u30EB" }
  ].map((s) => <button
    key={s.id}
    type="button"
    onClick={() => onStyleChange(s.id)}
    className={`py-1.5 px-2 text-xs rounded-lg border text-left truncate transition-colors ${selectedStyle === s.id ? "border-brand-500 bg-primary/10 text-primary font-bold" : "border-border-subtle text-on-surface-variant hover:bg-surface-canvas"}`}
  >
                    {s.label}
                  </button>)}
              </div>
            </div>

            {
    /* 5. Preferred Color Palette */
  }
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-2">
                {t("labelBrandColor")}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {JAPANESE_PALETTE.map((c) => <button
    key={c.name}
    type="button"
    title={c.name}
    onClick={() => {
      const colors = profile.brandColors || [];
      updateField("brandColors", [c.hex, ...colors.slice(0, 2)]);
    }}
    style={{ backgroundColor: c.hex }}
    className="w-6 h-6 rounded-full border border-border-subtle hover:scale-110 transition-transform shadow-xs"
  />)}
              </div>
            </div>

            {
    /* CTA Proceed Button */
  }
            <div className="pt-4 border-t border-border-subtle/50">
              <button
    type="button"
    id="btn-proceed-to-generate"
    onClick={onProceedToGenerate}
    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-blue-600 hover:from-brand-700 hover:to-blue-700 text-white font-bold text-sm shadow-md shadow-brand-500/25 flex items-center justify-center gap-2 group transition-all"
  >
                <Sparkles className="w-4 h-4 text-yellow-300 group-hover:rotate-12 transition-transform" />
                <span>{t("btnGenerateAi")}</span>
              </button>
              <p className="text-[11px] text-on-surface-variant text-center mt-2">
                {t("generateHint")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
