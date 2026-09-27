/**
 * Chèn watermark vào gói OOXML (DOCX / XLSX / PPTX) bằng DOMParser/XMLSerializer
 * thay vì thay chuỗi bằng regex (regex cũ khớp nhầm <w:sectPr/> tự đóng,
 * <w:sectPrChange>, chèn trùng headerReference mặc định…).
 *
 * Không phụ thuộc DOM của trình duyệt: `xml` = { DOMParser, XMLSerializer }
 * mặc định lấy từ globalThis, kiểm thử node truyền @xmldom/xmldom.
 */

export const NS = Object.freeze({
  w: 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
  r: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
  v: 'urn:schemas-microsoft-com:vml',
  o: 'urn:schemas-microsoft-com:office:office',
  w10: 'urn:schemas-microsoft-com:office:word',
  rels: 'http://schemas.openxmlformats.org/package/2006/relationships',
  ct: 'http://schemas.openxmlformats.org/package/2006/content-types',
  s: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
  p: 'http://schemas.openxmlformats.org/presentationml/2006/main',
  a: 'http://schemas.openxmlformats.org/drawingml/2006/main',
  xmlns: 'http://www.w3.org/2000/xmlns/',
});

const REL_TYPE = Object.freeze({
  header: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/header',
  image: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image',
});

const HEADER_CT = 'application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml';
const XML_DECL = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';

function xmlImpl(xml) {
  const impl = xml || globalThis;
  if (!impl.DOMParser || !impl.XMLSerializer) throw new Error('DOMParser/XMLSerializer không khả dụng');
  return impl;
}

export function parseXml(text, xml) {
  const { DOMParser } = xmlImpl(xml);
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  const err = doc.getElementsByTagName('parsererror')[0];
  if (err) throw new Error('XML không hợp lệ trong tệp Office');
  return doc;
}

export function serializeXml(doc, xml) {
  const { XMLSerializer } = xmlImpl(xml);
  const out = new XMLSerializer().serializeToString(doc);
  return out.startsWith('<?xml') ? out : XML_DECL + out;
}

function elementChildren(node) {
  const out = [];
  for (let c = node.firstChild; c; c = c.nextSibling) if (c.nodeType === 1) out.push(c);
  return out;
}

function ensureNamespace(root, prefix, uri) {
  const current = root.getAttribute(`xmlns:${prefix}`);
  if (!current) root.setAttributeNS(NS.xmlns, `xmlns:${prefix}`, uri);
}

function dirOf(path) {
  const i = path.lastIndexOf('/');
  return i >= 0 ? path.slice(0, i) : '';
}

function relsPathFor(partPath) {
  const dir = dirOf(partPath);
  const name = partPath.slice(dir.length ? dir.length + 1 : 0);
  return `${dir ? `${dir}/` : ''}_rels/${name}.rels`;
}

/** Chuẩn hóa đường dẫn đích tương đối (../media/x.png) theo thư mục của part nguồn. */
export function resolveTarget(fromPart, target) {
  if (target.startsWith('/')) return target.slice(1);
  const parts = dirOf(fromPart).split('/').filter(Boolean);
  for (const seg of target.split('/')) {
    if (seg === '..') parts.pop();
    else if (seg && seg !== '.') parts.push(seg);
  }
  return parts.join('/');
}

async function readXml(zip, path, xml) {
  const file = zip.file(path);
  return file ? parseXml(await file.async('string'), xml) : null;
}

function emptyRelsDoc(xml) {
  return parseXml(`${XML_DECL}<Relationships xmlns="${NS.rels}"></Relationships>`, xml);
}

async function loadRels(zip, partPath, xml) {
  const path = relsPathFor(partPath);
  return { path, doc: (await readXml(zip, path, xml)) || emptyRelsDoc(xml) };
}

function relationships(relsDoc) {
  return Array.from(relsDoc.getElementsByTagNameNS(NS.rels, 'Relationship'));
}

/** Thêm Relationship với Id chưa dùng; trả về Id. */
export function addRelationship(relsDoc, type, target, preferredId) {
  const used = new Set(relationships(relsDoc).map((r) => r.getAttribute('Id')));
  let id = preferredId;
  let n = 1;
  while (used.has(id)) id = `${preferredId}${n++}`;
  const rel = relsDoc.createElementNS(NS.rels, 'Relationship');
  rel.setAttribute('Id', id);
  rel.setAttribute('Type', type);
  rel.setAttribute('Target', target);
  relsDoc.documentElement.appendChild(rel);
  return id;
}

