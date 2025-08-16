import React, { useState, useEffect } from "react";
import type { Item } from "../../data/items";

interface ItemGalleryPreviewProps {
  items: Item[];
  onOrderChange: (newOrder: string[]) => void;
  isLoading?: boolean;
}

export function ItemGalleryPreview({
  items,
  onOrderChange,
  isLoading = false,
}: ItemGalleryPreviewProps) {
  const [localItems, setLocalItems] = useState(items);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // itemsが更新されたらlocalItemsも更新
  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItemId(itemId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", itemId);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (!draggedItemId) return;

    const dragIndex = localItems.findIndex((item) => item.id === draggedItemId);

    if (dragIndex === dropIndex) {
      setDraggedItemId(null);
      setDragOverIndex(null);
      return;
    }

    const newItems = [...localItems];
    const [draggedItem] = newItems.splice(dragIndex, 1);
    newItems.splice(dropIndex, 0, draggedItem);

    setLocalItems(newItems);
    onOrderChange(newItems.map((item) => item.id));
    setDraggedItemId(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
    setDragOverIndex(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  if (localItems.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">アイテムがありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ギャラリープレビュー表示（モバイルサイズ固定） */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          ギャラリー表示プレビュー
        </h3>
        <div className="max-w-sm mx-auto">
          <div className="grid grid-cols-3 gap-2">
            {localItems.map((item, index) => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, item.id)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`
                  relative cursor-move rounded-md overflow-hidden transition-all duration-200
                  ${draggedItemId === item.id ? "opacity-50 scale-95" : ""}
                  ${
                    dragOverIndex === index && draggedItemId !== item.id
                      ? "ring-2 ring-blue-400 scale-105"
                      : ""
                  }
                  hover:ring-2 hover:ring-gray-300
                `}
              >
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="block w-full h-auto select-none"
                  draggable={false}
                />

                {/* 順序番号 */}
                <div className="absolute top-1 left-1 bg-black bg-opacity-70 text-white text-xs px-1.5 py-0.5 rounded">
                  {index + 1}
                </div>

                {/* ドラッグインジケーター */}
                <div className="absolute top-1 right-1 bg-white bg-opacity-80 rounded-full p-1">
                  <svg
                    className="w-3 h-3 text-gray-600"
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
            ))}
          </div>
        </div>
      </div>

      {/* 操作説明 */}
      <div className="text-center py-2 text-gray-500 text-sm">
        写真をドラッグして並び順を変更できます
      </div>
    </div>
  );
}
