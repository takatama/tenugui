import React, { useRef, useEffect } from "react";
import type { Item } from "../../data/items";
import { ItemCard } from "./ItemCard";

interface GalleryGridProps {
  localItems: Item[];
  draggedItemId: string | null;
  dragOverIndex: number | null;
  touchStartPos: { x: number; y: number } | null;
  isDragging: boolean;
  setDragOverIndex: (index: number | null) => void;
  setIsDragging: (isDragging: boolean) => void;
  onDragStart: (e: React.DragEvent, itemId: string) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onTouchStart: (e: React.TouchEvent, itemId: string) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onAutoScroll: (clientY: number) => void;
  onStopAutoScroll: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

export function GalleryGrid({
  localItems,
  draggedItemId,
  dragOverIndex,
  touchStartPos,
  isDragging,
  setDragOverIndex,
  setIsDragging,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onTouchStart,
  onTouchEnd,
  onAutoScroll,
  onStopAutoScroll,
  onContextMenu,
}: GalleryGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // 非パッシブタッチイベントリスナーの追加
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartPos || !draggedItemId) return;

      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - touchStartPos.x);
      const deltaY = Math.abs(touch.clientY - touchStartPos.y);

      // より敏感な移動検出（5px以上で移動とみなす）
      if (deltaX > 5 || deltaY > 5) {
        if (!isDragging) {
          // ドラッグ状態を有効にする
          setIsDragging(true);
          // ドラッグ開始時にbodyのスクロールを無効化
          document.body.style.overflow = "hidden";
        }
        e.preventDefault(); // スクロールを防ぐ

        // 自動スクロール処理
        onAutoScroll(touch.clientY);

        // ドラッグ中は要素の上にある位置を検出
        const elementBelow = document.elementFromPoint(
          touch.clientX,
          touch.clientY
        );
        const gridItem = elementBelow?.closest("[data-item-index]");
        if (gridItem) {
          const index = parseInt(
            gridItem.getAttribute("data-item-index") || "0",
            10
          );
          setDragOverIndex(index);
        }
      }
    };

    // 非パッシブモードでイベントリスナーを追加
    container.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });

    return () => {
      container.removeEventListener("touchmove", handleTouchMove);
    };
  }, [
    touchStartPos,
    draggedItemId,
    isDragging,
    onAutoScroll,
    setDragOverIndex,
    setIsDragging,
  ]);

  // コンポーネントアンマウント時のクリーンアップ
  useEffect(() => {
    return () => {
      onStopAutoScroll();
      // bodyのスクロール復元（念のため）
      document.body.style.overflow = "";
    };
  }, [onStopAutoScroll]);

  // ドラッグオーバー時の自動スクロール処理を組み込み
  const handleDragOverWithAutoScroll = (e: React.DragEvent, index: number) => {
    onDragOver(e, index);
    onAutoScroll(e.clientY);
  };

  // ドラッグ終了時の自動スクロール停止を組み込み
  const handleDragEndWithStopScroll = (e: React.DragEvent) => {
    onStopAutoScroll();
    onDragEnd(e);
  };

  const handleDropWithStopScroll = (e: React.DragEvent, dropIndex: number) => {
    onStopAutoScroll();
    onDrop(e, dropIndex);
  };

  const handleTouchEndWithStopScroll = (e: React.TouchEvent) => {
    onStopAutoScroll();
    onTouchEnd(e);
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="text-sm font-medium text-gray-700 mb-3">
        ギャラリー表示プレビュー
      </h3>
      <div className="max-w-sm mx-auto">
        <div ref={containerRef} className="grid grid-cols-3 gap-2">
          {localItems.map((item, index) => (
            <ItemCard
              key={item.id}
              item={item}
              index={index}
              isDraggedItem={draggedItemId === item.id}
              isDragOverTarget={
                dragOverIndex === index && draggedItemId !== item.id
              }
              isDragging={isDragging}
              onDragStart={onDragStart}
              onDragOver={handleDragOverWithAutoScroll}
              onDragLeave={onDragLeave}
              onDrop={handleDropWithStopScroll}
              onDragEnd={handleDragEndWithStopScroll}
              onTouchStart={onTouchStart}
              onTouchEnd={handleTouchEndWithStopScroll}
              onContextMenu={onContextMenu}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
