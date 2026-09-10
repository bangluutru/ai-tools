/**
 * @file packages/core/src/japan/employment/rules/leavingJobRules.js
 * @description
 * Quy định và chuẩn mực thủ tục khi người lao động nghỉ việc tại Nhật Bản (退職手続きガイド & Orchestrator Rules).
 * Căn cứ pháp lý:
 * - 民法第627条第1項 (Thời hạn báo trước 2 tuần đối với hợp đồng không xác định thời hạn)
 * - 労働基準法第39条 (Giải quyết hết ngày phép năm còn lại trước ngày thôi việc)
 * - 健康保険法第3条第4項 (Tự nguyện tiếp tục BHYT 任意継続 trong vòng 20 ngày)
 * - 国民健康保険法第9条 (Thủ tục tham gia BHYT Quốc dân 国民健康保険 trong vòng 14 ngày)
 * - 国民年金法第12条 (Chuyển sang Lương hưu Quốc dân loại 1 第1号被保険者 trong vòng 14 ngày & Miễn giảm do thôi việc)
 * - 地方税法第321条の5 (Quy định khấu trừ Thuế cư trú 住民税: 1-5月 trừ 1 cục, 6-12月 chuyển 普通徴収)
 * - 雇用保険法第7条 (Cấp Giấy chứng nhận thôi việc 離職票 qua Hello Work trong 10 ngày)
 * - 所得税法第226条 (Cấp Phiếu khấu trừ thuế 源泉徴収票 trong vòng 1 tháng sau khi nghỉ)
 */

export const LEAVING_JOB_SOURCES = [
  'mhlw-resignation-procedures-guide',
  'mhlw-hellowork-unemployment-guide',
  'egov-labor-standards-act-39',
  'egov-employment-insurance-act',
];

/**
 * Các giai đoạn tiến trình nghỉ việc
 */
export const LEAVING_STAGES = {
  BEFORE_RESIGNATION: {
    id: 'before_resignation',
    nameJa: '退職前（1〜3ヶ月前〜退職日）',
    nameVi: 'Trước khi nghỉ việc (1-3 tháng trước ~ Ngày nghỉ)',
    nameEn: 'Before Resignation (1-3 Months Before to Resignation Day)',
    order: 1,
  },
  LAST_DAY: {
    id: 'last_day',
    nameJa: '最終出社日（会社の引き継ぎ・返却・受領）',
    nameVi: 'Ngày làm việc cuối cùng (Bàn giao, hoàn trả & nhận giấy tờ)',
    nameEn: 'Last Working Day (Handover, Return & Collection)',
    order: 2,
  },
  AFTER_RESIGNATION: {
    id: 'after_resignation',
    nameJa: '退職後（公的手続き：保険・年金・税金・ハローワーク）',
    nameVi: 'Sau khi nghỉ việc (Thủ tục công vụ: BHYT, Lương hưu, Thuế, Hello Work)',
    nameEn: 'After Resignation (Public Procedures: Insurance, Pension, Tax, Hello Work)',
    order: 3,
  },
};

/**
 * 3 lựa chọn Bảo hiểm Y tế sau khi nghỉ việc
 */
