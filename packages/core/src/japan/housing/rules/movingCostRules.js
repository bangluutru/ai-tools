/**
 * @file packages/core/src/japan/housing/rules/movingCostRules.js
 * @description
 * Quy chuẩn chi phí và dữ liệu định mức chuyển nhà tại Nhật Bản (Japan Moving Cost Rules).
 * Căn cứ:
 * - 国土交通省「標準引越運送約款」（平成30年改正・解約手数料基準）
 * - Thống kê trung bình thị trường chuyển nhà Nhật Bản (2025-2026 Moving Industry Benchmarks).
 */

export const MOVING_COST_SOURCES = [
  'mlit-standard-moving-transport-contract',
];

/**
 * Phân loại quy mô hộ gia đình & lượng đồ đạc
 */
export const HOUSEHOLD_TYPES = Object.freeze({
  SINGLE_MINIMAL: {
    id: 'single_minimal',
    nameJa: '単身（荷物少なめ・ワンルーム/1K）',
    nameVi: 'Độc thân (Ít đồ đạc: 1R/1K, xe van nhỏ)',
    nameEn: 'Single (Minimal luggage: Studio/1K)',
    basePriceRegular: 28000,
    basePricePeak: 42000,
    truckSizeJa: '軽トラック / 1tトラック',
    truckSizeVi: 'Xe tải nhẹ / Xe 1 tấn',
    truckSizeEn: 'Light Van / 1-Ton Truck',
  },
  SINGLE_STANDARD: {
    id: 'single_standard',
    nameJa: '単身（荷物普通・1K/1DK）',
    nameVi: 'Độc thân (Đồ đạc trung bình: 1K/1DK, xe 2 tấn ngắn)',
    nameEn: 'Single (Standard luggage: 1K/1DK)',
    basePriceRegular: 38000,
    basePricePeak: 58000,
    truckSizeJa: '2tショートトラック',
    truckSizeVi: 'Xe tải 2 tấn ngắn',
    truckSizeEn: '2-Ton Short Truck',
  },
  SINGLE_HEAVY: {
    id: 'single_heavy',
    nameJa: '単身（荷物多め・1LDK/2K）',
    nameVi: 'Độc thân (Nhiều đồ đạc: 1LDK/2K, xe 2 tấn dài)',
    nameEn: 'Single (Heavy luggage: 1LDK/2K)',
    basePriceRegular: 48000,
    basePricePeak: 75000,
    truckSizeJa: '2tロングトラック',
    truckSizeVi: 'Xe tải 2 tấn thùng dài',
    truckSizeEn: '2-Ton Long Truck',
  },
  COUPLE_STANDARD: {
    id: 'couple_standard',
    nameJa: '2人家族（夫婦・同居・2DK/2LDK）',
    nameVi: 'Gia đình 2 người (Vợ chồng/bạn cùng phòng: 2DK/2LDK)',
    nameEn: 'Couple / 2 Persons (Standard 2DK/2LDK)',
    basePriceRegular: 68000,
    basePricePeak: 105000,
    truckSizeJa: '2tロング〜3tトラック',
    truckSizeVi: 'Xe 2 tấn dài hoặc 3 tấn',
    truckSizeEn: '2-Ton Long to 3-Ton Truck',
  },
  FAMILY_3_4: {
    id: 'family_3_4',
    nameJa: '3〜4人家族（子どもあり・3LDK）',
    nameVi: 'Gia đình 3-4 người (Có con nhỏ: 3LDK)',
    nameEn: 'Family of 3-4 (3LDK with kids)',
    basePriceRegular: 95000,
    basePricePeak: 155000,
    truckSizeJa: '3t〜4tトラック',
    truckSizeVi: 'Xe 3 tấn đến 4 tấn',
    truckSizeEn: '3-Ton to 4-Ton Truck',
  },
  FAMILY_5_PLUS: {
    id: 'family_5_plus',
    nameJa: '5人以上の大家族（4LDK以上・一軒家）',
    nameVi: 'Đại gia đình từ 5 người trở lên (4LDK+, nhà riêng)',
    nameEn: 'Large Family (5+ Persons, 4LDK / House)',
    basePriceRegular: 130000,
    basePricePeak: 220000,
    truckSizeJa: '4tトラック2台または大型車',
    truckSizeVi: '2 xe 4 tấn hoặc xe cỡ lớn',
    truckSizeEn: 'Two 4-Ton Trucks or Heavy Rig',
  },
});

