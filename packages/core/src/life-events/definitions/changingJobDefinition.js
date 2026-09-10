/**
 * @file packages/core/src/life-events/definitions/changingJobDefinition.js
 * @description
 * Canonical Life Event Definition: Changing Job in Japan (life.jp.changing-job).
 * Cross-domain orchestration bridging two employers: employment exit, immigration notification,
 * insurance/pension gap handling, certificate of authorized employment, and onboarding.
 */

import { createLifeEventRuntime } from '../runtime/lifeEventRuntime.js';
import { getEmploymentExitTasks } from '../fragments/employmentExitFragment.js';
import { getImmigrationNotificationTasks } from '../fragments/immigrationNotificationFragment.js';
import { getInsuranceTransitionTasks } from '../fragments/insuranceTransitionFragment.js';

export const CHANGING_JOB_STAGES = Object.freeze([
  {
    id: 'before-leaving',
    stageId: 'before-leaving',
    order: 1,
    nameVi: 'Trước Khi Nghỉ Việc Công Ty Cũ',
    nameJa: '現職の退職前・引継ぎ',
    nameEn: 'Before Leaving Current Job',
    icon: 'Building',
  },
  {
    id: 'between-jobs-gap',
    stageId: 'between-jobs-gap',
    order: 2,
    nameVi: 'Khoảng Trống Giữa 2 Công Ty (Gap)',
    nameJa: '転職の空白期間・各種届出',
    nameEn: 'Between Jobs Gap & Notifications',
    icon: 'ArrowRightLeft',
  },
  {
    id: 'before-new-job-starts',
    stageId: 'before-new-job-starts',
    order: 3,
    nameVi: 'Trước Khi Vào Công Ty Mới',
    nameJa: '新職場への入社前準備',
    nameEn: 'Before Starting New Job',
    icon: 'FileCheck',
  },
  {
    id: 'after-starting-new-job',
    stageId: 'after-starting-new-job',
    order: 4,
    nameVi: 'Sau Khi Vào Công Ty Mới',
    nameJa: '新職場での初月・税務手続き',
    nameEn: 'After Starting New Job',
    icon: 'Briefcase',
  },
]);

