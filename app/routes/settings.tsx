import {
  data,
  type LoaderFunctionArgs,
  useLoaderData,
  useBlocker,
} from "react-router";
import { getAllTags, getItems } from "../data/items";
import { requireAuth } from "../lib/auth-guard";
import { useState, useEffect } from "react";
import { TagManagement } from "../components/items/TagManagement";
import { ItemGalleryPreview } from "../components/items/ItemGalleryPreview";

export async function loader({ request, context }: LoaderFunctionArgs) {
  // 認証チェック
  await requireAuth(request, context, { requireAuth: true });

  // Cloudflare Pages のコンテキストから環境を取得
  const kv = context.cloudflare.env.TENUGUI_KV;

  try {
    const [tags, itemsData] = await Promise.all([getAllTags(kv), getItems(kv)]);

    return data({
      tags,
      items: itemsData.items,
    });
  } catch (error) {
    console.error("Settings loader error:", error);
    return data({
      tags: [],
      items: [],
    });
  }
}

export default function Settings() {
  const { tags: initialTags, items: initialItems } =
    useLoaderData<typeof loader>();
  const [tags, setTags] = useState(initialTags);
  const [isOrderSaving, setIsOrderSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // ページ離脱時の警告
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = ""; // Chrome では空文字列が必要
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  // React Routerでのページ遷移をブロック
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname
  );

  // ブロッカーの状態を監視してアラートを表示
  useEffect(() => {
    if (blocker.state === "blocked") {
      const shouldProceed = window.confirm(
        "並び順に未保存の変更があります。\n変更を破棄してページを移動しますか？"
      );

      if (shouldProceed) {
        setHasUnsavedChanges(false);
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker, setHasUnsavedChanges]);

  const handleOrderChange = async (newOrder: string[]) => {
    setIsOrderSaving(true);

    try {
      const response = await fetch("/api/item-order", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itemIds: newOrder }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        console.error("API Error Response:", {
          status: response.status,
          statusText: response.statusText,
          errorData,
        });
        alert(
          `順序の保存に失敗しました: ${errorData.error || `HTTP ${response.status}: ${response.statusText}`}`
        );
      } else {
        const result = await response.json();
        console.log("Order save successful:", result);
        setHasUnsavedChanges(false); // 保存成功時に未保存フラグをクリア
      }
    } catch (error) {
      console.error("Order save failed:", error);
      alert(
        `順序の保存に失敗しました: ${error instanceof Error ? error.message : "ネットワークエラー"}`
      );
    } finally {
      setIsOrderSaving(false);
    }
  };

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

  const handleRenameTag = async (oldTagName: string, newTagName: string) => {
    try {
      const response = await fetch("/api/tag-rename", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ oldTagName, newTagName }),
      });

      if (response.ok) {
        const result = (await response.json()) as {
          success: boolean;
          oldTagName: string;
          newTagName: string;
          updatedItemsCount: number;
        };

        // タグ一覧で古いタグ名を新しいタグ名に置き換え
        setTags(tags.map((tag) => (tag === oldTagName ? newTagName : tag)));
      } else {
        const errorData = (await response.json()) as { error?: string };
        alert(
          `タグ名の変更に失敗しました: ${errorData.error || "不明なエラー"}`
        );
        throw new Error(errorData.error || "Unknown error");
      }
    } catch (error) {
      console.error("Tag rename failed:", error);
      if (error instanceof Error && !error.message.includes("fetch")) {
        // サーバーエラーの場合はすでにalertが表示されているので、再度表示しない
        throw error;
      } else {
        alert("タグ名の変更に失敗しました");
        throw error;
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">設定</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">タグ管理</h2>

        <TagManagement
          tags={tags}
          onTagDelete={handleDeleteTag}
          onTagRename={handleRenameTag}
        />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            アイテムの並び替え
          </h2>
        </div>
        <div className="space-y-2 mb-4">
          <p className="text-gray-600">
            写真をドラッグして並び順を変更できます。変更後は保存ボタンで確定してください。
          </p>
          <p className="text-sm text-gray-500">
            ✨
            モバイルサイズのギャラリー表示で実際の見た目を確認しながら並び替えできます
          </p>
        </div>
        <ItemGalleryPreview
          items={initialItems}
          onOrderChange={handleOrderChange}
          isLoading={isOrderSaving}
          hasUnsavedChanges={hasUnsavedChanges}
          onUnsavedChangesChange={setHasUnsavedChanges}
        />
      </div>
    </div>
  );
}
