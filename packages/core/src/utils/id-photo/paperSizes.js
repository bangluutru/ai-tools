const PAPER_SIZES = [
  {
    id: "paper-l",
    name: {
      ja: "L判 (89×127mm) ★コンビニ定番",
      vi: "Khổ L (89×127mm) ★Chuẩn combini",
      en: "L Size (89×127mm) ★Convenience Store Standard"
    },
    widthMm: 89,
    heightMm: 127,
    description: {
      ja: "セブン-イレブン、ローソン、ファミリーマート等の写真プリントで最も安価（約30〜40円）に印刷できる定番サイズ。",
      vi: "Khổ in ảnh bóng phổ biến nhất tại 7-Eleven, Lawson, FamilyMart với chi phí siêu rẻ (khoảng 30-40 yên / tấm).",
      en: "Most economical standard size for photo prints at 7-Eleven, Lawson, and FamilyMart (approx. ¥30–40 per sheet)."
    },
    popularInJapan: true
  },
  {
    id: "paper-2l",
    name: {
      ja: "2L判 (127×178mm)",
      vi: "Khổ 2L (127×178mm)",
      en: "2L Size (127×178mm)"
    },
    widthMm: 127,
    heightMm: 178,
    description: {
      ja: "L判の2倍の面積。多数の証明写真を一度にまとめて印刷したい場合に最適。コンビニ写真機でも対応。",
      vi: "Gấp đôi khổ L. Thích hợp in cùng lúc nhiều ảnh thẻ. Các máy in combini tại Nhật đều hỗ trợ.",
      en: "Twice the area of L size. Ideal for printing a large batch of ID photos at once. Supported by convenience stores."
    },
    popularInJapan: true
  },
  {
    id: "paper-hagaki",
    name: {
      ja: "はがき・ポストカード (100×148mm)",
      vi: "Bưu thiếp Hagaki (100×148mm)",
      en: "Postcard / Hagaki (100×148mm)"
    },
    widthMm: 100,
    heightMm: 148,
    description: {
      ja: "日本の標準はがきサイズ。コンビニのはがき用紙プリントにも対応。",
      vi: "Kích thước bưu thiếp chuẩn Nhật Bản. Hỗ trợ in trực tiếp tại máy in bưu thiếp combini.",
      en: "Standard Japanese postcard size. Compatible with convenience store postcard paper printing."
    },
    popularInJapan: true
  },
  {
    id: "paper-a4",
    name: {
      ja: "A4 (210×297mm) 家庭用・オフィス",
      vi: "Khổ A4 (210×297mm) Máy in văn phòng",
      en: "A4 Sheet (210×297mm) Home & Office"
    },
    widthMm: 210,
    heightMm: 297,
    description: {
      ja: "自宅のインクジェットプリンターやオフィスのレーザープリンターで光沢紙印刷する場合に最適。",
      vi: "Thích hợp in số lượng lớn bằng máy in phun màu hoặc máy in laser tại nhà/công ty trên giấy ảnh A4.",
      en: "Perfect for printing on glossy photo paper using home inkjet or office laser printers."
    },
    popularInJapan: false
  },
  {
    id: "paper-single",
    name: {
      ja: "単体1枚 (指定サイズそのまま)",
      vi: "Chỉ 1 ảnh đơn (Đúng kích thước)",
      en: "Single Photo (Exact crop only)"
    },
    widthMm: 0,
    heightMm: 0,
    description: {
      ja: "シート配置せず、指定したミリ寸法の単体画像ファイルとして高解像度出力します（Web提出用・アプリ登録用にも便利）。",
      vi: "Xuất trực tiếp 1 tấm ảnh đơn duy nhất với độ phân giải cao 300 DPI (phù hợp nộp online qua web).",
      en: "Exports a single high-resolution image at exact mm dimensions without tiling (ideal for digital upload/e-applications)."
    },
    popularInJapan: false
  },
  {
    id: "paper-custom",
    name: {
      ja: "カスタム用紙サイズ (mm)",
      vi: "Khổ giấy tùy chỉnh (mm)",
      en: "Custom Paper Size (mm)"
    },
    widthMm: 100,
    heightMm: 150,
    description: {
      ja: "任意の用紙幅と高さをミリ単位で指定できます。",
      vi: "Nhập kích thước khổ giấy tùy ý theo milimet.",
      en: "Specify custom paper width and height in millimeters."
    },
    popularInJapan: false
  }
];
function getPaperById(id) {
  return PAPER_SIZES.find((p) => p.id === id) || PAPER_SIZES[0];
}
export {
  PAPER_SIZES,
  getPaperById
};
