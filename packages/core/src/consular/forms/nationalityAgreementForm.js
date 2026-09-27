/**
 * @file forms/nationalityAgreementForm.js
 * Canonical Form: Văn bản thỏa thuận lựa chọn quốc tịch cho con
 * Căn cứ: Luật Quốc tịch Việt Nam sửa đổi (Luật 79/2025/QH15), NĐ 191/2025/NĐ-CP — https://vnembassy-jp.org (nhóm thủ tục quốc tịch).
 * BẢN NHÁP tham khảo; mẫu chính thức ĐSQ dẫn là TP/QT-2025-VBTT. Chỉ cần khi cha HOẶC mẹ là người nước ngoài.
 */

export const NATIONALITY_AGREEMENT_FORM = {
  id: 'nationality_agreement',
  code: 'TT-QT-VN-JP.01',
  title: 'Văn bản thỏa thuận lựa chọn quốc tịch cho con',
  legal_basis: 'Luật Quốc tịch Việt Nam (sửa đổi, bổ sung bởi Luật 79/2025/QH15, hiệu lực 01/7/2025) & Nghị định 191/2025/NĐ-CP; mẫu chính thức ĐSQ dẫn: TP/QT-2025-VBTT',
  authority: 'Cơ quan đại diện Việt Nam tại Nhật Bản',
  version: '2024.1',
  isDraftHelper: true,
  status: 'DRAFT_HELPER',
  verified_at: '2026-09-27',
  official_source_url: 'https://vnembassy-jp.org/vi/nh%C3%B3m-th%E1%BB%A7-t%E1%BB%A5c-li%C3%AAn-quan-%C4%91%E1%BA%BFn-qu%E1%BB%91c-t%E1%BB%8Bch',
  page_size: 'A4',
  orientation: 'portrait',

  sections: [
    {
      id: 'parents_section',
      title: '1. Thông tin cha và mẹ',
      fields: [
        {
          id: 'father_name',
          label: 'Họ và tên cha',
          type: 'text',
          required: true,
          placeholder: 'NGUYỄN VĂN A hoặc SUZUKI TARO',
          dossier_key: 'father_name',
        },
        {
          id: 'father_nationality',
          label: 'Quốc tịch của cha',
          type: 'text',
          required: true,
          placeholder: 'Việt Nam hoặc Nhật Bản',
          dossier_key: 'father_nationality',
        },
        {
          id: 'father_passport',
          label: 'Số Hộ chiếu / Giấy tờ tùy thân của cha',
          type: 'text',
          required: true,
          placeholder: 'Số hộ chiếu...',
          dossier_key: 'father_passport',
        },
        {
          id: 'mother_name',
          label: 'Họ và tên mẹ',
          type: 'text',
          required: true,
          placeholder: 'TRẦN THỊ C hoặc SUZUKI HANAKO',
          dossier_key: 'mother_name',
        },
        {
          id: 'mother_nationality',
          label: 'Quốc tịch của mẹ',
          type: 'text',
          required: true,
          placeholder: 'Việt Nam hoặc Nhật Bản',
          dossier_key: 'mother_nationality',
        },
        {
          id: 'mother_passport',
          label: 'Số Hộ chiếu / Giấy tờ tùy thân của mẹ',
          type: 'text',
          required: true,
          placeholder: 'Số hộ chiếu...',
          dossier_key: 'mother_passport',
        },
        {
          id: 'joint_address',
          label: 'Địa chỉ nơi thường trú tại Nhật Bản',
          type: 'text',
          required: true,
          placeholder: '〒..., Tokyo, Shibuya-ku...',
          dossier_key: 'japan_address',
        },
      ],
    },
    {
      id: 'child_agreement_section',
      title: '2. Thông tin con và Nội dung thỏa thuận',
      fields: [
        {
          id: 'child_name',
          label: 'Họ và tên con',
          type: 'text',
          required: true,
          placeholder: 'Watanabe Linh',
          dossier_key: 'child_name',
        },
        {
          id: 'child_dob',
          label: 'Sinh ngày',
          type: 'date',
          required: true,
          dossier_key: 'child_dob',
        },
        {
          id: 'child_pob',
          label: 'Nơi sinh',
          type: 'text',
          required: true,
          placeholder: 'Bệnh viện ABC, Tokyo, Nhật Bản',
          dossier_key: 'child_pob',
        },
        {
          id: 'chosen_nationality',
          label: 'Quốc tịch cha mẹ thống nhất lựa chọn cho con',
          type: 'select',
          required: true,
          options: [
            { value: 'Việt Nam', label: 'Quốc tịch Việt Nam (Vietnamese Citizenship)' },
          ],
          default: 'Việt Nam',
        },
      ],
    },
  ],
};
