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
    },
    {
      id: 'id-photo-studio',
      icon: toolRegistryMap.get('id-photo-studio')?.icon || 'UserCheck',
      names: {
        vi: 'Tạo ảnh thẻ',
        en: 'ID Photo',
        ja: '証明写真作成',
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
    },
    {
      id: 'screen-recorder',
      icon: toolRegistryMap.get('screen-recorder')?.icon || 'Video',
      names: {
        vi: 'Quay màn hình',
        en: 'Screen Recorder',
        ja: '画面録画',
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
    },
    {
      id: 'barcode-qr',
      icon: toolRegistryMap.get('barcode-qr')?.icon || 'QrCode',
      names: {
        vi: 'Tạo mã QR',
        en: 'QR Code Maker',
        ja: 'QRコード作成',
      },
    },
    {
      id: 'image-convert',
      icon: toolRegistryMap.get('image-convert')?.icon || 'Image',
      names: {
        vi: 'Nén ảnh',
        en: 'Compress Image',
        ja: '画像圧縮',
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
    },
    {
      id: 'social-insurance-jp',
      icon: toolRegistryMap.get('social-insurance-jp')?.icon || 'ShieldCheck',
      names: {
        vi: 'Mô phỏng BHXH',
        en: 'Social Insurance',
        ja: '社会保険試算',
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
    },
    {
      id: 'leaving-japan-wizard-jp',
      icon: toolRegistryMap.get('leaving-japan-wizard-jp')?.icon || 'PlaneTakeoff',
      names: {
        vi: 'Thủ tục về nước',
        en: 'Leaving Japan',
        ja: '帰国手続き',
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
    },
    {
      id: 'certificate-acquisition-guide-jp',
      icon: toolRegistryMap.get('certificate-acquisition-guide-jp')?.icon || 'Store',
      names: {
        vi: 'Lấy giấy tờ',
        en: 'Get Certificates',
        ja: '証明書取得',
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
    },
    {
      id: 'pr-readiness-checker-jp',
      icon: toolRegistryMap.get('pr-readiness-checker-jp')?.icon || 'Award',
      names: {
        vi: 'Điều kiện vĩnh trú',
        en: 'PR Readiness',
        ja: '永住準備度',
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
    },
    {
      id: 'pit-calculator-vn',
      icon: toolRegistryMap.get('pit-calculator-vn')?.icon || 'FileText',
      names: {
        vi: 'Thuế TNCN',
        en: 'PIT Calculator',
        ja: '個人所得税',
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
    },
    {
      id: 'electricity-calculator-vn',
      icon: toolRegistryMap.get('electricity-calculator-vn')?.icon || 'Zap',
      names: {
        vi: 'Tính tiền điện',
        en: 'Electricity Bill',
        ja: '電気代計算',
      },
    },
    {
      id: 'tax-calculator',
      icon: toolRegistryMap.get('tax-calculator')?.icon || 'Calculator',
      names: {
        vi: 'Tính Thuế TNCN (Cũ)',
        en: 'PIT Calculator (Old)',
        ja: '所得税計算',
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
    },
    {
      id: 'invoice-studio',
      icon: toolRegistryMap.get('invoice-studio')?.icon || 'Receipt',
      names: {
        vi: 'Đề nghị thanh toán',
        en: 'Payment Request',
        ja: '支払依頼書',
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
    },
  ],
};
