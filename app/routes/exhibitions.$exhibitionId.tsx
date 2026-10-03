import { useEffect, useRef, useState } from "react";
import {
  Link,
  useLoaderData,
  useRouteError,
  isRouteErrorResponse,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "react-router";
import { getAllItems } from "../data/items";
import {
  getExhibition,
  getExhibitionItems,
  type ExhibitionItem,
} from "../data/exhibitions";
import { requireAuth } from "../lib/auth-guard";
import { isValidImageUrl } from "../lib/formUtils";
import { Artwork } from "../components/gallery/Artwork";
import { Icon } from "../components/gallery/Icon";
import { ShareButton } from "../components/gallery/ShareButton";
import "../components/gallery/exhibitions.css";

interface LoaderData {
  title: string;
  description: string;
  public: boolean;
  items: ExhibitionItem[];
  url: string;
}

export const meta: MetaFunction = ({ data }) => {
  const exhibition = data as LoaderData | undefined;
  const title = exhibition?.title;
  const description =
    exhibition?.description ||
    "好きな一枚を、好きな並びで。手ぬぐいの小さな展示です。";
  const photograph = exhibition?.items.find((item) =>
    isValidImageUrl(item.imageUrl),
  )?.imageUrl;
  return [
    { title: title ? `${title} — TENUGUI` : "小さな展示室 — TENUGUI" },
    { name: "description", content: description },
    { name: "robots", content: "noindex" },
    { property: "og:type", content: "website" },
    { property: "og:title", content: title || "小さな展示室 — TENUGUI" },
    { property: "og:description", content: description },
    ...(exhibition ? [{ property: "og:url", content: exhibition.url }] : []),
    ...(photograph && exhibition?.public
      ? [
          {
            property: "og:image",
            content: new URL(photograph, exhibition.url).href,
          },
        ]
      : []),
  ];
};

export async function loader({ request, context, params }: LoaderFunctionArgs) {
  const kv = context.cloudflare.env.TENUGUI_KV;
  const exhibition = await getExhibition(kv, params.exhibitionId ?? "");
  if (!exhibition)
    throw new Response("この展示は見つかりませんでした。", { status: 404 });
  if (!exhibition.public) await requireAuth(request, context);
  const items = getExhibitionItems(exhibition, await getAllItems(kv));
  return Response.json(
    {
      title: exhibition.title,
      description: exhibition.description,
      public: exhibition.public,
      items,
      url: new URL(request.url).origin + `/exhibitions/${exhibition.id}`,
    } satisfies LoaderData,
    { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } },
  );
}

export default function ExhibitionGallery() {
  const exhibition = useLoaderData() as LoaderData;
  const [focused, setFocused] = useState<ExhibitionItem | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (focused) dialog.current?.showModal();
    else dialog.current?.close();
  }, [focused]);

  return (
    <div className="exhibition-gallery-page">
      <header className="exhibition-gallery-intro">
        <span className="exhibition-eyebrow">A SMALL EXHIBITION</span>
        <h1>{exhibition.title}</h1>
        {exhibition.description && <p>{exhibition.description}</p>}
        <div className="exhibition-gallery-meta">
          <span>{exhibition.items.length}枚の手ぬぐい</span>
          {exhibition.public ? (
            <ShareButton title={exhibition.title} url={exhibition.url} />
          ) : (
            <span className="exhibition-visibility">非公開の展示</span>
          )}
        </div>
      </header>
      {exhibition.items.length ? (
        <div className="exhibition-gallery-grid">
          {exhibition.items.map((item, index) => (
            <figure className="exhibition-gallery-work" key={item.id}>
              <button
                type="button"
                className="exhibition-gallery-art"
                onClick={() => setFocused(item)}
                aria-label={`${item.name}を大きく見る`}
              >
                <Artwork item={item} />
              </button>
              <figcaption>
                <span className="exhibition-work-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h2>{item.name}</h2>
                  <div className="exhibition-work-tags">
                    {item.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <div className="exhibition-empty">
          <p>この展示の手ぬぐいは、いまお休み中です。</p>
        </div>
      )}
      <footer className="exhibition-gallery-footer">
        <Icon name="leaf" size={22} />
        <p>好きなものと、暮らす。</p>
        <Link to="/">
          TENUGUI <Icon name="arrow" size={14} />
        </Link>
      </footer>
      <dialog
        ref={dialog}
        className="exhibition-lightbox"
        onClose={() => setFocused(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setFocused(null);
        }}
        aria-label={focused?.name ?? "手ぬぐいを大きく見る"}
      >
        {focused && (
          <>
            <button
              className="exhibition-lightbox-close"
              type="button"
              onClick={() => setFocused(null)}
              aria-label="閉じる"
              autoFocus
            >
              <Icon name="close" size={22} />
            </button>
            <Artwork item={focused} />
            <h2>{focused.name}</h2>
          </>
        )}
      </dialog>
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const missing = isRouteErrorResponse(error) && error.status === 404;
  return (
    <div className="exhibition-empty exhibition-error-page">
      <Icon name="leaf" size={32} />
      <h1>
        {missing
          ? "この展示は見つかりませんでした。"
          : "展示を開けませんでした。"}
      </h1>
      <p>
        {missing
          ? "リンクをご確認ください。"
          : "少し時間をおいて、もう一度お試しください。"}
      </p>
      <Link to="/" className="exhibition-button">
        コレクションへ
        <Icon name="arrow" size={16} />
      </Link>
    </div>
  );
}