/** Bảo đảm [Content_Types].xml có Default cho phần mở rộng và Override cho part mới. */
export async function ensureContentTypes(zip, { defaults = {}, overrides = {} }, xml) {
  const path = '[Content_Types].xml';
  const doc = await readXml(zip, path, xml);
  if (!doc) throw new Error('Thiếu [Content_Types].xml — tệp Office không hợp lệ');
  const root = doc.documentElement;
  const existingDefaults = new Set(Array.from(doc.getElementsByTagNameNS(NS.ct, 'Default'))
    .map((d) => (d.getAttribute('Extension') || '').toLowerCase()));
  for (const [ext, type] of Object.entries(defaults)) {
    if (existingDefaults.has(ext.toLowerCase())) continue;
    const el = doc.createElementNS(NS.ct, 'Default');
    el.setAttribute('Extension', ext);
    el.setAttribute('ContentType', type);
    // Default phải đứng trước Override theo schema OPC.
    const firstOverride = doc.getElementsByTagNameNS(NS.ct, 'Override')[0];
    if (firstOverride) root.insertBefore(el, firstOverride);
    else root.appendChild(el);
  }
  const existingOverrides = new Set(Array.from(doc.getElementsByTagNameNS(NS.ct, 'Override'))
    .map((o) => o.getAttribute('PartName')));
  for (const [partName, type] of Object.entries(overrides)) {
    if (existingOverrides.has(partName)) continue;
    const el = doc.createElementNS(NS.ct, 'Override');
    el.setAttribute('PartName', partName);
    el.setAttribute('ContentType', type);
    root.appendChild(el);
  }
  zip.file(path, serializeXml(doc, xml));
}

function freePath(zip, pattern) {
  let n = 1;
  while (zip.file(pattern(n))) n += 1;
  return pattern(n);
}

// ─────────────────────────────── DOCX ───────────────────────────────

/**
 * @param {JSZip} zip
 * @param {{ paragraphXml: (imageRelId: string|null) => string, image?: { bytes: Uint8Array|ArrayBuffer, ext?: string } }} watermark
 *   `paragraphXml` trả về chuỗi `<w:p>…</w:p>` (khai báo đủ xmlns w/v/o/r trên thẻ w:p).
 */
