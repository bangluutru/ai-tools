import React from 'react';

/**
 * Watermarks — Nét vẽ chìm nghệ thuật trang trí góc nền trang con
 * Tinh tế, thanh lịch, 100% non-interactive (pointer-events-none),
 * Không làm che khuất hay ảnh hưởng đến độ tương phản của chữ.
 */

export function ToolsWatermark({ className = 'w-72 h-72 text-sky-500/10 dark:text-sky-400/5', ...props }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {/* Khung viền hộp công cụ lớn */}
      <rect x="30" y="70" width="140" height="95" rx="14" fill="currentColor" fillOpacity="0.04" />
      <path d="M70 70 V45 C70 38 78 30 86 30 H114 C122 30 130 38 130 45 V70" strokeWidth="2.5" />
      <rect x="25" y="65" width="150" height="24" rx="6" fill="currentColor" fillOpacity="0.08" />
      <rect x="85" y="72" width="30" height="18" rx="4" fill="currentColor" fillOpacity="0.15" />
      <circle cx="100" cy="81" r="3" fill="currentColor" />

      {/* Các dụng cụ kỹ thuật đặt chéo sau hộp */}
      {/* Thước kẻ chữ L */}
      <path d="M15 150 H185" strokeDasharray="4 6" opacity="0.4" />
      <path d="M40 180 L160 60" strokeWidth="2" strokeDasharray="6 6" opacity="0.3" />
      <circle cx="160" cy="60" r="12" strokeWidth="1.5" opacity="0.3" />
      <circle cx="160" cy="60" r="5" fill="currentColor" opacity="0.2" />

      {/* Bánh răng cơ khí */}
      <circle cx="50" cy="140" r="16" strokeDasharray="2 4" strokeWidth="2" opacity="0.3" />
      <circle cx="50" cy="140" r="8" opacity="0.2" />
    </svg>
  );
}

export function JapanLifeWatermark({ className = 'w-80 h-80 text-rose-500/10 dark:text-rose-400/5', ...props }) {
  return (
    <svg
      viewBox="0 0 240 240"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {/* Vành mặt trời thái dương mờ */}
      <circle cx="150" cy="90" r="45" strokeWidth="1" strokeDasharray="3 5" opacity="0.3" fill="currentColor" fillOpacity="0.03" />

      {/* Đường đỉnh núi Phú Sĩ */}
      <path d="M20 190 C60 170, 95 110, 130 50 C145 48, 155 48, 170 50 C205 110, 230 170, 240 190" strokeWidth="2" />
      <path d="M110 90 L125 96 L135 88 L145 98 L155 86 L170 102" strokeWidth="1.2" opacity="0.6" />

      {/* Tháp Chùa 5 tầng bên cánh */}
      <g transform="translate(160, 95) scale(0.65)">
        <line x1="50" y1="0" x2="50" y2="25" strokeWidth="2.5" />
        <circle cx="50" cy="0" r="3" fill="currentColor" />

        {/* Mái 1 */}
        <path d="M25 30 Q50 20, 75 30" strokeWidth="2" />
        <rect x="42" y="30" width="16" height="12" fill="currentColor" fillOpacity="0.08" />

        {/* Mái 2 */}
        <path d="M20 48 Q50 36, 80 48" strokeWidth="2" />
        <rect x="40" y="48" width="20" height="13" fill="currentColor" fillOpacity="0.08" />

        {/* Mái 3 */}
        <path d="M15 68 Q50 54, 85 68" strokeWidth="2" />
        <rect x="38" y="68" width="24" height="15" fill="currentColor" fillOpacity="0.08" />

        {/* Mái 4 */}
        <path d="M10 90 Q50 74, 90 90" strokeWidth="2.2" />
        <rect x="35" y="90" width="30" height="18" fill="currentColor" fillOpacity="0.08" />

        {/* Mái 5 */}
        <path d="M5 115 Q50 96, 95 115" strokeWidth="2.5" />
        <rect x="30" y="115" width="40" height="25" fill="currentColor" fillOpacity="0.1" />
      </g>

      {/* Cành hoa đào lượn ngang */}
      <path d="M10 210 C50 185, 90 195, 140 185 C190 175, 220 195, 240 185" strokeWidth="1.6" />
      <circle cx="45" cy="180" r="3" fill="currentColor" fillOpacity="0.4" />
      <circle cx="85" cy="175" r="4" fill="currentColor" fillOpacity="0.4" />
      <circle cx="120" cy="170" r="3.5" fill="currentColor" fillOpacity="0.4" />
    </svg>
  );
}
