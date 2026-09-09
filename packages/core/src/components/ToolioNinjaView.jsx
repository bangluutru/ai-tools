/**
 * @file packages/core/src/components/ToolioNinjaView.jsx
 * ============================================================================
 * Toolio Ninja Run Arcade View — Standard MAIS Compliant View.
 * Cho phép chơi trực tiếp mini-game tại route #toolio-ninja trong Hub.
 * ============================================================================
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Trophy,
  Award,
  Sparkles,
  Swords,
  ArrowUp,
  ExternalLink,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import {
  NinjaEngine,
  GAME_WIDTH,
  GAME_HEIGHT,
  MAX_DPR,
  GAME_STATE,
  TOOLIO_PROBLEM_TYPES,
} from '../utils/ninja/ninjaEngine.js';

const i18n = {
  vi: {
    title: 'Toolio Ninja Run',
    subtitle: 'Endless runner vui nhộn: cùng Ninja chạy xuyên Nhật - Việt và chém tan mọi vấn đề văn phòng!',
    soundOn: 'Bật âm thanh',
    soundOff: 'Tắt âm thanh',
    distance: 'Cự ly chạy',
    problemsSolved: 'Vấn đề đã giải',
    bestScore: 'Kỷ lục điểm',
    currentScore: 'Điểm hiện tại',
    controlsTitle: 'Hướng dẫn điều khiển',
    controlJump: 'Nhảy qua chướng ngại vật / Gai',
    controlSlash: 'Chém tan các quái vật văn phòng',
    controlRestart: 'Chơi lại khi va chạm',
    medalsTitle: 'Danh hiệu Ninja',
    medalsBronze: 'Tập sự: 200m / 5 vấn đề',
    medalsSilver: 'Chiến binh: 500m / 15 vấn đề',
    medalsGold: 'Huyền thoại: 1,000m / 30 vấn đề',
    medalsMaster: 'Đại tông sư: 2,000m / 50 vấn đề',
    playAgain: 'Chơi Lại',
    exploreToolio: 'Khám Phá Toolio',
    gameOverTitle: 'Màn Chạy Kết Thúc!',
    solvedPraise: 'Bạn đã giải quyết thành công',
    problemsUnit: 'vấn đề!',
    toolioTagline: 'Toolio có thể giải quyết các bài toán thực tế ngoài đời trong nháy mắt.',
    toolsTitle: 'Công cụ Toolio tương ứng',
  },
  en: {
    title: 'Toolio Ninja Run',
    subtitle: 'Fun endless runner: run across Japan & Vietnam and slash away office file problems!',
    soundOn: 'Sound On',
    soundOff: 'Sound Off',
    distance: 'Distance',
    problemsSolved: 'Problems Solved',
    bestScore: 'High Score',
    currentScore: 'Current Score',
    controlsTitle: 'Controls Guide',
    controlJump: 'Jump over spikes & hazards',
    controlSlash: 'Slash office file monsters',
    controlRestart: 'Restart on collision',
    medalsTitle: 'Ninja Badges',
    medalsBronze: 'Apprentice: 200m / 5 problems',
    medalsSilver: 'Warrior: 500m / 15 problems',
    medalsGold: 'Legend: 1,000m / 30 problems',
    medalsMaster: 'Grandmaster: 2,000m / 50 problems',
    playAgain: 'Play Again',
    exploreToolio: 'Explore Toolio',
    gameOverTitle: 'Run Complete!',
    solvedPraise: 'You successfully solved',
    problemsUnit: 'problems!',
    toolioTagline: 'Toolio can solve the real ones in seconds too.',
    toolsTitle: 'Corresponding Toolio Apps',
  },
  ja: {
    title: 'ツーリオ・ニンジャ ラン',
    subtitle: '爽快エンドレスランナー：日本とベトナムを駆け抜け、オフィスの課題を一刀両断！',
    soundOn: 'サウンド ON',
    soundOff: 'サウンド OFF',
    distance: '走行距離',
    problemsSolved: '解決した課題',
    bestScore: '最高スコア',
    currentScore: '現在のスコア',
    controlsTitle: '操作ガイド',
    controlJump: 'ジャンプ（トゲ・障害物回避）',
    controlSlash: '刀で課題モンスターを斬る',
    controlRestart: '衝突時の再挑戦',
    medalsTitle: '忍者メダル',
    medalsBronze: '見習い: 200m / 5課題',
    medalsSilver: '達人: 500m / 15課題',
    medalsGold: '伝説: 1,000m / 30課題',
    medalsMaster: '免許皆伝: 2,000m / 50課題',
    playAgain: 'もう一度プレイ',
    exploreToolio: 'Toolioを使う',
    gameOverTitle: 'ゲーム終了！',
    solvedPraise: '解決した課題数：',
    problemsUnit: '件！',
    toolioTagline: 'Toolioは実際の業務課題も一瞬で解決します。',
    toolsTitle: '対応するToolioアプリ',
  },
};

const TOOL_NAMES = {
  'pdf-toolkit': { vn: 'Công Cụ PDF Đa Năng', en: 'PDF Multi-Tool', ja: '万能PDFツール' },
  'id-photo-studio': { vn: 'Tạo Ảnh Thẻ & Hộ Chiếu', en: 'ID & Passport Photo', ja: '証明写真スタジオ' },
  'business-card-studio': { vn: 'Tạo Danh Thiếp', en: 'Business Card Maker', ja: '名刺作成' },
  'invoice-studio': { vn: 'Tạo Đề Nghị Thanh Toán', en: 'Payment Request Maker', ja: '支払依頼書作成' },
  'image-convert': { vn: 'Nén Ảnh Đa Năng', en: 'Image Compressor', ja: '画像圧縮・変換' },
  'barcode-qr': { vn: 'Tạo Mã QR & Barcode', en: 'QR & Barcode Generator', ja: 'QRコード生成' },
  'watermark-studio': { vn: 'Đóng Dấu Tài Liệu', en: 'Document Watermark', ja: '文書透かし・押印' },
  'excel-mapping': { vn: 'Mapping Excel', en: 'Excel Data Mapping', ja: 'Excelマッピング' },
  'tax-calculator': { vn: 'Tính Thuế TNCN', en: 'Tax Calculator', ja: '個人所得税計算' },
};

export default function ToolioNinjaView({ displayLang = 'vi' }) {
  const t = i18n[displayLang] || i18n.vi;
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const containerRef = useRef(null);

  const [metrics, setMetrics] = useState({
    distance: 0,
    problemsSolved: 0,
    score: 0,
    combo: 0,
    bestScore: 0,
  });
  const [gameState, setGameState] = useState(GAME_STATE.READY);
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [gameOverData, setGameOverData] = useState(null);

  // Initialize Game Engine
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
    setIsSoundOn(engine.isSoundEnabled());

    engine.onScoreChange = (m) => {
      setMetrics((prev) => ({ ...prev, ...m }));
    };

    engine.onStateChange = (st) => {
      setGameState(st);
      if (st === GAME_STATE.PLAYING) setGameOverData(null);
    };

    engine.onGameOver = (data) => {
      setGameOverData(data);
    };

    engineRef.current = engine;
    engine.start();

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Keyboard controls listener
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        engineRef.current?.handleJump();
      } else if (e.code === 'KeyX' || e.code === 'KeyJ') {
        e.preventDefault();
        engineRef.current?.handleSlash();
      } else if (e.code === 'KeyR' && gameState === GAME_STATE.GAME_OVER) {
        e.preventDefault();
        engineRef.current?.reset();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        if (engineRef.current) {
          const nextState = engineRef.current.toggleSound();
          setIsSoundOn(nextState);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gameState]);

  const handleJump = useCallback(() => {
    engineRef.current?.handleJump();
  }, []);

  const handleSlash = useCallback(() => {
    engineRef.current?.handleSlash();
  }, []);

  const toggleSound = () => {
    const engine = engineRef.current;
    if (!engine) return;
    const nextState = engine.toggleSound();
    setIsSoundOn(nextState);
  };

  const handleRestart = () => {
    engineRef.current?.reset();
  };

  const handleNavigateTool = (toolId) => {
    window.location.assign(`#${toolId}`);
  };

  return (
    <div ref={containerRef} className="max-w-[1240px] mx-auto w-full space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-surface-container border border-border-subtle shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary border border-primary/20 shadow-sm">
            <Swords size={24} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
              <span>{t.title}</span>
              <span className="px-2 py-0.5 rounded-full bg-secondary/15 text-secondary text-[10px] font-bold tracking-wider uppercase border border-secondary/20">
                Action Arcade
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

          {gameState === GAME_STATE.GAME_OVER && (
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

      {/* Main Layout: Canvas Left + Stats Sidebar Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Arcade Canvas & Mobile Controls */}
        <div className="lg:col-span-8 flex flex-col items-center">
          <div className="w-full p-2 sm:p-3 rounded-3xl bg-surface-container border border-border-subtle shadow-xl flex flex-col items-center">
            {/* Realtime Bar */}
            <div className="w-full px-3 py-2 mb-2 rounded-xl bg-surface-subtle border border-border-subtle flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-3">
                <span className="text-primary font-bold">{metrics.distance} m</span>
                <span className="text-outline">•</span>
                <span className="text-amber-700 dark:text-amber-300 font-bold">✓ {metrics.problemsSolved} Solved</span>
                {metrics.combo >= 2 && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold flex items-center gap-1 text-[11px]">
                    <Flame size={12} /> {metrics.combo}x COMBO
                  </span>
                )}
              </div>
              <span className="flex items-center gap-1 text-outline text-[11px]">
                <Sparkles size={12} className="text-primary" /> 60fps
              </span>
            </div>

            {/* Canvas Viewport (16:9 Aspect Ratio) */}
            <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border border-border-subtle shadow-inner select-none bg-slate-900">
              <canvas
                ref={canvasRef}
                width={GAME_WIDTH}
                height={GAME_HEIGHT}
                className="w-full h-full block object-contain"
              />

              {/* Game Over Popup Overlay */}
              {gameState === GAME_STATE.GAME_OVER && gameOverData && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center z-10 animate-fade-in">
                  <div className="max-w-md w-full p-5 rounded-2xl bg-surface-container border border-border-subtle shadow-2xl space-y-4">
                    <div>
                      <div className="inline-flex p-2.5 rounded-2xl bg-primary/20 text-primary mb-2">
                        <Swords size={28} />
                      </div>
                      <h3 className="text-lg font-bold text-on-surface">{t.gameOverTitle}</h3>
                      <p className="text-xs text-on-surface-variant mt-1">
                        {t.solvedPraise}{' '}
                        <span className="text-primary font-bold text-sm">
                          {gameOverData.problemsSolved}
                        </span>{' '}
                        {t.problemsUnit}
                      </p>
                      <p className="text-[11px] text-outline mt-0.5 italic">{t.toolioTagline}</p>
                    </div>

                    {/* Solved Problems Breakdown Links */}
                    <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-surface-subtle border border-border-subtle text-left text-xs">
                      {Object.entries(gameOverData.solvedStats)
                        .filter(([_, count]) => count > 0)
                        .map(([toolId, count]) => {
                          const toolName =
                            TOOL_NAMES[toolId]?.[displayLang] || TOOL_NAMES[toolId]?.vn || toolId;
                          return (
                            <button
                              key={toolId}
                              type="button"
                              onClick={() => handleNavigateTool(toolId)}
                              className="flex items-center justify-between w-full p-1.5 rounded-lg hover:bg-surface-container transition-colors group"
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <CheckCircle2 size={13} className="text-primary shrink-0" />
                                <span className="text-on-surface truncate group-hover:text-primary">
                                  {toolName}
                                </span>
                              </div>
                              <span className="text-[11px] font-mono text-outline shrink-0 flex items-center gap-1">
                                {count}x <ExternalLink size={10} />
                              </span>
                            </button>
                          );
                        })}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={handleRestart}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
                      >
                        <RotateCcw size={14} />
                        <span>{t.playAgain}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          window.location.assign('#');
                        }}
                        className="py-2.5 px-4 rounded-xl bg-surface-subtle border border-border-subtle text-on-surface hover:text-primary font-semibold text-xs transition-colors"
                      >
                        {t.exploreToolio}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile & Desktop Action Controls */}
            <div className="w-full mt-3 grid grid-cols-2 gap-3">
              {/* JUMP BUTTON */}
              <button
                type="button"
                onPointerDown={handleJump}
                className="py-3 px-4 rounded-2xl bg-secondary/15 hover:bg-secondary/25 border-2 border-secondary/40 active:scale-95 transition-all flex items-center justify-center gap-2 select-none"
                aria-label="Jump / Nhảy"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-secondary text-white shadow-sm">
                  <ArrowUp size={16} />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-on-surface">JUMP</div>
                  <div className="text-[10px] text-outline font-mono">SPACE / ↑</div>
                </div>
              </button>

              {/* SLASH BUTTON */}
              <button
                type="button"
                onPointerDown={handleSlash}
                className="py-3 px-4 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 border-2 border-rose-500/40 active:scale-95 transition-all flex items-center justify-center gap-2 select-none"
                aria-label="Slash / Chém"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-rose-500 text-white shadow-sm">
                  <Swords size={16} />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-on-surface">SLASH</div>
                  <div className="text-[10px] text-outline font-mono">X / J KEY</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Scorecards & Miniapp Discovery Showcase */}
        <div className="lg:col-span-4 space-y-4 w-full">
          {/* Realtime Scorecard */}
          <div className="p-4 rounded-2xl bg-surface-container border border-border-subtle shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-outline flex items-center gap-1.5">
              <Trophy size={15} className="text-amber-500" />
              <span>{t.bestScore}</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-surface-subtle border border-border-subtle flex flex-col items-center">
                <span className="text-[11px] text-outline">{t.currentScore}</span>
                <span className="text-2xl sm:text-3xl font-mono font-bold text-primary mt-1">
                  {metrics.score}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-surface-subtle border border-border-subtle flex flex-col items-center">
                <span className="text-[11px] text-outline">{t.bestScore}</span>
                <span className="text-2xl sm:text-3xl font-mono font-bold text-amber-600 dark:text-amber-400 mt-1">
                  {metrics.bestScore}
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
                <span>{t.controlJump}</span>
                <kbd className="px-2 py-0.5 rounded bg-surface-subtle border border-border-subtle font-mono text-[11px] text-on-surface font-semibold">
                  Space / ↑
                </kbd>
              </li>
              <li className="flex items-center justify-between">
                <span>{t.controlSlash}</span>
                <kbd className="px-2 py-0.5 rounded bg-surface-subtle border border-border-subtle font-mono text-[11px] text-on-surface font-semibold">
                  X / J
                </kbd>
              </li>
              <li className="flex items-center justify-between">
                <span>{t.controlRestart}</span>
                <kbd className="px-2 py-0.5 rounded bg-surface-subtle border border-border-subtle font-mono text-[11px] text-on-surface font-semibold">
                  R / Click
                </kbd>
              </li>
            </ul>
          </div>

          {/* Ninja Badges Showcase */}
          <div className="p-4 rounded-2xl bg-surface-container border border-border-subtle shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-outline flex items-center gap-1.5">
              <Award size={15} className="text-primary" />
              <span>{t.medalsTitle}</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-surface-subtle border border-border-subtle/70">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#cd7f32] shadow-sm shrink-0" />
                  <span className="font-semibold text-on-surface">{t.medalsBronze}</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-surface-subtle border border-border-subtle/70">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#c0c0c0] shadow-sm shrink-0" />
                  <span className="font-semibold text-on-surface">{t.medalsSilver}</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-surface-subtle border border-border-subtle/70">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#ffd700] shadow-sm shrink-0" />
                  <span className="font-semibold text-on-surface">{t.medalsGold}</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-surface-subtle border border-border-subtle/70">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#e5e4e2] shadow-sm shrink-0" />
                  <span className="font-semibold text-on-surface">{t.medalsMaster}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Corresponding Real Toolio Apps */}
          <div className="p-4 rounded-2xl bg-surface-container border border-border-subtle shadow-sm space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-outline">
              {t.toolsTitle}
            </h3>
            <div className="space-y-1.5">
              {TOOLIO_PROBLEM_TYPES.slice(0, 5).map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => handleNavigateTool(item.toolId)}
                  className="flex items-center justify-between w-full p-2 rounded-xl bg-surface-subtle hover:bg-surface-subtle/80 border border-border-subtle text-left transition-colors group"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs font-semibold text-on-surface truncate group-hover:text-primary">
                      {TOOL_NAMES[item.toolId]?.[displayLang] || item.toolId}
                    </span>
                  </div>
                  <ExternalLink size={12} className="text-outline shrink-0 group-hover:text-primary" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
