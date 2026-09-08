/**
 * @file packages/core/src/utils/flappy/flappyEngine.js
 * ============================================================================
 * Flappy Bird Game Engine — Khung vẽ Canvas 2D độc lập với Relaxed Easy Mode.
 *
 * Chạy trên raw Canvas 2D không phụ thuộc React state re-render:
 * - Hệ tọa độ logic: 360x540
 * - Tần số tham chiếu: 60fps (FRAME_MS = 1000 / 60)
 * - Tự thích ứng màn hình 120Hz / 60Hz qua normalized delta-time `step`
 * - Âm thanh Web Audio qua GameSoundPlayer
 * - Lưu điểm cao nhất vào localStorage (hỗ trợ ai_tools_flappy_best_score và flappy_best_score)
 * ============================================================================
 */

import { GameSoundPlayer } from './gameSounds.js';

export const STATE = {
  GET_READY: 0,
  PLAYING: 1,
  GAME_OVER: 2,
};

export const BEST_SCORE_KEY = 'ai_tools_flappy_best_score';
const LEGACY_BEST_SCORE_KEY = 'flappy_best_score';

export const GAME_WIDTH = 360;
export const GAME_HEIGHT = 540;
export const FRAME_MS = 1000 / 60;
export const MAX_DPR = 2;

function readBestScore() {
  try {
    const raw = localStorage.getItem(BEST_SCORE_KEY) ?? localStorage.getItem(LEGACY_BEST_SCORE_KEY);
    if (!raw) return 0;
    const num = Number(JSON.parse(raw));
    return Number.isFinite(num) && num > 0 ? num : 0;
  } catch {
    return 0;
  }
}

function writeBestScore(score) {
  try {
    localStorage.setItem(BEST_SCORE_KEY, JSON.stringify(score));
  } catch {
    /* ignore quota / private mode errors */
  }
}

export class FlappyEngine {
  constructor(ctx) {
    this.ctx = ctx;
    this.width = GAME_WIDTH;
    this.height = GAME_HEIGHT;
    this.currentState = STATE.GET_READY;
    this.score = 0;
    this.bestScore = readBestScore();
    this.medal = null;
    this.canRestart = false;

    // Physics (Relaxed Easy Mode)
    this.gravity = 0.17;
    this.jumpForce = -4.2;
    this.groundHeight = 90;
    this.gameSpeed = 1.4;

    // Scrolling & Effects
    this.bgX = 0;
    this.groundX = 0;
    this.flashAlpha = 0;

    // Objects
    this.bird = {
      x: 70,
      y: 220,
      width: 32,
      height: 24,
      velocity: 0,
      rotation: 0,
      wingFrame: 0,
      wingTimer: 0,
    };
    this.pipes = [];
    this.pipeGap = 135;
    this.pipeWidth = 52;
    this.pipeSpawnTimer = 0;

    // Audio
    this.sounds = new GameSoundPlayer();
    this.isSoundOn = true;

    // Animation & Lifecycle
    this.rafId = 0;
    this.lastFrame = 0;
    this.destroyed = false;
    this.timers = [];

    // Score callback (optional observer for React UI)
    this.onScoreChange = null;
    this.onStateChange = null;
  }

