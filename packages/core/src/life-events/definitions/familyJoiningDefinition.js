/**
 * @file packages/core/src/life-events/definitions/familyJoiningDefinition.js
 * @description
 * Canonical Life Event Definition: Family Joining Japan (life.jp.family-joining).
 * Cross-domain orchestration for sponsoring spouse/children to live in Japan:
 * COE preparation, airport landing, municipal registration, dependent insurance/pension, and child benefits.
 */

import { createLifeEventRuntime } from '../runtime/lifeEventRuntime.js';
import { getMunicipalAddressTasks } from '../fragments/municipalAddressFragment.js';

export const FAMILY_JOINING_STAGES = Object.freeze([
  {
    id: 'pre-arrival-coe',
    stageId: 'pre-arrival-coe',
    order: 1,
    nameVi: 'Trước Khi Sang: Xin Tư Cách Lưu Trú (COE)',
    nameJa: '来日前：在留資格認定証明書（COE）交付申請',
    nameEn: 'Before Arrival: Certificate of Eligibility (COE)',
    icon: 'FileText',
  },
  {
    id: 'arrival-and-landing',
    stageId: 'arrival-and-landing',
    order: 2,
    nameVi: 'Nhập Cảnh & Nhận Thẻ Cư Trú',
    nameJa: '空港到着・新規在留カード受取',
    nameEn: 'Arrival & Landing Inspection',
    icon: 'PlaneLanding',
  },
  {
    id: 'municipal-registration',
    stageId: 'municipal-registration',
    order: 3,
    nameVi: 'Tòa Thị Chính: Nhập Khẩu & My Number (14 ngày)',
    nameJa: '市区町村窓口：転入届・マイナンバー手続（14日以内）',
    nameEn: 'Municipal Registration (Within 14 Days)',
    icon: 'Building2',
  },
  {
    id: 'benefits-and-schooling',
    stageId: 'benefits-and-schooling',
    order: 4,
    nameVi: 'Bảo Hiểm Phụ Thuộc, Trợ Cấp & Trường Học',
    nameJa: '健康保険（扶養追加）・年金・児童手当・就学',
    nameEn: 'Dependent Insurance, Benefits & Schooling',
    icon: 'HeartHandshake',
  },
]);

