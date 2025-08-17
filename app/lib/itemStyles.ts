import type { ItemStatus } from "../types/status";
import { isUnpurchased, STATUS_LABELS } from "../types/status";

/**
 * アイテムのステータスに基づくスタイルを生成する関数
 */
export function getItemStatusStyles(status?: ItemStatus) {
  if (isUnpurchased(status)) {
    return "ring-2 ring-gray-300 bg-gray-50 opacity-75";
  }
  return "";
}

/**
 * 未購入アイテムのバッジ表示に関連するスタイリング定数
 */
export const STATUS_BADGE_STYLES = {
  base: "bg-blue-950 bg-opacity-90 text-white text-xs px-2 py-1 rounded-full",
  position: {
    topRight: "absolute top-1 right-1",
    topLeft: "absolute top-1 left-1",
    bottomRight: "absolute bottom-1 right-1",
    bottomLeft: "absolute bottom-1 left-1",
  },
  unpurchased: STATUS_LABELS.unpurchased,
} as const;
