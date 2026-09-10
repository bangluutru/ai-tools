/**
 * @file packages/core/src/regulatory/sourceRegistry.js
 * @description Official Source Registry dùng chung cho toàn bộ các miền pháp lý (JP, VN, etc.).
 * Quản lý các nguồn văn bản pháp quy chính thức cấp quốc gia và địa phương (Tier-1 Primary Sources),
 * tài liệu hướng dẫn giải thích (Tier-2 Explanatory Sources), loại bỏ việc hardcode URL trong rule files.
 */

/**
 * @typedef {'law' | 'regulation' | 'official-guidance' | 'official-table' | 'official-faq'} RegulatorySourceType
 * @typedef {'official-primary' | 'official-secondary' | 'deprecated'} RegulatorySourceStatus
 * @typedef {'ja' | 'vi' | 'en'} RegulatoryLanguage
 * @typedef {'JP' | 'VN'} RegulatoryCountry
 *
 * @typedef {Object} RegulatorySource
 * @property {string} id - Mã định danh nguồn duy nhất (ví dụ: 'nta-no1410-2026')
 * @property {RegulatoryCountry} country - Quốc gia ban hành ('JP' | 'VN')
 * @property {string} authority - Cơ quan ban hành (ví dụ: '国税庁', '厚生労働省', '日本年金機構')
 * @property {string} title - Tiêu đề văn bản hoặc biểu mẫu chính thức
 * @property {string} url - Đường dẫn tham chiếu chính thức (Primary URL)
 * @property {RegulatorySourceType} sourceType - Loại nguồn văn bản
 * @property {RegulatoryLanguage} language - Ngôn ngữ văn bản gốc
 * @property {string} lastVerifiedAt - Ngày kiểm chứng gần nhất (YYYY-MM-DD)
 * @property {RegulatorySourceStatus} status - Trạng thái nguồn ('official-primary' | 'official-secondary' | 'deprecated')
 * @property {string} [notes] - Ghi chú tóm tắt nội dung quy chuẩn
 */

