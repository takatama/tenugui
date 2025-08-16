import { useState, useCallback } from "react";

/**
 * API リクエストを管理する共通フック
 *
 * @example
 * ```tsx
 * const { request, loading, error } = useApiRequest<ProductData>();
 *
 * const handleAnalyze = async () => {
 *   try {
 *     const result = await request('/api/product-analysis', {
 *       method: 'POST',
 *       body: JSON.stringify({ productUrl })
 *     });
 *     console.log(result);
 *   } catch (err) {
 *     // エラーは自動的にstateに設定される
 *   }
 * };
 * ```
 */
export function useApiRequest<T = any>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(
    async (endpoint: string, options: RequestInit = {}): Promise<T> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(endpoint, {
          headers: {
            "Content-Type": "application/json",
            ...((options.headers as Record<string, string>) || {}),
          },
          ...options,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = (await response.json()) as T;
        return data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unknown error occurred";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setError(null);
  }, []);

  return {
    request,
    loading,
    error,
    reset,
  };
}
