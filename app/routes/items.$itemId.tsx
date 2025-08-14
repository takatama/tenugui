import { useLoaderData, type LoaderFunctionArgs } from "react-router-dom";

const dummyItems = [
  {
    id: 1,
    name: "伝統柄 - 青海波（せいがいは）",
    imageUrl: "https://placehold.co/600x600/3b82f6/ffffff?text=Tenugui+1",
  },
  {
    id: 2,
    name: "動物柄 - 猫と足跡",
    imageUrl: "https://placehold.co/600x600/ef4444/ffffff?text=Tenugui+2",
  },
  {
    id: 3,
    name: "植物柄 - 朝顔",
    imageUrl: "https://placehold.co/600x600/22c55e/ffffff?text=Tenugui+3",
  },
];

export async function loader({ params }: LoaderFunctionArgs) {
  const itemId = Number(params.itemId);
  const item = dummyItems.find((it) => it.id === itemId);

  if (!item) {
    throw new Response("Not Found", { status: 404 });
  }

  return new Response(JSON.stringify({ item }), {
    headers: { "Content-Type": "application/json" },
  });
}

interface Item {
  id: number;
  name: string;
  imageUrl: string;
}

interface LoaderData {
  item: Item;
}

export default function ItemDetail() {
  const { item } = useLoaderData() as LoaderData;

  return (
    <div
      style={{
        fontFamily: "sans-serif",
        padding: "2rem",
        maxWidth: "600px",
        margin: "auto",
      }}
    >
      <img
        src={item.imageUrl}
        alt={item.name}
        style={{ width: "100%", height: "auto", borderRadius: "8px" }}
      />
      <h1 style={{ fontSize: "2.5rem", marginTop: "1.5rem" }}>{item.name}</h1>
    </div>
  );
}
