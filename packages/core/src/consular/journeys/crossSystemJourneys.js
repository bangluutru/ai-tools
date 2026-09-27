/**
 * Cross-System Life Journeys (Hành trình đời sống liên hệ thống)
 * Kết nối chặt chẽ giữa thủ tục hành chính Nhật Bản và thủ tục lãnh sự Việt Nam.
 */

export const CROSS_SYSTEM_JOURNEYS = [
  {
    id: 'journey_giving_birth_in_japan',
    title: {
      vi: 'Hành trình sinh con tại Nhật Bản trọn gói',
      en: 'Complete Journey: Having a Child in Japan',
      ja: '日本での出産・育児手続き完全ロードマップ',
    },
    subtitle: 'Từ bệnh viện Nhật Bản đến Đăng ký khai sinh & Nhận trợ cấp',
    description: 'Hướng dẫn phối hợp đồng bộ từng mốc thời gian: bệnh viện Nhật → Tòa thị chính (Shiyakusho) → ĐSQ/TLSQ Việt Nam → Cục Xuất nhập cảnh Nhật → Trợ cấp nuôi con.',
    timelineSteps: [
      {
        order: 1,
        timeframe: 'Trong vòng 14 ngày sau sinh',
        actor: 'Bệnh viện & Tòa thị chính Nhật (Shiyakusho/Kuyakusho)',
        title: 'Báo sinh tại Nhật (Shussei Todoke)',
        desc: 'Nhận Giấy chứng sinh (Shussei Shomeisho) từ bác sĩ Nhật. Mang đến Shiyakusho nộp Shussei Todoke và xin ngay 02 bản "Giấy chứng nhận thụ lý báo sinh" (Shussei Todoke Juri Shomeisho).',
        jurisdiction: 'japan_local',
        relatedToolId: null,
      },
      {
        order: 2,
        timeframe: 'Sau khi có Juri Shomeisho (càng sớm càng tốt)',
        actor: 'Đại sứ quán / Tổng Lãnh sự quán Việt Nam',
        title: 'Ghi chú khai sinh tại ĐSQ/TLSQ, sau đó làm hộ chiếu VN cho bé',
        desc: 'Nộp TRỰC TIẾP: 出生届受理証明書 bản gốc + bản dịch tiếng Việt có chứng thực, giấy/trích lục kết hôn của cha mẹ, 住民票 bản gốc, bản chụp 在留カード và hộ chiếu của cha mẹ (thỏa thuận chọn quốc tịch chỉ khi cha hoặc mẹ là người nước ngoài). Kết quả: Trích lục ghi chú khai sinh. Hộ chiếu cho bé dưới 14 tuổi: tờ khai TK02a khai trực tuyến tại passport.mofa.gov.vn. Nguồn: https://vnembassy-jp.org/vi/thu-tuc-cap-giay-khai-sinh',
        jurisdiction: 'consular_vn',
        consularProcedureId: 'vn_birth_registration',
        integratedFormId: 'form_birth_registration',
      },
      {
        order: 3,
        timeframe: 'Trong vòng 30 ngày kể từ ngày sinh',
        actor: 'Cục Quản lý Xuất nhập cảnh Nhật Bản (Nyukan)',
        title: 'Xin cấp tư cách lưu trú cho bé (Zairyu Shikaku Shutoku)',
        desc: 'Mang Hộ chiếu của bé (hoặc giấy hẹn của ĐSQ), Thẻ ngoại kiều của cha mẹ, Juminhyo có tên bé đến Nyukan để xin Visa Gia đình (Kazoku Taizai) cho bé.',
        jurisdiction: 'japan_nyukan',
        relatedToolId: 'status-change-guide-jp',
      },
      {
        order: 4,
        timeframe: 'Trong vòng 15 ngày sau sinh / cùng ngày báo sinh',
        actor: 'Tòa thị chính Nhật Bản (Shiyakusho)',
        title: 'Làm thủ tục nhận Trợ cấp sinh con & Trợ cấp nuôi con',
        desc: 'Nhận Trợ cấp sinh con 500.000 yên (Shussan Ikuji Ichijikin), đăng ký bảo hiểm y tế cho bé (nhận 資格確認書, hoặc dùng マイナ保険証 khi bé đã có thẻ My Number), xin Giấy chứng nhận hỗ trợ y tế trẻ em (Maru-nyu/Maru-ko miễn phí khám chữa bệnh) và làm thủ tục nhận Trợ cấp trẻ em (Jidou Teate) hàng tháng.',
        jurisdiction: 'japan_local',
        relatedToolId: 'child-allowance-jp',
      },
    ],
  },
  {
    id: 'journey_marriage_in_japan',
    title: {
      vi: 'Hành trình kết hôn tại Nhật Bản',
      en: 'Complete Journey: Marriage Registration in Japan',
      ja: '日本での婚姻手続きロードマップ',
    },
    subtitle: 'Đăng ký kết hôn tại Nhật Bản và Ghi chú kết hôn về Việt Nam',
    description: 'Quy trình chuẩn bị hồ sơ độc thân → Đăng ký kết hôn hợp pháp tại Shiyakusho → Báo hỷ & Ghi chú vào sổ hộ tịch Việt Nam → Đổi Visa vợ chồng.',
    timelineSteps: [
      {
        order: 1,
        timeframe: 'Trước ngày dự định đăng ký 1 - 2 tháng',
        actor: 'Đại sứ quán / Tổng Lãnh sự quán Việt Nam',
        title: 'Xin Giấy chứng nhận đủ điều kiện kết hôn (Giấy độc thân)',
        desc: 'Xin Giấy xác nhận tình trạng hôn nhân tại Việt Nam (giá trị 6 tháng) và giấy xác nhận chưa thụ lý kết hôn của 市役所 (kèm bản dịch chứng thực, 住民票 bản gốc), nộp ĐSQ/TLSQ để cấp 婚姻要件具備証明書. Nguồn: https://vnembassy-jp.org/vi/huong-dan-lien-quan-den-ket-hon',
        jurisdiction: 'consular_vn',
        consularProcedureId: 'vn_marital_status_certificate',
      },
      {
        order: 2,
        timeframe: 'Ngày đăng ký kết hôn',
        actor: 'Tòa thị chính Nhật Bản (Shiyakusho/Kuyakusho)',
        title: 'Nộp đơn kết hôn (Kon-in Todoke)',
        desc: 'Nộp đơn Kon-in Todoke kèm Giấy độc thân và bản dịch tại Shiyakusho. Sau khi hoàn tất, xin Giấy chứng nhận thụ lý kết hôn (Kon-in Todoke Juri Shomeisho).',
        jurisdiction: 'japan_local',
      },
      {
        order: 3,
        timeframe: 'Sau khi kết hôn tại Nhật',
        actor: 'Đại sứ quán / Tổng Lãnh sự quán Việt Nam',
        title: 'Ghi chú việc kết hôn vào sổ hộ tịch Việt Nam',
        desc: 'Nộp Juri Shomeisho và bản dịch tiếng Việt về ĐSQ/TLSQ để nhận Trích lục ghi chú kết hôn, bảo đảm quyền lợi hôn nhân hợp pháp theo pháp luật Việt Nam.',
        jurisdiction: 'consular_vn',
        consularProcedureId: 'vn_marriage_transcription',
        integratedFormId: 'form_marriage_registration',
      },
      {
        order: 4,
        timeframe: 'Sau khi hoàn tất đăng ký kết hôn',
        actor: 'Cục Quản lý Xuất nhập cảnh Nhật Bản (Nyukan)',
        title: 'Chuyển đổi tư cách lưu trú sang Visa Vợ/Chồng',
        desc: 'Nộp hồ sơ chuyển đổi sang Visa Vợ/Chồng người Nhật (Nihonjin no Haiguusha tou) hoặc Visa Gia đình (Kazoku Taizai).',
        jurisdiction: 'japan_nyukan',
        relatedToolId: 'status-change-guide-jp',
      },
    ],
  },
];
