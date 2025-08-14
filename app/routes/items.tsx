import { useLoaderData, Link, type LoaderFunctionArgs } from "react-router-dom";
import { getItems, type Item } from "../data/items";

export async function loader({ context }: LoaderFunctionArgs) {
  const kv = context.cloudflare.env.TENUGUI_KV;
  const items = await getItems(kv);

  // JavaScriptオブジェクトをJSON文字列に変換し、Responseオブジェクトとして返します
  return new Response(JSON.stringify({ items }), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}

interface LoaderData {
  items: Item[];
}

export default function Items() {
  const { items } = useLoaderData() as LoaderData;

  return (
    <div className="font-sans p-8">
      <h1 className="text-3xl font-bold mb-8">商品一覧</h1>
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
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
