/**
 * PowerPoint (.pptx) → văn bản thuần / Markdown.
 *
 * Chỉ trích chữ: đọc các phần ppt/slides/slideN.xml trong gói OOXML, lấy nội
 * dung các thẻ <a:t> theo từng đoạn <a:p>. Không dựng lại bố cục, hình ảnh hay
 * biểu đồ. Ghi chú người thuyết trình (notesSlideN.xml) được thêm nếu có.
 */
import JSZip from 'jszip';

const SLIDE_RE = /^ppt\/slides\/slide(\d+)\.xml$/i;
const NOTES_RE = /^ppt\/notesSlides\/notesSlide(\d+)\.xml$/i;

export function decodeXmlEntities(text) {
  return String(text)
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_m, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_m, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&amp;/g, '&');
}

/** Tách các đoạn (a:p) của một slide XML, mỗi đoạn nối các run <a:t>. */
export function extractParagraphsFromSlideXml(xml) {
  const paragraphs = [];
  const paraRe = /<a:p[\s>][\s\S]*?<\/a:p>|<a:p\/>/g;
  const textRe = /<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>|<a:br\s*\/>/g;
  for (const para of String(xml).match(paraRe) || []) {
    let text = '';
    let m;
    textRe.lastIndex = 0;
    while ((m = textRe.exec(para)) !== null) {
      text += m[1] === undefined ? '\n' : decodeXmlEntities(m[1]);
    }
    text = text.replace(/[ \t]+\n/g, '\n').trim();
    if (text) paragraphs.push(text);
  }
  return paragraphs;
}

/**
 * @param {ArrayBuffer|Uint8Array|Blob} data
 * @returns {Promise<Array<{ number: number, paragraphs: string[], notes: string[] }>>}
 */
export async function extractPptxSlides(data) {
  const zip = await JSZip.loadAsync(data);
  const slidePaths = Object.keys(zip.files)
    .map((path) => ({ path, match: path.match(SLIDE_RE) }))
    .filter((entry) => entry.match)
    .sort((a, b) => Number(a.match[1]) - Number(b.match[1]));
  if (slidePaths.length === 0) {
    throw new Error('Tệp .pptx không chứa slide nào (hoặc không phải PowerPoint hợp lệ).');
  }

  const notesByNumber = new Map();
  for (const path of Object.keys(zip.files)) {
    const match = path.match(NOTES_RE);
    if (match) notesByNumber.set(Number(match[1]), path);
  }

  const slides = [];
  for (const { path, match } of slidePaths) {
    const number = Number(match[1]);
    const paragraphs = extractParagraphsFromSlideXml(await zip.file(path).async('string'));
    let notes = [];
    const notesPath = notesByNumber.get(number);
    if (notesPath) {
      // Ghi chú chứa cả placeholder số trang; bỏ đoạn chỉ gồm chữ số.
      notes = extractParagraphsFromSlideXml(await zip.file(notesPath).async('string'))
        .filter((p) => !/^\d+$/.test(p));
    }
    slides.push({ number, paragraphs, notes });
  }
  return slides;
}

export function slidesToText(slides) {
  return slides.map((slide, idx) => {
    const lines = [`--- Slide ${idx + 1} ---`, ...slide.paragraphs];
    if (slide.notes.length) lines.push('', '[Ghi chú]', ...slide.notes);
    return lines.join('\n');
  }).join('\n\n').trim() + '\n';
}

function escapeMd(text) {
  return text.replace(/([\\`*_[\]#|])/g, '\\$1');
}

export function slidesToMarkdown(slides, title = '') {
  const parts = [];
  if (title) parts.push(`# ${escapeMd(title)}`);
  slides.forEach((slide, idx) => {
    const [heading, ...rest] = slide.paragraphs;
    parts.push(`## Slide ${idx + 1}${heading ? `: ${escapeMd(heading.replace(/\n/g, ' '))}` : ''}`);
    if (rest.length) parts.push(rest.map((p) => `- ${escapeMd(p).replace(/\n/g, '  \n  ')}`).join('\n'));
    if (slide.notes.length) parts.push(slide.notes.map((n) => `> ${escapeMd(n).replace(/\n/g, '\n> ')}`).join('\n>\n'));
  });
  return parts.join('\n\n').trim() + '\n';
}

function baseNameOf(name, fallback) {
  return (name || '').replace(/\.[^/.]+$/, '') || fallback;
}

export async function convertPptxToTxt(file, _options = {}, onProgress = () => {}) {
  if (onProgress) onProgress(20);
  const slides = await extractPptxSlides(await file.arrayBuffer());
  if (onProgress) onProgress(80);
  const baseName = baseNameOf(file.name, 'presentation');
  if (onProgress) onProgress(100);
  return {
    blob: new Blob([slidesToText(slides)], { type: 'text/plain;charset=utf-8' }),
    filename: `${baseName}.txt`,
    mimeType: 'text/plain',
    isZip: false
  };
}

export async function convertPptxToMd(file, _options = {}, onProgress = () => {}) {
  if (onProgress) onProgress(20);
  const slides = await extractPptxSlides(await file.arrayBuffer());
  if (onProgress) onProgress(80);
  const baseName = baseNameOf(file.name, 'presentation');
  if (onProgress) onProgress(100);
  return {
    blob: new Blob([slidesToMarkdown(slides, baseName)], { type: 'text/markdown;charset=utf-8' }),
    filename: `${baseName}.md`,
    mimeType: 'text/markdown;charset=utf-8',
    isZip: false
  };
}
