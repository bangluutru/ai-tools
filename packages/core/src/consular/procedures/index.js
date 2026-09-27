/**
 * Danh mục thủ tục lãnh sự Việt Nam tại Nhật Bản — công cụ hỗ trợ KHÔNG chính thức.
 * Nội dung được đối chiếu với trang chính thức của ĐSQ Việt Nam tại Nhật Bản / TLSQ Osaka (xem official_sources
 * từng thủ tục). status: 'VERIFIED' = đã đối chiếu trang chính thức; 'PARTIAL' = một phần; 'NEEDS_REVIEW' = chưa xác minh.
 * submission_mode: 'direct_only' | 'postal_or_direct' | 'direct_or_postal' | 'unconfirmed'.
 */

export const CONSULAR_CATEGORIES = [
  {
    id: 'passport',
    name: {
      vi: 'Hộ chiếu & Giấy tờ đi lại',
      en: 'Passport & Travel Documents',
      ja: 'パスポート・渡航文書',
    },
    icon: 'BookOpen',
    color: 'sky',
  },
  {
    id: 'birth_nationality',
    name: {
      vi: 'Khai sinh & Quốc tịch',
      en: 'Birth Registration & Nationality',
      ja: '出生届出・国籍',
    },
    icon: 'Baby',
    color: 'emerald',
  },
  {
    id: 'marriage_family',
    name: {
      vi: 'Hôn nhân & Gia đình',
      en: 'Marriage & Family Affairs',
      ja: '婚姻・家族',
    },
    icon: 'HeartHandshake',
    color: 'rose',
  },
  {
    id: 'legalization_auth',
    name: {
      vi: 'Hợp pháp hóa & Chứng thực',
      en: 'Legalization & Certification',
      ja: '領事認証・公証',
    },
    icon: 'Stamp',
    color: 'amber',
  },
  {
    id: 'death_civil',
    name: {
      vi: 'Khai tử & Hộ tịch khác',
      en: 'Death Registration & Civil Status',
      ja: '死亡届出・身分証明',
    },
    icon: 'FileText',
    color: 'slate',
  },
  {
    id: 'protection_emergency',
    name: {
      vi: 'Bảo hộ công dân & Khẩn cấp',
      en: 'Citizen Protection & Emergency',
      ja: '邦人保護・緊急支援',
    },
    icon: 'ShieldAlert',
    color: 'red',
  },
  {
    id: 'visa_other',
    name: {
      vi: 'Miễn thị thực & Thủ tục khác',
      en: 'Visa Exemption & Other Affairs',
      ja: '査証免除・その他',
    },
    icon: 'Layers',
    color: 'indigo',
  },
];

// ---------------------------------------------------------------------------
// Nguồn chính thức đã kiểm tra (2026-09-27). Mọi URL dưới đây đã mở được bằng WebFetch.
// ---------------------------------------------------------------------------
const SRC = {
  embassyPassport: {
    title: 'ĐSQ Việt Nam tại Nhật Bản - Thủ tục liên quan đến hộ chiếu',
    url: 'https://vnembassy-jp.org/vi/th%E1%BB%A7-t%E1%BB%A5c-li%C3%AAn-quan-%C4%91%E1%BA%BFn-h%E1%BB%99-chi%E1%BA%BFu',
  },
  osakaPassport: {
    title: 'TLSQ Việt Nam tại Osaka - Thủ tục hộ chiếu phổ thông',
    url: 'https://vnconsulate-osaka.org/en/node/100',
  },
  mofaPassportPortal: {
    title: 'Cổng khai tờ khai hộ chiếu trực tuyến (Bộ Ngoại giao)',
    url: 'https://passport.mofa.gov.vn/',
  },
  tt69: {
    title: 'Thông tư 69/2026/TT-BCA (sửa đổi TT 31/2023/TT-BCA về biểu mẫu hộ chiếu, hiệu lực 01/7/2026)',
    url: 'https://congbao.chinhphu.vn/van-ban/thong-tu-so-69-2026-tt-bca-469711/65703.htm',
  },
  embassyBirth: {
    title: 'ĐSQ Việt Nam tại Nhật Bản - Thủ tục cấp giấy khai sinh',
    url: 'https://vnembassy-jp.org/vi/thu-tuc-cap-giay-khai-sinh',
  },
  embassyNationality: {
    title: 'ĐSQ Việt Nam tại Nhật Bản - Nhóm thủ tục liên quan đến quốc tịch',
    url: 'https://vnembassy-jp.org/vi/nh%C3%B3m-th%E1%BB%A7-t%E1%BB%A5c-li%C3%AAn-quan-%C4%91%E1%BA%BFn-qu%E1%BB%91c-t%E1%BB%8Bch',
  },
  law79: {
    title: 'Luật số 79/2025/QH15 sửa đổi, bổ sung Luật Quốc tịch Việt Nam',
    url: 'https://vanban.chinhphu.vn/?pageid=27160&docid=214593&classid=1&orggroupid=1',
  },
  embassyMarriage: {
    title: 'ĐSQ Việt Nam tại Nhật Bản - Hướng dẫn liên quan đến kết hôn',
    url: 'https://vnembassy-jp.org/vi/huong-dan-lien-quan-den-ket-hon',
  },
  embassyApostille: {
    title: 'ĐSQ Việt Nam tại Nhật Bản - Thông báo áp dụng Apostille thay cho hợp pháp hóa lãnh sự (từ 11/9/2026)',
    url: 'https://vnembassy-jp.org/vi/th%C3%B4ng-b%C3%A1o-v%E1%BB%81-vi%E1%BB%87c-%C3%A1p-d%E1%BB%A5ng-ch%E1%BB%A9ng-nh%E1%BA%ADn-apostille-thay-cho-h%E1%BB%A3p-ph%C3%A1p-h%C3%B3a-l%C3%A3nh-s%E1%BB%B1',
  },
  embassyLegalization: {
    title: 'ĐSQ Việt Nam tại Nhật Bản - Hợp pháp hóa, sao y, chứng thực bản dịch, chứng thực chữ ký',
    url: 'https://vnembassy-jp.org/vi/th%E1%BB%A7-t%E1%BB%A5c-h%E1%BB%A3p-ph%C3%A1p-h%C3%B3a-sao-y-b%E1%BA%A3n-ch%C3%ADnh-ch%E1%BB%A9ng-nh%E1%BA%ADn-b%E1%BA%A3n-d%E1%BB%8Bch-ch%E1%BB%A9ng-th%E1%BB%B1c-ch%E1%BB%AF-k%C3%BD',
  },
  mofaJapanApostille: {
    title: 'Bộ Ngoại giao Nhật Bản - 公文書の証明（アポスティーユ・公印確認）',
    url: 'https://www.mofa.go.jp/mofaj/toko/todoke/shomei/index.html',
  },
  vnApostillePortal: {
    title: 'Cổng Apostille của Việt Nam (Cục Lãnh sự)',
    url: 'https://apostille.lanhsuvietnam.gov.vn',
  },
  embassyPoa: {
    title: 'ĐSQ Việt Nam tại Nhật Bản - Chứng thực giấy ủy quyền, hợp đồng ủy quyền, từ chối di sản thừa kế',
    url: 'https://vnembassy-jp.org/vi/huong-dan-thu-tuc-chung-thuc-giay-uy-quyen-ban-sao-hop-dong-uy-quyen-tu-choi-di-san-th%C6%B0a-ke',
  },
  embassyDeath: {
    title: 'ĐSQ Việt Nam tại Nhật Bản - Khai tử, chuyển thi hài/di hài/tro cốt về Việt Nam',
    url: 'https://vnembassy-jp.org/vi/thu-tuc-chuyen-thi-hai-di-hai-tro-cot-ve-viet-nam',
  },
  embassyOtherCivil: {
    title: 'ĐSQ Việt Nam tại Nhật Bản - Thủ tục hộ tịch khác',
    url: 'https://vnembassy-jp.org/vi/thu-tuc-hu-tich-khac',
  },
  embassyGeneral: {
    title: 'ĐSQ Việt Nam tại Nhật Bản - Thông tin chung về thủ tục lãnh sự (giờ làm việc, điện thoại, bảo hộ công dân)',
    url: 'https://vnembassy-jp.org/vi/thong-tin-chung-ve-thu-tuc-lanh-su',
  },
  embassyVisa: {
    title: 'ĐSQ Việt Nam tại Nhật Bản - Hướng dẫn cấp visa, giấy miễn thị thực',
    url: 'https://vnembassy-jp.org/vi/huong-dan-cap-visa-giay-mien-thi-thuc',
  },
  mofaHotline: {
    title: 'Tổng đài bảo hộ công dân Việt Nam ở nước ngoài (+84 981 84 84 84)',
    url: 'https://vnembassy-beijing.mofa.gov.vn/vi-vn/Consular%20Services/Protection%20of%20Citizens/News/Trang/Khai-tr%C6%B0%C6%A1ng-T%E1%BB%95ng-%C4%91%C3%A0i-b%E1%BA%A3o-h%E1%BB%99-c%C3%B4ng-d%C3%A2n-Vi%E1%BB%87t-Nam-%E1%BB%9F-n%C6%B0%E1%BB%9Bc-ngo%C3%A0i.aspx',
  },
  bcaLltp: {
    title: 'Cổng DVC Bộ Công an - Cấp Phiếu lý lịch tư pháp',
    url: 'https://dichvucong.bocongan.gov.vn/bocongan/bothutuc/tthc?matt=61555',
  },
};

const FEE_NOTE =
  'Theo biểu phí lãnh sự hiện hành (ĐSQ dẫn Văn bản hợp nhất 15/VBHN-BTC ngày 21/6/2022; quy đổi 155 yên/USD từ 01/6/2024). Mức phí cụ thể: cần xác nhận với cơ quan.';
const TIME_UNCONFIRMED = 'Trang chính thức không công bố thời hạn cố định — cần xác nhận với cơ quan';

