/**
 * Dependent Health Insurance Eligibility Evaluation Engine (社会保険 被扶養者 認定判定エンジン)
 * Deterministic rules evaluation according to Kyokai Kenpo & Health Insurance Act.
 * STRICT ISOLATION: This engine ONLY determines Social Insurance Dependency, NOT Tax Dependency.
 */

import { RELATIONSHIPS, RESIDENCE_EXCEPTIONS } from '../rules/dependentInsuranceRules.js';

function isMissingNumber(value) {
  return value === undefined || value === null || value === '' || !Number.isFinite(Number(value));
}

/** Tuổi tại ngày 31/12 của năm chứa ngày công nhận (扶養認定日) */
function ageAtYearEnd(birthDate, certificationDate) {
  const b = new Date(`${String(birthDate).slice(0, 10)}T00:00:00Z`);
  const year = Number(String(certificationDate).slice(0, 4));
  if (Number.isNaN(b.getTime()) || !year) return null;
  return year - b.getUTCFullYear();
}

/** Trần thu nhập năm theo 認定日, quan hệ và tuổi (19〜22 tuổi: 150万円 từ 2025-10-01; vợ/chồng không áp dụng) */
export function resolveDependentIncomeCeiling({ relationship = 'spouse', ageAtDec31 = 30, isDisabled = false, certificationDate }) {
  const date = String(certificationDate || new Date().toISOString()).slice(0, 10);
  const age = Number(ageAtDec31) || 0;
  if (age >= 60 || isDisabled) {
    return { ceiling: 1800000, monthlyCeiling: 150000, basis: 'senior_or_disabled' };
  }
  if (relationship !== 'spouse' && age >= 19 && age < 23 && date >= '2025-10-01') {
    return { ceiling: 1500000, monthlyCeiling: 125000, basis: 'age_19_22' };
  }
  return { ceiling: 1300000, monthlyCeiling: 108334, basis: 'standard' };
}

