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
    <div className="font-sans p-8">
      <h1 className="text-3xl font-bold mb-8">手ぬぐい一覧</h1>

      {/* タグフィルター */}
      {allTags.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">タグで絞り込み</h2>
          <div className="flex flex-wrap gap-2 mb-4">
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
            <p className="text-gray-600 mb-4">
              タグ「{selectedTag}」で絞り込み中 ({filteredCount}件)
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {items.map((item) => (
          <Link
            to={`/items/${item.id}`}
            key={item.id}
            className="no-underline text-inherit"
          >
            <div className="border border-gray-200 rounded-lg p-4 transition-transform duration-200 hover:shadow-lg hover:-translate-y-1">
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-auto rounded-md"
              />
              <h2 className="text-lg font-semibold mt-3">{item.name}</h2>
              {item.tags && item.tags.length > 0 && (
                <div className="mt-2">
                  <TagList
                    tags={item.tags}
                    variant="default"
                    className="gap-1"
                  />
                </div>
              )}
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
