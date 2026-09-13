/**
 * @file packages/core/src/consular/pdf/pdfFieldMapping.js
 * @description Định nghĩa phân trang và chính sách hiển thị (fontSize, minFontSize, maxLines, overflow)
 * cho từng trường của các biểu mẫu lãnh sự chính thức.
 */

export const FIELD_OVERFLOW_POLICIES = {
  SHORT_TEXT: {
    fontSize: 10,
    minFontSize: 8,
    maxLines: 1,
    overflow: 'shrink_or_truncate',
  },
  NAME_UPPERCASE: {
    fontSize: 11,
    minFontSize: 8.5,
    maxLines: 1,
    overflow: 'shrink',
  },
  ADDRESS: {
    fontSize: 9.5,
    minFontSize: 7.5,
    maxLines: 3,
    overflow: 'wrap_and_shrink',
  },
  LONG_TEXT: {
    fontSize: 9,
    minFontSize: 7.5,
    maxLines: 4,
    overflow: 'wrap',
  },
};

/**
 * Cấu hình phân trang và layout mapping cho Biểu mẫu TK02 (Thông tư 31/2023/TT-BCA)
 */
export const TK02_PAGE_MAPPING = {
  pageCount: 2,
  pages: {
    1: {
      header: {
        republic: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM',
        motto: 'Độc lập - Tự do - Hạnh phúc',
        formCode: 'Mẫu TK02',
        standardBasis: 'Ban hành kèm theo Thông tư số 31/2023/TT-BCA ngày 20/07/2023 của Bộ Công an',
        title: 'TỜ KHAI ĐỀ NGHỊ CẤP HỘ CHIẾU PHỔ THÔNG Ở NƯỚC NGOÀI',
        subTitle: '(Dùng cho công dân Việt Nam đang ở nước ngoài)',
        recipient: 'Kính gửi: Cơ quan đại diện Việt Nam tại Nhật Bản',
      },
      fields: [
        { id: 'applicantName', label: '1. Họ và tên (chữ in hoa)', policy: FIELD_OVERFLOW_POLICIES.NAME_UPPERCASE },
        { id: 'gender', label: '2. Giới tính', policy: FIELD_OVERFLOW_POLICIES.SHORT_TEXT },
        { id: 'dob', label: '3. Ngày, tháng, năm sinh', policy: FIELD_OVERFLOW_POLICIES.SHORT_TEXT },
        { id: 'birthPlace', label: '4. Nơi sinh (tỉnh/thành phố hoặc quốc gia)', policy: FIELD_OVERFLOW_POLICIES.SHORT_TEXT },
        { id: 'idCardNumber', label: '5. Số CCCD/CMND/Định danh cá nhân', policy: FIELD_OVERFLOW_POLICIES.SHORT_TEXT },
        { id: 'idCardIssueDate', label: 'Ngày cấp CCCD', policy: FIELD_OVERFLOW_POLICIES.SHORT_TEXT },
        { id: 'idCardIssuePlace', label: 'Nơi cấp CCCD', policy: FIELD_OVERFLOW_POLICIES.SHORT_TEXT },
        { id: 'ethnic', label: '6. Dân tộc', policy: FIELD_OVERFLOW_POLICIES.SHORT_TEXT },
        { id: 'religion', label: '7. Tôn giáo', policy: FIELD_OVERFLOW_POLICIES.SHORT_TEXT },
        { id: 'permanentAddressVN', label: '8. Địa chỉ thường trú/tạm trú trước khi xuất cảnh tại Việt Nam', policy: FIELD_OVERFLOW_POLICIES.ADDRESS },
        { id: 'residenceAddressJP', label: '9. Địa chỉ cư trú hiện nay ở nước ngoài (Nhật Bản)', policy: FIELD_OVERFLOW_POLICIES.ADDRESS },
        { id: 'phoneNumber', label: '10. Số điện thoại liên hệ', policy: FIELD_OVERFLOW_POLICIES.SHORT_TEXT },
        { id: 'email', label: 'Email', policy: FIELD_OVERFLOW_POLICIES.SHORT_TEXT },
        { id: 'occupation', label: '11. Nghề nghiệp / Nơi làm việc tại Nhật Bản', policy: FIELD_OVERFLOW_POLICIES.SHORT_TEXT },
        { id: 'fatherName', label: '12. Họ và tên cha', policy: FIELD_OVERFLOW_POLICIES.SHORT_TEXT },
        { id: 'motherName', label: 'Họ và tên mẹ', policy: FIELD_OVERFLOW_POLICIES.SHORT_TEXT },
        { id: 'spouseName', label: 'Họ và tên vợ/chồng', policy: FIELD_OVERFLOW_POLICIES.SHORT_TEXT },
        { id: 'oldPassportNumber', label: '13. Hộ chiếu phổ thông cấp lần gần nhất (Số hộ chiếu)', policy: FIELD_OVERFLOW_POLICIES.SHORT_TEXT },
        { id: 'oldPassportIssueDate', label: 'Ngày cấp HC cũ', policy: FIELD_OVERFLOW_POLICIES.SHORT_TEXT },
        { id: 'oldPassportIssuePlace', label: 'Nơi cấp HC cũ', policy: FIELD_OVERFLOW_POLICIES.SHORT_TEXT },
        { id: 'requestType', label: '14. Nội dung đề nghị cấp hộ chiếu', policy: FIELD_OVERFLOW_POLICIES.SHORT_TEXT },
        { id: 'passportChipOption', label: 'Loại hộ chiếu', policy: FIELD_OVERFLOW_POLICIES.SHORT_TEXT },
      ],
    },
    2: {
      header: {
        title: 'MẪU TK02 — TRANG 2 (Ý KIẾN & XÁC NHẬN CHÍNH THỨC)',
        section15Title: '15. Ý kiến của cha, mẹ hoặc người giám hộ (nếu có)',
        section15Desc: '(Đối với người chưa đủ 14 tuổi, người mất năng lực hành vi dân sự, người có khó khăn trong nhận thức, làm chủ hành vi)',
        commitmentText: 'Tôi xin cam đoan những lời khai trên là đúng sự thật và hoàn toàn chịu trách nhiệm trước pháp luật về những nội dung đã khai.',
        applicantSignatureTitle: 'NGƯỜI ĐỀ NGHỊ',
        applicantSignatureSub: '(Ký, ghi rõ họ và tên)',
        officialVerificationTitle: 'XÁC NHẬN CỦA CƠ QUAN ĐẠI DIỆN VIỆT NAM TẠI NHẬT BẢN',
        officialVerificationSub: '(Kiểm tra, đối chiếu hồ sơ gốc và ký duyệt theo thẩm quyền)',
      },
    },
  },
};

/**
 * Xử lý dữ liệu dài (Long text policy)
 * Đảm bảo văn bản không bị vỡ bố cục, giảm cỡ chữ hoặc cắt gọn an toàn
 */
export function formatFieldValue(value, policy = FIELD_OVERFLOW_POLICIES.SHORT_TEXT) {
  if (!value) return '';
  const str = String(value).trim();
  if (policy.overflow === 'shrink') {
    return str;
  }
  if (str.length > 120 && policy.maxLines === 1) {
    return str.slice(0, 117) + '...';
  }
  return str;
}
