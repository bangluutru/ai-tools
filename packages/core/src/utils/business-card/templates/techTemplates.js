export const techInnovatorTemplate = {
  id: "tech-innovator",
  name: "Tech Innovator QR-Connect",
  nameJp: "\u5148\u9032\u30FB\u30C6\u30C3\u30AF\u30A4\u30CE\u30D9\u30FC\u30BF\u30FC",
  category: "tech",
  descriptionJp: "\u9BAE\u3084\u304B\u306A\u30D6\u30EB\u30FC\u306E\u5E7E\u4F55\u5B66\u30B7\u30A7\u30A4\u30D7\u3068\u8868\u9762QR\u30B3\u30FC\u30C9\u914D\u7F6E\u3002IT\u30A8\u30F3\u30B8\u30CB\u30A2\u3001SaaS\u4F01\u696D\u306B\u5927\u597D\u8A55\u3002",
  defaultOrientation: "horizontal",
  previewBadge: "\u30C6\u30C3\u30AF",
  generator: (profile, dim, orientation) => {
    const isHoriz = orientation === "horizontal";
    const w = isHoriz ? dim.widthMm : dim.heightMm;
    const h = isHoriz ? dim.heightMm : dim.widthMm;
    const frontElements = [
      // Left electric blue accent bar
      {
        id: "f-left-accent",
        type: "shape",
        shapeType: "rectangle",
        xMm: 0,
        yMm: 0,
        widthMm: isHoriz ? 4 : w,
        heightMm: isHoriz ? h : 4,
        backgroundColor: "#0284C7",
        zIndex: 1
      },
      // Company Name
      {
        id: "f-comp",
        type: "text",
        content: profile.companyName,
        fieldBinding: "companyName",
        xMm: isHoriz ? 10 : 6,
        yMm: isHoriz ? 8 : 10,
        widthMm: isHoriz ? 54 : w - 12,
        heightMm: 5,
        fontFamily: "Montserrat, sans-serif",
        fontSizePt: 8,
        fontWeight: "700",
        color: "#0F172A",
        align: "left",
        letterSpacingMm: 0.15,
        zIndex: 2
      },
      // Full Name (Strictly confined to x: 10 ~ 64 mm)
      {
        id: "f-name",
        type: "text",
        content: profile.fullName,
        fieldBinding: "fullName",
        xMm: isHoriz ? 10 : 6,
        yMm: isHoriz ? 16 : 20,
        widthMm: isHoriz ? 54 : w - 12,
        heightMm: 8,
        fontFamily: '"Zen Kaku Gothic New", sans-serif',
        fontSizePt: 16,
        fontWeight: "700",
        color: "#0F172A",
        align: "left",
        letterSpacingMm: 0.35,
        zIndex: 3
      },
      {
        id: "f-name-en",
        type: "text",
        content: profile.fullNameEn || "",
        fieldBinding: "fullNameEn",
        xMm: isHoriz ? 10 : 6,
        yMm: isHoriz ? 25 : 29,
        widthMm: isHoriz ? 54 : w - 12,
        heightMm: 3.5,
        fontFamily: "Montserrat, sans-serif",
        fontSizePt: 5.5,
        fontWeight: "500",
        color: "#0284C7",
        align: "left",
        letterSpacingMm: 0.2,
        zIndex: 4
      },
      {
        id: "f-title",
        type: "text",
        content: `${profile.department ? profile.department + "\u3000" : ""}${profile.jobTitle}`,
        fieldBinding: "jobTitle",
        xMm: isHoriz ? 10 : 6,
        yMm: isHoriz ? 30 : 34,
        widthMm: isHoriz ? 54 : w - 12,
        heightMm: 4,
        fontFamily: '"Noto Sans JP", sans-serif',
        fontSizePt: 6,
        fontWeight: "400",
        color: "#64748B",
        align: "left",
        zIndex: 5
      },
      // Contact details strictly ending before the QR box
      {
        id: "f-contacts",
        type: "text",
        content: `${profile.postalCode} ${profile.address}
TEL: ${profile.phone}  |  ${profile.email}`,
        xMm: isHoriz ? 10 : 6,
        yMm: isHoriz ? 38 : 42,
        widthMm: isHoriz ? 54 : w - 12,
        heightMm: 10,
        fontFamily: '"Noto Sans JP", sans-serif',
        fontSizePt: 5,
        fontWeight: "400",
        color: "#475569",
        align: "left",
        lineHeightRatio: 1.35,
        zIndex: 6
      },
      // Right QR Container (Completely isolated at x: 68mm ~ 85mm)
      ...isHoriz ? [
        {
          id: "f-qr-box",
          type: "shape",
          shapeType: "rectangle",
          xMm: 68,
          yMm: 11,
          widthMm: 16,
          heightMm: 16,
          backgroundColor: "#0F172A",
          borderRadiusMm: 2,
          zIndex: 7
        },
        {
          id: "f-qr",
          type: "qr",
          data: profile.website || "https://tech.sample",
          qrType: "url",
          xMm: 69.5,
          yMm: 12.5,
          widthMm: 13,
          heightMm: 13,
          foregroundColor: "#FFFFFF",
          backgroundColor: "#0F172A",
          zIndex: 8
        },
        {
          id: "f-qr-text",
          type: "text",
          content: "SCAN ME",
          xMm: 68,
          yMm: 28.5,
          widthMm: 16,
          heightMm: 3,
          fontFamily: "Montserrat, sans-serif",
          fontSizePt: 4.5,
          fontWeight: "700",
          color: "#0284C7",
          align: "center",
          letterSpacingMm: 0.2,
          zIndex: 9
        }
      ] : [
        {
          id: "f-qr",
          type: "qr",
          data: profile.website || "https://tech.sample",
          qrType: "url",
          xMm: (w - 18) / 2,
          yMm: 66,
          widthMm: 18,
          heightMm: 18,
          foregroundColor: "#0284C7",
          backgroundColor: "#FFFFFF",
          zIndex: 7
        }
      ]
    ];
    const backElements = [
      {
        id: "b-bg-dark",
        type: "shape",
        shapeType: "rectangle",
        xMm: 0,
        yMm: 0,
        widthMm: w,
        heightMm: h,
        backgroundColor: "#0F172A",
        zIndex: 1
      },
      {
        id: "b-comp-en",
        type: "text",
        content: profile.companyNameEn || profile.companyName,
        xMm: 8,
        yMm: (h - 14) / 2,
        widthMm: w - 16,
        heightMm: 6,
        fontFamily: "Montserrat, sans-serif",
        fontSizePt: 8.5,
        fontWeight: "700",
        color: "#FFFFFF",
        align: "center",
        letterSpacingMm: 0.35,
        zIndex: 2
      },
      {
        id: "b-sub",
        type: "text",
        content: "AI & CLOUD INNOVATION SOLUTIONS",
        xMm: 8,
        yMm: (h - 14) / 2 + 7,
        widthMm: w - 16,
        heightMm: 4,
        fontFamily: "Montserrat, sans-serif",
        fontSizePt: 5,
        fontWeight: "600",
        color: "#38BDF8",
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
export const cyberMatrixTemplate = {
  id: "cyber-matrix",
  name: "Cyber Matrix Dark Terminal",
  nameJp: "\u30B5\u30A4\u30D0\u30FC\u30FB\u30C0\u30FC\u30AF\u30DE\u30C8\u30EA\u30AF\u30B9",
  category: "tech",
  descriptionJp: "\u30C0\u30FC\u30AFUI\u306B\u30B5\u30A4\u30D0\u30FC\u30B0\u30EA\u30FC\u30F3\u306E\u30CD\u30AA\u30F3\u5149\u5F69\u3002\u30D6\u30ED\u30C3\u30AF\u30C1\u30A7\u30FC\u30F3\u3001AI\u30A8\u30F3\u30B8\u30CB\u30A2\u3001CTO\u306E\u305F\u3081\u306E\u540D\u523A\u3002",
  defaultOrientation: "horizontal",
  previewBadge: "\u30B5\u30A4\u30D0\u30FC",
  generator: (profile, dim, orientation) => {
    const isHoriz = orientation === "horizontal";
    const w = isHoriz ? dim.widthMm : dim.heightMm;
    const h = isHoriz ? dim.heightMm : dim.widthMm;
    const frontElements = [
      // Top neon green strip
      {
        id: "f-strip",
        type: "shape",
        shapeType: "rectangle",
        xMm: 0,
        yMm: 0,
        widthMm: w,
        heightMm: 2.5,
        backgroundColor: "#22C55E",
        zIndex: 1
      },
      {
        id: "f-role-badge",
        type: "text",
        content: `[ ${(profile.jobTitleEn || profile.jobTitle || "SECURITY ARCHITECT").toUpperCase()} ]`,
        xMm: 8,
        yMm: 8,
        widthMm: w - 16,
        heightMm: 4,
        fontFamily: "monospace",
        fontSizePt: 5.5,
        fontWeight: "700",
        color: "#22C55E",
        align: "left",
        letterSpacingMm: 0.2,
        zIndex: 2
      },
      {
        id: "f-name",
        type: "text",
        content: (profile.fullNameEn || profile.fullName).toUpperCase(),
        fieldBinding: "fullName",
        xMm: 8,
        yMm: 15,
        widthMm: w - 16,
        heightMm: 7,
        fontFamily: "monospace",
        fontSizePt: 13.5,
        fontWeight: "700",
        color: "#F8FAFC",
        align: "left",
        letterSpacingMm: 0.3,
        zIndex: 3
      },
      {
        id: "f-comp",
        type: "text",
        content: `ORG: ${profile.companyName}`,
        fieldBinding: "companyName",
        xMm: 8,
        yMm: 23,
        widthMm: w - 16,
        heightMm: 4,
        fontFamily: "monospace",
        fontSizePt: 5.5,
        fontWeight: "400",
        color: "#94A3B8",
        align: "left",
        zIndex: 4
      },
      {
        id: "f-contacts",
        type: "text",
        content: `PING: ${profile.email}
PORT: ${profile.phone}  |  HOST: ${profile.website || "localhost"}`,
        xMm: 8,
        yMm: isHoriz ? 32 : 46,
        widthMm: w - 16,
        heightMm: 10,
        fontFamily: "monospace",
        fontSizePt: 5,
        fontWeight: "400",
        color: "#86EFAC",
        align: "left",
        lineHeightRatio: 1.35,
        zIndex: 5
      }
    ];
    const backElements = [
      {
        id: "b-qr",
        type: "qr",
        data: profile.website || "https://matrix.dev",
        qrType: "url",
        xMm: (w - 18) / 2,
        yMm: (h - 26) / 2,
        widthMm: 18,
        heightMm: 18,
        foregroundColor: "#22C55E",
        backgroundColor: "#0B0F19",
        zIndex: 1
      },
      {
        id: "b-label",
        type: "text",
        content: "VERIFIED GPG KEY / REPO",
        xMm: 4,
        yMm: (h - 26) / 2 + 21,
        widthMm: w - 8,
        heightMm: 4,
        fontFamily: "monospace",
        fontSizePt: 5,
        fontWeight: "700",
        color: "#22C55E",
        align: "center",
        zIndex: 2
      }
    ];
    return {
      front: { elements: frontElements, backgroundColor: "#0B0F19" },
      back: { elements: backElements, backgroundColor: "#0B0F19" }
    };
  }
};
export const glassmorphismCardTemplate = {
  id: "glassmorphism-card",
  name: "Futuristic Glassmorphism",
  nameJp: "\u30B0\u30E9\u30B9\u30E2\u30D5\u30A3\u30BA\u30E0\u30FB\u900F\u660E\u611F",
  category: "tech",
  descriptionJp: "\u3059\u308A\u30AC\u30E9\u30B9\u306E\u3088\u3046\u306A\u534A\u900F\u660E\u30EC\u30A4\u30E4\u30FC\u3068\u67D4\u3089\u304B\u306A\u5149\u306E\u5883\u754C\u7DDA\u3002UI/UX\u30C7\u30B6\u30A4\u30CA\u30FC\u3001\u30D7\u30ED\u30C0\u30AF\u30C8\u30DE\u30CD\u30FC\u30B8\u30E3\u30FC\u5411\u3051\u3002",
  defaultOrientation: "horizontal",
  previewBadge: "\u900F\u660E\u7F8E\u5B66",
  generator: (profile, dim, orientation) => {
    const isHoriz = orientation === "horizontal";
    const w = isHoriz ? dim.widthMm : dim.heightMm;
    const h = isHoriz ? dim.heightMm : dim.widthMm;
    const frontElements = [
      // Acrylic frosted panel card inside
      {
        id: "f-acrylic-box",
        type: "shape",
        shapeType: "rectangle",
        xMm: 4,
        yMm: 4,
        widthMm: w - 8,
        heightMm: h - 8,
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        stroke: "#E0E7FF",
        strokeWidthMm: 0.35,
        borderRadiusMm: 2,
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
        heightMm: 4.5,
        fontFamily: "Montserrat, sans-serif",
        fontSizePt: 7.5,
        fontWeight: "600",
        color: "#4F46E5",
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
        yMm: isHoriz ? 16 : 20,
        widthMm: w - 16,
        heightMm: 8,
        fontFamily: '"Zen Kaku Gothic New", sans-serif',
        fontSizePt: 15,
        fontWeight: "700",
        color: "#1E1B4B",
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
        yMm: isHoriz ? 24 : 29,
        widthMm: w - 16,
        heightMm: 4,
        fontFamily: "Montserrat, sans-serif",
        fontSizePt: 6,
        fontWeight: "500",
        color: "#6366F1",
        align: "left",
        zIndex: 4
      },
      {
        id: "f-contacts",
        type: "text",
        content: `${profile.email}   \u2022   ${profile.phone}
${profile.website || ""}`,
        xMm: 8,
        yMm: isHoriz ? 34 : 46,
        widthMm: w - 16,
        heightMm: 9,
        fontFamily: "Montserrat, sans-serif",
        fontSizePt: 5,
        fontWeight: "400",
        color: "#4338CA",
        align: "left",
        lineHeightRatio: 1.35,
        zIndex: 5
      }
    ];
    const backElements = [
      {
        id: "b-acrylic",
        type: "shape",
        shapeType: "rectangle",
        xMm: 4,
        yMm: 4,
        widthMm: w - 8,
        heightMm: h - 8,
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        stroke: "#E0E7FF",
        strokeWidthMm: 0.35,
        borderRadiusMm: 2,
        zIndex: 1
      },
      {
        id: "b-comp-en",
        type: "text",
        content: (profile.companyNameEn || profile.companyName).toUpperCase(),
        xMm: 8,
        yMm: (h - 8) / 2,
        widthMm: w - 16,
        heightMm: 8,
        fontFamily: "Montserrat, sans-serif",
        fontSizePt: 9,
        fontWeight: "700",
        color: "#4F46E5",
        align: "center",
        letterSpacingMm: 0.4,
        zIndex: 2
      }
    ];
    return {
      front: { elements: frontElements, backgroundColor: "#EEF2FF" },
      back: { elements: backElements, backgroundColor: "#EEF2FF" }
    };
  }
};
export const qrFirstConnectTemplate = {
  id: "qr-first-connect",
  name: "QR-First Instant vCard",
  nameJp: "QR\u30D5\u30A1\u30FC\u30B9\u30C8\u30FB\u30EF\u30F3\u30BF\u30C3\u30D7\u63A5\u7D9A",
  category: "tech",
  descriptionJp: "\u88CF\u9762\u4E2D\u592E\u306B\u5927\u578BQR\u30B3\u30FC\u30C9\u3092\u5802\u3005\u914D\u7F6E\u3002\u30B9\u30DE\u30DB\u30AB\u30E1\u30E9\u30671\u79D2\u30B9\u30AD\u30E3\u30F3\u3001\u5373\u6642\u9023\u7D61\u5148\u767B\u9332\u306B\u7279\u5316\u3002",
  defaultOrientation: "horizontal",
  previewBadge: "\u5373\u6642\u30B9\u30AD\u30E3\u30F3",
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
        xMm: 8,
        yMm: 8,
        widthMm: w - 16,
        heightMm: 5,
        fontFamily: "Montserrat, sans-serif",
        fontSizePt: 8,
        fontWeight: "700",
        color: "#0F172A",
        align: "left",
        letterSpacingMm: 0.15,
        zIndex: 1
      },
      {
        id: "f-name",
        type: "text",
        content: profile.fullName,
        fieldBinding: "fullName",
        xMm: 8,
        yMm: isHoriz ? 17 : 20,
        widthMm: w - 16,
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
        xMm: 8,
        yMm: isHoriz ? 26 : 30,
        widthMm: w - 16,
        heightMm: 4,
        fontFamily: "Montserrat, sans-serif",
        fontSizePt: 6.5,
        fontWeight: "500",
        color: "#2563EB",
        align: "left",
        zIndex: 3
      },
      {
        id: "f-line",
        type: "line",
        stroke: "#E2E8F0",
        strokeWidthMm: 0.3,
        xMm: 8,
        yMm: isHoriz ? 32 : 38,
        widthMm: w - 16,
        heightMm: 0.3,
        zIndex: 4
      },
      {
        id: "f-contacts",
        type: "text",
        content: `TEL: ${profile.phone}  |  EMAIL: ${profile.email}
WEB: ${profile.website || ""}`,
        xMm: 8,
        yMm: isHoriz ? 36 : 46,
        widthMm: w - 16,
        heightMm: 9,
        fontFamily: "Montserrat, sans-serif",
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
        id: "b-qr",
        type: "qr",
        data: `BEGIN:VCARD
VERSION:3.0
FN:${profile.fullName}
ORG:${profile.companyName}
TITLE:${profile.jobTitle}
TEL:${profile.phone}
EMAIL:${profile.email}
URL:${profile.website}
END:VCARD`,
        qrType: "vcard",
        xMm: (w - 24) / 2,
        yMm: (h - 32) / 2,
        widthMm: 24,
        heightMm: 24,
        foregroundColor: "#0F172A",
        backgroundColor: "#FFFFFF",
        zIndex: 1
      },
      {
        id: "b-label",
        type: "text",
        content: "SCAN TO SAVE CONTACT (vCard)",
        xMm: 4,
        yMm: (h - 32) / 2 + 26,
        widthMm: w - 8,
        heightMm: 4,
        fontFamily: "Montserrat, sans-serif",
        fontSizePt: 5,
        fontWeight: "700",
        color: "#2563EB",
        align: "center",
        letterSpacingMm: 0.3,
        zIndex: 2
      }
    ];
    return {
      front: { elements: frontElements, backgroundColor: "#FFFFFF" },
      back: { elements: backElements, backgroundColor: "#F8FAFC" }
    };
  }
};
