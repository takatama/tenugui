import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import type { Item } from "../../data/items";
import { getDisplayName } from "../../lib/itemPresentation";
import { Artwork } from "./Artwork";
import "./collection-order.css";

type MovePreview = {
  id: string;
  from: number;
  target: number;
  mode: "pointer" | "keyboard";
  left: number;
  top: number;
  width: number;
};

type MoveSession = MovePreview & {
  ids: string[];
  active: boolean;
  pointerId?: number;
  handle?: HTMLButtonElement;
  startX: number;
  startY: number;
  clientX: number;
  clientY: number;
  offsetX: number;
  offsetY: number;
  threshold: number;
};

function moveToPosition(ids: string[], from: number, target: number) {
  const next = [...ids];
  const [id] = next.splice(from, 1);
  next.splice(target, 0, id);
  return next;
}

function displayName(item: Item) {
  return getDisplayName(item.name).trim() || "名前のない一枚";
}

function Grip() {
  return (
    <svg
      width="18"
      height="22"
      viewBox="0 0 18 22"
      fill="currentColor"
      aria-hidden="true"
    >
      {[5, 11, 17].flatMap((y) =>
        [5, 12].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.5" />),
      )}
    </svg>
  );
}

/** A tentative move stays local until release/confirmation; the form only holds committed IDs. */
export function CollectionOrderList({
  items,
  onOrderChange,
  disabled,
  onDraggingChange,
}: {
  items: Item[];
  onOrderChange: (ids: string[]) => void;
  disabled: boolean;
  onDraggingChange?: (active: boolean) => void;
}) {
  const instructionsId = useId();
  const pickerId = useId();
  const list = useRef<HTMLOListElement>(null);
  const rows = useRef(new Map<string, HTMLLIElement>());
  const handles = useRef(new Map<string, HTMLButtonElement>());
  const session = useRef<MoveSession | null>(null);
  const animationFrame = useRef<number | null>(null);
  const suppressClickUntil = useRef(0);
  const callbacks = useRef({ items, onOrderChange, onDraggingChange });
  callbacks.current = { items, onOrderChange, onDraggingChange };
  const [move, setMove] = useState<MovePreview | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [focusRequest, setFocusRequest] = useState<{
    id: string;
    scroll: boolean;
  } | null>(null);
  const [picker, setPicker] = useState<{ id: string; position: number } | null>(
    null,
  );
  const currentPicker = useRef(picker);
  currentPicker.current = picker;
  const interacting = Boolean(move || picker);
  const orderSignature = JSON.stringify(items.map((item) => item.id));

  function viewportTop() {
    const bounds = document
      .querySelector<HTMLElement>(".shell-header")
      ?.getBoundingClientRect();
    return bounds && bounds.top < window.innerHeight && bounds.bottom > 0
      ? bounds.bottom
      : 0;
  }

  function viewportBottom() {
    const actions = document.querySelector<HTMLElement>(
      "[data-collection-order-actions]",
    );
    const bounds = actions?.getBoundingClientRect();
    return bounds && bounds.top > 0 && bounds.top < window.innerHeight
      ? bounds.top
      : window.innerHeight;
  }

  function keepRowVisible(id: string) {
    const bounds = rows.current.get(id)?.getBoundingClientRect();
    if (!bounds) return;
    // Upward scrolling reveals the header after this call, so reserve its full height.
    const headerHeight = document
      .querySelector<HTMLElement>(".shell-header")
      ?.getBoundingClientRect().height;
    const top = Math.max(viewportTop(), headerHeight ?? 0) + 24;
    const bottom = viewportBottom() - 24;
    if (bounds.bottom > bottom)
      window.scrollBy({ top: bounds.bottom - bottom, behavior: "instant" });
    else if (bounds.top < top)
      window.scrollBy({ top: bounds.top - top, behavior: "instant" });
  }

  function restoreFocus(id: string, scroll = false) {
    setFocusRequest({ id, scroll });
  }

  useLayoutEffect(() => {
    if (!focusRequest) return;
    // Wait for React to put the moved row in its new position before measuring it.
    handles.current.get(focusRequest.id)?.focus({ preventScroll: true });
    if (focusRequest.scroll) keepRowVisible(focusRequest.id);
  }, [focusRequest]);

  function stopAnimation() {
    if (animationFrame.current !== null)
      window.cancelAnimationFrame(animationFrame.current);
    animationFrame.current = null;
  }

  function finishMove(commit: boolean, focus = true) {
    const current = session.current;
    if (!current) return;
    // Clear first: releasing capture fires lostpointercapture synchronously in some browsers.
    session.current = null;
    stopAnimation();
    if (
      current.pointerId !== undefined &&
      current.handle?.hasPointerCapture(current.pointerId)
    )
      current.handle.releasePointerCapture(current.pointerId);
    setMove(null);
    if (current.active) {
      const item = callbacks.current.items.find((one) => one.id === current.id);
      const name = item ? displayName(item) : "この一枚";
      const sameOrder =
        JSON.stringify(current.ids) ===
        JSON.stringify(callbacks.current.items.map((one) => one.id));
      if (commit && sameOrder && current.target !== current.from) {
        callbacks.current.onOrderChange(
          moveToPosition(current.ids, current.from, current.target),
        );
        setAnnouncement(
          `${name}を${current.ids.length}枚中${current.target + 1}番目に移動しました。画面下の「並びを保存」を押してください。`,
        );
      } else {
        setAnnouncement(
          commit && sameOrder
            ? `${name}の並び順は変わりませんでした。`
            : `${name}の移動を取り消しました。${current.from + 1}番目のままです。`,
        );
      }
      if (focus) restoreFocus(current.id, current.mode === "keyboard");
    }
  }

  function updatePointerPreview(current: MoveSession) {
    const otherIds = current.ids.filter((id) => id !== current.id);
    const target = otherIds.findIndex((id) => {
      const bounds = rows.current.get(id)?.getBoundingClientRect();
      return bounds && current.clientY < bounds.top + bounds.height / 2;
    });
    const nextTarget = target < 0 ? otherIds.length : target;
    if (current.target !== nextTarget) {
      current.target = nextTarget;
      const item = callbacks.current.items.find((one) => one.id === current.id);
      setAnnouncement(
        `${item ? displayName(item) : "この一枚"}の移動先は${current.ids.length}枚中${nextTarget + 1}番目です。`,
      );
    }
    current.left = current.clientX - current.offsetX;
    current.top = current.clientY - current.offsetY;
    setMove({ ...current });
  }

  function autoScroll() {
    const current = session.current;
    if (!current?.active || current.mode !== "pointer") return;
    const top = viewportTop();
    const bottom = viewportBottom();
    const edge = Math.min(76, (bottom - top) / 4);
    let step = 0;
    if (current.clientY < top + edge)
      step = -Math.min(18, Math.max(2, (top + edge - current.clientY) / 4));
    else if (current.clientY > bottom - edge)
      step = Math.min(18, Math.max(2, (current.clientY - (bottom - edge)) / 4));
    const listBounds = list.current?.getBoundingClientRect();
    if (listBounds) {
      // Stop at the ends of this list, rather than carrying a held item into other settings.
      if (step < 0)
        step = -Math.min(-step, Math.max(0, top + 24 - listBounds.top));
      else if (step > 0)
        step = Math.min(step, Math.max(0, listBounds.bottom - (bottom - 24)));
    }
    if (step) {
      const before = window.scrollY;
      window.scrollBy({ top: step, behavior: "instant" });
      if (before !== window.scrollY) updatePointerPreview(current);
    }
    animationFrame.current = window.requestAnimationFrame(autoScroll);
  }

  function startPointer(event: PointerEvent<HTMLButtonElement>, item: Item) {
    if (disabled || items.length < 2 || !event.isPrimary || event.button !== 0)
      return;
    if (session.current) finishMove(false);
    const bounds = rows.current.get(item.id)?.getBoundingClientRect();
    if (!bounds) return;
    setPicker(null);
    const from = items.findIndex((one) => one.id === item.id);
    session.current = {
      id: item.id,
      ids: items.map((one) => one.id),
      from,
      target: from,
      mode: "pointer",
      active: false,
      pointerId: event.pointerId,
      handle: event.currentTarget,
      startX: event.clientX,
      startY: event.clientY,
      clientX: event.clientX,
      clientY: event.clientY,
      left: bounds.left,
      top: bounds.top,
      width: bounds.width,
      offsetX: event.clientX - bounds.left,
      offsetY: event.clientY - bounds.top,
      threshold: event.pointerType === "touch" ? 8 : 5,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function pointerMove(event: PointerEvent<HTMLButtonElement>) {
    const current = session.current;
    if (current?.mode !== "pointer" || current.pointerId !== event.pointerId)
      return;
    current.clientX = event.clientX;
    current.clientY = event.clientY;
    if (!current.active) {
      if (
        Math.hypot(
          event.clientX - current.startX,
          event.clientY - current.startY,
        ) < current.threshold
      )
        return;
      current.active = true;
      const item = callbacks.current.items.find((one) => one.id === current.id);
      setAnnouncement(
        `${item ? displayName(item) : "この一枚"}をつかみました。移動先の線に合わせて離してください。`,
      );
      animationFrame.current = window.requestAnimationFrame(autoScroll);
    }
    event.preventDefault();
    updatePointerPreview(current);
  }

  function handleKey(event: KeyboardEvent<HTMLButtonElement>, item: Item) {
    if (disabled || items.length < 2) return;
    if (event.repeat && (event.key === " " || event.key === "Enter")) {
      event.preventDefault();
      return;
    }
    const current = session.current;
    if (!current) {
      if (event.key !== " " && event.key !== "Enter") return;
      event.preventDefault();
      setPicker(null);
      const from = items.findIndex((one) => one.id === item.id);
      const next: MoveSession = {
        id: item.id,
        ids: items.map((one) => one.id),
        from,
        target: from,
        mode: "keyboard",
        active: true,
        left: 0,
        top: 0,
        width: 0,
        startX: 0,
        startY: 0,
        clientX: 0,
        clientY: 0,
        offsetX: 0,
        offsetY: 0,
        threshold: 0,
      };
      session.current = next;
      setMove(next);
      setAnnouncement(
        `${displayName(item)}をつかみました。上下キーで移動、Enterで決定、Escapeで取り消します。現在${items.length}枚中${from + 1}番目です。`,
      );
      return;
    }
    if (current.mode !== "keyboard" || current.id !== item.id) return;
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      finishMove(true);
    } else if (event.key === "Escape" || event.key === "Tab") {
      if (event.key === "Escape") event.preventDefault();
      finishMove(false, event.key !== "Tab");
    } else {
      let target = current.target;
      if (event.key === "ArrowUp") target -= 1;
      else if (event.key === "ArrowDown") target += 1;
      else if (event.key === "Home") target = 0;
      else if (event.key === "End") target = current.ids.length - 1;
      else return;
      event.preventDefault();
      current.target = Math.max(0, Math.min(current.ids.length - 1, target));
      setMove({ ...current });
      setAnnouncement(
        `${displayName(item)}の移動先は${current.ids.length}枚中${current.target + 1}番目です。Enterで決定、Escapeで取り消します。`,
      );
      restoreFocus(current.id, true);
    }
  }

  useEffect(() => {
    function escape(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (session.current) {
        event.preventDefault();
        if (session.current.mode === "pointer")
          suppressClickUntil.current = performance.now() + 500;
        finishMove(false);
      }
      if (currentPicker.current) restoreFocus(currentPicker.current.id);
      setPicker(null);
    }
    function cancelOnBlur() {
      finishMove(false, false);
    }
    function updateAfterScroll() {
      const current = session.current;
      if (current?.active && current.mode === "pointer")
        updatePointerPreview(current);
    }
    window.addEventListener("keydown", escape);
    window.addEventListener("blur", cancelOnBlur);
    window.addEventListener("scroll", updateAfterScroll, { passive: true });
    return () => {
      window.removeEventListener("keydown", escape);
      window.removeEventListener("blur", cancelOnBlur);
      window.removeEventListener("scroll", updateAfterScroll);
      const current = session.current;
      session.current = null;
      stopAnimation();
      if (
        current?.pointerId !== undefined &&
        current.handle?.hasPointerCapture(current.pointerId)
      )
        current.handle.releasePointerCapture(current.pointerId);
      callbacks.current.onDraggingChange?.(false);
    };
  }, []);

  useEffect(() => {
    // A selected destination is tentative too: disable Save until it is confirmed or canceled.
    callbacks.current.onDraggingChange?.(interacting);
  }, [interacting]);

  useEffect(() => {
    if (!picker) return;
    const frame = window.requestAnimationFrame(() => keepRowVisible(picker.id));
    return () => window.cancelAnimationFrame(frame);
  }, [picker?.id]);

  useEffect(() => {
    const current = session.current;
    if (
      current &&
      (disabled || JSON.stringify(current.ids) !== orderSignature)
    )
      finishMove(false, !disabled);
    setPicker((previous) => {
      if (disabled || !items.some((item) => item.id === previous?.id)) return null;
      return previous
        ? { ...previous, position: Math.min(previous.position, items.length - 1) }
        : null;
    });
  }, [disabled, orderSignature]);

  const itemMap = new Map(items.map((item) => [item.id, item]));
  // Props can change before the cancellation effect runs. Never render an old
  // position against a newer (possibly shorter) collection.
  const activeMove =
    !disabled &&
    session.current &&
    JSON.stringify(session.current.ids) === orderSignature
      ? move
      : null;
  const displayedItems =
    activeMove?.mode === "keyboard"
      ? moveToPosition(
          items.map((item) => item.id),
          activeMove.from,
          activeMove.target,
        ).map((id) => itemMap.get(id)!)
      : items;
  const otherIds = items.filter((item) => item.id !== activeMove?.id);
  const markerBeforeId =
    activeMove?.mode === "keyboard" ? activeMove.id : otherIds[activeMove?.target ?? -1]?.id;
  const markerAfterId =
    activeMove?.mode === "pointer" && activeMove.target === otherIds.length
      ? otherIds.at(-1)?.id
      : undefined;
  const movingItem = activeMove ? itemMap.get(activeMove.id) : undefined;

  function marker() {
    return (
      <span className="collection-order-marker" aria-hidden="true">
        <span>ここに移動</span>
      </span>
    );
  }

  return (
    <>
      <p id={instructionsId} className="collection-order-sr-only">
        移動ボタンをドラッグするか、押して移動先の番号を選べます。
        キーボードではSpaceまたはEnterでつかみ、上下キーで移動します。
        Homeで先頭、Endで末尾へ。SpaceまたはEnterで決定、Escapeで取り消します。
      </p>
      <div className="collection-order-sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
      {items.map((item) => (
        <input key={item.id} type="hidden" name="itemIds" value={item.id} />
      ))}
      <ol ref={list} className={`collection-order-list${activeMove ? " is-moving" : ""}`} aria-label="手ぬぐいの並び順">
        {displayedItems.map((item, index) => (
          <li
            key={item.id}
            ref={(node) => {
              if (node) rows.current.set(item.id, node);
              else rows.current.delete(item.id);
            }}
            className={`collection-order-row${activeMove?.id === item.id ? ` is-${activeMove.mode}-source` : ""}${picker?.id === item.id ? " is-picker-open" : ""}`}
          >
            {activeMove && markerBeforeId === item.id && marker()}
            <span className="collection-order-number" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="collection-order-art">
              <Artwork item={item} />
            </div>
            <span className="collection-order-name">
              {displayName(item)}
              {item.tags.length > 0 && (
                <small>{item.tags.slice(0, 3).join(" / ")}</small>
              )}
              {activeMove?.id === item.id && activeMove.mode === "keyboard" && (
                <small className="collection-order-keyboard-hint">
                  移動中 · Enterで決定 / Escで取消
                </small>
              )}
            </span>
            <button
              ref={(node) => {
                if (node) handles.current.set(item.id, node);
                else handles.current.delete(item.id);
              }}
              type="button"
              className="collection-order-handle"
              disabled={disabled || items.length < 2}
              aria-label={`${displayName(item)}を移動、${items.length}枚中${index + 1}番目`}
              aria-describedby={instructionsId}
              aria-pressed={activeMove?.id === item.id}
              aria-expanded={picker?.id === item.id}
              aria-controls={picker?.id === item.id ? pickerId : undefined}
              title="ドラッグして並べ替え。押すと移動先の番号を選べます"
              onPointerDown={(event) => startPointer(event, item)}
              onPointerMove={pointerMove}
              onPointerUp={(event) => {
                const current = session.current;
                if (current?.pointerId !== event.pointerId) return;
                if (current.active) {
                  current.clientX = event.clientX;
                  current.clientY = event.clientY;
                  updatePointerPreview(current);
                  suppressClickUntil.current = performance.now() + 500;
                }
                finishMove(true);
              }}
              onPointerCancel={(event) => {
                if (session.current?.pointerId === event.pointerId)
                  finishMove(false);
              }}
              onLostPointerCapture={(event) => {
                if (session.current?.pointerId === event.pointerId)
                  finishMove(false);
              }}
              onKeyDown={(event) => handleKey(event, item)}
              onClick={() => {
                if (performance.now() < suppressClickUntil.current || session.current)
                  return;
                setPicker((previous) =>
                  previous?.id === item.id ? null : { id: item.id, position: index },
                );
              }}
            >
              <Grip />
              <span>移動</span>
            </button>
            {picker?.id === item.id && (
              <div id={pickerId} className="collection-order-position-picker">
                <label>
                  <span>移動先</span>
                  <select
                    value={picker.position}
                    onChange={(event) =>
                      setPicker({ id: item.id, position: Number(event.target.value) })
                    }
                    disabled={disabled}
                    autoFocus
                  >
                    {items.map((one, position) => (
                      <option key={one.id} value={position}>
                        {position + 1}番目{position === index ? "（現在）" : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="collection-order-confirm-position"
                  disabled={disabled}
                  onClick={() => {
                    if (picker.position !== index) {
                      onOrderChange(
                        moveToPosition(
                          items.map((one) => one.id),
                          index,
                          picker.position,
                        ),
                      );
                      setAnnouncement(
                        `${displayName(item)}を${items.length}枚中${picker.position + 1}番目に移動しました。画面下の「並びを保存」を押してください。`,
                      );
                    }
                    setPicker(null);
                    restoreFocus(item.id, true);
                  }}
                >
                  この位置へ移動
                </button>
                <button
                  type="button"
                  className="collection-order-cancel-position"
                  onClick={() => {
                    setPicker(null);
                    restoreFocus(item.id);
                  }}
                >
                  キャンセル
                </button>
              </div>
            )}
            {activeMove && markerAfterId === item.id && (
              <span className="collection-order-marker-after">{marker()}</span>
            )}
          </li>
        ))}
      </ol>
      {activeMove?.mode === "pointer" && movingItem && (
        <div
          className="collection-order-drag-preview"
          style={{ left: activeMove.left, top: activeMove.top, width: activeMove.width }}
          aria-hidden="true"
        >
          <span className="collection-order-number">
            {String(activeMove.target + 1).padStart(2, "0")}
          </span>
          <div className="collection-order-art">
            <Artwork item={movingItem} />
          </div>
          <span className="collection-order-name">{displayName(movingItem)}</span>
          <span className="collection-order-preview-grip"><Grip /></span>
        </div>
      )}
    </>
  );
}
