import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Sparkles } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isChunkLoadError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isChunkLoadError: false,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    const isChunkLoadError = 
      error.message?.includes('Failed to fetch dynamically imported module') ||
      error.message?.includes('Expected a JavaScript-or-Wasm module script') ||
      error.message?.includes('dynamically imported module');

    return {
      hasError: true,
      error,
      errorInfo: null,
      isChunkLoadError: Boolean(isChunkLoadError),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    const isChunkLoadError = 
      error.message?.includes('Failed to fetch dynamically imported module') ||
      error.message?.includes('Expected a JavaScript-or-Wasm module script') ||
      error.message?.includes('dynamically imported module');

    if (isChunkLoadError && typeof window !== 'undefined') {
      const lastReload = sessionStorage.getItem('yazhini_last_chunk_reload');
      const now = Date.now();
      if (!lastReload || now - Number(lastReload) > 8000) {
        sessionStorage.setItem('yazhini_last_chunk_reload', String(now));
        window.location.reload();
        return;
      }
    }

    this.setState({
      error,
      errorInfo,
      isChunkLoadError: Boolean(isChunkLoadError),
    });
  }

  handleReset = () => {
    if (this.state.isChunkLoadError && typeof window !== 'undefined') {
      window.location.reload();
      return;
    }
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isChunkLoadError: false,
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      if (this.state.isChunkLoadError) {
        return (
          <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center px-4 font-sans text-stone-200">
            <div className="max-w-md w-full bg-neutral-950 border border-amber-600/30 rounded-2xl shadow-2xl p-8 text-center">
              <div className="flex items-center justify-center mb-5">
                <div className="bg-amber-500/10 p-4 rounded-full border border-amber-500/20">
                  <Sparkles className="h-8 w-8 text-amber-400" />
                </div>
              </div>

              <h1 className="text-xl font-serif font-bold text-amber-200 mb-2">
                Boutique Update Available
              </h1>
              <p className="text-stone-400 text-sm mb-6 leading-relaxed">
                A fresh version of YAZHINI Fine Jewels has been released. Please refresh the page to load the updated boutique interface.
              </p>

              <button
                onClick={() => window.location.reload()}
                className="w-full flex items-center justify-center px-5 py-3 rounded-xl text-sm font-medium text-neutral-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                <RefreshCw className="h-4 w-4 mr-2 animate-spin-slow" />
                Reload Application
              </button>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle className="h-10 w-10 text-red-600" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Something went wrong
            </h1>
            <p className="text-gray-600 text-center mb-6">
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-semibold text-red-800 mb-2">Error Details:</p>
                <p className="text-xs text-red-700 font-mono break-all">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="text-xs text-red-600 cursor-pointer">
                      Stack Trace
                    </summary>
                    <pre className="text-xs text-red-700 mt-2 overflow-auto max-h-40">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
              >
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
