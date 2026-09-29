/**
 * Chỗ nối duy nhất giữa Toolio và gói ô tìm kiếm dùng chung @chotto/search.
 *
 * Mọi ô tìm kiếm/lọc của Toolio — navbar hub, bảng lệnh ⌘K, ô lọc trong từng
 * miniapp — đi qua file này. Đừng viết <input> tìm kiếm riêng: cần hành vi mới
 * thì thêm vào gói (repo bangluutru/chotto-search), mọi site Chotto cùng có.
 *
 * Phần của riêng Toolio nằm ở đây:
 * - Chữ giao diện theo `displayLang` (vi/en/ja). Toolio không có hệ i18n, nên
 *   nhãn của gói ("Xem tất cả…", "Không thấy…", nút ×) phải truyền vào theo
 *   ngôn ngữ đang chọn; mặc định của gói là tiếng Việt.
 * - `resetKey`: Toolio không có react-router. Hub tự định tuyến bằng
 *   pushState + sự kiện `toolio:navigate` (hub/src/utils/navigation.js), nên
 *   hook tự nghe sự kiện đó và popstate để đóng/xoá ô khi đổi trang.
 * - Điều hướng: gói không biết `navigate()` của hub. Ô nào dẫn sang trang khác
 *   (bảng lệnh) tự truyền `onChoose`.
 *
 * Giao diện: ToolioSearchBox.jsx (SearchBoxView + nhãn theo ngôn ngữ).
 * Màu: `--cs-*` map sang token Toolio ở hub/src/index.css, một lần.
 */
import { useEffect, useState } from 'react';
import { useSearchBox } from '@chotto/search';

// Trùng với NAVIGATE_EVENT của hub/src/utils/navigation.js. Core không import
// ngược từ hub được, nên chép tên sự kiện; test canh ở hub/tests.
export const TOOLIO_NAVIGATE_EVENT = 'toolio:navigate';

const LABELS = {
  vi: {
    listbox: 'Gợi ý tìm kiếm',
    empty: (q) => `Không thấy kết quả khớp “${q}”.`,
    seeAll: (q) => `Xem tất cả kết quả cho “${q}”`,
    clear: 'Xoá từ khoá',
    submit: 'Tìm',
  },
  en: {
    listbox: 'Search suggestions',
    empty: (q) => `Nothing matched “${q}”.`,
    seeAll: (q) => `See all results for “${q}”`,
    clear: 'Clear search',
    submit: 'Search',
  },
  ja: {
    listbox: '検索候補',
    empty: (q) => `「${q}」に一致する項目はありません。`,
    seeAll: (q) => `「${q}」の結果をすべて見る`,
    clear: 'クリア',
    submit: '検索',
  },
};

/** 'vn' (DocStudio), 'jp' → mã chuẩn; lạ thì tiếng Việt. */
export function toolioLang(lang) {
  if (lang === 'en') return 'en';
  if (lang === 'ja' || lang === 'jp') return 'ja';
  return 'vi';
}

/** Nhãn của gói theo ngôn ngữ Toolio. */
export function searchLabels(lang) {
  return LABELS[toolioLang(lang)];
}

/** Chọn chuỗi theo ngôn ngữ từ một object { vi, en, ja }. */
export function pickLang(map, lang) {
  return map[toolioLang(lang)] ?? map.vi;
}

function currentPath() {
  return typeof window === 'undefined' ? '' : window.location.pathname;
}

/** Pathname hiện tại, cập nhật theo điều hướng tự viết của hub. */
function useToolioPathname() {
  const [pathname, setPathname] = useState(currentPath);
  useEffect(() => {
    const sync = () => setPathname(currentPath());
    window.addEventListener('popstate', sync);
    window.addEventListener(TOOLIO_NAVIGATE_EVENT, sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener(TOOLIO_NAVIGATE_EVENT, sync);
    };
  }, []);
  return pathname;
}

/**
 * Như useSearchBox của gói, thêm `resetKey` mặc định là pathname hiện tại.
 * @param {import('@chotto/search').UseSearchBoxOptions} [opts]
 */
export function useToolioSearch(opts = {}) {
  const pathname = useToolioPathname();
  return useSearchBox({ resetKey: pathname, ...opts });
}
