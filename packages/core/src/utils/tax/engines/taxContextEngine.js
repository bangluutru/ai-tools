/**
 * @file packages/core/src/utils/tax/engines/taxContextEngine.js
 * @description Central Tax Context Engine cho miniapp "日本の税金ガイド・シミュレーター".
 * Quản lý 6 profile người dùng, đồ thị câu hỏi lũy tiến (Progressive Questionnaire),
 * suy luận các loại thuế liên quan, và chẩn đoán nhu cầu khai thuế (確定申告判定).
 */

export const UserProfiles = [
  {
    id: 'part_time',
    name_ja: 'パート・アルバイト',
    name_vi: 'Làm thêm / Bán thời gian (Part-time)',
    name_en: 'Part-time / Hourly Worker',
    desc_ja: '扶養枠（103万・106万・130万・178万の壁）、所得税・住民税、社会保険の加入要否。',
    desc_vi: 'Quan tâm các bức tường thu nhập phụ thuộc, thuế thu nhập, thuế cư trú, điều kiện đóng BHXH.',
    desc_en: 'Dependent income walls, basic income tax, resident tax, and social insurance thresholds.',
    icon: 'Clock',
    color: '#0284c7',
  },
  {
    id: 'employee',
    name_ja: '会社員（正社員・契約社員）',
    name_vi: 'Nhân viên công ty (Toàn thời gian)',
    name_en: 'Salaried Employee (Full-time)',
    desc_ja: '給与からの源泉徴収、手取り額、健康保険・厚生年金、年末調整と確定申告の要否。',
    desc_vi: 'Thuế khấu trừ tại nguồn trên lương, tiền tay về, bảo hiểm xã hội, quyết toán cuối năm (Nenmatsu Chosei).',
    desc_en: 'Withholding tax, net take-home pay, health/pension deductions, year-end tax adjustment.',
    icon: 'Briefcase',
    color: '#3b82f6',
  },
  {
    id: 'employee_side',
    name_ja: '会社員 ＋ 副業',
    name_vi: 'Nhân viên công ty ＋ Làm thêm việc phụ',
    name_en: 'Employee with Side Business',
    desc_ja: '本業給与に加えて副業収入（雑所得・事業所得）がある方。「副業20万円ルール」と確定申告判定。',
    desc_vi: 'Có thêm thu nhập từ việc phụ. Phân tích quy tắc 20 vạn yên và hướng dẫn khai thuế cư trú.',
    desc_en: 'Full-time employment plus freelance/side hustle income. 200,000 JPY rule evaluation.',
    icon: 'TrendingUp',
    color: '#6366f1',
  },
  {
    id: 'freelance',
    name_ja: 'フリーランス（白色申告）',
    name_vi: 'Làm việc tự do (Freelance / Kê khai trắng)',
    name_en: 'Freelancer / Independent Contractor',
    desc_ja: '個人で仕事を請け負う方。国民健康保険・国民年金、必要経費、白色申告の税金シミュレーション。',
    desc_vi: 'Nhận hợp đồng cá nhân tự do. Tính BHYT quốc dân, hưu trí quốc dân, chi phí hợp lý và thuế.',
    desc_en: 'Self-employed freelancers without blue return. National health/pension and white return filing.',
    icon: 'Laptop',
    color: '#8b5cf6',
  },
  {
    id: 'sole_proprietor',
    name_ja: '個人事業主（青色申告）',
    name_vi: 'Hộ kinh doanh cá thể (Khai thuế xanh)',
    name_en: 'Sole Proprietor (Blue Return)',
    desc_ja: '開業届提出済の方。青色申告特別控除（65万）、個人事業税、消費税（インボイス・簡易課税・2割特例）。',
    desc_vi: 'Đã đăng ký kinh doanh cá thể. Khấu trừ thuế xanh 65 vạn yên, thuế kinh doanh cá nhân, thuế tiêu thụ.',
    desc_en: 'Registered sole proprietor. Blue return 650k deduction, business tax, consumption tax & invoice.',
    icon: 'Store',
    color: '#10b981',
  },
  {
    id: 'corporate',
    name_ja: '法人・会社経営者',
    name_vi: 'Pháp nhân / Chủ doanh nghiệp',
    name_en: 'Corporation / Business Executive',
    desc_ja: '会社（株式会社・合同会社等）を経営されている方。法人税・地方法人税・法人住民税・事業税・役員報酬。',
    desc_vi: 'Chủ công ty TNHH/CP tại Nhật. Trọn gói thuế pháp nhân, thuế cư trú/kinh doanh công ty và lương giám đốc.',
    desc_en: 'Corporate entities. Corporate national tax, local taxes, inhabitant taxes, and executive compensation.',
    icon: 'Building2',
    color: '#f59e0b',
  },
];

