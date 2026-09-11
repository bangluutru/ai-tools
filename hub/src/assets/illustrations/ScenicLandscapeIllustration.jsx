import React from 'react';

/**
 * ScenicLandscapeIllustration — Bức tranh phong cảnh toàn cảnh (Panorama Banner)
 * Thiết kế mảnh mai (chiều cao ~150px, tỷ lệ 1200x160) cân đối 2.5x Navbar:
 * - Cánh trái: Đỉnh Núi Phú Sĩ tuyết phủ mờ ảo, cành hoa anh đào Sakura (Đại diện cho Nhật Bản)
 * - Cánh phải: Chùa Một Cột uy nghiêm vươn trên đài sen cùng rặng tre ngọc bích (Đại diện cho Việt Nam)
 * - Vùng trung tâm: Khoảng không thông thoáng để đặt tiêu đề "Công cụ hữu ích cho cuộc sống"
 * 100% Vector SVG, thích ứng mượt mà cả Light Mode và Dark Mode.
 */

export default function ScenicLandscapeIllustration({
  className = '',
}) {
  return (
    <div className={`w-full h-full relative overflow-hidden select-none pointer-events-none ${className}`}>
      <svg
        viewBox="0 0 1200 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-cover"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          {/* Nền bầu trời chuyển sắc ngang nhẹ nhàng */}
          <linearGradient id="scenic-sky-grad" x1="0" y1="0" x2="1200" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#eff6ff" stopOpacity="0.85" className="dark:stop-color-[#0b1329] dark:stop-opacity-80" />
            <stop offset="30%" stopColor="#f0f9ff" stopOpacity="0.6" className="dark:stop-color-[#0d1c38] dark:stop-opacity-50" />
            <stop offset="70%" stopColor="#ecfdf5" stopOpacity="0.6" className="dark:stop-color-[#06241b] dark:stop-opacity-50" />
            <stop offset="100%" stopColor="#f0fdf4" stopOpacity="0.85" className="dark:stop-color-[#062117] dark:stop-opacity-80" />
          </linearGradient>

          {/* Dải màu Núi Phú Sĩ (Cánh trái) */}
          <linearGradient id="fuji-body-grad" x1="180" y1="30" x2="180" y2="160" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.55" className="dark:stop-color-[#1e3a8a] dark:stop-opacity-65" />
            <stop offset="100%" stopColor="#bfdbfe" stopOpacity="0.1" className="dark:stop-color-[#0f172a] dark:stop-opacity-20" />
          </linearGradient>

          <linearGradient id="fuji-snow-grad" x1="180" y1="20" x2="180" y2="75" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#dbeafe" stopOpacity="0.75" className="dark:stop-color-[#60a5fa] dark:stop-opacity-50" />
          </linearGradient>

          {/* Dải màu Hoa Sakura (Cánh trái) */}
          <linearGradient id="sakura-petal-grad" x1="0" y1="0" x2="0" y2="16" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fecdd3" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>

          {/* Mái Chùa Một Cột (Cánh phải) */}
          <linearGradient id="vn-pagoda-roof" x1="1020" y1="25" x2="1100" y2="75" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          {/* Cột trụ Chùa Một Cột */}
          <linearGradient id="vn-pagoda-pillar" x1="1050" y1="75" x2="1070" y2="160" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6ee7b7" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>

          {/* Vầng sáng phía sau Chùa Một Cột */}
          <radialGradient id="vn-halo-glow" cx="1060" cy="70" r="85" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#a7f3d0" stopOpacity="0.35" className="dark:stop-color-[#065f46] dark:stop-opacity-30" />
            <stop offset="100%" stopColor="#a7f3d0" stopOpacity="0" />
          </radialGradient>

          {/* Bông hoa anh đào */}
          <g id="mini-blossom">
            <path d="M8 7 C5 3, 1 1, 3 -2 C5 -4, 7 -3, 8 -1 C10 -3, 12 -4, 13 -2 C15 1, 11 3, 8 7 Z" fill="url(#sakura-petal-grad)" />
            <path d="M8 7 C5 3, 1 1, 3 -2 C5 -4, 7 -3, 8 -1 C10 -3, 12 -4, 13 -2 C15 1, 11 3, 8 7 Z" fill="url(#sakura-petal-grad)" transform="rotate(72 8 8)" />
            <path d="M8 7 C5 3, 1 1, 3 -2 C5 -4, 7 -3, 8 -1 C10 -3, 12 -4, 13 -2 C15 1, 11 3, 8 7 Z" fill="url(#sakura-petal-grad)" transform="rotate(144 8 8)" />
            <path d="M8 7 C5 3, 1 1, 3 -2 C5 -4, 7 -3, 8 -1 C10 -3, 12 -4, 13 -2 C15 1, 11 3, 8 7 Z" fill="url(#sakura-petal-grad)" transform="rotate(216 8 8)" />
            <path d="M8 7 C5 3, 1 1, 3 -2 C5 -4, 7 -3, 8 -1 C10 -3, 12 -4, 13 -2 C15 1, 11 3, 8 7 Z" fill="url(#sakura-petal-grad)" transform="rotate(288 8 8)" />
            <circle cx="8" cy="8" r="2" fill="#fef08a" />
          </g>

          {/* Cánh hoa bay */}
          <path
            id="mini-petal"
            d="M4 0 C1 3, 0 5, 3 8 C5 7, 6 4, 4 0 Z"
            fill="url(#sakura-petal-grad)"
            opacity="0.8"
          />
        </defs>

        {/* 1. NỀN BẦU TRỜI CHUYỂN SẮC */}
        <rect width="1200" height="160" fill="url(#scenic-sky-grad)" />

        {/* ================================================================= */}
        {/* CÁNH TRÁI: NÚI PHÚ SĨ & HOA ANH ĐÀO SAKURA (BIỂU TƯỢNG NHẬT BẢN) */}
        {/* ================================================================= */}

        {/* Thân núi Phú Sĩ */}
        <path
          d="M 180 28 L 220 54 L 320 160 L 40 160 L 140 54 Z"
          fill="url(#fuji-body-grad)"
        />

        {/* Vệt bóng đổ dốc núi bên phải */}
        <path
          d="M 180 28 L 220 54 L 320 160 L 180 160 Z"
          fill="#60a5fa"
          opacity="0.15"
          className="dark:fill-[#1e40af] dark:opacity-25"
        />

        {/* Vành tuyết phủ đỉnh Phú Sĩ */}
        <path
          d="M 180 28 L 220 54 C 210 65, 205 60, 195 72 C 188 64, 182 68, 175 74 C 168 62, 160 66, 152 70 C 146 60, 142 64, 140 54 Z"
          fill="url(#fuji-snow-grad)"
        />

        {/* Cụm mây trắng lơ lửng chân núi */}
        <g fill="#ffffff" opacity="0.6" className="dark:fill-[#38bdf8] dark:opacity-15">
          <path d="M 20 135 C 30 120, 60 120, 75 135 C 90 118, 120 118, 135 135 C 150 135, 160 148, 150 160 L 20 160 Z" />
          <path d="M 230 140 C 245 130, 275 130, 290 140 C 305 125, 335 125, 350 140 C 365 140, 375 152, 365 160 L 230 160 Z" />
        </g>

        {/* Cành hoa anh đào Sakura vươn từ góc trên bên trái */}
        <g className="sakura-branch-group">
          {/* Nhánh cây nâu thanh mảnh */}
          <path
            d="M -10 15 C 40 10, 80 25, 120 18 C 150 12, 180 28, 210 22"
            stroke="#78350f"
            strokeWidth="3.2"
            strokeLinecap="round"
            className="dark:stroke-[#451a03]"
          />
          <path
            d="M 75 24 C 95 38, 115 36, 135 48"
            stroke="#78350f"
            strokeWidth="2"
            strokeLinecap="round"
            className="dark:stroke-[#451a03]"
          />
          <path
            d="M 140 16 C 160 8, 185 10, 200 4"
            stroke="#78350f"
            strokeWidth="1.8"
            strokeLinecap="round"
            className="dark:stroke-[#451a03]"
          />

          {/* Các chùm hoa anh đào tươi thắm */}
          <use href="#mini-blossom" x="40" y="8" transform="scale(1.2)" />
          <use href="#mini-blossom" x="90" y="24" transform="scale(1.1)" />
          <use href="#mini-blossom" x="125" y="10" transform="scale(1.3)" />
          <use href="#mini-blossom" x="175" y="16" transform="scale(1.05)" />
          <use href="#mini-blossom" x="205" y="18" transform="scale(0.9)" />
          <use href="#mini-blossom" x="130" y="44" transform="scale(0.95)" />

          {/* Cánh hoa Sakura bay lơ lửng */}
          <use href="#mini-petal" x="160" y="48" transform="rotate(25 160 48)" />
          <use href="#mini-petal" x="235" y="42" transform="rotate(-15 235 42)" />
          <use href="#mini-petal" x="270" y="75" transform="rotate(40 270 75)" opacity="0.65" />
          <use href="#mini-petal" x="320" y="105" transform="rotate(-30 320 105)" opacity="0.5" />
        </g>

        {/* ================================================================= */}
        {/* CÁNH PHẢI: CHÙA MỘT CỘT & RẶNG TRE NGỌC BÍCH (BIỂU TƯỢNG VIỆT NAM) */}
        {/* ================================================================= */}
        <g className="vietnam-one-pillar-pagoda-group" transform="translate(940, 10)">
          {/* Vầng hào quang ngọc bích sau chùa */}
          <circle cx="120" cy="70" r="70" fill="url(#vn-halo-glow)" />

          {/* Rặng tre xanh bên phải */}
          <g opacity="0.65">
            <path d="M 200 150 C 205 110, 198 75, 185 45" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M 215 150 C 218 120, 212 95, 200 70" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" />
            {/* Cụm lá tre */}
            <path d="M 185 45 C 192 38, 206 40, 215 45 C 203 48, 195 48, 185 45 Z" fill="#34d399" />
            <path d="M 185 45 C 178 37, 166 35, 156 37 C 168 42, 176 43, 185 45 Z" fill="#10b981" />
            <path d="M 190 68 C 198 62, 210 65, 216 70 C 205 72, 198 71, 190 68 Z" fill="#34d399" />
          </g>

          {/* Kiến trúc Chùa Một Cột (Liên Hoa Đài) */}
          {/* Cột trụ đá đơn vươn lên từ mặt nước */}
          <rect x="111" y="76" width="18" height="66" rx="3" fill="url(#vn-pagoda-pillar)" />

          {/* Giằng gỗ trợ lực đỡ đài sen */}
          <path d="M 98 76 L 111 90 L 129 90 L 142 76 Z" fill="#047857" opacity="0.9" />

          {/* Thân đài chùa */}
          <rect
            x="94"
            y="48"
            width="52"
            height="28"
            rx="2.5"
            fill="#ecfdf5"
            className="dark:fill-[#064e3b]"
            stroke="#059669"
            strokeWidth="1.8"
          />

          {/* Cửa vòm then gỗ */}
          <path d="M 112 76 V 58 A 8 8 0 0 1 128 58 V 76 Z" fill="#059669" />
          <line x1="120" y1="58" x2="120" y2="76" stroke="#ecfdf5" strokeWidth="1.2" />

          {/* Tầng mái đao cong vút dưới */}
          <path
            d="M 74 52 C 90 48, 120 46, 120 46 C 120 46, 150 48, 166 52 C 163 47, 154 42, 134 41 L 106 41 C 86 42, 77 47, 74 52 Z"
            fill="url(#vn-pagoda-roof)"
          />

          {/* Tầng mái đao cong vút trên */}
          <path
            d="M 82 41 C 94 36, 120 34, 120 34 C 120 34, 146 36, 158 41 C 154 34, 144 27, 128 26 L 112 26 C 96 27, 86 34, 82 41 Z"
            fill="url(#vn-pagoda-roof)"
          />

          {/* Đỉnh mái hồ lô / mặt trời */}
          <line x1="120" y1="26" x2="120" y2="16" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="120" cy="15" r="2.8" fill="#f59e0b" />
          <circle cx="120" cy="11" r="1.5" fill="#f59e0b" />

          {/* Đầm sen dưới chân chùa */}
          <g className="lotus-pond-elements">
            {/* Làn sóng nước xanh ngọc */}
            <path d="M 50 144 C 80 140, 110 146, 140 142 C 170 138, 210 144, 230 144" stroke="#6ee7b7" strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />
            <path d="M 70 152 C 100 148, 130 154, 160 150 C 190 147, 210 152, 220 152" stroke="#34d399" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />

            {/* Lá sen lớn bên trái trụ */}
            <ellipse cx="85" cy="145" rx="20" ry="6" fill="#059669" />
            <ellipse cx="85" cy="144" rx="16" ry="4.5" fill="#10b981" />

            {/* Búp sen hồng vươn lên */}
            <path d="M 100 144 C 101 136, 103 130, 107 125 C 111 130, 113 136, 114 144 Z" fill="#fb7185" />
            <path d="M 105 144 C 106 138, 107 132, 107 125 C 107 132, 108 138, 109 144 Z" fill="#fda4af" />

            {/* Bông hoa sen nở rộ bên phải */}
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
