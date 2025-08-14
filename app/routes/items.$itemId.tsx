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

  return redirect("/");
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

      {item.tags && item.tags.length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>タグ:</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {item.tags.map((tag) => (
              <a
                key={tag}
                href={`/?tag=${encodeURIComponent(tag)}`}
                style={{
                  backgroundColor: "#e5e7eb",
                  color: "#374151",
                  padding: "0.25rem 0.75rem",
                  borderRadius: "9999px",
                  textDecoration: "none",
                  fontSize: "0.875rem",
                  border: "1px solid #d1d5db",
                  transition: "background-color 0.2s",
                }}
                onMouseOver={(e) => {
                  (e.target as HTMLElement).style.backgroundColor = "#d1d5db";
                }}
                onMouseOut={(e) => {
                  (e.target as HTMLElement).style.backgroundColor = "#e5e7eb";
                }}
              >
                {tag}
              </a>
            ))}
          </div>
        </div>
      )}

      {item.productUrl && (
        <div style={{ marginTop: "1.5rem" }}>
          <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>
            商品URL:
          </h3>
          <a
            href={item.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#2563eb",
              textDecoration: "underline",
              fontSize: "1rem",
            }}
          >
            商品ページを開く
          </a>
        </div>
      )}

      {item.memo && (
        <div style={{ marginTop: "1.5rem" }}>
          <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>メモ:</h3>
          <div
            style={{
              backgroundColor: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: "0.5rem",
              padding: "1rem",
              whiteSpace: "pre-wrap",
              fontSize: "1rem",
              lineHeight: "1.6",
            }}
          >
            {item.memo}
          </div>
        </div>
      )}

      {item.analysis && (
        <div style={{ marginTop: "1.5rem" }}>
          <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>
            AI分析結果:
          </h3>
          <div
            style={{
              backgroundColor: "#faf5ff",
              border: "1px solid #e9d5ff",
              borderRadius: "0.5rem",
              padding: "1rem",
              fontSize: "0.875rem",
            }}
          >
            <div style={{ marginBottom: "1rem" }}>
              <span style={{ fontWeight: "500" }}>説明:</span>
              <p style={{ marginTop: "0.25rem", color: "#374151" }}>
                {item.analysis.description}
              </p>
            </div>

            {item.analysis.colors && item.analysis.colors.length > 0 && (
              <div style={{ marginBottom: "1rem" }}>
                <span style={{ fontWeight: "500" }}>主要な色:</span>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.25rem",
                    marginTop: "0.25rem",
                  }}
                >
                  {item.analysis.colors.map((color, index) => (
                    <span
                      key={index}
                      style={{
                        backgroundColor: "#e0e7ff",
                        color: "#3730a3",
                        padding: "0.125rem 0.5rem",
                        borderRadius: "9999px",
                        fontSize: "0.75rem",
                      }}
                    >
                      {color}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {item.analysis.patterns && item.analysis.patterns.length > 0 && (
              <div style={{ marginBottom: "1rem" }}>
                <span style={{ fontWeight: "500" }}>パターン:</span>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.25rem",
                    marginTop: "0.25rem",
                  }}
                >
                  {item.analysis.patterns.map((pattern, index) => (
                    <span
                      key={index}
                      style={{
                        backgroundColor: "#e0e7ff",
                        color: "#3730a3",
                        padding: "0.125rem 0.5rem",
                        borderRadius: "9999px",
                        fontSize: "0.75rem",
                      }}
                    >
                      {pattern}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <span style={{ fontWeight: "500" }}>信頼度:</span>
                <span style={{ marginLeft: "0.5rem" }}>
                  {Math.round(item.analysis.confidence * 100)}%
                </span>
              </div>
              {item.analysis.analyzedAt && (
                <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                  分析日時:{" "}
                  {new Date(item.analysis.analyzedAt).toLocaleDateString(
                    "ja-JP"
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
          href="/"
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