// Danh mục giấy tờ chung cho hộ chiếu (ĐSQ Tokyo, trang "Thủ tục liên quan đến hộ chiếu"; TLSQ Osaka node/100).
const PASSPORT_COMMON_DOCS = [
  {
    name: 'Phiếu đề nghị và thông tin liên hệ',
    quantity: '01 bản',
    originalOrCopy: 'Gốc',
    note: 'Theo hướng dẫn của ĐSQ (điền qua mã QR / https://consul.vnembassy-jp.org/).',
    isOfficialRequirement: true,
  },
  {
    name: 'Tờ khai đề nghị cấp hộ chiếu khai TRỰC TUYẾN tại passport.mofa.gov.vn',
    quantity: '01 bản in',
    originalOrCopy: 'Gốc (in từ email, ký tên)',
    note: 'Khai tại https://passport.mofa.gov.vn/, hệ thống gửi tờ khai về email — in ra và ký. Đây là tờ khai dùng để nộp.',
    isOfficialRequirement: true,
  },
  {
    name: 'Ảnh màu phông nền trắng',
    quantity: '02 ảnh',
    originalOrCopy: 'Gốc',
    note: 'ĐSQ Tokyo: cỡ 3,5 x 4,5 cm hoặc 4 x 6 cm. TLSQ Osaka: 4 x 6 cm, mới chụp, nhìn thẳng.',
    isOfficialRequirement: true,
  },
  {
    name: 'Phiếu cư trú (住民票 / Juminhyo)',
    quantity: '01 bản',
    originalOrCopy: 'Bản gốc',
    isOfficialRequirement: true,
  },
  {
    name: 'Thẻ cư trú (在留カード / Zairyu card)',
    quantity: '01 bản chụp',
    originalOrCopy: 'Bản chụp',
    isOfficialRequirement: true,
  },
];

const PASSPORT_DRAFT_HELPER = {
  name: '(Tùy chọn) Bản nháp TK02 của Toolio để chuẩn bị thông tin',
  quantity: 'Không nộp',
  originalOrCopy: 'Bản nháp',
  note: 'Chỉ để ghi chép trước khi khai trên passport.mofa.gov.vn. KHÔNG phải tờ khai nộp cho cơ quan.',
  isForm: true,
  isDraftHelper: true,
  formId: 'form_passport_tk02',
};

const PASSPORT_IN_PERSON_NOTE =
  'ĐSQ Tokyo và TLSQ Osaka đều hướng dẫn công dân làm thủ tục hộ chiếu TRỰC TIẾP tại cơ quan; trang chính thức không nêu hình thức gửi bưu điện. TLSQ Fukuoka: cần xác nhận với cơ quan.';

