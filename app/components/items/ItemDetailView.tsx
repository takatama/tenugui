import { Form } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import type { Item } from "../../data/items";

interface ItemDetailViewProps {
  item: Item;
}

export function ItemDetailView({ item }: ItemDetailViewProps) {
  const { isAuthenticated } = useAuth();

  return (
    <div
      style={{
        fontFamily: "sans-serif",
        padding: "2rem",
        maxWidth: "1200px",
        margin: "auto",
        minHeight: "100vh",
        boxSizing: "border-box",
      }}
    >
      {/* レスポンシブグリッドレイアウト */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(300px, 1fr) 2fr",
          gap: "3rem",
          alignItems: "start",
          width: "100%",
        }}
        className="responsive-layout"
      >
        {/* 左カラム: 画像 */}
        <ItemImage item={item} />

        {/* 右カラム: 詳細情報 */}
        <ItemInfo item={item} isAuthenticated={isAuthenticated} />
      </div>

      {/* モバイル用CSS */}
      <style>{`
        @media (max-width: 768px) {
          .responsive-layout {
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
          }
          
          .item-image-container {
            position: static !important;
            display: flex !important;
            justify-content: center !important;
            margin-bottom: 1rem !important;
          }
          
          .item-image {
            max-width: 280px !important;
            width: 100% !important;
            height: auto !important;
          }
          
          .item-title {
            font-size: 1.8rem !important;
            margin-bottom: 1rem !important;
            text-align: center !important;
          }
          
          .item-actions {
            flex-direction: column !important;
            gap: 0.75rem !important;
            margin-top: 1.5rem !important;
          }
          
          .item-actions a,
          .item-actions button {
            width: 100% !important;
            text-align: center !important;
            justify-content: center !important;
          }
        }
        
        @media (max-width: 480px) {
          .item-image {
            max-width: 240px !important;
          }
          
          .item-title {
            font-size: 1.5rem !important;
          }
          
          .item-actions {
            padding: 0 !important;
          }
          
          div[style*="padding: 2rem"] {
            padding: 1rem !important;
          }
        }
        
        @media (max-width: 360px) {
          .item-image {
            max-width: 200px !important;
          }
          
          .item-title {
            font-size: 1.3rem !important;
          }
        }
      `}</style>
    </div>
  );
}

function ItemImage({ item }: { item: Item }) {
  return (
    <div
      style={{ position: "sticky", top: "2rem" }}
      className="item-image-container"
    >
      <img
        src={item.imageUrl}
        alt={item.name}
        style={{
          width: "100%",
          maxWidth: "400px",
          height: "auto",
          borderRadius: "8px",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        }}
        className="item-image"
      />
    </div>
  );
}

function ItemInfo({
  item,
  isAuthenticated,
}: {
  item: Item;
  isAuthenticated: boolean;
}) {
  return (
    <div style={{ width: "100%", minWidth: 0 }}>
      <h1
        style={{
          fontSize: "2.5rem",
          marginBottom: "1.5rem",
          lineHeight: "1.2",
        }}
        className="item-title"
      >
        {item.name}
      </h1>

      <ItemTags tags={item.tags} />
      <ItemProductUrl productUrl={item.productUrl} />
      <ItemMemo memo={item.memo} />
      <ItemActions item={item} isAuthenticated={isAuthenticated} />
    </div>
  );
}

function ItemTags({ tags }: { tags: string[] }) {
  if (!tags || tags.length === 0) return null;

  return (
    <div style={{ marginBottom: "2rem" }}>
      <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>タグ:</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        {tags.map((tag) => (
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
  );
}

function ItemProductUrl({ productUrl }: { productUrl?: string }) {
  if (!productUrl) return null;

  return (
    <div style={{ marginBottom: "2rem" }}>
      <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>商品URL:</h3>
      <a
        href={productUrl}
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
  );
}

function ItemMemo({ memo }: { memo?: string }) {
  if (!memo) return null;

  return (
    <div style={{ marginBottom: "2rem" }}>
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
        {memo}
      </div>
    </div>
  );
}

function ItemActions({
  item,
  isAuthenticated,
}: {
  item: Item;
  isAuthenticated: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: "1rem",
        flexWrap: "wrap",
        marginTop: "2rem",
        width: "100%",
      }}
      className="item-actions"
    >
      {isAuthenticated && (
        <>
          <a
            href={`/items/${item.id}/edit`}
            style={{
              backgroundColor: "#2563eb",
              color: "white",
              padding: "0.75rem 1.5rem",
              textDecoration: "none",
              borderRadius: "0.375rem",
              fontSize: "1rem",
              fontWeight: "bold",
              display: "inline-block",
              minWidth: "fit-content",
              textAlign: "center",
              flex: "0 0 auto",
            }}
          >
            編集
          </a>

          <Form method="post" style={{ display: "inline", flex: "0 0 auto" }}>
            <button
              type="submit"
              style={{
                backgroundColor: "#dc2626",
                color: "white",
                padding: "0.75rem 1.5rem",
                border: "none",
                borderRadius: "0.375rem",
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: "bold",
                minWidth: "fit-content",
                textAlign: "center",
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
        </>
      )}

      <a
        href="/"
        style={{
          backgroundColor: "#6b7280",
          color: "white",
          padding: "0.75rem 1.5rem",
          textDecoration: "none",
          borderRadius: "0.375rem",
          fontSize: "1rem",
          fontWeight: "bold",
          display: "inline-block",
          minWidth: "fit-content",
          textAlign: "center",
          flex: "0 0 auto",
        }}
      >
        一覧に戻る
      </a>
    </div>
  );
}
