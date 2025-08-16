import { useState, useCallback } from "react";

/**
 * 非同期操作の状態
 */
export interface AsyncState<T> {
  /** 実行結果のデータ */
  data: T | null;
  /** 実行中かどうか */
  loading: boolean;
  /** エラーメッセージ */
  error: string | null;
}

/**
 * 非同期操作を管理する共通フック
 *
 * @param operation - 実行する非同期関数
 * @returns 状態と実行関数
 *
 * @example
 * ```tsx
 * const productAnalysis = useAsyncOperation(async (url: string) => {
 *   const response = await fetch('/api/product-analysis', {
 *     method: 'POST',
 *     body: JSON.stringify({ productUrl: url })
 *   });
 *   return response.json();
 * });
 *
 * const handleAnalyze = () => {
 *   productAnalysis.execute(productUrl);
 * };
 *
 * if (productAnalysis.loading) return <div>分析中...</div>;
 * if (productAnalysis.error) return <div>エラー: {productAnalysis.error}</div>;
 * if (productAnalysis.data) return <div>結果: {productAnalysis.data}</div>;
 * ```
 */
export function useAsyncOperation<T, P extends any[] = []>(
  operation: (...params: P) => Promise<T>
) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...params: P): Promise<T | null> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const result = await operation(...params);
        setState({ data: result, loading: false, error: null });
        return result;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error occurred";
        setState((prev) => ({ ...prev, loading: false, error: message }));
        return null;
      }
    },
    [operation]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  const setData = useCallback((data: T | null) => {
    setState((prev) => ({ ...prev, data }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  return {
    ...state,
    execute,
    reset,
    setData,
    setError,
  };
}
