// NOTE: @imgly/background-removal is licensed under AGPL-3.0 (see its LICENSE.md). Whether that is
// compatible with how Toolio is distributed/hosted is a legal question for the owner — the library
// is kept, but only loaded when the user explicitly opts in to the HD engine.
import {
  IMGLY_MODEL,
  IMGLY_PUBLIC_PATH,
  SELFIE_SEGMENTER_MODEL_URL,
  getVisionFileset
} from './mediapipeConfig.js';

let segmenterPromise = null;
/** Creates the MediaPipe selfie segmenter once (cached promise). Resolves to null on failure. */
function initMediaPipeSegmenter() {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (!segmenterPromise) {
    segmenterPromise = (async () => {
      const { ImageSegmenter } = await import("@mediapipe/tasks-vision");
      const vision = await getVisionFileset();
      const create = (delegate) => ImageSegmenter.createFromOptions(vision, {
        baseOptions: { modelAssetPath: SELFIE_SEGMENTER_MODEL_URL, delegate },
        runningMode: "IMAGE",
        outputCategoryMask: false,
        outputConfidenceMasks: true
      });
      try {
        return await create("GPU");
      } catch (gpuErr) {
        console.warn("MediaPipe GPU failed, trying CPU delegate:", gpuErr);
        return await create("CPU");
      }
    })().catch((err) => {
      console.warn("MediaPipe segmenter init failed:", err);
      segmenterPromise = null;
      return null;
    });
  }
  return segmenterPromise;
}

// ---------------------------------------------------------------------------
// @imgly HD engine (opt-in). The model/runtime download is started once and shared;
// a stall watchdog (no download progress for IMGLY_STALL_MS) aborts it instead of a hard timeout.
// ---------------------------------------------------------------------------
const IMGLY_STALL_MS = 3e4;
let imglyInit = null; // { promise, config }
let imglyAttempt = 0;
const imglyProgressListeners = new Set();

function ensureImglyReady(onProgress) {
  if (onProgress) imglyProgressListeners.add(onProgress);
  if (!imglyInit) {
    imglyAttempt += 1;
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    let lastProgressAt = Date.now();
    const config = {
      model: IMGLY_MODEL,
      publicPath: IMGLY_PUBLIC_PATH,
      device: "cpu",
      // `attempt` changes the library's memoization key so a failed init can really be retried
      fetchArgs: { signal: controller?.signal, attempt: imglyAttempt },
      progress: (key, current, total) => {
        lastProgressAt = Date.now();
        if (total > 0) {
          const percent = Math.min(99, Math.round(current / total * 100));
          for (const listener of imglyProgressListeners) listener(percent, key);
        }
      }
    };
    const promise = (async () => {
      const { preload } = await import("@imgly/background-removal");
      let watchdog;
      const stalled = new Promise((_, reject) => {
        watchdog = setInterval(() => {
          if (Date.now() - lastProgressAt > IMGLY_STALL_MS) {
            controller?.abort();
            reject(new Error("IMGLY_DOWNLOAD_STALLED"));
          }
        }, 2e3);
      });
      try {
        await Promise.race([preload(config), stalled]);
        return config;
      } finally {
        clearInterval(watchdog);
      }
    })();
    imglyInit = { promise, config };
    promise.catch(() => {
      imglyInit = null;
    });
  }
  return imglyInit.promise.finally(() => {
    if (onProgress) imglyProgressListeners.delete(onProgress);
  });
}

