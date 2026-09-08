/**
 * @file packages/core/src/utils/screen-recorder/recorderEngine.js
 * ============================================================================
 * Ultra-lightweight Screen Recording Engine for in-browser client-side capture.
 * Designed for low-end hardware: minimal CPU/GPU overhead, no canvas redraw loop,
 * native Direct-to-Disk streaming (0 MB RAM overhead), and multi-source audio mixing.
 * ============================================================================
 */

import { patchWebmDuration } from './ebmlPatcher.js';

export const RECORDER_PRESETS = {
  low: {
    id: 'low',
    label_vn: 'Tiết kiệm CPU (720p • 24fps)',
    label_en: 'Low CPU Saver (720p • 24fps)',
    label_ja: 'CPU節約モード (720p • 24fps)',
    desc_vn: 'Tối ưu cho máy yếu / RAM 4GB, tải CPU cực thấp, máy mát.',
    desc_en: 'Optimized for low-spec PCs / 4GB RAM, ultra-low CPU load.',
    desc_ja: '低スペックPC・4GB RAM向け、CPU負荷を最小限に抑制。',
    width: 1280,
    height: 720,
    fps: 24,
    videoBitrate: 1500000, // 1.5 Mbps
  },
  standard: {
    id: 'standard',
    label_vn: 'Tiêu chuẩn HD (1080p • 30fps)',
    label_en: 'Standard HD (1080p • 30fps)',
    label_ja: '標準HD (1080p • 30fps)',
    desc_vn: 'Cân bằng hoàn hảo giữa độ nét và hiệu suất (Khuyên dùng).',
    desc_en: 'Perfect balance of clarity and efficiency (Recommended).',
    desc_ja: '鮮明度と動作効率の黄金バランス（推奨）。',
    width: 1920,
    height: 1080,
    fps: 30,
    videoBitrate: 2500000, // 2.5 Mbps
  },
  high: {
    id: 'high',
    label_vn: 'Mượt mà (1080p • 60fps)',
    label_en: 'Smooth Motion (1080p • 60fps)',
    label_ja: '滑らか高画質 (1080p • 60fps)',
    desc_vn: 'Dành cho máy mạnh, chuyển động mượt mà sắc nét.',
    desc_en: 'For higher-spec PCs, ultra smooth motion.',
    desc_ja: '高性能PC向け、滑らかな動きを記録。',
    width: 1920,
    height: 1080,
    fps: 60,
    videoBitrate: 4500000, // 4.5 Mbps
  },
};

export const AUDIO_SOURCES = {
  NONE: 'none',
  SYSTEM: 'system',
  MIC: 'mic',
  BOTH: 'both',
};

/**
 * Detects the most efficient supported MIME type for MediaRecorder.
 * Prioritizes VP8 for universal hardware acceleration on integrated GPUs.
 */
export function getOptimalMimeType() {
  if (typeof MediaRecorder === 'undefined') return '';

  const candidates = [
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=h264,opus',
    'video/webm;codecs=vp9,opus',
    'video/mp4;codecs=avc1,mp4a.40.2',
    'video/webm',
    'video/mp4',
  ];

  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) {
      return mime;
    }
  }
  return '';
}

/**
 * Checks if the browser supports Direct-to-Disk streaming via File System Access API.
 */
export function isDirectToDiskSupported() {
  return typeof window !== 'undefined' && typeof window.showSaveFilePicker === 'function';
}

/**
 * Screen Recorder Engine Session
 */
export class ScreenRecorderSession {
  constructor(options = {}) {
    this.preset = RECORDER_PRESETS[options.presetId] || RECORDER_PRESETS.standard;
    this.audioSource = options.audioSource || AUDIO_SOURCES.NONE;
    this.directToDisk = options.directToDisk && isDirectToDiskSupported();
    this.onStateChange = options.onStateChange || (() => {});
    this.onProgress = options.onProgress || (() => {});
    this.onError = options.onError || (() => {});

    this.mediaRecorder = null;
    this.displayStream = null;
    this.micStream = null;
    this.combinedStream = null;
    this.audioContext = null;
    this.fileWritable = null;
    this.fileHandle = null;

    this.chunks = [];
    this.recordedBytes = 0;
    this.startTime = 0;
    this.elapsedMs = 0;
    this.timerInterval = null;
    this.status = 'idle'; // 'idle' | 'preparing' | 'recording' | 'paused' | 'stopped'
  }