  start() {
    this.rafId = requestAnimationFrame(this.loop);
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.rafId);
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.sounds.dispose();
  }

  handleAction() {
    if (this.currentState === STATE.GET_READY) {
      this.currentState = STATE.PLAYING;
      this.onStateChange?.(this.currentState);
      this.flapBird();
    } else if (this.currentState === STATE.PLAYING) {
      this.flapBird();
    } else if (this.currentState === STATE.GAME_OVER && this.canRestart) {
      this.resetGame();
    }
  }

  unlockAudio() {
    if (this.destroyed) return;
    this.sounds.prime();
  }

  playSound(type) {
    if (!this.isSoundOn || this.destroyed) return;
    this.sounds.play(type);
  }

  flapBird() {
    this.bird.velocity = this.jumpForce;
    this.bird.rotation = -20 * (Math.PI / 180);
    this.playSound('flap');
  }

  resetGame() {
    this.score = 0;
    this.onScoreChange?.(this.score);
    this.bird.y = 220;
    this.bird.velocity = 0;
    this.bird.rotation = 0;
    this.bird.wingFrame = 0;
    this.pipes = [];
    this.pipeSpawnTimer = 0;
    this.currentState = STATE.GET_READY;
    this.canRestart = false;
    this.onStateChange?.(this.currentState);
  }

  triggerGameOver() {
    this.currentState = STATE.GAME_OVER;
    this.onStateChange?.(this.currentState);
    this.flashAlpha = 0.8;
    this.playSound('hit');
    this.timers.push(setTimeout(() => this.playSound('die'), 120));

    if (this.score >= 40) this.medal = 'platinum';
    else if (this.score >= 20) this.medal = 'gold';
    else if (this.score >= 10) this.medal = 'silver';
    else if (this.score >= 5) this.medal = 'bronze';
    else this.medal = null;

    this.timers.push(
      setTimeout(() => {
        this.canRestart = true;
      }, 400)
    );
  }

  update(step) {
    if (this.currentState !== STATE.GAME_OVER) {
      this.bgX = (this.bgX + 0.4 * step) % this.width;
      this.groundX = (this.groundX + this.gameSpeed * step) % 14;
    }

    this.bird.wingTimer += step;
    if (this.bird.wingTimer >= 6) {
      this.bird.wingTimer -= 6;
      this.bird.wingFrame = (this.bird.wingFrame + 1) % 3;
    }

    if (this.currentState === STATE.GET_READY) {
      this.bird.y = 220 + Math.sin(performance.now() / 200) * 5;
      return;
    }

    this.bird.velocity += this.gravity * step;
    this.bird.y += this.bird.velocity * step;

    if (this.bird.velocity > 2) {
      this.bird.rotation += 4 * (Math.PI / 180) * step;
      if (this.bird.rotation > 70 * (Math.PI / 180)) {
        this.bird.rotation = 70 * (Math.PI / 180);
      }
    }

    const floorY = this.height - this.groundHeight - this.bird.height / 2;
    if (this.bird.y >= floorY) {
      this.bird.y = floorY;
      if (this.currentState === STATE.PLAYING) this.triggerGameOver();
    }
    if (this.bird.y <= 0) {
      this.bird.y = 0;
      this.bird.velocity = 0;
    }

    if (this.currentState === STATE.PLAYING) {
      this.pipeSpawnTimer += step;
      if (this.pipeSpawnTimer >= 115) {
        this.pipeSpawnTimer -= 115;
        const minTop = 60;
        const maxTop = this.height - this.groundHeight - this.pipeGap - 60;
        const topH = Math.floor(Math.random() * (maxTop - minTop + 1)) + minTop;
        this.pipes.push({
          x: this.width,
          topHeight: topH,
          bottomY: topH + this.pipeGap,
          passed: false,
        });
      }

      for (let i = this.pipes.length - 1; i >= 0; i--) {
        const pipe = this.pipes[i];
        pipe.x -= this.gameSpeed * step;

        const bL = this.bird.x - this.bird.width / 2 + 7;
        const bR = this.bird.x + this.bird.width / 2 - 7;
        const bT = this.bird.y - this.bird.height / 2 + 7;
        const bB = this.bird.y + this.bird.height / 2 - 7;

        if (bR > pipe.x && bL < pipe.x + this.pipeWidth) {
          if (bT < pipe.topHeight || bB > pipe.bottomY) {
            this.triggerGameOver();
          }
        }

        if (!pipe.passed && bL > pipe.x + this.pipeWidth) {
          pipe.passed = true;
          this.score++;
          this.onScoreChange?.(this.score);
          this.playSound('point');
          if (this.score > this.bestScore) {
            this.bestScore = this.score;
            writeBestScore(this.bestScore);
          }
        }

        if (pipe.x + this.pipeWidth < 0) {
          this.pipes.splice(i, 1);
        }
      }
    }

    if (this.flashAlpha > 0) {
      this.flashAlpha -= 0.05 * step;
    }
  }

  render() {
    const ctx = this.ctx;

    // Sky
    ctx.fillStyle = '#70C5CE';
    ctx.fillRect(0, 0, this.width, this.height);

    // City Silhouette
    ctx.fillStyle = '#CBEAEC';
    ctx.fillRect(0, this.height - this.groundHeight - 40, this.width, 40);
    ctx.fillStyle = '#89D9D3';
    for (let x = -this.bgX; x < this.width + 40; x += 30) {
      const h = 25 + Math.abs(Math.sin(x * 0.05)) * 20;
      ctx.fillRect(x, this.height - this.groundHeight - h, 22, h);
    }

    // Clouds
    ctx.fillStyle = '#FFFFFF';
    ctx.globalAlpha = 0.85;
    for (let x = -this.bgX * 0.5; x < this.width + 100; x += 120) {
      ctx.beginPath();
      ctx.arc(x, 160, 20, 0, Math.PI * 2);
      ctx.arc(x + 15, 150, 25, 0, Math.PI * 2);
      ctx.arc(x + 35, 160, 18, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Pipes
    this.pipes.forEach((pipe) => this.drawPipe(ctx, pipe));

    // Ground
    const gy = this.height - this.groundHeight;
    ctx.fillStyle = '#73BF2E';
    ctx.fillRect(0, gy, this.width, 14);
    ctx.fillStyle = '#558022';
    ctx.fillRect(0, gy + 12, this.width, 3);
    ctx.fillStyle = '#DED895';
    ctx.fillRect(0, gy + 15, this.width, this.groundHeight - 15);
    ctx.fillStyle = '#D39E4C';
    ctx.beginPath();
    for (let x = -this.groundX; x < this.width + 20; x += 14) {
      ctx.moveTo(x, gy + 15);
      ctx.lineTo(x - 8, gy + this.groundHeight);
      ctx.lineTo(x - 3, gy + this.groundHeight);
      ctx.lineTo(x + 5, gy + 15);
    }
    ctx.fill();

    // Bird
    this.drawBird(ctx);

    // In-game Overlays
    if (this.currentState === STATE.GET_READY) this.drawGetReady(ctx);
    else if (this.currentState === STATE.PLAYING) this.drawScore(ctx);
    else if (this.currentState === STATE.GAME_OVER) this.drawGameOver(ctx);

    // Flash on collision
    if (this.flashAlpha > 0) {
      ctx.fillStyle = `rgba(255,255,255,${this.flashAlpha})`;
      ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  drawPipe(ctx, pipe) {
    const pw = this.pipeWidth;
    // Top pipe body
    ctx.fillStyle = '#73BF2E';
    ctx.fillRect(pipe.x, 0, pw, pipe.topHeight);
    ctx.fillStyle = '#9CE659';
    ctx.fillRect(pipe.x + 4, 0, 5, pipe.topHeight);
    ctx.fillStyle = '#558022';
    ctx.fillRect(pipe.x + pw - 6, 0, 4, pipe.topHeight);
    ctx.strokeStyle = '#2E4C00';
    ctx.lineWidth = 2;
    ctx.strokeRect(pipe.x, 0, pw, pipe.topHeight);

    // Top cap
    ctx.fillStyle = '#73BF2E';
    ctx.fillRect(pipe.x - 3, pipe.topHeight - 24, pw + 6, 24);
    ctx.fillStyle = '#9CE659';
    ctx.fillRect(pipe.x - 1, pipe.topHeight - 24, 5, 24);
    ctx.strokeRect(pipe.x - 3, pipe.topHeight - 24, pw + 6, 24);

    // Bottom pipe body
    const botH = this.height - this.groundHeight - pipe.bottomY;
    ctx.fillStyle = '#73BF2E';
    ctx.fillRect(pipe.x, pipe.bottomY, pw, botH);
    ctx.fillStyle = '#9CE659';
    ctx.fillRect(pipe.x + 4, pipe.bottomY, 5, botH);
    ctx.fillStyle = '#558022';
    ctx.fillRect(pipe.x + pw - 6, pipe.bottomY, 4, botH);
    ctx.strokeRect(pipe.x, pipe.bottomY, pw, botH);

    // Bottom cap
    ctx.fillStyle = '#73BF2E';
    ctx.fillRect(pipe.x - 3, pipe.bottomY, pw + 6, 24);
    ctx.fillStyle = '#9CE659';
    ctx.fillRect(pipe.x - 1, pipe.bottomY, 5, 24);
    ctx.strokeRect(pipe.x - 3, pipe.bottomY, pw + 6, 24);
  }

  drawBird(ctx) {
    ctx.save();
    ctx.translate(this.bird.x, this.bird.y);
    ctx.rotate(this.bird.rotation);
    const bw = this.bird.width;
    const bh = this.bird.height;

    // Body
    ctx.fillStyle = '#F8E048';
    ctx.beginPath();
    ctx.ellipse(0, 0, bw / 2, bh / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Eye
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(6, -4, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(8, -4, 2, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = '#E86100';
    ctx.beginPath();
    ctx.ellipse(10, 4, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Wing
    const wyOff = [2, 0, -3];
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.ellipse(-6, wyOff[this.bird.wingFrame], 8, 5, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  drawScore(ctx) {
    ctx.font = '28px monospace';
    ctx.fillStyle = '#FFF';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.textAlign = 'center';
    const t = this.score.toString();
    ctx.strokeText(t, this.width / 2, 70);
    ctx.fillText(t, this.width / 2, 70);
  }

  drawGetReady(ctx) {
    ctx.font = '18px monospace';
    ctx.fillStyle = '#E86100';
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 3;
    ctx.textAlign = 'center';
    ctx.strokeText('GET READY!', this.width / 2, 170);
    ctx.fillText('GET READY!', this.width / 2, 170);
    ctx.font = '11px monospace';
    ctx.fillStyle = '#FFF';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeText('TAP / SPACE TO FLY', this.width / 2, 280);
    ctx.fillText('TAP / SPACE TO FLY', this.width / 2, 280);
  }

  drawGameOver(ctx) {
    ctx.font = '20px monospace';
    ctx.fillStyle = '#E86100';
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 4;
    ctx.textAlign = 'center';
    ctx.strokeText('GAME OVER', this.width / 2, 140);
    ctx.fillText('GAME OVER', this.width / 2, 140);

    const bx = (this.width - 240) / 2;
    const by = 170;
    const bw = 240;
    const bh = 140;
    ctx.fillStyle = '#DED895';
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = '#543847';
    ctx.lineWidth = 4;
    ctx.strokeRect(bx, by, bw, bh);

    ctx.font = '9px monospace';
    ctx.fillStyle = '#E86100';
    ctx.textAlign = 'left';
    ctx.fillText('MEDAL', bx + 20, by + 35);

    if (this.medal) {
      const mx = bx + 44;
      const my = by + 75;
      const colors = {
        bronze: '#CD7F32',
        silver: '#C0C0C0',
        gold: '#FFD700',
        platinum: '#E5E4E2',
      };
      ctx.fillStyle = colors[this.medal] || '#FFD700';
      ctx.beginPath();
      ctx.arc(mx, my, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#FFF';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('★', mx, my + 4);
    }

    ctx.textAlign = 'right';
    ctx.fillStyle = '#E86100';
    ctx.font = '9px monospace';
    ctx.fillText('SCORE', bx + bw - 20, by + 35);
    ctx.font = '16px monospace';
    ctx.fillStyle = '#000';
    ctx.fillText(this.score.toString(), bx + bw - 20, by + 60);
    ctx.font = '9px monospace';
    ctx.fillStyle = '#E86100';
    ctx.fillText('BEST', bx + bw - 20, by + 90);
    ctx.font = '16px monospace';
    ctx.fillStyle = '#000';
    ctx.fillText(this.bestScore.toString(), bx + bw - 20, by + 115);

    ctx.font = '10px monospace';
    ctx.fillStyle = '#FFF';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.textAlign = 'center';
    ctx.strokeText('TAP TO PLAY AGAIN', this.width / 2, 350);
    ctx.fillText('TAP TO PLAY AGAIN', this.width / 2, 350);
  }

  loop = (now) => {
    if (this.destroyed) return;
    const elapsed = this.lastFrame === 0 ? FRAME_MS : now - this.lastFrame;
    this.lastFrame = now;
    const step = Math.min(elapsed / FRAME_MS, 3);
    this.update(step);
    this.render();
    this.rafId = requestAnimationFrame(this.loop);
  };
}
