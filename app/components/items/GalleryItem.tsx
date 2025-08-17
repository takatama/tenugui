import React from "react";
import { Link } from "react-router-dom";
import type { Item } from "../../data/items";
import { StatusBadge } from "../common/StatusBadge";
import { getItemStatusStyles } from "../../lib/itemStyles";

interface GalleryItemProps {
  item: Item;
}

export function GalleryItem({ item }: GalleryItemProps) {
  return (
    <article>
      <Link
        to={`/items/${item.id}`}
        className="block group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md transition-all duration-200"
        aria-label={`${item.name}の詳細を表示`}
        aria-describedby={`status-${item.id}`}
      >
        <div
          className={`
            relative overflow-hidden rounded-md transition-all duration-200
            ${getItemStatusStyles(item.status)}
            group-hover:ring-2 group-hover:ring-gray-300 group-hover:shadow-md
            group-focus:ring-2 group-focus:ring-blue-500
          `}
        >
          <img
            src={item.imageUrl}
            alt={item.name}
            loading="lazy"
            decoding="async"
            className="block w-full h-auto"
          />

          {/* 未購入ステータスインジケーター */}
          <StatusBadge status={item.status} id={`status-${item.id}`} />
        </div>
      </Link>
    </article>
  );
}
