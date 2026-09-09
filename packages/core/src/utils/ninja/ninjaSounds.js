/**
 * @file packages/core/src/utils/ninja/ninjaSounds.js
 * ============================================================================
 * Bộ tổng hợp âm thanh Web Audio thuần cho mini-game Toolio Ninja Run.
 *
 * 100% Client-side procedural audio:
 * - Không tải bất kỳ file mp3/wav ngoài nào (0KB asset, 0 delay, 100% offline).
 * - Tự động mở khóa phiên âm thanh trên iOS Safari & mobile browsers qua silent keepalive.
 * - Âm thanh arcade êm ái, thân thiện, vui tươi:
 *   + jump: tiếng bật nhảy vút lên mềm mại
 *   + slash: tiếng vung kiếm sắc bén (filtered noise + pitch drop)
 *   + break: tiếng nổ vỡ mảnh ghép pha lê + chuông tươi vui khi giải quyết vấn đề
 *   + combo: hợp âm ngũ cung vui nhộn tăng dần theo chuỗi combo (3x, 5x, 10x)
 *   + powerup: tiếng arpeggio hào hứng khi nhặt được Toolio Boost / Shield
 *   + hit: tiếng va chạm nhẹ nhàng (thump)
 *   + gameover: chuỗi nốt hoạt hình dí dỏm kết thúc màn chơi
 * ============================================================================
 */

export const SOUND_STORAGE_KEY = 'toolio_ninja_sound_enabled';

const SOUND_SPECS = {
  jump: {
    wave: 'sine',
    sweep: 'exp',
    freqStart: 280,
    freqEnd: 620,
    duration: 0.12,
    gainStart: 0.18,
    gainEnd: 0.001,
  },
  slash: {
    wave: 'sawtooth',
    sweep: 'linear',
    freqStart: 750,
    freqEnd: 180,
    duration: 0.14,
    gainStart: 0.22,
    gainEnd: 0.001,
  },
  break: {
    wave: 'triangle',
    sweep: 'exp',
    freqStart: 580,
    freqEnd: 1160,
    duration: 0.18,
    gainStart: 0.2,
    gainEnd: 0.001,
  },
  hit: {
    wave: 'sawtooth',
    sweep: 'linear',
    freqStart: 180,
    freqEnd: 60,
    duration: 0.2,
    gainStart: 0.25,
    gainEnd: 0.001,
  },
  powerup: {
    wave: 'sine',
    sweep: 'exp',
    freqStart: 440,
    freqEnd: 880,
    duration: 0.28,
    gainStart: 0.2,
    gainEnd: 0.001,
  },
  gameover: {
    wave: 'triangle',
    sweep: 'linear',
    freqStart: 380,
    freqEnd: 140,
    duration: 0.45,
    gainStart: 0.18,
    gainEnd: 0.001,
  },
};

function waveform(wave, phase) {
  const sin = Math.sin(phase);
  if (wave === 'square') return sin >= 0 ? 1 : -1;
  if (wave === 'triangle') return (2 / Math.PI) * Math.asin(sin);
  if (wave === 'sawtooth') {
    const cycles = phase / (2 * Math.PI);
    return 2 * (cycles - Math.floor(cycles + 0.5));
  }
  return sin;
}

function frequencyAt(spec, t) {
  const progress = Math.min(1, t / spec.duration);
  if (spec.sweep === 'exp') {
    return spec.freqStart * Math.pow(spec.freqEnd / spec.freqStart, progress);
  }
  return spec.freqStart + (spec.freqEnd - spec.freqStart) * progress;
}

