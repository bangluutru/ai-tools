import React from 'react';

/**
 * ScenicLandscapeIllustration — Bức tranh phong cảnh Á Đông toàn cảnh thích ứng hoàn hảo (Responsive Art Direction)
 * 
 * Kiến trúc 2 tầng hiển thị độc lập tối ưu:
 * - Mobile (< 640px): Bức tranh bố cục tinh gọn (viewBox="0 0 380 140"), thu gọn khoảng cách trời trung tâm để
 *   đỉnh Núi Phú Sĩ tuyết phủ & hoa Sakura bên trái và Chùa Một Cột uy nghiêm & đầm sen bên phải luôn hiển thị trọn vẹn 100%.
 * - Tablet & Desktop (>= 640px): Bức tranh toàn cảnh rộng lớn (viewBox="0 0 1200 160"), trải dài hai biểu tượng văn hóa
 *   sang hai góc biên tạo không gian thoáng đãng, trang trọng cho tiêu đề.
 */

export default function ScenicLandscapeIllustration({ className = '' }) {
  return (
    <div className={`w-full h-full relative overflow-hidden select-none pointer-events-none ${className}`}>
      {/* Nền trời chuyển sắc Á Đông toàn diện */}
      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#eff6ff] via-[#f0f9ff] to-[#f0fdf4] dark:from-[#0b1329] dark:via-[#0c1e28] dark:to-[#062117] opacity-95 transition-colors duration-300" />

      {/* ========================================================================= */}
      {/* 1. PHIÊN BẢN MOBILE (< 640px) — BỐ CỤC ĐẬM ĐÀ NGHỆ THUẬT CHO MÀN HÌNH NHỎ */}
      {/* ========================================================================= */}
      <svg
        viewBox="0 0 380 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full block sm:hidden relative z-0"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          {/* Dải màu Núi Phú Sĩ Mobile */}
          <linearGradient id="m-fuji-body" x1="65" y1="20" x2="65" y2="140" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.75" className="dark:stop-color-[#1e3a8a] dark:stop-opacity-80" />
            <stop offset="100%" stopColor="#bfdbfe" stopOpacity="0.15" className="dark:stop-color-[#0f172a] dark:stop-opacity-25" />
          </linearGradient>
          <linearGradient id="m-fuji-snow" x1="65" y1="15" x2="65" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
            <stop offset="100%" stopColor="#dbeafe" stopOpacity="0.8" className="dark:stop-color-[#60a5fa] dark:stop-opacity-55" />
          </linearGradient>

          {/* Dải màu Hoa Sakura Mobile */}
          <linearGradient id="m-sakura-petal" x1="0" y1="0" x2="0" y2="14" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fecdd3" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>

          <g id="m-blossom">
            <path d="M7 6 C4 2, 1 1, 3 -2 C5 -3, 6 -2, 7 -1 C8 -2, 10 -3, 11 -2 C13 1, 10 2, 7 6 Z" fill="url(#m-sakura-petal)" />
            <path d="M7 6 C4 2, 1 1, 3 -2 C5 -3, 6 -2, 7 -1 C8 -2, 10 -3, 11 -2 C13 1, 10 2, 7 6 Z" fill="url(#m-sakura-petal)" transform="rotate(72 7 7)" />
            <path d="M7 6 C4 2, 1 1, 3 -2 C5 -3, 6 -2, 7 -1 C8 -2, 10 -3, 11 -2 C13 1, 10 2, 7 6 Z" fill="url(#m-sakura-petal)" transform="rotate(144 7 7)" />
            <path d="M7 6 C4 2, 1 1, 3 -2 C5 -3, 6 -2, 7 -1 C8 -2, 10 -3, 11 -2 C13 1, 10 2, 7 6 Z" fill="url(#m-sakura-petal)" transform="rotate(216 7 7)" />
            <path d="M7 6 C4 2, 1 1, 3 -2 C5 -3, 6 -2, 7 -1 C8 -2, 10 -3, 11 -2 C13 1, 10 2, 7 6 Z" fill="url(#m-sakura-petal)" transform="rotate(288 7 7)" />
            <circle cx="7" cy="7" r="1.8" fill="#fef08a" />
          </g>

          {/* Dải màu Chùa Một Cột Mobile */}
          <linearGradient id="m-vn-roof" x1="270" y1="20" x2="350" y2="65" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="m-vn-pillar" x1="310" y1="65" x2="325" y2="140" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6ee7b7" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
          <radialGradient id="m-vn-halo" cx="315" cy="65" r="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#a7f3d0" stopOpacity="0.45" className="dark:stop-color-[#065f46] dark:stop-opacity-40" />
            <stop offset="100%" stopColor="#a7f3d0" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 1A. CÁNH TRÁI MOBILE: NÚI PHÚ SĨ & HOA ANH ĐÀO SAKURA */}
        <g className="japan-fuji-group">
          <path d="M 65 24 L 98 44 L 175 140 L -45 140 L 32 44 Z" fill="url(#m-fuji-body)" />
          <path d="M 65 24 L 98 44 L 175 140 L 65 140 Z" fill="#60a5fa" opacity="0.18" className="dark:fill-[#1e40af] dark:opacity-30" />
          <path d="M 65 24 L 98 44 C 90 53, 85 49, 77 59 C 72 52, 67 56, 61 61 C 56 51, 50 54, 44 57 C 39 49, 36 52, 32 44 Z" fill="url(#m-fuji-snow)" />

          <g fill="#ffffff" opacity="0.7" className="dark:fill-[#38bdf8] dark:opacity-20">
            <path d="M -30 120 C -15 105, 15 105, 30 120 C 45 105, 75 105, 90 120 C 105 120, 115 130, 105 140 L -30 140 Z" />
            <path d="M 110 125 C 122 116, 145 116, 157 125 C 168 116, 185 116, 195 125 L 110 140 Z" opacity="0.6" />
          </g>

          <g className="sakura-branch">
            <path d="M -10 12 C 20 8, 48 20, 75 15 C 92 10, 110 22, 130 18" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" className="dark:stroke-[#451a03]" />
            <path d="M 42 18 C 55 29, 69 27, 83 37" stroke="#78350f" strokeWidth="1.6" strokeLinecap="round" className="dark:stroke-[#451a03]" />
            <path d="M 83 14 C 96 7, 110 9, 120 4" stroke="#78350f" strokeWidth="1.4" strokeLinecap="round" className="dark:stroke-[#451a03]" />
            <use href="#m-blossom" x="15" y="6" transform="scale(1.15)" />
            <use href="#m-blossom" x="48" y="18" transform="scale(1.05)" />
            <use href="#m-blossom" x="75" y="8" transform="scale(1.2)" />
            <use href="#m-blossom" x="106" y="12" transform="scale(0.95)" />
            <use href="#m-blossom" x="124" y="14" transform="scale(0.85)" />
            <use href="#m-blossom" x="78" y="34" transform="scale(0.9)" />
          </g>
        </g>

        {/* 1B. CÁNH PHẢI MOBILE: CHÙA MỘT CỘT, ĐẦM SEN & RẶNG TRE (Tinh chỉnh translate(-30, 0) tạo khoảng cách 16px an toàn) */}
        <g className="vietnam-pagoda-group" transform="translate(-30, 0)">
          <circle cx="315" cy="62" r="55" fill="url(#m-vn-halo)" />

          <g opacity="0.75">
            <path d="M 364 135 C 367 100, 362 70, 354 42" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
            <path d="M 374 135 C 376 108, 372 85, 364 64" stroke="#059669" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M 354 42 C 360 36, 370 38, 376 42 C 367 45, 361 45, 354 42 Z" fill="#34d399" />
            <path d="M 354 42 C 348 35, 340 33, 332 35 C 341 39, 347 40, 354 42 Z" fill="#10b981" />
            <path d="M 357 62 C 363 57, 371 60, 375 64 C 367 66, 362 65, 357 62 Z" fill="#34d399" />
          </g>

          <rect x="307" y="74" width="16" height="54" rx="2.5" fill="url(#m-vn-pillar)" />
          <path d="M 296 74 L 307 86 L 323 86 L 334 74 Z" fill="#047857" opacity="0.9" />

          {/* Thân đài chùa màu trắng sứ nổi bật */}
          <rect x="292" y="49" width="46" height="25" rx="2" fill="#ffffff" className="dark:fill-[#064e3b]" stroke="#059669" strokeWidth="1.6" />
          <path d="M 308 74 V 58 A 7 7 0 0 1 322 58 V 74 Z" fill="#059669" />
          <line x1="315" y1="58" x2="315" y2="74" stroke="#ffffff" strokeWidth="1.1" className="dark:stroke-[#ecfdf5]" />

          {/* Mái đao cong vút */}
          <path d="M 274 53 C 288 49, 315 47, 315 47 C 315 47, 342 49, 356 53 C 353 48, 345 44, 327 43 L 303 43 C 285 44, 277 48, 274 53 Z" fill="url(#m-vn-roof)" />
          <path d="M 281 43 C 291 39, 315 37, 315 37 C 315 37, 339 39, 349 43 C 345 37, 336 31, 322 30 L 308 30 C 294 31, 285 37, 281 43 Z" fill="url(#m-vn-roof)" />

          {/* Đỉnh mái hồ lô vàng */}
          <line x1="315" y1="30" x2="315" y2="21" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="315" cy="20" r="2.5" fill="#f59e0b" />
          <circle cx="315" cy="16" r="1.3" fill="#f59e0b" />

          {/* Đầm sen dưới chân chùa */}
          <g className="lotus-pond">
            <path d="M 260 128 C 285 125, 310 130, 335 127 C 355 124, 370 128, 380 128" stroke="#6ee7b7" strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
            <ellipse cx="285" cy="129" rx="16" ry="5" fill="#059669" />
            <ellipse cx="285" cy="128" rx="13" ry="3.8" fill="#10b981" />
            <path d="M 298 128 C 299 121, 301 116, 304 112 C 307 116, 309 121, 310 128 Z" fill="#fb7185" />
            <g transform="translate(345, 122) scale(0.32)">
              <path d="M 0 10 C -15 0, -10 -20, 0 -30 C 10 -20, 15 0, 0 10 Z" fill="#f43f5e" />
              <path d="M -8 8 C -20 2, -18 -15, -4 -24 Z" fill="#fb7185" />
              <path d="M 8 8 C 20 2, 18 -15, 4 -24 Z" fill="#fb7185" />
              <circle cx="0" cy="-5" r="4" fill="#fef08a" />
            </g>
          </g>
        </g>
      </svg>

      {/* ========================================================================= */}
      {/* 2. PHIÊN BẢN TABLET (640px - 1023px) — BỐ CỤC CÂN XỨNG HOÀN MỸ CHO IPAD/TABLET */}
      {/* ========================================================================= */}
      <svg
        viewBox="0 0 760 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full hidden sm:block lg:hidden relative z-0"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="t-fuji-body" x1="100" y1="35" x2="100" y2="160" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.75" className="dark:stop-color-[#1e3a8a] dark:stop-opacity-80" />
            <stop offset="100%" stopColor="#bfdbfe" stopOpacity="0.15" className="dark:stop-color-[#0f172a] dark:stop-opacity-25" />
          </linearGradient>
          <linearGradient id="t-fuji-snow" x1="100" y1="25" x2="100" y2="78" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
            <stop offset="100%" stopColor="#dbeafe" stopOpacity="0.8" className="dark:stop-color-[#60a5fa] dark:stop-opacity-55" />
          </linearGradient>
          <linearGradient id="t-sakura-petal" x1="0" y1="0" x2="0" y2="16" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fecdd3" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>

          <g id="t-blossom">
            <path d="M8 7 C5 3, 1 1, 3 -2 C5 -4, 7 -3, 8 -1 C10 -3, 12 -4, 13 -2 C15 1, 11 3, 8 7 Z" fill="url(#t-sakura-petal)" />
            <path d="M8 7 C5 3, 1 1, 3 -2 C5 -4, 7 -3, 8 -1 C10 -3, 12 -4, 13 -2 C15 1, 11 3, 8 7 Z" fill="url(#t-sakura-petal)" transform="rotate(72 8 8)" />
            <path d="M8 7 C5 3, 1 1, 3 -2 C5 -4, 7 -3, 8 -1 C10 -3, 12 -4, 13 -2 C15 1, 11 3, 8 7 Z" fill="url(#t-sakura-petal)" transform="rotate(144 8 8)" />
            <path d="M8 7 C5 3, 1 1, 3 -2 C5 -4, 7 -3, 8 -1 C10 -3, 12 -4, 13 -2 C15 1, 11 3, 8 7 Z" fill="url(#t-sakura-petal)" transform="rotate(216 8 8)" />
            <path d="M8 7 C5 3, 1 1, 3 -2 C5 -4, 7 -3, 8 -1 C10 -3, 12 -4, 13 -2 C15 1, 11 3, 8 7 Z" fill="url(#t-sakura-petal)" transform="rotate(288 8 8)" />
            <circle cx="8" cy="8" r="2" fill="#fef08a" />
          </g>
          <path id="t-petal" d="M4 0 C1 3, 0 5, 3 8 C5 7, 6 4, 4 0 Z" fill="url(#t-sakura-petal)" opacity="0.8" />

          <linearGradient id="t-vn-roof" x1="60" y1="25" x2="140" y2="75" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="t-vn-pillar" x1="90" y1="75" x2="110" y2="160" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6ee7b7" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
          <radialGradient id="t-vn-halo" cx="120" cy="70" r="70" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#a7f3d0" stopOpacity="0.45" className="dark:stop-color-[#065f46] dark:stop-opacity-40" />
            <stop offset="100%" stopColor="#a7f3d0" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 2A. CÁNH TRÁI TABLET: NÚI PHÚ SĨ & HOA ANH ĐÀO SAKURA */}
        <g className="japan-fuji-tablet-group" transform="translate(-15, 0)">
          <path d="M 120 35 L 160 60 L 270 160 L -30 160 L 80 60 Z" fill="url(#t-fuji-body)" />
          <path d="M 120 35 L 160 60 L 270 160 L 120 160 Z" fill="#60a5fa" opacity="0.18" className="dark:fill-[#1e40af] dark:opacity-30" />
          <path d="M 120 35 L 160 60 C 150 72, 144 67, 133 80 C 126 71, 120 76, 113 83 C 106 69, 98 73, 90 78 C 83 67, 79 71, 76 60 Z" fill="url(#t-fuji-snow)" />

          <g fill="#ffffff" opacity="0.65" className="dark:fill-[#38bdf8] dark:opacity-20">
            <path d="M -30 135 C -10 120, 25 120, 45 135 C 65 118, 100 118, 120 135 C 140 135, 150 148, 140 160 L -30 160 Z" />
            <path d="M 190 140 C 210 130, 245 130, 265 140 C 285 125, 320 125, 340 140 C 355 140, 365 152, 355 160 L 190 160 Z" />
          </g>

          <g className="sakura-branch-tablet">
            <path d="M -35 15 C 10 10, 55 25, 95 18 C 125 12, 155 28, 185 22" stroke="#78350f" strokeWidth="3" strokeLinecap="round" className="dark:stroke-[#451a03]" />
            <path d="M 48 22 C 68 38, 90 35, 112 48" stroke="#78350f" strokeWidth="2" strokeLinecap="round" className="dark:stroke-[#451a03]" />
            <path d="M 112 16 C 132 7, 155 9, 170 3" stroke="#78350f" strokeWidth="1.8" strokeLinecap="round" className="dark:stroke-[#451a03]" />
            <use href="#t-blossom" x="5" y="8" transform="scale(1.2)" />
            <use href="#t-blossom" x="58" y="24" transform="scale(1.1)" />
            <use href="#t-blossom" x="98" y="10" transform="scale(1.25)" />
            <use href="#t-blossom" x="148" y="16" />
            <use href="#t-blossom" x="178" y="18" transform="scale(0.9)" />
            <use href="#t-blossom" x="102" y="44" />
            <use href="#t-petal" x="125" y="48" transform="rotate(25 125 48)" />
            <use href="#t-petal" x="195" y="42" transform="rotate(-15 195 42)" />
            <use href="#t-petal" x="230" y="75" transform="rotate(40 230 75)" opacity="0.65" />
          </g>
        </g>

        {/* 2B. CÁNH PHẢI TABLET: CHÙA MỘT CỘT, ĐẦM SEN & RẶNG TRE */}
        <g className="vietnam-pagoda-tablet-group" transform="translate(520, 10)">
          <circle cx="120" cy="70" r="70" fill="url(#t-vn-halo)" />

          <g opacity="0.65">
            <path d="M 200 150 C 205 110, 198 75, 185 45" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M 215 150 C 218 120, 212 95, 200 70" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M 185 45 C 192 38, 206 40, 215 45 C 203 48, 195 48, 185 45 Z" fill="#34d399" />
            <path d="M 185 45 C 178 37, 166 35, 156 37 C 168 42, 176 43, 185 45 Z" fill="#10b981" />
            <path d="M 190 68 C 198 62, 210 65, 216 70 C 205 72, 198 71, 190 68 Z" fill="#34d399" />
          </g>

          <rect x="111" y="76" width="18" height="66" rx="3" fill="url(#t-vn-pillar)" />
          <path d="M 98 76 L 111 90 L 129 90 L 142 76 Z" fill="#047857" opacity="0.9" />

          {/* Thân đài chùa màu trắng sứ nổi bật */}
          <rect
            x="94"
            y="48"
            width="52"
            height="28"
            rx="2.5"
            fill="#ffffff"
            className="dark:fill-[#064e3b]"
            stroke="#059669"
            strokeWidth="1.8"
          />

          <path d="M 112 76 V 58 A 8 8 0 0 1 128 58 V 76 Z" fill="#059669" />
          <line x1="120" y1="58" x2="120" y2="76" stroke="#ffffff" strokeWidth="1.2" className="dark:stroke-[#ecfdf5]" />

          <path
            d="M 74 52 C 90 48, 120 46, 120 46 C 120 46, 150 48, 166 52 C 163 47, 154 42, 134 41 L 106 41 C 86 42, 77 47, 74 52 Z"
            fill="url(#t-vn-roof)"
          />
          <path
            d="M 82 41 C 94 36, 120 34, 120 34 C 120 34, 146 36, 158 41 C 154 34, 144 27, 128 26 L 112 26 C 96 27, 86 34, 82 41 Z"
            fill="url(#t-vn-roof)"
          />

          <line x1="120" y1="26" x2="120" y2="16" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="120" cy="15" r="2.8" fill="#f59e0b" />
          <circle cx="120" cy="11" r="1.5" fill="#f59e0b" />

          <g className="lotus-pond-elements">
            <path d="M 50 144 C 80 140, 110 146, 140 142 C 170 138, 210 144, 230 144" stroke="#6ee7b7" strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />
            <ellipse cx="85" cy="145" rx="20" ry="6" fill="#059669" />
            <ellipse cx="85" cy="144" rx="16" ry="4.5" fill="#10b981" />
            <path d="M 100 144 C 101 136, 103 130, 107 125 C 111 130, 113 136, 114 144 Z" fill="#fb7185" />
            <g transform="translate(155, 135) scale(0.38)">
              <path d="M 0 10 C -15 0, -10 -20, 0 -30 C 10 -20, 15 0, 0 10 Z" fill="#f43f5e" />
              <path d="M -8 8 C -20 2, -18 -15, -4 -24 Z" fill="#fb7185" />
              <path d="M 8 8 C 20 2, 18 -15, 4 -24 Z" fill="#fb7185" />
              <circle cx="0" cy="-5" r="4" fill="#fef08a" />
            </g>
          </g>
        </g>
      </svg>

      {/* ========================================================================= */}
      {/* 3. PHIÊN BẢN DESKTOP (>= 1024px) — BỨC TRANH TOÀN CẢNH RỘNG LỚN ĐẲNG CẤP */}
      {/* ========================================================================= */}
      <svg
        viewBox="0 0 1200 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full hidden lg:block relative z-0"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="d-fuji-body" x1="140" y1="35" x2="140" y2="160" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.75" className="dark:stop-color-[#1e3a8a] dark:stop-opacity-80" />
            <stop offset="100%" stopColor="#bfdbfe" stopOpacity="0.15" className="dark:stop-color-[#0f172a] dark:stop-opacity-25" />
          </linearGradient>
          <linearGradient id="d-fuji-snow" x1="140" y1="25" x2="140" y2="78" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
            <stop offset="100%" stopColor="#dbeafe" stopOpacity="0.8" className="dark:stop-color-[#60a5fa] dark:stop-opacity-55" />
          </linearGradient>
          <linearGradient id="d-sakura-petal" x1="0" y1="0" x2="0" y2="16" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fecdd3" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>

          <g id="d-blossom">
            <path d="M8 7 C5 3, 1 1, 3 -2 C5 -4, 7 -3, 8 -1 C10 -3, 12 -4, 13 -2 C15 1, 11 3, 8 7 Z" fill="url(#d-sakura-petal)" />
            <path d="M8 7 C5 3, 1 1, 3 -2 C5 -4, 7 -3, 8 -1 C10 -3, 12 -4, 13 -2 C15 1, 11 3, 8 7 Z" fill="url(#d-sakura-petal)" transform="rotate(72 8 8)" />
            <path d="M8 7 C5 3, 1 1, 3 -2 C5 -4, 7 -3, 8 -1 C10 -3, 12 -4, 13 -2 C15 1, 11 3, 8 7 Z" fill="url(#d-sakura-petal)" transform="rotate(144 8 8)" />
            <path d="M8 7 C5 3, 1 1, 3 -2 C5 -4, 7 -3, 8 -1 C10 -3, 12 -4, 13 -2 C15 1, 11 3, 8 7 Z" fill="url(#d-sakura-petal)" transform="rotate(216 8 8)" />
            <path d="M8 7 C5 3, 1 1, 3 -2 C5 -4, 7 -3, 8 -1 C10 -3, 12 -4, 13 -2 C15 1, 11 3, 8 7 Z" fill="url(#d-sakura-petal)" transform="rotate(288 8 8)" />
            <circle cx="8" cy="8" r="2" fill="#fef08a" />
          </g>
          <path id="d-petal" d="M4 0 C1 3, 0 5, 3 8 C5 7, 6 4, 4 0 Z" fill="url(#d-sakura-petal)" opacity="0.8" />

          <linearGradient id="d-vn-roof" x1="60" y1="25" x2="140" y2="75" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="d-vn-pillar" x1="90" y1="75" x2="110" y2="160" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6ee7b7" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
          <radialGradient id="d-vn-halo" cx="120" cy="70" r="70" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#a7f3d0" stopOpacity="0.45" className="dark:stop-color-[#065f46] dark:stop-opacity-40" />
            <stop offset="100%" stopColor="#a7f3d0" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 3A. CÁNH TRÁI DESKTOP: NÚI PHÚ SĨ & HOA ANH ĐÀO SAKURA */}
        <g className="japan-fuji-desktop-group">
          <path d="M 140 35 L 180 60 L 290 160 L -10 160 L 100 60 Z" fill="url(#d-fuji-body)" />
          <path d="M 140 35 L 180 60 L 290 160 L 140 160 Z" fill="#60a5fa" opacity="0.18" className="dark:fill-[#1e40af] dark:opacity-30" />
          <path d="M 140 35 L 180 60 C 170 72, 164 67, 153 80 C 146 71, 140 76, 133 83 C 126 69, 118 73, 110 78 C 103 67, 99 71, 96 60 Z" fill="url(#d-fuji-snow)" />

          <g fill="#ffffff" opacity="0.65" className="dark:fill-[#38bdf8] dark:opacity-20">
            <path d="M -10 135 C 10 120, 45 120, 65 135 C 85 118, 120 118, 140 135 C 160 135, 170 148, 160 160 L -10 160 Z" />
            <path d="M 210 140 C 230 130, 265 130, 285 140 C 305 125, 340 125, 360 140 C 375 140, 385 152, 375 160 L 210 160 Z" />
          </g>

          <g className="sakura-branch-desktop">
            <path d="M -15 15 C 30 10, 75 25, 115 18 C 145 12, 175 28, 205 22" stroke="#78350f" strokeWidth="3" strokeLinecap="round" className="dark:stroke-[#451a03]" />
            <path d="M 68 22 C 88 38, 110 35, 132 48" stroke="#78350f" strokeWidth="2" strokeLinecap="round" className="dark:stroke-[#451a03]" />
            <path d="M 132 16 C 152 7, 175 9, 190 3" stroke="#78350f" strokeWidth="1.8" strokeLinecap="round" className="dark:stroke-[#451a03]" />
            <use href="#d-blossom" x="25" y="8" transform="scale(1.2)" />
            <use href="#d-blossom" x="78" y="24" transform="scale(1.1)" />
            <use href="#d-blossom" x="118" y="10" transform="scale(1.25)" />
            <use href="#d-blossom" x="168" y="16" />
            <use href="#d-blossom" x="198" y="18" transform="scale(0.9)" />
            <use href="#d-blossom" x="122" y="44" />
            <use href="#d-petal" x="145" y="48" transform="rotate(25 145 48)" />
            <use href="#d-petal" x="215" y="42" transform="rotate(-15 215 42)" />
            <use href="#d-petal" x="250" y="75" transform="rotate(40 250 75)" opacity="0.65" />
            <use href="#d-petal" x="290" y="105" transform="rotate(-30 290 105)" opacity="0.5" />
          </g>
        </g>

        {/* 3B. CÁNH PHẢI DESKTOP: CHÙA MỘT CỘT, ĐẦM SEN & RẶNG TRE */}
        <g className="vietnam-pagoda-desktop-group" transform="translate(940, 10)">
          <circle cx="120" cy="70" r="70" fill="url(#d-vn-halo)" />

          <g opacity="0.65">
            <path d="M 200 150 C 205 110, 198 75, 185 45" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M 215 150 C 218 120, 212 95, 200 70" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M 185 45 C 192 38, 206 40, 215 45 C 203 48, 195 48, 185 45 Z" fill="#34d399" />
            <path d="M 185 45 C 178 37, 166 35, 156 37 C 168 42, 176 43, 185 45 Z" fill="#10b981" />
            <path d="M 190 68 C 198 62, 210 65, 216 70 C 205 72, 198 71, 190 68 Z" fill="#34d399" />
          </g>

          <rect x="111" y="76" width="18" height="66" rx="3" fill="url(#d-vn-pillar)" />
          <path d="M 98 76 L 111 90 L 129 90 L 142 76 Z" fill="#047857" opacity="0.9" />

          {/* Thân đài chùa màu trắng sứ nổi bật */}
          <rect
            x="94"
            y="48"
            width="52"
            height="28"
            rx="2.5"
            fill="#ffffff"
            className="dark:fill-[#064e3b]"
            stroke="#059669"
            strokeWidth="1.8"
          />

          <path d="M 112 76 V 58 A 8 8 0 0 1 128 58 V 76 Z" fill="#059669" />
          <line x1="120" y1="58" x2="120" y2="76" stroke="#ffffff" strokeWidth="1.2" className="dark:stroke-[#ecfdf5]" />

          <path
            d="M 74 52 C 90 48, 120 46, 120 46 C 120 46, 150 48, 166 52 C 163 47, 154 42, 134 41 L 106 41 C 86 42, 77 47, 74 52 Z"
            fill="url(#d-vn-roof)"
          />
          <path
            d="M 82 41 C 94 36, 120 34, 120 34 C 120 34, 146 36, 158 41 C 154 34, 144 27, 128 26 L 112 26 C 96 27, 86 34, 82 41 Z"
            fill="url(#d-vn-roof)"
          />

          <line x1="120" y1="26" x2="120" y2="16" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="120" cy="15" r="2.8" fill="#f59e0b" />
          <circle cx="120" cy="11" r="1.5" fill="#f59e0b" />

          <g className="lotus-pond-elements">
            <path d="M 50 144 C 80 140, 110 146, 140 142 C 170 138, 210 144, 230 144" stroke="#6ee7b7" strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />
            <path d="M 70 152 C 100 148, 130 154, 160 150 C 190 147, 210 152, 220 152" stroke="#34d399" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
            <ellipse cx="85" cy="145" rx="20" ry="6" fill="#059669" />
            <ellipse cx="85" cy="144" rx="16" ry="4.5" fill="#10b981" />
            <path d="M 100 144 C 101 136, 103 130, 107 125 C 111 130, 113 136, 114 144 Z" fill="#fb7185" />
            <path d="M 105 144 C 106 138, 107 132, 107 125 C 107 132, 108 138, 109 144 Z" fill="#fda4af" />
            <g transform="translate(155, 135) scale(0.38)">
              <path d="M 0 10 C -15 0, -10 -20, 0 -30 C 10 -20, 15 0, 0 10 Z" fill="#f43f5e" />
              <path d="M -8 8 C -20 2, -18 -15, -4 -24 Z" fill="#fb7185" />
              <path d="M 8 8 C 20 2, 18 -15, 4 -24 Z" fill="#fb7185" />
              <circle cx="0" cy="-5" r="4" fill="#fef08a" />
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}
