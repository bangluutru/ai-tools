/**
 * @file packages/core/src/regulatory/sourceRegistry.js
 * @description Official Source Registry dùng chung cho toàn bộ các miền pháp lý (JP, VN, etc.).
 * Quản lý các nguồn văn bản pháp quy chính thức cấp quốc gia và địa phương (Tier-1 Primary Sources),
 * tài liệu hướng dẫn giải thích (Tier-2 Explanatory Sources), loại bỏ việc hardcode URL trong rule files.
 */

/**
 * @typedef {'law' | 'regulation' | 'official-guidance' | 'official-table' | 'official-faq'} RegulatorySourceType
 * @typedef {'official-current' | 'official-proposed' | 'official-historical' | 'official-primary' | 'official-secondary' | 'deprecated'} RegulatorySourceStatus
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
  },

  // =========================================================================
  // JAPAN LIFE - FAMILY & CHILD (こども家庭庁 / 厚生労働省 / 協会けんぽ / 自治体)
  // =========================================================================
  'egov-health-insurance-act-maternity': {
    id: 'egov-health-insurance-act-maternity',
    country: 'JP',
    authority: 'e-Gov 法令検索 (厚生労働省管轄)',
    title: '健康保険法第101条（出産育児一時金）及び第102条（出産手当金）',
    url: 'https://elaws.e-gov.go.jp/document?lawid=211AC0000000070',
    sourceType: 'law',
    language: 'ja',
    lastVerifiedAt: '2026-09-10',
    status: 'official-primary',
    notes: 'Quy định pháp định về trợ cấp thai sản theo ngày (出産手当金: 2/3 lương tiêu chuẩn 12 tháng) và trợ cấp sinh con một lần (出産育児一時金).'
  },
  'kyokai-kenpo-maternity-allowance': {
    id: 'kyokai-kenpo-maternity-allowance',
    country: 'JP',
    authority: '全国健康保険協会 (協会けんぽ)',
    title: '出産手当金について（支給期間・支給額の計算方法）',
    url: 'https://www.kyoukaikenpo.or.jp/g3/sb3290/r148/',
    sourceType: 'official-guidance',
    language: 'ja',
    lastVerifiedAt: '2026-09-10',
    status: 'official-primary',
    notes: 'Hướng dẫn chi trả trợ cấp thai sản: 42 ngày trước sinh (98 ngày đa thai), 56 ngày sau sinh; quy tắc tham gia dưới 12 tháng so với mức trần bình quân toàn hiệp hội 300,000円; quy tắc khấu trừ lương khi nghỉ.'
  },
  'mhlw-childbirth-lump-sum-grant': {
    id: 'mhlw-childbirth-lump-sum-grant',
    country: 'JP',
    authority: '厚生労働省 (Ministry of Health, Labour and Welfare)',
    title: '出産育児一時金の支給額引上げ（1児につき原則50万円）',
    url: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/iryouhoken/shussan/index.html',
    sourceType: 'official-guidance',
    language: 'ja',
    lastVerifiedAt: '2026-09-10',
    status: 'official-primary',
    notes: 'Khoản hỗ trợ chi phí sinh con 500,000円 (từ 04/2023, hoặc 488,000円 nếu cơ sở y tế không tham gia chế độ bồi thường sự cố sản khoa); cơ chế chi trả trực tiếp cho bệnh viện.'
  },
  'egov-childcare-leave-act': {
    id: 'egov-childcare-leave-act',
    country: 'JP',
    authority: 'e-Gov 法令検索 (厚生労働省管轄)',
    title: '育児休業、介護休業等育児又は家族介護を行う労働者の福祉に関する法律',
    url: 'https://elaws.e-gov.go.jp/document?lawid=403AC0000000076',
    sourceType: 'law',
    language: 'ja',
    lastVerifiedAt: '2026-09-10',
    status: 'official-primary',
    notes: 'Luật Nghỉ chăm sóc con & gia đình: Quyền nghỉ chăm con đến 1 tuổi (gia hạn đến 1.5 - 2 tuổi), chế độ nghỉ chăm con sau sinh (産後パパ育休).'
  },
  'mhlw-childcare-benefit-guidelines-2026': {
    id: 'mhlw-childcare-benefit-guidelines-2026',
    country: 'JP',
    authority: '厚生労働省 (Ministry of Health, Labour and Welfare)',
    title: '育児休業等給付の概要（育児休業給付金・出生時育児休業給付金・出生後休業支援給付金・育児時短就業給付金）',
    url: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000158500.html',
    sourceType: 'official-guidance',
    language: 'ja',
    lastVerifiedAt: '2026-09-10',
    status: 'official-primary',
    notes: 'Quy chế 4 loại trợ cấp: 67% (180 ngày đầu), 50% (sau 180 ngày), trợ cấp hỗ trợ sau sinh (+13% ngày lương lên 80% lương ngày), và trợ cấp làm việc rút ngắn giờ từ 04/2025.'
  },
  'cfa-child-allowance-reform-2024': {
    id: 'cfa-child-allowance-reform-2024',
    country: 'JP',
    authority: 'こども家庭庁 (Children and Families Agency)',
    title: '児童手当制度の改正（令和6年10月分から制度拡充）',
    url: 'https://www.cfa.go.jp/policies/kokosei/jidouteate',
    sourceType: 'official-guidance',
    language: 'ja',
    lastVerifiedAt: '2026-09-10',
    status: 'official-primary',
    notes: 'Cải cách Trợ cấp Trẻ em từ tháng 10/2024: Bỏ hoàn toàn trần thu nhập; mở rộng đến hết cấp 3 (18 tuổi); mức 15,000円 (<3 tuổi), 10,000円 (3 tuổi - cấp 3), 30,000円 (con thứ 3 trở đi); đếm thứ bậc con có tính con phụ thuộc đến 22 tuổi.'
  },
  'fukuoka-city-maternal-child-portal': {
    id: 'fukuoka-city-maternal-child-portal',
    country: 'JP',
    authority: '福岡市役所 (Fukuoka City Government)',
    title: '福岡市 妊娠・出産・子育てポータル（母子健康手帳・妊婦健診助成・子ども医療費助成）',
    url: 'https://www.city.fukuoka.lg.jp/kodomo-mirai/kosodate/',
    sourceType: 'official-guidance',
    language: 'ja',
    lastVerifiedAt: '2026-09-10',
    status: 'official-primary',
    notes: 'Cổng thông tin hướng dẫn thủ tục mẹ và bé TP Fukuoka: cấp sổ mẹ con tại 7 Trung tâm y tế phúc lợi quận, phiếu khám thai 14 lần, trợ cấp y tế trẻ em.'
  },
  'chiyoda-tokyo-maternal-child-portal': {
    id: 'chiyoda-tokyo-maternal-child-portal',
    country: 'JP',
    authority: '千代田区役所 (Chiyoda City, Tokyo)',
    title: '千代田区 妊娠・出産・子育て応援事業及び子ども医療費助成',
    url: 'https://www.city.chiyoda.lg.jp/koho/kosodate/',
    sourceType: 'official-guidance',
    language: 'ja',
    lastVerifiedAt: '2026-09-10',
    status: 'official-primary',
    notes: 'Cổng thông tin thủ tục sinh và chăm sóc trẻ em Quận Chiyoda, Tokyo: trợ cấp 50,000円 khi báo thai + 50,000円 khi sinh, trợ cấp y tế trẻ em đến 18 tuổi miễn phí 100% viện phí/khám bệnh.'
  },
  'soumu-resident-basic-book-act': {
    id: 'soumu-resident-basic-book-act',
    country: 'JP',
    authority: '総務省 (Ministry of Internal Affairs and Communications)',
    title: '住民基本台帳法（転出届・転入届・転居届の法定届出義務・14日ルール）',
    url: 'https://www.soumu.go.jp/main_sosiki/jichi_gyousei/c-gyousei/juumin_kihon_daityou.html',
    sourceType: 'law',
    language: 'ja',
    lastVerifiedAt: '2026-09-11',
    status: 'official-primary',
    notes: 'Luật Sổ bộ cư trú cơ bản Nhật Bản: Nghĩa vụ nộp giấy chuyển đi (転出届) trước khi chuyển, nộp giấy chuyển vào (転入届) hoặc chuyển chỗ ở (転居届) trong vòng 14 ngày. Phạt tiền vi phạm quy định cư trú.'
  },
  'digital-agency-moving-onestop': {
    id: 'digital-agency-moving-onestop',
    country: 'JP',
    authority: 'デジタル庁 (Digital Agency Japan)',
    title: '引越しワンストップサービス（マイナポータルを通じたオンライン転出届・来庁予定連絡）',
    url: 'https://www.digital.go.jp/policies/moving_onestop_service',
    sourceType: 'official-guidance',
    language: 'ja',
    lastVerifiedAt: '2026-09-11',
    status: 'official-primary',
    notes: 'Dịch vụ một cửa chuyển nhà qua MyNaPortal: Nộp 転出届 trực tuyến và đặt lịch hẹn đến Ủy ban mới (来庁予定連絡). Chú ý: 転入届 bắt buộc phải xuất trình thẻ My Number trực tiếp tại cơ quan hành chính nơi đến.'
  },
  'mlit-standard-moving-transport-contract': {
    id: 'mlit-standard-moving-transport-contract',
    country: 'JP',
    authority: '国土交通省 (Ministry of Land, Infrastructure, Transport and Tourism)',
    title: '標準引越運送約款（引越し料金・解約手数料・荷物破損補償の公定基準）',
    url: 'https://www.mlit.go.jp/jidosha/jidosha_tk4_000007.html',
    sourceType: 'official-guidance',
    language: 'ja',
    lastVerifiedAt: '2026-09-11',
    status: 'official-primary',
    notes: 'Quy ước vận chuyển chuyển nhà tiêu chuẩn do Bộ Đất đai, Cơ sở hạ tầng, Giao thông và Du lịch ban hành: Định nghĩa cơ cấu cước phí (cước cơ bản, phụ phí, dịch vụ thực phí), phí hủy hợp đồng (trước ngày chuyển 3 ngày: miễn phí; 2 ngày: 20%; 1 ngày: 30%; trong ngày: 50%), quy định bồi thường hư hại trong 3 tháng.'
  },
  'japan-post-transfer-service': {
    id: 'japan-post-transfer-service',
    country: 'JP',
    authority: '日本郵便株式会社 (Japan Post Co., Ltd.)',
    title: 'e転居（郵便物等の転送サービス・1年間無料転送制度）',
    url: 'https://www.post.japanpost.jp/service/tenkyo/',
    sourceType: 'official-guidance',
    status: 'official-primary',
    notes: 'Dịch vụ chuyển tiếp thư từ bưu điện (e転居): Miễn phí chuyển tiếp thư từ nội địa Nhật Bản trong 1 năm kể từ ngày chuyển đi đăng ký. Chỉ áp dụng thư từ nội địa, không áp dụng chuyển tiếp ra nước ngoài.'
  },

  // =========================================================================
  // JAPAN LIFE - RESIDENCE & IMMIGRATION (出入国在留管理庁 / 法務省 / e-Gov)
  // =========================================================================
  'isa-ica-annexed-table-1': {
    id: 'isa-ica-annexed-table-1',
    country: 'JP',
    authority: '出入国在留管理庁 / e-Gov',
    title: '出入国管理及び難民認定法 別表第一（活動に基づく在留資格）',
    url: 'https://laws.e-gov.go.jp/law/326CO0000000319#Mp-At_2_2-Pr_1-It_1',
    sourceType: 'law',
    language: 'ja',
    lastVerifiedAt: '2026-09-11',
    status: 'official-current',
    notes: 'Bảng 1 Luật Nhập quản: Các tư cách lưu trú dựa trên hoạt động (Lao động, Du học, Nghiên cứu, v.v.) và phạm vi hoạt động được phép.'
  },
  'isa-ica-annexed-table-2': {
    id: 'isa-ica-annexed-table-2',
    country: 'JP',
    authority: '出入国在留管理庁 / e-Gov',
    title: '出入国管理及び難民認定法 別表第二（身分・地位に基づく在留資格）',
    url: 'https://laws.e-gov.go.jp/law/326CO0000000319#Mp-At_2_2-Pr_1-It_2',
    sourceType: 'law',
    language: 'ja',
    lastVerifiedAt: '2026-09-11',
    status: 'official-current',
    notes: 'Bảng 2 Luật Nhập quản: Tư cách lưu trú dựa trên thân phận (永住者, 日本人の配偶者等, 永住者の配偶者等, 定住者). Hoạt động lao động không bị giới hạn.'
  },
  'isa-ica-art19-work-scope': {
    id: 'isa-ica-art19-work-scope',
    country: 'JP',
    authority: '出入国在留管理庁 / e-Gov',
    title: '出入国管理及び難民認定法 第19条（活動の範囲及び資格外活動許可）',
    url: 'https://laws.e-gov.go.jp/law/326CO0000000319#Mp-At_19',
    sourceType: 'law',
    language: 'ja',
    lastVerifiedAt: '2026-09-11',
    status: 'official-current',
    notes: 'Điều 19 Luật Nhập quản: Người cư trú theo Bảng 1 không được làm việc ngoài phạm vi tư cách nếu chưa có 資格外活動許可 theo khoản 2.'
  },
  'isa-extra-activity-perm': {
    id: 'isa-extra-activity-perm',
    country: 'JP',
    authority: '出入国在留管理庁 (ISA)',
    title: '資格外活動の許可手続案内（包括許可・個別許可・風俗営業禁止）',
    url: 'https://www.moj.go.jp/isa/applications/procedures/16-8.html',
    sourceType: 'official-guidance',
    language: 'ja',
    lastVerifiedAt: '2026-09-11',
    status: 'official-current',
    notes: 'Giấy phép hoạt động ngoài tư cách (資格外活動許可): Du học & Gia đình tối đa 28h/tuần trong học kỳ. Nghiêm cấm tuyệt đối ngành nghề 風俗営業.'
  },
  'isa-ica-art21-renewal': {
    id: 'isa-ica-art21-renewal',
    country: 'JP',
    authority: '出入国在留管理庁 / e-Gov',
    title: '出入国管理及び難民認定法 第21条（在留期間の更新許可）及び特例期間',
    url: 'https://laws.e-gov.go.jp/law/326CO0000000319#Mp-At_21',
    sourceType: 'law',
    language: 'ja',
    lastVerifiedAt: '2026-09-11',
    status: 'official-current',
    notes: 'Gia hạn thời hạn lưu trú: Yêu cầu có 相当の理由. Tiếp nhận trước 3 tháng, áp dụng Đặc lệ (特例期間) tối đa 2 tháng sau ngày hết hạn chờ quyết định.'
  },
  'isa-photo-req-2026': {
    id: 'isa-photo-req-2026',
    country: 'JP',
    authority: '出入国在留管理庁 (ISA)',
    title: '出入国管理及び難民認定法施行規則改正（提出写真の規格及び1歳未満免除：令和8年6月14日施行）',
    url: 'https://www.moj.go.jp/isa/applications/procedures/photo_info.html',
    sourceType: 'regulation',
    language: 'ja',
    lastVerifiedAt: '2026-09-11',
    status: 'official-current',
    notes: 'Quy định ảnh thẻ ngoại kiều cấp từ 14/06/2026: Miễn nộp ảnh cho trẻ dưới 1 tuổi (trước đó là dưới 16 tuổi). Trẻ từ 1 tuổi trở lên bắt buộc nộp ảnh cỡ 40x30mm trong vòng 3 tháng.'
  },
  'isa-fee-schedule-2026': {
    id: 'isa-fee-schedule-2026',
    country: 'JP',
    authority: '法務省 / 出入国在留管理庁',
    title: '出入国管理及び難民認定法関係手数料令改正（令和8年10月1日施行・申請日基準）',
    url: 'https://www.moj.go.jp/isa/applications/resources/fee_revision.html',
    sourceType: 'regulation',
    language: 'ja',
    lastVerifiedAt: '2026-09-11',
    status: 'official-current',
    notes: 'Lệ phí nhập quản sửa đổi có hiệu lực từ 01/10/2026: Gia hạn/Đổi tư cách 4,000円 -> 6,000円. Áp dụng theo ngày nộp đơn (applicationDate), đơn nộp đến 30/09/2026 vẫn áp dụng 4,000円.'
  },
  'isa-ica-art19-16-notification': {
    id: 'isa-ica-art19-16-notification',
    country: 'JP',
    authority: '出入国在留管理庁 / e-Gov',
    title: '出入国管理及び難民認定法 第19条の16（所属機関等に関する届出）',
    url: 'https://laws.e-gov.go.jp/law/326CO0000000319#Mp-At_19_16',
    sourceType: 'law',
    language: 'ja',
    lastVerifiedAt: '2026-09-11',
    status: 'official-current',
    notes: 'Thông báo cơ quan trực thuộc (所属機関等に関する届出): Nghỉ việc, chuyển việc, nhập học trong vòng 14 ngày. Phạt tiền tới 20 vạn yên nếu không nộp.'
  },
  'isa-electronic-notification': {
    id: 'isa-electronic-notification',
    country: 'JP',
    authority: '出入国在留管理庁 (ISA)',
    title: '出入国在留管理庁 電子届出システム（所属機関の届出オンライン受付）',
    url: 'https://www.ens-immi.moj.go.jp/',
    sourceType: 'official-guidance',
    language: 'ja',
    lastVerifiedAt: '2026-09-11',
    status: 'official-current',
    notes: 'Hệ thống thông báo điện tử ISA: Thực hiện thông báo thay đổi cơ quan trực thuộc trực tuyến 24/7 không mất phí.'
  },
  'isa-ica-art20-change': {
    id: 'isa-ica-art20-change',
    country: 'JP',
    authority: '出入国在留管理庁 / e-Gov',
    title: '出入国管理及び難民認定法 第20条（在留資格の変更許可）',
    url: 'https://laws.e-gov.go.jp/law/326CO0000000319#Mp-At_20',
    sourceType: 'law',
    language: 'ja',
    lastVerifiedAt: '2026-09-11',
    status: 'official-current',
    notes: 'Thay đổi tư cách lưu trú (在留資格変更許可): Bắt buộc xin phép và nhận kết quả trước khi bắt đầu hoạt động của tư cách mới.'
  },
  'isa-family-stay-table': {
    id: 'isa-family-stay-table',
    country: 'JP',
    authority: '出入国在留管理庁 (ISA)',
    title: '在留資格「家族滞在」の基準及び立証資料案内',
    url: 'https://www.moj.go.jp/isa/applications/status/dependent.html',
    sourceType: 'official-guidance',
    language: 'ja',
    lastVerifiedAt: '2026-09-11',
    status: 'official-current',
    notes: 'Tiêu chuẩn tư cách 家族滞在: Chỉ áp dụng cho vợ/chồng hợp pháp và con cái phụ thuộc do người có tư cách lao động trình độ cao/chuyên môn chu cấp.'
  },
  'isa-pr-guidelines-current': {
    id: 'isa-pr-guidelines-current',
    country: 'JP',
    authority: '出入国在留管理庁 (ISA)',
    title: '永住許可に関するガイドライン（令和元年改正・現行適用版）',
    url: 'https://www.moj.go.jp/isa/publications/materials/nyukan_nyukan50.html',
    sourceType: 'official-guidance',
    language: 'ja',
    lastVerifiedAt: '2026-09-11',
    status: 'official-current',
    notes: 'Hướng dẫn xin vĩnh trú hiện hành: Cư trú 10 năm (5 năm đi làm); vợ/chồng công dân Nhật/vĩnh trú 3 năm kết hôn + 1 năm cư trú; nộp thuế và bảo hiểm/nenkin đầy đủ, đúng hạn trong 5 năm gần nhất.'
  },
  'isa-pr-proposal-2026-draft': {
    id: 'isa-pr-proposal-2026-draft',
    country: 'JP',
    authority: '出入国在留管理庁 (ISA)',
    title: '永住許可制度の見直しに係る意見公募案（パブリックコメント・未発効検討案）',
    url: 'https://public-comment.e-gov.go.jp/servlet/Public?CLASSNAME=PCMMSTDETAIL&id=020026001',
    sourceType: 'official-guidance',
    language: 'ja',
    lastVerifiedAt: '2026-09-11',
    status: 'official-proposed',
    notes: 'Dự thảo lấy ý kiến công chúng năm 2026 về sửa đổi cơ chế vĩnh trú (thu hồi vĩnh trú khi cố tình trốn thuế/nenkin). LƯU Ý: Đây là bản dự thảo, KHÔNG áp dụng như luật hiện hành.'
  },
  'isa-online-system': {
    id: 'isa-online-system',
    country: 'JP',
    authority: '出入国在留管理庁 (ISA)',
    title: '在留申請オンラインシステム（マイナンバーカード等によるオンライン申請ポータル）',
    url: 'https://www.ras-immi.moj.go.jp/',
    sourceType: 'official-guidance',
    language: 'ja',
    lastVerifiedAt: '2026-09-11',
    status: 'official-current',
    notes: 'Cổng nộp hồ sơ cư trú trực tuyến của ISA cho cá nhân có thẻ My Number hoặc tổ chức/người đại diện được ủy quyền.'
  },
  'isa-reentry-art26': {
    id: 'isa-reentry-art26',
    country: 'JP',
    authority: '出入国在留管理庁 / e-Gov',
    title: '出入国管理及び難民認定法 第26条（再入国許可）及び第26条の2（みなし再入国許可）',
    url: 'https://laws.e-gov.go.jp/law/326CO0000000319#Mp-At_26',
    sourceType: 'law',
    language: 'ja',
    lastVerifiedAt: '2026-09-11',
    status: 'official-current',
    notes: 'Quy định tái nhập cảnh: みなし再入国許可 cho người rời Nhật dưới 1 năm (đánh dấu thẻ ED tại sân bay); 再入国許可 cho chuyến đi 1-5 năm.'
  },
  'jps-lump-sum-withdrawal': {
    id: 'jps-lump-sum-withdrawal',
    country: 'JP',
    authority: '日本年金機構 (Japan Pension Service)',
    title: '短期在留外国人の脱退一時金制度（国民年金・厚生年金保険）',
    url: 'https://www.nenkin.go.jp/service/jukyu/sonota-kyufu/dattai-ichiji/20150406.html',
    sourceType: 'official-guidance',
    language: 'ja',
    lastVerifiedAt: '2026-09-11',
    status: 'official-current',
    notes: 'Tiền rút một lần hưu trí (脱退一時金): Dành cho người nước ngoài không có quốc tịch Nhật, đã đóng Nenkin từ 6 tháng trở lên, nộp đơn trong vòng 2 năm sau khi rời Nhật.'
  },
  'nta-tax-administrator': {
    id: 'nta-tax-administrator',
    country: 'JP',
    authority: '国税庁 (National Tax Agency)',
    title: '所得税法第117条（納税管理人）及び地方税法に基づく納税管理人の選任手続',
    url: 'https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/2026.htm',
    sourceType: 'official-guidance',
    language: 'ja',
    lastVerifiedAt: '2026-09-11',
    status: 'official-current',
    notes: 'Quy định về Người đại diện nộp thuế (納税管理人): Người nước ngoài xuất cảnh khỏi Nhật Bản không còn địa chỉ cư trú phải cử người cư trú tại Nhật để thay mặt nộp thuế thu nhập, thuế cư trú và xin hoàn thuế 20.42% từ Nenkin rút 1 lần.'
  }
});

export const ALLOWED_SOURCE_STATUSES = Object.freeze([
  'official-current',
  'official-proposed',
  'official-historical',
  'official-primary',
  'official-secondary',
  'deprecated',
]);

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
 * Kiểm tra xem một nguồn có đang là luật/văn bản có hiệu lực hiện hành hay không.
 * Các nguồn 'official-proposed' (dự thảo) và 'deprecated' (hết hiệu lực) trả về false.
 * @param {string} sourceId
 * @returns {boolean}
 */
export function isSourceActive(sourceId) {
  const source = getSource(sourceId);
  if (!source) return false;
  return source.status === 'official-current' || source.status === 'official-primary' || source.status === 'official-secondary';
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
  isActive: isSourceActive,
  getAll: getAllSources,
  all: OFFICIAL_SOURCE_REGISTRY,
};
