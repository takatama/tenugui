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

    if (requestData.itemIds && Array.isArray(requestData.itemIds)) {
      // 新しい配列ベースの並び替え
      await reorderItems(kv, requestData.itemIds);
    } else {
      return data({ error: "itemIds array is required" }, { status: 400 });
    }

    return data({ success: true });
  } catch (error) {
    console.error("Item order update error:", error);
    return data({ error: "Failed to update item orders" }, { status: 500 });
  }
}
