/**
 * @file packages/core/src/japan/immigration/arrival/arrivalRules.js
 * @description
 * Quy tắc và danh mục đầu việc cho Sự kiện Đời sống: Đến Nhật & Bắt đầu Cư trú (来日後セットアップガイド).
 * Xây dựng trên Nền tảng Sự Kiện Đời Sống (Life Event Foundation).
 * 
 * Các căn cứ pháp lý:
 * - Luật Quản lý Xuất nhập cảnh và Công nhận Tị nạn (Điều 19-7, 19-9, 19-16, 19-2)
 * - Luật Đăng ký Cư trú Cơ bản (住民基本台帳法 Điều 22, 30-45)
 * - Luật Mã số Cá nhân (マイナンバー法)
 * - Luật Bảo hiểm Y tế Quốc dân & Luật Lương hưu Quốc dân
 * - Luật Ngoại hối và Ngoại thương (FEFTA - Quy chế phi cư dân 6 tháng)
 */

import { defineRuleMetadata } from '../../../regulatory/ruleMetadata.js';
import { JAPAN_JURISDICTION } from '../../../regulatory/jurisdiction.js';

export const ARRIVAL_LIFE_EVENT_ID = 'arriving-in-japan';

export const ARRIVAL_STAGES = Object.freeze([
  {
    id: 'stage_airport',
    stageId: 'stage_airport',
    order: 1,
    titleJa: '空港到着・入国審査',
    titleVi: 'Tại Sân Bay & Nhập Cảnh',
    titleEn: 'Airport Landing & Entry Inspection',
    icon: 'PlaneLanding',
  },
  {
    id: 'stage_municipal',
    stageId: 'stage_municipal',
    order: 2,
    titleJa: '市区町村窓口・住民登録（14日以内）',
    titleVi: 'Tòa Thị Chính & Đăng Ký Địa Chỉ (Trong 14 ngày)',
    titleEn: 'Municipal Registration (Within 14 Days)',
    icon: 'Building2',
  },
  {
    id: 'stage_essentials',
    stageId: 'stage_essentials',
    order: 3,
    titleJa: '生活インフラ立ち上げ（口座・通信・印鑑）',
    titleVi: 'Tiện Ích Đời Sống (Ngân Hàng, SIM, Con Dấu)',
    titleEn: 'Life Essentials Setup (Bank, Mobile, Seal)',
    icon: 'Smartphone',
  },
  {
    id: 'stage_onboarding',
    stageId: 'stage_onboarding',
    order: 4,
    titleJa: '勤務先・学校への提出・税務手続き',
    titleVi: 'Thủ Tục Tại Nơi Làm Việc / Trường Học & Thuế',
    titleEn: 'Employment/Academic Onboarding & Tax',
    icon: 'Briefcase',
  },
]);

