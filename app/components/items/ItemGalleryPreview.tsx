import React, { useState, useEffect, useRef } from "react";
import type { Item } from "../../data/items";

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
  const [localItems, setLocalItems] = useState(items);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [touchStartPos, setTouchStartPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<number | null>(null);

  // itemsが更新されたらlocalItemsも更新
  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  // 自動スクロール機能
  const handleAutoScroll = (clientY: number) => {
    const scrollThreshold = 80; // スクロール開始のしきい値（px）
    const scrollSpeed = 8; // スクロール速度（px/frame）
    const viewportHeight = window.innerHeight;

    // 上端近くにいる場合
    if (clientY < scrollThreshold) {
      const scrollDistance = Math.max(
        scrollSpeed,
        (scrollThreshold - clientY) / 5
      );
      if (autoScrollRef.current) {
        cancelAnimationFrame(autoScrollRef.current);
      }
      autoScrollRef.current = requestAnimationFrame(() => {
        window.scrollBy(0, -scrollDistance);
        if (isDragging) {
          handleAutoScroll(clientY);
        }
      });
    }
    // 下端近くにいる場合
    else if (clientY > viewportHeight - scrollThreshold) {
      const scrollDistance = Math.max(
        scrollSpeed,
        (clientY - (viewportHeight - scrollThreshold)) / 5
      );
      if (autoScrollRef.current) {
        cancelAnimationFrame(autoScrollRef.current);
      }
      autoScrollRef.current = requestAnimationFrame(() => {
        window.scrollBy(0, scrollDistance);
        if (isDragging) {
          handleAutoScroll(clientY);
        }
      });
    }
    // 中央にいる場合はスクロール停止
    else {
      if (autoScrollRef.current) {
        cancelAnimationFrame(autoScrollRef.current);
        autoScrollRef.current = null;
      }
    }
  };

  // ドラッグ終了時にスクロールを停止
  const stopAutoScroll = () => {
    if (autoScrollRef.current) {
      cancelAnimationFrame(autoScrollRef.current);
      autoScrollRef.current = null;
    }
  };

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
          setIsDragging(true);
          // ドラッグ開始時にbodyのスクロールを無効化
          document.body.style.overflow = "hidden";
        }
        e.preventDefault(); // スクロールを防ぐ

        // 自動スクロール処理
        handleAutoScroll(touch.clientY);

        // ドラッグ中は要素の上にある位置を検出
        const elementBelow = document.elementFromPoint(
          touch.clientX,
          touch.clientY
        );
        const gridItem = elementBelow?.closest("[data-item-index]");
        if (gridItem) {
          const index = parseInt(
            gridItem.getAttribute("data-item-index") || "0"
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
  }, [touchStartPos, draggedItemId, isDragging]);

  // コンポーネントアンマウント時のクリーンアップ
  useEffect(() => {
    return () => {
      stopAutoScroll();
      // bodyのスクロール復元（念のため）
      document.body.style.overflow = "";
    };
  }, []);

  // 変更があったかチェック
  const checkForChanges = (newItems: Item[]) => {
    const hasChanges = newItems.some(
      (item, index) => items[index]?.id !== item.id
    );
    onUnsavedChangesChange?.(hasChanges);
  };

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItemId(itemId);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", itemId);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);

    // マウスドラッグでの自動スクロール
    handleAutoScroll(e.clientY);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    // 自動スクロールを停止
    stopAutoScroll();

    if (!draggedItemId) return;

    const dragIndex = localItems.findIndex((item) => item.id === draggedItemId);

    if (dragIndex === dropIndex) {
      setDraggedItemId(null);
      setDragOverIndex(null);
      setIsDragging(false);
      return;
    }

    // スクロール位置を保存
    const scrollPosition = window.scrollY;
    const scrollElement = document.documentElement;

    const newItems = [...localItems];
    const [draggedItem] = newItems.splice(dragIndex, 1);
    newItems.splice(dropIndex, 0, draggedItem);

    setLocalItems(newItems);
    checkForChanges(newItems);

    setDraggedItemId(null);
    setDragOverIndex(null);
    setIsDragging(false);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 自動スクロールを停止
    stopAutoScroll();

    setDraggedItemId(null);
    setDragOverIndex(null);
    setIsDragging(false);
  };

  const handleSave = () => {
    onOrderChange(localItems.map((item) => item.id));
  };

  const handleReset = () => {
    setLocalItems(items);
    onUnsavedChangesChange?.(false);
  };

  // タッチイベントハンドラー（モバイル対応）
  const handleTouchStart = (e: React.TouchEvent, itemId: string) => {
    const touch = e.touches[0];
    setTouchStartPos({ x: touch.clientX, y: touch.clientY });
    setDraggedItemId(itemId);
    setIsDragging(false);

    // ハプティックフィードバック（ユーザーの操作後のみ実行）
    // Chrome の介入ポリシーにより、ユーザーがフレームをタップした後でないと振動は実行されません
    try {
      if ("vibrate" in navigator) {
        // ユーザーの直接的な操作に対してのみ振動を実行
        navigator.vibrate(50);
      }
    } catch (error) {
      // 振動が失敗しても処理は継続（ブラウザのセキュリティポリシーでブロックされる場合がある）
      console.debug("Vibration not supported or blocked by browser policy");
    }

    // ドラッグ開始のための長押し効果を追加（100ms後にドラッグモード開始）
    setTimeout(() => {
      if (draggedItemId === itemId) {
        setIsDragging(true);
      }
    }, 100);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // 自動スクロールを停止
    stopAutoScroll();

    // bodyのスクロールを復元
    document.body.style.overflow = "";

    if (!isDragging || !draggedItemId || dragOverIndex === null) {
      setDraggedItemId(null);
      setDragOverIndex(null);
      setTouchStartPos(null);
      setIsDragging(false);
      return;
    }

    const dragIndex = localItems.findIndex((item) => item.id === draggedItemId);

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
      {/* 固定保存ボタン（変更がある場合のみ表示） */}
      {hasUnsavedChanges && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-sm px-4 sm:left-auto sm:right-4 sm:transform-none sm:translate-x-0">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 shadow-lg backdrop-blur-sm bg-opacity-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></div>
                <span className="text-yellow-800 font-medium text-sm">
                  未保存の変更
                </span>
              </div>
              <div className="flex space-x-2 ml-3">
                <button
                  onClick={handleReset}
                  className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={isLoading}
                  title="変更をリセット"
                >
                  リセット
                </button>
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="変更を保存"
                >
                  {isLoading ? "保存中..." : "保存"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ギャラリープレビュー表示（モバイルサイズ固定） */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          ギャラリー表示プレビュー
        </h3>
        <div className="max-w-sm mx-auto">
          <div ref={containerRef} className="grid grid-cols-3 gap-2">
            {localItems.map((item, index) => (
              <div
                key={item.id}
                data-item-index={index}
                draggable
                onDragStart={(e) => handleDragStart(e, item.id)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                onTouchStart={(e) => handleTouchStart(e, item.id)}
                onTouchEnd={handleTouchEnd}
                className={`
                  relative cursor-move bg-white rounded-lg shadow-md overflow-hidden transition-all duration-200
                  ${
                    draggedItemId === item.id && isDragging
                      ? "opacity-60 scale-95 shadow-xl ring-2 ring-blue-500"
                      : ""
                  }
                  ${
                    dragOverIndex === index && draggedItemId !== item.id
                      ? "ring-2 ring-blue-400 scale-105"
                      : ""
                  }
                  hover:ring-2 hover:ring-gray-300
                  touch-manipulation
                  ${draggedItemId === item.id && isDragging ? "z-50" : ""}
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
