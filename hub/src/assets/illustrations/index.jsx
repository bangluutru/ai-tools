import React from 'react';

/**
 * Toolio Hub Original Vector Illustration System
 * Strict compliance with Hub Illustration Guide:
 * - 100% vector SVG
 * - Inherits theme colors via currentColor / CSS tokens
 * - Non-intrusive, decorative with aria-hidden="true"
 */

export function ToolboxIllustration({ className = 'w-full h-auto text-primary', ...props }) {
  return (
    <svg viewBox="0 0 160 160" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className={className} {...props}>
      <path d="M60 46 V32 C60 27.6 63.6 24 68 24 H92 C96.4 24 100 27.6 100 32 V46" />
      <path d="M26 46 H134 C138.4 46 142 49.6 142 54 V64 H18 V54 C18 49.6 21.6 46 26 46 Z" />
      <path d="M20 64 H140 V126 C140 131.5 135.5 136 130 136 H30 C24.5 136 20 131.5 20 126 Z" />
      <rect x="70" y="58" width="20" height="18" rx="3" fill="currentColor" fillOpacity="0.12" />
      <circle cx="80" cy="67" r="2.5" fill="currentColor" />
      <rect x="36" y="60" width="12" height="10" rx="2" />
      <rect x="112" y="60" width="12" height="10" rx="2" />
      <line x1="42" y1="92" x2="42" y2="120" strokeOpacity="0.35" />
      <line x1="80" y1="92" x2="80" y2="120" strokeOpacity="0.35" />
      <line x1="118" y1="92" x2="118" y2="120" strokeOpacity="0.35" />
    </svg>
  );
}

export function SakuraIllustration({ className = 'w-full h-auto text-rose-400', ...props }) {
  return (
    <svg viewBox="0 0 160 160" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className={className} {...props}>
      <defs>
        <path id="sakura-petal-cmp" d="M80 72 C74 58, 62 46, 68 34 C72 26, 77 28, 80 33 C83 28, 88 26, 92 34 C98 46, 86 58, 80 72 Z" fill="currentColor" fillOpacity="0.08" />
      </defs>
      <g transform="rotate(0 80 80)"><use href="#sakura-petal-cmp" /></g>
      <g transform="rotate(72 80 80)"><use href="#sakura-petal-cmp" /></g>
      <g transform="rotate(144 80 80)"><use href="#sakura-petal-cmp" /></g>
      <g transform="rotate(216 80 80)"><use href="#sakura-petal-cmp" /></g>
      <g transform="rotate(288 80 80)"><use href="#sakura-petal-cmp" /></g>

      <line x1="80" y1="80" x2="80" y2="60" strokeOpacity="0.45" strokeWidth="1.2" />
      <circle cx="80" cy="58" r="1.5" fill="currentColor" stroke="none" />

      <g transform="rotate(72 80 80)">
        <line x1="80" y1="80" x2="80" y2="60" strokeOpacity="0.45" strokeWidth="1.2" />
        <circle cx="80" cy="58" r="1.5" fill="currentColor" stroke="none" />
      </g>
      <g transform="rotate(144 80 80)">
        <line x1="80" y1="80" x2="80" y2="60" strokeOpacity="0.45" strokeWidth="1.2" />
        <circle cx="80" cy="58" r="1.5" fill="currentColor" stroke="none" />
      </g>
      <g transform="rotate(216 80 80)">
        <line x1="80" y1="80" x2="80" y2="60" strokeOpacity="0.45" strokeWidth="1.2" />
        <circle cx="80" cy="58" r="1.5" fill="currentColor" stroke="none" />
      </g>
      <g transform="rotate(288 80 80)">
        <line x1="80" y1="80" x2="80" y2="60" strokeOpacity="0.45" strokeWidth="1.2" />
        <circle cx="80" cy="58" r="1.5" fill="currentColor" stroke="none" />
      </g>

      <circle cx="80" cy="80" r="7" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="80" cy="80" r="2.5" fill="currentColor" />
    </svg>
  );
}

