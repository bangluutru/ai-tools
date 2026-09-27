import JSZip from "jszip";
import { BusinessCardPdfExporter, computePrintLayout } from "./pdfExporter.js";
import { PreflightVerificationService } from "./preflightChecker.js";

/**
 * Triggers a browser download for a Blob. The object URL is revoked after a delay
 * (revoking synchronously right after click() can cancel the download in Safari/Firefox).
 */
export function downloadBlob(blob, filename, revokeDelayMs = 3e4) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), revokeDelayMs);
}

/** Builds the manifest describing the bundle. Only facts about the generated files — no order/paper data. */
export function buildPrintManifest(project, layout, preflight, generatedAt = new Date()) {
  return {
    version: "2.0",
    generator: "Toolio Business Card Studio",
    generatedAt: generatedAt.toISOString(),
    cardSpecification: {
      finishedDimensionsMm: { width: layout.trimW, height: layout.trimH },
      artworkWithBleedDimensionsMm: { width: layout.artW, height: layout.artH },
      pdfPageDimensionsMm: { width: layout.pageW, height: layout.pageH },
      bleedEachEdgeMm: layout.bleed,
      cropMarks: layout.mode === "tonbo" ? "japanese-corner-and-center (outer margin)" : "none",
      safeMarginMm: project.dimension.safeMarginMm,
      orientation: project.orientation,
      pages: project.isDoubleSided ? 2 : 1,
      imageType: "raster",
      resolutionDpi: 300,
      colorSpace: "sRGB"
    },
    cardholderSummary: {
      companyName: project.profile.companyName,
      personName: project.profile.fullName
    },
    preflightVerification: {
      passed: preflight.passed,
      score: preflight.score,
      issuesCount: preflight.issues.length,
      verifiedAt: generatedAt.toISOString()
    },
    files: {
      printReadyPdf: PDF_FILENAME,
      previewFront: "proof_front_trim_size.png",
      previewBack: project.isDoubleSided ? "proof_back_trim_size.png" : void 0
    }
  };
}

const PDF_FILENAME = "print_artwork_bleed_tonbo_300dpi.pdf";

export class PrintPackageService {
  /**
   * Generates a print submission bundle (ZIP): PDF (300 DPI raster, bleed + トンボ), PNG proofs, manifest, README.
   */
  static async createPrintBundleZip(project, options = {}) {
    const zip = new JSZip();
    const layout = computePrintLayout(project, { mode: options.mode || "tonbo" });
    const pdfDoc = await BusinessCardPdfExporter.generatePrintPdf(project, { mode: layout.mode });
    zip.file(PDF_FILENAME, pdfDoc.output("blob"));
    zip.file("proof_front_trim_size.png", await BusinessCardPdfExporter.generateProofPngBlob(project, "front"));
    if (project.isDoubleSided) {
      zip.file("proof_back_trim_size.png", await BusinessCardPdfExporter.generateProofPngBlob(project, "back"));
    }
    const preflight = PreflightVerificationService.inspect(project);
    const manifest = buildPrintManifest(project, layout, preflight);
    zip.file("manifest.json", JSON.stringify(manifest, null, 2));
    const spec = manifest.cardSpecification;
    const readmeText = `# 入稿データ説明 (Toolio Business Card Studio)

■ 案件名: ${project.title}
■ 作成日時: ${(/* @__PURE__ */ new Date()).toLocaleString("ja-JP")}

【同梱ファイル】
1. ${PDF_FILENAME}
   - 仕上がり: ${spec.finishedDimensionsMm.width} \xD7 ${spec.finishedDimensionsMm.height} mm / 塗り足し込み: ${spec.artworkWithBleedDimensionsMm.width} \xD7 ${spec.artworkWithBleedDimensionsMm.height} mm
   - PDFページ: ${spec.pdfPageDimensionsMm.width} \xD7 ${spec.pdfPageDimensionsMm.height} mm（トンボは塗り足しの外側余白に配置）
   - 300 DPI ラスター画像（RGB）。ベクターデータではありません。
   - ページ数: ${spec.pages} (${project.isDoubleSided ? "両面" : "片面"})

2. proof_front_trim_size.png / proof_back_trim_size.png
   - 仕上がりサイズの確認用画像 (300 DPI)

3. manifest.json
   - 上記ファイルの仕様メモ（入稿時の参考用）

※ 用紙・数量・加工は各印刷所の注文画面で指定してください。入稿規定（CMYK変換・トンボの要否など）は印刷所ごとに確認してください。

【事前チェック】
・Preflight: ${preflight.passed ? "合格 (Pass)" : "要確認 (Warnings)"} / ${preflight.score}/100
`;
    zip.file("README.txt", readmeText);
    return await zip.generateAsync({ type: "blob" });
  }
  /**
   * Triggers browser download for a Blob
   */
  static triggerDownload(blob, filename) {
    downloadBlob(blob, filename);
  }
}
