import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(_error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center bg-red-50 rounded-xl border border-red-100">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Đã xảy ra lỗi!</h2>
          <p className="text-gray-600 mb-6 max-w-md">
            Hệ thống gặp sự cố khi tải thành phần này. Vui lòng thử tải lại trang hoặc liên hệ quản trị viên.
          </p>
          
          <div className="flex gap-3">
             <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Tải lại trang
            </button>
          </div>

          {import.meta.env.DEV && this.state.error && (
            <div className="mt-8 text-left w-full max-w-2xl overflow-auto bg-gray-900 text-red-100 p-4 rounded-lg text-xs font-mono">
              <p className="font-bold text-red-400 mb-2">{this.state.error.toString()}</p>
              <pre>{this.state.errorInfo?.componentStack}</pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
