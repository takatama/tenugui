import { useLoaderData, Link, type LoaderFunctionArgs } from "react-router-dom";
import { getItems, getAllTags, getItemsByTag, type Item } from "../data/items";

export async function loader({ context, request }: LoaderFunctionArgs) {
  const kv = context.cloudflare.env.TENUGUI_KV;
  const url = new URL(request.url);
  const selectedTag = url.searchParams.get("tag");

  let items: Item[];
  if (selectedTag) {
    items = await getItemsByTag(kv, selectedTag);
  } else {
    items = await getItems(kv);
  }

  const allTags = await getAllTags(kv);

  return new Response(JSON.stringify({ items, allTags, selectedTag }), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}

interface LoaderData {
  items: Item[];
  allTags: string[];
  selectedTag: string | null;
}

export default function Items() {
  const { items, allTags, selectedTag } = useLoaderData() as LoaderData;

  return (
    <div className="font-sans p-8">
      <h1 className="text-3xl font-bold mb-8">商品一覧</h1>

      {/* タグフィルター */}
      {allTags.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">タグで絞り込み</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            <Link
              to="/items"
              className={`px-3 py-1 rounded-full text-sm border ${
                !selectedTag
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
              }`}
            >
              すべて
            </Link>
            {allTags.map((tag) => (
              <Link
                key={tag}
                to={`/items?tag=${encodeURIComponent(tag)}`}
                className={`px-3 py-1 rounded-full text-sm border ${
                  selectedTag === tag
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                }`}
              >
                {tag}
              </Link>
            ))}
          </div>
          {selectedTag && (
            <p className="text-gray-600 mb-4">
              タグ「{selectedTag}」で絞り込み中 ({items.length}件)
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
                <div className="flex flex-wrap gap-1 mt-2">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
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
              ? `タグ「${selectedTag}」の商品は見つかりませんでした`
              : "商品がありません"}
          </p>
        </div>
      )}
    </div>
  );
}