export function SakuraBranchIllustration({ className = 'w-full h-auto text-rose-300', ...props }) {
  return (
    <svg viewBox="0 0 240 120" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className={className} {...props}>
      <path d="M20 110 C70 85, 105 65, 160 20" strokeWidth="2" />
      <path d="M85 75 C100 60, 115 62, 130 52" strokeWidth="1.4" />
      <path d="M125 45 C145 35, 165 42, 185 36" strokeWidth="1.2" />
      <path d="M148 28 C160 18, 175 16, 192 14" strokeWidth="1.2" />

      <g transform="translate(68, 82) scale(0.24)">
        <circle cx="80" cy="80" r="10" fill="currentColor" fillOpacity="0.2" />
        <path d="M80 70 C75 58, 65 48, 70 38 C73 32, 77 34, 80 38 C83 34, 87 32, 90 38 C95 48, 85 58, 80 70 Z" />
        <path d="M80 70 C75 58, 65 48, 70 38 C73 32, 77 34, 80 38 C83 34, 87 32, 90 38 C95 48, 85 58, 80 70 Z" transform="rotate(72 80 80)" />
        <path d="M80 70 C75 58, 65 48, 70 38 C73 32, 77 34, 80 38 C83 34, 87 32, 90 38 C95 48, 85 58, 80 70 Z" transform="rotate(144 80 80)" />
        <path d="M80 70 C75 58, 65 48, 70 38 C73 32, 77 34, 80 38 C83 34, 87 32, 90 38 C95 48, 85 58, 80 70 Z" transform="rotate(216 80 80)" />
        <path d="M80 70 C75 58, 65 48, 70 38 C73 32, 77 34, 80 38 C83 34, 87 32, 90 38 C95 48, 85 58, 80 70 Z" transform="rotate(288 80 80)" />
      </g>

      <g transform="translate(126, 46) scale(0.28)">
        <circle cx="80" cy="80" r="10" fill="currentColor" fillOpacity="0.2" />
        <path d="M80 70 C75 58, 65 48, 70 38 C73 32, 77 34, 80 38 C83 34, 87 32, 90 38 C95 48, 85 58, 80 70 Z" />
        <path d="M80 70 C75 58, 65 48, 70 38 C73 32, 77 34, 80 38 C83 34, 87 32, 90 38 C95 48, 85 58, 80 70 Z" transform="rotate(72 80 80)" />
        <path d="M80 70 C75 58, 65 48, 70 38 C73 32, 77 34, 80 38 C83 34, 87 32, 90 38 C95 48, 85 58, 80 70 Z" transform="rotate(144 80 80)" />
        <path d="M80 70 C75 58, 65 48, 70 38 C73 32, 77 34, 80 38 C83 34, 87 32, 90 38 C95 48, 85 58, 80 70 Z" transform="rotate(216 80 80)" />
        <path d="M80 70 C75 58, 65 48, 70 38 C73 32, 77 34, 80 38 C83 34, 87 32, 90 38 C95 48, 85 58, 80 70 Z" transform="rotate(288 80 80)" />
      </g>

      <g transform="translate(178, 28) scale(0.22)">
        <circle cx="80" cy="80" r="10" fill="currentColor" fillOpacity="0.2" />
        <path d="M80 70 C75 58, 65 48, 70 38 C73 32, 77 34, 80 38 C83 34, 87 32, 90 38 C95 48, 85 58, 80 70 Z" />
        <path d="M80 70 C75 58, 65 48, 70 38 C73 32, 77 34, 80 38 C83 34, 87 32, 90 38 C95 48, 85 58, 80 70 Z" transform="rotate(72 80 80)" />
        <path d="M80 70 C75 58, 65 48, 70 38 C73 32, 77 34, 80 38 C83 34, 87 32, 90 38 C95 48, 85 58, 80 70 Z" transform="rotate(144 80 80)" />
        <path d="M80 70 C75 58, 65 48, 70 38 C73 32, 77 34, 80 38 C83 34, 87 32, 90 38 C95 48, 85 58, 80 70 Z" transform="rotate(216 80 80)" />
        <path d="M80 70 C75 58, 65 48, 70 38 C73 32, 77 34, 80 38 C83 34, 87 32, 90 38 C95 48, 85 58, 80 70 Z" transform="rotate(288 80 80)" />
      </g>

      <path d="M192 14 C198 11, 203 12, 206 17 C204 21, 199 20, 194 17" fill="currentColor" fillOpacity="0.15" />
      <path d="M156 22 C160 18, 165 19, 168 23 C166 26, 162 26, 158 24" fill="currentColor" fillOpacity="0.15" />
      <path d="M110 65 C113 60, 117 61, 120 64 C118 68, 114 68, 111 66" fill="currentColor" fillOpacity="0.15" />
    </svg>
  );
}

