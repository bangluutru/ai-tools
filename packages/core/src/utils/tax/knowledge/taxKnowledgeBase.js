/**
 * @file packages/core/src/utils/tax/knowledge/taxKnowledgeBase.js
 * @description Kho tri thức thuế Nhật Bản 3 cấp độ (Level 1, 2, 3) hỗ trợ tam ngữ chuẩn xác (JA, VI, EN).
 * Được đối chiếu từ e-Gov Law, Thông tư Quốc thuế NTA và Bộ Tổng vụ Nhật Bản.
 */

export const TaxKnowledgeBase = {
  // 1. 所得税 (Income Tax)
  income_tax: {
    title_ja: '所得税・復興特別所得税',
    title_vi: 'Thuế Thu Nhập & Thuế Tái Thiết (所得税・復興特別所得税)',
    title_en: 'Income Tax & Reconstruction Tax',
    authority: '国税庁（税務署）',
    category: 'national',

    // Level 1: Quick Explanation
    level1: {
      ja: '1年間のすべての所得に対して国に納める直接税です。累進税率（5%〜45%）が適用され、所得が高いほど税率が高くなります。2037年までは東日本大震災復興のための復興特別所得税（基準所得税額の2.1%）が合算されます。',
      vi: 'Thuế trực thu nộp cho Nhà nước Nhật Bản dựa trên tổng thu nhập trong năm. Áp dụng biểu lũy tiến (5% đến 45%), thu nhập chịu thuế càng cao thì thuế suất càng lớn. Đến năm 2037, số thuế này được cộng thêm 2.1% thuế tái thiết sau thảm họa Đông Nhật Bản.',
      en: 'A national direct tax levied on total personal income earned in a calendar year. Calculated using progressive tax brackets ranging from 5% to 45%. A 2.1% Reconstruction Surtax is added until 2037 to support disaster recovery.',
    },

    // Level 2 Generator: In Your Case
    getLevel2(calc) {
      const { salary, employmentDeduction, employmentIncome, businessIncome, sideIncome, totalGrossIncome, deductions, taxableIncome, bracket, baseIncomeTax, reconstructionTax, totalIncomeTax } = calc.incomeTax;
      return {
        ja: [
          `① 給与・売上等の総収入: ¥${salary.toLocaleString()}（給与控除 ¥${employmentDeduction.toLocaleString()} 差引後: 給与所得 ¥${employmentIncome.toLocaleString()}）`,
          businessIncome > 0 ? `② 事業所得: ¥${businessIncome.toLocaleString()}（青色申告特別控除反映後）` : null,
          sideIncome > 0 ? `③ 副業等の雑所得: ¥${sideIncome.toLocaleString()}` : null,
          `④ 合計所得金額: ¥${totalGrossIncome.toLocaleString()} − 各種所得控除（基礎・社保等） ¥${deductions.total.toLocaleString()} = 課税所得 ¥${taxableIncome.toLocaleString()}（1,000円未満切捨て）`,
          `⑤ 適用税率: ${(bracket.rate * 100).toFixed(0)}%（控除額 ¥${bracket.deduction.toLocaleString()}） → 基準所得税額: ¥${baseIncomeTax.toLocaleString()}`,
          `⑥ 復興特別所得税（2.1%）: ¥${reconstructionTax.toLocaleString()} → 所得税合計額: ¥${totalIncomeTax.toLocaleString()}`,
        ].filter(Boolean),
        vi: [
          `① Tổng thu nhập từ lương/kinh doanh: ¥${salary.toLocaleString()} (Sau khi trừ giảm trừ lương ¥${employmentDeduction.toLocaleString()} còn: Thu nhập lương ¥${employmentIncome.toLocaleString()})`,
          businessIncome > 0 ? `② Thu nhập kinh doanh: ¥${businessIncome.toLocaleString()} (sau khi trừ chi phí & khấu trừ thuế xanh)` : null,
          sideIncome > 0 ? `③ Thu nhập việc phụ: ¥${sideIncome.toLocaleString()}` : null,
          `④ Tổng thu nhập: ¥${totalGrossIncome.toLocaleString()} − Giảm trừ gia cảnh & BHXH: ¥${deductions.total.toLocaleString()} = Thu nhập tính thuế: ¥${taxableIncome.toLocaleString()} (Làm tròn xuống 1,000円)`,
          `⑤ Bậc thuế áp dụng: ${(bracket.rate * 100).toFixed(0)}% (Khấu trừ cơ sở: ¥${bracket.deduction.toLocaleString()}) → Thuế thu nhập cơ sở: ¥${baseIncomeTax.toLocaleString()}`,
          `⑥ Thuế tái thiết (2.1%): ¥${reconstructionTax.toLocaleString()} → Tổng thuế thu nhập thực nộp: ¥${totalIncomeTax.toLocaleString()}`,
        ].filter(Boolean),
        en: [
          `① Gross Earnings: ¥${salary.toLocaleString()} (Minus Employment Deduction ¥${employmentDeduction.toLocaleString()} = Employment Income ¥${employmentIncome.toLocaleString()})`,
          businessIncome > 0 ? `② Business Net Profit: ¥${businessIncome.toLocaleString()}` : null,
          sideIncome > 0 ? `③ Miscellaneous/Side Income: ¥${sideIncome.toLocaleString()}` : null,
          `④ Total Gross Income: ¥${totalGrossIncome.toLocaleString()} − Deductions (Basic, Social, etc.): ¥${deductions.total.toLocaleString()} = Taxable Income: ¥${taxableIncome.toLocaleString()} (Floor to nearest 1,000 JPY)`,
          `⑤ Applicable Bracket: ${(bracket.rate * 100).toFixed(0)}% (Deduction: ¥${bracket.deduction.toLocaleString()}) → Base Income Tax: ¥${baseIncomeTax.toLocaleString()}`,
          `⑥ Reconstruction Tax (2.1%): ¥${reconstructionTax.toLocaleString()} → Total Income Tax: ¥${totalIncomeTax.toLocaleString()}`,
        ].filter(Boolean),
      };
    },

    // Level 3: Legal Basis & Official Links
    level3: {
      legalArticles_ja: '所得税法第89条（税率）、第28条（給与所得）、第86条（基礎控除）、東日本大震災からの復興のための施策を実施するために必要な財源の確保に関する特別措置法第8条',
      legalArticles_vi: 'Luật Thuế thu nhập Nhật Bản Điều 89 (Thuế suất), Điều 28 (Thu nhập tiền lương), Điều 86 (Giảm trừ cơ bản), và Luật biện pháp đặc biệt tài chính tái thiết Đông Nhật Bản Điều 8.',
      legalArticles_en: 'Income Tax Act Art. 89 (Tax Rates), Art. 28 (Employment Income), Art. 86 (Basic Deduction), Special Measures Act for Reconstruction Financial Resources Art. 8.',
      links: [
        { label: '国税庁: 所得税の税率・速算表 (No.2260)', url: 'https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/2260.htm' },
        { label: '国税庁: 給与所得控除 (No.1410)', url: 'https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1410.htm' },
        { label: '国税庁: 基礎控除 (No.1199)', url: 'https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1199.htm' },
        { label: 'e-Gov法令検索: 所得税法', url: 'https://laws.e-gov.go.jp/law/340AC0000000033' },
      ],
    },
  },

  // 2. 住民税 (Resident Tax)
  resident_tax: {
    title_ja: '住民税（個人住民税）',
    title_vi: 'Thuế Cư Trú (住民税 - Resident Tax)',
    title_en: 'Resident Tax (Local Inhabitant Tax)',
    authority: 'お住まいの都道府県および市区町村',
    category: 'local',

    level1: {
      ja: '毎年1月1日時点で日本国内に住所がある人が、前年の所得に応じて居住地の都道府県および市区町村に納める地方税です。所得割（原則10%）と一律負担の均等割（約5,000円）、国税の森林環境税（1,000円）で構成されます。',
      vi: 'Thuế địa phương dành cho người có đăng ký cư trú tại Nhật Bản tính đến ngày 1 tháng 1 hàng năm, nộp cho Tỉnh và Quận/Xã/Thị trấn nơi sinh sống. Gồm phần tính theo thu nhập (所得割 chuẩn 10%), phần đóng cố định (均等割 khoảng 5,000 yên) và Thuế môi trường rừng (1,000 yên).',
      en: 'A local tax paid to your prefecture and municipality where you officially reside as of January 1, based on previous calendar year income. Consists of an Income Levy (typically 10%), a Per Capita Flat Levy (~5,000 JPY), and the national Forest Environment Tax (1,000 JPY).',
    },

    getLevel2(calc) {
      const { residentTax } = calc;
      if (residentTax.isExempt) {
        return {
          ja: ['あなたのお住まいの自治体の非課税基準を満たしているため、住民税（所得割・均等割）および森林環境税はかかりません（¥0）。'],
          vi: ['Tổng thu nhập của bạn nằm dưới ngưỡng chịu thuế của địa phương, do đó bạn được miễn toàn bộ thuế cư trú và thuế môi trường rừng (¥0).'],
          en: ['Your income qualifies for municipal tax exemption; resident tax and forest environment tax are zero (¥0).'],
        };
      }
      return {
        ja: [
          `① 対象地域: ${residentTax.prefectureName_ja}`,
          `② 課税標準額: ¥${residentTax.taxableIncome.toLocaleString()}（所得税とは異なり基礎控除額等は住民税基準の43万円が適用されます）`,
          `③ 所得割額（税率 ${(residentTax.incomeLevyRate * 100).toFixed(2)}%）: 都道府県民税 ¥${residentTax.prefectureIncomeLevy.toLocaleString()} ＋ 市区町村民税 ¥${residentTax.municipalIncomeLevy.toLocaleString()} = ¥${residentTax.incomeLevy.toLocaleString()}`,
          `④ 均等割（一律負担）: ¥${residentTax.perCapitaFlat.toLocaleString()}`,
          `⑤ 森林環境税（国税・自治体代行徴収）: ¥${residentTax.forestryTax.toLocaleString()}`,
          `⑥ 住民税年間合計: ¥${residentTax.totalResidentTax.toLocaleString()}`,
        ],
        vi: [
          `① Khu vực tính thuế: ${residentTax.prefectureName_vi}`,
          `② Thu nhập chịu thuế cư trú: ¥${residentTax.taxableIncome.toLocaleString()} (Áp dụng mức giảm trừ cơ bản của thuế cư trú là 43 vạn yên)`,
          `③ Thuế tính theo thu nhập (Thuế suất ${(residentTax.incomeLevyRate * 100).toFixed(2)}%): Phần Tỉnh ¥${residentTax.prefectureIncomeLevy.toLocaleString()} ＋ Phần Xã/Phường ¥${residentTax.municipalIncomeLevy.toLocaleString()} = ¥${residentTax.incomeLevy.toLocaleString()}`,
          `④ Thuế đóng cào bằng theo đầu người (均等割): ¥${residentTax.perCapitaFlat.toLocaleString()}`,
          `⑤ Thuế môi trường rừng (森林環境税 thu từ Reiwa 6): ¥${residentTax.forestryTax.toLocaleString()}`,
          `⑥ Tổng thuế cư trú cả năm: ¥${residentTax.totalResidentTax.toLocaleString()}`,
        ],
        en: [
          `① Municipality/Prefecture: ${residentTax.prefectureName_en}`,
          `② Resident Taxable Income: ¥${residentTax.taxableIncome.toLocaleString()} (Uses resident basic deduction of 430,000 JPY)`,
          `③ Income Levy (${(residentTax.incomeLevyRate * 100).toFixed(2)}%): Prefectural ¥${residentTax.prefectureIncomeLevy.toLocaleString()} + Municipal ¥${residentTax.municipalIncomeLevy.toLocaleString()} = ¥${residentTax.incomeLevy.toLocaleString()}`,
          `④ Per Capita Flat Rate: ¥${residentTax.perCapitaFlat.toLocaleString()}`,
          `⑤ National Forest Environment Tax: ¥${residentTax.forestryTax.toLocaleString()}`,
          `⑥ Total Annual Resident Tax: ¥${residentTax.totalResidentTax.toLocaleString()}`,
        ],
      };
    },

    level3: {
      legalArticles_ja: '地方税法第24条（道府県民税の納税義務者等）、第32条（総所得金額）、第314条の3（市町村民税の所得割の税率）、第310条（均等割）、森林環境税及び森林環境譲与税に関する法律',
      legalArticles_vi: 'Luật Thuế địa phương Nhật Bản Điều 24, Điều 32, Điều 314-3 (Thuế suất thuế cư trú cấp xã/thị trấn), Điều 310, và Luật Thuế Môi trường Rừng Quốc gia.',
      legalArticles_en: 'Local Tax Act Art. 24, Art. 32, Art. 314-3 (Municipal Income Levy Tax Rates), Art. 310, and Forest Environment Tax Act.',
      links: [
        { label: '総務省: 個人住民税の概要・税率', url: 'https://www.soumu.go.jp/main_sosiki/jichi_zeisei/czaisei/czaisei_seido/150790_06.html' },
        { label: '総務省: 森林環境税及び森林環境譲与税', url: 'https://www.soumu.go.jp/main_sosiki/jichi_zeisei/czaisei/czaisei_seido/forest-environment-tax.html' },
        { label: '東京都主税局: 個人住民税', url: 'https://www.tax.metro.tokyo.lg.jp/kazei/kojin_ju.html' },
      ],
    },
  },

  // 3. 個人事業税 (Individual Enterprise Tax)
  enterprise_tax: {
    title_ja: '個人事業税',
    title_vi: 'Thuế Kinh Doanh Cá Nhân (個人事業税)',
    title_en: 'Individual Enterprise Tax',
    authority: '都道府県（都税・県税事務所）',
    category: 'prefectural',

    level1: {
      ja: '法律で定められた70種類の法定業種を営む個人事業主に対して都道府県が課税する地方税です。年間290万円の「事業主控除」があるため、控除後の事業所得に対して3%〜5%の税率が適用されます。',
      vi: 'Thuế của Tỉnh áp dụng cho cá nhân kinh doanh các ngành nghề thuộc danh mục luật định (70 ngành). Có mức giảm trừ chủ kinh doanh cố định 290 vạn yên/năm; chỉ khi thu nhập kinh doanh vượt mức này mới phải nộp từ 3% đến 5%.',
      en: 'A prefectural tax imposed on sole proprietors engaged in 70 statutorily designated business categories. Includes an annual proprietor deduction of 2.9 million JPY; net profit exceeding this threshold is taxed at 3% to 5%.',
    },

    getLevel2(calc) {
      const { enterpriseTax } = calc;
      if (!enterpriseTax || enterpriseTax.enterpriseTax === 0) {
        if (enterpriseTax?.isNonTaxableProfession) {
          return {
            ja: ['選択された職種（文筆業・翻訳家・芸術家等）は地方税法上の法定業種に含まれないため、個人事業税は非課税（¥0）です。'],
            vi: ['Ngành nghề đã chọn (Nhà văn, Họa sĩ truyện tranh, Dịch giả...) không nằm trong danh mục ngành nghề luật định nên được miễn thuế kinh doanh cá nhân (¥0).'],
            en: ['Selected occupation is exempt under statutory definitions; individual enterprise tax is zero (¥0).'],
          };
        }
        return {
          ja: [`事業所得（¥${(enterpriseTax?.rawTaxableIncome || 0).toLocaleString()}）が事業主控除額（年間¥2,900,000、稼働月数換算 ¥${(enterpriseTax?.proprietorDeduction || 2900000).toLocaleString()}）以下のため、事業税は発生しません（¥0）。`],
          vi: [`Thu nhập kinh doanh không vượt quá mức giảm trừ chủ kinh doanh 290 vạn yên/năm (tính theo số tháng hoạt động: ¥${(enterpriseTax?.proprietorDeduction || 2900000).toLocaleString()}), số thuế kinh doanh phải nộp là ¥0.`],
          en: [`Business profit is below the annual proprietor deduction of 2.9M JPY; enterprise tax is zero (¥0).`],
        };
      }

      return {
        ja: [
          `① 業種区分: ${enterpriseTax.category.name_ja}（税率: ${(enterpriseTax.rate * 100).toFixed(0)}%）`,
          `② 稼働月数: ${enterpriseTax.operatingMonths}ヶ月（事業主控除額: ¥${enterpriseTax.proprietorDeduction.toLocaleString()}）`,
          `③ 課税標準額: ¥${enterpriseTax.taxableIncome.toLocaleString()}（事業所得から控除額を差引後、1,000円未満切捨て。※青色申告特別控除は事業税の計算上は差引不可）`,
          `④ 個人事業税納付額: ¥${enterpriseTax.enterpriseTax.toLocaleString()}`,
        ],
        vi: [
          `① Phân loại ngành: ${enterpriseTax.category.name_vi} (Thuế suất: ${(enterpriseTax.rate * 100).toFixed(0)}%)`,
          `② Thời gian hoạt động: ${enterpriseTax.operatingMonths} tháng (Mức giảm trừ chủ hộ: ¥${enterpriseTax.proprietorDeduction.toLocaleString()})`,
          `③ Thu nhập tính thuế kinh doanh: ¥${enterpriseTax.taxableIncome.toLocaleString()} (Lưu ý: Mức giảm trừ thuế xanh 青色申告 không được áp dụng khi tính thuế kinh doanh)`,
          `④ Số thuế kinh doanh cá nhân phải nộp: ¥${enterpriseTax.enterpriseTax.toLocaleString()}`,
        ],
        en: [
          `① Industry Classification: ${enterpriseTax.category.name_en} (Tax Rate: ${(enterpriseTax.rate * 100).toFixed(0)}%)`,
          `② Operating Months: ${enterpriseTax.operatingMonths} months (Proprietor Deduction: ¥${enterpriseTax.proprietorDeduction.toLocaleString()})`,
          `③ Enterprise Taxable Income: ¥${enterpriseTax.taxableIncome.toLocaleString()} (Note: Blue return deduction cannot be deducted for enterprise tax)`,
          `④ Individual Enterprise Tax Payable: ¥${enterpriseTax.enterpriseTax.toLocaleString()}`,
        ],
      };
    },

    level3: {
      legalArticles_ja: '地方税法第72条（個人事業税の納税義務者等）、第72条の16（事業主控除額 290万円）、第72条の2（第一種〜第三種事業の範囲）',
      legalArticles_vi: 'Luật Thuế địa phương Nhật Bản Điều 72 (Nghĩa vụ nộp thuế kinh doanh cá nhân), Điều 72-16 (Mức giảm trừ chủ kinh doanh 290 vạn yên), Điều 72-2 (Danh mục phân loại ngành loại 1 đến loại 3).',
      legalArticles_en: 'Local Tax Act Art. 72 (Enterprise Taxpayers), Art. 72-16 (Proprietor Deduction 2.9M JPY), Art. 72-2 (Statutory Business Categories 1 to 3).',
      links: [
        { label: '東京都主税局: 個人事業税の仕組み・税率一覧', url: 'https://www.tax.metro.tokyo.lg.jp/kazei/kojin_ji.html' },
        { label: '総務省: 地方税制度 個人事業税', url: 'https://www.soumu.go.jp/main_sosiki/jichi_zeisei/czaisei/czaisei_seido/150790_08.html' },
      ],
    },
  },

  // 4. 消費税 (Consumption Tax)
  consumption_tax: {
    title_ja: '消費税及び地方消費税',
    title_vi: 'Thuế Tiêu Thụ (消費税 - VAT Nhật Bản)',
    title_en: 'Consumption Tax & Local Consumption Tax',
    authority: '国税庁（税務署）',
    category: 'national',

    level1: {
      ja: '商品やサービスの取引にかかる間接税（標準税率10%、飲食料品等の軽減税率8%）です。前々年の課税売上が1,000万円を超えるか、インボイス発行事業者に登録している場合に納税義務が発生します。',
      vi: 'Thuế gián thu đánh trên giao dịch mua bán hàng hóa và dịch vụ tại Nhật (thuế suất chuẩn 10%, thuế suất giảm trừ 8% cho đồ ăn uống). Phát sinh nghĩa vụ nộp khi doanh thu 2 năm trước vượt 1,000 vạn yên hoặc đã đăng ký cơ sở xuất hóa đơn Invoice.',
      en: 'Indirect tax on goods and services (10% standard rate, 8% reduced rate for food/groceries). Mandatory if base period sales exceed 10 million JPY or if registered as a Qualified Invoice Issuer.',
    },

    getLevel2(calc) {
      const { consumptionTax } = calc;
      if (!consumptionTax || !consumptionTax.isTaxable) {
        return {
          ja: ['前々年売上1,000万円以下かつインボイス未登録のため、消費税の納税義務はありません（免税事業者・納付額 ¥0）。'],
          vi: ['Doanh thu 2 năm trước dưới 1,000 vạn yên và chưa đăng ký Invoice, bạn là hộ kinh doanh miễn thuế tiêu thụ (Số tiền nộp: ¥0).'],
          en: ['Sales under 10M JPY without invoice registration: tax-exempt enterprise (Payable: ¥0).'],
        };
      }

      return {
        ja: [
          `① 判定理由: ${consumptionTax.reason_ja}`,
          `② 計算方式: ${consumptionTax.calcMethod === 'special_20' ? 'インボイス2割特例（売上税額の20%のみ納付）' : consumptionTax.calcMethod === 'simplified' ? '簡易課税（みなし仕入率方式）' : '本則課税（実額仕入税額控除）'}`,
          `③ 課税売上税額（10%）: ¥${consumptionTax.outputTax.toLocaleString()}`,
          `④ 仕入税額控除額: ¥${consumptionTax.inputTaxCredit.toLocaleString()}`,
          `⑤ 概算消費税納付額: ¥${consumptionTax.payableTax.toLocaleString()}`,
        ],
        vi: [
          `① Căn cứ xác định: ${consumptionTax.reason_vi}`,
          `② Phương pháp tính áp dụng: ${consumptionTax.calcMethod === 'special_20' ? 'Đặc lệ 20% Invoice (Chỉ nộp 20% thuế đầu ra)' : consumptionTax.calcMethod === 'simplified' ? 'Thuế giản dịch (Khấu trừ theo tỷ lệ danh nghĩa từng ngành)' : 'Phương pháp thông thường (Khấu trừ thuế mua vào thực tế)'}`,
          `③ Thuế tiêu thụ đầu ra (10%): ¥${consumptionTax.outputTax.toLocaleString()}`,
          `④ Tiền thuế đầu vào được khấu trừ: ¥${consumptionTax.inputTaxCredit.toLocaleString()}`,
          `⑤ Ước tính thuế tiêu thụ phải nộp: ¥${consumptionTax.payableTax.toLocaleString()}`,
        ],
        en: [
          `① Eligibility Reason: ${consumptionTax.reason_en}`,
          `② Calculation Method: ${consumptionTax.calcMethod === 'special_20' ? 'Invoice 20% Special Treatment' : consumptionTax.calcMethod === 'simplified' ? 'Simplified Tax Method (Deemed Purchase Rate)' : 'Standard Real Purchase Credit Method'}`,
          `③ Output Tax Collected (10%): ¥${consumptionTax.outputTax.toLocaleString()}`,
          `④ Input Tax Credit Deducted: ¥${consumptionTax.inputTaxCredit.toLocaleString()}`,
          `⑤ Estimated Consumption Tax Payable: ¥${consumptionTax.payableTax.toLocaleString()}`,
        ],
      };
    },

    level3: {
      legalArticles_ja: '消費税法第9条（小規模事業者の納税義務の免除）、第30条（仕入れに係る消費税額の控除）、第37条（簡易課税制度）、租税特別措置法（インボイス制度導入に伴う2割特例）',
      legalArticles_vi: 'Luật Thuế tiêu thụ Nhật Bản Điều 9 (Miễn nghĩa vụ cho hộ kinh doanh nhỏ), Điều 30 (Khấu trừ thuế mua vào), Điều 37 (Chế độ thuế giản dịch), và Luật Biện pháp Thuế đặc biệt (Quy định 2割特例).',
      legalArticles_en: 'Consumption Tax Act Art. 9 (Small Enterprise Exemption), Art. 30 (Purchase Tax Credit), Art. 37 (Simplified Tax System), and Special Taxation Measures Act for Invoice 20% Rule.',
      links: [
        { label: '国税庁: 消費税のしくみ (No.6101)', url: 'https://www.nta.go.jp/taxes/shiraberu/taxanswer/shohi/6101.htm' },
        { label: '国税庁: 簡易課税制度のみなし仕入率 (No.6505)', url: 'https://www.nta.go.jp/taxes/shiraberu/taxanswer/shohi/6505.htm' },
        { label: '国税庁: インボイス制度の負担軽減措置（2割特例）', url: 'https://www.nta.go.jp/taxes/shiraberu/zeimokubetsu/shohi/keigenzeiritsu/invoice_2wari.htm' },
      ],
    },
  },

  // 5. 法人税系 (Corporate Taxes)
  corporate_tax: {
    title_ja: '法人税・地方法人税・法人住民税・法人事業税',
    title_vi: 'Thuế Pháp Nhân Doanh Nghiệp (法人税系)',
    title_en: 'Corporate Taxes (National, Local, Inhabitant, Enterprise)',
    authority: '税務署・都道府県税事務所・市区町村',
    category: 'corporate',

    level1: {
      ja: '会社（株式会社・合同会社等）が得た所得（利益）に対して課される複数の税金の総称です。国税である法人税・地方法人税と、地方税である法人住民税・法人事業税・特別法人事業税で構成されます。中小企業の実効税率は約30%〜34%です。',
      vi: 'Tập hợp các loại thuế áp dụng trên lợi nhuận ròng của công ty tại Nhật Bản. Gồm thuế quốc gia (Thuế pháp nhân, Thuế pháp nhân địa phương nộp trung ương) và thuế địa phương (Thuế cư trú công ty, Thuế kinh doanh công ty, Thuế kinh doanh công ty đặc biệt). Thuế suất thực tế của doanh nghiệp vừa và nhỏ khoảng 30% - 34%.',
      en: 'A comprehensive suite of taxes levied on net corporate profits in Japan. Includes national corporate tax, local corporate tax, prefectural/municipal corporate inhabitant taxes, and enterprise taxes. Effective tax rate for SMEs is roughly 30% to 34%.',
    },

    getLevel2(calc) {
      const { corporateTax } = calc;
      if (!corporateTax) return { ja: [], vi: [], en: [] };

      return {
        ja: [
          `① 法人課税所得: ¥${corporateTax.taxableIncome.toLocaleString()}`,
          `② 法人税（国税・年800万以下15%、超23.2%）: ¥${corporateTax.corporateTax.toLocaleString()}`,
          `③ 地方法人税（国税・法人税額×10.3%）: ¥${corporateTax.localCorporateTax.toLocaleString()}`,
          `④ 法人住民税: 税割 ¥${corporateTax.residentIncomeLevy.toLocaleString()} ＋ 均等割（赤字でも必須） ¥${corporateTax.residentPerCapita.toLocaleString()} = ¥${corporateTax.corporateResidentTax.toLocaleString()}`,
          `⑤ 法人事業税（地方税）: ¥${corporateTax.enterpriseTax.toLocaleString()} ＋ 特別法人事業税（国税） ¥${corporateTax.specialEnterpriseTax.toLocaleString()}`,
          `⑥ 法人税関連合計: ¥${corporateTax.totalCorporateTax.toLocaleString()}（実効税率: ${(corporateTax.effectiveRate * 100).toFixed(1)}%）`,
        ],
        vi: [
          `① Lợi nhuận chịu thuế của công ty: ¥${corporateTax.taxableIncome.toLocaleString()}`,
          `② Thuế pháp nhân quốc gia (15% cho 800 vạn đầu, 23.2% phần trên): ¥${corporateTax.corporateTax.toLocaleString()}`,
          `③ Thuế pháp nhân địa phương (nộp trung ương = 10.3% thuế pháp nhân): ¥${corporateTax.localCorporateTax.toLocaleString()}`,
          `④ Thuế cư trú công ty: Phần theo thuế ¥${corporateTax.residentIncomeLevy.toLocaleString()} ＋ Phí đồng đều (均等割 kể cả lỗ vẫn nộp) ¥${corporateTax.residentPerCapita.toLocaleString()} = ¥${corporateTax.corporateResidentTax.toLocaleString()}`,
          `⑤ Thuế kinh doanh công ty: ¥${corporateTax.enterpriseTax.toLocaleString()} ＋ Thuế kinh doanh công ty đặc biệt: ¥${corporateTax.specialEnterpriseTax.toLocaleString()}`,
          `⑥ Tổng số thuế doanh nghiệp: ¥${corporateTax.totalCorporateTax.toLocaleString()} (Thuế suất thực tế: ${(corporateTax.effectiveRate * 100).toFixed(1)}%)`,
        ],
        en: [
          `① Corporate Taxable Profit: ¥${corporateTax.taxableIncome.toLocaleString()}`,
          `② National Corporate Tax (15% below 8M JPY, 23.2% above): ¥${corporateTax.corporateTax.toLocaleString()}`,
          `③ Local Corporate Tax (National surtax 10.3%): ¥${corporateTax.localCorporateTax.toLocaleString()}`,
          `④ Corporate Inhabitant Tax: Income share ¥${corporateTax.residentIncomeLevy.toLocaleString()} + Per capita flat (even with losses) ¥${corporateTax.residentPerCapita.toLocaleString()} = ¥${corporateTax.corporateResidentTax.toLocaleString()}`,
          `⑤ Corporate Enterprise Tax: ¥${corporateTax.enterpriseTax.toLocaleString()} + Special Enterprise Tax: ¥${corporateTax.specialEnterpriseTax.toLocaleString()}`,
          `⑥ Total Corporate Tax Burden: ¥${corporateTax.totalCorporateTax.toLocaleString()} (Effective Tax Rate: ${(corporateTax.effectiveRate * 100).toFixed(1)}%)`,
        ],
      };
    },

    level3: {
      legalArticles_ja: '法人税法第66条（各事業年度の所得に対する法人税の税率・中小法人の軽減税率）、地方法人税法第9条、地方税法第52条（法人住民税均等割）、第72条（法人事業税）',
      legalArticles_vi: 'Luật Thuế pháp nhân Nhật Bản Điều 66 (Thuế suất và ưu đãi thuế cho SME), Luật Thuế pháp nhân địa phương Điều 9, Luật Thuế địa phương Điều 52 (均等割) và Điều 72 (Thuế kinh doanh pháp nhân).',
      legalArticles_en: 'Corporation Tax Act Art. 66 (Tax Rates and SME Concessions), Local Corporation Tax Act Art. 9, Local Tax Act Art. 52 and Art. 72.',
      links: [
        { label: '国税庁: 法人税の税率 (No.5759)', url: 'https://www.nta.go.jp/taxes/shiraberu/taxanswer/hojin/5759.htm' },
        { label: '東京都主税局: 法人住民税・法人事業税の概要', url: 'https://www.tax.metro.tokyo.lg.jp/kazei/hojin_j.html' },
      ],
    },
  },

  // 6. 社会保険料 (Social Insurance)
  social_insurance: {
    title_ja: '社会保険料（健康保険・年金・雇用保険）',
    title_vi: 'Bảo Hiểm Xã Hội (社会保険料 - Health, Pension & Employment)',
    title_en: 'Social Insurance Premiums',
    authority: '日本年金機構・全国健康保険協会（協会けんぽ）・市区町村',
    category: 'insurance',

    level1: {
      ja: '病気やケガ、失業、高齢時の生活を支える公的保険制度です。「税金」ではありませんが、毎月の給与や事業所得から控除・納付される重要な公的負担です。会社員は労使折半、個人事業主は全額自己負担となります。',
      vi: 'Hệ thống bảo hiểm an sinh xã hội công bảo vệ khi ốm đau, thất nghiệp và hưu trí. Mặc dù KHÔNG PHẢI LÀ THUẾ, đây là nghĩa vụ tài chính bắt buộc rất lớn hàng tháng. Nhân viên công ty được công ty đóng hỗ trợ 50%, còn cá nhân tự do/hộ kinh doanh tự đóng toàn bộ qua BHYT quốc dân và Hưu trí quốc dân.',
      en: 'Public insurance systems covering health, unemployment, and retirement. While not formally classified as taxes, they represent mandatory financial contributions. Salaried employees split contributions 50/50 with employers, while self-employed individuals pay full national rates.',
    },

    getLevel2(calc) {
      const { socialInsurance } = calc;
      if (socialInsurance.isCompanyEmployee) {
        return {
          ja: [
            `① 制度区分: 会社員（社会保険・労使折半）`,
            `② 健康保険料（協会けんぽ）: ¥${socialInsurance.healthInsurance.toLocaleString()}（本人負担分。会社も同額負担）`,
            socialInsurance.careInsurance > 0 ? `③ 介護保険料（40歳以上）: ¥${socialInsurance.careInsurance.toLocaleString()}` : null,
            `④ 厚生年金保険料（折半後 9.15%）: ¥${socialInsurance.welfarePension.toLocaleString()}（会社も同額負担）`,
            `⑤ 雇用保険料（0.6%）: ¥${socialInsurance.employmentInsurance.toLocaleString()}`,
            `⑥ 年間自己負担合計: ¥${socialInsurance.totalSocialInsurance.toLocaleString()}（会社側の負担額: 約¥${socialInsurance.employerContribution.toLocaleString()}）`,
          ].filter(Boolean),
          vi: [
            `① Chế độ áp dụng: Nhân viên công ty (BHXH đoàn thể - Công ty đóng cùng 50/50)`,
            `② Bảo hiểm y tế (協会けんぽ): ¥${socialInsurance.healthInsurance.toLocaleString()} (Phần bạn đóng; công ty đóng thêm khoản tương đương)`,
            socialInsurance.careInsurance > 0 ? `③ Bảo hiểm chăm sóc người già (từ 40 tuổi trở lên): ¥${socialInsurance.careInsurance.toLocaleString()}` : null,
            `④ Hưu trí phúc lợi (厚生年金 9.15%): ¥${socialInsurance.welfarePension.toLocaleString()} (Công ty đóng cùng khoản tương đương)`,
            `⑤ Bảo hiểm thất nghiệp (雇用保険 0.6%): ¥${socialInsurance.employmentInsurance.toLocaleString()}`,
            `⑥ Tổng tiền bạn bị trừ cả năm: ¥${socialInsurance.totalSocialInsurance.toLocaleString()} (Công ty đóng thay bạn khoảng: ¥${socialInsurance.employerContribution.toLocaleString()})`,
          ].filter(Boolean),
          en: [
            `① Scheme: Corporate Employee (50/50 employer-employee contribution)`,
            `② Health Insurance (Kyokai Kenpo): ¥${socialInsurance.healthInsurance.toLocaleString()} (Your share, matched by employer)`,
            socialInsurance.careInsurance > 0 ? `③ Long-term Care Insurance (Age 40+): ¥${socialInsurance.careInsurance.toLocaleString()}` : null,
            `④ Welfare Pension Insurance (9.15%): ¥${socialInsurance.welfarePension.toLocaleString()} (Matched by employer)`,
            `⑤ Employment Insurance (0.6%): ¥${socialInsurance.employmentInsurance.toLocaleString()}`,
            `⑥ Total Annual Employee Contribution: ¥${socialInsurance.totalSocialInsurance.toLocaleString()} (Employer contributes approx: ¥${socialInsurance.employerContribution.toLocaleString()})`,
          ].filter(Boolean),
        };
      }

      return {
        ja: [
          `① 制度区分: 個人事業主・フリーランス（国民健康保険 ＋ 国民年金）`,
          `② 国民健康保険料: ¥${socialInsurance.nationalHealthInsurance.toLocaleString()}（前年の所得および自治体条例に基づき算出）`,
          `③ 国民年金保険料: ¥${socialInsurance.nationalPension.toLocaleString()}（日本年金機構の定めにより月額 ¥${Math.round(socialInsurance.nationalPension / 12).toLocaleString()}）`,
          `④ 年間自己負担合計: ¥${socialInsurance.totalSocialInsurance.toLocaleString()}`,
        ],
        vi: [
          `① Chế độ áp dụng: Cá nhân tự do / Hộ kinh doanh (BHYT Quốc dân ＋ Hưu trí Quốc dân)`,
          `② Tiền BHYT Quốc dân (国民健康保険): ¥${socialInsurance.nationalHealthInsurance.toLocaleString()} (Tính theo thu nhập năm trước và biểu phí của Tòa thị chính)`,
          `③ Tiền Hưu trí Quốc dân (国民年金): ¥${socialInsurance.nationalPension.toLocaleString()} (Cố định khoảng ¥${Math.round(socialInsurance.nationalPension / 12).toLocaleString()}/tháng)`,
          `④ Tổng tiền bảo hiểm bạn tự nộp cả năm: ¥${socialInsurance.totalSocialInsurance.toLocaleString()}`,
        ],
        en: [
          `① Scheme: Self-Employed / Freelance (National Health Insurance + National Pension)`,
          `② National Health Insurance: ¥${socialInsurance.nationalHealthInsurance.toLocaleString()} (Assessed by municipality)`,
          `③ National Pension: ¥${socialInsurance.nationalPension.toLocaleString()} (Fixed monthly premium of approx ¥${Math.round(socialInsurance.nationalPension / 12).toLocaleString()})`,
          `④ Total Annual Social Contribution: ¥${socialInsurance.totalSocialInsurance.toLocaleString()}`,
        ],
      };
    },

    level3: {
      legalArticles_ja: '健康保険法第3条・第160条、厚生年金保険法第81条（保険料率）、雇用保険法第66条、国民健康保険法、国民年金法',
      legalArticles_vi: 'Luật Bảo hiểm y tế Nhật Bản Điều 3 & Điều 160, Luật Bảo hiểm hưu trí phúc lợi Điều 81, Luật Bảo hiểm việc làm Điều 66, Luật BHYT Quốc dân và Luật Hưu trí Quốc dân.',
      legalArticles_en: 'Health Insurance Act Art. 3/160, Employees Pension Insurance Act Art. 81, Employment Insurance Act Art. 66, National Health Insurance Act, and National Pension Act.',
      links: [
        { label: '全国健康保険協会（協会けんぽ）: 都道府県毎の保険料額表', url: 'https://www.kyoukaikenpo.or.jp/g7/cat330/sb3150/' },
        { label: '日本年金機構: 厚生年金保険の保険料', url: 'https://www.nenkin.go.jp/service/kounen/hokenryo/ryogaku/ryogakuhyo/index.html' },
        { label: '厚生労働省: 雇用保険料率について', url: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000160564_00043.html' },
      ],
    },
  },
};
