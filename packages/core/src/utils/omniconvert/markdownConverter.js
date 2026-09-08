import mammoth from 'mammoth';

/**
 * Helper: Tạo base name từ tên tệp (bỏ extension)
 */
function getBaseName(filename, fallback = 'document') {
  if (!filename) return fallback;
  return filename.replace(/\.[^/.]+$/, '') || fallback;
}

/**
 * 1. Chuyển đổi DOCX (Microsoft Word) sang Markdown (.md)
 * Sử dụng mammoth.convertToMarkdown giữ trọn vẹn ngữ nghĩa: headings, lists, tables, bold, italic.
 */
export async function convertDocxToMd(file, _options = {}, onProgress = () => {}) {
  if (onProgress) onProgress(20);
  const arrayBuffer = await file.arrayBuffer();

  if (onProgress) onProgress(50);
  const result = await mammoth.convertToMarkdown({ arrayBuffer });
  let markdown = result.value || '';

  // Dọn dẹp khoảng trắng thừa và chuẩn hóa dòng mới
  markdown = markdown.replace(/\r\n/g, '\n').trim();
  if (!markdown) {
    markdown = '# ' + getBaseName(file.name) + '\n\n*(Tài liệu không chứa nội dung văn bản khả dụng)*\n';
  }

  if (onProgress) onProgress(90);
  const baseName = getBaseName(file.name, 'word_document');
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });

  if (onProgress) onProgress(100);
  return {
    blob,
    filename: `${baseName}.md`,
    mimeType: 'text/markdown;charset=utf-8',
    isZip: false
  };
}

/**
 * 2. Chuyển đổi PDF sang Markdown (.md)
 * Phân tích cấu trúc tiêu đề, danh sách và đoạn văn dựa trên font size & layout
 */
export async function convertPdfToMd(file, _options = {}, onProgress = () => {}) {
  if (onProgress) onProgress(10);
  const { loadPdfDocument, extractPdfStructuredText } = await import('./pdfHelper.js');
  if (onProgress) onProgress(20);
  const pdfDoc = await loadPdfDocument(file);

  if (onProgress) onProgress(35);
  const pagesData = await extractPdfStructuredText(pdfDoc, (p) => {
    if (onProgress) onProgress(35 + Math.round(p * 0.45));
  });

  const mdSections = [];

  for (let pIndex = 0; pIndex < pagesData.length; pIndex++) {
    const page = pagesData[pIndex];
    const pageLines = [];

    for (const line of page.lines) {
      const text = line.text.trim();
      if (!text) continue;

      const fontSize = line.maxFontSize || 12;

      // Phân tích tiêu đề theo kích thước chữ
      if (fontSize >= 18) {
        pageLines.push(`\n# ${text}\n`);
      } else if (fontSize >= 14) {
        pageLines.push(`\n## ${text}\n`);
      } else if (fontSize >= 12.5 && text.length < 80 && !text.endsWith('.')) {
        pageLines.push(`\n### ${text}\n`);
      } else {
        // Nhận diện danh sách đầu dòng (bullet points hoặc numbered list)
        const bulletMatch = text.match(/^[•\-\*\+]\s*(.*)$/);
        const numberMatch = text.match(/^(\d+[\.\)])\s*(.*)$/);

        if (bulletMatch) {
          pageLines.push(`- ${bulletMatch[1]}`);
        } else if (numberMatch) {
          pageLines.push(`${numberMatch[1]} ${numberMatch[2]}`);
        } else {
          pageLines.push(text);
        }
      }
    }

    if (pageLines.length > 0) {
      mdSections.push(pageLines.join('\n'));
    }
  }

  let finalMarkdown = mdSections.join('\n\n---\n\n').trim();
  if (!finalMarkdown) {
    finalMarkdown = '# ' + getBaseName(file.name) + '\n\n*(Tài liệu PDF không chứa văn bản trích xuất được)*\n';
  }

  if (onProgress) onProgress(90);
  const baseName = getBaseName(file.name, 'pdf_document');
  const blob = new Blob([finalMarkdown], { type: 'text/markdown;charset=utf-8' });

  if (onProgress) onProgress(100);
  return {
    blob,
    filename: `${baseName}.md`,
    mimeType: 'text/markdown;charset=utf-8',
    isZip: false
  };
}

/**
 * 3. Chuyển đổi Excel (XLSX/XLS) sang Markdown (.md)
 * Chuyển các sheet thành bảng GitHub Flavored Markdown (GFM)
 */
