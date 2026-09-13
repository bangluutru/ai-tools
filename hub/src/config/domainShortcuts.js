import { tools } from './toolsRegistry.js';

/**
 * Tra cứu nhanh thông tin miniapp từ registry
 */
const toolRegistryMap = new Map(tools.map((t) => [t.id, t]));

/**
 * Cấu hình Shortcut truy cập nhanh miniapp trang chủ theo 3 Domain
 * - Bố cục chuẩn lưới 2 cột x 4 dòng (8 slots mỗi Domain)
 * - Tất cả icon đều lấy trực tiếp từ thuộc tính icon của miniapp trong toolsRegistry.js
 */
export const DOMAIN_SHORTCUTS = {
  common: [
    {
      id: 'pdf-toolkit',
      icon: toolRegistryMap.get('pdf-toolkit')?.icon || 'FileText',
      names: {
        vi: 'PDF đa năng',
        en: 'PDF Multi-Tool',
        ja: '万能PDFツール',
      },
      subtitles: {
        vi: 'Nối, tách, nén PDF',
        en: 'Merge, split, compress',
        ja: '結合・分割・圧縮',
      },
    },
    {
      id: 'id-photo-studio',
      icon: toolRegistryMap.get('id-photo-studio')?.icon || 'UserCheck',
      names: {
        vi: 'Tạo ảnh thẻ',
        en: 'ID Photo',
        ja: '証明写真作成',
      },
      subtitles: {
        vi: 'Chuẩn 3x4, 4x6 cm',
        en: 'Standard 3x4, 4x6 cm',
        ja: '3x4, 4x6 規格対応',
      },
    },
    {
      id: 'screen-capture',
      icon: toolRegistryMap.get('screen-capture')?.icon || 'Camera',
      names: {
        vi: 'Chụp màn hình',
        en: 'Screen Capture',
        ja: '画面キャプチャ',
      },
      subtitles: {
        vi: 'Chụp cuộn toàn trang',
        en: 'Full-page scrolling',
        ja: '全画面スクロール撮影',
      },
    },
    {
      id: 'screen-recorder',
      icon: toolRegistryMap.get('screen-recorder')?.icon || 'Video',
      names: {
        vi: 'Quay màn hình',
        en: 'Screen Recorder',
        ja: '画面録画',
      },
      subtitles: {
        vi: 'Ghi hình không giới hạn',
        en: 'Record without limit',
        ja: '高画質録画',
      },
    },
    {
      id: 'business-card-studio',
      icon: toolRegistryMap.get('business-card-studio')?.icon || 'Contact',
      names: {
        vi: 'Tạo danh thiếp',
        en: 'Business Card',
        ja: '名刺作成',
      },
      subtitles: {
        vi: 'Thiết kế Namecard',
        en: 'Professional Card',
        ja: 'プロ仕様の名刺',
      },
    },
    {
      id: 'barcode-qr',
      icon: toolRegistryMap.get('barcode-qr')?.icon || 'QrCode',
      names: {
        vi: 'Tạo mã QR',
        en: 'QR Code Maker',
        ja: 'QRコード作成',
      },
      subtitles: {
        vi: 'QR & mã vạch đa năng',
        en: 'QR & multi-barcode',
        ja: 'QR・バーコード生成',
      },
    },
    {
      id: 'image-convert',
      icon: toolRegistryMap.get('image-convert')?.icon || 'Image',
      names: {
        vi: 'Nén & Đổi ảnh',
        en: 'Compress Image',
        ja: '画像圧縮・変換',
      },
      subtitles: {
        vi: 'WebP, PNG, JPG',
        en: 'WebP, PNG, JPG',
        ja: 'WebP, PNG, JPG対応',
      },
    },
    {
      id: 'omniconvert',
      icon: toolRegistryMap.get('omniconvert')?.icon || 'ArrowLeftRight',
      names: {
        vi: 'Chuyển đổi đa năng',
        en: 'Universal Converter',
        ja: '万能ファイル変換',
      },
      subtitles: {
        vi: 'Định dạng tài liệu',
        en: 'All document formats',
        ja: 'あらゆる文書形式',
      },
    },
  ],
  'japan-life': [
    {
      id: 'japan-tax-simulator',
      icon: toolRegistryMap.get('japan-tax-simulator')?.icon || 'Coins',
      names: {
        vi: 'Mô phỏng thuế',
        en: 'Tax Simulator',
        ja: '税金シミュレーター',
      },
      subtitles: {
        vi: 'Thuế thu nhập, cư trú',
        en: 'Income, resident tax',
        ja: '所得税・住民税試算',
      },
    },
    {
      id: 'social-insurance-jp',
      icon: toolRegistryMap.get('social-insurance-jp')?.icon || 'ShieldCheck',
      names: {
        vi: 'Mô phỏng BHXH',
        en: 'Social Insurance',
        ja: '社会保険試算',
      },
      subtitles: {
        vi: 'BHXH, y tế, hưu trí',
        en: 'Health, pension, care',
        ja: '健保・厚生年金',
      },
    },
    {
      id: 'child-allowance-jp',
      icon: toolRegistryMap.get('child-allowance-jp')?.icon || 'Baby',
      names: {
        vi: 'Trợ cấp trẻ em',
        en: 'Child Allowance',
        ja: '児童手当試算',
      },
      subtitles: {
        vi: 'Trợ cấp sinh con, nuôi con',
        en: 'Childcare allowance',
        ja: '児童手当・出産一時金',
      },
    },
    {
      id: 'leaving-japan-wizard-jp',
      icon: toolRegistryMap.get('leaving-japan-wizard-jp')?.icon || 'PlaneTakeoff',
      names: {
        vi: 'Thủ tục về nước',
        en: 'Leaving Japan',
        ja: '帰国手続き',
      },
      subtitles: {
        vi: 'Rút Nenkin, đóng thuế',
        en: 'Lump-sum pension withdrawal',
        ja: '脱退一時金・転出届',
      },
    },
    {
      id: 'overtime-calculator-jp',
      icon: toolRegistryMap.get('overtime-calculator-jp')?.icon || 'Clock',
      names: {
        vi: 'Tiền làm thêm giờ',
        en: 'Overtime Pay',
        ja: '残業代試算',
      },
      subtitles: {
        vi: 'Tăng ca, làm đêm, nghỉ lễ',
        en: 'Overtime, holiday pay',
        ja: '時間外・休日割増',
      },
    },
    {
      id: 'certificate-acquisition-guide-jp',
      icon: toolRegistryMap.get('certificate-acquisition-guide-jp')?.icon || 'Store',
      names: {
        vi: 'Lấy giấy tờ',
        en: 'Get Certificates',
        ja: '証明書取得',
      },
      subtitles: {
        vi: 'Juminhyo, combini',
        en: 'Juminhyo, convenience store',
        ja: '住民票・印鑑証明',
      },
    },
    {
      id: 'status-change-guide-jp',
      icon: toolRegistryMap.get('status-change-guide-jp')?.icon || 'ArrowLeftRight',
      names: {
        vi: 'Đổi tư cách lưu trú',
        en: 'Status Change',
        ja: '在留資格変更',
      },
      subtitles: {
        vi: 'Chuyển việc, kết hôn',
        en: 'Job switch, spouse visa',
        ja: '転職・結婚ビザ',
      },
    },
    {
      id: 'pr-readiness-checker-jp',
      icon: toolRegistryMap.get('pr-readiness-checker-jp')?.icon || 'Award',
      names: {
        vi: 'Điều kiện vĩnh trú',
        en: 'PR Readiness',
        ja: '永住準備度',
      },
      subtitles: {
        vi: 'Đánh giá điểm hồ sơ',
        en: 'Permanent residency points',
        ja: '永住権スコア判定',
      },
    },
  ],
  'vietnam-life': [
    {
      id: 'salary-calculator-vn',
      icon: toolRegistryMap.get('salary-calculator-vn')?.icon || 'Calculator',
      names: {
        vi: 'Lương Gross - Net',
        en: 'Gross - Net Salary',
        ja: '給与 Gross - Net',
      },
      subtitles: {
        vi: 'Lương thực nhận 2026',
        en: 'Take-home pay 2026',
        ja: '手取り給与（2026新法）',
      },
    },
    {
      id: 'loan-apr-calculator-vn',
      icon: toolRegistryMap.get('loan-apr-calculator-vn')?.icon || 'Percent',
      names: {
        vi: 'Tính lãi vay NH',
        en: 'Loan APR Calculator',
        ja: '融資実質年率（APR）',
      },
      subtitles: {
        vi: 'Lãi suất vay mua nhà, xe',
        en: 'Mortgage & car loans',
        ja: '住宅・自動車ローン',
      },
    },
    {
      id: 'social-insurance-calculator-vn',
      icon: toolRegistryMap.get('social-insurance-calculator-vn')?.icon || 'ShieldCheck',
      names: {
        vi: 'BHXH - BHYT - BHTN',
        en: 'Social Insurance',
        ja: 'ベトナム社会保険',
      },
      subtitles: {
        vi: 'Mức đóng & thai sản',
        en: 'Compulsory insurance rates',
        ja: '保険料率・受給額',
      },
    },
    {
      id: 'electricity-calculator-vn',
      icon: toolRegistryMap.get('electricity-calculator-vn')?.icon || 'Zap',
      names: {
        vi: 'Tính tiền điện',
        en: 'Electricity Bill',
        ja: '電気代計算',
      },
      subtitles: {
        vi: 'Biểu giá bậc thang EVN',
        en: 'Progressive tariff EVN',
        ja: '段階的電気料金',
      },
    },
    {
      id: 'tax-calculator',
      icon: toolRegistryMap.get('tax-calculator')?.icon || 'Calculator',
      names: {
        vi: 'Tính Thuế TNCN',
        en: 'PIT Calculator',
        ja: '所得税計算',
      },
      subtitles: {
        vi: 'Giảm trừ gia cảnh',
        en: 'Family deductions',
        ja: '扶養控除・税額計算',
      },
    },
    {
      id: 'invoice-xml-fetcher',
      icon: toolRegistryMap.get('invoice-xml-fetcher')?.icon || 'FileDown',
      names: {
        vi: 'Lấy hoá đơn XML',
        en: 'Fetch XML',
        ja: 'XML請求書取得',
      },
      subtitles: {
        vi: 'Tải nhanh từ Tổng cục Thuế',
        en: 'Download from tax authority',
        ja: '税務総局から一括取得',
      },
    },
    {
      id: 'invoice-studio',
      icon: toolRegistryMap.get('invoice-studio')?.icon || 'Receipt',
      names: {
        vi: 'Đề nghị thanh toán',
        en: 'Payment Request',
        ja: '支払依頼書',
      },
      subtitles: {
        vi: 'Biểu mẫu thanh toán',
        en: 'Standard payment request',
        ja: '請求書・支払申請書',
      },
    },
    {
      id: 'watermark-studio',
      icon: toolRegistryMap.get('watermark-studio')?.icon || 'Stamp',
      names: {
        vi: 'Đóng dấu văn bản',
        en: 'Watermark & Stamp',
        ja: '文書透かし・押印',
      },
      subtitles: {
        vi: 'Đóng dấu & bản quyền',
        en: 'Watermark & security',
        ja: '電子印鑑・透かし',
      },
    },
  ],
};

