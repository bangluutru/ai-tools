import { tools } from './toolsRegistry.js';

/**
 * Tra cứu nhanh thông tin miniapp từ registry
 */
const toolRegistryMap = new Map(tools.map((t) => [t.id, t]));

/**
 * Cấu hình 12 Shortcut truy cập nhanh miniapp trang chủ theo 3 Domain
 * Chia đều 4 shortcut cho mỗi domain (Lưới 2x2, diện tích ~1/4 thẻ Domain)
 * Tất cả icon đều dùng chung 100% với icon gốc của miniapp trong toolsRegistry.js
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
  ],
  'vietnam-life': [
    {
      id: 'tax-calculator',
      icon: toolRegistryMap.get('tax-calculator')?.icon || 'Calculator',
      names: {
        vi: 'Tính Thuế TNCN',
        en: 'PIT Calculator',
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
