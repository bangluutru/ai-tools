/**
 * @file hub/src/components/FlappyBirdPet.jsx
 * ============================================================================
 * FlappyBirdPet — Animated SVG bird floating gently on the Hub dashboard.
 * Click to open the Flappy Bird game modal.
 * Uses left/top positioning (not transform) to avoid CSS animation conflicts.
 * ============================================================================
 */

import React, { useState, useLayoutEffect, useRef } from 'react';
import './FlappyBirdPet.css';

export default function FlappyBirdPet({ onOpenGame }) {
  const posRef = useRef({ x: 200, y: 200 });
  const velRef = useRef({ vx: 0.5, vy: 0.3 });
  const elemRef = useRef(null);
  const facingRef = useRef(true);
  const [facingRight, setFacingRight] = useState(true);

  useLayoutEffect(() => {
    // Randomize start position
    posRef.current = {
      x: 80 + Math.random() * Math.max(window.innerWidth - 200, 100),
      y: 100 + Math.random() * Math.max(window.innerHeight - 250, 100),
    };
    const speed = 0.3 + Math.random() * 0.3;
    const angle = Math.random() * Math.PI * 2;
    velRef.current = { vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed };
    facingRef.current = velRef.current.vx > 0;
    setFacingRight(facingRef.current);

    // Apply immediate position to avoid rendering initial frame at (0, 0)
    const el = elemRef.current;
    if (el) {
      el.style.left = `${posRef.current.x}px`;
      el.style.top = `${posRef.current.y}px`;
    }

    let rafId = 0;

    function step() {
      const pos = posRef.current;
      const vel = velRef.current;
      const element = elemRef.current;

      if (!element) {
        rafId = requestAnimationFrame(step);
        return;
      }

      const maxX = window.innerWidth - 50;
      const maxY = window.innerHeight - 50;
      const minX = 10;
      const minY = 72; // Below header bar

      // Gentle floating motion
      pos.x += vel.vx;
      pos.y += vel.vy + Math.sin(performance.now() / 1000) * 0.15;

      // Bounce at edges with dampening
      if (pos.x >= maxX) {
        pos.x = maxX;
        vel.vx = -Math.abs(vel.vx);
      }
      if (pos.x <= minX) {
        pos.x = minX;
        vel.vx = Math.abs(vel.vx);
      }
      if (pos.y >= maxY) {
        pos.y = maxY;
        vel.vy = -Math.abs(vel.vy);
      }
      if (pos.y <= minY) {
        pos.y = minY;
        vel.vy = Math.abs(vel.vy);
      }

      // Update facing direction on change only
      const nowFacing = vel.vx > 0;
      if (nowFacing !== facingRef.current) {
        facingRef.current = nowFacing;
        setFacingRight(nowFacing);
      }

      element.style.left = `${pos.x}px`;
      element.style.top = `${pos.y}px`;

      rafId = requestAnimationFrame(step);
    }

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div
      ref={elemRef}
      className="flappy-pet"
      onClick={onOpenGame}
      title="Click để chơi Flappy Bird!"
      role="button"
      aria-label="Chim Flappy Bird — Click để chơi"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          onOpenGame?.();
        }
      }}
    >
      <div className="flappy-pet-bob">
        <svg
          width="40"
          height="30"
          viewBox="0 0 40 30"
          style={{ transform: facingRight ? 'scaleX(1)' : 'scaleX(-1)' }}
        >
          {/* Body */}
          <ellipse cx="20" cy="15" rx="16" ry="12" fill="#F8E048" stroke="#333" strokeWidth="1.5" />
          {/* Eye */}
          <circle cx="28" cy="10" r="5" fill="#FFF" stroke="#333" strokeWidth="1" />
          <circle cx="30" cy="10" r="1.8" fill="#000" />
          {/* Beak */}
          <ellipse cx="33" cy="16" rx="6" ry="3" fill="#E86100" stroke="#333" strokeWidth="1" />
          {/* Wing */}
          <ellipse
            cx="12"
            cy="15"
            rx="8"
            ry="5"
            fill="#FFF"
            stroke="#333"
            strokeWidth="1"
            className="flappy-pet-wing"
          />
        </svg>
      </div>
    </div>
  );
}
