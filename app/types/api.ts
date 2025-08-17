/**
 * API レスポンス型定義
 */

import type { TagAnalysis } from "../data/items";

// 型のみをexportするための再エクスポート
export type { Item, TagAnalysis } from "../data/items";
export type { ItemStatus } from "./status";

/**
 * 商品分析のリクエスト・レスポンス型
 */
export interface ProductAnalysisRequest {
  productUrl: string;
  maxImages?: number;
}

export interface ProductAnalysisResponse {
  name: string;
  imageUrls: string[];
}

/**
 * タグ分析のリクエスト・レスポンス型
 */
export interface TagAnalysisRequest {
  imageUrl: string;
  existingTags?: string[];
}

export interface TagAnalysisResponse {
  tags: string[];
  description: string;
  colors: string[];
  patterns: string[];
  confidence: number;
  analyzedAt: string;
}

/**
 * タグ削除のリクエスト・レスポンス型
 */
export interface TagDeleteRequest {
  tagName: string;
}

export interface TagDeleteResponse {
  success: boolean;
  deletedCount: number;
}

/**
 * タグ名変更のリクエスト・レスポンス型
 */
export interface TagRenameRequest {
  oldTagName: string;
  newTagName: string;
}

export interface TagRenameResponse {
  success: boolean;
  updatedCount: number;
}

/**
 * アイテム順序変更のリクエスト・レスポンス型
 */
export interface ItemOrderRequest {
  itemIds: string[];
}

export interface ItemOrderResponse {
  success: boolean;
}

/**
 * 認証のレスポンス型
 */
export interface AuthResponse {
  user?: {
    email: string;
    name?: string;
  };
  isAuthenticated: boolean;
}

/**
 * エラーレスポンス型
 */
export interface ApiErrorResponse {
  error: string;
  details?: string;
  code?: string;
}

/**
 * API レスポンスの型ガード
 */
export function isApiErrorResponse(
  response: unknown
): response is ApiErrorResponse {
  return (
    typeof response === "object" &&
    response !== null &&
    "error" in response &&
    typeof (response as ApiErrorResponse).error === "string"
  );
}

/**
 * 成功レスポンスの型ガード
 */
export function isSuccessResponse<T>(
  response: unknown,
  validator?: (data: unknown) => data is T
): response is T {
  if (isApiErrorResponse(response)) {
    return false;
  }
  return validator ? validator(response) : true;
}
