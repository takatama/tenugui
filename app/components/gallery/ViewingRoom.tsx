import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import type { Item } from "../../data/items";
import { Artwork } from "./Artwork";
import { Icon } from "./Icon";
export function ViewingRoom({
  items,
  initialIndex = 0,
  onClose,
}: {
  items: Item[];
  initialIndex?: number;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(initialIndex);
  const [playing, setPlaying] = useState(false);
  const currentIndex = items.length ? Math.min(index, items.length - 1) : 0;
  const item = items[currentIndex];
  const move = (direction: number) =>
    setIndex(
      (current) =>
        (Math.min(current, items.length - 1) + direction + items.length) %
        items.length,
    );
  const hasItems = items.length > 0;
  useEffect(() => {
    const modal = dialog.current;
    if (!hasItems || !modal) return;
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    modal.showModal();
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      if (modal.open) modal.close();
      document.body.style.overflow = oldOverflow;
      if (previousFocus?.isConnected)
        previousFocus.focus({ preventScroll: true });
    };
  }, [hasItems]);
  useEffect(() => {
    if (!hasItems) onClose();
  }, [hasItems, onClose]);
  useEffect(() => {
    if (!playing || items.length < 2) return;
    const timer = window.setInterval(
      () =>
        setIndex(
          (current) => (Math.min(current, items.length - 1) + 1) % items.length,
        ),
      6500,
    );
    return () => clearInterval(timer);
  }, [playing, items.length]);
  if (!item) return null;
  return (
    <dialog
      ref={dialog}
      className="viewing-room"
      aria-labelledby="viewing-title"
      onClose={() => {
        // StrictMode may reopen after effect cleanup before its close event runs.
        if (!dialog.current?.open) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          move(1);
        }
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          move(-1);
        }
      }}
    >
      <div className="viewing-top">
        <span className="eyebrow">A MOMENT WITH YOUR COLLECTION</span>
        <button
          className="icon-button"
          aria-label="展示モードを閉じる"
          onClick={() => dialog.current?.close()}
        >
          <Icon name="close" />
        </button>
      </div>
      <div className="viewing-content">
        <button
          className="icon-button viewing-prev"
          aria-label="前の一枚"
          disabled={items.length < 2}
          onClick={() => move(-1)}
        >
          <Icon name="arrow" style={{ transform: "rotate(180deg)" }} />
        </button>
        <div className="viewing-art">
          <Artwork item={item} />
        </div>
        <button
          className="icon-button viewing-next"
          aria-label="次の一枚"
          disabled={items.length < 2}
          onClick={() => move(1)}
        >
          <Icon name="arrow" />
        </button>
        <div className="viewing-caption" aria-live="polite">
          <span className="eyebrow">
            {String(currentIndex + 1).padStart(2, "0")} /{" "}
            {String(items.length).padStart(2, "0")}
          </span>
          <h2 id="viewing-title">{item.name}</h2>
          <p>{item.memo || "好きな一枚を、ゆっくりと。"}</p>
          <div className="viewing-tags">
            {item.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          <Link
            className="text-link"
            to={`/items/${item.id}`}
            onClick={() => dialog.current?.close()}
          >
            この一枚の物語 <Icon name="arrow" size={16} />
          </Link>
        </div>
      </div>
      <div className="viewing-bottom">
        <span>矢印キーでも、次の一枚へ。</span>
        <button
          className="text-link"
          aria-pressed={playing}
          disabled={items.length < 2}
          onClick={() => setPlaying(!playing)}
        >
          <Icon name={playing ? "pause" : "play"} size={15} />
          {playing ? "自動再生を止める" : "ゆっくり自動再生"}
        </button>
      </div>
    </dialog>
  );
}
