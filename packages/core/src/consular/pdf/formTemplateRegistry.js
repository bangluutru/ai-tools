/**
 * @file packages/core/src/consular/pdf/formTemplateRegistry.js
 * @description Bảng đăng ký các BẢN NHÁP hỗ trợ điền của Toolio (không phải biểu mẫu chính thức).
 * Toolio không lưu mã băm của mẫu gốc; sha256Fingerprint = null và verifyTemplateIntegrity luôn yêu cầu đối chiếu thủ công.
 * Tách biệt rõ ràng:
 *  - sourcePageUrl (trang hướng dẫn thủ tục)
 *  - officialTemplateUrl (nguồn tải phôi/mẫu chính thức)
 *  - localTemplateAsset (nếu có)
 *  - sha256Fingerprint (mã băm chuẩn)
 */

export const A4_LOGICAL_WIDTH = 794;  // px ở 96 DPI (210 mm)
export const A4_LOGICAL_HEIGHT = 1123; // px ở 96 DPI (297 mm)
export const A4_ASPECT_RATIO = A4_LOGICAL_WIDTH / A4_LOGICAL_HEIGHT; // ≈ 0.7070347

export const FORM_TEMPLATES = {
  form_passport_tk02: {
    id: 'form_passport_tk02',
    code: 'TK02',
    title: {
      vi: 'Tờ khai đề nghị cấp hộ chiếu phổ thông ở nước ngoài (Mẫu TK02)',
      en: 'Passport Application Form Abroad (Form TK02)',
      ja: '一般旅券発給申請書（様式TK02）',
    },
    standardBasis: 'Thông tư 31/2023/TT-BCA (sửa đổi, bổ sung bởi TT 68/2025/TT-BCA và TT 69/2026/TT-BCA, hiệu lực 01/7/2026) — bản nháp tham khảo, tờ khai nộp phải khai trực tuyến tại passport.mofa.gov.vn',
    legalCode: 'TT31/2023/TT-BCA (sđ TT69/2026/TT-BCA)',
    issuingAuthority: 'Bộ Công an Việt Nam',
    pageCount: 2,
    paperSize: 'A4',
    orientation: 'portrait',
    sourcePageUrl: 'https://vnembassy-jp.org/vi/th%E1%BB%A7-t%E1%BB%A5c-li%C3%AAn-quan-%C4%91%E1%BA%BFn-h%E1%BB%99-chi%E1%BA%BFu',
    officialTemplateUrl: 'https://passport.mofa.gov.vn/',
    sha256Fingerprint: null,
    hasPhotoBox: true,
    photoSize: '4x6 cm',
    status: 'DRAFT_HELPER',
  },
  form_birth_registration: {
    id: 'form_birth_registration',
    code: 'TP/HT-2020-TKKS.1',
    title: {
      vi: 'Tờ khai đăng ký khai sinh',
      en: 'Birth Registration Application Form',
      ja: '出生届出申請書',
    },
    standardBasis: 'Bản nháp tham khảo theo bố cục tờ khai hộ tịch của Bộ Tư pháp (phiên bản hiện hành cần xác nhận với cơ quan)',
    legalCode: 'TP/HT (cần xác nhận)',
    issuingAuthority: 'Bộ Tư pháp Việt Nam',
    pageCount: 1,
    paperSize: 'A4',
    orientation: 'portrait',
    sourcePageUrl: 'https://vnembassy-jp.org/vi/thu-tuc-cap-giay-khai-sinh',
    officialTemplateUrl: 'https://moj.gov.vn/vbpq/lists/vn%20bn%20php%20lut/view_detail.aspx?itemid=38245',
    sha256Fingerprint: null,
    hasPhotoBox: false,
    status: 'DRAFT_HELPER',
  },
  form_nationality_agreement: {
    id: 'form_nationality_agreement',
    code: 'TT-QT-VN-JP.01',
    title: {
      vi: 'Văn bản thỏa thuận lựa chọn quốc tịch cho con',
      en: 'Agreement on Choice of Child Nationality',
      ja: '子の国籍選択合意書',
    },
    standardBasis: 'Luật Quốc tịch Việt Nam (sửa đổi, bổ sung bởi Luật 79/2025/QH15, hiệu lực 01/7/2025) & Nghị định 191/2025/NĐ-CP; mẫu chính thức ĐSQ dẫn: TP/QT-2025-VBTT',
    legalCode: 'L79/2025/QH15',
    issuingAuthority: 'Cơ quan đại diện Việt Nam tại Nhật Bản',
    pageCount: 1,
    paperSize: 'A4',
    orientation: 'portrait',
    sourcePageUrl: 'https://vnembassy-jp.org/vi/nh%C3%B3m-th%E1%BB%A7-t%E1%BB%A5c-li%C3%AAn-quan-%C4%91%E1%BA%BFn-qu%E1%BB%91c-t%E1%BB%8Bch',
    officialTemplateUrl: 'https://vnembassy-jp.org/vi/nh%C3%B3m-th%E1%BB%A7-t%E1%BB%A5c-li%C3%AAn-quan-%C4%91%E1%BA%BFn-qu%E1%BB%91c-t%E1%BB%8Bch',
    sha256Fingerprint: null,
    hasPhotoBox: false,
    status: 'DRAFT_HELPER',
  },
  form_marriage_registration: {
    id: 'form_marriage_registration',
    code: 'TK-KH',
    title: {
      vi: 'Tờ khai đăng ký kết hôn / Ghi chú kết hôn',
      en: 'Marriage Registration Form',
      ja: '婚姻届出／婚姻登録申請書',
    },
    standardBasis: 'Thông tư số 04/2020/TT-BTP ngày 28/05/2020 của Bộ Tư pháp',
    legalCode: 'TT04/2020/TT-BTP',
    issuingAuthority: 'Bộ Tư pháp Việt Nam',
    pageCount: 1,
    paperSize: 'A4',
    orientation: 'portrait',
    sourcePageUrl: 'https://vnembassy-jp.org/vi/huong-dan-lien-quan-den-ket-hon',
    officialTemplateUrl: 'https://moj.gov.vn/vbpq/lists/vn%20bn%20php%20lut/view_detail.aspx?itemid=38245',
    sha256Fingerprint: null,
    hasPhotoBox: false,
    status: 'DRAFT_HELPER',
  },
  form_power_of_attorney: {
    id: 'form_power_of_attorney',
    code: 'GUQ-BLDS',
    title: {
      vi: 'Giấy ủy quyền (bản nháp tham khảo)',
      en: 'Power of Attorney',
      ja: '委任状（参考下書き）',
    },
    standardBasis: 'Bộ luật Dân sự 2015 (đại diện, hợp đồng ủy quyền) & Nghị định 23/2015/NĐ-CP về chứng thực (đã sửa đổi, bổ sung) — bản nháp tham khảo',
    legalCode: 'BLDS2015; ND23/2015/ND-CP',
    issuingAuthority: 'Chính phủ Việt Nam',
    pageCount: 1,
    paperSize: 'A4',
    orientation: 'portrait',
    sourcePageUrl: 'https://vnembassy-jp.org/vi/huong-dan-thu-tuc-chung-thuc-giay-uy-quyen-ban-sao-hop-dong-uy-quyen-tu-choi-di-san-th%C6%B0a-ke',
    officialTemplateUrl: 'https://vanban.chinhphu.vn/?pageid=27160&docid=179100',
    sha256Fingerprint: null,
    hasPhotoBox: false,
    status: 'DRAFT_HELPER',
  },
};