export async function convertXlsxToMd(file, _options = {}, onProgress = () => {}) {
  if (onProgress) onProgress(20);
  const arrayBuffer = await file.arrayBuffer();

  if (onProgress) onProgress(40);
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  const mdParts = [];
  const sheetNames = workbook.SheetNames || [];

  for (let sIdx = 0; sIdx < sheetNames.length; sIdx++) {
    const sheetName = sheetNames[sIdx];
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    if (!rows || rows.length === 0) continue;

    // Tìm số cột lớn nhất có dữ liệu
    let maxCols = 0;
    for (const r of rows) {
      if (Array.isArray(r) && r.length > maxCols) maxCols = r.length;
    }
    if (maxCols === 0) continue;

    let sheetMd = `## ${sheetName}\n\n`;

    // Hàng tiêu đề (Row 0)
    const headerRow = rows[0] || [];
    const headers = [];
    for (let c = 0; c < maxCols; c++) {
      const cellVal = headerRow[c] !== undefined && headerRow[c] !== null ? String(headerRow[c]).trim() : '';
      headers.push(cellVal ? cellVal.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ') : `Cột ${c + 1}`);
    }

    sheetMd += '| ' + headers.join(' | ') + ' |\n';
    sheetMd += '| ' + headers.map(() => '---').join(' | ') + ' |\n';

    // Các hàng dữ liệu
    for (let rIdx = 1; rIdx < rows.length; rIdx++) {
      const row = rows[rIdx] || [];
      const cells = [];
      for (let c = 0; c < maxCols; c++) {
        const val = row[c] !== undefined && row[c] !== null ? String(row[c]).trim() : '';
        cells.push(val.replace(/\|/g, '\\|').replace(/\r?\n/g, ' '));
      }
      sheetMd += '| ' + cells.join(' | ') + ' |\n';
    }

    mdParts.push(sheetMd);
    if (onProgress) onProgress(40 + Math.round(((sIdx + 1) / sheetNames.length) * 45));
  }

  let finalMd = mdParts.join('\n\n---\n\n').trim();
  if (!finalMd) {
    finalMd = '# ' + getBaseName(file.name) + '\n\n*(Bảng tính trống)*\n';
  }

  if (onProgress) onProgress(90);
  const baseName = getBaseName(file.name, 'spreadsheet');
  const blob = new Blob([finalMd], { type: 'text/markdown;charset=utf-8' });

  if (onProgress) onProgress(100);
  return {
    blob,
    filename: `${baseName}.md`,
    mimeType: 'text/markdown;charset=utf-8',
    isZip: false
  };
}

/**
 * 4. Chuyển đổi CSV sang Markdown (.md)
 */
export async function convertCsvToMd(file, options = {}, onProgress = () => {}) {
  return await convertXlsxToMd(file, options, onProgress);
}

/**
 * 5. Chuyển đổi TXT sang Markdown (.md)
 */
export async function convertTxtToMd(file, _options = {}, onProgress = () => {}) {
  if (onProgress) onProgress(30);
  const text = await file.text();

  if (onProgress) onProgress(70);
  const baseName = getBaseName(file.name, 'document');
  const cleaned = text.replace(/\r\n/g, '\n').trim();
  const md = `# ${baseName}\n\n` + cleaned;

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  if (onProgress) onProgress(100);

  return {
    blob,
    filename: `${baseName}.md`,
    mimeType: 'text/markdown;charset=utf-8',
    isZip: false
  };
}

/**
 * 6. Chuyển đổi Markdown (.md) sang Microsoft Word (.docx)
 * Phân tích cây cấu trúc tiêu đề, danh sách, bảng biểu và in đậm/nghiêng
 */
export async function convertMdToDocx(file, _options = {}, onProgress = () => {}) {
  if (onProgress) onProgress(20);
  const mdContent = await file.text();

  if (onProgress) onProgress(40);
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle } = await import('docx');

  const lines = mdContent.replace(/\r\n/g, '\n').split('\n');
  const children = [];

  let inCodeBlock = false;
  let codeBlockLines = [];
  let inTable = false;
  let tableRows = [];

  const flushTable = () => {
    if (tableRows.length === 0) return;
    try {
      const docxRows = tableRows.map((r, rIdx) => {
        const isHeader = rIdx === 0;
        return new TableRow({
          children: r.map((cellText) => new TableCell({
            width: { size: 100 / Math.max(1, r.length), type: WidthType.PERCENTAGE },
            shading: isHeader ? { fill: 'F1F5F9' } : undefined,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: cellText.trim(),
                    bold: isHeader,
                    size: 20,
                    font: 'Calibri'
                  })
                ]
              })
            ]
          }))
        });
      });

      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: docxRows
        })
      );
      children.push(new Paragraph({ text: '', spacing: { after: 100 } }));
    } catch (e) {
      console.warn('Docx table flush warning:', e);
    }
    tableRows = [];
    inTable = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Khối code ```
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // Kết thúc code block
        children.push(
          new Paragraph({
            spacing: { before: 80, after: 120 },
            shading: { fill: 'F8FAFC' },
            children: [
              new TextRun({
                text: codeBlockLines.join('\n'),
                font: 'Courier New',
                size: 19
              })
            ]
          })
        );
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        flushTable();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(rawLine);
      continue;
    }

    // Bảng Markdown: | col1 | col2 |
    if (line.startsWith('|') && line.endsWith('|')) {
      // Bỏ qua dòng phân cách | --- | --- |
      if (/^\|[\s\-:]+(\|[\s\-:]+)+\|$/.test(line)) {
        continue;
      }
      const cells = line.slice(1, -1).split('|').map(c => c.trim());
      tableRows.push(cells);
      inTable = true;
      continue;
    } else if (inTable) {
      flushTable();
    }

    if (!line) {
      continue;
    }

    // Tiêu đề #, ##, ###
    if (line.startsWith('# ')) {
      children.push(
        new Paragraph({
          text: line.replace(/^#\s+/, ''),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 240, after: 120 }
        })
      );
    } else if (line.startsWith('## ')) {
      children.push(
        new Paragraph({
          text: line.replace(/^##\s+/, ''),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 }
        })
      );
    } else if (line.startsWith('### ')) {
      children.push(
        new Paragraph({
          text: line.replace(/^###\s+/, ''),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 160, after: 80 }
        })
      );
    } else if (line.startsWith('---') || line.startsWith('***')) {
      // Phân cách dòng
      children.push(
        new Paragraph({
          border: {
            bottom: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0', space: 1 }
          },
          spacing: { before: 120, after: 120 }
        })
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      // Bullet list
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 60 },
          children: parseInlineFormatting(line.slice(2), TextRun)
        })
      );
    } else if (/^\d+[\.\)]\s+/.test(line)) {
      // Numbered list
      const content = line.replace(/^\d+[\.\)]\s+/, '');
      children.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: line.match(/^\d+[\.\)]/)[0] + ' ', bold: true }),
            ...parseInlineFormatting(content, TextRun)
          ]
        })
      );
    } else {
      // Đoạn văn thông thường
      children.push(
        new Paragraph({
          spacing: { after: 100, line: 276 },
          children: parseInlineFormatting(line, TextRun)
        })
      );
    }
  }

  flushTable();

  if (onProgress) onProgress(80);
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: children.length > 0 ? children : [
          new Paragraph({ children: [new TextRun({ text: 'Tài liệu không có nội dung.' })] })
        ]
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  const baseName = getBaseName(file.name, 'markdown_document');

  if (onProgress) onProgress(100);
  return {
    blob,
    filename: `${baseName}.docx`,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    isZip: false
  };
}

/**
 * Helper phân tích inline markdown (**bold**, *italic*, `code`) cho DOCX TextRun
 */
function parseInlineFormatting(text, TextRunClass) {
  const runs = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|[^*`]+)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const chunk = match[0];
    if (chunk.startsWith('**') && chunk.endsWith('**')) {
      runs.push(new TextRunClass({ text: chunk.slice(2, -2), bold: true, font: 'Calibri', size: 22 }));
    } else if (chunk.startsWith('*') && chunk.endsWith('*')) {
      runs.push(new TextRunClass({ text: chunk.slice(1, -1), italics: true, font: 'Calibri', size: 22 }));
    } else if (chunk.startsWith('`') && chunk.endsWith('`')) {
      runs.push(new TextRunClass({ text: chunk.slice(1, -1), font: 'Courier New', size: 20, shading: { fill: 'F1F5F9' } }));
    } else {
      runs.push(new TextRunClass({ text: chunk, font: 'Calibri', size: 22 }));
    }
  }

  return runs.length > 0 ? runs : [new TextRunClass({ text, font: 'Calibri', size: 22 })];
}

