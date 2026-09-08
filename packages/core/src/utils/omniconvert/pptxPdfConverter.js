import JSZip from 'jszip';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { loadPdfDocument, renderPdfPageToCanvas } from './pdfHelper.js';

export async function convertPptxToPdf(file, _options = {}, onProgress = () => {}) {
  if (onProgress) onProgress(20);
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const slideEntries = [];
  zip.folder('ppt/slides')?.forEach((_relativePath, zipEntry) => {
    if (/slide\d+\.xml$/i.test(zipEntry.name)) {
      slideEntries.push(zipEntry);
    }
  });

  slideEntries.sort((a, b) => {
    const numA = parseInt(a.name.match(/\d+/)?.[0] || '0', 10);
    const numB = parseInt(b.name.match(/\d+/)?.[0] || '0', 10);
    return numA - numB;
  });

  if (onProgress) onProgress(40);

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: [960, 540]
  });

  const totalSlides = Math.max(slideEntries.length, 1);

  // Tạo staging container để render các slide với font chữ Unicode và layout đẹp mắt
  const staging = document.createElement('div');
  staging.style.position = 'fixed';
  staging.style.top = '0';
  staging.style.left = '-9999px';
  staging.style.zIndex = '-9999';
  staging.style.pointerEvents = 'none';
  staging.style.width = '960px';
  staging.style.height = '540px';
  staging.style.fontFamily = '"Plus Jakarta Sans", "Inter", "Roboto", "Arial", sans-serif';
  document.body.appendChild(staging);

  try {
    for (let sIndex = 0; sIndex < totalSlides; sIndex++) {
      staging.innerHTML = '';

      let slideTexts = [];
      if (slideEntries[sIndex]) {
        const slideXml = await slideEntries[sIndex].async('text');
        const textMatches = slideXml.match(/<a:t>([^<]+)<\/a:t>/g) || [];
        slideTexts = textMatches.map((m) => m.replace(/<\/?a:t>/g, '').trim()).filter(Boolean);
      }

      const title = slideTexts[0] || `Slide ${sIndex + 1}`;
      const bodyTexts = slideTexts.slice(1);

      const slideCard = document.createElement('div');
      slideCard.style.width = '960px';
      slideCard.style.height = '540px';
      slideCard.style.backgroundColor = '#ffffff';
      slideCard.style.padding = '48px 56px';
      slideCard.style.boxSizing = 'border-box';
      slideCard.style.display = 'flex';
      slideCard.style.flexDirection = 'column';
      slideCard.style.justifyContent = 'flex-start';
      slideCard.style.borderTop = '8px solid #0284c7';
      slideCard.style.position = 'relative';

      slideCard.innerHTML = `
        <div style="font-size: 28px; font-weight: 700; color: #0f172a; margin-bottom: 24px; line-height: 1.3;">
          ${escapeHtml(title)}
        </div>
        <div style="flex: 1; font-size: 16px; color: #334155; line-height: 1.7; overflow: hidden;">
          ${bodyTexts.map((t) => `<p style="margin-bottom: 12px;">• ${escapeHtml(t)}</p>`).join('')}
        </div>
        <div style="position: absolute; bottom: 24px; right: 56px; font-size: 12px; color: #94a3b8;">
          Slide ${sIndex + 1} / ${totalSlides}
        </div>
      `;

      staging.appendChild(slideCard);
      await new Promise((r) => setTimeout(r, 20));

      const canvas = await html2canvas(slideCard, {
        scale: 2.0,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false
      });

      if (sIndex > 0) {
        pdf.addPage([960, 540], 'landscape');
      }

      const imgData = canvas.toDataURL('image/jpeg', 0.96);
      pdf.addImage(imgData, 'JPEG', 0, 0, 960, 540);

      if (onProgress) onProgress(40 + Math.round(((sIndex + 1) / totalSlides) * 50));
    }

    const baseName = file.name ? file.name.replace(/\.[^/.]+$/, '') : 'presentation';
    const pdfBlob = pdf.output('blob');
    if (onProgress) onProgress(100);

    return {
      blob: pdfBlob,
      filename: `${baseName}.pdf`,
      mimeType: 'application/pdf',
      isZip: false
    };
  } finally {
    if (staging.parentNode) {
      staging.parentNode.removeChild(staging);
    }
  }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Chuyển đổi PDF sang PowerPoint (.pptx) chuẩn OpenXML PresentationML
 * Mỗi trang PDF trở thành một slide thuyết trình với độ phân giải cao và tỷ lệ căn chỉnh chuẩn xác
 */
