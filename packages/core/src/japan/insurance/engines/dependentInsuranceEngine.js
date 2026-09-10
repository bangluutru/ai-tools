/**
 * Dependent Health Insurance Eligibility Evaluation Engine (社会保険 被扶養者 認定判定エンジン)
 * Deterministic rules evaluation according to Kyokai Kenpo & Health Insurance Act.
 * STRICT ISOLATION: This engine ONLY determines Social Insurance Dependency, NOT Tax Dependency.
 */

import { RELATIONSHIPS, RESIDENCE_EXCEPTIONS } from '../rules/dependentInsuranceRules.js';

export function evaluateDependentInsuranceEligibility({
  relationship = 'spouse',
  dependentAge = 30,
  isDisabled = false,
  isCohabiting = true,
  dependentFutureAnnualIncome = 1000000,
  insuredAnnualIncome = 5000000,
  annualRemittance = 0,
  residesInJapan = true,
  residenceException = 'none',
  hasEmployerOvertimeProof = false
} = {}) {
  const rel = RELATIONSHIPS[relationship] || RELATIONSHIPS.spouse;
  const age = Number(dependentAge) || 0;
  const depIncome = Number(dependentFutureAnnualIncome) || 0;
  const insIncome = Number(insuredAnnualIncome) || 0;
  const remittance = Number(annualRemittance) || 0;

  const checks = [];
  let isFailure = false;
  let isWarning = false;

  // 1. Age 75 Gate (後期高齢者医療制度)
  if (age >= 75) {
    checks.push({
      id: 'age_75',
      name: {
        ja: '後期高齢者医療制度の適用年齢',
        vi: 'Độ tuổi áp dụng chế độ y tế người cao tuổi (75 tuổi)',
        en: 'Late-Stage Elderly Healthcare Age (75+)'
      },
      status: 'fail',
      message: {
        ja: '75歳以上の方は後期高齢者医療制度の被保険者となるため、健康保険の被扶養者にはなれません。',
        vi: 'Người từ 75 tuổi trở lên bắt buộc chuyển sang chế độ Y tế người cao tuổi giai đoạn sau, không thể làm người phụ thuộc BHYT công ty.',
        en: 'Persons aged 75 or older are covered by the Late-Stage Elderly Healthcare System and cannot be dependents.'
      }
    });
    isFailure = true;
  } else {
    checks.push({
      id: 'age_75',
      name: {
        ja: '年齢制限（75歳未満）',
        vi: 'Giới hạn độ tuổi (< 75 tuổi)',
        en: 'Age requirement (< 75 yo)'
      },
      status: 'pass',
      message: {
        ja: '75歳未満のため、健康保険の被扶養者要件を満たしています。',
        vi: 'Dưới 75 tuổi, đáp ứng điều kiện tham gia BHYT công ty.',
        en: 'Under 75 years old; eligible for dependent health coverage.'
      }
    });
  }

  // 2. Relationship & Cohabitation Gate
  if (rel.cohabitationRequired && !isCohabiting) {
    checks.push({
      id: 'kinship_cohabitation',
      name: {
        ja: '親族範囲と同一世帯（同居）要件',
        vi: 'Quan hệ thân nhân và yêu cầu cùng hộ gia đình (Sống chung)',
        en: 'Kinship & Cohabitation requirement'
      },
      status: 'fail',
      message: {
        ja: `${rel.name.ja}は「同一世帯（同居）」が認定の必須要件です。別居している場合は認定されません。`,
        vi: `Quan hệ "${rel.name.vi}" bắt buộc phải cùng hộ gia đình (sống chung). Trường hợp sống riêng sẽ không được xét duyệt.`,
        en: `${rel.name.en} legally requires cohabitation (same household). Ineligible if living apart.`
      }
    });
    isFailure = true;
  } else {
    checks.push({
      id: 'kinship_cohabitation',
      name: {
        ja: '親族範囲と居住形態',
        vi: 'Quan hệ thân nhân & điều kiện sống chung',
        en: 'Kinship & Cohabitation'
      },
      status: 'pass',
      message: {
        ja: rel.cohabitationRequired
          ? `${rel.name.ja}であり、同居要件を満たしています。`
          : `${rel.name.ja}は別居であっても認定対象となります。`,
        vi: rel.cohabitationRequired
          ? `Quan hệ "${rel.name.vi}" và hiện đang sống chung, đáp ứng quy định.`
          : `Quan hệ "${rel.name.vi}" không bắt buộc sống chung, đáp ứng điều kiện.`,
        en: rel.cohabitationRequired
          ? `${rel.name.en} and meets the cohabitation requirement.`
          : `${rel.name.en} is eligible even when living separately.`
      }
    });
  }

  // 3. Domestic Residence Gate
  const hasValidException = residenceException && residenceException !== 'none';
  if (!residesInJapan && !hasValidException) {
    checks.push({
      id: 'domestic_residence',
      name: {
        ja: '国内居住要件（住民票）',
        vi: 'Điều kiện cư trú trong nước (Sổ thường trú)',
        en: 'Domestic residence requirement'
      },
      status: 'fail',
      message: {
        ja: '日本国内に住民票がない場合、原則として被扶養者になれません（留学等の公的例外を除く）。',
        vi: 'Người không có sổ cư trú tại Nhật Bản về nguyên tắc không được làm người phụ thuộc (trừ du học hoặc công tác có giấy tờ chứng minh).',
        en: 'Must have registered residence in Japan, unless qualifying for statutory exceptions (e.g. study abroad).'
      }
    });
    isFailure = true;
  } else {
    checks.push({
      id: 'domestic_residence',
      name: {
        ja: '国内居住要件',
        vi: 'Điều kiện cư trú tại Nhật Bản',
        en: 'Domestic residence'
      },
      status: 'pass',
      message: {
        ja: residesInJapan
          ? '日本国内に居住・住民票があるため要件を満たしています。'
          : `海外在住ですが、例外事由（${RESIDENCE_EXCEPTIONS[residenceException]?.name?.ja || residenceException}）に該当します。`,
        vi: residesInJapan
          ? 'Có cư trú thực tế tại Nhật Bản, đáp ứng yêu cầu luật định.'
          : `Đang ở nước ngoài nhưng thuộc diện ngoại lệ hợp lệ (${RESIDENCE_EXCEPTIONS[residenceException]?.name?.vi || residenceException}).`,
        en: residesInJapan
          ? 'Resides in Japan with registered address.'
          : `Resides abroad under recognized exception (${residenceException}).`
      }
    });
  }

  // 4. Annual Future Income Ceiling Gate (130万円 / 180万円の壁)
  const isSeniorOrDisabled = age >= 60 || isDisabled;
  const ceiling = isSeniorOrDisabled ? 1800000 : 1300000;
  const monthlyCeiling = isSeniorOrDisabled ? 150000 : 108334;

  if (depIncome >= ceiling) {
    if (hasEmployerOvertimeProof && depIncome <= 1500000 && !isSeniorOrDisabled) {
      checks.push({
        id: 'income_ceiling',
        name: {
          ja: '年間収入の上限基準（年収の壁支援パッケージ）',
          vi: 'Hạn mức thu nhập năm (Gói hỗ trợ bức tường thu nhập)',
          en: 'Annual income ceiling (Relief package)'
        },
        status: 'warning',
        message: {
          ja: `年収が130万円を超えていますが、一時的な増収（事業主証明書あり）の特例措置（最大2年間）の対象となる可能性があります。`,
          vi: `Thu nhập vượt 130 vạn Yên nhưng có thể được áp dụng gói nới lỏng tạm thời (tối đa 2 năm liên tiếp) nếu có bản xác nhận của chủ sử dụng lao động.`,
          en: `Income exceeds 1.3M JPY, but may qualify for temporary 2-year relief package with employer certification.`
        }
      });
      isWarning = true;
    } else {
      checks.push({
        id: 'income_ceiling',
        name: {
          ja: `年間収入の上限基準（${ceiling.toLocaleString('ja-JP')}円未満）`,
          vi: `Hạn mức thu nhập năm (Dưới ${(ceiling / 10000)} vạn Yên)`,
          en: `Annual income ceiling (< ${ceiling.toLocaleString()} JPY)`
        },
        status: 'fail',
        message: {
          ja: `見込み年収が${depIncome.toLocaleString('ja-JP')}円であり、法定上限（${ceiling.toLocaleString('ja-JP')}円未満・月額${monthlyCeiling.toLocaleString('ja-JP')}円未満）を超過しています。`,
          vi: `Thu nhập dự kiến ${depIncome.toLocaleString('ja-JP')}円/năm vượt trần luật định (dưới ${ceiling.toLocaleString('ja-JP')}円/năm, tức dưới ${monthlyCeiling.toLocaleString('ja-JP')}円/tháng).`,
          en: `Projected income of ${depIncome.toLocaleString()} JPY exceeds the ceiling (< ${ceiling.toLocaleString()} JPY/yr, < ${monthlyCeiling.toLocaleString()} JPY/mo).`
        }
      });
      isFailure = true;
    }
  } else {
    checks.push({
      id: 'income_ceiling',
      name: {
        ja: `年間収入の上限基準（${ceiling.toLocaleString('ja-JP')}円未満）`,
        vi: `Hạn mức thu nhập năm (Dưới ${(ceiling / 10000)} vạn Yên)`,
        en: `Annual income ceiling (< ${ceiling.toLocaleString()} JPY)`
      },
      status: 'pass',
      message: {
        ja: `見込み年収は${depIncome.toLocaleString('ja-JP')}円であり、基準（${ceiling.toLocaleString('ja-JP')}円未満）を下回っています。`,
        vi: `Thu nhập dự kiến ${depIncome.toLocaleString('ja-JP')}円/năm nằm trong giới hạn cho phép (dưới ${ceiling.toLocaleString('ja-JP')}円/năm).`,
        en: `Projected income of ${depIncome.toLocaleString()} JPY is within the statutory limit (< ${ceiling.toLocaleString()} JPY).`
      }
    });
  }

  // 5. Support & Maintenance Gate (主たる生計維持要件)
  if (isCohabiting) {
    if (depIncome >= insIncome) {
      checks.push({
        id: 'livelihood_support',
        name: {
          ja: '主たる生計維持（同居時の年収比較）',
          vi: 'Nuôi dưỡng chu cấp (So sánh thu nhập khi sống chung)',
          en: 'Primary livelihood support (cohabiting)'
        },
        status: 'fail',
        message: {
          ja: '被扶養者の収入が被保険者の収入以上であるため、被保険者が生計を主として維持しているとは認められません。',
          vi: 'Thu nhập của người phụ thuộc lớn hơn hoặc bằng người bảo hiểm chính, không thỏa mãn điều kiện chu cấp kinh tế.',
          en: 'Dependent income equals or exceeds insured person; fails primary support test.'
        }
      });
      isFailure = true;
    } else if (depIncome >= insIncome / 2) {
      checks.push({
        id: 'livelihood_support',
        name: {
          ja: '主たる生計維持（被保険者の収入の2分の1未満基準）',
          vi: 'Nuôi dưỡng chu cấp (Ngưỡng dưới 1/2 thu nhập người bảo hiểm)',
          en: 'Livelihood support (1/2 threshold test)'
        },
        status: 'warning',
        message: {
          ja: '被扶養者の年収が被保険者の2分の1以上です。総合的な生計実態審査（保険者への申立て・確認）が必要です。',
          vi: 'Thu nhập người phụ thuộc vượt quá 1/2 thu nhập người bảo hiểm chính. Cần hồ sơ giải trình chi tiết với cơ quan bảo hiểm.',
          en: 'Dependent income is >= 1/2 of insured person. Requires case-by-case evaluation by health insurance union.'
        }
      });
      isWarning = true;
    } else {
      checks.push({
        id: 'livelihood_support',
        name: {
          ja: '主たる生計維持（同居要件）',
          vi: 'Nuôi dưỡng chu cấp (Sống chung)',
          en: 'Livelihood support (cohabiting)'
        },
        status: 'pass',
        message: {
          ja: '被扶養者の年収が被保険者の2分の1未満であり、主として生計を維持していると認められます。',
          vi: 'Thu nhập người phụ thuộc dưới 1/2 thu nhập người bảo hiểm chính, thỏa mãn điều kiện sống chung.',
          en: 'Dependent income is under 1/2 of insured person; passes primary support test.'
        }
      });
    }
  } else {
    // Living separately
    if (remittance <= 0) {
      checks.push({
        id: 'livelihood_support',
        name: {
          ja: '主たる生計維持（別居時の仕送り額）',
          vi: 'Nuôi dưỡng chu cấp (Tiền gửi chu cấp khi sống riêng)',
          en: 'Remittance requirement (living apart)'
        },
        status: 'fail',
        message: {
          ja: '別居の場合、被保険者からの定期的な仕送り（送金証明書）が必須です。仕送り実績がありません。',
          vi: 'Sống riêng bắt buộc phải có khoản tiền gửi chu cấp định kỳ có sao kê chuyển khoản từ người bảo hiểm chính.',
          en: 'Living separately legally requires regular remittances with bank transfer proof. No remittance provided.'
        }
      });
      isFailure = true;
    } else if (depIncome >= remittance) {
      checks.push({
        id: 'livelihood_support',
        name: {
          ja: '主たる生計維持（仕送り額との比較）',
          vi: 'Nuôi dưỡng chu cấp (So sánh với tiền chu cấp)',
          en: 'Income vs Remittance comparison'
        },
        status: 'fail',
        message: {
          ja: `被扶養者の収入（${depIncome.toLocaleString('ja-JP')}円）が年間仕送り額（${remittance.toLocaleString('ja-JP')}円）以上です。別居時は仕送り額が被扶養者の収入を上回っている必要があります。`,
          vi: `Thu nhập của người phụ thuộc (${depIncome.toLocaleString('ja-JP')}円) lớn hơn tiền chu cấp (${remittance.toLocaleString('ja-JP')}円). Sống riêng yêu cầu tiền gửi chu cấp phải lớn hơn thu nhập tự thân.`,
          en: `Dependent income (${depIncome.toLocaleString()} JPY) exceeds remittance (${remittance.toLocaleString()} JPY). Remittance must exceed dependent income.`
        }
      });
      isFailure = true;
    } else {
      checks.push({
        id: 'livelihood_support',
        name: {
          ja: '主たる生計維持（別居送金要件）',
          vi: 'Nuôi dưỡng chu cấp (Chuyển khoản sống riêng)',
          en: 'Remittance support (living apart)'
        },
        status: 'pass',
        message: {
          ja: `年間仕送り額（${remittance.toLocaleString('ja-JP')}円）が被扶養者の年収を上回っており、要件を満たしています（振込明細の保管が必要です）。`,
          vi: `Tiền chu cấp hàng năm (${remittance.toLocaleString('ja-JP')}円) lớn hơn thu nhập tự thân, thỏa mãn điều kiện (cần lưu giữ sao kê chuyển khoản).`,
          en: `Annual remittance (${remittance.toLocaleString()} JPY) exceeds dependent income (bank statements must be preserved).`
        }
      });
    }
  }

  // Determine overall status
  let status = 'likely_eligible';
  if (isFailure) {
    status = 'likely_ineligible';
  } else if (isWarning) {
    status = 'case_dependent';
  }

  return {
    status, // 'likely_eligible' | 'likely_ineligible' | 'case_dependent'
    relationship: rel,
    dependentAge: age,
    ceiling,
    monthlyCeiling,
    isSeniorOrDisabled,
    isCohabiting,
    checks,
    taxDistinction: {
      isNotTaxEvaluation: true,
      notice: {
        ja: '【重要】この判定は「社会保険（健康保険・国民年金第3号）」の被扶養者判定です。「税法上の扶養控除（配偶者控除・扶養控除）」とは基準年度（過去実績 vs 将来見込）や算入対象収入（失業手当や障害年金を含む）が全く異なります。税金上の扶養を試算する場合は Japan Tax Simulator をご利用ください。',
        vi: '【LƯU Ý QUAN TRỌNG】Đây là công cụ chẩn đoán người phụ thuộc BẢO HIỂM XÃ HỘI (BHYT & Hưu trí Quốc dân Số 3). Quy chuẩn này KHÔNG PHẢI là Giảm trừ gia cảnh THUẾ THU NHẬP (税法上の扶養). BHXH tính theo thu nhập tương lai (bao gồm cả trợ cấp thất nghiệp, thai sản, trợ cấp tàn tật). Để kiểm tra thuế, hãy mở Japan Tax Simulator.',
        en: '[IMPORTANT] This tool determines SOCIAL INSURANCE (Health & Pension) dependency ONLY. It is NOT for Income Tax dependents. Social insurance evaluates future projected income (including unemployment benefits, disability pension, etc.). For tax dependents, please use Japan Tax Simulator.'
      },
      taxToolLink: '#/tools/japan-tax-simulator'
    },
    sources: ['kyoukaikenpo-dependent-2026']
  };
}