export async function applyDocxWatermark(zip, watermark, xml) {
  const docPath = 'word/document.xml';
  const doc = await readXml(zip, docPath, xml);
  if (!doc) throw new Error('Không tìm thấy word/document.xml — không phải tệp Word hợp lệ');
  const docRels = await loadRels(zip, docPath, xml);

  let mediaPath = null;
  if (watermark.image) {
    const ext = watermark.image.ext || 'png';
    mediaPath = freePath(zip, (n) => `word/media/watermark_${n}.${ext}`);
    zip.file(mediaPath, watermark.image.bytes);
  }

  const headerDocs = new Map(); // part path → { doc, rels }
  const getHeader = async (path) => {
    if (!headerDocs.has(path)) {
      const hdr = await readXml(zip, path, xml);
      if (!hdr) return null;
      headerDocs.set(path, { doc: hdr, rels: await loadRels(zip, path, xml), injected: false });
    }
    return headerDocs.get(path);
  };

  let newHeaderPath = null;
  const getNewHeader = () => {
    if (!newHeaderPath) {
      newHeaderPath = freePath(zip, (n) => `word/header_wm${n}.xml`);
      const hdr = parseXml(`${XML_DECL}<w:hdr xmlns:w="${NS.w}" xmlns:r="${NS.r}" xmlns:v="${NS.v}" xmlns:o="${NS.o}" xmlns:w10="${NS.w10}"></w:hdr>`, xml);
      headerDocs.set(newHeaderPath, { doc: hdr, rels: { path: relsPathFor(newHeaderPath), doc: emptyRelsDoc(xml) }, injected: false, isNew: true });
    }
    return newHeaderPath;
  };
  let newHeaderRelId = null;
  const getNewHeaderRelId = () => {
    if (!newHeaderRelId) {
      const target = getNewHeader().slice('word/'.length);
      newHeaderRelId = addRelationship(docRels.doc, REL_TYPE.header, target, 'rIdWatermarkHeader');
    }
    return newHeaderRelId;
  };

  const relById = new Map(relationships(docRels.doc).map((r) => [r.getAttribute('Id'), r]));

  // Chỉ sectPr thật của tài liệu: bỏ bản sao nằm trong <w:sectPrChange> (theo dõi thay đổi).
  let sections = Array.from(doc.getElementsByTagNameNS(NS.w, 'sectPr'))
    .filter((el) => el.parentNode && el.parentNode.localName !== 'sectPrChange');
  if (sections.length === 0) {
    const body = doc.getElementsByTagNameNS(NS.w, 'body')[0];
    if (!body) throw new Error('word/document.xml thiếu <w:body>');
    const sect = doc.createElementNS(NS.w, 'w:sectPr');
    body.appendChild(sect);
    sections = [sect];
  }

  const addReference = (sect, type) => {
    const ref = doc.createElementNS(NS.w, 'w:headerReference');
    ref.setAttributeNS(NS.w, 'w:type', type);
    ref.setAttributeNS(NS.r, 'r:id', getNewHeaderRelId());
    // headerReference phải là phần tử đầu tiên của sectPr.
    sect.insertBefore(ref, sect.firstChild);
  };

  // Section không khai báo header loại nào thì Word dùng header cùng loại của
  // section trước → chỉ thêm tham chiếu khi chưa có gì để kế thừa, nếu không sẽ
  // thay mất header gốc (logo, số trang) của các section sau.
  const inherited = { default: false, first: false, even: false };
  for (const sect of sections) {
    const refs = elementChildren(sect).filter((el) => el.namespaceURI === NS.w && el.localName === 'headerReference');
    const typeOf = (el) => el.getAttributeNS(NS.w, 'type') || el.getAttribute('w:type') || 'default';
    for (const ref of refs) {
      const rel = relById.get(ref.getAttributeNS(NS.r, 'id') || ref.getAttribute('r:id'));
      if (!rel) continue;
      const hdrPath = resolveTarget(docPath, rel.getAttribute('Target'));
      const entry = await getHeader(hdrPath);
      if (entry) entry.targeted = true;
      inherited[typeOf(ref)] = true;
    }
    if (!inherited.default) {
      addReference(sect, 'default');
      inherited.default = true;
    }
    const titlePg = elementChildren(sect).find((el) => el.localName === 'titlePg');
    const titleVal = titlePg ? (titlePg.getAttributeNS(NS.w, 'val') || titlePg.getAttribute('w:val') || 'true') : null;
    if (titlePg && titleVal !== '0' && titleVal !== 'false' && !inherited.first) {
      addReference(sect, 'first');
      inherited.first = true;
    }
  }
  if (newHeaderPath) headerDocs.get(newHeaderPath).targeted = true;

  // Chèn đoạn watermark vào mọi header được dùng (một lần mỗi part).
  const overrides = {};
  for (const [path, entry] of headerDocs) {
    if (!entry.targeted || entry.injected) continue;
    let imageRelId = null;
    if (mediaPath) {
      const target = resolveRelative(path, mediaPath);
      imageRelId = addRelationship(entry.rels.doc, REL_TYPE.image, target, 'rIdWatermarkImg');
    }
    const root = entry.doc.documentElement;
    ensureNamespace(root, 'r', NS.r);
    ensureNamespace(root, 'v', NS.v);
    ensureNamespace(root, 'o', NS.o);
    ensureNamespace(root, 'w10', NS.w10);
    const fragment = parseXml(watermark.paragraphXml(imageRelId), xml).documentElement;
    const imported = entry.doc.importNode(fragment, true);
    root.insertBefore(imported, root.firstChild);
    entry.injected = true;
    zip.file(path, serializeXml(entry.doc, xml));
    if (relationships(entry.rels.doc).length > 0) zip.file(entry.rels.path, serializeXml(entry.rels.doc, xml));
    if (entry.isNew) overrides[`/${path}`] = HEADER_CT;
  }

  zip.file(docPath, serializeXml(doc, xml));
  zip.file(docRels.path, serializeXml(docRels.doc, xml));
  await ensureContentTypes(zip, {
    defaults: mediaPath ? { [mediaPath.split('.').pop()]: `image/${mediaPath.split('.').pop()}` } : {},
    overrides,
  }, xml);
  return { headerParts: Array.from(headerDocs.keys()).filter((p) => headerDocs.get(p).injected), newHeaderPath };
}

/** Đường dẫn tương đối từ thư mục của `fromPart` đến `toPath` (cả hai tính từ gốc gói). */
export function resolveRelative(fromPart, toPath) {
  const from = dirOf(fromPart).split('/').filter(Boolean);
  const to = toPath.split('/').filter(Boolean);
  let i = 0;
  while (i < from.length && i < to.length - 1 && from[i] === to[i]) i += 1;
  return [...Array(from.length - i).fill('..'), ...to.slice(i)].join('/');
}

// ─────────────────────────────── XLSX ───────────────────────────────

/** Phần tử đứng SAU <picture> trong CT_Worksheet: <picture> phải chèn trước chúng. */
const WORKSHEET_AFTER_PICTURE = ['oleObjects', 'controls', 'webPublishItems', 'tableParts', 'extLst'];

export function insertWorksheetPicture(sheetDoc, relId) {
  const root = sheetDoc.documentElement;
  ensureNamespace(root, 'r', NS.r);
  for (const old of elementChildren(root).filter((el) => el.localName === 'picture')) root.removeChild(old);
  const picture = sheetDoc.createElementNS(root.namespaceURI || NS.s, root.prefix ? `${root.prefix}:picture` : 'picture');
  picture.setAttributeNS(NS.r, 'r:id', relId);
  const before = elementChildren(root).find((el) => WORKSHEET_AFTER_PICTURE.includes(el.localName));
  if (before) root.insertBefore(picture, before);
  else root.appendChild(picture);
  return picture;
}

