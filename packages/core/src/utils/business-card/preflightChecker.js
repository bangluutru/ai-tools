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
        title: "\u6C0F\u540D\u304C\u672A\u5165\u529B\u3067\u3059",
        titleJp: "\u6C0F\u540D\uFF08\u307E\u305F\u306F\u4EE3\u8868\u8005\u540D\uFF09\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093",
        description: "\u540D\u523A\u306E\u6700\u3082\u57FA\u672C\u7684\u306A\u60C5\u5831\u3067\u3042\u308B\u6C0F\u540D\u304C\u7A7A\u6B04\u3067\u3059\u3002",
        descriptionJp: "\u540D\u523A\u306E\u6700\u3082\u57FA\u672C\u7684\u306A\u60C5\u5831\u3067\u3042\u308B\u6C0F\u540D\u304C\u7A7A\u6B04\u3067\u3059\u3002\u5370\u5237\u524D\u306B\u6C0F\u540D\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
        side: "front",
        autoFixAvailable: false
      });
    }
    if (!project.profile.companyName || project.profile.companyName.trim() === "") {
      issues.push({
        id: "issue-no-company",
        severity: "warning",
        ruleCode: "REQUIRED_FIELD_MISSING",
        title: "\u4F1A\u793E\u540D\u30FB\u7D44\u7E54\u540D\u304C\u7A7A\u6B04\u3067\u3059",
        titleJp: "\u4F1A\u793E\u540D\u307E\u305F\u306F\u5C4B\u53F7\u304C\u672A\u8A2D\u5B9A\u3067\u3059",
        description: "\u4F1A\u793E\u540D\u3084\u5C4B\u53F7\u304C\u5165\u529B\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002\u500B\u4EBA\u540D\u523A\u306E\u5834\u5408\u306F\u554F\u984C\u3042\u308A\u307E\u305B\u3093\u3002",
        descriptionJp: "\u7D44\u7E54\u540D\u304C\u672A\u5165\u529B\u3067\u3059\u3002\u500B\u4EBA\u540D\u523A\u30FB\u30D5\u30EA\u30FC\u30E9\u30F3\u30B9\u540D\u523A\u306E\u5834\u5408\u306F\u3053\u306E\u307E\u307E\u3067\u3082\u5370\u5237\u53EF\u80FD\u3067\u3059\u3002",
        side: "front",
        autoFixAvailable: false
      });
    }
    if (!project.profile.email && !project.profile.phone) {
      issues.push({
        id: "issue-no-contact",
        severity: "critical",
        ruleCode: "REQUIRED_FIELD_MISSING",
        title: "\u9023\u7D61\u5148\u304C\u3042\u308A\u307E\u305B\u3093",
        titleJp: "\u96FB\u8A71\u756A\u53F7\u307E\u305F\u306F\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9\u304C\u672A\u5165\u529B\u3067\u3059",
        description: "\u540D\u523A\u53D7\u53D6\u4EBA\u304C\u9023\u7D61\u3092\u53D6\u308B\u305F\u3081\u306E\u96FB\u8A71\u307E\u305F\u306F\u30E1\u30FC\u30EB\u304C\u3042\u308A\u307E\u305B\u3093\u3002",
        descriptionJp: "\u96FB\u8A71\u756A\u53F7\u307E\u305F\u306F\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9\u306E\u3044\u305A\u308C\u304B\u3092\u8A18\u8F09\u3059\u308B\u3053\u3068\u3092\u5F37\u304F\u63A8\u5968\u3057\u307E\u3059\u3002",
        side: "front",
        autoFixAvailable: false
      });
    }
    const inspectSide = (elements, sideName) => {
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
              title: "\u8981\u7D20\u304C\u5370\u5237\u53EF\u80FD\u9818\u57DF\u306E\u5916\u5074\u306B\u3042\u308A\u307E\u3059",
              titleJp: `\u8981\u7D20\u304C\u30A2\u30FC\u30C8\u30DC\u30FC\u30C9\u5916\u306B\u914D\u7F6E\u3055\u308C\u3066\u3044\u307E\u3059 (${sideName === "front" ? "\u8868\u9762" : "\u88CF\u9762"})`,
              description: "\u8981\u7D20\u304C\u5370\u5237\u67A0\u3092\u5B8C\u5168\u306B\u8D85\u3048\u3066\u3044\u307E\u3059\u3002\u65AD\u88C1\u6642\u306B\u6B20\u843D\u3059\u308B\u6050\u308C\u304C\u3042\u308A\u307E\u3059\u3002",
              descriptionJp: `\u65AD\u88C1\u6642\u306B\u5B8C\u5168\u306B\u5207\u308A\u843D\u3068\u3055\u308C\u308B\u4F4D\u7F6E\u306B\u3042\u308A\u307E\u3059\u3002\u30A2\u30FC\u30C8\u30DC\u30FC\u30C9\u5185\u306B\u79FB\u52D5\u3057\u3066\u304F\u3060\u3055\u3044\u3002`,
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
                title: "\u6587\u5B57\u30FB\u30ED\u30B4\u304C\u65AD\u88C1\u30DE\u30FC\u30B8\u30F3\u306B\u8FD1\u3059\u304E\u307E\u3059",
                titleJp: `\u30BB\u30FC\u30D5\u30A8\u30EA\u30A2\u9055\u53CD\uFF08\u4ED5\u4E0A\u304C\u308A\u7DDA\u3088\u308A3mm\u4EE5\u5185\uFF09`,
                description: "\u5370\u5237\u6240\u306E\u65AD\u88C1\u6642\u306B\u5203\u306E\u30BA\u30EC\uFF08\u6700\u59271\u301C2mm\uFF09\u306B\u3088\u3063\u3066\u6587\u5B57\u304C\u5207\u308C\u308B\u5371\u967A\u304C\u3042\u308A\u307E\u3059\u3002",
                descriptionJp: "\u5370\u5237\u6240\u306E\u65AD\u88C1\u30BA\u30EC\u306B\u3088\u308A\u6587\u5B57\u3084\u30ED\u30B4\u304C\u5207\u308C\u308B\u5371\u967A\u6027\u304C\u3042\u308A\u307E\u3059\u30023mm\u5185\u5074\u306B\u53CE\u3081\u3066\u304F\u3060\u3055\u3044\u3002",
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
              title: "\u30D5\u30A9\u30F3\u30C8\u30B5\u30A4\u30BA\u304C\u6975\u7AEF\u306B\u5C0F\u3055\u3044\u3067\u3059",
              titleJp: `\u6587\u5B57\u30B5\u30A4\u30BA\u8B66\u544A: ${el.fontSizePt}pt (\u63A8\u5968 5.5pt\u4EE5\u4E0A)`,
              description: "5pt\u672A\u6E80\u306E\u6975\u5C0F\u6587\u5B57\u306F\u3001\u5370\u5237\u6642\u306B\u6587\u5B57\u304C\u304B\u3059\u308C\u305F\u308A\u6F70\u308C\u3066\u8AAD\u3081\u306A\u304F\u306A\u308B\u53EF\u80FD\u6027\u304C\u3042\u308A\u307E\u3059\u3002",
              descriptionJp: "5pt\u672A\u6E80\u306E\u6587\u5B57\u306F\u5B9F\u969B\u306E\u5370\u5237\u7269\u3067\u8996\u8A8D\u56F0\u96E3\u3068\u306A\u308A\u307E\u3059\u3002\u30D5\u30A9\u30F3\u30C8\u30B5\u30A4\u30BA\u3092\u62E1\u5927\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
              side: sideName,
              elementId: el.id,
              autoFixAvailable: true
            });
          } else if (el.fontSizePt < 5.5) {
            issues.push({
              id: `issue-font-size-warn-${el.id}`,
              severity: "info",
              ruleCode: "MIN_FONT_SIZE",
              title: "\u30D5\u30A9\u30F3\u30C8\u30B5\u30A4\u30BA\u304C\u5C0F\u3055\u3081\u3067\u3059",
              titleJp: `\u6587\u5B57\u30B5\u30A4\u30BA\u5FAE\u5C0F: ${el.fontSizePt}pt`,
              description: "5.5pt\u524D\u5F8C\u306E\u6587\u5B57\u306F\u9AD8\u9F62\u306E\u65B9\u306A\u3069\u306B\u306F\u5C11\u3057\u8AAD\u307F\u306B\u304F\u3044\u5834\u5408\u304C\u3042\u308A\u307E\u3059\u3002",
              descriptionJp: "\u91CD\u8981\u4E8B\u9805\u306F6pt\u4EE5\u4E0A\u3001\u88DC\u8DB3\u4F4F\u6240\u3067\u30825.5pt\u4EE5\u4E0A\u3092\u63A8\u5968\u3057\u307E\u3059\u3002",
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
              title: "QR\u30B3\u30FC\u30C9\u306E\u30B5\u30A4\u30BA\u304C\u5C0F\u3055\u3059\u304E\u307E\u3059",
              titleJp: `QR\u30B3\u30FC\u30C9\u8B66\u544A: ${el.widthMm}mm (\u63A8\u5968 10mm\u4EE5\u4E0A)`,
              description: "10mm\u672A\u6E80\u306EQR\u30B3\u30FC\u30C9\u306F\u30B9\u30DE\u30FC\u30C8\u30D5\u30A9\u30F3\u306E\u30AB\u30E1\u30E9\u3067\u8AAD\u307F\u53D6\u308C\u306A\u3044\u4E8B\u6545\u304C\u591A\u767A\u3057\u307E\u3059\u3002",
              descriptionJp: "\u5370\u5237\u6642\u306E\u30A4\u30F3\u30AF\u306B\u3058\u307F\u7B49\u3092\u8003\u616E\u3057\u3001\u6700\u4F4E10mm\xD710mm\uFF08\u63A8\u596812mm\u4EE5\u4E0A\uFF09\u306B\u8A2D\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
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