/**
 * Cấu hình chuyên biệt cho Japan Life (Khớp 100% Mockup người dùng gửi)
 * Gồm:
 * 1. Banner Navigator: "Không biết bắt đầu từ đâu? Hãy để Japan Life Navigator giúp bạn!"
 * 2. Cột 🇯🇵 Thủ tục tại Nhật (4 thẻ + Nút xem tất cả)
 * 3. Cột 🇻🇳 Lãnh sự Việt Nam (4 thẻ + Nút tra cứu tất cả thủ tục lãnh sự)
 */
export const JAPAN_LIFE_SECTIONS = {
  japan_procedures: {
    id: 'japan_procedures',
    title: {
      vi: 'Thủ tục tại Nhật',
      en: 'Procedures in Japan',
      ja: '日本での手続き',
    },
    subtitle: {
      vi: 'Các thủ tục với cơ quan Nhật Bản',
      en: 'With Japanese authorities',
      ja: '日本の行政機関での手続き',
    },
    flag: '🇯🇵',
    items: [
      {
        id: 'status-change-guide-jp',
        title: {
          vi: 'Cư trú & Visa',
          en: 'Residence & Visa',
          ja: '在留資格・ビザ',
        },
        subtitle: {
          vi: 'Tư cách lưu trú, gia hạn, vĩnh trú...',
          en: 'Status, renewal, PR...',
          ja: '在留資格、更新、永住...',
        },
        icon: 'Award',
      },
      {
        id: 'japan-tax-simulator',
        title: {
          vi: 'Thuế & Bảo hiểm',
          en: 'Tax & Insurance',
          ja: '税金・保険',
        },
        subtitle: {
          vi: 'Thuế, BHXH, bảo hiểm y tế...',
          en: 'Tax, social insurance...',
          ja: '税金、社会保険、年金...',
        },
        icon: 'Coins',
      },
      {
        id: 'child-allowance-jp',
        title: {
          vi: 'Gia đình & Trẻ em',
          en: 'Family & Children',
          ja: '家族・子ども',
        },
        subtitle: {
          vi: 'Kết hôn, sinh con, trợ cấp...',
          en: 'Marriage, birth, allowance...',
          ja: '結婚、出産、児童手当...',
        },
        icon: 'Baby',
      },
      {
        id: 'leaving-japan-wizard-jp',
        title: {
          vi: 'Chuyển nhà & Rời Nhật',
          en: 'Moving & Leaving Japan',
          ja: '引越・帰国',
        },
        subtitle: {
          vi: 'Đăng ký địa chỉ, chuyển trường...',
          en: 'Address registration, moving...',
          ja: '住所登録、転出届、帰国...',
        },
        icon: 'PlaneTakeoff',
      },
    ],
    actionText: {
      vi: 'Xem tất cả thủ tục tại Nhật →',
      en: 'View all procedures in Japan →',
      ja: '日本での手続きをすべて見る →',
    },
  },
  consular_vn: {
    id: 'consular_vn',
    title: {
      vi: 'Lãnh sự Việt Nam',
      en: 'Vietnam Consular',
      ja: 'ベトナム領事手続き',
    },
    subtitle: {
      vi: 'Các thủ tục tại ĐSQ / LSQ',
      en: 'Procedures at Embassy / Consulate',
      ja: '大使館・総領事館での手続き',
    },
    flag: '🇻🇳',
    items: [
      {
        id: 'vietnam-consular-jp',
        procedureId: 'vn_passport_renewal',
        title: {
          vi: 'Hộ chiếu & giấy đi lại',
          en: 'Passport & Travel Docs',
          ja: 'パスポート・渡航文書',
        },
        subtitle: {
          vi: 'Cấp mới, gia hạn, giấy thông hành...',
          en: 'New, renewal, travel document...',
          ja: '新規・更新、渡航書...',
        },
        icon: 'BookOpen',
      },
      {
        id: 'vietnam-consular-jp',
        procedureId: 'vn_birth_registration',
        title: {
          vi: 'Sinh con & Hộ tịch',
          en: 'Birth & Civil Status',
          ja: '出産・身分事項',
        },
        subtitle: {
          vi: 'Khai sinh, khai tử, nhận con nuôi...',
          en: 'Birth, death, adoption...',
          ja: '出生届、死亡届、養子縁組...',
        },
        icon: 'Baby',
      },
      {
        id: 'vietnam-consular-jp',
        procedureId: 'vn_marriage_transcription',
        title: {
          vi: 'Hôn nhân & Gia đình',
          en: 'Marriage & Family',
          ja: '婚姻・家族',
        },
        subtitle: {
          vi: 'Kết hôn, ghi chú kết hôn, ly hôn...',
          en: 'Marriage, transcription, divorce...',
          ja: '婚姻届、報告的届出、離婚...',
        },
        icon: 'HeartHandshake',
      },
      {
        id: 'vietnam-consular-jp',
        procedureId: 'vn_consular_legalization_jp_docs',
        title: {
          vi: 'Chứng nhận & Giấy tờ',
          en: 'Legalization & Documents',
          ja: '領事認証・公証',
        },
        subtitle: {
          vi: 'Hợp pháp hóa, chứng nhận lãnh sự...',
          en: 'Legalization, consular certification...',
          ja: '領事認証、署名認証...',
        },
        icon: 'Stamp',
      },
    ],
    actionText: {
      vi: 'Tra cứu tất cả thủ tục lãnh sự →',
      en: 'Search all consular procedures →',
      ja: 'すべての領事手続きを調べる →',
    },
  },
};
