"use client";
import { useRef, useState } from "react";
import { useTranslation } from '../../utils/id-photo/i18n/index.jsx';
import { CameraModal } from './CameraModal.jsx';
import { Upload, Camera, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { verifyDocumentSignature } from '../../utils/documentFiles.js';
const Step1Upload = ({ onImageSelected }) => {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const processFile = async (file) => {
    const isValid = await verifyDocumentSignature(file);
    if (!isValid) {
      alert(t.errSelectImage);
      return;
    }
    if (!file.type.startsWith("image/")) {
      alert(t.errSelectImage);
      return;
    }
    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result;
      loadImageFromSrc(src);
    };
    reader.readAsDataURL(file);
  };
  const loadImageFromSrc = (src) => {
    setIsLoading(true);
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setIsLoading(false);
      onImageSelected(img);
    };
    img.onerror = () => {
      setIsLoading(false);
      alert(t.errLoadImage);
    };
    img.src = src;
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };
  return <div className="mx-auto max-w-3xl space-y-6">
      {
    /* Title */
  }
      <div className="text-center">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          {t.uploadTitle}
        </h2>
        <p className="mt-1.5 text-xs text-slate-600 sm:text-sm">
          {t.uploadSubtitle}
        </p>
      </div>

      {
    /* Main Action Grid */
  }
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {
    /* Dropzone */
  }
        <div
    onDragOver={(e) => {
      e.preventDefault();
      setIsDragging(true);
    }}
    onDragLeave={() => setIsDragging(false)}
    onDrop={handleDrop}
    onClick={() => fileInputRef.current?.click()}
    className={`group flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all ${isDragging ? "border-blue-500 bg-blue-50/60 scale-[1.01]" : "border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50/80 shadow-xs"}`}
  >
          <input
    ref={fileInputRef}
    type="file"
    accept="image/*"
    className="hidden"
    onChange={(e) => {
      if (e.target.files && e.target.files[0]) {
        processFile(e.target.files[0]);
      }
    }}
  />

          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition group-hover:scale-110 group-hover:bg-blue-100 sm:h-14 sm:w-14">
            <Upload className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <h3 className="mt-3 font-semibold text-slate-800 text-sm sm:text-base">
            {t.dropzonePrompt}
          </h3>
          <p className="mt-1 text-[11px] text-slate-500 sm:text-xs">
            {t.dropzoneSub}
          </p>

          <span className="mt-4 inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 group-hover:bg-blue-600 group-hover:text-white transition">
            {t.selectFileBtn}
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>

        {
    /* Camera Option */
  }
        <div
    onClick={() => setIsCameraOpen(true)}
    className="group flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-center text-white shadow-sm transition hover:border-blue-500 hover:shadow-md"
  >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-md transition group-hover:scale-110 sm:h-14 sm:w-14">
            <Camera className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <h3 className="mt-3 font-semibold text-white text-sm sm:text-base">
            {t.takePhoto}
          </h3>
          <p className="mt-1 text-[11px] text-slate-300 sm:text-xs">
            {t.cameraSub}
          </p>

          <span className="mt-4 inline-flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-xs group-hover:bg-blue-600 transition">
            {t.startCameraBtn}
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>

      {
    /* Instant Demo Samples */
  }
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-2 text-slate-800 mb-3">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <h3 className="text-xs sm:text-sm font-bold tracking-tight">
            {t.useSampleTitle}
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {
    /* Male Sample */
  }
          <button
    type="button"
    onClick={() => loadImageFromSrc("/samples/man.jpg")}
    className="group relative flex items-center gap-3 rounded-xl border border-slate-200 p-2.5 text-left transition hover:border-blue-500 hover:bg-blue-50/30 hover:shadow-xs active:scale-[0.98]"
  >
            <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100 shadow-2xs sm:h-16 sm:w-14">
              <img
    src="/samples/man.jpg"
    alt="Sample Male"
    className="h-full w-full object-cover group-hover:scale-105 transition"
  />
            </div>
            <div>
              <span className="inline-block text-xs font-semibold text-slate-900 group-hover:text-blue-600">
                {t.sampleMale}
              </span>
              <p className="text-[10px] text-slate-500 sm:text-[11px]">
                {t.sampleMaleDesc}
              </p>
              <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-medium text-blue-600">
                {t.tryThisSample}
              </span>
            </div>
          </button>

          {
    /* Female Sample */
  }
          <button
    type="button"
    onClick={() => loadImageFromSrc("/samples/woman.jpg")}
    className="group relative flex items-center gap-3 rounded-xl border border-slate-200 p-2.5 text-left transition hover:border-blue-500 hover:bg-blue-50/30 hover:shadow-xs active:scale-[0.98]"
  >
            <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100 shadow-2xs sm:h-16 sm:w-14">
              <img
    src="/samples/woman.jpg"
    alt="Sample Female"
    className="h-full w-full object-cover group-hover:scale-105 transition"
  />
            </div>
            <div>
              <span className="inline-block text-xs font-semibold text-slate-900 group-hover:text-blue-600">
                {t.sampleFemale}
              </span>
              <p className="text-[10px] text-slate-500 sm:text-[11px]">
                {t.sampleFemaleDesc}
              </p>
              <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-medium text-blue-600">
                {t.tryThisSample}
              </span>
            </div>
          </button>
        </div>
      </div>

      {
    /* Photography Tips */
  }
      <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-4">
        <h4 className="text-xs font-bold text-slate-800">{t.tipsTitle}</h4>
        <ul className="mt-2 space-y-1.5 text-[11px] text-slate-600 sm:text-xs">
          <li className="flex items-start gap-1.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
            <span>{t.tip1}</span>
          </li>
          <li className="flex items-start gap-1.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
            <span>{t.tip2}</span>
          </li>
          <li className="flex items-start gap-1.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
            <span>{t.tip3}</span>
          </li>
        </ul>
      </div>

      {
    /* Camera Modal */
  }
      <CameraModal
    isOpen={isCameraOpen}
    onClose={() => setIsCameraOpen(false)}
    onCapture={(dataUrl) => loadImageFromSrc(dataUrl)}
  />
    </div>;
};
export {
  Step1Upload
};
