import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw, Home, Shield, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class AdminErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Unconditionally log the exact error and stack trace to browser console for developer inspection
    console.error('🚨 [AdminErrorBoundary] Caught unhandled rendering exception in Admin Portal:');
    console.error(error);
    console.error(errorInfo.componentStack);

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetState = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('rcb_active_admin_role');
        localStorage.removeItem('rcb_sidebar_collapsed');
      }
    } catch (err) {
      void err;
    }
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.href = '/admin';
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#070709] text-gray-100 flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-gradient-to-b from-[#14141A] to-[#0A0A0D] border border-amber-500/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
            
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 mx-auto flex items-center justify-center mb-5 shadow-lg shadow-rose-500/5">
              <AlertOctagon className="w-8 h-8 text-rose-400" />
            </div>

            <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-amber-400/90 block mb-1 text-center">
              EXECUTIVE PORTAL RECOVERY
            </span>
            <h2 className="text-2xl text-white font-semibold mb-2 text-center admin-page-heading">
              Admin Workspace Diagnostic Intercept
            </h2>
            <p className="text-xs text-gray-400 leading-relaxed mb-6 text-center">
              An unexpected component error occurred while rendering the administration dashboard. All core database records and authentication tokens remain intact.
            </p>

            {/* Error Details Card */}
            {this.state.error && (
              <div className="mb-6 p-4 rounded-xl bg-black/60 border border-rose-500/20 text-left">
                <div className="flex items-center gap-2 mb-2 text-rose-400 text-xs font-semibold">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Exception: {this.state.error.name || 'Runtime Error'}</span>
                </div>
                <p className="font-mono text-xs text-rose-300 break-words leading-relaxed">
                  {this.state.error.message || this.state.error.toString()}
                </p>
                {this.state.errorInfo?.componentStack && (
                  <details className="mt-3 text-[11px] text-gray-400">
                    <summary className="cursor-pointer hover:text-amber-400 transition-colors select-none font-mono text-[10px]">
                      View Component Stack Trace
                    </summary>
                    <pre className="mt-2 p-2.5 rounded bg-black/80 font-mono text-[10px] text-gray-400 overflow-x-auto max-h-48 whitespace-pre-wrap leading-tight border border-gray-800">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Recovery Action Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-110 text-black font-semibold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Dashboard</span>
              </button>

              <button
                onClick={this.handleResetState}
                className="py-3 px-4 rounded-xl bg-[#1A1A22] hover:bg-[#22222D] text-gray-200 border border-[#2F2F3D] font-medium text-xs transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span>Reset Workspace State</span>
              </button>
            </div>

            <button
              onClick={this.handleGoHome}
              className="w-full mt-4 py-2.5 text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center justify-center gap-1.5"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Return to Storefront</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AdminErrorBoundary;
