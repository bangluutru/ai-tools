/**
 * @file packages/core/src/life-events/definitions/startingLifeDefinition.js
 * @description
 * Canonical Life Event Definition: Starting Life in Japan (life.jp.starting-life).
 * Cross-domain orchestration covering arrival, address registration, My Number,
 * insurance/pension enrollment, banking/essentials, and family/child procedures.
 */

import { createLifeEventRuntime } from '../runtime/lifeEventRuntime.js';
import { getMunicipalAddressTasks } from '../fragments/municipalAddressFragment.js';

export const STARTING_LIFE_STAGES = Object.freeze([
  {
    id: 'airport-arrival',
    stageId: 'airport-arrival',
    order: 1,
    nameVi: 'Tại Sân Bay & Nhập Cảnh',
    nameJa: '空港到着・入国審査',
    nameEn: 'Airport Landing & Immigration',
    icon: 'PlaneLanding',
  },
  {
    id: 'municipal-setup',
    stageId: 'municipal-setup',
    order: 2,
    nameVi: 'Tòa Thị Chính & Cư Trú (Trong 14 ngày)',
    nameJa: '市区町村窓口・住民登録（14日以内）',
    nameEn: 'Municipal Setup & Registration (Within 14 Days)',
    icon: 'Building2',
  },
  {
    id: 'insurance-pension-enrollment',
    stageId: 'insurance-pension-enrollment',
    order: 3,
    nameVi: 'Bảo Hiểm Y Tế & Lương Hưu',
    nameJa: '健康保険・年金の手続き',
    nameEn: 'Health Insurance & Pension Setup',
    icon: 'ShieldCheck',
  },
  {
    id: 'daily-essentials-settling',
    stageId: 'daily-essentials-settling',
    order: 4,
    nameVi: 'Tiện Ích Đời Sống & Thuế Ban Đầu',
    nameJa: '生活インフラ・初期税務手続き',
    nameEn: 'Daily Essentials & Tax Basics',
    icon: 'Home',
  },
]);

