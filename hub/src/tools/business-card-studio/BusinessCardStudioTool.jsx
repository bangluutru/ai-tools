/**
 * BusinessCardStudioTool.jsx
 * ========================================================================
 * Thin hub wrapper for Business Card Studio — the commercial business card miniapp.
 * Follows the ai-tools "ToolErrorBoundary → View" isolation pattern.
 */
import React from 'react';
import BusinessCardStudioView from '@ai-tools/core/components/BusinessCardStudioView';
import { loadStylesheet } from '../../utils/loadStylesheet';

// Font của các mẫu danh thiếp (FONT_OPTIONS trong utils/business-card/fonts.js).
// Chỉ miniapp này dùng nên tải khi mở miniapp, không để trong index.html.
const BUSINESS_CARD_FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Montserrat:wght@400;600;700&family=Noto+Sans+JP:wght@300;400;500;700&family=Noto+Serif+JP:wght@400;600;700&family=Shippori+Mincho:wght@400;600;700&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap';

loadStylesheet(BUSINESS_CARD_FONTS_HREF);

export default function BusinessCardStudioTool({ displayLang, onBackToHub }) {
  return (
    <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col text-on-surface">
      <BusinessCardStudioView displayLang={displayLang} onBackToHub={onBackToHub} />
    </div>
  );
}
