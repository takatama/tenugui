/**
 * エラーコンテキスト情報
 */
export interface ErrorContext {
  /** 実行していた操作の名前 */
  operation: string;
  /** ユーザーID（認証済みの場合） */
  userId?: string;
  /** 追加のデバッグ情報 */
  additionalData?: Record<string, any>;
}

/**
 * 構造化されたエラーログ
 */
interface ErrorLog {
  message: string;
  context: ErrorContext;
  timestamp: string;
  stack?: string;
  userAgent?: string;
}

/**
 * エラーを統一的に処理し、ユーザー向けメッセージを返す
 *
 * @param error - 発生したエラー
 * @param context - エラーコンテキスト
 * @returns ユーザー向けエラーメッセージ
 *
 * @example
 * ```tsx
 * try {
 *   await apiCall();
 * } catch (error) {
 *   const userMessage = handleError(error, {
 *     operation: '商品分析',
 *     userId: user?.id,
 *     additionalData: { productUrl }
 *   });
 *   setErrorMessage(userMessage);
 * }
 * ```
 */
export function handleError(error: unknown, context: ErrorContext): string {
  const errorMessage = error instanceof Error ? error.message : String(error);

  // 構造化ログを出力
  const errorLog: ErrorLog = {
    message: errorMessage,
    context,
    timestamp: new Date().toISOString(),
    stack: error instanceof Error ? error.stack : undefined,
    userAgent:
      typeof window !== "undefined" ? window.navigator.userAgent : undefined,
  };

  console.error(`[${context.operation}] Error:`, errorLog);

  // ユーザー向けメッセージを生成
  return getUserFriendlyMessage(error, context.operation);
}

/**
 * エラーの種類に応じてユーザー向けメッセージを生成
 */
function getUserFriendlyMessage(error: unknown, operation: string): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // HTTPエラーの場合
    if (message.includes("http 4")) {
      return `${operation}のリクエストに問題があります。入力内容を確認してください。`;
    }

    if (message.includes("http 5")) {
      return `${operation}でサーバーエラーが発生しました。しばらく時間をおいて再試行してください。`;
    }

    // ネットワークエラーの場合
    if (message.includes("fetch") || message.includes("network")) {
      return "ネットワークエラーが発生しました。インターネット接続を確認してください。";
    }

    // タイムアウトエラーの場合
    if (message.includes("timeout")) {
      return `${operation}がタイムアウトしました。再試行してください。`;
    }

    // 認証エラーの場合
    if (message.includes("unauthorized") || message.includes("401")) {
      return "ログインが必要です。再度ログインしてください。";
    }
  }

  // デフォルトメッセージ
  return `${operation}中にエラーが発生しました。しばらく時間をおいて再試行してください。`;
}

/**
 * 開発環境でのみエラーの詳細を表示
 */
export function logErrorDetails(error: unknown, context: ErrorContext): void {
  // 開発環境での詳細ログ出力
  if (
    typeof window !== "undefined" &&
    window.location.hostname === "localhost"
  ) {
    console.group(`🚨 Error in ${context.operation}`);
    console.error("Error:", error);
    console.log("Context:", context);
    if (error instanceof Error && error.stack) {
      console.log("Stack trace:", error.stack);
    }
    console.groupEnd();
  }
}
