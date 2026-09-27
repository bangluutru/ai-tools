/**
 * Chèn <link rel="stylesheet"> một lần duy nhất cho mỗi href.
 *
 * Dùng cho font chỉ một miniapp cần: đặt chúng trong index.html thì mọi trang đều
 * phải tải CSS chặn render của cả họ font (bộ font Nhật + trang trí của Danh thiếp
 * từng làm CSS Google Fonts nặng ~390 KB gzip trên trang chủ).
 */
export function loadStylesheet(href) {
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`link[rel="stylesheet"][href="${CSS.escape(href)}"]`);
  if (existing) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}
