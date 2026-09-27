/**
 * BẢN NHÁP tham khảo theo bố cục Tờ khai cấp hộ chiếu phổ thông ở nước ngoài (Mẫu TK02, người từ 14 tuổi;
 * người dưới 14 tuổi dùng TK02a). Biểu mẫu: TT 31/2023/TT-BCA, sửa đổi bởi TT 69/2026/TT-BCA (hiệu lực 01/7/2026) —
 * https://congbao.chinhphu.vn/van-ban/thong-tu-so-69-2026-tt-bca-469711/65703.htm
 * ĐSQ/TLSQ yêu cầu khai tờ khai trực tuyến tại https://passport.mofa.gov.vn/ rồi in, ký — bản này KHÔNG dùng để nộp.
 * 
 * Lưu ý: Tờ khai sử dụng cho công dân Việt Nam đang cư trú tại nước ngoài (Nhật Bản)
 * đề nghị cấp mới, cấp lại hộ chiếu phổ thông khi hết hạn, bị mất, hỏng hoặc tách hộ chiếu.
 */

export const passportTK02Form = {
  id: 'form_passport_tk02',
  code: 'TK02',
  title: {
    vi: 'Tờ khai đề nghị cấp hộ chiếu phổ thông (Mẫu TK02)',
    en: 'Passport Application Form (Form TK02)',
    ja: '一般旅券発給申請書（様式TK02）',
  },
  standardBasis: 'Thông tư 31/2023/TT-BCA (sửa đổi, bổ sung bởi TT 68/2025/TT-BCA và TT 69/2026/TT-BCA, hiệu lực 01/7/2026) — bản nháp tham khảo, tờ khai nộp phải khai trực tuyến tại passport.mofa.gov.vn',
  isDraftHelper: true,
  status: 'DRAFT_HELPER',
  sourceUrl: 'https://vnembassy-jp.org/vi/th%E1%BB%A7-t%E1%BB%A5c-li%C3%AAn-quan-%C4%91%E1%BA%BFn-h%E1%BB%99-chi%E1%BA%BFu',
  applicableOffices: ['tokyo_embassy', 'osaka_consulate', 'fukuoka_consulate'],
  printOrientation: 'portrait',
  paperSize: 'A4',

  // Cấu trúc các trường dữ liệu
  fields: [
    {
      id: 'applicantName',
      label: 'Họ và tên (chữ in hoa)',
      type: 'text',
      placeholder: 'NGUYỄN VĂN A',
      required: true,
      transform: (val) => val?.toUpperCase() || '',
      validationRegex: '^([A-ZÀ-Ỵ\\s]+)$',
      validationMessage: 'Vui lòng nhập họ tên in hoa không dấu hoặc có dấu tiếng Việt',
    },
    {
      id: 'gender',
      label: 'Giới tính',
      type: 'select',
      options: [
        { value: 'Nam', label: 'Nam' },
        { value: 'Nữ', label: 'Nữ' },
      ],
      required: true,
    },
    {
      id: 'dob',
      label: 'Ngày, tháng, năm sinh',
      type: 'date',
      required: true,
    },
    {
      id: 'birthPlace',
      label: 'Nơi sinh (tỉnh, thành phố hoặc quốc gia)',
      type: 'text',
      placeholder: 'Hà Nội, Việt Nam hoặc Tokyo, Nhật Bản',
      required: true,
    },
    {
      id: 'idCardNumber',
      label: 'Số CCCD / Căn cước / Số định danh cá nhân',
      type: 'text',
      placeholder: '12 chữ số định danh cá nhân',
      required: false,
    },
    {
      id: 'idCardIssueDate',
      label: 'Ngày cấp CCCD / Căn cước',
      type: 'date',
      required: false,
    },
    {
      id: 'idCardIssuePlace',
      label: 'Nơi cấp CCCD / Căn cước',
      type: 'text',
      placeholder: 'Cục Cảnh sát QLHC về TTXH',
      required: false,
    },
    {
      id: 'ethnic',
      label: 'Dân tộc',
      type: 'text',
      defaultValue: 'Kinh',
      required: true,
    },
    {
      id: 'religion',
      label: 'Tôn giáo',
      type: 'text',
      defaultValue: 'Không',
      required: true,
    },
    {
      id: 'permanentAddressVN',
      label: 'Địa chỉ thường trú hoặc tạm trú trước khi xuất cảnh tại Việt Nam',
      type: 'text',
      placeholder: 'Số nhà, đường, xã/phường, tỉnh/thành phố (chính quyền 2 cấp từ 01/7/2025)',
      required: false,
    },
    {
      id: 'residenceAddressJP',
      label: 'Địa chỉ cư trú tại Nhật Bản (Kèm Romaji hoặc Kanji)',
      type: 'textarea',
      placeholder: '〒160-0022 Tokyo-to, Shinjuku-ku, Shinjuku 1-2-3...',
      required: true,
    },
    {
      id: 'phoneNumber',
      label: 'Số điện thoại liên hệ tại Nhật Bản',
      type: 'tel',
      placeholder: '080-1234-5678',
      required: true,
    },
    {
      id: 'email',
      label: 'Địa chỉ Email nhận thông báo',
      type: 'email',
      placeholder: 'example@gmail.com',
      required: true,
    },
    {
      id: 'occupation',
      label: 'Nghề nghiệp / Nơi làm việc tại Nhật Bản',
      type: 'text',
      placeholder: 'Kỹ sư CNTT / Công ty ABC KK',
      required: false,
    },
    {
      id: 'fatherName',
      label: 'Họ và tên cha',
      type: 'text',
      placeholder: 'NGUYỄN VĂN B (Năm sinh: 1965)',
      required: false,
    },
    {
      id: 'motherName',
      label: 'Họ và tên mẹ',
      type: 'text',
      placeholder: 'TRẦN THỊ C (Năm sinh: 1968)',
      required: false,
    },
    {
      id: 'spouseName',
      label: 'Họ và tên vợ/chồng (nếu có)',
      type: 'text',
      placeholder: 'LÊ THỊ D (Năm sinh: 1995)',
      required: false,
    },
    {
      id: 'oldPassportNumber',
      label: 'Hộ chiếu phổ thông cấp lần gần nhất (Số hộ chiếu)',
      type: 'text',
      placeholder: 'B1234567 hoặc C1234567 (Bỏ trống nếu cấp lần đầu)',
      required: false,
    },
    {
      id: 'oldPassportIssueDate',
      label: 'Ngày cấp hộ chiếu cũ',
      type: 'date',
      required: false,
    },
    {
      id: 'oldPassportIssuePlace',
      label: 'Cơ quan cấp hộ chiếu cũ',
      type: 'text',
      placeholder: 'Cục Quản lý xuất nhập cảnh hoặc ĐSQ VN tại Nhật Bản',
      required: false,
    },
    {
      id: 'requestType',
      label: 'Nội dung đề nghị cấp hộ chiếu',
      type: 'select',
      options: [
        { value: 'cap_lai_sap_het_han', label: 'Cấp lại do hộ chiếu sắp hết hạn / đã hết hạn' },
        { value: 'cap_lai_do_mat', label: 'Cấp lại do bị mất hộ chiếu' },
        { value: 'cap_lai_do_hong', label: 'Cấp lại do hộ chiếu bị hỏng / rách / ướt' },
        { value: 'cap_lan_dau', label: 'Cấp hộ chiếu lần đầu' },
        { value: 'cap_thay_doi_thong_tin', label: 'Cấp lại do thay đổi thông tin nhân thân (họ tên, CCCD)' },
      ],
      required: true,
      defaultValue: 'cap_lai_sap_het_han',
    },
    {
      id: 'passportChipOption',
      label: 'Loại hộ chiếu đề nghị cấp',
      type: 'select',
      options: [
        { value: 'co_gan_chip', label: 'Cấp hộ chiếu có gắn chíp điện tử' },
        { value: 'khong_gan_chip', label: 'Cấp hộ chiếu không gắn chíp điện tử' },
      ],
      required: true,
      defaultValue: 'co_gan_chip',
    },
  ],

  // Dữ liệu mẫu khởi tạo
  initialValues: {
    applicantName: '',
    gender: 'Nam',
    dob: '',
    birthPlace: '',
    idCardNumber: '',
    idCardIssueDate: '',
    idCardIssuePlace: '',
    ethnic: 'Kinh',
    religion: 'Không',
    permanentAddressVN: '',
    residenceAddressJP: '',
    phoneNumber: '',
    email: '',
    occupation: '',
    fatherName: '',
    motherName: '',
    spouseName: '',
    oldPassportNumber: '',
    oldPassportIssueDate: '',
    oldPassportIssuePlace: '',
    requestType: 'cap_lai_sap_het_han',
    passportChipOption: 'co_gan_chip',
  },
};
