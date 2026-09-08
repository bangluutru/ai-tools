/**
 * @file packages/core/src/components/ScreenRecorderView.jsx
 * ============================================================================
 * Ultra-Lightweight Screen Recorder View Component (MAIS Compliant)
 * 100% Client-Side In-Browser Screen Recording with Zero-RAM Direct Streaming,
 * Audio Mixing (System + Mic), Seekable WebM Duration Fixing, and Instant Preview.
 * ============================================================================
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Video,
  Mic,
  Volume2,
  Square,
  Play,
  Pause,
  Download,
  RotateCcw,
  ShieldCheck,
  Zap,
  AlertCircle,
  CheckCircle2,
  HardDrive,
  Sliders,
  Sparkles,
  Clock,
  Laptop,
  Check,
  Info,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  RECORDER_PRESETS,
  AUDIO_SOURCES,
  ScreenRecorderSession,
  isDirectToDiskSupported,
  formatDuration,
  formatFileSize,
} from '../utils/screen-recorder/recorderEngine.js';

const i18n = {
  vi: {
    toolTitle: 'Quay Màn Hình',
    toolDesc: 'Ghi lại video màn hình, cửa sổ hoặc thẻ trình duyệt kèm âm thanh. Hoạt động 100% trên trình duyệt, không tốn RAM, tối ưu cho máy cấu hình thấp.',
    privacyBadge: 'Xử lý trực tiếp trên trình duyệt — video không được tải lên máy chủ.',
    zeroRamBadge: 'Không tốn RAM • Tối ưu máy yếu • 100% Client-Side',
    presetSection: 'Chất Lượng & Tải Phần Cứng',
    audioSection: 'Nguồn Âm Thanh Ghi Kèm',
    storageSection: 'Chế Độ Lưu Chống Tràn RAM',
    audioNone: 'Tắt tiếng (Không âm thanh)',
    audioNoneDesc: 'Chỉ quay hình ảnh màn hình, không thu bất kỳ âm thanh nào.',
    audioSystem: 'Âm thanh hệ thống / tab',
    audioSystemDesc: 'Thu âm thanh phát ra từ tab trình duyệt hoặc máy tính.',
    audioMic: 'Microphone (Thu âm giọng nói)',
    audioMicDesc: 'Thu giọng thuyết minh qua microphone của bạn.',
    audioBoth: 'Cả hai (Hệ thống + Micro)',
    audioBothDesc: 'Hòa trộn âm thanh máy tính và giọng nói lồng tiếng.',
    directDiskTitle: 'Ghi trực tiếp vào đĩa (Direct-to-Disk Stream)',
    directDiskDesc: 'Lưu từng giây video trực tiếp vào ổ cứng. RAM tiêu thụ chỉ ~15MB, không sợ sập trình duyệt khi quay lâu.',
    directDiskNotSupported: 'Trình duyệt hiện tại chưa hỗ trợ File System Access API. Hệ thống sẽ tự động dùng chế độ bộ đệm an toàn.',
    countdownToggle: 'Đếm ngược 3 giây trước khi quay',
    btnStart: 'Bắt Đầu Quay Màn Hình',
    btnPreparing: 'Đang khởi tạo quyền màn hình...',
    recordingActive: 'Đang ghi hình màn hình',
    recordingPaused: 'Tạm dừng ghi hình',
    btnPause: 'Tạm Dừng',
    btnResume: 'Tiếp Tục',
    btnStop: 'Dừng & Hoàn Tất',
    previewTitle: 'Xem Lại Video Vừa Quay',
    directSavedMsg: 'Tệp đã được ghi trực tiếp an toàn vào đĩa cứng của bạn!',
    readyDownloadMsg: 'Video đã sẵn sàng. Bạn có thể xem trước hoặc tải về ngay.',
    statDuration: 'Thời lượng',
    statSize: 'Dung lượng',
    statFormat: 'Định dạng',
    statPreset: 'Cấu hình',
    btnDownload: 'Tải Video Về Máy',
    btnRecordAgain: 'Quay Video Mới',
    memWarnTitle: 'Cảnh báo bộ nhớ RAM',
    memWarnDesc: 'Dung lượng video trong bộ nhớ RAM đã đạt mức lớn. Khuyến nghị dừng quay để bảo đảm máy hoạt động ổn định.',
    errTitle: 'Không thể bắt đầu quay',
    errPermission: 'Bạn đã hủy chọn màn hình hoặc quyền ghi âm bị từ chối.',
    errUnknown: 'Đã xảy ra sự cố khi kích hoạt ghi hình. Vui lòng thử lại.',
    countdownReady: 'Chuẩn bị quay sau...',
    btnCancelCountdown: 'Hủy đếm ngược',
  },
  en: {
    toolTitle: 'Screen Recorder',
    toolDesc: 'Record screen, window or browser tab with system & mic audio. 100% client-side, zero RAM bloat, optimized for low-spec devices.',
    privacyBadge: 'Client-side processing — your recordings never leave your device.',
    zeroRamBadge: 'Zero RAM Bloat • Low-Spec Optimized • 100% In-Browser',
    presetSection: 'Video Quality & Hardware Load',
    audioSection: 'Audio Capture Source',
    storageSection: 'Memory & Storage Safety Mode',
    audioNone: 'Mute (No Audio)',
    audioNoneDesc: 'Record screen only with no audio input.',
    audioSystem: 'System / Tab Audio',
    audioSystemDesc: 'Capture sound playing from your browser tab or computer.',
    audioMic: 'Microphone (Voiceover)',
    audioMicDesc: 'Record your voice commentary through microphone.',
    audioBoth: 'Both (System + Mic)',
    audioBothDesc: 'Mix computer audio and your microphone commentary seamlessly.',
    directDiskTitle: 'Direct-to-Disk Stream (Zero RAM)',
    directDiskDesc: 'Stream video chunks straight to disk. Consumes only ~15MB RAM regardless of recording length.',
    directDiskNotSupported: 'File System Access API is not supported in this browser. Safe in-memory buffer will be used automatically.',
    countdownToggle: '3-second countdown before recording',
    btnStart: 'Start Screen Recording',
    btnPreparing: 'Initializing screen capture...',
    recordingActive: 'Recording Screen in Progress',
    recordingPaused: 'Recording Paused',
    btnPause: 'Pause',
    btnResume: 'Resume',
    btnStop: 'Stop & Finish',
    previewTitle: 'Recorded Video Preview',
    directSavedMsg: 'File was successfully written directly to your local drive!',
    readyDownloadMsg: 'Video is ready. You can scrub the timeline and download it now.',
    statDuration: 'Duration',
    statSize: 'File Size',
    statFormat: 'Format',
    statPreset: 'Preset',
    btnDownload: 'Download Video',
    btnRecordAgain: 'Record Another Video',
    memWarnTitle: 'High Memory Notice',
    memWarnDesc: 'In-memory recording size is growing large. Consider stopping now to prevent browser tab discard.',
    errTitle: 'Unable to start recording',
    errPermission: 'Screen share was cancelled or microphone access was denied.',
    errUnknown: 'An error occurred while initializing recorder. Please try again.',
    countdownReady: 'Starting recording in...',
    btnCancelCountdown: 'Cancel',
  },
  ja: {
    toolTitle: '画面録画',
    toolDesc: '画面・ウィンドウ・ブラウザタブを音声付きで録画。100%ブラウザ完結、メモリ消費ゼロ、低スペック端末でも超軽量動作。',
    privacyBadge: '100% ブラウザ内処理・録画データは外部サーバーに送信されません。',
    zeroRamBadge: 'メモリ肥大化ゼロ • 低スペック端末最適化 • 100% クライアント処理',
    presetSection: '画質とハードウェア負荷',
    audioSection: '録音ソース',
    storageSection: 'メモリ安全・保存モード',
    audioNone: 'ミュート（音声なし）',
    audioNoneDesc: '画面映像のみを録画し、音声は収録しません。',
    audioSystem: 'システム／タブ音声',
    audioSystemDesc: 'ブラウザタブやPCから流れる音声を収録します。',
    audioMic: 'マイク音声（ナレーション）',
    audioMicDesc: 'マイクを使って解説やナレーションを録音します。',
    audioBoth: '両方（システム音＋マイク）',
    audioBothDesc: 'PCの内部音声とマイク音声をミックスして同時収録します。',
    directDiskTitle: 'ディスク直書き込みストリーム（メモリ消費ゼロ）',
    directDiskDesc: '動画データをディスクへ直接書き込みます。長時間の録画でもRAM消費は約15MBのみ。',
    directDiskNotSupported: 'お使いのブラウザはFile System Access APIに対応していません。安全バッファモードで動作します。',
    countdownToggle: '録画開始前の3秒カウントダウン',
    btnStart: '画面録画を開始',
    btnPreparing: '画面共有の権限を待機中...',
    recordingActive: '画面録画中',
    recordingPaused: '一時停止中',
    btnPause: '一時停止',
    btnResume: '再開',
    btnStop: '停止して完了',
    previewTitle: '録画した動画のプレビュー',
    directSavedMsg: 'ローカルディスクに直接保存されました！',
    readyDownloadMsg: '録画が完了しました。タイムラインを操作して動画を確認・保存できます。',
    statDuration: '録画時間',
    statSize: 'ファイルサイズ',
    statFormat: '形式',
    statPreset: 'プリセット',
    btnDownload: '動画をダウンロード',
    btnRecordAgain: '新しく録画する',
    memWarnTitle: 'メモリ警告',
    memWarnDesc: 'メモリ内の録画データが大きくなっています。ブラウザのクラッシュを防ぐため録画を終了することをお勧めします。',
    errTitle: '録画を開始できませんでした',
    errPermission: '画面共有がキャンセルされたか、マイク権限が拒否されました。',
    errUnknown: '録画の初期化中にエラーが発生しました。もう一度お試しください。',
    countdownReady: '録画開始まで...',
    btnCancelCountdown: 'カウントダウン中止',
  },
};

export default function ScreenRecorderView({ displayLang = 'vi' }) {
  const t = i18n[displayLang] || i18n.vi;

  // Configuration States with localStorage persistence (namespaced: ai_tools_screen_recorder_*)
  const [selectedPreset, setSelectedPreset] = useState(() => {
    try {
      return localStorage.getItem('ai_tools_screen_recorder_preset') || 'standard';
    } catch {
      return 'standard';
    }
  });

  const [audioSource, setAudioSource] = useState(() => {
    try {
      return localStorage.getItem('ai_tools_screen_recorder_audio') || AUDIO_SOURCES.NONE;
    } catch {
      return AUDIO_SOURCES.NONE;
    }
  });

  const [useDirectToDisk, setUseDirectToDisk] = useState(() => {
    try {
      const saved = localStorage.getItem('ai_tools_screen_recorder_direct_disk');
      return saved !== null ? saved === 'true' : isDirectToDiskSupported();
    } catch {
      return isDirectToDiskSupported();
    }
  });

  const [enableCountdown, setEnableCountdown] = useState(() => {
    try {
      const saved = localStorage.getItem('ai_tools_screen_recorder_countdown');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  // Session & Runtime States
  const [recorderStatus, setRecorderStatus] = useState('idle'); // 'idle' | 'preparing' | 'countdown' | 'recording' | 'paused' | 'stopped'
  const [countdownNum, setCountdownNum] = useState(3);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [recordedBytes, setRecordedBytes] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [recordedResult, setRecordedResult] = useState(null);

  const sessionRef = useRef(null);
  const countdownTimerRef = useRef(null);
  const videoPreviewRef = useRef(null);

  // Sync user settings to localStorage
  const updatePreset = (id) => {
    setSelectedPreset(id);
    try {
      localStorage.setItem('ai_tools_screen_recorder_preset', id);
    } catch {}
  };

  const updateAudioSource = (src) => {
    setAudioSource(src);
    try {
      localStorage.setItem('ai_tools_screen_recorder_audio', src);
    } catch {}
  };

  const updateDirectToDisk = (val) => {
    setUseDirectToDisk(val);
    try {
      localStorage.setItem('ai_tools_screen_recorder_direct_disk', String(val));
    } catch {}
  };

  const updateCountdown = (val) => {
    setEnableCountdown(val);
    try {
      localStorage.setItem('ai_tools_screen_recorder_countdown', String(val));
    } catch {}
  };

  // Cleanup object URLs when component unmounts or new recording starts
  const cleanupPreviewUrl = useCallback(() => {
    if (recordedResult?.url) {
      URL.revokeObjectURL(recordedResult.url);
    }
  }, [recordedResult]);

  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (sessionRef.current) {
        sessionRef.current.cleanup();
        sessionRef.current = null;
      }
      cleanupPreviewUrl();
    };
  }, [cleanupPreviewUrl]);

  // Actual recording kick-off
  const startActualRecording = useCallback(async () => {
    setErrorMessage('');
    cleanupPreviewUrl();
    setRecordedResult(null);

    const session = new ScreenRecorderSession({
      presetId: selectedPreset,
      audioSource,
      directToDisk: useDirectToDisk,
      onStateChange: (status) => {
        setRecorderStatus(status);
      },
      onProgress: ({ recordedBytes: bytes, elapsedMs: ms }) => {
        setRecordedBytes(bytes);
        setElapsedMs(ms);
      },
      onError: (err) => {
        console.error('[ScreenRecorderView] Capture error:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setErrorMessage(t.errPermission);
        } else {
          setErrorMessage(err.message || t.errUnknown);
        }
        setRecorderStatus('idle');
      },
    });

    sessionRef.current = session;
    const success = await session.start();
    if (!success) {
      sessionRef.current = null;
    }
  }, [selectedPreset, audioSource, useDirectToDisk, cleanupPreviewUrl, t]);

  // Handle click on "Start Recording" button
  const handleStartClick = () => {
    if (enableCountdown) {
      setRecorderStatus('countdown');
      setCountdownNum(3);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

      countdownTimerRef.current = setInterval(() => {
        setCountdownNum((prev) => {
          if (prev <= 1) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
            startActualRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 900);
    } else {
      startActualRecording();
    }
  };

  const handleCancelCountdown = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setRecorderStatus('idle');
  };

  // Pause & Resume
  const handlePause = () => {
    if (sessionRef.current) {
      sessionRef.current.pause();
    }
  };

  const handleResume = () => {
    if (sessionRef.current) {
      sessionRef.current.resume();
    }
  };

  // Stop Recording
  const handleStop = async () => {
    if (sessionRef.current) {
      const result = await sessionRef.current.stop();
      if (result) {
        setRecordedResult(result);
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 },
          });
        } catch {}
      }
      sessionRef.current = null;
    }
  };

  // Reset to record again
  const handleRecordAgain = () => {
    cleanupPreviewUrl();
    setRecordedResult(null);
    setRecorderStatus('idle');
    setElapsedMs(0);
    setRecordedBytes(0);
    setErrorMessage('');
  };

  // Download video file
  const handleDownload = () => {
    if (!recordedResult?.url && !recordedResult?.blob) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const extension = recordedResult.mimeType?.includes('mp4') ? 'mp4' : 'webm';
    const filename = `screen-record-${timestamp}.${extension}`;

    const a = document.createElement('a');
    a.href = recordedResult.url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const isRecordingOrPaused = recorderStatus === 'recording' || recorderStatus === 'paused';
  const showMemoryWarning = !useDirectToDisk && recordedBytes > 250 * 1024 * 1024; // >250MB in RAM

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      {/* TIER 1: CONTEXT HEADER & BADGES */}
      <header className="flex flex-col gap-2 pb-6 border-b border-border-subtle/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-container/15 text-primary border border-primary/20 flex items-center justify-center shrink-0 shadow-sm">
            <Video size={20} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-on-surface">
              {t.toolTitle}
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
              {t.toolDesc}
            </p>
          </div>
        </div>

        {/* Security & Zero-RAM Badges */}
        <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-on-surface-variant">
          <div className="flex items-center gap-1.5 text-secondary">
            <ShieldCheck size={14} className="shrink-0" />
            <span>{t.privacyBadge}</span>
          </div>
          <span className="text-border-subtle hidden sm:inline">•</span>
          <div className="flex items-center gap-1.5 text-primary">
            <Zap size={14} className="shrink-0" />
            <span className="font-medium">{t.zeroRamBadge}</span>
          </div>
        </div>
      </header>

      {/* ERROR BANNER */}
      {errorMessage && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-error-container/20 border border-error/30 flex items-start gap-3 text-xs text-on-surface animate-in fade-in"
        >
          <AlertCircle size={18} className="text-error shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-error">{t.errTitle}</p>
            <p className="text-on-surface-variant mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* COUNTDOWN OVERLAY */}
      {recorderStatus === 'countdown' && (
        <div className="bg-surface-container border border-primary/40 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[260px] shadow-lg animate-in zoom-in-95 duration-200">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">
            {t.countdownReady}
          </p>
          <div className="w-20 h-20 rounded-full bg-primary text-on-primary shadow-lg flex items-center justify-center text-4xl font-extrabold font-mono my-2 animate-pulse">
            {countdownNum}
          </div>
          <button
            type="button"
            onClick={handleCancelCountdown}
            className="mt-4 px-4 py-2 rounded-xl border border-border-subtle hover:border-outline text-on-surface-variant hover:text-on-surface text-xs font-semibold transition-colors cursor-pointer"
          >
            {t.btnCancelCountdown}
          </button>
        </div>
      )}

      {/* TIER 2: SETUP & LIVE RECORDING BAR (WHEN IDLE OR RECORDING) */}
      {!recordedResult && recorderStatus !== 'countdown' && (
        <div className="flex flex-col gap-6">
          {/* LIVE RECORDING BAR (ACTIVE STATE) */}
          {isRecordingOrPaused && (
            <div
              role="region"
              aria-label="Thanh điều khiển ghi hình"
              className="bg-surface-container-high border-2 border-primary/40 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-300"
            >
              {/* Status Indicator & Live Timer */}
              <div className="flex items-center gap-4">
                <div className="relative flex items-center justify-center">
                  <div className={`w-3.5 h-3.5 rounded-full ${recorderStatus === 'recording' ? 'bg-error animate-ping' : 'bg-tertiary'}`} />
                  <div className={`absolute w-3 h-3 rounded-full ${recorderStatus === 'recording' ? 'bg-error' : 'bg-tertiary'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
                      {recorderStatus === 'recording' ? t.recordingActive : t.recordingPaused}
                    </span>
                    {useDirectToDisk && (
                      <span className="text-[10px] font-mono font-semibold bg-surface-subtle text-secondary px-2 py-0.5 rounded border border-secondary/40 flex items-center gap-1">
                        <HardDrive size={10} />
                        DIRECT-TO-DISK
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-on-surface-variant mt-1 font-mono">
                    <span className="flex items-center gap-1 text-primary font-bold text-sm">
                      <Clock size={14} />
                      {formatDuration(elapsedMs)}
                    </span>
                    <span>•</span>
                    <span className="text-on-surface font-semibold">{formatFileSize(recordedBytes)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Pause/Resume and Stop */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {recorderStatus === 'recording' ? (
                  <button
                    type="button"
                    onClick={handlePause}
                    aria-label={t.btnPause}
                    className="h-11 px-4 rounded-xl border border-border-subtle bg-surface-subtle hover:bg-surface-container text-on-surface text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Pause size={15} />
                    <span>{t.btnPause}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleResume}
                    aria-label={t.btnResume}
                    className="h-11 px-4 rounded-xl bg-primary text-on-primary hover:brightness-105 active:scale-[0.98] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Play size={15} fill="currentColor" />
                    <span>{t.btnResume}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleStop}
                  aria-label={t.btnStop}
                  className="h-11 px-5 rounded-xl bg-error text-on-error hover:brightness-110 active:scale-[0.98] text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Square size={14} fill="currentColor" />
                  <span>{t.btnStop}</span>
                </button>
              </div>
            </div>
          )}

          {/* MEMORY WARNING (FOR VERY LARGE BUFFER ON LOW-SPEC MACHINES) */}
          {showMemoryWarning && (
            <div className="p-4 rounded-xl bg-tertiary/15 border border-tertiary/30 flex items-start gap-3 text-xs text-on-surface animate-in fade-in">
              <Info size={18} className="text-tertiary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-tertiary">{t.memWarnTitle}</p>
                <p className="text-on-surface-variant mt-0.5">{t.memWarnDesc}</p>
              </div>
            </div>
          )}

          {/* CONFIGURATION CARDS (ONLY WHEN IDLE) */}
          {!isRecordingOrPaused && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Preset & Hardware Load */}
              <div className="lg:col-span-6 flex flex-col gap-4">
                <div className="bg-surface-container border border-border-subtle rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-border-subtle/50 pb-3">
                    <div className="flex items-center gap-2 text-on-surface font-semibold text-sm">
                      <Sliders size={16} className="text-primary" />
                      <span>{t.presetSection}</span>
                    </div>
                    <span className="text-[11px] font-mono text-outline">HARDWARE PRESET</span>
                  </div>

                  <div className="space-y-2.5">
                    {Object.values(RECORDER_PRESETS).map((p) => {
                      const isSelected = selectedPreset === p.id;
                      const label = p[`label_${displayLang}`] || p.label_vn;
                      const desc = p[`desc_${displayLang}`] || p.desc_vn;

                      return (
                        <div
                          key={p.id}
                          onClick={() => updatePreset(p.id)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                            isSelected
                              ? 'border-primary bg-primary-container/10 shadow-sm'
                              : 'border-border-subtle bg-surface-subtle/60 hover:bg-surface-subtle hover:border-border-subtle/80'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-on-surface">{label}</span>
                              {p.id === 'standard' && (
                                <span className="text-[10px] font-mono font-bold bg-primary text-on-primary px-1.5 py-0.5 rounded shadow-xs">
                                  RECOMMENDED
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-on-surface-variant leading-relaxed">{desc}</p>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                              isSelected
                                ? 'border-primary bg-primary text-on-primary'
                                : 'border-outline text-transparent'
                            }`}
                          >
                            {isSelected && <Check size={12} strokeWidth={3} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Storage Mode Card */}
                <div className="bg-surface-container border border-border-subtle rounded-2xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-border-subtle/50 pb-3">
                    <div className="flex items-center gap-2 text-on-surface font-semibold text-sm">
                      <HardDrive size={16} className="text-secondary" />
                      <span>{t.storageSection}</span>
                    </div>
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={useDirectToDisk}
                      onChange={(e) => updateDirectToDisk(e.target.checked)}
                      disabled={!isDirectToDiskSupported()}
                      className="w-4 h-4 rounded border-border-subtle text-primary focus:ring-primary mt-0.5 accent-primary cursor-pointer disabled:opacity-40"
                    />
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                        {t.directDiskTitle}
                        {isDirectToDiskSupported() ? (
                          <span className="text-[10px] font-mono text-secondary font-semibold bg-surface-subtle border border-secondary/40 px-1.5 py-0.2 rounded">
                            AVAILABLE
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-outline font-semibold bg-surface-subtle px-1.5 py-0.2 rounded">
                            N/A
                          </span>
                        )}
                      </span>
                      <p className="text-[11px] text-on-surface-variant leading-relaxed">
                        {isDirectToDiskSupported() ? t.directDiskDesc : t.directDiskNotSupported}
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Right Column: Audio Sources & Kick-off */}
              <div className="lg:col-span-6 flex flex-col justify-between gap-4">
                <div className="bg-surface-container border border-border-subtle rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-border-subtle/50 pb-3">
                    <div className="flex items-center gap-2 text-on-surface font-semibold text-sm">
                      <Volume2 size={16} className="text-primary" />
                      <span>{t.audioSection}</span>
                    </div>
                    <span className="text-[11px] font-mono text-outline">AUDIO MIXER</span>
                  </div>

                  <div className="space-y-2.5">
                    {[
                      {
                        id: AUDIO_SOURCES.NONE,
                        icon: Volume2,
                        title: t.audioNone,
                        desc: t.audioNoneDesc,
                      },
                      {
                        id: AUDIO_SOURCES.SYSTEM,
                        icon: Laptop,
                        title: t.audioSystem,
                        desc: t.audioSystemDesc,
                      },
                      {
                        id: AUDIO_SOURCES.MIC,
                        icon: Mic,
                        title: t.audioMic,
                        desc: t.audioMicDesc,
                      },
                      {
                        id: AUDIO_SOURCES.BOTH,
                        icon: Sparkles,
                        title: t.audioBoth,
                        desc: t.audioBothDesc,
                      },
                    ].map((item) => {
                      const isSelected = audioSource === item.id;
                      const IconComponent = item.icon;

                      return (
                        <div
                          key={item.id}
                          onClick={() => updateAudioSource(item.id)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                            isSelected
                              ? 'border-primary bg-primary-container/10 shadow-sm'
                              : 'border-border-subtle bg-surface-subtle/60 hover:bg-surface-subtle hover:border-border-subtle/80'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <IconComponent
                              size={16}
                              className={`shrink-0 mt-0.5 ${isSelected ? 'text-primary' : 'text-on-surface-variant'}`}
                            />
                            <div>
                              <p className="text-xs font-bold text-on-surface">{item.title}</p>
                              <p className="text-[11px] text-on-surface-variant leading-relaxed mt-0.5">
                                {item.desc}
                              </p>
                            </div>
                          </div>
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                              isSelected
                                ? 'border-primary bg-primary text-on-primary'
                                : 'border-outline text-transparent'
                            }`}
                          >
                            {isSelected && <Check size={10} strokeWidth={3} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Countdown Option */}
                  <div className="pt-2 border-t border-border-subtle/40">
                    <label className="flex items-center gap-2 text-xs text-on-surface font-medium cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={enableCountdown}
                        onChange={(e) => updateCountdown(e.target.checked)}
                        className="w-4 h-4 rounded border-border-subtle text-primary focus:ring-primary accent-primary cursor-pointer"
                      />
                      <span>{t.countdownToggle}</span>
                    </label>
                  </div>
                </div>

                {/* Primary Start Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleStartClick}
                    disabled={recorderStatus === 'preparing'}
                    className="w-full h-13 sm:h-12 px-6 rounded-2xl bg-primary-container text-on-primary-container hover:brightness-105 active:scale-[0.99] text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <div className="w-3 h-3 rounded-full bg-error animate-pulse" />
                    <span>{recorderStatus === 'preparing' ? t.btnPreparing : t.btnStart}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TIER 3: RESULT & VIDEO PREVIEW STAGE */}
      {recordedResult && (
        <div
          tabIndex={0}
          role="region"
          aria-label={t.previewTitle}
          className="bg-surface-container border border-border-subtle rounded-2xl p-5 shadow-sm space-y-5 animate-in fade-in duration-300 focus:outline-none focus:ring-1 focus:ring-primary/40"
        >
          {/* Header Status */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle/40 pb-3">
            <div className="flex items-center gap-2 text-on-surface font-bold text-sm">
              <CheckCircle2 size={18} className="text-secondary" />
              <span>{t.previewTitle}</span>
            </div>
            {recordedResult.directSaved ? (
              <span className="text-[11px] font-mono text-secondary font-semibold bg-surface-subtle border border-secondary/40 px-2 py-0.5 rounded flex items-center gap-1">
                <HardDrive size={12} />
                DIRECT SAVED TO DISK
              </span>
            ) : (
              <span className="text-[11px] font-mono text-on-primary font-semibold bg-primary px-2 py-0.5 rounded shadow-xs">
                READY TO DOWNLOAD
              </span>
            )}
          </div>

          {/* Video Player */}
          {recordedResult.url ? (
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video max-h-[520px] mx-auto w-full shadow-inner flex items-center justify-center">
              <video
                ref={videoPreviewRef}
                src={recordedResult.url}
                controls
                playsInline
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-surface-subtle/60 border border-border-subtle/40 text-center space-y-2">
              <HardDrive size={32} className="text-secondary mx-auto" />
              <p className="text-xs font-bold text-on-surface">{t.directSavedMsg}</p>
              {recordedResult.fileName && (
                <p className="text-xs font-mono text-outline">{recordedResult.fileName}</p>
              )}
            </div>
          )}

          {/* Summary Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-surface-subtle/70 border border-border-subtle/30 space-y-1">
              <span className="text-[11px] text-on-surface-variant">{t.statDuration}</span>
              <p className="text-xs font-bold font-mono text-primary">
                {formatDuration(recordedResult.durationMs)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-surface-subtle/70 border border-border-subtle/30 space-y-1">
              <span className="text-[11px] text-on-surface-variant">{t.statSize}</span>
              <p className="text-xs font-bold font-mono text-on-surface">
                {formatFileSize(recordedResult.sizeBytes)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-surface-subtle/70 border border-border-subtle/30 space-y-1">
              <span className="text-[11px] text-on-surface-variant">{t.statFormat}</span>
              <p className="text-xs font-bold font-mono text-on-surface">
                {recordedResult.mimeType?.includes('mp4') ? 'MP4 (H.264)' : 'WebM (VP8/Opus)'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-surface-subtle/70 border border-border-subtle/30 space-y-1">
              <span className="text-[11px] text-on-surface-variant">{t.statPreset}</span>
              <p className="text-xs font-bold text-on-surface uppercase">
                {selectedPreset}
              </p>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border-subtle/40">
            <button
              type="button"
              onClick={handleRecordAgain}
              className="h-11 sm:h-10 px-4 rounded-xl border border-border-subtle bg-surface-subtle hover:bg-surface-container text-on-surface-variant hover:text-on-surface text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>{t.btnRecordAgain}</span>
            </button>

            {recordedResult.url && (
              <button
                type="button"
                onClick={handleDownload}
                className="h-11 sm:h-10 px-5 rounded-xl bg-secondary text-on-secondary hover:brightness-110 text-xs font-bold transition-all shadow flex items-center gap-2 cursor-pointer"
              >
                <Download size={15} />
                <span>{t.btnDownload}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
