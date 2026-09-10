/**
 * @file packages/core/src/japan/family/rules/birthWizardRules.js
 * @description
 * Quy chuẩn chế độ Hỗ trợ Thai sản, Sinh con & Nuôi con (妊娠・出産・育児ロードマップ)
 * Căn cứ pháp lý:
 * - 健康保険法第101条 (Khoản hỗ trợ sinh con 500,000円 - 出産育児一時金)
 * - 健康保険法第102条 (Trợ cấp thai sản 2/3 lương - 出産手当金)
 * - 育児・介護休業法 (Luật Nghỉ chăm con & Chế độ Papa Ikukyu)
 * - 雇用保険法 (Trợ cấp nuôi con 67%, 50%, thưởng sau sinh 13%, rút ngắn giờ 10%)
 * - 児童手当法 (Trợ cấp trẻ em cải cách 10/2024)
 * - 戸籍法第49条 (Khai sinh trong vòng 14 ngày)
 */

export const BIRTH_GRANT_CONSTANTS = Object.freeze({
  // Mức trợ cấp sinh con trọn gói (出産育児一時金 - Áp dụng từ 01/04/2023)
  STANDARD_AMOUNT: 500000,           // 500,000円 / con (cơ sở y tế tham gia Quỹ bồi thường sản khoa)
  NON_COMPENSATION_AMOUNT: 488000,   // 488,000円 / con (cơ sở y tế không tham gia Quỹ)

  PAYMENT_METHODS: {
    DIRECT_PAYMENT: 'direct_payment',    // Chế độ thanh toán trực tiếp (直接支払制度) - Khuyến nghị
    RECIPIENT_PROXY: 'recipient_proxy',  // Chế độ đại diện nhận tiền (受取代理制度)
    REIMBURSEMENT: 'reimbursement',      // Tự thanh toán viện phí trước rồi nhận lại (償還払い)
  },

  // Phân biệt rõ 3 chế độ tiền mặt quan trọng nhất
  CORE_BENEFITS_DISTINCTION: {
    CHILDBIRTH_GRANT: {
      nameJa: '出産育児一時金',
      nameVi: 'Khoản hỗ trợ sinh con trọn gói (50 vạn Yên)',
      nameEn: 'Childbirth Lump-Sum Grant (500,000 JPY)',
      authority: '健康保険（協会けんぽ・健康保険組合・国民健康保険）',
      target: 'Mọi sản phụ tham gia BHYT (hoặc là người phụ thuộc)',
      purpose: 'Chi trả trực tiếp viện phí sinh nở và nằm viện',
      standardAmount: 500000,
    },
    MATERNITY_ALLOWANCE: {
      nameJa: '出産手当金',
      nameVi: 'Trợ cấp thai sản bù đắp thu nhập (2/3 lương ngày)',
      nameEn: 'Maternity Allowance (2/3 daily standard remuneration)',
      authority: '健康保険（協会けんぽ・健康保険組合）',
      target: 'Người lao động có tham gia BHYT công ty (nghỉ việc không lương)',
      purpose: 'Bù đắp thu nhập trong 98+ ngày nghỉ trước & sau sinh',
    },
    CHILDCARE_BENEFIT: {
      nameJa: '育児休業給付金',
      nameVi: 'Tiền trợ cấp nghỉ chăm con BHTN (67% / 50% lương)',
      nameEn: 'Childcare Leave Benefit (67% / 50% Employment Insurance)',
      authority: '雇用保険（ハローワーク）',
      target: 'Người lao động nghỉ chăm con đủ 12 tháng BHTN trong 2 năm',
      purpose: 'Nuôi dưỡng con đến 1 tuổi (tối đa 2 tuổi nếu không có nhà trẻ)',
    }
  }
});

/**
 * 6 Giai đoạn của Bản đồ Hành trình (Roadmap Stages)
 */