/**
 * Xác định danh sách các loại thuế và nghĩa vụ tài chính có khả năng liên quan đến người dùng
 */
export function inferApplicableTaxes(profile, formValues = {}) {
  const taxes = [];

  // Mọi người có thu nhập đều có khả năng liên quan đến Thuế thu nhập & Thuế cư trú
  taxes.push({
    id: 'income_tax',
    name_ja: '所得税・復興特別所得税',
    name_vi: 'Thuế thu nhập & Thuế tái thiết',
    name_en: 'Income Tax & Reconstruction Tax',
    authority_ja: '国税庁（税務署）',
    authority_vi: 'Cơ quan Thuế Quốc gia (Sở thuế)',
    authority_en: 'National Tax Agency (Tax Office)',
    isRequired: true,
  });

  taxes.push({
    id: 'resident_tax',
    name_ja: '住民税（所得割・均等割・森林環境税）',
    name_vi: 'Thuế cư trú & Thuế môi trường rừng',
    name_en: 'Resident Tax & Forest Environment Tax',
    authority_ja: 'お住まいの市区町村・都道府県',
    authority_vi: 'UBND Xã/Phường & Tỉnh nơi cư trú',
    authority_en: 'Municipal & Prefectural Government',
    isRequired: true,
  });

  // Bảo hiểm xã hội
  if (['employee', 'employee_side', 'corporate'].includes(profile) || (profile === 'part_time' && formValues.isEnrolledCompanySocial)) {
    taxes.push({
      id: 'social_insurance_company',
      name_ja: '社会保険料（健康保険・厚生年金・雇用保険）',
      name_vi: 'Bảo hiểm xã hội đoàn thể (BHYT, Hưu trí, Thất nghiệp)',
      name_en: 'Company Social Insurance (Health, Pension, Employment)',
      authority_ja: '日本年金機構・協会けんぽ・ハローワーク',
      authority_vi: 'Quỹ Hưu trí, Kyokai Kenpo, Cục Việc làm',
      authority_en: 'Japan Pension Service, Kyokai Kenpo, Hello Work',
      isSocialInsurance: true,
    });
  } else {
    taxes.push({
      id: 'social_insurance_national',
      name_ja: '国民健康保険・国民年金',
      name_vi: 'BHYT Quốc dân & Hưu trí Quốc dân',
      name_en: 'National Health Insurance & National Pension',
      authority_ja: '市区町村・日本年金機構',
      authority_vi: 'UBND Xã/Phường & Quỹ Hưu trí Nhật Bản',
      authority_en: 'Municipal Office & Pension Service',
      isSocialInsurance: true,
    });
  }

  // Thuế kinh doanh cá nhân (個人事業税)
  if (profile === 'sole_proprietor' || (profile === 'freelance' && (formValues.businessIncome || 0) > 2900000)) {
    taxes.push({
      id: 'enterprise_tax',
      name_ja: '個人事業税',
      name_vi: 'Thuế kinh doanh cá nhân (個人事業税)',
      name_en: 'Individual Enterprise Tax',
      authority_ja: '都道府県（都税・県税事務所）',
      authority_vi: 'Sở Thuế Tỉnh nơi đặt trụ sở kinh doanh',
      authority_en: 'Prefectural Tax Office',
      condition_ja: '事業主控除290万円を超える事業所得がある場合に発生',
      condition_vi: 'Chỉ phát sinh khi thu nhập kinh doanh vượt quá mức giảm trừ 290 vạn yên/năm',
      condition_en: 'Applies when net business income exceeds 2.9M JPY deduction',
    });
  }

  // Thuế tiêu thụ (消費税)
  const isInvoice = Boolean(formValues.isInvoiceRegistered);
  const sales = Number(formValues.businessRevenue || formValues.sales || 0);
  const baseSales = Number(formValues.basePeriodSales || 0);

  if (['sole_proprietor', 'corporate', 'freelance'].includes(profile) && (isInvoice || sales > 10000000 || baseSales > 10000000)) {
    taxes.push({
      id: 'consumption_tax',
      name_ja: '消費税及び地方消費税',
      name_vi: 'Thuế tiêu thụ (消費税 - VAT Nhật Bản)',
      name_en: 'Consumption Tax & Local Consumption Tax',
      authority_ja: '国税庁（税務署）',
      authority_vi: 'Cơ quan Thuế Quốc gia (Sở thuế)',
      authority_en: 'National Tax Agency',
      condition_ja: isInvoice ? 'インボイス登録事業者のため必須' : '基準期間売上1,000万円超',
      condition_vi: isInvoice ? 'Bắt buộc do đã đăng ký Invoice' : 'Doanh thu kỳ chuẩn trên 1,000 vạn yên',
      condition_en: isInvoice ? 'Mandatory due to invoice registration' : 'Base sales over 10M JPY',
    });
  }

  // Thuế doanh nghiệp (法人税系)
  if (profile === 'corporate') {
    taxes.push({
      id: 'corporate_tax',
      name_ja: '法人税・地方法人税・法人住民税・法人事業税',
      name_vi: 'Các loại thuế pháp nhân doanh nghiệp',
      name_en: 'Corporate Taxes (National, Local, Inhabitant, Enterprise)',
      authority_ja: '税務署・都道県税事務所・市区町村',
      authority_vi: 'Sở thuế, Sở thuế tỉnh và UBND xã/phường',
      authority_en: 'National, Prefectural, and Municipal Tax Offices',
      isRequired: true,
    });
  }

  return taxes;
}

