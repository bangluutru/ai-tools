"use client";
import React, { useRef, useState } from "react";
import { useTranslation } from '../../utils/id-photo/i18n/index.jsx';
import { CameraModal } from './CameraModal.jsx';
import { Upload, Camera, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { verifyDocumentSignature } from '../../utils/documentFiles.js';

const Step1Upload = ({ onImageSelected }) => {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [_isLoading, setIsLoading] = useState(false);

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

  return (
    <div className="mx-auto max-w-3xl space-y-6 text-on-surface">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-xl font-bold tracking-tight text-on-surface sm:text-2xl">
          {t.uploadTitle}
        </h2>
        <p className="mt-1.5 text-xs text-on-surface-variant sm:text-sm">
          {t.uploadSubtitle}
        </p>
      </div>

      {/* Main Action Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`group flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
            isDragging
              ? "border-primary-container bg-primary-container/10 scale-[1.01]"
              : "border-border-subtle bg-surface-container hover:border-primary-container/60 hover:bg-surface-subtle shadow-xs"
          }`}
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

          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-container/15 text-brand-cyan-bright transition group-hover:scale-110 sm:h-14 sm:w-14">
            <Upload className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <h3 className="mt-3 font-semibold text-on-surface text-sm sm:text-base">
            {t.dropzonePrompt}
          </h3>
          <p className="mt-1 text-[11px] text-on-surface-variant sm:text-xs">
            {t.dropzoneSub}
          </p>

          <span className="mt-4 inline-flex items-center gap-1 rounded-lg bg-surface-subtle border border-border-subtle px-3 py-1.5 text-xs font-medium text-on-surface group-hover:bg-primary-container group-hover:text-on-primary-container transition">
            {t.selectFileBtn}
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>

        {/* Camera Option */}
        <div
          onClick={() => setIsCameraOpen(true)}
          className="group flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-border-subtle bg-surface-container p-6 text-center text-on-surface shadow-sm transition hover:border-primary-container hover:bg-surface-subtle"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-container text-on-primary-container shadow-md transition group-hover:scale-110 sm:h-14 sm:w-14">
            <Camera className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <h3 className="mt-3 font-semibold text-on-surface text-sm sm:text-base">
            {t.takePhoto}
          </h3>
          <p className="mt-1 text-[11px] text-on-surface-variant sm:text-xs">
            {t.cameraSub}
          </p>

          <span className="mt-4 inline-flex items-center gap-1 rounded-lg bg-surface-subtle border border-border-subtle px-3 py-1.5 text-xs font-medium text-on-surface group-hover:bg-primary-container group-hover:text-on-primary-container transition">
            {t.startCameraBtn}
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>

      {/* Instant Demo Samples */}
      <div className="rounded-2xl border border-border-subtle bg-surface-container p-5 shadow-xs">
        <div className="flex items-center gap-2 text-on-surface mb-3">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <h3 className="text-xs sm:text-sm font-bold tracking-tight">
            {t.useSampleTitle}
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* Male Sample */}
          <button
            type="button"
            onClick={() => loadImageFromSrc("/samples/man.jpg")}
            className="group relative flex items-center gap-3 rounded-xl border border-border-subtle p-2.5 text-left transition hover:border-primary-container hover:bg-surface-subtle cursor-pointer"
          >
            <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-subtle sm:h-16 sm:w-14">
              <img
                src="/samples/man.jpg"
                alt="Sample Male"
                className="h-full w-full object-cover group-hover:scale-105 transition"
              />
            </div>
            <div>
              <span className="inline-block text-xs font-semibold text-on-surface group-hover:text-primary">
                {t.sampleMale}
              </span>
              <p className="text-[10px] text-on-surface-variant sm:text-[11px]">
                {t.sampleMaleDesc}
              </p>
              <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-medium text-primary">
                {t.tryThisSample}
              </span>
            </div>
          </button>

          {/* Female Sample */}
          <button
            type="button"
            onClick={() => loadImageFromSrc("/samples/woman.jpg")}
            className="group relative flex items-center gap-3 rounded-xl border border-border-subtle p-2.5 text-left transition hover:border-primary-container hover:bg-surface-subtle cursor-pointer"
          >
            <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-subtle sm:h-16 sm:w-14">
              <img
                src="/samples/woman.jpg"
                alt="Sample Female"
                className="h-full w-full object-cover group-hover:scale-105 transition"
              />
            </div>
            <div>
              <span className="inline-block text-xs font-semibold text-on-surface group-hover:text-primary">
                {t.sampleFemale}
              </span>
              <p className="text-[10px] text-on-surface-variant sm:text-[11px]">
                {t.sampleFemaleDesc}
              </p>
              <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-medium text-primary">
                {t.tryThisSample}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Photography Tips */}
      <div className="rounded-xl border border-border-subtle bg-surface-container-low p-4">
        <h4 className="text-xs font-bold text-on-surface">{t.tipsTitle}</h4>
        <ul className="mt-2 space-y-1.5 text-[11px] text-on-surface-variant sm:text-xs">
          <li className="flex items-start gap-1.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-secondary mt-0.5" />
            <span>{t.tip1}</span>
          </li>
          <li className="flex items-start gap-1.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-secondary mt-0.5" />
            <span>{t.tip2}</span>
          </li>
          <li className="flex items-start gap-1.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-secondary mt-0.5" />
            <span>{t.tip3}</span>
          </li>
        </ul>
      </div>

      {/* Camera Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(dataUrl) => loadImageFromSrc(dataUrl)}
      />
    </div>
  );
};

export { Step1Upload };
