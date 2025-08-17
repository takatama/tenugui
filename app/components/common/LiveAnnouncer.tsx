import { useEffect, useState } from "react";

interface LiveAnnouncerProps {
  /** アナウンスメッセージ */
  message: string;
  /** アナウンスの緊急度 */
  priority?: "polite" | "assertive";
  /** アナウンス後の自動クリア時間（ミリ秒） */
  clearDelay?: number;
}

/**
 * スクリーンリーダー用のライブアナウンスコンポーネント
 * 状態変更やエラーメッセージなどを音声で通知する
 */
export function LiveAnnouncer({
  message,
  priority = "polite",
  clearDelay = 3000,
}: LiveAnnouncerProps) {
  const [currentMessage, setCurrentMessage] = useState("");

  useEffect(() => {
    if (message) {
      setCurrentMessage(message);

      if (clearDelay > 0) {
        const timer = setTimeout(() => {
          setCurrentMessage("");
        }, clearDelay);

        return () => clearTimeout(timer);
      }
    }
  }, [message, clearDelay]);

  return (
    <div aria-live={priority} aria-atomic="true" className="sr-only">
      {currentMessage}
    </div>
  );
}

/**
 * グローバルなライブアナウンス管理用のカスタムフック
 */
export function useAnnouncer() {
  const [announcement, setAnnouncement] = useState<{
    message: string;
    priority: "polite" | "assertive";
  } | null>(null);

  const announce = (
    message: string,
    priority: "polite" | "assertive" = "polite"
  ) => {
    setAnnouncement({ message, priority });
  };

  const announceError = (message: string) => {
    announce(message, "assertive");
  };

  const announceSuccess = (message: string) => {
    announce(message, "polite");
  };

  const clear = () => {
    setAnnouncement(null);
  };

  return {
    announcement,
    announce,
    announceError,
    announceSuccess,
    clear,
  };
}
