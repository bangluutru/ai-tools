/**
 * @file packages/core/src/components/FlappyBirdView.jsx
 * ============================================================================
 * Flappy Bird Arcade Studio View — Standard MAIS Compliant View
 * Cho phép chơi trực tiếp Flappy Bird trên trang miniapp của Hub (#flappy-bird).
 * ============================================================================
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX, RotateCcw, Trophy, Award, Sparkles, Gamepad2 } from 'lucide-react';
import {
  FlappyEngine,
  GAME_WIDTH,
  GAME_HEIGHT,
  MAX_DPR,
  STATE,
} from '../utils/flappy/flappyEngine.js';

const i18n = {
  vi: {
    title: 'Flappy Bird Arcade',
    subtitle: 'Minigame kinh điển — chạm hoặc nhấn phím Space để giữ thăng bằng và vượt chướng ngại vật!',
    soundOn: 'Bật âm thanh',
    soundOff: 'Tắt âm thanh',
    currentScore: 'Điểm hiện tại',
    bestScore: 'Điểm cao nhất',
    controlsTitle: 'Hướng dẫn điều khiển',
    controlSpace: 'Nhảy / Bay lên',
    controlRestart: 'Chơi lại khi va chạm',
    medalsTitle: 'Bảng huy chương danh dự',
    bronze: 'Đồng: 5+ điểm',
    silver: 'Bạc: 10+ điểm',
    gold: 'Vàng: 20+ điểm',
    platinum: 'Bạch kim: 40+ điểm',
    playAgain: 'Chơi Lại',
    statusReady: 'Sẵn sàng! Nhấn Space hoặc Chạm để bắt đầu bay',
    statusPlaying: 'Đang bay... Cố gắng vượt qua các đường ống!',
    statusGameOver: 'Game Over! Bấm Chơi lại hoặc Space để thử lại',
  },
  en: {
    title: 'Flappy Bird Arcade',
    subtitle: 'Classic arcade minigame — click or press Space to flap and navigate through pipes!',
    soundOn: 'Sound On',
    soundOff: 'Sound Off',
    currentScore: 'Current Score',
    bestScore: 'High Score',
    controlsTitle: 'Controls Guide',
    controlSpace: 'Flap / Fly up',
    controlRestart: 'Restart on collision',
    medalsTitle: 'Honor Medals',
    bronze: 'Bronze: 5+ pts',
    silver: 'Silver: 10+ pts',
    gold: 'Gold: 20+ pts',
    platinum: 'Platinum: 40+ pts',
    playAgain: 'Play Again',
    statusReady: 'Ready! Tap or press Space to fly',
    statusPlaying: 'Flying... Avoid the pipes!',
    statusGameOver: 'Game Over! Press Space or Tap to try again',
  },
  ja: {
    title: 'フラッピーバード アーケード',
    subtitle: 'クラシックミニゲーム — タップまたはSpaceキーで羽ばたいて土管を通り抜けよう！',
    soundOn: 'サウンド ON',
    soundOff: 'サウンド OFF',
    currentScore: '現在のスコア',
    bestScore: 'ハイスコア',
    controlsTitle: '操作ガイド',
    controlSpace: '羽ばたく / 上昇',
    controlRestart: '衝突時の再挑戦',
    medalsTitle: 'メダル一覧',
    bronze: 'ブロンズ: 5点以上',
    silver: 'シルバー: 10点以上',
    gold: 'ゴールド: 20点以上',
    platinum: 'プラチナ: 40点以上',
    playAgain: 'もう一度プレイ',
    statusReady: '準備完了！Spaceまたはタップで開始',
    statusPlaying: 'プレイ中... 土管を回避してください！',
    statusGameOver: 'ゲームオーバー！Spaceまたはタップで再挑戦',
  },
};

export default function FlappyBirdView({ displayLang = 'vi' }) {
  const t = i18n[displayLang] || i18n.vi;
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const containerRef = useRef(null);

  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [gameState, setGameState] = useState(STATE.GET_READY);
  const [isSoundOn, setIsSoundOn] = useState(true);

  // Init Game Engine
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
    engine.onScoreChange = (newScore) => {
      setScore(newScore);
      setBestScore(engine.bestScore);
    };
    engine.onStateChange = (state) => {
      setGameState(state);
      setBestScore(engine.bestScore);
    };

    engineRef.current = engine;
    setBestScore(engine.bestScore);
    engine.start();

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Keyboard controls
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        engineRef.current?.unlockAudio();
        engineRef.current?.handleAction();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleInteract = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.unlockAudio();
    engine.handleAction();
  }, []);

  const toggleSound = () => {
    const engine = engineRef.current;
    if (!engine) return;
    const nextState = !isSoundOn;
    engine.isSoundOn = nextState;
    setIsSoundOn(nextState);
    if (nextState) engine.unlockAudio();
  };

  const handleRestart = () => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.unlockAudio();
    engine.handleAction();
  };

  return (
    <div ref={containerRef} className="max-w-[1240px] mx-auto w-full space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-surface-container border border-border-subtle shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary border border-primary/20 shadow-sm">
            <Gamepad2 size={24} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
              <span>{t.title}</span>
              <span className="px-2 py-0.5 rounded-full bg-secondary/15 text-secondary text-[10px] font-bold tracking-wider uppercase border border-secondary/20">
                Relaxed Easy
              </span>
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">{t.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={toggleSound}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              isSoundOn
                ? 'bg-secondary/15 text-secondary border-secondary/30 hover:bg-secondary/25'
                : 'bg-surface-subtle text-outline border-border-subtle hover:text-on-surface'
            }`}
            aria-label={isSoundOn ? t.soundOff : t.soundOn}
            title={isSoundOn ? t.soundOff : t.soundOn}
          >
            {isSoundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>{isSoundOn ? 'Sound ON' : 'Sound OFF'}</span>
          </button>

          {gameState === STATE.GAME_OVER && (
            <button
              type="button"
              onClick={handleRestart}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-sm hover:opacity-90 transition-opacity"
            >
              <RotateCcw size={14} />
              <span>{t.playAgain}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Arcade Layout: Canvas Center + Sidebar Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Center: Arcade Canvas Frame */}
        <div className="lg:col-span-8 flex flex-col items-center">
          <div className="w-full max-w-[380px] p-2.5 rounded-3xl bg-surface-container border border-border-subtle shadow-xl flex flex-col items-center">
            {/* Status bar */}
            <div className="w-full px-3 py-1.5 mb-2 rounded-xl bg-surface-subtle border border-border-subtle flex items-center justify-between text-[11px] font-mono">
              <span className="text-on-surface-variant truncate">
                {gameState === STATE.GET_READY && t.statusReady}
                {gameState === STATE.PLAYING && t.statusPlaying}
                {gameState === STATE.GAME_OVER && t.statusGameOver}
              </span>
              <span className="flex items-center gap-1 text-primary font-bold shrink-0">
                <Sparkles size={12} /> 60fps
              </span>
            </div>

            {/* Canvas Viewport */}
            <div
              className="relative w-full aspect-[360/540] rounded-2xl overflow-hidden border border-border-subtle shadow-inner cursor-pointer select-none"
              style={{ background: '#DED895' }}
              onPointerDown={handleInteract}
              onTouchEnd={() => engineRef.current?.unlockAudio()}
            >
              <canvas
                ref={canvasRef}
                width={GAME_WIDTH}
                height={GAME_HEIGHT}
                className="w-full h-full block object-contain object-top"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>

            {/* In-tool footer hint */}
            <div className="w-full mt-2.5 px-3 py-2 rounded-xl bg-surface-subtle border border-border-subtle flex items-center justify-center gap-2 text-[11px] text-outline font-mono">
              <span className="px-1.5 py-0.5 rounded bg-surface-container border border-border-subtle text-primary font-bold">
                SPACE
              </span>
              <span>/</span>
              <span className="px-1.5 py-0.5 rounded bg-surface-container border border-border-subtle text-primary font-bold">
                CLICK
              </span>
              <span>/</span>
              <span className="px-1.5 py-0.5 rounded bg-surface-container border border-border-subtle text-primary font-bold">
                TAP
              </span>
            </div>
          </div>
        </div>

        {/* Right: Scoreboards & Stats Sidebar */}
        <div className="lg:col-span-4 space-y-4 w-full">
          {/* Realtime Scorecard */}
          <div className="p-4 rounded-2xl bg-surface-container border border-border-subtle shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-outline flex items-center gap-1.5">
              <Trophy size={15} className="text-amber-500" />
              <span>Bảng Điểm Kỷ Lục</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-surface-subtle border border-border-subtle flex flex-col items-center">
                <span className="text-[11px] text-outline">{t.currentScore}</span>
                <span className="text-2xl sm:text-3xl font-mono font-bold text-primary mt-1">
                  {score}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-surface-subtle border border-border-subtle flex flex-col items-center">
                <span className="text-[11px] text-outline">{t.bestScore}</span>
                <span className="text-2xl sm:text-3xl font-mono font-bold text-amber-500 mt-1">
                  {bestScore}
                </span>
              </div>
            </div>
          </div>

          {/* Controls Information */}
          <div className="p-4 rounded-2xl bg-surface-container border border-border-subtle shadow-sm space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-outline">
              {t.controlsTitle}
            </h3>
            <ul className="space-y-2 text-xs text-on-surface-variant">
              <li className="flex items-center justify-between">
                <span>{t.controlSpace}</span>
                <kbd className="px-2 py-0.5 rounded bg-surface-subtle border border-border-subtle font-mono text-[11px] text-on-surface font-semibold">
                  Space / ↑
                </kbd>
              </li>
              <li className="flex items-center justify-between">
                <span>{t.controlRestart}</span>
                <kbd className="px-2 py-0.5 rounded bg-surface-subtle border border-border-subtle font-mono text-[11px] text-on-surface font-semibold">
                  Click / Space
                </kbd>
              </li>
            </ul>
          </div>

          {/* Medal Showcase */}
          <div className="p-4 rounded-2xl bg-surface-container border border-border-subtle shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-outline flex items-center gap-1.5">
              <Award size={15} className="text-primary" />
              <span>{t.medalsTitle}</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-surface-subtle border border-border-subtle/70">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#CD7F32] shadow-sm shrink-0" />
                  <span className="font-semibold text-on-surface">{t.bronze}</span>
                </div>
                <span className="text-[10px] font-mono text-outline">5+ pts</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-surface-subtle border border-border-subtle/70">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#C0C0C0] shadow-sm shrink-0" />
                  <span className="font-semibold text-on-surface">{t.silver}</span>
                </div>
                <span className="text-[10px] font-mono text-outline">10+ pts</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-surface-subtle border border-border-subtle/70">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#FFD700] shadow-sm shrink-0" />
                  <span className="font-semibold text-on-surface">{t.gold}</span>
                </div>
                <span className="text-[10px] font-mono text-outline">20+ pts</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-surface-subtle border border-border-subtle/70">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#E5E4E2] shadow-sm shrink-0" />
                  <span className="font-semibold text-on-surface">{t.platinum}</span>
                </div>
                <span className="text-[10px] font-mono text-outline">40+ pts</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