/**
 * Khoảng cách di chuyển
 */
export const DISTANCE_BANDS = Object.freeze({
  INTRA_CITY: {
    id: 'intra_city',
    nameJa: '同一市区町村内（約15km未満）',
    nameVi: 'Cùng quận / thành phố (Dưới 15km)',
    nameEn: 'Same Ward / Municipality (< 15km)',
    distanceMultiplier: 1.0,
    surchargeYen: 0,
  },
  SAME_PREFECTURE: {
    id: 'same_prefecture',
    nameJa: '同一都道府県内・近距離（15km〜50km未満）',
    nameVi: 'Cùng tỉnh / Khoảng cách gần (15km - 50km)',
    nameEn: 'Same Prefecture / Short Distance (15 - 50km)',
    distanceMultiplier: 1.15,
    surchargeYen: 8000,
  },
  NEIGHBORING_PREFECTURE: {
    id: 'neighboring_prefecture',
    nameJa: '近隣の県・中距離（50km〜200km未満）',
    nameVi: 'Tỉnh lân cận / Khoảng cách trung bình (50km - 200km)',
    nameEn: 'Neighboring Prefecture (50 - 200km)',
    distanceMultiplier: 1.4,
    surchargeYen: 22000,
  },
  MEDIUM_DISTANCE: {
    id: 'medium_distance',
    nameJa: '中距離・他地方（200km〜500km未満・例: 東京〜大阪）',
    nameVi: 'Khoảng cách xa / Vùng khác (200km - 500km, ví dụ: Tokyo - Osaka)',
    nameEn: 'Medium Distance (200 - 500km, e.g. Tokyo to Osaka)',
    distanceMultiplier: 1.8,
    surchargeYen: 45000,
  },
  LONG_DISTANCE: {
    id: 'long_distance',
    nameJa: '長距離（500km以上・例: 東京〜福岡/北海道）',
    nameVi: 'Khoảng cách rất xa (Trên 500km, ví dụ: Tokyo - Fukuoka / Hokkaido)',
    nameEn: 'Long Distance (> 500km, e.g. Tokyo to Fukuoka/Hokkaido)',
    distanceMultiplier: 2.3,
    surchargeYen: 80000,
  },
});

/**
 * Mùa vụ di chuyển (Seasonality)
 */
