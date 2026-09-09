/**
 * @file packages/core/src/utils/ninja/ninjaEngine.js
 * ============================================================================
 * Toolio Ninja Run — Canvas 2D Game Engine (60fps, Delta-time Normalized).
 *
 * Tích hợp toàn diện các bài toán văn phòng từ 16 miniapp thực tế của Toolio:
 * - 10 Chướng ngại vật đặc trưng: PDF Bloat, Scattered Pages, Messy Backdrop,
 *   Crooked Card, Invoice Beast, Heavy RAW Image, Glitch QR, Unprotected Doc,
 *   Misaligned Excel, Tax Math Storm, cùng Bẫy cọc gai (Spikes).
 * - 3 Power-ups Toolio: Omni-Boost, Watermark Shield, Snip Slash Wave.
 * - 4 Biomes Parallax Nhật Bản - Việt Nam kèm Easter eggs lề đường.
 * - Hệ thống âm thanh Web Audio procedural qua NinjaSoundPlayer.
 * - Lưu điểm kỷ lục và thống kê bài toán đã giải vào localStorage.
 * ============================================================================
 */

import { NinjaSoundPlayer } from './ninjaSounds.js';
import {
  drawMountFuji,
  drawTokyoSkytree,
  drawToriiGate,
  drawSakuraTree,
  drawTrongMaiRocks,
  drawHaLongJunkBoat,
  drawHaLongKarsts,
  drawChuaCauHoiAn,
  drawHoiAnHousesAndLanterns,
  drawLandmark81,
  drawBitexcoTower,
  drawBaSonBridge,
  drawObstacleMonster,
} from './ninjaLandmarks.js';

export const GAME_STATE = {
  READY: 0,
  PLAYING: 1,
  GAME_OVER: 2,
};

export const BEST_SCORE_KEY = 'toolio_ninja_best_score';

export const GAME_WIDTH = 640;
export const GAME_HEIGHT = 360;
export const GROUND_Y = 290;
export const MAX_DPR = 2;

// Danh mục ánh xạ miniapp thực tế của Toolio
export const TOOLIO_PROBLEM_TYPES = [
  {
    type: 'pdf-bloat',
    toolId: 'pdf-toolkit',
    name: 'PDF Bloat Monster',
    toast: 'PDF Compressed! -85% 📄',
    color: '#ef4444',
    fly: false,
    width: 44,
    height: 48,
  },
  {
    type: 'scattered-pages',
    toolId: 'pdf-toolkit',
    name: 'Scattered Pages Wall',
    toast: 'PDFs Merged! 📑',
    color: '#f97316',
    fly: false,
    width: 38,
    height: 42,
  },
  {
    type: 'messy-backdrop',
    toolId: 'id-photo-studio',
    name: 'Messy Backdrop Cloud',
    toast: 'Background Removed! 📸',
    color: '#0ea5e9',
    fly: true,
    width: 48,
    height: 40,
  },
  {
    type: 'crooked-card',
    toolId: 'business-card-studio',
    name: 'Crooked Card Golem',
    toast: 'Bleed & Tonbo Aligned! 🪪',
    color: '#3b82f6',
    fly: false,
    width: 46,
    height: 44,
  },
  {
    type: 'invoice-beast',
    toolId: 'invoice-studio',
    name: 'Invoice Paper Beast',
    toast: 'Payment Request Created! 🧾',
    color: '#f59e0b',
    fly: true,
    width: 46,
    height: 42,
  },
  {
    type: 'heavy-image',
    toolId: 'image-convert',
    name: 'Heavy RAW Image Boulder',
    toast: 'Image Optimized WebP! 🖼️',
    color: '#10b981',
    fly: false,
    width: 44,
    height: 44,
  },
  {
    type: 'glitch-qr',
    toolId: 'barcode-qr',
    name: 'Glitchy QR Matrix',
    toast: 'QR Code Generated! 📱',
    color: '#8b5cf6',
    fly: false,
    width: 40,
    height: 40,
  },
  {
    type: 'unprotected-doc',
    toolId: 'watermark-studio',
    name: 'Unprotected Doc Wraith',
    toast: 'Confidential Watermarked! 🛡️',
    color: '#6366f1',
    fly: true,
    width: 42,
    height: 44,
  },
  {
    type: 'misaligned-excel',
    toolId: 'excel-mapping',
    name: 'Misaligned Excel Grid',
    toast: 'Excel Columns Mapped! 📊',
    color: '#059669',
    fly: false,
    width: 44,
    height: 42,
  },
  {
    type: 'tax-storm',
    toolId: 'tax-calculator',
    name: 'Tax Math Storm',
    toast: 'Tax & Net Calculated! 💰',
    color: '#0284c7',
    fly: true,
    width: 44,
    height: 44,
  },
];

export const BIOMES = [
  {
    id: 'japan-tokyo-fuji',
    name: 'Tokyo Skytree & Núi Phú Sĩ',
    banner: '🗾 TOKYO & PHÚ SĨ — NIPPON DAWN',
    country: 'JP',
    skyTop: '#1e1b4b',
    skyBottom: '#fda4af',
    fuji: true,
    sakura: true,
  },
  {
    id: 'vietnam-halong',
    name: 'Vịnh Hạ Long & Hòn Trống Mái',
    banner: '🇻🇳 VỊNH HẠ LONG — KỲ QUAN THẾ GIỚI',
    country: 'VN',
    skyTop: '#09203f',
    skyBottom: '#537895',
    halong: true,
  },
  {
    id: 'vietnam-hoian',
    name: 'Phố Cổ Hội An & Chùa Cầu',
    banner: '🇻🇳 PHỐ CỔ HỘI AN — DI SẢN VĂN HOÁ',
    country: 'VN',
    skyTop: '#2e1065',
    skyBottom: '#f59e0b',
    hoian: true,
  },
  {
    id: 'vietnam-saigon',
    name: 'Sài Gòn & Landmark 81',
    banner: '🇻🇳 SÀI GÒN METROPOLIS & LANDMARK 81',
    country: 'VN',
    skyTop: '#0b132b',
    skyBottom: '#1c2541',
    landmark: true,
  },
];

