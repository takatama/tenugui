import { useState } from "react";
import type { Item } from "../../data/items";
import { Icon } from "./Icon";
export function Artwork({
  item,
  className = "",
}: {
  item: Pick<Item, "imageUrl" | "name">;
  className?: string;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  return failedUrl === item.imageUrl || !item.imageUrl ? (
    <div
      className={`artwork-fallback ${className}`}
      role="img"
      aria-label={`${item.name}：写真を読み込めませんでした`}
    >
      <Icon name="image" size={32} />
      <span>写真を読み込めませんでした</span>
    </div>
  ) : (
    <img
      src={item.imageUrl}
      alt={item.name}
      className={`artwork ${className}`}
      loading="lazy"
      decoding="async"
      onError={() => setFailedUrl(item.imageUrl)}
    />
  );
}
