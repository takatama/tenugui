import {
  useLoaderData,
  Form,
  redirect,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "react-router-dom";
import { getItemById, deleteItem, type Item } from "../data/items";

export async function loader({ context, params }: LoaderFunctionArgs) {
  const kv = context.cloudflare.env.TENUGUI_KV;
  const itemId = params.itemId;

  if (!itemId) {
    throw new Response("Item ID is required", { status: 400 });
  }

  const item = await getItemById(kv, itemId);

  if (!item) {
    throw new Response("Not Found", { status: 404 });
  }

  return new Response(JSON.stringify({ item }), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function action({ context, params }: ActionFunctionArgs) {
  const kv = context.cloudflare.env.TENUGUI_KV;
  const itemId = params.itemId;

  if (!itemId) {
    throw new Response("Item ID is required", { status: 400 });
  }

  const deleted = await deleteItem(kv, itemId);

  if (!deleted) {
    throw new Response("Item not found", { status: 404 });
  }

  return redirect("/items");
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

      <div style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
        <a
          href={`/items/${item.id}/edit`}
          style={{
            backgroundColor: "#2563eb",
            color: "white",
            padding: "0.5rem 1rem",
            textDecoration: "none",
            borderRadius: "0.375rem",
            fontSize: "1rem",
            fontWeight: "bold",
            display: "inline-block",
          }}
        >
          編集
        </a>

        <Form method="post" style={{ display: "inline" }}>
          <button
            type="submit"
            style={{
              backgroundColor: "#dc2626",
              color: "white",
              padding: "0.5rem 1rem",
              border: "none",
              borderRadius: "0.375rem",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: "bold",
            }}
            onClick={(e) => {
              if (!confirm("この手ぬぐいを削除しますか？")) {
                e.preventDefault();
              }
            }}
          >
            削除
          </button>
        </Form>

        <a
          href="/items"
          style={{
            backgroundColor: "#6b7280",
            color: "white",
            padding: "0.5rem 1rem",
            textDecoration: "none",
            borderRadius: "0.375rem",
            fontSize: "1rem",
            fontWeight: "bold",
            display: "inline-block",
          }}
        >
          一覧に戻る
        </a>
      </div>
    </div>
  );
}
