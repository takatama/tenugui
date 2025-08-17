import { useState, useEffect, useCallback } from "react";
import type { Item } from "../data/items";

interface UseDragAndDropProps {
  items: Item[];
  onOrderChange: (newOrder: string[]) => void;
  onUnsavedChangesChange?: (hasChanges: boolean) => void;
}

export function useDragAndDrop({
  items,
  onOrderChange,
  onUnsavedChangesChange,
}: UseDragAndDropProps) {
  const [localItems, setLocalItems] = useState(items);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [touchStartPos, setTouchStartPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // itemsが更新されたらlocalItemsも更新
  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  // 変更があったかチェック
  const checkForChanges = useCallback(
    (newItems: Item[]) => {
      const hasChanges = newItems.some(
        (item, index) => items[index]?.id !== item.id
      );
      onUnsavedChangesChange?.(hasChanges);
    },
    [items, onUnsavedChangesChange]
  );

  const handleDragStart = useCallback((e: React.DragEvent, itemId: string) => {
    setDraggedItemId(itemId);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", itemId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      e.stopPropagation();

      if (!draggedItemId) return;

      const dragIndex = localItems.findIndex(
        (item) => item.id === draggedItemId
      );

      if (dragIndex === dropIndex) {
        setDraggedItemId(null);
        setDragOverIndex(null);
        setIsDragging(false);
        return;
      }

      const newItems = [...localItems];
      const [draggedItem] = newItems.splice(dragIndex, 1);
      newItems.splice(dropIndex, 0, draggedItem);

      setLocalItems(newItems);
      checkForChanges(newItems);

      setDraggedItemId(null);
      setDragOverIndex(null);
      setIsDragging(false);
    },
    [draggedItemId, localItems, checkForChanges]
  );

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setDraggedItemId(null);
    setDragOverIndex(null);
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent, itemId: string) => {
      const touch = e.touches[0];
      setTouchStartPos({ x: touch.clientX, y: touch.clientY });
      setDraggedItemId(itemId);
      setIsDragging(false);

      // ドラッグ開始のための長押し効果を追加（100ms後にドラッグモード開始）
      setTimeout(() => {
        if (draggedItemId === itemId) {
          setIsDragging(true);
        }
      }, 100);
    },
    [draggedItemId]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      // bodyのスクロールを復元
      document.body.style.overflow = "";

      if (!isDragging || !draggedItemId || dragOverIndex === null) {
        setDraggedItemId(null);
        setDragOverIndex(null);
        setTouchStartPos(null);
        setIsDragging(false);
        return;
      }

      const dragIndex = localItems.findIndex(
        (item) => item.id === draggedItemId
      );

      if (dragIndex !== dragOverIndex) {
        const newItems = [...localItems];
        const [draggedItem] = newItems.splice(dragIndex, 1);
        newItems.splice(dragOverIndex, 0, draggedItem);

        setLocalItems(newItems);
        checkForChanges(newItems);
      }

      setDraggedItemId(null);
      setDragOverIndex(null);
      setTouchStartPos(null);
      setIsDragging(false);
    },
    [isDragging, draggedItemId, dragOverIndex, localItems, checkForChanges]
  );

  const handleSave = useCallback(() => {
    onOrderChange(localItems.map((item) => item.id));
  }, [localItems, onOrderChange]);

  const handleReset = useCallback(() => {
    setLocalItems(items);
    onUnsavedChangesChange?.(false);
  }, [items, onUnsavedChangesChange]);

  return {
    localItems,
    draggedItemId,
    dragOverIndex,
    touchStartPos,
    isDragging,
    setDragOverIndex,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    handleTouchStart,
    handleTouchEnd,
    handleSave,
    handleReset,
  };
}
