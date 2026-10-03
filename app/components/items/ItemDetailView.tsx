import { useEffect, useRef, useState } from "react";
import { Form, Link, useActionData, useNavigation } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import { useFavorites } from "../../hooks/useFavorites";
import type { Item } from "../../data/items";
import { isHttpUrl, isValidImageUrl } from "../../lib/formUtils";
import { Icon } from "../gallery/Icon";
import "./item-pages.css";

interface ItemDetailViewProps {
  item: Item;
}

export function ItemDetailView({ item }: ItemDetailViewProps) {
  const { isAuthenticated } = useAuth();
  const { favorites, toggleFavorite, error: favoriteError } = useFavorites();
  const navigation = useNavigation();
  const actionData = useActionData<{ error?: string }>();
  const [imageFailed, setImageFailed] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const photoDialog = useRef<HTMLDialogElement>(null);
  const deleteDialog = useRef<HTMLDialogElement>(null);
  const deleting = navigation.state !== "idle";
  const hasPhoto = isValidImageUrl(item.imageUrl) && !imageFailed;
  const productUrl =
    item.productUrl && isHttpUrl(item.productUrl) ? item.productUrl : undefined;

  useEffect(() => {
    setImageFailed(false);
  }, [item.imageUrl]);
  useEffect(() => {
    if (!zoomOpen && !deleteOpen) return;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = oldOverflow;
    };
  }, [zoomOpen, deleteOpen]);

  const openPhoto = () => {
    photoDialog.current?.showModal();
    setZoomOpen(true);
  };

  return (
    <article className="item-page item-detail-page">
      <div className="item-detail-top">
        <Link to="/" className="item-back">
          <Icon name="arrow" size={16} />
          コレクションに戻る
        </Link>
        <span className="item-eyebrow">ONE PIECE, ONE STORY</span>
      </div>
      {actionData?.error && (
        <p className="item-alert" role="alert">
          {actionData.error}
        </p>
      )}
      <div className="item-detail-layout">
        <figure className="item-detail-photo">
          <div className="item-photo-mat">
            {hasPhoto ? (
              <button
                type="button"
                className="item-photo-open"
                onClick={openPhoto}
                aria-label={`${item.name} の写真を大きく見る`}
              >
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="item-detail-image"
                  onError={() => setImageFailed(true)}
                />
                <span className="item-photo-zoom-label">
                  <Icon name="eye" size={15} />
                  大きく眺める
                </span>
              </button>
            ) : (
              <div className="item-photo-empty">
                <Icon name="image" size={44} />
                <p>写真を表示できませんでした</p>
                <span>
                  {isAuthenticated
                    ? "編集画面から、写真を選び直せます。"
                    : "この一枚の記録をお楽しみください。"}
                </span>
              </div>
            )}
          </div>
          <figcaption>柄の全体を、ゆっくり。</figcaption>
        </figure>

        <div className="item-detail-story">
          <div className="item-detail-status-row">
            <span className="item-detail-status">
              <Icon
                name={item.status === "unpurchased" ? "eye" : "leaf"}
                size={14}
              />
              {item.status === "unpurchased"
                ? "気になる一枚"
                : "コレクションの一枚"}
            </span>
            <button
              type="button"
              className={
                "item-detail-favorite" +
                (favorites.includes(item.id) ? " is-favorite" : "")
              }
              aria-pressed={favorites.includes(item.id)}
              aria-label={
                favorites.includes(item.id)
                  ? "お気に入りから外す"
                  : "お気に入りに追加"
              }
              onClick={() => toggleFavorite(item.id)}
            >
              <Icon
                name="heart"
                size={18}
                fill={favorites.includes(item.id) ? "currentColor" : "none"}
              />
            </button>
          </div>
          <h1>{item.name}</h1>
          <div className="item-detail-rule" />
          {!!item.tags?.length && (
            <div className="item-detail-tags" aria-label="この一枚のタグ">
              {item.tags.map((tag) => (
                <Link key={tag} to={`/?tag=${encodeURIComponent(tag)}`}>
                  {tag}
                </Link>
              ))}
            </div>
          )}

          <section
            className="item-detail-memo"
            aria-labelledby="memory-heading"
          >
            <h2 id="memory-heading">
              <Icon name="book" size={17} />
              この一枚のこと
            </h2>
            {item.memo ? (
              <p>{item.memo}</p>
            ) : (
              <div className="item-memory-empty">
                <p>この一枚の思い出は、これから。</p>
                {isAuthenticated && (
                  <Link to={`/items/${item.id}/edit#memo`}>
                    ひとこと書き添える
                    <Icon name="arrow" size={14} />
                  </Link>
                )}
              </div>
            )}
          </section>

          {productUrl && (
            <a
              className="item-shop-link"
              href={productUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>見つけたお店へ</span>
              <Icon name="arrow" size={17} />
              <small>新しいタブで開きます</small>
            </a>
          )}

          {isAuthenticated && (
            <div className="item-detail-actions">
              <Link to={`/items/${item.id}/edit`} className="item-button">
                <Icon name="edit" size={16} />
                記録を編集
              </Link>
              <button
                type="button"
                className="item-remove-button"
                onClick={() => {
                  deleteDialog.current?.showModal();
                  setDeleteOpen(true);
                }}
              >
                <Icon name="trash" size={15} />
                棚から外す
              </button>
            </div>
          )}
          {favoriteError && (
            <p className="item-alert" role="status">
              {favoriteError}
            </p>
          )}
          <p className="item-detail-footnote">好きな柄と、好きな時間。</p>
        </div>
      </div>

      <dialog
        className="item-zoom-dialog"
        ref={photoDialog}
        aria-label={`${item.name} の写真`}
        onClose={() => setZoomOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget)
            photoDialog.current?.close();
        }}
      >
        <button
          type="button"
          className="item-zoom-close"
          onClick={() => photoDialog.current?.close()}
          aria-label="写真を閉じる"
        >
          <Icon name="close" size={24} />
        </button>
        <img
          src={hasPhoto ? item.imageUrl : undefined}
          alt={item.name}
          onError={() => {
            photoDialog.current?.close();
            setImageFailed(true);
          }}
        />
        <p>{item.name}</p>
      </dialog>

      <dialog
        className="item-delete-dialog"
        ref={deleteDialog}
        aria-labelledby="delete-title"
        onClose={() => setDeleteOpen(false)}
        onCancel={(event) => {
          if (deleting) event.preventDefault();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget && !deleting)
            deleteDialog.current?.close();
        }}
      >
        <div className="item-delete-content">
          <span className="item-eyebrow">YOUR COLLECTION</span>
          <h2 id="delete-title">
            この一枚を、
            <br />
            棚から外しますか？
          </h2>
          <p>
            「{item.name}
            」をコレクションから外します。「コレクションを整える」から、棚に戻せます。
          </p>
          {actionData?.error && (
            <p className="item-alert" role="alert">
              {actionData.error}
            </p>
          )}
          <Form method="post" className="item-delete-actions">
            <input type="hidden" name="intent" value="delete" />
            <button
              type="button"
              className="item-button item-button-quiet"
              onClick={() => deleteDialog.current?.close()}
              disabled={deleting}
            >
              そのままにする
            </button>
            <button
              type="submit"
              className="item-button item-button-danger"
              disabled={deleting}
            >
              {deleting ? "外しています…" : "棚から外す"}
            </button>
          </Form>
        </div>
      </dialog>
    </article>
  );
}
