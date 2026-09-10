/**
 * @file certificateGuideEngine.js
 * Engine for "Giấy này lấy ở đâu, bằng cách nào?" (Where and how do I get this certificate?)
 * Formulates structured step-by-step acquisition plans across channels.
 */

import { resolveAcquisitionGuidance } from '../resolvers/acquisitionResolver.js';
import { getDocumentById, getAllDocuments } from '../resolvers/documentResolver.js';

export const COMMON_CERTIFICATES = [
  'document.resident-record-copy',
  'document.seal-registration-certificate',
  'document.taxation-certificate',
  'document.tax-payment-certificate',
  'document.national-tax-payment-cert',
  'document.family-register-full',
  'document.withholding-tax-slip',
  'document.employment-separation-certificate',
];

/**
 * Get quick list of common certificates for quick selection.
 */
export function getCommonCertificates() {
  return COMMON_CERTIFICATES.map((id) => getDocumentById(id)).filter(Boolean);
}

/**
 * Build a complete acquisition guide report for a document and user context.
 * 
 * @param {object} params
 * @param {string} params.documentId
 * @param {string} [params.municipalityQuery]
 * @param {boolean} [params.hasMyNumberCard=false]
 * @param {boolean} [params.livesOutsideRegisteredDomicile=false]
 * @param {boolean} [params.movedAfterJan1=false]
 * @param {string} [params.jan1Municipality]
 * @param {string} [params.registeredDomicileMunicipality]
 * @returns {object|null}
 */
