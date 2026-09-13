/**
 * Biểu mẫu Tờ khai đăng ký kết hôn / Tờ khai ghi chú kết hôn
 * Ban hành kèm theo Thông tư số 04/2020/TT-BTP ngày 28/05/2020 của Bộ Tư pháp.
 * 
 * Áp dụng cho:
 * 1. Đăng ký kết hôn giữa hai công dân Việt Nam tại Cơ quan đại diện Việt Nam tại Nhật Bản
 * 2. Ghi chú việc kết hôn đã đăng ký tại cơ quan hộ tịch Nhật Bản (Kuyakusho/Shiyakusho)
 */

export const marriageRegistrationForm = {
  id: 'form_marriage_registration',
  code: 'TK-KH',
  title: {
    vi: 'Tờ khai đăng ký kết hôn / Ghi chú kết hôn',
    en: 'Marriage Registration / Transcription Form',
    ja: '婚姻届出／婚姻登録申請書',
  },
  standardBasis: 'Thông tư số 04/2020/TT-BTP ngày 28/05/2020 của Bộ Tư pháp',
  sha256Fingerprint: '9a31bc76e3d24218a5146d90e29b12854cf048ba97e452140a3e0f9b6c4398e2',
  status: 'VERIFIED',
  sourceUrl: 'https://vnembassy-jp.org/vi/thu-tuc-dang-ky-ket-hon-tai-dai-su-quan',
  applicableOffices: ['tokyo_embassy', 'osaka_consulate', 'fukuoka_consulate'],
  printOrientation: 'portrait',
  paperSize: 'A4',

  fields: [
    {
      id: 'procedureCategory',
      label: 'Loại thủ tục hôn nhân',
      type: 'select',
      options: [
        { value: 'ghi_chu_ket_hon', label: 'Ghi chú kết hôn (đã làm thủ tục tại Shiyakusho/Kuyakusho Nhật)' },
        { value: 'dang_ky_ket_hon_tai_dsq', label: 'Đăng ký kết hôn trực tiếp tại Cơ quan đại diện VN (cả 2 mang quốc tịch VN)' },
      ],
      required: true,
      defaultValue: 'ghi_chu_ket_hon',
    },
    // Thông tin bên nam
    {
      id: 'maleFullName',
      label: 'Họ và tên bên Nam (chữ in hoa)',
      type: 'text',
      placeholder: 'NGUYỄN VĂN A',
      required: true,
      transform: (val) => val?.toUpperCase() || '',
    },
    {
      id: 'maleDob',
      label: 'Ngày, tháng, năm sinh bên Nam',
      type: 'date',
      required: true,
    },
    {
      id: 'maleNationality',
      label: 'Quốc tịch bên Nam',
      type: 'text',
      defaultValue: 'Việt Nam',
      required: true,
    },
    {
      id: 'maleEthnic',
      label: 'Dân tộc bên Nam',
      type: 'text',
      defaultValue: 'Kinh',
      required: true,
    },
    {
      id: 'malePassportOrId',
      label: 'Hộ chiếu / CCCD bên Nam (Số, ngày cấp, nơi cấp)',
      type: 'text',
      placeholder: 'Hộ chiếu C1234567 cấp ngày 01/01/2024 tại Cục QLXNC',
      required: true,
    },
    {
      id: 'maleResidenceJP',
      label: 'Nơi cư trú hiện tại tại Nhật Bản bên Nam',
      type: 'text',
      placeholder: 'Tokyo-to, Shinjuku-ku...',
      required: true,
    },
    {
      id: 'maleMaritalStatus',
      label: 'Tình trạng hôn nhân bên Nam trước khi kết hôn',
      type: 'select',
      options: [
        { value: 'chua_tung_ket_hon', label: 'Chưa từng kết hôn lần nào' },
        { value: 'da_ly_hon', label: 'Đã ly hôn (bản án/quyết định đã có hiệu lực)' },
        { value: 'vo_da_mat', label: 'Vợ đã mất' },
      ],
      required: true,
      defaultValue: 'chua_tung_ket_hon',
    },
    // Thông tin bên nữ
    {
      id: 'femaleFullName',
      label: 'Họ và tên bên Nữ (chữ in hoa)',
      type: 'text',
      placeholder: 'TRẦN THỊ B',
      required: true,
      transform: (val) => val?.toUpperCase() || '',
    },
    {
      id: 'femaleDob',
      label: 'Ngày, tháng, năm sinh bên Nữ',
      type: 'date',
      required: true,
    },
    {
      id: 'femaleNationality',
      label: 'Quốc tịch bên Nữ',
      type: 'text',
      defaultValue: 'Việt Nam',
      required: true,
    },
    {
      id: 'femaleEthnic',
      label: 'Dân tộc bên Nữ',
      type: 'text',
      defaultValue: 'Kinh',
      required: true,
    },
    {
      id: 'femalePassportOrId',
      label: 'Hộ chiếu / CCCD bên Nữ (Số, ngày cấp, nơi cấp)',
      type: 'text',
      placeholder: 'Hộ chiếu C7654321 cấp ngày 01/05/2023 tại Cục QLXNC',
      required: true,
    },
    {
      id: 'femaleResidenceJP',
      label: 'Nơi cư trú hiện tại tại Nhật Bản bên Nữ',
      type: 'text',
      placeholder: 'Tokyo-to, Toshima-ku...',
      required: true,
    },
    {
      id: 'femaleMaritalStatus',
      label: 'Tình trạng hôn nhân bên Nữ trước khi kết hôn',
      type: 'select',
      options: [
        { value: 'chua_tung_ket_hon', label: 'Chưa từng kết hôn lần nào' },
        { value: 'da_ly_hon', label: 'Đã ly hôn' },
        { value: 'chong_da_mat', label: 'Chồng đã mất' },
      ],
      required: true,
      defaultValue: 'chua_tung_ket_hon',
    },
    // Thông tin kết hôn tại Nhật nếu là ghi chú kết hôn
    {
      id: 'japanMarriageDate',
      label: 'Ngày đã đăng ký kết hôn tại Nhật Bản (nếu ghi chú kết hôn)',
      type: 'date',
      required: false,
    },
    {
      id: 'japanAuthority',
      label: 'Cơ quan hộ tịch Nhật Bản đã tiếp nhận (Shiyakusho / Kuyakusho)',
      type: 'text',
      placeholder: 'Kuyakusho quận Shinjuku, Tokyo (東京都新宿区役所)',
      required: false,
    },
  ],

  initialValues: {
    procedureCategory: 'ghi_chu_ket_hon',
    maleFullName: '',
    maleDob: '',
    maleNationality: 'Việt Nam',
    maleEthnic: 'Kinh',
    malePassportOrId: '',
    maleResidenceJP: '',
    maleMaritalStatus: 'chua_tung_ket_hon',
    femaleFullName: '',
    femaleDob: '',
    femaleNationality: 'Việt Nam',
    femaleEthnic: 'Kinh',
    femalePassportOrId: '',
    femaleResidenceJP: '',
    femaleMaritalStatus: 'chua_tung_ket_hon',
    japanMarriageDate: '',
    japanAuthority: '',
  },
};
