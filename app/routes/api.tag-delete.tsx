import { data, type ActionFunctionArgs } from "react-router";
import { getAllItems, updateItem } from "../data/items";
import { requireAuthForAction } from "../lib/auth-guard";

export async function action({ request, context }: ActionFunctionArgs) {
  // 認証チェック
  await requireAuthForAction(request, context);

  // Cloudflare Pages のコンテキストから環境を取得
  const kv = context.cloudflare.env.TENUGUI_KV;

  if (request.method !== "DELETE") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const requestData = (await request.json()) as { tagToDelete?: string };
    const { tagToDelete } = requestData;

    if (!tagToDelete || typeof tagToDelete !== "string") {
      return data({ error: "Tag name is required" }, { status: 400 });
    }

    // すべてのアイテムを取得
    const allItems = await getAllItems(kv);

    // 各アイテムから指定されたタグを削除
    const updatePromises = allItems
      .filter((item) => item.tags.includes(tagToDelete))
      .map((item) => {
        const updatedTags = item.tags.filter((tag) => tag !== tagToDelete);
        return updateItem(kv, item.id, {
          name: item.name,
          imageUrl: item.imageUrl,
          productUrl: item.productUrl,
          tags: updatedTags,
          memo: item.memo,
        });
      });

    await Promise.all(updatePromises);

    return data({ success: true, deletedTag: tagToDelete });
  } catch (error) {
    console.error("Tag deletion error:", error);
    return data({ error: "Failed to delete tag" }, { status: 500 });
  }
}