export const ROADMAP_STAGES = Object.freeze([
  {
    stageId: 'stage1_early_pregnancy',
    order: 1,
    titleJa: '妊娠初期・中期（妊娠判明〜妊娠27週）',
    titleVi: 'Giai đoạn 1: Đầu & Giữa thai kỳ (Biết tin mang thai 〜 Tuần 27)',
    titleEn: 'Stage 1: Early & Mid Pregnancy (Confirmation to Week 27)',
    timeframeJa: '妊娠2ヶ月〜7ヶ月',
    timeframeVi: 'Tháng 2 〜 Tháng 7 thai kỳ',
    timeframeEn: 'Month 2 to Month 7',
    tasks: [
      {
        id: 'task_pregnancy_notification',
        titleJa: '妊娠届出書の提出 & 母子健康手帳の受給',
        titleVi: 'Nộp Giấy báo mang thai & Nhận Sổ tay sức khỏe mẹ con',
        titleEn: 'Submit Pregnancy Notice & Receive Maternal and Child Health Handbook',
        deadlineJa: '心拍確認後、速やかに（妊娠6〜10週頃）',
        deadlineVi: 'Ngay sau khi bác sĩ xác nhận tim thai (khoảng tuần 6-10)',
        deadlineEn: 'Soon after heartbeat confirmed (approx. week 6-10)',
        locationJa: '市区町村窓口（保健センター等）',
        locationVi: 'Ủy ban quận/thị trấn hoặc Trung tâm Y tế địa phương',
        locationEn: 'Municipal Office / Public Health Center',
        documentsJa: '医師の診断書（または診察券）、本人確認書類、マイナンバー',
        documentsVi: 'Giấy khám thai hoặc thẻ khám bệnh viện, CCCD/Thẻ ngoại kiều, My Number',
        documentsEn: 'Doctor certification, Photo ID, My Number card',
        benefitInfoJa: '母子手帳とともに妊婦健康診査受診票（約14回分の公費助成券・10万円超相当）が交付されます。',
        benefitInfoVi: 'Nhận sổ mẹ con kèm tập 14 phiếu khám thai miễn phí/trợ giá của nhà nước (trị giá hơn 10 vạn Yên).',
        benefitInfoEn: 'Receive handbook plus ~14 prenatal subsidy vouchers (worth over 100,000 JPY).',
      },
      {
        id: 'task_pregnancy_support_gift',
        titleJa: '出産・子育て応援給付金（妊娠届出時の5万円相当ギフト）の申請',
        titleVi: 'Đăng ký Quà tặng hỗ trợ thai sản 50,000円 (khi nhận sổ mẹ con)',
        titleEn: 'Apply for Pregnancy Support Grant (50,000 JPY equivalent)',
        deadlineJa: '妊娠届出時の面談と同時に申請',
        deadlineVi: 'Thực hiện ngay khi phỏng vấn nhận sổ mẹ con',
        deadlineEn: 'Upon interview when receiving handbook',
        locationJa: '市区町村窓口（子育て支援窓口）',
        locationVi: 'Ủy ban quận/thành phố (Cửa sổ hỗ trợ nuôi con)',
        locationEn: 'Municipal Childcare Consultation Desk',
        benefitInfoJa: '国の伴走型相談支援事業により、妊婦1人あたり5万円相当（現金またはクーポン）が支給されます。',
        benefitInfoVi: 'Chính phủ hỗ trợ 50,000円/người mang thai (tiền mặt hoặc phiếu mua hàng cho bé).',
        benefitInfoEn: 'National program grants 50,000 JPY cash or voucher per pregnant mother.',
      },
      {
        id: 'task_company_notice',
        titleJa: '勤務先への妊娠報告 & 産休・育休取得予定の事前相談',
        titleVi: 'Báo cáo công ty về việc mang thai & kế hoạch nghỉ sản',
        titleEn: 'Inform Employer of Pregnancy & Discuss Leave Plans',
        deadlineJa: '妊娠中期（妊娠12〜16週頃・安定期目安）',
        deadlineVi: 'Thời kỳ ổn định (khoảng tuần 12-16 thai kỳ)',
        deadlineEn: 'During stable period (approx. weeks 12-16)',
        locationJa: '勤務先の人事部・総務部',
        locationVi: 'Phòng Nhân sự / Hành chính công ty',
        locationEn: 'Employer HR Department',
        benefitInfoJa: '労働基準法に基づく母性健康管理措置（時差通勤、休憩時間延長、残業免除等）を請求できます。',
        benefitInfoVi: 'Có quyền yêu cầu đi làm tránh giờ cao điểm, nghỉ ngơi khi mệt và miễn làm thêm giờ theo Luật LĐ.',
        benefitInfoEn: 'Entitled to maternal health management measures (off-peak commute, rest, overtime exemption).',
      }
    ]
  },
  {
    stageId: 'stage2_late_pregnancy',
    order: 2,
    titleJa: '妊娠後期・産前休業（妊娠28週〜出産前日）',
    titleVi: 'Giai đoạn 2: Cuối thai kỳ & Bắt đầu nghỉ trước sinh (Tuần 28 〜 Trước sinh)',
    titleEn: 'Stage 2: Late Pregnancy & Prenatal Leave (Week 28 to Birth)',
    timeframeJa: '妊娠8ヶ月〜10ヶ月',
    timeframeVi: 'Tháng 8 〜 Tháng 10 thai kỳ',
    timeframeEn: 'Month 8 to Month 10',
    tasks: [
      {
        id: 'task_direct_payment_contract',
        titleJa: '出産育児一時金の「直接支払制度」合意文書の締結',
        titleVi: 'Ký thỏa thuận Chế độ thanh toán trực tiếp 500,000円 viện phí với bệnh viện',
        titleEn: 'Sign Direct Payment Agreement for 500,000 JPY Childbirth Grant with Hospital',
        deadlineJa: '出産予定の分べん施設・病院で入院手続き時（妊娠34〜36週頃）',
        deadlineVi: 'Khi làm thủ tục đăng ký sinh tại bệnh viện (khoảng tuần 34-36)',
        deadlineEn: 'During hospital admission registration (approx. week 34-36)',
        locationJa: '出産予定の産科病院・クリニック',
        locationVi: 'Bệnh viện phụ sản nơi đăng ký sinh',
        locationEn: 'Maternity Hospital / Clinic',
        documentsJa: '健康保険証、直接支払制度合意書（病院で受領）',
        documentsVi: 'Thẻ BHYT, Giấy thỏa thuận thanh toán trực tiếp (bệnh viện cấp)',
        documentsEn: 'Health insurance card, Direct payment agreement form',
        benefitInfoJa: '50万円が健康保険から病院へ直接支払われるため、退院時の自己負担は差額のみ（窓口での多額の立替不要）となります。',
        benefitInfoVi: 'BHYT sẽ thanh toán thẳng 500,000円 cho bệnh viện, bạn chỉ cần trả tiền chênh lệch khi xuất viện.',
        benefitInfoEn: '500,000 JPY is paid directly to hospital, you only pay the net excess difference upon discharge.',
      },
      {
        id: 'task_prenatal_leave_start',
        titleJa: '産前休業の開始（出産予定日の6週間前・多胎は14週間前）',
        titleVi: 'Bắt đầu nghỉ phép trước sinh (trước ngày dự sinh 6 tuần, sinh đôi 14 tuần)',
        titleEn: 'Commence Statutory Prenatal Leave (6 weeks before due date, 14 weeks for multiples)',
        deadlineJa: '単胎：予定日の42日前 / 多胎：予定日の98日前',
        deadlineVi: 'Đơn thai: 42 ngày trước dự sinh / Đa thai: 98 ngày trước dự sinh',
        deadlineEn: 'Single: 42 days before / Multiples: 98 days before',
        locationJa: '勤務先',
        locationVi: 'Nơi làm việc',
        locationEn: 'Employer',
        toolLinkId: 'maternity-allowance-jp',
        benefitInfoJa: '出産手当金（標準報酬日額の3分之2）の受給対象期間となります。社会保険料も免除されます。',
        benefitInfoVi: 'Bắt đầu tính hưởng Trợ cấp thai sản (2/3 lương ngày BHYT) và được miễn hoàn toàn đóng BHXH.',
        benefitInfoEn: 'Qualifying period for Maternity Allowance (2/3 daily wage) begins. Social insurance exempt.',
      }
    ]
  },
  {
    stageId: 'stage3_birth_day',
    order: 3,
    titleJa: '出産・入院（出産当日〜退院）',
    titleVi: 'Giai đoạn 3: Sinh con & Nhập viện (Ngày sinh 〜 Xuất viện)',
    titleEn: 'Stage 3: Childbirth & Hospitalization (Birth to Discharge)',
    timeframeJa: '出産日〜生後5日前後',
    timeframeVi: 'Từ khi chuyển dạ đến ngày thứ 5 sau sinh',
    timeframeEn: 'Birth Day to Day 5 Postpartum',
    tasks: [
      {
        id: 'task_hospital_birth_certificate',
        titleJa: '出生証明書（医師・助産師記入欄）の受領',
        titleVi: 'Nhận Giấy chứng sinh (bác sĩ/nữ hộ sinh ký đóng dấu)',
        titleEn: 'Obtain Signed Birth Certificate from Delivering Doctor/Midwife',
        deadlineJa: '退院時までに病院窓口で受領',
        deadlineVi: 'Nhận tại quầy thanh toán xuất viện',
        deadlineEn: 'Upon hospital discharge',
        locationJa: '出産した病院・産院',
        locationVi: 'Bệnh viện nơi em bé chào đời',
        locationEn: 'Delivery Hospital / Clinic',
        benefitInfoJa: '出生届の右半分が医師の出生証明書になっています。退院後に役所へ提出する最重要書類です。',
        benefitInfoVi: 'Nửa bên phải của Giấy khai sinh là Giấy chứng sinh của bác sĩ. Đây là giấy tờ quan trọng nhất.',
        benefitInfoEn: 'Right half of birth notification form is medical certificate, required for municipal registration.',
      },
      {
        id: 'task_settle_hospital_difference',
        titleJa: '退院時の入院分べん費用の精算（一時金50万円との差額精算）',
        titleVi: 'Thanh toán chênh lệch viện phí khi xuất viện (so với 500,000円 trợ cấp)',
        titleEn: 'Hospital Discharge Settlement (Difference with 500,000 JPY grant)',
        deadlineJa: '退院日当日',
        deadlineVi: 'Ngày xuất viện',
        deadlineEn: 'On discharge day',
        locationJa: '病院会計窓口',
        locationVi: 'Quầy thu ngân bệnh viện',
        locationEn: 'Hospital Cashier',
        benefitInfoJa: '費用が50万円未満だった場合は、後日ご自身の健康保険へ差額申請すれば残額が口座に振り込まれます。',
        benefitInfoVi: 'Nếu viện phí dưới 500,000円, bạn làm đơn gửi BHYT để nhận lại số tiền thừa chuyển thẳng vào tài khoản.',
        benefitInfoEn: 'If total hospital cost is under 500,000 JPY, you can claim the difference refund from insurance.',
      }
    ]
  },
  {
    stageId: 'stage4_immediate_post_birth',
    order: 4,
    titleJa: '産後直後・最重要手続き（生後14日以内）',
    titleVi: 'Giai đoạn 4: Thủ tục hành chính khẩn cấp (Trong vòng 14 ngày sau sinh)',
    titleEn: 'Stage 4: Critical Administrative Filings (Within 14 Days of Birth)',
    timeframeJa: '生後1日〜生後14日以内',
    timeframeVi: 'Trong 14 ngày kể từ khi em bé chào đời',
    timeframeEn: 'Day 1 to Day 14 Postpartum',
    tasks: [
      {
        id: 'task_birth_registration',
        titleJa: '出生届の提出（戸籍法に基づく届出）',
        titleVi: 'Nộp Giấy Khai Sinh cho con tại Ủy ban quận/thị trấn',
        titleEn: 'Submit Birth Registration (Civil Registry)',
        deadlineJa: '生まれた日を含めて14日以内（国外出生は3ヶ月以内）',
        deadlineVi: 'Trong vòng 14 ngày kể từ ngày sinh (ở nước ngoài là 3 tháng)',
        deadlineEn: 'Within 14 days of birth inclusive',
        locationJa: '市区町村窓口（本籍地・出生地・住所地のいずれか）',
        locationVi: 'Ủy ban quận/thành phố nơi cư trú hoặc nơi sinh',
        locationEn: 'Municipal Office / Ward Office',
        documentsJa: '出生届（医師証明済）、母子健康手帳、届出人の本人確認書類・印鑑',
        documentsVi: 'Đơn khai sinh (kèm chứng sinh), Sổ mẹ con, CCCD/Thẻ ngoại kiều, con dấu (nếu có)',
        documentsEn: 'Birth certificate, Maternal handbook, Submitter ID',
        benefitInfoJa: '住民票が作成され、マイナンバーが付番されます。',
        benefitInfoVi: 'Bé sẽ có Phiếu cư trú (Juminhyo) và được cấp mã số định danh cá nhân My Number.',
        benefitInfoEn: 'Resident record created and My Number assigned to child.',
      },
      {
        id: 'task_child_allowance_claim',
        titleJa: '児童手当の認定請求（新規申請・2024年10月拡充版）',
        titleVi: 'Nộp Đơn yêu cầu hưởng Trợ cấp Trẻ em (Cải cách 10/2024)',
        titleEn: 'Apply for Child Allowance (Oct 2024 Expansion Compliant)',
        deadlineJa: '出生日の翌日から15日以内（月末出産の場合は「15日特例」適用）',
        deadlineVi: 'Trong vòng 15 ngày kể từ ngày sinh (Quy tắc đặc lệ 15 ngày)',
        deadlineEn: 'Within 15 days of birth (15-day rule applies for end-of-month births)',
        locationJa: '市区町村の児童手当担当窓口（公務員は勤務先）',
        locationVi: 'Bộ phận Trợ cấp Trẻ em tại Ủy ban (công chức nộp tại cơ quan)',
        locationEn: 'Municipal Child Allowance Section',
        toolLinkId: 'child-allowance-jp',
        benefitInfoJa: '月額15,000円（第3子以降は月30,000円）が支給されます。申請が遅れると過去分は支給されませんので厳守してください。',
        benefitInfoVi: 'Nhận 15,000円/tháng (con thứ 3 là 30,000円/tháng). Quá hạn 15 ngày sẽ bị mất tiền tháng đó!',
        benefitInfoEn: 'Receives 15,000 JPY/mo (30,000 JPY for 3rd child). Strictly file within 15 days to avoid lost funds.',
      },
      {
        id: 'task_health_insurance_enrollment',
        titleJa: '赤ちゃんの健康保険加入（扶養追加手続き）',
        titleVi: 'Làm Thẻ Bảo hiểm Y tế cho con (Thêm người phụ thuộc)',
        titleEn: 'Enroll Baby in Health Insurance (Dependent Addition)',
        deadlineJa: '1ヶ月健診までに（速やかに）',
        deadlineVi: 'Trước buổi khám sức khỏe 1 tháng đầu đời (càng sớm càng tốt)',
        deadlineEn: 'Before 1-month checkup (promptly)',
        locationJa: '勤務先の健康保険（社会保険）または市区町村窓口（国保）',
        locationVi: 'Phòng Nhân sự công ty cha/mẹ (BHYT cty) hoặc Ủy ban (nếu là Quốc bảo)',
        locationEn: 'Employer HR (Shakai Hoken) or Municipal Office (Kokuho)',
        toolLinkId: 'dependent-insurance-jp',
        benefitInfoJa: '1ヶ月健診や急な発熱受診時に3割負担（後述の子ども医療費助成でさらに実質無料）とするために必須です。',
        benefitInfoVi: 'Bắt buộc để bé được hưởng mức chi trả BHYT và được hưởng chế độ khám chữa bệnh miễn phí cho trẻ.',
        benefitInfoEn: 'Essential for medical care coverage during 1-month checkup and emergency visits.',
      },
      {
        id: 'task_child_medical_subsidy',
        titleJa: '子ども医療費助成（医療証・受給者証）の申請',
        titleVi: 'Đăng ký Thẻ hỗ trợ chi phí y tế trẻ em (Khám chữa bệnh miễn phí)',
        titleEn: 'Apply for Children’s Medical Subsidy Certificate',
        deadlineJa: '赤ちゃんの健康保険証発行後、速やかに',
        deadlineVi: 'Ngay sau khi nhận được thẻ BHYT của bé',
        deadlineEn: 'Promptly after receiving baby health insurance card',
        locationJa: '市区町村窓口（子ども医療担当課）',
        locationVi: 'Ủy ban quận/thành phố (Ban Y tế Trẻ em)',
        locationEn: 'Municipal Children’s Welfare Division',
        benefitInfoJa: '自治体の制度により、高校卒業（または中学卒業）までの通院・入院の自己負担が無料または数百円上限となります。',
        benefitInfoVi: 'Nhận Thẻ y tế trẻ em: Tiền viện phí và tiền thuốc được miễn phí 100% hoặc tối đa chỉ 500-800円/tháng.',
        benefitInfoEn: 'Caps out-of-pocket medical & prescription costs at 0 to small copay up to age 15 or 18.',
      },
      {
        id: 'task_post_birth_support_grant',
        titleJa: '出産・子育て応援給付金（出産後の5万円相当ギフト）の申請',
        titleVi: 'Nhận Quà tặng sinh con 50,000円 đợt 2 (sau khi sinh)',
        titleEn: 'Apply for Post-Birth Childcare Grant (50,000 JPY 2nd Tranche)',
        deadlineJa: '新生児訪問（こんにちは赤ちゃん事業・生後2〜3ヶ月頃）の面談後',
        deadlineVi: 'Sau buổi cán bộ y tế đến thăm nhà kiểm tra sức khỏe mẹ và bé',
        deadlineEn: 'After newborn home visit interview (around months 2-3)',
        locationJa: '市区町村窓口',
        locationVi: 'Ủy ban quận/huyện',
        locationEn: 'Municipal Office',
        benefitInfoJa: '妊娠時の5万円と合わせて計10万円相当の給付金となります。',
        benefitInfoVi: 'Hoàn thành tổng gói hỗ trợ 100,000円 của chính phủ (50k lúc mang thai + 50k sau sinh).',
        benefitInfoEn: 'Completes 100,000 JPY combined national grant package (50k pregnancy + 50k post-birth).',
      }
    ]
  },
  {
    stageId: 'stage5_childcare_leave_period',
    order: 5,
    titleJa: '育児休業中（産後休業終了〜生後1歳まで）',
    titleVi: 'Giai đoạn 5: Trong thời gian nghỉ chăm con (Sau sinh 8 tuần 〜 Con 1 tuổi)',
    titleEn: 'Stage 5: Childcare Leave in Progress (Postpartum 8 Weeks to Age 1)',
    timeframeJa: '生後57日目〜1歳の誕生日前日',
    timeframeVi: 'Từ ngày thứ 57 sau sinh đến 1 ngày trước sinh nhật 1 tuổi của con',
    timeframeEn: 'Day 57 to Day before 1st Birthday',
    tasks: [
      {
        id: 'task_childcare_benefit_claim',
        titleJa: '育児休業給付金の初回申請（ハローワーク手続き）',
        titleVi: 'Nộp hồ sơ nhận Tiền Trợ cấp Nghỉ chăm con đợt đầu (qua Hello Work)',
        titleEn: 'File Initial Childcare Leave Benefit Claim with Hello Work',
        deadlineJa: '休業開始日から4ヶ月後の月末まで（原則は会社経由で2ヶ月ごと申請）',
        deadlineVi: 'Trước ngày cuối cùng của tháng thứ 4 kể từ khi bắt đầu nghỉ (cty nộp 2 tháng/lần)',
        deadlineEn: 'Within 4 months of leave start (usually handled by employer every 2 months)',
        locationJa: '管轄ハローワーク（会社の人事労務経由で提出）',
        locationVi: 'Hello Work quản lý công ty (thường nộp qua nhân sự công ty)',
        locationEn: 'Jurisdictional Hello Work via Employer HR',
        toolLinkId: 'childcare-benefit-jp',
        benefitInfoJa: '最初の180日間は賃金の67％、以降は50％が非課税・全額振込で支給されます。',
        benefitInfoVi: '180 ngày đầu nhận 67% tiền lương ngày, sau đó nhận 50%, miễn thuế và nhận nguyên vẹn 100%.',
        benefitInfoEn: '67% daily wage for first 180 days, then 50%. Completely tax-free directly to bank account.',
      },
      {
        id: 'task_papa_ikukyu_bonus',
        titleJa: '出生時育児休業（産後パパ育休）および休業支援加算（+13％）の適用確認',
        titleVi: 'Kiểm tra tiền thưởng Nghỉ chăm con sau sinh của Bố (Papa Ikukyu +13%)',
        titleEn: 'Verify Post-Birth Papa Ikukyu & 13% Bonus Application',
        deadlineJa: '子の出生後8週間以内に取得した休業について申請',
        deadlineVi: 'Áp dụng cho số ngày bố nghỉ trong vòng 8 tuần đầu đời của con',
        deadlineEn: 'Claimed for leave taken within 8 weeks of birth',
        locationJa: '管轄ハローワーク（会社経由）',
        locationVi: 'Hello Work (qua công ty)',
        locationEn: 'Hello Work via Employer',
        toolLinkId: 'childcare-leave-eligibility-jp',
        benefitInfoJa: '夫婦ともに14日以上取得等の要件を満たすと、最大28日間について賃金実質手取り10割（80％支給）となります。',
        benefitInfoVi: 'Nếu cả hai vợ chồng đều nghỉ từ 14 ngày trở lên, sẽ được thưởng thêm 13% lên mức 80% (tương đương 100% lương net).',
        benefitInfoEn: 'If both parents take 14+ days, +13% bonus raises benefit to 80% (~100% net take-home pay).',
      },
      {
        id: 'task_social_insurance_exemption',
        titleJa: '育児休業期間中の社会保険料免除の確認',
        titleVi: 'Xác nhận Miễn đóng Tiền Bảo hiểm Xã hội (Y tế, Hưu trí) trong thời gian nghỉ',
        titleEn: 'Verify Social Insurance Exemption During Childcare Leave',
        deadlineJa: '休業開始時に会社が年金事務所・健保へ申出書を提出',
        deadlineVi: 'Công ty làm thủ tục nộp Cơ quan Hưu trí & BHYT khi bắt đầu nghỉ',
        locationJa: '日本年金事務所 / 協会けんぽ',
        locationVi: 'Cơ quan Hưu trí Nhật Bản / Hiệp hội BHYT Kenpo',
        locationEn: 'Japan Pension Service / Health Insurance Union',
        benefitInfoJa: '健康保険料・厚生年金保険料が労働者・会社負担ともに全額免除され、将来の年金受給額も減額されません。',
        benefitInfoVi: 'Miễn 100% tiền BHYT và Lương hưu Nenkin cho cả nhân viên và cty, quyền lợi hưu trí sau này không bị giảm.',
        benefitInfoEn: 'Both employee and employer shares 100% exempt with full pension rights preserved.',
      }
    ]
  },
  {
    stageId: 'stage6_return_to_work',
    order: 6,
    titleJa: '職場復帰・保育所入所（生後1歳〜生後2歳）',
    titleVi: 'Giai đoạn 6: Đi làm trở lại & Gửi nhà trẻ (Con 1 tuổi 〜 Con 2 tuổi)',
    titleEn: 'Stage 6: Return to Work & Daycare Admission (Age 1 to Age 2)',
    timeframeJa: '1歳の誕生日前後〜最長2歳到達まで',
    timeframeVi: 'Từ trước sinh nhật 1 tuổi đến tối đa 2 tuổi',
    timeframeEn: 'Around 1st Birthday to Maximum Age 2',
    tasks: [
      {
        id: 'task_daycare_application',
        titleJa: '認可保育所等の利用申込（保活）',
        titleVi: 'Nộp đơn xin vào nhà trẻ công lập/được cấp phép (Hokatsu)',
        titleEn: 'Apply for Licensed Daycare Center (Hokatsu)',
        deadlineJa: '4月一斉入所は前年10月〜11月頃、年度途中入所は入所希望前月の締切日',
        deadlineVi: 'Nhập học tháng 4: Nộp vào tháng 10-11 năm trước; Nhập học giữa năm: nộp trước 1 tháng',
        deadlineEn: 'April intake: Oct-Nov prior year; Mid-year intake: month prior deadline',
        locationJa: '市区町村の保育担当課窓口',
        locationVi: 'Phòng Quản lý Nhà trẻ mầm non tại Ủy ban',
        locationEn: 'Municipal Daycare / Nursery Division',
        benefitInfoJa: '入所が保留（不承諾）となった場合は、育児休業および給付金を1歳6ヶ月（再不承諾で最長2歳）まで延長できます。',
        benefitInfoVi: 'Nếu có Giấy báo trượt nhà trẻ (保留通知書), được phép gia hạn nghỉ và trợ cấp đến 1.5 tuổi và tối đa 2 tuổi.',
        benefitInfoEn: 'If admission rejected, childcare leave and benefits extend to 1.5 years and max 2 years.',
      },
      {
        id: 'task_short_time_benefit',
        titleJa: '育児短時間勤務の申出 & 育児時短就業給付金（2025年4月新設・10％）',
        titleVi: 'Đăng ký Rút ngắn giờ làm việc nuôi con & Nhận trợ cấp 10% (Chính sách từ 04/2025)',
        titleEn: 'Request Short-Time Work & Claim 10% Short-Time Benefit (New April 2025)',
        deadlineJa: '復職後、短時間勤務を開始する前月までに会社へ申出',
        deadlineVi: 'Báo công ty trước tháng bắt đầu rút ngắn giờ làm sau khi trở lại làm việc',
        deadlineEn: 'Submit to employer prior to starting reduced hours upon return',
        locationJa: '勤務先 & ハローワーク',
        locationVi: 'Công ty và Hello Work',
        locationEn: 'Employer & Hello Work',
        toolLinkId: 'childcare-benefit-jp',
        benefitInfoJa: '2歳未満の子を育てるために短時間勤務を行い賃金が低下した場合、時短後賃金の10％が給付されます。',
        benefitInfoVi: 'Làm việc rút ngắn giờ để chăm con dưới 2 tuổi mà lương bị giảm, BHTN hỗ trợ thêm 10% tiền lương rút ngắn.',
        benefitInfoEn: 'Compensates 10% of reduced wage for parents working shortened hours for child under 2.',
      }
    ]
  }
]);

/**
 * Nguồn pháp quy sơ cấp cho M5
 */
export const BIRTH_WIZARD_SOURCES = Object.freeze([
  'mhlw-childbirth-lump-sum-grant',
  'egov-health-insurance-act-maternity',
  'egov-childcare-leave-act',
  'cfa-child-allowance-reform-2024'
]);
