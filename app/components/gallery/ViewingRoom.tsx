import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import type { Item } from "../../data/items";
import { getDisplayName } from "../../lib/itemPresentation";
import { Artwork } from "./Artwork";
import { Icon } from "./Icon";
import "./viewing-room.css";
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
      <header className="viewing-top">
        <div className="viewing-context">
          <span>COLLECTION</span>
          <p>一枚ずつ、眺める</p>
        </div>
        <button
          type="button"
          className="viewing-control"
          aria-label="鑑賞を閉じる"
          onClick={() => dialog.current?.close()}
        >
          <Icon name="close" />
        </button>
      </header>
      <div className="viewing-content">
        <button
          type="button"
          className="viewing-control viewing-prev"
          aria-label="前の一枚"
          disabled={items.length < 2}
          onClick={() => move(-1)}
        >
          <Icon name="arrow" style={{ transform: "rotate(180deg)" }} />
        </button>
        <figure className="viewing-art">
          <Artwork item={item} loading="eager" fetchPriority="high" />
        </figure>
        <button
          type="button"
          className="viewing-control viewing-next"
          aria-label="次の一枚"
          disabled={items.length < 2}
          onClick={() => move(1)}
        >
          <Icon name="arrow" />
        </button>
      </div>
      <div
        className="viewing-caption"
        aria-live={playing ? "off" : "polite"}
        aria-atomic="true"
      >
        <h2 id="viewing-title">{getDisplayName(item.name)}</h2>
        {item.memo && <p>{item.memo}</p>}
        <Link
          className="viewing-detail-link"
          to={`/items/${item.id}`}
          onClick={() => dialog.current?.close()}
        >
          この一枚の記録 <Icon name="arrow" size={14} />
        </Link>
      </div>
      <footer className="viewing-bottom">
        <div className="viewing-position">
          <span aria-label={`${currentIndex + 1}枚目、全${items.length}枚`}>
            {String(currentIndex + 1).padStart(2, "0")}
            <span aria-hidden="true">
              {" "}
              / {String(items.length).padStart(2, "0")}
            </span>
          </span>
          <small>矢印キーでも、次の一枚へ</small>
        </div>
        <button
          type="button"
          className="viewing-play"
          aria-pressed={playing}
          disabled={items.length < 2}
          onClick={() => setPlaying(!playing)}
        >
          <Icon name={playing ? "pause" : "play"} size={15} />
          {playing ? "自動再生を止める" : "自動で眺める"}
        </button>
      </footer>
    </dialog>
  );
}