export const SEASONALITY = Object.freeze({
  REGULAR: {
    id: 'regular',
    nameJa: '通常期（5月〜2月中旬）',
    nameVi: 'Mùa thường (Tháng 5 đến giữa tháng 2)',
    nameEn: 'Regular Season (May to Mid-Feb)',
    multiplier: 1.0,
    descriptionJa: '料金相場が安定しており、値引き交渉やフリー便での節約がしやすい時期です。',
    descriptionVi: 'Giá cả ổn định, dễ thương lượng giảm giá hoặc chọn khung giờ linh hoạt để tiết kiệm.',
    descriptionEn: 'Stable market rates, good opportunities for price negotiation and flexible timing discounts.',
  },
  PEAK_EARLY: {
    id: 'peak_early',
    nameJa: '繁忙期・開始期（2月下旬）',
    nameVi: 'Đầu mùa cao điểm (Nửa cuối tháng 2)',
    nameEn: 'Early Peak Season (Late February)',
    multiplier: 1.25,
    descriptionJa: '新生活準備が本格化し始め、週末を中心に予約が埋まりやすくなります。',
    descriptionVi: 'Bắt đầu đợt chuyển nhà đi học/đi làm mới, cuối tuần kín lịch nhanh.',
    descriptionEn: 'Beginning of school/job transitions, weekends book out fast.',
  },
  PEAK_HIGH: {
    id: 'peak_high',
    nameJa: '繁忙期・最盛期（3月〜4月上旬）',
    nameVi: 'Cao điểm đỉnh vụ (Tháng 3 đến đầu tháng 4)',
    nameEn: 'Super Peak Season (March to Early April)',
    multiplier: 1.65,
    descriptionJa: '年間の最大需要期。通常期の1.5〜2倍まで相場が高騰し、「引越し難民」が発生しやすい時期です。',
    descriptionVi: 'Đỉnh điểm nhu cầu trong năm, giá tăng gấp 1.5 - 2 lần, dễ gặp tình trạng không tìm được xe.',
    descriptionEn: 'Highest peak of the year. Prices 1.5x - 2x normal, truck shortages common.',
  },
  PEAK_LATE: {
    id: 'peak_late',
    nameJa: '繁忙期・終息期（4月中旬〜4月下旬）',
    nameVi: 'Cuối mùa cao điểm (Giữa đến cuối tháng 4)',
    nameEn: 'Late Peak Season (Mid to Late April)',
    multiplier: 1.2,
    descriptionJa: 'ピークを過ぎ落ち着き始めますが、通常期よりはやや高めの水準です。',
    descriptionVi: 'Qua giai đoạn cao trào, giá bắt đầu hạ dần về mức bình thường.',
    descriptionEn: 'Market begins cooling down after the April transition rush.',
  },
});

/**
 * Khung thời gian chuyển nhà trong ngày
 */
export const TIME_SLOTS = Object.freeze({
  MORNING: {
    id: 'morning',
    nameJa: '午前便（朝9時頃〜）',
    nameVi: 'Chuyến buổi sáng (Từ 9:00 sáng)',
    nameEn: 'Morning Slot (From 9:00 AM)',
    multiplier: 1.05,
    descriptionJa: '一番人気の時間帯。午後から新居での荷解きや手続きにたっぷり時間を使えます。',
    descriptionVi: 'Khung giờ được chuộng nhất, buổi chiều có nhiều thời gian sắp xếp nhà mới.',
    descriptionEn: 'Most popular slot, leaves afternoon free for unpacking and administration.',
  },
  AFTERNOON: {
    id: 'afternoon',
    nameJa: '午後便（13時〜15時頃開始）',
    nameVi: 'Chuyến buổi chiều (Khoảng 13:00 - 15:00)',
    nameEn: 'Afternoon Slot (13:00 - 15:00)',
    multiplier: 0.92,
    descriptionJa: '午前便の作業終了後に向かうため時間が前後する可能性がありますが、午前便より割安です。',
    descriptionVi: 'Xe đến sau khi làm xong ca sáng, giờ giấc có thể xê dịch chút ít nhưng giá rẻ hơn ~8%.',
    descriptionEn: 'Departs after morning job completes, slightly variable start time but ~8% cheaper.',
  },
  FREE_TIME: {
    id: 'free_time',
    nameJa: 'フリー便（時間指定なし・業者都合）',
    nameVi: 'Khung giờ tự do / Tiết kiệm (Không hẹn giờ, bên vận chuyển sắp xếp)',
    nameEn: 'Flexible Time Slot (Company Scheduled)',
    multiplier: 0.8,
    descriptionJa: '当日のトラック空き状況に合わせて業者が時間を決定。大幅な割引（約20%オフ）が得られます。',
    descriptionVi: 'Công ty vận chuyển chủ động ghép chuyến, giá rẻ nhất (tiết kiệm khoảng 20%).',
    descriptionEn: 'Operator chooses slot based on truck availability, yielding highest discount (~20% off).',
  },
});

/**
 * Dịch vụ tùy chọn bổ sung (Addon Services)
 */
