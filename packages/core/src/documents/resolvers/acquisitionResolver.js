/**
 * @file acquisitionResolver.js
 * Context-aware resolver for "Where and how do I obtain this document?"
 * 
 * CORE RULES:
 * 1. Differentiate Current Address (住所地) vs Registered Domicile (本籍地) vs Jan 1 Tax Address.
 * 2. Gensen Choshuhyo comes from EMPLOYER, not city hall.
 * 3. National tax cert comes from TAX OFFICE (Zeimusho), not city hall.
 * 4. Koseki broad-issuance applies at counters, while konbini requires advance registration when living elsewhere.
 * 5. Respect locality tiering (Verified vs Unverified fallback).
 */

import { getDocumentById } from './documentResolver.js';
import { resolveLocality, LOCALITY_TIERS } from '../acquisition/localityRegistry.js';
import { ACQUISITION_CHANNELS, CHANNEL_METADATA } from '../acquisition/acquisitionChannels.js';
import { ISSUER_TYPES } from '../registry/documentRegistry.js';

/**
 * Resolve where and how to acquire a document based on user context.
 * 
 * @param {string} documentId - Canonical document ID
 * @param {object} [context={}]
 * @param {string} [context.municipalityQuery] - Municipality code or name (e.g. 'Shinjuku', '131041')
 * @param {boolean} [context.hasMyNumberCard=false] - Whether user possesses a valid My Number Card
 * @param {boolean} [context.livesOutsideRegisteredDomicile=false] - If current address differs from 本籍地
 * @param {boolean} [context.movedAfterJan1=false] - If user moved across city boundaries after Jan 1
 * @param {string} [context.registeredDomicileMunicipality] - Registered domicile city name
 * @param {string} [context.jan1Municipality] - Municipality on Jan 1 of relevant tax year
 * @returns {object|null} Detailed acquisition guidance
 */
