/**
 * Status types for invoice XML extraction & retrieval.
 */
export const STATUS_TYPES = Object.freeze({
  READY: 'READY', // XML fetched, parsed, and verified successfully
  CAPTCHA_REQUIRED: 'CAPTCHA_REQUIRED', // Provider portal requires CAPTCHA verification
  MANUAL_REQUIRED: 'MANUAL_REQUIRED', // Provider portal requires manual interaction / session / login
  UNSUPPORTED: 'UNSUPPORTED', // PDF is scanned (no text layer) or lookup info not found
  ERROR: 'ERROR', // Network error, corrupted PDF, or invalid response
});

export const STATUS_LABELS = Object.freeze({
  [STATUS_TYPES.READY]: {
    vn: 'XML sẵn sàng',
    en: 'XML Ready',
    ja: 'XML準備完了',
    badgeClass: 'bg-secondary/15 text-secondary border-secondary/30',
  },
  [STATUS_TYPES.CAPTCHA_REQUIRED]: {
    vn: 'Cần xác thực CAPTCHA',
    en: 'CAPTCHA Required',
    ja: 'CAPTCHA認証が必要',
    badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  },
  [STATUS_TYPES.MANUAL_REQUIRED]: {
    vn: 'Cần mở website',
    en: 'Open Website',
    ja: 'サイトで確認',
    badgeClass: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30',
  },
  [STATUS_TYPES.UNSUPPORTED]: {
    vn: 'Chưa hỗ trợ / Scan',
    en: 'Unsupported / Scan',
    ja: '未対応 / スキャン',
    badgeClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
  },
  [STATUS_TYPES.ERROR]: {
    vn: 'Lỗi tra cứu',
    en: 'Lookup Error',
    ja: 'エラー',
    badgeClass: 'bg-error/15 text-error border-error/30',
  },
});

export const XML_FETCHER_LIMITS = Object.freeze({
  maxFiles: 50,
  MAX_BATCH_FILES: 50,
  maxPdfPages: 10,
  maxFileBytes: 25 * 1024 * 1024, // 25 MB
  concurrencyLimit: 4, // Max concurrent PDF extractions
  MAX_CONCURRENT_WORKERS: 4,
  directDownloadTimeoutMs: 8000, // 8s direct download timeout
  DIRECT_DOWNLOAD_TIMEOUT_MS: 8000,
});
