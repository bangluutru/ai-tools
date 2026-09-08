/**
 * @file packages/core/src/utils/flappy/gameSounds.js
 * ============================================================================
 * Âm thanh cho mini game Flappy Bird — Web Audio để phát, thẻ <audio> im lặng
 * để giữ phiên playback trên iOS Safari.
 *
 * Tái tạo chính xác bộ âm thanh oscillator từ genki-portal:
 * - flap: tiếng đập cánh (triangle, exp sweep 400->800Hz)
 * - point: tiếng ăn điểm (square, step sweep 523.25->880Hz)
 * - hit: tiếng va chạm (sawtooth, linear sweep 150->40Hz)
 * - die: tiếng rơi (sawtooth, linear sweep 300->80Hz)
 * ============================================================================
 */

const SPECS = {
  flap: { wave: 'triangle', sweep: 'exp', freqStart: 400, freqEnd: 800, duration: 0.08, gainStart: 0.15, gainEnd: 0.01 },
  point: { wave: 'square', sweep: 'step', freqStart: 523.25, freqEnd: 880, stepAt: 0.08, duration: 0.25, gainStart: 0.1, gainEnd: 0.01 },
  hit: { wave: 'sawtooth', sweep: 'linear', freqStart: 150, freqEnd: 40, duration: 0.12, gainStart: 0.2, gainEnd: 0.01 },
  die: { wave: 'sawtooth', sweep: 'linear', freqStart: 300, freqEnd: 80, duration: 0.3, gainStart: 0.15, gainEnd: 0.01 },
};

function waveform(wave, phase) {
  const sin = Math.sin(phase);
  if (wave === 'square') return sin >= 0 ? 1 : -1;
  if (wave === 'triangle') return (2 / Math.PI) * Math.asin(sin);
  const cycles = phase / (2 * Math.PI);
  return 2 * (cycles - Math.floor(cycles + 0.5));
}

function frequencyAt(spec, t) {
  const progress = Math.min(1, t / spec.duration);
  if (spec.sweep === 'step') return t < (spec.stepAt ?? 0) ? spec.freqStart : spec.freqEnd;
  if (spec.sweep === 'exp') return spec.freqStart * Math.pow(spec.freqEnd / spec.freqStart, progress);
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

let silentClip = null;
function silentWavUrl() {
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

export class GameSoundPlayer {
  constructor() {
    this.ctx = null;
    this.buffers = new Map();
    this.keepAlive = null;
    this.primed = false;
    this.disposed = false;
  }

  ensureContext() {
    if (this.disposed) return null;
    if (!this.ctx) {
      const AC =
        window.AudioContext ||
        window.webkitAudioContext;
      if (!AC) return null;
      try {
        this.ctx = new AC();
      } catch {
        return null;
      }

      for (const name of Object.keys(SPECS)) {
        try {
          this.buffers.set(name, buildBuffer(this.ctx, SPECS[name]));
        } catch {
          /* ignore buffer build errors */
        }
      }
    }
    return this.ctx;
  }

  prime() {
    if (this.disposed) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      void ctx.resume().catch(() => {});
    }
    if (this.primed) return;
    this.primed = true;

    try {
      const el = new Audio(silentWavUrl());
      el.loop = true;
      el.preload = 'auto';
      el.setAttribute('playsinline', '');
      el.volume = 1;
      void el.play().catch(() => {});
      this.keepAlive = el;
    } catch {
      /* ignore */
    }
  }

  play(name) {
    if (this.disposed) return;
    const ctx = this.ctx;
    if (!ctx) return;
    if (ctx.state === 'running') {
      this.emit(ctx, name);
      return;
    }

    ctx.resume()
      .then(() => {
        if (!this.disposed && ctx.state === 'running') this.emit(ctx, name);
      })
      .catch(() => {});
  }

  emit(ctx, name) {
    const buffer = this.buffers.get(name);
    if (!buffer) return;
    try {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
    } catch {
      /* ignore */
    }
  }

  dispose() {
    this.disposed = true;
    if (this.keepAlive) {
      try {
        this.keepAlive.pause();
        this.keepAlive.loop = false;
        this.keepAlive.src = '';
      } catch {
        /* ignore */
      }
      this.keepAlive = null;
    }
    this.buffers.clear();
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}
