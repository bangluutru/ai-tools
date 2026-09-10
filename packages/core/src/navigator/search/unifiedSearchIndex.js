/**
 * @file packages/core/src/navigator/search/unifiedSearchIndex.js
 * @description
 * Unified Search Index for Japan Life Navigator.
 * Aggregates 5 distinct entity types:
 * 1. Tools (Miniapps in Toolio)
 * 2. Capabilities (Semantic capabilities in Capability Registry)
 * 3. Life Events (Canonical cross-domain life events)
 * 4. Procedures (Statutory administrative procedures)
 * 5. Documents (Official certificates and administrative documents)
 */

import { getAllCapabilities } from '../capabilityGraph/capabilityResolver.js';
import { getAllLifeEvents } from '../lifeEvents/lifeEventRegistry.js';
import { CANONICAL_PROCEDURES } from '../../documents/registry/procedureRegistry.js';
import { CANONICAL_DOCUMENTS } from '../../documents/registry/documentRegistry.js';

export const ENTITY_TYPES = {
  TOOL: 'tool',
  CAPABILITY: 'capability',
  LIFE_EVENT: 'life_event',
  PROCEDURE: 'procedure',
  DOCUMENT: 'document',
};

/**
 * Danh mục các công cụ chuẩn hóa thuộc hệ thống Toolio (Japan Life & Common Tools)
 */
