/**
 * National Pension Rates & Rules (国民年金保険料・免除・前納規則)
 * Sources:
 * - jps-national-pension-2026 (日本年金機構: 国民年金保険料)
 */

export const NATIONAL_PENSION_SCHEDULES = [
  {
    effectiveFrom: '2026-04-01',
    effectiveTo: '2027-03-31',
    monthlyPremium: 17920,
    additionalPensionMonthly: 400, // 付加年金
    advanceDiscounts: {
      account_transfer: {
        six_months: 1130,
        one_year: 4160,
        two_years: 16590
      },
      credit_card: {
        six_months: 800,
        one_year: 3520,
        two_years: 15290
      },
      cash: {
        six_months: 800,
        one_year: 3520,
        two_years: 15290
      }
    },
    sourceId: 'jps-national-pension-2026',
    notes: '令和8年度（2026年4月〜2027年3月）国民年金保険料: 月額 17,920円'
  },
  {
    effectiveFrom: '2025-04-01',
    effectiveTo: '2026-03-31',
    monthlyPremium: 17510,
    additionalPensionMonthly: 400,
    advanceDiscounts: {
      account_transfer: {
        six_months: 1130,
        one_year: 4160,
        two_years: 16590
      },
      credit_card: {
        six_months: 800,
        one_year: 3520,
        two_years: 15290
      },
      cash: {
        six_months: 800,
        one_year: 3520,
        two_years: 15290
      }
    },
    sourceId: 'jps-national-pension-2026',
    notes: '令和7年度（2025年4月〜2026年3月）国民年金保険料: 月額 17,510円'
  }
];

export const EXEMPTION_TYPES = {
  none: {
    id: 'none',
    name: {
      ja: '通常納付 (免除なし)',
      vi: 'Đóng thông thường (Không miễn giảm)',
      en: 'Regular Payment (No exemption)'
    },
    payMultiplier: 1.0,
    benefitReflection: 8 / 8, // 100%
    qualifyingMonthsCredited: true,
    description: {
      ja: '全額を納付し、将来の老齢基礎年金が100%満額反映されます。',
      vi: 'Đóng đủ 100% phí bảo hiểm, lương hưu cơ bản tuổi già sau này hưởng trọn vẹn 100%.',
      en: 'Full contribution paid; receives 100% benefit calculation in old-age basic pension.'
    }
  },
  quarter_exempt: {
    id: 'quarter_exempt',
    name: {
      ja: '4分の1免除 (4分の3納付)',
      vi: 'Miễn 1/4 (Đóng 3/4)',
      en: '1/4 Exemption (Pay 3/4)'
    },
    payMultiplier: 0.75,
    benefitReflection: 7 / 8, // 87.5%
    qualifyingMonthsCredited: true,
    description: {
      ja: '保険料の4分の3を納付。将来の年金額には7/8（87.5%）が反映されます。',
      vi: 'Đóng 3/4 số tiền phí. Lương hưu cơ bản được tính tương đương 7/8 (87.5%).',
      en: 'Pays 3/4 of premium. 7/8 (87.5%) of old-age pension benefit is credited.'
    }
  },
  half_exempt: {
    id: 'half_exempt',
    name: {
      ja: '半額免除 (2分の1納付)',
      vi: 'Miễn 1/2 (Đóng 1/2)',
      en: 'Half Exemption (Pay 1/2)'
    },
    payMultiplier: 0.5,
    benefitReflection: 6 / 8, // 75%
    qualifyingMonthsCredited: true,
    description: {
      ja: '保険料の半額を納付。将来の年金額には3/4（75%）が反映されます。',
      vi: 'Đóng một nửa số tiền phí. Lương hưu cơ bản được tính tương đương 3/4 (75%).',
      en: 'Pays half of premium. 6/8 (75%) of old-age pension benefit is credited.'
    }
  },
  three_quarters_exempt: {
    id: 'three_quarters_exempt',
    name: {
      ja: '4分の3免除 (4分の1納付)',
      vi: 'Miễn 3/4 (Đóng 1/4)',
      en: '3/4 Exemption (Pay 1/4)'
    },
    payMultiplier: 0.25,
    benefitReflection: 5 / 8, // 62.5%
    qualifyingMonthsCredited: true,
    description: {
      ja: '保険料の4分の1を納付。将来の年金額には5/8（62.5%）が反映されます。',
      vi: 'Đóng 1/4 số tiền phí. Lương hưu cơ bản được tính tương đương 5/8 (62.5%).',
      en: 'Pays 1/4 of premium. 5/8 (62.5%) of old-age pension benefit is credited.'
    }
  },
  full_exempt: {
    id: 'full_exempt',
    name: {
      ja: '全額免除',
      vi: 'Miễn toàn bộ (0円)',
      en: 'Full Exemption (0 JPY)'
    },
    payMultiplier: 0.0,
    benefitReflection: 4 / 8, // 50% from national treasury
    qualifyingMonthsCredited: true,
    description: {
      ja: '保険料の納付は0円。国庫負担により将来の年金額には1/2（50%）が反映されます。',
      vi: 'Không phải nộp đồng nào (0円). Nhờ ngân sách quốc gia hỗ trợ, lương hưu vẫn được tính 1/2 (50%).',
      en: 'Pays 0 JPY. Due to national treasury funding, 1/2 (50%) of pension benefit is credited.'
    }
  },
  deferment: {
    id: 'deferment',
    name: {
      ja: '納付猶予 (50歳未満)',
      vi: 'Hoãn nộp (Người dưới 50 tuổi)',
      en: 'Contribution Deferment (< 50yo)'
    },
    payMultiplier: 0.0,
    benefitReflection: 0.0, // 0% unless retroactively paid
    qualifyingMonthsCredited: true,
    description: {
      ja: '納付は0円。受給資格期間には算入されますが、追納しない限り将来の受給額には反映されません。',
      vi: 'Không phải nộp (0円). Thời gian này được tính vào số năm điều kiện hưởng hưu (10 năm), nhưng không tăng tiền lương hưu trừ khi truy đóng (追納).',
      en: 'Pays 0 JPY. Counts towards the 10-year qualification period, but 0 added to benefit unless backpaid.'
    }
  },
  student_special: {
    id: 'student_special',
    name: {
      ja: '学生納付特例',
      vi: 'Đặc lệ hoãn sinh viên',
      en: 'Special Student Deferment'
    },
    payMultiplier: 0.0,
    benefitReflection: 0.0,
    qualifyingMonthsCredited: true,
    description: {
      ja: '在学中の納付が0円。受給資格期間および障害・遺族年金の受給要件に算入されます。',
      vi: 'Sinh viên không phải nộp (0円). Được tính vào năm điều kiện và bảo đảm quyền lợi bảo hiểm khuyết tật / tử tuất.',
      en: 'Pays 0 JPY during studies. Counts towards qualifying period and disability/survivor coverage.'
    }
  }
};

/**
 * Resolves national pension schedule for a date
 */
export function getNationalPensionSchedule(targetDate = new Date().toISOString().slice(0, 10)) {
  const d = String(targetDate).slice(0, 10);
  return NATIONAL_PENSION_SCHEDULES.find((s) => d >= s.effectiveFrom && d <= s.effectiveTo) || null;
}
