/**
 * @file packages/core/src/navigator/intent/intentTaxonomy.js
 * @description
 * Canonical Intent Registry and multilingual aliases for Japan Life Navigator.
 * Standardizes user intents across Vietnamese (with & without accents), Japanese (Kanji, Kana, Romaji), and English.
 */

/**
 * Danh mục các Intent chính thức (Canonical Intents)
 */
export const CANONICAL_INTENTS = Object.freeze({
  'intent.jp.life.start': {
    id: 'intent.jp.life.start',
    targetSituation: 'life.jp.starting-life',
    label: {
      vi: 'Bắt đầu cuộc sống tại Nhật Bản',
      ja: '日本での新生活スタート',
      en: 'Start Living in Japan',
    },
    description: {
      vi: 'Mới sang Nhật hoặc chuẩn bị sang: nhập cảnh, đăng ký cư trú, My Number, bảo hiểm, ngân hàng, tiện ích.',
      ja: '入国直後・来日前：在留カード、住民登録、マイナンバー、保険・年金、銀行口座、生活インフラ。',
      en: 'Newly arrived or arriving: residence card, address registration, My Number, insurance, banking, utilities.',
    },
    aliases: [
      // VI
      'moi sang nhat', 'mới sang nhật', 'bat dau cuoc song o nhat', 'bắt đầu cuộc sống ở nhật',
      'sap sang nhat', 'sắp sang nhật', 'vua den tokyo', 'vừa đến nhật', 'nhap canh nhat ban', 'nhập cảnh nhật bản',
      // JA
      '来日', '新生活', '日本入国', '来日直後', '日本生活スタート', '住民登録', '在留カード受け取り',
      // Romaji
      'rainichi', 'shinseikatsu', 'nyuukoku',
      // EN
      'arriving in japan', 'start living in japan', 'new to japan', 'relocating to japan', 'just moved to japan',
    ],
  },

  'intent.jp.job.change': {
    id: 'intent.jp.job.change',
    targetSituation: 'life.jp.changing-job',
    label: {
      vi: 'Chuyển việc / Đổi công ty',
      ja: '転職・会社変更',
      en: 'Change Jobs in Japan',
    },
    description: {
      vi: 'Chuyển từ công ty hiện tại sang công ty mới: giấy tờ thôi việc, báo Cục XNC 14 ngày, khoảng trống bảo hiểm, vào công ty mới.',
      ja: '現職の退職から新会社への移籍：離職票、入管14日以内届出、保険年金の空白期間、新職場の入社手続き。',
      en: 'Moving between employers: exit documents, 14-day immigration notice, insurance/pension gap, new employer setup.',
    },
    aliases: [
      // VI
      'chuyen viec', 'chuyển việc', 'doi cong ty', 'đổi công ty', 'sang cty moi', 'sang công ty mới',
      'nhay viec', 'nhảy việc', 'tim viec moi', 'tìm việc mới', 'chuyen cty', 'chuyển cty',
      // JA
      '転職', '会社変更', '新しい会社', '中途採用', '勤務先変更', '移籍', '所属機関変更',
      // Romaji
      'tenshoku', 'kaisha henkou', 'shozoku henkou',
      // EN
      'change jobs', 'changing job', 'switch employer', 'new company', 'job transition',
    ],
  },

  'intent.jp.job.leave': {
    id: 'intent.jp.job.leave',
    targetSituation: 'life.jp.leaving-job',
    label: {
      vi: 'Nghỉ việc / Thôi việc',
      ja: '退職・離職手続き',
      en: 'Leave a Job / Resignation',
    },
    description: {
      vi: 'Nghỉ việc tại công ty hiện tại, xin trợ cấp thất nghiệp, chuyển đổi BHYT, quyết toán thuế, bảo lưu quyền lợi.',
      ja: '現職の退職、雇用保険失業給付、国民健康保険への切り替え、源泉徴収票の受領。',
      en: 'Resigning from current job: exit procedures, unemployment benefits, health insurance switch, tax settlement.',
    },
    aliases: [
      // VI
      'nghi viec', 'nghỉ việc', 'thoi viec', 'thôi việc', 'mat viec', 'mất việc', 'that nghiep', 'thất nghiệp',
      'tro cap that nghiep', 'trợ cấp thất nghiệp', 'xin nghi viec', 'xin nghỉ việc', 'bi sa thai', 'bị sa thải',
      // JA
      '退職', '離職', '会社を辞める', '失業', '失業保険', '失業給付', 'ハローワーク', '解雇', '退職届',
      // Romaji
      'taishoku', 'rishoku', 'shitsugyou', 'hellowork',
      // EN
      'leave job', 'resigning', 'unemployment', 'quit job', 'laid off', 'unemployment benefit',
    ],
  },

  'intent.jp.move': {
    id: 'intent.jp.move',
    targetSituation: 'life.jp.moving',
    label: {
      vi: 'Chuyển nhà / Thay đổi địa chỉ',
      ja: '引越し・住所変更',
      en: 'Move House / Relocate',
    },
    description: {
      vi: 'Chuyển nơi ở cùng thành phố hoặc khác thành phố: giấy chuyển đi (Tenshutsu), đăng ký chuyển đến (Ten\'nyu), cập nhật My Number, BHYT.',
      ja: '転出届、転入届、マイナンバーカードの住所更新、国民健康保険、各種インフラ変更。',
      en: 'Moving within or between municipalities: moving-out, moving-in, My Number address update, NHI transfer.',
    },
    aliases: [
      // VI
      'chuyen nha', 'chuyển nhà', 'doi dia chi', 'đổi địa chỉ', 'chuyen cho o', 'chuyển chỗ ở',
      'chuyen den tokyo', 'chuyển đến tokyo', 'chuyen sang fukuoka', 'chuyển sang fukuoka', 'giay chuyen di', 'giấy chuyển đi',
      // JA
      '引越し', '引っ越し', '住所変更', '転出届', '転入届', '転居届', '住居移転',
      // Romaji
      'hikkoshi', 'juusho henkou', 'tenshutsu', 'tennyu',
      // EN
      'move house', 'relocating', 'change address', 'moving out', 'moving in', 'new address',
    ],
  },

  'intent.jp.birth': {
    id: 'intent.jp.birth',
    targetSituation: 'life.jp.pregnancy-birth',
    label: {
      vi: 'Sinh con / Chăm sóc con cái',
      ja: '出産・育児・子育て',
      en: 'Pregnancy, Birth & Childcare',
    },
    description: {
      vi: 'Mang thai, sinh con và chăm sóc con nhỏ: trợ cấp sinh con, trợ cấp nghỉ thai sản/nuôi con, trợ cấp trẻ em (Jido Teate), giấy khai sinh.',
      ja: '出産育児一時金、出産手当金、育児休業給付金、出生届、児童手当、子ども医療費助成。',
      en: 'Pregnancy, childbirth, and parental leave: lump-sum birth allowance, maternity pay, childcare benefits, child allowance.',
    },
    aliases: [
      // VI
      'sinh con', 'sap sinh con', 'sắp sinh con', 'mang thai', 'nghi thai san', 'nghỉ thai sản',
      'tro cap sinh con', 'trợ cấp sinh con', 'tro cap tre em', 'trợ cấp trẻ em', 'khai sinh', 'khai sinh cho con',
      // JA
      '出産', '妊娠', '子どもが生まれる', '出産一時金', '育児休業', '育休', '児童手当', '出生届', '産休',
      // Romaji
      'shussan', 'ninshin', 'ikukyuu', 'jido teate', 'shusshou',
      // EN
      'have a baby', 'pregnant', 'childbirth', 'maternity leave', 'paternity leave', 'child allowance',
    ],
  },

  'intent.jp.family.invite': {
    id: 'intent.jp.family.invite',
    targetSituation: 'life.jp.family-joining',
    label: {
      vi: 'Bảo lãnh người thân sang Nhật',
      ja: '家族呼び寄せ・帯同',
      en: 'Bring Family to Japan',
    },
    description: {
      vi: 'Đón vợ/chồng hoặc con sang Nhật định cư: xin tư cách lưu trú COE, nhập cảnh, đăng ký cư trú, bảo hiểm phụ thuộc.',
      ja: '配偶者・子どもの在留資格認定証明書（COE）、来日手続き、住民登録、社会保険・健康保険の被扶養者追加。',
      en: 'Sponsoring spouse or children to live in Japan: COE application, arrival, address registration, dependent insurance.',
    },
    aliases: [
      // VI
      'bao lanh vo', 'bảo lãnh vợ', 'bao lanh chong', 'bảo lãnh chồng', 'don vo sang nhat', 'đón vợ sang nhật',
      'bao lanh con', 'bảo lãnh con', 'nguoi than sang nhat', 'người thân sang nhật', 'xin visa gia dinh', 'xin visa gia đình',
      'visa phu thuoc', 'visa phụ thuộc', 'coe gia dinh', 'coe gia đình',
      'vo sap sang nhat', 'vợ sắp sang nhật', 'vo toi sap sang nhat', 'vợ tôi sắp sang nhật',
      'chong sap sang nhat', 'chồng sắp sang nhật', 'con sap sang nhat', 'con sắp sang nhật',
      // JA
      '家族呼び寄せ', '配偶者呼び寄せ', '家族帯同', '家族滞在', '妻を呼ぶ', '夫を呼ぶ', '子どもを呼ぶ', 'COE申請',
      // Romaji
      'kazoku yobiyose', 'kazoku taidou', 'kazoku taizai',
      // EN
      'bring family', 'bring spouse', 'sponsor wife', 'sponsor husband', 'dependent visa', 'family joining',
    ],
  },

  'intent.jp.residence.renew': {
    id: 'intent.jp.residence.renew',
    targetSituation: 'life.jp.residence-renewal',
    label: {
      vi: 'Gia hạn thời hạn cư trú (Gia hạn visa)',
      ja: '在留期間更新（ビザ更新）',
      en: 'Renew Residence Period (Visa Renewal)',
    },
    description: {
      vi: 'Gia hạn tư cách lưu trú trước khi hết hạn (trong vòng 3 tháng): hồ sơ thuế, công ty, lệ phí, thủ tục online.',
      ja: '在留期限の3ヶ月前から申請可能：会社書類、課税・納税証明書、手数料、オンライン申請。',
      en: 'Renewing current residence status within 3 months of expiry: tax certificates, company documents, filing.',
    },
    aliases: [
      // VI
      'gia han visa', 'gia hạn visa', 'visa sap het han', 'visa sắp hết hạn', 'gia han the cu tru', 'gia hạn thẻ cư trú',
      'het han luu tru', 'hết hạn lưu trú', 'lam lai visa', 'làm lại visa', 'sap het han', 'sắp hết hạn',
      'visa het han', 'visa hết hạn',
      // JA
      'ビザ更新', '在留期間更新', '在留期限', '更新申請', 'ビザが切れる', '期限更新',
      // Romaji
      'visa koushin', 'zairyu koushin', 'koushin shinsei',
      // EN
      'renew visa', 'extend visa', 'residence renewal', 'visa expiring', 'extend stay',
    ],
  },

  'intent.jp.residence.pr': {
    id: 'intent.jp.residence.pr',
    targetSituation: 'life.jp.pr-readiness',
    label: {
      vi: 'Chuẩn bị xin Vĩnh trú (Eijuu)',
      ja: '永住許可申請の準備',
      en: 'Permanent Residence (PR) Preparation',
    },
    description: {
      vi: 'Đánh giá điều kiện xin Vĩnh trú: số năm ở Nhật, thu nhập tối thiểu, lịch sử đóng thuế/bảo hiểm/lương hưu đúng hạn, người bảo lãnh.',
      ja: '永住申請の要件チェック：居住年数、年収要件、年金・保険・税金の納期厳守履歴、身元保証人。',
      en: 'Evaluating eligibility for PR: residence duration, income thresholds, on-time tax/pension payment records, guarantor.',
    },
    aliases: [
      // VI
      'vinh tru', 'vĩnh trú', 'xin vinh tru', 'xin vĩnh trú', 'dieu kien vinh tru', 'điều kiện vĩnh trú',
      'visa vinh tru', 'visa vĩnh trú', 'eiju', 'eijuu',
      // JA
      '永住', '永住権', '永住許可', '永住申請', '永住の条件',
      // Romaji
      'eijuu', 'eijuuken', 'eijyu',
      // EN
      'permanent residence', 'pr in japan', 'apply for pr', 'green card japan',
    ],
  },

  'intent.jp.document.obtain': {
    id: 'intent.jp.document.obtain',
    targetSituation: 'life.jp.documents',
    label: {
      vi: 'Xin cấp giấy tờ hành chính',
      ja: '公的証明書の取得',
      en: 'Obtain Government Certificates',
    },
    description: {
      vi: 'Lấy phiếu cư trú (Juminhyo), giấy chứng nhận thuế, con dấu, hộ tịch, sao lục qua combini hoặc quầy.',
      ja: '住民票の写し、課税・納税証明書、印鑑登録証明書、戸籍謄本、コンビニ交付。',
      en: 'Getting residence certificate (Juminhyo), tax proof, seal certificate, family register via combini or office.',
    },
    aliases: [
      // VI
      'xin giay to', 'xin giấy tờ', 'lay juminhyo', 'lấy juminhyo', 'giay cu tru', 'giấy cư trú',
      'giay thue', 'giấy thuế', 'giay nop thue', 'giấy nộp thuế', 'in o combini', 'in ở combini',
      'ho tich', 'hộ tịch', 'giay chung nhan con dau', 'giấy chứng nhận con dấu',
      // JA
      '証明書取得', '住民票', '課税証明書', '納税証明書', '印鑑証明', '戸籍謄本', 'コンビニ交付', '役所で書類',
      // Romaji
      'juminhyo', 'kazei shoumeisho', 'nouzei shoumeisho', 'koseki', 'inkan shoumei',
      // EN
      'get certificates', 'juminhyo', 'tax certificate', 'residence certificate', 'print at combini',
    ],
  },

  'intent.jp.life.leave': {
    id: 'intent.jp.life.leave',
    targetSituation: 'life.jp.leaving-japan',
    label: {
      vi: 'Rời Nhật Bản / Về nước vĩnh viễn',
      ja: '日本出国・完全帰国',
      en: 'Leave Japan Permanently',
    },
    description: {
      vi: 'Thủ tục hồi hương vĩnh viễn: báo chuyển đi nước ngoài, thủ tục thuế cư trú, nhận lại tiền Nenkin (Lump-sum Withdrawal), hủy ngân hàng/sim.',
      ja: '完全帰国手続き：転出届（国外）、住民税の一括徴収・納税管理人、脱退一時金の請求準備、口座・携帯解約。',
      en: 'Procedures for permanent departure: overseas moving-out notice, residence tax representative, pension lump-sum claim, bank closure.',
    },
    aliases: [
      // VI
      've nuoc', 'về nước', 'roi nhat ban', 'rời nhật bản', 've nuoc han', 'về nước hẳn',
      'rut nenkin', 'rút nenkin', 'lay tien nenkin', 'lấy tiền nenkin', 'huy the cu tru', 'hủy thẻ cư trú',
      // JA
      '帰国', '完全帰国', '出国', '日本を出る', '脱退一時金', '納税管理人', '国外転出',
      // Romaji
      'kikoku', 'shukkoku', 'dattai ichijikin',
      // EN
      'leaving japan', 'move back home', 'permanent departure', 'lump sum pension', 'exit japan',
    ],
  },
});