export const changingJobDefinition = {
  id: 'life.jp.changing-job',
  country: 'JP',
  domain: 'cross-domain',
  title: {
    vi: 'Chuyển việc / Đổi công ty tại Nhật Bản',
    ja: '日本での転職・移籍手続きナビゲーション',
    en: 'Changing Job in Japan Navigator',
  },
  description: {
    vi: 'Lộ trình chuyển đổi giữa hai công ty: giấy tờ thôi việc, thông báo Cục XNC 14 ngày, xử lý khoảng trống bảo hiểm/lương hưu, và thủ tục tại công ty mới.',
    ja: '退職から新会社入社までの総合フロー：退職書類、入管14日以内届出、保険年金の空白期間、新職場の社会保険手続き。',
    en: 'End-to-end bridge between employers: exit docs, 14-day ISA notification, insurance/pension gap, and onboarding setup.',
  },
  stages: CHANGING_JOB_STAGES,
  capabilities: [
    'documents.certificate.guide',
    'immigration.affiliationChange.check',
    'immigration.workScope.check',
    'insurance.socialInsurance.calculate',
    'insurance.pension.national',
    'employment.unemployment.eligibility',
    'employment.unemployment.benefit',
    'tax.japan.calculate',
  ],

  /**
   * Đánh giá và sinh danh sách công việc theo ngữ cảnh
   * @param {Record<string, any>} context
   * @returns {Array<Record<string, any>>}
   */
  evaluateChecklist(context = {}) {
    const items = [];

    // Tính toán khoảng trống giữa 2 công việc (Gap)
    let hasGap = false;
    let gapDays = 0;
    if (context.eventDates && context.eventDates.resignationDate && context.eventDates.newJobStartDate) {
      const d1 = new Date(context.eventDates.resignationDate);
      const d2 = new Date(context.eventDates.newJobStartDate);
      if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
        gapDays = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) - 1;
        hasGap = gapDays > 0;
      }
    } else if (context.hasGap !== undefined) {
      hasGap = Boolean(context.hasGap);
      gapDays = hasGap ? 14 : 0;
    }

    const isSameWorkType = context.isSameWorkType !== false;
    const isUnrestrictedVisa = [
      'permanent_resident',
      'spouse_of_japanese',
      'spouse_of_pr',
      'long_term_resident',
    ].includes(context.residenceStatus);

    // ==========================================
    // STAGE 1: Before Leaving (Tái sử dụng Employment Exit Fragment)
    // ==========================================
    const exitTasks = getEmploymentExitTasks(context, 'before-leaving');
    items.push(...exitTasks);

    // Bổ sung xử lý Thuế Thị Dân khi nghỉ việc
    items.push({
      id: 'task_residence_tax_transition_at_exit',
      stage: 'before-leaving',
      stageId: 'before-leaving',
      title: {
        vi: 'Xử lý phương thức nộp Thuế Thị Dân (Chuyển sang 普通徴収 hoặc trừ một lần)',
        ja: '住民税の徴収方法の切り替え（普通徴収または一括徴収）',
        en: 'Select Residence Tax Settlement Method at Resignation',
      },
      why: {
        vi: 'Nếu nghỉ việc từ tháng 1 đến tháng 5, công ty cũ sẽ trừ toàn bộ tiền thuế còn lại của năm vào lương tháng cuối. Nếu từ tháng 6 đến tháng 12, bạn có thể tự nộp bằng giấy gửi về nhà.',
        ja: '1〜5月退職の場合は原則として最後の給与から一括徴収、6〜12月退職の場合は普通徴収への切替または一括徴収を選択するため。',
        en: 'Jan-May resignations trigger mandatory lump-sum deduction; Jun-Dec allow municipal bill conversion.',
      },
      priority: 'required',
      timing: 'before-event',
      jurisdiction: 'employer',
      authority: '現勤務先（給与担当）および市区町村役所',
      deadlineDays: null,
      statutoryBasis: '地方税法第321条の5',
      reasonCode: 'REASON_RESIDENCE_TAX_EXIT',
      requiredDocuments: ['給与所得者異動届出書'],
      capabilityId: 'tax.japan.calculate',
    });

    // ==========================================
    // STAGE 2: Between Jobs Gap
    // ==========================================
    // 1. Thông báo Cục XNC 14 ngày (Nếu không phải visa không hạn chế)
    if (!isUnrestrictedVisa) {
      const immiTasks = getImmigrationNotificationTasks(context, 'between-jobs-gap');
      items.push(...immiTasks);
    }

    // 2. Chuyển đổi BHYT & Lương hưu nếu có khoảng trống (Gap > 0)
    if (hasGap) {
      const insuranceTasks = getInsuranceTransitionTasks(
        { ...context, hasInsuranceGap: true },
        'between-jobs-gap'
      );
      items.push(...insuranceTasks);

      // Tùy chọn Giữ bảo hiểm cũ (Nin'i Keizoku) trong 20 ngày
      items.push({
        id: 'task_nini_keizoku_option',
        stage: 'between-jobs-gap',
        stageId: 'between-jobs-gap',
        title: {
          vi: 'Cân nhắc giữ BHYT công ty cũ (任意継続 - Nộp trong 20 ngày)',
          ja: '健康保険任意継続の検討・申請（退職後20日以内）',
          en: 'Consider Voluntary Continuation of Health Insurance (Within 20 Days)',
        },
        why: {
          vi: 'Nếu thu nhập năm trước cao, đóng Nin\'i Keizoku có mức trần tối đa, thường rẻ hơn BHYT Quốc dân (Kokumin Kenko Hoken).',
          ja: '前年所得が高額な場合、保険料に上限がある任意継続の方が国民健康保険より割安になる場合があるため。',
          en: 'Premium caps on Nin\'i Keizoku can be substantially cheaper than NHI for high earners.',
        },
        priority: 'optional',
        timing: 'now',
        jurisdiction: 'employer',
        authority: '協会けんぽまたは健康保険組合',
        deadlineDays: 20,
        statutoryBasis: '健康保険法第37条（退職後20日以内の申請期限）',
        reasonCode: 'REASON_NINI_KEIZOKU_OPTION',
        requiredDocuments: ['任意継続被保険者資格取得申請書'],
        capabilityId: 'insurance.socialInsurance.calculate',
      });

      // Nếu khoảng trống kéo dài trên 30 ngày: Hướng dẫn trợ cấp thất nghiệp
      if (gapDays >= 30) {
        items.push({
          id: 'task_unemployment_benefit_consultation',
          stage: 'between-jobs-gap',
          stageId: 'between-jobs-gap',
          title: {
            vi: 'Tham vấn quyền hưởng Trợ cấp thất nghiệp tại Hello Work',
            ja: 'ハローワークでの基本手当（失業保険）受給相談',
            en: 'Consult Hello Work for Unemployment Benefits',
          },
          why: {
            vi: 'Khoảng trống dài ngày có thể đủ điều kiện nhận trợ cấp thất nghiệp hoặc nhận tiền trợ cấp tái tuyển dụng (再就職手当).',
            ja: '一定以上の空白期間がある場合、基本手当の受給や早期再就職による再就職手当の対象となるため。',
            en: 'Extended gap may qualify for basic allowance or Early Re-employment Bonus.',
          },
          priority: 'recommended',
          timing: 'now',
          jurisdiction: 'national',
          authority: 'ハローワーク（公共職業安定所）',
          deadlineDays: null,
          statutoryBasis: '雇用保険法',
          reasonCode: 'REASON_UNEMPLOYMENT_CONSULTATION',
          requiredDocuments: ['離職票-1', '離職票-2', 'マイナンバー確認書類', '本人名義の口座'],
          capabilityId: 'employment.unemployment.benefit',
        });
      }
    }

    // ==========================================
    // STAGE 3: Before New Job Starts
    // ==========================================
    // Nếu đổi nội dung công việc khác ngành nghề trên visa:
    if (!isSameWorkType && !isUnrestrictedVisa) {
      items.push({
        id: 'task_certificate_of_authorized_employment',
        stage: 'before-new-job-starts',
        stageId: 'before-new-job-starts',
        title: {
          vi: 'Xin Giấy chứng nhận tư cách làm việc (就労資格証明書 - Shurou Shikaku Shomeisho)',
          ja: '就労資格証明書の交付申請（職種変更・転職時の適法性確認）',
          en: 'Apply for Certificate of Authorized Employment (Job Duty Verification)',
        },
        why: {
          vi: 'Xác nhận trước từ Cục XNC rằng công việc tại công ty mới hoàn toàn hợp pháp với visa hiện tại, giúp gia hạn visa sau này được duyệt 100% nhanh chóng.',
          ja: '転職先の業務内容が現在の在留資格に適合していることを事前に法務大臣が証明し、次回のビザ更新を円滑化するため。',
          en: 'Pre-certifies that new job activities comply with current visa, ensuring smooth renewal.',
        },
        priority: 'recommended',
        timing: 'before-event',
        jurisdiction: 'national',
        authority: '出入国在留管理局',
        deadlineDays: null,
        statutoryBasis: '出入国管理及び難民認定法第19条の2',
        reasonCode: 'REASON_SHUROU_SHIKAKU_SHOMEISHO',
        requiredDocuments: ['就労資格証明書交付申請書', '前職の源泉徴収票', '転職先の会社案内・雇用契約書', '法定調書合計表の写し'],
        capabilityId: 'immigration.workScope.check',
      });
    }

    items.push({
      id: 'task_prep_documents_for_new_employer',
      stage: 'before-new-job-starts',
      stageId: 'before-new-job-starts',
      title: {
        vi: 'Chuẩn bị hồ sơ nộp cho công ty mới',
        ja: '新勤務先への提出書類の準備',
        en: 'Prepare Onboarding Documents for New Employer',
      },
      why: {
        vi: 'Cung cấp cho phòng Nhân sự công ty mới để tiếp tục đóng BHXH và tính thuế thu nhập đúng bậc.',
        ja: '新勤務先の社会保険加入および年末調整・給与計算に必須となるため。',
        en: 'Required by new employer for social insurance and correct tax withholding.',
      },
      priority: 'required',
      timing: 'before-event',
      jurisdiction: 'employer',
      authority: '新勤務先（人事担当）',
      deadlineDays: null,
      statutoryBasis: '労働基準法・所得税法',
      reasonCode: 'REASON_NEW_JOB_DOC_PREP',
      requiredDocuments: [
        '年金手帳または基礎年金番号通知書',
        '雇用保険被保険者証',
        '前職の源泉徴収票',
        '在留カード（両面コピー）',
        'マイナンバー確認書類',
      ],
      capabilityId: 'documents.certificate.guide',
    });

    // ==========================================
    // STAGE 4: After Starting New Job
    // ==========================================
    items.push({
      id: 'task_new_employer_social_insurance',
      stage: 'after-starting-new-job',
      stageId: 'after-starting-new-job',
      title: {
        vi: 'Tái tham gia Shakai Hoken tại công ty mới và trả lại thẻ BHYT Quốc dân (nếu có)',
        ja: '新勤務先での社会保険加入と国民健康保険の脱退手続き',
        en: 'Enroll in New Employer Social Insurance & Withdraw from NHI',
      },
      why: {
        vi: 'Khi có thẻ BHYT mới của công ty, nếu trước đó có đóng BHYT Quốc dân (NHI), bạn phải mang thẻ mới ra Tòa thị chính để cắt NHI, tránh bị tính phí trùng.',
        ja: '職場の健康保険証が交付されたら、市役所で国保の脱退手続きを行わないと二重請求となるため。',
        en: 'Once new company insurance card arrives, must formally withdraw from municipal NHI to prevent double billing.',
      },
      priority: 'urgent',
      timing: 'after-event',
      jurisdiction: 'employer',
      authority: '新勤務先および市区町村役所',
      deadlineDays: 14,
      statutoryBasis: '国民健康保険法第9条・健康保険法第48条',
      reasonCode: 'REASON_NEW_COMPANY_SHAKAI_HOKEN',
      requiredDocuments: ['新会社から交付された健康保険証', '国民健康保険証'],
      capabilityId: 'insurance.socialInsurance.calculate',
    });

    items.push({
      id: 'task_year_end_tax_adjustment',
      stage: 'after-starting-new-job',
      stageId: 'after-starting-new-job',
      title: {
        vi: 'Nộp phiếu Gensen Choshuhyo công ty cũ để làm Quyết toán thuế cuối năm (Nenmatsu Chosei)',
        ja: '前職の源泉徴収票を新会社へ提出（年末調整の合算）',
        en: 'Submit Old Employer Gensen Choshuhyo for Year-end Tax Adjustment',
      },
      why: {
        vi: 'Công ty mới cần phiếu thu nhập công ty cũ để gộp chung thu nhập cả năm và quyết toán thuế vào tháng 12.',
        ja: '1年間の給与所得を通算して所得税を過不足精算するために前職の源泉徴収票が必要。提出できない場合は確定申告が必要。',
        en: 'Combines all annual salary income for December adjustment, eliminating individual tax return filing.',
      },
      priority: 'required',
      timing: 'later',
      jurisdiction: 'employer',
      authority: '新勤務先（経理・給与担当）',
      deadlineDays: null,
      statutoryBasis: '所得税法第190条（年末調整）',
      reasonCode: 'REASON_NENMATSU_CHOSEI_COMBINE',
      requiredDocuments: ['前職の源泉徴収票', '扶養控除等申告書', '保険料控除申告書'],
      capabilityId: 'tax.japan.calculate',
    });

    return items;
  },
};

/**
 * Runtime instance cho sự kiện Changing Job
 */
export const changingJobRuntime = createLifeEventRuntime(changingJobDefinition);