/**
 * Tra cứu template theo formId
 */
export function getFormTemplate(formId) {
  if (!formId) return null;
  return (
    FORM_TEMPLATES[formId] ||
    FORM_TEMPLATES[`form_${formId}`] ||
    FORM_TEMPLATES[formId.replace(/^form_/, '')] ||
    null
  );
}

/**
 * Kiểm định tính toàn vẹn của biểu mẫu
 * @param {string} formId
 * @param {string} [actualHash] - Mã băm thực tế được tính toán từ nội dung template
 * @returns {{ isVerified: boolean, status: 'VERIFIED' | 'REVIEW_REQUIRED', reason: string }}
 */
export function verifyTemplateIntegrity(formId, actualHash = null) {
  const tpl = getFormTemplate(formId);
  if (!tpl) {
    return {
      isVerified: false,
      status: 'REVIEW_REQUIRED',
      reason: `Biểu mẫu ${formId} chưa được đăng ký trong hệ thống`,
    };
  }

  // Toolio không lưu mã băm của mẫu gốc → không thể "xác thực" bất kỳ hash nào.
  if (!tpl.sha256Fingerprint) {
    return {
      isVerified: false,
      status: 'REVIEW_REQUIRED',
      reason: 'Bản nháp của Toolio — không có mẫu gốc để đối chiếu. Hãy dùng biểu mẫu/tờ khai do cơ quan cung cấp.',
    };
  }

  if (actualHash) {
    const match = actualHash.toLowerCase() === tpl.sha256Fingerprint.toLowerCase();
    return {
      isVerified: match,
      status: match ? 'VERIFIED' : 'REVIEW_REQUIRED',
      reason: match ? 'Khớp mã băm đã đăng ký' : 'Mã băm không khớp',
    };
  }

  return {
    isVerified: false,
    status: 'REVIEW_REQUIRED',
    reason: 'Cần đối chiếu thủ công với mẫu của cơ quan',
  };
}
