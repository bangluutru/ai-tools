/**
 * Pinned runtime asset URLs for the id-photo miniapp.
 *
 * MEDIAPIPE_VERSION must equal the installed @mediapipe/tasks-vision version (the JS bundle and
 * the wasm loaded from the CDN must match). The package does not export its package.json, so the
 * version is pinned here and checked by packages/core/tests/id-photo-accuracy.test.js.
 */
export const MEDIAPIPE_VERSION = "0.10.35";
export const MEDIAPIPE_WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`;
// Versioned model paths (no "/latest/") so a model update cannot silently change results.
export const FACE_DETECTOR_MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";
export const SELFIE_SEGMENTER_MODEL_URL = "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/1/selfie_segmenter.tflite";

/**
 * @imgly/background-removal — LICENSE: AGPL-3.0 (see node_modules/@imgly/background-removal/LICENSE.md).
 * Licensing implications for this closed/hosted app must be reviewed by the owner.
 * IMGLY_VERSION must equal the installed package version (data files are versioned together).
 */
export const IMGLY_VERSION = "1.7.0";
export const IMGLY_PUBLIC_PATH = `https://staticimgly.com/@imgly/background-removal-data/${IMGLY_VERSION}/dist/`;
// "isnet_quint8" (the library's "small" model): 42.3 MiB + onnxruntime wasm 11.3 MiB (CPU) ≈ 55 MB,
// instead of 84.1 MiB for isnet_fp16 (sizes from background-removal-data 1.7.0 resources.json).
export const IMGLY_MODEL = "isnet_quint8";
export const IMGLY_APPROX_DOWNLOAD_MB = 55;

let visionFilesetPromise = null;
/** Loads the MediaPipe wasm fileset once and shares it between the face detector and segmenter. */
export function getVisionFileset() {
  if (!visionFilesetPromise) {
    visionFilesetPromise = import("@mediapipe/tasks-vision").then(({ FilesetResolver }) => FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL)).catch((err) => {
      visionFilesetPromise = null;
      throw err;
    });
  }
  return visionFilesetPromise;
}
