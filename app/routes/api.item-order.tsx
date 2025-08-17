import { data, type ActionFunctionArgs } from "react-router";
import { reorderItems } from "../data/items";
import { requireAuthForAction } from "../lib/auth-guard";
import type {
  ItemOrderRequest,
  ItemOrderResponse,
  ApiErrorResponse,
} from "../types/api";

export async function action({ request, context }: ActionFunctionArgs) {
  // 認証チェック
  await requireAuthForAction(request, context);

  // Cloudflare Pages のコンテキストから環境を取得
  const kv = context.cloudflare.env.TENUGUI_KV;

  if (request.method !== "PUT") {
    return data<ApiErrorResponse>(
      { error: "Method not allowed" },
      { status: 405 }
    );
  }

  try {
    const requestData = (await request.json()) as ItemOrderRequest;

    if (requestData.itemIds && Array.isArray(requestData.itemIds)) {
      // 新しい配列ベースの並び替え
      await reorderItems(kv, requestData.itemIds);
    } else {
      return data<ApiErrorResponse>(
        { error: "itemIds array is required" },
        { status: 400 }
      );
    }

    return data<ItemOrderResponse>({ success: true });
  } catch (error) {
    console.error("Item order update error:", error);
    return data<ApiErrorResponse>(
      { error: "Failed to update item orders" },
      { status: 500 }
    );
  }
}