  /**
   * Initializes display capture and audio mixing, then starts recording.
   */
  async start() {
    try {
      this.status = 'preparing';
      this.onStateChange(this.status);

      // 1. Direct-to-disk file picker if selected
      if (this.directToDisk) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        this.fileHandle = await window.showSaveFilePicker({
          suggestedName: `screen-record-${timestamp}.webm`,
          types: [
            {
              description: 'WebM Video File',
              accept: { 'video/webm': ['.webm'] },
            },
          ],
        });
        this.fileWritable = await this.fileHandle.createWritable();
      }

      // 2. Request Display Stream
      const hasSystemAudio =
        this.audioSource === AUDIO_SOURCES.SYSTEM || this.audioSource === AUDIO_SOURCES.BOTH;

      this.displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'monitor',
          frameRate: { ideal: this.preset.fps, max: this.preset.fps },
          width: { ideal: this.preset.width, max: this.preset.width },
          height: { ideal: this.preset.height, max: this.preset.height },
        },
        audio: hasSystemAudio
          ? {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
            }
          : false,
        selfBrowserSurface: 'exclude',
        surfaceSwitching: 'include',
        systemAudio: hasSystemAudio ? 'include' : 'exclude',
      });

      // Handle user clicking "Stop sharing" on the browser native floating bar
      const videoTrack = this.displayStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.addEventListener('ended', () => {
          if (this.status === 'recording' || this.status === 'paused') {
            this.stop();
          }
        });
      }

      // 3. Request Microphone Stream if requested
      const hasMic =
        this.audioSource === AUDIO_SOURCES.MIC || this.audioSource === AUDIO_SOURCES.BOTH;
      if (hasMic) {
        try {
          this.micStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });
        } catch (micErr) {
          console.warn('[ScreenRecorder] Microphone permission denied or unavailable:', micErr);
          // Gracefully continue without mic if user denied
        }
      }

      // 4. Mix Audio Tracks via AudioContext
      const finalAudioTracks = [];
      const sysAudioTracks = this.displayStream.getAudioTracks();
      const micAudioTracks = this.micStream ? this.micStream.getAudioTracks() : [];

      if (sysAudioTracks.length > 0 && micAudioTracks.length > 0) {
        // Both available: Mix via Web Audio Context
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioCtx();
        const destination = this.audioContext.createMediaStreamDestination();

        const sysSource = this.audioContext.createMediaStreamSource(
          new MediaStream([sysAudioTracks[0]])
        );
        const micSource = this.audioContext.createMediaStreamSource(
          new MediaStream([micAudioTracks[0]])
        );

        sysSource.connect(destination);
        micSource.connect(destination);

        const mixedTrack = destination.stream.getAudioTracks()[0];
        if (mixedTrack) finalAudioTracks.push(mixedTrack);
      } else if (sysAudioTracks.length > 0) {
        finalAudioTracks.push(sysAudioTracks[0]);
      } else if (micAudioTracks.length > 0) {
        finalAudioTracks.push(micAudioTracks[0]);
      }

      // 5. Combine into single MediaStream
      this.combinedStream = new MediaStream([videoTrack, ...finalAudioTracks]);

      // 6. Initialize MediaRecorder
      const mimeType = getOptimalMimeType();
      const recorderOptions = {
        videoBitsPerSecond: this.preset.videoBitrate,
      };
      if (mimeType) {
        recorderOptions.mimeType = mimeType;
      }

      this.mediaRecorder = new MediaRecorder(this.combinedStream, recorderOptions);
      this.chunks = [];
      this.recordedBytes = 0;
      this.startTime = Date.now();
      this.elapsedMs = 0;

      // Handle data chunks every 1000ms
      this.mediaRecorder.ondataavailable = async (e) => {
        if (e.data && e.data.size > 0) {
          this.recordedBytes += e.data.size;
          if (this.fileWritable) {
            // Direct-to-Disk Stream: 0 MB RAM accumulation!
            try {
              await this.fileWritable.write(e.data);
            } catch (writeErr) {
              console.error('[ScreenRecorder] Error writing to disk stream:', writeErr);
            }
          } else {
            // Safe In-Memory Chunker
            this.chunks.push(e.data);
          }
          this.onProgress({
            recordedBytes: this.recordedBytes,
            elapsedMs: this.getElapsedMs(),
          });
        }
      };

      this.mediaRecorder.onstart = () => {
        this.status = 'recording';
        this.onStateChange(this.status);
        this.startTimer();
      };

      this.mediaRecorder.onpause = () => {
        this.status = 'paused';
        this.onStateChange(this.status);
      };

      this.mediaRecorder.onresume = () => {
        this.status = 'recording';
        this.onStateChange(this.status);
      };

      // Start recording in 1-second timeslices
      this.mediaRecorder.start(1000);
      return true;
    } catch (err) {
      this.cleanup();
      this.status = 'idle';
      this.onStateChange(this.status);
      this.onError(err);
      return false;
    }
  }

  startTimer() {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      if (this.status === 'recording') {
        this.onProgress({
          recordedBytes: this.recordedBytes,
          elapsedMs: this.getElapsedMs(),
        });
      }
    }, 500);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  getElapsedMs() {
    if (!this.startTime) return 0;
    return this.elapsedMs + (this.status === 'recording' ? Date.now() - this.startTime : 0);
  }

  pause() {
    if (this.mediaRecorder && this.status === 'recording') {
      this.elapsedMs += Date.now() - this.startTime;
      this.mediaRecorder.pause();
    }
  }

  resume() {
    if (this.mediaRecorder && this.status === 'paused') {
      this.startTime = Date.now();
      this.mediaRecorder.resume();
    }
  }

  /**
   * Stops recording and finalizes the output video.
   * Returns a promise resolving to { blob, url, durationMs, sizeBytes, directSaved, fileName }
   */
  async stop() {
    if (!this.mediaRecorder || this.status === 'stopped' || this.status === 'idle') {
      return null;
    }

    this.stopTimer();
    if (this.status === 'recording') {
      this.elapsedMs += Date.now() - this.startTime;
    }
    this.status = 'stopped';
    this.onStateChange(this.status);

    return new Promise((resolve) => {
      this.mediaRecorder.onstop = async () => {
        const totalDuration = Math.max(this.elapsedMs, 500);

        let resultBlob = null;
        let resultUrl = '';
        const isDirect = Boolean(this.fileWritable);
        const fileName = this.fileHandle ? this.fileHandle.name : null;

        if (this.fileWritable) {
          try {
            await this.fileWritable.close();
            this.fileWritable = null;
          } catch (closeErr) {
            console.error('[ScreenRecorder] Error closing file stream:', closeErr);
          }
        } else {
          // Merge chunks and patch EBML duration for seeking
          const mimeType = this.mediaRecorder.mimeType || 'video/webm';
          const rawBlob = new Blob(this.chunks, { type: mimeType });
          resultBlob = await patchWebmDuration(rawBlob, totalDuration);
          resultUrl = URL.createObjectURL(resultBlob);
        }

        const stats = {
          blob: resultBlob,
          url: resultUrl,
          durationMs: totalDuration,
          sizeBytes: this.recordedBytes,
          directSaved: isDirect,
          fileName,
          mimeType: this.mediaRecorder.mimeType || 'video/webm',
        };

        this.cleanupStreams();
        resolve(stats);
      };

      try {
        this.mediaRecorder.stop();
      } catch (err) {
        console.warn('[ScreenRecorder] MediaRecorder stop error:', err);
        this.cleanupStreams();
        resolve(null);
      }
    });
  }

  cleanupStreams() {
    if (this.displayStream) {
      this.displayStream.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {}
      });
      this.displayStream = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {}
      });
      this.micStream = null;
    }
    if (this.combinedStream) {
      this.combinedStream.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {}
      });
      this.combinedStream = null;
    }
    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch {}
      this.audioContext = null;
    }
  }

  cleanup() {
    this.stopTimer();
    this.cleanupStreams();
    if (this.fileWritable) {
      try {
        this.fileWritable.close();
      } catch {}
      this.fileWritable = null;
    }
    this.chunks = [];
    this.recordedBytes = 0;
  }
}

/**
 * Formats milliseconds into standard HH:MM:SS or MM:SS
 */
export function formatDuration(ms = 0) {
  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  const pad = (n) => String(n).padStart(2, '0');
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Formats bytes into human readable KB / MB
 */
export function formatFileSize(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