export const OFFICIAL_SOURCE_REGISTRY = Object.freeze({
  // =========================================================================
  // JAPAN LIFE - TAX & REVENUE (国税庁 / 地方税 / 総務省)
  // =========================================================================
  'nta-no1410-2026': {
    id: 'nta-no1410-2026',
    country: 'JP',
    authority: '国税庁 (National Tax Agency)',
    title: 'No.1410 給与所得控除（令和8年分・令和9年分）',
    url: 'https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1410.htm',
    sourceType: 'official-table',
    language: 'ja',
    lastVerifiedAt: '2026-09-10',
    status: 'official-primary',
    notes: 'Biểu tính khấu trừ tiền lương 令和8・9年分: mức sàn 740,000円 (thu nhập <= 2.2M円), trần 1,950,000円 (> 8.5M円).'
  },
  'nta-no1199-2026': {
    id: 'nta-no1199-2026',
    country: 'JP',
    authority: '国税庁 (National Tax Agency)',
    title: 'No.1199 基礎控除（令和8年分・令和9年分以後）',
    url: 'https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1199.htm',
    sourceType: 'official-table',
    language: 'ja',
    lastVerifiedAt: '2026-09-10',
    status: 'official-primary',
    notes: 'Biểu khấu trừ cơ bản 令和8・9年分: 104万円 cho thu nhập <= 132万円; giảm trừ lũy tiến theo các ngưỡng 3.36M, 4.89M, 6.55M, 23.5M, 24M, 24.5M, 25M.'
  },
  'nta-no2260-brackets': {
    id: 'nta-no2260-brackets',
    country: 'JP',
    authority: '国税庁 (National Tax Agency)',
    title: 'No.2260 所得税の税率（所得税の速算表）',
    url: 'https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/2260.htm',
    sourceType: 'official-table',
    language: 'ja',
    lastVerifiedAt: '2026-09-10',
    status: 'official-primary',
    notes: 'Biểu thuế lũy tiến từng phần 7 bậc cho thuế thu nhập cá nhân (5% đến 45%).'
  },
  'nta-qa-reform-2026': {
    id: 'nta-qa-reform-2026',
    country: 'JP',
    authority: '国税庁 (National Tax Agency)',
    title: '令和8年度税制改正（所得税の基礎控除の引上げ等関係）Ｑ＆Ａ',
    url: 'https://www.nta.go.jp/users/gensen/2026kiso/pdf/0026005-024.pdf',
    sourceType: 'official-faq',
    language: 'ja',
    lastVerifiedAt: '2026-09-10',
    status: 'official-primary',
    notes: 'Hướng dẫn thi hành thuế thu nhập: hiệu lực ngày 01/12/2026, áp dụng cho kỳ tính thuế năm 2026 và quyết toán thuế cuối năm.'
  },
  'soumu-resident-tax-std': {
    id: 'soumu-resident-tax-std',
    country: 'JP',
    authority: '総務省 (Ministry of Internal Affairs and Communications)',
    title: '個人住民税の概要・税率標準（地方税法）',
    url: 'https://www.soumu.go.jp/main_sosiki/jichi_zeisei/czaisei/czaisei_seido/ichiran08/ichiran08_01.html',
    sourceType: 'law',
    language: 'ja',
    lastVerifiedAt: '2026-09-10',
    status: 'official-primary',
    notes: 'Chuẩn thuế cư trú: 所得割 10% (tỉnh 4% + xã/phường 6%), 均等割 chuẩn 5,000円/năm, 森林環境税 1,000円/năm.'
  },

  // =========================================================================
  // JAPAN LIFE - SOCIAL INSURANCE & PENSION (厚労省 / 年金機構 / 協会けんぽ)
  // =========================================================================
  'jps-national-pension-2026': {
    id: 'jps-national-pension-2026',
    country: 'JP',
    authority: '日本年金機構 (Japan Pension Service)',
    title: '令和8年度 国民年金保険料（月額 17,920円）',
    url: 'https://www.nenkin.go.jp/service/kokunen/hokenryo/default.html',
    sourceType: 'official-table',
    language: 'ja',
    lastVerifiedAt: '2026-09-10',
    status: 'official-primary',
    notes: 'Phí bảo hiểm hưu trí quốc dân 令和8年度 (áp dụng từ 01/04/2026 đến 31/03/2027): 17,920円/tháng.'
  },
  'jps-national-pension-exemption-2026': {
    id: 'jps-national-pension-exemption-2026',
    country: 'JP',
    authority: '日本年金機構 (Japan Pension Service)',
    title: '国民年金保険料の免除制度・納付猶予制度・学生納付特例',
    url: 'https://www.nenkin.go.jp/service/kokunen/menjo/index.html',
    sourceType: 'official-guidance',
    language: 'ja',
    lastVerifiedAt: '2026-09-10',
    status: 'official-primary',
    notes: 'Quy định miễn giảm phí BH Hưu trí Quốc dân: Miễn toàn bộ, 3/4, 1/2, 1/4, hoãn đóng dưới 50 tuổi và đặc lệ sinh viên. Quy tắc truy đóng (追納) trong vòng 10 năm.'
  },
  'mhlw-employment-rate-2026': {
    id: 'mhlw-employment-rate-2026',
    country: 'JP',
    authority: '厚生労働省 (Ministry of Health, Labour and Welfare)',
    title: '令和8年度 雇用保険料率のご案内',
    url: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000160564_00043.html',
    sourceType: 'official-guidance',
    language: 'ja',
    lastVerifiedAt: '2026-09-10',
    status: 'official-primary',
    notes: 'Tỷ lệ bảo hiểm thất nghiệp 令和8年度: ngành thông thường người lao động 5/1000 (0.5%), chủ sử dụng 8.5/1000, tổng 13.5/1000.'
  },
  'kyoukaikenpo-rates-2026': {
    id: 'kyoukaikenpo-rates-2026',
    country: 'JP',
    authority: '全国健康保険協会 (協会けんぽ - Japan Health Insurance Association)',
    title: '令和8年度 都道府県支部別保険料率額表',
    url: 'https://www.kyoukaikenpo.or.jp/g7/cat330/sb3150/',
    sourceType: 'official-table',
    language: 'ja',
    lastVerifiedAt: '2026-09-10',
    status: 'official-primary',
    notes: 'Tỷ lệ BHYT 47 tỉnh thành 令和8年度 (Fukuoka 10.11%, Tokyo 9.98%, v.v.), chia đôi 50/50 người lao động và chủ sử dụng.'
  },
  'cfa-child-support-2026': {
    id: 'cfa-child-support-2026',
    country: 'JP',
    authority: 'こども家庭庁 / 厚生労働省 (Children and Families Agency / MHLW)',
    title: '子ども・子育て支援金制度（令和8年4月施行・支援金率 0.23%）',
    url: 'https://www.cfa.go.jp/policies/kodomo-shienkin',
    sourceType: 'official-guidance',
    language: 'ja',
    lastVerifiedAt: '2026-09-10',
    status: 'official-primary',
    notes: 'Tiền đóng góp hỗ trợ nuôi dưỡng trẻ em toàn quốc 0.23% (chia đôi 50/50: người lao động 0.115%), áp dụng từ tháng 4/2026.'
  },
  'kyoukaikenpo-care-insurance-2026': {
    id: 'kyoukaikenpo-care-insurance-2026',
    country: 'JP',
    authority: '全国健康保険協会 (協会けんぽ - Japan Health Insurance Association)',
    title: '令和8年度 介護保険料率（全国一律 1.62%）',
    url: 'https://www.kyoukaikenpo.or.jp/g7/cat330/sb3130/',
    sourceType: 'official-table',
    language: 'ja',
    lastVerifiedAt: '2026-09-10',
    status: 'official-primary',
    notes: 'Bảo hiểm chăm sóc người già 介護保険 (đối tượng 40-64 tuổi): tỷ lệ toàn quốc 1.62% (chia đôi 50/50: người lao động 0.81%).'
  },
  'jps-welfare-pension-table-2026': {
    id: 'jps-welfare-pension-table-2026',
    country: 'JP',
    authority: '日本年金機構 (Japan Pension Service)',
    title: '厚生年金保険料額表（標準報酬月額 1〜32等級・保険料率 18.3%）',
    url: 'https://www.nenkin.go.jp/service/kounen/hokenryo/ryogaku-hyo/',
    sourceType: 'official-table',
    language: 'ja',
    lastVerifiedAt: '2026-09-10',
    status: 'official-primary',
    notes: 'Bảng bậc lương chuẩn Hưu trí phúc lợi 厚生年金 từ 88,000円 (cấp 1) đến 650,000円 (cấp 32), trần thưởng 1.5M/lần.'
  },
  'kyokai-kenpo-monthly-table-2026': {
    id: 'kyokai-kenpo-monthly-table-2026',
    country: 'JP',
    authority: '全国健康保険協会 (協会けんぽ - Japan Health Insurance Association)',
    title: '健康保険・介護保険 標準報酬月額等級表（1〜50等級）',
    url: 'https://www.kyoukaikenpo.or.jp/g7/cat330/sb3150/',
    sourceType: 'official-table',
    language: 'ja',
    lastVerifiedAt: '2026-09-10',
    status: 'official-primary',
    notes: 'Bảng bậc lương chuẩn BHYT 協会けんぽ từ 58,000円 (cấp 1) đến 1,390,000円 (cấp 50), trần thưởng 5.73M/năm.'
  },
  'kyoukaikenpo-dependent-2026': {
    id: 'kyoukaikenpo-dependent-2026',
    country: 'JP',
    authority: '全国健康保険協会 (協会けんぽ - Japan Health Insurance Association)',
    title: '健康保険 被扶養者認定基準（国内居住・年収130万円/180万円・主たる生計維持要件）',
    url: 'https://www.kyoukaikenpo.or.jp/g3/sb3200/r142/',
    sourceType: 'official-guidance',
    language: 'ja',
    lastVerifiedAt: '2026-09-10',
    status: 'official-primary',
    notes: 'Tiêu chuẩn xác định người phụ thuộc tham gia BHYT: quan hệ thân nhân 3 đời, điều kiện cư trú tại Nhật, trần thu nhập tương lai < 130 vạn (dưới 60t) hoặc < 180 vạn (trên 60t/khuyết tật), điều kiện sống chung (thu nhập < 1/2 người bảo hiểm) và sống riêng (thu nhập < tiền gửi chu cấp).'
  },
  'mhlw-shakai-hoken-tekio-2026': {
    id: 'mhlw-shakai-hoken-tekio-2026',
    country: 'JP',
    authority: '厚生労働省 / 日本年金機構 (MHLW / JPS)',
    title: '短時間労働者に対する社会保険適用拡大基準（週20時間・月額8.8万円・51人以上企業）',
    url: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyoukintou/shakaihoken_tekiyoukakudai/',
    sourceType: 'official-guidance',
    language: 'ja',
    lastVerifiedAt: '2026-09-10',
    status: 'official-primary',
    notes: 'Quy chuẩn bắt buộc tham gia BHXH cho nhân viên part-time/short-time (20h/tuần, 88,000円/tháng, công ty >= 51 người).'
  },
  'jps-dependent-eligibility-2026': {
    id: 'jps-dependent-eligibility-2026',
    country: 'JP',
    authority: '日本年金機構 / 全国健康保険協会 (JPS / Kyokai Kenpo)',
    title: '健康保険・厚生年金保険 被扶養者認定要件（年間収入130万円未満／60歳以上180万円未満）',
    url: 'https://www.nenkin.go.jp/service/kounen/tekiyo-kanyu/hihokensha-1/20141204.html',
    sourceType: 'official-guidance',
    language: 'ja',
    lastVerifiedAt: '2026-09-10',
    status: 'official-primary',
    notes: 'Quy chuẩn công nhận người phụ thuộc BHYT (thu nhập kỳ vọng < 130 vạn/năm, quan hệ nhân thân, cư trú trong nước).'
  },
  'jps-national-pension-exemption-2026': {
    id: 'jps-national-pension-exemption-2026',
    country: 'JP',
    authority: '日本年金機構 (Japan Pension Service)',
    title: '国民年金保険料の免除制度・納付猶予制度・学生納付特例',
    url: 'https://www.nenkin.go.jp/service/kokunen/menjo/index.html',
    sourceType: 'official-guidance',
    language: 'ja',
    lastVerifiedAt: '2026-09-10',
    status: 'official-primary',
    notes: 'Chế độ miễn giảm toàn bộ/bán phần (全額・一部免除), hoãn nộp thanh niên/sinh viên và cơ chế nộp bù 10 năm (追納).'
  },

  // =========================================================================
  // JAPAN LIFE - WORK & EMPLOYMENT (厚生労働省 / 労働基準法 / ハローワーク)
  // =========================================================================
  'mhlw-overtime-rates-notice': {
    id: 'mhlw-overtime-rates-notice',
    country: 'JP',
    authority: '厚生労働省 (Ministry of Health, Labour and Welfare)',
    title: '労働基準法第37条・時間外労働及び休日労働に対する割増賃金（月60時間超 50%割増・深夜・休日算定基準）',
    url: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000148322.html',
    sourceType: 'official-table',
    language: 'ja',
    lastVerifiedAt: '2026-09-10',
    status: 'official-primary',
    notes: 'Biểu tỷ lệ phụ trội luật định: ngoài giờ 25%, vượt 60h/tháng 50%, đêm 25%, ngày nghỉ 35%, ngày nghỉ+đêm 60%, >60h+đêm 75%, 7 khoản phụ cấp loại trừ khỏi cơ sở lương giờ.'
  },
  'egov-labor-standards-act-37': {
    id: 'egov-labor-standards-act-37',
    country: 'JP',
    authority: 'e-Gov 法令検索 / 厚生労働省',
    title: '労働基準法（昭和22年法律第49号）第37条（時間外、休日及び深夜の割増賃金）',
    url: 'https://elaws.e-gov.go.jp/document?lawid=322AC0000000049',
    sourceType: 'law',
    language: 'ja',
    lastVerifiedAt: '2026-09-10',
    status: 'official-primary',
    notes: 'Quy định pháp điển gốc về nghĩa vụ trả lương phụ trội ngoài giờ, ngày nghỉ, ban đêm và phương pháp xác định cơ sở lương giờ theo Luật Tiêu chuẩn Lao động Nhật Bản.'
  },
  'mhlw-paid-leave-guidelines': {
    id: 'mhlw-paid-leave-guidelines',
    country: 'JP',
    authority: '厚生労働省 (Ministry of Health, Labour and Welfare)',
    title: '年次有給休暇の付与要件・日数算定・比例付与・年5日取得義務化ガイドライン',
    url: 'https://www.mhlw.go.jp/seisakunitsuite/bunya/koyoukintou/seisaku04/',
    sourceType: 'official-guidance',
    language: 'ja',
    lastVerifiedAt: '2026-09-10',
    status: 'official-primary',
    notes: 'Tiêu chuẩn cấp phép năm: nhân viên chính thức (10-20 ngày), part-time (tỷ lệ theo ngày làm), điều kiện chuyên cần 80%, thời hiệu 2 năm và nghĩa vụ nghỉ 5 ngày/năm đối với người được cấp từ 10 ngày.'
  },
  'egov-labor-standards-act-39': {
    id: 'egov-labor-standards-act-39',
    country: 'JP',
    authority: 'e-Gov 法令検索 / 厚生労働省',
    title: '労働基準法（昭和22年法律第49号）第39条（年次有給休暇）',
    url: 'https://elaws.e-gov.go.jp/document?lawid=322AC0000000049',
    sourceType: 'law',
    language: 'ja',
    lastVerifiedAt: '2026-09-10',
    status: 'official-primary',
    notes: 'Căn cứ pháp lý Điều 39 Luật Tiêu chuẩn Lao động Nhật Bản về quyền nghỉ phép năm có lương sau 6 tháng, bảng lũy tiến theo thâm niên và thời hiệu hết hạn 2 năm theo Điều 115.'
  },
  'mhlw-hellowork-unemployment-guide': {
    id: 'mhlw-hellowork-unemployment-guide',
    country: 'JP',
    authority: '厚生労働省・ハローワーク (MHLW / Hello Work)',
    title: '雇用保険の基本手当（失業給付）受給資格・給付制限・受給期間延長手続ガイド',
    url: 'https://www.hellowork.mhlw.go.jp/insurance/insurance_basicbenefit.html',
    sourceType: 'official-guidance',
    language: 'ja',
    lastVerifiedAt: '2026-09-10',
    status: 'official-primary',
    notes: 'Tiêu chuẩn thụ hưởng trợ cấp thất nghiệp: điều kiện đóng bảo hiểm (6 tháng hoặc 12 tháng), phân loại thôi việc (công ty, lý do chính đáng, tự ý), thời gian chờ 7 ngày, thời gian hạn chế chi trả (給付制限 2 tháng) và gia hạn nhận trợ cấp tối đa 4 năm.'
  },
  'egov-employment-insurance-act': {
    id: 'egov-employment-insurance-act',
    country: 'JP',
    authority: 'e-Gov 法令検索 / 厚生労働省',
    title: '雇用保険法（昭和49年法律第116号）第13条（受給資格）、第23条、第33条（給付制限）',
    url: 'https://elaws.e-gov.go.jp/document?lawid=349AC0000000116',
    sourceType: 'law',
    language: 'ja',
    lastVerifiedAt: '2026-09-10',
    status: 'official-primary',
    notes: 'Căn cứ pháp điển gốc của Luật Bảo hiểm Việc làm Nhật Bản về điều kiện hưởng trợ cấp cơ bản (基本手当), định nghĩa người hưởng đặc định (特定受給資格者), người thôi việc có lý do đặc định (特定理由離職者) và các quy định hạn chế chi trả.'
  },
  'mhlw-basic-allowance-rates-2026': {
    id: 'mhlw-basic-allowance-rates-2026',
    country: 'JP',
    authority: '厚生労働省 (Ministry of Health, Labour and Welfare)',
    title: '雇用保険の基本手当日額の変更・賃金日額の上限・下限額算定基準（毎年8月1日改定）',
    url: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000160564_00030.html',
    sourceType: 'official-table',
    language: 'ja',
    lastVerifiedAt: '2026-09-10',
    status: 'official-primary',
    notes: 'Quy chuẩn mức trợ cấp cơ bản hàng ngày (基本手当日額), trần và sàn tiền lương ngày (賃金日額) theo độ tuổi, đường cong tỷ lệ hưởng trợ cấp 50%〜80% và bảng số ngày hưởng trợ cấp tối đa (90〜330 ngày) áp dụng từ ngày 1/8 hàng năm.'
  },
  'mhlw-resignation-procedures-guide': {
    id: 'mhlw-resignation-procedures-guide',
    country: 'JP',
    authority: '厚生労働省 / 日本年金機構 / 全国健康保険協会 (MHLW / JPS / Kyokai Kenpo)',
    title: '会社を退職したときの手続きガイド（健康保険の切り替え・国民年金・住民税・雇用保険離職票）',
    url: 'https://www.nenkin.go.jp/service/kounen/tekiyo-kanyu/hihokensha-1/20141202.html',
    sourceType: 'official-guidance',
    language: 'ja',
    lastVerifiedAt: '2026-09-10',
    status: 'official-primary',
    notes: 'Hướng dẫn tổng thể quy trình thủ tục pháp lý khi người lao động nghỉ việc tại Nhật: thời hạn thông báo 2 tuần (Dân luật Điều 627), 3 lựa chọn BHYT (tiếp tục tự nguyện 20 ngày, BHYT quốc dân 14 ngày, theo người phụ thuộc), chuyển đổi lương hưu quốc dân, khấu trừ thuế cư trú (tháng 1-5 trừ một cục vs tháng 6-12 tự nộp) và nộp đơn Hello Work.'
  },

  // =========================================================================
  // VIETNAM LIFE - TAX & SOCIAL INSURANCE (Tổng cục Thuế / BHXH Việt Nam)
  // =========================================================================
  'gdt-pit-law-2026': {
    id: 'gdt-pit-law-2026',
    country: 'VN',
    authority: 'Tổng cục Thuế / Bộ Tài chính (GDT / MOF Vietnam)',
    title: 'Luật Thuế Thu nhập cá nhân & Biểu thuế lũy tiến từng phần',
    url: 'https://www.gdt.gov.vn',
    sourceType: 'law',
    language: 'vi',
    lastVerifiedAt: '2026-09-10',
    status: 'official-primary',
    notes: 'Quy định thuế TNCN, biểu thuế lũy tiến từng phần và mức giảm trừ gia cảnh.'
  },
  'vss-social-insurance-2026': {
    id: 'vss-social-insurance-2026',
    country: 'VN',
    authority: 'Bảo hiểm Xã hội Việt Nam (Vietnam Social Security)',
    title: 'Luật Bảo hiểm xã hội & Tỷ lệ trích nộp BHXH, BHYT, BHTN 2026',
    url: 'https://baohiemxahoi.gov.vn',
    sourceType: 'law',
    language: 'vi',
    lastVerifiedAt: '2026-09-10',
    status: 'official-primary',
    notes: 'Tỷ lệ trích nộp BHXH (8%), BHYT (1.5%), BHTN (1%) và mức trần tiền lương đóng bảo hiểm.'
  }
});