export function resolveAcquisitionGuidance(documentId, context = {}) {
  const document = getDocumentById(documentId);
  if (!document) return null;

  const locality = resolveLocality(context.municipalityQuery);

  // Authority & Location resolution
  let resolvedIssuer = {
    type: document.issuerType,
    nameJa: '',
    nameI18n: { ja: '', vi: '', en: '' },
    locationGuidanceI18n: { ja: '', vi: '', en: '' },
    criticalCaveatI18n: null,
  };

  switch (document.issuerType) {
    case ISSUER_TYPES.MUNICIPAL_CURRENT_RESIDENCE:
      resolvedIssuer.nameJa = locality.nameJa || '現住所地の市区町村役場';
      resolvedIssuer.nameI18n = {
        ja: locality.nameJa || '現住所地の市区町村役場',
        vi: locality.nameI18n?.vi || 'Tòa thị chính / Phường nơi bạn đang cư trú',
        en: locality.nameI18n?.en || 'Municipal Office of your current residence',
      };
      resolvedIssuer.locationGuidanceI18n = {
        ja: '現在の住民票がある市区町村の区役所・市役所・町役場の住民課・市民課窓口へ。',
        vi: 'Đến quầy Đăng ký cư dân (Jūmin-ka / Shimin-ka) tại Tòa thị chính nơi bạn đang có tên trong sổ cư trú.',
        en: 'Visit the Resident Registration Division of the municipal office where you are currently registered.',
      };
      break;

    case ISSUER_TYPES.MUNICIPAL_REGISTERED_DOMICILE:
      resolvedIssuer.nameJa = context.registeredDomicileMunicipality
        ? `${context.registeredDomicileMunicipality}（本籍地）`
        : '本籍地の市区町村役場';
      resolvedIssuer.nameI18n = {
        ja: resolvedIssuer.nameJa,
        vi: context.registeredDomicileMunicipality
          ? `${context.registeredDomicileMunicipality} (Nơi đăng ký bản quán Honsekichi)`
          : 'Tòa thị chính nơi đăng ký Hộ tịch gốc (Honsekichi)',
        en: context.registeredDomicileMunicipality
          ? `${context.registeredDomicileMunicipality} (Registered Domicile)`
          : 'Municipal Office of Registered Domicile',
      };
      resolvedIssuer.locationGuidanceI18n = {
        ja: '戸籍は「現住所」ではなく「本籍地」が管轄します。ただし、令和6年3月1日以降は本人または直系尊属・卑属が窓口で顔写真付き身分証を提示すれば全国どこの市区町村窓口でも取得可能です（広域交付制度）。',
        vi: 'Hộ tịch do Tòa thị chính nơi đăng ký Bản quán (Honsekichi) quản lý. Tuy nhiên từ 01/03/2024, bạn có thể xin cấp tại bất kỳ Tòa thị chính nào trên toàn quốc nếu trực tiếp mang theo giấy tờ có ảnh (Chế độ Cấp diện rộng 広域交付).',
        en: 'Family registers are legally managed by your Registered Domicile (Honsekichi). Since March 1, 2024, you can obtain copies at ANY municipal counter nationwide by presenting photo ID (Broad-Issuance System).',
      };
      if (context.livesOutsideRegisteredDomicile) {
        resolvedIssuer.criticalCaveatI18n = {
          ja: '【コンビニ利用の注意】本籍地と現住所が異なる場合、事前にマルチコピー機またはマイナポータルから「本籍地利用登録申請」（承認まで数日）が必要です。',
          vi: '【Lưu ý in tại Combini】Nếu nơi ở hiện tại khác nơi đăng ký bản quán, bạn phải làm thủ tục "Đăng ký sử dụng bản quán" (Honsekichi Riyō Tōroku) trên máy photocopy hoặc MynaPortal trước vài ngày.',
          en: '【Convenience Store Note】If your residence differs from your registered domicile, you must apply in advance for "Koseki Kiosk Advance Registration" (takes a few days).',
        };
      }
      break;

    case ISSUER_TYPES.MUNICIPAL_TAX_RESIDENCE:
      resolvedIssuer.nameJa = context.jan1Municipality
        ? `${context.jan1Municipality}（1月1日時点の住所地）`
        : '課税年度の1月1日時点の市区町村役場';
      resolvedIssuer.nameI18n = {
        ja: resolvedIssuer.nameJa,
        vi: context.jan1Municipality
          ? `${context.jan1Municipality} (Nơi cư trú vào ngày 1 tháng 1)`
          : 'Tòa thị chính nơi bạn sinh sống vào ngày 1 tháng 1 của năm tính thuế',
        en: context.jan1Municipality
          ? `${context.jan1Municipality} (Residence on Jan 1)`
          : 'Municipality where you resided on January 1 of the tax year',
      };
      resolvedIssuer.locationGuidanceI18n = {
        ja: '住民税の課税・納税証明書は、その年の「1月1日時点に住民票があった市区町村」が発行します。',
        vi: 'Giấy chứng nhận tính thuế và nộp thuế cư trú do Tòa thị chính nơi bạn có tên trong sổ cư trú vào NGÀY 1 THÁNG 1 của năm đó cấp.',
        en: 'Inhabitant tax certificates are issued strictly by the municipality where you were officially registered on January 1 of that fiscal year.',
      };
      if (context.movedAfterJan1) {
        resolvedIssuer.criticalCaveatI18n = {
          ja: '【引越し注意】1月1日以降に現在の市区町村へ転入された場合、現在の区役所窓口やコンビニでは発行できません。旧住所地の役所へ直接行くか、郵送請求を行う必要があります。',
          vi: '【Cảnh báo chuyển nhà】Nếu bạn mới chuyển đến nơi ở hiện tại sau ngày 1 tháng 1, Tòa thị chính hiện tại và Combini quanh nhà KHÔNG THỂ in giấy thuế này. Bạn phải về Tòa thị chính cũ hoặc gửi đơn qua đường bưu điện.',
          en: '【Relocation Advisory】If you moved to your current city after Jan 1, your current city hall and local convenience stores CANNOT issue this certificate. You must visit the previous city or apply by mail.',
        };
      }
      break;

    case ISSUER_TYPES.NATIONAL_TAX_OFFICE:
      resolvedIssuer.nameJa = '所轄税務署（国税庁）';
      resolvedIssuer.nameI18n = {
        ja: '所轄税務署（国税庁）',
        vi: 'Chi cục Thuế Quốc gia phụ trách (Zeimusho)',
        en: 'Jurisdictional National Tax Office (Zeimusho)',
      };
      resolvedIssuer.locationGuidanceI18n = {
        ja: '国税の納税証明書は市区町村役場ではなく、住所地を管轄する「税務署」または「e-Tax」で取得します。',
        vi: 'Giấy chứng nhận nộp thuế quốc gia KHÔNG lấy ở Tòa thị chính mà phải lấy tại Chi cục Thuế (Zeimusho) hoặc nộp online qua cổng e-Tax.',
        en: 'National tax certificates are issued by the National Tax Office (Zeimusho) or online via e-Tax, NOT the municipal city hall.',
      };
      break;

    case ISSUER_TYPES.EMPLOYER:
      resolvedIssuer.nameJa = '勤務先（人事・総務・給与担当）';
      resolvedIssuer.nameI18n = {
        ja: '勤務先（人事・総務・給与担当）',
        vi: 'Công ty bạn đang làm việc (Phòng Nhân sự / Kế toán lương)',
        en: 'Current Employer (HR / Payroll Department)',
      };
      resolvedIssuer.locationGuidanceI18n = {
        ja: '源泉徴収票や在職証明書は勤務先企業が発行します。市役所や税務署では発行されません。退職時や年末調整後に社内担当者へ申請してください。',
        vi: 'Phiếu Gensen Chōshūhyō và Giấy xác nhận công tác do chính công ty bạn cấp, Tòa thị chính hay Chi cục thuế KHÔNG CẤP giấy này.',
        en: 'Withholding tax slips and employment certificates are issued by your employer, NOT by government or tax offices.',
      };
      break;

    default:
      resolvedIssuer.nameJa = '所轄公的機関';
      resolvedIssuer.nameI18n = {
        ja: '所轄公的機関',
        vi: 'Cơ quan công quyền phụ trách',
        en: 'Jurisdictional Public Authority',
      };
      resolvedIssuer.locationGuidanceI18n = {
        ja: '所轄機関の窓口または公式サイトをご確認ください。',
        vi: 'Vui lòng kiểm tra cổng thông tin của cơ quan có thẩm quyền.',
        en: 'Check with the designated jurisdictional agency desk or portal.',
      };
      break;
  }

  // Channel Action Details
  const channels = (document.supportedChannels || []).map((channelId) => {
    const meta = CHANNEL_METADATA[channelId];
    if (!meta) return { channelId };

    // Calculate fee based on locality if available
    let feeJpy = meta.typicalFeeJpy;
    let isKonbiniSupportedInLocality = true;

    if (channelId === ACQUISITION_CHANNELS.CONVENIENCE_STORE && locality.fees) {
      if (document.id === 'document.resident-record-copy' && locality.fees.residentRecord) {
        feeJpy = locality.fees.residentRecord.konbini;
      } else if (document.id === 'document.seal-registration-certificate' && locality.fees.sealRegistration) {
        feeJpy = locality.fees.sealRegistration.konbini;
      } else if (document.id === 'document.taxation-certificate' && locality.fees.taxationCert) {
        feeJpy = locality.fees.taxationCert.konbini;
      } else if (document.id === 'document.family-register-full' && locality.fees.familyRegisterFull) {
        feeJpy = locality.fees.familyRegisterFull.konbini;
      }

      // Check if this document type is supported at konbini in this municipality
      if (locality.convenienceStoreSupport) {
        if (document.id === 'document.taxation-certificate' && !locality.convenienceStoreSupport.taxCertificate) {
          isKonbiniSupportedInLocality = false;
        }
      }
    } else if (channelId === ACQUISITION_CHANNELS.MUNICIPAL_COUNTER && locality.fees) {
      if (document.id === 'document.resident-record-copy' && locality.fees.residentRecord) {
        feeJpy = locality.fees.residentRecord.counter;
      } else if (document.id === 'document.seal-registration-certificate' && locality.fees.sealRegistration) {
        feeJpy = locality.fees.sealRegistration.counter;
      }
    }

    return {
      channelId,
      nameJa: meta.nameJa,
      nameI18n: meta.nameI18n,
      operatingHoursJa: meta.standardHoursJa,
      feeJpy,
      feeNoteI18n: meta.feeNoteI18n,
      prerequisites: meta.prerequisites,
      isAvailableWithUserSetup: channelId === ACQUISITION_CHANNELS.CONVENIENCE_STORE ? context.hasMyNumberCard : true,
      isSupportedInQueriedLocality: isKonbiniSupportedInLocality,
      iconName: meta.iconName,
    };
  });

  return {
    document,
    issuer: resolvedIssuer,
    locality,
    channels,
    hasMyNumberCard: Boolean(context.hasMyNumberCard),
    disclaimers: locality.isFallback ? locality.unverifiedAdvisoryI18n : null,
  };
}
