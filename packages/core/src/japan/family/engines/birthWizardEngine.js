/**
 * @file packages/core/src/japan/family/engines/birthWizardEngine.js
 * @description
 * Engine điều phối toàn diện lộ trình Mang thai, Sinh con & Nuôi con Nhật Bản (Birth & Childcare Wizard Orchestrator).
 * Tính toán chính xác:
 * - Khoản hỗ trợ sinh con trọn gói 500,000円 (出産育児一時金) và phần chênh lệch viện phí
 * - Cấu trúc 6 giai đoạn lộ trình và tiến độ hoàn thành các đầu việc hành chính
 * - Tích hợp dữ liệu đặc thù địa phương (Fukuoka City, Chiyoda-ku, v.v.)
 */

import {
  BIRTH_GRANT_CONSTANTS,
  ROADMAP_STAGES,
} from '../rules/birthWizardRules.js';
import { getMunicipalFamilyData } from '../locality/municipalRegistry.js';

/**
 * Tính toán Khoản hỗ trợ sinh con trọn gói (出産育児一時金)
 * @param {Object} params
 * @param {number} [params.childCount=1] Số lượng bé sinh (đơn thai: 1, sinh đôi: 2...)
 * @param {boolean} [params.isParticipatingInObstetricCompensation=true] Bệnh viện có tham gia Chế độ bồi thường sự cố sản khoa không
 * @param {number} [params.actualHospitalCost=500000] Tổng chi phí sinh con và nằm viện thực tế (yên)
 * @param {string} [params.paymentMethod='direct_payment'] Hình thức thanh toán (direct_payment, recipient_proxy, reimbursement)
 * @returns {Object} Kết quả chi tiết số tiền trợ cấp, khoản tự chi trả thêm hoặc số tiền dư được hoàn lại
 */
export function calculateChildbirthLumpSumGrant(params = {}) {
  const childCount = Math.max(1, parseInt(params.childCount, 10) || 1);
  const isCompensation = params.isParticipatingInObstetricCompensation !== false;
  const actualCost = Math.max(0, parseInt(params.actualHospitalCost, 10) || 0);
  const paymentMethod = params.paymentMethod || BIRTH_GRANT_CONSTANTS.PAYMENT_METHODS.DIRECT_PAYMENT;

  const grantPerChild = isCompensation
    ? BIRTH_GRANT_CONSTANTS.STANDARD_AMOUNT
    : BIRTH_GRANT_CONSTANTS.NON_COMPENSATION_AMOUNT;

  const totalGrantAmount = grantPerChild * childCount;

  // Nếu chi phí thực tế vượt quá trợ cấp: Người dùng tự bù chênh lệch (Out-of-pocket expense)
  const outOfPocketExpense = Math.max(0, actualCost - totalGrantAmount);

  // Nếu chi phí thực tế thấp hơn trợ cấp: Người dùng được hoàn lại phần dư từ BHYT (Surplus refund)
  const surplusRefund = actualCost > 0 ? Math.max(0, totalGrantAmount - actualCost) : 0;

  return {
    childCount,
    isParticipatingInObstetricCompensation: isCompensation,
    grantPerChild,
    totalGrantAmount,
    actualHospitalCost: actualCost,
    outOfPocketExpense,
    surplusRefund,
    paymentMethod,
    isDirectPayment: paymentMethod === BIRTH_GRANT_CONSTANTS.PAYMENT_METHODS.DIRECT_PAYMENT,
    summaryJa: `支給額は1児あたり ${grantPerChild.toLocaleString()}円（合計 ${totalGrantAmount.toLocaleString()}円）です。` +
      (actualCost > 0
        ? (outOfPocketExpense > 0
            ? `実際の分べん費用との差額として、窓口で ${outOfPocketExpense.toLocaleString()}円の自己負担が発生します。`
            : `分べん費用が一時金未満のため、差額申請により ${surplusRefund.toLocaleString()}円が口座に還付されます。`)
        : ''),
    summaryVi: `Mức trợ cấp là ${grantPerChild.toLocaleString()}円/bé (tổng ${totalGrantAmount.toLocaleString()}円). ` +
      (actualCost > 0
        ? (outOfPocketExpense > 0
            ? `Chi phí thực tế vượt mức trợ cấp, bạn cần thanh toán thêm tại viện ${outOfPocketExpense.toLocaleString()}円.`
            : `Chi phí thực tế thấp hơn mức trợ cấp, bạn sẽ được BHYT hoàn trả lại ${surplusRefund.toLocaleString()}円 vào tài khoản.`)
        : ''),
    summaryEn: `Grant amount is ${grantPerChild.toLocaleString()} JPY per child (total ${totalGrantAmount.toLocaleString()} JPY). ` +
      (actualCost > 0
        ? (outOfPocketExpense > 0
            ? `Out-of-pocket payment at hospital cashier is ${outOfPocketExpense.toLocaleString()} JPY.`
            : `Hospital cost is below the grant; you can claim a refund of ${surplusRefund.toLocaleString()} JPY from your insurance.`)
        : ''),
  };
}

