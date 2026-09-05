import {
  yukaMinimalLineartTemplate,
  photographerDarkroomTemplate,
  architectBlueprintTemplate,
  botanicalArtisanTemplate
} from "./templates/creativeTemplates.js";
import {
  minimalModernTemplate,
  scandinavianCleanTemplate,
  editorialMagazineTemplate,
  monospaceDeveloperTemplate
} from "./templates/minimalTemplates.js";
import {
  corporateTrustTemplate,
  fintechGeometricTemplate,
  legalConsultingTemplate,
  medicalClinicTemplate
} from "./templates/corporateTemplates.js";
import {
  tategakiWashiTemplate,
  kyotoArtisanTemplate,
  zenStoneMinimalTemplate,
  tradMonCrestTemplate
} from "./templates/traditionalTemplates.js";
import {
  executiveLuxuryTemplate,
  emeraldGoldTemplate,
  marbleRosegoldTemplate,
  monochromePrestigeTemplate
} from "./templates/luxuryTemplates.js";
import {
  techInnovatorTemplate,
  cyberMatrixTemplate,
  glassmorphismCardTemplate,
  qrFirstConnectTemplate
} from "./templates/techTemplates.js";
import {
  bilingualSplitTemplate,
  globalDiplomatTemplate,
  crossborderCommerceTemplate,
  consultantDualQrTemplate
} from "./templates/bilingualTemplates.js";
export const TEMPLATE_DEFINITIONS = [
  // 1. Creative & Line-Art (4 templates)
  yukaMinimalLineartTemplate,
  photographerDarkroomTemplate,
  architectBlueprintTemplate,
  botanicalArtisanTemplate,
  // 2. Minimal Modern (4 templates)
  minimalModernTemplate,
  scandinavianCleanTemplate,
  editorialMagazineTemplate,
  monospaceDeveloperTemplate,
  // 3. Corporate & Business (4 templates)
  corporateTrustTemplate,
  fintechGeometricTemplate,
  legalConsultingTemplate,
  medicalClinicTemplate,
  // 4. Japanese Traditional (4 templates)
  tategakiWashiTemplate,
  kyotoArtisanTemplate,
  zenStoneMinimalTemplate,
  tradMonCrestTemplate,
  // 5. Luxury & Premium (4 templates)
  executiveLuxuryTemplate,
  emeraldGoldTemplate,
  marbleRosegoldTemplate,
  monochromePrestigeTemplate,
  // 6. Tech & Digital Startup (4 templates)
  techInnovatorTemplate,
  cyberMatrixTemplate,
  glassmorphismCardTemplate,
  qrFirstConnectTemplate,
  // 7. International & Bilingual (4 templates)
  bilingualSplitTemplate,
  globalDiplomatTemplate,
  crossborderCommerceTemplate,
  consultantDualQrTemplate
];
export function findTemplateById(id) {
  if (!id) return TEMPLATE_DEFINITIONS[0];
  if (id === "japanese-traditional") {
    return tategakiWashiTemplate;
  }
  return TEMPLATE_DEFINITIONS.find((t) => t.id === id) || TEMPLATE_DEFINITIONS[0];
}
