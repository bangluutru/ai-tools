const loadSheetJs = () => import('xlsx');
const loadExcelJs = () => import('exceljs').then((module) => module.default ?? module);

// =====================================================================
// Constants
// =====================================================================
const FOOTER_KEYWORDS = [
    'subtotal', 'sub total', 'total', 'tax', 'tax rate', 's & h', 's&h',
    'other', 'shipping', 'discount', 'grand total',
    'other comments', 'special instructions', 'comments', 'please provide',
    'certificate', 'ghi chú', 'tổng cộng', 'tổng tiền', 'cộng tiền hàng', 'thuế',
    '合計', '税', '小計', '送料', '備考'
];

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const HAS_CJK = /[぀-ヿ㐀-鿿]/;

// Latin/Vietnamese keywords must match as a whole word at the start of the
// label ("Total:", "Sub Total (VND)", "Other comments") so that product names
// such as "Mother board" or "Totalizer" are not mistaken for a footer.
// CJK has no word boundaries, so those keywords must prefix the label.
const FOOTER_MATCHERS = FOOTER_KEYWORDS.map((kw) => {
    if (HAS_CJK.test(kw)) return (text) => text.startsWith(kw);
    const re = new RegExp(`^${escapeRegExp(kw)}(?![\\p{L}\\p{N}])`, 'u');
    return (text) => re.test(text);
});

