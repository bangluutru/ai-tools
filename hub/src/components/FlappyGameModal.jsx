/**
 * @file hub/src/components/FlappyGameModal.jsx
 * ============================================================================
 * Flappy Bird Game Modal — Canvas Engine Modal trong React.
 * Port chính xác từ genki-portal với Relaxed Easy Mode, âm thanh Web Audio,
 * hỗ trợ Retina, chống double flap và điều khiển phím/chạm.
 * ============================================================================
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import {
  FlappyEngine,
  GAME_WIDTH,
  GAME_HEIGHT,
  MAX_DPR,
} from '@ai-tools/core/utils/flappy/flappyEngine.js';
import './FlappyBirdPet.css';

export default function FlappyGameModal({ onClose }) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const containerRef = useRef(null);

  // Init engine once on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    canvas.width = GAME_WIDTH * dpr;
    canvas.height = GAME_HEIGHT * dpr;
    ctx.scale(dpr, dpr);

    const engine = new FlappyEngine(ctx);
    engineRef.current = engine;
    engine.start();
    engine.unlockAudio();

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Lock background scroll while modal is active
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  // Auto focus dialog for immediate keyboard interaction
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  // Global keyboard listener
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        engineRef.current?.unlockAudio();
        engineRef.current?.handleAction();
      }
      if (e.code === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleCanvasInteract = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.unlockAudio();
    engine.handleAction();
  }, []);

  return (
    <div
      className="flappy-game-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        className="flappy-game-container"
        role="dialog"
        aria-modal="true"
        aria-label="Flappy Bird Game"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flappy-game-header">
          <div className="flappy-game-title">
            <span role="img" aria-label="bird">🐤</span>
            <span>FLAPPY BIRD</span>
          </div>
          <button
            type="button"
            className="flappy-game-close"
            onClick={onClose}
            aria-label="Đóng game"
          >
            <X size={16} />
          </button>
        </div>

        {/* Canvas Wrap */}
        <div className="flappy-game-canvas-wrap">
          <canvas
            ref={canvasRef}
            width={GAME_WIDTH}
            height={GAME_HEIGHT}
            onPointerDown={handleCanvasInteract}
            onTouchEnd={() => engineRef.current?.unlockAudio()}
          />
        </div>

        {/* Footer info */}
        <div className="flappy-game-footer">
          <span className="flappy-key-badge">SPACE</span> /
          <span className="flappy-key-badge">CLICK</span> /
          <span className="flappy-key-badge">TAP</span>
          <span style={{ marginLeft: 8 }}>•</span>
          <span className="flappy-key-badge">ESC</span> đóng
        </div>
      </div>
    </div>
  );
}