/**
 * 7. Chuyển đổi Markdown (.md) sang PDF
 * Render phân trang và dàn trang chữ chuẩn typographic A4 qua jsPDF
 */
export async function convertMdToPdf(file, _options = {}, onProgress = () => {}) {
  if (onProgress) onProgress(20);
  const mdText = await file.text();

  if (onProgress) onProgress(40);
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const marginX = 45;
  const marginTop = 50;
  const marginBottom = 50;
  const usableWidth = pageWidth - marginX * 2;
  const maxY = pageHeight - marginBottom;

  let y = marginTop;

  const checkPageBreak = (neededHeight) => {
    if (y + neededHeight > maxY) {
      pdf.addPage();
      y = marginTop;
    }
  };

  const lines = mdText.replace(/\r\n/g, '\n').split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      y += 8;
      continue;
    }

    // Tiêu đề
    if (line.startsWith('# ')) {
      checkPageBreak(35);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.setTextColor(15, 23, 42);
      const text = line.replace(/^#\s+/, '');
      const wrapped = pdf.splitTextToSize(text, usableWidth);
      for (const w of wrapped) {
        pdf.text(w, marginX, y);
        y += 24;
      }
      y += 6;
      continue;
    }

    if (line.startsWith('## ')) {
      checkPageBreak(28);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(30, 41, 59);
      const text = line.replace(/^##\s+/, '');
      const wrapped = pdf.splitTextToSize(text, usableWidth);
      for (const w of wrapped) {
        pdf.text(w, marginX, y);
        y += 18;
      }
      y += 4;
      continue;
    }

    if (line.startsWith('### ')) {
      checkPageBreak(22);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(51, 65, 85);
      const text = line.replace(/^###\s+/, '');
      const wrapped = pdf.splitTextToSize(text, usableWidth);
      for (const w of wrapped) {
        pdf.text(w, marginX, y);
        y += 15;
      }
      y += 4;
      continue;
    }

    // Phân cách trang / đường kẻ
    if (line.startsWith('---') || line.startsWith('***')) {
      checkPageBreak(15);
      pdf.setDrawColor(226, 232, 240);
      pdf.line(marginX, y, marginX + usableWidth, y);
      y += 15;
      continue;
    }

    // Danh sách liệt kê
    if (line.startsWith('- ') || line.startsWith('* ')) {
      checkPageBreak(14);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10.5);
      pdf.setTextColor(51, 65, 85);
      const bulletText = line.replace(/^[\-\*]\s+/, '').replace(/\*\*/g, '');
      const wrapped = pdf.splitTextToSize(bulletText, usableWidth - 16);

      pdf.text('•', marginX + 4, y);
      for (let wIdx = 0; wIdx < wrapped.length; wIdx++) {
        pdf.text(wrapped[wIdx], marginX + 16, y);
        y += 14;
      }
      y += 2;
      continue;
    }

    // Bảng biểu đơn giản
    if (line.startsWith('|') && line.endsWith('|')) {
      if (/^\|[\s\-:]+(\|[\s\-:]+)+\|$/.test(line)) continue;
      checkPageBreak(14);
      pdf.setFont('courier', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(71, 85, 105);
      const cells = line.slice(1, -1).split('|').map(c => c.trim()).join('   |   ');
      pdf.text(cells, marginX, y);
      y += 13;
      continue;
    }

    // Văn bản thông thường
    checkPageBreak(14);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10.5);
    pdf.setTextColor(30, 41, 59);
    const cleanLine = line.replace(/\*\*/g, '').replace(/`/g, '');
    const wrapped = pdf.splitTextToSize(cleanLine, usableWidth);
    for (const w of wrapped) {
      pdf.text(w, marginX, y);
      y += 14;
    }
    y += 4;
  }

  if (onProgress) onProgress(85);
  const pdfBlob = pdf.output('blob');
  const baseName = getBaseName(file.name, 'markdown');

  if (onProgress) onProgress(100);
  return {
    blob: pdfBlob,
    filename: `${baseName}.pdf`,
    mimeType: 'application/pdf',
    isZip: false
  };
}

/**
 * 8. Chuyển đổi Markdown (.md) sang Plain Text (.txt)
 * Tẩy sạch các ký hiệu cú pháp markdown
 */
export async function convertMdToTxt(file, _options = {}, onProgress = () => {}) {
  if (onProgress) onProgress(30);
  const text = await file.text();

  if (onProgress) onProgress(60);
  // Loại bỏ các cú pháp markdown thông dụng
  let cleanText = text
    .replace(/^#+\s+/gm, '') // Bỏ # ## ###
    .replace(/\*\*(.*?)\*\*/g, '$1') // Bỏ **bold**
    .replace(/\*(.*?)\*/g, '$1') // Bỏ *italic*
    .replace(/`(.*?)`/g, '$1') // Bỏ inline code
    .replace(/```[\s\S]*?```/g, (match) => match.replace(/```[a-z]*\n?/g, '')) // Bỏ fence code
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Bỏ [link](url)
    .replace(/^\|\s*/gm, '') // Bỏ viền bảng
    .replace(/\s*\|$/gm, '')
    .replace(/\|/g, '\t'); // Đổi | sang tab

  const baseName = getBaseName(file.name, 'document');
  const blob = new Blob([cleanText], { type: 'text/plain;charset=utf-8' });

  if (onProgress) onProgress(100);
  return {
    blob,
    filename: `${baseName}.txt`,
    mimeType: 'text/plain;charset=utf-8',
    isZip: false
  };
}

