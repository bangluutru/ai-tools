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
    faceHeightPercentMin: 50,
    faceHeightPercentMax: 65,
    topMarginPercentMin: 10,
    topMarginPercentMax: 18,
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
      ja: "日本の旅券申請およびマイナンバーカード申請用。顔の高さ32〜36mm、頭上余白2〜6mm厳守。白背景。",
      vi: "Chuẩn hộ chiếu Nhật và thẻ My Number. Chiều cao khuôn mặt 32-36mm, đỉnh đầu cách mép 2-6mm. Nền trắng.",
      en: "Official Japan passport and My Number card. Face height 32-36mm, top margin 2-6mm strictly required. White background."
    },
    widthMm: 35,
    heightMm: 45,
    faceHeightPercentMin: 70,
    faceHeightPercentMax: 80,
    topMarginPercentMin: 6,
    topMarginPercentMax: 14,
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
    faceHeightPercentMin: 50,
    faceHeightPercentMax: 65,
    topMarginPercentMin: 10,
    topMarginPercentMax: 18,
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
    faceHeightPercentMin: 60,
    faceHeightPercentMax: 75,
    topMarginPercentMin: 8,
    topMarginPercentMax: 15,
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
    faceHeightPercentMin: 65,
    faceHeightPercentMax: 78,
    topMarginPercentMin: 8,
    topMarginPercentMax: 14,
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
      ja: "米国ビザ（DS-160）およびアメリカ合衆国パスポート用正方形規格。純白背景。",
      vi: "Chuẩn ảnh vuông cho hồ sơ visa Mỹ DS-160 và hộ chiếu Mỹ. Nền trắng tinh khiết.",
      en: "Square 2×2 inch format for US Visa (DS-160) and US Passport. Pure white background."
    },
    widthMm: 51,
    heightMm: 51,
    faceHeightPercentMin: 50,
    faceHeightPercentMax: 69,
    topMarginPercentMin: 8,
    topMarginPercentMax: 16,
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
    faceHeightPercentMin: 70,
    faceHeightPercentMax: 80,
    topMarginPercentMin: 7,
    topMarginPercentMax: 13,
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
      ja: "ベトナム旅券申請・領事館手続き用（4×6cm規格）。白背景。",
      vi: "Tiêu chuẩn ảnh làm hộ chiếu Việt Nam, thủ tục tại Đại sứ quán/Lãnh sự quán. Nền trắng.",
      en: "Official 4×6 cm standard for Vietnam Passport and Embassy applications. White background."
    },
    widthMm: 40,
    heightMm: 60,
    faceHeightPercentMin: 65,
    faceHeightPercentMax: 78,
    topMarginPercentMin: 8,
    topMarginPercentMax: 15,
    defaultBgColor: "#FFFFFF",
    recommendedPaper: "paper-l"
  },
  {
    id: "vn-id-card",
    category: "vietnam",
    name: {
      ja: "ベトナム証明写真・CCCD (30×40mm)",
      vi: "Ảnh thẻ hồ sơ Việt Nam (30×40mm)",
      en: "Vietnam Standard ID (30×40mm)"
    },
    description: {
      ja: "ベトナムの一般的な各種申請書・公的書類用（3×4cm）。白または青背景。",
      vi: "Kích thước ảnh 3x4cm thông dụng cho hồ sơ, học bạ, bằng lái xe, thủ tục hành chính VN. Nền trắng hoặc xanh.",
      en: "General 3×4 cm photo for administrative forms, applications, and student IDs. White or blue background."
    },
    widthMm: 30,
    heightMm: 40,
    faceHeightPercentMin: 55,
    faceHeightPercentMax: 70,
    topMarginPercentMin: 10,
    topMarginPercentMax: 16,
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
    faceHeightPercentMin: 60,
    faceHeightPercentMax: 75,
    topMarginPercentMin: 8,
    topMarginPercentMax: 15,
    defaultBgColor: "#FFFFFF",
    recommendedPaper: "paper-l"
  }
];
function getStandardById(id) {
  return ID_STANDARDS.find((s) => s.id === id) || ID_STANDARDS[0];
}
function createCustomStandard(widthMm, heightMm) {
  const safeW = Math.max(15, Math.min(150, widthMm || 35));
  const safeH = Math.max(15, Math.min(200, heightMm || 45));
  return {
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
    faceHeightPercentMin: 60,
    faceHeightPercentMax: 75,
    topMarginPercentMin: 8,
    topMarginPercentMax: 15,
    defaultBgColor: "#FFFFFF",
    recommendedPaper: "paper-l"
  };
}
export {
  ID_STANDARDS,
  createCustomStandard,
  getStandardById
};
