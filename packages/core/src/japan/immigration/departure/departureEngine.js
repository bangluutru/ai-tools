/**
 * @file packages/core/src/japan/immigration/departure/departureEngine.js
 * @description
 * Engine đánh giá và lập kế hoạch Sự kiện Đời sống: Rời Nhật Bản (日本を離れる手続きガイド - 5th Life Event).
 * Hỗ trợ phân nhánh Xuất cảnh tạm thời (Minashi Re-entry vs Re-entry thông thường)
 * và Rời Nhật hẳn (Chuyển ra nước ngoài, My Number, Người đại diện thuế, Rút Nenkin 1 lần & Hoàn thuế 20.42%).
 */

import { DEPARTURE_STAGES, DEPARTURE_TASKS_CATALOG, DEPARTURE_SOURCES } from './departureRules.js';
import { addDays, calculateDaysRemaining } from '../arrival/arrivalEngine.js';

/**
 * Đánh giá checklist phẳng theo ngữ cảnh xuất cảnh
 * @param {Object} context 
 * @param {Object} [options] 
 * @returns {Array<Object>}
 */
export function evaluateDepartureChecklist(context = {}, options = {}) {
  const {
    departureDate = new Date().toISOString().split('T')[0],
    departureType = 'permanent', // 'permanent' | 'temporary'
    tripDurationMonths = 6,      // áp dụng khi 'temporary'
    hasPensionContributions = true,
    pensionContributionMonths = 24,
    hasKoseiNenkin = true,
  } = context;

  const flatTasks = [];
  const isTemporary = departureType === 'temporary';
  const isPermanent = departureType === 'permanent';

  for (const task of DEPARTURE_TASKS_CATALOG) {
    let include = false;

    if (isTemporary) {
      if (tripDurationMonths <= 12 && task.departureScope === 'temporary_short') {
        include = true;
      } else if (tripDurationMonths > 12 && task.departureScope === 'temporary_long') {
        include = true;
      }
    } else if (isPermanent) {
      if (task.departureScope === 'permanent') {
        if (task.id === 'task_lump_sum_pension') {
          include = Boolean(hasPensionContributions) && Number(pensionContributionMonths) >= 6;
        } else if (task.id === 'task_pension_tax_refund') {
          include = Boolean(hasPensionContributions) && Boolean(hasKoseiNenkin) && Number(pensionContributionMonths) >= 6;
        } else {
          include = true;
        }
      }
    }

    if (!include) continue;

    const item = { ...task };

    // Tính toán deadline nếu có
    if (item.deadlineRule && item.deadlineRule.anchorKey === 'departureDate' && departureDate) {
      if (item.deadlineRule.direction === 'before') {
        // Ví dụ nộp chuyển đi: trước hoặc đúng ngày xuất cảnh
        item.calculatedDeadlineDate = departureDate;
        item.earliestStartDate = addDays(departureDate, -item.deadlineRule.offsetDays);
      } else if (item.deadlineRule.direction === 'after') {
        // Ví dụ nộp Nenkin 1 lần: trong vòng 730 ngày sau ngày xuất cảnh
        item.calculatedDeadlineDate = addDays(departureDate, item.deadlineRule.offsetDays);
      }

      if (item.calculatedDeadlineDate) {
        item.daysRemaining = calculateDaysRemaining(item.calculatedDeadlineDate);
        item.isUrgent = item.daysRemaining !== null && item.daysRemaining <= 7 && item.daysRemaining >= 0;
        item.isOverdue = item.daysRemaining !== null && item.daysRemaining < 0;
      }
    }

    // Gắn thông tin về số tháng Nenkin và giới hạn 60 tháng nếu là task rút Nenkin
    if (item.id === 'task_lump_sum_pension') {
      const months = Number(pensionContributionMonths) || 0;
      item.pensionMonths = months;
      item.cappedMonths = Math.min(months, 60);
      item.isCappedAt60 = months > 60;
    }

    flatTasks.push(item);
  }

  return flatTasks;
}

/**
 * Sinh kế hoạch rời Nhật hoàn chỉnh có cấu trúc phân tầng và thống kê
 * @param {Object} context 
 * @param {Object} [options] 
 * @returns {Object}
 */
