import { jsPDF } from "jspdf";
import { QrCodeService } from "./qrGenerator.js";
import { setPngDpiBytes } from "./pngDpi.js";

// Kích thước vùng lề ngoài chứa トンボ (tính từ mép bù xén), khoảng hở và chiều dài vạch.
export const CROP_MARK_MARGIN_MM = 10;
export const CROP_MARK_GAP_MM = 1;
export const CROP_MARK_LENGTH_MM = 8;
export const PRINT_MODES = ["tonbo", "bleed", "trim"];

function resolveMode(options = {}) {
  if (options.mode && PRINT_MODES.includes(options.mode)) return options.mode;
  if (options.includeBleed === false) return "trim";
  if (options.includeCropMarks === false) return "bleed";
  return "tonbo";
}

/**
 * Tính bố cục trang in (đơn vị mm):
 *  - "tonbo": trang = thành phẩm + 2×(bù xén + lề 10mm); ảnh (kèm bù xén) đặt lệch vào trong,
 *    トンボ góc (đường thành phẩm + đường bù xén) và トンボ giữa chỉ nằm ở lề ngoài, cách mép bù xén 1mm.
 *  - "bleed": trang = thành phẩm + 2×bù xén (VD 97×61 cho 91×55), không có トンボ.
 *  - "trim" : trang = kích thước thành phẩm.
 */
export function computePrintLayout(project, options = {}) {
  const dim = project.dimension;
  const isHoriz = project.orientation === "horizontal";
  const trimW = isHoriz ? dim.widthMm : dim.heightMm;
  const trimH = isHoriz ? dim.heightMm : dim.widthMm;
  const mode = resolveMode(options);
  const bleed = mode === "trim" ? 0 : dim.bleedMm || 0;
  const margin = mode === "tonbo" ? CROP_MARK_MARGIN_MM : 0;
  const artX = margin;
  const artY = margin;
  const artW = trimW + bleed * 2;
  const artH = trimH + bleed * 2;
  const pageW = artW + margin * 2;
  const pageH = artH + margin * 2;
  const trimX = artX + bleed;
  const trimY = artY + bleed;
  const marks = [];
  if (mode === "tonbo") {
    const gap = CROP_MARK_GAP_MM;
    const len = Math.min(CROP_MARK_LENGTH_MM, margin - gap);
    const left = artX;
    const right = artX + artW;
    const top = artY;
    const bottom = artY + artH;
    // Corner marks: at each corner, inner = trim line, outer = bleed line (二重トンボ)
    const xLines = [trimX, left, trimX + trimW, right];
    const yLines = [trimY, top, trimY + trimH, bottom];
    // vertical ticks (x = const) above the top edge and below the bottom edge
    for (const x of xLines) {
      marks.push({ x1: x, y1: top - gap - len, x2: x, y2: top - gap, kind: "corner" });
      marks.push({ x1: x, y1: bottom + gap, x2: x, y2: bottom + gap + len, kind: "corner" });
    }
    // horizontal ticks (y = const) left of the left edge and right of the right edge
    for (const y of yLines) {
      marks.push({ x1: left - gap - len, y1: y, x2: left - gap, y2: y, kind: "corner" });
      marks.push({ x1: right + gap, y1: y, x2: right + gap + len, y2: y, kind: "corner" });
    }
    // Center marks (センタートンボ): a "+" shape centred in each margin
    const cx = trimX + trimW / 2;
    const cy = trimY + trimH / 2;
    const half = Math.min(4, len / 2);
    const midTop = top - gap - len / 2;
    const midBottom = bottom + gap + len / 2;
    const midLeft = left - gap - len / 2;
    const midRight = right + gap + len / 2;
    marks.push({ x1: cx, y1: top - gap - len, x2: cx, y2: top - gap, kind: "center" });
    marks.push({ x1: cx - half, y1: midTop, x2: cx + half, y2: midTop, kind: "center" });
    marks.push({ x1: cx, y1: bottom + gap, x2: cx, y2: bottom + gap + len, kind: "center" });
    marks.push({ x1: cx - half, y1: midBottom, x2: cx + half, y2: midBottom, kind: "center" });
    marks.push({ x1: left - gap - len, y1: cy, x2: left - gap, y2: cy, kind: "center" });
    marks.push({ x1: midLeft, y1: cy - half, x2: midLeft, y2: cy + half, kind: "center" });
    marks.push({ x1: right + gap, y1: cy, x2: right + gap + len, y2: cy, kind: "center" });
    marks.push({ x1: midRight, y1: cy - half, x2: midRight, y2: cy + half, kind: "center" });
  }
  return { mode, pageW, pageH, artX, artY, artW, artH, trimX, trimY, trimW, trimH, bleed, margin, marks };
}

/** Collects the CSS font strings ("700 16px \"Noto Sans JP\", sans-serif") used by text elements. */
export function collectFontDescriptors(sides) {
  const set = new Set();
  for (const side of sides) {
    for (const el of side?.elements || []) {
      if (el.type === "text" && el.fontFamily) {
        set.add(`${el.fontWeight || "normal"} 16px ${el.fontFamily}`);
      }
    }
  }
  return [...set];
}