/** Đặt ảnh nền (sheet background) cho mọi worksheet. Nền sheet KHÔNG được in ra giấy. */
export async function applyXlsxBackground(zip, pngBytes, xml) {
  const mediaPath = freePath(zip, (n) => `xl/media/watermark_bg${n}.png`);
  zip.file(mediaPath, pngBytes);
  const sheets = Object.keys(zip.files).filter((p) => /^xl\/worksheets\/[^/]+\.xml$/.test(p));
  if (sheets.length === 0) throw new Error('Không tìm thấy worksheet — không phải tệp Excel hợp lệ');
  for (const sheetPath of sheets) {
    const sheetDoc = await readXml(zip, sheetPath, xml);
    const rels = await loadRels(zip, sheetPath, xml);
    const relId = addRelationship(rels.doc, REL_TYPE.image, resolveRelative(sheetPath, mediaPath), 'rIdWatermarkBg');
    insertWorksheetPicture(sheetDoc, relId);
    zip.file(sheetPath, serializeXml(sheetDoc, xml));
    zip.file(rels.path, serializeXml(rels.doc, xml));
  }
  await ensureContentTypes(zip, { defaults: { png: 'image/png' } }, xml);
  return { sheets };
}

// ─────────────────────────────── PPTX ───────────────────────────────

/** Kích thước slide (EMU) từ p:sldSz; mặc định 16:9 nếu thiếu. */
export async function readPptxSlideSize(zip, xml) {
  const pres = await readXml(zip, 'ppt/presentation.xml', xml);
  const size = pres?.getElementsByTagNameNS(NS.p, 'sldSz')[0];
  const cx = Number(size?.getAttribute('cx'));
  const cy = Number(size?.getAttribute('cy'));
  return cx > 0 && cy > 0 ? { cx, cy } : { cx: 12192000, cy: 6858000 };
}

function nextShapeId(slideDoc) {
  let max = 0;
  for (const el of Array.from(slideDoc.getElementsByTagNameNS(NS.p, 'cNvPr'))) {
    max = Math.max(max, Number(el.getAttribute('id')) || 0);
  }
  return max + 1;
}

/**
 * @param {{ shapeXml: (ctx: { id: number, relId: string|null, slideSize: {cx:number, cy:number} }) => string,
 *           image?: { bytes: Uint8Array|ArrayBuffer, ext?: string } }} watermark
 */
export async function applyPptxWatermark(zip, watermark, xml) {
  const slides = Object.keys(zip.files).filter((p) => /^ppt\/slides\/slide\d+\.xml$/.test(p));
  if (slides.length === 0) throw new Error('Không tìm thấy slide — không phải tệp PowerPoint hợp lệ');
  const slideSize = await readPptxSlideSize(zip, xml);
  let mediaPath = null;
  if (watermark.image) {
    const ext = watermark.image.ext || 'png';
    mediaPath = freePath(zip, (n) => `ppt/media/watermark_${n}.${ext}`);
    zip.file(mediaPath, watermark.image.bytes);
  }
  for (const slidePath of slides) {
    const slideDoc = await readXml(zip, slidePath, xml);
    const spTree = slideDoc.getElementsByTagNameNS(NS.p, 'spTree')[0];
    if (!spTree) continue;
    let relId = null;
    if (mediaPath) {
      const rels = await loadRels(zip, slidePath, xml);
      relId = addRelationship(rels.doc, REL_TYPE.image, resolveRelative(slidePath, mediaPath), 'rIdWatermarkImg');
      zip.file(rels.path, serializeXml(rels.doc, xml));
    }
    const shape = parseXml(watermark.shapeXml({ id: nextShapeId(slideDoc), relId, slideSize }), xml).documentElement;
    spTree.appendChild(slideDoc.importNode(shape, true));
    zip.file(slidePath, serializeXml(slideDoc, xml));
  }
  if (mediaPath) {
    const ext = mediaPath.split('.').pop();
    await ensureContentTypes(zip, { defaults: { [ext]: `image/${ext}` } }, xml);
  }
  return { slides, slideSize };
}

/** Kích thước ảnh giữ tỉ lệ, cạnh dài = `longSide`. */
export function fitAspect(imgWidth, imgHeight, longSide) {
  const w = Math.max(1, imgWidth || 1);
  const h = Math.max(1, imgHeight || 1);
  return w >= h
    ? { width: Math.round(longSide), height: Math.round(longSide * (h / w)) }
    : { width: Math.round(longSide * (w / h)), height: Math.round(longSide) };
}