export const HEALTH_INSURANCE_OPTIONS = {
  VOLUNTARY_CONTINUATION: {
    id: 'voluntary_continuation',
    nameJa: '健康保険の任意継続',
    nameVi: 'Tự nguyện tiếp tục BHYT công ty (任意継続 - Tối đa 2 năm)',
    nameEn: 'Voluntary Continuation of Company Health Insurance',
    statutoryDeadlineDays: 20,
    deadlineDescriptionJa: '退職日の翌日から20日以内（必着）',
    deadlineDescriptionVi: 'Trong vòng 20 ngày kể từ ngày hôm sau ngày nghỉ việc (phải đến nơi nhận)',
    deadlineDescriptionEn: 'Within 20 days from the day after leaving company (strictly observed)',
    notesJa: '前職で継続して2ヶ月以上の被保険者期間が必要。保険料は全額自己負担（2倍）となるが、協会の標準報酬月額上限が適用されるため高所得者は国保より安くなる場合が多い。',
    notesVi: 'Điều kiện: Đã đóng BHYT công ty liên tục từ 2 tháng trở lên. Tự đóng 100% (gấp đôi mức cũ), nhưng có mức trần lương tiêu chuẩn của hiệp hội nên người lương khá trở lên thường rẻ hơn BHYT Quốc dân.',
    notesEn: 'Requires at least 2 months of prior coverage. You pay full premium (approx 2x previous employee share), but capped at standard monthly remuneration limit.',
  },
  NATIONAL_HEALTH_INSURANCE: {
    id: 'national_health_insurance',
    nameJa: '国民健康保険（国保）への加入',
    nameVi: 'Chuyển sang BHYT Quốc dân (国民健康保険 tại Ủy ban quận/thị xã)',
    nameEn: 'National Health Insurance (NHI at Municipal Office)',
    statutoryDeadlineDays: 14,
    deadlineDescriptionJa: '退職日の翌日から14日以内',
    deadlineDescriptionVi: 'Trong vòng 14 ngày kể từ ngày hôm sau ngày nghỉ việc',
    deadlineDescriptionEn: 'Within 14 days from the day after leaving company',
    notesJa: '前年の所得をもとに市町村ごとに保険料が算定される。会社都合退職（倒産・解雇・特定受給資格者）の場合は、申告により保険料が最大7割軽減される特例制度あり。',
    notesVi: 'Phí tính theo thu nhập chịu thuế của năm trước tại từng địa phương. Nếu thôi việc do công ty (phá sản, sa thải, người hưởng đặc định) được giảm đến 70% phí khi làm đơn tại quận.',
    notesEn: 'Premiums calculated based on previous year income by municipality. Eligible involuntary leavers can receive up to 70% premium reduction upon application.',
  },
  DEPENDENT: {
    id: 'dependent',
    nameJa: '家族の扶養に入る（健康保険被扶養者）',
    nameVi: 'Vào phụ thuộc BHYT của người thân (Gia đình / Vợ / Chồng)',
    nameEn: 'Join Family Dependent Health Insurance',
    statutoryDeadlineDays: 14,
    deadlineDescriptionJa: '被扶養者の事由発生後速やかに（通常14日〜1ヶ月以内）',
    deadlineDescriptionVi: 'Làm thủ tục nhanh chóng sau khi nghỉ (thường trong vòng 14 ngày - 1 tháng)',
    deadlineDescriptionEn: 'Promptly upon qualification (usually within 14 days to 1 month)',
    maxAnnualIncome: 1300000,
    maxAnnualIncomeSenior: 1800000, // 60 tuổi trở lên hoặc người khuyết tật
    notesJa: '年収見込みが130万円未満（60歳以上・障害者は180万円未満）かつ被保険者の収入の半分未満であることが要件。自己負担保険料は0円。',
    notesVi: 'Điều kiện: Thu nhập dự kiến dưới 1,3 triệu yên/năm (< 1,8 triệu nếu >= 60 tuổi/khuyết tật) và dưới 1/2 thu nhập của người bảo trợ. Không phải đóng phí BHYT.',
    notesEn: 'Requirement: Projected annual income under 1.3M JPY (< 1.8M if 60+ or disabled) and less than half of sponsor income. Premium is 0 JPY.',
  },
};

/**
 * Quy định luật định về khấu trừ thuế cư trú theo tháng nghỉ
 */
