import { useEffect, useRef, useCallback } from "react";

/**
 * フォーカストラップ機能を提供するカスタムフック
 * モーダルやメニューなど、特定の要素内にフォーカスを閉じ込める
 */
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // フォーカス可能な要素を取得する関数
  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];

    const focusableSelectors = [
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "a[href]",
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ].join(", ");

    return Array.from(
      containerRef.current.querySelectorAll(focusableSelectors)
    ) as HTMLElement[];
  }, []);

  // タブキーのハンドリング
  const handleTabKey = useCallback(
    (event: KeyboardEvent) => {
      if (!isActive || event.key !== "Tab") return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const currentElement = document.activeElement as HTMLElement;

      if (event.shiftKey) {
        // Shift + Tab (逆方向)
        if (
          currentElement === firstElement ||
          !focusableElements.includes(currentElement)
        ) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab (順方向)
        if (
          currentElement === lastElement ||
          !focusableElements.includes(currentElement)
        ) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    },
    [isActive, getFocusableElements]
  );

  // フォーカストラップの開始/終了処理
  useEffect(() => {
    if (isActive) {
      // 現在のフォーカス要素を保存
      previousFocusRef.current = document.activeElement as HTMLElement;

      // 最初のフォーカス可能要素にフォーカス
      const focusableElements = getFocusableElements();
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }

      // キーボードイベントリスナーを追加
      document.addEventListener("keydown", handleTabKey);
    } else {
      // フォーカストラップ終了時、元の要素にフォーカスを戻す
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
        previousFocusRef.current = null;
      }
    }

    return () => {
      document.removeEventListener("keydown", handleTabKey);
    };
  }, [isActive, handleTabKey, getFocusableElements]);

  return containerRef;
}