export const ADDON_SERVICES = Object.freeze({
  AIR_CONDITIONER_INSTALL: {
    id: 'air_conditioner_install',
    nameJa: 'エアコン脱着工事（取外し・取付け 1台）',
    nameVi: 'Tháo & lắp điều hòa (1 máy)',
    nameEn: 'Air Conditioner Removal & Reinstallation (1 unit)',
    unitPrice: 16000,
  },
  PACKING_SERVICE: {
    id: 'packing_service',
    nameJa: '荷造り代行サービス（小物梱包）',
    nameVi: 'Dịch vụ đóng gói hộ đồ đạc (Đồ nhỏ, bếp, bát đĩa...)',
    nameEn: 'Packing Assistance Service',
    unitPrice: 22000,
  },
  UNPACKING_SERVICE: {
    id: 'unpacking_service',
    nameJa: '開梱・荷解き代行サービス',
    nameVi: 'Dịch vụ mở thùng & sắp xếp vào tủ',
    nameEn: 'Unpacking Assistance Service',
    unitPrice: 18000,
  },
  PIANO_HEAVY_TRANSPORT: {
    id: 'piano_heavy_transport',
    nameJa: 'ピアノ・大型重量物の特別運搬',
    nameVi: 'Vận chuyển đàn piano / đồ cồng kềnh đặc biệt',
    nameEn: 'Piano / Special Heavy Item Transport',
    unitPrice: 35000,
  },
  BULKY_WASTE_DISPOSAL: {
    id: 'bulky_waste_disposal',
    nameJa: '不用品回収・粗大ゴミ引き取り代行',
    nameVi: 'Thu gom & vứt đồ cũ cồng kềnh (Tủ, giường, nệm cũ...)',
    nameEn: 'Bulky Waste / Furniture Disposal Service',
    unitPrice: 15000,
  },
});

/**
 * Biểu phí bồi thường hủy hợp đồng theo Quy ước chuẩn Bộ Giao thông (国土交通省 標準引越運送約款第21条)
 */
export const CANCELLATION_FEE_SCHEDULE = Object.freeze([
  {
    timingJa: '引越し日の3日前まで',
    timingVi: 'Trước ngày chuyển từ 3 ngày trở lên',
    timingEn: '3+ days prior to moving day',
    feeRate: 0,
    descriptionJa: '無料（解約手数料は発生しません）',
    descriptionVi: 'Miễn phí 100% (Không phát sinh phí hủy)',
    descriptionEn: 'Free (No cancellation fee)',
  },
  {
    timingJa: '引越し日の2日前',
    timingVi: 'Trước ngày chuyển 2 ngày',
    timingEn: '2 days prior to moving day',
    feeRate: 0.2,
    descriptionJa: '基本運賃の20%以内',
    descriptionVi: 'Tối đa 20% cước cơ bản',
    descriptionEn: 'Up to 20% of base freight rate',
  },
  {
    timingJa: '引越し日の前日',
    timingVi: 'Ngày hôm trước ngày chuyển',
    timingEn: 'Day before moving day',
    feeRate: 0.3,
    descriptionJa: '基本運賃の30%以内',
    descriptionVi: 'Tối đa 30% cước cơ bản',
    descriptionEn: 'Up to 30% of base freight rate',
  },
  {
    timingJa: '引越し当日',
    timingVi: 'Đúng ngày chuyển nhà',
    timingEn: 'On moving day',
    feeRate: 0.5,
    descriptionJa: '基本運賃の50%以内',
    descriptionVi: 'Tối đa 50% cước cơ bản',
    descriptionEn: 'Up to 50% of base freight rate',
  },
]);

/**
 * 6 Lời khuyên vàng để tiết kiệm chi phí chuyển nhà tại Nhật
 */
