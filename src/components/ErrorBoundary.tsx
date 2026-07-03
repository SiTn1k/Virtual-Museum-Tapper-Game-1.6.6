import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
    
    // Report to analytics if available
    if (typeof window !== 'undefined' && 'Sentry' in window) {
      (window as unknown as { Sentry: { captureException: (err: Error) => void } }).Sentry?.captureException(error);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full text-center border border-red-500/30">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Щось пішло не так</h2>
            <p className="text-gray-400 text-sm mb-4">
              Ми вже працюємо над виправленням. Спробуйте оновити гру.
            </p>
            {this.state.error && (
              <details className="text-left bg-black/30 rounded-lg p-3 mb-4">
                <summary className="text-xs text-gray-500 cursor-pointer">
                  Деталі помилки
                </summary>
                <pre className="text-xs text-red-400 mt-2 overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <button
              onClick={this.handleRetry}
              className="w-full py-3 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Спробувати знову
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for easy error boundary usage
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = (err: Error) => {
    setError(err);
  };

  const resetError = () => {
    setError(null);
  };

  return { error, handleError, resetError };
}

// Simple component wrapper for lazy loading safety
interface SafeLoadProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface SafeLoadState {
  hasError: boolean;
}

export class SafeLoad extends Component<SafeLoadProps, SafeLoadState> {
  constructor(props: SafeLoadProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center p-4">
          <div className="text-gray-500 text-sm">Помилка завантаження...</div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Need to import React for useErrorHandler hook
import React from 'react';
