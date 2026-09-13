export const MAX_ROWS_PER_PDF_PAGE = 100;

export function paginateRows(rows, pageSize = MAX_ROWS_PER_PDF_PAGE) {
  if (!Number.isInteger(pageSize) || pageSize < 1) {
    throw new Error('Kích thước trang phải là số nguyên dương.');
  }
  if (!Array.isArray(rows) || rows.length === 0) return [[]];
  return Array.from({ length: Math.ceil(rows.length / pageSize) }, (_, index) =>
    rows.slice(index * pageSize, (index + 1) * pageSize)
  );
}
