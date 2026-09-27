/**
 * @file packages/core/src/japan/family/locality/municipalRegistry.js
 * @description
 * Danh bạ đô thị hỗ trợ chính sách gia đình & trẻ em (Japan Family Locality Registry).
 * Định nghĩa thông tin các đô thị thí điểm Giai đoạn A (Fukuoka City, Chiyoda-ku Tokyo)
 * cùng các chính sách đặc thù (khám thai, sổ mẹ con, trợ cấp y tế trẻ em, quà sinh con).
 */

import { LOCALITY_SUPPORT_STATUS } from '../../../regulatory/jurisdiction.js';

export const MUNICIPAL_FAMILY_REGISTRY = Object.freeze({
  // 福岡県福岡市 (Fukuoka City) - JIS X 0402: 40130
  'JP-40-40130': {
    jurisdictionCode: 'JP-40-40130',
    prefectureCode: 'JP-40',
    countryCode: 'JP',
    nameJa: '福岡県福岡市',
    nameVi: 'Thành phố Fukuoka, Tỉnh Fukuoka',
    nameEn: 'Fukuoka City, Fukuoka Prefecture',
    status: LOCALITY_SUPPORT_STATUS.SUPPORTED,
    officialPortalUrl: 'https://www.city.fukuoka.lg.jp/kodomo-mirai/kosodate/',
    healthCenterWindowJa: '各区保健福祉センター（健康課）',
    healthCenterWindowVi: 'Trung tâm Y tế & Phúc lợi tại 7 quận (Ban Sức khỏe)',
    healthCenterWindowEn: 'Ward Public Health and Welfare Center',
    prenatalCheckupTickets: {
      totalTickets: 14,
      approximateTotalValueYen: 106000,
      notesJa: '母子健康手帳交付時に妊婦健康診査受診票（14回分）および超音波・追加検査票を交付。',
      notesVi: 'Cấp sổ mẹ con kèm 14 phiếu hỗ trợ khám thai tiêu chuẩn và phiếu siêu âm, xét nghiệm bổ sung.',
    },
    // Nguồn: https://www.city.fukuoka.lg.jp/hofuku/hokennenkin/hp/01.html (mở rộng đến 18 tuổi từ 01/2024)
    childMedicalSubsidy: {
      targetAgeJa: '高校生世代まで（18歳の誕生日の前日以後最初の3月31日まで）',
      targetAgeVi: 'Đến hết cấp 3 (hết ngày 31/3 đầu tiên sau khi tròn 18 tuổi)',
      targetAgeEn: 'Up to high-school age (until the first 31 March after turning 18)',
      copaySummaryJa: '3歳未満：通院無料 / 3歳以上：通院は1医療機関あたり月500円まで / 入院・調剤：無料（所得制限なし）',
      copaySummaryVi: 'Dưới 3 tuổi: khám ngoại trú miễn phí; từ 3 tuổi: ngoại trú tối đa 500 yên/tháng cho mỗi cơ sở y tế; nằm viện & tiền thuốc: miễn phí (không giới hạn thu nhập)',
      hasIncomeLimit: false,
    },
    // 妊婦のための支援給付 (chế độ luật định từ 01/04/2025): 5万円 sau 妊娠届出 + 5万円 × số thai sau 胎児数の届出
    birthGiftGrant: {
      hasGift: true,
      amountYen: 100000, // 5万円 + 5万円 × 1 (thai đơn)
      titleJa: '妊婦のための支援給付（妊婦給付認定後5万円＋胎児数の届出後5万円×胎児数）',
      titleVi: 'Trợ cấp hỗ trợ thai phụ 妊婦のための支援給付 (5 vạn yên sau khi đăng ký mang thai + 5 vạn yên × số thai sau khi báo số thai; thai đơn tổng 100.000 yên)',
    }
  },

  // 東京都千代田区 (Chiyoda-ku, Tokyo) - JIS X 0402: 13101
  'JP-13-13101': {
    jurisdictionCode: 'JP-13-13101',
    prefectureCode: 'JP-13',
    countryCode: 'JP',
    nameJa: '東京都千代田区',
    nameVi: 'Quận Chiyoda, Tokyo',
    nameEn: 'Chiyoda City, Tokyo',
    status: LOCALITY_SUPPORT_STATUS.SUPPORTED,
    officialPortalUrl: 'https://www.city.chiyoda.lg.jp/koho/kosodate/',
    healthCenterWindowJa: '千代田保健所（健康推進課）',
    healthCenterWindowVi: 'Trung tâm Y tế Chiyoda (Ban Xúc tiến Sức khỏe)',
    healthCenterWindowEn: 'Chiyoda Public Health Center',
    prenatalCheckupTickets: {
      totalTickets: 14,
      approximateTotalValueYen: 120000,
      notesJa: '都内共通妊婦健診受診票（14回分）＋超音波検査票2回＋子宮頸がん検診票。',
      notesVi: 'Phiếu khám thai tiêu chuẩn 14 lần + 2 phiếu siêu âm + phiếu tầm soát ung thư cổ tử cung.',
    },
    childMedicalSubsidy: {
      targetAgeJa: '高校生等（18歳到達後の最初の3月31日まで）完全無償',
      targetAgeVi: 'Đến hết cấp 3 (ngày 31/3 sau khi tròn 18 tuổi) miễn phí hoàn toàn 100%',
      copaySummaryJa: '通院・入院ともに自己負担0円（所得制限なし）',
      copaySummaryVi: 'Khám ngoại trú & nằm viện: 0 yên tự trả (không áp dụng giới hạn thu nhập)',
      hasIncomeLimit: false,
    },
    birthGiftGrant: {
      hasGift: true,
      amountYen: 100000,
      titleJa: '妊婦のための支援給付（妊婦給付認定後5万円＋胎児数の届出後5万円×胎児数）',
      titleVi: 'Trợ cấp hỗ trợ thai phụ 妊婦のための支援給付 (5 vạn yên sau khi đăng ký mang thai + 5 vạn yên × số thai sau khi báo số thai; thai đơn tổng 100.000 yên)',
    }
  }
});