/**
 * 9. Chuyển đổi Markdown (.md) sang HTML (.html)
 * Xuất trang web độc lập có stylesheet CSS sang trọng, xem được trực tiếp
 */
export async function convertMdToHtml(file, _options = {}, onProgress = () => {}) {
  if (onProgress) onProgress(20);
  const md = await file.text();

  if (onProgress) onProgress(50);
  // Trình chuyển đổi Markdown cơ bản sang HTML ngữ nghĩa an toàn
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const htmlParts = [];
  let inCode = false;
  let inTable = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line.startsWith('```')) {
      if (inCode) {
        htmlParts.push('</code></pre>');
        inCode = false;
      } else {
        htmlParts.push('<pre><code>');
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      htmlParts.push(rawLine.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
      continue;
    }

    if (line.startsWith('|') && line.endsWith('|')) {
      if (/^\|[\s\-:]+(\|[\s\-:]+)+\|$/.test(line)) continue;
      if (!inTable) {
        htmlParts.push('<table><tbody>');
        inTable = true;
      }
      const cells = line.slice(1, -1).split('|').map(c => `<td>${c.trim()}</td>`).join('');
      htmlParts.push(`<tr>${cells}</tr>`);
      continue;
    } else if (inTable) {
      htmlParts.push('</tbody></table>');
      inTable = false;
    }

    if (!line) continue;

    if (line.startsWith('# ')) {
      htmlParts.push(`<h1>${line.slice(2)}</h1>`);
    } else if (line.startsWith('## ')) {
      htmlParts.push(`<h2>${line.slice(3)}</h2>`);
    } else if (line.startsWith('### ')) {
      htmlParts.push(`<h3>${line.slice(4)}</h3>`);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      htmlParts.push(`<li>${line.slice(2)}</li>`);
    } else if (line.startsWith('---')) {
      htmlParts.push('<hr />');
    } else {
      htmlParts.push(`<p>${line}</p>`);
    }
  }

  if (inTable) htmlParts.push('</tbody></table>');
  if (inCode) htmlParts.push('</code></pre>');

  const baseName = getBaseName(file.name, 'document');
  const fullHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>${baseName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 820px; margin: 40px auto; padding: 0 20px; line-height: 1.65; color: #1e293b; background: #f8fafc; }
    .card { background: #ffffff; padding: 48px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    h1 { color: #0f172a; font-size: 26px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
    h2 { color: #1e293b; font-size: 20px; margin-top: 28px; }
    h3 { color: #334155; font-size: 16px; margin-top: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #cbd5e1; padding: 10px 14px; text-align: left; font-size: 13px; }
    tr:nth-child(even) { background-color: #f1f5f9; }
    pre { background: #0f172a; color: #f8fafc; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 13px; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    hr { border: none; border-top: 1px solid #e2e8f0; margin: 28px 0; }
  </style>
</head>
<body>
  <div class="card">
    ${htmlParts.join('\n')}
  </div>
</body>
</html>`;

  if (onProgress) onProgress(90);
  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });

  if (onProgress) onProgress(100);
  return {
    blob,
    filename: `${baseName}.html`,
    mimeType: 'text/html;charset=utf-8',
    isZip: false
  };
}