export const COST_SAVING_TIPS = Object.freeze([
  {
    id: 'tip_multi_quote',
    titleJa: '必ず2〜3社で相見積もりを取る',
    titleVi: 'Luôn xin báo giá từ 2-3 công ty để so sánh (相見積もり)',
    titleEn: 'Always obtain quotes from 2-3 companies (Aimitumori)',
    descriptionJa: '1社即決は高値になりがちです。他社の見積額を提示することで数万円単位の値引きが引き出せることが一般的です。',
    descriptionVi: 'Không bao giờ chốt ngay công ty đầu tiên. Việc mang báo giá của công ty A sang trao đổi với công ty B thường giúp giảm được từ 1 đến 3 vạn Yên.',
    descriptionEn: 'Never book the first quote immediately. Presenting competitor prices often yields instant discounts of 10k-30k JPY.',
  },
  {
    id: 'tip_free_slot',
    titleJa: '時間指定なしの「フリー便」や「午後便」を選ぶ',
    titleVi: 'Chọn khung giờ tự do (フリー便) hoặc chuyến buổi chiều',
    titleEn: 'Select Flexible Slot (Free-bin) or Afternoon Timing',
    descriptionJa: '午前便にこだわらない場合、フリー便にするだけで運賃が15〜25%程度安くなります。',
    descriptionVi: 'Nếu không bắt buộc phải chuyển lúc 9h sáng, chọn giờ linh hoạt giúp tiết kiệm 15% đến 25% chi phí vận chuyển.',
    descriptionEn: 'If early morning arrival is not essential, flexible timing cuts costs by 15% to 25%.',
  },
  {
    id: 'tip_avoid_weekend_peak',
    titleJa: '月末・金土日・祝日を避け、月半ばの平日を狙う',
    titleVi: 'Tránh cuối tuần, cuối tháng; ưu tiên giữa tháng và ngày thường (thứ 3 - thứ 5)',
    titleEn: 'Avoid Month-ends and Weekends; Target Mid-month Weekdays',
    descriptionJa: '賃貸契約の区切りとなる月末や週末は割高です。平日（火〜木曜）を選ぶと割安な特別プランが適用されやすいです。',
    descriptionVi: 'Cuối tháng là thời điểm hết hạn hợp đồng thuê nhà nên giá luôn cao nhất. Chuyển vào giữa tháng và các ngày thứ 3, 4, 5 sẽ có giá mềm nhất.',
    descriptionEn: 'Month-ends and weekends carry peak surcharges. Mid-month Tuesdays to Thursdays offer the lowest rates.',
  },
  {
    id: 'tip_declutter_first',
    titleJa: '見積もり前に不用品を徹底処分してトラックサイズを下げる',
    titleVi: 'Thanh lý bớt đồ trước khi xin báo giá để hạ kích thước xe tải',
    titleEn: 'Declutter beforehand to downsize the required truck',
    descriptionJa: 'トラックのサイズ（2tショートから軽トラなど）が1段階下がるだけで、2〜3万円以上の節約になります。メルカリやジモティーの活用が効果的です。',
    descriptionVi: 'Nếu giảm được 1 cỡ xe (từ 2 tấn xuống 1 tấn), bạn tiết kiệm được 2-3 vạn Yên. Nên bán bớt đồ trên Mercari hoặc cho trên Jimoty trước.',
    descriptionEn: 'Downsizing truck capacity (e.g. from 2t to 1t) immediately saves 20k-30k JPY. Sell unwanted items on Mercari or Jimoty first.',
  },
  {
    id: 'tip_free_boxes',
    titleJa: '無料ダンボールのサービス確認',
    titleVi: 'Xác nhận dịch vụ cấp thùng carton miễn phí của nhà xe',
    titleEn: 'Confirm Free Cardboard Box Provision',
    descriptionJa: '多くの引越し業者はダンボール20〜50箱とガムテープを無料で提供します。購入する前に契約内容を確認しましょう。',
    descriptionVi: 'Hầu hết các hãng chuyển nhà đều tặng miễn phí 20 - 50 thùng carton và băng dính khi ký hợp đồng. Tránh tự mua tốn kém.',
    descriptionEn: 'Most moving companies provide 20-50 free cardboard boxes and tape upon contract. Avoid purchasing boxes unnecessarily.',
  },
]);
