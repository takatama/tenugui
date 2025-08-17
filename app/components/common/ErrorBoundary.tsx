import React, { type ErrorInfo, type ReactNode } from "react";
import {
  handleError,
  logErrorDetails,
  type ErrorContext,
} from "../../lib/errorHandler";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, retryHandler?: () => void) => ReactNode;
  context: ErrorContext;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

/**
 * 汎用エラー境界コンポーネント
 *
 * Reactコンポーネントツリー内で発生したJavaScriptエラーをキャッチし、
 * アプリケーション全体のクラッシュを防ぎます。統一されたエラーハンドリングと
 * ユーザーフレンドリーなフォールバックUIを提供します。
 *
 * @example
 * ```tsx
 * <ErrorBoundary context={{ operation: "データ表示" }}>
 *   <DataVisualization />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      errorInfo,
    });

    // 統一エラーハンドラーを使用
    const userMessage = handleError(error, this.props.context);
    logErrorDetails(error, this.props.context);

    // 親コンポーネントへの通知
    this.props.onError?.(error, errorInfo);

    // エラー詳細をログに記録
    console.error("ErrorBoundary caught an error:", {
      error,
      errorInfo,
      context: this.props.context,
      userMessage,
    });
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // カスタムフォールバックUIがある場合
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      // デフォルトフォールバックUI
      const userMessage = handleError(this.state.error, this.props.context);

      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">
                エラーが発生しました
              </h3>
              <p className="mt-2 text-sm text-red-700">{userMessage}</p>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={this.handleRetry}
                  className="bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                >
                  再試行
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * 関数型コンポーネント向けのエラー境界フック
 *
 * 関数型コンポーネント内でエラーをエラー境界にスローするためのフックです。
 * 非同期処理やイベントハンドラー内で発生したエラーを
 * エラー境界でキャッチできるようにします。
 *
 * @returns captureError - エラーをエラー境界にスローする関数
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const captureError = useErrorBoundary();
 *
 *   const handleAsyncError = async () => {
 *     try {
 *       await riskyAsyncOperation();
 *     } catch (error) {
 *       captureError(error);
 *     }
 *   };
 * }
 * ```
 */
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return captureError;
}
