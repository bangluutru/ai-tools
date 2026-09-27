/**
 * Biểu mẫu Giấy ủy quyền (Power of Attorney)
 * BẢN NHÁP tham khảo theo Bộ luật Dân sự 2015 (đại diện theo ủy quyền, hợp đồng ủy quyền) và
 * Nghị định 23/2015/NĐ-CP về chứng thực chữ ký (đã sửa đổi, bổ sung) — https://vanban.chinhphu.vn/?pageid=27160&docid=179100
 * (NĐ 30/2020/NĐ-CP là quy định về công tác văn thư của cơ quan nhà nước, KHÔNG phải căn cứ cho giấy ủy quyền cá nhân.)
 * ĐSQ: https://vnembassy-jp.org/vi/huong-dan-thu-tuc-chung-thuc-giay-uy-quyen-ban-sao-hop-dong-uy-quyen-tu-choi-di-san-th%C6%B0a-ke
 * 
 * Văn bản này được người đang cư trú tại Nhật Bản lập để ủy quyền cho người thân tại Việt Nam
 * thực hiện các giao dịch dân sự, rút bảo hiểm, thủ tục đất đai, ngân hàng, hoặc nhận giấy tờ hộ tịch.
 * Người lập phải ký trước mặt viên chức lãnh sự tại ĐSQ/TLSQ để chứng thực chữ ký.
 */

export const powerOfAttorneyForm = {
  id: 'form_power_of_attorney',
  code: 'GUQ-BLDS',
  title: {
    vi: 'Giấy ủy quyền (bản nháp tham khảo)',
    en: 'Power of Attorney (reference draft)',
    ja: '委任状（参考下書き）',
  },
  standardBasis: 'Bộ luật Dân sự 2015 (đại diện, hợp đồng ủy quyền) & Nghị định 23/2015/NĐ-CP về chứng thực (đã sửa đổi, bổ sung) — bản nháp tham khảo',
  isDraftHelper: true,
  status: 'DRAFT_HELPER',
  sourceUrl: 'https://vnembassy-jp.org/vi/huong-dan-thu-tuc-chung-thuc-giay-uy-quyen-ban-sao-hop-dong-uy-quyen-tu-choi-di-san-th%C6%B0a-ke',
  applicableOffices: ['tokyo_embassy', 'osaka_consulate', 'fukuoka_consulate'],
  printOrientation: 'portrait',
  paperSize: 'A4',

  fields: [
    // 1. Bên ủy quyền (Người lập giấy tại Nhật)
    {
      id: 'mandatorName',
      label: 'Họ và tên người ủy quyền (chữ in hoa)',
      type: 'text',
      placeholder: 'NGUYỄN VĂN A',
      required: true,
      transform: (val) => val?.toUpperCase() || '',
    },
    {
      id: 'mandatorDob',
      label: 'Ngày, tháng, năm sinh người ủy quyền',
      type: 'date',
      required: true,
    },
    {
      id: 'mandatorPassport',
      label: 'Số Hộ chiếu / CCCD người ủy quyền',
      type: 'text',
      placeholder: 'Hộ chiếu số C1234567 cấp ngày 01/01/2024 tại Cục QLXNC',
      required: true,
    },
    {
      id: 'mandatorAddressJP',
      label: 'Nơi cư trú hiện tại tại Nhật Bản',
      type: 'text',
      placeholder: '〒160-0022 Tokyo-to, Shinjuku-ku, Shinjuku 1-2-3',
      required: true,
    },
    {
      id: 'mandatorPhone',
      label: 'Số điện thoại tại Nhật',
      type: 'tel',
      placeholder: '080-1234-5678',
      required: true,
    },

    // 2. Bên được ủy quyền (Người ở Việt Nam)
    {
      id: 'proxyName',
      label: 'Họ và tên người được ủy quyền (chữ in hoa)',
      type: 'text',
      placeholder: 'TRẦN VĂN B',
      required: true,
      transform: (val) => val?.toUpperCase() || '',
    },
    {
      id: 'proxyDob',
      label: 'Ngày, tháng, năm sinh người được ủy quyền',
      type: 'date',
      required: true,
    },
    {
      id: 'proxyIdCard',
      label: 'Số CCCD người được ủy quyền (ngày cấp, nơi cấp)',
      type: 'text',
      placeholder: 'CCCD số 001095012345 cấp ngày 15/08/2022 tại Cục QLHC về TTXH',
      required: true,
    },
    {
      id: 'proxyAddressVN',
      label: 'Nơi thường trú tại Việt Nam của người được ủy quyền',
      type: 'text',
      placeholder: 'Số 10, ngõ 5, phố X, phường Cầu Giấy, TP Hà Nội',
      required: true,
    },
    {
      id: 'proxyRelationship',
      label: 'Quan hệ với người ủy quyền',
      type: 'text',
      placeholder: 'Bố đẻ / Mẹ đẻ / Vợ / Chồng / Anh ruột...',
      required: true,
    },

    // 3. Nội dung ủy quyền
    {
      id: 'scopeOfAuthority',
      label: 'Phạm vi ủy quyền cụ thể',
      type: 'textarea',
      placeholder: 'Thay mặt tôi thực hiện các thủ tục: Trích lục bản sao giấy khai sinh, rút hồ sơ BHXH 1 lần, nộp hồ sơ xin cấp lý lịch tư pháp, chuyển nhượng quyền sử dụng đất...',
      required: true,
    },
    {
      id: 'termOfAuthority',
      label: 'Thời hạn ủy quyền',
      type: 'text',
      placeholder: 'Kể từ ngày ký đến khi hoàn thành xong công việc hoặc đến ngày 31/12/2026',
      defaultValue: 'Kể từ ngày ký đến khi hoàn thành xong toàn bộ công việc ủy quyền nêu trên.',
      required: true,
    },
    {
      id: 'remuneration',
      label: 'Thù lao ủy quyền',
      type: 'text',
      defaultValue: 'Việc ủy quyền này không có thù lao.',
      required: true,
    },
  ],

  initialValues: {
    mandatorName: '',
    mandatorDob: '',
    mandatorPassport: '',
    mandatorAddressJP: '',
    mandatorPhone: '',
    proxyName: '',
    proxyDob: '',
    proxyIdCard: '',
    proxyAddressVN: '',
    proxyRelationship: '',
    scopeOfAuthority: '',
    termOfAuthority: 'Kể từ ngày ký đến khi hoàn thành xong toàn bộ công việc ủy quyền nêu trên.',
    remuneration: 'Việc ủy quyền này không có thù lao.',
  },
};