/**
 * Trả về danh sách 6 giai đoạn lộ trình kèm các thông tin tùy biến theo địa phương
 * @param {Object} [params]
 * @param {string} [params.jurisdictionCode] Mã địa phương (ví dụ: 'JP-40-40130' cho Fukuoka City)
 * @returns {Array<Object>} Danh sách các giai đoạn và đầu việc đã được bản địa hóa
 */
export function getRoadmapStages(params = {}) {
  const jurisdictionCode = params.jurisdictionCode;
  const municipalData = getMunicipalFamilyData(jurisdictionCode);

  return ROADMAP_STAGES.map((stage) => {
    // Sao chép các task để bổ sung ghi chú đặc thù địa phương (nếu có)
    const customizedTasks = stage.tasks.map((task) => {
      const taskCopy = { ...task };

      // Bổ sung thông tin địa phương Fukuoka City hoặc Chiyoda-ku
      if (municipalData) {
        if (task.id === 'task_pregnancy_notification') {
          taskCopy.localNotesJa = `【${municipalData.nameJa}の窓口】${municipalData.healthCenterWindowJa}。妊婦健診受診票（${municipalData.prenatalCheckupTickets.totalTickets}回分・約${municipalData.prenatalCheckupTickets.approximateTotalValueYen.toLocaleString()}円相当）が交付されます。`;
          taskCopy.localNotesVi = `【Tại ${municipalData.nameVi}】Nộp tại: ${municipalData.healthCenterWindowVi}. Cấp tập 14 phiếu khám thai trị giá khoảng ${municipalData.prenatalCheckupTickets.approximateTotalValueYen.toLocaleString()}円.`;
          taskCopy.localNotesEn = `【At ${municipalData.nameEn}】Window: ${municipalData.healthCenterWindowEn}. 14 prenatal vouchers issued (worth approx. ${municipalData.prenatalCheckupTickets.approximateTotalValueYen.toLocaleString()} JPY).`;
        }

        if (task.id === 'task_child_medical_subsidy') {
          taskCopy.localNotesJa = `【${municipalData.nameJa}の独自制度】助成対象：${municipalData.childMedicalSubsidy.targetAgeJa}。自己負担：${municipalData.childMedicalSubsidy.copaySummaryJa}。`;
          taskCopy.localNotesVi = `【Chính sách riêng của ${municipalData.nameVi}】Hỗ trợ đến: ${municipalData.childMedicalSubsidy.targetAgeVi}. Mức đồng chi trả: ${municipalData.childMedicalSubsidy.copaySummaryVi}.`;
          taskCopy.localNotesEn = `【${municipalData.nameEn} Local Policy】Eligible: ${municipalData.childMedicalSubsidy.targetAgeEn || municipalData.childMedicalSubsidy.targetAgeJa}. Copay: ${municipalData.childMedicalSubsidy.copaySummaryJa}.`;
        }

        if (task.id === 'task_pregnancy_support_gift' && municipalData.birthGiftGrant.hasGift) {
          taskCopy.localNotesJa = `【${municipalData.nameJa}】${municipalData.birthGiftGrant.titleJa}（${municipalData.birthGiftGrant.amountYen.toLocaleString()}円相当）が受給できます。`;
          taskCopy.localNotesVi = `【${municipalData.nameVi}】Được nhận: ${municipalData.birthGiftGrant.titleVi} (${municipalData.birthGiftGrant.amountYen.toLocaleString()}円).`;
          taskCopy.localNotesEn = `【${municipalData.nameEn}】Grant: ${municipalData.birthGiftGrant.titleJa} (${municipalData.birthGiftGrant.amountYen.toLocaleString()} JPY).`;
        }
      }

      return taskCopy;
    });

    return {
      ...stage,
      tasks: customizedTasks,
    };
  });
}

/**
 * Tính toán thống kê tiến độ hoàn thành các đầu việc trong checklist
 * @param {Array<string>} completedTaskIds Danh sách các mã đầu việc đã hoàn thành
 * @param {Array<Object>} [stages] Danh sách các giai đoạn
 * @returns {Object} Thống kê tổng thể và chi tiết từng giai đoạn
 */
export function calculateChecklistStats(completedTaskIds = [], stages = ROADMAP_STAGES) {
  const completedSet = new Set(completedTaskIds);

  let totalTasks = 0;
  let totalCompleted = 0;

  const stageStats = stages.map((stage) => {
    const stageTotal = stage.tasks.length;
    const stageCompleted = stage.tasks.filter((t) => completedSet.has(t.id)).length;
    const percent = stageTotal > 0 ? Math.round((stageCompleted / stageTotal) * 100) : 0;

    totalTasks += stageTotal;
    totalCompleted += stageCompleted;

    return {
      stageId: stage.stageId,
      order: stage.order,
      total: stageTotal,
      completed: stageCompleted,
      percent,
      isFullyCompleted: stageCompleted === stageTotal && stageTotal > 0,
    };
  });

  const overallPercent = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

  return {
    totalTasks,
    totalCompleted,
    overallPercent,
    isAllCompleted: totalCompleted === totalTasks && totalTasks > 0,
    stageStats,
  };
}
