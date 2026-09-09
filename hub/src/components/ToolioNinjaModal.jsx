/**
 * @file hub/src/components/ToolioNinjaModal.jsx
 * ============================================================================
 * Toolio Ninja Run — Quick Game Modal.
 * Cho phép chơi tức thì game Toolio Ninja Run ngay trên Dashboard mà không rời trang.
 * Kích thước hiển thị ~1/2 màn hình desktop (16:9), hỗ trợ responsive mobile & phím cảm ứng.
 * ============================================================================
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { X, Swords, ExternalLink, ArrowUp } from 'lucide-react';
import {
  NinjaEngine,
  GAME_WIDTH,
  GAME_HEIGHT,
  MAX_DPR,
} from '@ai-tools/core/utils/ninja/ninjaEngine.js';
import { getNinjaStrings } from '@ai-tools/core/utils/ninja/ninjaI18n.js';
import './ToolioNinjaPet.css';

export default function ToolioNinjaModal({ onClose, displayLang = 'vi' }) {
  const i18n = getNinjaStrings(displayLang);
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const containerRef = useRef(null);

  // Initialize engine on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    canvas.width = GAME_WIDTH * dpr;
    canvas.height = GAME_HEIGHT * dpr;
    ctx.scale(dpr, dpr);

    const engine = new NinjaEngine(ctx);
    engineRef.current = engine;
    window.__toolio_ninja_engine = engine;
    engine.start();
    engine.unlockAudio();

    return () => {
      engine.destroy();
      engineRef.current = null;
      window.__toolio_ninja_engine = null;
    };
  }, []);

  // Sync language changes in real-time
  useEffect(() => {
    engineRef.current?.setLanguage(displayLang);
  }, [displayLang]);

  // Lock background scrolling
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Auto-focus container
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  // Global key listener
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        engineRef.current?.handleJump();
      } else if (e.code === 'KeyX' || e.code === 'KeyJ' || e.code === 'Enter') {
        e.preventDefault();
        engineRef.current?.handleSlash();
      } else if (e.code === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handlePointerDown = useCallback((e) => {
    const engine = engineRef.current;
    if (!engine) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    // Nửa trái = Nhảy, Nửa phải = Chém
    if (clickX < rect.width / 2) {
      engine.handleJump();
    } else {
      engine.handleSlash();
    }
  }, []);

  const handleJumpTouch = useCallback((e) => {
    e.stopPropagation();
    engineRef.current?.handleJump();
  }, []);

  const handleSlashTouch = useCallback((e) => {
    e.stopPropagation();
    engineRef.current?.handleSlash();
  }, []);

  const handleOpenFullscreen = useCallback(() => {
    onClose?.();
    window.location.assign('#/tools/toolio-ninja');
  }, [onClose]);

  return (
    <div
      className="ninja-game-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        className="ninja-game-container"
        role="dialog"
        aria-modal="true"
        aria-label={i18n.meta.gameTitle}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="ninja-game-header">
          <div className="ninja-game-title">
            <Swords size={18} className="text-primary" />
            <span>{i18n.meta.gameTitle}</span>
            <span className="ninja-game-badge">{i18n.meta.badge}</span>
          </div>

          <div className="ninja-game-actions">
            <button
              type="button"
              className="ninja-game-action-btn"
              onClick={handleOpenFullscreen}
              title={i18n.controls.fullscreenTitle}
            >
              <ExternalLink size={13} />
              <span>{i18n.controls.fullscreen}</span>
            </button>
            <button
              type="button"
              className="ninja-game-close"
              onClick={onClose}
              aria-label={i18n.controls.closeAria}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Canvas Wrap (16:9) */}
        <div
          className="ninja-game-canvas-wrap cursor-pointer"
          onPointerDown={handlePointerDown}
        >
          <canvas
            ref={canvasRef}
            width={GAME_WIDTH}
            height={GAME_HEIGHT}
          />

          {/* Nút cảm ứng nhanh trên Mobile / Tablet */}
          <div className="ninja-touch-overlay sm:hidden">
            <button
              type="button"
              className="ninja-touch-btn"
              onPointerDown={handleJumpTouch}
              aria-label={i18n.controls.jump}
            >
              <ArrowUp size={14} />
              <span>{i18n.controls.jump}</span>
            </button>
            <button
              type="button"
              className="ninja-touch-btn"
              onPointerDown={handleSlashTouch}
              aria-label={i18n.controls.slash}
            >
              <Swords size={14} />
              <span>{i18n.controls.slash}</span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="ninja-game-footer">
          <div>
            <span className="ninja-key-badge">{i18n.controls.footerJumpKey}</span> {i18n.controls.footerJumpAction}
            <span style={{ margin: '0 8px' }}>•</span>
            <span className="ninja-key-badge">{i18n.controls.footerSlashKey}</span> {i18n.controls.footerSlashAction}
          </div>
          <div>
            <span className="ninja-key-badge">{i18n.controls.footerCloseKey}</span> {i18n.controls.footerCloseAction}
          </div>
        </div>
      </div>
    </div>
  );
}