export const CANONICAL_TOOLS = [
  {
    id: 'japan-tax-simulator',
    title: {
      vi: 'Mô phỏng Thuế Thu nhập & Cư trú Nhật Bản',
      ja: '所得税・住民税シミュレーター',
      en: 'Japan Income & Resident Tax Simulator',
    },
    description: {
      vi: 'Tính thuế thu nhập, thuế cư trú, bảo hiểm xã hội và khấu trừ gia cảnh chuẩn 2026',
      ja: '2026年最新基準に基づく所得税・住民税・社会保険料・扶養控除の精密試算',
      en: 'Calculate Japan income tax, resident tax, social insurance, and allowances',
    },
    category: 'tax',
    keywords: ['thue nhat', 'tinh thue', 'japan tax', 'income tax', 'resident tax', '所得税', '住民税', '確定申告', '源泉徴収', 'furusato nozei'],
    aliases: ['japan-tax', 'thue thu nhap nhat ban', 'thue cu tru', 'shotokuzei', 'juminzei'],
    link: '#/tools/japan-tax-simulator',
  },
  {
    id: 'social-insurance-jp',
    title: {
      vi: 'Tính Bảo hiểm Xã hội Nhật Bản',
      ja: '社会保険料計算シミュレーター',
      en: 'Japan Social Insurance Calculator',
    },
    description: {
      vi: 'Tính chi tiết phí bảo hiểm y tế (Kenpo), lương hưu (Kosei Nenkin) và bảo hiểm thất nghiệp',
      ja: '健康保険料・厚生年金保険料・雇用保険料の給与控除額を精密計算',
      en: 'Calculate health insurance, employees pension, and employment insurance premiums',
    },
    category: 'insurance',
    keywords: ['shakai hoken', 'bao hiem xa hoi', 'kenpo', 'kosei nenkin', 'koyo hoken', '社会保険', '健康保険', '厚生年金'],
    aliases: ['bao hiem', 'tinh bao hiem nhat', 'kenko hoken', 'nenkin'],
    link: '#/tools/social-insurance-jp',
  },
  {
    id: 'social-insurance-eligibility-jp',
    title: {
      vi: 'Kiểm tra Điều kiện Tham gia BHXH',
      ja: '社会保険適用要件チェッカー',
      en: 'Social Insurance Eligibility Checker',
    },
    description: {
      vi: 'Kiểm tra điều kiện tham gia bảo hiểm xã hội bắt buộc theo tiêu chuẩn thời gian và mức lương',
      ja: '週所定労働時間・月額賃金等に基づく社会保険の強制加入要件を判定',
      en: 'Check mandatory social insurance enrollment criteria based on hours and salary',
    },
    category: 'insurance',
    keywords: ['dieu kien bhxh', '20 gio', '88000 yen', '適用要件', 'パート社会保険', 'shakai hoken check'],
    aliases: ['kiem tra bhxh', 'shakai hoken tekiyo'],
    link: '#/tools/social-insurance-eligibility-jp',
  },
  {
    id: 'national-pension-jp',
    title: {
      vi: 'Hướng dẫn Lương hưu Quốc dân (Kokumin Nenkin)',
      ja: '国民年金ガイド・免除猶予チェッカー',
      en: 'Japan National Pension & Exemption Guide',
    },
    description: {
      vi: 'Hướng dẫn đóng lương hưu quốc dân, thủ tục xin miễn giảm hoặc hoãn nộp hợp pháp',
      ja: '国民年金第1号被保険者の保険料納付、免除・納付猶予申請手続きの確認',
      en: 'Guide to National Pension Category 1 payment and statutory exemption procedures',
    },
    category: 'insurance',
    keywords: ['luong huu quoc dan', 'mien giam nenkin', 'kokumin nenkin', 'menjo', '国民年金', '免除申請', '学生納付特例'],
    aliases: ['nenkin quoc dan', 'xin mien nenkin', 'nenkin exemption'],
    link: '#/tools/national-pension-jp',
  },
  {
    id: 'dependent-insurance-jp',
    title: {
      vi: 'Bức tường Thuế & Bảo hiểm Người phụ thuộc',
      ja: '年収の壁・扶養判定シミュレーター',
      en: 'Dependent Tax & Insurance Barrier Simulator',
    },
    description: {
      vi: 'Phân tích các mốc giới hạn thu nhập 103 man, 106 man, 130 man để tối ưu bảo hiểm và thuế',
      ja: '103万・106万・130万・150万の年収の壁と手取り逆転現象を検証',
      en: 'Simulate 1.03M, 1.06M, 1.30M income barriers for dependents in Japan',
    },
    category: 'insurance',
    keywords: ['buc tuong thue', '103 man', '106 man', '130 man', 'fuyo', 'nguoi phu thuoc', '扶養控除', '年収の壁'],
    aliases: ['103 man', '130 man', 'phu thuoc thue', 'nenshu no kabe'],
    link: '#/tools/dependent-insurance-jp',
  },
  {
    id: 'overtime-calculator-jp',
    title: {
      vi: 'Tính Lương Làm thêm giờ & Thỏa ước 36',
      ja: '残業代・36協定限度チェッカー',
      en: 'Overtime Pay & Article 36 Checker',
    },
    description: {
      vi: 'Tính lương ngoài giờ theo hệ số 125%, 135%, 150% và đối chiếu hạn mức Thỏa ước 36',
      ja: '割増賃金率（25%・35%・50%）と36協定の時間外労働上限規制をチェック',
      en: 'Calculate overtime premium pay and verify statutory Article 36 overtime limits',
    },
    category: 'employment',
    keywords: ['luong lam them', 'tang ca', '36 kyotei', 'zangyo', 'thoa uoc 36', '残業代', '36協定', '時間外労働'],
    aliases: ['tinh gio tang ca', 'zangyodai', 'luong ngoai gio'],
    link: '#/tools/overtime-calculator-jp',
  },
  {
    id: 'paid-leave-checker-jp',
    title: {
      vi: 'Tra cứu Ngày Nghỉ phép năm (Yūkyū)',
      ja: '年次有給休暇付与日数チェッカー',
      en: 'Annual Paid Leave (Yukyu) Checker',
    },
    description: {
      vi: 'Tính số ngày phép năm được cấp theo thâm niên làm việc và tỷ lệ đi làm theo Luật Lao động',
      ja: '勤続年数と出勤率に基づく法定年次有給休暇の付与日数と取得義務を判定',
      en: 'Calculate statutory annual paid leave days granted based on tenure and attendance',
    },
    category: 'employment',
    keywords: ['nghi phep', 'yukyu', 'ngay phep', 'phep nam', '有給休暇', '年休', 'yukyu kyuka'],
    aliases: ['ngay nghi co luong', 'phep nam nhat ban'],
    link: '#/tools/paid-leave-checker-jp',
  },
  {
    id: 'unemployment-eligibility-jp',
    title: {
      vi: 'Kiểm tra Điều kiện Hưởng Trợ cấp Thất nghiệp',
      ja: '失業保険（基本手当）受給資格判定',
      en: 'Unemployment Benefit Eligibility Checker',
    },
    description: {
      vi: 'Xác định điều kiện nhận trợ cấp thất nghiệp theo lý do nghỉ việc (chủ động hoặc bị sa thải)',
      ja: '自己都合・会社都合・特定理由離職者の受給要件および被保険者期間を判定',
      en: 'Check eligibility criteria for unemployment benefits based on separation reason',
    },
    category: 'employment',
    keywords: ['that nghiep', 'tro cap that nghiep', 'dieu kien that nghiep', 'hello work', '失業保険', '基本手当', '離職票'],
    aliases: ['shitsugyo hoken', 'tro cap nghi viec'],
    link: '#/tools/unemployment-eligibility-jp',
  },
  {
    id: 'unemployment-benefit-jp',
    title: {
      vi: 'Tính Mức Trợ cấp Thất nghiệp (Kihon Teate)',
      ja: '失業給付金（基本手当日額）シミュレーター',
      en: 'Unemployment Benefit Amount Calculator',
    },
    description: {
      vi: 'Tính số tiền trợ cấp thất nghiệp hàng ngày, tổng số ngày nhận và lịch chi trả từ Hello Work',
      ja: '賃金日額・年齢・勤続年数に基づく基本手当日額および給付日数を試算',
      en: 'Calculate daily basic allowance amount and total benefit days from Hello Work',
    },
    category: 'employment',
    keywords: ['tinh tien that nghiep', 'so tien that nghiep', 'kihon teate', 'hello work', '失業給付', '基本手当日額'],
    aliases: ['tinh tro cap that nghiep', 'shitsugyo kyufu'],
    link: '#/tools/unemployment-benefit-jp',
  },
  {
    id: 'leaving-job-wizard-jp',
    title: {
      vi: 'Trợ lý Thủ tục Nghỉ việc Toàn diện',
      ja: '退職手続き総合ナビゲーター',
      en: 'Comprehensive Leaving Job Navigator',
    },
    description: {
      vi: 'Toàn bộ lộ trình giấy tờ, bảo hiểm, lương hưu, thuế cư trú và thị thực khi thôi việc',
      ja: '退職時の雇用保険・健康保険切替・年金種別変更・住民税徴収・在留資格の届出を一括案内',
      en: 'Step-by-step roadmap for insurance, pension, resident tax, and visa upon leaving employment',
    },
    category: 'employment',
    keywords: ['nghi viec', 'thoi viec', 'chuyen viec', 'taishoku', 'giay to nghi viec', 'rishokuhyo', '退職手続き', '離職'],
    aliases: ['thu tuc nghi viec', 'taishoku navi', 'quy trinh nghi viec'],
    link: '#/tools/leaving-job-wizard-jp',
  },
  {
    id: 'maternity-allowance-jp',
    title: {
      vi: 'Trợ cấp Thai sản & Tiền sinh con (Shussan Teate)',
      ja: '出産手当金・出産育児一時金シミュレーター',
      en: 'Maternity Allowance & Childbirth Lump-sum',
    },
    description: {
      vi: 'Tính trợ cấp thai sản 2/3 lương và khoản trợ cấp sinh con trọn gói 500,000 yên',
      ja: '産前産後休業期間の出産手当金（標準報酬日額の3分之2）および出産育児一時金（50万円）を計算',
      en: 'Estimate maternity allowance (2/3 salary) and childbirth lump-sum (500,000 JPY)',
    },
    category: 'family',
    keywords: ['thai san', 'sinh con', 'tro cap thai san', '50 man', 'shussan teate', '出産手当金', '出産育児一時金'],
    aliases: ['tro cap sinh con', 'tien de nhat ban'],
    link: '#/tools/maternity-allowance-jp',
  },
  {
    id: 'childcare-leave-eligibility-jp',
    title: {
      vi: 'Kiểm tra Điều kiện Nghỉ chăm con (Ikukyu)',
      ja: '育児休業取得要件チェッカー',
      en: 'Childcare Leave Eligibility Checker',
    },
    description: {
      vi: 'Kiểm tra quyền được nghỉ việc chăm con theo Luật Bình đẳng Giới và thời gian đóng bảo hiểm',
      ja: '有期雇用・無期雇用の育児休業取得要件と産後パパ育休の適用判定',
      en: 'Verify eligibility for childcare leave and post-birth parental leave (Papa Ikukyu)',
    },
    category: 'family',
    keywords: ['nghi cham con', 'ikukyu', 'papa ikukyu', 'dieu kien cham con', '育児休業', '産後パパ育休'],
    aliases: ['nghi de cham con', 'ikuji kyugyo'],
    link: '#/tools/childcare-leave-eligibility-jp',
  },
  {
    id: 'childcare-benefit-jp',
    title: {
      vi: 'Tính Trợ cấp Chăm con (Ikuji Kyūfukin)',
      ja: '育児休業給付金シミュレーター',
      en: 'Childcare Leave Benefit Calculator',
    },
    description: {
      vi: 'Tính số tiền trợ cấp nhận được trong kỳ nghỉ chăm con (67% trong 180 ngày đầu, sau đó 50%)',
      ja: '育児休業中の給付金額（当初180日67%、以降50%・社会保険料免除・非課税）を試算',
      en: 'Estimate childcare leave benefit amounts (67% for first 180 days, then 50%)',
    },
    category: 'family',
    keywords: ['tro cap cham con', 'ikuji kyufukin', 'tien nghi cham con', '育児休業給付金', '給付金計算'],
    aliases: ['tro cap ikukyu', 'tinh tien ikukyu'],
    link: '#/tools/childcare-benefit-jp',
  },
  {
    id: 'child-allowance-jp',
    title: {
      vi: 'Trợ cấp Nuôi con (Jidō Teate) 2026',
      ja: '児童手当シミュレーター（2026年拡充版）',
      en: 'Japan Child Allowance (Jido Teate) 2026',
    },
    description: {
      vi: 'Tính mức trợ cấp nuôi con hàng tháng theo chính sách mở rộng đến hết cấp 3 (18 tuổi) không giới hạn thu nhập',
      ja: '高校生年代（18歳到達後最初の年度末）まで拡充・所得制限撤廃・第3子3万円加算に対応した試算',
      en: 'Calculate monthly child allowance under the expanded 2026 rules up to age 18',
    },
    category: 'family',
    keywords: ['jido teate', 'tro cap nuoi con', 'tro cap tre em', 'tro cap 2026', '児童手当', '高校生無償化'],
    aliases: ['tien nuoi con', 'tro cap con nho nhat ban'],
    link: '#/tools/child-allowance-jp',
  },
  {
    id: 'birth-wizard-jp',
    title: {
      vi: 'Trợ lý Thủ tục Sinh con Trọn gói',
      ja: '出産手続き総合ナビゲーター',
      en: 'Childbirth Procedures Navigator',
    },
    description: {
      vi: 'Lộ trình hành chính trước và sau sinh: Giấy khai sinh, nhập hộ khẩu, thẻ bảo hiểm, Jido Teate, visa bé',
      ja: '出生届・健康保険加入・乳幼児医療費助成・児童手当・在留資格取得までの一括手続きガイド',
      en: 'Comprehensive timeline for birth certificate, health insurance, subsidies, and infant visa in Japan',
    },
    category: 'family',
    keywords: ['thu tuc sinh con', 'de con o nhat', 'khai sinh', 'shusseitodoke', 'visa cho con', '出生届', '出産ナビ'],
    aliases: ['quy trinh sinh con', 'thu tuc khai sinh o nhat'],
    link: '#/tools/birth-wizard-jp',
  },
  {
    id: 'moving-cost-jp',
    title: {
      vi: 'Dự toán Chi phí Chuyển nhà Nhật Bản',
      ja: '引越し初期費用・相場シミュレーター',
      en: 'Japan Moving Cost Estimator',
    },
    description: {
      vi: 'Dự toán tiền đầu vào thuê nhà (tiền cọc Shikikin, tiền lễ Reikin, phí môi giới, cước vận chuyển)',
      ja: '敷金・礼金・仲介手数料・前家賃・引越し便料金を含む引越し総費用の概算算出',
      en: 'Estimate moving expenses, deposit (shikikin), key money (reikin), and agency fees',
    },
    category: 'housing',
    keywords: ['chi phi chuyen nha', 'thue nha o nhat', 'shikikin', 'reikin', 'tien le tien coc', '引越し費用', '敷金礼金'],
    aliases: ['tinh tien chuyen nha', 'hikkoshi hiyou'],
    link: '#/tools/moving-cost-jp',
  },
  {
    id: 'moving-admin-checker-jp',
    title: {
      vi: 'Kiểm tra Thủ tục Hành chính Chuyển nhà',
      ja: '引越し行政手続きチェッカー',
      en: 'Moving Administrative Procedures Checker',
    },
    description: {
      vi: 'Kiểm tra hồ sơ chuyển đi (Tenshutsu), chuyển đến (Tennyu) hoặc đổi địa chỉ cùng quận (Tenkyo)',
      ja: '同一市区町村内の転居届、他市区町村への転出届・転入届の必要書類と期限を判定',
      en: 'Check requirements and deadlines for Moving-Out (Tenshutsu) and Moving-In (Tennyu) notices',
    },
    category: 'housing',
    keywords: ['tenshutsu', 'tennyu', 'giay chuyen nha', 'chuyen khau', 'doi dia chi', '転出届', '転入届', '転居届'],
    aliases: ['thu tuc chuyen nha', 'giay cat khau nhat ban'],
    link: '#/tools/moving-admin-checker-jp',
  },
  {
    id: 'address-change-checklist-jp',
    title: {
      vi: 'Danh mục Đổi Địa chỉ Khi Chuyển nhà',
      ja: '引越し住所変更チェックリスト',
      en: 'Address Change Checklist for Japan Moving',
    },
    description: {
      vi: 'Danh mục việc cần làm: Thẻ cư trú, My Number, bưu điện chuyển phát tiếp, ngân hàng, thẻ tín dụng',
      ja: '在留カード・マイナンバー・郵便転送・銀行・クレジットカード・ライフラインの住所変更一覧',
      en: 'Checklist for address changes: residence card, My Number, mail forwarding, banks, utilities',
    },
    category: 'housing',
    keywords: ['checklist doi dia chi', 'doi dia chi the ngoai kieu', 'chuyen phat buu dien', '住所変更', '郵便転送'],
    aliases: ['danh sach doi dia chi', 'address checklist'],
    link: '#/tools/address-change-checklist-jp',
  },
  {
    id: 'moving-wizard-jp',
    title: {
      vi: 'Trợ lý Chuyển nhà Toàn diện Nhật Bản',
      ja: '引越し総合手続きナビゲーター',
      en: 'Complete Japan Moving Navigator',
    },
    description: {
      vi: 'Quy trình chuyển nhà trọn gói: Trước khi chuyển 14 ngày, ngày chuyển nhà và 14 ngày sau khi chuyển',
      ja: '引越し前14日・引越し当日・引越し後14日の行政手続きとライフライン切替を完全ガイド',
      en: 'End-to-end relocation guide covering procedures 14 days before, moving day, and 14 days after',
    },
    category: 'housing',
    keywords: ['huong dan chuyen nha', 'quy trinh chuyen nha', 'hikkoshi navi', '引越し手続き', '引越しナビ'],
    aliases: ['tro ly chuyen nha', 'moving wizard'],
    link: '#/tools/moving-wizard-jp',
  },
  {
    id: 'work-scope-checker-jp',
    title: {
      vi: 'Kiểm tra Phạm vi Hoạt động Tư cách Lưu trú',
      ja: '就労資格・資格外活動範囲チェッカー',
      en: 'Immigration Work Scope & Permit Checker',
    },
    description: {
      vi: 'Kiểm tra tính hợp pháp của công việc làm thêm, nghề tay trái (fukugyo) hoặc giấy phép làm ngoài giờ',
      ja: '在留資格に基づく就労可能職種・制限、資格外活動許可（週28時間）の遵守状況をチェック',
      en: 'Verify permitted employment activities, side jobs, and 28-hour part-time work permits',
    },
    category: 'residence',
    keywords: ['pham vi cong viec', 'lam them 28 gio', 'shikakugai', 'fukugyo', '資格外活動許可', '就労資格'],
    aliases: ['lam them o nhat', 'kiem tra visa di lam'],
    link: '#/tools/work-scope-checker-jp',
  },
  {
    id: 'residence-renewal-guide-jp',
    title: {
      vi: 'Hướng dẫn Gia hạn Tư cách Lưu trú (Gia hạn Visa)',
      ja: '在留期間更新許可申請ガイド',
      en: 'Japan Residence Status Renewal Guide (Visa Extension)',
    },
    description: {
      vi: 'Hướng dẫn chuẩn bị hồ sơ gia hạn visa trước 3 tháng: Thuế, bảo hiểm, công ty bảo lãnh và thời hạn xét duyệt',
      ja: '満了3か月前からの申請手順、課税・納税証明書、所属機関提出書類の準備ガイド',
      en: 'Prepare visa extension documents 3 months prior: tax certificates, sponsor docs, deadlines',
    },
    category: 'residence',
    keywords: ['gia han visa', 'gia han the cu tru', 'visa renewal', 'koshin', '在留期間更新', 'ビザ更新'],
    aliases: ['thu tuc gia han visa', 'gia han visa nhat'],
    link: '#/tools/residence-renewal-guide-jp',
  },
  {
    id: 'affiliation-change-checker-jp',
    title: {
      vi: 'Khai báo Chuyển Nơi Làm việc Nyūkan (14 Ngày)',
      ja: '所属機関等に関する届出チェッカー（14日以内）',
      en: 'Immigration Organization Change Notification (14 Days)',
    },
    description: {
      vi: 'Kiểm tra nghĩa vụ nộp đơn thông báo cho Cục Xuất nhập cảnh trong vòng 14 ngày khi chuyển công ty',
      ja: '転職・退職後14日以内の出入国在留管理庁への届出義務とオンライン申請手順を判定',
      en: 'Verify mandatory statutory 14-day notification to Immigration upon employer change',
    },
    category: 'residence',
    keywords: ['thong bao nyukan', 'chuyen cong ty 14 ngay', 'khai bao xuat nhap canh', '所属機関の届出', '入管届出'],
    aliases: ['khai bao nyukan 14 ngay', 'affiliation notification'],
    link: '#/tools/affiliation-change-checker-jp',
  },
  {
    id: 'status-change-guide-jp',
    title: {
      vi: 'Hướng dẫn Đổi Tư cách Lưu trú (Đổi Visa)',
      ja: '在留資格変更許可申請ガイド',
      en: 'Change of Residence Status Guide',
    },
    description: {
      vi: 'Hướng dẫn chuyển đổi loại visa (du học sang đi làm, kỹ sư sang kinh doanh, kết hôn với người Nhật/Vĩnh trú)',
      ja: '留学から就労、就労から経営管理、配偶者ビザへの変更要件と必要書類を案内',
      en: 'Requirements and documents for changing residence status (student to work, spouse, etc.)',
    },
    category: 'residence',
    keywords: ['doi visa', 'chuyen visa', 'du hoc sang di lam', 'henko', '在留資格変更', 'ビザ変更'],
    aliases: ['thu tuc doi visa', 'status change guide'],
    link: '#/tools/status-change-guide-jp',
  },
  {
    id: 'family-immigration-guide-jp',
    title: {
      vi: 'Hướng dẫn Bảo lãnh Visa Gia đình (Kazoku Taizai / COE)',
      ja: '家族滞在ビザ・在留資格認定証明書（COE）申請ガイド',
      en: 'Family Dependent Visa & COE Application Guide',
    },
    description: {
      vi: 'Điều kiện thu nhập và hồ sơ xin Giấy chứng nhận Tư cách Lưu trú (COE) đón vợ/chồng, con sang Nhật',
      ja: '扶養者の収入要件、身元保証、在留資格認定証明書交付申請（COE）の手続きを解説',
      en: 'Income criteria and Certificate of Eligibility (COE) process for bringing dependents to Japan',
    },
    category: 'residence',
    keywords: ['bao lanh vo chong', 'bao lanh con', 'kazoku taizai', 'xin coe', 'coe nhat ban', '家族滞在', 'COE申請'],
    aliases: ['bao lanh nguoi nha', 'visa gia dinh nhat ban'],
    link: '#/tools/family-immigration-guide-jp',
  },
  {
    id: 'pr-readiness-checker-jp',
    title: {
      vi: 'Đánh giá Điều kiện Xin Vĩnh trú Nhật Bản',
      ja: '永住許可申請要件・ポイントチェッカー',
      en: 'Japan Permanent Residency (PR) Readiness Checker',
    },
    description: {
      vi: 'Đánh giá điều kiện thời gian cư trú (10 năm hoặc diện điểm cao HSP), nghĩa vụ thuế và lương hưu',
      ja: '居住年数要件、高度人材ポイント（70点・80点）、税金・公的年金納付履歴の適格性を判定',
      en: 'Evaluate 10-year residency, Highly Skilled Professional points, tax and pension compliance for PR',
    },
    category: 'residence',
    keywords: ['vinh tru', 'xin vinh tru', 'eiju', 'dieu kien vinh tru', 'diem cao hsp', '永住権', '永住許可', '高度人材'],
    aliases: ['eijuken', 'permanent residence japan'],
    link: '#/tools/pr-readiness-checker-jp',
  },
  {
    id: 'arriving-in-japan-wizard-jp',
    title: {
      vi: 'Hướng dẫn Thủ tục Cho Người Mới sang Nhật',
      ja: '来日初期手続き総合ナビゲーター',
      en: 'Starting Life in Japan Newcomer Navigator',
    },
    description: {
      vi: 'Các bước thiết yếu trong 14 ngày đầu: Đăng ký địa chỉ tại Uy ban, My Number, mở tài khoản ngân hàng, SIM điện thoại',
      ja: '入国後14日以内の転入届・マイナンバーカード受取・銀行口座開設・携帯契約を順序立てて案内',
      en: 'Crucial steps in first 14 days: Municipal registration, My Number, bank account, SIM card',
    },
    category: 'residence',
    keywords: ['moi sang nhat', 'den nhat', 'thu tuc moi sang', 'mo tai khoan', 'dang ky dia chi', '来日手続き', '新規入国'],
    aliases: ['thu tuc nguoi moi', 'nhap canh nhat ban'],
    link: '#/tools/arriving-in-japan-wizard-jp',
  },
  {
    id: 'leaving-japan-wizard-jp',
    title: {
      vi: 'Hướng dẫn Thủ tục Về nước / Rời Nhật Bản',
      ja: '帰国・出国手続き総合ナビゲーター',
      en: 'Leaving Japan Procedures Navigator',
    },
    description: {
      vi: 'Lộ trình chuẩn bị trước khi rời Nhật: Cắt khẩu Tenshutsu, người đại diện thuế (Nozei Kanrinin), rút Nenkin một lần',
      ja: '転出届・住民税精算・納税管理人選任・脱退一時金請求・在留カード返納の全行程ガイド',
      en: 'Roadmap for departing Japan: Moving out, tax representative, pension refund, card return',
    },
    category: 'residence',
    keywords: ['ve nuoc', 'roi nhat', 'rut tien nenkin', 'dattai ichijikin', 'nozei kanrinin', '帰国手続き', '出国', '脱退一時金'],
    aliases: ['thu tuc ve nuoc', 'rut nenkin 1 lan'],
    link: '#/tools/leaving-japan-wizard-jp',
  },
  {
    id: 'document-finder-jp',
    title: {
      vi: 'Tìm kiếm Giấy tờ Hành chính Nhật Bản',
      ja: '行政書類・公的証明書ファインダー',
      en: 'Japan Administrative Document Finder',
    },
    description: {
      vi: 'Tra cứu tên tiếng Nhật, mục đích sử dụng và nơi cấp của các loại giấy tờ hành chính',
      ja: '住民票・課税証明書・戸籍謄本などの公的書類の用途、発行機関、正式名称を逆引き検索',
      en: 'Find Japanese official document names, issuance authorities, and usage contexts',
    },
    category: 'documents',
    keywords: ['tim giay to', 'giay to nhat', 'juminhyo la gi', 'koseki', 'kazei', '行政書類', '公的証明書'],
    aliases: ['tra cuu giay to', 'document finder'],
    link: '#/tools/document-finder-jp',
  },
  {
    id: 'certificate-acquisition-guide-jp',
    title: {
      vi: 'Hướng dẫn Xin Cấp Chứng nhận & Giấy tờ',
      ja: '各種証明書取得手続きガイド',
      en: 'Official Certificate Acquisition Guide',
    },
    description: {
      vi: 'Hướng dẫn lấy Phiếu cư trú (Jūminhyō), Giấy nộp thuế, Thuế thuế tại Tòa thị chính hoặc Combini',
      ja: 'コンビニ交付サービスや市役所窓口・郵送での証明書取得手順と手数料を解説',
      en: 'How to obtain Juminhyo, Tax certificates via convenience stores (combini), city office, or mail',
    },
    category: 'documents',
    keywords: ['xin giay juminhyo', 'lay giay to o combini', 'xin giay thue', '証明書取得', 'コンビニ交付'],
    aliases: ['lay juminhyo', 'lay giay to combini'],
    link: '#/tools/certificate-acquisition-guide-jp',
  },
  {
    id: 'mynumber-procedure-guide-jp',
    title: {
      vi: 'Hướng dẫn Thủ tục Thẻ My Number',
      ja: 'マイナンバーカード手続きガイド',
      en: 'My Number Card Procedures Guide',
    },
    description: {
      vi: 'Hướng dẫn đăng ký cấp thẻ, đổi mã PIN, cập nhật địa chỉ khi chuyển nhà và gia hạn theo thời hạn visa',
      ja: 'マイナンバーカードの新規申請、電子証明書更新、暗証番号再設定、在留期限連動更新',
      en: 'Guide to My Number card application, PIN reset, address update, and visa expiration linkage',
    },
    category: 'documents',
    keywords: ['the my number', 'ma pin my number', 'gia han my number', 'マイナンバーカード', '暗証番号'],
    aliases: ['my number nhat ban', 'thu tuc my number'],
    link: '#/tools/mynumber-procedure-guide-jp',
  },
  {
    id: 'official-form-helper-jp',
    title: {
      vi: 'Hỗ trợ Điền Đơn Hành chính Nhật Bản',
      ja: '行政申請書・届出書記入サポート',
      en: 'Japan Official Form Fill-in Helper',
    },
    description: {
      vi: 'Mẫu tham khảo và hướng dẫn từng ô điền đơn đăng ký cư trú, đơn visa, đơn bảo hiểm',
      ja: '転入・転出届、在留資格関係申請書、税務届出書の項目別記入例と注意点',
      en: 'Field-by-field guidelines and sample forms for municipal, immigration, and tax forms',
    },
    category: 'documents',
    keywords: ['dien don tieng nhat', 'mau don chuyen nha', 'cach ghi don visa', '申請書記入例', '届出書記入'],
    aliases: ['huong dan dien don', 'dien don hanh chinh'],
    link: '#/tools/official-form-helper-jp',
  },
  {
    id: 'procedure-requirement-checker-jp',
    title: {
      vi: 'Kiểm tra Hồ sơ Thủ tục Hành chính',
      ja: '手続き必要書類・要件チェッカー',
      en: 'Administrative Procedure Requirements Checker',
    },
    description: {
      vi: 'Tra cứu danh sách giấy tờ cần nộp, thời hạn nộp và cơ quan có thẩm quyền cho từng thủ tục',
      ja: '各公的手続きに必要な書類一式、法定提出期限、管轄行政機関を瞬時にチェック',
      en: 'Check required document checklist, statutory deadlines, and jurisdiction for procedures',
    },
    category: 'documents',
    keywords: ['kiem tra ho so', 'giay to can thiet', 'can chuan bi gi', '必要書類', '提出書類'],
    aliases: ['danh sach giay to', 'ho so can nop'],
    link: '#/tools/procedure-requirement-checker-jp',
  },
  {
    id: 'administrative-navigator-jp',
    title: {
      vi: 'Điều hướng Thủ tục Hành chính Nhật Bản',
      ja: '日本行政手続き総合ナビゲーター',
      en: 'Japan Administrative Procedures Navigator',
    },
    description: {
      vi: 'Bản đồ kết nối cơ quan hành chính: Shiyakusho, Cục Xuất nhập cảnh, Hello Work, Cục Thuế, Nenkin Kiko',
      ja: '役所・入管・ハローワーク・税務署・年金事務所の管轄窓口とワンストップ手続き案内',
      en: 'One-stop directory and navigational roadmap across city offices, immigration, and tax bureaus',
    },
    category: 'documents',
    keywords: ['co quan hanh chinh', 'shiyakusho', 'nyukan o dau', 'hello work o dau', '行政窓口', '役所ナビ'],
    aliases: ['dia chi hanh chinh', 'ban do thu tuc'],
    link: '#/tools/administrative-navigator-jp',
  },
  {
    id: 'japan-life-navigator',
    title: {
      vi: 'Japan Life Navigator — Định hướng Cuộc sống Nhật Bản',
      ja: 'Japan Life Navigator — 日本生活総合ナビゲーター',
      en: 'Japan Life Navigator — Unified Life Decision Conductor',
    },
    description: {
      vi: 'Bộ điều phối trung tâm kết nối toàn bộ sự kiện đời sống: Đến Nhật, Chuyển việc, Sinh con, Đổi nhà, Về nước',
      ja: '来日・転職・出産・引越し・帰国など、人生の節目における行政・税務・法務手続きを一括統合案内',
      en: 'Central conductor uniting all life transitions in Japan with deterministic statutory guidance',
    },
    category: 'navigator',
    keywords: ['japan life navigator', 'dinh huong cuoc song', 'cuoc song nhat ban', 'tat ca thu tuc', '日本生活ナビ', '総合案内'],
    aliases: ['navigator', 'life navigator', 'dieu phoi cuoc song'],
    link: '#/tools/japan-life-navigator',
  },
];

