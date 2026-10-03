import { useState } from "react";
import { Icon } from "./Icon";

export function ShareButton({
  title,
  url,
  className = "",
}: {
  title: string;
  url: string;
  className?: string;
}) {
  const [message, setMessage] = useState("");
  const [showUrl, setShowUrl] = useState(false);

  async function share() {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title,
          text: "私の手ぬぐいの小さな展示です。",
          url,
        });
        return;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
      }
    }
    await copyLink();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setMessage("リンクをコピーしました");
    } catch {
      setShowUrl(true);
      setMessage("リンクを選択してコピーしてください");
    }
  }

  return (
    <div className={`exhibition-share ${className}`}>
      <button
        type="button"
        className="exhibition-button exhibition-button-light"
        onClick={share}
      >
        <Icon name="share" size={16} />
        <span>展示をシェア</span>
      </button>
      <button
        type="button"
        className="exhibition-text-button"
        onClick={copyLink}
      >
        リンクをコピー
      </button>
      {message && (
        <span className="exhibition-share-feedback" role="status">
          {message}
        </span>
      )}
      {showUrl && (
        <input
          className="exhibition-share-url"
          aria-label="共有リンク"
          value={url}
          readOnly
          onFocus={(event) => event.currentTarget.select()}
        />
      )}
    </div>
  );
}