export function FujiIllustration({ className = 'w-full h-auto text-sky-400', ...props }) {
  return (
    <svg viewBox="0 0 240 120" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className={className} {...props}>
      <circle cx="120" cy="52" r="32" strokeWidth="1.2" strokeOpacity="0.25" fill="currentColor" fillOpacity="0.04" />
      <path d="M28 38 C36 34, 48 34, 56 38 C62 42, 68 40, 74 38" strokeWidth="1.2" strokeOpacity="0.35" />
      <path d="M168 32 C176 28, 188 28, 196 32 C202 36, 208 34, 216 33" strokeWidth="1.2" strokeOpacity="0.35" />
      <path d="M25 105 C55 85, 85 50, 120 20 C155 50, 185 85, 215 105 Z" fill="currentColor" fillOpacity="0.08" />
      <path d="M88 50 L105 47 L115 56 L125 47 L139 52 C146 62, 150 68, 153 72 L142 66 L134 74 L120 62 L106 74 L98 66 L87 72 C90 66, 94 60, 99 53 Z" fill="currentColor" fillOpacity="0.22" strokeWidth="1.2" strokeOpacity="0.6" />
      <path d="M14 108 C34 105, 54 111, 74 108 C94 105, 114 111, 134 108 C154 105, 174 111, 194 108 C210 105, 222 108, 230 108" strokeWidth="1.4" strokeOpacity="0.4" />
      <path d="M30 114 C50 112, 70 116, 90 114 C110 112, 130 116, 150 114 C170 112, 190 116, 210 114" strokeWidth="1.1" strokeOpacity="0.25" />
    </svg>
  );
}

export function PagodaIllustration({ className = 'w-full h-auto text-amber-500', ...props }) {
  return (
    <svg viewBox="0 0 160 160" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className={className} {...props}>
      <line x1="80" y1="12" x2="80" y2="38" strokeWidth="2" />
      <circle cx="80" cy="12" r="2.5" fill="currentColor" />
      <circle cx="80" cy="18" r="4.5" strokeWidth="1.2" />
      <circle cx="80" cy="24" r="5" strokeWidth="1.2" />
      <circle cx="80" cy="30" r="5.5" strokeWidth="1.2" />

      <path d="M56 42 Q80 37, 104 42" strokeWidth="2" />
      <path d="M54 41 C55 42, 57 43, 60 43 L100 43 C103 43, 105 42, 106 41" strokeWidth="1.4" fill="currentColor" fillOpacity="0.1" />
      <rect x="71" y="43" width="18" height="12" fill="currentColor" fillOpacity="0.08" />

      <path d="M48 57 Q80 52, 112 57" strokeWidth="2" />
      <path d="M46 56 C48 58, 52 58, 56 58 L104 58 C108 58, 112 58, 114 56" strokeWidth="1.4" fill="currentColor" fillOpacity="0.1" />
      <rect x="68" y="58" width="24" height="13" fill="currentColor" fillOpacity="0.08" />

      <path d="M42 73 Q80 67, 118 73" strokeWidth="2" />
      <path d="M40 72 C42 74, 46 75, 52 75 L108 75 C114 75, 118 74, 120 72" strokeWidth="1.4" fill="currentColor" fillOpacity="0.1" />
      <rect x="66" y="75" width="28" height="14" fill="currentColor" fillOpacity="0.08" />

      <path d="M35 91 Q80 84, 125 91" strokeWidth="2" />
      <path d="M33 90 C36 92, 40 93, 48 93 L112 93 C120 93, 124 92, 127 90" strokeWidth="1.4" fill="currentColor" fillOpacity="0.1" />
      <rect x="64" y="93" width="32" height="15" fill="currentColor" fillOpacity="0.08" />

      <path d="M28 110 Q80 102, 132 110" strokeWidth="2.2" />
      <path d="M26 109 C29 111, 35 112, 44 112 L116 112 C125 112, 131 111, 134 109" strokeWidth="1.6" fill="currentColor" fillOpacity="0.1" />
      <rect x="60" y="112" width="40" height="24" fill="currentColor" fillOpacity="0.08" />
      <line x1="72" y1="112" x2="72" y2="136" strokeWidth="1.4" />
      <line x1="88" y1="112" x2="88" y2="136" strokeWidth="1.4" />
      <path d="M75 136 V122 C75 120, 85 120, 85 122 V136" strokeWidth="1.4" fill="currentColor" fillOpacity="0.15" />

      <path d="M46 136 H114 L120 144 H40 Z" fill="currentColor" fillOpacity="0.18" strokeWidth="1.6" />
    </svg>
  );
}

