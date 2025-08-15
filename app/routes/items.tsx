import { useLoaderData, Link, type LoaderFunctionArgs } from "react-router-dom";
import { getItemsWithOrder, type Item } from "../data/items";
import { TagList } from "../components/common/TagDisplay";

export async function loader({ context, request }: LoaderFunctionArgs) {
  const kv = context.cloudflare.env.TENUGUI_KV;
  const url = new URL(request.url);
  const selectedTag = url.searchParams.get("tag");

  // 順序付きですべてのデータを取得
  const data = await getItemsWithOrder(kv, selectedTag);

  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}

interface LoaderData {
  items: Item[];
  allTags: string[];
  totalCount: number;
  filteredCount: number;
  selectedTag: string | null;
}

export default function Items() {
  const { items, allTags, selectedTag, filteredCount } =
    useLoaderData() as LoaderData;

  return (
    <div className="font-sans p-4 sm:p-6 md:p-8 mx-auto max-w-5xl">
      {/* 一覧タイトルは視覚的に非表示（スクリーンリーダー向けに残す） */}
      <h1 className="sr-only">手ぬぐい一覧</h1>

      {/* タグフィルター */}
      {allTags.length > 0 && (
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h2 className="sr-only">タグで絞り込み</h2>
          <div className="flex flex-wrap gap-2 mb-2">
            <Link
              to="/"
              className={`px-3 py-1 rounded-full text-sm border ${
                !selectedTag
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
              }`}
            >
              すべて
            </Link>
            <TagList
              tags={allTags}
              variant="filter"
              selectedTags={selectedTag ? new Set([selectedTag]) : new Set()}
              onTagClick={(tag) => {
                window.location.href = `/?tag=${encodeURIComponent(tag)}`;
              }}
            />
          </div>
          {selectedTag && (
            <p className="text-gray-600 text-sm">
              タグ「{selectedTag}」で絞り込み中 ({filteredCount}件)
            </p>
          )}
        </div>
      )}

      {/* ギャラリー表示：モバイル含め3列／余白は現状の約2倍 */}
      <div className="grid grid-cols-3 gap-6 sm:gap-8 md:gap-12">
        {items.map((item) => (
          <Link
            to={`/items/${item.id}`}
            key={item.id}
            className="block group focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-md"
            aria-label={item.name}
          >
            <div className="relative overflow-hidden rounded-md">
              <img
                src={item.imageUrl}
                alt={item.name}
                loading="lazy"
                decoding="async"
                className="block w-full h-auto"
              />
            </div>
          </Link>
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            {selectedTag
              ? `タグ「${selectedTag}」の手ぬぐいは見つかりませんでした`
              : "手ぬぐいがありません"}
          </p>
        </div>
      )}
    </div>
  );
}
