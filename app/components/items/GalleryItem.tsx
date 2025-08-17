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
    <Link
      to={`/items/${item.id}`}
      className="block group focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-md"
      aria-label={item.name}
    >
      <div
        className={`
          relative overflow-hidden rounded-md transition-all duration-200
          ${getItemStatusStyles(item.status)}
          group-hover:ring-2 group-hover:ring-gray-300
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
        <StatusBadge status={item.status} />
      </div>
    </Link>
  );
}