export function LotusIllustration({ className = 'w-full h-auto text-emerald-500', ...props }) {
  return (
    <svg viewBox="0 0 160 160" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className={className} {...props}>
      <path d="M22 128 C45 120, 65 125, 80 134 C95 125, 115 120, 138 128 C120 140, 100 138, 80 144 C60 138, 40 140, 22 128 Z" fill="currentColor" fillOpacity="0.08" strokeWidth="1.6" />
      <path d="M30 114 C36 94, 52 82, 70 94 C54 106, 42 116, 30 114 Z" fill="currentColor" fillOpacity="0.06" strokeWidth="1.6" />
      <path d="M130 114 C124 94, 108 82, 90 94 C106 106, 118 116, 130 114 Z" fill="currentColor" fillOpacity="0.06" strokeWidth="1.6" />
      <path d="M38 96 C40 68, 60 54, 76 86 C62 98, 48 104, 38 96 Z" fill="currentColor" fillOpacity="0.1" strokeWidth="1.7" />
      <path d="M122 96 C120 68, 100 54, 84 86 C98 98, 112 104, 122 96 Z" fill="currentColor" fillOpacity="0.1" strokeWidth="1.7" />
      <path d="M50 82 C52 46, 68 36, 78 82 C68 88, 56 88, 50 82 Z" fill="currentColor" fillOpacity="0.14" strokeWidth="1.7" />
      <path d="M110 82 C108 46, 92 36, 82 82 C92 88, 104 88, 110 82 Z" fill="currentColor" fillOpacity="0.14" strokeWidth="1.7" />
      <path d="M80 25 C60 48, 63 78, 80 95 C97 78, 100 48, 80 25 Z" fill="currentColor" fillOpacity="0.22" strokeWidth="1.9" />
      <path d="M48 142 C64 139, 96 139, 112 142" strokeWidth="1.4" strokeOpacity="0.4" />
      <path d="M60 148 C72 146, 88 146, 100 148" strokeWidth="1.2" strokeOpacity="0.25" />
    </svg>
  );
}