/**
 * Tra cứu thông tin chính sách địa phương theo mã jurisdiction
 * @param {string} jurisdictionCode
 * @returns {typeof MUNICIPAL_FAMILY_REGISTRY[keyof typeof MUNICIPAL_FAMILY_REGISTRY] | null}
 */
export function getMunicipalFamilyData(jurisdictionCode) {
  if (!jurisdictionCode) return null;
  return MUNICIPAL_FAMILY_REGISTRY[jurisdictionCode] || null;
}

/**
 * Danh sách các đô thị hỗ trợ sẵn để người dùng lựa chọn
 */
export const SUPPORTED_MUNICIPALITIES_LIST = Object.freeze([
  {
    code: 'JP-40-40130',
    nameJa: '福岡県福岡市',
    nameVi: 'Thành phố Fukuoka (福岡市)',
    nameEn: 'Fukuoka City',
    status: LOCALITY_SUPPORT_STATUS.SUPPORTED,
  },
  {
    code: 'JP-13-13101',
    nameJa: '東京都千代田区',
    nameVi: 'Quận Chiyoda, Tokyo (千代田区)',
    nameEn: 'Chiyoda-ku, Tokyo',
    status: LOCALITY_SUPPORT_STATUS.SUPPORTED,
  },
  {
    code: 'OTHER',
    nameJa: 'その他市区町村（全国共通ガイド＋管轄窓口案内）',
    nameVi: 'Địa phương khác (Áp dụng khung chuẩn quốc gia & tra cứu ủy ban)',
    nameEn: 'Other Municipality (National Standard + Local Guidance)',
    status: LOCALITY_SUPPORT_STATUS.UNSUPPORTED,
  }
]);