export const startingLifeDefinition = {
  id: 'life.jp.starting-life',
  aliasIds: ['arriving-in-japan'],
  country: 'JP',
  domain: 'cross-domain',
  title: {
    vi: 'Bắt đầu cuộc sống tại Nhật Bản (Nhập cảnh & Định cư)',
    ja: '日本での新生活スタートガイド（新規入国・定住）',
    en: 'Starting Life in Japan Guide (Newcomer Setup)',
  },
  description: {
    vi: 'Lộ trình từng bước cho người mới sang Nhật: nhập cảnh, đăng ký cư trú 14 ngày, My Number, BHYT, lương hưu, mở tài khoản và thủ tục gia đình.',
    ja: '入国直後から定住までの総合ナビゲーション：住民登録、マイナンバー、健康保険、年金、銀行口座、子育て支援。',
    en: 'Comprehensive newcomer roadmap: landing, 14-day address registration, My Number, health insurance, pension, banking, and child support.',
  },
  stages: STARTING_LIFE_STAGES,
  capabilities: [
    'documents.certificate.guide',
    'documents.mynumber.guide',
    'insurance.socialInsurance.calculate',
    'insurance.pension.national',
    'tax.japan.calculate',
    'family.childAllowance.calculate',
    'immigration.workScope.check',
  ],

  /**
   * Đánh giá và sinh danh sách công việc theo ngữ cảnh
   * @param {Record<string, any>} context
   * @returns {Array<Record<string, any>>}
   */
  evaluateChecklist(context = {}) {
    const isEmployee = context.employmentStatus === 'regular_employee' || context.employmentStatus === 'contract_employee';
    const isStudent = context.employmentStatus === 'student';
    const hasChildren = Boolean(context.familyContext && context.familyContext.childrenCount > 0);

    const items = [];

    // ==========================================
    // STAGE 1: Airport Arrival
    // ==========================================
    items.push({
      id: 'task_airport_residence_card',
      stage: 'airport-arrival',
      stageId: 'airport-arrival',
      title: {
        vi: 'Nhận thẻ cư trú (Zairyu Card) tại sân bay',
        ja: '空港で在留カードの交付を受ける',
        en: 'Receive Residence Card at Airport Inspection',
      },
      why: {
        vi: 'Thẻ cư trú là giấy tờ tùy thân hợp pháp duy nhất của người nước ngoài tại Nhật.',
        ja: '中長期在留者の唯一の公的身分証明書となるため。',
        en: 'Essential legal identity document for medium-to-long term residents.',
      },
      priority: 'urgent',
      timing: 'now',
      jurisdiction: 'national',
      authority: '出入国在留管理局（主要空港審査窓口）',
      deadlineDays: 0,
      statutoryBasis: '出入国管理及び難民認定法第19条の3',
      reasonCode: 'REASON_AIRPORT_RESIDENCE_CARD',
      requiredDocuments: ['パスポート', '査証（ビザ）', '在留資格認定証明書（COE）'],
      capabilityId: 'immigration.workScope.check',
    });

    if (isStudent) {
      items.push({
        id: 'task_airport_part_time_permit',
        title: {
          vi: 'Xin Giấy phép làm thêm (Shikakugai Katsudo Kyoka) ngay tại sân bay',
          ja: '空港で資格外活動許可（アルバイト許可）を同時申請',
          en: 'Apply for Part-time Work Permit at Airport',
        },
        why: {
          vi: 'Xin ngay tại sân bay sẽ có dấu cho phép làm 28h/tuần lập tức, không phải lên Cục XNC sau này.',
          ja: '空港で即日許可印が取得でき、後日の入管窓口申請を省略できるため。',
          en: 'Instant stamp at arrival airport saves a visit to Immigration later.',
        },
        priority: 'recommended',
        timing: 'now',
        jurisdiction: 'national',
        authority: '出入国在留管理局',
        deadlineDays: 0,
        statutoryBasis: '出入国管理及び難民認定法第19条',
        reasonCode: 'REASON_STUDENT_PART_TIME_PERMIT',
        requiredDocuments: ['資格外活動許可申請書', 'パスポート'],
        capabilityId: 'immigration.workScope.check',
      });
    }

    // ==========================================
    // STAGE 2: Municipal Setup (Tái sử dụng Fragment)
    // ==========================================
    const municipalTasks = getMunicipalAddressTasks(context, 'municipal-setup');
    items.push(...municipalTasks);

    // Nhánh nếu gia đình có trẻ em (Family with children)
    if (hasChildren) {
      items.push({
        id: 'task_child_allowance_application',
        stage: 'municipal-setup',
        stageId: 'municipal-setup',
        title: {
          vi: 'Nộp đơn xin Trợ cấp Trẻ em (Jido Teate) tại Tòa thị chính',
          ja: '市区町村窓口で児童手当の申請（15日以内）',
          en: 'Apply for Child Allowance at City Hall (Within 15 Days)',
        },
        why: {
          vi: 'Trợ cấp tính từ tháng kế tiếp sau tháng nộp đơn (nguyên tắc 15 ngày). Nộp muộn sẽ bị mất tiền tháng đó.',
          ja: '申請月の翌月分から支給されるため（15日特例あり）。遅れると遡及受給不可。',
          en: 'Benefits start month following application. Delays forfeit monthly payments.',
        },
        priority: 'required',
        timing: 'now',
        jurisdiction: 'municipal',
        authority: '市区町村役所（子育て支援課）',
        deadlineDays: 15,
        statutoryBasis: '児童手当法第8条',
        reasonCode: 'REASON_CHILD_ALLOWANCE_15DAYS',
        requiredDocuments: ['児童手当認定請求書', '請求者名義の預金通帳', '健康保険証の写し', 'マイナンバー確認書類'],
        capabilityId: 'family.childAllowance.calculate',
      });

      items.push({
        id: 'task_child_medical_subsidy',
        stage: 'municipal-setup',
        stageId: 'municipal-setup',
        title: {
          vi: 'Đăng ký Thẻ Hỗ trợ Viện phí Trẻ em (Iryouhi Josei)',
          ja: '子ども医療費助成（医療証）の申請',
          en: 'Apply for Child Medical Expense Subsidy Certificate',
        },
        why: {
          vi: 'Miễn giảm gần như toàn bộ chi phí khám chữa bệnh và thuốc cho trẻ em tại địa phương.',
          ja: '自治体内の子どもの医療費自己負担分が全額または一部助成されるため。',
          en: 'Waives medical and prescription co-pays for children in municipality.',
        },
        priority: 'required',
        timing: 'now',
        jurisdiction: 'municipal',
        authority: '市区町村役所（子ども家庭支援課）',
        deadlineDays: 14,
        statutoryBasis: '地方自治体医療費助成条例',
        reasonCode: 'REASON_CHILD_MEDICAL_SUBSIDY',
        requiredDocuments: ['子どもの健康保険証', '申請書'],
        capabilityId: 'documents.certificate.guide',
      });
    }

    // ==========================================
    // STAGE 3: Insurance & Pension Enrollment
    // ==========================================
    if (isEmployee) {
      items.push({
        id: 'task_company_social_insurance_setup',
        stage: 'insurance-pension-enrollment',
        stageId: 'insurance-pension-enrollment',
        title: {
          vi: 'Hoàn tất thủ tục BHYT & Lương hưu qua công ty (Shakai Hoken)',
          ja: '勤務先で社会保険（健康保険・厚生年金）の加入手続き',
          en: 'Complete Company Social Insurance Enrollment (Kenpo & Kosei Nenkin)',
        },
        why: {
          vi: 'Công ty chịu 50% chi phí đóng bảo hiểm y tế và lương hưu theo luật định.',
          ja: '保険料が労使折半となり、会社を通じて加入手続きが義務付けられているため。',
          en: 'Employer co-funds 50% of premiums by statutory requirement.',
        },
        priority: 'required',
        timing: 'after-event',
        jurisdiction: 'employer',
        authority: '勤務先（人事労務） / 日本年金機構',
        deadlineDays: 5,
        statutoryBasis: '健康保険法第48条・厚生年金保険法第27条',
        reasonCode: 'REASON_COMPANY_SHAKAI_HOKEN',
        requiredDocuments: ['基礎年金番号通知書または年金手帳', '給与所得者の扶養控除等申告書'],
        capabilityId: 'insurance.socialInsurance.calculate',
      });
    } else {
      // Du học sinh, người phụ thuộc, freelancer
      items.push({
        id: 'task_nhi_enrollment_newcomer',
        stage: 'insurance-pension-enrollment',
        stageId: 'insurance-pension-enrollment',
        title: {
          vi: 'Tham gia BHYT Quốc Dân (Kokumin Kenko Hoken) tại Tòa thị chính',
          ja: '市区町村窓口で国民健康保険に加入（14日以内）',
          en: 'Enroll in National Health Insurance at City Office (Within 14 Days)',
        },
        why: {
          vi: 'Tất cả cư dân tại Nhật Bản bắt buộc phải có BHYT (Chế độ Bảo hiểm Toàn dân).',
          ja: '国民皆保険制度により、職場の健保に入らないすべての住民に加入義務があるため。',
          en: 'Mandatory universal health coverage for all residents not in company insurance.',
        },
        priority: 'urgent',
        timing: 'now',
        jurisdiction: 'municipal',
        authority: '市区町村役所（国民健康保険課）',
        deadlineDays: 14,
        statutoryBasis: '国民健康保険法第9条',
        reasonCode: 'REASON_NEWCOMER_NHI',
        requiredDocuments: ['在留カード', 'パスポート'],
        capabilityId: 'insurance.pension.national',
      });

      items.push({
        id: 'task_national_pension_newcomer',
        stage: 'insurance-pension-enrollment',
        stageId: 'insurance-pension-enrollment',
        title: {
          vi: 'Tham gia Lương hưu Quốc Dân (Kokumin Nenkin)',
          ja: '国民年金第1号被保険者への加入手続き',
          en: 'Enroll in National Pension (Category 1)',
        },
        why: {
          vi: 'Mọi cư dân từ 20 đến 59 tuổi tại Nhật bắt buộc phải tham gia lương hưu.',
          ja: '20歳以上60歳未満のすべての居住者に加入義務があるため。',
          en: 'Mandatory for all residents aged 20-59 residing in Japan.',
        },
        priority: 'urgent',
        timing: 'now',
        jurisdiction: 'municipal',
        authority: '市区町村役所（年金課）または年金事務所',
        deadlineDays: 14,
        statutoryBasis: '国民年金法第7条',
        reasonCode: 'REASON_NEWCOMER_NENKIN',
        requiredDocuments: ['在留カード', 'パスポート'],
        capabilityId: 'insurance.pension.national',
      });

      if (isStudent) {
        items.push({
          id: 'task_student_pension_exemption',
          stage: 'insurance-pension-enrollment',
          stageId: 'insurance-pension-enrollment',
          title: {
            vi: 'Nộp đơn xin Miễn giảm Lương hưu cho Sinh viên (Gakusei Noufu Tokurei)',
            ja: '学生納付特例制度の申請（年金保険料の猶予）',
            en: 'Apply for Special Student Pension Exemption',
          },
          why: {
            vi: 'Sinh viên có thu nhập thấp được hoãn đóng tiền Nenkin mà vẫn bảo lưu thời gian tính hưởng chế độ.',
            ja: '所得が少ない学生期間中の保険料納付が猶予され、障害年金等の受給資格期間に算入されるため。',
            en: 'Defers pension contributions while preserving disability and coverage credit.',
          },
          priority: 'recommended',
          timing: 'now',
          jurisdiction: 'municipal',
          authority: '市区町村役所（年金窓口）または年金事務所',
          deadlineDays: null,
          statutoryBasis: '国民年金法第90条の3',
          reasonCode: 'REASON_STUDENT_PENSION_EXEMPTION',
          requiredDocuments: ['学生証または在学証明書', '年金手帳'],
          capabilityId: 'insurance.pension.national',
        });
      }
    }

    // ==========================================
    // STAGE 4: Daily Essentials & Tax Basics
    // ==========================================
    items.push({
      id: 'task_bank_account_opening',
      stage: 'daily-essentials-settling',
      stageId: 'daily-essentials-settling',
      title: {
        vi: 'Mở tài khoản ngân hàng (Japan Post Bank / Ngân hàng thương mại)',
        ja: '銀行口座の開設（ゆうちょ銀行など）',
        en: 'Open Bank Account (JP Post Bank or Commercial Banks)',
      },
      why: {
        vi: 'Cần tài khoản ngân hàng để nhận lương, đóng tiền nhà, điện nước ga và đóng bảo hiểm.',
        ja: '給与受取、家賃・公共料金・保険料の口座振替に必須であるため。',
        en: 'Required for salary deposit, utility bills, and insurance direct debits.',
      },
      priority: 'required',
      timing: 'after-event',
      jurisdiction: 'employer',
      authority: '金融機関（ゆうちょ銀行・都市銀行）',
      deadlineDays: null,
      statutoryBasis: '外国為替及び外国貿易法（非居住者規定）',
      reasonCode: 'REASON_BANK_ACCOUNT_SETUP',
      requiredDocuments: ['在留カード（住所記載済み）', 'パスポート', '印鑑（銀行印）', '社員証または内定通知書'],
      capabilityId: 'documents.certificate.guide',
    });

    items.push({
      id: 'task_residence_tax_awareness',
      stage: 'daily-essentials-settling',
      stageId: 'daily-essentials-settling',
      title: {
        vi: 'Nắm vững quy tắc Thuế Thị Dân năm đầu tiên',
        ja: '住民税の「前年所得課税」ルールの理解',
        en: 'Understand 1st-Year Residence Tax Rules',
      },
      why: {
        vi: 'Năm đầu sang Nhật bạn không phải đóng thuế thị dân vì thuế tính trên thu nhập năm trước tại Nhật. Tuy nhiên năm thứ hai thuế sẽ đến hạn.',
        ja: '住民税は前年の日本国内所得に対して翌年6月から課税されるため、初年度は課税されず2年目以降に急増する仕組みに備える。',
        en: 'Residence tax assesses prior-year domestic income. Year 1 has no municipal tax, but Year 2 incurs substantial levies.',
      },
      priority: 'informational',
      timing: 'later',
      jurisdiction: 'municipal',
      authority: '市区町村役所（課税課）',
      deadlineDays: null,
      statutoryBasis: '地方税法第294条（1月1日賦課期日原則）',
      reasonCode: 'REASON_RESIDENCE_TAX_RULES',
      requiredDocuments: [],
      capabilityId: 'tax.japan.calculate',
    });

    return items;
  },
};

/**
 * Runtime instance cho sự kiện Starting Life
 */
export const startingLifeRuntime = createLifeEventRuntime(startingLifeDefinition);
