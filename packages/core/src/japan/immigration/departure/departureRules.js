/**
 * @file packages/core/src/japan/immigration/departure/departureRules.js
 * @description
 * Quy tắc và danh mục đầu việc cho Sự kiện Đời sống: Rời Nhật Bản (日本を離れる手続きガイド - 5th Life Event).
 * Xây dựng trên Nền tảng Sự Kiện Đời Sống (Life Event Foundation).
 * 
 * Các căn cứ pháp lý:
 * - Luật Quản lý Xuất nhập cảnh & Công nhận Tị nạn Điều 26 (再入国許可) & Điều 26-2 (みなし再入国許可)
 * - Luật Đăng ký Cư trú Cơ bản (住民基本台帳法 - 転出届)
 * - Luật Lương hưu Quốc dân & Luật Lương hưu Phúc lợi (脱退一時金制度 - Tối đa 60 tháng từ 04/2021)
 * - Luật Thuế Thu nhập Điều 117 & Luật Thuế Địa phương (Chế định Người đại diện nộp thuế 納税管理人 & Hoàn thuế 20.42%)
 */

import { defineRuleMetadata } from '../../../regulatory/ruleMetadata.js';
import { JAPAN_JURISDICTION } from '../../../regulatory/jurisdiction.js';

export const DEPARTURE_LIFE_EVENT_ID = 'leaving-japan';

export const DEPARTURE_STAGES = Object.freeze([
  {
    id: 'stage_pre_departure',
    stageId: 'stage_pre_departure',
    order: 1,
    titleJa: '出国前の準備・公的手続き',
    titleVi: 'Chuẩn Bị Trước Khi Rời Nhật (Tòa Thị Chính & Thuế)',
    titleEn: 'Pre-Departure Municipal & Tax Preparation',
    icon: 'Building2',
  },
  {
    id: 'stage_airport_departure',
    stageId: 'stage_airport_departure',
    order: 2,
    titleJa: '空港出国審査・在留カード手続き',
    titleVi: 'Tại Sân Bay Xuất Cảnh (Hải Quan & Thẻ Cư Trú)',
    titleEn: 'Airport Exit Inspection & Residence Card Processing',
    icon: 'PlaneTakeoff',
  },
  {
    id: 'stage_post_departure',
    stageId: 'stage_post_departure',
    order: 3,
    titleJa: '出国後の手続き（脱退一時金・還付請求）',
    titleVi: 'Sau Khi Rời Nhật (Rút Nenkin 1 Lần & Hoàn Thuế 20.42%)',
    titleEn: 'Post-Departure Pension Withdrawal & Tax Refund',
    icon: 'Coins',
  },
]);