const normalizeLabel = (value) => String(value ?? '')
    .normalize('NFC')
    .trim()
    .toLowerCase()
    .replace(/^[\s:.\-–—*#()[\]]+/, '');

/** True when a single cell looks like a footer label ("Total", "Tổng cộng", "合計"...). */
export const isFooterLabel = (value) => {
    const text = normalizeLabel(value);
    if (!text) return false;
    return FOOTER_MATCHERS.some((match) => match(text));
};

/**
 * Only the first 1–2 non-empty cells of a row are treated as its label.
 * A row that starts with a sequence number ("2", "3.") is a numbered item row,
 * never a footer — even if the product name starts with "Tax"/"Other".
 */
const rowHasFooterLabel = (values) => {
    const firstCells = values
        .map((v) => String(v ?? '').trim())
        .filter((v) => v !== '')
        .slice(0, 2);
    if (firstCells.length === 0 || /^\d+[.)]?$/.test(firstCells[0])) return false;
    return firstCells.some(isFooterLabel);
};

/**
 * Classify a source row that follows the header row:
 *  - 'footer': the first 1–2 non-empty cells carry a footer label → stop reading.
 *  - 'blank' / 'sparse': skipped, reading continues.
 *  - 'data': a product row.
 */
export const classifySourceRow = (row, headerCount) => {
    if (!row || !Array.isArray(row)) return 'blank';
    const filledCells = row.filter(c => String(c ?? '').trim() !== '').length;
    if (filledCells === 0) return 'blank';
    if (rowHasFooterLabel(row)) return 'footer';
    if (filledCells < Math.max(2, Math.floor(headerCount * 0.3))) return 'sparse';
    return 'data';
};

export const isFooterRow = (row, headerCount) => classifySourceRow(row, headerCount) === 'footer';

// =====================================================================
// 1. Reading Excel Files
// =====================================================================

const findHeaderRow = (jsonData) => {
    const headerKeywords = [
        'no', 'no.', 'stt', 'item', 'item code', 'product', 'pkg', 'unit',
        'qty', 'quantity', 'price', 'unit price', 'total',
        'tên', 'mã', 'số lượng', 'đơn giá', 'thành tiền', 'hàng hóa',
        '数量', '単価', '金額', '品名', '品番', '備考',
        'item name', 'package', 'item name/package'
    ];

    let bestIndex = 0;
    let maxScore = -1;

    for (let i = 0; i < Math.min(jsonData.length, 50); i++) {
        const row = jsonData[i];
        if (!row || !Array.isArray(row)) continue;
        let score = 0;
        row.forEach(cell => {
            const s = String(cell).trim().toLowerCase();
            if (s.length > 0 && headerKeywords.some(kw => s === kw || s.includes(kw))) {
                score += 3;
            }
        });
        const filledCount = row.filter(c => String(c).trim() !== '').length;
        if (filledCount >= 5) score += 2;
        if (score > maxScore && score > 0) {
            maxScore = score;
            bestIndex = i;
        }
    }

    if (maxScore <= 0) {
        let maxCols = 0;
        for (let i = 0; i < Math.min(jsonData.length, 30); i++) {
            const row = jsonData[i] || [];
            const numCols = row.filter(c => String(c).trim() !== '').length;
            if (numCols > maxCols) { maxCols = numCols; bestIndex = i; }
        }
    }
    return bestIndex;
};

/** Readable display value from any ExcelJS cell value. */
const extractCellDisplayValue = (cell) => {
    const v = cell.value;
    if (v === null || v === undefined) return '';
    if (typeof v !== 'object') return String(v);
    // Formula object: {formula: '...', result: ...}
    if (v.formula) return '=' + v.formula;
    // Shared formula clone without its own formula
    if (v.sharedFormula !== undefined) {
        return v.result !== undefined ? String(v.result) : '';
    }
    // Rich text: {richText: [{text: '...'}]}
    if (v.richText && Array.isArray(v.richText)) {
        return v.richText.map(rt => rt.text || '').join('');
    }
    // Hyperlink: {text, hyperlink}
    if (v.text !== undefined && v.hyperlink !== undefined) return String(v.text);
    // Error: {error: '#REF!'}
    if (v.error) return String(v.error);
    // Date object
    if (v instanceof Date) return v.toLocaleDateString();
    // Result-only objects
    if (v.result !== undefined) return String(v.result);
    try { return JSON.stringify(v); } catch { return ''; }
};

const findFooterStartInWorksheet = (ejsWs, headerRowNum) => {
    for (let r = headerRowNum + 1; r <= ejsWs.rowCount; r++) {
        const values = [];
        ejsWs.getRow(r).eachCell({ includeEmpty: false }, (cell) => {
            values.push(extractCellDisplayValue(cell));
        });
        if (rowHasFooterLabel(values)) return r;
    }
    return ejsWs.rowCount + 1;
};

const readZoneRows = (ejsWs, fromRow, toRow, colCount) => {
    const rows = [];
    for (let r = fromRow; r <= toRow; r++) {
        const row = ejsWs.getRow(r);
        const cells = [];
        for (let c = 1; c <= colCount; c++) {
            cells.push({ col: c, value: extractCellDisplayValue(row.getCell(c)) });
        }
        rows.push({ rowNum: r, cells });
    }
    return rows;
};

/**
 * Parse an Excel file already loaded into memory (ArrayBuffer / Uint8Array / Buffer).
 * Source mode returns the product rows; target mode returns the 3-zone template layout.
 */
export const parseExcelBuffer = async (buffer, isSource = true) => {
    const data = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    const XLSX = await loadSheetJs();
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    if (!jsonData || jsonData.length === 0) {
        throw new Error("File is empty or invalid format.");
    }

    // sheet_to_json starts at the first row of the used range, which is not
    // necessarily sheet row 1. Keep indexes absolute (0-based sheet row).
    const rangeStartRow = worksheet?.['!ref'] ? XLSX.utils.decode_range(worksheet['!ref']).s.r : 0;
    const localHeaderIndex = findHeaderRow(jsonData);
    const headerRowIndex = rangeStartRow + localHeaderIndex;
    const rawHeaders = (jsonData[localHeaderIndex] || []).map(h => String(h).trim());
    const headers = rawHeaders.filter(h => h !== '');

    if (isSource) {
        const dataRows = [];
        let skippedRows = 0;
        let stoppedAtRow = null;
        let stopLabel = '';
        for (let i = localHeaderIndex + 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            const kind = classifySourceRow(row, headers.length);
            if (kind === 'footer') {
                stoppedAtRow = rangeStartRow + i + 1;
                stopLabel = row.map(c => String(c ?? '').trim()).find(Boolean) || '';
                break;
            }
            if (kind === 'blank') continue;
            if (kind === 'sparse') { skippedRows++; continue; }
            const rowObj = {};
            headers.forEach((header) => {
                const origIdx = rawHeaders.indexOf(header);
                if (origIdx !== -1) {
                    rowObj[header] = row[origIdx] !== undefined ? row[origIdx] : '';
                }
            });
            dataRows.push(rowObj);
        }
        return {
            headers, headerRowIndex, sampleRows: dataRows, allRows: dataRows,
            parsedRowCount: dataRows.length, skippedRows, stoppedAtRow, stopLabel
        };
    }

    const ExcelJS = await loadExcelJs();
    const ejsWb = new ExcelJS.Workbook();
    await ejsWb.xlsx.load(data);
    const ejsWs = ejsWb.worksheets[0];
    const headerRowNum = headerRowIndex + 1;
    const colCount = ejsWs.columnCount || 20;

    const footerStartRow = findFooterStartInWorksheet(ejsWs, headerRowNum);
    const existingDataSlots = footerStartRow - headerRowNum - 1;

    const headerZone = readZoneRows(ejsWs, 1, headerRowNum - 1, colCount);
    const footerZone = readZoneRows(ejsWs, footerStartRow, ejsWs.rowCount, colCount);

    return {
        headers, headerRowIndex, rawBuffer: data,
        headerZone, footerZone, footerStartRow,
        existingDataSlots, colCount
    };
};

export const readExcelFile = async (file, isSource = true) => {
    if (!isSource && /\.xls$/i.test(file?.name || '')) {
        throw new Error('Mẫu đích phải là tệp .xlsx (định dạng .xls cũ không được hỗ trợ — hãy mở bằng Excel và lưu lại dạng .xlsx).');
    }
    const buffer = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(reader.error || new Error('Không đọc được tệp.'));
        reader.readAsArrayBuffer(file);
    });
    return parseExcelBuffer(buffer, isSource);
};

