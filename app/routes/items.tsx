import { useLoaderData, Link } from "react-router-dom";
import { getItems, type Item } from "../data/items";

export async function loader() {
  const items = getItems();

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
    <div style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "2rem" }}>商品一覧</h1>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {items.map((item) => (
          <Link
            to={`/items/${item.id}`}
            key={item.id}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div
              key={item.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "1rem",
              }}
            >
              <img
                src={item.imageUrl}
                alt={item.name}
                style={{ width: "100%", height: "auto", borderRadius: "4px" }}
              />
              <h2 style={{ fontSize: "1.1rem", marginTop: "0.75rem" }}>
                {item.name}
              </h2>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
