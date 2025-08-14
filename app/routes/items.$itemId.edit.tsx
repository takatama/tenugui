import {
  useLoaderData,
  Form,
  redirect,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "react-router-dom";
import { getItemById, updateItem, type Item } from "../data/items";

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

export async function action({ context, params, request }: ActionFunctionArgs) {
  const kv = context.cloudflare.env.TENUGUI_KV;
  const itemId = params.itemId;

  if (!itemId) {
    throw new Response("Item ID is required", { status: 400 });
  }

  const formData = await request.formData();
  const name = formData.get("name");
  const imageUrl = formData.get("imageUrl");
  const tagsString = formData.get("tags");

  if (
    typeof name !== "string" ||
    typeof imageUrl !== "string" ||
    typeof tagsString !== "string"
  ) {
    throw new Error("Invalid form data");
  }

  // タグ文字列をカンマで分割し、前後の空白を除去
  const tags = tagsString
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);

  const updatedItem = await updateItem(kv, itemId, { name, imageUrl, tags });

  if (!updatedItem) {
    throw new Response("Item not found", { status: 404 });
  }

  return redirect(`/items/${itemId}`);
}

interface LoaderData {
  item: Item;
}

export default function EditItem() {
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
      <h1 style={{ fontSize: "2rem", marginBottom: "2rem" }}>手ぬぐいを編集</h1>

      <Form
        method="post"
        style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
      >
        <div>
          <label
            htmlFor="name"
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "bold",
            }}
          >
            名前
          </label>
          <input
            type="text"
            id="name"
            name="name"
            defaultValue={item.name}
            required
            style={{
              width: "100%",
              padding: "0.75rem",
              border: "1px solid #d1d5db",
              borderRadius: "0.375rem",
              fontSize: "1rem",
            }}
          />
        </div>

        <div>
          <label
            htmlFor="imageUrl"
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "bold",
            }}
          >
            画像URL
          </label>
          <input
            type="url"
            id="imageUrl"
            name="imageUrl"
            defaultValue={item.imageUrl}
            required
            style={{
              width: "100%",
              padding: "0.75rem",
              border: "1px solid #d1d5db",
              borderRadius: "0.375rem",
              fontSize: "1rem",
            }}
          />
        </div>

        <div>
          <label
            htmlFor="tags"
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "bold",
            }}
          >
            タグ（カンマ区切り）
          </label>
          <input
            type="text"
            id="tags"
            name="tags"
            defaultValue={item.tags?.join(", ") || ""}
            placeholder="例: 夏, 祭り, 青"
            style={{
              width: "100%",
              padding: "0.75rem",
              border: "1px solid #d1d5db",
              borderRadius: "0.375rem",
              fontSize: "1rem",
            }}
          />
          <p
            style={{
              marginTop: "0.25rem",
              fontSize: "0.875rem",
              color: "#6b7280",
            }}
          >
            複数のタグを追加する場合は、カンマ（,）で区切って入力してください
          </p>
        </div>

        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
          <button
            type="submit"
            style={{
              backgroundColor: "#2563eb",
              color: "white",
              padding: "0.75rem 1.5rem",
              border: "none",
              borderRadius: "0.375rem",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: "bold",
            }}
          >
            更新
          </button>

          <a
            href={`/items/${item.id}`}
            style={{
              backgroundColor: "#6b7280",
              color: "white",
              padding: "0.75rem 1.5rem",
              textDecoration: "none",
              borderRadius: "0.375rem",
              fontSize: "1rem",
              fontWeight: "bold",
              display: "inline-block",
            }}
          >
            キャンセル
          </a>
        </div>
      </Form>
    </div>
  );
}
