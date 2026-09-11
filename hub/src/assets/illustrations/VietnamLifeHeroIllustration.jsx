import React from 'react';

/**
 * VietnamLifeHeroIllustration — Artwork biểu tượng văn hóa Việt Nam
 * Hình ảnh Chùa Một Cột / Khuê Văn Các trên hồ sen ngát hương cùng rặng tre xanh.
 * Gam màu xanh ngọc bích (Emerald / Jade) sang trọng, mang lại cảm xúc thanh lịch, ấm áp.
 */

export default function VietnamLifeHeroIllustration({ size = 160, className = '', ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <defs>
        {/* Nền vầng sáng ngọc bích */}
        <radialGradient id="vn-halo" cx="100" cy="100" r="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#a7f3d0" stopOpacity="0.45" className="dark:stop-color-[#065f46] dark:stop-opacity-35" />
          <stop offset="100%" stopColor="#a7f3d0" stopOpacity="0" />
        </radialGradient>

        {/* Mái chùa ngọc bích */}
        <linearGradient id="vn-roof" x1="60" y1="40" x2="140" y2="85" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>

        {/* Cột trụ đá vững chãi */}
        <linearGradient id="vn-pillar" x1="90" y1="80" x2="110" y2="155" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6ee7b7" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>

        {/* Nước hồ sen */}
        <linearGradient id="vn-water" x1="30" y1="160" x2="170" y2="190" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#047857" stopOpacity="0.3" />
        </linearGradient>
      </defs>

      {/* 1. VẦNG SÁNG HÀO QUANG MỜ */}
      <circle cx="100" cy="95" r="75" fill="url(#vn-halo)" />

      {/* 2. RẶNG TRE XANH HAI BÊN */}
      <g opacity="0.65">
        {/* Khóm tre bên trái */}
        <path d="M35 150 C32 110, 38 80, 48 55" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M42 150 C40 120, 46 95, 56 75" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
        {/* Lá tre trái */}
        <path d="M48 55 C42 50, 30 52, 22 56 C32 58, 40 58, 48 55 Z" fill="#34d399" />
        <path d="M48 55 C54 48, 65 46, 74 48 C64 53, 56 54, 48 55 Z" fill="#10b981" />
        <path d="M52 75 C44 70, 32 72, 26 76 C36 78, 44 77, 52 75 Z" fill="#34d399" />

        {/* Khóm tre bên phải */}
        <path d="M165 150 C168 110, 162 80, 152 55" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M158 150 C160 120, 154 95, 144 75" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
        {/* Lá tre phải */}
        <path d="M152 55 C158 50, 170 52, 178 56 C168 58, 160 58, 152 55 Z" fill="#34d399" />
        <path d="M152 55 C146 48, 135 46, 126 48 C136 53, 144 54, 152 55 Z" fill="#10b981" />
        <path d="M148 75 C156 70, 168 72, 174 76 C164 78, 156 77, 148 75 Z" fill="#34d399" />
      </g>

      {/* 3. KIẾN TRÚC CHÙA MỘT CỘT / KHUÊ VĂN CÁC */}
      <g className="pagoda-architecture">
        {/* Cột trụ đơn vươn lên từ mặt nước */}
        <rect x="91" y="96" width="18" height="58" rx="3" fill="url(#vn-pillar)" />
        {/* Giằng gỗ đỡ đài sen mái chùa */}
        <path d="M78 96 L91 110 L109 110 L122 96 Z" fill="#047857" opacity="0.9" />

        {/* Thân đài chùa */}
        <rect x="74" y="66" width="52" height="30" rx="3" fill="#ecfdf5" className="dark:fill-[#064e3b]" stroke="#059669" strokeWidth="2" />
        {/* Cửa chính có then gỗ */}
        <path d="M92 96 V76 A8 8 0 0 1 108 76 V96 Z" fill="#059669" />
        <line x1="100" y1="76" x2="100" y2="96" stroke="#ecfdf5" strokeWidth="1.2" />

        {/* Mái chùa cong vút (Mái đao truyền thống) */}
        {/* Tầng mái dưới */}
        <path
          d="M54 70 C70 66, 100 64, 100 64 C100 64, 130 66, 146 70 C143 65, 134 60, 114 59 L86 59 C66 60, 57 65, 54 70 Z"
          fill="url(#vn-roof)"
        />
        {/* Tầng mái trên & đầu đao cong */}
        <path
          d="M62 59 C74 54, 100 52, 100 52 C100 52, 126 54, 138 59 C134 52, 124 45, 108 44 L92 44 C76 45, 66 52, 62 59 Z"
          fill="url(#vn-roof)"
        />

        {/* Đỉnh mái (Bầu rượu hồ lô / Mặt trời) */}
        <path d="M100 44 V34" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="100" cy="33" r="3" fill="#f59e0b" />
        <circle cx="100" cy="28" r="1.5" fill="#f59e0b" />
      </g>

      {/* 4. MẶT HỒ SEN & LÁ SEN DẬP DỀNH */}
      <g className="lotus-pond">
        {/* Đường gợn sóng nước hồ */}
        <path d="M30 162 C60 158, 90 164, 120 160 C150 156, 170 162, 175 162" stroke="#6ee7b7" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        <path d="M45 172 C70 168, 100 174, 130 170 C150 167, 160 170, 165 170" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />

        {/* Lá sen lớn bên trái */}
        <ellipse cx="64" cy="164" rx="22" ry="7" fill="#059669" />
        <ellipse cx="64" cy="163" rx="18" ry="5.5" fill="#10b981" />
        <circle cx="64" cy="163" r="1.5" fill="#ecfdf5" />

        {/* Búp sen hồng vươn lên cạnh lá */}
        <path d="M78 163 C79 154, 82 148, 86 142 C90 148, 93 154, 94 163 Z" fill="#fb7185" />
        <path d="M84 163 C85 156, 86 150, 86 142 C86 150, 87 156, 88 163 Z" fill="#fda4af" />
        <line x1="86" y1="163" x2="86" y2="170" stroke="#059669" strokeWidth="2" strokeLinecap="round" />

        {/* Lá sen nhỏ bên phải */}
        <ellipse cx="138" cy="166" rx="20" ry="6" fill="#059669" />
        <ellipse cx="138" cy="165" rx="16" ry="5" fill="#10b981" />

        {/* Bông sen nở rộ bên phải */}
        <g transform="translate(136, 150) scale(0.45)">
          <path d="M0 10 C-15 0, -10 -20, 0 -30 C10 -20, 15 0, 0 10 Z" fill="#f43f5e" />
          <path d="M-8 8 C-20 2, -18 -15, -4 -24 Z" fill="#fb7185" />
          <path d="M8 8 C20 2, 18 -15, 4 -24 Z" fill="#fb7185" />
          <circle cx="0" cy="-5" r="4" fill="#fef08a" />
        </g>
      </g>
    </svg>
  );
}
