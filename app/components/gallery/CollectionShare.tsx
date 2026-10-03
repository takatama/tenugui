import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import "./collection-share.css";

export function CollectionShare({
  className = "",
  variant = "compact",
}: {
  className?: string;
  variant?: "compact" | "full";
}) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [fallbackUrl, setFallbackUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!fallbackUrl) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [fallbackUrl]);

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setFallbackUrl("");
      setMessage("コレクションのリンクをコピーしました");
    } catch {
      setFallbackUrl(url);
      setMessage("このリンクをコピーして共有できます");
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }

  async function copyCollectionLink() {
    if (pending) return;
    setPending(true);
    setMessage("");
    try {
      await copyLink(`${window.location.origin}/`);
    } finally {
      setPending(false);
    }
  }

  async function share() {
    if (pending) return;
    setPending(true);
    setMessage("");
    // Share the whole collection, even while viewing a search or favorites.
    const url = `${window.location.origin}/`;
    try {
      if (typeof navigator.share === "function") {
        try {
          await navigator.share({
            title: "手ぬぐい帖｜私のコレクション",
            text: "好きな一枚が集まった、私の手ぬぐいコレクションです。",
            url,
          });
          setMessage("共有しました");
          return;
        } catch (error) {
          if (
            error !== null &&
            typeof error === "object" &&
            "name" in error &&
            error.name === "AbortError"
          )
            return;
        }
      }
      await copyLink(url);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={`collection-share is-${variant} ${className}`}>
      <button
        type="button"
        className="collection-share-button"
        aria-label="コレクションを共有する"
        aria-busy={pending || undefined}
        disabled={pending}
        onClick={share}
      >
        <Icon name="share" size={17} />
        <span>{variant === "full" ? "この世界をシェア" : "共有する"}</span>
      </button>
      {variant === "full" && (
        <button
          type="button"
          className="collection-copy-button"
          disabled={pending}
          onClick={copyCollectionLink}
        >
          リンクをコピー
        </button>
      )}
      {variant === "full" && (
        <p className="collection-share-note">
          いつものコレクションを、そのまま。
        </p>
      )}
      <span
        className="collection-share-feedback"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {message}
      </span>
      {fallbackUrl && (
        <input
          ref={inputRef}
          className="collection-share-url"
          type="url"
          aria-label="コレクションの共有リンク"
          value={fallbackUrl}
          readOnly
          onFocus={(event) => event.currentTarget.select()}
        />
      )}
    </div>
  );
}
