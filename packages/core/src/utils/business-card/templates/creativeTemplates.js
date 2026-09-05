import {
  YUKA_ARTIST_SVG,
  YUKA_BIRDS_SVG,
  APERTURE_ICON_SVG,
  ARCHITECT_COMPASS_SVG,
  BOTANICAL_LEAF_SVG
} from "../templateAssets.js";
export const yukaMinimalLineartTemplate = {
  id: "yuka-minimal-lineart",
  name: "Yuka Minimal Line-Art",
  nameJp: "Yuka \u30AF\u30EA\u30A8\u30A4\u30BF\u30FC\u30FB\u624B\u63CF\u304D\u7DDA\u753B",
  category: "creative",
  descriptionJp: "\u624B\u63CF\u304D\u306E\u5973\u6027\u30AF\u30EA\u30A8\u30A4\u30BF\u30FC\u7DDA\u753B\u3068\u98DB\u7FD4\u3059\u308B\u9CE5\u305F\u3061\u3002\u8868\u9762\u306E\u7E4A\u7D30\u306A\u30BF\u30A4\u30DD\u30B0\u30E9\u30D5\u30A3\u3068\u88CF\u9762\u306Edesign/Team dual QR\u30B3\u30FC\u30C9\u3092\u5FE0\u5B9F\u518D\u73FE\u3002",
  defaultOrientation: "vertical",
  previewBadge: "\u753B\u50CF\u5B8C\u5168\u518D\u73FE",
  generator: (profile, dim, orientation) => {
    const isHoriz = orientation === "horizontal";
    const w = isHoriz ? dim.widthMm : dim.heightMm;
    if (!isHoriz) {
      const frontElements = [
        {
          id: "f-artist-img",
          type: "image",
          src: YUKA_ARTIST_SVG,
          xMm: (w - 36) / 2,
          yMm: 7,
          widthMm: 36,
          heightMm: 42,
          opacity: 1,
          zIndex: 1
        },
        {
          id: "f-job-title",
          type: "text",
          content: profile.jobTitle || "designer",
          fieldBinding: "jobTitle",
          xMm: 4,
          yMm: 52,
          widthMm: w - 8,
          heightMm: 4,
          fontFamily: "Montserrat, sans-serif",
          fontSizePt: 7.5,
          fontWeight: "400",
          color: "#2D2B2A",
          align: "center",
          letterSpacingMm: 0.3,
          lineHeightRatio: 1,
          zIndex: 2
        },
        {
          id: "f-title-underline",
          type: "line",
          stroke: "#2D2B2A",
          strokeWidthMm: 0.25,
          xMm: (w - 18) / 2,
          yMm: 56.5,
          widthMm: 18,
          heightMm: 0.25,
          zIndex: 3
        },
        {
          id: "f-comp-name",
          type: "text",
          content: profile.companyName || "yuka design",
          fieldBinding: "companyName",
          xMm: 4,
          yMm: 59,
          widthMm: w - 8,
          heightMm: 6,
          fontFamily: '"Zen Kaku Gothic New", "Noto Sans JP", sans-serif',
          fontSizePt: 12,
          fontWeight: "700",
          color: "#1C1917",
          align: "center",
          letterSpacingMm: 0.35,
          lineHeightRatio: 1.1,
          zIndex: 4
        },
        {
          id: "f-person-name",
          type: "text",
          content: profile.fullName || "\u3055\u3093\u3077\u308B \u3086\u304B",
          fieldBinding: "fullName",
          xMm: 4,
          yMm: 66,
          widthMm: w - 8,
          heightMm: 5.5,
          fontFamily: '"Zen Kaku Gothic New", "Noto Sans JP", sans-serif',
          fontSizePt: 9.5,
          fontWeight: "500",
          color: "#332F2E",
          align: "center",
          letterSpacingMm: 0.4,
          lineHeightRatio: 1,
          zIndex: 5
        },
        {
          id: "f-divider",
          type: "line",
          stroke: "#D5D0CC",
          strokeWidthMm: 0.3,
          xMm: (w - 24) / 2,
          yMm: 73.5,
          widthMm: 24,
          heightMm: 0.3,
          zIndex: 6
        },
        {
          id: "f-contacts",
          type: "text",
          content: `TEL: ${profile.phone || profile.mobile || "090-1234-5678"}
MAIL: ${profile.email || "yuka.sample@gmail.com"}${profile.website ? "\n" + profile.website : ""}`,
          xMm: 4,
          yMm: 76,
          widthMm: w - 8,
          heightMm: 11,
          fontFamily: 'Montserrat, "Zen Kaku Gothic New", sans-serif',
          fontSizePt: 5.2,
          fontWeight: "400",
          color: "#55514F",
          align: "center",
          letterSpacingMm: 0.15,
          lineHeightRatio: 1.25,
          zIndex: 7
        }
      ];
      const backElements = [
        {
          id: "b-birds-img",
          type: "image",
          src: YUKA_BIRDS_SVG,
          xMm: (w - 32) / 2,
          yMm: 6,
          widthMm: 32,
          heightMm: 16,
          opacity: 1,
          zIndex: 1
        },
        {
          id: "b-sec1-title",
          type: "text",
          content: "design",
          xMm: 6,
          yMm: 24,
          widthMm: 22,
          heightMm: 4,
          fontFamily: "Montserrat, sans-serif",
          fontSizePt: 8,
          fontWeight: "600",
          color: "#2D2B2A",
          align: "left",
          letterSpacingMm: 0.25,
          lineHeightRatio: 1,
          zIndex: 2
        },
        {
          id: "b-sec1-line",
          type: "line",
          stroke: "#D8D4D0",
          strokeWidthMm: 0.25,
          xMm: 6,
          yMm: 28.5,
          widthMm: w - 12,
          heightMm: 0.25,
          zIndex: 3
        },
        {
          id: "b-sec1-list",
          type: "text",
          content: "\u30FB\u30ED\u30B4\u30C7\u30B6\u30A4\u30F3\n\u30FB\u30C1\u30E9\u30B7\u30FB\u540D\u523A\u30C7\u30B6\u30A4\u30F3\n\u30FBWEB\u30C7\u30B6\u30A4\u30F3\n\u30FBSNS\u7528\u753B\u50CF\u4F5C\u6210\n\u30FB\u5404\u7A2E\u5370\u5237\u7269\u30C7\u30B6\u30A4\u30F3",
          xMm: 6,
          yMm: 31,
          widthMm: 28,
          heightMm: 20,
          fontFamily: '"Zen Kaku Gothic New", "Noto Sans JP", sans-serif',
          fontSizePt: 4.8,
          fontWeight: "400",
          color: "#4B4745",
          align: "left",
          letterSpacingMm: 0.1,
          lineHeightRatio: 1.45,
          zIndex: 4
        },
        {
          id: "b-sec1-qr",
          type: "qr",
          data: profile.website ? `${profile.website.replace(/\/$/, "")}/design` : "https://yuka.sample/design",
          qrType: "url",
          xMm: 36,
          yMm: 31.5,
          widthMm: 13,
          heightMm: 13,
          foregroundColor: "#2D2B2A",
          backgroundColor: "#FCFCF9",
          zIndex: 5
        },
        {
          id: "b-sec2-title",
          type: "text",
          content: "Team",
          xMm: 6,
          yMm: 53.5,
          widthMm: 22,
          heightMm: 4,
          fontFamily: "Montserrat, sans-serif",
          fontSizePt: 8,
          fontWeight: "600",
          color: "#2D2B2A",
          align: "left",
          letterSpacingMm: 0.25,
          lineHeightRatio: 1,
          zIndex: 6
        },
        {
          id: "b-sec2-line",
          type: "line",
          stroke: "#D8D4D0",
          strokeWidthMm: 0.25,
          xMm: 6,
          yMm: 58,
          widthMm: w - 12,
          heightMm: 0.25,
          zIndex: 7
        },
        {
          id: "b-sec2-list",
          type: "text",
          content: "\u30FB\u30C7\u30A3\u30EC\u30AF\u30B7\u30E7\u30F3\u696D\u52D9\n\u30FB\u30B3\u30FC\u30C7\u30A3\u30F3\u30B0\u652F\u63F4\n\u30FBSNS\u904B\u7528\u30B5\u30DD\u30FC\u30C8\n\u30FB\u30D6\u30E9\u30F3\u30C7\u30A3\u30F3\u30B0\u4F34\u8D70",
          xMm: 6,
          yMm: 60,
          widthMm: 28,
          heightMm: 16,
          fontFamily: '"Zen Kaku Gothic New", "Noto Sans JP", sans-serif',
          fontSizePt: 4.8,
          fontWeight: "400",
          color: "#4B4745",
          align: "left",
          letterSpacingMm: 0.1,
          lineHeightRatio: 1.45,
          zIndex: 8
        },
        {
          id: "b-sec2-qr",
          type: "qr",
          data: profile.sns ? profile.sns : profile.website ? `${profile.website.replace(/\/$/, "")}/team` : "https://yuka.sample/team",
          qrType: "url",
          xMm: 36,
          yMm: 60.5,
          widthMm: 13,
          heightMm: 13,
          foregroundColor: "#2D2B2A",
          backgroundColor: "#FCFCF9",
          zIndex: 9
        },
        {
          id: "b-signature",
          type: "text",
          content: `\xA9 ${profile.companyName || "yuka design"}. All Rights Reserved.`,
          xMm: 5,
          yMm: 83,
          widthMm: w - 10,
          heightMm: 3,
          fontFamily: "Montserrat, sans-serif",
          fontSizePt: 4.2,
          fontWeight: "400",
          color: "#9E9895",
          align: "center",
          letterSpacingMm: 0.2,
          lineHeightRatio: 1,
          zIndex: 10
        }
      ];
      return {
        front: { elements: frontElements, backgroundColor: "#FCFCF9", paperTexture: "washi" },
        back: { elements: backElements, backgroundColor: "#FCFCF9", paperTexture: "washi" }
      };
    } else {
      const frontElements = [
        // Column 1 (Left): Line-Art Illustration (x: 8mm ~ 40mm)
        {
          id: "f-artist-img",
          type: "image",
          src: YUKA_ARTIST_SVG,
          xMm: 8,
          yMm: 7,
          widthMm: 32,
          heightMm: 41,
          opacity: 1,
          zIndex: 1
        },
        // Column 2 (Right): All Typography strictly in x: 45mm ~ 87mm with dynamic anti-collision
        {
          id: "f-job-title",
          type: "text",
          content: profile.jobTitle || "designer",
          fieldBinding: "jobTitle",
          xMm: 45,
          yMm: 7.5,
          widthMm: 42,
          heightMm: 3.5,
          fontFamily: "Montserrat, sans-serif",
          fontSizePt: 6.8,
          fontWeight: "400",
          color: "#2D2B2A",
          align: "left",
          letterSpacingMm: 0.25,
          lineHeightRatio: 1,
          zIndex: 2
        },
        {
          id: "f-comp-name",
          type: "text",
          content: profile.companyName || "yuka design",
          fieldBinding: "companyName",
          xMm: 45,
          yMm: 12,
          widthMm: 42,
          heightMm: (profile.companyName || "").length > 12 ? 8 : 5.5,
          fontFamily: '"Zen Kaku Gothic New", "Noto Sans JP", sans-serif',
          fontSizePt: (profile.companyName || "").length > 12 ? 8.5 : 10.5,
          fontWeight: "700",
          color: "#1C1917",
          align: "left",
          letterSpacingMm: 0.2,
          lineHeightRatio: 1.15,
          zIndex: 3
        },
        {
          id: "f-person-name",
          type: "text",
          content: profile.fullName || "\u3055\u3093\u3077\u308B \u3086\u304B",
          fieldBinding: "fullName",
          xMm: 45,
          yMm: 22.5,
          widthMm: 42,
          heightMm: 6,
          fontFamily: '"Zen Kaku Gothic New", "Noto Sans JP", sans-serif',
          fontSizePt: 10,
          fontWeight: "500",
          color: "#332F2E",
          align: "left",
          letterSpacingMm: 0.3,
          lineHeightRatio: 1,
          zIndex: 4
        },
        {
          id: "f-divider",
          type: "line",
          stroke: "#D5D0CC",
          strokeWidthMm: 0.25,
          xMm: 45,
          yMm: 29.5,
          widthMm: 40,
          heightMm: 0.25,
          zIndex: 5
        },
        {
          id: "f-contacts",
          type: "text",
          content: `TEL: ${profile.phone || profile.mobile || "090-1234-5678"}
MAIL: ${profile.email || "yuka.sample@gmail.com"}${profile.website ? "\nWEB: " + profile.website : ""}`,
          xMm: 45,
          yMm: 31.5,
          widthMm: 42,
          heightMm: 16,
          fontFamily: 'Montserrat, "Zen Kaku Gothic New", sans-serif',
          fontSizePt: 5.2,
          fontWeight: "400",
          color: "#55514F",
          align: "left",
          letterSpacingMm: 0.1,
          lineHeightRatio: 1.35,
          zIndex: 6
        }
      ];
      const backElements = [
        {
          id: "b-birds-img",
          type: "image",
          src: YUKA_BIRDS_SVG,
          xMm: 7,
          yMm: 5,
          widthMm: 22,
          heightMm: 11,
          opacity: 1,
          zIndex: 1
        },
        // Column 1: design
        {
          id: "b-sec1-title",
          type: "text",
          content: "design",
          xMm: 7,
          yMm: 18,
          widthMm: 35,
          heightMm: 3.5,
          fontFamily: "Montserrat, sans-serif",
          fontSizePt: 7,
          fontWeight: "600",
          color: "#2D2B2A",
          align: "left",
          letterSpacingMm: 0.2,
          zIndex: 2
        },
        {
          id: "b-sec1-list",
          type: "text",
          content: "\u30FB\u30ED\u30B4 / \u30C1\u30E9\u30B7 / \u540D\u523A\n\u30FBWEB / SNS\u753B\u50CF\u30C7\u30B6\u30A4\u30F3",
          xMm: 7,
          yMm: 23,
          widthMm: 26,
          heightMm: 10,
          fontFamily: '"Zen Kaku Gothic New", sans-serif',
          fontSizePt: 4.8,
          fontWeight: "400",
          color: "#4B4745",
          align: "left",
          lineHeightRatio: 1.35,
          zIndex: 3
        },
        {
          id: "b-sec1-qr",
          type: "qr",
          data: profile.website ? `${profile.website.replace(/\/$/, "")}/design` : "https://yuka.sample/design",
          qrType: "url",
          xMm: 35,
          yMm: 20,
          widthMm: 10,
          heightMm: 10,
          foregroundColor: "#2D2B2A",
          backgroundColor: "#FCFCF9",
          zIndex: 4
        },
        // Column 2: Team
        {
          id: "b-sec2-title",
          type: "text",
          content: "Team",
          xMm: 50,
          yMm: 18,
          widthMm: 35,
          heightMm: 3.5,
          fontFamily: "Montserrat, sans-serif",
          fontSizePt: 7,
          fontWeight: "600",
          color: "#2D2B2A",
          align: "left",
          letterSpacingMm: 0.2,
          zIndex: 5
        },
        {
          id: "b-sec2-list",
          type: "text",
          content: "\u30FB\u30C7\u30A3\u30EC\u30AF\u30B7\u30E7\u30F3\u696D\u52D9\n\u30FB\u30B3\u30FC\u30C7\u30A3\u30F3\u30B0\u652F\u63F4 / \u904B\u7528",
          xMm: 50,
          yMm: 23,
          widthMm: 26,
          heightMm: 10,
          fontFamily: '"Zen Kaku Gothic New", sans-serif',
          fontSizePt: 4.8,
          fontWeight: "400",
          color: "#4B4745",
          align: "left",
          lineHeightRatio: 1.35,
          zIndex: 6
        },
        {
          id: "b-sec2-qr",
          type: "qr",
          data: profile.sns || "https://yuka.sample/team",
          qrType: "url",
          xMm: 78,
          yMm: 20,
          widthMm: 10,
          heightMm: 10,
          foregroundColor: "#2D2B2A",
          backgroundColor: "#FCFCF9",
          zIndex: 7
        },
        {
          id: "b-sig",
          type: "text",
          content: `\xA9 ${profile.companyName || "yuka design"}. All Rights Reserved.`,
          xMm: 5,
          yMm: 48,
          widthMm: w - 10,
          heightMm: 3,
          fontFamily: "Montserrat, sans-serif",
          fontSizePt: 4,
          fontWeight: "400",
          color: "#9E9895",
          align: "center",
          letterSpacingMm: 0.15,
          zIndex: 8
        }
      ];
      return {
        front: { elements: frontElements, backgroundColor: "#FCFCF9", paperTexture: "washi" },
        back: { elements: backElements, backgroundColor: "#FCFCF9", paperTexture: "washi" }
      };
    }
  }
};
export const photographerDarkroomTemplate = {
  id: "photographer-darkroom",
  name: "Photographer Minimal Darkroom",
  nameJp: "\u30D5\u30A9\u30C8\u30B0\u30E9\u30D5\u30A1\u30FC\u30FB\u6697\u5BA4\u30DF\u30CB\u30DE\u30EB",
  category: "creative",
  descriptionJp: "\u30DF\u30CB\u30DE\u30EB\u306A\u7D5E\u308A\u7FBD\u6839\uFF08\u30A2\u30D1\u30FC\u30C1\u30E3\uFF09\u30A2\u30A4\u30B3\u30F3\u3068\u7D76\u5999\u306A\u4F59\u767D\u7F8E\u3002\u5199\u771F\u5BB6\u3001\u30AE\u30E3\u30E9\u30EA\u30FC\u3001\u6620\u50CF\u4F5C\u5BB6\u306B\u6700\u9069\u3002",
  defaultOrientation: "horizontal",
  previewBadge: "\u30B9\u30BF\u30B8\u30AA\u30FB\u500B\u5C55",
  generator: (profile, dim, orientation) => {
    const isHoriz = orientation === "horizontal";
    const w = isHoriz ? dim.widthMm : dim.heightMm;
    const h = isHoriz ? dim.heightMm : dim.widthMm;
    const frontElements = [
      {
        id: "f-aperture-icon",
        type: "image",
        src: APERTURE_ICON_SVG,
        xMm: isHoriz ? 12 : (w - 18) / 2,
        yMm: isHoriz ? (h - 18) / 2 : 12,
        widthMm: 18,
        heightMm: 18,
        zIndex: 1
      },
      {
        id: "f-name",
        type: "text",
        content: profile.fullNameEn || profile.fullName,
        fieldBinding: "fullName",
        xMm: isHoriz ? 36 : 6,
        yMm: isHoriz ? 14 : 36,
        widthMm: isHoriz ? w - 42 : w - 12,
        heightMm: 7,
        fontFamily: 'Montserrat, "Zen Kaku Gothic New", sans-serif',
        fontSizePt: 13,
        fontWeight: "600",
        color: "#1E293B",
        align: isHoriz ? "left" : "center",
        letterSpacingMm: 0.4,
        zIndex: 2
      },
      {
        id: "f-title",
        type: "text",
        content: profile.jobTitleEn || profile.jobTitle || "PHOTOGRAPHER & VISUAL ARTIST",
        fieldBinding: "jobTitle",
        xMm: isHoriz ? 36 : 6,
        yMm: isHoriz ? 22 : 44,
        widthMm: isHoriz ? w - 42 : w - 12,
        heightMm: 4,
        fontFamily: "Montserrat, sans-serif",
        fontSizePt: 5.5,
        fontWeight: "500",
        color: "#64748B",
        align: isHoriz ? "left" : "center",
        letterSpacingMm: 0.3,
        zIndex: 3
      },
      {
        id: "f-line",
        type: "line",
        stroke: "#CBD5E1",
        strokeWidthMm: 0.25,
        xMm: isHoriz ? 36 : 14,
        yMm: isHoriz ? 28 : 52,
        widthMm: isHoriz ? 45 : w - 28,
        heightMm: 0.25,
        zIndex: 4
      },
      {
        id: "f-contact",
        type: "text",
        content: `${profile.website || "https://studio-darkroom.visual"}
${profile.email || "artist@darkroom.visual"}   ${profile.phone || "+81 (0)90-1234-5678"}`,
        xMm: isHoriz ? 36 : 6,
        yMm: isHoriz ? 31 : 56,
        widthMm: isHoriz ? w - 42 : w - 12,
        heightMm: 10,
        fontFamily: "Montserrat, sans-serif",
        fontSizePt: 5.2,
        fontWeight: "400",
        color: "#475569",
        align: isHoriz ? "left" : "center",
        lineHeightRatio: 1.3,
        zIndex: 5
      }
    ];
    const backElements = [
      {
        id: "b-qr",
        type: "qr",
        data: profile.website || "https://studio-darkroom.visual/portfolio",
        qrType: "url",
        xMm: (w - 18) / 2,
        yMm: (h - 26) / 2,
        widthMm: 18,
        heightMm: 18,
        foregroundColor: "#1E293B",
        backgroundColor: "#FFFFFF",
        zIndex: 1
      },
      {
        id: "b-qr-label",
        type: "text",
        content: "PORTFOLIO & EXHIBITIONS",
        xMm: 4,
        yMm: (h - 26) / 2 + 20,
        widthMm: w - 8,
        heightMm: 4,
        fontFamily: "Montserrat, sans-serif",
        fontSizePt: 5,
        fontWeight: "600",
        color: "#64748B",
        align: "center",
        letterSpacingMm: 0.3,
        zIndex: 2
      }
    ];
    return {
      front: { elements: frontElements, backgroundColor: "#F8FAFC" },
      back: { elements: backElements, backgroundColor: "#F8FAFC" }
    };
  }
};
export const architectBlueprintTemplate = {
  id: "architect-blueprint",
  name: "Architect Drafting Blueprint",
  nameJp: "\u30A2\u30FC\u30AD\u30C6\u30AF\u30C8\u30FB\u8A2D\u8A08\u56F3\u30E9\u30A4\u30F3",
  category: "creative",
  descriptionJp: "\u9EC4\u91D1\u6BD4\u306E\u30B0\u30EA\u30C3\u30C9\u30E9\u30A4\u30F3\u3068\u7E4A\u7D30\u306A\u56F3\u9762\u30A2\u30AF\u30BB\u30F3\u30C8\u3002\u4E00\u7D1A\u5EFA\u7BC9\u58EB\u3001\u69CB\u9020\u30C7\u30B6\u30A4\u30CA\u30FC\u306E\u305F\u3081\u306E\u7CBE\u5BC6\u30BF\u30A4\u30DD\u30B0\u30E9\u30D5\u30A3\u3002",
  defaultOrientation: "horizontal",
  previewBadge: "\u5EFA\u7BC9\u30FB\u7CBE\u5BC6",
  generator: (profile, dim, orientation) => {
    const isHoriz = orientation === "horizontal";
    const w = isHoriz ? dim.widthMm : dim.heightMm;
    const h = isHoriz ? dim.heightMm : dim.widthMm;
    const frontElements = [
      // Border framing grid
      {
        id: "f-grid-box",
        type: "shape",
        shapeType: "rectangle",
        xMm: 5,
        yMm: 5,
        widthMm: w - 10,
        heightMm: h - 10,
        backgroundColor: "transparent",
        stroke: "#CBD5E1",
        strokeWidthMm: 0.25,
        zIndex: 1
      },
      {
        id: "f-compass",
        type: "image",
        src: ARCHITECT_COMPASS_SVG,
        xMm: w - 24,
        yMm: 8,
        widthMm: 16,
        heightMm: 16,
        zIndex: 2
      },
      {
        id: "f-comp",
        type: "text",
        content: profile.companyName || "ARCHITECTURAL DESIGN ATELIER",
        fieldBinding: "companyName",
        xMm: 8,
        yMm: 9,
        widthMm: w - 34,
        heightMm: 4,
        fontFamily: "Montserrat, sans-serif",
        fontSizePt: 6.5,
        fontWeight: "600",
        color: "#334155",
        align: "left",
        letterSpacingMm: 0.3,
        zIndex: 3
      },
      {
        id: "f-name",
        type: "text",
        content: profile.fullName,
        fieldBinding: "fullName",
        xMm: 8,
        yMm: 18,
        widthMm: w - 34,
        heightMm: 7,
        fontFamily: '"Zen Kaku Gothic New", sans-serif',
        fontSizePt: 13,
        fontWeight: "700",
        color: "#0F172A",
        align: "left",
        letterSpacingMm: 0.3,
        zIndex: 4
      },
      {
        id: "f-title",
        type: "text",
        content: profile.jobTitle || "\u4E00\u7D1A\u5EFA\u7BC9\u58EB / Principal Architect",
        fieldBinding: "jobTitle",
        xMm: 8,
        yMm: 26,
        widthMm: w - 34,
        heightMm: 4,
        fontFamily: '"Noto Sans JP", sans-serif',
        fontSizePt: 6,
        fontWeight: "400",
        color: "#64748B",
        align: "left",
        zIndex: 5
      },
      {
        id: "f-contacts",
        type: "text",
        content: `${profile.postalCode} ${profile.address}
TEL: ${profile.phone}  |  MAIL: ${profile.email}`,
        xMm: 8,
        yMm: isHoriz ? 38 : 60,
        widthMm: w - 16,
        heightMm: 8,
        fontFamily: '"Noto Sans JP", sans-serif',
        fontSizePt: 5,
        fontWeight: "400",
        color: "#475569",
        align: "left",
        lineHeightRatio: 1.3,
        zIndex: 6
      }
    ];
    const backElements = [
      {
        id: "b-grid-box",
        type: "shape",
        shapeType: "rectangle",
        xMm: 5,
        yMm: 5,
        widthMm: w - 10,
        heightMm: h - 10,
        backgroundColor: "#0F172A",
        stroke: "#334155",
        strokeWidthMm: 0.25,
        zIndex: 1
      },
      {
        id: "b-title-en",
        type: "text",
        content: profile.companyNameEn || profile.companyName || "ARCHITECTURAL DESIGN ATELIER",
        xMm: 8,
        yMm: (h - 10) / 2,
        widthMm: w - 16,
        heightMm: 6,
        fontFamily: "Montserrat, sans-serif",
        fontSizePt: 8.5,
        fontWeight: "600",
        color: "#F8FAFC",
        align: "center",
        letterSpacingMm: 0.4,
        zIndex: 2
      },
      {
        id: "b-sub",
        type: "text",
        content: "RESIDENTIAL \u2022 COMMERCIAL \u2022 LANDSCAPE \u2022 INTERIOR",
        xMm: 8,
        yMm: (h - 10) / 2 + 7,
        widthMm: w - 16,
        heightMm: 4,
        fontFamily: "Montserrat, sans-serif",
        fontSizePt: 4.5,
        fontWeight: "400",
        color: "#94A3B8",
        align: "center",
        letterSpacingMm: 0.3,
        zIndex: 3
      }
    ];
    return {
      front: { elements: frontElements, backgroundColor: "#FFFFFF" },
      back: { elements: backElements, backgroundColor: "#0F172A" }
    };
  }
};
export const botanicalArtisanTemplate = {
  id: "botanical-artisan",
  name: "Botanical Artisan Leaf",
  nameJp: "\u30DC\u30BF\u30CB\u30AB\u30EB\u30FB\u30AA\u30FC\u30AC\u30CB\u30C3\u30AF\u7DDA\u753B",
  category: "creative",
  descriptionJp: "\u7E4A\u7D30\u306A\u624B\u63CF\u304D\u30EA\u30FC\u30D5\uFF08\u690D\u7269\uFF09\u30A2\u30A4\u30B3\u30F3\u3068\u6E29\u3082\u308A\u3042\u308B\u30A2\u30FC\u30B9\u30AB\u30E9\u30FC\u3002\u30D5\u30ED\u30FC\u30EA\u30B9\u30C8\u3001\u30B5\u30ED\u30F3\u3001\u81EA\u7136\u6D3E\u30D6\u30E9\u30F3\u30C9\u306B\u3002",
  defaultOrientation: "horizontal",
  previewBadge: "\u30DC\u30BF\u30CB\u30AB\u30EB",
  generator: (profile, dim, orientation) => {
    const isHoriz = orientation === "horizontal";
    const w = isHoriz ? dim.widthMm : dim.heightMm;
    const h = isHoriz ? dim.heightMm : dim.widthMm;
    const frontElements = [
      {
        id: "f-leaf",
        type: "image",
        src: BOTANICAL_LEAF_SVG,
        xMm: isHoriz ? 10 : (w - 20) / 2,
        yMm: isHoriz ? 9 : 8,
        widthMm: isHoriz ? 18 : 20,
        heightMm: isHoriz ? 24 : 26,
        zIndex: 1
      },
      {
        id: "f-comp",
        type: "text",
        content: profile.companyName || "BOTANICAL ESSENCE ATELIER",
        fieldBinding: "companyName",
        xMm: isHoriz ? 34 : 6,
        yMm: isHoriz ? 12 : 38,
        widthMm: isHoriz ? w - 40 : w - 12,
        heightMm: 4,
        fontFamily: "Montserrat, sans-serif",
        fontSizePt: 6.5,
        fontWeight: "500",
        color: "#5F7161",
        align: isHoriz ? "left" : "center",
        letterSpacingMm: 0.3,
        zIndex: 2
      },
      {
        id: "f-name",
        type: "text",
        content: profile.fullName,
        fieldBinding: "fullName",
        xMm: isHoriz ? 34 : 6,
        yMm: isHoriz ? 18 : 44,
        widthMm: isHoriz ? w - 40 : w - 12,
        heightMm: 7,
        fontFamily: '"Zen Kaku Gothic New", sans-serif',
        fontSizePt: 12.5,
        fontWeight: "700",
        color: "#2C3639",
        align: isHoriz ? "left" : "center",
        letterSpacingMm: 0.35,
        zIndex: 3
      },
      {
        id: "f-title",
        type: "text",
        content: profile.jobTitle || "Florist & Botanical Stylist",
        fieldBinding: "jobTitle",
        xMm: isHoriz ? 34 : 6,
        yMm: isHoriz ? 26 : 52,
        widthMm: isHoriz ? w - 40 : w - 12,
        heightMm: 4,
        fontFamily: "Montserrat, sans-serif",
        fontSizePt: 6,
        fontWeight: "400",
        color: "#6B7280",
        align: isHoriz ? "left" : "center",
        zIndex: 4
      },
      {
        id: "f-contacts",
        type: "text",
        content: `TEL: ${profile.phone || "03-1234-5678"}  \u2022  ${profile.email || "hello@botanical-artisan.jp"}
${profile.address || "\u6771\u4EAC\u90FD\u6E2F\u533A\u5357\u9752\u5C713-1-1"}`,
        xMm: isHoriz ? 34 : 6,
        yMm: isHoriz ? 36 : 64,
        widthMm: isHoriz ? w - 40 : w - 12,
        heightMm: 10,
        fontFamily: '"Noto Sans JP", sans-serif',
        fontSizePt: 5,
        fontWeight: "400",
        color: "#4B5563",
        align: isHoriz ? "left" : "center",
        lineHeightRatio: 1.35,
        zIndex: 5
      }
    ];
    const backElements = [
      {
        id: "b-qr",
        type: "qr",
        data: profile.website || "https://botanical-artisan.sample",
        qrType: "url",
        xMm: (w - 18) / 2,
        yMm: (h - 26) / 2,
        widthMm: 18,
        heightMm: 18,
        foregroundColor: "#2C3639",
        backgroundColor: "#FAF8F1",
        zIndex: 1
      },
      {
        id: "b-sub",
        type: "text",
        content: "ORGANIC FLOWERS & AROMATHERAPY",
        xMm: 4,
        yMm: (h - 26) / 2 + 21,
        widthMm: w - 8,
        heightMm: 4,
        fontFamily: "Montserrat, sans-serif",
        fontSizePt: 5,
        fontWeight: "600",
        color: "#5F7161",
        align: "center",
        letterSpacingMm: 0.3,
        zIndex: 2
      }
    ];
    return {
      front: { elements: frontElements, backgroundColor: "#FAF8F1", paperTexture: "washi" },
      back: { elements: backElements, backgroundColor: "#FAF8F1", paperTexture: "washi" }
    };
  }
};
