import { data, type ActionFunctionArgs } from "react-router";
import { getAllItems, updateItem } from "../data/items";
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
      oldTagName?: string;
      newTagName?: string;
    };
    const { oldTagName, newTagName } = requestData;

    if (!oldTagName || typeof oldTagName !== "string") {
      return data({ error: "Old tag name is required" }, { status: 400 });
    }

    if (!newTagName || typeof newTagName !== "string") {
      return data({ error: "New tag name is required" }, { status: 400 });
    }

    // タグ名の前後の空白をトリミング
    const trimmedOldTagName = oldTagName.trim();
    const trimmedNewTagName = newTagName.trim();

    if (!trimmedOldTagName || !trimmedNewTagName) {
      return data({ error: "Tag names cannot be empty" }, { status: 400 });
    }

    if (trimmedOldTagName === trimmedNewTagName) {
      return data(
        { error: "Old and new tag names are the same" },
        { status: 400 }
      );
    }

    // すべてのアイテムを取得
    const allItems = await getAllItems(kv);

    // 新しいタグ名が既に存在するかチェック
    const allTags = [...new Set(allItems.flatMap((item) => item.tags || []))];
    if (allTags.includes(trimmedNewTagName)) {
      return data({ error: "New tag name already exists" }, { status: 400 });
    }

    // 各アイテムで指定されたタグ名を新しいタグ名に変更
    const updatePromises = allItems
      .filter((item) => item.tags.includes(trimmedOldTagName))
      .map((item) => {
        const updatedTags = item.tags.map((tag) =>
          tag === trimmedOldTagName ? trimmedNewTagName : tag
        );
        return updateItem(kv, item.id, {
          name: item.name,
          imageUrl: item.imageUrl,
          productUrl: item.productUrl,
          tags: updatedTags,
          memo: item.memo,
        });
      });

    await Promise.all(updatePromises);

    return data({
      success: true,
      oldTagName: trimmedOldTagName,
      newTagName: trimmedNewTagName,
      updatedItemsCount: updatePromises.length,
    });
  } catch (error) {
    console.error("Tag rename error:", error);
    return data({ error: "Failed to rename tag" }, { status: 500 });
  }
}
