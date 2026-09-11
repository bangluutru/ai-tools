import React from 'react';

/**
 * ScenicLandscapeIllustration — Bức tranh phong cảnh toàn cảnh (Scenic Panorama)
 * Phối cảnh: Núi Phú Sĩ tuyết phủ, Chùa 5 tầng Nhật Bản, Cành hoa anh đào Sakura,
 * Mascot Ninja Toolio bay lượn và Bong bóng thoại châm ngôn thương hiệu.
 * 100% Vector SVG, sắc nét trên mọi độ phân giải màn hình, tự động thích ứng Light/Dark mode.
 */

export default function ScenicLandscapeIllustration({
  displayLang = 'vi',
  className = '',
}) {
  const quotes = {
    vi: {
      line1: 'Những công cụ nhỏ,',
      line2: 'tạo ra thay đổi lớn trong cuộc sống!',
    },
    en: {
      line1: 'Tiny tools,',
      line2: 'huge impact in everyday life!',
    },
    ja: {
      line1: '小さなツールで、',
      line2: '暮らしに大きな変化を！',
    },
  };

  const currentQuote = quotes[displayLang] || quotes.vi;

  return (
    <div className={`w-full relative overflow-hidden select-none pointer-events-none ${className}`}>
      <svg
        viewBox="0 0 1200 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto max-h-[280px] sm:max-h-[320px] object-cover sm:object-contain"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          {/* Nền chuyển sắc bầu trời */}
          <linearGradient id="sky-grad" x1="0" y1="0" x2="0" y2="320" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f0f9ff" stopOpacity="0.8" className="dark:stop-color-[#091527] dark:stop-opacity-80" />
            <stop offset="70%" stopColor="#e0f2fe" stopOpacity="0.4" className="dark:stop-color-[#0c1f38] dark:stop-opacity-40" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" className="dark:stop-color-[#090D16] dark:stop-opacity-0" />
          </linearGradient>

          {/* Dải màu Núi Phú Sĩ */}
          <linearGradient id="fuji-body-grad" x1="260" y1="90" x2="260" y2="300" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.6" className="dark:stop-color-[#1e3a8a] dark:stop-opacity-60" />
            <stop offset="100%" stopColor="#dbeafe" stopOpacity="0.15" className="dark:stop-color-[#0f172a] dark:stop-opacity-20" />
          </linearGradient>

          <linearGradient id="fuji-snow-grad" x1="260" y1="70" x2="260" y2="150" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#e0f2fe" stopOpacity="0.8" className="dark:stop-color-[#93c5fd] dark:stop-opacity-70" />
          </linearGradient>

          {/* Dải màu Chùa 5 tầng */}
          <linearGradient id="pagoda-body-grad" x1="1080" y1="120" x2="1080" y2="300" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.85" className="dark:stop-color-[#e11d48] dark:stop-opacity-85" />
            <stop offset="100%" stopColor="#be123c" stopOpacity="0.95" className="dark:stop-color-[#881337] dark:stop-opacity-95" />
          </linearGradient>

          {/* Dải màu hoa anh đào Sakura */}
          <linearGradient id="scenic-sakura-grad" x1="0" y1="0" x2="0" y2="20" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fecdd3" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>

          {/* Cánh hoa anh đào đơn chiếc */}
          <path
            id="falling-petal"
            d="M6 0 C2 4, 0 8, 4 12 C7 10, 8 6, 6 0 Z"
            fill="url(#scenic-sakura-grad)"
            opacity="0.85"
          />

          {/* Bông hoa anh đào 5 cánh */}
          <g id="blossom-flower">
            <path d="M12 10 C8 5, 2 2, 5 -3 C7 -5, 10 -4, 12 -1 C14 -4, 17 -5, 19 -3 C22 2, 16 5, 12 10 Z" fill="url(#scenic-sakura-grad)" />
            <path d="M12 10 C8 5, 2 2, 5 -3 C7 -5, 10 -4, 12 -1 C14 -4, 17 -5, 19 -3 C22 2, 16 5, 12 10 Z" fill="url(#scenic-sakura-grad)" transform="rotate(72 12 12)" />
            <path d="M12 10 C8 5, 2 2, 5 -3 C7 -5, 10 -4, 12 -1 C14 -4, 17 -5, 19 -3 C22 2, 16 5, 12 10 Z" fill="url(#scenic-sakura-grad)" transform="rotate(144 12 12)" />
            <path d="M12 10 C8 5, 2 2, 5 -3 C7 -5, 10 -4, 12 -1 C14 -4, 17 -5, 19 -3 C22 2, 16 5, 12 10 Z" fill="url(#scenic-sakura-grad)" transform="rotate(216 12 12)" />
            <path d="M12 10 C8 5, 2 2, 5 -3 C7 -5, 10 -4, 12 -1 C14 -4, 17 -5, 19 -3 C22 2, 16 5, 12 10 Z" fill="url(#scenic-sakura-grad)" transform="rotate(288 12 12)" />
            <circle cx="12" cy="12" r="3" fill="#fef08a" />
            <circle cx="12" cy="12" r="1.5" fill="#f59e0b" />
          </g>

          {/* Đổ bóng cho Bong bóng thoại */}
          <filter id="quote-card-shadow" x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0f172a" floodOpacity="0.08" />
          </filter>
        </defs>

        {/* 1. LỚP NỀN BẦU TRỜI & MẶT TRỜI MỜ ẢO */}
        <rect width="1200" height="320" fill="url(#sky-grad)" />

        {/* Vầng thái dương nhẹ phía sau Phú Sĩ */}
        <circle cx="280" cy="140" r="90" fill="#fbcfe8" opacity="0.15" className="dark:opacity-10" />

        {/* 2. DÃY NÚI PHÚ SĨ (CÁNH TRÁI & TRUNG TÂM) */}
        <g className="fuji-group">
          {/* Thân núi Phú Sĩ */}
          <path
            d="M60 290 C120 250, 190 160, 240 76 C255 74, 265 74, 280 76 C330 160, 400 250, 460 290 Z"
            fill="url(#fuji-body-grad)"
          />

          {/* Đỉnh tuyết phủ (Snow cap với các rãnh tuyết lượn tự nhiên) */}
          <path
            d="M240 76 C255 74, 265 74, 280 76 C295 102, 305 115, 315 125 L300 128 L290 145 L275 130 L260 152 L245 132 L235 142 L225 126 C232 110, 236 95, 240 76 Z"
            fill="url(#fuji-snow-grad)"
          />

          {/* Dãy đồi thấp thoải chân núi */}
          <path
            d="M0 310 C100 270, 200 285, 320 295 C420 305, 520 280, 600 310 L600 320 L0 320 Z"
            fill="#93c5fd"
            opacity="0.18"
            className="dark:fill-[#1e3a8a] dark:opacity-20"
          />
        </g>

        {/* 3. DẢI MÂY TRÔI BỒNG BỀNH (TRONG SUỐT, NHẸ NHÀNG) */}
        <g fill="#ffffff" opacity="0.65" className="clouds-group dark:fill-[#38bdf8] dark:opacity-15">
          {/* Cụm mây trái */}
          <path d="M40 160 C50 145, 80 145, 95 160 C110 140, 145 140, 160 160 C180 160, 190 175, 180 190 C170 200, 50 200, 40 180 Z" />
          {/* Cụm mây giữa chân núi */}
          <path d="M360 210 C380 195, 420 195, 440 210 C460 190, 500 190, 520 210 C540 210, 560 225, 550 240 C530 250, 370 250, 360 230 Z" />
          {/* Cụm mây lượn cao */}
          <path d="M680 90 C700 80, 730 80, 745 90 C760 75, 790 75, 805 90 C820 90, 835 102, 825 115 C810 122, 690 122, 680 108 Z" opacity="0.5" />
        </g>

        {/* 4. CHÙA 5 TẦNG NHẬT BẢN (PAGODA - CÁNH PHẢI) */}
        <g className="pagoda-group" transform="translate(1010, 100)">
          {/* Cột thu lôi đỉnh tháp (Sorin) */}
          <line x1="75" y1="-30" x2="75" y2="15" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="75" cy="-30" r="3.5" fill="#f59e0b" />
          <circle cx="75" cy="-22" r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1" />
          <circle cx="75" cy="-14" r="5.5" fill="#f59e0b" />
          <circle cx="75" cy="-6" r="6" fill="#f59e0b" />

          {/* Tầng 5 (Mái trên cùng) */}
          <path d="M48 20 Q75 14, 102 20 L96 23 L54 23 Z" fill="#ffffff" />
          <path d="M42 22 Q75 12, 108 22 L104 25 Q75 18, 46 25 Z" fill="#e11d48" />
          <rect x="63" y="24" width="24" height="15" fill="#881337" rx="1" />

          {/* Tầng 4 */}
          <path d="M40 42 Q75 33, 110 42 L104 45 L46 45 Z" fill="#ffffff" />
          <path d="M34 44 Q75 31, 116 44 L112 47 Q75 38, 38 47 Z" fill="#e11d48" />
          <rect x="60" y="46" width="30" height="17" fill="#881337" rx="1" />

          {/* Tầng 3 */}
          <path d="M32 66 Q75 55, 118 66 L112 69 L38 69 Z" fill="#ffffff" />
          <path d="M26 68 Q75 53, 124 68 L120 71 Q75 60, 30 71 Z" fill="#e11d48" />
          <rect x="57" y="70" width="36" height="19" fill="#881337" rx="1" />

          {/* Tầng 2 */}
          <path d="M24 92 Q75 79, 126 92 L120 95 L30 95 Z" fill="#ffffff" />
          <path d="M18 94 Q75 77, 132 94 L128 97 Q75 84, 22 97 Z" fill="#e11d48" />
          <rect x="54" y="96" width="42" height="21" fill="#881337" rx="1" />

          {/* Tầng 1 (Tầng trệt có lan can và cửa vòm) */}
          <path d="M14 120 Q75 105, 136 120 L130 123 L20 123 Z" fill="#ffffff" />
          <path d="M8 122 Q75 103, 142 122 L138 126 Q75 110, 12 126 Z" fill="#e11d48" />
          <rect x="50" y="125" width="50" height="36" fill="#881337" rx="1" />

          {/* Cửa vòm Chùa */}
          <path d="M68 161 V140 A7 7 0 0 1 82 140 V161 Z" fill="#fecdd3" opacity="0.9" />

          {/* Chân móng Chùa */}
          <rect x="36" y="161" width="78" height="14" rx="2" fill="#64748b" opacity="0.8" />
        </g>

        {/* 5. CÀNH HOA ANH ĐÀO SAKURA (RỦ XUỐNG TỪ GÓC PHẢI TRÊN) */}
        <g className="sakura-branch-group">
          {/* Cành cây nâu uốn lượn */}
          <path
            d="M1210 10 C1140 30, 1070 15, 1010 45 C970 65, 930 40, 880 70"
            stroke="#78350f"
            strokeWidth="5"
            strokeLinecap="round"
            opacity="0.8"
          />
          <path
            d="M1070 18 C1050 40, 1030 55, 990 60"
            stroke="#78350f"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.8"
          />
          <path
            d="M970 65 C960 90, 940 105, 910 115"
            stroke="#78350f"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.7"
          />

          {/* Các chùm hoa nở */}
          <use href="#blossom-flower" x="870" y="55" transform="scale(1.2)" />
          <use href="#blossom-flower" x="900" y="100" transform="scale(0.9)" />
          <use href="#blossom-flower" x="950" y="45" transform="scale(1.1)" />
          <use href="#blossom-flower" x="980" y="70" transform="scale(0.85)" />
          <use href="#blossom-flower" x="1005" y="30" transform="scale(1.3)" />
          <use href="#blossom-flower" x="1040" y="50" transform="scale(1)" />
          <use href="#blossom-flower" x="1080" y="15" transform="scale(1.2)" />
          <use href="#blossom-flower" x="1130" y="35" transform="scale(1.1)" />

          {/* Những cánh hoa rơi lượn trong gió */}
          <use href="#falling-petal" x="840" y="90" transform="rotate(25 840 90)" />
          <use href="#falling-petal" x="890" y="140" transform="rotate(-15 890 140)" />
          <use href="#falling-petal" x="780" y="120" transform="rotate(40 780 120)" />
          <use href="#falling-petal" x="720" y="160" transform="rotate(65 720 160)" />
        </g>

        {/* 6. CHÚ MASCOT TOOLIO NINJA BAY TRÊN TRỜI CÙNG CUỘN THƯ & BONG BÓNG THOẠI */}
        <g className="mascot-with-quote" transform="translate(790, 48)">
          {/* A. BONG BÓNG THOẠI CHÂM NGÔN (QUOTE BUBBLE) */}
          <g filter="url(#quote-card-shadow)">
            {/* Thân thẻ bong bóng thoại */}
            <rect
              x="-60"
              y="0"
              width="210"
              height="62"
              rx="14"
              fill="#ffffff"
              stroke="#e2e8f0"
              strokeWidth="1.2"
              className="dark:fill-[#1e293b] dark:stroke-[#334155]"
            />

            {/* Mũi tên chỉ về phía chú ninja */}
            <path
              d="M 150 25 L 165 31 L 150 37 Z"
              fill="#ffffff"
              className="dark:fill-[#1e293b]"
            />

            {/* Chữ châm ngôn thương hiệu */}
            <text
              x="-46"
              y="26"
              fill="#0f172a"
              className="dark:fill-[#f8fafc]"
              fontFamily="Inter, system-ui, sans-serif"
              fontSize="11.5"
              fontWeight="600"
              letterSpacing="-0.01em"
            >
              {currentQuote.line1}
            </text>
            <text
              x="-46"
              y="44"
              fill="#0284c7"
              className="dark:fill-[#38bdf8]"
              fontFamily="Inter, system-ui, sans-serif"
              fontSize="11.5"
              fontWeight="700"
              letterSpacing="-0.01em"
            >
              {currentQuote.line2}
            </text>
          </g>

          {/* B. CHÚ MASCOT NINJA TOOLIO (ĐANG BAY VỚI CUỘN THƯ VÀNG) */}
          <g transform="translate(170, 10)">
            {/* Vệt gió lướt bay */}
            <path d="M-15 15 C-25 12, -35 18, -45 15" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
            <path d="M-12 24 C-22 22, -30 28, -40 26" stroke="#38bdf8" strokeWidth="1.6" strokeLinecap="round" opacity="0.4" />

            {/* Dải khăn ruy-băng đỏ bay phía sau */}
            <path d="M-4 12 Q-16 6, -24 14 Q-14 10, -4 15 Z" fill="#ef4444" />
            <path d="M-4 15 Q-18 16, -26 24 Q-15 17, -4 18 Z" fill="#dc2626" />

            {/* Thân ninja xanh dương bo tròn */}
            <rect x="0" y="16" width="22" height="18" rx="8" fill="#0284c7" />

            {/* Đầu ninja */}
            <circle cx="11" cy="11" r="13" fill="#0284c7" />

            {/* Khung mặt hở tone da ấm */}
            <ellipse cx="15" cy="11" rx="8" ry="6" fill="#fed7aa" />

            {/* Đôi mắt đen to tròn thân thiện */}
            <circle cx="14" cy="10" r="2" fill="#0f172a" />
            <circle cx="19" cy="10" r="2" fill="#0f172a" />
            <circle cx="14.6" cy="9.4" r="0.7" fill="#ffffff" />
            <circle cx="19.6" cy="9.4" r="0.7" fill="#ffffff" />

            {/* Băng trán đỏ ninja */}
            <rect x="-1" y="4" width="24" height="4.5" rx="1.5" fill="#ef4444" />

            {/* Cuộn thư vàng mang trên tay */}
            <g transform="translate(12, 20) rotate(-15)">
              <rect x="0" y="0" width="16" height="7" rx="2" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
              <line x1="8" y1="0" x2="8" y2="7" stroke="#dc2626" strokeWidth="1.5" />
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}
