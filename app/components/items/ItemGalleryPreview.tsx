import React from "react";
import type { Item } from "../../data/items";
import { useDragAndDrop } from "../../hooks/useDragAndDrop";
import { useAutoScroll } from "../../hooks/useAutoScroll";
import { UnsavedChangesNotification } from "./UnsavedChangesNotification";
import { GalleryGrid } from "./GalleryGrid";

interface ItemGalleryPreviewProps {
  items: Item[];
  onOrderChange: (newOrder: string[]) => void;
  isLoading?: boolean;
  hasUnsavedChanges?: boolean;
  onUnsavedChangesChange?: (hasChanges: boolean) => void;
}

export function ItemGalleryPreview({
  items,
  onOrderChange,
  isLoading = false,
  hasUnsavedChanges = false,
  onUnsavedChangesChange,
}: ItemGalleryPreviewProps) {
  const {
    localItems,
    draggedItemId,
    dragOverIndex,
    touchStartPos,
    isDragging,
    setDragOverIndex,
    setIsDragging,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    handleTouchStart,
    handleTouchEnd,
    handleSave,
    handleReset,
  } = useDragAndDrop({
    items,
    onOrderChange,
    onUnsavedChangesChange,
  });

  const { handleAutoScroll, stopAutoScroll } = useAutoScroll();

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
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
    <div className="space-y-6 relative">
      <UnsavedChangesNotification
        hasUnsavedChanges={hasUnsavedChanges}
        isLoading={isLoading}
        onSave={handleSave}
        onReset={handleReset}
      />

      <GalleryGrid
        localItems={localItems}
        draggedItemId={draggedItemId}
        dragOverIndex={dragOverIndex}
        touchStartPos={touchStartPos}
        isDragging={isDragging}
        setDragOverIndex={setDragOverIndex}
        setIsDragging={setIsDragging}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onDragEnd={handleDragEnd}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onAutoScroll={handleAutoScroll}
        onStopAutoScroll={stopAutoScroll}
        onContextMenu={handleContextMenu}
      />

      {/* 操作説明 */}
      <div className="text-center py-2 text-gray-500 text-sm space-y-1">
        <div className="hidden sm:block">
          写真をドラッグして並び順を変更できます（画面端で自動スクロール）
        </div>
        <div className="block sm:hidden">
          写真をタッチして軽く動かすと並び順を変更できます（画面端で自動スクロール）
        </div>
        {isDragging && (
          <div className="text-blue-500 font-medium">
            ドラッグ中... 目標の位置でタッチを離してください
          </div>
        )}
      </div>
    </div>
  );
}