/** Waits (max ~6s) until every web font used by the given sides is loaded, so canvas text is not rendered with a fallback font. */
export async function ensureFontsLoaded(sides, timeoutMs = 6e3) {
  if (typeof document === "undefined" || !document.fonts?.load) return;
  const descriptors = collectFontDescriptors(sides);
  const sample = "\u3042\u6F22Aa1";
  const loadAll = Promise.all(descriptors.map((d) => document.fonts.load(d, sample).catch(() => null)));
  await Promise.race([loadAll, new Promise((resolve) => setTimeout(resolve, timeoutMs))]);
  await document.fonts.ready;
}

export class BusinessCardPdfExporter {
  /**
   * Draws Japanese crop marks (トンボ) from a computed layout — marks sit in the outer margin only.
   */
  static drawJapaneseCropMarks(doc, layout) {
    if (!layout?.marks?.length) return;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.1);
    for (const m of layout.marks) {
      doc.line(m.x1, m.y1, m.x2, m.y2);
    }
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
    await ensureFontsLoaded([side]);
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
  /** Adds one rendered side as a page using the given layout. */
  static async addSidePage(doc, side, project, layout, isFirstPage) {
    const orientation = layout.pageW >= layout.pageH ? "landscape" : "portrait";
    if (!isFirstPage) doc.addPage([layout.pageW, layout.pageH], orientation);
    const canvas = await this.renderSideToCanvas(side, project, {
      includeBleed: layout.bleed > 0,
      scale: 3.125
    });
    // Ảnh raster 300 DPI (JPEG chất lượng cao) — không phải PDF vector
    doc.addImage(canvas.toDataURL("image/jpeg", 0.98), "JPEG", layout.artX, layout.artY, layout.artW, layout.artH);
    this.drawJapaneseCropMarks(doc, layout);
  }
  static createDoc(layout) {
    return new jsPDF({
      orientation: layout.pageW >= layout.pageH ? "landscape" : "portrait",
      unit: "mm",
      format: [layout.pageW, layout.pageH],
      compress: true
    });
  }
  static setDocProperties(doc, project, layout) {
    const modeLabel = layout.mode === "tonbo" ? `bleed ${layout.bleed}mm + crop marks` : layout.mode === "bleed" ? `bleed ${layout.bleed}mm, no crop marks` : "trim size";
    doc.setProperties({
      title: `${project.title || "Business card"} - Print Artwork`,
      subject: `Business card ${layout.trimW}x${layout.trimH}mm (${modeLabel}), 300 DPI raster image`,
      author: "Toolio",
      keywords: "Business Card, Meishi, 300 DPI",
      creator: "Toolio Business Card Studio"
    });
  }
  /**
   * Generates a print PDF (300 DPI raster artwork).
   * options.mode: "tonbo" (bleed + トンボ in an outer margin, default) | "bleed" (bleed only, e.g. 97×61mm) | "trim"
   */
  static async generatePrintPdf(project, options = {}) {
    const layout = computePrintLayout(project, options);
    await ensureFontsLoaded([project.front, project.isDoubleSided ? project.back : null].filter(Boolean));
    const doc = this.createDoc(layout);
    await this.addSidePage(doc, project.front, project, layout, true);
    if (project.isDoubleSided) {
      await this.addSidePage(doc, project.back, project, layout, false);
    }
    this.setDocProperties(doc, project, layout);
    return doc;
  }
  /**
   * Generates one PDF containing the cards of several projects (batch employees).
   */
  static async generateBatchPdf(projects, options = {}, onProgress) {
    if (!projects.length) throw new Error("NO_PROJECTS");
    const layout = computePrintLayout(projects[0], options);
    const doc = this.createDoc(layout);
    let first = true;
    for (let i = 0; i < projects.length; i++) {
      onProgress?.(i + 1, projects.length);
      const p = projects[i];
      await this.addSidePage(doc, p.front, p, layout, first);
      first = false;
      if (p.isDoubleSided) {
        await this.addSidePage(doc, p.back, p, layout, false);
      }
    }
    this.setDocProperties(doc, projects[0], layout);
    return doc;
  }
  /**
   * Generates a 300 DPI PNG proof (trim size) as a Blob, with pHYs DPI metadata.
   */
  static async generateProofPngBlob(project, side) {
    const targetSide = side === "front" ? project.front : project.back;
    const canvas = await this.renderSideToCanvas(targetSide, project, {
      includeBleed: false,
      scale: 3.125
      // 300 DPI
    });
    const raw = await new Promise((resolve, reject) => {
      canvas.toBlob((b) => b ? resolve(b) : reject(new Error("CANVAS_EXPORT_FAILED")), "image/png");
    });
    const bytes = setPngDpiBytes(new Uint8Array(await raw.arrayBuffer()), 300);
    return new Blob([bytes], { type: "image/png" });
  }
}
