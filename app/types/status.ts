/**
 * アイテムのステータス型定義
 */
export type ItemStatus = "purchased" | "unpurchased";

/**
 * ステータスの表示テキスト
 */
export const STATUS_LABELS: Record<ItemStatus, string> = {
  purchased: "購入済み",
  unpurchased: "未購入",
} as const;

/**
 * ステータスのデフォルト値
 */
export const DEFAULT_STATUS: ItemStatus = "purchased";

/**
 * ステータスが未購入かどうかを判定する関数
 */
export function isUnpurchased(status?: ItemStatus): boolean {
  return status === "unpurchased";
}

/**
 * ステータスに応じた表示テキストを取得する関数
 */
export function getStatusLabel(status?: ItemStatus): string {
  return STATUS_LABELS[status || DEFAULT_STATUS];
}