export const familyJoiningDefinition = {
  id: 'life.jp.family-joining',
  country: 'JP',
  domain: 'cross-domain',
  title: {
    vi: 'Bảo lãnh gia đình sang Nhật (Vợ/Chồng & Con cái)',
    ja: '家族呼び寄せ・帯同ナビゲーション（配偶者・子）',
    en: 'Bring Family to Japan Navigator (Spouse & Children)',
  },
  description: {
    vi: 'Lộ trình bảo lãnh người thân sang Nhật: xin tư cách lưu trú COE, đón người thân tại sân bay, đăng ký cư trú cùng hộ, thêm vào BHYT phụ thuộc, xin trợ cấp trẻ em và nhập học.',
    ja: '配偶者・子どもの呼び寄せから定住までの総合手順：COE申請、空港入国、住民票登録、健康保険の被扶養者追加、児童手当、学校・保育園。',
    en: 'End-to-end family sponsorship roadmap: COE application, landing, address registration, health insurance dependency, child benefits, and school.',
  },
  stages: FAMILY_JOINING_STAGES,
  capabilities: [
    'immigration.familyImmigration.guide',
    'documents.certificate.guide',
    'documents.mynumber.guide',
    'insurance.health.dependent',
    'insurance.socialInsurance.calculate',
    'insurance.pension.national',
    'family.childAllowance.calculate',
  ],

  /**
   * Đánh giá và sinh danh sách công việc theo ngữ cảnh
   * @param {Record<string, any>} context
   * @returns {Array<Record<string, any>>}
   */
  evaluateChecklist(context = {}) {
    const isSponsorEmployee =
      context.employmentStatus === 'regular_employee' ||
      context.employmentStatus === 'contract_employee';
    const hasSpouse = context.familyContext ? Boolean(context.familyContext.hasSpouse) : true;
    const childrenCount = context.familyContext ? Number(context.familyContext.childrenCount) || 0 : 0;
    const hasChildren = childrenCount > 0;

    const items = [];

    // ==========================================
    // STAGE 1: Pre-arrival COE
    // ==========================================
    items.push({
      id: 'task_family_coe_application',
      stage: 'pre-arrival-coe',
      stageId: 'pre-arrival-coe',
      title: {
        vi: 'Nộp đơn xin Giấy chứng nhận tư cách lưu trú (COE) cho người thân',
        ja: '出入国在留管理局へ在留資格認定証明書（COE）の交付申請',
        en: 'Apply for Certificate of Eligibility (COE) for Family Members',
      },
      why: {
        vi: 'Người thân cần có COE từ Cục XNC Nhật Bản trước khi có thể xin thị thực (visa) tại Đại sứ quán/Lãnh sự quán Nhật ở nước ngoài.',
        ja: '在外公館でのビザ発給審査を円滑かつ確実に行うため、日本側の入管で事前審査を受ける必要があるため。',
        en: 'Pre-requisite certification from ISA before overseas embassy can issue visas.',
      },
      priority: 'urgent',
      timing: 'before-event',
      jurisdiction: 'national',
      authority: '出入国在留管理局（居住地を管轄する支局・出張所）',
      deadlineDays: null,
      statutoryBasis: '出入国管理及び難民認定法第7条の2',
      reasonCode: 'REASON_FAMILY_COE_APPLICATION',
      requiredDocuments: [
        '在留資格認定証明書交付申請書',
        '結婚証明書または出生証明書（原本＋日本語訳文）',
        '扶養者（申請代理人）の住民票（世帯全員記載）',
        '扶養者の課税・納税証明書（直近1年分）',
        '扶養者の在職証明書',
      ],
      capabilityId: 'immigration.familyImmigration.guide',
    });

    items.push({
      id: 'task_embassy_visa_application',
      stage: 'pre-arrival-coe',
      stageId: 'pre-arrival-coe',
      title: {
        vi: 'Nộp hồ sơ xin Visa tại Đại sứ quán / Lãnh sự quán sau khi có COE',
        ja: '現地日本大使館・領事館での査証（ビザ）発給申請',
        en: 'Apply for Visa at Japanese Embassy/Consulate after Receiving COE',
      },
      why: {
        vi: 'COE có hiệu lực trong vòng 3 tháng kể từ ngày cấp. Phải xin visa và nhập cảnh Nhật Bản trước khi COE hết hạn.',
        ja: 'COEの有効期間は発行から3ヶ月間。期限内にビザを取得し来日を完了させる必要があるため。',
        en: 'COE is valid for 3 months from issuance. Arrival must occur within validity window.',
      },
      priority: 'required',
      timing: 'before-event',
      jurisdiction: 'national',
      authority: '外務省（在外日本公館・代理申請機関）',
      deadlineDays: 90,
      statutoryBasis: '出入国管理及び難民認定法第7条',
      reasonCode: 'REASON_EMBASSY_VISA_APPLICATION',
      requiredDocuments: ['COE（原本または電子交付通知）', 'パスポート', '写真', 'ビザ申請書'],
      capabilityId: 'immigration.familyImmigration.guide',
    });

    // ==========================================
    // STAGE 2: Arrival & Landing Inspection
    // ==========================================
    items.push({
      id: 'task_family_arrival_residence_card',
      stage: 'arrival-and-landing',
      stageId: 'arrival-and-landing',
      title: {
        vi: 'Người thân nhận thẻ cư trú (Zairyu Card) tại cửa khẩu sân bay',
        ja: '空港の入国審査で家族の在留カードを受け取る',
        en: 'Family Members Receive Residence Cards at Airport Inspection',
      },
      why: {
        vi: 'Tại các sân bay lớn (Narita, Haneda, Kansai, Chubu, Fukuoka), thẻ cư trú tư cách "Gia đình lưu trú (Family Stay)" được in và phát ngay.',
        ja: '主要空港では上陸許可と同時に「家族滞在」等の在留カードが即日交付されるため。',
        en: 'Issued on the spot upon landing inspection at primary international airports.',
      },
      priority: 'urgent',
      timing: 'on-event',
      jurisdiction: 'national',
      authority: '出入国在留管理局（空港支局）',
      deadlineDays: 0,
      statutoryBasis: '出入国管理及び難民認定法第19条の3',
      reasonCode: 'REASON_FAMILY_LANDING_CARD',
      requiredDocuments: ['パスポート', '査証', 'COE原本'],
      capabilityId: 'documents.certificate.guide',
    });

    // ==========================================
    // STAGE 3: Municipal Registration (Tái sử dụng Fragment)
    // ==========================================
    const municipalTasks = getMunicipalAddressTasks(context, 'municipal-registration');
    items.push(...municipalTasks);

    items.push({
      id: 'task_obtain_joint_juminhyo',
      stage: 'municipal-registration',
      stageId: 'municipal-registration',
      title: {
        vi: 'Xin bản sao Phiếu cư trú ghi rõ toàn bộ hộ gia đình (世帯全員の住民票)',
        ja: '世帯全員が記載された住民票の写しを取得（扶養申請用）',
        en: 'Obtain Juminhyo Certificate with All Household Members (for Dependency)',
      },
      why: {
        vi: 'Cần giấy này nộp cho công ty để chứng minh người thân đang sống chung hộ và chính thức bổ sung vào BHYT phụ thuộc.',
        ja: '新勤務先や保険者へ同一世帯であることを証明し、健康保険の被扶養者認定を行うため。',
        en: 'Proves cohabitation required for social insurance dependent qualification.',
      },
      priority: 'required',
      timing: 'now',
      jurisdiction: 'municipal',
      authority: '市区町村役所（窓口またはコンビニ）',
      deadlineDays: 14,
      statutoryBasis: '住民基本台帳法第12条',
      reasonCode: 'REASON_JOINT_JUMINHYO_REQUIRED',
      requiredDocuments: ['本人確認書類（在留カード）', '手数料（300円前後）'],
      capabilityId: 'documents.certificate.guide',
    });

    // ==========================================
    // STAGE 4: Dependent Insurance, Benefits & Schooling
    // ==========================================
    if (isSponsorEmployee) {
      items.push({
        id: 'task_health_insurance_dependent_addition',
        stage: 'benefits-and-schooling',
        stageId: 'benefits-and-schooling',
        title: {
          vi: 'Làm thủ tục thêm Vợ/Chồng/Con vào BHYT phụ thuộc của công ty (Kenpo Fuyou)',
          ja: '勤務先の健康保険組合へ被扶養者（家族）追加の申請',
          en: 'Enroll Family Members as Dependents in Company Health Insurance',
        },
        why: {
          vi: 'Người phụ thuộc được hưởng chế độ BHYT miễn phí (không phải đóng thêm tiền bảo hiểm hàng tháng). Thu nhập người phụ thuộc phải dưới 1.300.000円/năm.',
          ja: '被扶養者として認定されると、個別の保険料負担なしで保険給付を受けられるため（年収130万円未満要件）。',
          en: 'Dependents receive health coverage with zero additional monthly premiums if earning under 1.3M JPY.',
        },
        priority: 'urgent',
        timing: 'after-event',
        jurisdiction: 'employer',
        authority: '勤務先（人事労務） / 協会けんぽ・健康保険組合',
        deadlineDays: 5,
        statutoryBasis: '健康保険法第3条第7項・第48条',
        reasonCode: 'REASON_KENPO_DEPENDENT_ADDITION',
        requiredDocuments: ['健康保険被扶養者（異動）届', '世帯全員の住民票', '続柄を証明する公的書類（結婚・出生証明）'],
        capabilityId: 'insurance.health.dependent',
      });

      if (hasSpouse) {
        items.push({
          id: 'task_national_pension_category_3',
          stage: 'benefits-and-schooling',
          stageId: 'benefits-and-schooling',
          title: {
            vi: 'Đăng ký Lương hưu Quốc dân số 3 (Kokumin Nenkin Dai-3-go) cho Vợ/Chồng',
            ja: '国民年金第3号被保険者該当届の提出（配偶者のみ）',
            en: 'Register Spouse as National Pension Category 3 Insured',
          },
          why: {
            vi: 'Vợ/chồng phụ thuộc từ 20 đến 59 tuổi được hưởng chế độ lương hưu nhà nước mà hoàn toàn không phải tự đóng tiền Nenkin.',
            ja: '厚生年金加入者に扶養される20歳以上60歳未満の配偶者は、保険料自己負担なしで老齢基礎年金の受給資格期間を満たせるため。',
            en: 'Exempts dependent spouse from paying pension premiums while earning full pension qualification credits.',
          },
          priority: 'required',
          timing: 'after-event',
          jurisdiction: 'employer',
          authority: '勤務先（人事労務） / 日本年金機構',
          deadlineDays: 14,
          statutoryBasis: '国民年金法第7条第1項第3号',
          reasonCode: 'REASON_PENSION_CATEGORY_3',
          requiredDocuments: ['国民年金第3号被保険者関係届', '基礎年金番号通知書'],
          capabilityId: 'insurance.pension.national',
        });
      }
    } else {
      // Người bảo lãnh đóng Quốc dân (Freelancer / Sinh viên): Cả nhà cùng vào BHYT Quốc dân
      items.push({
        id: 'task_family_nhi_enrollment',
        stage: 'benefits-and-schooling',
        stageId: 'benefits-and-schooling',
        title: {
          vi: 'Thêm người thân vào sổ BHYT Quốc dân (Kokumin Kenko Hoken)',
          ja: '市区町村窓口で国民健康保険に家族を追加加入',
          en: 'Add Family Members to Municipal National Health Insurance',
        },
        why: {
          vi: 'Người làm tự do / du học sinh không có Shakai Hoken công ty thì người thân bắt buộc phải tham gia BHYT Quốc dân tại Tòa thị chính.',
          ja: '国保では扶養の概念がなく、世帯主が家族全員分の保険料を合算して納付する義務があるため。',
          en: 'NHI requires all household members to be enrolled under the household head.',
        },
        priority: 'urgent',
        timing: 'now',
        jurisdiction: 'municipal',
        authority: '市区町村役所（国民健康保険課）',
        deadlineDays: 14,
        statutoryBasis: '国民健康保険法第9条',
        reasonCode: 'REASON_FAMILY_NHI_ENROLLMENT',
        requiredDocuments: ['世帯主の国保保険証', '家族の在留カード'],
        capabilityId: 'insurance.pension.national',
      });
    }

    // Các thủ tục dành cho Con cái
    if (hasChildren) {
      items.push({
        id: 'task_family_child_allowance',
        stage: 'benefits-and-schooling',
        stageId: 'benefits-and-schooling',
        title: {
          vi: 'Xin Trợ cấp Trẻ em (Jido Teate) cho các con tại Tòa thị chính',
          ja: '市区町村窓口で児童手当の認定請求（15日以内）',
          en: 'Apply for Child Allowance for Incoming Children (Within 15 Days)',
        },
        why: {
          vi: 'Quyền lợi tài chính hỗ trợ nuôi con hàng tháng (10.000円 - 30.000円/tháng/cháu). Bắt buộc làm trong 15 ngày kể từ ngày nhập khẩu.',
          ja: '来日後15日以内に申請すれば来日の翌月分から手当が支給されるため。',
          en: 'Monthly financial subsidy per child. 15-day application window to prevent loss.',
        },
        priority: 'required',
        timing: 'now',
        jurisdiction: 'municipal',
        authority: '市区町村役所（子育て支援課）',
        deadlineDays: 15,
        statutoryBasis: '児童手当法第8条',
        reasonCode: 'REASON_CHILD_ALLOWANCE_15DAYS',
        requiredDocuments: ['児童手当認定請求書', '世帯全員の住民票', '扶養者の通帳', '扶養者の健康保険証'],
        capabilityId: 'family.childAllowance.calculate',
      });

      items.push({
        id: 'task_family_school_enrollment',
        stage: 'benefits-and-schooling',
        stageId: 'benefits-and-schooling',
        title: {
          vi: 'Đăng ký nhập học Tiểu học / Trung học cơ sở công lập hoặc Nhà trẻ',
          ja: '市区町村教育委員会・保育課で就学・保育園申込み手続き',
          en: 'Register for Public Elementary/Junior High School or Daycare',
        },
        why: {
          vi: 'Trẻ em mang quốc tịch nước ngoài được đảm bảo quyền học tập miễn phí tại các trường tiểu học và trung học cơ sở công lập của Nhật Bản.',
          ja: '外国人児童も希望により日本の公立小・中学校に無償で就学できる教育機会が保障されているため。',
          en: 'Foreign national children have guaranteed rights to free public compulsory education.',
        },
        priority: 'recommended',
        timing: 'after-event',
        jurisdiction: 'municipal',
        authority: '市区町村教育委員会（学務課）または保育課',
        deadlineDays: null,
        statutoryBasis: '学校教育法施行令第1条',
        reasonCode: 'REASON_SCHOOL_ENROLLMENT',
        requiredDocuments: ['世帯全員の住民票', '子どもの在留カード', '就学案内書'],
        capabilityId: 'documents.certificate.guide',
      });
    }

    return items;
  },
};

/**
 * Runtime instance cho sự kiện Family Joining
 */
export const familyJoiningRuntime = createLifeEventRuntime(familyJoiningDefinition);
