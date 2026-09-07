import { lazy } from 'react';

/**
 * Bọc React.lazy với cơ chế tự động phục hồi khi chunk JS bị 404 (do deploy bản mới).
 * Khi gặp lỗi 'Failed to fetch dynamically imported module' hoặc lỗi mạng chunk:
 * - Kiểm tra sessionStorage xem đã reload trong phiên duyệt này cho tool này chưa.
 * - Nếu chưa reload: tự động gọi window.location.reload() để trình duyệt lấy index.html mới nhất và chunk mới.
 * - Nếu đã thử reload rồi mà vẫn lỗi: ném error ra cho ToolErrorBoundary xử lý.
 */
export function lazyWithRetry(componentImport, explicitToolId = null) {
  let toolId = explicitToolId;
  if (!toolId) {
    try {
      const match = String(componentImport).match(/\.\/tools(?:-in-development)?\/([a-zA-Z0-9_-]+)\//);
      toolId = match ? match[1] : 'tool';
    } catch {
      toolId = 'tool';
    }
  }

  return lazy(async () => {
    const storageKey = `ai_tools_chunk_retry_${toolId}`;
    const pageHasAlreadyBeenReloaded = sessionStorage.getItem(storageKey);

    try {
      const module = await componentImport();
      sessionStorage.removeItem(storageKey);
      return module;
    } catch (error) {
      const errorMessage = String(error?.message || error || '').toLowerCase();
      const isChunkError =
        error?.name === 'ChunkLoadError' ||
        errorMessage.includes('dynamically imported module') ||
        errorMessage.includes('loading chunk') ||
        errorMessage.includes('failed to fetch');

      if (isChunkError && !pageHasAlreadyBeenReloaded) {
        sessionStorage.setItem(storageKey, String(Date.now()));
        console.warn(`[lazyWithRetry] Phát hiện phiên bản mới hoặc lỗi chunk cho ${toolId}, đang tự động tải lại trang...`);
        window.location.reload();
        return new Promise(() => {});
      }

      console.error(`[lazyWithRetry] Không thể nạp module cho ${toolId}:`, error);
      throw error;
    }
  });
}
