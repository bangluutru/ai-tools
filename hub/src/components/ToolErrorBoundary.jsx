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
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[500px] flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-md rounded-2xl border border-red-500/20 my-6">
          <div className="max-w-md text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shadow-lg shadow-red-500/10">
              <ShieldAlert size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">
                {this.props.toolName || 'Công cụ'} vừa gặp sự cố
              </h2>
              <p className="text-sm text-slate-400 mt-2">
                Sự cố này đã được cách ly an toàn. Các công cụ khác trên Hub vẫn hoạt động 100% bình thường.
              </p>
              {this.state.error && (
                <div className="mt-3 p-3 bg-slate-950/80 rounded-lg text-left text-xs font-mono text-red-400 border border-red-900/50 max-h-28 overflow-auto">
                  {this.state.error.toString()}
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-2 w-full">
              <button
                onClick={this.handleRetry}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
              >
                <RefreshCw size={15} /> Thử lại công cụ
              </button>
              {this.props.onBackToHub && (
                <button
                  onClick={this.props.onBackToHub}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm flex items-center justify-center gap-2 border border-slate-700 transition-all"
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