/**
 * Tra cứu thông tin nguồn chính thức theo id.
 * @param {string} sourceId - ID của nguồn
 * @returns {RegulatorySource|null} Object nguồn hoặc null nếu không tìm thấy
 */
export function getSource(sourceId) {
  if (!sourceId) return null;
  return OFFICIAL_SOURCE_REGISTRY[sourceId] || null;
}

/**
 * Kiểm tra xem một sourceId có tồn tại trong registry chính thức không.
 * @param {string} sourceId
 * @returns {boolean}
 */
export function hasSource(sourceId) {
  return Boolean(sourceId && OFFICIAL_SOURCE_REGISTRY[sourceId]);
}

/**
 * Lấy danh sách tất cả các nguồn theo quốc gia hoặc trạng thái.
 * @param {Object} [filter]
 * @param {RegulatoryCountry} [filter.country]
 * @param {RegulatorySourceStatus} [filter.status]
 * @returns {RegulatorySource[]}
 */
export function getAllSources(filter = {}) {
  const sources = Object.values(OFFICIAL_SOURCE_REGISTRY);
  return sources.filter((s) => {
    if (filter.country && s.country !== filter.country) return false;
    if (filter.status && s.status !== filter.status) return false;
    return true;
  });
}

export const OfficialSourceRegistry = {
  get: getSource,
  has: hasSource,
  getAll: getAllSources,
  all: OFFICIAL_SOURCE_REGISTRY,
};
