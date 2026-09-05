export const minimalModernTemplate = {
  id: "minimal-modern",
  name: "Minimal Modern",
  nameJp: "\u6D17\u7DF4\u30FB\u30DF\u30CB\u30DE\u30EB\u30E2\u30C0\u30F3",
  category: "minimal",
  descriptionJp: "\u4F59\u767D\u306E\u7F8E\u3092\u6975\u3081\u305F\u30DF\u30CB\u30DE\u30EA\u30BA\u30E0\u3002\u30B9\u30BF\u30FC\u30C8\u30A2\u30C3\u30D7\u3001\u30AF\u30EA\u30A8\u30A4\u30BF\u30FC\u3001\u30D5\u30EA\u30FC\u30E9\u30F3\u30B9\u306B\u6700\u9069\u3002",
  defaultOrientation: "horizontal",
  previewBadge: "\u4EBA\u6C17 #1",
  generator: (profile, dim, orientation) => {
    const isHoriz = orientation === "horizontal";
    const w = isHoriz ? dim.widthMm : dim.heightMm;
    const h = isHoriz ? dim.heightMm : dim.widthMm;
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
        fontSizePt: 8,
        fontWeight: "500",
        color: "#475569",
        align: "left",
        letterSpacingMm: 0.1,
        zIndex: 1
      },
      {
        id: "f-kana",
        type: "text",
        content: profile.fullNameKana || "",
        fieldBinding: "fullNameKana",
        xMm: 10,
        yMm: isHoriz ? 18 : 22,
        widthMm: 45,
        heightMm: 3,
        fontFamily: '"Zen Kaku Gothic New", sans-serif',
        fontSizePt: 5.5,
        fontWeight: "400",
        color: "#94A3B8",
        align: "left",
        letterSpacingMm: 0.2,
        zIndex: 2
      },
      {
        id: "f-name",
        type: "text",
        content: profile.fullName,
        fieldBinding: "fullName",
        xMm: 10,
        yMm: isHoriz ? 22 : 26,
        widthMm: 55,
        heightMm: 8,
        fontFamily: '"Zen Kaku Gothic New", sans-serif',
        fontSizePt: 16,
        fontWeight: "700",
        color: "#0F172A",
        align: "left",
        letterSpacingMm: 0.4,
        zIndex: 3
      },
      {
        id: "f-title",
        type: "text",
        content: `${profile.department ? profile.department + "\u3000" : ""}${profile.jobTitle}`,
        fieldBinding: "jobTitle",
        xMm: 10,
        yMm: isHoriz ? 31 : 36,
        widthMm: 55,
        heightMm: 4,
        fontFamily: '"Noto Sans JP", sans-serif',
        fontSizePt: 6.5,
        fontWeight: "400",
        color: "#64748B",
        align: "left",
        zIndex: 4
      },
      {
        id: "f-contacts",
        type: "text",
        content: `${profile.postalCode} ${profile.address}
TEL: ${profile.phone}  |  MAIL: ${profile.email}${profile.website ? "\n" + profile.website : ""}`,
        xMm: 10,
        yMm: isHoriz ? 38 : 58,
        widthMm: w - 20,
        heightMm: 12,
        fontFamily: '"Zen Kaku Gothic New", sans-serif',
        fontSizePt: 5.2,
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
        yMm: (h - 24) / 2,
        widthMm: w - 20,
        heightMm: 6,
        fontFamily: "Montserrat, sans-serif",
        fontSizePt: 8.5,
        fontWeight: "600",
        color: "#0F172A",
        align: "center",
        letterSpacingMm: 0.3,
        zIndex: 1
      },
      {
        id: "b-name-en",
        type: "text",
        content: profile.fullNameEn || profile.fullName,
        xMm: 10,
        yMm: (h - 24) / 2 + 7,
        widthMm: w - 20,
        heightMm: 6,
        fontFamily: "Montserrat, sans-serif",
        fontSizePt: 12,
        fontWeight: "400",
        color: "#334155",
        align: "center",
        letterSpacingMm: 0.4,
        zIndex: 2
      },
      {
        id: "b-title-en",
        type: "text",
        content: profile.jobTitleEn || profile.jobTitle,
        xMm: 10,
        yMm: (h - 24) / 2 + 14,
        widthMm: w - 20,
        heightMm: 4,
        fontFamily: "Montserrat, sans-serif",
        fontSizePt: 5.5,
        fontWeight: "400",
        color: "#64748B",
        align: "center",
        letterSpacingMm: 0.2,
        zIndex: 3
      }
    ];
    return {
      front: { elements: frontElements, backgroundColor: "#FFFFFF" },
      back: { elements: backElements, backgroundColor: "#F8FAFC" }
    };
  }
};
export const scandinavianCleanTemplate = {
  id: "scandinavian-clean",
  name: "Scandinavian Clean Harmony",
  nameJp: "\u30B9\u30AB\u30F3\u30B8\u30CA\u30D3\u30A2\u30F3\u30FB\u5317\u6B27\u30AF\u30EA\u30FC\u30F3",
  category: "minimal",
  descriptionJp: "\u5317\u6B27\u30C7\u30B6\u30A4\u30F3\u7279\u6709\u306E\u975E\u5BFE\u79F0\u30EC\u30A4\u30A2\u30A6\u30C8\u3068\u67D4\u3089\u304B\u306A\u30D1\u30B9\u30C6\u30EB\u30A2\u30AF\u30BB\u30F3\u30C8\u3002\u89AA\u3057\u307F\u3084\u3059\u3055\u3068\u6D17\u7DF4\u3092\u4E21\u7ACB\u3002",
  defaultOrientation: "horizontal",
  previewBadge: "\u5317\u6B27\u30FB\u4E0A\u8CEA",
  generator: (profile, dim, orientation) => {
    const isHoriz = orientation === "horizontal";
    const w = isHoriz ? dim.widthMm : dim.heightMm;
    const h = isHoriz ? dim.heightMm : dim.widthMm;
    const frontElements = [
      // Soft pastel clay color block on side
      {
        id: "f-pastel-block",
        type: "shape",
        shapeType: "rectangle",
        xMm: isHoriz ? 0 : 0,
        yMm: isHoriz ? 0 : 0,
        widthMm: isHoriz ? 5 : w,
        heightMm: isHoriz ? h : 5,
        backgroundColor: "#D7C4B7",
        zIndex: 1
      },
      {
        id: "f-comp",
        type: "text",
        content: profile.companyName,
        fieldBinding: "companyName",
        xMm: isHoriz ? 12 : 8,
        yMm: isHoriz ? 10 : 12,
        widthMm: w - 20,
        heightMm: 5,
        fontFamily: 'Montserrat, "Zen Kaku Gothic New", sans-serif',
        fontSizePt: 7.5,
        fontWeight: "500",
        color: "#6E675F",
        align: "left",
        letterSpacingMm: 0.25,
        zIndex: 2
      },
      {
        id: "f-name",
        type: "text",
        content: profile.fullName,
        fieldBinding: "fullName",
        xMm: isHoriz ? 12 : 8,
        yMm: isHoriz ? 18 : 22,
        widthMm: w - 20,
        heightMm: 8,
        fontFamily: '"Zen Kaku Gothic New", sans-serif',
        fontSizePt: 15,
        fontWeight: "600",
        color: "#393430",
        align: "left",
        letterSpacingMm: 0.35,
        zIndex: 3
      },
      {
        id: "f-title",
        type: "text",
        content: profile.jobTitle,
        fieldBinding: "jobTitle",
        xMm: isHoriz ? 12 : 8,
        yMm: isHoriz ? 27 : 31,
        widthMm: w - 20,
        heightMm: 4,
        fontFamily: "Montserrat, sans-serif",
        fontSizePt: 6.5,
        fontWeight: "400",
        color: "#8A827A",
        align: "left",
        zIndex: 4
      },
      {
        id: "f-contacts",
        type: "text",
        content: `${profile.address ? profile.address + "\n" : ""}M: ${profile.mobile || profile.phone}  \u2022  ${profile.email}${profile.website ? "\n" + profile.website : ""}`,
        xMm: isHoriz ? 12 : 8,
        yMm: isHoriz ? 36 : 56,
        widthMm: w - 20,
        heightMm: 12,
        fontFamily: 'Montserrat, "Noto Sans JP", sans-serif',
        fontSizePt: 5.2,
        fontWeight: "400",
        color: "#5C544D",
        align: "left",
        lineHeightRatio: 1.35,
        zIndex: 5
      }
    ];
    const backElements = [
      {
        id: "b-accent",
        type: "shape",
        shapeType: "circle",
        xMm: (w - 24) / 2,
        yMm: (h - 24) / 2,
        widthMm: 24,
        heightMm: 24,
        backgroundColor: "#EBE3DB",
        zIndex: 1
      },
      {
        id: "b-text",
        type: "text",
        content: profile.companyNameEn || profile.companyName,
        xMm: 6,
        yMm: (h - 6) / 2,
        widthMm: w - 12,
        heightMm: 6,
        fontFamily: "Montserrat, sans-serif",
        fontSizePt: 8,
        fontWeight: "600",
        color: "#393430",
        align: "center",
        letterSpacingMm: 0.3,
        zIndex: 2
      }
    ];
    return {
      front: { elements: frontElements, backgroundColor: "#FAF8F5" },
      back: { elements: backElements, backgroundColor: "#FAF8F5" }
    };
  }
};
export const editorialMagazineTemplate = {
  id: "editorial-magazine",
  name: "Editorial Magazine Typography",
  nameJp: "\u30A8\u30C7\u30A3\u30C8\u30EA\u30A2\u30EB\u30FB\u30DE\u30AC\u30B8\u30F3\u7D44\u7248",
  category: "minimal",
  descriptionJp: "\u96D1\u8A8C\u306E\u8868\u7D19\u3092\u601D\u308F\u305B\u308B\u5927\u80C6\u306A\u5927\u6587\u5B57\u30BF\u30A4\u30DD\u30B0\u30E9\u30D5\u30A3\u3068\u30CF\u30A4\u30B3\u30F3\u30C8\u30E9\u30B9\u30C8\u3002\u7DE8\u96C6\u8005\u3001\u30B9\u30BF\u30A4\u30EA\u30B9\u30C8\u5411\u3051\u3002",
  defaultOrientation: "horizontal",
  previewBadge: "\u30A8\u30C7\u30A3\u30C8\u30EA\u30A2\u30EB",
  generator: (profile, dim, orientation) => {
    const isHoriz = orientation === "horizontal";
    const w = isHoriz ? dim.widthMm : dim.heightMm;
    const h = isHoriz ? dim.heightMm : dim.widthMm;
    const frontElements = [
      {
        id: "f-headline-en",
        type: "text",
        content: (profile.fullNameEn || profile.fullName).toUpperCase(),
        xMm: 8,
        yMm: isHoriz ? 8 : 10,
        widthMm: w - 16,
        heightMm: 10,
        fontFamily: "Montserrat, sans-serif",
        fontSizePt: isHoriz ? 18 : 15,
        fontWeight: "800",
        color: "#111827",
        align: "left",
        letterSpacingMm: 0.4,
        zIndex: 1
      },
      {
        id: "f-jp-name",
        type: "text",
        content: profile.fullName,
        xMm: 8,
        yMm: isHoriz ? 19 : 22,
        widthMm: 45,
        heightMm: 5,
        fontFamily: '"Zen Kaku Gothic New", sans-serif',
        fontSizePt: 8,
        fontWeight: "500",
        color: "#4B5563",
        align: "left",
        letterSpacingMm: 0.3,
        zIndex: 2
      },
      {
        id: "f-job-role",
        type: "text",
        content: `${profile.jobTitleEn || profile.jobTitle} \u2014 ${profile.companyName}`,
        xMm: 8,
        yMm: isHoriz ? 26 : 30,
        widthMm: w - 16,
        heightMm: 4,
        fontFamily: 'Montserrat, "Noto Sans JP", sans-serif',
        fontSizePt: 6,
        fontWeight: "600",
        color: "#2563EB",
        align: "left",
        letterSpacingMm: 0.2,
        zIndex: 3
      },
      {
        id: "f-divider",
        type: "line",
        stroke: "#111827",
        strokeWidthMm: 0.4,
        xMm: 8,
        yMm: isHoriz ? 33 : 40,
        widthMm: w - 16,
        heightMm: 0.4,
        zIndex: 4
      },
      {
        id: "f-contacts",
        type: "text",
        content: `T. ${profile.phone || profile.mobile}   /   E. ${profile.email}
${profile.address || ""}`,
        xMm: 8,
        yMm: isHoriz ? 36 : 46,
        widthMm: w - 16,
        heightMm: 10,
        fontFamily: 'Montserrat, "Noto Sans JP", sans-serif',
        fontSizePt: 5.2,
        fontWeight: "400",
        color: "#374151",
        align: "left",
        lineHeightRatio: 1.35,
        zIndex: 5
      }
    ];
    const backElements = [
      {
        id: "b-bg",
        type: "shape",
        shapeType: "rectangle",
        xMm: 0,
        yMm: 0,
        widthMm: w,
        heightMm: h,
        backgroundColor: "#111827",
        zIndex: 1
      },
      {
        id: "b-center-comp",
        type: "text",
        content: (profile.companyNameEn || profile.companyName).toUpperCase(),
        xMm: 6,
        yMm: (h - 8) / 2,
        widthMm: w - 12,
        heightMm: 8,
        fontFamily: "Montserrat, sans-serif",
        fontSizePt: 10,
        fontWeight: "700",
        color: "#F9FAFB",
        align: "center",
        letterSpacingMm: 0.5,
        zIndex: 2
      }
    ];
    return {
      front: { elements: frontElements, backgroundColor: "#FFFFFF" },
      back: { elements: backElements, backgroundColor: "#111827" }
    };
  }
};
export const monospaceDeveloperTemplate = {
  id: "monospace-developer",
  name: "Monospace Developer Terminal",
  nameJp: "\u30E2\u30CE\u30B9\u30DA\u30FC\u30B9\u30FB\u30A8\u30F3\u30B8\u30CB\u30A2\u7AEF\u6B63",
  category: "minimal",
  descriptionJp: "\u30B3\u30FC\u30C9\u30D6\u30ED\u30C3\u30AF\u3092\u601D\u308F\u305B\u308B\u7B49\u5E45\u30D5\u30A9\u30F3\u30C8\u3068\u6574\u7136\u3068\u3057\u305F\u30A4\u30F3\u30C7\u30F3\u30C8\u3002IT\u30A8\u30F3\u30B8\u30CB\u30A2\u3001\u30AA\u30FC\u30D7\u30F3\u30BD\u30FC\u30B9\u958B\u767A\u8005\u306B\u3002",
  defaultOrientation: "horizontal",
  previewBadge: "\u30A8\u30F3\u30B8\u30CB\u30A2",
  generator: (profile, dim, orientation) => {
    const isHoriz = orientation === "horizontal";
    const w = isHoriz ? dim.widthMm : dim.heightMm;
    const h = isHoriz ? dim.heightMm : dim.widthMm;
    const frontElements = [
      // Tag badge
      {
        id: "f-tag",
        type: "text",
        content: `const role = "${profile.jobTitle || "software_engineer"}";`,
        xMm: 8,
        yMm: 8,
        widthMm: w - 16,
        heightMm: 4,
        fontFamily: "monospace",
        fontSizePt: 5.5,
        fontWeight: "400",
        color: "#6366F1",
        align: "left",
        zIndex: 1
      },
      {
        id: "f-name",
        type: "text",
        content: profile.fullNameEn || profile.fullName,
        fieldBinding: "fullName",
        xMm: 8,
        yMm: 15,
        widthMm: w - 16,
        heightMm: 7,
        fontFamily: "monospace",
        fontSizePt: 13,
        fontWeight: "700",
        color: "#0F172A",
        align: "left",
        letterSpacingMm: 0.2,
        zIndex: 2
      },
      {
        id: "f-comp",
        type: "text",
        content: `// @${profile.companyNameEn || profile.companyName}`,
        xMm: 8,
        yMm: 23,
        widthMm: w - 16,
        heightMm: 4,
        fontFamily: "monospace",
        fontSizePt: 6,
        fontWeight: "400",
        color: "#64748B",
        align: "left",
        zIndex: 3
      },
      {
        id: "f-line",
        type: "line",
        stroke: "#E2E8F0",
        strokeWidthMm: 0.3,
        xMm: 8,
        yMm: 29,
        widthMm: w - 16,
        heightMm: 0.3,
        zIndex: 4
      },
      {
        id: "f-contacts",
        type: "text",
        content: `email : ${profile.email}
tel   : ${profile.phone || profile.mobile}
web   : ${profile.website || "https://github.com/developer"}`,
        xMm: 8,
        yMm: isHoriz ? 32 : 46,
        widthMm: w - 16,
        heightMm: 13,
        fontFamily: "monospace",
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
        data: profile.website || profile.sns || "https://github.com",
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
        id: "b-sub",
        type: "text",
        content: "git checkout main",
        xMm: 4,
        yMm: (h - 26) / 2 + 21,
        widthMm: w - 8,
        heightMm: 4,
        fontFamily: "monospace",
        fontSizePt: 5.5,
        fontWeight: "600",
        color: "#6366F1",
        align: "center",
        zIndex: 2
      }
    ];
    return {
      front: { elements: frontElements, backgroundColor: "#F8FAFC" },
      back: { elements: backElements, backgroundColor: "#FFFFFF" }
    };
  }
};