export const RESIDENT_TAX_RULES = {
  JAN_TO_MAY: {
    id: 'jan_to_may',
    nameJa: '1月〜5月退職：残額の一括徴収（原則義務）',
    nameVi: 'Thôi việc từ tháng 1 đến tháng 5: Khấu trừ một cục (Nguyên tắc bắt buộc)',
    nameEn: 'Resignation between Jan - May: Mandatory Lump-Sum Deduction',
    descriptionJa: '地方税法の定めにより、5月分までの残り住民税を退職月の給与または退職金から一括で天引きされます。最後の給料の手取りが大きく減る可能性があるため注意が必要です。',
    descriptionVi: 'Theo Luật Thuế Địa phương, toàn bộ tiền thuế cư trú còn lại đến tháng 5 sẽ được công ty khấu trừ một cục từ kỳ lương cuối cùng hoặc tiền trợ cấp thôi việc. Cần lưu ý vì thực lĩnh tháng cuối có thể bị âm hoặc giảm mạnh.',
    descriptionEn: 'Under Local Tax Act, remaining resident tax through May is deducted in a lump sum from your final paycheck. Be prepared for a significantly smaller take-home pay.',
  },
  JUN_TO_DEC: {
    id: 'jun_to_dec',
    nameJa: '6月〜12月退職：普通徴収へ切り替え（または希望による一括徴収）',
    nameVi: 'Thôi việc từ tháng 6 đến tháng 12: Chuyển sang tự nộp (普通徴収) hoặc đề nghị khấu trừ một cục',
    nameEn: 'Resignation between Jun - Dec: Switch to Self-Pay (Ordinary Collection) or Voluntary Lump-Sum',
    descriptionJa: '残りの税額は、自宅に送付される納付書で自分で納める「普通徴収（年4回納付）」に切り替わります。本人が希望する場合は退職月の給与から一括徴収することも可能です。',
    descriptionVi: 'Số thuế còn lại sẽ được chuyển sang hình thức tự nộp (普通徴収 - nộp 4 đợt trong năm) qua giấy báo thuế gửi về địa chỉ nhà riêng. Nếu muốn, bạn có thể đề nghị công ty trừ một cục trong lương cuối.',
    descriptionEn: 'Remaining tax switches to self-pay (ordinary collection, 4 installments/year) via slips mailed to your home, or you can opt for lump-sum deduction from final pay.',
  },
};

/**
 * Danh mục các công việc pháp lý và hành chính cần thực hiện
 */
