import { useState } from "react";
import type { Item } from "../../data/items";
import { getDisplayName } from "../../lib/itemPresentation";
import { Icon } from "./Icon";
export function Artwork({
  item,
  className = "",
  loading = "lazy",
  fetchPriority = "auto",
}: {
  item: Pick<Item, "imageUrl" | "name">;
  className?: string;
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "low" | "auto";
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  return failedUrl === item.imageUrl || !item.imageUrl ? (
    <div
      className={`artwork-fallback ${className}`}
      role="img"
      aria-label={`${getDisplayName(item.name)}：写真を読み込めませんでした`}
    >
      <Icon name="image" size={32} />
      <span>写真を読み込めませんでした</span>
    </div>
  ) : (
    <img
      src={item.imageUrl}
      alt={getDisplayName(item.name)}
      className={`artwork ${className}`}
      loading={loading}
      fetchPriority={fetchPriority}
      decoding="async"
      onError={() => setFailedUrl(item.imageUrl)}
    />
  );
}
