/**
 * @file packages/core/src/japan/employment/engines/paidLeaveEngine.js
 * @description
 * Statutory Paid Leave Calculation Engine (有給休暇算定エンジン)
 * Implements exact formulas according to:
 * - 労働基準法 第39条 (Full-time & Part-time Proportional Grant)
 * - 労働基準法 第39条第7項 (年5日取得義務)
 * - 労働基準法 第115条 (2年時効)
 */

import {
  FULL_TIME_PAID_LEAVE_TABLE,
  PART_TIME_PROPORTIONAL_TABLE,
  MINIMUM_ATTENDANCE_RATE,
  MANDATORY_LEAVE_THRESHOLD_DAYS,
  MANDATORY_LEAVE_DAYS,
  STATUTE_OF_LIMITATIONS_YEARS,
  PAID_LEAVE_SOURCES
} from '../rules/paidLeaveTables.js';

/**
 * Tính số tháng làm việc liên tục giữa 2 mốc thời gian.
 * @param {string|Date} hireDate
 * @param {string|Date} [asOfDate]
 * @returns {{ months: number, years: number, formattedService: string }}
 */
export function calculateServiceDuration(hireDate, asOfDate = new Date()) {
  const start = new Date(hireDate);
  const end = new Date(asOfDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return { months: 0, years: 0, formattedService: '0年0ヶ月' };
  }

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  const dayDiff = end.getDate() - start.getDate();

  if (dayDiff < 0) {
    months -= 1;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const totalMonths = years * 12 + months;
  const floatYears = parseFloat((totalMonths / 12).toFixed(1));

  return {
    months: totalMonths,
    years: floatYears,
    fullYears: years,
    remainingMonths: months,
    formattedService: `${years}年${months}ヶ月`
  };
}

/**
 * Cộng thêm số tháng vào một ngày cụ thể (giữ đúng ngày hoặc ngày cuối tháng).
 * @param {Date} date
 * @param {number} months
 * @returns {Date}
 */
export function addMonths(date, months) {
  const result = new Date(date);
  const expectedMonth = result.getMonth() + months;
  result.setMonth(expectedMonth);
  return result;
}

/**
 * Định dạng Date thành YYYY-MM-DD
 * @param {Date} date
 * @returns {string}
 */
export function formatDate(date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Xác định xem người lao động có thuộc diện cấp phép theo tỷ lệ (比例付与対象者) hay không.
 * Điều kiện: Dưới 30h/tuần VÀ từ 4 ngày/tuần trở xuống (hoặc <= 216 ngày/năm).
 * @param {Object} params
 * @param {number} [params.weeklyHours]
 * @param {number} [params.weeklyDays]
 * @param {number} [params.annualDays]
 * @returns {boolean}
 */
export function isProportionalGrant({ weeklyHours, weeklyDays, annualDays }) {
  // Nếu làm từ 30h/tuần trở lên -> Luôn là người lao động thông thường (Full-time)
  if (typeof weeklyHours === 'number' && weeklyHours >= 30) {
    return false;
  }

  // Nếu làm từ 5 ngày/tuần trở lên hoặc trên 216 ngày/năm -> Thông thường
  if (typeof weeklyDays === 'number' && weeklyDays >= 5) {
    return false;
  }
  if (typeof annualDays === 'number' && annualDays > 216) {
    return false;
  }

  // Thuộc diện bán thời gian / tỷ lệ
  if (typeof weeklyDays === 'number' && weeklyDays >= 1 && weeklyDays <= 4) {
    return true;
  }
  if (typeof annualDays === 'number' && annualDays >= 48 && annualDays <= 216) {
    return true;
  }

  return false;
}

/**
 * Tìm số ngày phép năm cấp mới theo thâm niên (tháng).
 * @param {Object} params
 * @param {boolean} params.proportional
 * @param {number} params.serviceMonths
 * @param {number} [params.weeklyDays]
 * @param {number} [params.annualDays]
 * @returns {number}
 */
export function lookupStatutoryGrantDays({ proportional, serviceMonths, weeklyDays, annualDays }) {
  if (serviceMonths < 6) {
    return 0;
  }

  if (!proportional) {
    // Toàn thời gian / thông thường
    let grant = 10;
    for (const tier of FULL_TIME_PAID_LEAVE_TABLE) {
      if (serviceMonths >= tier.serviceMonths) {
        grant = tier.grantDays;
      } else {
        break;
      }
    }
    return grant;
  }

  // Bán thời gian / tỷ lệ
  let schedule = null;
  if (typeof weeklyDays === 'number' && weeklyDays >= 1 && weeklyDays <= 4) {
    schedule = PART_TIME_PROPORTIONAL_TABLE.find((s) => s.weeklyDays === weeklyDays);
  } else if (typeof annualDays === 'number') {
    schedule = PART_TIME_PROPORTIONAL_TABLE.find(
      (s) => annualDays >= s.annualDaysRange.min && annualDays <= s.annualDaysRange.max
    );
  }

  if (!schedule) {
    // Mặc định fallback về 4 ngày/tuần nếu không xác định
    schedule = PART_TIME_PROPORTIONAL_TABLE[0];
  }

  let grant = schedule.grants[0].grantDays;
  for (const tier of schedule.grants) {
    if (serviceMonths >= tier.serviceMonths) {
      grant = tier.grantDays;
    } else {
      break;
    }
  }

  return grant;
}

/**
 * Tạo lịch sử các mốc cấp phép từ khi vào công ty đến hiện tại và tương lai gần.
 * @param {Object} params
 * @param {string|Date} params.hireDate
 * @param {string|Date} [params.asOfDate]
 * @param {boolean} params.proportional
 * @param {number} [params.weeklyDays]
 * @param {number} [params.annualDays]
 * @returns {Array<Object>}
 */
export function generateGrantSchedule({ hireDate, asOfDate = new Date(), proportional, weeklyDays, annualDays }) {
  const start = new Date(hireDate);
  const now = new Date(asOfDate);
  const schedule = [];

  const milestones = [6, 18, 30, 42, 54, 66, 78, 90, 102, 114, 126];

  for (const months of milestones) {
    const grantDate = addMonths(start, months);
    const expiryDate = addMonths(grantDate, 24); // 2 năm theo Điều 115
    const days = lookupStatutoryGrantDays({ proportional, serviceMonths: months, weeklyDays, annualDays });

    const isPast = grantDate <= now;
    const isExpired = expiryDate < now;
    const isCurrentPeriod = isPast && !isExpired && addMonths(grantDate, 12) >= now;

    schedule.push({
      serviceMonths: months,
      grantDate: formatDate(grantDate),
      expiryDate: formatDate(expiryDate),
      grantDays: days,
      isPast,
      isExpired,
      isCurrentPeriod,
      mandatory5Days: days >= MANDATORY_LEAVE_THRESHOLD_DAYS
    });

    // Chỉ sinh thêm 1 mốc tương lai tiếp theo
    if (grantDate > now) {
      break;
    }
  }

  return schedule;
}

/**
 * Tính toán toàn diện quyền nghỉ phép năm có lương của người lao động.
 * @param {Object} params
 * @param {string} params.hireDate - Ngày vào công ty (YYYY-MM-DD)
 * @param {string} [params.asOfDate] - Ngày đối soát (mặc định hôm nay)
 * @param {string} [params.employmentType] - 'full_time' | 'part_time'
 * @param {number} [params.weeklyHours=40] - Số giờ làm việc quy định/tuần
 * @param {number} [params.weeklyDays=5] - Số ngày làm việc quy định/tuần
 * @param {number} [params.annualScheduledDays] - Số ngày làm việc/năm (nếu theo năm)
 * @param {number} [params.attendanceRate=1.0] - Tỷ lệ chuyên cần (0.0 đến 1.0)
 * @param {number} [params.usedDaysCurrent=0] - Số ngày phép đã dùng trong kỳ hiện tại
 * @param {number} [params.carriedOverDays=0] - Số ngày phép chuyển tiếp từ kỳ trước còn lại
 * @returns {Object} Kết quả chi tiết, chỉ số cảnh báo, phân tích và nguồn luật
 */
export function calculatePaidLeaveEntitlement({
  hireDate,
  asOfDate = new Date(),
  employmentType = 'full_time',
  weeklyHours = 40,
  weeklyDays = 5,
  annualScheduledDays,
  attendanceRate = 1.0,
  usedDaysCurrent = 0,
  carriedOverDays = 0
}) {
  const service = calculateServiceDuration(hireDate, asOfDate);

  // Xác định diện hưởng
  const isProportional = isProportionalGrant({
    weeklyHours: Number(weeklyHours),
    weeklyDays: Number(weeklyDays),
    annualDays: annualScheduledDays ? Number(annualScheduledDays) : undefined
  });

  // Kiểm tra điều kiện chuyên cần 80% (出勤率8割以上)
  const isAttendanceQualified = Number(attendanceRate) >= MINIMUM_ATTENDANCE_RATE;

  // Tra cứu số ngày phép cấp mới theo luật
  const statutoryBaseGrant = lookupStatutoryGrantDays({
    proportional: isProportional,
    serviceMonths: service.months,
    weeklyDays: Number(weeklyDays),
    annualDays: annualScheduledDays ? Number(annualScheduledDays) : undefined
  });

  // Nếu không đủ 80% chuyên cần -> 0 ngày cho kỳ này
  const currentGrantDays = isAttendanceQualified ? statutoryBaseGrant : 0;

  // Lịch sử cấp phép & hạn dùng
  const grantSchedule = generateGrantSchedule({
    hireDate,
    asOfDate,
    proportional: isProportional,
    weeklyDays: Number(weeklyDays),
    annualDays: annualScheduledDays ? Number(annualScheduledDays) : undefined
  });

  // Mốc cấp phép hiện tại
  const pastGrants = grantSchedule.filter((g) => g.isPast);
  const currentMilestone = pastGrants.length > 0 ? pastGrants[pastGrants.length - 1] : null;
  const nextMilestone = grantSchedule.find((g) => !g.isPast) || null;

  // Nghĩa vụ nghỉ 5 ngày theo luật (労働基準法第39条第7項)
  // Áp dụng nếu kỳ hiện tại được cấp từ 10 ngày trở lên
  const isMandatory5DaysApplicable = currentGrantDays >= MANDATORY_LEAVE_THRESHOLD_DAYS;
  const mandatoryTargetDays = isMandatory5DaysApplicable ? MANDATORY_LEAVE_DAYS : 0;
  const totalDaysTaken = Math.max(0, Number(usedDaysCurrent) || 0);
  const mandatoryDaysRemaining = isMandatory5DaysApplicable
    ? Math.max(0, MANDATORY_LEAVE_DAYS - totalDaysTaken)
    : 0;

  // Ngày hết hạn nghĩa vụ nghỉ 5 ngày (1 năm từ ngày cấp hiện tại)
  const currentGrantDateObj = currentMilestone ? new Date(currentMilestone.grantDate) : null;
  const mandatoryDeadlineDate = currentGrantDateObj ? formatDate(addMonths(currentGrantDateObj, 12)) : null;

  // Tính số dư khả dụng (Available Balance)
  const validCarriedOver = Math.max(0, Number(carriedOverDays) || 0);
  const totalEntitledDays = currentGrantDays + validCarriedOver;
  const remainingAvailableDays = Math.max(0, totalEntitledDays - totalDaysTaken);

  // Phân tích cảnh báo (Advisory warnings)
  const warnings = [];
  if (service.months < 6) {
    warnings.push({
      code: 'UNDER_SIX_MONTHS',
      level: 'info',
      ja: '勤続期間が6ヶ月未満のため、法定の年次有給休暇はまだ付与されていません（次回付与予定日をご確認ください）。',
      vi: 'Thời gian làm việc dưới 6 tháng nên chưa phát sinh ngày phép năm luật định (vui lòng xem ngày cấp kế tiếp).',
      en: 'Continuous service is under 6 months; statutory annual paid leave is not yet granted.'
    });
  } else if (!isAttendanceQualified) {
    warnings.push({
      code: 'ATTENDANCE_RATE_BELOW_80',
      level: 'warning',
      ja: '算定期間の出勤率が80%未満であるため、今回の年次有給休暇の付与日数は0日となります（労働基準法第39条）。',
      vi: 'Tỷ lệ chuyên cần trong kỳ đạt dưới 80%, do đó số ngày phép năm được cấp kỳ này là 0 ngày (Điều 39 Luật Tiêu chuẩn Lao động).',
      en: 'Attendance rate is below 80%; statutory paid leave grant for this period is 0 days.'
    });
  }

  if (isMandatory5DaysApplicable && mandatoryDaysRemaining > 0) {
    warnings.push({
      code: 'MANDATORY_5_DAYS_PENDING',
      level: 'warning',
      ja: `【年5日取得義務】年10日以上の有給が付与されているため、会社は期限（${mandatoryDeadlineDate}）までに残り${mandatoryDaysRemaining}日を取得させる義務があります（違反時：30万円以下の罰金）。`,
      vi: `【Nghĩa vụ nghỉ 5 ngày】Được cấp từ 10 ngày phép trở lên, người sử dụng lao động có nghĩa vụ đảm bảo người lao động nghỉ ít nhất 5 ngày trước hạn (${mandatoryDeadlineDate}). Hiện còn thiếu ${mandatoryDaysRemaining} ngày (Phạt vi phạm: tối đa 300.000 yên).`,
      en: `[Mandatory 5-Day Leave] As 10+ days were granted, employer must ensure at least 5 days are taken before ${mandatoryDeadlineDate}. ${mandatoryDaysRemaining} days remaining (Penalty for employer: up to 300,000 JPY).`
    });
  }

  return {
    serviceDuration: service,
    isProportional,
    isAttendanceQualified,
    attendanceRate: Number(attendanceRate),
    statutoryBaseGrant,
    currentGrantDays,
    carriedOverDays: validCarriedOver,
    totalEntitledDays,
    usedDays: totalDaysTaken,
    remainingAvailableDays,
    mandatory5Days: {
      isApplicable: isMandatory5DaysApplicable,
      targetDays: mandatoryTargetDays,
      usedDays: Math.min(totalDaysTaken, mandatoryTargetDays),
      remainingDays: mandatoryDaysRemaining,
      deadlineDate: mandatoryDeadlineDate,
      employerPenaltyNoticeJa: '労働基準法第120条に基づき、年5日取得義務違反は労働者1人あたり最大30万円の罰金対象となります。',
      employerPenaltyNoticeVi: 'Theo Điều 120 Luật Tiêu chuẩn Lao động, vi phạm nghĩa vụ nghỉ 5 ngày chịu phạt tối đa 300.000 yên cho mỗi người lao động.'
    },
    currentMilestone,
    nextMilestone,
    grantSchedule,
    statuteOfLimitationsYears: STATUTE_OF_LIMITATIONS_YEARS,
    warnings,
    sources: PAID_LEAVE_SOURCES
  };
}
