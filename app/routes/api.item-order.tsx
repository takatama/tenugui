import { data, type ActionFunctionArgs } from "react-router";
import { reorderItems } from "../data/items";
import { requireAuthForAction } from "../lib/auth-guard";

export async function action({ request, context }: ActionFunctionArgs) {
  // 認証チェック
  await requireAuthForAction(request, context);

  // Cloudflare Pages のコンテキストから環境を取得
  const kv = context.cloudflare.env.TENUGUI_KV;

  if (request.method !== "PUT") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const requestData = (await request.json()) as {
      orders?: Record<string, number>;
      itemIds?: string[];
    };

    // 新しい形式（itemIds配列）と既存形式（orders）の両方をサポート
    if (requestData.itemIds && Array.isArray(requestData.itemIds)) {
      // 新しい配列ベースの並び替え
      await reorderItems(kv, requestData.itemIds);
    } else if (requestData.orders && typeof requestData.orders === "object") {
      // 既存のorders形式から配列に変換
      const sortedItems = Object.entries(requestData.orders)
        .sort(([, a], [, b]) => a - b)
        .map(([itemId]) => itemId);
      await reorderItems(kv, sortedItems);
    } else {
      return data(
        { error: "Either itemIds array or orders object is required" },
        { status: 400 }
      );
    }

    return data({ success: true });
  } catch (error) {
    console.error("Item order update error:", error);
    return data({ error: "Failed to update item orders" }, { status: 500 });
  }
}
