/**
 * @file CertificateAcquisitionGuideView.jsx
 * Interactive view for "Giấy này lấy ở đâu, bằng cách nào?" (Certificate Acquisition Guide)
 * Built with StandardToolLayout, high-contrast dark/light mode tokens, WCAG 2.1 AA.
 */

import React, { useState, useMemo } from 'react';
import {
  Store,
  Building2,
  Mail,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Coins,
  MapPin,
  Shield,
  HelpCircle,
  Search,
  ExternalLink,
} from 'lucide-react';
import StandardToolLayout from '../shared/StandardToolLayout.jsx';
import {
  getCommonCertificates,
  buildCertificateAcquisitionGuide,
} from '../../documents/acquisition/certificateGuideEngine.js';
import { getVerifiedMunicipalitiesList } from '../../documents/acquisition/localityRegistry.js';
import { findDocumentsByQuery, getAllDocuments } from '../../documents/resolvers/documentResolver.js';

export function CertificateAcquisitionGuideView({ lang = 'vi' }) {
  const commonDocs = useMemo(() => getCommonCertificates(), []);
  const verifiedMunicipalities = useMemo(() => getVerifiedMunicipalitiesList(), []);
  const allDocs = useMemo(() => getAllDocuments(), []);

  const [selectedDocId, setSelectedDocId] = useState('document.resident-record-copy');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuniCode, setSelectedMuniCode] = useState('131041'); // Default: Shinjuku City
  const [customMuniName, setCustomMuniName] = useState('');
  const [hasMyNumberCard, setHasMyNumberCard] = useState(true);
  const [livesOutsideDomicile, setLivesOutsideDomicile] = useState(false);
  const [movedAfterJan1, setMovedAfterJan1] = useState(false);
  const [jan1City, setJan1City] = useState('');
  const [domicileCity, setDomicileCity] = useState('');
  const [activeChannelTab, setActiveChannelTab] = useState('convenience_store');

  // Search filtered documents
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return findDocumentsByQuery(searchQuery);
  }, [searchQuery]);

  const activeDoc = useMemo(() => {
    return allDocs.find((d) => d.id === selectedDocId);
  }, [selectedDocId, allDocs]);

  // Is this a tax document?
  const isTaxDoc =
    activeDoc?.id === 'document.taxation-certificate' ||
    activeDoc?.id === 'document.tax-payment-certificate' ||
    activeDoc?.id === 'document.tax-income-certificate';

  // Is this a Koseki document?
  const isKosekiDoc =
    activeDoc?.id === 'document.family-register-full' ||
    activeDoc?.id === 'document.family-register-individual' ||
    activeDoc?.id === 'document.family-register-tag';

  // Build guide result
  const guideResult = useMemo(() => {
    return buildCertificateAcquisitionGuide({
      documentId: selectedDocId,
      municipalityQuery: customMuniName.trim() || selectedMuniCode,
      hasMyNumberCard,
      livesOutsideRegisteredDomicile: livesOutsideDomicile,
      movedAfterJan1,
      jan1Municipality: jan1City,
      registeredDomicileMunicipality: domicileCity,
    });
  }, [
    selectedDocId,
    customMuniName,
    selectedMuniCode,
    hasMyNumberCard,
    livesOutsideDomicile,
    movedAfterJan1,
    jan1City,
    domicileCity,
  ]);

  const t = {
    title: {
      ja: '証明書取得ガイド',
      vi: 'Hướng dẫn lấy giấy tờ hành chính (Certificate Guide)',
      en: 'Certificate Acquisition Guide',
    },
    subtitle: {
      ja: '「この書類はどこで、どうやって取る？」を自治体・コンビニ・窓口・郵送ごとに詳しく解説します。',
      vi: 'Chỉ rõ cơ quan cấp, cách lấy tại quầy, in tại combini, nộp bưu điện và lệ phí theo từng địa phương.',
      en: 'Detailed guidance on where and how to obtain official certificates via counter, konbini, or mail.',
    },
    commonCertsHeading: {
      ja: 'よく使われる証明書から選ぶ',
      vi: 'Chọn nhanh các giấy tờ phổ biến',
      en: 'Frequently requested certificates',
    },
    searchPlaceholder: {
      ja: '書類名や通称で検索（じゅうみんひょう、非課税、源泉、戸籍等）...',
      vi: 'Tìm theo tên hoặc bí danh (住民票, thuế, gensen, hộ tịch...)...',
      en: 'Search by document name or alias (resident record, tax, etc.)...',
    },
    setupHeading: {
      ja: 'あなたの状況・自治体を選択',
      vi: 'Thiết lập địa phương và hoàn cảnh của bạn',
      en: 'Select your locality & situation',
    },
    selectMuni: {
      ja: '現住所の市区町村',
      vi: 'Tòa thị chính nơi đang cư trú',
      en: 'Current Municipality',
    },
    myNumberToggle: {
      ja: 'マイナンバーカードを持っている',
      vi: 'Tôi có Thẻ My Number (còn hiệu lực)',
      en: 'I possess a valid My Number Card',
    },
    movedToggle: {
      ja: '今年の1月1日以降に引越し（転入）した',
      vi: 'Tôi mới chuyển nhà đến sau ngày 1 tháng 1 năm nay',
      en: 'I moved into current city after January 1 this year',
    },
    domicileToggle: {
      ja: '本籍地と現住所が異なる',
      vi: 'Nơi ở hiện tại khác với nơi đăng ký Bản quán (Honsekichi)',
      en: 'Current residence differs from Registered Domicile',
    },
    issuerBannerHeading: {
      ja: '発行元機関・担当窓口',
      vi: 'Cơ quan có thẩm quyền cấp phát',
      en: 'Issuing Authority',
    },
    channelsHeading: {
      ja: '取得方法・チャネル別の案内',
      vi: 'Các kênh có thể lấy giấy tờ',
      en: 'Acquisition Channels',
    },
    channelKonbini: {
      ja: 'コンビニ交付',
      vi: 'In tại Combini',
      en: 'Convenience Store',
    },
    channelCounter: {
      ja: '役所窓口',
      vi: 'Quầy Tòa thị chính',
      en: 'Municipal Counter',
    },
    channelMail: {
      ja: '郵送請求',
      vi: 'Gửi bưu điện',
      en: 'Mail Request',
    },
    stepsHeading: {
      ja: '具体的な取得手順',
      vi: 'Các bước thực hiện chi tiết',
      en: 'Step-by-Step Procedure',
    },
  };

  return (
    <StandardToolLayout
      title={t.title[lang] || t.title.vi}
      description={t.subtitle[lang] || t.subtitle.vi}
      iconName="Store"
      activeTab="calculator"
      showLayoutToggle={false}
    >
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* 1. Document Selection & Search */}
        <section className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            {t.commonCertsHeading[lang] || t.commonCertsHeading.vi}
          </h2>

          <div className="flex flex-wrap gap-2">
            {commonDocs.map((doc) => {
              const isSelected = selectedDocId === doc.id;
              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => {
                    setSelectedDocId(doc.id);
                    setSearchQuery('');
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    isSelected
                      ? 'bg-primary text-on-primary border-primary shadow-sm'
                      : 'bg-surface border-outline-variant text-on-surface hover:border-primary/50'
                  }`}
                >
                  {doc.canonicalNameJa}
                </button>
              );
            })}
          </div>

          {/* Search input with live suggestions */}
          <div className="mt-4 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder[lang] || t.searchPlaceholder.vi}
              className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-2.5 pl-10 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
            />
            <Search className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-3.5" />

            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-outline-variant rounded-xl shadow-lg z-20 max-h-56 overflow-y-auto p-1">
                {searchResults.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      setSelectedDocId(d.id);
                      setSearchQuery('');
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-surface-container-high text-on-surface flex items-center justify-between"
                  >
                    <span className="font-semibold">{d.canonicalNameJa}</span>
                    <span className="text-on-surface-variant">
                      {d.nameI18n[lang] || d.nameI18n.vi}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 2. User Context & Municipality Configuration */}
        <section className="bg-surface-container border border-outline-variant rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-on-surface mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-secondary" />
            {t.setupHeading[lang] || t.setupHeading.vi}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="muni-select" className="block text-xs font-semibold text-on-surface-variant mb-1">
                {t.selectMuni[lang] || t.selectMuni.vi} (Verified major cities):
              </label>
              <select
                id="muni-select"
                aria-label={t.selectMuni[lang] || t.selectMuni.vi}
                value={selectedMuniCode}
                onChange={(e) => {
                  setSelectedMuniCode(e.target.value);
                  setCustomMuniName('');
                }}
                className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {verifiedMunicipalities.map((m) => (
                  <option key={m.code} value={m.code}>
                    {m.nameJa} ({m.nameI18n[lang] || m.nameI18n.vi})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                Hoặc nhập tên địa phương khác:
              </label>
              <input
                type="text"
                value={customMuniName}
                onChange={(e) => setCustomMuniName(e.target.value)}
                placeholder="VD: Kyoto, Chiba, Sapporo..."
                className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Context Toggles */}
          <div className="mt-4 pt-4 border-t border-outline-variant/60 flex flex-wrap gap-4 text-xs font-medium">
            <label className="flex items-center gap-2 cursor-pointer text-on-surface">
              <input
                type="checkbox"
                checked={hasMyNumberCard}
                onChange={(e) => setHasMyNumberCard(e.target.checked)}
                className="rounded border-outline-variant text-primary focus:ring-primary w-4 h-4"
              />
              <span>{t.myNumberToggle[lang] || t.myNumberToggle.vi}</span>
            </label>

            {isTaxDoc && (
              <label className="flex items-center gap-2 cursor-pointer text-on-surface">
                <input
                  type="checkbox"
                  checked={movedAfterJan1}
                  onChange={(e) => setMovedAfterJan1(e.target.checked)}
                  className="rounded border-outline-variant text-primary focus:ring-primary w-4 h-4"
                />
                <span>{t.movedToggle[lang] || t.movedToggle.vi}</span>
              </label>
            )}

            {isKosekiDoc && (
              <label className="flex items-center gap-2 cursor-pointer text-on-surface">
                <input
                  type="checkbox"
                  checked={livesOutsideDomicile}
                  onChange={(e) => setLivesOutsideDomicile(e.target.checked)}
                  className="rounded border-outline-variant text-primary focus:ring-primary w-4 h-4"
                />
                <span>{t.domicileToggle[lang] || t.domicileToggle.vi}</span>
              </label>
            )}
          </div>

          {/* Conditional follow-up fields */}
          {isTaxDoc && movedAfterJan1 && (
            <div className="mt-3 p-3 bg-warning/10 border border-warning/30 rounded-xl text-xs space-y-1">
              <label className="font-semibold text-warning-strong">
                Nhập tên địa phương cư trú vào ngày 1 tháng 1:
              </label>
              <input
                type="text"
                value={jan1City}
                onChange={(e) => setJan1City(e.target.value)}
                placeholder="VD: Osaka City, Yokohama..."
                className="w-full bg-surface border border-outline-variant rounded px-2.5 py-1.5 text-xs text-on-surface"
              />
            </div>
          )}

          {isKosekiDoc && livesOutsideDomicile && (
            <div className="mt-3 p-3 bg-secondary/10 border border-secondary/30 rounded-xl text-xs space-y-1">
              <label className="font-semibold text-secondary">
                Nhập tên địa phương đăng ký bản quán (Honsekichi):
              </label>
              <input
                type="text"
                value={domicileCity}
                onChange={(e) => setDomicileCity(e.target.value)}
                placeholder="VD: Hiroshima City, Fukuoka..."
                className="w-full bg-surface border border-outline-variant rounded px-2.5 py-1.5 text-xs text-on-surface"
              />
            </div>
          )}
        </section>

        {/* 3. Acquisition Guidance Result */}
        {guideResult && (
          <section className="space-y-6">
            {/* Header Document & Statutory basis */}
            <div className="bg-surface-container border border-outline-variant rounded-2xl p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                    {guideResult.document.category.toUpperCase()}
                  </span>
                  <h3 className="text-2xl font-bold text-on-surface mt-1">
                    {guideResult.document.canonicalNameJa}
                  </h3>
                  <p className="text-sm text-on-surface-variant">
                    {guideResult.document.nameI18n[lang] || guideResult.document.nameI18n.vi}
                  </p>
                </div>

                {guideResult.document.statutoryBasis && (
                  <div className="text-xs text-on-surface-variant bg-surface/80 px-3 py-1.5 rounded-lg border border-outline-variant/60">
                    <span className="font-medium">Căn cứ: </span>
                    {guideResult.document.statutoryBasis.lawJa}
                  </div>
                )}
              </div>

              <p className="mt-3 text-xs text-on-surface-variant leading-relaxed">
                {guideResult.document.descriptionI18n[lang] ||
                  guideResult.document.descriptionI18n.vi}
              </p>
            </div>

            {/* Issuing Authority Banner */}
            <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-5 flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-xl text-primary mt-0.5">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                  {t.issuerBannerHeading[lang] || t.issuerBannerHeading.vi}
                </span>
                <h4 className="text-lg font-bold text-on-surface mt-0.5">
                  {guideResult.issuer.nameJa}
                </h4>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  {guideResult.issuer.locationGuidanceI18n[lang] ||
                    guideResult.issuer.locationGuidanceI18n.vi}
                </p>

                {/* Critical Caveat Banner */}
                {guideResult.issuer.criticalCaveatI18n && (
                  <div className="mt-3 p-3 rounded-xl bg-error/10 border border-error/25 text-xs text-error font-medium flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>
                      {guideResult.issuer.criticalCaveatI18n[lang] ||
                        guideResult.issuer.criticalCaveatI18n.vi}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Unverified Locality Advisory (Tier 3 fallback) */}
            {guideResult.disclaimers && (
              <div className="p-4 rounded-xl bg-warning/10 border border-warning/30 text-xs text-warning-strong flex items-start gap-2">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{guideResult.disclaimers[lang] || guideResult.disclaimers.vi}</span>
              </div>
            )}

            {/* Channel Tabs */}
            <div className="space-y-4">
              <h4 className="text-base font-bold text-on-surface flex items-center gap-2">
                <Store className="w-4 h-4 text-primary" />
                {t.channelsHeading[lang] || t.channelsHeading.vi}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {guideResult.channels.map((channel) => {
                  const isTabActive = activeChannelTab === channel.channelId;
                  const isKonbini = channel.channelId === 'convenience_store';

                  return (
                    <button
                      key={channel.channelId}
                      type="button"
                      onClick={() => setActiveChannelTab(channel.channelId)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        isTabActive
                          ? 'bg-surface border-primary shadow-sm ring-1 ring-primary'
                          : 'bg-surface-container-low border-outline-variant hover:border-primary/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-on-surface">
                          {channel.nameI18n[lang] || channel.nameI18n.vi}
                        </span>
                        {isKonbini && !hasMyNumberCard && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-error/15 text-error font-semibold">
                            Cần Thẻ My Number
                          </span>
                        )}
                      </div>

                      <div className="mt-2 text-xs text-on-surface-variant flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5 text-primary" />
                        <span>Lệ phí: {channel.feeJpy}円</span>
                      </div>

                      <div className="mt-1 text-xs text-on-surface-variant flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="truncate">{channel.operatingHoursJa}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Step-by-Step Procedure for Active Channel */}
              {guideResult.detailedSteps && guideResult.detailedSteps[activeChannelTab] && (
                <div className="bg-surface-container border border-outline-variant rounded-2xl p-6 shadow-sm mt-4">
                  <h5 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    {t.stepsHeading[lang] || t.stepsHeading.vi} (
                    {guideResult.channels.find((c) => c.channelId === activeChannelTab)?.nameI18n[lang] || 'Kênh đã chọn'}
                    ):
                  </h5>

                  <div className="space-y-4">
                    {guideResult.detailedSteps[activeChannelTab].map((s) => (
                      <div key={s.step} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary text-on-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {s.step}
                        </div>
                        <div>
                          <h6 className="text-xs font-bold text-on-surface">
                            {s.titleI18n[lang] || s.titleI18n.vi}
                          </h6>
                          <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                            {s.descI18n[lang] || s.descI18n.vi}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </StandardToolLayout>
  );
}

export default CertificateAcquisitionGuideView;
