/**
 * 共通フック - APIリクエストとエラーハンドリング
 */
export { useApiRequest } from "./useApiRequest";
export { useAsyncOperation, type AsyncState } from "./useAsyncOperation";

/**
 * 認証関連
 */
export { useAuth } from "./useAuth";

/**
 * UI関連
 */
export { useDragAndDrop } from "./useDragAndDrop";
export { useAutoScroll } from "./useAutoScroll";

/**
 * フォーム・タグ管理関連
 */
export { useTagManager } from "./useTagManager";
export { useItemForm } from "./useItemForm";

/**
 * ビジネスロジック関連
 */
export { useProductAnalysis } from "./useProductAnalysis";
export { useTagAnalysis } from "./useTagAnalysis";

/**
 * エラーハンドリングユーティリティ
 */
export {
  handleError,
  logErrorDetails,
  type ErrorContext,
} from "../lib/errorHandler";
