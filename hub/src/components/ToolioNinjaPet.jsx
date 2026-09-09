/**
 * @file hub/src/components/ToolioNinjaPet.jsx
 * ============================================================================
 * ToolioNinjaPet — Chú Ninja chibi vector tuần tra nhẹ nhàng dọc theo thanh menu (Navbar).
 * Chuyển động chân bước tự nhiên (natural walking gait), chém thị uy khi chạm rìa màn hình.
 * Sử dụng Direct DOM update để đạt 60fps mượt mà, không kích hoạt re-render React.
 * ============================================================================
 */

import React, { useLayoutEffect, useRef } from 'react';
import { Swords } from 'lucide-react';
import { getNinjaStrings } from '@ai-tools/core/utils/ninja/ninjaI18n.js';
import './ToolioNinjaPet.css';

const WALK_SPEED = 0.45; // Tốc độ bước chân chậm rãi (~27px/s tại 60fps)
const SLASH_DURATION_MS = 600; // Thời gian vung kiếm chém thị uy (0.6s)
const IDLE_DURATION_MS = 700;  // Thời gian đứng thế thủ sau khi chém trước khi quay đầu (0.7s)

export default function ToolioNinjaPet({ onOpenGame, displayLang = 'vi' }) {
  const i18n = getNinjaStrings(displayLang);
  const posRef = useRef({ x: 20 });
  const velRef = useRef(WALK_SPEED);
  const elemRef = useRef(null);
  const svgRef = useRef(null);
  const facingRef = useRef(true);
  const stateRef = useRef('walking'); // 'walking' | 'slashing' | 'idle'
  const stateTimerRef = useRef(0);
  const isHoveredRef = useRef(false);

  useLayoutEffect(() => {
    // Khởi tạo vị trí bắt đầu bên trái thanh menu
    const isMobile = window.innerWidth < 640;
    const minX = isMobile ? 10 : 16;
    posRef.current.x = minX + 24;
    velRef.current = WALK_SPEED;
    facingRef.current = true;
    stateRef.current = 'walking';

    const el = elemRef.current;
    if (el) {
      el.style.left = `${posRef.current.x}px`;
    }
    if (svgRef.current) {
      svgRef.current.style.transform = 'scaleX(1)';
    }

    let rafId = 0;

    function step() {
      const now = performance.now();
      const element = elemRef.current;
      const svg = svgRef.current;

      if (!element) {
        rafId = requestAnimationFrame(step);
        return;
      }

      // Đọc kích thước màn hình theo thời gian thực (responsive)
      const currentWidth = window.innerWidth;
      const petWidth = currentWidth < 640 ? 30 : 36;
      const minX = currentWidth < 640 ? 10 : 16;
      const maxX = Math.max(minX + 60, currentWidth - petWidth - (currentWidth < 640 ? 10 : 18));

      // Nếu đang hover chuột: tạm dừng bước chân để người dùng dễ click
      if (isHoveredRef.current) {
        rafId = requestAnimationFrame(step);
        return;
      }

      // Quản lý các trạng thái chém thị uy & nghỉ chân ở rìa màn hình
      if (stateRef.current === 'slashing') {
        if (now >= stateTimerRef.current) {
          // Hết pha chém thị uy -> chuyển sang pha đứng thủ (idle)
          stateRef.current = 'idle';
          stateTimerRef.current = now + IDLE_DURATION_MS;
          element.classList.remove('slashing');
          element.classList.add('idle');
        }
        rafId = requestAnimationFrame(step);
        return;
      }

      if (stateRef.current === 'idle') {
        if (now >= stateTimerRef.current) {
          // Hết pha đứng thủ -> quay đầu và tiếp tục bước đi
          stateRef.current = 'walking';
          element.classList.remove('idle');

          if (posRef.current.x >= maxX) {
            velRef.current = -WALK_SPEED;
            facingRef.current = false;
            if (svg) svg.style.transform = 'scaleX(-1)';
          } else if (posRef.current.x <= minX) {
            velRef.current = WALK_SPEED;
            facingRef.current = true;
            if (svg) svg.style.transform = 'scaleX(1)';
          }
        }
        rafId = requestAnimationFrame(step);
        return;
      }

      // Trạng thái đang đi bộ (walking)
      posRef.current.x += velRef.current;

      // Chạm rìa phải -> kích hoạt chém thị uy rồi quay đầu
      if (posRef.current.x >= maxX) {
        posRef.current.x = maxX;
        velRef.current = 0;
        stateRef.current = 'slashing';
        stateTimerRef.current = now + SLASH_DURATION_MS;
        element.classList.add('slashing');
      }

      // Chạm rìa trái -> kích hoạt chém thị uy rồi quay đầu
      if (posRef.current.x <= minX) {
        posRef.current.x = minX;
        velRef.current = 0;
        stateRef.current = 'slashing';
        stateTimerRef.current = now + SLASH_DURATION_MS;
        element.classList.add('slashing');
      }

      element.style.left = `${posRef.current.x}px`;
      rafId = requestAnimationFrame(step);
    }

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div
      ref={elemRef}
      className="ninja-pet"
      onClick={onOpenGame}
      onMouseEnter={() => { isHoveredRef.current = true; }}
      onMouseLeave={() => { isHoveredRef.current = false; }}
      title={i18n.pet.title}
      role="button"
      aria-label={i18n.pet.ariaLabel}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          onOpenGame?.();
        }
      }}
    >
      {/* Tooltip khi hover */}
      <div className="ninja-pet-tooltip">
        <Swords size={11} />
        <span>{i18n.pet.tooltip}</span>
      </div>

      <div className="ninja-pet-bob">
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox="0 0 44 48"
          style={{
            transform: 'scaleX(1)',
            transition: 'transform 0.2s ease-out'
          }}
        >
          <defs>
            <linearGradient id="pet-slash-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Dải ruy-băng bay nhẹ nhàng */}
          <g className="ninja-ribbon-tail">
            <path
              d="M 12 16 Q 2 13 -4 18 Q 2 15 12 18 Z"
              fill="#ef4444"
            />
            <path
              d="M 12 18 Q 4 21 -2 26 Q 4 21 12 20 Z"
              fill="#dc2626"
            />
          </g>

          {/* Thân trang phục Ninja xanh */}
          <rect x="14" y="22" width="20" height="16" rx="6" fill="#0284c7" />

          {/* Đầu ninja */}
          <circle cx="24" cy="16" r="12" fill="#0284c7" />

          {/* Khung mặt hở */}
          <ellipse cx="27" cy="16" rx="7" ry="5" fill="#fed7aa" />

          {/* Mắt to tròn thân thiện */}
          <circle cx="26" cy="15" r="1.8" fill="#0f172a" />
          <circle cx="30" cy="15" r="1.8" fill="#0f172a" />
          {/* Đốm sáng mắt */}
          <circle cx="26.5" cy="14.5" r="0.6" fill="#ffffff" />
          <circle cx="30.5" cy="14.5" r="0.6" fill="#ffffff" />

          {/* Băng quấn trán đỏ */}
          <rect x="13" y="10" width="22" height="4" rx="1.5" fill="#ef4444" />

          {/* 1. Thanh kiếm Katana đeo sau lưng (trạng thái bình thường) */}
          <g className="katana-sheathed">
            <line x1="8" y1="32" x2="36" y2="8" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="8" y1="32" x2="14" y2="26" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
          </g>

          {/* 2. Thanh Katana rút ra vung chém (khi chém thị uy) */}
          <g className="katana-slashed">
            <line x1="20" y1="26" x2="42" y2="28" stroke="#f8fafc" strokeWidth="3" strokeLinecap="round" />
            <line x1="14" y1="25" x2="20" y2="26" stroke="#fbbf24" strokeWidth="3.5" strokeLinecap="round" />
          </g>

          {/* 3. Vệt kiếm sáng bán nguyệt chém thị uy */}
          <g className="katana-slash-fx">
            <path
              d="M 28 8 Q 50 24 24 44"
              stroke="url(#pet-slash-grad)"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="44" cy="22" r="2.2" fill="#ffffff" />
            <circle cx="38" cy="34" r="1.6" fill="#38bdf8" />
          </g>

          {/* 4. Đôi chân Ninja bước đi luân phiên tự nhiên */}
          {/* Chân trái (Left Leg) */}
          <g className="ninja-leg leg-left">
            <line x1="18" y1="36" x2="18" y2="40" stroke="#0284c7" strokeWidth="3.5" strokeLinecap="round" />
            <ellipse cx="18" cy="41" rx="4" ry="2.2" fill="#0f172a" />
          </g>

          {/* Chân phải (Right Leg) */}
          <g className="ninja-leg leg-right">
            <line x1="28" y1="36" x2="28" y2="40" stroke="#0284c7" strokeWidth="3.5" strokeLinecap="round" />
            <ellipse cx="28" cy="41" rx="4" ry="2.2" fill="#0f172a" />
          </g>
        </svg>
      </div>
    </div>
  );
}