export const ARRIVAL_TASKS_CATALOG = Object.freeze([
  {
    id: 'task_residence_card',
    stageId: 'stage_airport',
    stage: 'stage_airport',
    requirement: 'required',
    titleJa: '在留カード受領・記載事項確認',
    titleVi: 'Nhận Thẻ Cư Trú & Kiểm Tra Thông Tin',
    titleEn: 'Receive Residence Card & Verify Details',
    descJa: '成田・羽田・中部・関西・新千歳・広島・福岡空港等で中長期在留者に即日交付。ローマ字氏名、生年月日、在留資格、就労制限の有無をその場で確認。',
    descVi: 'Cấp ngay tại sân bay quốc tế. Kiểm tra kỹ họ tên romaji, ngày sinh, tư cách lưu trú và hạn chế lao động ngay tại quầy nhập cảnh.',
    descEn: 'Issued on the spot at major airports. Immediately verify Romanized name, date of birth, status of residence, and work restriction notation.',
    authorityJa: '出入国在留管理庁（空港入国審査場）',
    authorityVi: 'Cục Quản Lý Xuất Nhập Cảnh (Sân bay)',
    authorityEn: 'Immigration Services Agency (Airport Port of Entry)',
    sourceId: 'isa-ica-annexed-table-1',
    metadata: defineRuleMetadata({
      id: 'jp-imm-arrival-residence-card',
      jurisdiction: JAPAN_JURISDICTION,
      sourceId: 'isa-ica-annexed-table-1',
      effectiveFrom: '2012-07-09',
      applicablePeriod: { type: 'calendar-year', from: 2012, to: 2099 },
      version: '2026.1',
      lastVerifiedAt: '2026-09-11',
      status: 'verified',
      ruleNature: 'deterministic',
      notes: 'Nhận thẻ cư trú tại quầy nhập cảnh sân bay quốc tế Nhật Bản.'
    })
  },
  {
    id: 'task_part_time_permit',
    stageId: 'stage_airport',
    stage: 'stage_airport',
    requirement: 'conditional',
    conditionKey: 'needsPartTimeWork',
    titleJa: '資格外活動許可申請（空港窓口受取）',
    titleVi: 'Đăng Ký Phép Hoạt Động Ngoài Tư Cách (Tại Quầy Sân Bay)',
    titleEn: 'Permission to Engage in Activity other than that Permitted (Airport Desk)',
    descJa: '「留学」または新規入国の「家族滞在」等でアルバイトを希望する場合、空港の入国審査時に申請書を提出すればその場で裏面に許可印を受領可能（原則週28時間以内、風俗営業等厳禁）。',
    descVi: 'Du học sinh hoặc visa Gia đình muốn đi làm thêm có thể nộp đơn ngay tại quầy xuất nhập cảnh sân bay để được đóng dấu cho phép làm thêm tối đa 28h/tuần (nghiêm cấm ngành nghề phong tục/giải trí người lớn).',
    descEn: 'Students and eligible dependents planning part-time work can apply at the airport counter upon arrival to receive the permission stamp on the back of the residence card (max 28 hours/week, adult entertainment prohibited).',
    authorityJa: '空港入国審査場',
    authorityVi: 'Quầy Nhập Cảnh Sân Bay',
    authorityEn: 'Airport Immigration Inspection Desk',
    sourceId: 'isa-extra-activity-perm',
    relatedCapabilityId: 'immigration.workScope.check',
    deepLink: {
      toolId: 'work-scope-checker-jp',
      labelJa: '就労範囲チェッカーを開く',
      labelVi: 'Kiểm tra phạm vi làm việc của visa',
      labelEn: 'Open Work Scope Checker'
    },
    metadata: defineRuleMetadata({
      id: 'jp-imm-arrival-part-time-permit',
      jurisdiction: JAPAN_JURISDICTION,
      sourceId: 'isa-extra-activity-perm',
      effectiveFrom: '2012-07-09',
      applicablePeriod: { type: 'calendar-year', from: 2012, to: 2099 },
      version: '2026.1',
      lastVerifiedAt: '2026-09-11',
      status: 'verified',
      ruleNature: 'deterministic',
      notes: 'Đăng ký giấy phép hoạt động ngoài tư cách 28h/tuần tại sân bay.'
    })
  },
  {
    id: 'task_resident_registration',
    stageId: 'stage_municipal',
    stage: 'stage_municipal',
    requirement: 'required',
    titleJa: '住居地届出・転入届の提出（14日以内必須）',
    titleVi: 'Đăng Ký Địa Chỉ Cư Trú (Bắt Buộc Trong 14 Ngày)',
    titleEn: 'Resident Registration / Address Notification (Strict 14 Days)',
    descJa: '住居地を定めた日から14日以内に、市区町村役場窓口にて転入届を提出し、在留カード裏面に住所を記載（入管法第19条の7・19条の9、住民基本台帳法第22条）。正当な理由なく届出を怠ると在留資格取消または過料の対象。',
    descVi: 'Trong vòng 14 ngày kể từ khi xác định chỗ ở, bắt buộc phải đến Tòa thị chính (quận/huyện) để nộp đơn chuyển đến (転入届) và in địa chỉ lên mặt sau Thẻ Cư Trú. Không đăng ký đúng hạn có thể bị phạt tiền hoặc bị thu hồi tư cách lưu trú.',
    descEn: 'Mandatory under Immigration Act Art. 19-7/19-9 and Resident Basic Book Act: file moving-in notice (Tennyu-todoke) at your local municipal office within 14 days of moving in to have your address printed on the back of the residence card.',
    authorityJa: '居住地の市区町村役場（市民課・住民戸籍課）',
    authorityVi: 'Tòa thị chính quận/huyện (Phòng Hộ tịch/Cư dân)',
    authorityEn: 'Local Municipal City/Ward Office (Resident Division)',
    sourceId: 'soumu-resident-basic-book-act',
    deadlineRule: {
      anchorKey: 'entryDate',
      offsetDays: 14,
      direction: 'after',
      description: {
        ja: '入国・住居地決定から14日以内',
        vi: 'Trong vòng 14 ngày kể từ ngày nhập cảnh / vào nhà mới',
        en: 'Within 14 days of entry / fixing residence'
      }
    },
    metadata: defineRuleMetadata({
      id: 'jp-imm-arrival-resident-registration',
      jurisdiction: JAPAN_JURISDICTION,
      sourceId: 'soumu-resident-basic-book-act',
      effectiveFrom: '2012-07-09',
      applicablePeriod: { type: 'calendar-year', from: 2012, to: 2099 },
      version: '2026.1',
      lastVerifiedAt: '2026-09-11',
      status: 'verified',
      ruleNature: 'deterministic',
      notes: 'Đăng ký địa chỉ cư trú bắt buộc trong vòng 14 ngày.'
    })
  },
  {
    id: 'task_mynumber_card',
    stageId: 'stage_municipal',
    stage: 'stage_municipal',
    requirement: 'recommended',
    titleJa: 'マイナンバー通知の受領・個人番号カード交付申請',
    titleVi: 'Nhận Mã Số My Number & Đăng Ký Thẻ My Number',
    titleEn: 'Receive My Number Notice & Apply for My Number Card',
    descJa: '住民登録完了後、2〜3週間で「個人番号通知書」が簡易書留で郵送されます。スマートフォンや郵送でマイナンバーカードを申請し、e-Taxや各種公的手続き、オンライン入管申請に備えます。',
    descVi: 'Sau khi đăng ký cư trú, Thư thông báo mã số cá nhân (個人番号通知書) sẽ được gửi qua bưu điện. Bạn nên đăng ký làm Thẻ Căn cước My Number để dùng e-Tax, thủ tục hành chính tại combini và nộp hồ sơ xuất nhập cảnh online.',
    descEn: 'After resident registration, a Personal Number Notice is mailed to you. Apply for the My Number Card to enable e-Tax, convenience store certificate printing, and online immigration filing.',
    authorityJa: '地方公共団体情報システム機構 (J-LIS) / 市区町村窓口',
    authorityVi: 'Cơ quan Hệ thống Thông tin Chính quyền Địa phương (J-LIS) / Tòa thị chính',
    authorityEn: 'J-LIS / Municipal Office',
    sourceId: 'cao-mynumber-system',
    metadata: defineRuleMetadata({
      id: 'jp-imm-arrival-mynumber-card',
      jurisdiction: JAPAN_JURISDICTION,
      sourceId: 'cao-mynumber-system',
      effectiveFrom: '2015-10-05',
      applicablePeriod: { type: 'calendar-year', from: 2015, to: 2099 },
      version: '2026.1',
      lastVerifiedAt: '2026-09-11',
      status: 'verified',
      ruleNature: 'guidance',
      notes: 'Đăng ký Thẻ Căn cước My Number phục vụ thủ tục hành chính.'
    })
  },
  {
    id: 'task_kokumin_kenpo',
    stageId: 'stage_municipal',
    stage: 'stage_municipal',
    requirement: 'conditional',
    conditionKey: 'needsNationalInsurance',
    titleJa: '国民健康保険への加入手続き',
    titleVi: 'Tham Gia Bảo Hiểm Y Tế Quốc Dân (Kokumin Kenpo)',
    titleEn: 'National Health Insurance Enrollment',
    descJa: '職場の社会保険（健康保険組合・協会けんぽ）に加入しない方（留学生、個人事業主、一部の扶養者等）は、市区町村窓口で国民健康保険への加入が法律上義務付けられています。自己負担割合は原則3割。',
    descVi: 'Những ai không tham gia bảo hiểm công ty (du học sinh, người làm tự do, diện phụ thuộc chưa đăng ký công ty) bắt buộc phải đăng ký Bảo hiểm Y tế Quốc dân tại Tòa thị chính. Mức chi trả viện phí khi khám bệnh là 30%.',
    descEn: 'Those not covered by employer health insurance (students, freelancers, dependents) are legally obligated to enroll in National Health Insurance at the city office. Medical copayment is generally 30%.',
    authorityJa: '市区町村役場 国民健康保険課',
    authorityVi: 'Phòng BHYT Quốc dân - Tòa thị chính',
    authorityEn: 'National Health Insurance Division, Municipal Office',
    sourceId: 'mhlw-kokumin-kenpo-guide',
    deadlineRule: {
      anchorKey: 'entryDate',
      offsetDays: 14,
      direction: 'after',
      description: {
        ja: '転入届提出と同時に手続き（14日以内）',
        vi: 'Thực hiện đồng thời với đăng ký địa chỉ (trong 14 ngày)',
        en: 'Process simultaneously with moving-in notice (within 14 days)'
      }
    },
    relatedCapabilityId: 'insurance.socialInsurance.calculate',
    deepLink: {
      toolId: 'social-insurance-jp',
      labelJa: '社会保険料シミュレーターを開く',
      labelVi: 'Mô phỏng tiền bảo hiểm',
      labelEn: 'Open Insurance Simulator'
    },
    metadata: defineRuleMetadata({
      id: 'jp-imm-arrival-kokumin-kenpo',
      jurisdiction: JAPAN_JURISDICTION,
      sourceId: 'mhlw-kokumin-kenpo-guide',
      effectiveFrom: '1958-12-27',
      applicablePeriod: { type: 'calendar-year', from: 1958, to: 2099 },
      version: '2026.1',
      lastVerifiedAt: '2026-09-11',
      status: 'verified',
      ruleNature: 'deterministic',
      notes: 'Tham gia BHYT Quốc dân bắt buộc cho người không có Shakai Hoken công ty.'
    })
  },
  {
    id: 'task_kokumin_nenkin',
    stageId: 'stage_municipal',
    stage: 'stage_municipal',
    requirement: 'conditional',
    conditionKey: 'needsNationalPension',
    titleJa: '国民年金への加入・学生納付特例申請',
    titleVi: 'Tham Gia Lương Hưu Quốc Dân & Xin Miễn Giảm Cho Sinh Viên',
    titleEn: 'National Pension Enrollment & Student Special Exemption',
    descJa: '日本国内に居住する20歳以上60歳未満のすべての人（外国人含む）に国民年金加入義務があります。学生で収入が基準以下の場合、「学生納付特例制度」を同時に申請することで納付猶予を受けられます。',
    descVi: 'Mọi người từ 20 đến 59 tuổi cư trú tại Nhật đều bắt buộc tham gia Lương hưu Quốc dân (Kokumin Nenkin). Sinh viên có thu nhập thấp có thể nộp đơn xin Chế độ đặc lệ hoãn nộp tiền hưu cho sinh viên (学生納付特例).',
    descEn: 'All residents aged 20-59 in Japan are required to join the National Pension. Students with low income can apply simultaneously for the Student Special Exemption (Gakusei Nofu Tokurei).',
    authorityJa: '市区町村役場 国民年金課 / 年金事務所',
    authorityVi: 'Phòng Lương hưu Quốc dân - Tòa thị chính / Văn phòng Nenkin',
    authorityEn: 'National Pension Division, Municipal Office / Pension Office',
    sourceId: 'nenkin-kokumin-nenkin-overview',
    deadlineRule: {
      anchorKey: 'entryDate',
      offsetDays: 14,
      direction: 'after',
      description: {
        ja: '転入届提出と同時に手続き（14日以内）',
        vi: 'Thực hiện đồng thời với đăng ký địa chỉ (trong 14 ngày)',
        en: 'Process simultaneously with moving-in notice (within 14 days)'
      }
    },
    relatedCapabilityId: 'insurance.pension.national',
    deepLink: {
      toolId: 'national-pension-jp',
      labelJa: '国民年金ガイドを開く',
      labelVi: 'Xem hướng dẫn lương hưu quốc dân',
      labelEn: 'Open National Pension Guide'
    },
    metadata: defineRuleMetadata({
      id: 'jp-imm-arrival-kokumin-nenkin',
      jurisdiction: JAPAN_JURISDICTION,
      sourceId: 'nenkin-kokumin-nenkin-overview',
      effectiveFrom: '1959-04-16',
      applicablePeriod: { type: 'calendar-year', from: 1959, to: 2099 },
      version: '2026.1',
      lastVerifiedAt: '2026-09-11',
      status: 'verified',
      ruleNature: 'deterministic',
      notes: 'Tham gia Lương hưu Quốc dân bắt buộc từ 20-59 tuổi và nộp đơn miễn giảm sinh viên.'
    })
  },
  {
    id: 'task_bank_account',
    stageId: 'stage_essentials',
    stage: 'stage_essentials',
    requirement: 'required',
    titleJa: '銀行口座の開設（ゆうちょ銀行・ネット銀行等）',
    titleVi: 'Mở Tài Khoản Ngân Hàng (Yucho Bank, Ngân hàng số)',
    titleEn: 'Bank Account Opening (Japan Post Bank / Digital Banks)',
    descJa: '給与受取や家賃・光熱費引落口座を開設。外為法上、来日6ヶ月未満の外国人は「非居住者」扱いとなるため、大手都銀では制限がある場合があります。ゆうちょ銀行（0ヶ月から開設可能）や外国人対応ネット銀行が推奨されます。',
    descVi: 'Mở tài khoản để nhận lương và trích nợ tiền nhà, điện nước sinh hoạt. Theo Luật Ngoại hối, người mới sang dưới 6 tháng là phi cư dân nên các ngân hàng lớn có thể hạn chế. Ngân hàng Bưu điện Yucho hoặc các ngân hàng số thân thiện với người nước ngoài được khuyến nghị.',
    descEn: 'Open an account for salary and utilities. Foreigners in Japan for under 6 months are non-residents under FEFTA; Japan Post Bank (Yucho) and foreigner-friendly digital banks (Sony, Shinsei) are commonly used.',
    authorityJa: '各金融機関窓口 / オンラインアプリ',
    authorityVi: 'Quầy giao dịch ngân hàng / Ứng dụng online',
    authorityEn: 'Financial Institutions Branches / Apps',
    sourceId: 'isa-ica-annexed-table-1',
    metadata: defineRuleMetadata({
      id: 'jp-imm-arrival-bank-account',
      jurisdiction: JAPAN_JURISDICTION,
      sourceId: 'isa-ica-annexed-table-1',
      effectiveFrom: '2012-07-09',
      applicablePeriod: { type: 'calendar-year', from: 2012, to: 2099 },
      version: '2026.1',
      lastVerifiedAt: '2026-09-11',
      status: 'verified',
      ruleNature: 'guidance',
      notes: 'Mở tài khoản ngân hàng thanh toán đời sống cho người mới sang.'
    })
  },
  {
    id: 'task_mobile_phone',
    stageId: 'stage_essentials',
    stage: 'stage_essentials',
    requirement: 'required',
    titleJa: 'スマートフォン・音声通話SIMの契約',
    titleVi: 'Đăng Ký Thuê Bao Di Động & SIM Thoại',
    titleEn: 'Mobile Phone & Voice SIM Contract',
    descJa: '役所や銀行、就職先への連絡先として日本の電話番号（070/080/090）が必須。在留カード（裏面住所記載済）およびクレジットカードまたは銀行口座（一部デビット可）を提示して契約。',
    descVi: 'Số điện thoại di động tại Nhật là bắt buộc để ghi vào các mẫu đơn hành chính, ngân hàng và công ty. Cần xuất trình thẻ cư trú đã in địa chỉ và thẻ thanh toán/thông tin tài khoản ngân hàng.',
    descEn: 'A domestic Japanese phone number (070/080/090) is required for official forms, banking, and employers. Requires residence card with registered address and payment method.',
    authorityJa: '各通信事業者（大手キャリア・格安SIM）',
    authorityVi: 'Nhà mạng viễn thông (Docomo, au, Softbank, MVNO)',
    authorityEn: 'Telecommunications Carriers / MVNOs',
    sourceId: 'isa-ica-annexed-table-1',
    metadata: defineRuleMetadata({
      id: 'jp-imm-arrival-mobile-phone',
      jurisdiction: JAPAN_JURISDICTION,
      sourceId: 'isa-ica-annexed-table-1',
      effectiveFrom: '2012-07-09',
      applicablePeriod: { type: 'calendar-year', from: 2012, to: 2099 },
      version: '2026.1',
      lastVerifiedAt: '2026-09-11',
      status: 'verified',
      ruleNature: 'guidance',
      notes: 'Ký hợp đồng thuê bao di động Nhật Bản.'
    })
  },
  {
    id: 'task_inkan_registration',
    stageId: 'stage_essentials',
    stage: 'stage_essentials',
    requirement: 'recommended',
    titleJa: '実印の作成・印鑑登録（必要に応じて）',
    titleVi: 'Làm Con Dấu & Đăng Ký Con Dấu (Inkan Toroku)',
    titleEn: 'Personal Seal Creation & Inkan Registration (As Needed)',
    descJa: '自動車購入、不動産賃貸契約、金融機関取引等で「印鑑登録証明書」が求められる場合に作成・登録。在留カード記載の氏名と一致する印鑑を市区町村役場に登録します。',
    descVi: 'Nếu bạn cần thuê nhà lớn, mua xe hoặc giao dịch đặc biệt yêu cầu giấy chứng nhận con dấu (印鑑登録証明書), bạn có thể khắc con dấu mang tên giống trên thẻ cư trú và đăng ký tại Tòa thị chính.',
    descEn: 'If leasing property, buying vehicles, or entering notarized contracts, register a personal seal matching your registered legal name at your city office.',
    authorityJa: '市区町村役場 市民課窓口',
    authorityVi: 'Tòa thị chính - Quầy Dịch vụ Công dân',
    authorityEn: 'Municipal Office Resident Division',
    sourceId: 'soumu-resident-basic-book-act',
    metadata: defineRuleMetadata({
      id: 'jp-imm-arrival-inkan-registration',
      jurisdiction: JAPAN_JURISDICTION,
      sourceId: 'soumu-resident-basic-book-act',
      effectiveFrom: '2012-07-09',
      applicablePeriod: { type: 'calendar-year', from: 2012, to: 2099 },
      version: '2026.1',
      lastVerifiedAt: '2026-09-11',
      status: 'verified',
      ruleNature: 'guidance',
      notes: 'Khắc và đăng ký con dấu cá nhân tại Tòa thị chính.'
    })
  },
  {
    id: 'task_employer_mynumber',
    stageId: 'stage_onboarding',
    stage: 'stage_onboarding',
    requirement: 'required',
    titleJa: '勤務先・学校へのマイナンバー・在留カード提示',
    titleVi: 'Xuất Trình Thẻ Cư Trú & Khai Báo My Number Cho Công Ty / Trường',
    titleEn: 'Submit My Number & Residence Card to Employer/School',
    descJa: '就労開始時、雇用主は労働施策総合推進法およびマイナンバー法に基づき、在留資格・在留期間の確認（外国人雇用状況届出）および税・社会保障手続きのため個人番号の提示を求めます。',
    descVi: 'Khi bắt đầu làm việc, người sử dụng lao động có nghĩa vụ kiểm tra tư cách lưu trú và thu thập mã số My Number để làm thủ tục Bảo hiểm Xã hội (Shakai Hoken) và Thuế thu nhập.',
    descEn: 'Employers are required by law to verify residence status/period (Foreign Worker Employment Notification) and collect My Number for tax withholding and social insurance onboarding.',
    authorityJa: '勤務先の人事総務部 / ハローワーク',
    authorityVi: 'Phòng Nhân sự công ty / Hello Work',
    authorityEn: 'Employer HR Department / Hello Work',
    sourceId: 'isa-ica-art19-work-scope',
    metadata: defineRuleMetadata({
      id: 'jp-imm-arrival-employer-onboarding',
      jurisdiction: JAPAN_JURISDICTION,
      sourceId: 'isa-ica-art19-work-scope',
      effectiveFrom: '2016-01-01',
      applicablePeriod: { type: 'calendar-year', from: 2016, to: 2099 },
      version: '2026.1',
      lastVerifiedAt: '2026-09-11',
      status: 'verified',
      ruleNature: 'deterministic',
      notes: 'Xuất trình thẻ cư trú và My Number cho cơ quan tiếp nhận.'
    })
  },
  {
    id: 'task_fuyou_declaration',
    stageId: 'stage_onboarding',
    stage: 'stage_onboarding',
    requirement: 'recommended',
    titleJa: '給与所得者の扶養控除等申告書（マル扶）の提出',
    titleVi: 'Nộp Tờ Khai Giảm Trừ Gia Cảnh Thuế Thu Nhập (Form Fuyou)',
    titleEn: 'Submit Dependents Tax Deduction Declaration (Form Maru-Fu)',
    descJa: '会社から給与を受け取る前に「扶養控除等（異動）申告書」を提出することで、月々の源泉徴収税率が有利な「甲欄（こうらん）」で計算され、過大徴収を防げます。海外扶養親族がいる場合は送金証明書が必要。',
    descVi: 'Nộp tờ khai Form Fuyou cho công ty để được áp dụng mức khấu trừ thuế thu nhập ưu đãi (Cột Giáp - 甲欄), tránh bị khấu trừ mức cao nhất (Cột Ất - 乙欄). Nếu nuôi dưỡng người thân ở nước ngoài cần chuẩn bị chứng từ chuyển tiền hợp lệ.',
    descEn: 'Submit Form Maru-Fu to employer before first payroll to ensure withholding uses the lower Tax Bracket A (Kou-ran) rather than the non-resident/higher Bracket B.',
    authorityJa: '所轄税務署（勤務先経由で提出）',
    authorityVi: 'Cơ quan Thuế (Nộp qua công ty)',
    authorityEn: 'National Tax Agency (Submitted via Employer)',
    sourceId: 'nta-income-tax-act',
    relatedCapabilityId: 'tax.japan.calculate',
    deepLink: {
      toolId: 'japan-tax-simulator',
      labelJa: '所得税シミュレーターを開く',
      labelVi: 'Mô phỏng thuế thu nhập',
      labelEn: 'Open Japan Tax Simulator'
    },
    metadata: defineRuleMetadata({
      id: 'jp-imm-arrival-fuyou-declaration',
      jurisdiction: JAPAN_JURISDICTION,
      sourceId: 'nta-income-tax-act',
      effectiveFrom: '1965-03-31',
      applicablePeriod: { type: 'calendar-year', from: 1965, to: 2099 },
      version: '2026.1',
      lastVerifiedAt: '2026-09-11',
      status: 'verified',
      ruleNature: 'guidance',
      notes: 'Khai báo người phụ thuộc để tối ưu thuế thu nhập tại nguồn.'
    })
  },
  {
    id: 'task_commutation_allowance',
    stageId: 'stage_onboarding',
    stage: 'stage_onboarding',
    requirement: 'recommended',
    titleJa: '通勤交通費申請・通勤定期券の購入',
    titleVi: 'Đăng Ký Trợ Cấp Đi Lại & Mua Vé Tháng (Teikiken)',
    titleEn: 'Commuter Allowance Application & Pass Purchase',
    descJa: '自宅から勤務先・学校までの最短・最経済ルートを申請。所得税法上、1ヶ月あたり15万円までの通勤手当は非課税限度額内となり課税対象から除外されます。',
    descVi: 'Đăng ký tuyến đường đi làm/đi học hợp lý với công ty để nhận phụ cấp đi lại (được miễn thuế thu nhập tối đa 150.000 JPY/tháng). Sau đó mua vé tháng Suica/Pasmo/ICOCA.',
    descEn: 'Apply for employer commuter subsidy (tax-exempt up to 150,000 JPY/month) and purchase monthly railway/bus IC commuter pass.',
    authorityJa: '勤務先総務 / 鉄道・バス事業者窓口',
    authorityVi: 'Công ty / Nhà ga tàu điện, xe buýt',
    authorityEn: 'Employer Admin / Railway & Bus Ticket Offices',
    sourceId: 'nta-income-tax-act',
    metadata: defineRuleMetadata({
      id: 'jp-imm-arrival-commutation-allowance',
      jurisdiction: JAPAN_JURISDICTION,
      sourceId: 'nta-income-tax-act',
      effectiveFrom: '1965-03-31',
      applicablePeriod: { type: 'calendar-year', from: 1965, to: 2099 },
      version: '2026.1',
      lastVerifiedAt: '2026-09-11',
      status: 'verified',
      ruleNature: 'guidance',
      notes: 'Đăng ký phụ cấp đi lại miễn thuế và mua vé tháng.'
    })
  }
]);

export const ARRIVAL_SOURCES = Object.freeze([
  'isa-ica-annexed-table-1',
  'isa-extra-activity-perm',
  'soumu-resident-basic-book-act',
  'cao-mynumber-system',
  'mhlw-kokumin-kenpo-guide',
  'nenkin-kokumin-nenkin-overview',
  'nta-income-tax-act'
]);
