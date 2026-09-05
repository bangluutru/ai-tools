export const bilingualSplitTemplate = {
  id: "bilingual-split",
  name: "Bilingual Symmetrical Split",
  nameJp: "\u65E5\u82F1\u30D0\u30A4\u30EA\u30F3\u30AC\u30EB\u30FB\u5BFE\u79F0\u5206\u5272",
  category: "bilingual",
  descriptionJp: "\u8868\u9762\u306F\u65E5\u672C\u8A9E\uFF08\u307E\u305F\u306F\u30D9\u30C8\u30CA\u30E0\u8A9E\uFF09\u3001\u88CF\u9762\u306F\u56FD\u969B\u30D3\u30B8\u30CD\u30B9\u82F1\u8A9E\u306E\u5B8C\u5168\u5BFE\u8A33\u30EC\u30A4\u30A2\u30A6\u30C8\u3002",
  defaultOrientation: "horizontal",
  previewBadge: "\u65E5\u82F1\u5BFE\u8A33",
  generator: (profile, dim, orientation) => {
    const isHoriz = orientation === "horizontal";
    const w = isHoriz ? dim.widthMm : dim.heightMm;
    const frontElements = [
      {
        id: "f-comp",
        type: "text",
        content: profile.companyName,
        fieldBinding: "companyName",
        xMm: 10,
        yMm: isHoriz ? 10 : 12,
        widthMm: w - 20,
        heightMm: 5,
        fontFamily: '"Zen Kaku Gothic New", sans-serif',
        fontSizePt: 8.5,
        fontWeight: "700",
        color: "#1E293B",
        align: "left",
        letterSpacingMm: 0.2,
        zIndex: 1
      },
      {
        id: "f-name",
        type: "text",
        content: profile.fullName,
        fieldBinding: "fullName",
        xMm: 10,
        yMm: isHoriz ? 18 : 22,
        widthMm: 50,
        heightMm: 8,
        fontFamily: '"Zen Kaku Gothic New", sans-serif',
        fontSizePt: 16,
        fontWeight: "700",
        color: "#0F172A",
        align: "left",
        letterSpacingMm: 0.35,
        zIndex: 2
      },
      {
        id: "f-title",
        type: "text",
        content: `${profile.department ? profile.department + "\u3000" : ""}${profile.jobTitle}`,
        fieldBinding: "jobTitle",
        xMm: 10,
        yMm: isHoriz ? 28 : 32,
        widthMm: 50,
        heightMm: 4,
        fontFamily: '"Noto Sans JP", sans-serif',
        fontSizePt: 6.5,
        fontWeight: "500",
        color: "#475569",
        align: "left",
        zIndex: 3
      },
      {
        id: "f-line",
        type: "line",
        stroke: "#E2E8F0",
        strokeWidthMm: 0.3,
        xMm: 10,
        yMm: isHoriz ? 34 : 40,
        widthMm: w - 20,
        heightMm: 0.3,
        zIndex: 4
      },
      {
        id: "f-contacts",
        type: "text",
        content: `${profile.postalCode} ${profile.address}
TEL: ${profile.phone}  |  EMAIL: ${profile.email}`,
        xMm: 10,
        yMm: isHoriz ? 37 : 46,
        widthMm: w - 20,
        heightMm: 9,
        fontFamily: '"Noto Sans JP", sans-serif',
        fontSizePt: 5,
        fontWeight: "400",
        color: "#475569",
        align: "left",
        lineHeightRatio: 1.35,
        zIndex: 5
      }
    ];
    const backElements = [
      {
        id: "b-comp-en",
        type: "text",
        content: profile.companyNameEn || profile.companyName,
        xMm: 10,
        yMm: isHoriz ? 10 : 12,
        widthMm: w - 20,
        heightMm: 5,
        fontFamily: "Montserrat, sans-serif",
        fontSizePt: 8,
        fontWeight: "700",
        color: "#1E293B",
        align: "left",
        letterSpacingMm: 0.3,
        zIndex: 1
      },
      {
        id: "b-name-en",
        type: "text",
        content: profile.fullNameEn || profile.fullName,
        xMm: 10,
        yMm: isHoriz ? 18 : 22,
        widthMm: 50,
        heightMm: 8,
        fontFamily: "Montserrat, sans-serif",
        fontSizePt: 14,
        fontWeight: "600",
        color: "#0F172A",
        align: "left",
        letterSpacingMm: 0.4,
        zIndex: 2
      },
      {
        id: "b-title-en",
        type: "text",
        content: `${profile.departmentEn ? profile.departmentEn + " / " : ""}${profile.jobTitleEn || profile.jobTitle}`,
        xMm: 10,
        yMm: isHoriz ? 28 : 32,
        widthMm: 50,
        heightMm: 4,
        fontFamily: "Montserrat, sans-serif",
        fontSizePt: 6,
        fontWeight: "500",
        color: "#475569",
        align: "left",
        zIndex: 3
      },
      {
        id: "b-line",
        type: "line",
        stroke: "#E2E8F0",
        strokeWidthMm: 0.3,
        xMm: 10,
        yMm: isHoriz ? 34 : 40,
        widthMm: w - 20,
        heightMm: 0.3,
        zIndex: 4
      },
      {
        id: "b-contacts-en",
        type: "text",
        content: `${profile.addressEn || profile.address}
TEL: ${profile.phone}  |  EMAIL: ${profile.email}
WEB: ${profile.website || ""}`,
        xMm: 10,
        yMm: isHoriz ? 37 : 46,
        widthMm: w - 20,
        heightMm: 11,
        fontFamily: "Montserrat, sans-serif",
        fontSizePt: 4.8,
        fontWeight: "400",
        color: "#475569",
        align: "left",
        lineHeightRatio: 1.35,
        zIndex: 5
      }
    ];
    return {
      front: { elements: frontElements, backgroundColor: "#FFFFFF" },
      back: { elements: backElements, backgroundColor: "#F8FAFC" }
    };
  }
};
export const globalDiplomatTemplate = {
  id: "global-diplomat",
  name: "Global Diplomat Official",
  nameJp: "\u30B0\u30ED\u30FC\u30D0\u30EB\u30FB\u30C7\u30A3\u30D7\u30ED\u30DE\u30C3\u30C8",
  category: "bilingual",
  descriptionJp: "\u5927\u4F7F\u9928\u3084\u56FD\u969B\u6A5F\u95A2\u306B\u76F8\u5FDC\u3057\u3044\u683C\u8ABF\u9AD8\u3044\u30D7\u30ED\u30DD\u30FC\u30B7\u30E7\u30F3\u3002\u4E16\u754C\u3092\u821E\u53F0\u306B\u6D3B\u8E8D\u3059\u308B\u30A8\u30B0\u30BC\u30AF\u30C6\u30A3\u30D6\u3078\u3002",
  defaultOrientation: "horizontal",
  previewBadge: "\u5916\u4EA4\u30FB\u56FD\u969B",
  generator: (profile, dim, orientation) => {
    const isHoriz = orientation === "horizontal";
    const w = isHoriz ? dim.widthMm : dim.heightMm;
    const h = isHoriz ? dim.heightMm : dim.widthMm;
    const frontElements = [
      // Regal double frame
      {
        id: "f-outer-frame",
        type: "shape",
        shapeType: "rectangle",
        xMm: 4.5,
        yMm: 4.5,
        widthMm: w - 9,
        heightMm: h - 9,
        backgroundColor: "transparent",
        stroke: "#1E3A8A",
        strokeWidthMm: 0.3,
        zIndex: 1
      },
      {
        id: "f-comp",
        type: "text",
        content: (profile.companyNameEn || profile.companyName).toUpperCase(),
        fieldBinding: "companyName",
        xMm: 8,
        yMm: 9,
        widthMm: w - 16,
        heightMm: 5,
        fontFamily: '"Cinzel", serif',
        fontSizePt: 7.5,
        fontWeight: "700",
        color: "#1E3A8A",
        align: "center",
        letterSpacingMm: 0.4,
        zIndex: 2
      },
      {
        id: "f-name",
        type: "text",
        content: profile.fullNameEn || profile.fullName,
        fieldBinding: "fullName",
        xMm: 8,
        yMm: isHoriz ? 18 : 24,
        widthMm: w - 16,
        heightMm: 8,
        fontFamily: '"Cinzel", "Shippori Mincho", serif',
        fontSizePt: 14,
        fontWeight: "700",
        color: "#0F172A",
        align: "center",
        letterSpacingMm: 0.5,
        zIndex: 3
      },
      {
        id: "f-title",
        type: "text",
        content: (profile.jobTitleEn || profile.jobTitle).toUpperCase(),
        fieldBinding: "jobTitle",
        xMm: 8,
        yMm: isHoriz ? 27 : 33,
        widthMm: w - 16,
        heightMm: 4,
        fontFamily: "Montserrat, serif",
        fontSizePt: 5.5,
        fontWeight: "500",
        color: "#64748B",
        align: "center",
        letterSpacingMm: 0.3,
        zIndex: 4
      },
      {
        id: "f-contacts",
        type: "text",
        content: `TEL: ${profile.phone}  \u2022  FAX: ${profile.fax || profile.phone}
${profile.email}  \u2022  ${profile.website || ""}`,
        xMm: 8,
        yMm: isHoriz ? 36 : 50,
        widthMm: w - 16,
        heightMm: 9,
        fontFamily: "Montserrat, serif",
        fontSizePt: 4.8,
        fontWeight: "400",
        color: "#334155",
        align: "center",
        lineHeightRatio: 1.35,
        zIndex: 5
      }
    ];
    const backElements = [
      {
        id: "b-outer-frame",
        type: "shape",
        shapeType: "rectangle",
        xMm: 4.5,
        yMm: 4.5,
        widthMm: w - 9,
        heightMm: h - 9,
        backgroundColor: "transparent",
        stroke: "#1E3A8A",
        strokeWidthMm: 0.3,
        zIndex: 1
      },
      {
        id: "b-center-text",
        type: "text",
        content: profile.companyName,
        xMm: 8,
        yMm: (h - 8) / 2,
        widthMm: w - 16,
        heightMm: 8,
        fontFamily: '"Shippori Mincho", serif',
        fontSizePt: 10,
        fontWeight: "700",
        color: "#1E3A8A",
        align: "center",
        letterSpacingMm: 0.5,
        zIndex: 2
      }
    ];
    return {
      front: { elements: frontElements, backgroundColor: "#FFFFFF" },
      back: { elements: backElements, backgroundColor: "#FFFFFF" }
    };
  }
};
export const crossborderCommerceTemplate = {
  id: "crossborder-commerce",
  name: "Cross-Border Trade & Logistics",
  nameJp: "\u30AF\u30ED\u30B9\u30DC\u30FC\u30C0\u30FC\u30FB\u8CBF\u6613\u5546\u793E",
  category: "bilingual",
  descriptionJp: "\u6D77\u5916\u62E0\u70B9\u3084\u591A\u8A00\u8A9E\u9023\u7D61\u5148\u3092\u30B9\u30DE\u30FC\u30C8\u306B\u6574\u7406\u3002\u8F38\u51FA\u5165\u30D3\u30B8\u30CD\u30B9\u3001\u30B0\u30ED\u30FC\u30D0\u30EB\u30B5\u30D7\u30E9\u30A4\u30C1\u30A7\u30FC\u30F3\u5411\u3051\u3002",
  defaultOrientation: "horizontal",
  previewBadge: "\u8CBF\u6613\u30FB\u5546\u793E",
  generator: (profile, dim, orientation) => {
    const isHoriz = orientation === "horizontal";
    const w = isHoriz ? dim.widthMm : dim.heightMm;
    const h = isHoriz ? dim.heightMm : dim.widthMm;
    const frontElements = [
      // Top header band
      {
        id: "f-band",
        type: "shape",
        shapeType: "rectangle",
        xMm: 0,
        yMm: 0,
        widthMm: w,
        heightMm: 4,
        backgroundColor: "#1E40AF",
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
        fontFamily: '"Zen Kaku Gothic New", sans-serif',
        fontSizePt: 8.5,
        fontWeight: "700",
        color: "#1E40AF",
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
        yMm: isHoriz ? 17 : 20,
        widthMm: 50,
        heightMm: 8,
        fontFamily: '"Zen Kaku Gothic New", sans-serif',
        fontSizePt: 15,
        fontWeight: "700",
        color: "#0F172A",
        align: "left",
        letterSpacingMm: 0.3,
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
        fontSizePt: 6,
        fontWeight: "500",
        color: "#64748B",
        align: "left",
        zIndex: 4
      },
      {
        id: "f-contacts",
        type: "text",
        content: `[TOKYO HQ]  ${profile.phone}  |  ${profile.email}
[GLOBAL]    ${profile.website || "https://global-trade.corp"}`,
        xMm: 8,
        yMm: isHoriz ? 36 : 48,
        widthMm: w - 16,
        heightMm: 9,
        fontFamily: "Montserrat, sans-serif",
        fontSizePt: 5,
        fontWeight: "400",
        color: "#334155",
        align: "left",
        lineHeightRatio: 1.35,
        zIndex: 5
      }
    ];
    const backElements = [
      {
        id: "b-qr",
        type: "qr",
        data: profile.website || "https://global-trade.corp/catalog",
        qrType: "url",
        xMm: (w - 18) / 2,
        yMm: (h - 26) / 2,
        widthMm: 18,
        heightMm: 18,
        foregroundColor: "#1E40AF",
        backgroundColor: "#FFFFFF",
        zIndex: 1
      },
      {
        id: "b-label",
        type: "text",
        content: "GLOBAL SUPPLY CHAIN PORTAL",
        xMm: 4,
        yMm: (h - 26) / 2 + 21,
        widthMm: w - 8,
        heightMm: 4,
        fontFamily: "Montserrat, sans-serif",
        fontSizePt: 5,
        fontWeight: "600",
        color: "#1E40AF",
        align: "center",
        letterSpacingMm: 0.3,
        zIndex: 2
      }
    ];
    return {
      front: { elements: frontElements, backgroundColor: "#FFFFFF" },
      back: { elements: backElements, backgroundColor: "#EFF6FF" }
    };
  }
};
export const consultantDualQrTemplate = {
  id: "consultant-dual-qr",
  name: "Dual-Action Smart Consultant",
  nameJp: "\u30B3\u30F3\u30B5\u30EB\u30BF\u30F3\u30C8\u30FB\u30C7\u30E5\u30A2\u30EBQR",
  category: "bilingual",
  descriptionJp: "\u88CF\u9762\u306B2\u3064\u306E\u72EC\u7ACBQR\u30B3\u30FC\u30C9\u3092\u914D\u7F6E\u3002\u540D\u523A\u767B\u9332\u7528vCard\u3068\u30B3\u30FC\u30DD\u30EC\u30FC\u30C8\u30B5\u30A4\u30C8\u3092\u540C\u6642\u306B\u6848\u5185\u3002",
  defaultOrientation: "horizontal",
  previewBadge: "2\u9023QR",
  generator: (profile, dim, orientation) => {
    const isHoriz = orientation === "horizontal";
    const w = isHoriz ? dim.widthMm : dim.heightMm;
    const frontElements = [
      {
        id: "f-comp",
        type: "text",
        content: profile.companyName,
        fieldBinding: "companyName",
        xMm: 10,
        yMm: isHoriz ? 10 : 12,
        widthMm: w - 20,
        heightMm: 5,
        fontFamily: "Montserrat, sans-serif",
        fontSizePt: 8,
        fontWeight: "700",
        color: "#0F172A",
        align: "left",
        letterSpacingMm: 0.2,
        zIndex: 1
      },
      {
        id: "f-name",
        type: "text",
        content: profile.fullName,
        fieldBinding: "fullName",
        xMm: 10,
        yMm: isHoriz ? 18 : 22,
        widthMm: 50,
        heightMm: 8,
        fontFamily: '"Zen Kaku Gothic New", sans-serif',
        fontSizePt: 16,
        fontWeight: "700",
        color: "#0F172A",
        align: "left",
        letterSpacingMm: 0.35,
        zIndex: 2
      },
      {
        id: "f-title",
        type: "text",
        content: profile.jobTitle,
        fieldBinding: "jobTitle",
        xMm: 10,
        yMm: isHoriz ? 28 : 32,
        widthMm: 50,
        heightMm: 4,
        fontFamily: "Montserrat, sans-serif",
        fontSizePt: 6.5,
        fontWeight: "500",
        color: "#4F46E5",
        align: "left",
        zIndex: 3
      },
      {
        id: "f-contacts",
        type: "text",
        content: `TEL: ${profile.phone}  |  EMAIL: ${profile.email}
${profile.address || ""}`,
        xMm: 10,
        yMm: isHoriz ? 36 : 48,
        widthMm: w - 20,
        heightMm: 9,
        fontFamily: "Montserrat, sans-serif",
        fontSizePt: 5,
        fontWeight: "400",
        color: "#475569",
        align: "left",
        lineHeightRatio: 1.35,
        zIndex: 4
      }
    ];
    const backElements = [
      // QR 1: vCard Phonebook Save
      {
        id: "b-qr1",
        type: "qr",
        data: `BEGIN:VCARD
VERSION:3.0
FN:${profile.fullName}
ORG:${profile.companyName}
TITLE:${profile.jobTitle}
TEL:${profile.phone}
EMAIL:${profile.email}
END:VCARD`,
        qrType: "vcard",
        xMm: isHoriz ? 18 : 10,
        yMm: isHoriz ? 12 : 20,
        widthMm: 18,
        heightMm: 18,
        foregroundColor: "#0F172A",
        backgroundColor: "#FFFFFF",
        zIndex: 1
      },
      {
        id: "b-label1",
        type: "text",
        content: "SAVE vCARD",
        xMm: isHoriz ? 12 : 6,
        yMm: isHoriz ? 32 : 40,
        widthMm: isHoriz ? 30 : 26,
        heightMm: 4,
        fontFamily: "Montserrat, sans-serif",
        fontSizePt: 5,
        fontWeight: "700",
        color: "#4F46E5",
        align: "center",
        zIndex: 2
      },
      // QR 2: Company / Portfolio Web
      {
        id: "b-qr2",
        type: "qr",
        data: profile.website || "https://consultant.sample",
        qrType: "url",
        xMm: isHoriz ? 55 : w - 28,
        yMm: isHoriz ? 12 : 20,
        widthMm: 18,
        heightMm: 18,
        foregroundColor: "#0F172A",
        backgroundColor: "#FFFFFF",
        zIndex: 3
      },
      {
        id: "b-label2",
        type: "text",
        content: "VISIT WEBSITE",
        xMm: isHoriz ? 49 : w - 32,
        yMm: isHoriz ? 32 : 40,
        widthMm: isHoriz ? 30 : 26,
        heightMm: 4,
        fontFamily: "Montserrat, sans-serif",
        fontSizePt: 5,
        fontWeight: "700",
        color: "#4F46E5",
        align: "center",
        zIndex: 4
      }
    ];
    return {
      front: { elements: frontElements, backgroundColor: "#FFFFFF" },
      back: { elements: backElements, backgroundColor: "#F8FAFC" }
    };
  }
};
