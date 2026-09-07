import React from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

export default class ToolErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🛡️ [ToolErrorBoundary] Caught isolated error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    const errorMessage = String(this.state.error?.message || this.state.error || '').toLowerCase();
    const isChunkError =
      this.state.error?.name === 'ChunkLoadError' ||
      errorMessage.includes('dynamically imported module') ||
      errorMessage.includes('loading chunk') ||
      errorMessage.includes('failed to fetch');

    if (isChunkError) {
      window.location.reload();
      return;
    }

    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      const errorMessage = String(this.state.error?.message || this.state.error || '').toLowerCase();
      const isChunkError =
        this.state.error?.name === 'ChunkLoadError' ||
        errorMessage.includes('dynamically imported module') ||
        errorMessage.includes('loading chunk') ||
        errorMessage.includes('failed to fetch');

      return (
        <div className="min-h-[500px] flex items-center justify-center p-6 bg-surface-container/80 backdrop-blur-md rounded-2xl border border-error/20 my-6">
          <div className="max-w-md text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-error/10 border border-error/30 flex items-center justify-center text-error shadow-lg shadow-error/10">
              <ShieldAlert size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-on-surface">
                {isChunkError
                  ? `${this.props.toolName || 'Công cụ'} cần cập nhật phiên bản mới`
                  : `${this.props.toolName || 'Công cụ'} vừa gặp sự cố`}
              </h2>
              <p className="text-sm text-on-surface-variant mt-2">
                {isChunkError
                  ? 'Hệ thống vừa cập nhật phiên bản mới trên máy chủ. Trình duyệt cần làm mới để nạp mã nguồn mới nhất.'
                  : 'Sự cố này đã được cách ly an toàn. Các công cụ khác trên Hub vẫn hoạt động 100% bình thường.'}
              </p>
              {this.state.error && (
                <div className="mt-3 p-3 bg-surface-container-low rounded-lg text-left text-xs font-mono text-error border border-error/30 max-h-28 overflow-auto">
                  {this.state.error.toString()}
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-2 w-full">
              <button
                type="button"
                onClick={this.handleRetry}
                className="flex-1 py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
              >
                <RefreshCw size={15} />
                {isChunkError ? 'Cập nhật & Tải lại' : 'Thử lại công cụ'}
              </button>
              {this.props.onBackToHub && (
                <button
                  type="button"
                  onClick={this.props.onBackToHub}
                  className="py-2.5 px-4 rounded-xl bg-surface-container-high hover:bg-surface-subtle text-on-surface font-semibold text-sm flex items-center justify-center gap-2 border border-border-subtle transition-all cursor-pointer"
                >
                  <Home size={15} /> Về Trang Chủ
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
