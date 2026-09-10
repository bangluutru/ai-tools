/**
 * Dependent Health Insurance Rules (社会保険 被扶養者 認定規則)
 * Based on:
 * - kyoukaikenpo-dependent-2026 (全国健康保険協会: 被扶養者の認定基準)
 * - 健康保険法 第3条第7項
 */

export const RELATIONSHIPS = {
  // Nhóm 1: Không yêu cầu sống chung (同居が要件でない親族)
  spouse: {
    id: 'spouse',
    cohabitationRequired: false,
    degree: 1,
    name: {
      ja: '配偶者（夫・妻、内縁を含む）',
      vi: 'Vợ / Chồng (bao gồm cả hôn nhân thực tế)',
      en: 'Spouse (including common-law)'
    }
  },
  child: {
    id: 'child',
    cohabitationRequired: false,
    degree: 1,
    name: {
      ja: '子（実子・養子）',
      vi: 'Con cái (con ruột, con nuôi)',
      en: 'Child (biological or adopted)'
    }
  },
  grandchild: {
    id: 'grandchild',
    cohabitationRequired: false,
    degree: 2,
    name: {
      ja: '孫',
      vi: 'Cháu nội / Cháu ngoại',
      en: 'Grandchild'
    }
  },
  parent: {
    id: 'parent',
    cohabitationRequired: false,
    degree: 1,
    name: {
      ja: '父母（実父母・養父母）',
      vi: 'Cha mẹ (ruột hoặc nuôi)',
      en: 'Parent'
    }
  },
  grandparent: {
    id: 'grandparent',
    cohabitationRequired: false,
    degree: 2,
    name: {
      ja: '祖父母・曾祖父母（直系尊属）',
      vi: 'Ông bà / Cụ (trực hệ tôn thân)',
      en: 'Grandparent / Great-grandparent'
    }
  },
  sibling: {
    id: 'sibling',
    cohabitationRequired: false,
    degree: 2,
    name: {
      ja: '兄弟姉妹',
      vi: 'Anh, chị, em ruột',
      en: 'Sibling'
    }
  },

  // Nhóm 2: Bắt buộc phải sống cùng một hộ gia đình (同居が要件である親族)
  relative_3rd_degree: {
    id: 'relative_3rd_degree',
    cohabitationRequired: true,
    degree: 3,
    name: {
      ja: '3親等内の親族（叔父・叔母・甥・姪など）',
      vi: 'Họ hàng trong phạm vi 3 đời (Cô, dì, chú, bác, cháu...)',
      en: '3rd-degree relative (Uncle, aunt, nephew, niece)'
    }
  },
  in_laws_parent: {
    id: 'in_laws_parent',
    cohabitationRequired: true,
    degree: 1,
    name: {
      ja: '配偶者の父母・連れ子（義理の父母など）',
      vi: 'Cha mẹ vợ/chồng, con riêng của vợ/chồng',
      en: "Spouse's parents / stepchildren"
    }
  },
  other_cohabitant: {
    id: 'other_cohabitant',
    cohabitationRequired: true,
    degree: 3,
    name: {
      ja: '内縁配偶者の父母・連れ子',
      vi: 'Cha mẹ, con cái của người phối ngẫu nội duyên',
      en: "Common-law spouse's family"
    }
  }
};

export const RESIDENCE_EXCEPTIONS = {
  none: {
    id: 'none',
    name: {
      ja: '例外なし（海外在住・住民票なし）',
      vi: 'Không có ngoại lệ (sống ở nước ngoài, không có sổ cư trú)',
      en: 'No exception (living abroad without Jp residence)'
    }
  },
  study_abroad: {
    id: 'study_abroad',
    name: {
      ja: '外国において留学をする学生',
      vi: 'Du học sinh đang theo học tại trường nước ngoài',
      en: 'Student studying abroad'
    }
  },
  overseas_companion: {
    id: 'overseas_companion',
    name: {
      ja: '海外赴任する被保険者に同行する家族',
      vi: 'Người thân đi cùng người bảo hiểm được công ty phái cử ra nước ngoài',
      en: 'Family accompanying insured person on overseas assignment'
    }
  },
  volunteer: {
    id: 'volunteer',
    name: {
      ja: '青年海外協力隊等の国際交流・ボランティア活動',
      vi: 'Tình nguyện viên hợp tác quốc tế (JICA, v.v.)',
      en: 'International volunteer worker (e.g. JICA)'
    }
  }
};
