/**
 * @file packages/core/src/japan/family/rules/childAllowanceRules.js
 * @description
 * Quy chuẩn chế độ Trợ cấp Trẻ em Nhật Bản (児童手当制度) theo cải cách Luật Trợ cấp Trẻ em
 * do Cơ quan Trẻ em và Gia đình (こども家庭庁) ban hành, có hiệu lực từ tháng 10/2024 (令和6年10月分〜).
 *
 * Căn cứ pháp lý:
 * - 児童手当法 (Child Allowance Act - Luật số 73 năm 1971, sửa đổi 2024)
 * - こども家庭庁 児童手当制度の抜本的拡充（令和6年10月施行）
 */

export const CHILD_ALLOWANCE_CONSTANTS = Object.freeze({
  // Mức chi trả hàng tháng theo độ tuổi và thứ tự con (月額支給額)
  RATES: {
    UNDER_3_YEARS: 15000,              // Dưới 3 tuổi (0〜2歳): 15,000円 / tháng
    AGE_3_TO_HIGH_SCHOOL: 10000,        // Từ 3 tuổi đến hết cấp 3 (18 tuổi): 10,000円 / tháng (con thứ 1 & 2)
    THIRD_CHILD_AND_ABOVE: 30000,       // Con thứ 3 trở đi: 30,000円 / tháng (mọi độ tuổi đến hết cấp 3)
  },

  // Giới hạn độ tuổi theo năm tài chính Nhật Bản (4/1 đến 31/3 năm sau)
  AGE_LIMITS: {
    HIGH_SCHOOL_GRADUATION_AGE: 18,     // 18歳到達後の最初の3月31日まで (hết cấp 3)
    SIBLING_COUNT_MAX_AGE: 22,          // 22歳到達後の最初の3月31日まで (đếm thứ tự con nếu có chu cấp kinh tế)
  },

  // Lịch chi trả hàng năm (6 lần/năm, vào các tháng chẵn, mỗi lần chi trả cho 2 tháng trước)
  DISBURSEMENT_SCHEDULE: {
    PAYMENT_MONTHS: [2, 4, 6, 8, 10, 12],
    MONTHS_PER_PERIOD: 2,
    PAYMENTS_PER_YEAR: 6,
  },

  // So sánh trước và sau cải cách 10/2024
  REFORM_MILESTONES: {
    INCOME_LIMIT_ABOLISHED: true,       // Bỏ hoàn toàn trần thu nhập (所得制限撤廃)
    PRE_REFORM_AGE_LIMIT: 15,           // Trước cải cách: Chỉ đến hết cấp 2 (中学校修了まで・15歳年度末)
    POST_REFORM_AGE_LIMIT: 18,          // Sau cải cách: Mở rộng đến hết cấp 3 (18歳年度末)
    PRE_REFORM_THIRD_CHILD_RATE: 15000, // Trước cải cách: Con thứ 3 chỉ được 15,000円 (3 tuổi - cấp 2)
    POST_REFORM_THIRD_CHILD_RATE: 30000,// Sau cải cách: Tăng gấp đôi lên 30,000円
    PRE_REFORM_PAYMENTS_YEAR: 3,        // Trước cải cách: 3 lần/năm (tháng 2, 6, 10)
    POST_REFORM_PAYMENTS_YEAR: 6,       // Sau cải cách: 6 lần/năm (tháng 2, 4, 6, 8, 10, 12)
  },

  // Ước tính tổng trợ cấp trọn đời (từ sơ sinh đến 18 tuổi)
  LIFETIME_TOTAL: {
    STANDARD_CHILD_TOTAL: 2340000,      // Con 1 & 2: 15k x 36 tháng + 10k x 180 tháng = 2,340,000円
    THIRD_CHILD_TOTAL: 6480000,         // Con 3 (nếu đủ điều kiện suốt 18 năm): 30k x 216 tháng = 6,480,000円
  }
});

/**
 * Danh sách nguồn pháp quy sơ cấp cho M4
 */
export const CHILD_ALLOWANCE_SOURCES = Object.freeze([
  'cfa-child-allowance-reform-2024'
]);