export const LEAVING_ACTION_ITEMS = [
  // GIAI ĐOẠN 1: TRƯỚC KHI NGHỈ
  {
    id: 'notice_resignation',
    stage: 'before_resignation',
    category: 'labor_law',
    titleJa: '退職の意思表示・退職届の提出（民法627条・就業規則）',
    titleVi: 'Thông báo ý định nghỉ việc & nộp đơn thôi việc (Điều 627 Dân luật & Nội quy công ty)',
    titleEn: 'Notice of Resignation & Submission (Civil Code Art. 627 & Workplace Rules)',
    priority: 'urgent',
    statutoryDeadlineDaysBefore: 14,
    descriptionJa: '期間の定めのない雇用契約では民法上2週間前までの申入れで退職可能ですが、円満退職や引き継ぎのため就業規則（通常1〜2ヶ月前）に従って直属の上司に相談・提出します。',
    descriptionVi: 'Về mặt pháp luật dân sự (Điều 627), người lao động hợp đồng vô thời hạn có quyền nghỉ việc sau 14 ngày kể từ khi nộp đơn. Tuy nhiên nên tuân thủ nội quy công ty (thường 1-2 tháng trước) để bàn giao chu đáo.',
    descriptionEn: 'Civil Code Art. 627 allows termination 2 weeks after notice for indefinite contracts, but standard company practice requests 1-2 months advance notice for proper handover.',
    requiredDocsJa: ['退職届（または退職願）'],
    requiredDocsVi: ['Đơn xin thôi việc (退職届 / 退職願)'],
    requiredDocsEn: ['Letter of Resignation (Taishoku-todoke)'],
  },
  {
    id: 'consume_paid_leave',
    stage: 'before_resignation',
    category: 'labor_law',
    titleJa: '年次有給休暇の残日数確認・計画消化（労働基準法39条）',
    titleVi: 'Kiểm tra ngày phép năm còn lại & lên kế hoạch nghỉ hết (Điều 39 Luật Tiêu chuẩn Lao động)',
    titleEn: 'Check Remaining Paid Leave & Schedule Full Usage (Labor Standards Act Art. 39)',
    priority: 'important',
    descriptionJa: '有給休暇は退職日を過ぎると消滅します（会社に買い取り義務はありません）。最終出社日までに計画的に取得するか、最終出社日後に有休を連続取得して退職日を迎えます。',
    descriptionVi: 'Phép năm sẽ tự động hết hạn và biến mất sau ngày thôi việc (công ty không có nghĩa vụ mua lại). Bạn có quyền yêu cầu dùng hết phép trước ngày chính thức chấm dứt hợp đồng.',
    descriptionEn: 'Unused paid leave expires upon resignation (companies have no obligation to buy back). Plan your remaining days before the official termination date.',
    deepLink: {
      toolId: 'paid-leave-checker-jp',
      labelJa: '有給休暇チェッカーで残日数を確認',
      labelVi: 'Tính số ngày phép năm tại Có phép năm checker',
      labelEn: 'Check entitled days with Paid Leave Checker',
    },
  },
  {
    id: 'check_unpaid_overtime',
    stage: 'before_resignation',
    category: 'labor_law',
    titleJa: '未払い残業代・割増賃金の記録確認（時効3年）',
    titleVi: 'Kiểm tra tiền làm thêm giờ / phụ trội chưa thanh toán (Thời hiệu khiếu nại 3 năm)',
    titleEn: 'Check Unpaid Overtime & Premium Pay Records (3-Year Limitation)',
    priority: 'recommended',
    descriptionJa: '固定残業代の超過分や休日・深夜・月60時間超の割増賃金が適正に支払われているか、勤怠記録や給与明細を照合します。',
    descriptionVi: 'Kiểm tra bảng chấm công và phiếu lương xem các giờ làm thêm thực tế, giờ đêm, ngày nghỉ và quá 60h/tháng có được trả đúng phụ trội không.',
    descriptionEn: 'Review attendance records and pay slips to ensure overtime, late-night, and holiday premiums were correctly paid.',
    deepLink: {
      toolId: 'overtime-calculator-jp',
      labelJa: '残業代シミュレーターで計算',
      labelVi: 'Tính tiền tăng ca luật định với Overtime Calculator',
      labelEn: 'Calculate statutory overtime with Overtime Calculator',
    },
  },

  // GIAI ĐOẠN 2: NGÀY LÀM VIỆC CUỐI CÙNG
  {
    id: 'return_company_items',
    stage: 'last_day',
    category: 'company_handover',
    titleJa: '健康保険証および会社備品の返却',
    titleVi: 'Trả lại thẻ BHYT và tài sản công ty',
    titleEn: 'Return Health Insurance Card & Company Property',
    priority: 'urgent',
    descriptionJa: '健康保険証は退職日の翌日から使用できなくなります。家族の扶養保険証も合わせて会社へ返却します。名刺、社員証、PC、制服、通勤定期券なども返却します。',
    descriptionVi: 'Thẻ BHYT công ty sẽ mất hiệu lực từ ngày hôm sau ngày nghỉ việc. Phải trả lại thẻ BHYT của bản thân và người phụ thuộc cùng các tài sản công ty (thẻ nhân viên, máy tính, danh thiếp...).',
    descriptionEn: 'Your company health insurance card becomes invalid the day after resignation. Return your and any dependent cards, company badge, PC, and transit pass.',
    requiredDocsJa: ['健康保険被保険者証（本人・扶養家族分）', '社員証・セキュリティカード', '会社支給PC・携帯・制服', '名刺'],
    requiredDocsVi: ['Thẻ BHYT (bản thân & người nhà)', 'Thẻ nhân viên / thẻ từ', 'Máy tính / điện thoại / đồng phục công ty', 'Danh thiếp cá nhân'],
    requiredDocsEn: ['Health insurance cards', 'Employee ID & access card', 'Company devices & uniforms', 'Business cards'],
  },
  {
    id: 'collect_company_documents',
    stage: 'last_day',
    category: 'company_handover',
    titleJa: '会社から受領する書類の確認・申請',
    titleVi: 'Nhận & yêu cầu công ty gửi các giấy tờ quan trọng',
    titleEn: 'Request & Collect Vital Documents from Company',
    priority: 'urgent',
    descriptionJa: '年金手帳（会社保管の場合）や雇用保険被保険者証を即日受領します。離職票や源泉徴収票は後日（10日〜1ヶ月以内）郵送されるため送付先住所を確認します。',
    descriptionVi: 'Nhận lại Sổ lương hưu (nếu công ty giữ) và Thẻ mã số BHTN (雇用保険被保険者証). Xác nhận địa chỉ nhận thư để công ty gửi Giấy thôi việc (離職票) và Phiếu thuế (源泉徴収票) sau 10-14 ngày.',
    descriptionEn: 'Receive your Pension Handbook and Employment Insurance Certificate. Confirm your mailing address for the Separation Notice (Rishokuhyo) and Tax Withholding Slip.',
    requiredDocsJa: ['雇用保険被保険者証', '年金手帳（または基礎年金番号通知書）', '離職票（後日郵送）', '源泉徴収票（後日郵送）', '退職証明書（希望者のみ）'],
    requiredDocsVi: ['Chứng nhận số BHTN', 'Sổ lương hưu', 'Giấy thôi việc Hello Work (gửi sau)', 'Phiếu khấu trừ thuế (gửi sau)', 'Giấy chứng nhận nghỉ việc (nếu cần xin visa/việc mới)'],
    requiredDocsEn: ['Employment Insurance Certificate', 'Pension Handbook', 'Separation Slip (Mailed later)', 'Withholding Slip (Mailed later)', 'Certificate of Resignation'],
  },

  // GIAI ĐOẠN 3: SAU KHI NGHỈ VIỆC
  {
    id: 'health_insurance_procedure',
    stage: 'after_resignation',
    category: 'social_insurance',
    titleJa: '健康保険の切り替え手続き（任意継続 / 国民健康保険 / 扶養）',
    titleVi: 'Thủ tục chuyển đổi BHYT (Tự nguyện tiếp tục / BHYT Quốc dân / Vào phụ thuộc)',
    titleEn: 'Health Insurance Switch (Voluntary Continuation / NHI / Dependent)',
    priority: 'urgent',
    statutoryDeadlineDaysAfter: 14, // hoặc 20 ngày nếu là 任意継続
    descriptionJa: '無保険期間を作らないよう、退職日の翌日から14日以内（任意継続は20日以内必着）に手続きを行います。',
    descriptionVi: 'Để không bị gián đoạn bảo hiểm y tế, phải nộp đơn trong 14 ngày (hoặc tối đa 20 ngày nếu chọn Tiếp tục tự nguyện BHYT công ty cũ).',
    descriptionEn: 'Complete within 14 days (or strictly 20 days for Voluntary Continuation) to avoid any uninsured period.',
    deepLink: {
      toolId: 'dependent-insurance-jp',
      labelJa: '被扶養者判定チェッカーで扶養条件を確認',
      labelVi: 'Kiểm tra điều kiện vào phụ thuộc tại BHYT Phụ thuộc',
      labelEn: 'Check dependent criteria with Dependent Insurance Checker',
    },
  },
  {
    id: 'national_pension_switch',
    stage: 'after_resignation',
    category: 'pension',
    titleJa: '国民年金への種別変更手続き（第1号被保険者・免除申請）',
    titleVi: 'Chuyển sang Lương hưu Quốc dân loại 1 & nộp đơn xin miễn giảm nếu cần',
    titleEn: 'National Pension Category 1 Switch & Exemption Application',
    priority: 'urgent',
    statutoryDeadlineDaysAfter: 14,
    descriptionJa: '厚生年金から国民年金（第1号）への切り替えをお住まいの市区町村窓口で14日以内に行います。失業により納付が困難な場合は「特例免除制度」を同時に申請できます。',
    descriptionVi: 'Chuyển từ Lương hưu Phúc lợi (厚生年金) sang Lương hưu Quốc dân (国民年金第1号) tại UBND quận/thị xã trong vòng 14 ngày. Nếu thất nghiệp thu nhập giảm, hãy nộp đơn xin miễn giảm theo chính sách ưu đãi cho người thôi việc.',
    descriptionEn: 'Switch to National Pension Category 1 at municipal office within 14 days. If unemployed, apply for special concession exemption simultaneously.',
    deepLink: {
      toolId: 'national-pension-jp',
      labelJa: '国民年金シミュレーターで免除・追納を試算',
      labelVi: 'Mô phỏng miễn giảm lương hưu tại National Pension Simulator',
      labelEn: 'Simulate exemption with National Pension Simulator',
    },
  },
  {
    id: 'resident_tax_payment',
    stage: 'after_resignation',
    category: 'tax',
    titleJa: '住民税の納付（普通徴収または一括徴収の確認）',
    titleVi: 'Nộp thuế cư trú (Xác nhận tự nộp Ordinary Collection hoặc trừ một cục)',
    titleEn: 'Resident Tax Payment (Verify Ordinary Collection or Lump-Sum)',
    priority: 'important',
    descriptionJa: '普通徴収に切り替わった場合、市区町村から納付書（年4回）が送付されます。期限内に納付するか、口座振替を設定します。',
    descriptionVi: 'Nếu thuế cư trú chuyển sang tự nộp (普通徴収), bạn sẽ nhận giấy nộp tiền 4 kỳ gửi về nhà. Hãy nộp đúng hạn qua combini/ngân hàng hoặc cài đặt trừ tự động.',
    descriptionEn: 'If switched to ordinary collection, municipality will mail payment slips (4 installments/year). Pay on time via convenience store or direct debit.',
    deepLink: {
      toolId: 'japan-tax-simulator',
      labelJa: '日本税金シミュレーターで住民税額を確認',
      labelVi: 'Tra cứu ước tính thuế cư trú tại Japan Tax Simulator',
      labelEn: 'Check resident tax estimates with Japan Tax Simulator',
    },
  },
  {
    id: 'hellowork_unemployment_claim',
    stage: 'after_resignation',
    category: 'unemployment',
    titleJa: 'ハローワークでの求職申込み・失業給付（基本手当）受給手続き',
    titleVi: 'Đến Hello Work đăng ký tìm việc & làm thủ tục nhận trợ cấp thất nghiệp',
    titleEn: 'Hello Work Job Application & Unemployment Basic Allowance Claim',
    priority: 'important',
    statutoryDeadlineDaysAfter: 14, // Sau khi nhận 離職票
    descriptionJa: '会社から離職票（1及び2）が届いたら、写真や預金通帳、マイナンバーカードを持参して管轄のハローワークへ行き受給資格の決定を受けます。',
    descriptionVi: 'Khi nhận được Giấy thôi việc (離職票-1 và 2) từ công ty cũ, mang theo ảnh, sổ ngân hàng và thẻ My Number đến Hello Work nơi cư trú để làm thủ tục.',
    descriptionEn: 'Once Separation Slips arrive, visit your local Hello Work with photos, bank book, and My Number to confirm allowance eligibility.',
    deepLink: {
      toolId: 'unemployment-eligibility-jp',
      labelJa: '失業給付受給資格チェッカーで待期・給付制限を確認',
      labelVi: 'Kiểm tra điều kiện & thời gian chờ tại Unemployment Eligibility Checker',
      labelEn: 'Check eligibility with Unemployment Eligibility Checker',
    },
  },
  {
    id: 'year_end_tax_filing',
    stage: 'after_resignation',
    category: 'tax',
    titleJa: '確定申告（年内に再就職しない場合の還付申告）',
    titleVi: 'Quyết toán thuế Thu nhập cá nhân (確定申告 vào tháng 2-3 năm sau nếu chưa đi làm lại)',
    titleEn: 'Final Income Tax Return (Kakutei Shinkoku next Feb-Mar for refund)',
    priority: 'recommended',
    descriptionJa: '年内に再就職せず会社で年末調整を受けなかった場合、翌年2月16日〜3月15日に確定申告を行うことで、納めすぎた所得税の還付を受けられる可能性が高いです。',
    descriptionVi: 'Nếu không đi làm công ty mới trong năm và không làm điều chỉnh thuế cuối năm (年末調整), hãy nộp tờ khai 確定申告 từ 16/2 đến 15/3 năm sau kèm phiếu 源泉徴収票 để nhận tiền hoàn thuế.',
    descriptionEn: 'If not re-employed by year-end without nenmatsu chosei, file tax return (Kakutei Shinkoku) next Feb-Mar using your Withholding Slip for likely tax refund.',
    deepLink: {
      toolId: 'japan-tax-simulator',
      labelJa: '日本税金シミュレーターで還付見込みを試算',
      labelVi: 'Ước tính số tiền hoàn thuế tại Japan Tax Simulator',
      labelEn: 'Estimate tax refund with Japan Tax Simulator',
    },
  },
];
