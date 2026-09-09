/**
 * @file packages/core/src/utils/ninja/ninjaI18n.js
 * ============================================================================
 * Toolio Ninja Run — Centralized 3-Language Internationalization (VI / EN / JA).
 *
 * Cung cấp từ điển dịch thuật đồng bộ toàn diện cho:
 * - 4 Biomes danh thắng Việt Nam & Nhật Bản (Tên, cờ, banner điện ảnh chuyển cảnh)
 * - 10 Chướng ngại vật bài toán văn phòng Toolio & câu toast khi chém trúng
 * - Giao diện Canvas HUD, Tutorial màn hình khởi động, combo, kết quả Game Over
 * - Nút bấm ảo cảm ứng, phím tắt điều khiển và Ninja Pet tuần tra thanh Menu
 * ============================================================================
 */

export const SUPPORTED_LANGS = ['vi', 'en', 'ja'];

export function normalizeLang(lang) {
  if (!lang) return 'vi';
  const lower = String(lang).toLowerCase();
  if (lower.startsWith('ja') || lower.startsWith('jp')) return 'ja';
  if (lower.startsWith('en')) return 'en';
  return 'vi';
}

export const NINJA_I18N = {
  vi: {
    meta: {
      gameTitle: 'TOOLIO NINJA RUN',
      badge: 'Arcade 16:9',
      subtitle: 'Endless runner vui nhộn: cùng Ninja chạy xuyên Nhật - Việt và chém tan mọi vấn đề văn phòng!',
    },
    biomes: {
      'vietnam-hanoi': {
        name: 'Hà Nội & Tháp Rùa Hồ Gươm',
        banner: '🇻🇳 HÀ NỘI — THÁP RÙA & CHÙA MỘT CỘT',
        countryName: 'Việt Nam',
      },
      'vietnam-halong-baidinh': {
        name: 'Hạ Long & Bái Đính Ninh Bình',
        banner: '🇻🇳 HẠ LONG & BÁI ĐÍNH — KỲ QUAN NON NƯỚC',
        countryName: 'Việt Nam',
      },
      'vietnam-phongnha': {
        name: 'Quảng Bình & Động Phong Nha',
        banner: '🇻🇳 PHONG NHA — KỲ QUAN ĐỆ NHẤT ĐỘNG',
        countryName: 'Việt Nam',
      },
      'vietnam-hue-danang': {
        name: 'Huế & Đà Nẵng (Cầu Bàn Tay)',
        banner: '🇻🇳 HUẾ & ĐÀ NẴNG — ĐẠI NỘI & CẦU BÀN TAY',
        countryName: 'Việt Nam',
      },
      'vietnam-hoian-da-dia': {
        name: 'Hội An & Ghềnh Đá Đĩa Phú Yên',
        banner: '🇻🇳 HỘI AN & GHỀNH ĐÁ ĐĨA — PHỐ CỔ & BIỂN XANH',
        countryName: 'Việt Nam',
      },
      'vietnam-saigon': {
        name: 'Sài Gòn & Landmark 81',
        banner: '🇻🇳 SÀI GÒN METROPOLIS & LANDMARK 81',
        countryName: 'Việt Nam',
      },
      'japan-tokyo-fuji': {
        name: 'Tokyo Skytree & Núi Phú Sĩ',
        banner: '🗾 TOKYO & PHÚ SĨ — BÌNH MINH XỨ PHÙ TANG',
        countryName: 'Nhật Bản',
      },
      'vietnam-halong': {
        name: 'Vịnh Hạ Long & Hòn Trống Mái',
        banner: '🇻🇳 VỊNH HẠ LONG — KỲ QUAN THẾ GIỚI',
        countryName: 'Việt Nam',
      },
      'vietnam-hoian': {
        name: 'Phố Cổ Hội An & Chùa Cầu',
        banner: '🇻🇳 PHỐ CỔ HỘI AN — DI SẢN VĂN HOÁ',
        countryName: 'Việt Nam',
      },
    },
    monsters: {
      'pdf-bloat': {
        name: 'Quái vật PDF phình to',
        toast: 'Đã nén PDF! Giảm 85% 📄',
      },
      'scattered-pages': {
        name: 'Tường trang PDF rời rạc',
        toast: 'Đã ghép trang PDF! 📑',
      },
      'messy-backdrop': {
        name: 'Đám mây phông nền bừa bộn',
        toast: 'Đã tách nền ảnh thẻ! 📸',
      },
      'crooked-card': {
        name: 'Khối danh thiếp lệch chuẩn',
        toast: 'Đã canh lề & bù xén Tonbo! 🪪',
      },
      'invoice-beast': {
        name: 'Quái thú hoá đơn lộn xộn',
        toast: 'Đã lập đề nghị thanh toán! 🧾',
      },
      'heavy-image': {
        name: 'Tảng đá ảnh RAW nặng nề',
        toast: 'Đã tối ưu ảnh WebP! 🖼️',
      },
      'glitch-qr': {
        name: 'Ma trận QR lỗi định dạng',
        toast: 'Đã tạo mã QR & Barcode chuẩn! 📱',
      },
      'unprotected-doc': {
        name: 'Bóng ma tài liệu không bảo vệ',
        toast: 'Đã đóng dấu mật Watermark! 🛡️',
      },
      'misaligned-excel': {
        name: 'Lưới bảng tính Excel lệch cột',
        toast: 'Đã mapping cột dữ liệu Excel! 📊',
      },
      'tax-storm': {
        name: 'Cơn bão thuế & tính toán',
        toast: 'Đã tính thuế TNCN & Lương Net! 💰',
      },
      'spikes': {
        name: 'Bẫy cọc gai Ninja',
        toast: 'Tránh cọc gai nhọn! ⚠️',
      },
    },
    hud: {
      distanceUnit: 'm',
      bugsResolved: 'Đã giải',
      combo: 'COMBO!',
      tutorialReadyTitle: 'TOOLIO NINJA RUN',
      tutorialReadyKeys: 'SPACE / TAP = NHẢY  •  X / J = CHÉM',
    },
    controls: {
      jump: 'NHẢY',
      slash: 'CHÉM',
      fullscreen: 'Toàn màn hình',
      fullscreenTitle: 'Mở toàn màn hình tại miniapp Toolio Ninja',
      close: 'Đóng',
      closeAria: 'Đóng game',
      footerJumpKey: 'SPACE / CHẠM TRÁI',
      footerJumpAction: 'Nhảy',
      footerSlashKey: 'X / J / CHẠM PHẢI',
      footerSlashAction: 'Chém',
      footerCloseKey: 'ESC',
      footerCloseAction: 'để đóng',
    },
    pet: {
      tooltip: 'Chơi Ninja Run!',
      title: 'Toolio Ninja Run — Click để chơi!',
      ariaLabel: 'Toolio Ninja Run — Click để chơi game',
    },
    gameOver: {
      title: 'Màn Chạy Kết Thúc!',
      praise: 'Bạn đã giải quyết thành công',
      unit: 'vấn đề văn phòng!',
      distance: 'Cự ly chạy',
      currentScore: 'Điểm hiện tại',
      bestScore: 'Kỷ lục điểm',
      playAgain: 'Chơi Lại',
      exploreToolio: 'Khám Phá Toolio',
      toolioTagline: 'Toolio có thể giải quyết các bài toán thực tế ngoài đời trong nháy mắt.',
      toolsTitle: 'Công cụ Toolio tương ứng',
      badges: {
        apprentice: 'Tập sự Ninja',
        warrior: 'Chiến binh Văn phòng',
        legend: 'Huyền thoại Diệt Bug',
        grandmaster: 'Đại tông sư Toolio',
      },
    },
    tools: {
      'pdf-toolkit': 'Công Cụ PDF Đa Năng',
      'id-photo-studio': 'Tạo Ảnh Thẻ & Hộ Chiếu',
      'business-card-studio': 'Tạo Danh Thiếp',
      'invoice-studio': 'Tạo Đề Nghị Thanh Toán',
      'image-convert': 'Nén Ảnh Đa Năng',
      'barcode-qr': 'Tạo Mã QR & Barcode',
      'watermark-studio': 'Đóng Dấu Tài Liệu',
      'excel-mapping': 'Mapping Excel',
      'tax-calculator': 'Tính Thuế TNCN',
    },
  },

  en: {
    meta: {
      gameTitle: 'TOOLIO NINJA RUN',
      badge: 'Arcade 16:9',
      subtitle: 'Fun endless runner: run across Japan & Vietnam and slash away office file problems!',
    },
    biomes: {
      'vietnam-hanoi': {
        name: 'Hanoi & Turtle Tower',
        banner: '🇻🇳 HANOI — TURTLE TOWER & ONE PILLAR PAGODA',
        countryName: 'Vietnam',
      },
      'vietnam-halong-baidinh': {
        name: 'Ha Long Bay & Bai Dinh Pagoda',
        banner: '🇻🇳 HA LONG & BAI DINH — KARST WONDERS',
        countryName: 'Vietnam',
      },
      'vietnam-phongnha': {
        name: 'Phong Nha Cave & Son River',
        banner: '🇻🇳 PHONG NHA — FIRST WONDER UNDERGROUND CAVE',
        countryName: 'Vietnam',
      },
      'vietnam-hue-danang': {
        name: 'Hue Citadel & Golden Hand Bridge',
        banner: '🇻🇳 HUE & DA NANG — MERIDIAN GATE & GOLDEN BRIDGE',
        countryName: 'Vietnam',
      },
      'vietnam-hoian-da-dia': {
        name: 'Hoi An & Ganh Da Dia Basalt Rocks',
        banner: '🇻🇳 HOI AN & GANH DA DIA — ANCIENT TOWN & OCEAN CLIFFS',
        countryName: 'Vietnam',
      },
      'vietnam-saigon': {
        name: 'Saigon Metropolis & Landmark 81',
        banner: '🇻🇳 SAIGON METROPOLIS & LANDMARK 81',
        countryName: 'Vietnam',
      },
      'japan-tokyo-fuji': {
        name: 'Tokyo Skytree & Mount Fuji',
        banner: '🗾 TOKYO & FUJI — NIPPON DAWN',
        countryName: 'Japan',
      },
      'vietnam-halong': {
        name: 'Ha Long Bay & Kissing Rocks',
        banner: '🇻🇳 HA LONG BAY — NATURAL WONDER',
        countryName: 'Vietnam',
      },
      'vietnam-hoian': {
        name: 'Hoi An Ancient Town & Covered Bridge',
        banner: '🇻🇳 HOI AN ANCIENT TOWN — WORLD HERITAGE',
        countryName: 'Vietnam',
      },
    },
    monsters: {
      'pdf-bloat': {
        name: 'PDF Bloat Monster',
        toast: 'PDF Compressed! -85% 📄',
      },
      'scattered-pages': {
        name: 'Scattered Pages Wall',
        toast: 'PDFs Merged! 📑',
      },
      'messy-backdrop': {
        name: 'Messy Backdrop Cloud',
        toast: 'Background Removed! 📸',
      },
      'crooked-card': {
        name: 'Crooked Card Golem',
        toast: 'Bleed & Tonbo Aligned! 🪪',
      },
      'invoice-beast': {
        name: 'Invoice Paper Beast',
        toast: 'Payment Request Created! 🧾',
      },
      'heavy-image': {
        name: 'Heavy RAW Image Boulder',
        toast: 'Image Optimized WebP! 🖼️',
      },
      'glitch-qr': {
        name: 'Glitchy QR Matrix',
        toast: 'QR Code Generated! 📱',
      },
      'unprotected-doc': {
        name: 'Unprotected Doc Wraith',
        toast: 'Confidential Watermarked! 🛡️',
      },
      'misaligned-excel': {
        name: 'Misaligned Excel Grid',
        toast: 'Excel Columns Mapped! 📊',
      },
      'tax-storm': {
        name: 'Tax Math Storm',
        toast: 'Tax & Net Calculated! 💰',
      },
      'spikes': {
        name: 'Ninja Spikes Trap',
        toast: 'Avoid sharp spikes! ⚠️',
      },
    },
    hud: {
      distanceUnit: 'm',
      bugsResolved: 'Solved',
      combo: 'COMBO!',
      tutorialReadyTitle: 'TOOLIO NINJA RUN',
      tutorialReadyKeys: 'SPACE / TAP = JUMP  •  X / J = SLASH',
    },
    controls: {
      jump: 'JUMP',
      slash: 'SLASH',
      fullscreen: 'Fullscreen',
      fullscreenTitle: 'Open fullscreen in Toolio Ninja miniapp',
      close: 'Close',
      closeAria: 'Close game',
      footerJumpKey: 'SPACE / TAP LEFT',
      footerJumpAction: 'Jump',
      footerSlashKey: 'X / J / TAP RIGHT',
      footerSlashAction: 'Slash',
      footerCloseKey: 'ESC',
      footerCloseAction: 'to close',
    },
    pet: {
      tooltip: 'Play Ninja Run!',
      title: 'Toolio Ninja Run — Click to play!',
      ariaLabel: 'Toolio Ninja Run — Click to play game',
    },
    gameOver: {
      title: 'Run Complete!',
      praise: 'You successfully solved',
      unit: 'office problems!',
      distance: 'Distance',
      currentScore: 'Current Score',
      bestScore: 'High Score',
      playAgain: 'Play Again',
      exploreToolio: 'Explore Toolio',
      toolioTagline: 'Toolio can solve real-world productivity challenges in seconds.',
      toolsTitle: 'Corresponding Toolio Apps',
      badges: {
        apprentice: 'Apprentice Ninja',
        warrior: 'Office Warrior',
        legend: 'Bug Slayer Legend',
        grandmaster: 'Toolio Grandmaster',
      },
    },
    tools: {
      'pdf-toolkit': 'PDF Multi-Tool',
      'id-photo-studio': 'ID & Passport Photo',
      'business-card-studio': 'Business Card Maker',
      'invoice-studio': 'Payment Request Maker',
      'image-convert': 'Image Compressor',
      'barcode-qr': 'QR & Barcode Generator',
      'watermark-studio': 'Document Watermark',
      'excel-mapping': 'Excel Data Mapping',
      'tax-calculator': 'Tax Calculator',
    },
  },

  ja: {
    meta: {
      gameTitle: 'ツーリオ・ニンジャ ラン',
      badge: 'アーケード 16:9',
      subtitle: '爽快エンドレスランナー：日本とベトナムを駆け抜け、オフィスの課題を一刀両断！',
    },
    biomes: {
      'japan-tokyo-fuji': {
        name: '東京スカイツリー＆富士山',
        banner: '🗾 東京＆富士山 — 日本の夜明け',
        countryName: '日本',
      },
      'vietnam-hanoi': {
        name: 'ハノイ＆亀の塔・一柱寺',
        banner: '🇻🇳 ハノイ — 亀の塔と一柱寺の千年の古都',
        countryName: 'ベトナム',
      },
      'vietnam-halong-baidinh': {
        name: 'ハロン湾＆バイディン寺',
        banner: '🇻🇳 ハロン湾とバイディン寺 — 雄大なカルストの奇観',
        countryName: 'ベトナム',
      },
      'vietnam-phongnha': {
        name: 'フォンニャ洞窟＆ソン川',
        banner: '🇻🇳 フォンニャ洞窟 — 世界遺産の地底探検',
        countryName: 'ベトナム',
      },
      'vietnam-hue-danang': {
        name: 'フエ王宮＆ダナン神の手橋',
        banner: '🇻🇳 フエとダナン — 午門王宮と天空の黄金橋',
        countryName: 'ベトナム',
      },
      'vietnam-hoian-da-dia': {
        name: 'ホイアン古都＆ダディア岩礁',
        banner: '🇻🇳 ホイアンとダディア岩礁 — 古都の灯りと六角玄武岩',
        countryName: 'ベトナム',
      },
      'vietnam-saigon': {
        name: 'サイゴン・メトロポリス＆ランドマーク81',
        banner: '🇻🇳 サイゴン — ランドマーク81とビテクスコ',
        countryName: 'ベトナム',
      },
      'vietnam-halong': {
        name: 'ハロン湾＆夫婦岩（チョンマイ）',
        banner: '🇻🇳 ハロン湾 — 世界の絶景奇観',
        countryName: 'ベトナム',
      },
      'vietnam-hoian': {
        name: 'ホイアン古街＆日本橋',
        banner: '🇻🇳 ホイアン古街 — 世界文化遺産',
        countryName: 'ベトナム',
      },
    },
    monsters: {
      'pdf-bloat': {
        name: '肥大化PDFモンスター',
        toast: 'PDF圧縮完了！ -85% 📄',
      },
      'scattered-pages': {
        name: '散らばったPDFページの壁',
        toast: 'PDF結合完了！ 📑',
      },
      'messy-backdrop': {
        name: '乱れた背景の雲',
        toast: '背景切り抜き完了！ 📸',
      },
      'crooked-card': {
        name: 'ズレた名刺ゴーレム',
        toast: '裁ち落とし・トンボ位置合わせ！ 🪪',
      },
      'invoice-beast': {
        name: '請求書ペーパービースト',
        toast: '支払依頼書作成完了！ 🧾',
      },
      'heavy-image': {
        name: '巨大RAW画像ロック',
        toast: 'WebP軽量化完了！ 🖼️',
      },
      'glitch-qr': {
        name: 'グリッチQRマトリクス',
        toast: 'QRコード＆バーコード生成！ 📱',
      },
      'unprotected-doc': {
        name: '無防備な文書レイス',
        toast: '透かし・機密押印完了！ 🛡️',
      },
      'misaligned-excel': {
        name: 'ズレたExcelグリッド',
        toast: 'Excelカラムマッピング完了！ 📊',
      },
      'tax-storm': {
        name: '税金計算ストーム',
        toast: '個人所得税・手取り額計算！ 💰',
      },
      'spikes': {
        name: '忍者のまきびし・トゲ罠',
        toast: 'トゲを回避！ ⚠️',
      },
    },
    hud: {
      distanceUnit: 'm',
      bugsResolved: '解決',
      combo: 'コンボ！',
      tutorialReadyTitle: 'ツーリオ・ニンジャ ラン',
      tutorialReadyKeys: 'SPACE / タップ = ジャンプ  •  X / J = 斬撃',
    },
    controls: {
      jump: 'ジャンプ',
      slash: '斬撃',
      fullscreen: '全画面表示',
      fullscreenTitle: 'Toolio Ninjaミニアプリで全画面プレイ',
      close: '閉じる',
      closeAria: 'ゲームを閉じる',
      footerJumpKey: 'SPACE / 左タップ',
      footerJumpAction: 'ジャンプ',
      footerSlashKey: 'X / J / 右タップ',
      footerSlashAction: '斬撃',
      footerCloseKey: 'ESC',
      footerCloseAction: 'で閉じる',
    },
    pet: {
      tooltip: 'ニンジャ ランをプレイ！',
      title: 'ツーリオ・ニンジャ ラン — クリックしてプレイ！',
      ariaLabel: 'ツーリオ・ニンジャ ラン — クリックしてゲームをプレイ',
    },
    gameOver: {
      title: 'ゲーム終了！',
      praise: '解決した課題数：',
      unit: '件のオフィス課題！',
      distance: '走行距離',
      currentScore: 'スコア',
      bestScore: '最高記録',
      playAgain: 'もう一度プレイ',
      exploreToolio: 'Toolioを使う',
      toolioTagline: 'Toolioは実際の業務課題も一瞬で解決します。',
      toolsTitle: '対応するToolioアプリ',
      badges: {
        apprentice: '見習い忍者',
        warrior: 'オフィスの戦士',
        legend: '課題解決の伝説',
        grandmaster: 'ツーリオ免許皆伝',
      },
    },
    tools: {
      'pdf-toolkit': '万能PDFツール',
      'id-photo-studio': '証明写真スタジオ',
      'business-card-studio': '名刺作成',
      'invoice-studio': '支払依頼書作成',
      'image-convert': '画像圧縮・変換',
      'barcode-qr': 'QRコード生成',
      'watermark-studio': '文書透かし・押印',
      'excel-mapping': 'Excelマッピング',
      'tax-calculator': '個人所得税計算',
    },
  },
};

/**
 * Lấy bộ chuỗi bản địa hóa theo ngôn ngữ hiện hành
 */
export function getNinjaStrings(lang = 'vi') {
  const code = normalizeLang(lang);
  return NINJA_I18N[code] || NINJA_I18N.vi;
}
