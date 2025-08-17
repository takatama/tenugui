import React from "react";
import type { Item } from "../../data/items";
import { StatusBadge } from "../common/StatusBadge";
import { getItemStatusStyles } from "../../lib/itemStyles";

interface ItemCardProps {
  item: Item;
  index: number;
  isDraggedItem: boolean;
  isDragOverTarget: boolean;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent, itemId: string) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onTouchStart: (e: React.TouchEvent, itemId: string) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

export function ItemCard({
  item,
  index,
  isDraggedItem,
  isDragOverTarget,
  isDragging,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onTouchStart,
  onTouchEnd,
}: ItemCardProps) {
  return (
    <div
      key={item.id}
      data-item-index={index}
      draggable
      onDragStart={(e) => onDragStart(e, item.id)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
      onTouchStart={(e) => onTouchStart(e, item.id)}
      onTouchEnd={onTouchEnd}
      className={`
        relative cursor-move bg-white rounded-lg shadow-md overflow-hidden transition-all duration-200
        ${
          isDraggedItem && isDragging
            ? "opacity-80 scale-110 shadow-2xl ring-4 ring-blue-500 z-50 transform rotate-2"
            : ""
        }
        ${
          isDragOverTarget && !isDraggedItem
            ? "ring-2 ring-blue-400 scale-105 bg-blue-50"
            : ""
        }
        ${
          isDraggedItem && !isDragging
            ? "ring-2 ring-yellow-400 bg-yellow-50"
            : ""
        }
        ${getItemStatusStyles(item.status)}
        hover:ring-2 hover:ring-gray-300
        touch-manipulation
      `}
      style={{
        touchAction: isDragging ? "none" : "auto",
      }}
    >
      <img
        src={item.imageUrl}
        alt={item.name}
        className="block w-full h-auto select-none"
        draggable={false}
      />

      {/* ステータスインジケーター */}
      <StatusBadge status={item.status} />

      {/* 順序番号 */}
      <div
        className={`absolute ${item.status === "unpurchased" ? "top-8" : "top-1"} left-1 text-white text-xs px-1.5 py-0.5 rounded ${
          isDraggedItem && isDragging
            ? "bg-blue-500 bg-opacity-90 font-bold"
            : "bg-black bg-opacity-70"
        }`}
      >
        {index + 1}
      </div>

      {/* ドラッグインジケーター */}
      <div
        className={`absolute ${item.status === "unpurchased" ? "bottom-1" : "top-1"} right-1 rounded-full p-1 ${
          isDraggedItem && isDragging
            ? "bg-blue-500 bg-opacity-90"
            : "bg-white bg-opacity-80"
        }`}
      >
        <svg
          className={`w-3 h-3 ${
            isDraggedItem && isDragging ? "text-white" : "text-gray-600"
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 8h16M4 16h16"
          />
        </svg>
      </div>
    </div>
  );
}
