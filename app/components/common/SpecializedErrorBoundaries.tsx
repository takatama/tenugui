import { type ReactNode } from "react";
import { ErrorBoundary } from "./ErrorBoundary";

interface ApiErrorBoundaryProps {
  children: ReactNode;
  operation: string;
  onError?: (error: Error) => void;
}

/**
 * API関連のエラーに特化したエラー境界コンポーネント
 *
 * 外部API呼び出しや非同期処理でエラーが発生した際に、
 * ユーザーフレンドリーなエラーメッセージと再試行ボタンを表示します。
 *
 * @example
 * ```tsx
 * <ApiErrorBoundary operation="商品分析">
 *   <ProductAnalysisForm />
 * </ApiErrorBoundary>
 * ```
 */
export function ApiErrorBoundary({
  children,
  operation,
  onError,
}: ApiErrorBoundaryProps) {
  return (
    <ErrorBoundary
      context={{
        operation,
        additionalData: { component: "ApiErrorBoundary" },
      }}
      onError={(error, errorInfo) => {
        onError?.(error);
        // APIエラーの場合は追加の処理を実行可能
      }}
      fallback={(error, retry) => (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 m-2">
          <div className="flex items-center">
            <svg
              className="h-5 w-5 text-yellow-400 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-yellow-800">
                {operation}でエラーが発生しました
              </h4>
              <p className="text-sm text-yellow-700 mt-1">
                一時的な問題の可能性があります。再試行してください。
              </p>
            </div>
          </div>
          <div className="mt-3">
            <button
              onClick={retry}
              className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 transition-colors"
            >
              再読み込み
            </button>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

interface ImageErrorBoundaryProps {
  children: ReactNode;
  imageName?: string;
}

/**
 * 画像表示に特化したエラー境界コンポーネント
 *
 * 画像の読み込みエラーやレンダリングエラーが発生した際に、
 * 代替表示とエラーメッセージを提供します。
 *
 * @example
 * ```tsx
 * <ImageErrorBoundary imageName="商品画像">
 *   <img src={imageUrl} alt="商品" />
 * </ImageErrorBoundary>
 * ```
 */
export function ImageErrorBoundary({
  children,
  imageName,
}: ImageErrorBoundaryProps) {
  return (
    <ErrorBoundary
      context={{
        operation: "画像表示",
        additionalData: { imageName, component: "ImageErrorBoundary" },
      }}
      fallback={(error, retry) => (
        <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            画像を読み込めませんでした
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {imageName ? `${imageName}の` : ""}
            画像の表示中にエラーが発生しました
          </p>
          <button
            onClick={retry}
            className="mt-3 bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 transition-colors"
          >
            再試行
          </button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