async function generateSubjectMask(source, options = {}) {
  const width = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
  const height = source instanceof HTMLImageElement ? source.naturalHeight : source.height;
  // Default: fast MediaPipe engine. HD (@imgly, ~55 MB download) only when explicitly requested.
  const requestedEngine = options.engine === "imgly_hd" ? "imgly_hd" : "mediapipe_fast";
  const threshold = options.threshold ?? 0.45;
  let fallbackReason = null;
  if (requestedEngine === "imgly_hd") {
    try {
      if (options.onProgress) options.onProgress(5, "download");
      const imglyResult = await runImglySegmentation(source, options);
      if (imglyResult) {
        despeckleMask(imglyResult.maskCanvas);
        return { ...imglyResult, engineUsed: "imgly_hd", requestedEngine };
      }
    } catch (err) {
      console.warn("@imgly HD segmentation failed, falling back to MediaPipe:", err);
      fallbackReason = err?.message || "IMGLY_FAILED";
    }
  }
  try {
    if (options.onProgress) options.onProgress(40, "segment");
    const mpResult = await runMediaPipeSegmentation(source, width, height, threshold);
    if (mpResult) {
      despeckleMask(mpResult.maskCanvas);
      return { ...mpResult, engineUsed: "mediapipe_fast", requestedEngine, fallbackReason };
    }
  } catch (err) {
    console.warn("MediaPipe segmentation error:", err);
  }
  return {
    ...generateFallbackMask(source, width, height),
    engineUsed: "basic_fallback",
    requestedEngine,
    fallbackReason: fallbackReason || "MEDIAPIPE_FAILED",
    isFallback: true
  };
}
async function runImglySegmentation(source, options) {
  const config = await ensureImglyReady((percent) => {
    if (options.onProgress) options.onProgress(Math.max(5, Math.round(percent * 0.8)), "download");
  });
  const { removeBackground } = await import("@imgly/background-removal");
  let srcBlob;
  if (source instanceof HTMLImageElement) {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = source.naturalWidth;
    tempCanvas.height = source.naturalHeight;
    const ctx = tempCanvas.getContext("2d");
    ctx.drawImage(source, 0, 0);
    srcBlob = await new Promise((resolve) => tempCanvas.toBlob((b) => resolve(b), "image/png"));
  } else {
    srcBlob = await new Promise((resolve) => source.toBlob((b) => resolve(b), "image/png"));
  }
  if (options.onProgress) options.onProgress(85, "segment");
  // Same config object as preload → reuses the already-initialised session (no new download)
  const resultBlob = await removeBackground(srcBlob, config);
  const cutoutImg = new Image();
  cutoutImg.src = URL.createObjectURL(resultBlob);
  await new Promise((resolve, reject) => {
    cutoutImg.onload = resolve;
    cutoutImg.onerror = reject;
  });
  const width = cutoutImg.naturalWidth;
  const height = cutoutImg.naturalHeight;
  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = width;
  maskCanvas.height = height;
  const mCtx = maskCanvas.getContext("2d", { willReadFrequently: true });
  mCtx.drawImage(cutoutImg, 0, 0);
  const imgData = mCtx.getImageData(0, 0, width, height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    data[i] = 255;
    data[i + 1] = 255;
    data[i + 2] = 255;
    data[i + 3] = a;
  }
  mCtx.putImageData(imgData, 0, 0);
  URL.revokeObjectURL(cutoutImg.src);
  return {
    maskCanvas,
    maskData: data,
    width,
    height
  };
}
async function runMediaPipeSegmentation(source, targetW, targetH, threshold) {
  const segmenter = await initMediaPipeSegmenter();
  if (!segmenter) return null;
  let rawMaskCanvas = null;
  segmenter.segment(source, (result) => {
    if (result && result.confidenceMasks && result.confidenceMasks.length > 0) {
      const mask = result.confidenceMasks[0];
      const maskW = mask.width;
      const maskH = mask.height;
      const confidences = mask.getAsFloat32Array();
      const smallCanvas = document.createElement("canvas");
      smallCanvas.width = maskW;
      smallCanvas.height = maskH;
      const sCtx = smallCanvas.getContext("2d", { willReadFrequently: true });
      const sImgData = sCtx.createImageData(maskW, maskH);
      const sData = sImgData.data;
      for (let i = 0; i < confidences.length; i++) {
        const conf = confidences[i];
        let alpha = 0;
        if (conf >= threshold + 0.15) {
          alpha = 255;
        } else if (conf <= threshold - 0.15) {
          alpha = 0;
        } else {
          const t = (conf - (threshold - 0.15)) / 0.3;
          alpha = Math.round((3 * t * t - 2 * t * t * t) * 255);
        }
        const idx = i * 4;
        sData[idx] = 255;
        sData[idx + 1] = 255;
        sData[idx + 2] = 255;
        sData[idx + 3] = alpha;
      }
      sCtx.putImageData(sImgData, 0, 0);
      const fullCanvas = document.createElement("canvas");
      fullCanvas.width = targetW;
      fullCanvas.height = targetH;
      const fCtx = fullCanvas.getContext("2d", { willReadFrequently: true });
      fCtx.imageSmoothingEnabled = true;
      fCtx.imageSmoothingQuality = "high";
      fCtx.drawImage(smallCanvas, 0, 0, targetW, targetH);
      rawMaskCanvas = fullCanvas;
      mask.close();
    }
  });
  if (!rawMaskCanvas) return null;
  const maskCanvas = rawMaskCanvas;
  const ctx = maskCanvas.getContext("2d", { willReadFrequently: true });
  const imgData = ctx.getImageData(0, 0, targetW, targetH);
  return {
    maskCanvas,
    maskData: imgData.data,
    width: targetW,
    height: targetH
  };
}
function applyMaskChoke(maskCanvas, chokePx = 1) {
  if (chokePx <= 0) return maskCanvas;
  const w = maskCanvas.width;
  const h = maskCanvas.height;
  const radius = Math.min(4, Math.ceil(chokePx));
  const ctx = maskCanvas.getContext("2d", { willReadFrequently: true });
  const srcData = ctx.getImageData(0, 0, w, h);
  const src = srcData.data;
  const tempAlpha = new Uint8ClampedArray(w * h);
  for (let y = 0; y < h; y++) {
    const rowOffset = y * w;
    for (let x = 0; x < w; x++) {
      let minA = src[(rowOffset + x) * 4 + 3];
      const minX = Math.max(0, x - radius);
      const maxX = Math.min(w - 1, x + radius);
      for (let kx = minX; kx <= maxX; kx++) {
        const val = src[(rowOffset + kx) * 4 + 3];
        if (val < minA) minA = val;
      }
      tempAlpha[rowOffset + x] = minA;
    }
  }
  const output = document.createElement("canvas");
  output.width = w;
  output.height = h;
  const outCtx = output.getContext("2d", { willReadFrequently: true });
  const outData = outCtx.createImageData(w, h);
  const out = outData.data;
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      let minA = tempAlpha[y * w + x];
      const minY = Math.max(0, y - radius);
      const maxY = Math.min(h - 1, y + radius);
      for (let ky = minY; ky <= maxY; ky++) {
        const val = tempAlpha[ky * w + x];
        if (val < minA) minA = val;
      }
      const idx = (y * w + x) * 4;
      out[idx] = 255;
      out[idx + 1] = 255;
      out[idx + 2] = 255;
      out[idx + 3] = minA;
    }
  }
  outCtx.putImageData(outData, 0, 0);
  return output;
}
function despeckleMask(maskCanvas) {
  const w = maskCanvas.width;
  const h = maskCanvas.height;
  const ctx = maskCanvas.getContext("2d", { willReadFrequently: true });
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  const scale = Math.max(1, Math.floor(Math.max(w, h) / 256));
  const sw = Math.floor(w / scale);
  const sh = Math.floor(h / scale);
  const bin = new Uint8Array(sw * sh);
  for (let sy = 0; sy < sh; sy++) {
    const y = sy * scale;
    for (let sx = 0; sx < sw; sx++) {
      const x = sx * scale;
      const a = data[(y * w + x) * 4 + 3];
      if (a > 80) bin[sy * sw + sx] = 1;
    }
  }
  const labels = new Int32Array(sw * sh);
  let currentLabel = 0;
  const compSizes = [0];
  const compHasSubject = [false];
  const anchorX1 = Math.floor(sw * 0.25);
  const anchorX2 = Math.floor(sw * 0.75);
  const anchorY1 = Math.floor(sh * 0.4);
  const anchorY2 = Math.floor(sh * 0.98);
  const queueX = new Int32Array(sw * sh);
  const queueY = new Int32Array(sw * sh);
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const idx = y * sw + x;
      if (bin[idx] === 1 && labels[idx] === 0) {
        currentLabel++;
        let size = 0;
        let hitsAnchor = false;
        let qHead = 0;
        let qTail = 0;
        queueX[qTail] = x;
        queueY[qTail] = y;
        qTail++;
        labels[idx] = currentLabel;
        while (qHead < qTail) {
          const cx = queueX[qHead];
          const cy = queueY[qHead];
          qHead++;
          size++;
          if (cx >= anchorX1 && cx <= anchorX2 && cy >= anchorY1 && cy <= anchorY2) {
            hitsAnchor = true;
          }
          const nxList = [cx - 1, cx + 1, cx, cx];
          const nyList = [cy, cy, cy - 1, cy + 1];
          for (let k = 0; k < 4; k++) {
            const nx = nxList[k];
            const ny = nyList[k];
            if (nx >= 0 && nx < sw && ny >= 0 && ny < sh) {
              const nIdx = ny * sw + nx;
              if (bin[nIdx] === 1 && labels[nIdx] === 0) {
                labels[nIdx] = currentLabel;
                queueX[qTail] = nx;
                queueY[qTail] = ny;
                qTail++;
              }
            }
          }
        }
        compSizes.push(size);
        compHasSubject.push(hitsAnchor);
      }
    }
  }
  const minKeepSize = Math.floor(sw * sh * 0.035);
  const keepLabel = new Uint8Array(currentLabel + 1);
  for (let l = 1; l <= currentLabel; l++) {
    if (compHasSubject[l] || compSizes[l] > minKeepSize) {
      keepLabel[l] = 1;
    }
  }
  let modified = false;
  for (let y = 0; y < h; y++) {
    const sy = Math.min(sh - 1, Math.floor(y / scale));
    for (let x = 0; x < w; x++) {
      const sx = Math.min(sw - 1, Math.floor(x / scale));
      const l = labels[sy * sw + sx];
      if (l > 0 && keepLabel[l] === 0) {
        data[(y * w + x) * 4 + 3] = 0;
        modified = true;
      }
    }
  }
  if (modified) {
    ctx.putImageData(imgData, 0, 0);
  }
  return maskCanvas;
}
function renderCompositeImage(source, maskCanvas, bgColor, useVignette = false, featherPx = 1, chokePx = 0.5, defringe = true) {
  const width = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
  const height = source instanceof HTMLImageElement ? source.naturalHeight : source.height;
  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = width;
  outputCanvas.height = height;
  const ctx = outputCanvas.getContext("2d", { willReadFrequently: true });
  if (useVignette) {
    const grad = ctx.createRadialGradient(
      width / 2,
      height * 0.38,
      width * 0.15,
      width / 2,
      height * 0.45,
      width * 0.85
    );
    grad.addColorStop(0, adjustColorBrightness(bgColor, 18));
    grad.addColorStop(1, adjustColorBrightness(bgColor, -18));
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = bgColor;
  }
  ctx.fillRect(0, 0, width, height);
  let processedMask = maskCanvas;
  if (chokePx > 0) {
    processedMask = applyMaskChoke(maskCanvas, chokePx);
  }
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext("2d", { willReadFrequently: true });
  if (featherPx > 0) {
    tempCtx.filter = `blur(${featherPx}px)`;
  }
  tempCtx.drawImage(processedMask, 0, 0);
  tempCtx.filter = "none";
  tempCtx.globalCompositeOperation = "source-in";
  tempCtx.drawImage(source, 0, 0);
  if (defringe) {
    applyDefringe(tempCtx, width, height);
  }
  ctx.drawImage(tempCanvas, 0, 0);
  return outputCanvas;
}
function applyDefringe(ctx, width, height) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a > 10 && a < 240) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const factor = (255 - a) / 255 * 0.4;
      data[i] = Math.round(r * (1 - factor) + lum * factor);
      data[i + 1] = Math.round(g * (1 - factor) + lum * factor);
      data[i + 2] = Math.round(b * (1 - factor) + lum * factor);
    }
  }
  ctx.putImageData(imgData, 0, 0);
}
function generateFallbackMask(source, width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(source, 0, 0);
  const srcData = ctx.getImageData(0, 0, width, height);
  const _src = srcData.data;
  const maskImg = ctx.createImageData(width, height);
  const mask = maskImg.data;
  const centerX = width / 2;
  const centerY = height * 0.45;
  const radiusX = width * 0.44;
  const radiusY = height * 0.54;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const dx = (x - centerX) / radiusX;
      const dy = (y - centerY) / radiusY;
      const ellipseDist = dx * dx + dy * dy;
      let alpha = 255;
      if (ellipseDist > 1) {
        alpha = Math.max(0, 255 - (ellipseDist - 1) * 800);
      }
      mask[idx] = 255;
      mask[idx + 1] = 255;
      mask[idx + 2] = 255;
      mask[idx + 3] = alpha;
    }
  }
  ctx.putImageData(maskImg, 0, 0);
  return {
    maskCanvas: canvas,
    maskData: mask,
    width,
    height
  };
}
function applyBrushToMask(maskCanvas, x, y, radius, mode, softness = 0.5) {
  const ctx = maskCanvas.getContext("2d");
  ctx.save();
  ctx.globalCompositeOperation = mode === "erase" ? "destination-out" : "source-over";
  const grad = ctx.createRadialGradient(x, y, radius * (1 - softness), x, y, radius);
  if (mode === "erase") {
    grad.addColorStop(0, "rgba(0,0,0,1)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
  } else {
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
  }
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
function adjustColorBrightness(hex, percent) {
  let num = parseInt(hex.replace("#", ""), 16);
  if (isNaN(num)) return hex;
  let r = (num >> 16) + Math.round(255 * percent / 100);
  let g = (num >> 8 & 255) + Math.round(255 * percent / 100);
  let b = (num & 255) + Math.round(255 * percent / 100);
  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
export {
  applyBrushToMask,
  applyMaskChoke,
  despeckleMask,
  generateSubjectMask,
  initMediaPipeSegmenter,
  renderCompositeImage
};