export const CONSULAR_PROCEDURES = [
  // 1. Nhóm Hộ chiếu & Giấy đi lại
  {
    id: 'vn_passport_renewal',
    category: 'passport',
    title: {
      vi: 'Cấp đổi hộ chiếu (hết hạn, sắp hết hạn, hết trang)',
      en: 'Passport Replacement (Expiring or Expired)',
      ja: '一般旅券の切替・再発給（期限切れ・残存期間不足）',
    },
    summary: 'Cấp đổi hộ chiếu phổ thông cho công dân Việt Nam đang cư trú tại Nhật Bản. Nộp trực tiếp tại cơ quan đại diện; tờ khai phải khai trực tuyến tại passport.mofa.gov.vn.',
    when_needed: 'Khi hộ chiếu sắp hết hạn, đã hết hạn hoặc hết trang, cần hộ chiếu mới để gia hạn tư cách lưu trú hoặc xuất nhập cảnh.',
    submission_mode: 'direct_only',
    processing_time: TIME_UNCONFIRMED,
    fee_note: FEE_NOTE,
    formId: 'form_passport_tk02',
    status: 'VERIFIED',
    last_verified: '2026-09-27',
    aliases: ['đổi hộ chiếu', 'hết hạn passport', 'gia hạn hộ chiếu', 'làm lại hộ chiếu', 'hộ chiếu hết trang', 'passport', 'pasupoto', 'パスポート', '旅券'],
    related_jp_procedures: ['status-change-guide-jp'],
    important_notes: [
      PASSPORT_IN_PERSON_NOTE,
      'Tờ khai nộp là tờ khai điện tử in từ passport.mofa.gov.vn — bản in từ Toolio chỉ là bản nháp.',
      'Từ 01/7/2026 biểu mẫu hộ chiếu áp dụng theo Thông tư 31/2023/TT-BCA đã được sửa đổi bởi Thông tư 69/2026/TT-BCA.',
    ],
    required_documents: [
      ...PASSPORT_COMMON_DOCS,
      {
        name: 'Hộ chiếu Việt Nam gốc và bản chụp trang 2-3',
        quantity: '01 cuốn + 01 bản chụp',
        originalOrCopy: 'Gốc & bản chụp',
        isOfficialRequirement: true,
      },
      PASSPORT_DRAFT_HELPER,
    ],
    steps: [
      { step: 1, title: 'Khai tờ khai trực tuyến', desc: 'Khai tại https://passport.mofa.gov.vn/, nhận tờ khai qua email, in ra và ký tên.' },
      { step: 2, title: 'Chuẩn bị hồ sơ', desc: 'Phiếu đề nghị & thông tin liên hệ, 02 ảnh, 住民票 bản gốc, bản chụp 在留カード, hộ chiếu gốc và bản chụp trang 2-3.' },
      { step: 3, title: 'Nộp trực tiếp tại cơ quan đại diện', desc: 'Đến ĐSQ/TLSQ theo địa bàn trong giờ tiếp nhận. Xác nhận lịch và lệ phí trước khi đi.' },
      { step: 4, title: 'Nhận kết quả', desc: 'Nhận hộ chiếu mới theo hướng dẫn của cơ quan; sau đó cập nhật thông tin hộ chiếu với Cục Xuất nhập cảnh Nhật khi cần.' },
    ],
    official_sources: [SRC.embassyPassport, SRC.osakaPassport, SRC.mofaPassportPortal],
  },
  {
    id: 'vn_passport_lost',
    category: 'passport',
    title: {
      vi: 'Cấp lại hộ chiếu do bị mất tại Nhật Bản',
      en: 'Replacement of Lost Passport',
      ja: '紛失による一般旅券の再発給',
    },
    summary: 'Cấp lại hộ chiếu cho công dân Việt Nam bị mất hộ chiếu tại Nhật Bản. Nộp trực tiếp; ngoài hồ sơ chung cần thêm giấy tờ xác minh nhân thân.',
    when_needed: 'Khi bị mất hộ chiếu trong thời gian sinh sống, học tập hoặc làm việc tại Nhật.',
    submission_mode: 'direct_only',
    processing_time: 'Cần xác minh nhân thân với cơ quan trong nước — thời hạn cần xác nhận với cơ quan',
    fee_note: FEE_NOTE,
    formId: 'form_passport_tk02',
    status: 'VERIFIED',
    last_verified: '2026-09-27',
    aliases: ['mất hộ chiếu', 'mất passport', 'thất lạc hộ chiếu', 'báo mất hộ chiếu', 'パスポート紛失', '旅券紛失'],
    related_jp_procedures: ['certificate-acquisition-guide-jp'],
    important_notes: [
      PASSPORT_IN_PERSON_NOTE,
      'Trình báo mất với cảnh sát Nhật (交番/警察署) trước, lấy số/giấy xác nhận trình báo.',
      'TLSQ Osaka yêu cầu thêm Đơn trình báo mất hộ chiếu (mẫu TK05).',
    ],
    required_documents: [
      ...PASSPORT_COMMON_DOCS,
      { name: 'Giấy xác nhận nhân thân (bản gốc, dấu đỏ) do Công an Việt Nam cấp', quantity: '01 bản', originalOrCopy: 'Bản gốc', isOfficialRequirement: true },
      { name: 'Mẫu CT07 - Xác nhận thông tin về cư trú', quantity: '01 bản', originalOrCopy: 'Bản gốc', isOfficialRequirement: true },
      { name: 'Bản sao giấy trình báo mất với cảnh sát Nhật', quantity: '01 bản', originalOrCopy: 'Bản sao', note: 'Trường hợp cư trú bất hợp pháp: biên bản của Cục Xuất nhập cảnh (Nyukan).', isOfficialRequirement: true },
      { name: 'Giấy xác nhận của công ty hoặc trường học', quantity: '01 bản', originalOrCopy: 'Bản gốc', isOfficialRequirement: true },
      { name: 'Bản lý lịch tự khai', quantity: '01 bản', originalOrCopy: 'Bản gốc', isOfficialRequirement: true },
      { name: 'CCCD / Căn cước bản gốc (nếu có)', quantity: '01', originalOrCopy: 'Bản gốc', isOfficialRequirement: true },
      { name: 'Đơn trình báo mất hộ chiếu (mẫu TK05) — theo TLSQ Osaka', quantity: '01 bản', originalOrCopy: 'Bản gốc', note: 'ĐSQ Tokyo/TLSQ Fukuoka: cần xác nhận với cơ quan.' },
      PASSPORT_DRAFT_HELPER,
    ],
    steps: [
      { step: 1, title: 'Trình báo cảnh sát Nhật Bản', desc: 'Đến 交番/警察署 trình báo mất (遺失届), giữ số trình báo / giấy xác nhận.' },
      { step: 2, title: 'Xin giấy tờ xác minh từ Việt Nam', desc: 'Giấy xác nhận nhân thân (dấu đỏ) của Công an và mẫu CT07 xác nhận cư trú; chuẩn bị lý lịch tự khai và giấy xác nhận công ty/trường.' },
      { step: 3, title: 'Khai tờ khai trực tuyến', desc: 'Khai tại https://passport.mofa.gov.vn/, in tờ khai nhận qua email và ký.' },
      { step: 4, title: 'Nộp trực tiếp tại ĐSQ/TLSQ theo địa bàn', desc: 'Mang đủ hồ sơ; cơ quan xác minh với cơ quan trong nước trước khi cấp.' },
    ],
    official_sources: [SRC.embassyPassport, SRC.osakaPassport, SRC.mofaPassportPortal],
  },
  {
    id: 'vn_passport_damaged',
    category: 'passport',
    title: {
      vi: 'Cấp lại hộ chiếu do bị hư hỏng',
      en: 'Replacement of Damaged Passport',
      ja: '汚損・破損による一般旅券の再発給',
    },
    summary: 'Cấp lại hộ chiếu bị hư hỏng (ướt, rách, mờ ảnh, hỏng chip...). Hồ sơ tương tự cấp đổi, kèm hộ chiếu hỏng bản gốc.',
    when_needed: 'Khi hộ chiếu bị hư hỏng làm giảm giá trị sử dụng.',
    submission_mode: 'direct_only',
    processing_time: TIME_UNCONFIRMED,
    fee_note: FEE_NOTE,
    formId: 'form_passport_tk02',
    status: 'VERIFIED',
    last_verified: '2026-09-27',
    aliases: ['hộ chiếu bị ướt', 'hộ chiếu bị rách', 'hỏng passport', 'hộ chiếu hỏng', 'パスポート破損'],
    related_jp_procedures: ['status-change-guide-jp'],
    important_notes: [PASSPORT_IN_PERSON_NOTE],
    required_documents: [
      ...PASSPORT_COMMON_DOCS,
      { name: 'Hộ chiếu hư hỏng bản gốc và bản chụp', quantity: '01 cuốn + bản chụp', originalOrCopy: 'Gốc & bản chụp', isOfficialRequirement: true },
      PASSPORT_DRAFT_HELPER,
    ],
    steps: [
      { step: 1, title: 'Khai tờ khai trực tuyến', desc: 'Khai tại https://passport.mofa.gov.vn/, in và ký tờ khai nhận qua email.' },
      { step: 2, title: 'Chuẩn bị hồ sơ và hộ chiếu hỏng', desc: 'Không tự bóc tách các trang của hộ chiếu hỏng.' },
      { step: 3, title: 'Nộp trực tiếp tại ĐSQ/TLSQ', desc: 'Nhận hộ chiếu mới theo hướng dẫn của cơ quan.' },
    ],
    official_sources: [SRC.embassyPassport, SRC.osakaPassport],
  },
  {
    id: 'vn_travel_document',
    category: 'passport',
    title: {
      vi: 'Giấy thông hành về nước khẩn cấp',
      en: 'Emergency Travel Document (Giấy Thông Hành)',
      ja: '緊急帰国のための渡航証明書',
    },
    summary: 'Thông tin tham khảo cho công dân không có hộ chiếu cần về nước gấp. Trang của ĐSQ không có hướng dẫn riêng cho thủ tục này — danh mục giấy tờ cần xác nhận với cơ quan.',
    when_needed: 'Khi mất hộ chiếu và cần về nước gấp, không kịp chờ cấp hộ chiếu mới.',
    submission_mode: 'direct_only',
    processing_time: TIME_UNCONFIRMED,
    status: 'NEEDS_REVIEW',
    last_verified: '2026-09-27',
    aliases: ['giấy thông hành', 'về nước gấp', 'mất hộ chiếu về nước', 'travel document'],
    related_jp_procedures: ['leaving-japan-wizard-jp'],
    important_notes: [
      'Chưa tìm thấy hướng dẫn chính thức riêng trên trang ĐSQ/TLSQ — gọi điện hoặc email phòng lãnh sự để được hướng dẫn giấy tờ cụ thể.',
    ],
    required_documents: [
      { name: 'Danh mục giấy tờ: cần xác nhận với cơ quan', quantity: '—', originalOrCopy: '—', note: 'Thường cần giấy tờ chứng minh quốc tịch VN, ảnh và giấy trình báo mất — hỏi phòng lãnh sự trước khi đến.' },
    ],
    steps: [
      { step: 1, title: 'Liên hệ phòng lãnh sự', desc: 'ĐSQ Tokyo: +81-3-3466-3311 / vnconsular@vnembassy.jp. Ngoài giờ, trường hợp khẩn cấp: đường dây nóng bảo hộ công dân.' },
      { step: 2, title: 'Chuẩn bị giấy tờ theo hướng dẫn', desc: 'Làm theo danh mục cơ quan cung cấp và đến trực tiếp.' },
    ],
    official_sources: [SRC.embassyGeneral, SRC.embassyPassport],
  },
  {
    id: 'vn_passport_child',
    category: 'passport',
    title: {
      vi: 'Cấp hộ chiếu lần đầu cho trẻ em dưới 14 tuổi sinh tại Nhật',
      en: 'First Passport for Child (under 14) Born in Japan',
      ja: '日本生まれの14歳未満の子の初回旅券発給',
    },
    summary: 'Cấp hộ chiếu lần đầu cho trẻ em sinh ra tại Nhật sau khi đã đăng ký khai sinh / ghi chú khai sinh Việt Nam. Trẻ dưới 14 tuổi dùng mẫu TK02a (cha/mẹ khai thay).',
    when_needed: 'Khi trẻ cần hộ chiếu để làm thủ tục tư cách lưu trú tại Nhật hoặc xuất cảnh.',
    submission_mode: 'direct_only',
    processing_time: TIME_UNCONFIRMED,
    fee_note: FEE_NOTE,
    formId: 'form_passport_tk02',
    status: 'VERIFIED',
    last_verified: '2026-09-27',
    aliases: ['làm hộ chiếu cho bé', 'hộ chiếu trẻ em sinh ở nhật', 'passport em bé', 'hộ chiếu sơ sinh', 'tk02a', '子どもパスポート'],
    related_jp_procedures: ['child-allowance-jp', 'status-change-guide-jp'],
    important_notes: [
      PASSPORT_IN_PERSON_NOTE,
      'Người dưới 14 tuổi dùng tờ khai mẫu TK02a (không phải TK02). Mẫu TK02a đã được thay bởi phiên bản mới theo Thông tư 69/2026/TT-BCA (hiệu lực 01/7/2026).',
      'Trẻ sinh tại Nhật phải xin tư cách lưu trú tại Cục Xuất nhập cảnh trong vòng 30 ngày kể từ ngày sinh.',
    ],
    required_documents: [
      ...PASSPORT_COMMON_DOCS.map((d) =>
        d.name.startsWith('Tờ khai')
          ? { ...d, name: 'Tờ khai TK02a (người dưới 14 tuổi) khai TRỰC TUYẾN tại passport.mofa.gov.vn', note: 'Cha/mẹ hoặc người đại diện khai và ký thay. In từ email.' }
          : d
      ),
      { name: 'Bản sao giấy khai sinh hoặc trích lục khai sinh của trẻ', quantity: '01 bản', originalOrCopy: 'Bản sao', isOfficialRequirement: true },
      { ...PASSPORT_DRAFT_HELPER, name: '(Tùy chọn) Bản nháp tờ khai của Toolio để chuẩn bị thông tin', note: 'Bản nháp Toolio dựng theo bố cục TK02, không phải TK02a. Chỉ để ghi chép — KHÔNG nộp.' },
    ],
    steps: [
      { step: 1, title: 'Hoàn tất đăng ký khai sinh / ghi chú khai sinh Việt Nam', desc: 'Xem thủ tục "Đăng ký khai sinh" — cần trích lục/giấy khai sinh để làm hộ chiếu.' },
      { step: 2, title: 'Khai tờ khai TK02a trực tuyến', desc: 'Cha/mẹ khai tại https://passport.mofa.gov.vn/, in và ký.' },
      { step: 3, title: 'Nộp trực tiếp tại ĐSQ/TLSQ', desc: 'Mang hồ sơ của trẻ và giấy tờ của cha/mẹ theo hướng dẫn của cơ quan.' },
    ],
    official_sources: [SRC.embassyPassport, SRC.osakaPassport, SRC.tt69],
  },

  // 2. Nhóm Khai sinh & Quốc tịch
  {
    id: 'vn_birth_registration',
    category: 'birth_nationality',
    title: {
      vi: 'Đăng ký khai sinh / ghi chú khai sinh cho con sinh tại Nhật',
      en: 'Birth Registration for Child Born in Japan',
      ja: '日本生まれの子のベトナム出生登録',
    },
    summary: 'Hai trường hợp theo ĐSQ: (I) con CHƯA khai sinh tại 市役所 → đăng ký khai sinh, nhận Giấy khai sinh; (II) con ĐÃ khai sinh tại 市役所 → ghi chú khai sinh, nhận Trích lục ghi chú khai sinh.',
    when_needed: 'Sau khi sinh con tại Nhật; phần lớn gia đình đã nộp 出生届 tại 市役所 trong 14 ngày nên thuộc trường hợp (II).',
    submission_mode: 'direct_only',
    processing_time: TIME_UNCONFIRMED,
    fee_note: FEE_NOTE,
    formId: 'form_birth_registration',
    status: 'VERIFIED',
    last_verified: '2026-09-27',
    aliases: ['làm giấy khai sinh ở nhật', 'khai sinh cho con', 'đăng ký khai sinh dsq', 'ghi chú khai sinh', 'shusseitodoke', 'giấy khai sinh việt nam', '出生届', '出生届受理証明書'],
    related_jp_procedures: ['child-allowance-jp', 'certificate-acquisition-guide-jp'],
    important_notes: [
      'Nộp TRỰC TIẾP: người yêu cầu phải ký sổ và nhận kết quả trực tiếp (khoản 6 Điều 4 Thông tư 07/2023/TT-BNG, theo trang ĐSQ).',
      'Trường hợp (II) nhận TRÍCH LỤC ghi chú khai sinh, không phải bản chính giấy khai sinh.',
      'Giấy tờ tiếng nước ngoài phải kèm bản dịch tiếng Việt có chứng thực/công chứng chữ ký người dịch.',
      'Tên của trẻ: họ theo họ của cha hoặc mẹ; tên đệm và tên bắt buộc bằng tiếng Việt (theo trang ĐSQ).',
    ],
    required_documents: [
      { name: 'Tờ khai và Phiếu đề nghị & thông tin liên hệ (qua QR / https://consul.vnembassy-jp.org/)', quantity: '01 bộ', originalOrCopy: 'Gốc', isOfficialRequirement: true },
      { name: '(II) Giấy chứng nhận thụ lý khai sinh 出生届受理証明書 do 市役所/区役所 cấp', quantity: '01 bản', originalOrCopy: 'Bản gốc', note: 'Trường hợp (I) chưa khai sinh tại 市役所: thay bằng Giấy chứng sinh 出生証明書 bản gốc dấu đỏ.', isOfficialRequirement: true },
      { name: 'Bản dịch tiếng Việt có chứng thực của giấy tờ trên', quantity: '01 bản', originalOrCopy: 'Bản dịch chứng thực', isOfficialRequirement: true },
      { name: 'Giấy chứng nhận kết hôn hoặc trích lục kết hôn của cha mẹ do cơ quan Việt Nam cấp', quantity: '01 bản', originalOrCopy: 'Theo hướng dẫn cơ quan', isOfficialRequirement: true },
      { name: 'Phiếu cư trú 住民票 của cha mẹ', quantity: '01 bản', originalOrCopy: 'Bản gốc', isOfficialRequirement: true },
      { name: 'Bản chụp 在留カード và hộ chiếu (trang 2-3) của cha mẹ', quantity: '01 bộ', originalOrCopy: 'Bản chụp', isOfficialRequirement: true },
      { name: 'Văn bản thỏa thuận chọn quốc tịch Việt Nam cho con — CHỈ khi cha hoặc mẹ là người nước ngoài', quantity: '01 bản', originalOrCopy: 'Gốc, cha mẹ ký', note: 'Không cần nếu cả cha và mẹ là công dân Việt Nam.', isForm: true, isDraftHelper: true, formId: 'form_nationality_agreement' },
      { name: '(Tùy chọn) Bản nháp tờ khai khai sinh của Toolio', quantity: 'Không nộp', originalOrCopy: 'Bản nháp', note: 'Chỉ để chuẩn bị thông tin; dùng tờ khai theo hướng dẫn của ĐSQ.', isForm: true, isDraftHelper: true, formId: 'form_birth_registration' },
    ],
    steps: [
      { step: 1, title: 'Nộp 出生届 tại 市役所/区役所 (trong 14 ngày)', desc: 'Sau đó xin 出生届受理証明書 bản gốc.' },
      { step: 2, title: 'Dịch và chứng thực bản dịch', desc: 'Dịch 出生届受理証明書 sang tiếng Việt, chứng thực bản dịch.' },
      { step: 3, title: 'Khai phiếu đề nghị qua consul.vnembassy-jp.org', desc: 'Chuẩn bị 住民票 bản gốc, bản chụp 在留カード & hộ chiếu của cha mẹ, giấy kết hôn/trích lục kết hôn.' },
      { step: 4, title: 'Nộp và nhận kết quả trực tiếp', desc: 'Người yêu cầu ký sổ và nhận Trích lục ghi chú khai sinh (trường hợp II) hoặc Giấy khai sinh (trường hợp I).' },
    ],
    official_sources: [SRC.embassyBirth],
  },
  {
    id: 'vn_nationality_agreement',
    category: 'birth_nationality',
    title: {
      vi: 'Văn bản thỏa thuận lựa chọn quốc tịch Việt Nam cho con',
      en: 'Agreement on Choice of Vietnamese Nationality for Child',
      ja: '子のベトナム国籍選択合意書',
    },
    summary: 'Chỉ áp dụng khi cha HOẶC mẹ là người nước ngoài: cha mẹ thỏa thuận chọn quốc tịch Việt Nam cho con khi đăng ký khai sinh (Luật Quốc tịch sửa đổi 79/2025/QH15, NĐ 191/2025/NĐ-CP).',
    when_needed: 'Nộp kèm hồ sơ đăng ký/ghi chú khai sinh khi một bên cha/mẹ là công dân nước ngoài.',
    submission_mode: 'direct_only',
    processing_time: 'Xử lý cùng hồ sơ khai sinh',
    formId: 'form_nationality_agreement',
    status: 'VERIFIED',
    last_verified: '2026-09-27',
    aliases: ['thỏa thuận quốc tịch', 'chọn quốc tịch cho con', 'quốc tịch việt nam cho bé', 'văn bản quốc tịch', 'con lai', 'TP/QT-2025-VBTT'],
    related_jp_procedures: ['child-allowance-jp'],
    important_notes: [
      'Không cần văn bản này khi cả cha và mẹ đều là công dân Việt Nam.',
      'Mẫu văn bản chính thức ĐSQ dẫn: Mẫu TP/QT-2025-VBTT. Bản của Toolio chỉ là bản nháp tham khảo.',
      'Có thể ký một bên trước công chứng Nhật (公証役場) nếu bên kia có mặt — theo trang ĐSQ.',
    ],
    required_documents: [
      { name: 'Văn bản thỏa thuận chọn quốc tịch Việt Nam (mẫu TP/QT-2025-VBTT)', quantity: '01 bản', originalOrCopy: 'Gốc, đủ chữ ký cha mẹ', isOfficialRequirement: true },
      { name: '(Tùy chọn) Bản nháp của Toolio', quantity: 'Không nộp', originalOrCopy: 'Bản nháp', isForm: true, isDraftHelper: true, formId: 'form_nationality_agreement' },
    ],
    steps: [
      { step: 1, title: 'Chuẩn bị văn bản theo mẫu TP/QT-2025-VBTT', desc: 'Ghi thông tin giấy tờ tùy thân của cha và mẹ.' },
      { step: 2, title: 'Cha mẹ cùng ký và nộp kèm hồ sơ khai sinh', desc: 'Nộp trực tiếp cùng hồ sơ đăng ký/ghi chú khai sinh.' },
    ],
    official_sources: [SRC.embassyNationality, SRC.embassyBirth, SRC.law79],
  },
  {
    id: 'vn_birth_extract',
    category: 'birth_nationality',
    title: {
      vi: 'Cấp bản sao giấy khai sinh / trích lục khai sinh',
      en: 'Copy of Birth Certificate / Extract',
      ja: '出生証明書・抄本の写しの発給',
    },
    summary: 'Cấp bản sao giấy khai sinh/trích lục cho trường hợp đã đăng ký khai sinh tại cơ quan đại diện Việt Nam tại Nhật (Thủ tục III trên trang ĐSQ).',
    when_needed: 'Khi cần thêm bản sao để nộp cơ quan Nhật hoặc làm hồ sơ khác.',
    submission_mode: 'unconfirmed',
    processing_time: TIME_UNCONFIRMED,
    fee_note: FEE_NOTE,
    status: 'PARTIAL',
    last_verified: '2026-09-27',
    aliases: ['xin trích lục khai sinh', 'xin lại giấy khai sinh', 'bản sao khai sinh', 'trích lục hộ tịch'],
    related_jp_procedures: ['certificate-acquisition-guide-jp'],
    required_documents: [
      { name: 'Phiếu đề nghị và thông tin liên hệ', quantity: '01 bản', originalOrCopy: 'Gốc', isOfficialRequirement: true },
      { name: 'Tờ khai yêu cầu cấp bản sao', quantity: '01 bản', originalOrCopy: 'Gốc', isOfficialRequirement: true },
      { name: 'Bản chụp giấy khai sinh / trích lục đã cấp', quantity: '01 bản', originalOrCopy: 'Bản chụp', isOfficialRequirement: true },
    ],
    steps: [
      { step: 1, title: 'Xác định nơi đã đăng ký', desc: 'Khai sinh đã đăng ký tại ĐSQ Tokyo hay TLSQ nào.' },
      { step: 2, title: 'Nộp yêu cầu', desc: 'Hình thức nộp (trực tiếp/bưu điện) và lệ phí: cần xác nhận với cơ quan.' },
    ],
    official_sources: [SRC.embassyBirth, SRC.embassyOtherCivil],
  },

  // 3. Nhóm Hôn nhân & Gia đình
  {
    id: 'vn_marriage_transcription',
    category: 'marriage_family',
    title: {
      vi: 'Ghi chú kết hôn (đã kết hôn tại cơ quan Nhật Bản)',
      en: 'Recording of Marriage Registered in Japan',
      ja: '日本で成立した婚姻のベトナム側記録',
    },
    summary: 'Ghi vào sổ hộ tịch Việt Nam việc kết hôn đã đăng ký tại 市役所/区役所 Nhật Bản (Thủ tục 11 trên trang ĐSQ).',
    when_needed: 'Sau khi nộp 婚姻届 tại cơ quan hộ tịch Nhật và nhận 婚姻届受理証明書.',
    submission_mode: 'unconfirmed',
    processing_time: TIME_UNCONFIRMED,
    fee_note: FEE_NOTE,
    formId: 'form_marriage_registration',
    status: 'VERIFIED',
    last_verified: '2026-09-27',
    aliases: ['ghi chú kết hôn', 'báo kết hôn về vn', 'konintodoke', 'công nhận kết hôn nhật', 'kết hôn với người nhật', 'ket hon', '婚姻届受理証明書'],
    related_jp_procedures: ['status-change-guide-jp'],
    important_notes: [
      'Không áp dụng nếu một bên kết hôn theo hình thức một người ở Nhật, một người ở Việt Nam, hoặc có một bên dùng visa du lịch (theo trang ĐSQ).',
    ],
    required_documents: [
      { name: 'Tờ khai và Phiếu đề nghị & thông tin liên hệ', quantity: '01 bộ', originalOrCopy: 'Gốc', isOfficialRequirement: true },
      { name: 'Giấy chứng nhận thụ lý kết hôn 婚姻届受理証明書 do 市役所/区役所 cấp', quantity: '01 bản', originalOrCopy: 'Bản gốc', isOfficialRequirement: true },
      { name: 'Bản dịch tiếng Việt có chứng thực của 婚姻届受理証明書', quantity: '01 bản', originalOrCopy: 'Bản dịch chứng thực', isOfficialRequirement: true },
      { name: 'Phiếu cư trú 住民票 của cả hai bên', quantity: '01 bản/người', originalOrCopy: 'Bản gốc', isOfficialRequirement: true },
      { name: 'Bản chụp 在留カード của cả hai bên', quantity: '01 bản/người', originalOrCopy: 'Bản chụp', isOfficialRequirement: true },
      { name: 'Bản chụp hộ chiếu (trang 2-3) của cả hai bên', quantity: '01 bản/người', originalOrCopy: 'Bản chụp', isOfficialRequirement: true },
      { name: '(Tùy chọn) Bản nháp tờ khai của Toolio', quantity: 'Không nộp', originalOrCopy: 'Bản nháp', isForm: true, isDraftHelper: true, formId: 'form_marriage_registration' },
    ],
    steps: [
      { step: 1, title: 'Xin 婚姻届受理証明書 tại 市役所/区役所', desc: 'Sau khi đăng ký kết hôn tại Nhật.' },
      { step: 2, title: 'Dịch và chứng thực bản dịch', desc: 'Chuẩn bị 住民票 bản gốc, bản chụp 在留カード và hộ chiếu của hai bên.' },
      { step: 3, title: 'Nộp hồ sơ đến ĐSQ/TLSQ', desc: 'Hình thức nộp: cần xác nhận với cơ quan. Kết quả: trích lục ghi chú kết hôn.' },
    ],
    official_sources: [SRC.embassyMarriage],
  },
  {
    id: 'vn_marital_status_certificate',
    category: 'marriage_family',
    title: {
      vi: 'Giấy chứng nhận đủ điều kiện kết hôn (婚姻要件具備証明書) để kết hôn tại Nhật',
      en: 'Certificate of Legal Capacity to Marry (for Marriage in Japan)',
      ja: '婚姻要件具備証明書の発給',
    },
    summary: 'Cấp Giấy chứng nhận đủ điều kiện kết hôn (Thủ tục 9 trên trang ĐSQ) để nộp 市役所 khi đăng ký kết hôn tại Nhật.',
    when_needed: 'Khi chuẩn bị kết hôn với người Nhật hoặc người nước ngoài tại cơ quan hộ tịch Nhật Bản.',
    submission_mode: 'postal_or_direct',
    processing_time: TIME_UNCONFIRMED,
    fee_note: FEE_NOTE,
    status: 'VERIFIED',
    last_verified: '2026-09-27',
    aliases: ['giấy độc thân', 'kon-in yoken gubi shomeisho', 'chứng nhận độc thân', 'xác nhận tình trạng hôn nhân', 'kết hôn với người nhật', 'ket hon', '婚姻要件具備証明書'],
    related_jp_procedures: ['certificate-acquisition-guide-jp'],
    important_notes: [
      'Giấy xác nhận tình trạng hôn nhân của Việt Nam chỉ có giá trị 6 tháng kể từ ngày cấp.',
      'Tên giấy của 市役所: ĐSQ ghi "結婚届受理していない証明書" (giấy xác nhận chưa thụ lý đăng ký kết hôn). Tên gọi tại quầy có thể khác (ví dụ 婚姻届不受理証明書) — cần xác nhận với 市役所.',
      'Trang ĐSQ yêu cầu kèm Letter Pack và bìa nhựa (clear folder) để gửi trả kết quả.',
    ],
    required_documents: [
      { name: 'Tờ khai và Phiếu đề nghị & thông tin liên hệ', quantity: '01 bộ', originalOrCopy: 'Gốc', isOfficialRequirement: true },
      { name: 'Giấy xác nhận tình trạng hôn nhân trước khi xuất cảnh (do cơ quan Việt Nam cấp)', quantity: '01 bản', originalOrCopy: 'Bản gốc dấu đỏ, còn hạn 6 tháng', isOfficialRequirement: true },
      { name: 'Xác nhận tình trạng hôn nhân thời gian ở Nhật: giấy của 市役所 xác nhận chưa thụ lý đăng ký kết hôn (ĐSQ ghi 結婚届受理していない証明書) HOẶC xác nhận của ĐSQ', quantity: '01 bản', originalOrCopy: 'Bản gốc', isOfficialRequirement: true },
      { name: 'Bản dịch tiếng Việt có chứng thực của giấy 市役所', quantity: '01 bản', originalOrCopy: 'Bản dịch chứng thực', isOfficialRequirement: true },
      { name: 'Phiếu cư trú 住民票', quantity: '01 bản', originalOrCopy: 'Bản gốc', isOfficialRequirement: true },
      { name: 'Bản chụp 在留カード', quantity: '01 bản', originalOrCopy: 'Bản chụp', isOfficialRequirement: true },
      { name: 'Bản chụp hộ chiếu (trang 2-3)', quantity: '01 bản', originalOrCopy: 'Bản chụp', isOfficialRequirement: true },
      { name: 'Letter Pack và bìa nhựa (clear folder) để gửi trả kết quả', quantity: '01', originalOrCopy: '—', isOfficialRequirement: true },
    ],
    steps: [
      { step: 1, title: 'Xin Giấy xác nhận tình trạng hôn nhân tại Việt Nam', desc: 'Cho thời gian cư trú tại Việt Nam trước khi sang Nhật; còn hạn 6 tháng khi nộp.' },
      { step: 2, title: 'Xin giấy xác nhận chưa thụ lý kết hôn tại 市役所 và 住民票', desc: 'Dịch và chứng thực bản dịch giấy của 市役所.' },
      { step: 3, title: 'Nộp hồ sơ đến ĐSQ/TLSQ', desc: 'Kèm Letter Pack để nhận kết quả, sau đó nộp 婚姻要件具備証明書 cho 市役所.' },
    ],
    official_sources: [SRC.embassyMarriage],
  },
  {
    id: 'vn_marriage_certificate_dsq',
    category: 'marriage_family',
    title: {
      vi: 'Đăng ký kết hôn tại Cơ quan đại diện',
      en: 'Marriage Registration at the Vietnamese Mission',
      ja: 'ベトナム公館での婚姻登録',
    },
    summary: 'Đăng ký kết hôn tại ĐSQ (Thủ tục 8). Chỉ áp dụng cho người đang học tập/làm việc tại Nhật với visa hợp lệ (không áp dụng visa du lịch).',
    when_needed: 'Khi muốn được cấp Giấy chứng nhận kết hôn của Việt Nam trực tiếp tại Nhật.',
    submission_mode: 'direct_only',
    processing_time: TIME_UNCONFIRMED,
    fee_note: FEE_NOTE,
    formId: 'form_marriage_registration',
    status: 'VERIFIED',
    last_verified: '2026-09-27',
    aliases: ['kết hôn tại dsq', 'kết hôn 2 người việt ở nhật', 'làm giấy kết hôn', 'đăng ký kết hôn', 'ket hon', '婚姻登録'],
    related_jp_procedures: ['status-change-guide-jp'],
    important_notes: [
      'Giấy xác nhận tình trạng hôn nhân của Việt Nam chỉ có giá trị 6 tháng.',
      'Trường hợp tái hôn hoặc vợ/chồng trước đã mất: kèm bản sao có chứng thực bản án/quyết định ly hôn hoặc giấy chứng tử.',
      'Hai bên phải có mặt để ký.',
    ],
    required_documents: [
      { name: 'Tờ khai và Phiếu đề nghị & thông tin liên hệ', quantity: '01 bộ', originalOrCopy: 'Gốc', isOfficialRequirement: true },
      { name: 'Giấy xác nhận tình trạng hôn nhân do UBND cấp xã/phường tại VN hoặc cơ quan đại diện cấp', quantity: '01 bản/người', originalOrCopy: 'Bản gốc dấu đỏ, còn hạn 6 tháng', isOfficialRequirement: true },
      { name: 'Giấy của 市役所/区役所 xác nhận chưa thụ lý đăng ký kết hôn cho TOÀN BỘ thời gian cư trú tại Nhật (ĐSQ ghi 結婚届受理していない証明書)', quantity: '01 bản/nơi cư trú', originalOrCopy: 'Bản gốc', note: 'Tên gọi tại quầy có thể khác (ví dụ 婚姻届不受理証明書) — cần xác nhận với 市役所.', isOfficialRequirement: true },
      { name: 'Bản dịch tiếng Việt có chứng thực của giấy 市役所', quantity: '01 bản', originalOrCopy: 'Bản dịch chứng thực', isOfficialRequirement: true },
      { name: 'Phiếu cư trú 住民票 + bản chụp 在留カード (2 mặt)', quantity: '01 bộ/người', originalOrCopy: 'Gốc & bản chụp', isOfficialRequirement: true },
      { name: 'Giấy khám sức khỏe', quantity: '01 bản/người', originalOrCopy: 'Bản gốc', isOfficialRequirement: true },
      { name: 'Bản chụp hộ chiếu (trang 2-3) của hai bên', quantity: '01 bản/người', originalOrCopy: 'Bản chụp', isOfficialRequirement: true },
    ],
    steps: [
      { step: 1, title: 'Chuẩn bị giấy tờ tình trạng hôn nhân từ Việt Nam và Nhật', desc: 'Giấy VN còn hạn 6 tháng; giấy 市役所 kèm bản dịch chứng thực.' },
      { step: 2, title: 'Khai phiếu đề nghị qua consul.vnembassy-jp.org', desc: 'Chuẩn bị 住民票, 在留カード, giấy khám sức khỏe, hộ chiếu.' },
      { step: 3, title: 'Hai bên có mặt ký tại cơ quan đại diện', desc: 'Nhận Giấy chứng nhận kết hôn theo hướng dẫn của cơ quan.' },
    ],
    official_sources: [SRC.embassyMarriage],
  },
  {
    id: 'vn_divorce_recording',
    category: 'marriage_family',
    title: {
      vi: 'Ghi chú ly hôn (đã ly hôn tại Nhật Bản)',
      en: 'Recording of Divorce Registered in Japan',
      ja: '日本で成立した離婚のベトナム側記録',
    },
    summary: 'Ghi vào sổ hộ tịch Việt Nam việc ly hôn đã được 市役所 thụ lý hoặc tòa án Nhật giải quyết (Thủ tục 12 trên trang ĐSQ).',
    when_needed: 'Sau khi ly hôn tại Nhật, cần ghi chú để pháp luật Việt Nam ghi nhận (ví dụ trước khi tái hôn).',
    submission_mode: 'unconfirmed',
    processing_time: TIME_UNCONFIRMED,
    fee_note: FEE_NOTE,
    status: 'VERIFIED',
    last_verified: '2026-09-27',
    aliases: ['ghi chú ly hôn', 'ly hôn ở nhật', 'ly hon', '離婚届受理証明書', 'rikon'],
    related_jp_procedures: ['status-change-guide-jp'],
    required_documents: [
      { name: 'Tờ khai và Phiếu đề nghị & thông tin liên hệ', quantity: '01 bộ', originalOrCopy: 'Gốc', isOfficialRequirement: true },
      { name: 'Giấy chứng nhận thụ lý ly hôn 離婚届受理証明書 của 市役所, hoặc bản án/quyết định của tòa án', quantity: '01 bản', originalOrCopy: 'Bản gốc', isOfficialRequirement: true },
      { name: 'Bản dịch tiếng Việt có chứng thực', quantity: '01 bản', originalOrCopy: 'Bản dịch chứng thực', isOfficialRequirement: true },
      { name: 'Phiếu cư trú 住民票', quantity: '01 bản', originalOrCopy: 'Bản gốc', isOfficialRequirement: true },
      { name: 'Bản chụp hộ chiếu (trang 2-3) của hai bên', quantity: '01 bản/người', originalOrCopy: 'Bản chụp', isOfficialRequirement: true },
    ],
    steps: [
      { step: 1, title: 'Xin 離婚届受理証明書 hoặc bản án ly hôn', desc: 'Dịch và chứng thực bản dịch.' },
      { step: 2, title: 'Nộp hồ sơ đến ĐSQ/TLSQ', desc: 'Hình thức nộp: cần xác nhận với cơ quan.' },
    ],
    official_sources: [SRC.embassyMarriage],
  },

  // 4. Nhóm Hợp pháp hóa & Chứng thực (Apostille từ 11/9/2026)
  {
    id: 'vn_consular_legalization_jp_docs',
    category: 'legalization_auth',
    title: {
      vi: 'Giấy tờ Nhật Bản dùng tại Việt Nam: Apostille (từ 11/9/2026) / hợp pháp hóa lãnh sự',
      en: 'Japanese Documents for Use in Vietnam: Apostille (from 11 Sep 2026) / Legalization',
      ja: 'ベトナムで使用する日本の公文書：アポスティーユ（2026年9月11日以降）／領事認証',
    },
    summary: 'Từ 11/9/2026, Công ước Apostille có hiệu lực với Việt Nam. Giấy tờ công của Nhật dùng tại Việt Nam chỉ cần Apostille của Bộ Ngoại giao Nhật Bản; ĐSQ ngừng hợp pháp hóa lãnh sự giấy tờ công thuộc phạm vi Công ước.',
    when_needed: 'Khi mang giấy tờ do cơ quan Nhật cấp về Việt Nam (khai sinh, kết hôn, bằng cấp, lý lịch...).',
    submission_mode: 'postal_or_direct',
    processing_time: 'Apostille: theo Bộ Ngoại giao Nhật. Hợp pháp hóa (giấy tờ ngoài phạm vi Công ước): cần xác nhận với cơ quan',
    fee_note: FEE_NOTE,
    status: 'VERIFIED',
    last_verified: '2026-09-27',
    aliases: ['apostille', 'アポスティーユ', 'hợp pháp hóa lãnh sự', 'chứng nhận gaimusho', 'chứng nhận mofa', 'hợp pháp hóa bằng cấp', 'dấu lãnh sự', '公印確認', '領事認証'],
    related_jp_procedures: ['leaving-japan-wizard-jp'],
    important_notes: [
      'Giấy tờ công của Nhật có Apostille hợp lệ được sử dụng tại Việt Nam mà KHÔNG cần chứng nhận thêm.',
      'Giấy tờ đã được hợp pháp hóa lãnh sự TRƯỚC 11/9/2026 vẫn còn giá trị sử dụng tại Việt Nam, không cần làm lại Apostille.',
      'ĐSQ chỉ tiếp tục hợp pháp hóa lãnh sự đối với giấy tờ ngoài phạm vi Công ước (ví dụ một số giấy tờ hành chính liên quan thương mại, hải quan).',
      'Apostille không xác nhận nội dung giấy tờ, chỉ xác nhận chữ ký, chức danh, con dấu.',
    ],
    required_documents: [
      { name: 'Giấy tờ công của Nhật cần dùng tại Việt Nam (bản gốc)', quantity: '01 bản', originalOrCopy: 'Bản gốc', note: 'Xin Apostille tại Bộ Ngoại giao Nhật Bản (外務省, 2-2-1 Kasumigaseki, Chiyoda-ku, Tokyo) — xem hướng dẫn của 外務省.', isOfficialRequirement: true },
      { name: 'Chỉ khi giấy tờ NGOÀI phạm vi Công ước: bản gốc có dấu của Bộ Ngoại giao Nhật + 01 bản chụp, nộp ĐSQ để hợp pháp hóa', quantity: '01 bộ', originalOrCopy: 'Gốc & bản chụp', note: 'ĐSQ hướng dẫn gửi qua bưu điện (現金書留) kèm Letter Pack và bìa nhựa để nhận kết quả.' },
    ],
    steps: [
      { step: 1, title: 'Xác định giấy tờ có thuộc phạm vi Công ước Apostille không', desc: 'Phần lớn giấy tờ công (hộ tịch, bằng cấp công lập, giấy của 市役所...) thuộc phạm vi. Nếu chưa chắc: cần xác nhận với cơ quan.' },
      { step: 2, title: 'Xin Apostille tại Bộ Ngoại giao Nhật Bản', desc: 'Theo hướng dẫn trên trang 外務省 (公文書の証明). Không cần đến ĐSQ Việt Nam.' },
      { step: 3, title: 'Giấy tờ ngoài phạm vi Công ước', desc: 'Lấy chứng nhận của Bộ Ngoại giao Nhật, sau đó nộp ĐSQ Việt Nam hợp pháp hóa lãnh sự.' },
    ],
    official_sources: [SRC.embassyApostille, SRC.mofaJapanApostille, SRC.embassyLegalization],
  },
  {
    id: 'vn_signature_authentication',
    category: 'legalization_auth',
    title: {
      vi: 'Chứng thực chữ ký trên Giấy ủy quyền / Hợp đồng ủy quyền',
      en: 'Signature Authentication (Power of Attorney)',
      ja: '委任状・委任契約書の署名認証',
    },
    summary: 'Chứng thực chữ ký của người lập giấy ủy quyền/hợp đồng ủy quyền để dùng tại Việt Nam (Thủ tục 15, 17 trên trang ĐSQ). Làm trực tiếp, không nhận qua bưu điện.',
    when_needed: 'Khi ở Nhật cần ủy quyền cho người thân tại Việt Nam thực hiện công việc (rút BHXH, giao dịch nhà đất, ngân hàng...).',
    submission_mode: 'direct_only',
    processing_time: TIME_UNCONFIRMED,
    fee_note: FEE_NOTE,
    formId: 'form_power_of_attorney',
    status: 'VERIFIED',
    last_verified: '2026-09-27',
    aliases: ['chứng thực chữ ký', 'giấy ủy quyền rút bhxh', 'ủy quyền nhà đất', 'chứng thực ủy quyền', 'ký giấy ủy quyền', 'uy quyen', '委任状'],
    related_jp_procedures: ['leaving-japan-wizard-jp'],
    important_notes: [
      'ĐSQ: "Thủ tục này làm trực tiếp tại Phòng Lãnh sự/Đại sứ quán, không tiếp nhận qua đường bưu điện".',
      'Chữ ký trên văn bản phải giống chữ ký ở trang 3 hộ chiếu; ký trước mặt viên chức lãnh sự.',
      'Hợp đồng ủy quyền: chuẩn bị tối thiểu 3 bộ. Mẫu của ĐSQ/Toolio chỉ để tham khảo.',
    ],
    required_documents: [
      { name: 'Tờ khai và Phiếu đề nghị & thông tin liên hệ', quantity: '01 bộ', originalOrCopy: 'Gốc', isOfficialRequirement: true },
      { name: 'Giấy ủy quyền (hoặc hợp đồng ủy quyền — tối thiểu 3 bộ), CHƯA ký', quantity: 'Theo loại văn bản', originalOrCopy: 'Gốc', note: 'Ký trước mặt viên chức lãnh sự.', isOfficialRequirement: true },
      { name: 'Bản chụp hộ chiếu (trang 2-3) của người ủy quyền', quantity: '01 bản', originalOrCopy: 'Bản chụp', isOfficialRequirement: true },
      { name: 'Bản chụp CCCD (2 mặt) hoặc hộ chiếu của người được ủy quyền', quantity: '01 bản', originalOrCopy: 'Bản chụp', isOfficialRequirement: true },
      { name: 'Hợp đồng ủy quyền: bản chụp giấy tờ tài sản liên quan', quantity: '01 bộ', originalOrCopy: 'Bản chụp' },
      { name: '(Tùy chọn) Bản nháp giấy ủy quyền của Toolio', quantity: 'Không nộp riêng', originalOrCopy: 'Bản nháp', note: 'Căn cứ Bộ luật Dân sự 2015 và Nghị định 23/2015/NĐ-CP (đã sửa đổi). Kiểm tra lại nội dung với nơi sẽ sử dụng giấy ủy quyền.', isForm: true, isDraftHelper: true, formId: 'form_power_of_attorney' },
    ],
    steps: [
      { step: 1, title: 'Soạn giấy ủy quyền/hợp đồng ủy quyền', desc: 'Ghi rõ thông tin hai bên và phạm vi ủy quyền; hỏi trước nơi nhận ở Việt Nam về yêu cầu nội dung.' },
      { step: 2, title: 'Đến trực tiếp ĐSQ/TLSQ (không ký trước)', desc: 'Mang bản in chưa ký và hộ chiếu gốc.' },
      { step: 3, title: 'Ký trước viên chức lãnh sự', desc: 'Nhận văn bản đã chứng thực chữ ký.' },
    ],
    official_sources: [SRC.embassyPoa],
  },
  {
    id: 'vn_consular_certification_vn_docs',
    category: 'legalization_auth',
    title: {
      vi: 'Giấy tờ Việt Nam dùng tại Nhật Bản: Apostille tại Việt Nam (từ 11/9/2026)',
      en: 'Vietnamese Documents for Use in Japan: Apostille in Vietnam (from 11 Sep 2026)',
      ja: '日本で使用するベトナムの公文書：ベトナムでのアポスティーユ',
    },
    summary: 'Từ 11/9/2026, giấy tờ công của Việt Nam dùng tại Nhật được chứng nhận Apostille bởi cơ quan có thẩm quyền trong nước (cổng apostille.lanhsuvietnam.gov.vn). ĐSQ tại Tokyo KHÔNG cấp Apostille.',
    when_needed: 'Khi nộp giấy tờ Việt Nam (lý lịch tư pháp, khai sinh, bằng cấp...) cho cơ quan/doanh nghiệp Nhật có yêu cầu xác thực.',
    submission_mode: 'unconfirmed',
    processing_time: 'Theo cơ quan cấp Apostille tại Việt Nam — cần xác nhận với cơ quan',
    status: 'VERIFIED',
    last_verified: '2026-09-27',
    aliases: ['apostille', 'アポスティーユ', 'chứng nhận lãnh sự', 'xác nhận bằng đại học', 'chứng nhận bằng cấp', 'dấu dsq cho giấy tờ vn', 'hợp pháp hóa giấy tờ việt nam'],
    related_jp_procedures: ['status-change-guide-jp'],
    important_notes: [
      'ĐSQ Việt Nam tại Nhật không cấp Apostille cho giấy tờ Việt Nam.',
      'Giấy tờ đã chứng nhận/hợp pháp hóa lãnh sự trước 11/9/2026: hỏi cơ quan Nhật tiếp nhận xem còn chấp nhận không — cần xác nhận với cơ quan.',
      'Giấy tờ ngoài phạm vi Công ước (ví dụ một số giấy tờ thương mại, hải quan) vẫn theo thủ tục chứng nhận/hợp pháp hóa lãnh sự.',
    ],
    required_documents: [
      { name: 'Giấy tờ công do cơ quan Việt Nam cấp (bản gốc)', quantity: '01 bản', originalOrCopy: 'Bản gốc', note: 'Nộp yêu cầu Apostille qua https://apostille.lanhsuvietnam.gov.vn (người thân tại VN có thể thực hiện — cần xác nhận với cơ quan).', isOfficialRequirement: true },
    ],
    steps: [
      { step: 1, title: 'Kiểm tra cơ quan Nhật có yêu cầu Apostille không', desc: 'Nhiều thủ tục chỉ cần bản dịch; hỏi trước nơi nhận.' },
      { step: 2, title: 'Yêu cầu Apostille tại Việt Nam', desc: 'Qua cổng apostille.lanhsuvietnam.gov.vn theo hướng dẫn của Cục Lãnh sự.' },
    ],
    official_sources: [SRC.embassyApostille, SRC.vnApostillePortal],
  },

  // 5. Nhóm Khai tử & Hộ tịch khác
  {
    id: 'vn_death_registration',
    category: 'death_civil',
    title: {
      vi: 'Đăng ký khai tử cho công dân Việt Nam qua đời tại Nhật Bản',
      en: 'Death Registration for Vietnamese Citizens in Japan',
      ja: '在日ベトナム人の死亡登録',
    },
    summary: 'Đăng ký khai tử và cấp trích lục khai tử cho công dân Việt Nam qua đời tại Nhật (Thủ tục 22 trên trang ĐSQ).',
    when_needed: 'Khi có công dân Việt Nam qua đời tại Nhật Bản.',
    submission_mode: 'unconfirmed',
    processing_time: TIME_UNCONFIRMED,
    fee_note: FEE_NOTE,
    status: 'VERIFIED',
    last_verified: '2026-09-27',
    aliases: ['khai tử', 'báo tử', 'người việt mất tại nhật', 'giấy báo tử', 'shibotodoke', '死亡届'],
    related_jp_procedures: ['leaving-japan-wizard-jp'],
    required_documents: [
      { name: 'Tờ khai và Phiếu đề nghị (khai qua QR / https://consul.vnembassy-jp.org/)', quantity: '01 bộ', originalOrCopy: 'Gốc', isOfficialRequirement: true },
      { name: 'Giấy chứng tử do bệnh viện cấp', quantity: '01 bản', originalOrCopy: 'Theo hướng dẫn cơ quan', isOfficialRequirement: true },
      { name: 'Bản dịch công chứng Giấy chứng tử sang tiếng Việt', quantity: '01 bản', originalOrCopy: 'Bản dịch công chứng', isOfficialRequirement: true },
      { name: 'Hộ chiếu của người đã mất', quantity: '01', originalOrCopy: 'Theo hướng dẫn cơ quan', isOfficialRequirement: true },
      { name: 'Hộ chiếu của người đi khai tử', quantity: '01', originalOrCopy: 'Theo hướng dẫn cơ quan', isOfficialRequirement: true },
      { name: 'Giấy ủy quyền của gia đình (nếu có) kèm bản dịch chứng thực', quantity: '01', originalOrCopy: '—' },
    ],
    steps: [
      { step: 1, title: 'Báo tử tại 市役所/区役所 Nhật Bản', desc: 'Theo quy định của Nhật.' },
      { step: 2, title: 'Khai phiếu đề nghị và nộp hồ sơ khai tử', desc: 'Liên hệ ĐSQ/TLSQ; nếu cần đưa thi hài/tro cốt về nước, xem cùng trang hướng dẫn.' },
    ],
    official_sources: [SRC.embassyDeath],
  },
  {
    id: 'vn_death_extract',
    category: 'death_civil',
    title: {
      vi: 'Cấp bản sao trích lục khai tử',
      en: 'Copy of Death Extract',
      ja: '死亡登録抄本の写しの発給',
    },
    summary: 'Cấp bản sao trích lục khai tử đã đăng ký tại cơ quan đại diện Việt Nam tại Nhật.',
    when_needed: 'Để giải quyết thừa kế, bảo hiểm hoặc chế độ tử tuất tại Việt Nam.',
    submission_mode: 'direct_or_postal',
    processing_time: TIME_UNCONFIRMED,
    fee_note: FEE_NOTE,
    status: 'PARTIAL',
    last_verified: '2026-09-27',
    aliases: ['trích lục khai tử', 'bản sao giấy báo tử', 'chế độ tử tuất'],
    related_jp_procedures: ['social-insurance-jp'],
    important_notes: [
      'Trang "Thủ tục hộ tịch khác" của ĐSQ ghi nhóm thủ tục cấp giấy tờ hộ tịch có thể nộp trực tiếp hoặc qua bưu điện; danh mục giấy tờ cụ thể cần xác nhận với cơ quan.',
    ],
    required_documents: [
      { name: 'Tờ khai yêu cầu cấp bản sao trích lục hộ tịch', quantity: '01 bản', originalOrCopy: 'Gốc' },
      { name: 'Giấy tờ chứng minh quan hệ với người đã mất (nếu cơ quan yêu cầu)', quantity: '01 bản', originalOrCopy: 'Bản chụp', note: 'Cần xác nhận với cơ quan.' },
    ],
    steps: [
      { step: 1, title: 'Liên hệ phòng lãnh sự', desc: 'Xác nhận giấy tờ và lệ phí.' },
      { step: 2, title: 'Nộp yêu cầu trực tiếp hoặc qua bưu điện', desc: 'Theo hướng dẫn của cơ quan.' },
    ],
    official_sources: [SRC.embassyOtherCivil, SRC.embassyDeath],
  },

  // 6. Nhóm Bảo hộ công dân & Khẩn cấp
  {
    id: 'vn_citizen_protection_lost_docs',
    category: 'protection_emergency',
    title: {
      vi: 'Hỗ trợ khi mất toàn bộ giấy tờ tùy thân tại Nhật',
      en: 'Assistance When All Identity Documents Are Lost',
      ja: '身分証明書類をすべて紛失した場合の支援',
    },
    summary: 'Các bước cần làm khi mất hộ chiếu và thẻ cư trú: báo cảnh sát, xin lại 在留カード tại Cục Xuất nhập cảnh, làm lại hộ chiếu tại cơ quan đại diện.',
    when_needed: 'Bị trộm, cướp, hỏa hoạn hoặc sự cố làm mất toàn bộ giấy tờ.',
    submission_mode: 'direct_only',
    processing_time: 'Tùy từng bước',
    status: 'PARTIAL',
    last_verified: '2026-09-27',
    aliases: ['mất hết giấy tờ', 'mất zairyu card và hộ chiếu', 'cấp cứu lãnh sự', 'bảo hộ khẩn cấp'],
    related_jp_procedures: ['certificate-acquisition-guide-jp'],
    important_notes: [
      'Đường dây nóng BẢO HỘ CÔNG DÂN chỉ dành cho trường hợp khẩn cấp; hỏi thủ tục hộ chiếu/hộ tịch dùng số điện thoại/email phòng lãnh sự.',
    ],
    required_documents: [
      { name: 'Giấy xác nhận trình báo của cảnh sát Nhật', quantity: '01 bản', originalOrCopy: 'Gốc/bản sao' },
      { name: 'Hồ sơ cấp lại hộ chiếu do bị mất', quantity: '—', originalOrCopy: '—', note: 'Xem thủ tục "Cấp lại hộ chiếu do bị mất".' },
    ],
    steps: [
      { step: 1, title: 'Trình báo cảnh sát Nhật (交番/警察署)', desc: 'Lấy số/giấy xác nhận trình báo mất.' },
      { step: 2, title: 'Xin cấp lại 在留カード tại Cục Xuất nhập cảnh', desc: 'Theo hướng dẫn của 出入国在留管理庁 (hạn nộp: 14 ngày kể từ khi biết mất).' },
      { step: 3, title: 'Làm lại hộ chiếu tại ĐSQ/TLSQ', desc: 'Khẩn cấp ngoài giờ: ĐSQ Tokyo +81-80-3590-9136; TLSQ Osaka +81-90-4769-6789; TLSQ Fukuoka (cuối tuần/ngày lễ) 080-3984-6668 hoặc 080-4279-7302.' },
    ],
    official_sources: [SRC.embassyGeneral, SRC.embassyPassport],
  },
  {
    id: 'vn_citizen_protection_detained_accident',
    category: 'protection_emergency',
    title: {
      vi: 'Bảo hộ công dân khi bị bắt giữ, tai nạn hoặc bệnh nặng',
      en: 'Consular Protection in Detention, Accident or Critical Illness',
      ja: '拘束・事故・重病時の邦人保護',
    },
    summary: 'Liên hệ đường dây nóng bảo hộ công dân khi công dân Việt Nam bị tạm giữ, gặp tai nạn hoặc bệnh nặng tại Nhật.',
    when_needed: 'Khi người thân, bạn bè hoặc đồng hương gặp nạn, bị cảnh sát tạm giữ hoặc nhập viện cấp cứu.',
    submission_mode: 'direct_only',
    processing_time: 'Liên hệ ngay qua đường dây nóng',
    status: 'VERIFIED',
    last_verified: '2026-09-27',
    aliases: ['bị bắt ở nhật', 'tai nạn lao động', 'thăm lãnh sự', 'bảo hộ công dân', 'hotline'],
    related_jp_procedures: ['social-insurance-jp'],
    required_documents: [
      { name: 'Thông tin người gặp nạn (họ tên, ngày sinh, số hộ chiếu/在留カード)', quantity: '—', originalOrCopy: 'Ghi chép' },
      { name: 'Địa chỉ nơi tạm giữ hoặc bệnh viện', quantity: '—', originalOrCopy: 'Ghi chép' },
    ],
    steps: [
      { step: 1, title: 'Gọi đường dây nóng bảo hộ công dân', desc: 'ĐSQ Tokyo: +81-80-3590-9136 (email baohocongdan@vnembassy.jp); TLSQ Osaka: +81-90-4769-6789; TLSQ Fukuoka: 080-3984-6668 / 080-4279-7302; Tổng đài bảo hộ công dân (Bộ Ngoại giao): +84 981 84 84 84.' },
      { step: 2, title: 'Cung cấp thông tin người gặp nạn', desc: 'Cơ quan đại diện phối hợp với cơ quan chức năng Nhật và gia đình.' },
    ],
    official_sources: [SRC.embassyGeneral, SRC.mofaHotline],
  },

  // 7. Nhóm Miễn thị thực & Thủ tục khác
  {
    id: 'vn_visa_exemption_5yr',
    category: 'visa_other',
    title: {
      vi: 'Cấp Giấy miễn thị thực (người gốc Việt và thân nhân)',
      en: 'Visa Exemption Certificate',
      ja: 'ベトナム査証免除証明書の発給',
    },
    summary: 'Cấp Giấy miễn thị thực cho người Việt Nam định cư ở nước ngoài/đã nhập quốc tịch Nhật và vợ/chồng, con của họ (theo NĐ 82/2015/NĐ-CP, trang ĐSQ).',
    when_needed: 'Để nhập cảnh Việt Nam không cần xin visa mỗi lần. Thời hạn giấy: cần xác nhận với cơ quan.',
    submission_mode: 'postal_or_direct',
    processing_time: TIME_UNCONFIRMED,
    fee_note: FEE_NOTE,
    status: 'PARTIAL',
    last_verified: '2026-09-27',
    aliases: ['miễn thị thực', 'visa 5 năm', 'về việt nam không cần visa', 'miễn visa cho vợ chồng con', 'giấy miễn thị thực'],
    related_jp_procedures: ['leaving-japan-wizard-jp'],
    important_notes: [
      'Giấy miễn thị thực cấp trước đây vẫn có giá trị theo thời hạn ghi trên giấy.',
      'ĐSQ hướng dẫn chuẩn bị phong bì trả kết quả 着払い ghi sẵn địa chỉ.',
    ],
    required_documents: [
      { name: 'Phiếu đề nghị và thông tin liên hệ', quantity: '01 bản', originalOrCopy: 'Gốc', isOfficialRequirement: true },
      { name: 'Tờ khai (tải từ trang ĐSQ)', quantity: '01 bản', originalOrCopy: 'Gốc', isOfficialRequirement: true },
      { name: 'Hộ chiếu gốc còn hạn trên 1 năm + bản chụp trang 2-3', quantity: '01 bộ', originalOrCopy: 'Gốc & bản chụp', isOfficialRequirement: true },
      { name: 'Phiếu cư trú 住民票', quantity: '01 bản', originalOrCopy: 'Bản gốc', isOfficialRequirement: true },
      { name: 'Giấy tờ chứng minh thuộc diện miễn thị thực (khai sinh, giấy tờ quốc tịch, kết hôn...)', quantity: '01 bộ', originalOrCopy: 'Theo hướng dẫn cơ quan', isOfficialRequirement: true },
      { name: 'Phong bì trả kết quả 着払い ghi sẵn địa chỉ', quantity: '01', originalOrCopy: '—', isOfficialRequirement: true },
    ],
    steps: [
      { step: 1, title: 'Tải và điền tờ khai của ĐSQ', desc: 'Chuẩn bị giấy tờ chứng minh diện miễn thị thực.' },
      { step: 2, title: 'Nộp hồ sơ đến ĐSQ/TLSQ', desc: 'Kèm phong bì 着払い để nhận kết quả.' },
    ],
    official_sources: [SRC.embassyVisa],
  },
  {
    id: 'vn_criminal_record_support',
    category: 'visa_other',
    title: {
      vi: 'Hướng dẫn xin Phiếu Lý lịch tư pháp Việt Nam khi ở Nhật',
      en: 'Obtaining a Vietnamese Criminal Record Certificate from Japan',
      ja: '日本からのベトナム司法記録票（無犯罪証明）の取得案内',
    },
    summary: 'Từ 01/3/2025, Phiếu Lý lịch tư pháp do Công an cấp tỉnh cấp (trước đây là Sở Tư pháp); có thể nộp trực tiếp, trực tuyến (Cổng DVC / ứng dụng VNeID với tài khoản định danh mức 2) hoặc qua bưu chính.',
    when_needed: 'Khi xin vĩnh trú, nhập quốc tịch Nhật hoặc công việc yêu cầu lý lịch tư pháp.',
    submission_mode: 'unconfirmed',
    processing_time: 'Theo Cổng DVC Bộ Công an: 10 ngày kể từ khi nhận hồ sơ hợp lệ, tối đa 15 ngày với trường hợp phức tạp/từng cư trú ở nước ngoài',
    formId: 'form_power_of_attorney',
    status: 'VERIFIED',
    last_verified: '2026-09-27',
    aliases: ['lý lịch tư pháp', 'phiếu lý lịch tư pháp số 1', 'phiếu lý lịch tư pháp số 2', 'xin lltp ở nhật', 'hồ sơ vĩnh trú', 'giấy không tiền án tiền sự', 'vneid', '無犯罪証明書'],
    related_jp_procedures: ['pr-readiness-checker-jp', 'status-change-guide-jp'],
    important_notes: [
      'Phiếu số 2: KHÔNG được ủy quyền cho người khác xin thay (trừ trường hợp người chưa thành niên do cha mẹ yêu cầu). Phải tự nộp (trực tiếp hoặc trực tuyến qua VNeID/Cổng DVC).',
      'Phiếu số 1: được ủy quyền bằng văn bản có công chứng/chứng thực; cha, mẹ, vợ/chồng, con xin thay không cần văn bản ủy quyền (theo Cổng DVC Bộ Công an).',
      'Hỏi trước cơ quan Nhật (ví dụ 入管 khi xin vĩnh trú, 法務局 khi nhập tịch) cần phiếu số mấy và có cần dịch/Apostille không.',
    ],
    required_documents: [
      { name: 'Tờ khai yêu cầu cấp Phiếu Lý lịch tư pháp', quantity: '01 bản', originalOrCopy: 'Gốc (hoặc khai điện tử)', isOfficialRequirement: true },
      { name: 'Bản chụp hộ chiếu / CCCD của người yêu cầu', quantity: '01 bản', originalOrCopy: 'Bản chụp (xuất trình bản gốc khi nộp trực tiếp)', isOfficialRequirement: true },
      { name: 'Chỉ với Phiếu số 1 xin qua người được ủy quyền: văn bản ủy quyền có chứng thực chữ ký', quantity: '01 bản', originalOrCopy: 'Gốc', note: 'Có thể chứng thực chữ ký tại ĐSQ/TLSQ (thủ tục "Chứng thực chữ ký"). Không áp dụng cho Phiếu số 2.', isForm: true, isDraftHelper: true, formId: 'form_power_of_attorney' },
    ],
    steps: [
      { step: 1, title: 'Xác định loại phiếu cần (số 1 hay số 2)', desc: 'Hỏi cơ quan Nhật tiếp nhận hồ sơ.' },
      { step: 2, title: 'Phiếu số 2: tự nộp trực tuyến qua VNeID / Cổng DVC Bộ Công an', desc: 'Cần tài khoản định danh điện tử mức 2. Không ủy quyền được.' },
      { step: 3, title: 'Phiếu số 1 qua người thân: chứng thực chữ ký giấy ủy quyền tại ĐSQ/TLSQ', desc: 'Gửi giấy ủy quyền về Việt Nam; người được ủy quyền nộp tại Công an cấp tỉnh.' },
    ],
    official_sources: [SRC.bcaLltp],
  },
];

export const CONSULAR_PROCEDURE_MAP = new Map(
  CONSULAR_PROCEDURES.map((p) => [p.id, p])
);

export const getProcedureById = (id) => CONSULAR_PROCEDURE_MAP.get(id) || null;

export const getProceduresByCategory = (catId) =>
  CONSULAR_PROCEDURES.filter((p) => p.category === catId);