export async function convertPdfToPptx(file, options = {}, onProgress = () => {}) {
  if (onProgress) onProgress(10);
  const pdfDoc = await loadPdfDocument(file);
  const numPages = pdfDoc.numPages;
  if (numPages === 0) {
    throw new Error('Tài liệu PDF không có trang nào để chuyển đổi.');
  }

  const zip = new JSZip();
  const slideWidthEmu = 9144000;  // 16:9 widescreen 10 inches (9,144,000 EMUs)
  const slideHeightEmu = 5143500; // 16:9 widescreen 5.625 inches (5,143,500 EMUs)

  const contentTypesParts = [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
    '  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
    '  <Default Extension="xml" ContentType="application/xml"/>',
    '  <Default Extension="jpg" ContentType="image/jpeg"/>',
    '  <Default Extension="jpeg" ContentType="image/jpeg"/>',
    '  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>',
    '  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>',
    '  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>'
  ];

  const presRelsParts = [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
    '  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>'
  ];

  const sldIdLstParts = [];

  for (let pIndex = 1; pIndex <= numPages; pIndex++) {
    const rId = `rId${pIndex + 1}`;
    presRelsParts.push(`  <Relationship Id="${rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${pIndex}.xml"/>`);
    sldIdLstParts.push(`    <p:sldId id="${255 + pIndex}" r:id="${rId}"/>`);
    contentTypesParts.push(`  <Override PartName="/ppt/slides/slide${pIndex}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`);

    if (onProgress) onProgress(10 + Math.round((pIndex / numPages) * 75));

    const canvas = await renderPdfPageToCanvas(pdfDoc, pIndex, options.scale || 2.0);
    const jpegBlob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', options.quality || 0.92));
    const jpegBytes = await jpegBlob.arrayBuffer();

    zip.file(`ppt/media/image${pIndex}.jpg`, jpegBytes);

    const pageRatio = canvas.width / canvas.height;
    const slideRatio = slideWidthEmu / slideHeightEmu;
    let extCx, extCy, offX, offY;

    if (pageRatio > slideRatio) {
      extCx = slideWidthEmu;
      extCy = Math.round(slideWidthEmu / pageRatio);
      offX = 0;
      offY = Math.round((slideHeightEmu - extCy) / 2);
    } else {
      extCy = slideHeightEmu;
      extCx = Math.round(slideHeightEmu * pageRatio);
      offY = 0;
      offX = Math.round((slideWidthEmu - extCx) / 2);
    }

    const slideXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
      <p:pic>
        <p:nvPicPr>
          <p:cNvPr id="2" name="Trang ${pIndex}"/>
          <p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr>
          <p:nvPr/>
        </p:nvPicPr>
        <p:blipFill>
          <a:blip r:embed="rId2"/>
          <a:stretch><a:fillRect/></a:stretch>
        </p:blipFill>
        <p:spPr>
          <a:xfrm><a:off x="${offX}" y="${offY}"/><a:ext cx="${extCx}" cy="${extCy}"/></a:xfrm>
          <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
        </p:spPr>
      </p:pic>
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>`;

    const slideRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image${pIndex}.jpg"/>
</Relationships>`;

    zip.file(`ppt/slides/slide${pIndex}.xml`, slideXml);
    zip.file(`ppt/slides/_rels/slide${pIndex}.xml.rels`, slideRels);
  }

  contentTypesParts.push('</Types>');
  presRelsParts.push('</Relationships>');

  zip.file('[Content_Types].xml', contentTypesParts.join('\n'));
  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`);
  zip.file('ppt/_rels/presentation.xml.rels', presRelsParts.join('\n'));

  zip.file('ppt/presentation.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>
  <p:sldIdLst>
${sldIdLstParts.join('\n')}
  </p:sldIdLst>
  <p:sldSz cx="${slideWidthEmu}" cy="${slideHeightEmu}" type="screen16x9"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`);

  zip.file('ppt/slideMasters/slideMaster1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
    </p:spTree>
  </p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
</p:sldMaster>`);

  zip.file('ppt/slideMasters/_rels/slideMaster1.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>`);

  zip.file('ppt/slideLayouts/slideLayout1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank">
  <p:cSld name="Blank">
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sldLayout>`);

  zip.file('ppt/slideLayouts/_rels/slideLayout1.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>`);

  if (onProgress) onProgress(90);
  const pptxBlob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  });

  const baseName = file.name ? file.name.replace(/\.[^/.]+$/, '') : 'presentation';
  if (onProgress) onProgress(100);

  return {
    blob: pptxBlob,
    filename: `${baseName}.pptx`,
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    isZip: false
  };
}