export function buildCertificateAcquisitionGuide({
  documentId,
  municipalityQuery,
  hasMyNumberCard = false,
  livesOutsideRegisteredDomicile = false,
  movedAfterJan1 = false,
  jan1Municipality,
  registeredDomicileMunicipality,
}) {
  const guidance = resolveAcquisitionGuidance(documentId, {
    municipalityQuery,
    hasMyNumberCard,
    livesOutsideRegisteredDomicile,
    movedAfterJan1,
    jan1Municipality,
    registeredDomicileMunicipality,
  });

  if (!guidance) return null;

  // Formulate step-by-step procedures per channel
  const detailedSteps = {
    convenience_store: [
      {
        step: 1,
        titleJa: 'コンビニのマルチコピー機へ行く',
        titleI18n: {
          ja: 'コンビニのマルチコピー機へ行く',
          vi: 'Đến máy photocopy đa năng tại cửa hàng tiện lợi',
          en: 'Go to the multi-copy kiosk at a convenience store',
        },
        descI18n: {
          ja: 'セブン-イレブン、ローソン、ファミリーマート等のマルチコピー機のタッチパネルで「行政サービス」を選択。',
          vi: 'Trên màn hình cảm ứng của máy tại 7-Eleven, Lawson, FamilyMart, chọn mục "行政サービス" (Dịch vụ hành chính).',
          en: 'Touch "Administrative Services" (行政サービス) on the multi-copy kiosk touchscreen.',
        },
      },
      {
        step: 2,
        titleJa: 'マイナンバーカードをセットする',
        titleI18n: {
          ja: 'マイナンバーカードをセットする',
          vi: 'Đặt thẻ My Number vào đầu đọc thẻ',
          en: 'Place your My Number Card on the scanner',
        },
        descI18n: {
          ja: '端末の所定位置にマイナンバーカードを置き、「利用者証明用電子証明書」の数字4桁の暗証番号を入力。',
          vi: 'Đặt thẻ vào khay đọc và nhập mã PIN 4 số của Chứng thư xác thực (利用者証明用電子証明書).',
          en: 'Place card on reader and enter your 4-digit User Authentication PIN.',
        },
      },
      {
        step: 3,
        titleJa: '証明書の種類と記載事項を選択',
        titleI18n: {
          ja: '証明書の種類と記載事項を選択',
          vi: 'Chọn loại giấy tờ và nội dung cần in',
          en: 'Select document type and options',
        },
        descI18n: {
          ja: '必要な部数、世帯全員／一部、続柄や国籍の記載有無を選択（マイナンバーは原則「記載なし」を選択）。',
          vi: 'Chọn số lượng bản, in cả nhà hay cá nhân, có in quan hệ hay quốc tịch không (Mã số cá nhân chọn "KHÔNG IN").',
          en: 'Select number of copies and inclusion options (choose WITHOUT My Number unless legally demanded).',
        },
      },
      {
        step: 4,
        titleJa: '手数料を支払い印刷する',
        titleI18n: {
          ja: '手数料を支払い印刷する',
          vi: 'Thanh toán lệ phí và nhận giấy tờ',
          en: 'Pay fee and collect printed certificate',
        },
        descI18n: {
          ja: 'コインベンダーまたは電子マネーで手数料を支払い、改ざん防止特殊用紙に印刷された証明書と領収書、カードを受取。',
          vi: 'Bỏ tiền xu hoặc quẹt thẻ điện tử, nhận bản in trên giấy chống làm giả, lấy lại thẻ My Number và biên lai.',
          en: 'Pay via cash or e-money. Collect your secure-paper certificate, receipt, and retrieve your card.',
        },
      },
    ],

    municipal_counter: [
      {
        step: 1,
        titleJa: '窓口へ持参するものを準備する',
        titleI18n: {
          ja: '窓口へ持参するものを準備する',
          vi: 'Chuẩn bị hồ sơ mang theo',
          en: 'Prepare items to bring to counter',
        },
        descI18n: {
          ja: '本人確認書類（在留カード、マイナンバーカード、運転免許証等）、印鑑（認印）、手数料（現金またはキャッシュレス）。',
          vi: 'Giấy tờ tùy thân (Thẻ cư trú, Thẻ My Number, Bằng lái), con dấu cá nhân (nếu có), tiền mặt hoặc thẻ để đóng phí.',
          en: 'Photo ID (Residence Card, My Number Card, Driver License), personal seal, and payment.',
        },
      },
      {
        step: 2,
        titleJa: '申請書（請求書）を記入する',
        titleI18n: {
          ja: '申請書（請求書）を記入する',
          vi: 'Điền đơn xin cấp chứng nhận',
          en: 'Fill out request application form',
        },
        descI18n: {
          ja: '区役所・市役所の記載台にある「住民票等交付請求書」に氏名、生年月日、住所、必要部数を記入。',
          vi: 'Lấy mẫu đơn tại bàn hướng dẫn của Tòa thị chính, điền tên, ngày sinh, địa chỉ và số lượng bản cần xin.',
          en: 'Complete the certificate request form available at the writing counter in the municipal office.',
        },
      },
      {
        step: 3,
        titleJa: '発券機で番号札を取り窓口で申請',
        titleI18n: {
          ja: '発券機で番号札を取り窓口で申請',
          vi: 'Lấy số thứ tự và nộp tại quầy',
          en: 'Take queue ticket and submit at counter',
        },
        descI18n: {
          ja: '番号が呼ばれたら申請書と身分証を提出し、交付窓口で手数料を支払って証明書を受領。',
          vi: 'Khi được gọi số, nộp đơn và xuất trình thẻ cư trú, thanh toán lệ phí tại quầy thu ngân và nhận giấy tờ.',
          en: 'When your number is called, present form and ID, pay the fee, and receive the certificate.',
        },
      },
    ],

    mail_request: [
      {
        step: 1,
        titleJa: '交付請求書を印刷・記入する',
        titleI18n: {
          ja: '交付請求書を印刷・記入する',
          vi: 'In và điền đơn yêu cầu gửi bưu điện',
          en: 'Print and fill mail request form',
        },
        descI18n: {
          ja: '自治体HPから郵送用請求書をダウンロード・印刷し、必要事項と日中連絡先電話番号を記入。',
          vi: 'Tải mẫu đơn từ website Tòa thị chính, điền đầy đủ thông tin và số điện thoại liên lạc ban ngày.',
          en: 'Download mail request form from municipal website and complete all fields including phone number.',
        },
      },
      {
        step: 2,
        titleJa: '定額小為替を郵便局で購入する',
        titleI18n: {
          ja: '定額小為替を郵便局で購入する',
          vi: 'Mua séc bưu điện Teigaku Kogawase',
          en: 'Purchase postal money order (Teigaku Kogawase)',
        },
        descI18n: {
          ja: '郵便局（ゆうちょ銀行）窓口で手数料分の定額小為替を購入（※小為替には何も記入しないで同封）。',
          vi: 'Đến bưu điện mua séc Teigaku Kogawase đúng số tiền lệ phí (TUYỆT ĐỐI KHÔNG viết gì lên tờ séc).',
          en: 'Purchase Teigaku Kogawase at Japan Post for exact fee amount (leave all fields on slip blank).',
        },
      },
      {
        step: 3,
        titleJa: '同封書類を揃えて郵送する',
        titleI18n: {
          ja: '同封書類を揃えて郵送する',
          vi: 'Tập hợp đầy đủ hồ sơ vào phong bì',
          en: 'Assemble all items and mail envelope',
        },
        descI18n: {
          ja: '①請求書、②本人確認書類のコピー、③定額小為替、④返信用封筒（現住所・氏名を記載し切手貼付）を同封して郵送。',
          vi: 'Gửi phong bì gồm: ① Đơn, ② Bản sao thẻ ngoại kiều/My Number, ③ Séc bưu điện, ④ Phong bì hồi âm dán sẵn tem ghi sẵn địa chỉ nhà bạn.',
          en: 'Enclose form, ID copy, money order, and self-addressed stamped return envelope.',
        },
      },
    ],
  };

  return {
    ...guidance,
    detailedSteps,
  };
}
