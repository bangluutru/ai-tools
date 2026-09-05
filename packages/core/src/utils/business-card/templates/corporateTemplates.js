export const corporateTrustTemplate = {
  id: "corporate-trust",
  name: "Corporate Trust Navy Bar",
  nameJp: "\u738B\u9053\u30FB\u4FE1\u983C\u30B3\u30FC\u30DD\u30EC\u30FC\u30C8",
  category: "corporate",
  descriptionJp: "\u7D3A\u8272\uFF08\u6FC3\u85CD\uFF09\u306E\u30A2\u30AF\u30BB\u30F3\u30C8\u30D0\u30FC\u3068\u7AEF\u6B63\u306A\u30EC\u30A4\u30A2\u30A6\u30C8\u3002\u4E0A\u5834\u4F01\u696D\u30FB\u5927\u624B\u5546\u793E\u30FB\u91D1\u878D\u30FB\u58EB\u696D\u6A19\u6E96\u3002",
  defaultOrientation: "horizontal",
  previewBadge: "\u5B9A\u756A",
  generator: (profile, dim, orientation) => {
    const isHoriz = orientation === "horizontal";
    const w = isHoriz ? dim.widthMm : dim.heightMm;
    const h = isHoriz ? dim.heightMm : dim.widthMm;
    const frontElements = [
      // Top accent bar
      {
        id: "f-bar",
        type: "shape",
        shapeType: "rectangle",
        xMm: 0,
        yMm: 0,
        widthMm: w,
        heightMm: 3.5,
        backgroundColor: "#0A2540",
        zIndex: 1
      },
      // Company Name
      {
        id: "f-comp",
        type: "text",
        content: profile.companyName,
        fieldBinding: "companyName",
        xMm: 10,
        yMm: isHoriz ? 8 : 10,
        widthMm: isHoriz ? 48 : w - 20,
        heightMm: 5,
        fontFamily: '"Zen Kaku Gothic New", sans-serif',
        fontSizePt: 8.5,
        fontWeight: "700",
        color: "#0A2540",
        align: "left",
        letterSpacingMm: 0.2,
        zIndex: 2
      },
      {
        id: "f-comp-en",
        type: "text",
        content: profile.companyNameEn || "",
        fieldBinding: "companyNameEn",
        xMm: 10,
        yMm: isHoriz ? 13.5 : 15,
        widthMm: isHoriz ? 48 : w - 20,
        heightMm: 3,
        fontFamily: "Montserrat, sans-serif",
        fontSizePt: 5,
        fontWeight: "500",
        color: "#64748B",
        align: "left",
        letterSpacingMm: 0.1,
        zIndex: 3
      },
      // Title
      {
        id: "f-title",
        type: "text",
        content: `${profile.department ? profile.department + "\u3000" : ""}${profile.jobTitle}`,
        fieldBinding: "jobTitle",
        xMm: 10,
        yMm: isHoriz ? 21 : 24,
        widthMm: isHoriz ? 48 : w - 20,
        heightMm: 4,
        fontFamily: '"Noto Sans JP", sans-serif',
        fontSizePt: 6,
        fontWeight: "500",
        color: "#475569",
        align: "left",
        zIndex: 4
      },
      // Full Name
      {
        id: "f-name",
        type: "text",
        content: profile.fullName,
        fieldBinding: "fullName",
        xMm: 10,
        yMm: isHoriz ? 26 : 30,
        widthMm: isHoriz ? 48 : w - 20,
        heightMm: 8,
        fontFamily: '"Zen Kaku Gothic New", sans-serif',
        fontSizePt: 16,
        fontWeight: "700",
        color: "#0F172A",
        align: "left",
        letterSpacingMm: 0.4,
        zIndex: 5
      },
      {
        id: "f-name-en",
        type: "text",
        content: profile.fullNameEn || "",
        fieldBinding: "fullNameEn",
        xMm: 10,
        yMm: isHoriz ? 35 : 39,
        widthMm: isHoriz ? 48 : w - 20,
        heightMm: 3.5,
        fontFamily: "Montserrat, sans-serif",
        fontSizePt: 5.5,
        fontWeight: "400",
        color: "#64748B",
        align: "left",
        letterSpacingMm: 0.2,
        zIndex: 6
      },
      // Vertical separator line (only in horizontal)
      ...isHoriz ? [{
        id: "f-vline",
        type: "line",
        stroke: "#E2E8F0",
        strokeWidthMm: 0.3,
        xMm: 58,
        yMm: 12,
        widthMm: 0.3,
        heightMm: 34,
        zIndex: 7
      }] : [],
      // Contacts (Isolated Column in Horizontal)
      {
        id: "f-contacts",
        type: "text",
        content: `${profile.postalCode}
${profile.address}${profile.building ? " " + profile.building : ""}
TEL: ${profile.phone}
MOBILE: ${profile.mobile || ""}
EMAIL: ${profile.email}
${profile.website || ""}`,
        xMm: isHoriz ? 61 : 10,
        yMm: isHoriz ? 12 : 50,
        widthMm: isHoriz ? 24 : w - 20,
        heightMm: isHoriz ? 34 : 32,
        fontFamily: '"Noto Sans JP", sans-serif',
        fontSizePt: 4.8,
        fontWeight: "400",
        color: "#475569",
        align: "left",
        lineHeightRatio: 1.35,
        zIndex: 8
      }
    ];
    const backElements = [
      {
        id: "b-bg-shape",
        type: "shape",
        shapeType: "rectangle",
        xMm: 0,
        yMm: 0,
        widthMm: w,
        heightMm: 5,
        backgroundColor: "#0A2540",
        zIndex: 1
      },
      {
        id: "b-comp-en",
        type: "text",
        content: (profile.companyNameEn || profile.companyName).toUpperCase(),
        xMm: 10,
        yMm: (h - 16) / 2,
        widthMm: w - 20,
        heightMm: 6,
        fontFamily: "Montserrat, sans-serif",
        fontSizePt: 9,
        fontWeight: "700",
        color: "#0A2540",
        align: "center",
        letterSpacingMm: 0.4,
        zIndex: 2
      },
      {
        id: "b-sub",
        type: "text",
        content: "GLOBAL MANAGEMENT & STRATEGIC CONSULTING",
        xMm: 10,
        yMm: (h - 16) / 2 + 7,
        widthMm: w - 20,
        heightMm: 4,
        fontFamily: "Montserrat, sans-serif",
        fontSizePt: 4.5,
        fontWeight: "500",
        color: "#64748B",
        align: "center",
        letterSpacingMm: 0.25,
        zIndex: 3
      }
    ];
    return {
      front: { elements: frontElements, backgroundColor: "#FFFFFF" },
      back: { elements: backElements, backgroundColor: "#F8FAFC" }
    };
  }
};
export const fintechGeometricTemplate = {
  id: "fintech-geometric",
  name: "FinTech Geometric Modern",
  nameJp: "\u30D5\u30A3\u30F3\u30C6\u30C3\u30AF\u30FB\u30B8\u30AA\u30E1\u30C8\u30EA\u30C3\u30AF",
  category: "corporate",
  descriptionJp: "\u30B7\u30E3\u30FC\u30D7\u306A\u5E7E\u4F55\u5B66\u30E9\u30A4\u30F3\u3068\u4FE1\u983C\u306E\u30C6\u30A3\u30FC\u30EB\u30D6\u30EB\u30FC\u3002\u91D1\u878D\u30C6\u30AF\u30CE\u30ED\u30B8\u30FC\u3001\u6295\u8CC7\u30D5\u30A1\u30F3\u30C9\u3001\u6C7A\u6E08\u7CFB\u4F01\u696D\u306B\u3002",
  defaultOrientation: "horizontal",
  previewBadge: "\u5148\u7AEF\u91D1\u878D",
  generator: (profile, dim, orientation) => {
    const isHoriz = orientation === "horizontal";
    const w = isHoriz ? dim.widthMm : dim.heightMm;
    const h = isHoriz ? dim.heightMm : dim.widthMm;
    const frontElements = [
      // Top corner triangle/accent
      {
        id: "f-shape1",
        type: "shape",
        shapeType: "rectangle",
        xMm: w - 28,
        yMm: 0,
        widthMm: 28,
        heightMm: 3,
        backgroundColor: "#0D9488",
        zIndex: 1
      },
      {
        id: "f-comp",
        type: "text",
        content: profile.companyName,
        fieldBinding: "companyName",
        xMm: 8,
        yMm: 8,
        widthMm: w - 38,
        heightMm: 5,
        fontFamily: "Montserrat, sans-serif",
        fontSizePt: 8,
        fontWeight: "700",
        color: "#0F172A",
        align: "left",
        letterSpacingMm: 0.2,
        zIndex: 2
      },
      {
        id: "f-name",
        type: "text",
        content: profile.fullName,
        fieldBinding: "fullName",
        xMm: 8,
        yMm: isHoriz ? 18 : 22,
        widthMm: 50,
        heightMm: 7,
        fontFamily: '"Zen Kaku Gothic New", sans-serif',
        fontSizePt: 15,
        fontWeight: "700",
        color: "#0F172A",
        align: "left",
        letterSpacingMm: 0.35,
        zIndex: 3
      },
      {
        id: "f-title",
        type: "text",
        content: profile.jobTitle,
        fieldBinding: "jobTitle",
        xMm: 8,
        yMm: isHoriz ? 26 : 30,
        widthMm: 50,
        heightMm: 4,
        fontFamily: "Montserrat, sans-serif",
        fontSizePt: 6.5,
        fontWeight: "600",
        color: "#0D9488",
        align: "left",
        zIndex: 4
      },
      {
        id: "f-line",
        type: "line",
        stroke: "#CCFBF1",
        strokeWidthMm: 0.4,
        xMm: 8,
        yMm: isHoriz ? 32 : 38,
        widthMm: w - 16,
        heightMm: 0.4,
        zIndex: 5
      },
      {
        id: "f-contacts",
        type: "text",
        content: `TEL: ${profile.phone}  |  E: ${profile.email}
${profile.postalCode} ${profile.address}`,
        xMm: 8,
        yMm: isHoriz ? 36 : 46,
        widthMm: w - 16,
        heightMm: 9,
        fontFamily: '"Noto Sans JP", sans-serif',
        fontSizePt: 5,
        fontWeight: "400",
        color: "#475569",
        align: "left",
        lineHeightRatio: 1.35,
        zIndex: 6
      }
    ];
    const backElements = [
      {
        id: "b-qr",
        type: "qr",
        data: profile.website || "https://fintech.sample",
        qrType: "url",
        xMm: (w - 18) / 2,
        yMm: (h - 26) / 2,
        widthMm: 18,
        heightMm: 18,
        foregroundColor: "#0F172A",
        backgroundColor: "#FFFFFF",
        zIndex: 1
      },
      {
        id: "b-label",
        type: "text",
        content: "DIGITAL WEALTH & ASSETS",
        xMm: 4,
        yMm: (h - 26) / 2 + 21,
        widthMm: w - 8,
        heightMm: 4,
        fontFamily: "Montserrat, sans-serif",
        fontSizePt: 5,
        fontWeight: "600",
        color: "#0D9488",
        align: "center",
        letterSpacingMm: 0.3,
        zIndex: 2
      }
    ];
    return {
      front: { elements: frontElements, backgroundColor: "#FFFFFF" },
      back: { elements: backElements, backgroundColor: "#F0FDFA" }
    };
  }
};
export const legalConsultingTemplate = {
  id: "legal-consulting",
  name: "Legal & Advisory Pillar",
  nameJp: "\u53B3\u683C\u30FB\u58EB\u696D\u30EA\u30FC\u30AC\u30EB\u30A2\u30C9\u30D0\u30A4\u30B6\u30EA\u30FC",
  category: "corporate",
  descriptionJp: "\u6C17\u54C1\u3042\u308B\u660E\u671D\u4F53\u3068\u683C\u5F0F\u9AD8\u3044\u5DE6\u53F3\u5747\u7B49\u30EC\u30A4\u30A2\u30A6\u30C8\u3002\u5F01\u8B77\u58EB\u3001\u516C\u8A8D\u4F1A\u8A08\u58EB\u3001\u7A0E\u7406\u58EB\u3001\u53F8\u6CD5\u66F8\u58EB\u306B\u6700\u9069\u3002",
  defaultOrientation: "horizontal",
  previewBadge: "\u58EB\u696D\u30FB\u6CD5\u52D9",
  generator: (profile, dim, orientation) => {
    const isHoriz = orientation === "horizontal";
    const w = isHoriz ? dim.widthMm : dim.heightMm;
    const h = isHoriz ? dim.heightMm : dim.widthMm;
    const frontElements = [
      // Outer border frame
      {
        id: "f-frame",
        type: "shape",
        shapeType: "rectangle",
        xMm: 4.5,
        yMm: 4.5,
        widthMm: w - 9,
        heightMm: h - 9,
        backgroundColor: "transparent",
        stroke: "#B45309",
        strokeWidthMm: 0.25,
        zIndex: 1
      },
      {
        id: "f-comp",
        type: "text",
        content: profile.companyName,
        fieldBinding: "companyName",
        xMm: 8,
        yMm: 8,
        widthMm: w - 16,
        heightMm: 5,
        fontFamily: '"Shippori Mincho", "Noto Serif JP", serif',
        fontSizePt: 8.5,
        fontWeight: "700",
        color: "#1E293B",
        align: "center",
        letterSpacingMm: 0.3,
        zIndex: 2
      },
      {
        id: "f-title",
        type: "text",
        content: profile.jobTitle || "\u5F01\u8B77\u58EB / Legal Counsel",
        fieldBinding: "jobTitle",
        xMm: 8,
        yMm: isHoriz ? 17 : 20,
        widthMm: w - 16,
        heightMm: 4,
        fontFamily: '"Shippori Mincho", serif',
        fontSizePt: 6,
        fontWeight: "500",
        color: "#B45309",
        align: "center",
        zIndex: 3
      },
      {
        id: "f-name",
        type: "text",
        content: profile.fullName,
        fieldBinding: "fullName",
        xMm: 8,
        yMm: isHoriz ? 22 : 26,
        widthMm: w - 16,
        heightMm: 8,
        fontFamily: '"Shippori Mincho", serif',
        fontSizePt: 16,
        fontWeight: "700",
        color: "#0F172A",
        align: "center",
        letterSpacingMm: 0.5,
        zIndex: 4
      },
      {
        id: "f-line",
        type: "line",
        stroke: "#E2E8F0",
        strokeWidthMm: 0.25,
        xMm: (w - 40) / 2,
        yMm: isHoriz ? 32 : 38,
        widthMm: 40,
        heightMm: 0.25,
        zIndex: 5
      },
      {
        id: "f-contacts",
        type: "text",
        content: `${profile.postalCode} ${profile.address}
TEL: ${profile.phone}  |  FAX: ${profile.fax || profile.phone}
${profile.email}`,
        xMm: 8,
        yMm: isHoriz ? 35 : 46,
        widthMm: w - 16,
        heightMm: 11,
        fontFamily: '"Noto Serif JP", serif',
        fontSizePt: 4.8,
        fontWeight: "400",
        color: "#475569",
        align: "center",
        lineHeightRatio: 1.35,
        zIndex: 6
      }
    ];
    const backElements = [
      {
        id: "b-title-en",
        type: "text",
        content: profile.companyNameEn || profile.companyName,
        xMm: 8,
        yMm: (h - 14) / 2,
        widthMm: w - 16,
        heightMm: 6,
        fontFamily: '"Cinzel", serif',
        fontSizePt: 8,
        fontWeight: "700",
        color: "#0F172A",
        align: "center",
        letterSpacingMm: 0.35,
        zIndex: 1
      },
      {
        id: "b-sub",
        type: "text",
        content: "ATTORNEYS AT LAW & COUNSELORS",
        xMm: 8,
        yMm: (h - 14) / 2 + 7,
        widthMm: w - 16,
        heightMm: 4,
        fontFamily: "Montserrat, serif",
        fontSizePt: 5,
        fontWeight: "500",
        color: "#B45309",
        align: "center",
        letterSpacingMm: 0.3,
        zIndex: 2
      }
    ];
    return {
      front: { elements: frontElements, backgroundColor: "#FFFEFA" },
      back: { elements: backElements, backgroundColor: "#FFFEFA" }
    };
  }
};
export const medicalClinicTemplate = {
  id: "medical-clinic",
  name: "Medical & Wellness Clinic",
  nameJp: "\u30E1\u30C7\u30A3\u30AB\u30EB\u30FB\u30D8\u30EB\u30B9\u30B1\u30A2\u6E05\u6F54",
  category: "corporate",
  descriptionJp: "\u6E05\u6F54\u611F\u3042\u3075\u308C\u308B\u30DF\u30F3\u30C8\u30B0\u30EA\u30FC\u30F3\u3068\u5B89\u5FC3\u611F\u306E\u3042\u308B\u30EC\u30A4\u30A2\u30A6\u30C8\u3002\u533B\u5E2B\u3001\u6B6F\u79D1\u533B\u3001\u30AF\u30EA\u30CB\u30C3\u30AF\u9662\u9577\u5411\u3051\u3002",
  defaultOrientation: "horizontal",
  previewBadge: "\u533B\u7642\u30FB\u885B\u751F",
  generator: (profile, dim, orientation) => {
    const isHoriz = orientation === "horizontal";
    const w = isHoriz ? dim.widthMm : dim.heightMm;
    const h = isHoriz ? dim.heightMm : dim.widthMm;
    const frontElements = [
      // Clean clinic cross/bar
      {
        id: "f-top-bar",
        type: "shape",
        shapeType: "rectangle",
        xMm: 0,
        yMm: 0,
        widthMm: w,
        heightMm: 4,
        backgroundColor: "#059669",
        zIndex: 1
      },
      {
        id: "f-comp",
        type: "text",
        content: profile.companyName || "CLINICAL HEALTH GROUP",
        fieldBinding: "companyName",
        xMm: 8,
        yMm: 8,
        widthMm: w - 16,
        heightMm: 5,
        fontFamily: '"Zen Kaku Gothic New", sans-serif',
        fontSizePt: 8,
        fontWeight: "700",
        color: "#065F46",
        align: "left",
        letterSpacingMm: 0.15,
        zIndex: 2
      },
      {
        id: "f-title",
        type: "text",
        content: profile.jobTitle || "\u9662\u9577 / \u533B\u5B66\u535A\u58EB (Director, M.D.)",
        fieldBinding: "jobTitle",
        xMm: 8,
        yMm: isHoriz ? 17 : 20,
        widthMm: w - 16,
        heightMm: 4,
        fontFamily: '"Noto Sans JP", sans-serif',
        fontSizePt: 6,
        fontWeight: "500",
        color: "#6B7280",
        align: "left",
        zIndex: 3
      },
      {
        id: "f-name",
        type: "text",
        content: profile.fullName,
        fieldBinding: "fullName",
        xMm: 8,
        yMm: isHoriz ? 22 : 25,
        widthMm: 55,
        heightMm: 7,
        fontFamily: '"Zen Kaku Gothic New", sans-serif',
        fontSizePt: 15,
        fontWeight: "700",
        color: "#111827",
        align: "left",
        letterSpacingMm: 0.35,
        zIndex: 4
      },
      {
        id: "f-contacts",
        type: "text",
        content: `${profile.postalCode} ${profile.address}
TEL: ${profile.phone}  |  WEB: ${profile.website || "https://clinic.health.jp"}`,
        xMm: 8,
        yMm: isHoriz ? 36 : 56,
        widthMm: w - 16,
        heightMm: 9,
        fontFamily: '"Noto Sans JP", sans-serif',
        fontSizePt: 5,
        fontWeight: "400",
        color: "#374151",
        align: "left",
        lineHeightRatio: 1.35,
        zIndex: 5
      }
    ];
    const backElements = [
      {
        id: "b-qr",
        type: "qr",
        data: profile.website || "https://clinic.health.jp/reserve",
        qrType: "url",
        xMm: (w - 18) / 2,
        yMm: (h - 26) / 2,
        widthMm: 18,
        heightMm: 18,
        foregroundColor: "#065F46",
        backgroundColor: "#FFFFFF",
        zIndex: 1
      },
      {
        id: "b-label",
        type: "text",
        content: "\u30AA\u30F3\u30E9\u30A4\u30F3\u8A3A\u7642\u30FB\u521D\u8A3A\u4E88\u7D04\u53D7\u4ED8",
        xMm: 4,
        yMm: (h - 26) / 2 + 21,
        widthMm: w - 8,
        heightMm: 4,
        fontFamily: '"Noto Sans JP", sans-serif',
        fontSizePt: 5,
        fontWeight: "600",
        color: "#059669",
        align: "center",
        zIndex: 2
      }
    ];
    return {
      front: { elements: frontElements, backgroundColor: "#FFFFFF" },
      back: { elements: backElements, backgroundColor: "#ECFDF5" }
    };
  }
};
