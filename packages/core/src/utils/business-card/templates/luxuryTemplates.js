export const executiveLuxuryTemplate = {
  id: "executive-luxury",
  name: "Executive Midnight & Gold",
  nameJp: "\u9AD8\u7D1A\u30FB\u6F06\u9ED2\xD7\u30B4\u30FC\u30EB\u30C9",
  category: "luxury",
  descriptionJp: "\u6F06\u9ED2\u306E\u80CC\u666F\u306B\u6620\u3048\u308B\u4E0A\u54C1\u306A\u30B4\u30FC\u30EB\u30C9\u30A2\u30AF\u30BB\u30F3\u30C8\u3002\u5916\u8CC7\u7CFB\u3001\u30DB\u30C6\u30EB\u3001\u9AD8\u7D1A\u30D6\u30E9\u30F3\u30C9\u3001\u5F79\u54E1\u5C02\u7528\u3002",
  defaultOrientation: "horizontal",
  previewBadge: "\u30D7\u30EC\u30DF\u30A2\u30E0",
  generator: (profile, dim, orientation) => {
    const isHoriz = orientation === "horizontal";
    const w = isHoriz ? dim.widthMm : dim.heightMm;
    const h = isHoriz ? dim.heightMm : dim.widthMm;
    const frontElements = [
      // Champagne gold border
      {
        id: "f-border",
        type: "shape",
        shapeType: "rectangle",
        xMm: 4,
        yMm: 4,
        widthMm: w - 8,
        heightMm: h - 8,
        backgroundColor: "transparent",
        stroke: "#C6A875",
        strokeWidthMm: 0.35,
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
        fontFamily: '"Cinzel", "Shippori Mincho", serif',
        fontSizePt: 8,
        fontWeight: "700",
        color: "#E6CA97",
        align: "center",
        letterSpacingMm: 0.5,
        zIndex: 2
      },
      {
        id: "f-name",
        type: "text",
        content: profile.fullName,
        fieldBinding: "fullName",
        xMm: 8,
        yMm: isHoriz ? 18 : 24,
        widthMm: w - 16,
        heightMm: 8,
        fontFamily: '"Shippori Mincho", "Cinzel", serif',
        fontSizePt: 16,
        fontWeight: "700",
        color: "#FFFFFF",
        align: "center",
        letterSpacingMm: 0.6,
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
        fontFamily: '"Cinzel", serif',
        fontSizePt: 5.5,
        fontWeight: "600",
        color: "#C6A875",
        align: "center",
        letterSpacingMm: 0.4,
        zIndex: 4
      },
      {
        id: "f-line",
        type: "line",
        stroke: "#8D7B58",
        strokeWidthMm: 0.25,
        xMm: (w - 30) / 2,
        yMm: isHoriz ? 33 : 40,
        widthMm: 30,
        heightMm: 0.25,
        zIndex: 5
      },
      {
        id: "f-contacts",
        type: "text",
        content: `T. ${profile.phone}   \u2022   E. ${profile.email}
${profile.address || ""}`,
        xMm: 8,
        yMm: isHoriz ? 36 : 48,
        widthMm: w - 16,
        heightMm: 9,
        fontFamily: "Montserrat, serif",
        fontSizePt: 5,
        fontWeight: "400",
        color: "#B0A89C",
        align: "center",
        lineHeightRatio: 1.35,
        zIndex: 6
      }
    ];
    const backElements = [
      {
        id: "b-border",
        type: "shape",
        shapeType: "rectangle",
        xMm: 4,
        yMm: 4,
        widthMm: w - 8,
        heightMm: h - 8,
        backgroundColor: "transparent",
        stroke: "#C6A875",
        strokeWidthMm: 0.35,
        zIndex: 1
      },
      {
        id: "b-comp-en",
        type: "text",
        content: (profile.companyNameEn || profile.companyName).toUpperCase(),
        xMm: 8,
        yMm: (h - 16) / 2,
        widthMm: w - 16,
        heightMm: 6,
        fontFamily: '"Cinzel", serif',
        fontSizePt: 9,
        fontWeight: "700",
        color: "#E6CA97",
        align: "center",
        letterSpacingMm: 0.6,
        zIndex: 2
      },
      {
        id: "b-web",
        type: "text",
        content: (profile.website || "WWW.EXECUTIVE-LUXURY.COM").toUpperCase(),
        xMm: 8,
        yMm: (h - 16) / 2 + 8,
        widthMm: w - 16,
        heightMm: 4,
        fontFamily: '"Cinzel", serif',
        fontSizePt: 5,
        fontWeight: "500",
        color: "#8D7B58",
        align: "center",
        letterSpacingMm: 0.4,
        zIndex: 3
      }
    ];
    return {
      front: { elements: frontElements, backgroundColor: "#111317" },
      back: { elements: backElements, backgroundColor: "#111317" }
    };
  }
};
export const emeraldGoldTemplate = {
  id: "emerald-gold",
  name: "Emerald Prestige & Brass",
  nameJp: "\u30A8\u30E1\u30E9\u30EB\u30C9\u30FB\u30D7\u30EC\u30B9\u30C6\u30FC\u30B8",
  category: "luxury",
  descriptionJp: "\u6DF1\u307F\u3042\u308B\u30A8\u30E1\u30E9\u30EB\u30C9\u30B0\u30EA\u30FC\u30F3\u3068\u771F\u936E\u8272\u30B4\u30FC\u30EB\u30C9\u3002\u9AD8\u7D1A\u5B9D\u98FE\u3001\u30D7\u30EC\u30B9\u30C6\u30FC\u30B8\u4E0D\u52D5\u7523\u3001\u30EA\u30BE\u30FC\u30C8\u5411\u3051\u3002",
  defaultOrientation: "horizontal",
  previewBadge: "\u6700\u9AD8\u7D1A",
  generator: (profile, dim, orientation) => {
    const isHoriz = orientation === "horizontal";
    const w = isHoriz ? dim.widthMm : dim.heightMm;
    const h = isHoriz ? dim.heightMm : dim.widthMm;
    const frontElements = [
      // Brass fillet frame
      {
        id: "f-frame",
        type: "shape",
        shapeType: "rectangle",
        xMm: 4.5,
        yMm: 4.5,
        widthMm: w - 9,
        heightMm: h - 9,
        backgroundColor: "transparent",
        stroke: "#D4AF37",
        strokeWidthMm: 0.3,
        zIndex: 1
      },
      {
        id: "f-comp",
        type: "text",
        content: (profile.companyNameEn || profile.companyName).toUpperCase(),
        fieldBinding: "companyName",
        xMm: 8,
        yMm: 10,
        widthMm: w - 16,
        heightMm: 5,
        fontFamily: '"Cinzel", serif',
        fontSizePt: 7.5,
        fontWeight: "700",
        color: "#F4D068",
        align: "center",
        letterSpacingMm: 0.4,
        zIndex: 2
      },
      {
        id: "f-name",
        type: "text",
        content: profile.fullName,
        fieldBinding: "fullName",
        xMm: 8,
        yMm: isHoriz ? 18 : 24,
        widthMm: w - 16,
        heightMm: 8,
        fontFamily: '"Shippori Mincho", "Cinzel", serif',
        fontSizePt: 15,
        fontWeight: "700",
        color: "#FFFFFF",
        align: "center",
        letterSpacingMm: 0.5,
        zIndex: 3
      },
      {
        id: "f-title",
        type: "text",
        content: profile.jobTitle,
        fieldBinding: "jobTitle",
        xMm: 8,
        yMm: isHoriz ? 27 : 33,
        widthMm: w - 16,
        heightMm: 4,
        fontFamily: '"Cinzel", serif',
        fontSizePt: 5.5,
        fontWeight: "500",
        color: "#D4AF37",
        align: "center",
        zIndex: 4
      },
      {
        id: "f-contacts",
        type: "text",
        content: `TEL: ${profile.phone}  |  ${profile.email}
${profile.address || ""}`,
        xMm: 8,
        yMm: isHoriz ? 36 : 50,
        widthMm: w - 16,
        heightMm: 9,
        fontFamily: "Montserrat, serif",
        fontSizePt: 5,
        fontWeight: "400",
        color: "#A7C4BC",
        align: "center",
        lineHeightRatio: 1.35,
        zIndex: 5
      }
    ];
    const backElements = [
      {
        id: "b-center-comp",
        type: "text",
        content: (profile.companyNameEn || profile.companyName).toUpperCase(),
        xMm: 8,
        yMm: (h - 10) / 2,
        widthMm: w - 16,
        heightMm: 6,
        fontFamily: '"Cinzel", serif',
        fontSizePt: 9,
        fontWeight: "700",
        color: "#F4D068",
        align: "center",
        letterSpacingMm: 0.5,
        zIndex: 1
      },
      {
        id: "b-sub",
        type: "text",
        content: "ESTATE & PRIVATE CLIENTS",
        xMm: 8,
        yMm: (h - 10) / 2 + 7,
        widthMm: w - 16,
        heightMm: 4,
        fontFamily: '"Cinzel", serif',
        fontSizePt: 4.5,
        fontWeight: "500",
        color: "#A7C4BC",
        align: "center",
        letterSpacingMm: 0.3,
        zIndex: 2
      }
    ];
    return {
      front: { elements: frontElements, backgroundColor: "#0A3A2F" },
      back: { elements: backElements, backgroundColor: "#072E25" }
    };
  }
};
export const marbleRosegoldTemplate = {
  id: "marble-rosegold",
  name: "Marble Essence & Rose Gold",
  nameJp: "\u30DE\u30FC\u30D6\u30EB\u30FB\u30ED\u30FC\u30BA\u30B4\u30FC\u30EB\u30C9",
  category: "luxury",
  descriptionJp: "\u30A2\u30A4\u30DC\u30EA\u30FC\u306E\u5927\u7406\u77F3\u8ABF\u30C6\u30AF\u30B9\u30C1\u30E3\u3068\u808C\u99B4\u67D3\u307F\u306E\u826F\u3044\u30ED\u30FC\u30BA\u30B4\u30FC\u30EB\u30C9\u3002\u7F8E\u5BB9\u30AF\u30EA\u30CB\u30C3\u30AF\u3001\u30B8\u30E5\u30A8\u30EA\u30FC\u5411\u3051\u3002",
  defaultOrientation: "horizontal",
  previewBadge: "\u512A\u7F8E\u30FB\u6C17\u54C1",
  generator: (profile, dim, orientation) => {
    const isHoriz = orientation === "horizontal";
    const w = isHoriz ? dim.widthMm : dim.heightMm;
    const h = isHoriz ? dim.heightMm : dim.widthMm;
    const frontElements = [
      // Rose gold frame
      {
        id: "f-frame",
        type: "shape",
        shapeType: "rectangle",
        xMm: 4,
        yMm: 4,
        widthMm: w - 8,
        heightMm: h - 8,
        backgroundColor: "transparent",
        stroke: "#B76E79",
        strokeWidthMm: 0.3,
        zIndex: 1
      },
      {
        id: "f-comp",
        type: "text",
        content: profile.companyName,
        fieldBinding: "companyName",
        xMm: 8,
        yMm: 9,
        widthMm: w - 16,
        heightMm: 5,
        fontFamily: "Montserrat, sans-serif",
        fontSizePt: 7.5,
        fontWeight: "600",
        color: "#B76E79",
        align: "center",
        letterSpacingMm: 0.3,
        zIndex: 2
      },
      {
        id: "f-name",
        type: "text",
        content: profile.fullName,
        fieldBinding: "fullName",
        xMm: 8,
        yMm: isHoriz ? 18 : 24,
        widthMm: w - 16,
        heightMm: 7,
        fontFamily: '"Zen Kaku Gothic New", sans-serif',
        fontSizePt: 15,
        fontWeight: "600",
        color: "#2B2625",
        align: "center",
        letterSpacingMm: 0.4,
        zIndex: 3
      },
      {
        id: "f-title",
        type: "text",
        content: profile.jobTitle,
        fieldBinding: "jobTitle",
        xMm: 8,
        yMm: isHoriz ? 26 : 32,
        widthMm: w - 16,
        heightMm: 4,
        fontFamily: "Montserrat, sans-serif",
        fontSizePt: 5.5,
        fontWeight: "400",
        color: "#7D7571",
        align: "center",
        zIndex: 4
      },
      {
        id: "f-contacts",
        type: "text",
        content: `T. ${profile.phone}  \u2022  E. ${profile.email}
${profile.website || ""}`,
        xMm: 8,
        yMm: isHoriz ? 36 : 50,
        widthMm: w - 16,
        heightMm: 9,
        fontFamily: "Montserrat, sans-serif",
        fontSizePt: 5,
        fontWeight: "400",
        color: "#635C58",
        align: "center",
        lineHeightRatio: 1.35,
        zIndex: 5
      }
    ];
    const backElements = [
      {
        id: "b-center-comp",
        type: "text",
        content: profile.companyNameEn || profile.companyName,
        xMm: 8,
        yMm: (h - 8) / 2,
        widthMm: w - 16,
        heightMm: 8,
        fontFamily: "Montserrat, sans-serif",
        fontSizePt: 9,
        fontWeight: "600",
        color: "#B76E79",
        align: "center",
        letterSpacingMm: 0.4,
        zIndex: 1
      }
    ];
    return {
      front: { elements: frontElements, backgroundColor: "#FAF8F7" },
      back: { elements: backElements, backgroundColor: "#FAF8F7" }
    };
  }
};
export const monochromePrestigeTemplate = {
  id: "monochrome-prestige",
  name: "Monochrome Haute Couture",
  nameJp: "\u30E2\u30CE\u30AF\u30ED\u30FC\u30E0\u30FB\u30D7\u30EC\u30B9\u30C6\u30FC\u30B8",
  category: "luxury",
  descriptionJp: "\u6975\u9650\u307E\u3067\u7814\u304E\u6F84\u307E\u3055\u308C\u305F\u767D\u3068\u9ED2\u306E\u5BFE\u6BD4\u3002\u30D1\u30EA\u3084\u30DF\u30E9\u30CE\u306E\u30AA\u30FC\u30C8\u30AF\u30C1\u30E5\u30FC\u30EB\u3092\u60F3\u8D77\u3055\u305B\u308B\u4E0D\u673D\u306E\u7F8E\u3002",
  defaultOrientation: "horizontal",
  previewBadge: "\u6975\u4E0A\u30E2\u30CE\u30AF\u30ED",
  generator: (profile, dim, orientation) => {
    const isHoriz = orientation === "horizontal";
    const w = isHoriz ? dim.widthMm : dim.heightMm;
    const h = isHoriz ? dim.heightMm : dim.widthMm;
    const frontElements = [
      {
        id: "f-name",
        type: "text",
        content: (profile.fullNameEn || profile.fullName).toUpperCase(),
        fieldBinding: "fullName",
        xMm: 10,
        yMm: isHoriz ? 12 : 16,
        widthMm: w - 20,
        heightMm: 8,
        fontFamily: "Montserrat, sans-serif",
        fontSizePt: 15,
        fontWeight: "800",
        color: "#000000",
        align: "left",
        letterSpacingMm: 0.5,
        zIndex: 1
      },
      {
        id: "f-title",
        type: "text",
        content: (profile.jobTitleEn || profile.jobTitle).toUpperCase(),
        fieldBinding: "jobTitle",
        xMm: 10,
        yMm: isHoriz ? 21 : 25,
        widthMm: w - 20,
        heightMm: 4,
        fontFamily: "Montserrat, sans-serif",
        fontSizePt: 5.5,
        fontWeight: "600",
        color: "#555555",
        align: "left",
        letterSpacingMm: 0.3,
        zIndex: 2
      },
      {
        id: "f-comp",
        type: "text",
        content: (profile.companyNameEn || profile.companyName).toUpperCase(),
        fieldBinding: "companyName",
        xMm: 10,
        yMm: isHoriz ? 26 : 30,
        widthMm: w - 20,
        heightMm: 4,
        fontFamily: "Montserrat, sans-serif",
        fontSizePt: 6,
        fontWeight: "500",
        color: "#777777",
        align: "left",
        letterSpacingMm: 0.2,
        zIndex: 3
      },
      {
        id: "f-line",
        type: "line",
        stroke: "#000000",
        strokeWidthMm: 0.5,
        xMm: 10,
        yMm: isHoriz ? 33 : 40,
        widthMm: w - 20,
        heightMm: 0.5,
        zIndex: 4
      },
      {
        id: "f-contacts",
        type: "text",
        content: `TEL: ${profile.phone}  /  EMAIL: ${profile.email}
${profile.website || ""}`,
        xMm: 10,
        yMm: isHoriz ? 36 : 46,
        widthMm: w - 20,
        heightMm: 9,
        fontFamily: "Montserrat, sans-serif",
        fontSizePt: 5,
        fontWeight: "400",
        color: "#333333",
        align: "left",
        lineHeightRatio: 1.35,
        zIndex: 5
      }
    ];
    const backElements = [
      {
        id: "b-solid-black",
        type: "shape",
        shapeType: "rectangle",
        xMm: 0,
        yMm: 0,
        widthMm: w,
        heightMm: h,
        backgroundColor: "#000000",
        zIndex: 1
      },
      {
        id: "b-text",
        type: "text",
        content: (profile.companyNameEn || profile.companyName).toUpperCase(),
        xMm: 6,
        yMm: (h - 8) / 2,
        widthMm: w - 12,
        heightMm: 8,
        fontFamily: "Montserrat, sans-serif",
        fontSizePt: 11,
        fontWeight: "800",
        color: "#FFFFFF",
        align: "center",
        letterSpacingMm: 0.6,
        zIndex: 2
      }
    ];
    return {
      front: { elements: frontElements, backgroundColor: "#FFFFFF" },
      back: { elements: backElements, backgroundColor: "#000000" }
    };
  }
};
