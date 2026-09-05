import { RED_SEAL_SVG, ZEN_ENSO_SVG, TRAD_KAMON_SVG } from "../templateAssets.js";
export const tategakiWashiTemplate = {
  id: "tategaki-washi-authentic",
  name: "Authentic Vertical Tate-gaki",
  nameJp: "\u548C\u98A8\u30FB\u7E26\u66F8\u304D\u30FB\u4F1D\u7D71\u683C\u5F0F",
  category: "traditional",
  descriptionJp: "\u65E5\u672C\u306E\u7F8E\u610F\u8B58\u3092\u53D7\u3051\u7D99\u3050\u7E26\u66F8\u304D\uFF08vertical-rl\uFF09\u660E\u671D\u4F53\u3002\u548C\u7D19\u306E\u98A8\u5408\u3044\u3001\u843D\u6B3E\uFF08\u5370\u7AE0\uFF09\u98A8\u30A2\u30AF\u30BB\u30F3\u30C8\u3002",
  defaultOrientation: "vertical",
  previewBadge: "\u548C\u98A8\u30FB\u7E26\u578B",
  generator: (profile, dim, orientation) => {
    const isHoriz = orientation === "horizontal";
    const w = isHoriz ? dim.widthMm : dim.heightMm;
    const h = isHoriz ? dim.heightMm : dim.widthMm;
    if (!isHoriz) {
      const frontElements = [
        // Company Name on the Right Column (Vertical-rl)
        {
          id: "f-comp-vert",
          type: "text",
          content: profile.companyName,
          fieldBinding: "companyName",
          writingMode: "vertical-rl",
          xMm: 43,
          yMm: 12,
          widthMm: 6,
          heightMm: 50,
          fontFamily: '"Shippori Mincho", "Noto Serif JP", serif',
          fontSizePt: 8,
          fontWeight: "600",
          color: "#1F2937",
          align: "left",
          letterSpacingMm: 0.4,
          lineHeightRatio: 1.1,
          zIndex: 1
        },
        // Job Title
        {
          id: "f-title-vert",
          type: "text",
          content: `${profile.department ? profile.department + " " : ""}${profile.jobTitle}`,
          fieldBinding: "jobTitle",
          writingMode: "vertical-rl",
          xMm: 33,
          yMm: 16,
          widthMm: 5,
          heightMm: 45,
          fontFamily: '"Shippori Mincho", serif',
          fontSizePt: 6,
          fontWeight: "400",
          color: "#4B5563",
          align: "left",
          letterSpacingMm: 0.3,
          zIndex: 2
        },
        // Full Name (Center prominent column)
        {
          id: "f-name-vert",
          type: "text",
          content: profile.fullName,
          fieldBinding: "fullName",
          writingMode: "vertical-rl",
          xMm: 22,
          yMm: 16,
          widthMm: 8,
          heightMm: 48,
          fontFamily: '"Shippori Mincho", "Noto Serif JP", serif',
          fontSizePt: 16,
          fontWeight: "700",
          color: "#111827",
          align: "left",
          letterSpacingMm: 0.8,
          zIndex: 3
        },
        // Red Hanko Seal placed under the name
        {
          id: "f-seal-img",
          type: "image",
          src: RED_SEAL_SVG,
          xMm: 22.5,
          yMm: 67,
          widthMm: 7,
          heightMm: 7,
          zIndex: 4
        },
        // Contact details on Left Column (Vertical-rl or neat block)
        {
          id: "f-contacts-vert",
          type: "text",
          content: `${profile.postalCode ? profile.postalCode + " " : ""}${profile.address}
TEL: ${profile.phone}${profile.mobile ? "  \u643A\u5E2F: " + profile.mobile : ""}`,
          xMm: 6,
          yMm: 78,
          widthMm: w - 12,
          heightMm: 8,
          fontFamily: '"Noto Serif JP", serif',
          fontSizePt: 4.5,
          fontWeight: "400",
          color: "#4B5563",
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
          xMm: 6,
          yMm: (h - 26) / 2,
          widthMm: w - 12,
          heightMm: 6,
          fontFamily: '"Cinzel", "Shippori Mincho", serif',
          fontSizePt: 8,
          fontWeight: "700",
          color: "#1F2937",
          align: "center",
          letterSpacingMm: 0.35,
          zIndex: 1
        },
        {
          id: "b-name-en",
          type: "text",
          content: profile.fullNameEn || profile.fullName,
          xMm: 6,
          yMm: (h - 26) / 2 + 7,
          widthMm: w - 12,
          heightMm: 6,
          fontFamily: "Montserrat, serif",
          fontSizePt: 11,
          fontWeight: "400",
          color: "#374151",
          align: "center",
          letterSpacingMm: 0.4,
          zIndex: 2
        },
        {
          id: "b-title-en",
          type: "text",
          content: profile.jobTitleEn || profile.jobTitle,
          xMm: 6,
          yMm: (h - 26) / 2 + 14,
          widthMm: w - 12,
          heightMm: 4,
          fontFamily: "Montserrat, serif",
          fontSizePt: 5.5,
          fontWeight: "400",
          color: "#6B7280",
          align: "center",
          letterSpacingMm: 0.2,
          zIndex: 3
        },
        {
          id: "b-qr",
          type: "qr",
          data: profile.website || "https://meishi.sample",
          qrType: "url",
          xMm: (w - 12) / 2,
          yMm: 68,
          widthMm: 12,
          heightMm: 12,
          foregroundColor: "#1F2937",
          backgroundColor: "#FCFAF7",
          zIndex: 4
        }
      ];
      return {
        front: { elements: frontElements, backgroundColor: "#FCFAF7", paperTexture: "washi" },
        back: { elements: backElements, backgroundColor: "#FCFAF7", paperTexture: "washi" }
      };
    } else {
      const frontElements = [
        // Left Column: Company
        {
          id: "f-comp",
          type: "text",
          content: profile.companyName,
          fieldBinding: "companyName",
          xMm: 10,
          yMm: 9,
          widthMm: 48,
          heightMm: 5,
          fontFamily: '"Shippori Mincho", "Noto Serif JP", serif',
          fontSizePt: 8.5,
          fontWeight: "700",
          color: "#1F2937",
          align: "left",
          letterSpacingMm: 0.3,
          zIndex: 1
        },
        {
          id: "f-title",
          type: "text",
          content: `${profile.department ? profile.department + " " : ""}${profile.jobTitle}`,
          fieldBinding: "jobTitle",
          xMm: 10,
          yMm: 16,
          widthMm: 48,
          heightMm: 4,
          fontFamily: '"Shippori Mincho", serif',
          fontSizePt: 6,
          fontWeight: "500",
          color: "#6B7280",
          align: "left",
          zIndex: 2
        },
        {
          id: "f-divider",
          type: "line",
          stroke: "#E5E7EB",
          strokeWidthMm: 0.25,
          xMm: 10,
          yMm: 22,
          widthMm: 46,
          heightMm: 0.25,
          zIndex: 3
        },
        {
          id: "f-address",
          type: "text",
          content: `${profile.postalCode}
${profile.address}${profile.building ? " " + profile.building : ""}`,
          xMm: 10,
          yMm: 25,
          widthMm: 48,
          heightMm: 9,
          fontFamily: '"Noto Serif JP", serif',
          fontSizePt: 5,
          fontWeight: "400",
          color: "#374151",
          align: "left",
          lineHeightRatio: 1.35,
          zIndex: 4
        },
        {
          id: "f-contacts",
          type: "text",
          content: `TEL: ${profile.phone}    FAX: ${profile.fax || profile.phone}
MOBILE: ${profile.mobile || ""}
MAIL: ${profile.email}`,
          xMm: 10,
          yMm: 35.5,
          widthMm: 48,
          heightMm: 12,
          fontFamily: '"Noto Serif JP", serif',
          fontSizePt: 4.8,
          fontWeight: "400",
          color: "#4B5563",
          align: "left",
          lineHeightRatio: 1.35,
          zIndex: 5
        },
        // Right Dedicated Column: Vertical Name (x: 68mm)
        {
          id: "f-name-vert",
          type: "text",
          content: profile.fullName,
          fieldBinding: "fullName",
          writingMode: "vertical-rl",
          xMm: 68,
          yMm: 8,
          widthMm: 10,
          heightMm: 32,
          fontFamily: '"Shippori Mincho", "Noto Serif JP", serif',
          fontSizePt: 16,
          fontWeight: "700",
          color: "#111827",
          align: "left",
          letterSpacingMm: 0.8,
          zIndex: 6
        },
        // Red Hanko Seal (x: 70mm, y: 42mm)
        {
          id: "f-seal-img",
          type: "image",
          src: RED_SEAL_SVG,
          xMm: 70,
          yMm: 42,
          widthMm: 6.5,
          heightMm: 6.5,
          zIndex: 7
        }
      ];
      const backElements = [
        {
          id: "b-comp-en",
          type: "text",
          content: profile.companyNameEn || profile.companyName,
          xMm: 10,
          yMm: 16,
          widthMm: w - 20,
          heightMm: 6,
          fontFamily: '"Cinzel", serif',
          fontSizePt: 8.5,
          fontWeight: "700",
          color: "#1F2937",
          align: "center",
          letterSpacingMm: 0.35,
          zIndex: 1
        },
        {
          id: "b-name-en",
          type: "text",
          content: profile.fullNameEn || profile.fullName,
          xMm: 10,
          yMm: 23,
          widthMm: w - 20,
          heightMm: 6,
          fontFamily: "Montserrat, serif",
          fontSizePt: 12,
          fontWeight: "400",
          color: "#374151",
          align: "center",
          letterSpacingMm: 0.4,
          zIndex: 2
        },
        {
          id: "b-title-en",
          type: "text",
          content: profile.jobTitleEn || profile.jobTitle,
          xMm: 10,
          yMm: 30,
          widthMm: w - 20,
          heightMm: 4,
          fontFamily: "Montserrat, serif",
          fontSizePt: 5.5,
          fontWeight: "400",
          color: "#6B7280",
          align: "center",
          letterSpacingMm: 0.2,
          zIndex: 3
        },
        {
          id: "b-qr",
          type: "qr",
          data: profile.website || "https://meishi.sample",
          qrType: "url",
          xMm: (w - 11) / 2,
          yMm: 37,
          widthMm: 11,
          heightMm: 11,
          foregroundColor: "#1F2937",
          backgroundColor: "#FCFAF7",
          zIndex: 4
        }
      ];
      return {
        front: { elements: frontElements, backgroundColor: "#FCFAF7", paperTexture: "washi" },
        back: { elements: backElements, backgroundColor: "#FCFAF7", paperTexture: "washi" }
      };
    }
  }
};
export const kyotoArtisanTemplate = {
  id: "kyoto-artisan",
  name: "Kyoto Artisan Aizome",
  nameJp: "\u4EAC\u90FD\u8077\u4EBA\u30FB\u85CD\u67D3\u30A2\u30A4\u30DC\u30EA\u30FC",
  category: "traditional",
  descriptionJp: "\u85CD\u67D3\uFF08\u3042\u3044\u305E\u3081\uFF09\u306E\u6DF1\u307F\u3042\u308B\u30B9\u30C8\u30E9\u30A4\u30D7\u3068\u624B\u6F09\u304D\u548C\u7D19\u306E\u6E29\u304B\u307F\u3002\u4F1D\u7D71\u5DE5\u82B8\u3001\u8336\u9053\u3001\u4EAC\u90FD\u8001\u8217\u5411\u3051\u3002",
  defaultOrientation: "horizontal",
  previewBadge: "\u4EAC\u90FD\u4F1D\u7D71",
  generator: (profile, dim, orientation) => {
    const isHoriz = orientation === "horizontal";
    const w = isHoriz ? dim.widthMm : dim.heightMm;
    const h = isHoriz ? dim.heightMm : dim.widthMm;
    const frontElements = [
      // Left indigo bar
      {
        id: "f-aizome-bar",
        type: "shape",
        shapeType: "rectangle",
        xMm: 0,
        yMm: 0,
        widthMm: isHoriz ? 6 : w,
        heightMm: isHoriz ? h : 6,
        backgroundColor: "#165E83",
        zIndex: 1
      },
      {
        id: "f-comp",
        type: "text",
        content: profile.companyName,
        fieldBinding: "companyName",
        xMm: isHoriz ? 14 : 8,
        yMm: isHoriz ? 10 : 12,
        widthMm: w - 24,
        heightMm: 5,
        fontFamily: '"Shippori Mincho", "Noto Serif JP", serif',
        fontSizePt: 8.5,
        fontWeight: "700",
        color: "#165E83",
        align: "left",
        letterSpacingMm: 0.35,
        zIndex: 2
      },
      {
        id: "f-name",
        type: "text",
        content: profile.fullName,
        fieldBinding: "fullName",
        xMm: isHoriz ? 14 : 8,
        yMm: isHoriz ? 18 : 22,
        widthMm: 50,
        heightMm: 8,
        fontFamily: '"Shippori Mincho", serif',
        fontSizePt: 16,
        fontWeight: "700",
        color: "#1E293B",
        align: "left",
        letterSpacingMm: 0.5,
        zIndex: 3
      },
      {
        id: "f-title",
        type: "text",
        content: profile.jobTitle,
        fieldBinding: "jobTitle",
        xMm: isHoriz ? 14 : 8,
        yMm: isHoriz ? 28 : 32,
        widthMm: 50,
        heightMm: 4,
        fontFamily: '"Shippori Mincho", serif',
        fontSizePt: 6.5,
        fontWeight: "500",
        color: "#64748B",
        align: "left",
        zIndex: 4
      },
      {
        id: "f-contacts",
        type: "text",
        content: `${profile.postalCode} ${profile.address}
TEL: ${profile.phone}  |  ${profile.email}`,
        xMm: isHoriz ? 14 : 8,
        yMm: isHoriz ? 36 : 56,
        widthMm: w - 24,
        heightMm: 9,
        fontFamily: '"Noto Serif JP", serif',
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
        id: "b-title-jp",
        type: "text",
        content: profile.companyName,
        xMm: 8,
        yMm: (h - 14) / 2,
        widthMm: w - 16,
        heightMm: 6,
        fontFamily: '"Shippori Mincho", serif',
        fontSizePt: 10,
        fontWeight: "700",
        color: "#165E83",
        align: "center",
        letterSpacingMm: 0.4,
        zIndex: 1
      },
      {
        id: "b-title-en",
        type: "text",
        content: profile.companyNameEn || "KYOTO TRADITIONAL TEXTILES & CRAFTS",
        xMm: 8,
        yMm: (h - 14) / 2 + 7,
        widthMm: w - 16,
        heightMm: 4,
        fontFamily: "Montserrat, serif",
        fontSizePt: 5,
        fontWeight: "500",
        color: "#64748B",
        align: "center",
        letterSpacingMm: 0.3,
        zIndex: 2
      }
    ];
    return {
      front: { elements: frontElements, backgroundColor: "#FAF9F6", paperTexture: "washi" },
      back: { elements: backElements, backgroundColor: "#FAF9F6", paperTexture: "washi" }
    };
  }
};
export const zenStoneMinimalTemplate = {
  id: "zen-stone-minimal",
  name: "Zen Stone Enso Circle",
  nameJp: "\u7985\u30FB\u5186\u76F8\uFF08Enso\uFF09\u30DF\u30CB\u30DE\u30EB",
  category: "traditional",
  descriptionJp: "\u4E00\u7B46\u66F8\u304D\u306E\u5186\u76F8\uFF08\u3048\u3093\u305D\u3046\uFF09\u3068\u9759\u5BC2\u306A\u4F59\u767D\u3002\u30DE\u30A4\u30F3\u30C9\u30D5\u30EB\u30CD\u30B9\u3001\u30E8\u30AC\u3001\u65E5\u672C\u6587\u5316\u6307\u5C0E\u8005\u306B\u3075\u3055\u308F\u3057\u3044\u9759\u3051\u3055\u3002",
  defaultOrientation: "horizontal",
  previewBadge: "\u7985\u30FB\u9759\u5BC2",
  generator: (profile, dim, orientation) => {
    const isHoriz = orientation === "horizontal";
    const w = isHoriz ? dim.widthMm : dim.heightMm;
    const h = isHoriz ? dim.heightMm : dim.widthMm;
    const frontElements = [
      // Enso Brush Circle
      {
        id: "f-enso",
        type: "image",
        src: ZEN_ENSO_SVG,
        xMm: isHoriz ? 12 : (w - 24) / 2,
        yMm: isHoriz ? (h - 24) / 2 : 10,
        widthMm: 24,
        heightMm: 24,
        opacity: 0.9,
        zIndex: 1
      },
      // Name
      {
        id: "f-name",
        type: "text",
        content: profile.fullName,
        fieldBinding: "fullName",
        xMm: isHoriz ? 42 : 6,
        yMm: isHoriz ? 15 : 38,
        widthMm: isHoriz ? w - 48 : w - 12,
        heightMm: 8,
        fontFamily: '"Shippori Mincho", "Noto Serif JP", serif',
        fontSizePt: 15,
        fontWeight: "700",
        color: "#2C3333",
        align: isHoriz ? "left" : "center",
        letterSpacingMm: 0.6,
        zIndex: 2
      },
      {
        id: "f-title",
        type: "text",
        content: `${profile.jobTitle}  |  ${profile.companyName}`,
        fieldBinding: "jobTitle",
        xMm: isHoriz ? 42 : 6,
        yMm: isHoriz ? 24 : 48,
        widthMm: isHoriz ? w - 48 : w - 12,
        heightMm: 4,
        fontFamily: '"Shippori Mincho", serif',
        fontSizePt: 6,
        fontWeight: "400",
        color: "#686D76",
        align: isHoriz ? "left" : "center",
        zIndex: 3
      },
      {
        id: "f-contacts",
        type: "text",
        content: `${profile.email}    ${profile.phone}
${profile.website || ""}`,
        xMm: isHoriz ? 42 : 6,
        yMm: isHoriz ? 32 : 56,
        widthMm: isHoriz ? w - 48 : w - 12,
        heightMm: 8,
        fontFamily: '"Noto Serif JP", serif',
        fontSizePt: 4.8,
        fontWeight: "400",
        color: "#4F5E5E",
        align: isHoriz ? "left" : "center",
        lineHeightRatio: 1.35,
        zIndex: 4
      }
    ];
    const backElements = [
      {
        id: "b-zen-phrase",
        type: "text",
        content: "\u4E00\u671F\u4E00\u4F1A  \u2014  TREASURE EVERY ENCOUNTER",
        xMm: 6,
        yMm: (h - 6) / 2,
        widthMm: w - 12,
        heightMm: 6,
        fontFamily: '"Shippori Mincho", "Cinzel", serif',
        fontSizePt: 7.5,
        fontWeight: "500",
        color: "#2C3333",
        align: "center",
        letterSpacingMm: 0.4,
        zIndex: 1
      }
    ];
    return {
      front: { elements: frontElements, backgroundColor: "#F7F5F2", paperTexture: "washi" },
      back: { elements: backElements, backgroundColor: "#F7F5F2", paperTexture: "washi" }
    };
  }
};
export const tradMonCrestTemplate = {
  id: "trad-mon-crest",
  name: "Traditional Kamon Crest",
  nameJp: "\u5BB6\u7D0B\u30FB\u4F1D\u7D71\u683C\u5F0F\u30AF\u30E9\u30B9\u30C8",
  category: "traditional",
  descriptionJp: "\u683C\u5F0F\u9AD8\u3044\u5BB6\u7D0B\uFF08Kamon\uFF09\u98A8\u30A8\u30F3\u30D6\u30EC\u30E0\u3092\u5929\u51A0\u306B\u914D\u3057\u305F\u8358\u53B3\u306A\u4ED5\u7ACB\u3066\u3002\u8001\u8217\u65C5\u9928\u3001\u6599\u4EAD\u3001\u5BB6\u5143\u306B\u3002",
  defaultOrientation: "horizontal",
  previewBadge: "\u683C\u5F0F\u30FB\u5BB6\u7D0B",
  generator: (profile, dim, orientation) => {
    const isHoriz = orientation === "horizontal";
    const w = isHoriz ? dim.widthMm : dim.heightMm;
    const h = isHoriz ? dim.heightMm : dim.widthMm;
    const frontElements = [
      // Top center Kamon crest
      {
        id: "f-kamon",
        type: "image",
        src: TRAD_KAMON_SVG,
        xMm: (w - 14) / 2,
        yMm: 6,
        widthMm: 14,
        heightMm: 14,
        zIndex: 1
      },
      {
        id: "f-comp",
        type: "text",
        content: profile.companyName,
        fieldBinding: "companyName",
        xMm: 8,
        yMm: 22,
        widthMm: w - 16,
        heightMm: 5,
        fontFamily: '"Shippori Mincho", "Noto Serif JP", serif',
        fontSizePt: 8,
        fontWeight: "600",
        color: "#8B0000",
        align: "center",
        letterSpacingMm: 0.35,
        zIndex: 2
      },
      {
        id: "f-name",
        type: "text",
        content: profile.fullName,
        fieldBinding: "fullName",
        xMm: 8,
        yMm: 28,
        widthMm: w - 16,
        heightMm: 7,
        fontFamily: '"Shippori Mincho", serif',
        fontSizePt: 15,
        fontWeight: "700",
        color: "#111827",
        align: "center",
        letterSpacingMm: 0.6,
        zIndex: 3
      },
      {
        id: "f-title",
        type: "text",
        content: profile.jobTitle,
        fieldBinding: "jobTitle",
        xMm: 8,
        yMm: 36,
        widthMm: w - 16,
        heightMm: 4,
        fontFamily: '"Shippori Mincho", serif',
        fontSizePt: 6,
        fontWeight: "400",
        color: "#6B7280",
        align: "center",
        zIndex: 4
      },
      {
        id: "f-contacts",
        type: "text",
        content: `${profile.postalCode} ${profile.address}
TEL: ${profile.phone}`,
        xMm: 8,
        yMm: 42,
        widthMm: w - 16,
        heightMm: 7,
        fontFamily: '"Noto Serif JP", serif',
        fontSizePt: 4.8,
        fontWeight: "400",
        color: "#4B5563",
        align: "center",
        lineHeightRatio: 1.3,
        zIndex: 5
      }
    ];
    const backElements = [
      {
        id: "b-kamon",
        type: "image",
        src: TRAD_KAMON_SVG,
        xMm: (w - 24) / 2,
        yMm: (h - 24) / 2,
        widthMm: 24,
        heightMm: 24,
        opacity: 0.2,
        zIndex: 1
      },
      {
        id: "b-comp-en",
        type: "text",
        content: profile.companyNameEn || profile.companyName,
        xMm: 6,
        yMm: (h - 6) / 2,
        widthMm: w - 12,
        heightMm: 6,
        fontFamily: '"Cinzel", serif',
        fontSizePt: 8,
        fontWeight: "700",
        color: "#8B0000",
        align: "center",
        letterSpacingMm: 0.4,
        zIndex: 2
      }
    ];
    return {
      front: { elements: frontElements, backgroundColor: "#FAF8F5", paperTexture: "washi" },
      back: { elements: backElements, backgroundColor: "#FAF8F5", paperTexture: "washi" }
    };
  }
};