function buildBuffer(ctx, spec) {
  const total = Math.max(1, Math.floor(ctx.sampleRate * spec.duration));
  const buffer = ctx.createBuffer(1, total, ctx.sampleRate);
  const channel = buffer.getChannelData(0);
  let phase = 0;
  for (let i = 0; i < total; i++) {
    const seconds = i / ctx.sampleRate;
    const progress = i / total;
    phase += (2 * Math.PI * frequencyAt(spec, seconds)) / ctx.sampleRate;
    const gain = spec.gainStart + (spec.gainEnd - spec.gainStart) * progress;
    channel[i] = waveform(spec.wave, phase) * gain;
  }
  return buffer;
}

// Silent wav generator for iOS audio priming
let silentClip = null;
function getSilentWavUrl() {
  if (silentClip) return silentClip;
  const sampleRate = 8000;
  const total = sampleRate / 2;
  const bytes = new Uint8Array(44 + total * 2);
  const view = new DataView(bytes.buffer);
  const writeText = (offset, text) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };
  writeText(0, 'RIFF');
  view.setUint32(4, 36 + total * 2, true);
  writeText(8, 'WAVE');
  writeText(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeText(36, 'data');
  view.setUint32(40, total * 2, true);

  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  silentClip = `data:audio/wav;base64,${btoa(binary)}`;
  return silentClip;
}

export class NinjaSoundPlayer {
  constructor() {
    this.ctx = null;
    this.buffers = new Map();
    this.keepAlive = null;
    this.primed = false;
    this.disposed = false;
    this.enabled = this.readStoredState();
  }

  readStoredState() {
    try {
      const stored = localStorage.getItem(SOUND_STORAGE_KEY);
      return stored !== 'false';
    } catch {
      return true;
    }
  }

  saveStoredState(val) {
    this.enabled = val;
    try {
      localStorage.setItem(SOUND_STORAGE_KEY, String(val));
    } catch {}
  }

  toggle() {
    this.saveStoredState(!this.enabled);
    if (this.enabled) this.prime();
    return this.enabled;
  }

  ensureContext() {
    if (this.disposed) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      try {
        this.ctx = new AudioCtx();
      } catch {
        return null;
      }

      for (const [name, spec] of Object.entries(SOUND_SPECS)) {
        try {
          this.buffers.set(name, buildBuffer(this.ctx, spec));
        } catch {}
      }
    }
    return this.ctx;
  }

  prime() {
    if (this.disposed || !this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      void ctx.resume().catch(() => {});
    }
    if (this.primed) return;
    this.primed = true;

    try {
      const el = new Audio(getSilentWavUrl());
      el.loop = true;
      el.preload = 'auto';
      el.setAttribute('playsinline', '');
      el.volume = 0.01;
      void el.play().catch(() => {});
      this.keepAlive = el;
    } catch {}
  }

  play(name) {
    if (!this.enabled || this.disposed) return;
    const ctx = this.ctx || this.ensureContext();
    if (!ctx) return;

    if (ctx.state === 'running') {
      this.emitBuffer(ctx, name);
      return;
    }

    ctx
      .resume()
      .then(() => {
        if (!this.disposed && ctx.state === 'running') this.emitBuffer(ctx, name);
      })
      .catch(() => {});
  }

  emitBuffer(ctx, name) {
    const buffer = this.buffers.get(name);
    if (!buffer) return;
    try {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
    } catch {}
  }

  playCombo(multiplier) {
    if (!this.enabled || this.disposed) return;
    const ctx = this.ctx || this.ensureContext();
    if (!ctx) return;

    // Pentatonic ascending chime
    const baseNotes = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
    const index = Math.min(baseNotes.length - 1, Math.max(0, multiplier - 2));
    const freq = baseNotes[index];

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {}
  }

  dispose() {
    this.disposed = true;
    if (this.keepAlive) {
      try {
        this.keepAlive.pause();
        this.keepAlive.loop = false;
        this.keepAlive.src = '';
      } catch {}
      this.keepAlive = null;
    }
    this.buffers.clear();
    if (this.ctx) {
      try {
        this.ctx.close().catch(() => {});
      } catch {}
      this.ctx = null;
    }
  }
}
