/**
 * @file forms/nationalityAgreementForm.js
 * Canonical Form: Văn bản thỏa thuận lựa chọn quốc tịch cho con
 * Căn cứ: Luật Quốc tịch Việt Nam & Mẫu công bố của ĐSQ/TLSQ Việt Nam tại Nhật Bản.
 */

export const NATIONALITY_AGREEMENT_FORM = {
  id: 'nationality_agreement',
  code: 'TT-QT-VN-JP.01',
  title: 'Văn bản thỏa thuận lựa chọn quốc tịch cho con',
  legal_basis: 'Điều 16 Luật Quốc tịch Việt Nam năm 2008 (sửa đổi, bổ sung năm 2014)',
  authority: 'Cơ quan đại diện Việt Nam tại Nhật Bản',
  version: '2024.1',
  status: 'VERIFIED',
  fingerprint: 'a4b8e23f9901d8c1192ef941bc4811a7f05282a567e9124a91f5820468f7aa11',
  verified_at: '2026-09-12',
  official_source_url: 'https://vnembassy-jp.org/sites/default/files/Thoa%20thuan%20lua%20chon%20quoc%20tich%20cho%20con.doc',
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
