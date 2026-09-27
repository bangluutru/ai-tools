import { mmToPixels } from './exportEngine.js';
import { estimateHeadBounds } from './faceDetection.js';

const fmt = (v) => (Math.round(v * 10) / 10).toString();
function validateFraming(face, sourceWidth, sourceHeight, standard, transform) {
  const warnings = [];
  if (!face) {
    warnings.push({
      code: "NO_FACE",
      severity: "error",
      name: "NO_FACE",
      message: {
        ja: "顔が検出されませんでした。正面を向いた明るい写真をご使用ください。",
        vi: "Không phát hiện khuôn mặt. Vui lòng sử dụng ảnh chụp chính diện rõ nét.",
        en: "No face detected. Please use a clear, front-facing portrait photo."
      }
    });
    return {
      hasFace: false,
      tiltAngleDeg: 0,
      isTiltAcceptable: true,
      faceHeightRatio: 0,
      isFaceRatioAcceptable: false,
      isTopMarginAcceptable: false,
      effectiveDpi: 0,
      isResolutionAcceptable: false,
      isCentered: false,
      warnings
    };
  }
  const effectiveTilt = face.tiltAngleDeg + transform.rotation;
  const isTiltAcceptable = Math.abs(effectiveTilt) <= 3.5;
  if (!isTiltAcceptable) {
    const deg = Math.abs(Math.round(effectiveTilt * 10) / 10);
    warnings.push({
      code: "TILT_EXCESSIVE",
      severity: "warning",
      message: {
        ja: `首が約 ${deg}° 傾いています。水平になるよう傾きスライダーで補正してください。`,
        vi: `Đầu đang bị nghiêng khoảng ${deg}°. Hãy chỉnh thanh góc nghiêng để đầu thẳng lại.`,
        en: `Head is tilted by ~${deg}°. Please use the rotation slider to straighten.`
      }
    });
  }
  const targetW = mmToPixels(standard.widthMm, 300);
  const targetH = mmToPixels(standard.heightMm, 300);
  const baseScale = Math.max(targetW / sourceWidth, targetH / sourceHeight);
  const totalScale = baseScale * transform.scale;
  const { crownY, headHeight: originalHeadH } = estimateHeadBounds(face);
  const renderedHeadH = originalHeadH * totalScale;
  const faceHeightRatio = renderedHeadH / targetH * 100;
  const faceMm = faceHeightRatio / 100 * standard.heightMm;
  const faceMin = standard.faceHeightPercentMin;
  const faceMax = standard.faceHeightPercentMax;
  // Tiny epsilon only for floating-point noise — no extra tolerance beyond the standard's range
  const EPS = 0.05;
  const isFaceRatioAcceptable = faceHeightRatio >= faceMin - EPS && faceHeightRatio <= faceMax + EPS;
  const rangeMm = `${fmt(faceMin / 100 * standard.heightMm)}–${fmt(faceMax / 100 * standard.heightMm)}mm`;
  if (faceHeightRatio < faceMin - EPS) {
    warnings.push({
      code: "FACE_TOO_SMALL",
      severity: "warning",
      message: {
        ja: `顔の縦の長さ（推定 約${fmt(faceMm)}mm / ${fmt(faceHeightRatio)}%）が参考規格（${rangeMm}）より小さめです。拡大してください。`,
        vi: `Chiều cao mặt (ước tính ~${fmt(faceMm)}mm / ${fmt(faceHeightRatio)}%) nhỏ hơn khoảng tham khảo (${rangeMm}). Hãy phóng to thêm một chút.`,
        en: `Face height (estimated ~${fmt(faceMm)}mm / ${fmt(faceHeightRatio)}%) is below the reference range (${rangeMm}). Please zoom in.`
      }
    });
  } else if (faceHeightRatio > faceMax + EPS) {
    warnings.push({
      code: "FACE_TOO_LARGE",
      severity: "warning",
      message: {
        ja: `顔の縦の長さ（推定 約${fmt(faceMm)}mm / ${fmt(faceHeightRatio)}%）が参考規格（${rangeMm}）より大きめです。縮小してください。`,
        vi: `Chiều cao mặt (ước tính ~${fmt(faceMm)}mm / ${fmt(faceHeightRatio)}%) lớn hơn khoảng tham khảo (${rangeMm}). Hãy thu nhỏ lại một chút.`,
        en: `Face height (estimated ~${fmt(faceMm)}mm / ${fmt(faceHeightRatio)}%) is above the reference range (${rangeMm}). Please zoom out.`
      }
    });
  }
  const renderedCrownY = targetH / 2 + transform.offsetY - (sourceHeight / 2 - crownY) * totalScale;
  const topMarginPercent = renderedCrownY / targetH * 100;
  const topMin = standard.topMarginPercentMin;
  const topMax = standard.topMarginPercentMax;
  const isTopMarginAcceptable = topMarginPercent >= topMin - EPS && topMarginPercent <= topMax + EPS;
  const topRangeMm = `${fmt(topMin / 100 * standard.heightMm)}–${fmt(topMax / 100 * standard.heightMm)}mm`;
  const topMm = fmt(topMarginPercent / 100 * standard.heightMm);
  if (topMarginPercent < topMin - EPS) {
    warnings.push({
      code: "MARGIN_TOO_SMALL",
      severity: "warning",
      message: {
        ja: `頭頂から上端までの余白（推定 約${topMm}mm）が参考規格（${topRangeMm}）より狭いです。少し下に移動してください。`,
        vi: `Khoảng cách đỉnh đầu tới mép trên (ước tính ~${topMm}mm) nhỏ hơn khoảng tham khảo (${topRangeMm}). Hãy kéo ảnh xuống dưới một chút.`,
        en: `Space above the head (estimated ~${topMm}mm) is below the reference range (${topRangeMm}). Please shift the photo down.`
      }
    });
  } else if (topMarginPercent > topMax + EPS) {
    warnings.push({
      code: "MARGIN_TOO_LARGE",
      severity: "warning",
      message: {
        ja: `頭頂から上端までの余白（推定 約${topMm}mm）が参考規格（${topRangeMm}）より広いです。少し上に移動してください。`,
        vi: `Khoảng cách đỉnh đầu tới mép trên (ước tính ~${topMm}mm) lớn hơn khoảng tham khảo (${topRangeMm}). Hãy kéo ảnh lên trên một chút.`,
        en: `Space above the head (estimated ~${topMm}mm) is above the reference range (${topRangeMm}). Please shift the photo up.`
      }
    });
  }
  const cropBoxWidthPx = targetW / totalScale;
  const effectiveDpi = Math.round(cropBoxWidthPx / (standard.widthMm / 25.4));
  const isResolutionAcceptable = effectiveDpi >= 260;
  if (!isResolutionAcceptable) {
    warnings.push({
      code: "LOW_RESOLUTION",
      severity: "warning",
      message: {
        ja: `元写真の解像度がやや低めです (約 ${effectiveDpi} DPI)。コンビニ印刷時に画質が粗くなる可能性があります。`,
        vi: `Độ phân giải ảnh gốc hơi thấp (khoảng ${effectiveDpi} DPI). Ảnh có thể bị vỡ hạt khi in thực tế.`,
        en: `Source resolution is low (~${effectiveDpi} DPI). The print output may appear pixelated.`
      }
    });
  }
  const renderedEyeMidX = targetW / 2 + transform.offsetX - (sourceWidth / 2 - (face.landmarks.leftEye.x + face.landmarks.rightEye.x) / 2) * totalScale;
  const horizontalDeviationPercent = Math.abs((renderedEyeMidX - targetW / 2) / targetW) * 100;
  const isCentered = horizontalDeviationPercent <= 8;
  if (!isCentered) {
    warnings.push({
      code: "OFF_CENTER",
      severity: "info",
      message: {
        ja: "顔が左右の中心から少しずれています。「自動位置合わせ」で中央に配置できます。",
        vi: 'Khuôn mặt đang lệch tâm sang một bên. Bạn có thể bấm "Tự động căn vị trí" để căn giữa.',
        en: 'Face is slightly off-center horizontally. Use "Auto-align" to center.'
      }
    });
  }
  return {
    hasFace: true,
    tiltAngleDeg: Math.round(effectiveTilt * 10) / 10,
    isTiltAcceptable,
    faceHeightRatio: Math.round(faceHeightRatio * 10) / 10,
    faceHeightMm: Math.round(faceMm * 10) / 10,
    topMarginPercent: Math.round(topMarginPercent * 10) / 10,
    isFaceRatioAcceptable,
    isTopMarginAcceptable,
    effectiveDpi,
    isResolutionAcceptable,
    isCentered,
    warnings
  };
}
export {
  validateFraming
};
