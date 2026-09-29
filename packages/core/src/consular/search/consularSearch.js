/**
 * @file consular/search/consularSearch.js
 * Tìm kiếm thủ tục lãnh sự: không phân biệt dấu (an toàn NFC/NFD), theo từ khóa (token),
 * hỗ trợ câu tự nhiên ("tôi muốn làm lại hộ chiếu bị mất"), không dấu ("ho chieu", "ket hon") và tiếng Nhật ("パスポート").
 * Bỏ dấu bằng foldText của gói dùng chung @chotto/search, như mọi ô tìm kiếm khác của Toolio.
 */
import { foldText } from '@chotto/search';
import { CONSULAR_PROCEDURES } from '../procedures/index.js';

const CJK_RE = /[぀-ヿ㐀-䶿一-鿿]/;

// Từ đệm trong câu tự nhiên (đã bỏ dấu) — không mang nghĩa phân loại thủ tục.
const STOPWORDS = new Set([
  'toi', 'minh', 'em', 'anh', 'chi', 'ban', 'muon', 'can', 'phai', 'lam', 'the', 'nao', 'sao', 'gi', 'cho',
  'o', 'tai', 'nhat', 'ban', 'va', 'voi', 'cua', 'la', 'co', 'khong', 'duoc', 'hay', 'giup', 'huong', 'dan',
  'thu', 'tuc', 'di', 'dang', 'bi', 'nhu', 'nhe', 'a', 'oi', 've', 'mot', 'cac', 'nhung', 'de', 'khi', 'thi',
  'i', 'want', 'to', 'how', 'do', 'the', 'my', 'a', 'an', 'in', 'japan', 'need', 'for',
]);

export function foldConsularText(text) {
  if (!text) return '';
  return foldText(text)
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(folded) {
  return folded.split(' ').filter((t) => t && !STOPWORDS.has(t));
}

function buildHaystack(p) {
  const parts = [
    p.title?.vi, p.title?.en, p.title?.ja,
    typeof p.summary === 'string' ? p.summary : p.summary?.vi,
    ...(p.aliases || []),
  ];
  const folded = foldConsularText(parts.filter(Boolean).join(' | '));
  const primary = foldConsularText([p.title?.vi, p.title?.en, p.title?.ja, ...(p.aliases || [])].filter(Boolean).join(' | '));
  return { folded: ` ${folded} `, primary: ` ${primary} ` };
}

/**
 * @param {string} query
 * @param {Array} [procedures=CONSULAR_PROCEDURES]
 * @returns {Array} thủ tục khớp, sắp xếp theo mức liên quan (query rỗng → toàn bộ danh sách)
 */
export function searchConsularProcedures(query, procedures = CONSULAR_PROCEDURES) {
  const raw = String(query || '').trim();
  if (!raw) return procedures;
  const folded = foldConsularText(raw);
  if (!folded) return procedures;

  const isCjk = CJK_RE.test(folded);
  const tokens = isCjk ? [] : tokenize(folded);
  const bigrams = [];
  for (let i = 0; i < tokens.length - 1; i++) bigrams.push(`${tokens[i]} ${tokens[i + 1]}`);

  const scored = [];
  for (const p of procedures) {
    const hay = buildHaystack(p);
    let score = 0;

    // Cụm nguyên văn (đã bỏ dấu)
    if (folded.length >= (isCjk ? 1 : 2) && hay.primary.includes(isCjk ? folded : ` ${folded} `)) score += 50;
    else if (folded.length >= (isCjk ? 2 : 3) && hay.folded.includes(folded)) score += 20;

    if (isCjk) {
      if (score > 0) scored.push({ p, score });
      continue;
    }
    if (tokens.length === 0) {
      if (score > 0) scored.push({ p, score });
      continue;
    }

    let matched = 0;
    for (const tk of tokens) {
      if (hay.primary.includes(` ${tk} `)) { matched++; score += 6; }
      else if (hay.folded.includes(` ${tk} `)) { matched++; score += 3; }
    }
    let bigramHits = 0;
    for (const bg of bigrams) {
      if (hay.primary.includes(` ${bg} `)) { bigramHits++; score += 12; }
      else if (hay.folded.includes(` ${bg} `)) { bigramHits++; score += 5; }
    }

    const coverage = matched / tokens.length;
    const relevant = score >= 50 || bigramHits > 0 || (tokens.length === 1 ? matched === 1 : coverage >= 0.6);
    if (relevant && score > 0) scored.push({ p, score });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.p);
}
