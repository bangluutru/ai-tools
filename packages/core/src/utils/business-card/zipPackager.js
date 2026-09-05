import JSZip from "jszip";
import { BusinessCardPdfExporter } from "./pdfExporter.js";
import { PreflightVerificationService } from "./preflightChecker.js";
export class PrintPackageService {
  /**
   * Generates a complete Commercial Print Submission Bundle (ZIP)
   */
  static async createPrintBundleZip(project, orderSpec) {
    const zip = new JSZip();
    const pdfDoc = await BusinessCardPdfExporter.generatePrintPdf(project, {
      includeBleed: true,
      includeCropMarks: true,
      dpi: 300,
      colorMode: "cmyk_simulation"
    });
    const pdfBlob = pdfDoc.output("blob");
    zip.file("print_ready_artwork_bleed_3mm.pdf", pdfBlob);
    const frontProofUrl = await BusinessCardPdfExporter.generateProofPng(project, "front");
    const frontBlob = await (await fetch(frontProofUrl)).blob();
    zip.file("proof_front_trim_size.png", frontBlob);
    if (project.isDoubleSided) {
      const backProofUrl = await BusinessCardPdfExporter.generateProofPng(project, "back");
      const backBlob = await (await fetch(backProofUrl)).blob();
      zip.file("proof_back_trim_size.png", backBlob);
    }
    const preflight = PreflightVerificationService.inspect(project);
    const manifest = {
      version: "1.0",
      generator: "Meishi Studio AI Name Card Maker",
      generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      cardSpecification: {
        finishedDimensionsMm: {
          width: project.orientation === "horizontal" ? project.dimension.widthMm : project.dimension.heightMm,
          height: project.orientation === "horizontal" ? project.dimension.heightMm : project.dimension.widthMm
        },
        artworkWithBleedDimensionsMm: {
          width: (project.orientation === "horizontal" ? project.dimension.widthMm : project.dimension.heightMm) + project.dimension.bleedMm * 2,
          height: (project.orientation === "horizontal" ? project.dimension.heightMm : project.dimension.widthMm) + project.dimension.bleedMm * 2
        },
        bleedEachEdgeMm: project.dimension.bleedMm,
        safeMarginMm: project.dimension.safeMarginMm,
        orientation: project.orientation,
        pages: project.isDoubleSided ? 2 : 1,
        colorSpace: "CMYK_SIMULATION",
        targetPrinters: ["Raksul (\u30E9\u30AF\u30B9\u30EB)", "Graphic (\u30B0\u30E9\u30D5\u30A3\u30C3\u30AF)", "Printpac (\u30D7\u30EA\u30F3\u30C8\u30D1\u30C3\u30AF)"]
      },
      orderSpecification: {
        orderNumber: orderSpec?.orderNumber || `MS-${Date.now().toString().slice(-6)}`,
        quantity: orderSpec?.quantity || 100,
        paperType: orderSpec?.paper?.nameJp || "\u30DE\u30C3\u30C8\u30B3\u30FC\u30C8 220kg (\u6A19\u6E96\u30FB\u4E00\u756A\u4EBA\u6C17)",
        paperWeight: `${orderSpec?.paper?.weightGsm || 220}kg`,
        finishing: orderSpec?.finishing ? [orderSpec.finishing.nameJp] : ["\u901A\u5E38\u4ED5\u4E0A\u3052\uFF08\u89D2\u3042\u308A\uFF09"]
      },
      cardholderSummary: {
        companyName: project.profile.companyName,
        personName: project.profile.fullName,
        email: project.profile.email
      },
      preflightVerification: {
        passed: preflight.passed,
        issuesCount: preflight.issues.length,
        verifiedAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      files: {
        printReadyPdf: "print_ready_artwork_bleed_3mm.pdf",
        previewFront: "proof_front_trim_size.png",
        previewBack: project.isDoubleSided ? "proof_back_trim_size.png" : void 0
      }
    };
    zip.file("order_manifest.json", JSON.stringify(manifest, null, 2));
    const readmeText = `# \u5165\u7A3F\u30C7\u30FC\u30BF\u8AAC\u660E\u66F8 (Meishi Studio Print Package)

\u25A0 \u6848\u4EF6\u540D: ${project.title}
\u25A0 \u4F5C\u6210\u65E5\u6642: ${(/* @__PURE__ */ new Date()).toLocaleString("ja-JP")}
\u25A0 \u767A\u6CE8\u756A\u53F7: ${manifest.orderSpecification.orderNumber}
\u25A0 \u5BFE\u8C61\u5370\u5237\u6240: \u30E9\u30AF\u30B9\u30EB / \u30B0\u30E9\u30D5\u30A3\u30C3\u30AF / \u30D7\u30EA\u30F3\u30C8\u30D1\u30C3\u30AF / \u5404\u7A2E\u30AA\u30F3\u30C7\u30DE\u30F3\u30C9\u5370\u5237\u5BFE\u5FDC

\u3010\u540C\u68B1\u30D5\u30A1\u30A4\u30EB\u3011
1. print_ready_artwork_bleed_3mm.pdf
   - \u5857\u308A\u8DB3\u30573mm\u4ED8\u304D + \u65E5\u672C\u6A19\u6E96\u30B3\u30FC\u30CA\u30FC\u30C8\u30F3\u30DC\u30FB\u30BB\u30F3\u30BF\u30FC\u30C8\u30F3\u30DC\u4ED8\u304D
   - \u30B5\u30A4\u30BA: ${manifest.cardSpecification.artworkWithBleedDimensionsMm.width} \xD7 ${manifest.cardSpecification.artworkWithBleedDimensionsMm.height} mm (\u4ED5\u4E0A\u304C\u308A: ${manifest.cardSpecification.finishedDimensionsMm.width} \xD7 ${manifest.cardSpecification.finishedDimensionsMm.height} mm)
   - \u89E3\u50CF\u5EA6: 300 DPI
   - \u30DA\u30FC\u30B8\u6570: ${manifest.cardSpecification.pages}\u30DA\u30FC\u30B8 (${project.isDoubleSided ? "\u4E21\u9762\u5370\u5237" : "\u7247\u9762\u5370\u5237"})

2. proof_front_trim_size.png / proof_back_trim_size.png
   - \u4ED5\u4E0A\u304C\u308A\u539F\u5BF8\u78BA\u8A8D\u7528\u30D7\u30EC\u30D3\u30E5\u30FC\u753B\u50CF

3. order_manifest.json
   - \u5370\u5237\u6A5FAPI\u9023\u643A\u7528\u30E1\u30BF\u30C7\u30FC\u30BF\u4ED5\u69D8\u66F8

\u3010\u7528\u7D19\u30FB\u52A0\u5DE5\u6307\u5B9A\u3011
\u30FB\u7528\u7D19: ${manifest.orderSpecification.paperType}
\u30FB\u6570\u91CF: ${manifest.orderSpecification.quantity}\u679A
\u30FB\u52A0\u5DE5: ${manifest.orderSpecification.finishing.join(", ")}

\u3010\u4E8B\u524D\u691C\u8A3C\u30B9\u30C6\u30FC\u30BF\u30B9\u3011
\u30FBPreflight\u691C\u8A3C: ${preflight.passed ? "\u5408\u683C (Pass)" : "\u8981\u78BA\u8A8D (Warnings)"}
\u30FB\u54C1\u8CEA\u30B9\u30B3\u30A2: ${preflight.score}/100
`;
    zip.file("README_\u5370\u5237\u6240\u69D8\u3078.txt", readmeText);
    return await zip.generateAsync({ type: "blob" });
  }
  /**
   * Triggers browser download for a Blob
   */
  static triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