export function generateDeparturePlan(context = {}, options = {}) {
  const flatTasks = evaluateDepartureChecklist(context, options);
  const completedTaskIds = new Set(options.completedTaskIds || []);

  const stagesWithTasks = DEPARTURE_STAGES.map((stage) => {
    const tasksInStage = flatTasks.filter((t) => t.stageId === stage.id);
    const completedInStage = tasksInStage.filter((t) => completedTaskIds.has(t.id)).length;
    return {
      ...stage,
      tasks: tasksInStage,
      totalCount: tasksInStage.length,
      completedCount: completedInStage,
      isCompleted: tasksInStage.length > 0 && completedInStage === tasksInStage.length,
    };
  }).filter((s) => s.tasks.length > 0); // Chỉ giữ các stage có tasks tương ứng với nhánh lựa chọn

  const totalTasks = flatTasks.length;
  const completedTasks = flatTasks.filter((t) => completedTaskIds.has(t.id)).length;
  const requiredTasks = flatTasks.filter((t) => t.requirement === 'required');
  const requiredCompleted = requiredTasks.filter((t) => completedTaskIds.has(t.id)).length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const warnings = [];

  // 1. Cảnh báo nhánh xuất cảnh tạm thời
  if (context.departureType === 'temporary') {
    const months = Number(context.tripDurationMonths) || 0;
    if (months > 12) {
      warnings.push({
        id: 'warn_regular_reentry_needed',
        severity: 'warning',
        titleJa: '【要注意】1年を超える出国には「通常の再入国許可」の事前取得が必要です',
        titleVi: '【Lưu ý quan trọng】Chuyến đi trên 1 năm bắt buộc phải xin phép tái nhập cảnh trước tại Cục ISA',
        titleEn: '【Notice】Departure over 1 year requires applying for a formal Re-entry Permit at ISA',
        messageJa: 'みなし再入国許可（空港EDカード）は最長1年です。出国前に地方入管窓口で再入国許可（一次3,000円/数次6,000円）を取得しないと在留資格が失効します。',
        messageVi: 'Giấy phép đặc lệ Minashi Re-entry chỉ có hiệu lực tối đa 1 năm. Nếu không xin Giấy phép tái nhập cảnh tại Cục trước khi xuất cảnh, tư cách lưu trú sẽ bị hủy khi đi quá 1 năm.',
        messageEn: 'Special Minashi re-entry is valid for 1 year maximum. You must obtain a formal permit at ISA before departing Japan to prevent visa forfeiture.'
      });
    } else {
      warnings.push({
        id: 'info_minashi_reentry_validity',
        severity: 'info',
        titleJa: '【みなし再入国許可】空港出国審査でのチェックのみでOK（手数料無料）',
        titleVi: '【Minashi Re-entry】Chỉ cần tích chọn trên Phiếu ED tại quầy xuất cảnh sân bay (Miễn phí)',
        titleEn: '【Minashi Re-entry】Simply check the box on airport ED card (Free of charge)',
        messageJa: '1年以内（かつ在留期限内）に再入国する場合、事前申請は不要です。在留カードは穴あけされず手元に戻ります。',
        messageVi: 'Nếu tái nhập cảnh trong vòng 1 năm và trước khi hết hạn visa, bạn không cần làm thủ tục trước. Thẻ cư trú sẽ không bị bấm lỗ.',
        messageEn: 'No advance ISA application required if returning within 1 year. Your residence card will remain valid.'
      });
    }
  }

  // 2. Cảnh báo nhánh rời Nhật vĩnh viễn (Permanent)
  if (context.departureType === 'permanent') {
    // Cảnh báo hạn chót 2 năm rút Nenkin
    const pensionTask = flatTasks.find((t) => t.id === 'task_lump_sum_pension');
    if (pensionTask) {
      if (pensionTask.isCappedAt60) {
        warnings.push({
          id: 'info_pension_60months_cap',
          severity: 'info',
          titleJa: '【脱退一時金】支給上限は最大60ヶ月（5年分）です',
          titleVi: '【Nenkin 1 lần】Mức trần chi trả tối đa là 60 tháng (5 năm)',
          titleEn: '【Pension Lump-Sum】Payment is capped at a maximum of 60 months (5 years)',
          messageJa: `加入期間が ${pensionTask.pensionMonths} ヶ月ですが、法改正（2021年4月）に基づき最大60ヶ月分が計算基準となります。`,
          messageVi: `Bạn đã tham gia ${pensionTask.pensionMonths} tháng, theo quy định từ 04/2021 tiền rút một lần được tính tối đa 60 tháng.`,
          messageEn: `Your contribution is ${pensionTask.pensionMonths} months; under the April 2021 law revision, payment is capped at 60 months.`
        });
      }

      if (pensionTask.daysRemaining !== null) {
        if (pensionTask.isOverdue) {
          warnings.push({
            id: 'warn_pension_overdue',
            severity: 'danger',
            titleJa: '【期限切れ】出国から2年を超過しているため脱退一時金の請求権が消滅している可能性があります',
            titleVi: '【Hết hạn】Đã quá 2 năm kể từ ngày rời Nhật, quyền yêu cầu nhận Nenkin 1 lần có thể đã hết hiệu lực',
            titleEn: '【Expired】More than 2 years have elapsed since departure; claim rights may have expired',
            messageJa: '国民年金法・厚生年金保険法の規定により、日本国内に住所を有しなくなった日から2年を経過すると請求権が時効消滅します。',
            messageVi: 'Theo Luật Hưu trí, quyền yêu cầu thanh toán tiền rút một lần sẽ hết hiệu lực nếu quá 2 năm kể từ ngày không còn cư trú tại Nhật.',
            messageEn: 'Under Pension Law, rights to claim lump-sum withdrawal extinguish after 2 years from unregistering residence in Japan.'
          });
        } else if (pensionTask.daysRemaining <= 90) {
          warnings.push({
            id: 'warn_pension_urgent',
            severity: 'warning',
            titleJa: `【締切接近】脱退一時金の法定2年請求期限まであと約 ${pensionTask.daysRemaining} 日です`,
            titleVi: `【Sắp hết hạn】Chỉ còn khoảng ${pensionTask.daysRemaining} ngày để nộp hồ sơ xin Nenkin 1 lần`,
            titleEn: `【Approaching Deadline】Approx ${pensionTask.daysRemaining} days remaining for pension lump-sum claim`,
            messageJa: '郵送・書類審査に時間を要するため、速やかに請求書類一式を日本年金機構に送付してください。',
            messageVi: 'Do thủ tục qua đường bưu điện mất nhiều tuần, hãy chuẩn bị và gửi ngay hồ sơ đến Cơ quan Hưu trí Nhật Bản.',
            messageEn: 'Mail all required application documents to Japan Pension Service promptly as postal processing takes time.'
          });
        }
      }
    }

    // Cảnh báo người đại diện thuế để lấy lại 20.42%
    const taxRefundTask = flatTasks.find((t) => t.id === 'task_pension_tax_refund');
    if (taxRefundTask) {
      warnings.push({
        id: 'info_tax_admin_for_refund',
        severity: 'info',
        titleJa: '【重要】厚生年金脱退一時金の20.42%所得税還付には「納税管理人」が必須です',
        titleVi: '【Quan trọng】Bắt buộc phải có Người đại diện nộp thuế để nhận lại 20.42% thuế khấu trừ từ Nenkin',
        titleEn: '【Important】A Tax Administrator in Japan is required to receive your 20.42% tax refund',
        messageJa: '出国前に税務署へ「納税管理人の届出書」を提出してください。海外送金口座への直接還付はできないため、日本国内の納税管理人の口座に還付されます。',
        messageVi: 'Trước khi về nước, nộp Giấy chỉ định người đại diện nộp thuế cho Cục thuế. Tiền hoàn thuế 20.42% sẽ được chuyển vào tài khoản người đại diện tại Nhật.',
        messageEn: 'File the Tax Administrator declaration before departing. The refund cannot be wired overseas directly and must be deposited to the administrator account in Japan.'
      });
    }
  }

  return {
    context,
    stages: stagesWithTasks,
    flatTasks,
    summary: {
      totalTasks,
      completedTasks,
      requiredCount: requiredTasks.length,
      requiredCompleted,
      progressPercent,
    },
    warnings,
    sources: DEPARTURE_SOURCES,
  };
}