/**
 * Nội suy màu mượt mà giữa hai mã màu Hex
 */
export function lerpColor(c1, c2, t) {
  const parse = (c) => {
    let hex = c.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map((x) => x + x).join('');
    const num = parseInt(hex, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  };
  const [r1, g1, b1] = parse(c1);
  const [r2, g2, b2] = parse(c2);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function readBestScore() {
  try {
    const val = localStorage.getItem(BEST_SCORE_KEY);
    const num = Number(val);
    return Number.isFinite(num) && num > 0 ? num : 0;
  } catch {
    return 0;
  }
}

function writeBestScore(score) {
  try {
    localStorage.setItem(BEST_SCORE_KEY, String(score));
  } catch {}
}

export class NinjaEngine {
  constructor(ctx) {
    this.ctx = ctx;
    this.width = GAME_WIDTH;
    this.height = GAME_HEIGHT;
    this.state = GAME_STATE.READY;

    // Metrics & Score
    this.distance = 0;
    this.problemsSolved = 0;
    this.score = 0;
    this.bestScore = readBestScore();
    this.combo = 0;
    this.comboTimer = 0;
    this.solvedStats = {};
    for (const p of TOOLIO_PROBLEM_TYPES) {
      this.solvedStats[p.toolId] = 0;
    }

    // Speed & Timing
    this.baseSpeed = 3.4;
    this.currentSpeed = this.baseSpeed;
    this.time = 0;

    // Ninja Player
    this.ninja = {
      x: 90,
      y: GROUND_Y - 44,
      width: 34,
      height: 44,
      vy: 0,
      isGrounded: true,
      jumpsLeft: 2, // Double jump enabled
      coyoteTimer: 0,
      jumpBuffer: 0,
      isSlashing: false,
      slashTimer: 0,
      slashCooldown: 0,
      shield: 0,
      boostTimer: 0,
      snipTimer: 0,
      frameTimer: 0,
      runFrame: 0,
      dizzyTimer: 0,
    };

    // Obstacles, Powerups, Particles, Toasts
    this.obstacles = [];
    this.spawnTimer = 60;
    this.powerups = [];
    this.powerupTimer = 400;
    this.particles = [];
    this.toasts = [];
    this.easterEggs = [];
    this.weatherParticles = [];
    this.initWeather();

    // Audio
    this.sounds = new NinjaSoundPlayer();

    // Callbacks
    this.onScoreChange = null;
    this.onStateChange = null;
    this.onGameOver = null;

    // Animation frame
    this.rafId = 0;
    this.lastTimestamp = 0;
    this.destroyed = false;

    this.loop = this.loop.bind(this);
  }

  start() {
    this.lastTimestamp = performance.now();
    this.rafId = requestAnimationFrame(this.loop);
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.rafId);
    this.sounds.dispose();
  }

  unlockAudio() {
    this.sounds.prime();
  }

  toggleSound() {
    return this.sounds.toggle();
  }

  isSoundEnabled() {
    return this.sounds.enabled;
  }

  handleJump() {
    this.unlockAudio();
    if (this.state === GAME_STATE.READY) {
      this.state = GAME_STATE.PLAYING;
      this.onStateChange?.(this.state);
      this.executeJump();
      return;
    }

    if (this.state === GAME_STATE.PLAYING) {
      this.executeJump();
      return;
    }

    if (this.state === GAME_STATE.GAME_OVER && this.ninja.dizzyTimer > 30) {
      this.reset();
    }
  }

  handleSlash() {
    this.unlockAudio();
    if (this.state === GAME_STATE.READY) {
      this.state = GAME_STATE.PLAYING;
      this.onStateChange?.(this.state);
      this.executeSlash();
      return;
    }

    if (this.state === GAME_STATE.PLAYING) {
      this.executeSlash();
      return;
    }

    if (this.state === GAME_STATE.GAME_OVER && this.ninja.dizzyTimer > 30) {
      this.reset();
    }
  }

  executeJump() {
    const n = this.ninja;
    if (n.isGrounded || n.coyoteTimer > 0) {
      n.vy = -8.6;
      n.isGrounded = false;
      n.jumpsLeft = 1;
      n.coyoteTimer = 0;
      this.spawnDust(n.x + 10, GROUND_Y, 5);
      this.sounds.play('jump');
    } else if (n.jumpsLeft > 0) {
      n.vy = -7.8;
      n.jumpsLeft = 0;
      this.spawnSparkles(n.x + 15, n.y + 30, '#38bdf8', 6);
      this.sounds.play('jump');
    } else {
      n.jumpBuffer = 8; // Buffer jump for next 8 frames
    }
  }

  executeSlash() {
    const n = this.ninja;
    if (n.slashCooldown > 0) return;

    n.isSlashing = true;
    n.slashTimer = 13; // ~220ms active slash hitbox
    n.slashCooldown = 15;
    this.sounds.play('slash');

    // Spawn Snip Wave beam if power-up active
    if (n.snipTimer > 0) {
      this.spawnSnipWave();
    }
  }

  spawnSnipWave() {
    const n = this.ninja;
    this.particles.push({
      type: 'snip-beam',
      x: n.x + 35,
      y: n.y + 20,
      vx: 12,
      vy: 0,
      life: 40,
      maxLife: 40,
      color: '#f43f5e',
    });
  }

  reset() {
    this.state = GAME_STATE.PLAYING;
    this.distance = 0;
    this.problemsSolved = 0;
    this.score = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.currentSpeed = this.baseSpeed;
    this.obstacles = [];
    this.powerups = [];
    this.particles = [];
    this.toasts = [];
    this.easterEggs = [];
    this.initWeather();
    this.spawnTimer = 60;
    this.powerupTimer = 400;

    for (const p of TOOLIO_PROBLEM_TYPES) {
      this.solvedStats[p.toolId] = 0;
    }

    const n = this.ninja;
    n.x = 90;
    n.y = GROUND_Y - 44;
    n.vy = 0;
    n.isGrounded = true;
    n.jumpsLeft = 2;
    n.isSlashing = false;
    n.slashTimer = 0;
    n.slashCooldown = 0;
    n.shield = 0;
    n.boostTimer = 0;
    n.snipTimer = 0;
    n.dizzyTimer = 0;

    this.onScoreChange?.({
      distance: 0,
      problemsSolved: 0,
      score: 0,
      combo: 0,
      bestScore: this.bestScore,
    });
    this.onStateChange?.(this.state);
  }

  getCurrentBiomeInfo() {
    const BIOME_DISTANCE = 400;
    const totalDist = BIOMES.length * BIOME_DISTANCE;
    const cyclePos = ((this.distance % totalDist) + totalDist) % totalDist;
    const currentIdx = Math.floor(cyclePos / BIOME_DISTANCE);
    const nextIdx = (currentIdx + 1) % BIOMES.length;
    const biomeProgress = cyclePos % BIOME_DISTANCE;

    const currentBiome = BIOMES[currentIdx] || BIOMES[0];
    const nextBiome = BIOMES[nextIdx] || BIOMES[0];

    // Cửa sổ chuyển cảnh mượt mà: 60m cuối mỗi vùng
    let t = 0;
    const transWindow = 60;
    if (biomeProgress >= BIOME_DISTANCE - transWindow) {
      t = (biomeProgress - (BIOME_DISTANCE - transWindow)) / transWindow;
    }

    const skyTop = t > 0 ? lerpColor(currentBiome.skyTop, nextBiome.skyTop, t) : currentBiome.skyTop;
    const skyBottom = t > 0 ? lerpColor(currentBiome.skyBottom, nextBiome.skyBottom, t) : currentBiome.skyBottom;

    return {
      currentBiome,
      nextBiome,
      progress: biomeProgress,
      skyTop,
      skyBottom,
      transitionRatio: t,
    };
  }

  getCurrentBiome() {
    return this.getCurrentBiomeInfo().currentBiome;
  }

  initWeather() {
    this.weatherParticles = Array.from({ length: 32 }, () => ({
      x: Math.random() * GAME_WIDTH,
      y: Math.random() * (GROUND_Y - 20),
      vx: -1.2 - Math.random() * 1.6,
      vy: 0.4 + Math.random() * 0.8,
      size: 2 + Math.random() * 3,
      rot: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.12,
      alpha: 0.35 + Math.random() * 0.5,
    }));
  }

  updateWeather(dt) {
    if (!this.weatherParticles || this.weatherParticles.length === 0) {
      this.initWeather();
    }
    for (const p of this.weatherParticles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vRot * dt;

      if (p.x < -20) {
        p.x = GAME_WIDTH + 20;
        p.y = Math.random() * (GROUND_Y - 30);
      }
      if (p.y > GROUND_Y - 5) {
        p.y = 10;
        p.x = Math.random() * GAME_WIDTH;
      }
    }
  }

  renderWeather(biome) {
    if (!this.weatherParticles) return;
    const ctx = this.ctx;
    ctx.save();

    for (const p of this.weatherParticles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;

      if (biome.id === 'japan-tokyo-fuji' || biome.sakura) {
        // Cánh hoa anh đào Sakura rơi lãng đãng theo gió
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = '#fda4af';
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 1.6, p.size * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (biome.id === 'vietnam-halong' || biome.halong) {
        // Hạt sương mù biển & ánh lân tinh ngọc bích Hạ Long
        ctx.fillStyle = '#6ee7b7';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.85, 0, Math.PI * 2);
        ctx.fill();
      } else if (biome.id === 'vietnam-hoian' || biome.hoian) {
        // Đốm đom đóm & tàn sáng đèn lồng Hội An ấm áp
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 1.1, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Vệt neon bokeh đô thị Sài Gòn
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  renderBiomeBanner(biome, alpha) {
    if (alpha <= 0.02) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = Math.min(1, alpha * 1.25);

    const bannerW = 280;
    const bannerH = 32;
    const bx = (this.width - bannerW) / 2;
    const by = 16;

    // Nền panel kính mờ tối màu sang trọng
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(bx, by, bannerW, bannerH, 8);
    ctx.fill();

    // Viền phát sáng cyan Toolio
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Biểu tượng & Tên địa danh nổi bật
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(biome.banner || biome.name, this.width / 2, by + bannerH / 2);

    ctx.restore();
  }

  loop(timestamp) {
    if (this.destroyed) return;

    const dt = Math.min(32, Math.max(8, timestamp - this.lastTimestamp)) / 16.667;
    this.lastTimestamp = timestamp;

    this.update(dt);
    this.render();

    this.rafId = requestAnimationFrame(this.loop);
  }

  update(dt) {
    this.time += dt;

    if (this.state === GAME_STATE.PLAYING) {
      // Speed progression (gentle increase from 3.4 up to 6.2)
      this.currentSpeed = Math.min(6.2, this.baseSpeed + this.distance * 0.0018);
      const effectiveSpeed = this.ninja.boostTimer > 0 ? this.currentSpeed * 1.6 : this.currentSpeed;
      this.distance += (effectiveSpeed * dt) / 8;

      // Update Ninja Physics
      this.updateNinja(dt);

      // Update Combos
      if (this.comboTimer > 0) {
        this.comboTimer -= dt;
        if (this.comboTimer <= 0) {
          this.combo = 0;
          this.onScoreChange?.({
            distance: Math.floor(this.distance),
            problemsSolved: this.problemsSolved,
            score: this.score,
            combo: 0,
            bestScore: this.bestScore,
          });
        }
      }

      // Spawning
      this.updateSpawning(dt, effectiveSpeed);

      // Collisions & Movement
      this.updateObstacles(dt, effectiveSpeed);
      this.updatePowerups(dt, effectiveSpeed);

      // Update Score
      this.score = Math.floor(this.distance) + this.problemsSolved * 60;
      if (this.score > this.bestScore) {
        this.bestScore = this.score;
        writeBestScore(this.bestScore);
      }

      this.onScoreChange?.({
        distance: Math.floor(this.distance),
        problemsSolved: this.problemsSolved,
        score: this.score,
        combo: this.combo,
        bestScore: this.bestScore,
      });
    } else if (this.state === GAME_STATE.GAME_OVER) {
      this.ninja.dizzyTimer += dt;
      // Gentle gravity on defeat
      if (this.ninja.y < GROUND_Y - 36) {
        this.ninja.vy += 0.4 * dt;
        this.ninja.y += this.ninja.vy * dt;
      } else {
        this.ninja.y = GROUND_Y - 36;
        this.ninja.vy = 0;
      }
    }

    // Update Particles, Toasts & Weather
    this.updateWeather(dt);
    this.updateParticles(dt);
    this.updateToasts(dt);
  }

  updateNinja(dt) {
    const n = this.ninja;

    // Boost & Power-up Timers
    if (n.boostTimer > 0) {
      n.boostTimer -= dt;
      this.spawnSparkles(n.x + Math.random() * 20, n.y + Math.random() * 30, '#0284c7', 1);
    }
    if (n.snipTimer > 0) n.snipTimer -= dt;

    // Slashes
    if (n.slashTimer > 0) {
      n.slashTimer -= dt;
      if (n.slashTimer <= 0) n.isSlashing = false;
    }
    if (n.slashCooldown > 0) n.slashCooldown -= dt;

    // Gravity
    n.vy += 0.44 * dt;
    n.y += n.vy * dt;

    // Ground collision
    if (n.y >= GROUND_Y - 44) {
      n.y = GROUND_Y - 44;
      n.vy = 0;
      if (!n.isGrounded) {
        n.isGrounded = true;
        n.jumpsLeft = 2;
        this.spawnDust(n.x + 10, GROUND_Y, 3);
      }

      // Jump buffer check
      if (n.jumpBuffer > 0) {
        n.jumpBuffer = 0;
        this.executeJump();
      }
    } else {
      n.isGrounded = false;
      if (n.coyoteTimer > 0) n.coyoteTimer -= dt;
    }

    if (n.jumpBuffer > 0) n.jumpBuffer -= dt;

    // Run animation cycle
    n.frameTimer += dt;
    if (n.frameTimer >= 4.5) {
      n.frameTimer = 0;
      n.runFrame = (n.runFrame + 1) % 4;
      if (n.isGrounded && Math.random() < 0.4) {
        this.spawnDust(n.x + 4, GROUND_Y, 1);
      }
    }
  }

  updateSpawning(dt, _speed) {
    this.spawnTimer -= dt;

    // First 10s: Tutorial mode (spaced, easy)
    const isTutorial = this.distance < 80;
    const spawnInterval = isTutorial ? 90 : Math.max(38, 75 - this.distance * 0.03);

    if (this.spawnTimer <= 0) {
      this.spawnTimer = spawnInterval + Math.random() * 25;
      this.spawnObstacle(isTutorial);
    }

    // Power-up spawn
    this.powerupTimer -= dt;
    if (this.powerupTimer <= 0 && this.distance > 150) {
      this.powerupTimer = 450 + Math.random() * 250;
      this.spawnPowerup();
    }
  }

  spawnObstacle(isTutorial) {
    if (isTutorial && this.distance < 35) {
      // First obstacle: Simple spike to teach JUMP
      this.obstacles.push({
        type: 'spikes',
        name: 'Spike Barricade',
        x: GAME_WIDTH + 20,
        y: GROUND_Y - 26,
        width: 32,
        height: 26,
        canSlash: false,
        color: '#dc2626',
        toolId: 'road',
      });
      return;
    }

    if (isTutorial && this.distance >= 35) {
      // Second obstacle: PDF Bloat to teach SLASH
      this.obstacles.push({
        ...TOOLIO_PROBLEM_TYPES[0],
        x: GAME_WIDTH + 20,
        y: GROUND_Y - 48,
        canSlash: true,
      });
      return;
    }

    // Regular gameplay: Mix Toolio Problem Monsters (85%) & Spikes (15%)
    if (Math.random() < 0.18) {
      this.obstacles.push({
        type: 'spikes',
        name: 'Spike Barricade',
        x: GAME_WIDTH + 20,
        y: GROUND_Y - 26,
        width: 32,
        height: 26,
        canSlash: false,
        color: '#dc2626',
        toolId: 'road',
      });
    } else {
      const template = TOOLIO_PROBLEM_TYPES[Math.floor(Math.random() * TOOLIO_PROBLEM_TYPES.length)];
      const y = template.fly ? GROUND_Y - template.height - 38 : GROUND_Y - template.height;
      this.obstacles.push({
        ...template,
        x: GAME_WIDTH + 20,
        y,
        canSlash: true,
      });
    }

    // Occasionally spawn roadside Easter egg
    if (Math.random() < 0.25) {
      const eggs = ['maneki-neko', 'shiba', 'phin-coffee', 'banh-mi', 'ramen'];
      const egg = eggs[Math.floor(Math.random() * eggs.length)];
      this.easterEggs.push({
        type: egg,
        x: GAME_WIDTH + 40,
        y: GROUND_Y - 22,
      });
    }
  }

  spawnPowerup() {
    const types = ['omni-boost', 'watermark-shield', 'snip-wave'];
    const type = types[Math.floor(Math.random() * types.length)];
    this.powerups.push({
      type,
      x: GAME_WIDTH + 20,
      y: GROUND_Y - 60 - Math.random() * 30,
      width: 26,
      height: 26,
    });
  }

  updateObstacles(dt, speed) {
    const n = this.ninja;
    const slashHitbox = {
      x: n.x + 10,
      y: n.y - 12,
      width: n.snipTimer > 0 ? 140 : 82,
      height: 64,
    };

    const ninjaHitbox = {
      x: n.x + 6,
      y: n.y + 6,
      width: n.width - 12,
      height: n.height - 10,
    };

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.x -= speed * dt;

      const obsHitbox = {
        x: obs.x + 4,
        y: obs.y + 4,
        width: obs.width - 8,
        height: obs.height - 8,
      };

      // Check Snip wave beams collision
      for (const p of this.particles) {
        if (p.type === 'snip-beam') {
          if (this.rectIntersect({ x: p.x, y: p.y - 10, width: 24, height: 20 }, obsHitbox)) {
            if (obs.canSlash) {
              this.destroyObstacle(obs, i);
              p.life = 0;
              break;
            }
          }
        }
      }

      // Check Ninja Slash Hit
      if (n.isSlashing && obs.canSlash && this.rectIntersect(slashHitbox, obsHitbox)) {
        this.destroyObstacle(obs, i);
        continue;
      }

      // Check Auto-destroy under Omni-Boost
      if (n.boostTimer > 0 && this.rectIntersect(ninjaHitbox, obsHitbox)) {
        this.destroyObstacle(obs, i);
        continue;
      }

      // Check Ninja Collision (Damage / Defeat)
      if (this.rectIntersect(ninjaHitbox, obsHitbox)) {
        if (n.shield > 0) {
          // Shield absorbed hit!
          n.shield--;
          this.sounds.play('hit');
          this.spawnSparkles(n.x + 15, n.y + 15, '#fbbf24', 16);
          this.addToast('Shield Protected!', '#fbbf24', n.x + 10, n.y - 20);
          this.obstacles.splice(i, 1);
          continue;
        }

        // Game Over!
        this.triggerGameOver();
        return;
      }

      // Cleanup offscreen
      if (obs.x < -60) {
        this.obstacles.splice(i, 1);
      }
    }

    // Move roadside easter eggs
    for (let i = this.easterEggs.length - 1; i >= 0; i--) {
      this.easterEggs[i].x -= speed * dt;
      if (this.easterEggs[i].x < -60) {
        this.easterEggs.splice(i, 1);
      }
    }
  }

  destroyObstacle(obs, index) {
    this.obstacles.splice(index, 1);
    this.problemsSolved++;

    if (obs.toolId && this.solvedStats[obs.toolId] !== undefined) {
      this.solvedStats[obs.toolId]++;
    }

    // Combo system
    this.combo++;
    this.comboTimer = 150; // 2.5 seconds window
    if (this.combo >= 2) {
      this.sounds.playCombo(this.combo);
      if (this.combo % 3 === 0 || this.combo === 5 || this.combo === 10) {
        this.addToast(`${this.combo}x COMBO! 🔥`, '#f59e0b', obs.x, obs.y - 28);
      }
    } else {
      this.sounds.play('break');
    }

    // Spawn destruction effects & toast
    this.spawnShards(obs.x + obs.width / 2, obs.y + obs.height / 2, obs.color);
    if (obs.toast) {
      this.addToast(obs.toast, obs.color, obs.x, obs.y - 12);
    }
  }

  updatePowerups(dt, speed) {
    const n = this.ninja;
    const ninjaHitbox = {
      x: n.x + 4,
      y: n.y + 4,
      width: n.width - 8,
      height: n.height - 8,
    };

    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      p.x -= speed * dt;

      if (this.rectIntersect(ninjaHitbox, p)) {
        this.powerups.splice(i, 1);
        this.sounds.play('powerup');
        this.spawnSparkles(p.x, p.y, '#38bdf8', 14);

        if (p.type === 'omni-boost') {
          n.boostTimer = 210; // ~3.5s
          this.addToast('⚡ OMNI-BOOST!', '#0284c7', n.x, n.y - 25);
        } else if (p.type === 'watermark-shield') {
          n.shield = 1;
          this.addToast('🛡️ WATERMARK SHIELD!', '#6366f1', n.x, n.y - 25);
        } else if (p.type === 'snip-wave') {
          n.snipTimer = 300; // ~5.0s
          this.addToast('✂️ SNIP SLASH WAVE!', '#ef4444', n.x, n.y - 25);
        }
        continue;
      }

      if (p.x < -40) {
        this.powerups.splice(i, 1);
      }
    }
  }

  triggerGameOver() {
    this.state = GAME_STATE.GAME_OVER;
    this.ninja.vy = -5;
    this.sounds.play('gameover');
    this.spawnSparkles(this.ninja.x + 15, this.ninja.y + 15, '#ef4444', 20);

    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      writeBestScore(this.bestScore);
    }

    this.onStateChange?.(this.state);
    this.onGameOver?.({
      distance: Math.floor(this.distance),
      problemsSolved: this.problemsSolved,
      score: this.score,
      bestScore: this.bestScore,
      solvedStats: { ...this.solvedStats },
    });
  }

  rectIntersect(r1, r2) {
    return (
      r1.x < r2.x + r2.width &&
      r1.x + r1.width > r2.x &&
      r1.y < r2.y + r2.height &&
      r1.y + r1.height > r2.y
    );
  }

  // Particle & Toast Systems
  spawnDust(x, y, count = 3) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() * 8 - 4),
        y: y - 2,
        vx: -(1 + Math.random() * 2),
        vy: -(0.5 + Math.random()),
        size: 3 + Math.random() * 2,
        color: '#94a3b8',
        alpha: 0.6,
        life: 14,
        maxLife: 14,
      });
    }
  }

  spawnSparkles(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2.5 + Math.random() * 2.5,
        color,
        alpha: 1,
        life: 20,
        maxLife: 20,
      });
    }
  }

  spawnShards(x, y, color) {
    const shardColors = [color, '#ffffff', '#fbbf24', '#38bdf8'];
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        size: 3 + Math.random() * 4,
        color: shardColors[Math.floor(Math.random() * shardColors.length)],
        alpha: 1,
        life: 26,
        maxLife: 26,
        isShard: true,
      });
    }
  }

  addToast(text, color, x, y) {
    this.toasts.push({
      text,
      color,
      x: Math.max(70, Math.min(GAME_WIDTH - 140, x)),
      y: Math.max(40, y),
      alpha: 1,
      life: 42,
      maxLife: 42,
    });
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.isShard) p.vy += 0.25 * dt; // Shards have gravity
      p.life -= dt;
      p.alpha = Math.max(0, p.life / p.maxLife);
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  updateToasts(dt) {
    for (let i = this.toasts.length - 1; i >= 0; i--) {
      const t = this.toasts[i];
      t.y -= 0.6 * dt;
      t.life -= dt;
      t.alpha = Math.max(0, t.life / t.maxLife);
      if (t.life <= 0) {
        this.toasts.splice(i, 1);
      }
    }
  }

  // ==========================================================================
  // RENDERING PIPELINE (100% Procedural Canvas 2D Vector)
  // ==========================================================================
  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    const biomeInfo = this.getCurrentBiomeInfo();
    const biome = biomeInfo.currentBiome;

    // 1. Far Sky & Celestial with smooth color interpolation
    this.renderSky(biomeInfo);

    // 2. Parallax Far Mountain / Karst / Skyline Silhouettes
    this.renderParallaxFar(biome);

    // 3. Parallax Midground (Torii, Sakura, Trống Mái, Chùa Cầu, Cầu Ba Son)
    this.renderParallaxMid(biome);

    // 4. Ground & Road Markings
    this.renderGround();

    // 5. Roadside Easter Eggs
    this.renderEasterEggs();

    // 6. Weather Ambient Particles (Sakura, Sea Mist, Lantern Fireflies, Neon Bokeh)
    this.renderWeather(biome);

    // 7. Powerups
    this.renderPowerups();

    // 8. Obstacles (Toolio Monsters)
    this.renderObstacles();

    // 9. Ninja Player
    this.renderNinja();

    // 10. Hit / Slash Particles & Floating Toasts
    this.renderParticles();
    this.renderToasts();

    // 11. Welcome Landmark Banner
    if (biomeInfo.progress < 55 && this.state === GAME_STATE.PLAYING) {
      const alpha = Math.sin((biomeInfo.progress / 55) * Math.PI);
      this.renderBiomeBanner(biome, alpha);
    }

    // 12. In-game HUD / Overlay
    this.renderHUD(biome);
  }

  renderSky(biomeInfo) {
    const ctx = this.ctx;
    const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    grad.addColorStop(0, biomeInfo.skyTop);
    grad.addColorStop(1, biomeInfo.skyBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, GROUND_Y);

    // Thiên thể: Mặt trời mọc hoặc Trăng đêm huyền ảo
    ctx.save();
    const isNight = biomeInfo.currentBiome.id === 'vietnam-saigon' || biomeInfo.currentBiome.id === 'japan-tokyo-fuji';
    if (isNight) {
      ctx.fillStyle = 'rgba(255, 255, 245, 0.9)';
      ctx.beginPath();
      ctx.arc(530, 65, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.arc(530, 65, 34, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(254, 240, 138, 0.9)';
      ctx.beginPath();
      ctx.arc(520, 70, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(251, 146, 60, 0.2)';
      ctx.beginPath();
      ctx.arc(520, 70, 40, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  renderParallaxFar(biome) {
    const ctx = this.ctx;
    const scroll = (this.distance * 0.12) % 640;

    ctx.save();
    for (let offset = -640; offset <= 640; offset += 640) {
      const baseX = offset - scroll;

      if (biome.id === 'japan-tokyo-fuji' || biome.fuji) {
        // Núi Phú Sĩ tuyết phủ & Tháp Tokyo Skytree
        drawMountFuji(ctx, baseX + 340, GROUND_Y);
        drawTokyoSkytree(ctx, baseX + 130, GROUND_Y, this.time);
      } else if (biome.id === 'vietnam-halong' || biome.halong) {
        // Dãy núi đá vôi Karst vịnh Hạ Long nhiều tầng
        drawHaLongKarsts(ctx, baseX + 160, GROUND_Y);
        drawHaLongKarsts(ctx, baseX + 480, GROUND_Y);
      } else if (biome.id === 'vietnam-hoian' || biome.hoian) {
        // Phố Cổ Hội An: Nhà cổ tường vàng & đèn lồng
        drawHoiAnHousesAndLanterns(ctx, baseX + 260, GROUND_Y);
      } else if (biome.id === 'vietnam-saigon' || biome.landmark) {
        // Sài Gòn Skyline: Bitexco & Landmark 81 vươn cao
        drawBitexcoTower(ctx, baseX + 170, GROUND_Y);
        drawLandmark81(ctx, baseX + 430, GROUND_Y, this.time);
      }
    }
    ctx.restore();
  }

  renderParallaxMid(biome) {
    const ctx = this.ctx;
    const scroll = (this.distance * 0.38) % 640;

    ctx.save();
    for (let offset = -640; offset <= 640; offset += 640) {
      const baseX = offset - scroll;

      if (biome.id === 'japan-tokyo-fuji' || biome.fuji) {
        // Cổng Torii Đỏ truyền thống & Cây hoa anh đào Sakura nở rộ
        drawToriiGate(ctx, baseX + 190, GROUND_Y);
        drawSakuraTree(ctx, baseX + 460, GROUND_Y);
      } else if (biome.id === 'vietnam-halong' || biome.halong) {
        // Thuyền buồm nâu cánh dơi & Hòn Trống Mái thắt eo rêu phong
        drawHaLongJunkBoat(ctx, baseX + 140, GROUND_Y, this.time);
        drawTrongMaiRocks(ctx, baseX + 420, GROUND_Y, this.time);
      } else if (biome.id === 'vietnam-hoian' || biome.hoian) {
        // Chùa Cầu Hội An mái ngói âm dương cong vút
        drawChuaCauHoiAn(ctx, baseX + 290, GROUND_Y);
      } else if (biome.id === 'vietnam-saigon' || biome.landmark) {
        // Cầu Ba Son dây văng bắc qua sông Sài Gòn
        drawBaSonBridge(ctx, baseX + 320, GROUND_Y);
      }
    }
    ctx.restore();
  }

  renderGround() {
    const ctx = this.ctx;
    // Ground Base
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, GROUND_Y, this.width, this.height - GROUND_Y);

    // Ground Edge Line
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(0, GROUND_Y, this.width, 3);

    // Speed lines on road
    const scroll = (this.distance * 4) % 60;
    ctx.fillStyle = '#334155';
    for (let x = -60; x < this.width + 60; x += 60) {
      ctx.fillRect(x - scroll, GROUND_Y + 14, 32, 4);
    }
  }

  renderEasterEggs() {
    const ctx = this.ctx;
    for (const egg of this.easterEggs) {
      ctx.save();
      const { x, y, type } = egg;

      if (type === 'maneki-neko') {
        // Lucky Cat
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x + 10, y + 10, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(x + 10, y + 14, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (type === 'phin-coffee') {
        // Vietnamese Phin Coffee
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(x + 4, y + 4, 10, 14);
        ctx.fillStyle = '#451a03';
        ctx.fillRect(x + 2, y + 14, 14, 4);
      } else if (type === 'banh-mi') {
        // Bánh Mì
        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.ellipse(x + 10, y + 10, 10, 5, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (type === 'ramen') {
        // Ramen Bowl
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(x + 10, y + 12, 8, 0, Math.PI);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(x + 4, y + 10, 12, 3);
      }
      ctx.restore();
    }
  }

  renderPowerups() {
    const ctx = this.ctx;
    for (const p of this.powerups) {
      ctx.save();
      const bob = Math.sin(this.time * 0.1) * 4;
      const y = p.y + bob;

      // Glow circle
      ctx.fillStyle = p.type === 'omni-boost' ? 'rgba(2, 132, 199, 0.3)' : 'rgba(99, 102, 241, 0.3)';
      ctx.beginPath();
      ctx.arc(p.x + 13, y + 13, 18, 0, Math.PI * 2);
      ctx.fill();

      // Icon badge
      ctx.fillStyle = p.type === 'omni-boost' ? '#0284c7' : p.type === 'watermark-shield' ? '#6366f1' : '#ef4444';
      ctx.beginPath();
      ctx.arc(p.x + 13, y + 13, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const icon = p.type === 'omni-boost' ? '⚡' : p.type === 'watermark-shield' ? '🛡️' : '✂️';
      ctx.fillText(icon, p.x + 13, y + 13);
      ctx.restore();
    }
  }

  renderObstacles() {
    const ctx = this.ctx;
    for (const obs of this.obstacles) {
      drawObstacleMonster(ctx, obs, this.time);
    }
  }

  renderNinja() {
    const ctx = this.ctx;
    const n = this.ninja;

    ctx.save();
    const x = n.x;
    const y = n.y;

    // Shield effect
    if (n.shield > 0) {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x + 17, y + 22, 28, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Boost glow
    if (n.boostTimer > 0) {
      ctx.fillStyle = 'rgba(2, 132, 199, 0.25)';
      ctx.beginPath();
      ctx.arc(x + 17, y + 22, 26, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this.state === GAME_STATE.GAME_OVER) {
      // Dizzy / Defeated sitting pose
      ctx.fillStyle = '#0284c7'; // Ninja suit
      ctx.beginPath();
      ctx.arc(x + 17, y + 26, 12, 0, Math.PI * 2);
      ctx.fill();

      // Swirling Dizzy Stars
      const starAngle = this.time * 0.12;
      for (let i = 0; i < 3; i++) {
        const a = starAngle + (i * Math.PI * 2) / 3;
        const sx = x + 17 + Math.cos(a) * 16;
        const sy = y + 8 + Math.sin(a) * 6;
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(sx, sy, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      return;
    }

    // Normal & Jumping / Running Ninja
    const bob = n.isGrounded ? (n.runFrame % 2 === 0 ? 0 : 2) : -3;

    // Headband ribbon fluttering behind
    const ribbonWave1 = Math.sin(this.time * 0.3) * 6;
    const ribbonWave2 = Math.cos(this.time * 0.3) * 6;
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 6, y + 10 + bob);
    ctx.quadraticCurveTo(x - 10, y + 8 + ribbonWave1 + bob, x - 22, y + 14 + ribbonWave1 + bob);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 6, y + 12 + bob);
    ctx.quadraticCurveTo(x - 8, y + 14 + ribbonWave2 + bob, x - 18, y + 20 + ribbonWave2 + bob);
    ctx.stroke();

    // Body / Suit (Toolio Cyan)
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.roundRect(x + 6, y + 18 + bob, 22, 18, 6);
    ctx.fill();

    // Head (Chibi round head)
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(x + 17, y + 12 + bob, 12, 0, Math.PI * 2);
    ctx.fill();

    // Face cut-out (skin tone)
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.ellipse(x + 20, y + 12 + bob, 7, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Expressive Eyes
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x + 19, y + 10 + bob, 3, 4);
    ctx.fillRect(x + 24, y + 10 + bob, 3, 4);
    // Eye shine
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 20, y + 10 + bob, 1, 1);
    ctx.fillRect(x + 25, y + 10 + bob, 1, 1);

    // Red Headband
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(x + 5, y + 6 + bob, 24, 4);

    // Running Legs
    ctx.fillStyle = '#0f172a';
    if (n.isGrounded) {
      if (n.runFrame === 0 || n.runFrame === 2) {
        ctx.fillRect(x + 10, y + 36 + bob, 5, 8);
        ctx.fillRect(x + 19, y + 36 + bob, 5, 8);
      } else {
        ctx.fillRect(x + 6, y + 34 + bob, 6, 8);
        ctx.fillRect(x + 22, y + 34 + bob, 6, 8);
      }
    } else {
      // Jump tucked pose
      ctx.fillRect(x + 12, y + 34 + bob, 10, 6);
    }

    // Slash Sword Swing & Blade Arc Trail
    if (n.isSlashing) {
      // Radiant Glowing Crescent Blade Arc
      const grad = ctx.createLinearGradient(x + 20, y - 10, x + 80, y + 35);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      grad.addColorStop(0.4, 'rgba(56, 189, 248, 0.85)');
      grad.addColorStop(1, 'rgba(251, 191, 36, 0.1)');

      ctx.strokeStyle = grad;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(x + 30, y + 18, 38, -Math.PI * 0.4, Math.PI * 0.4);
      ctx.stroke();

      // Katana Blade
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x + 24, y + 18 + bob);
      ctx.lineTo(x + 60, y + 12 + bob);
      ctx.stroke();
    }
    ctx.restore();
  }

  renderParticles() {
    const ctx = this.ctx;
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;

      if (p.type === 'snip-beam') {
        ctx.fillRect(p.x, p.y - 3, 22, 6);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size || 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  renderToasts() {
    const ctx = this.ctx;
    for (const t of this.toasts) {
      ctx.save();
      ctx.globalAlpha = t.alpha;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      ctx.roundRect(t.x, t.y, 160, 22, 6);
      ctx.fill();

      ctx.fillStyle = t.color || '#38bdf8';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(t.text, t.x + 8, t.y + 11);
      ctx.restore();
    }
  }

  renderHUD(biome) {
    const ctx = this.ctx;
    ctx.save();

    // Top Left: Biome info badge
    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.beginPath();
    ctx.roundRect(14, 12, 150, 22, 6);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${biome.country === 'JP' ? '🗾' : '🇻🇳'} ${biome.name}`, 22, 23);

    // Top Right: Realtime Distance & Problems Solved
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.beginPath();
    ctx.roundRect(this.width - 190, 12, 176, 26, 8);
    ctx.fill();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.floor(this.distance)} m`, this.width - 180, 25);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`✓ ${this.problemsSolved}`, this.width - 24, 25);

    // Combo Floating Indicator
    if (this.combo >= 2 && this.state === GAME_STATE.PLAYING) {
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${this.combo}x COMBO!`, 14, 52);
    }

    // Ready State Tutorial prompt
    if (this.state === GAME_STATE.READY) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      ctx.roundRect(this.width / 2 - 130, this.height / 2 - 35, 260, 70, 14);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('TOOLIO NINJA RUN', this.width / 2, this.height / 2 - 12);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('SPACE / TAP = JUMP  •  X / J = SLASH', this.width / 2, this.height / 2 + 12);
    }

    ctx.restore();
  }
}