export function TurtleTowerIllustration({ className = 'w-full h-auto text-emerald-600', ...props }) {
  return (
    <svg viewBox="0 0 240 140" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className={className} {...props}>
      <path d="M15 128 C45 125, 75 131, 105 128 C135 125, 165 131, 195 128 C215 126, 230 128, 235 128" strokeWidth="1.4" strokeOpacity="0.35" />
      <path d="M30 134 C60 132, 90 136, 120 134 C150 132, 180 136, 210 134" strokeWidth="1.1" strokeOpacity="0.25" />
      <path d="M30 124 C60 114, 180 114, 210 124 C190 128, 50 128, 30 124 Z" fill="currentColor" fillOpacity="0.12" strokeWidth="1.6" />
      <rect x="65" y="86" width="110" height="32" rx="2" fill="currentColor" fillOpacity="0.08" />
      <path d="M76 118 V100 A8 8 0 0 1 92 100 V118" fill="currentColor" fillOpacity="0.16" />
      <path d="M112 118 V98 A8 8 0 0 1 128 98 V118" fill="currentColor" fillOpacity="0.2" />
      <path d="M148 118 V100 A8 8 0 0 1 164 100 V118" fill="currentColor" fillOpacity="0.16" />
      <path d="M60 86 Q120 82, 180 86" strokeWidth="2.2" />
      <path d="M58 85 H182" strokeWidth="1.2" />
      <rect x="81" y="60" width="78" height="24" rx="1.5" fill="currentColor" fillOpacity="0.08" />
      <path d="M91 84 V71 A5 5 0 0 1 101 71 V84" fill="currentColor" fillOpacity="0.16" />
      <path d="M115 84 V69 A5 5 0 0 1 125 69 V84" fill="currentColor" fillOpacity="0.18" />
      <path d="M139 84 V71 A5 5 0 0 1 149 71 V84" fill="currentColor" fillOpacity="0.16" />
      <path d="M76 60 Q120 56, 164 60" strokeWidth="2" />
      <path d="M74 59 H166" strokeWidth="1.2" />
      <rect x="99" y="39" width="42" height="18" rx="1" fill="currentColor" fillOpacity="0.08" />
      <circle cx="120" cy="48" r="4.5" fill="currentColor" fillOpacity="0.2" strokeWidth="1.2" />
      <path d="M92 39 Q120 31, 148 39" strokeWidth="2.2" />
      <path d="M90 38 L120 28 L150 38" strokeWidth="1.4" fill="currentColor" fillOpacity="0.15" />
      <line x1="120" y1="28" x2="120" y2="18" strokeWidth="1.8" />
      <circle cx="120" cy="18" r="2.5" fill="currentColor" />
    </svg>
  );
}

export function VietnamLandscapeIllustration({ className = 'w-full h-auto text-emerald-500', ...props }) {
  return (
    <svg viewBox="0 0 240 120" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className={className} {...props}>
      <path d="M15 90 C35 55, 60 50, 85 75 C105 52, 135 48, 155 70 C175 42, 205 45, 230 85" strokeWidth="1.4" strokeOpacity="0.4" fill="currentColor" fillOpacity="0.05" />
      <path d="M5 102 C30 78, 60 72, 90 92 C120 74, 150 82, 185 105" strokeWidth="1.6" strokeOpacity="0.6" fill="currentColor" fillOpacity="0.08" />
      <path d="M185 105 C150 96, 120 106, 80 102 C40 98, 20 108, 0 106" strokeWidth="1.6" />
      <path d="M220 114 C180 106, 140 116, 90 112 C50 108, 20 116, 0 114" strokeWidth="1.2" strokeOpacity="0.4" />
      <path d="M136 94 C140 92, 144 92, 148 94 L152 98 H132 Z" fill="currentColor" fillOpacity="0.2" strokeWidth="1.2" />
      <path d="M140 91 L142 86 L144 91 Z" fill="currentColor" />
      <g transform="translate(38, 92) scale(0.18)">
        <path d="M80 25 C60 48, 63 78, 80 95 C97 78, 100 48, 80 25 Z" fill="currentColor" fillOpacity="0.3" strokeWidth="2" />
        <path d="M50 82 C52 46, 68 36, 78 82 C68 88, 56 88, 50 82 Z" strokeWidth="2" />
        <path d="M110 82 C108 46, 92 36, 82 82 C92 88, 104 88, 110 82 Z" strokeWidth="2" />
        <path d="M22 128 C45 120, 65 125, 80 134 C95 125, 115 120, 138 128" strokeWidth="2" />
      </g>
    </svg>
  );
}