export function evaluateDependentInsuranceEligibility({
  relationship = 'spouse',
  dependentAge = 30,
  dependentBirthDate,
  certificationDate,
  isDisabled = false,
  isCohabiting = true,
  dependentFutureAnnualIncome,
  insuredAnnualIncome,
  annualRemittance = 0,
  residesInJapan = true,
  residenceException = 'none',
  hasEmployerOvertimeProof = false
} = {}) {
  const rel = RELATIONSHIPS[relationship] || RELATIONSHIPS.spouse;
  const certDate = String(certificationDate || new Date().toISOString()).slice(0, 10);
  // Tuổi xét theo 31/12 của năm 認定日 (nếu có ngày sinh); nếu không, dependentAge được hiểu là tuổi tại 31/12.
  const ageFromBirth = dependentBirthDate ? ageAtYearEnd(dependentBirthDate, certDate) : null;
  const age = ageFromBirth ?? (Number(dependentAge) || 0);
  const depIncome = Number(dependentFutureAnnualIncome) || 0;
  const insIncome = Number(insuredAnnualIncome) || 0;
  const remittance = Number(annualRemittance) || 0;

  const missingIncome = isMissingNumber(dependentFutureAnnualIncome);
  const missingInsured = isCohabiting && isMissingNumber(insuredAnnualIncome);
  const missingRemittance = !isCohabiting && isMissingNumber(annualRemittance);
  if (missingIncome || missingInsured || missingRemittance) {
    const limit = resolveDependentIncomeCeiling({ relationship: rel.id, ageAtDec31: age, isDisabled, certificationDate: certDate });
    return {
      status: 'insufficient_info',
      relationship: rel,
      dependentAge: age,
      certificationDate: certDate,
      ceiling: limit.ceiling,
      monthlyCeiling: limit.monthlyCeiling,
      ceilingBasis: limit.basis,
      isSeniorOrDisabled: limit.basis === 'senior_or_disabled',
      isCohabiting,
      checks: [],
      missingFields: [
        missingIncome ? 'dependentFutureAnnualIncome' : null,
        missingInsured ? 'insuredAnnualIncome' : null,
        missingRemittance ? 'annualRemittance' : null,
      ].filter(Boolean),
      message: {
        ja: '判定に必要な収入情報（被扶養者の見込み年収、同居なら被保険者の年収、別居なら仕送り額）を入力してください。',
        vi: 'Vui lòng nhập thông tin thu nhập cần thiết (thu nhập dự kiến của người phụ thuộc; thu nhập người bảo hiểm nếu sống chung; tiền chu cấp nếu sống riêng).',
        en: 'Please enter the income information needed (dependent projected income; insured income if cohabiting; remittance if living apart).'
      },
      sources: ['kyoukaikenpo-dependent-2026']
    };
  }

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

  // 4. Annual Future Income Ceiling Gate (130万円 / 150万円 (19〜22歳) / 180万円の壁)
  const limit = resolveDependentIncomeCeiling({ relationship: rel.id, ageAtDec31: age, isDisabled, certificationDate: certDate });
  const isSeniorOrDisabled = limit.basis === 'senior_or_disabled';
  const ceiling = limit.ceiling;
  const monthlyCeiling = limit.monthlyCeiling;
  const ceilingMan = ceiling / 10000;

  if (depIncome >= ceiling) {
    if (hasEmployerOvertimeProof) {
      // 年収の壁・支援強化パッケージ: 事業主の証明による一時的な収入増加 — không có trần tuyệt đối
      checks.push({
        id: 'income_ceiling',
        name: {
          ja: '年間収入の上限基準（事業主証明による一時的な収入変動）',
          vi: 'Hạn mức thu nhập năm (Tăng tạm thời có chứng nhận của chủ DN)',
          en: 'Annual income ceiling (temporary increase certified by employer)'
        },
        status: 'warning',
        message: {
          ja: `年収が${ceilingMan}万円以上となる見込みですが、人手不足による残業等の一時的な増収であることを事業主が証明する場合、保険者の判断で引き続き被扶養者と認められる可能性があります（原則として連続2回まで）。`,
          vi: `Thu nhập dự kiến vượt ${ceilingMan} vạn Yên, nhưng nếu chủ DN chứng nhận đây là tăng tạm thời (tăng ca do thiếu người...), cơ quan bảo hiểm có thể vẫn công nhận là người phụ thuộc (nguyên tắc tối đa 2 lần liên tiếp).`,
          en: `Income is projected at or above ${ceilingMan}0k JPY, but with employer certification of a temporary increase, the insurer may keep dependent status (in principle up to 2 consecutive times).`
        }
      });
      isWarning = true;
    } else {
      checks.push({
        id: 'income_ceiling',
        name: {
          ja: `年間収入の上限基準（${ceiling.toLocaleString('ja-JP')}円未満）`,
          vi: `Hạn mức thu nhập năm (Dưới ${ceilingMan} vạn Yên)`,
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
        vi: `Hạn mức thu nhập năm (Dưới ${ceilingMan} vạn Yên)`,
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

  if (limit.basis === 'age_19_22') {
    checks.push({
      id: 'age_19_22_ceiling',
      name: {
        ja: '19歳以上23歳未満の年間収入要件（150万円未満）',
        vi: 'Trần thu nhập cho người 19〜22 tuổi (dưới 150 vạn Yên)',
        en: 'Income requirement for ages 19-22 (< 1.5M JPY)'
      },
      status: 'info',
      message: {
        ja: '扶養認定日が令和7年10月1日以降で、配偶者以外の19歳以上23歳未満（認定日の属する年の12月31日時点の年齢）の方は、年間収入要件が150万円未満となります。',
        vi: 'Với ngày công nhận từ 01/10/2025, người phụ thuộc (không phải vợ/chồng) từ 19 đến dưới 23 tuổi (tính tại 31/12 của năm công nhận) có trần thu nhập dưới 150 vạn Yên.',
        en: 'For certification on or after 1 Oct 2025, non-spouse dependents aged 19-22 (as of 31 Dec of the certification year) have a < 1.5M JPY income requirement.'
      }
    });
  }

  if (certDate >= '2026-04-01') {
    checks.push({
      id: 'contract_based_income',
      name: {
        ja: '給与収入の判定方法（令和8年4月〜 労働契約ベース）',
        vi: 'Cách xét thu nhập từ lương (từ 04/2026 theo hợp đồng lao động)',
        en: 'Salary income judgment (from April 2026: contract-based)'
      },
      status: 'info',
      message: {
        ja: '令和8年4月1日以降、給与収入のみの方は、労働条件通知書等の労働契約の内容（所定の賃金）に基づく年間収入見込みで判定されます。契約に定めのない時間外労働の賃金などは原則含めません。給与以外の収入がある場合は従来どおり総合的に判定されます。',
        vi: 'Từ 01/04/2026, người chỉ có thu nhập lương được xét theo thu nhập năm dự kiến tính từ nội dung hợp đồng lao động (労働条件通知書). Tiền tăng ca không ghi trong hợp đồng về nguyên tắc không tính. Nếu có thu nhập khác ngoài lương thì xét tổng hợp như trước.',
        en: 'From 1 Apr 2026, dependents with only salary income are judged on annual income projected from the labour contract terms; overtime not stipulated in the contract is generally excluded. Other income is assessed as before.'
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
    status, // 'likely_eligible' | 'likely_ineligible' | 'case_dependent' | 'insufficient_info'
    relationship: rel,
    dependentAge: age,
    certificationDate: certDate,
    ceiling,
    monthlyCeiling,
    ceilingBasis: limit.basis,
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
