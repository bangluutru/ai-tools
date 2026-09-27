/**
 * @file packages/core/src/japan/immigration/arrival/arrivalEngine.js
 * @description
 * Engine đánh giá và lập kế hoạch Sự kiện Đời sống: Đến Nhật Bản (来日後セットアップガイド).
 * Cung cấp chức năng sinh lộ trình theo ngữ cảnh cá nhân hóa, tính toán hạn chót pháp định 14 ngày.
 */

import { ARRIVAL_STAGES, ARRIVAL_TASKS_CATALOG, ARRIVAL_SOURCES } from './arrivalRules.js';
import { parseLocalDate, formatLocalDate, addDaysLocal, diffCalendarDays, resolveCurrentDate, todayLocalISO } from '../shared/localDate.js';

/**
 * Cộng thêm số ngày vào chuỗi ngày YYYY-MM-DD
 * @param {string} dateStr 
 * @param {number} days 
 * @returns {string}
 */
export function addDays(dateStr, days) {
  const d = parseLocalDate(dateStr);
  if (!d) return '';
  return formatLocalDate(addDaysLocal(d, days));
}

/**
 * Tính số ngày còn lại đến hạn chót
 * @param {string} deadlineDate 
 * @param {string} [currentDate] 
 * @returns {number|null}
 */
export function calculateDaysRemaining(deadlineDate, currentDate) {
  // Số ngày lịch (0 = hôm nay là hạn chót, vẫn còn trong hạn; âm = quá hạn)
  const target = parseLocalDate(deadlineDate);
  if (!target) return null;
  const now = resolveCurrentDate(currentDate);
  return diffCalendarDays(now, target);
}

/**
 * Đánh giá checklist phẳng cho LifeEventDefinition
 * @param {Object} context 
 * @param {Object} [options] 
 * @returns {Array<Object>}
 */
export function evaluateArrivalChecklist(context = {}, options = {}) {
  const {
    entryDate = todayLocalISO(),
    moveInDate, // Ngày xác định chỗ ở (住居地を定めた日) — mặc định bằng ngày nhập cảnh
    currentDate,
    statusCategory = 'work', // 'work' | 'student' | 'dependent'
    hasCompanyShakaiHoken = statusCategory === 'work',
    needsPartTimeWork = statusCategory === 'student' || statusCategory === 'dependent',
  } = context;

  const flatTasks = [];

  for (const task of ARRIVAL_TASKS_CATALOG) {
    let include = true;

    if (task.id === 'task_part_time_permit') {
      // Xin tại sân bay chỉ dành cho du học sinh MỚI nhập cảnh (留学)
      include = Boolean(needsPartTimeWork) && statusCategory === 'student';
    } else if (task.id === 'task_part_time_permit_regional') {
      // 家族滞在 v.v.: nộp tại Cục XNC khu vực sau khi đến Nhật
      include = Boolean(needsPartTimeWork) && statusCategory !== 'student';
    } else if (task.id === 'task_kokumin_kenpo' || task.id === 'task_kokumin_nenkin') {
      include = !hasCompanyShakaiHoken;
    } else if (task.id === 'task_fuyou_declaration') {
      // Chỉ áp dụng cho người đi làm
      include = statusCategory === 'work';
    } else if (task.id === 'task_commutation_allowance') {
      include = statusCategory === 'work' || statusCategory === 'student';
    }

    if (!include) continue;

    const item = { ...task };

    // Tính toán hạn chót cụ thể
    const anchorDate = item.deadlineRule && item.deadlineRule.anchorKey === 'moveInDate'
      ? (moveInDate || entryDate)
      : entryDate;
    if (item.deadlineRule && ['entryDate', 'moveInDate'].includes(item.deadlineRule.anchorKey) && anchorDate) {
      item.calculatedDeadlineDate = addDays(anchorDate, item.deadlineRule.offsetDays);
      item.daysRemaining = calculateDaysRemaining(item.calculatedDeadlineDate, currentDate);
      item.isUrgent = item.daysRemaining !== null && item.daysRemaining <= 3;
      item.isOverdue = item.daysRemaining !== null && item.daysRemaining < 0;
    }

    flatTasks.push(item);
  }

  return flatTasks;
}

/**
 * Sinh kế hoạch hoàn chỉnh có cấu trúc phân tầng theo giai đoạn và thống kê tiến độ
 * @param {Object} context 
 * @param {Object} [options] 
 * @returns {Object}
 */
export function generateArrivalPlan(context = {}, options = {}) {
  const flatTasks = evaluateArrivalChecklist(context, options);
  const completedTaskIds = new Set(options.completedTaskIds || []);

  const stagesWithTasks = ARRIVAL_STAGES.map((stage) => {
    const tasksInStage = flatTasks.filter((t) => t.stageId === stage.id);
    const completedInStage = tasksInStage.filter((t) => completedTaskIds.has(t.id)).length;
    return {
      ...stage,
      tasks: tasksInStage,
      totalCount: tasksInStage.length,
      completedCount: completedInStage,
      isCompleted: tasksInStage.length > 0 && completedInStage === tasksInStage.length,
    };
  });

  const totalTasks = flatTasks.length;
  const completedTasks = flatTasks.filter((t) => completedTaskIds.has(t.id)).length;
  const requiredTasks = flatTasks.filter((t) => t.requirement === 'required');
  const requiredCompleted = requiredTasks.filter((t) => completedTaskIds.has(t.id)).length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Cảnh báo hạn chót pháp lý 14 ngày
  const municipal14DaysTask = flatTasks.find((t) => t.id === 'task_resident_registration');
  const daysRemaining14 = municipal14DaysTask ? municipal14DaysTask.daysRemaining : null;

  const warnings = [];
  if (daysRemaining14 !== null) {
    if (daysRemaining14 < 0) {
      warnings.push({
        id: 'warn_overdue_14days',
        severity: 'danger',
        titleJa: '【期限超過】住民登録の法定14日期限を超過しています',
        titleVi: '【Quá hạn】Đã quá thời hạn 14 ngày đăng ký địa chỉ theo luật',
        titleEn: '【Overdue】14-day resident registration deadline has passed',
        messageJa: '入管法第19条の7に基づき、速やかに市区町村役場で転入届を行ってください。正当な理由のない遅延は過料または在留資格取消の対象となるリスクがあります。',
        messageVi: 'Cần đến ngay Tòa thị chính để nộp đơn chuyển đến. Chậm trễ không có lý do chính đáng có thể bị phạt hành chính hoặc ảnh hưởng đến tư cách lưu trú.',
        messageEn: 'Immediately visit your municipal office to register your address. Unjustified delay may incur fines or immigration scrutiny.'
      });
    } else if (daysRemaining14 <= 3) {
      warnings.push({
        id: 'warn_urgent_14days',
        severity: 'warning',
        titleJa: '【急ぎ】住民登録の法定14日期限が迫っています',
        titleVi: '【Gấp】Sắp hết hạn 14 ngày đăng ký địa chỉ cư trú',
        titleEn: '【Urgent】14-day resident registration deadline is approaching',
        messageJa: `残り ${daysRemaining14} 日です。在留カード裏面への住所記載を完了させてください。`,
        messageVi: `Chỉ còn ${daysRemaining14} ngày để hoàn thành thủ tục in địa chỉ lên mặt sau thẻ cư trú.`,
        messageEn: `Only ${daysRemaining14} days remaining to register your address on your residence card.`
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
      daysRemaining14,
    },
    warnings,
    sources: ARRIVAL_SOURCES,
  };
}
