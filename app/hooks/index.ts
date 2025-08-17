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
 * ビジネスロジック関連
 */
export { useProductAnalysis } from "./useProductAnalysis";
export { useTagAnalysis } from "./useTagAnalysis";
export { useItemForm } from "./useItemForm";
export { useItemForm as useItemFormShared } from "./useItemFormShared";
export { useEditItemForm } from "./useEditItemForm";

/**
 * エラーハンドリングユーティリティ
 */
export {
  handleError,
  logErrorDetails,
  type ErrorContext,
} from "../lib/errorHandler";