/**
 * Xây dựng Unified Search Index từ 5 nguồn dữ liệu
 * @param {Object} [options={}]
 * @param {Array} [options.customTools=[]]
 * @param {Array} [options.extraEntries=[]]
 * @returns {Array<Object>}
 */
export function buildUnifiedSearchIndex(options = {}) {
  const { customTools = [], extraEntries = [] } = options;
  const index = [];

  // 1. Entities: TOOLS
  const toolsToUse = customTools.length > 0 ? customTools : CANONICAL_TOOLS;
  for (const tool of toolsToUse) {
    index.push({
      entityType: ENTITY_TYPES.TOOL,
      id: tool.id,
      title: tool.title || { vi: tool.id, ja: tool.id, en: tool.id },
      description: tool.description || { vi: '', ja: '', en: '' },
      category: tool.category || 'tool',
      keywords: Array.isArray(tool.keywords) ? tool.keywords : [],
      aliases: Array.isArray(tool.aliases) ? tool.aliases : [],
      link: tool.link || `#/tools/${tool.id}`,
      meta: {
        toolId: tool.id,
        isInteractiveTool: true,
      },
    });
  }

  // 2. Entities: CAPABILITIES
  const capabilities = getAllCapabilities();
  for (const [capId, cap] of Object.entries(capabilities)) {
    // Tránh trùng lặp với tools bằng cách đặt link hashRoute trực tiếp
    const titleVi = cap.title?.vi || `Năng lực: ${capId}`;
    const titleJa = cap.title?.ja || `機能: ${capId}`;
    const titleEn = cap.title?.en || `Capability: ${capId}`;

    index.push({
      entityType: ENTITY_TYPES.CAPABILITY,
      id: capId,
      title: { vi: titleVi, ja: titleJa, en: titleEn },
      description: {
        vi: `Năng lực nghiệp vụ tính toán hoặc kiểm tra quy định thuộc miền ${cap.domain || 'chung'}`,
        ja: `${cap.domain || '共通'}ドメインにおける法令・計算チェック機能`,
        en: `Regulatory calculation or check capability in domain ${cap.domain || 'common'}`,
      },
      category: cap.domain || 'capability',
      keywords: [capId, ...(cap.aliases || [])],
      aliases: cap.aliases || [],
      link: cap.hashRoute || `#/tools/${cap.toolId}`,
      meta: {
        capabilityId: capId,
        toolId: cap.toolId,
        domain: cap.domain,
        isRegulatory: cap.isRegulatory,
      },
    });
  }

  // 3. Entities: LIFE EVENTS
  const lifeEvents = getAllLifeEvents();
  for (const event of lifeEvents) {
    const def = event.definition || event;
    const title = def.title || event.title || { vi: event.id, ja: event.id, en: event.id };
    const desc = def.description || event.description || { vi: '', ja: '', en: '' };

    index.push({
      entityType: ENTITY_TYPES.LIFE_EVENT,
      id: event.id,
      title,
      description: desc,
      category: 'life_event',
      keywords: [
        event.id,
        ...(Array.isArray(event.aliases) ? event.aliases : []),
      ],
      aliases: Array.isArray(event.aliases) ? event.aliases : [],
      link: `#/tools/japan-life-navigator?event=${event.id}`,
      meta: {
        lifeEventId: event.id,
        stagesCount: def.stages?.length || event.stages?.length || 0,
        requiredCapabilities: def.capabilities || event.requiredCapabilities || [],
      },
    });
  }

  // 4. Entities: PROCEDURES
  for (const [procId, proc] of Object.entries(CANONICAL_PROCEDURES)) {
    const title = proc.titleI18n || {
      ja: proc.titleJa || procId,
      vi: proc.titleVi || procId,
      en: proc.titleEn || procId,
    };
    const desc = proc.triggerEventI18n || {
      ja: '法定行政手続き',
      vi: 'Thủ tục hành chính luật định',
      en: 'Statutory administrative procedure',
    };

    index.push({
      entityType: ENTITY_TYPES.PROCEDURE,
      id: procId,
      title,
      description: desc,
      category: proc.domain || 'administrative',
      keywords: [procId, ...(Array.isArray(proc.aliases) ? proc.aliases : [])],
      aliases: Array.isArray(proc.aliases) ? proc.aliases : [],
      link: `#/tools/procedure-requirement-checker-jp?procedureId=${procId}`,
      meta: {
        procedureId: procId,
        authority: proc.authority,
        statutoryDeadline: proc.statutoryDeadlineI18n,
        documentRequirements: proc.documentRequirementIds || [],
      },
    });
  }

  // 5. Entities: DOCUMENTS
  for (const [docId, doc] of Object.entries(CANONICAL_DOCUMENTS)) {
    const title = doc.nameI18n || {
      ja: doc.canonicalNameJa || docId,
      vi: doc.canonicalNameVi || docId,
      en: doc.canonicalNameEn || docId,
    };
    const desc = doc.purposeI18n || {
      ja: '公的証明書・行政書類',
      vi: 'Giấy tờ / Chứng nhận hành chính chính thức',
      en: 'Official administrative certificate / document',
    };

    index.push({
      entityType: ENTITY_TYPES.DOCUMENT,
      id: docId,
      title,
      description: desc,
      category: doc.category || 'document',
      keywords: [
        docId,
        doc.canonicalNameJa,
        ...(Array.isArray(doc.aliases) ? doc.aliases : []),
      ].filter(Boolean),
      aliases: Array.isArray(doc.aliases) ? doc.aliases : [],
      link: `#/tools/certificate-acquisition-guide-jp?documentId=${docId}`,
      meta: {
        documentId: docId,
        issuerType: doc.issuerType,
        sensitivityTier: doc.sensitivityTier,
      },
    });
  }

  // Merge extra entries if provided
  if (Array.isArray(extraEntries) && extraEntries.length > 0) {
    index.push(...extraEntries);
  }

  return index;
}

let _cachedIndex = null;

/**
 * Lấy chỉ mục tìm kiếm hợp nhất (sử dụng cache cho hiệu năng cao)
 * @param {Object} [options={}]
 * @returns {Array<Object>}
 */
export function getUnifiedSearchIndex(options = {}) {
  if (!_cachedIndex || options.forceRefresh) {
    _cachedIndex = buildUnifiedSearchIndex(options);
  }
  return _cachedIndex;
}
