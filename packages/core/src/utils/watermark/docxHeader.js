export function attachWatermarkHeaderReference(docXml, headerRelId) {
  if (typeof docXml !== 'string' || !headerRelId) {
    throw new Error('Thiếu XML tài liệu hoặc quan hệ header DOCX.');
  }

  if (/<w:headerReference\b/.test(docXml)) {
    throw new Error('Tài liệu DOCX đã có header; chưa thể thay thế watermark header một cách an toàn.');
  }

  const headerReference = `<w:headerReference w:type="default" r:id="${headerRelId}"/>`;
  let updatedSections = 0;
  const result = docXml.replace(
    /<w:sectPr\b([^>]*?)(?:\/>|>([\s\S]*?)<\/w:sectPr>)/g,
    (_match, attrs, contents = '') => {
      updatedSections += 1;
      return `<w:sectPr${attrs}>${headerReference}${contents}</w:sectPr>`;
    },
  );

  if (updatedSections > 0) return result;
  if (!result.includes('</w:body>')) {
    throw new Error('Không tìm thấy section DOCX để gắn watermark.');
  }
  return result.replace('</w:body>', `<w:sectPr>${headerReference}</w:sectPr></w:body>`);
}
