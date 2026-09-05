import { jsPDF } from "jspdf";
import { QrCodeService } from "./qrGenerator.js";
export class BusinessCardPdfExporter {
  /**
   * Draws Japanese Standard Crop Marks (トンボ / Tonbo)
   */
  static drawJapaneseCropMarks(doc, w, h, bleed) {
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.1);
    const markLen = 3;
    doc.line(bleed, 0, bleed, markLen);
    doc.line(0, bleed, markLen, bleed);
    doc.line(0, 0, 0, markLen);
    doc.line(0, 0, markLen, 0);
    const rX = w - bleed;
    doc.line(rX, 0, rX, markLen);
    doc.line(w - markLen, bleed, w, bleed);
    doc.line(w, 0, w, markLen);
    doc.line(w - markLen, 0, w, 0);
    const bY = h - bleed;
    doc.line(bleed, h - markLen, bleed, h);
    doc.line(0, bY, markLen, bY);
    doc.line(0, h - markLen, 0, h);
    doc.line(0, h, markLen, h);
    doc.line(rX, h - markLen, rX, h);
    doc.line(w - markLen, bY, w, bY);
    doc.line(w, h - markLen, w, h);
    doc.line(w - markLen, h, w, h);
    const midX = w / 2;
    const midY = h / 2;
    doc.line(midX, 0, midX, markLen);
    doc.line(midX, h - markLen, midX, h);
    doc.line(0, midY, markLen, midY);
    doc.line(w - markLen, midY, w, midY);
  }
  /**
   * Renders a single CardSide onto a high-res HTML5 Canvas buffer
   */
  static async renderSideToCanvas(side, project, options) {
    const scale = options.scale || 3.125;
    const dim = project.dimension;
    const isHoriz = project.orientation === "horizontal";
    const rawW = isHoriz ? dim.widthMm : dim.heightMm;
    const rawH = isHoriz ? dim.heightMm : dim.widthMm;
    const bleed = options.includeBleed ? dim.bleedMm : 0;
    const totalWMm = rawW + bleed * 2;
    const totalHMm = rawH + bleed * 2;
    const mmToPx = 3.7795275591;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(totalWMm * mmToPx * scale);
    canvas.height = Math.round(totalHMm * mmToPx * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context unavailable");
    ctx.scale(scale * mmToPx, scale * mmToPx);
    if (typeof document !== "undefined" && document.fonts) {
      await document.fonts.ready;
    }
    ctx.fillStyle = side.backgroundColor || "#ffffff";
    ctx.fillRect(0, 0, totalWMm, totalHMm);
    if (side.paperTexture === "washi") {
      ctx.save();
      ctx.fillStyle = "rgba(180, 170, 155, 0.04)";
      const stepMm = 4;
      for (let tx = 0; tx < totalWMm; tx += stepMm) {
        for (let ty = 0; ty < totalHMm; ty += stepMm) {
          if ((Math.floor(tx / stepMm) + Math.floor(ty / stepMm)) % 2 === 0) {
            ctx.fillRect(tx, ty, stepMm, stepMm);
          }
        }
      }
      ctx.restore();
    } else if (side.paperTexture === "kraft") {
      ctx.save();
      ctx.fillStyle = "rgba(120, 80, 40, 0.05)";
      const stepMm = 2;
      for (let tx = 0; tx < totalWMm; tx += stepMm) {
        for (let ty = 0; ty < totalHMm; ty += stepMm) {
          if ((tx * 7 + ty * 13) % 5 === 0) {
            ctx.fillRect(tx, ty, 0.3, 0.3);
          }
        }
      }
      ctx.restore();
    }
    ctx.save();
    if (bleed > 0) {
      ctx.translate(bleed, bleed);
    }
    const sorted = [...side.elements].sort((a, b) => a.zIndex - b.zIndex);
    for (const el of sorted) {
      ctx.save();
      ctx.globalAlpha = el.opacity ?? 1;
      if (el.type === "shape") {
        ctx.fillStyle = el.fill || "transparent";
        if (el.stroke) {
          ctx.strokeStyle = el.stroke;
          ctx.lineWidth = el.strokeWidthMm || 0.2;
        }
        if (el.shapeType === "circle") {
          ctx.beginPath();
          ctx.arc(el.xMm + el.widthMm / 2, el.yMm + el.heightMm / 2, el.widthMm / 2, 0, Math.PI * 2);
          ctx.fill();
          if (el.stroke) ctx.stroke();
        } else if (el.shapeType === "rounded-rect") {
          const r = el.borderRadiusMm || 1;
          ctx.beginPath();
          ctx.roundRect(el.xMm, el.yMm, el.widthMm, el.heightMm, r);
          ctx.fill();
          if (el.stroke) ctx.stroke();
        } else {
          ctx.fillRect(el.xMm, el.yMm, el.widthMm, el.heightMm);
          if (el.stroke) ctx.strokeRect(el.xMm, el.yMm, el.widthMm, el.heightMm);
        }
      } else if (el.type === "line") {
        ctx.strokeStyle = el.stroke || "#000000";
        ctx.lineWidth = el.strokeWidthMm || 0.2;
        if (el.dashed) ctx.setLineDash([1, 1]);
        ctx.beginPath();
        ctx.moveTo(el.xMm, el.yMm);
        if (el.widthMm > el.heightMm) {
          ctx.lineTo(el.xMm + el.widthMm, el.yMm);
        } else {
          ctx.lineTo(el.xMm, el.yMm + el.heightMm);
        }
        ctx.stroke();
      } else if (el.type === "text") {
        ctx.fillStyle = el.color || "#000000";
        const fontSizeMm = el.fontSizePt * 0.352778;
        ctx.font = `${el.fontWeight || "normal"} ${fontSizeMm}px ${el.fontFamily}`;
        ctx.textAlign = el.align || "left";
        ctx.textBaseline = "top";
        if (el.verticalWriting) {
          const chars = Array.from(el.content);
          let currY = el.yMm;
          const charSpacing = el.fontSizePt * 0.352778 * (el.lineHeightRatio || 1.3);
          for (const char of chars) {
            let anchorX = el.xMm + el.widthMm / 2;
            if (el.align === "left") anchorX = el.xMm;
            if (el.align === "right") anchorX = el.xMm + el.widthMm;
            ctx.fillText(char, anchorX, currY);
            currY += charSpacing;
          }
        } else {
          const lines = BusinessCardPdfExporter.wrapTextLines(ctx, el.content, el.widthMm);
          const lineH = el.fontSizePt * 0.352778 * (el.lineHeightRatio || 1.25);
          lines.forEach((line, idx) => {
            let anchorX = el.xMm;
            if (el.align === "center") anchorX = el.xMm + el.widthMm / 2;
            if (el.align === "right") anchorX = el.xMm + el.widthMm;
            ctx.fillText(line, anchorX, el.yMm + idx * lineH);
          });
        }
      } else if (el.type === "qr") {
        const qrDataUrl = await QrCodeService.generateQrDataUrl(
          el.data,
          el.foregroundColor || "#000000",
          el.backgroundColor || "#ffffff"
        );
        if (qrDataUrl) {
          await new Promise((resolve) => {
            const qrImg = new Image();
            qrImg.onload = () => {
              ctx.drawImage(qrImg, el.xMm, el.yMm, el.widthMm, el.heightMm);
              resolve();
            };
            qrImg.onerror = () => resolve();
            qrImg.src = qrDataUrl;
          });
        }
      } else if (el.type === "image" && el.src) {
        await new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, el.xMm, el.yMm, el.widthMm, el.heightMm);
            resolve();
          };
          img.onerror = () => resolve();
          img.src = el.src;
        });
      }
      ctx.restore();
    }
    ctx.restore();
    return canvas;
  }
  /**
   * Intelligently wraps text lines within a maximum millimeter width,
   * faithfully reproducing CJK and Latin browser CSS pre-wrap behavior.
   */
  static wrapTextLines(ctx, text, maxMm) {
    if (!text) return [""];
    const paragraphs = text.split("\n");
    const result = [];
    for (const para of paragraphs) {
      if (!para) {
        result.push("");
        continue;
      }
      const tokens = [];
      let currentWord = "";
      for (const char of Array.from(para)) {
        const isCJK = /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/.test(char);
        if (isCJK) {
          if (currentWord) {
            tokens.push(currentWord);
            currentWord = "";
          }
          tokens.push(char);
        } else if (char === " ") {
          currentWord += " ";
          tokens.push(currentWord);
          currentWord = "";
        } else {
          currentWord += char;
        }
      }
      if (currentWord) {
        tokens.push(currentWord);
      }
      let currentLine = "";
      for (const token of tokens) {
        const candidate = currentLine ? currentLine + token : token;
        const width = ctx.measureText(candidate).width;
        if (width <= maxMm || !currentLine) {
          if (width <= maxMm) {
            currentLine = candidate;
          } else {
            for (const c of Array.from(token)) {
              const subCand = currentLine ? currentLine + c : c;
              if (ctx.measureText(subCand).width <= maxMm || !currentLine) {
                currentLine = subCand;
              } else {
                result.push(currentLine);
                currentLine = c;
              }
            }
          }
        } else {
          result.push(currentLine.trimEnd());
          if (ctx.measureText(token).width <= maxMm) {
            currentLine = token.startsWith(" ") ? token.trimStart() : token;
          } else {
            currentLine = "";
            for (const c of Array.from(token)) {
              const subCand = currentLine ? currentLine + c : c;
              if (ctx.measureText(subCand).width <= maxMm || !currentLine) {
                currentLine = subCand;
              } else {
                result.push(currentLine);
                currentLine = c;
              }
            }
          }
        }
      }
      if (currentLine) {
        result.push(currentLine.trimEnd());
      }
    }
    return result;
  }
  /**
   * Generates a commercial-grade Print-Ready PDF
   */
  static async generatePrintPdf(project, options = {
    includeBleed: true,
    includeCropMarks: true,
    dpi: 300,
    colorMode: "cmyk_simulation"
  }) {
    const dim = project.dimension;
    const isHoriz = project.orientation === "horizontal";
    const cardW = isHoriz ? dim.widthMm : dim.heightMm;
    const cardH = isHoriz ? dim.heightMm : dim.widthMm;
    const bleed = options.includeBleed ? dim.bleedMm : 0;
    const totalW = cardW + bleed * 2;
    const totalH = cardH + bleed * 2;
    const doc = new jsPDF({
      orientation: isHoriz ? "landscape" : "portrait",
      unit: "mm",
      format: [totalW, totalH],
      compress: true
    });
    const frontCanvas = await this.renderSideToCanvas(project.front, project, {
      includeBleed: options.includeBleed,
      scale: 3.125
    });
    const frontImgData = frontCanvas.toDataURL("image/jpeg", 0.98);
    doc.addImage(frontImgData, "JPEG", 0, 0, totalW, totalH);
    if (options.includeCropMarks && options.includeBleed) {
      this.drawJapaneseCropMarks(doc, totalW, totalH, bleed);
    }
    if (project.isDoubleSided) {
      doc.addPage([totalW, totalH], isHoriz ? "landscape" : "portrait");
      const backCanvas = await this.renderSideToCanvas(project.back, project, {
        includeBleed: options.includeBleed,
        scale: 3.125
      });
      const backImgData = backCanvas.toDataURL("image/jpeg", 0.98);
      doc.addImage(backImgData, "JPEG", 0, 0, totalW, totalH);
      if (options.includeCropMarks && options.includeBleed) {
        this.drawJapaneseCropMarks(doc, totalW, totalH, bleed);
      }
    }
    doc.setProperties({
      title: `${project.title || "Meishi"} - Print Artwork`,
      subject: `Print-ready business card (${totalW}x${totalH}mm with 3mm bleed)`,
      author: "Meishi Studio AI Name Card Maker",
      keywords: "Business Card, Meishi, Raksul, Graphic, Printpac, Bleed 3mm",
      creator: "Meishi Studio Production Engine"
    });
    return doc;
  }
  /**
   * Generates high-resolution PNG image proofs
   */
  static async generateProofPng(project, side) {
    const targetSide = side === "front" ? project.front : project.back;
    const canvas = await this.renderSideToCanvas(targetSide, project, {
      includeBleed: false,
      // Clean finished trim size for proof
      scale: 3.125
      // 300 DPI
    });
    return canvas.toDataURL("image/png");
  }
}