// =====================================================================
// 1b. Zone edit helpers (header / footer zones of the target template)
//     A zone is [{ rowNum, cells: [{ col, value, edited? }] }].
// =====================================================================

/** Immutable update of one zone cell by row/cell index; marks it as user-edited. */
export const updateZoneCell = (zone, rowIdx, cellIdx, value) => zone.map((row, r) => (
    r !== rowIdx ? row : {
        ...row,
        cells: row.cells.map((cell, c) => (c === cellIdx ? { ...cell, value, edited: true } : cell))
    }
));

/** Profile format: only user-edited cells, as [{ rowNum, cells: [{ col, value }] }]. */
export const serializeZoneEdits = (zone = []) => zone
    .map(row => ({
        rowNum: row.rowNum,
        cells: row.cells
            .filter(c => c.edited)
            .map(c => ({ col: c.col, value: typeof c.value === 'string' ? c.value : String(c.value ?? '') }))
    }))
    .filter(row => Number.isInteger(row.rowNum) && row.cells.length > 0);

/**
 * Re-apply saved edits onto a freshly parsed zone (matched by rowNum + col).
 * Entries from old profiles (rowIdx/address format) are ignored.
 */
export const applyZoneEdits = (zone = [], savedEdits = []) => {
    if (!Array.isArray(savedEdits) || savedEdits.length === 0) return zone;
    const edits = new Map();
    savedEdits.forEach(row => {
        if (!Number.isInteger(row?.rowNum) || !Array.isArray(row.cells)) return;
        row.cells.forEach(cell => {
            if (!Number.isInteger(cell?.col) || typeof cell.value !== 'string') return;
            if (cell.value === '[object Object]') return;
            edits.set(`${row.rowNum}:${cell.col}`, cell.value);
        });
    });
    if (edits.size === 0) return zone;
    return zone.map(row => ({
        ...row,
        cells: row.cells.map(cell => {
            const key = `${row.rowNum}:${cell.col}`;
            return edits.has(key) ? { ...cell, value: edits.get(key), edited: true } : cell;
        })
    }));
};

// =====================================================================
// 2. Heuristics Auto-Mapping
// =====================================================================
const mappingDict = {
    'name': ['name', 'product', 'item', 'item name', 'package', 'item name/package',
        'tên', 'sản phẩm', 'hàng hóa', '品名', '商品'],
    'qty': ['qty', 'quantity', 'amount', 'sl', 'số lượng', '数量', '個数'],
    'price': ['price', 'unit price', 'cost', 'giá', 'đơn giá', '単価', '価格'],
    'total': ['total', 'sum', 'tổng', 'thành tiền', '合計', '金額'],
    'date': ['date', 'time', 'ngày', 'thời gian', '納期', '日付', '期日'],
    'code': ['code', 'sku', 'item code', 'po', 'id', 'mã', 'ref', '品番', 'コード', '注文番号'],
    'note': ['note', 'remark', 'desc', 'ghi chú', '備考', 'メモ'],
    'no': ['no', 'no.', 'stt', '#'],
    'pkg': ['pkg', 'package', 'packing', 'đóng gói', '包装'],
    'unit': ['unit', 'đơn vị', '単位']
};

