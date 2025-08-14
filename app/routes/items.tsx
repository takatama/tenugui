import { useLoaderData } from "react-router-dom";

const dummyItems = [
  {
    id: 1,
    name: "伝統柄 - 青海波（せいがいは）",
    imageUrl: "https://placehold.co/400x400/3b82f6/ffffff?text=Tenugui+1",
  },
  {
    id: 2,
    name: "動物柄 - 猫と足跡",
    imageUrl: "https://placehold.co/400x400/ef4444/ffffff?text=Tenugui+2",
  },
  {
    id: 3,
    name: "植物柄 - 朝顔",
    imageUrl: "https://placehold.co/400x400/22c55e/ffffff?text=Tenugui+3",
  },
];

export async function loader() {
  const data = { items: dummyItems };
  // JavaScriptオブジェクトをJSON文字列に変換し、Responseオブジェクトとして返します
  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}

interface Item {
  id: number;
  name: string;
  imageUrl: string;
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
        ))}
      </div>
    </div>
  );
}
