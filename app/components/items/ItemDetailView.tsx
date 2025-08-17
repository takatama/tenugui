import { Form } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import type { Item } from "../../data/items";
import { TagList } from "../common/TagDisplay";
import { Button } from "../common/Button";
import { StatusBadge } from "../common/StatusBadge";
import { getItemStatusStyles } from "../../lib/itemStyles";
import type { ItemStatus } from "../../types/status";
import { getStatusLabel, isUnpurchased } from "../../types/status";

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
      <div
        className={`relative inline-block ${getItemStatusStyles(item.status)}`}
        style={{
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
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
            display: "block",
          }}
        />
        <StatusBadge status={item.status} />
      </div>
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
      <ItemStatus status={item.status} />
      <ItemTags tags={item.tags} />
      <ItemProductUrl productUrl={item.productUrl} />
      <ItemMemo memo={item.memo} />
      <ItemActions item={item} isAuthenticated={isAuthenticated} />
    </div>
  );
}

function ItemStatus({ status }: { status?: ItemStatus }) {
  const isUnpurchasedStatus = isUnpurchased(status);

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <span
        style={{
          display: "inline-block",
          padding: "0.5rem 1rem",
          borderRadius: "1rem",
          fontSize: "0.875rem",
          fontWeight: "500",
          backgroundColor: isUnpurchasedStatus ? "#dbeafe" : "#f0fdf4",
          color: isUnpurchasedStatus ? "#1e40af" : "#166534",
          border: `1px solid ${isUnpurchasedStatus ? "#bfdbfe" : "#bbf7d0"}`,
        }}
      >
        {getStatusLabel(status)}
      </span>
    </div>
  );
}

function ItemTags({ tags }: { tags: string[] }) {
  if (!tags || tags.length === 0) return null;

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <TagList
        tags={tags}
        variant="filter"
        onTagClick={(tag) => {
          window.location.href = `/?tag=${encodeURIComponent(tag)}`;
        }}
      />
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
          <Button variant="primary" size="lg" href={`/items/${item.id}/edit`}>
            編集
          </Button>
          <Form method="post" style={{ display: "inline" }}>
            <Button
              type="submit"
              variant="danger"
              size="lg"
              onClick={(e) => {
                if (!confirm("この手ぬぐいを削除しますか？")) {
                  e.preventDefault();
                }
              }}
            >
              削除
            </Button>
          </Form>
        </>
      )}
      <Button variant="secondary" size="lg" href={`/?refresh=${Date.now()}`}>
        一覧に戻る
      </Button>
    </div>
  );
}