const normalize = (str) =>
    str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '');

const categorize = (header) => {
    const headerLower = header.toLowerCase().trim();
    const norm = normalize(header);
    for (const [category, keywords] of Object.entries(mappingDict)) {
        if (keywords.some(kw => headerLower === kw.toLowerCase())) return category;
        if (keywords.some(kw => norm.includes(normalize(kw)) || normalize(kw).includes(norm))) return category;
    }
    return null;
};

export const autoMapFields = (sourceHeaders, targetHeaders) => {
    const rules = [];
    const mappedTargets = new Set();
    const mappedSources = new Set();

    sourceHeaders.forEach(s => {
        const match = targetHeaders.find(t =>
            t.toLowerCase().trim() === s.toLowerCase().trim() && !mappedTargets.has(t)
        );
        if (match) {
            rules.push({ sourceCol: s, targetCol: match, type: 'auto' });
            mappedTargets.add(match);
            mappedSources.add(s);
        }
    });

    sourceHeaders.forEach(s => {
        if (mappedSources.has(s)) return;
        const sCat = categorize(s);
        if (sCat) {
            const match = targetHeaders.find(t =>
                !mappedTargets.has(t) && categorize(t) === sCat
            );
            if (match) {
                rules.push({ sourceCol: s, targetCol: match, type: 'auto' });
                mappedTargets.add(match);
                mappedSources.add(s);
            }
        }
    });

    return rules;
};

// =====================================================================
// 3. Export: ExcelJS Engine with Merge Protection
//    Order: Save → Unmerge → Splice → Clear → Write → Re-merge LAST
// =====================================================================

const colLetterToNum = (letters) => {
    let n = 0;
    for (let i = 0; i < letters.length; i++) {
        n = n * 26 + (letters.charCodeAt(i) - 64);
    }
    return n;
};

const colNumToLetter = (num) => {
    let s = '';
    while (num > 0) {
        const rem = (num - 1) % 26;
        s = String.fromCharCode(65 + rem) + s;
        num = Math.floor((num - 1) / 26);
    }
    return s;
};

const makeMergeRef = (top, left, bottom, right) =>
    `${colNumToLetter(left)}${top}:${colNumToLetter(right)}${bottom}`;

const parseMerge = (ref) => {
    if (typeof ref === 'string') {
        const m = ref.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/i);
        if (!m) return null;
        return { top: +m[2], left: colLetterToNum(m[1]), bottom: +m[4], right: colLetterToNum(m[3]) };
    }
    if (ref?.model) ref = ref.model;
    return ref?.top !== undefined ? ref : null;
};

const collectAllMerges = (ws) => {
    const refs = [];
    if (ws.model?.merges) refs.push(...ws.model.merges);
    if (ws._merges) {
        Object.keys(ws._merges).forEach(key => {
            const r = ws._merges[key];
            const s = typeof r === 'string' ? r : (r.model || r.range || key);
            if (typeof s === 'string' && !refs.includes(s)) refs.push(s);
        });
    }
    return refs;
};

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Convert a user-typed zone value into an ExcelJS cell value, guided by the original cell. */
const toCellValue = (input, existing) => {
    const text = String(input ?? '');
    if (text.trim() === '') return null;
    if (text.startsWith('=')) return { formula: text.substring(1) };
    const iso = text.match(ISO_DATE);
    if (iso && existing instanceof Date) {
        return new Date(Date.UTC(+iso[1], +iso[2] - 1, +iso[3]));
    }
    if (typeof existing === 'number' && text.trim() !== '' && !Number.isNaN(Number(text))) {
        return Number(text);
    }
    return text;
};

/**
 * ExcelJS cannot keep shared formulas consistent once rows are spliced, so turn
 * every shared formula (master + clones) into an ordinary formula up front.
 */
