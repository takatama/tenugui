import { useLoaderData, type LoaderFunctionArgs } from "react-router-dom";
import { getItemById, type Item } from "../data/items";

export async function loader({ params }: LoaderFunctionArgs) {
  const itemId = Number(params.itemId);
  const item = getItemById(itemId);

  if (!item) {
    throw new Response("Not Found", { status: 404 });
  }

  return new Response(JSON.stringify({ item }), {
    headers: { "Content-Type": "application/json" },
  });
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
