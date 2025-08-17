import { useRef, useCallback } from "react";

export function useAutoScroll() {
  const autoScrollRef = useRef<number | null>(null);

  const handleAutoScroll = useCallback((clientY: number) => {
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
        // 再帰的に自動スクロールを継続
        handleAutoScroll(clientY);
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
        // 再帰的に自動スクロールを継続
        handleAutoScroll(clientY);
      });
    }
    // 中央にいる場合はスクロール停止
    else {
      if (autoScrollRef.current) {
        cancelAnimationFrame(autoScrollRef.current);
        autoScrollRef.current = null;
      }
    }
  }, []);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollRef.current) {
      cancelAnimationFrame(autoScrollRef.current);
      autoScrollRef.current = null;
    }
  }, []);

  return {
    handleAutoScroll,
    stopAutoScroll,
  };
}