const flattenSharedFormulas = (ws) => {
    const updates = [];
    ws.eachRow({ includeEmpty: false }, row => {
        row.eachCell({ includeEmpty: false }, cell => {
            const v = cell.value;
            if (!v || typeof v !== 'object') return;
            if (v.sharedFormula === undefined && v.shareType !== 'shared') return;
            const formula = cell.formula;
            updates.push([cell, formula ? { formula, result: v.result } : (v.result ?? null)]);
        });
    });
    updates.forEach(([cell, value]) => { cell.value = value; });
};

/**
 * Fill the target template with source rows (3-zone layout) and return the
 * resulting .xlsx as a buffer. The caller is responsible for downloading it.
 */
export const exportMappedExcel = async ({
    sourceAllRows, mappingRules, targetBuffer, headerRowIndex,
    headerZone, footerZone, footerStartRow, existingDataSlots
}) => {
    if (!targetBuffer) throw new Error('Missing target template.');
    if (!Array.isArray(sourceAllRows)) throw new Error('Missing source rows.');
    if (!Number.isInteger(headerRowIndex)) throw new Error('Missing template header row.');

    const ExcelJS = await loadExcelJs();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(targetBuffer);
    const ws = workbook.worksheets[0];
    workbook.worksheets.forEach(flattenSharedFormulas);

    const rules = Array.isArray(mappingRules) ? mappingRules : [];
    const headerRowNum = headerRowIndex + 1;
    const dataStartRow = headerRowNum + 1;
    const slots = Number.isInteger(existingDataSlots) ? existingDataSlots : 0;
    const footerStart = Number.isInteger(footerStartRow) ? footerStartRow : dataStartRow + slots;
    const neededRows = sourceAllRows.length;
    const diff = neededRows - slots;
    const maxCol = ws.columnCount || 20;

    // 1. Column map (merge-aware: always use leftmost column of merged headers)
    const colMap = {};
    ws.getRow(headerRowNum).eachCell((cell, cn) => {
        const v = extractCellDisplayValue(cell).trim();
        if (v && colMap[v] === undefined) colMap[v] = cn;
    });

    const headerMerges = collectAllMerges(ws).map(parseMerge).filter(Boolean);
    headerMerges.forEach(m => {
        if (m.top <= headerRowNum && m.bottom >= headerRowNum) {
            Object.keys(colMap).forEach(header => {
                const col = colMap[header];
                if (col >= m.left && col <= m.right) colMap[header] = m.left;
            });
        }
    });

    // 2. Base styles
    const baseStyles = {};
    for (let c = 1; c <= maxCol; c++) {
        try { baseStyles[c] = JSON.parse(JSON.stringify(ws.getRow(dataStartRow).getCell(c).style || {})); }
        catch { baseStyles[c] = {}; }
    }

    // 3. Save merges in data/footer zones
    const saved = [];
    collectAllMerges(ws).forEach(ref => {
        const m = parseMerge(ref);
        if (!m || m.top < dataStartRow) return;
        saved.push({ ...m, zone: m.top >= footerStart ? 'footer' : 'data' });
    });

    // 4. Unmerge all
    saved.forEach(m => {
        try { ws.unMergeCells(makeMergeRef(m.top, m.left, m.bottom, m.right)); } catch { /* not merged */ }
    });

    // 5. Splice
    if (diff > 0) ws.spliceRows(dataStartRow + slots, 0, ...new Array(diff).fill([]));
    else if (diff < 0) ws.spliceRows(dataStartRow + neededRows, Math.abs(diff));

    // 6. Clear + style
    for (let i = 0; i < neededRows; i++) {
        const row = ws.getRow(dataStartRow + i);
        for (let c = 1; c <= maxCol; c++) {
            row.getCell(c).value = null;
            try { row.getCell(c).style = baseStyles[c]; } catch { /* keep default style */ }
        }
    }

    // 7. Write data
    sourceAllRows.forEach((src, idx) => {
        const row = ws.getRow(dataStartRow + idx);
        rules.forEach(rule => {
            if (rule.sourceCol && rule.targetCol && colMap[rule.targetCol]) {
                const val = src[rule.sourceCol];
                if (val !== undefined && val !== '') row.getCell(colMap[rule.targetCol]).value = val;
            }
        });
        row.commit();
    });

    // 8. Re-merge LAST
    // 8a. Data patterns (from first template data row only, single-row merges)
    const patterns = saved
        .filter(m => m.zone === 'data' && m.top === dataStartRow && m.bottom === m.top)
        .map(m => ({ left: m.left, right: m.right }));

    for (let i = 0; i < neededRows; i++) {
        const r = dataStartRow + i;
        patterns.forEach(p => { try { ws.mergeCells(makeMergeRef(r, p.left, r, p.right)); } catch { /* overlap */ } });
    }

    // 8b. Footer merges shifted by diff
    saved.filter(m => m.zone === 'footer').forEach(m => {
        const t = m.top + diff, b = m.bottom + diff;
        if (t > 0 && b > 0) { try { ws.mergeCells(makeMergeRef(t, m.left, b, m.right)); } catch { /* overlap */ } }
    });

    // 9 + 10. Header / footer zone edits — only cells the user actually edited,
    // so untouched rich text, dates, hyperlinks and formulas keep their original value.
    const applyEdits = (zone, rowOffset) => {
        if (!Array.isArray(zone)) return;
        zone.forEach(zr => {
            const rowNum = zr.rowNum + rowOffset;
            if (!Number.isInteger(rowNum) || rowNum <= 0) return;
            const row = ws.getRow(rowNum);
            zr.cells.forEach(cd => {
                if (!cd?.edited || !Number.isInteger(cd.col)) return;
                const cell = row.getCell(cd.col);
                cell.value = toCellValue(cd.value, cell.value);
            });
        });
    };
    applyEdits(headerZone, 0);
    applyEdits(footerZone, diff);

    // 11. Adjust formulas: rebuild data-zone ranges + shift footer refs
    const oldDataEnd = dataStartRow + slots - 1;
    const newDataEnd = dataStartRow + neededRows - 1;

    ws.eachRow(row => {
        row.eachCell(cell => {
            const v = cell.value;
            if (!v) return;

            let formula = null;
            if (typeof v === 'object' && v.formula) {
                formula = v.formula;
            } else if (typeof v === 'string' && v.startsWith('=')) {
                formula = v.substring(1);
            }
            if (!formula) return;

            // Pass 1: Fix RANGE references (e.g. SUM(H17:H29) → SUM(H19:H24))
            let adjusted = formula.replace(
                /(\$?[A-Z]+\$?)(\d+):(\$?[A-Z]+\$?)(\d+)/gi,
                (match, colRef1, row1Str, colRef2, row2Str) => {
                    const r1 = parseInt(row1Str, 10);
                    const r2 = parseInt(row2Str, 10);
                    const col1 = colRef1.replace(/\$/g, '').toUpperCase();
                    const col2 = colRef2.replace(/\$/g, '').toUpperCase();

                    // Vertical range that OVERLAPS the data zone → rebuild to exact data boundaries
                    if (col1 === col2 && r1 <= oldDataEnd && r2 >= dataStartRow && neededRows > 0) {
                        return `${colRef1}${dataStartRow}:${colRef2}${newDataEnd}`;
                    }
                    // Range entirely in footer zone → shift both ends by diff
                    if (r1 >= footerStart && r2 >= footerStart && diff !== 0) {
                        return `${colRef1}${r1 + diff}:${colRef2}${r2 + diff}`;
                    }
                    return match;
                }
            );

            // Pass 2: Fix STANDALONE references (not part of a range) to footer cells
            if (diff !== 0) {
                adjusted = adjusted.replace(
                    /(?<![:A-Z$!])(\$?[A-Z]+\$?)(\d+)(?![\d:(])/gi,
                    (match, colRef, rowStr) => {
                        const rowNum = parseInt(rowStr, 10);
                        if (rowNum >= footerStart) {
                            const newRow = rowNum + diff;
                            if (newRow > 0) return `${colRef}${newRow}`;
                        }
                        return match;
                    }
                );
            }

            if (adjusted !== formula) {
                cell.value = typeof v === 'object'
                    ? { formula: adjusted, result: v.result }
                    : { formula: adjusted };
            }
        });
    });

    // 12. Other worksheets are kept untouched (lookup lists, terms, etc.).
    return workbook.xlsx.writeBuffer();
};
