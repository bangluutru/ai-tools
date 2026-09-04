"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from '../../utils/id-photo/i18n/index.jsx';
import { Camera, X, RefreshCw, Clock } from "lucide-react";
const CameraModal = ({ isOpen, onClose, onCapture }) => {
  const { t } = useTranslation();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [facingMode, setFacingMode] = useState("user");
  const [countdown, setCountdown] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [useTimer, setUseTimer] = useState(true);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    stopStream();
    setErrorMessage(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setErrorMessage(t.cameraError);
    }
  }, [facingMode, stopStream, t.cameraError]);

  useEffect(() => {
    if (!isOpen) {
      stopStream();
      return;
    }
    const timer = setTimeout(() => {
      startCamera();
    }, 0);
    return () => {
      clearTimeout(timer);
      stopStream();
    };
  }, [isOpen, startCamera, stopStream]);
  const switchCamera = () => {
    setFacingMode((prev) => prev === "user" ? "environment" : "user");
  };
  const handleCaptureClick = () => {
    if (useTimer) {
      setCountdown(3);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(timer);
            doCapture();
            return null;
          }
          return prev - 1;
        });
      }, 1e3);
    } else {
      doCapture();
    }
  };
  const doCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 960;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
    stopStream();
    onCapture(dataUrl);
    onClose();
  };
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-xs">
      <div className="relative flex max-h-[95vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-slate-900 shadow-2xl ring-1 ring-white/10">
        {
    /* Header */
  }
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 text-white">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-blue-400" />
            <h3 className="font-semibold text-sm sm:text-base">{t.cameraModalTitle}</h3>
          </div>
          <button
    onClick={() => {
      stopStream();
      onClose();
    }}
    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
  >
            <X className="h-5 w-5" />
          </button>
        </div>

        {
    /* Viewfinder Container */
  }
        <div className="relative aspect-3/4 w-full overflow-hidden bg-black sm:aspect-4/5">
          {errorMessage ? <div className="flex h-full flex-col items-center justify-center p-6 text-center text-slate-300">
              <p className="text-sm">{errorMessage}</p>
              <button
    onClick={startCamera}
    className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
  >
                {t.cameraRetry}
              </button>
            </div> : <>
              <video
    ref={videoRef}
    autoPlay
    playsInline
    muted
    className={`h-full w-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
  />

              {
    /* ID Photo Guide Overlay (Oval head + Shoulder line) */
  }
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                {
    /* Oval for head */
  }
                <div className="relative h-[55%] w-[48%] rounded-[50%] border-2 border-dashed border-blue-400/70 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                  {
    /* Eye alignment guide */
  }
                  <div className="absolute top-[38%] left-0 right-0 border-b border-blue-300/50" />
                  {
    /* Vertical center axis */
  }
                  <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 border-r border-blue-300/40" />
                </div>

                {
    /* Shoulder line */
  }
                <div className="h-10 w-[78%] rounded-t-full border-t-2 border-dashed border-blue-400/50 -mt-2" />
              </div>

              {
    /* Prompt message */
  }
              <div className="pointer-events-none absolute top-3 inset-x-3 text-center">
                <span className="inline-block rounded-full bg-slate-900/80 px-3 py-1 text-[11px] font-medium text-slate-200 backdrop-blur-xs">
                  {t.cameraPrompt}
                </span>
              </div>

              {
    /* Countdown overlay */
  }
              {countdown !== null && <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xs">
                  <span className="text-7xl font-extrabold text-white animate-ping">
                    {countdown}
                  </span>
                </div>}
            </>}
        </div>

        {
    /* Controls Bar */
  }
        <div className="flex items-center justify-between bg-slate-900 px-6 py-4 border-t border-slate-800">
          <button
    type="button"
    onClick={() => setUseTimer((prev) => !prev)}
    className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition ${useTimer ? "bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/30" : "text-slate-400 hover:bg-slate-800"}`}
  >
            <Clock className="h-4 w-4" />
            <span>{t.cameraTimer}</span>
          </button>

          {
    /* Shutter Button */
  }
          <button
    type="button"
    disabled={!!errorMessage || countdown !== null}
    onClick={handleCaptureClick}
    className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-slate-900 shadow-lg ring-4 ring-blue-500/30 transition hover:scale-105 active:scale-95 disabled:opacity-50"
  >
            <div className="h-11 w-11 rounded-full border-2 border-slate-900 bg-white" />
          </button>

          {
    /* Switch Camera */
  }
          <button
    type="button"
    onClick={switchCamera}
    className="rounded-lg p-2.5 text-slate-400 hover:bg-slate-800 hover:text-white transition active:rotate-180"
    title={t.cameraSwitch}
  >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>;
};
export {
  CameraModal
};