export const DEPARTURE_TASKS_CATALOG = Object.freeze([
  // --- NHÁNH 1: XUẤT CẢNH TẠM THỜI (TEMPORARY DEPARTURE) ---
  {
    id: 'task_minashi_reentry',
    stageId: 'stage_airport_departure',
    stage: 'stage_airport_departure',
    departureScope: 'temporary_short', // <= 1 year
    requirement: 'required',
    titleJa: 'みなし再入国許可の届出（EDカード記入）',
    titleVi: 'Khai Báo Đặc Lệ Tái Nhập Cảnh (みなし再入国許可 - Dưới 1 Năm)',
    titleEn: 'Special Re-entry Permit (Minashi Re-entry, Under 1 Year)',
    descJa: '出国後1年以内（在留期限が1年未満の場合はその期限まで）に再入国する場合、事前にISA窓口に行く必要はなく、空港出国審査場でEDカード（再入国出国記録）の「一時的な出国であり、再入国する予定です」にチェックを入れるだけで有効（手数料無料）。在留カードは穴あけされず返却されます。',
    descVi: 'Nếu rời Nhật dưới 1 năm (hoặc trước ngày hết hạn visa), bạn không cần đến Cục Xuất nhập cảnh xin phép trước. Chỉ cần tích vào ô "1. Tạm thời rời Nhật và sẽ tái nhập cảnh" trên Phiếu ED tại sân bay (Miễn phí). Thẻ cư trú sẽ không bị đục lỗ và được trả lại nguyên vẹn.',
    descEn: 'If returning within 1 year (and before current visa expires), simply check the "Special Re-entry Permit" box on the ED card at airport immigration (Free of charge). Your residence card will NOT be punched.',
    authorityJa: '出入国在留管理庁（空港出国審査場）',
    authorityVi: 'Cục Quản Lý Xuất Nhập Cảnh (Quầy xuất cảnh sân bay)',
    authorityEn: 'Immigration Services Agency (Airport Departure Gate)',
    sourceId: 'isa-reentry-art26',
    metadata: defineRuleMetadata({
      id: 'jp-imm-departure-minashi-reentry',
      jurisdiction: JAPAN_JURISDICTION,
      sourceId: 'isa-reentry-art26',
      effectiveFrom: '2012-07-09',
      applicablePeriod: { type: 'calendar-year', from: 2012, to: 2099 },
      version: '2026.1',
      lastVerifiedAt: '2026-09-11',
      status: 'verified',
      ruleNature: 'deterministic',
      notes: 'みなし再入国許可 (Điều 26-2 Luật Nhập quản): Miễn thủ tục tại cục nếu xuất cảnh dưới 1 năm.'
    })
  },
  {
    id: 'task_regular_reentry',
    stageId: 'stage_pre_departure',
    stage: 'stage_pre_departure',
    departureScope: 'temporary_long', // > 1 year
    requirement: 'required',
    titleJa: '通常の再入国許可の事前申請（1年超〜最長5年）',
    titleVi: 'Xin Giấy Phép Tái Nhập Cảnh Thông Thường (Trên 1 Năm Đến 5 Năm)',
    titleEn: 'Formal Re-entry Permit Application (Over 1 Year Up to 5 Years)',
    descJa: '1年を超えて出国する場合は、日本出国前に地方出入国在留管理局にて「再入国許可」を取得する必要があります。手数料は窓口申請で1回限り4,000円・数次7,000円（収入印紙）、オンライン申請で3,500円・6,500円（2026年10月1日以降のオンライン申請は別途決済手数料220円）。許可を得ず1年を超えると在留資格が失効します。',
    descVi: 'Nếu dự định rời Nhật trên 1 năm, bắt buộc phải đến Cục Xuất nhập cảnh nộp đơn xin Giấy phép tái nhập cảnh TRƯỚC KHI bay. Lệ phí tại quầy: 4.000 JPY (1 lần) hoặc 7.000 JPY (nhiều lần) bằng tem 収入印紙; online: 3.500 / 6.500 JPY (từ 01/10/2026 online cộng 220 JPY phí thanh toán). Nếu đi quá 1 năm mà không xin phép, visa sẽ tự động bị hủy.',
    descEn: 'If departing for longer than 1 year, apply for a formal Re-entry Permit at ISA prior to leaving Japan. Fee at the counter: 4,000 JPY (single) or 7,000 JPY (multiple) in revenue stamps; online: 3,500 / 6,500 JPY (+220 JPY payment fee for online applications from 1 Oct 2026). Leaving over 1 year without it causes status forfeiture.',
    authorityJa: '地方出入国在留管理局窓口',
    authorityVi: 'Cục Quản Lý Xuất Nhập Cảnh Địa Phương',
    authorityEn: 'Regional Immigration Services Bureau',
    sourceId: 'isa-reentry-art26',
    metadata: defineRuleMetadata({
      id: 'jp-imm-departure-regular-reentry',
      jurisdiction: JAPAN_JURISDICTION,
      sourceId: 'isa-reentry-art26',
      effectiveFrom: '1990-06-01',
      applicablePeriod: { type: 'calendar-year', from: 1990, to: 2099 },
      version: '2026.1',
      lastVerifiedAt: '2026-09-11',
      status: 'verified',
      ruleNature: 'deterministic',
      notes: '再入国許可 (Điều 26 Luật Nhập quản): Bắt buộc cho chuyến đi trên 1 năm.'
    })
  },

  // --- NHÁNH 2: RỜI NHẬT HẲN / VỀ NƯỚC (PERMANENT DEPARTURE) ---
  {
    id: 'task_municipal_moving_out',
    stageId: 'stage_pre_departure',
    stage: 'stage_pre_departure',
    departureScope: 'permanent',
    requirement: 'required',
    titleJa: '市区町村役場への転出届（海外転出）の提出',
    titleVi: 'Nộp Thông Báo Chuyển Đi Nước Ngoài (転出届)',
    titleEn: 'Municipal Moving-Out Notification (Overseas Moving-Out)',
    descJa: '出国予定日の概ね14日前から、居住地の市区町村窓口（またはマイナポータル）にて海外転出届を提出します。これにより住民票が除票され、翌年度からの住民税課税や国民健康保険・国民年金の請求が停止します。',
    descVi: 'Trước khi xuất cảnh khoảng 14 ngày, đến Tòa thị chính nộp Thông báo chuyển đi nước ngoài (海外転出届). Thủ tục này xóa tên khỏi sổ cư dân, chấm dứt nghĩa vụ đóng BHYT Quốc dân và chặn phát sinh thuế cư trú của năm sau.',
    descEn: 'File an overseas moving-out notice (Tenshutsu-todoke) at your city office ~14 days prior to departure. Removes you from the resident registry, stopping subsequent health insurance and resident tax liabilities.',
    authorityJa: '市区町村役場 市民課窓口',
    authorityVi: 'Tòa thị chính quận/huyện (Phòng Cư dân)',
    authorityEn: 'Municipal City/Ward Office (Resident Division)',
    sourceId: 'soumu-resident-basic-book-act',
    deadlineRule: {
      anchorKey: 'departureDate',
      offsetDays: 14,
      direction: 'before',
      description: {
        ja: '出国予定日の約14日前から出国日まで',
        vi: 'Khoảng 14 ngày trước ngày xuất cảnh',
        en: '~14 days prior to departure date'
      }
    },
    metadata: defineRuleMetadata({
      id: 'jp-imm-departure-moving-out',
      jurisdiction: JAPAN_JURISDICTION,
      sourceId: 'soumu-resident-basic-book-act',
      effectiveFrom: '2012-07-09',
      applicablePeriod: { type: 'calendar-year', from: 2012, to: 2099 },
      version: '2026.1',
      lastVerifiedAt: '2026-09-11',
      status: 'verified',
      ruleNature: 'deterministic',
      notes: 'Báo chuyển đi nước ngoài (Điều 24 Luật Đăng ký Cư trú Cơ bản).'
    })
  },
  {
    id: 'task_mynumber_card_return',
    stageId: 'stage_pre_departure',
    stage: 'stage_pre_departure',
    departureScope: 'permanent',
    requirement: 'required',
    titleJa: 'マイナンバーカードの返納・失効処理',
    titleVi: 'Làm Thủ Tục Vô Hiệu Hóa Thẻ My Number',
    titleEn: 'My Number Card Invalidation / Return',
    descJa: '転出届提出時に市区町村窓口でマイナンバーカードを提示し、「国外転出失効」のパンチまたは電子証明書の失効処理を受けます。カード自体は記念として手元に残せる自治体が多いです。',
    descVi: 'Khi nộp đơn chuyển đi, xuất trình thẻ My Number để cán bộ hủy chứng thư số chữ ký điện tử. Thẻ sẽ được bấm lỗ vô hiệu hóa và trả lại cho bạn lưu giữ.',
    descEn: 'Present your My Number Card when filing moving-out notice. Municipal staff will invalidate digital certificates and punch the card for retention as a keepsake.',
    authorityJa: '市区町村役場 マイナンバー窓口',
    authorityVi: 'Tòa thị chính (Quầy My Number)',
    authorityEn: 'Municipal Office (My Number Counter)',
    sourceId: 'cao-mynumber-system',
    metadata: defineRuleMetadata({
      id: 'jp-imm-departure-mynumber-return',
      jurisdiction: JAPAN_JURISDICTION,
      sourceId: 'cao-mynumber-system',
      effectiveFrom: '2015-10-05',
      applicablePeriod: { type: 'calendar-year', from: 2015, to: 2099 },
      version: '2026.1',
      lastVerifiedAt: '2026-09-11',
      status: 'verified',
      ruleNature: 'deterministic',
      notes: 'Vô hiệu hóa thẻ My Number khi rời Nhật vĩnh viễn.'
    })
  },
  {
    id: 'task_tax_administrator',
    stageId: 'stage_pre_departure',
    stage: 'stage_pre_departure',
    departureScope: 'permanent',
    requirement: 'required',
    titleJa: '納税管理人の選任届（税務署・市区町村役場）',
    titleVi: 'Chỉ Định Người Đại Diện Nộp Thuế (納税管理人)',
    titleEn: 'Appointment of Tax Administrator (Nozei Kanrinin)',
    descJa: '日本を出国して非居住者となる前に、所轄税務署（所得税・確定申告・脱退一時金還付用）および市区町村（住民税用）に「納税管理人の届出書」を提出します。日本国内に住所を有する知人・友人・専門家を指定可能。',
    descVi: 'Trước khi xuất cảnh, bắt buộc nộp giấy cử Người đại diện nộp thuế cho Cơ quan Thuế (để giải quyết thuế thu nhập & nhận hoàn thuế 20.42% từ Nenkin rút 1 lần) và Tòa thị chính (để nộp nốt thuế cư trú). Có thể nhờ bạn bè, người quen hoặc văn phòng luật sư tại Nhật.',
    descEn: 'File Tax Administrator declaration at the Tax Office (for income tax & 20.42% pension refund) and City Office (for resident tax). Designates a resident in Japan to manage tax obligations on your behalf.',
    authorityJa: '所轄税務署 および 居住地市区町村役場',
    authorityVi: 'Cơ Quan Thuế & Tòa Thị Chính',
    authorityEn: 'Tax Office & Municipal Tax Division',
    sourceId: 'nta-tax-administrator',
    metadata: defineRuleMetadata({
      id: 'jp-imm-departure-tax-admin',
      jurisdiction: JAPAN_JURISDICTION,
      sourceId: 'nta-tax-administrator',
      effectiveFrom: '1965-03-31',
      applicablePeriod: { type: 'calendar-year', from: 1965, to: 2099 },
      version: '2026.1',
      lastVerifiedAt: '2026-09-11',
      status: 'verified',
      ruleNature: 'deterministic',
      notes: 'Cử người đại diện nộp thuế (Điều 117 Luật Thuế Thu nhập).'
    })
  },
  {
    id: 'task_resident_tax_settlement',
    stageId: 'stage_pre_departure',
    stage: 'stage_pre_departure',
    departureScope: 'permanent',
    requirement: 'required',
    titleJa: '住民税の残額精算（一括徴収・普通徴収切替）',
    titleVi: 'Quyết Toán Tiền Thuế Cư Trú (住民税) Còn Lại',
    titleEn: 'Settlement of Remaining Resident Tax Liabilities',
    descJa: '住民税は前年の所得に対して課税されるため、出国時までに未納の期別分がある場合は勤務先での一括天引き（一括徴収）または納税管理人による納付手配が必要です。1月1日時点で日本に住所がない場合はその年の課税対象外。',
    descVi: 'Thuế cư trú tính trên thu nhập năm trước. Nếu còn các kỳ chưa thanh toán, cần thỏa thuận với công ty trừ một lần vào lương cuối hoặc bàn giao giấy báo thuế cho Người đại diện nộp thuế thanh toán. Xuất cảnh trước ngày 1/1 sẽ không bị tính thuế cư trú năm tiếp theo.',
    descEn: 'Resident tax is assessed on the previous year income. Unpaid installments must be lump-sum deducted from final salary or paid by your Tax Administrator. Departing before Jan 1 exempts the next cycle.',
    authorityJa: '勤務先給与担当 / 市区町村役場 住民税課',
    authorityVi: 'Kế toán công ty / Phòng Thuế Cư Dân - Tòa thị chính',
    authorityEn: 'Employer Payroll / Municipal Resident Tax Division',
    sourceId: 'soumu-resident-basic-book-act',
    relatedCapabilityId: 'tax.japan.calculate',
    deepLink: {
      toolId: 'japan-tax-simulator',
      labelJa: '住民税シミュレーターを開く',
      labelVi: 'Mô phỏng thuế cư trú',
      labelEn: 'Open Resident Tax Simulator'
    },
    metadata: defineRuleMetadata({
      id: 'jp-imm-departure-resident-tax',
      jurisdiction: JAPAN_JURISDICTION,
      sourceId: 'soumu-resident-basic-book-act',
      effectiveFrom: '1950-07-31',
      applicablePeriod: { type: 'calendar-year', from: 1950, to: 2099 },
      version: '2026.1',
      lastVerifiedAt: '2026-09-11',
      status: 'verified',
      ruleNature: 'deterministic',
      notes: 'Quyết toán thuế cư trú trước khi rời Nhật.'
    })
  },
  {
    id: 'task_airport_card_surrender',
    stageId: 'stage_airport_departure',
    stage: 'stage_airport_departure',
    departureScope: 'permanent',
    requirement: 'required',
    titleJa: '在留カードの返納・穴あけ失効処理（空港審査場）',
    titleVi: 'Xuất Trình Thẻ Cư Trú Để Đục Lỗ Hủy Tại Sân Bay',
    titleEn: 'Residence Card Surrender & Invalidation Punch (Airport)',
    descJa: '出国審査場で審査官に「今後は日本に再入国せず完全出国する」旨を伝えます。審査官がカードの中央または角にパンチで穴を開け（失効処理）、記念として手元に返却してくれます。2026年6月14日以降に「特定在留カード」（マイナンバーカード機能付き在留カード）の交付を受けている方は、転出届の手続とあわせて取扱いを市区町村・入管で確認してください。',
    descVi: 'Tại quầy làm thủ tục xuất cảnh sân bay, thông báo với nhân viên hải quan bạn về nước hẳn (không tái nhập cảnh). Nhân viên sẽ đục lỗ tròn lên thẻ cư trú để vô hiệu hóa và trả lại thẻ cho bạn giữ làm kỷ niệm. Nếu bạn dùng "特定在留カード" (thẻ cư trú tích hợp chức năng thẻ My Number, cấp từ 14/06/2026), hãy hỏi Tòa thị chính/Cục XNC về cách xử lý thẻ khi làm thủ tục chuyển đi.',
    descEn: 'Inform the immigration officer at airport exit that you are departing permanently. The officer will punch a hole through your residence card and return it to you as a souvenir. If you hold a Specified Residence Card (residence card with My Number card functions, issued from 14 Jun 2026), confirm its handling with your municipality/ISA when filing the moving-out notice.',
    authorityJa: '出入国在留管理庁（空港出国審査場）',
    authorityVi: 'Cục Quản Lý Xuất Nhập Cảnh (Quầy xuất cảnh sân bay)',
    authorityEn: 'Immigration Services Agency (Airport Departure Desk)',
    sourceId: 'isa-ica-annexed-table-1',
    metadata: defineRuleMetadata({
      id: 'jp-imm-departure-card-punch',
      jurisdiction: JAPAN_JURISDICTION,
      sourceId: 'isa-ica-annexed-table-1',
      effectiveFrom: '2012-07-09',
      applicablePeriod: { type: 'calendar-year', from: 2012, to: 2099 },
      version: '2026.1',
      lastVerifiedAt: '2026-09-11',
      status: 'verified',
      ruleNature: 'deterministic',
      notes: 'Đục lỗ vô hiệu hóa thẻ cư trú khi rời Nhật vĩnh viễn.'
    })
  },
  {
    id: 'task_lump_sum_pension',
    stageId: 'stage_post_departure',
    stage: 'stage_post_departure',
    departureScope: 'permanent',
    requirement: 'conditional',
    conditionKey: 'hasPensionContributions',
    titleJa: '脱退一時金の請求（日本年金機構・出国後2年以内）',
    titleVi: 'Nộp Đơn Xin Tiền Rút Một Lần Hưu Trí (脱退一時金 - Hạn 2 Năm)',
    titleEn: 'Lump-Sum Pension Withdrawal Claim (JPS, Within 2 Years)',
    descJa: '厚生年金または国民年金に6ヶ月以上加入した外国人は、日本に住所を有しなくなった日から2年以内に請求書・パスポート写し・銀行口座証明等を日本年金機構に提出して受給可能。支給額計算の月数上限は現在60月（5年）。2025年の年金制度改正法により上限は8年に引き上げられる予定ですが、施行日は政令で定められます（未施行）。',
    descVi: 'Người nước ngoài đã đóng Nenkin từ 6 tháng trở lên có quyền nộp đơn xin nhận tiền rút một lần trong vòng 2 năm kể từ ngày không còn địa chỉ tại Nhật (thường là ngày chuyển đi ghi trên 転出届). Mức trần tính tiền hiện là 60 tháng (5 năm); Luật cải cách lương hưu 2025 dự kiến nâng trần lên 8 năm nhưng ngày áp dụng do chính lệnh (政令) quy định — CHƯA áp dụng. Có thể nộp qua bưu điện hoặc online.',
    descEn: 'Foreigners who paid pension for >= 6 months can claim a lump-sum refund by mailing form and documents to Japan Pension Service within 2 years of the day they ceased to have an address in Japan. The calculation cap is currently 60 months (5 years); the 2025 pension reform is set to raise it to 8 years from a date to be fixed by cabinet order (not yet in force).',
    authorityJa: '日本年金機構（外国業務部）',
    authorityVi: 'Cơ Quan Hưu Trí Nhật Bản (Ban Nghiệp vụ Nước ngoài)',
    authorityEn: 'Japan Pension Service (Foreign Operations Division)',
    sourceId: 'jps-lump-sum-withdrawal',
    deadlineRule: {
      anchorKey: 'departureDate',
      offsetDays: 730, // giữ để tương thích; engine dùng offsetMonths (2 năm theo lịch)
      offsetMonths: 24,
      direction: 'after',
      description: {
        ja: '日本に住所を有しなくなった日（転出日）から2年以内',
        vi: 'Trong vòng 2 năm kể từ ngày không còn địa chỉ tại Nhật (ngày chuyển đi) — nên gửi sớm',
        en: 'Strictly within 2 years of departure / unregistration'
      }
    },
    relatedCapabilityId: 'insurance.pension.national',
    deepLink: {
      toolId: 'national-pension-jp',
      labelJa: '年金制度ガイドを開く',
      labelVi: 'Xem hướng dẫn lương hưu',
      labelEn: 'Open Pension Guide'
    },
    metadata: defineRuleMetadata({
      id: 'jp-imm-departure-lump-sum',
      jurisdiction: JAPAN_JURISDICTION,
      sourceId: 'jps-lump-sum-withdrawal',
      effectiveFrom: '2021-04-01',
      applicablePeriod: { type: 'calendar-year', from: 2021, to: 2099 },
      version: '2026.1',
      lastVerifiedAt: '2026-09-11',
      status: 'verified',
      ruleNature: 'deterministic',
      notes: 'Tiền rút một lần hưu trí (脱退一時金): trần hiện 60 tháng; thời hạn 2 năm kể từ ngày không còn địa chỉ tại Nhật. Nguồn: https://www.nenkin.go.jp/service/jukyu/seido/sonota-kyufu/dattai-ichiji/20150406.html'
    })
  },
  {
    id: 'task_pension_tax_refund',
    stageId: 'stage_post_departure',
    stage: 'stage_post_departure',
    departureScope: 'permanent',
    requirement: 'conditional',
    conditionKey: 'hasKoseiNenkin',
    titleJa: '厚生年金脱退一時金 源泉所得税（20.42%）の還付申告',
    titleVi: 'Xin Hoàn Lại 20.42% Thuế Thu Nhập Khấu Trừ Từ Tiền Nenkin',
    titleEn: 'Claim 20.42% Withholding Income Tax Refund on Pension Lump-Sum',
    descJa: '厚生年金の脱退一時金を受給する際、所得税および復興特別所得税（20.42%）が源泉徴収されます。年金受給後に届く「脱退一時金支給決定通知書（原本）」を日本の納税管理人に郵送し、税務署へ確定申告を行うことで全額が還付されます。',
    descVi: 'Khoản tiền rút một lần Kosei Nenkin (công ty) khi chi trả sẽ bị trừ tự động 20.42% thuế thu nhập. Sau khi tiền vào tài khoản, bạn gửi Giấy thông báo chi trả bản gốc (脱退一時金支給決定通知書) về cho Người đại diện nộp thuế tại Nhật để làm thủ tục hoàn lại 100% số thuế 20.42% này.',
    descEn: 'Lump-sum pension for employees has 20.42% income tax deducted at source. Mail original Payment Notice to your Tax Administrator in Japan to file for a full refund at the Tax Office.',
    authorityJa: '所轄税務署（納税管理人による代理申告）',
    authorityVi: 'Cơ Quan Thuế (Người đại diện nộp thuế thực hiện)',
    authorityEn: 'Tax Office (Filed via Tax Administrator)',
    sourceId: 'nta-income-tax-act',
    metadata: defineRuleMetadata({
      id: 'jp-imm-departure-tax-refund',
      jurisdiction: JAPAN_JURISDICTION,
      sourceId: 'nta-income-tax-act',
      effectiveFrom: '1965-03-31',
      applicablePeriod: { type: 'calendar-year', from: 1965, to: 2099 },
      version: '2026.1',
      lastVerifiedAt: '2026-09-11',
      status: 'verified',
      ruleNature: 'deterministic',
      notes: 'Hoàn lại 20.42% thuế thu nhập từ tiền rút một lần Kosei Nenkin.'
    })
  }
]);

export const DEPARTURE_SOURCES = Object.freeze([
  'isa-reentry-art26',
  'jps-lump-sum-withdrawal',
  'nta-tax-administrator',
  'soumu-resident-basic-book-act',
  'nta-income-tax-act'
]);
