export class PreflightVerificationService {
  /**
   * Evaluates a CardProject against commercial print standards
   */
  static inspect(project) {
    const issues = [];
    const dim = project.dimension;
    const isHoriz = project.orientation === "horizontal";
    const cardW = isHoriz ? dim.widthMm : dim.heightMm;
    const cardH = isHoriz ? dim.heightMm : dim.widthMm;
    const safeMargin = dim.safeMarginMm;
    if (!project.profile.fullName || project.profile.fullName.trim() === "") {
      issues.push({
        id: "issue-no-name",
        severity: "critical",
        ruleCode: "REQUIRED_FIELD_MISSING",
        title: "Full name is missing",
        titleVi: "Chưa nhập họ tên người dùng",
        titleEn: "Full name is missing",
        titleJp: "氏名（または代表者名）が設定されていません",
        description: "Full name is the primary information of a business card. Please enter it before printing.",
        descriptionVi: "Họ tên là thông tin cơ bản nhất của danh thiếp. Vui lòng nhập trước khi in ấn.",
        descriptionEn: "Full name is the primary information of a business card. Please enter it before printing.",
        descriptionJp: "名刺の最も基本的な情報である氏名が空欄です。印刷前に氏名を入力してください。",
        side: "front",
        autoFixAvailable: false
      });
    }
    if (!project.profile.companyName || project.profile.companyName.trim() === "") {
      issues.push({
        id: "issue-no-company",
        severity: "warning",
        ruleCode: "REQUIRED_FIELD_MISSING",
        title: "Company name is empty",
        titleVi: "Tên công ty / tổ chức đang để trống",
        titleEn: "Company name is empty",
        titleJp: "会社名または屋号が未設定です",
        description: "Company or studio name is not set. Individual cards can proceed without it.",
        descriptionVi: "Chưa nhập tên công ty hoặc thương hiệu. Nếu là danh thiếp cá nhân thì vẫn có thể in bình thường.",
        descriptionEn: "Company or studio name is not set. Individual cards can proceed without it.",
        descriptionJp: "組織名が未入力です。個人名刺・フリーランス名刺の場合はこのままでも印刷可能です。",
        side: "front",
        autoFixAvailable: false
      });
    }
    if (!project.profile.email && !project.profile.phone) {
      issues.push({
        id: "issue-no-contact",
        severity: "critical",
        ruleCode: "REQUIRED_FIELD_MISSING",
        title: "No contact details provided",
        titleVi: "Thiếu thông tin liên hệ (Email hoặc Số điện thoại)",
        titleEn: "No contact details provided",
        titleJp: "電話番号またはメールアドレスが未入力です",
        description: "Strongly recommended to include at least a phone number or email address.",
        descriptionVi: "Cần có ít nhất một phương thức liên lạc như số điện thoại hoặc email để đối tác liên hệ.",
        descriptionEn: "Strongly recommended to include at least a phone number or email address.",
        descriptionJp: "電話番号またはメールアドレスのいずれかを記載することを強く推奨します。",
        side: "front",
        autoFixAvailable: false
      });
    }
    const inspectSide = (elements, sideName) => {
      const sideLabelVi = sideName === "front" ? "Mặt trước" : "Mặt sau";
      const sideLabelEn = sideName === "front" ? "Front" : "Back";
      const sideLabelJp = sideName === "front" ? "表面" : "裏面";

      elements.forEach((el) => {
        const isDecorativeBackground = el.type === "shape" && el.xMm <= 0 && el.yMm <= 0 && el.widthMm >= cardW - 2;
        if (!isDecorativeBackground) {
          const elRight = el.xMm + el.widthMm;
          const elBottom = el.yMm + el.heightMm;
          if (el.xMm < -dim.bleedMm || el.yMm < -dim.bleedMm || elRight > cardW + dim.bleedMm || elBottom > cardH + dim.bleedMm) {
            issues.push({
              id: `issue-off-canvas-${el.id}`,
              severity: "critical",
              ruleCode: "OFF_CANVAS",
              title: `Element is outside printable area (${sideLabelEn})`,
              titleVi: `Phần tử nằm ngoài vùng in ấn (${sideLabelVi})`,
              titleEn: `Element is outside printable area (${sideLabelEn})`,
              titleJp: `要素がアートボード外に配置されています (${sideLabelJp})`,
              description: "Element extends completely beyond artboard boundaries and will be cut off.",
              descriptionVi: "Phần tử vượt ra ngoài khung in hoàn toàn. Nguy cơ bị cắt bỏ khi máy xén gia công thành phẩm.",
              descriptionEn: "Element extends completely beyond artboard boundaries and will be cut off.",
              descriptionJp: "断裁時に完全に切り落とされる位置にあります。アートボード内に移動してください。",
              side: sideName,
              elementId: el.id,
              autoFixAvailable: true
            });
          } else if (el.xMm < safeMargin || el.yMm < safeMargin || elRight > cardW - safeMargin || elBottom > cardH - safeMargin) {
            if (el.type === "text" || el.type === "qr" || el.type === "image" && el.isLogo) {
              issues.push({
                id: `issue-safe-area-${el.id}`,
                severity: "warning",
                ruleCode: "SAFE_AREA",
                title: `Text/Logo violates Safe Area (${sideLabelEn})`,
                titleVi: `Văn bản/Logo vi phạm vùng an toàn (${sideLabelVi})`,
                titleEn: `Text/Logo violates Safe Area (${sideLabelEn})`,
                titleJp: `セーフエリア違反（仕上がり線より3mm以内） (${sideLabelJp})`,
                description: "Less than 3mm from trim line. Printer cutting drift (1-2mm) may cut into text.",
                descriptionVi: "Cách mép cắt thành phẩm dưới 3mm. Sai số dịch chuyển của dao xén (1-2mm) có thể làm phạm vào chữ hoặc logo.",
                descriptionEn: "Less than 3mm from trim line. Printer mechanical cutting drift (1-2mm) may cut into text or logo.",
                descriptionJp: "印刷所の断裁ズレ（1〜2mm）により文字やロゴが切れる危険性があります。3mm内側に収めてください。",
                side: sideName,
                elementId: el.id,
                autoFixAvailable: true
              });
            }
          }
        }
        if (el.type === "text") {
          if (el.fontSizePt < 5) {
            issues.push({
              id: `issue-font-size-${el.id}`,
              severity: "critical",
              ruleCode: "MIN_FONT_SIZE",
              fontSizePt: el.fontSizePt,
              title: `Font size warning: ${el.fontSizePt}pt (Recommended ≥ 5.5pt)`,
              titleVi: `Cỡ chữ cảnh báo: ${el.fontSizePt}pt (Khuyến nghị ≥ 5.5pt)`,
              titleEn: `Font size warning: ${el.fontSizePt}pt (Recommended ≥ 5.5pt)`,
              titleJp: `文字サイズ警告: ${el.fontSizePt}pt (推奨 5.5pt以上)`,
              description: "Text smaller than 5pt is difficult to read and risks blotching during printing.",
              descriptionVi: "Chữ dưới 5pt rất dễ bị nhòe mực hoặc mất nét khi in ấn thực tế. Vui lòng tăng cỡ chữ.",
              descriptionEn: "Text smaller than 5pt is difficult to read and risks blotching during printing.",
              descriptionJp: "5pt未満の文字は実際の印刷物で視認困難となります。フォントサイズを拡大してください。",
              side: sideName,
              elementId: el.id,
              autoFixAvailable: true
            });
          } else if (el.fontSizePt < 5.5) {
            issues.push({
              id: `issue-font-size-warn-${el.id}`,
              severity: "info",
              ruleCode: "MIN_FONT_SIZE",
              fontSizePt: el.fontSizePt,
              title: `Font size is small: ${el.fontSizePt}pt`,
              titleVi: `Cỡ chữ hơi nhỏ: ${el.fontSizePt}pt`,
              titleEn: `Font size is small: ${el.fontSizePt}pt`,
              titleJp: `文字サイズ微小: ${el.fontSizePt}pt`,
              description: "Key details should be 6pt or larger; secondary address details at least 5.5pt.",
              descriptionVi: "Thông tin quan trọng nên từ 6pt trở lên; địa chỉ và chú thích phụ tối thiểu 5.5pt.",
              descriptionEn: "Key details should be 6pt or larger; secondary address details at least 5.5pt.",
              descriptionJp: "重要事項は6pt以上、補足住所でも5.5pt以上を推奨します。",
              side: sideName,
              elementId: el.id,
              autoFixAvailable: false
            });
          }
        }
        if (el.type === "qr") {
          if (el.widthMm < 10 || el.heightMm < 10) {
            issues.push({
              id: `issue-qr-size-${el.id}`,
              severity: "critical",
              ruleCode: "QR_TOO_SMALL",
              widthMm: el.widthMm,
              title: `QR code warning: ${el.widthMm}mm (Recommended ≥ 10mm)`,
              titleVi: `Mã QR quá nhỏ: ${el.widthMm}mm (Khuyến nghị ≥ 10mm)`,
              titleEn: `QR code warning: ${el.widthMm}mm (Recommended ≥ 10mm)`,
              titleJp: `QRコード警告: ${el.widthMm}mm (推奨 10mm以上)`,
              description: "QR codes smaller than 10mm frequently fail to scan with smartphone cameras.",
              descriptionVi: "Mã QR dưới 10mm thường gây lỗi camera điện thoại không thể quét được sau khi in ấn.",
              descriptionEn: "QR codes smaller than 10mm frequently fail to scan with smartphone cameras.",
              descriptionJp: "10mm未満のQRコードは印刷時のインクにじみ等で読み取れない事故が多発します。",
              side: sideName,
              elementId: el.id,
              autoFixAvailable: true
            });
          }
        }
      });
    };
    inspectSide(project.front.elements, "front");
    if (project.isDoubleSided) {
      inspectSide(project.back.elements, "back");
    }
    const criticalCount = issues.filter((i) => i.severity === "critical").length;
    const warningCount = issues.filter((i) => i.severity === "warning").length;
    const rawScore = 100 - criticalCount * 20 - warningCount * 8;
    const score = Math.max(10, Math.min(100, rawScore));
    return {
      passed: criticalCount === 0,
      score,
      criticalCount,
      warningCount,
      issues
    };
  }
  /**
   * Applies 1-click automatic fix for an autoFixable issue
   */
  static applyAutoFix(project, issue) {
    const isHoriz = project.orientation === "horizontal";
    const cardW = isHoriz ? project.dimension.widthMm : project.dimension.heightMm;
    const cardH = isHoriz ? project.dimension.heightMm : project.dimension.widthMm;
    const safeMargin = project.dimension.safeMarginMm;
    const targetSide = issue.side === "front" ? project.front : project.back;
    const updatedElements = targetSide.elements.map((el) => {
      if (el.id !== issue.elementId) return el;
      const cloned = { ...el };
      switch (issue.ruleCode) {
        case "SAFE_AREA":
        case "OFF_CANVAS": {
          if (cloned.xMm < safeMargin) cloned.xMm = safeMargin;
          if (cloned.yMm < safeMargin) cloned.yMm = safeMargin;
          if (cloned.xMm + cloned.widthMm > cardW - safeMargin) {
            cloned.xMm = Math.max(safeMargin, cardW - safeMargin - cloned.widthMm);
          }
          if (cloned.yMm + cloned.heightMm > cardH - safeMargin) {
            cloned.yMm = Math.max(safeMargin, cardH - safeMargin - cloned.heightMm);
          }
          break;
        }
        case "MIN_FONT_SIZE": {
          if (cloned.type === "text") {
            cloned.fontSizePt = 6;
          }
          break;
        }
        case "QR_TOO_SMALL": {
          if (cloned.type === "qr") {
            cloned.widthMm = 12;
            cloned.heightMm = 12;
          }
          break;
        }
      }
      return cloned;
    });
    return {
      ...project,
      [issue.side]: {
        ...targetSide,
        elements: updatedElements
      }
    };
  }
}
