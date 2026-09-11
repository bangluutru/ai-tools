/**
 * Cấu hình 12 Shortcut truy cập nhanh miniapp trang chủ theo 3 Domain
 * Chia đều 4 shortcut cho mỗi domain (Lưới 2x2, diện tích ~1/4 thẻ Domain)
 */

export const DOMAIN_SHORTCUTS = {
  common: [
    {
      id: 'pdf-toolkit',
      icon: 'FileText',
      names: {
        vi: 'PDF đa năng',
        en: 'PDF Multi-Tool',
        ja: '万能PDFツール',
      },
    },
    {
      id: 'id-photo-studio',
      icon: 'Camera',
      names: {
        vi: 'Tạo ảnh thẻ',
        en: 'ID Photo',
        ja: '証明写真作成',
      },
    },
    {
      id: 'screen-capture',
      icon: 'Camera',
      names: {
        vi: 'Chụp màn hình',
        en: 'Screen Capture',
        ja: '画面キャプチャ',
      },
    },
    {
      id: 'screen-recorder',
      icon: 'Video',
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
      icon: 'Calculator',
      names: {
        vi: 'Mô phỏng thuế',
        en: 'Tax Simulator',
        ja: '税金シミュレーター',
      },
    },
    {
      id: 'social-insurance-jp',
      icon: 'ShieldCheck',
      names: {
        vi: 'Mô phỏng BHXH',
        en: 'Social Insurance',
        ja: '社会保険試算',
      },
    },
    {
      id: 'child-allowance-jp',
      icon: 'Baby',
      names: {
        vi: 'Trợ cấp trẻ em',
        en: 'Child Allowance',
        ja: '児童手当試算',
      },
    },
    {
      id: 'leaving-japan-wizard-jp',
      icon: 'PlaneTakeoff',
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
      icon: 'Coins',
      names: {
        vi: 'Tính Thuế TNCN',
        en: 'PIT Calculator',
        ja: '所得税計算',
      },
    },
    {
      id: 'invoice-xml-fetcher',
      icon: 'FileDown',
      names: {
        vi: 'Lấy hoá đơn XML',
        en: 'Fetch XML',
        ja: 'XML請求書取得',
      },
    },
    {
      id: 'invoice-studio',
      icon: 'Receipt',
      names: {
        vi: 'Đề nghị thanh toán',
        en: 'Payment Request',
        ja: '支払依頼書',
      },
    },
    {
      id: 'watermark-studio',
      icon: 'Stamp',
      names: {
        vi: 'Đóng dấu văn bản',
        en: 'Watermark & Stamp',
        ja: '文書透かし・押印',
      },
    },
  ],
};
