import { data, type LoaderFunctionArgs, useLoaderData } from "react-router";
import { getAllTags } from "../data/items";
import { requireAuth } from "../lib/auth-guard";
import { useState } from "react";
import { TagList } from "../components/common/TagDisplay";

export async function loader({ request, context }: LoaderFunctionArgs) {
  // 認証チェック
  await requireAuth(request, context, { requireAuth: true });

  // Cloudflare Pages のコンテキストから環境を取得
  const kv = context.cloudflare.env.TENUGUI_KV;

  try {
    const tags = await getAllTags(kv);
    return data({ tags });
  } catch (error) {
    console.error("Settings loader error:", error);
    return data({ tags: [] });
  }
}

export default function Settings() {
  const { tags: initialTags } = useLoaderData<typeof loader>();
  const [tags, setTags] = useState(initialTags);

  const handleDeleteTag = async (tagToDelete: string) => {
    if (
      !confirm(
        `「${tagToDelete}」タグを削除しますか？\nこのタグが付いているすべてのアイテムからタグが削除されます。`
      )
    ) {
      return;
    }

    try {
      const response = await fetch("/api/tag-delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tagToDelete }),
      });

      if (response.ok) {
        // タグ一覧から削除されたタグを除去
        setTags(tags.filter((tag) => tag !== tagToDelete));
      } else {
        const errorData = (await response.json()) as { error?: string };
        alert(`タグの削除に失敗しました: ${errorData.error || "不明なエラー"}`);
      }
    } catch (error) {
      console.error("Tag deletion failed:", error);
      alert("タグの削除に失敗しました");
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">設定</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">タグ管理</h2>

        {tags.length === 0 ? (
          <p className="text-gray-500">現在、タグがありません。</p>
        ) : (
          <div>
            <p className="text-gray-600 mb-4">
              現在 {tags.length} 個のタグがあります。削除したいタグの ×
              ボタンをクリックしてください。
            </p>
            <div className="min-h-[40px] block w-full border border-gray-300 rounded-md shadow-sm p-3 bg-gray-50">
              <TagList
                tags={tags}
                variant="removable"
                onTagRemove={handleDeleteTag}
              />
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          アイテムの並び替え
        </h2>
        <p className="text-gray-500">この機能は今後実装予定です。</p>
      </div>
    </div>
  );
}
