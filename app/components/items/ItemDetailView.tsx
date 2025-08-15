import { Form } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import type { Item } from "../../data/items";

interface ItemDetailViewProps {
  item: Item;
}

export function ItemDetailView({ item }: ItemDetailViewProps) {
  const { isAuthenticated } = useAuth();

  return (
    <div className="item-detail-container">
      <div className="item-layout">
        <ItemImage item={item} />
        <ItemInfo item={item} isAuthenticated={isAuthenticated} />
      </div>

      <style>{`
        .item-detail-container {
          font-family: sans-serif;
          padding: 2rem;
          max-width: 1200px;
          margin: auto;
        }
        
        .item-layout {
          display: grid;
          grid-template-columns: minmax(300px, 1fr) 2fr;
          gap: 3rem;
          align-items: start;
        }
        
        @media (max-width: 768px) {
          .item-detail-container { padding: 1rem; }
          .item-layout { 
            grid-template-columns: 1fr; 
            gap: 1rem; 
          }
          .item-image-container { 
            position: static; 
            text-align: center;
            margin-bottom: 1rem; 
          }
          .item-image { max-width: 220px; }
          .item-title { 
            font-size: 1.5rem; 
            text-align: center;
            margin-bottom: 1rem; 
          }
          .item-actions { 
            flex-direction: column; 
            gap: 0.75rem;
            margin-top: 1rem; 
          }
          .item-actions a, .item-actions button { width: 100%; }
        }
        
        @media (max-width: 480px) {
          .item-image { max-width: 180px; }
          .item-title { font-size: 1.3rem; }
          .item-detail-container { padding: 0.75rem; }
        }
        
        @media (max-width: 360px) {
          .item-image { max-width: 150px; }
          .item-title { font-size: 1.1rem; }
          .item-detail-container { padding: 0.5rem; }
        }
      `}</style>
    </div>
  );
}

function ItemImage({ item }: { item: Item }) {
  return (
    <div className="item-image-container">
      <img
        src={item.imageUrl}
        alt={item.name}
        className="item-image"
        style={{
          width: "100%",
          maxWidth: "400px",
          height: "auto",
          borderRadius: "8px",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        }}
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
    <div>
      <h1
        className="item-title"
        style={{
          fontSize: "2.5rem",
          marginBottom: "1.5rem",
          lineHeight: "1.2",
        }}
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
    <div style={{ marginBottom: "1.5rem" }}>
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
    <div style={{ marginBottom: "1.5rem" }}>
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
    <div style={{ marginBottom: "1.5rem" }}>
      <div
        style={{
          backgroundColor: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: "0.5rem",
          padding: "1rem",
          whiteSpace: "pre-wrap",
          fontSize: "0.95rem",
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
  const buttonStyle = {
    padding: "0.75rem 1.5rem",
    borderRadius: "0.375rem",
    fontSize: "1rem",
    fontWeight: "bold",
    textDecoration: "none",
    display: "inline-block",
    textAlign: "center" as const,
  };

  return (
    <div
      className="item-actions"
      style={{
        display: "flex",
        gap: "1rem",
        flexWrap: "wrap",
        marginTop: "2rem",
      }}
    >
      {isAuthenticated && (
        <>
          <a
            href={`/items/${item.id}/edit`}
            style={{
              ...buttonStyle,
              backgroundColor: "#2563eb",
              color: "white",
            }}
          >
            編集
          </a>
          <Form method="post" style={{ display: "inline" }}>
            <button
              type="submit"
              style={{
                ...buttonStyle,
                backgroundColor: "#dc2626",
                color: "white",
                border: "none",
                cursor: "pointer",
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
        style={{ ...buttonStyle, backgroundColor: "#6b7280", color: "white" }}
      >
        一覧に戻る
      </a>
    </div>
  );
}