/**
 * Chẩn đoán nhu cầu quyết toán thuế (確定申告判定)
 * Trả về 4 trạng thái: 'REQUIRED' | 'NOT_REQUIRED' | 'CONDITIONAL' | 'NEED_MORE_INFO'
 */
export function assessFilingNecessity({
  profile = 'employee',
  annualSalary = 0,
  hasYearEndAdjustment = true, // Đã làm 年末調整 ở công ty
  employersCount = 1, // Số công ty nhận lương
  sideIncomeProfit = 0, // Lợi nhuận từ việc phụ (Doanh thu - Chi phí)
  hasBusinessIncome = false,
  businessNetProfit = 0,
  isBlueReturn = false,
  hasMedicalExpensesOver100k = false, // Chi phí y tế > 10 vạn yên
  hasFurusatoNozeiOver5Cities = false, // Furusato > 5 địa phương hoặc không dùng One-stop
  isFirstYearHousingLoan = false, // Vay mua nhà năm đầu
}) {
  const salary = Number(annualSalary) || 0;
  const sideProfit = Number(sideIncomeProfit) || 0;
  const reasons_ja = [];
  const reasons_vi = [];
  const reasons_en = [];

  // 1. Đối với người kinh doanh cá thể / Freelance
  if (profile === 'sole_proprietor' || hasBusinessIncome || profile === 'freelance') {
    if (isBlueReturn) {
      return {
        status: 'REQUIRED',
        statusLabel_ja: '原則として必要',
        statusLabel_vi: 'Nguyên tắc: BẮT BUỘC PHẢI KHAI',
        statusLabel_en: 'REQUIRED IN PRINCIPLE',
        badgeColor: '#ef4444',
        reasons_ja: ['青色申告特別控除（最大65万円）の適用や損失繰越を受けるには、期限内の確定申告が必須です。'],
        reasons_vi: ['Để hưởng mức giảm trừ thuế xanh (tối đa 65 vạn yên) hoặc chuyển tiếp lỗ kinh doanh, bạn bắt buộc phải nộp quyết toán thuế đúng hạn.'],
        reasons_en: ['Filing is mandatory to claim the blue return deduction (up to 650k JPY) and loss carryovers.'],
        residentTaxNote: null,
      };
    }

    if (businessNetProfit > 480000) {
      return {
        status: 'REQUIRED',
        statusLabel_ja: '原則として必要',
        statusLabel_vi: 'Nguyên tắc: BẮT BUỘC PHẢI KHAI',
        statusLabel_en: 'REQUIRED IN PRINCIPLE',
        badgeColor: '#ef4444',
        reasons_ja: ['事業所得が基礎控除額を上回っているため、確定申告を行う義務があります。'],
        reasons_vi: ['Thu nhập kinh doanh ròng vượt quá mức giảm trừ cơ bản, bạn có nghĩa vụ phải nộp tờ khai thuế thu nhập.'],
        reasons_en: ['Net business income exceeds basic deductions, making tax filing mandatory.'],
        residentTaxNote: null,
      };
    }
  }

  // 2. Đối với người có lương (会社員 / パート)
  if (profile === 'employee' || profile === 'employee_side' || profile === 'part_time') {
    // Trường hợp lương trên 2,000万円
    if (salary > 20000000) {
      return {
        status: 'REQUIRED',
        statusLabel_ja: '原則として必要',
        statusLabel_vi: 'Nguyên tắc: BẮT BUỘC PHẢI KHAI',
        statusLabel_en: 'REQUIRED IN PRINCIPLE',
        badgeColor: '#ef4444',
        reasons_ja: ['給与収入が2,000万円を超える方は、会社で年末調整が受けられないため、確定申告が必須です。'],
        reasons_vi: ['Người có thu nhập lương trên 2,000 vạn yên không được quyết toán tại công ty, bắt buộc phải tự nộp 確定申告.'],
        reasons_en: ['Annual salary exceeds 20M JPY, which excludes you from year-end adjustment and requires filing.'],
        residentTaxNote: null,
      };
    }

    // Trường hợp nhận lương từ 2 công ty trở lên
    if (employersCount > 1) {
      reasons_ja.push('2箇所以上から給与を受け取っており、年末調整されなかった従たる給与の精算が必要です。');
      reasons_vi.push('Bạn nhận lương từ 2 công ty trở lên, cần khai thuế để tổng hợp các nguồn thu nhập chưa được quyết toán.');
      reasons_en.push('Salaries received from multiple employers require tax return filing to reconcile untaxed income.');
    }

    // Quy tắc 20 vạn yên việc phụ (副業20万円ルール)
    if (sideProfit > 200000) {
      return {
        status: 'REQUIRED',
        statusLabel_ja: '原則として必要',
        statusLabel_vi: 'Nguyên tắc: BẮT BUỘC PHẢI KHAI',
        statusLabel_en: 'REQUIRED IN PRINCIPLE',
        badgeColor: '#ef4444',
        reasons_ja: ['給与所得者で副業等の所得が年間20万円を超えているため、所得税の確定申告が必要です。'],
        reasons_vi: ['Bạn là người đi làm nhưng có lợi nhuận từ việc phụ vượt quá 20 vạn yên/năm, bắt buộc phải khai thuế thu nhập.'],
        reasons_en: ['Side income profit exceeds 200,000 JPY/year, requiring a formal income tax return.'],
        residentTaxNote: null,
      };
    }

    // Trường hợp có thể được hoàn thuế (Khấu trừ y tế, nhà ở năm đầu, Furusato)
    const hasRefundReason = hasMedicalExpensesOver100k || hasFurusatoNozeiOver5Cities || isFirstYearHousingLoan;
    if (hasRefundReason) {
      const refundReasons_ja = [];
      const refundReasons_vi = [];
      const refundReasons_en = [];

      if (hasMedicalExpensesOver100k) {
        refundReasons_ja.push('年間10万円超の医療費控除');
        refundReasons_vi.push('Khấu trừ chi phí khám chữa bệnh trên 10 vạn yên');
        refundReasons_en.push('Medical expense deduction over 100k JPY');
      }
      if (isFirstYearHousingLoan) {
        refundReasons_ja.push('住宅ローン控除の初年度適用');
        refundReasons_vi.push('Khấu trừ vay mua nhà năm đầu tiên');
        refundReasons_en.push('First-year housing loan tax credit');
      }
      if (hasFurusatoNozeiOver5Cities) {
        refundReasons_ja.push('ワンストップ特例を使わないふるさと納税');
        refundReasons_vi.push('Thuế quê hương Furusato Nozei (quyên góp trên 5 địa phương hoặc không dùng One-stop)');
        refundReasons_en.push('Furusato tax donation without one-stop exception');
      }

      return {
        status: 'CONDITIONAL',
        statusLabel_ja: '申告すると還付を受けられる可能性あり（推奨）',
        statusLabel_vi: 'Nên nộp để NHẬN HOÀN THUẾ (Khuyến khích)',
        statusLabel_en: 'FILING RECOMMENDED (TAX REFUND)',
        badgeColor: '#3b82f6',
        reasons_ja: [`以下の控除を適用して税金の還付を受けることができます: ${refundReasons_ja.join('、')}`],
        reasons_vi: [`Bạn có thể được hoàn lại tiền thuế đã nộp thừa nhờ các khoản giảm trừ: ${refundReasons_vi.join('; ')}`],
        reasons_en: [`You are eligible for tax refunds through: ${refundReasons_en.join(', ')}`],
        residentTaxNote: null,
      };
    }

    // Trường hợp việc phụ <= 20万円 nhưng đã làm 年末調整
    if (sideProfit > 0 && sideProfit <= 200000 && hasYearEndAdjustment) {
      return {
        status: 'NOT_REQUIRED',
        statusLabel_ja: '所得税は原則不要（※住民税申告は別途必要）',
        statusLabel_vi: 'Thuế thu nhập: KHÔNG CẦN KHAI (※Nhưng phải khai thuế cư trú)',
        statusLabel_en: 'NOT REQUIRED FOR INCOME TAX (※Resident Tax Filing Still Needed)',
        badgeColor: '#10b981',
        reasons_ja: [
          '本業で年末調整を受けており、かつ副業所得が20万円以下のため、税務署への「所得税の確定申告」は不要です。',
        ],
        reasons_vi: [
          'Bạn đã làm thủ tục quyết toán tại công ty chính và lợi nhuận việc phụ dưới 20 vạn yên nên được miễn nộp thuế thu nhập lên Sở thuế.',
        ],
        reasons_en: [
          'Year-end adjustment completed and side profit under 200,000 JPY: exempt from national income tax filing.',
        ],
        residentTaxNote: {
          title_ja: '【重要】お住まいの自治体への住民税申告は必要です',
          title_vi: '【QUAN TRỌNG】Vẫn phải khai thuế cư trú tại Tòa thị chính địa phương',
          title_en: '【IMPORTANT】Local municipal resident tax filing is still mandatory',
          desc_ja: '所得税の「20万円以下不要ルール」は国税のみの特例です。市区町村への住民税申告にはこの免除規定がないため、必ず役所の税務窓口で申告を行ってください。',
          desc_vi: 'Quy tắc "dưới 20 vạn yên không cần khai" chỉ áp dụng riêng cho Thuế thu nhập Quốc gia. Thuế cư trú tại địa phương KHÔNG có quy định miễn trừ này, bạn phải khai báo với Tòa thị chính để tránh bị tính phạt.',
          desc_en: 'The 200k JPY exemption applies only to national income tax. Local municipalities require a resident tax declaration for all side income regardless of amount.',
        },
      };
    }

    // Trường hợp chuẩn: 1 công ty, đã 年末調整, không có việc phụ
    if (hasYearEndAdjustment && sideProfit === 0 && employersCount === 1) {
      return {
        status: 'NOT_REQUIRED',
        statusLabel_ja: '原則として不要',
        statusLabel_vi: 'Nguyên tắc: KHÔNG CẦN PHẢI KHAI',
        statusLabel_en: 'NOT REQUIRED IN PRINCIPLE',
        badgeColor: '#10b981',
        reasons_ja: ['会社で年末調整が完了しているため、個別に確定申告を行う必要はありません。'],
        reasons_vi: ['Công ty của bạn đã hoàn thành quyết toán thuế cuối năm (年末調整), bạn không cần phải làm thêm thủ tục gì.'],
        reasons_en: ['Year-end adjustment was completed by your employer, requiring no individual tax return.'],
        residentTaxNote: null,
      };
    }
  }

  // Mặc định cần thêm thông tin
  return {
    status: 'NEED_MORE_INFO',
    statusLabel_ja: '判定には追加情報が必要',
    statusLabel_vi: 'Cần thêm thông tin để chẩn đoán chính xác',
    statusLabel_en: 'ADDITIONAL INFORMATION NEEDED',
    badgeColor: '#f59e0b',
    reasons_ja: reasons_ja.length > 0 ? reasons_ja : ['収入内訳や控除の有無を確認することで、申告要否を確定できます。'],
    reasons_vi: reasons_vi.length > 0 ? reasons_vi : ['Vui lòng cung cấp thêm thông tin chi tiết về các nguồn thu và chứng từ khấu trừ.'],
    reasons_en: reasons_en.length > 0 ? reasons_en : ['Detailed income breakdown and deduction certificates are required.'],
    residentTaxNote: null,
  };
}
