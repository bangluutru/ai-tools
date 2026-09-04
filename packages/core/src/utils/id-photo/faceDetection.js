let faceDetectorInstance = null;
let isInitializing = false;
async function initFaceDetector() {
  if (typeof window === "undefined") return null;
  if (faceDetectorInstance) return faceDetectorInstance;
  if (isInitializing) {
    await new Promise((r) => setTimeout(r, 500));
    if (faceDetectorInstance) return faceDetectorInstance;
  }
  try {
    isInitializing = true;
    const { FilesetResolver, FaceDetector } = await import("@mediapipe/tasks-vision");
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
    );
    faceDetectorInstance = await FaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
        delegate: "GPU"
      },
      runningMode: "IMAGE"
    });
    return faceDetectorInstance;
  } catch (err) {
    console.warn("MediaPipe FaceDetector CDN init failed, using fallback detector:", err);
    return null;
  } finally {
    isInitializing = false;
  }
}
async function detectFace(source) {
  const width = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
  const height = source instanceof HTMLImageElement ? source.naturalHeight : source.height;
  if (!width || !height) return null;
  try {
    const detector = await initFaceDetector();
    if (detector) {
      const detections = detector.detect(source);
      if (detections && detections.detections && detections.detections.length > 0) {
        const primary = detections.detections[0];
        const bb = primary.boundingBox;
        const keypoints = primary.keypoints || [];
        const rightEye = keypoints[0] ? { x: keypoints[0].x * width, y: keypoints[0].y * height } : { x: bb.originX + bb.width * 0.3, y: bb.originY + bb.height * 0.35 };
        const leftEye = keypoints[1] ? { x: keypoints[1].x * width, y: keypoints[1].y * height } : { x: bb.originX + bb.width * 0.7, y: bb.originY + bb.height * 0.35 };
        const noseTip = keypoints[2] ? { x: keypoints[2].x * width, y: keypoints[2].y * height } : { x: bb.originX + bb.width * 0.5, y: bb.originY + bb.height * 0.55 };
        const mouthCenter = keypoints[3] ? { x: keypoints[3].x * width, y: keypoints[3].y * height } : { x: bb.originX + bb.width * 0.5, y: bb.originY + bb.height * 0.75 };
        const dx = leftEye.x - rightEye.x;
        const dy = leftEye.y - rightEye.y;
        const tiltAngleDeg = Math.atan2(dy, dx) * 180 / Math.PI;
        return {
          box: {
            x: bb.originX,
            y: bb.originY,
            width: bb.width,
            height: bb.height
          },
          landmarks: {
            leftEye,
            rightEye,
            noseTip,
            mouthCenter
          },
          tiltAngleDeg,
          confidence: primary.categories?.[0]?.score || 0.9
        };
      }
    }
  } catch (err) {
    console.warn("Error during MediaPipe face detection:", err);
  }
  return detectFaceFallback(source);
}
function detectFaceFallback(source) {
  const width = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
  const height = source instanceof HTMLImageElement ? source.naturalHeight : source.height;
  const faceW = width * 0.38;
  const faceH = faceW * 1.3;
  const faceX = (width - faceW) / 2;
  const faceY = height * 0.22;
  const rightEye = { x: faceX + faceW * 0.32, y: faceY + faceH * 0.35 };
  const leftEye = { x: faceX + faceW * 0.68, y: faceY + faceH * 0.35 };
  const noseTip = { x: faceX + faceW * 0.5, y: faceY + faceH * 0.55 };
  const mouthCenter = { x: faceX + faceW * 0.5, y: faceY + faceH * 0.75 };
  return {
    box: {
      x: faceX,
      y: faceY,
      width: faceW,
      height: faceH
    },
    landmarks: {
      leftEye,
      rightEye,
      noseTip,
      mouthCenter
    },
    tiltAngleDeg: 0,
    confidence: 0.75
  };
}
function computeAutoFraming(face, imageWidth, imageHeight, standard) {
  const targetFaceRatio = (standard.faceHeightPercentMin + standard.faceHeightPercentMax) / 200;
  const targetTopMarginRatio = (standard.topMarginPercentMin + standard.topMarginPercentMax) / 200;
  const eyeMidX = (face.landmarks.leftEye.x + face.landmarks.rightEye.x) / 2;
  const eyeMidY = (face.landmarks.leftEye.y + face.landmarks.rightEye.y) / 2;
  const mouthY = face.landmarks.mouthCenter.y;
  const eyeToMouth = Math.max(10, mouthY - eyeMidY);
  const chinY = mouthY + eyeToMouth * 0.55;
  const crownY = eyeMidY - eyeToMouth * 1.25;
  const estimatedHeadHeight = Math.max(face.box.height * 1.15, chinY - crownY);
  const headCenterY = (crownY + chinY) / 2;
  const targetW = Math.round(standard.widthMm / 25.4 * 300);
  const targetH = Math.round(standard.heightMm / 25.4 * 300);
  const baseScale = Math.max(targetW / imageWidth, targetH / imageHeight);
  const desiredTotalScale = targetFaceRatio * targetH / estimatedHeadHeight;
  const rawScale = desiredTotalScale / baseScale;
  const scale = Math.max(0.4, Math.min(3.5, rawScale));
  const effectiveTotalScale = baseScale * scale;
  const offsetX = (imageWidth / 2 - eyeMidX) * effectiveTotalScale;
  const targetHeadCenterY = (targetTopMarginRatio + targetFaceRatio / 2) * targetH;
  const offsetY = targetHeadCenterY - targetH / 2 - (headCenterY - imageHeight / 2) * effectiveTotalScale;
  const rotation = -Math.round(face.tiltAngleDeg * 10) / 10;
  return {
    scale: Math.round(scale * 100) / 100,
    offsetX: Math.round(offsetX),
    offsetY: Math.round(offsetY),
    rotation: Math.abs(rotation) <= 15 ? rotation : 0
  };
}
export {
  computeAutoFraming,
  detectFace,
  initFaceDetector
};
