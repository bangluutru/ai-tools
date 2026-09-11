import React from 'react';

/**
 * Domain Icons for Toolio Hub Top-Level Domains
 * High-fidelity, modern, layered vector illustrations:
 * 1. ToolboxIcon: Tools (Common) - Vibrant sky/cyan blue palette
 * 2. SakuraIcon: Japan Life - Delicate cherry blossom pink & rose palette
 * 3. LotusIcon: Vietnam Life - Fresh emerald & jade green palette
 */

export function ToolboxIcon({ size = 48, className = '', ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <defs>
        <linearGradient id="tb-body" x1="12" y1="20" x2="52" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
        <linearGradient id="tb-lid" x1="10" y1="16" x2="54" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id="tb-handle" x1="24" y1="8" x2="40" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#93c5fd" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>

      {/* Quai xách hộp đồ nghề */}
      <path
        d="M24 18V13C24 10.7909 25.7909 9 28 9H36C38.2091 9 40 10.7909 40 13V18"
        stroke="url(#tb-handle)"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Thân hộp dưới */}
      <rect
        x="10"
        y="25"
        width="44"
        height="29"
        rx="6"
        fill="url(#tb-body)"
      />

      {/* Nắp hộp trên */}
      <rect
        x="8"
        y="18"
        width="48"
        height="10"
        rx="3"
        fill="url(#tb-lid)"
      />

      {/* Khóa hộp trung tâm kim loại */}
      <rect x="27" y="24" width="10" height="9" rx="2" fill="#ffffff" />
      <rect x="29" y="26" width="6" height="5" rx="1.5" fill="#0369a1" />
      <circle cx="32" cy="28.5" r="1" fill="#ffffff" />

      {/* Hai chốt kim loại bên */}
      <rect x="15" y="25" width="4" height="6" rx="1" fill="#bae6fd" />
      <rect x="45" y="25" width="4" height="6" rx="1" fill="#bae6fd" />

      {/* Đường gân gia cố thân hộp */}
      <path d="M16 38H48" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 45H48" stroke="#ffffff" strokeOpacity="0.2" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function SakuraIcon({ size = 48, className = '', ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <defs>
        <radialGradient id="sk-center" cx="32" cy="32" r="14" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fda4af" />
          <stop offset="100%" stopColor="#f43f5e" />
        </radialGradient>
        <linearGradient id="sk-petal" x1="0" y1="0" x2="0" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fecdd3" />
          <stop offset="60%" stopColor="#fb7185" />
          <stop offset="100%" stopColor="#f43f5e" />
        </linearGradient>
        {/* 1 cánh hoa anh đào với khía notch đặc trưng ở đỉnh */}
        <path
          id="sakura-single-petal"
          d="M32 30 C29 23, 22 17, 26 10 C28 7, 30.5 7.5, 32 10.5 C33.5 7.5, 36 7, 38 10 C42 17, 35 23, 32 30 Z"
          fill="url(#sk-petal)"
        />
      </defs>

      {/* 5 cánh hoa xếp tròn xoay 72 độ */}
      <g transform="rotate(0 32 32)">
        <use href="#sakura-single-petal" />
      </g>
      <g transform="rotate(72 32 32)">
        <use href="#sakura-single-petal" />
      </g>
      <g transform="rotate(144 32 32)">
        <use href="#sakura-single-petal" />
      </g>
      <g transform="rotate(216 32 32)">
        <use href="#sakura-single-petal" />
      </g>
      <g transform="rotate(288 32 32)">
        <use href="#sakura-single-petal" />
      </g>

      {/* Nhụy hoa trung tâm */}
      <circle cx="32" cy="32" r="6.5" fill="url(#sk-center)" />
      <circle cx="32" cy="32" r="3.5" fill="#f43f5e" />

      {/* Tia nhụy vàng nhạt */}
      <g stroke="#fef08a" strokeWidth="1.2" strokeLinecap="round">
        <line x1="32" y1="32" x2="32" y2="23" />
        <circle cx="32" cy="22" r="1.2" fill="#facc15" stroke="none" />

        <line x1="32" y1="32" x2="40.5" y2="29.5" />
        <circle cx="41.5" cy="29" r="1.2" fill="#facc15" stroke="none" />

        <line x1="32" y1="32" x2="37.5" y2="39" />
        <circle cx="38" cy="40.5" r="1.2" fill="#facc15" stroke="none" />

        <line x1="32" y1="32" x2="26.5" y2="39" />
        <circle cx="26" cy="40.5" r="1.2" fill="#facc15" stroke="none" />

        <line x1="32" y1="32" x2="23.5" y2="29.5" />
        <circle cx="22.5" cy="29" r="1.2" fill="#facc15" stroke="none" />
      </g>
    </svg>
  );
}

export function LotusIcon({ size = 48, className = '', ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <defs>
        <linearGradient id="lt-leaf" x1="12" y1="46" x2="52" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
        <linearGradient id="lt-main" x1="20" y1="12" x2="44" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="lt-side" x1="10" y1="20" x2="32" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6ee7b7" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>

      {/* Lá sen / Sóng nước bên dưới */}
      <path
        d="M10 50 C20 46, 28 47, 32 50 C36 47, 44 46, 54 50 C46 55, 38 54, 32 56 C26 54, 18 55, 10 50 Z"
        fill="url(#lt-leaf)"
        opacity="0.85"
      />

      {/* Cánh hoa tầng ngoài cùng bên trái & phải */}
      <path
        d="M13 44 C16 34, 23 29, 31 36 C24 41, 19 45, 13 44 Z"
        fill="url(#lt-side)"
        opacity="0.75"
      />
      <path
        d="M51 44 C48 34, 41 29, 33 36 C40 41, 45 45, 51 44 Z"
        fill="url(#lt-side)"
        opacity="0.75"
      />

      {/* Cánh hoa tầng giữa bên trái & phải */}
      <path
        d="M18 38 C20 25, 29 20, 32 38 C26 42, 22 42, 18 38 Z"
        fill="url(#lt-side)"
        opacity="0.9"
      />
      <path
        d="M46 38 C44 25, 35 20, 32 38 C38 42, 42 42, 46 38 Z"
        fill="url(#lt-side)"
        opacity="0.9"
      />

      {/* Cánh hoa nở tầng trong */}
      <path
        d="M22 34 C24 18, 30 14, 32 36 C28 39, 25 38, 22 34 Z"
        fill="url(#lt-main)"
      />
      <path
        d="M42 34 C40 18, 34 14, 32 36 C36 39, 39 38, 42 34 Z"
        fill="url(#lt-main)"
      />

      {/* Cánh sen búp trung tâm vươn cao */}
      <path
        d="M32 10 C24 20, 25 33, 32 42 C39 33, 40 20, 32 10 Z"
        fill="url(#lt-main)"
      />

      {/* Điểm nhấn ngọc bích nhụy hoa */}
      <circle cx="32" cy="38" r="2.5" fill="#ecfdf5" opacity="0.9" />
    </svg>
  );
}
