import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('⚠️ [ErrorBoundary Caught Error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-slate-900 border border-red-500/30 rounded-2xl p-8 text-center shadow-2xl backdrop-blur-xl">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">Something Went Wrong</h2>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              An unexpected error occurred in this module. The emergency dispatch core services remain active.
            </p>

            {this.state.error && (
              <div className="text-left bg-slate-950/80 p-3.5 rounded-lg border border-slate-800 text-xs text-red-300 font-mono mb-6 overflow-x-auto max-h-32">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-cyan-600/20"
              >
                <RefreshCw className="w-4 h-4" /> Reload Page
              </button>
              <a
                href="/"
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm flex items-center justify-center gap-2 transition border border-slate-700"
              >
                <Home className="w-4 h-4" /> Go to Dashboard
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
