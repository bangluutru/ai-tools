/**
 * Quy cách ảnh thẻ — CHỈ ĐỂ THAM KHẢO. Không phải chứng nhận ICAO hay xác nhận của cơ quan cấp.
 * Luôn đối chiếu quy định mới nhất của nơi nộp hồ sơ.
 *
 * spec.faceHeightMm / spec.topMarginMm: khoảng [min, max] tính bằng mm
 *   - faceHeight = từ đỉnh đầu (gồm tóc) đến cằm
 *   - topMargin  = từ đỉnh đầu tới mép trên ảnh
 * spec.level: "official" = số liệu lấy từ quy định/hình mẫu của cơ quan cấp;
 *             "reference" = cơ quan không công bố tỉ lệ, dùng khoảng tham khảo phổ biến.
 * Các trường *PercentMin/Max được tính CHÍNH XÁC từ mm (không cộng trừ dung sai).
 */
function withSpec(std) {
  const { spec } = std;
  if (!spec) return std;
  const pct = (mm) => mm / std.heightMm * 100;
  return {
    ...std,
    faceHeightPercentMin: pct(spec.faceHeightMm[0]),
    faceHeightPercentMax: pct(spec.faceHeightMm[1]),
    topMarginPercentMin: pct(spec.topMarginMm[0]),
    topMarginPercentMax: pct(spec.topMarginMm[1])
  };
}
const ID_STANDARDS = [
  // --- JAPAN ---
  {
    id: "jp-resume",
    category: "japan",
    name: {
      ja: "履歴書・就活 (30×40mm)",
      vi: "Sơ yếu lý lịch Nhật (30×40mm)",
      en: "Japanese Resume (30×40mm)"
    },
    description: {
      ja: "アルバイト・就職活動・転職用の一般的な履歴書写真サイズ。白または薄い青背景。",
      vi: "Kích thước chuẩn cho CV xin việc, baito, shukatsu tại Nhật. Nền trắng hoặc xanh nhạt.",
      en: "Standard size for Japanese CV, job hunting, and part-time jobs. White or light blue background."
    },
    widthMm: 30,
    heightMm: 40,
    // Không có quy định chính thức cho ảnh 履歴書 — khoảng tham khảo phổ biến
    spec: { level: "reference", faceHeightMm: [20, 26], topMarginMm: [4, 7.2], source: "Common resume photo guidance (no official rule)" },
    defaultBgColor: "#4A90E2",
    // Traditional soft blue or white
    recommendedPaper: "paper-l"
  },
  {
    id: "jp-passport",
    category: "japan",
    name: {
      ja: "パスポート・マイナンバー (35×45mm)",
      vi: "Hộ chiếu Nhật / My Number (35×45mm)",
      en: "Japan Passport / My Number (35×45mm)"
    },
    description: {
      ja: "日本の旅券申請およびマイナンバーカード申請用。外務省規格: 顔の縦の長さ34mm±2mm、頭頂から上端まで4mm±2mm。白背景。",
      vi: "Hộ chiếu Nhật và thẻ My Number. Theo MOFA: chiều cao mặt (đỉnh đầu–cằm) 34mm±2mm, đỉnh đầu cách mép trên 4mm±2mm. Nền trắng.",
      en: "Japan passport and My Number card. Per MOFA: face height (crown to chin) 34mm±2mm, top of head to upper edge 4mm±2mm. White background."
    },
    widthMm: 35,
    heightMm: 45,
    // MOFA パスポート申請用写真の規格: 顔の縦 34±2mm, 頭頂〜上端 4±2mm → 71.1–80.0%, 4.4–13.3%
    spec: { level: "official", faceHeightMm: [32, 36], topMarginMm: [2, 6], source: "MOFA passport photo standard" },
    defaultBgColor: "#FFFFFF",
    recommendedPaper: "paper-l"
  },
  {
    id: "jp-drivers-license",
    category: "japan",
    name: {
      ja: "運転免許証 (24×30mm)",
      vi: "Bằng lái xe Nhật (24×30mm)",
      en: "Japan Driver's License (24×30mm)"
    },
    description: {
      ja: "運転免許証の更新・申請用写真。無背景（通常は薄い青またはグレー）。",
      vi: "Kích thước ảnh gia hạn hoặc cấp mới bằng lái xe tại Nhật. Nền xanh nhạt hoặc xám.",
      en: "Standard photo for Japanese driver's license renewal. Plain background, usually light blue or gray."
    },
    widthMm: 24,
    heightMm: 30,
    spec: { level: "reference", faceHeightMm: [15, 19.5], topMarginMm: [3, 5.4], source: "No official face ratio published (police: 3.0×2.4cm, frontal, upper body)" },
    defaultBgColor: "#5A9BD5",
    recommendedPaper: "paper-l"
  },
  {
    id: "jp-residence-card",
    category: "japan",
    name: {
      ja: "在留カード更新・申請 (30×40mm)",
      vi: "Thẻ ngoại kiều Tại Nhật (30×40mm)",
      en: "Japan Residence Card (30×40mm)"
    },
    description: {
      ja: "出入国在留管理局（入管）の在留資格更新・変更申請用。無背景・白。",
      vi: "Dùng cho nộp cục Xuất nhập cảnh gia hạn / đổi tư cách lưu trú. Nền trắng trơn.",
      en: "Immigration Services Agency residence card renewal and visa status change. Solid white background."
    },
    widthMm: 30,
    heightMm: 40,
    // 出入国在留管理庁「提出写真の規格」参考図: 頭頂〜顎 25±3mm, 頭頂〜上端 5±3mm
    spec: { level: "official", faceHeightMm: [22, 28], topMarginMm: [2, 8], source: "ISA photo standard reference diagram" },
    defaultBgColor: "#FFFFFF",
    recommendedPaper: "paper-l"
  },
  {
    id: "jp-intl-license",
    category: "japan",
    name: {
      ja: "国際運転免許証 (40×50mm)",
      vi: "Bằng lái quốc tế Nhật (40×50mm)",
      en: "Japan International Driving Permit (40×50mm)"
    },
    description: {
      ja: "国外運転免許証交付申請用写真。正面無背景。",
      vi: "Ảnh cấp bằng lái xe quốc tế tại Nhật. Nền trơn.",
      en: "International Driving Permit application in Japan. Clear neutral background."
    },
    widthMm: 40,
    heightMm: 50,
    spec: { level: "reference", faceHeightMm: [32.5, 39], topMarginMm: [4, 7], source: "No official face ratio published" },
    defaultBgColor: "#FFFFFF",
    recommendedPaper: "paper-l"
  },
  // --- INTERNATIONAL ---
  {
    id: "us-visa",
    category: "international",
    name: {
      ja: "米国ビザ・パスポート (51×51mm / 2×2 inch)",
      vi: "Visa & Hộ chiếu Mỹ (51×51mm / 2x2 inch)",
      en: "US Visa & Passport (51×51mm / 2×2 in)"
    },
    description: {
      ja: "米国ビザ（DS-160）および米国パスポート用 2×2インチ。頭部（顎〜髪の頂点）1〜1 3/8インチ（25.4〜34.9mm）。白背景。",
      vi: "Ảnh vuông 2×2 inch cho visa Mỹ DS-160 và hộ chiếu Mỹ. Chiều cao đầu (cằm–đỉnh tóc) 1–1 3/8 inch (25,4–34,9mm). Nền trắng.",
      en: "Square 2×2 inch format for US Visa (DS-160) and US Passport. Head (chin to top of hair) 1–1 3/8 in (25.4–34.9mm). White background."
    },
    widthMm: 50.8,
    heightMm: 50.8,
    // travel.state.gov: head 1 – 1 3/8 in → 50–68.75%. Top margin is not specified (derived reference range).
    spec: { level: "official", faceHeightMm: [25.4, 34.925], topMarginMm: [2, 9], topMarginLevel: "reference", source: "US Department of State photo requirements" },
    defaultBgColor: "#FFFFFF",
    recommendedPaper: "paper-l"
  },
  {
    id: "schengen-visa",
    category: "international",
    name: {
      ja: "シェンゲンビザ / 欧州 (35×45mm)",
      vi: "Visa Schengen / Châu Âu (35×45mm)",
      en: "Schengen / Europe Visa (35×45mm)"
    },
    description: {
      ja: "ヨーロッパ各国のシェンゲンビザ申請規格。薄いグレーまたは白背景。",
      vi: "Tiêu chuẩn ảnh nộp thị thực các nước khối Schengen châu Âu. Nền xám nhạt hoặc trắng.",
      en: "Standard photo for European Schengen visa applications. Light gray or white background."
    },
    widthMm: 35,
    heightMm: 45,
    // ICAO 9303: chin-to-crown 70–80% of photo height. Top margin not fixed by ICAO (reference range).
    spec: { level: "official", faceHeightMm: [31.5, 36], topMarginMm: [2, 6], topMarginLevel: "reference", source: "ICAO Doc 9303 portrait guidance" },
    defaultBgColor: "#F0F0F0",
    recommendedPaper: "paper-l"
  },
  // --- VIETNAM ---
  {
    id: "vn-passport",
    category: "vietnam",
    name: {
      ja: "ベトナムパスポート (40×60mm)",
      vi: "Hộ chiếu Việt Nam (40×60mm)",
      en: "Vietnam Passport (40×60mm)"
    },
    description: {
      ja: "ベトナム旅券申請・大使館/領事館手続き用（4×6cm）。白背景。顔の比率は規定されていないため、ここでの範囲は参考値です。",
      vi: "Ảnh 4×6cm làm hộ chiếu Việt Nam, thủ tục tại Đại sứ quán/Lãnh sự quán. Nền trắng. Quy định không nêu tỉ lệ khuôn mặt — khoảng kiểm tra ở đây chỉ để tham khảo.",
      en: "4×6 cm photo for Vietnam passport and embassy procedures. White background. The regulation sets size/background but no face ratio — the face range here is a reference only."
    },
    widthMm: 40,
    heightMm: 60,
    // Quy định (Bộ Công an) chỉ nêu cỡ 4×6cm, nhìn thẳng, đầu để trần, nền trắng; không công bố tỉ lệ mặt.
    // Khoảng tham khảo: đỉnh đầu–cằm 32–36mm theo hướng dẫn ICAO phổ biến.
    spec: { level: "reference", faceHeightMm: [32, 36], topMarginMm: [4, 10], source: "No official face ratio (MPS: 4×6cm, frontal, white background)" },
    defaultBgColor: "#FFFFFF",
    recommendedPaper: "paper-l"
  },
  {
    id: "vn-id-card",
    category: "vietnam",
    name: {
      ja: "ベトナム一般書類用写真 (3×4cm)",
      vi: "Ảnh thẻ hồ sơ Việt Nam (30×40mm)",
      en: "Vietnam Standard ID (30×40mm)"
    },
    description: {
      ja: "ベトナムの各種申請書類用の一般的な3×4cm写真。白または青背景。※CCCD（国民身分証）の写真は警察窓口で撮影されるため対象外です。",
      vi: "Ảnh 3x4cm thông dụng cho hồ sơ, học bạ, thủ tục hành chính VN. Nền trắng hoặc xanh. (Ảnh CCCD do cơ quan công an chụp trực tiếp, không dùng ảnh này.)",
      en: "General 3×4 cm photo for administrative forms, applications and student records. White or blue background. (Not for the CCCD citizen ID card — that photo is taken at the police office.)"
    },
    widthMm: 30,
    heightMm: 40,
    spec: { level: "reference", faceHeightMm: [22, 28], topMarginMm: [4, 6.4], source: "No official face ratio published" },
    defaultBgColor: "#FFFFFF",
    recommendedPaper: "paper-l"
  },
  // --- CUSTOM ---
  {
    id: "custom-size",
    category: "custom",
    name: {
      ja: "カスタムサイズ (自由設定)",
      vi: "Kích thước tùy chỉnh (mm)",
      en: "Custom Dimensions (mm)"
    },
    description: {
      ja: "ミリ単位で幅と高さを自由に設定できます。",
      vi: "Tùy chỉnh chiều rộng và chiều cao bất kỳ theo đơn vị milimet.",
      en: "Set custom width and height in exact millimeters."
    },
    widthMm: 35,
    heightMm: 45,
    spec: { level: "reference", faceHeightMm: [27, 33.75], topMarginMm: [3.6, 6.75], source: "Generic reference (60–75% face)" },
    defaultBgColor: "#FFFFFF",
    recommendedPaper: "paper-l"
  }
].map(withSpec);
function getStandardById(id) {
  return ID_STANDARDS.find((s) => s.id === id) || ID_STANDARDS[0];
}
function createCustomStandard(widthMm, heightMm) {
  const safeW = Math.max(15, Math.min(150, widthMm || 35));
  const safeH = Math.max(15, Math.min(200, heightMm || 45));
  return withSpec({
    id: "custom-size",
    category: "custom",
    name: {
      ja: `カスタム (${safeW}×${safeH}mm)`,
      vi: `Tùy chỉnh (${safeW}×${safeH}mm)`,
      en: `Custom (${safeW}×${safeH}mm)`
    },
    description: {
      ja: `指定サイズ: 幅${safeW}mm × 高さ${safeH}mm`,
      vi: `Kích thước tự chọn: Rộng ${safeW}mm × Cao ${safeH}mm`,
      en: `Custom size: ${safeW}mm width × ${safeH}mm height`
    },
    widthMm: safeW,
    heightMm: safeH,
    spec: { level: "reference", faceHeightMm: [safeH * 0.6, safeH * 0.75], topMarginMm: [safeH * 0.08, safeH * 0.15], source: "Generic reference (60–75% face)" },
    defaultBgColor: "#FFFFFF",
    recommendedPaper: "paper-l"
  });
}
export {
  ID_STANDARDS,
  createCustomStandard,
  getStandardById
};
