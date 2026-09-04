import { mmToPixels } from './exportEngine.js';
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
  const eyeMidY = (face.landmarks.leftEye.y + face.landmarks.rightEye.y) / 2;
  const chinY = face.landmarks.mouthCenter.y + (face.landmarks.mouthCenter.y - eyeMidY) * 0.6;
  const crownY = eyeMidY - (chinY - eyeMidY) * 1.15;
  const originalHeadH = Math.max(face.box.height * 1.1, chinY - crownY);
  const renderedHeadH = originalHeadH * totalScale;
  const faceHeightRatio = renderedHeadH / targetH * 100;
  const isFaceRatioAcceptable = faceHeightRatio >= standard.faceHeightPercentMin - 5 && faceHeightRatio <= standard.faceHeightPercentMax + 5;
  if (faceHeightRatio < standard.faceHeightPercentMin - 5) {
    warnings.push({
      code: "FACE_TOO_SMALL",
      severity: "warning",
      message: {
        ja: `顔の比率 (${Math.round(faceHeightRatio)}%) が規格基準 (${standard.faceHeightPercentMin}%〜) より小さめです。拡大してください。`,
        vi: `Khuôn mặt (${Math.round(faceHeightRatio)}%) nhỏ hơn chuẩn quy định (${standard.faceHeightPercentMin}%-). Hãy phóng to thêm một chút.`,
        en: `Face size (${Math.round(faceHeightRatio)}%) is smaller than standard (${standard.faceHeightPercentMin}%+). Please zoom in.`
      }
    });
  } else if (faceHeightRatio > standard.faceHeightPercentMax + 5) {
    warnings.push({
      code: "FACE_TOO_LARGE",
      severity: "warning",
      message: {
        ja: `顔の比率 (${Math.round(faceHeightRatio)}%) が規格基準 (〜${standard.faceHeightPercentMax}%) より大きめです。縮小してください。`,
        vi: `Khuôn mặt (${Math.round(faceHeightRatio)}%) to hơn chuẩn quy định (tối đa ${standard.faceHeightPercentMax}%). Hãy thu nhỏ lại một chút.`,
        en: `Face size (${Math.round(faceHeightRatio)}%) is larger than standard (max ${standard.faceHeightPercentMax}%). Please zoom out.`
      }
    });
  }
  const renderedCrownY = targetH / 2 + transform.offsetY - (sourceHeight / 2 - crownY) * totalScale;
  const topMarginPercent = renderedCrownY / targetH * 100;
  const isTopMarginAcceptable = topMarginPercent >= 4 && topMarginPercent <= 25;
  if (topMarginPercent < 4) {
    warnings.push({
      code: "MARGIN_TOO_SMALL",
      severity: "warning",
      message: {
        ja: "頭頂部が写真の上枠に近すぎるか、切れています。少し下に移動してください。",
        vi: "Đỉnh đầu quá sát hoặc bị chạm mép trên của ảnh. Hãy kéo ảnh xuống dưới một chút.",
        en: "Top of head is too close to upper border. Please shift the photo downward."
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
        ja: "顔が左右の中心から少しずれています。「AIで自動位置合わせ」で中央に配置できます。",
        vi: 'Khuôn mặt đang lệch tâm sang một bên. Bạn có thể bấm "AI tự động căn vị trí" để căn giữa.',
        en: 'Face is slightly off-center horizontally. Use "Auto-Align with AI" to center.'
      }
    });
  }
  return {
    hasFace: true,
    tiltAngleDeg: Math.round(effectiveTilt * 10) / 10,
    isTiltAcceptable,
    faceHeightRatio: Math.round(faceHeightRatio),
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
