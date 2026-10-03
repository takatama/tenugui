import { useMemo, useRef, useState } from "react";
import {
  Link,
  useLoaderData,
  useSearchParams,
  type LoaderFunctionArgs,
  type MetaFunction,
  type ShouldRevalidateFunctionArgs,
} from "react-router";
import { getItems, type Item } from "../data/items";
import { Artwork } from "../components/gallery/Artwork";
import { CollectionShare } from "../components/gallery/CollectionShare";
import { Icon } from "../components/gallery/Icon";
import { ViewingRoom } from "../components/gallery/ViewingRoom";
import { getDisplayName } from "../lib/itemPresentation";
import { useFavorites } from "../hooks/useFavorites";

interface LoaderData {
  items: Item[];
  allTags: string[];
  totalCount: number;
  isDemo: boolean;
  collectionUrl: string;
}

export const meta: MetaFunction = ({ data }) => {
  const collection = data as LoaderData | undefined;
  const title = "手ぬぐい帖 — 好きな柄と、暮らす。";
  const description = `迎えた一枚も、気になる一枚も。${collection?.totalCount ? `${collection.totalCount}枚の` : ""}好きな手ぬぐいを、ゆっくり眺める私のコレクション。`;
  const image = collection?.items[0]?.imageUrl;
  let imageUrl: string | undefined;
  try {
    if (image && collection?.collectionUrl) {
      const resolved = new URL(image, collection.collectionUrl);
      if (["http:", "https:"].includes(resolved.protocol))
        imageUrl = resolved.href;
    }
  } catch {
    /* A broken legacy photo must not prevent the collection loading. */
  }
  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    ...(collection?.collectionUrl
      ? [
          { property: "og:url", content: collection.collectionUrl },
          { tagName: "link", rel: "canonical", href: collection.collectionUrl },
        ]
      : []),
    ...(imageUrl
      ? [
          { property: "og:image", content: imageUrl },
          {
            property: "og:image:alt",
            content: getDisplayName(collection!.items[0].name),
          },
          { name: "twitter:card", content: "summary_large_image" },
        ]
      : []),
  ];
};

export async function loader({ context, request }: LoaderFunctionArgs) {
  const kv = context.cloudflare.env.TENUGUI_KV;
  const result = await getItems(kv);
  const isDemo =
    import.meta.env.DEV &&
    (result.items.some((item) => item.id.startsWith("demo-")) ||
      (await kv.get("items")) === null);
  return Response.json(
    { ...result, isDemo, collectionUrl: new URL("/", request.url).href },
    { headers: { "Cache-Control": "no-store" } },
  );
}

// Filtering changes only the view of the loaded collection. Mutations and
// returning from another page still load fresh records.
export function shouldRevalidate({
  currentUrl,
  nextUrl,
  formMethod,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) {
  if (
    !formMethod &&
    currentUrl.pathname === nextUrl.pathname &&
    currentUrl.search !== nextUrl.search
  )
    return false;
  return defaultShouldRevalidate;
}

export default function Items() {
  const { items, allTags, isDemo } = useLoaderData<LoaderData>();
  const [params, setParams] = useSearchParams();
  const { favorites, toggleFavorite, error, storageMode } = useFavorites();
  const [sort, setSort] = useState("collection");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [viewing, setViewing] = useState<number | null>(null);
  const query = params.get("q") || "";
  const tag = params.get("tag") || "";
  const favoritesOnly = params.get("view") === "favorites";
  const status = ["purchased", "unpurchased"].includes(
    params.get("status") || "",
  )
    ? params.get("status")!
    : "";
  const [filtersOpen, setFiltersOpen] = useState(!!(query || tag || status));
  const searchInput = useRef<HTMLInputElement>(null);
  const activeFilterCount =
    Number(!!query.trim()) + Number(!!tag) + Number(!!status);
  const collectionIndices = useMemo(
    () => new Map(items.map((item, index) => [item.id, index])),
    [items],
  );

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    setParams(next, { preventScrollReset: true, replace: key === "q" });
  }
  function clearFilters() {
    const next = new URLSearchParams();
    if (favoritesOnly) next.set("view", "favorites");
    setParams(next, { preventScrollReset: true });
  }
  const visibleItems = useMemo(() => {
    const search = query.trim().normalize("NFKC").toLocaleLowerCase("ja");
    const filtered = items.filter(
      (item) =>
        (!favoritesOnly || favorites.includes(item.id)) &&
        (!tag || item.tags.includes(tag)) &&
        (!status || item.status === status) &&
        (!search ||
          `${item.name} ${item.memo} ${item.tags.join(" ")}`
            .normalize("NFKC")
            .toLocaleLowerCase("ja")
            .includes(search)),
    );
    if (sort === "name")
      filtered.sort((a, b) =>
        getDisplayName(a.name).localeCompare(getDisplayName(b.name), "ja"),
      );
    if (sort === "oldest") filtered.reverse();
    return filtered;
  }, [items, favoritesOnly, favorites, tag, status, query, sort]);

  return (
    <div className="collection-page">
      <header className="collection-opening">
        <div className="collection-opening-copy">
          <span className="eyebrow">
            <span className="tiny-line" /> A COLLECTION OF SMALL JOYS
          </span>
          <h1>
            {favoritesOnly ? "お気に入りの一枚" : "私の手ぬぐい帖"}
          </h1>
          <p>
            {favoritesOnly
              ? "何度でも、眺めたくなる柄。"
              : "迎えた一枚も、気になる一枚も。"}
          </p>
        </div>
        <div className="collection-opening-actions">
          <CollectionShare variant="compact" />
          <Link className="primary-button collection-add" to="/items/new">
            <Icon name="plus" size={17} />
            一枚を追加
          </Link>
        </div>
      </header>

      <section
        className="collection-section"
        aria-label="てぬぐいのコレクション"
      >
        {isDemo && (
          <p className="demo-notice">
            <span>サンプル</span>
            ローカル環境の、デザイン確認用コレクションです。
          </p>
        )}
        <div className="collection-toolbar">
          <div className="collection-count" role="status" aria-live="polite">
            <span>{String(visibleItems.length).padStart(2, "0")}</span>
            <small>
              {activeFilterCount || favoritesOnly
                ? "枚を眺める"
                : "枚の、好き。"}
            </small>
            {!!tag && <span className="active-tag-label">{tag}</span>}
          </div>
          <div className="collection-tools">
            <button
              type="button"
              className={`collection-tool ${filtersOpen ? "is-active" : ""}`}
              aria-label="一枚を探す"
              aria-expanded={filtersOpen}
              aria-controls="collection-filters"
              onClick={() => {
                setFiltersOpen(!filtersOpen);
                if (!filtersOpen)
                  requestAnimationFrame(() =>
                    searchInput.current?.focus({ preventScroll: true }),
                  );
              }}
            >
              <Icon name="search" size={17} />
              <span>一枚を探す</span>
              {activeFilterCount > 0 && (
                <span className="filter-count">{activeFilterCount}</span>
              )}
            </button>
            <button
              type="button"
              className="collection-tool collection-view"
              aria-label="ゆっくり眺める"
              disabled={!visibleItems.length}
              onClick={() => setViewing(0)}
            >
              <Icon name="eye" size={18} />
              <span>ゆっくり眺める</span>
            </button>
            <div className="view-switch" role="group" aria-label="表示形式">
              <button
                type="button"
                className={`icon-button ${layout === "grid" ? "selected" : ""}`}
                aria-label="ギャラリー表示"
                aria-pressed={layout === "grid"}
                onClick={() => setLayout("grid")}
              >
                <Icon name="grid" size={16} />
              </button>
              <button
                type="button"
                className={`icon-button ${layout === "list" ? "selected" : ""}`}
                aria-label="リスト表示"
                aria-pressed={layout === "list"}
                onClick={() => setLayout("list")}
              >
                <Icon name="list" size={18} />
              </button>
            </div>
          </div>
        </div>

        <div
          id="collection-filters"
          className="collection-filters"
          hidden={!filtersOpen}
        >
          <div className="filter-fields">
            <label className="search-field">
              <Icon name="search" size={18} />
              <input
                ref={searchInput}
                type="search"
                value={query}
                onChange={(event) => updateParam("q", event.target.value)}
                placeholder="名前・タグ・思い出から"
                aria-label="名前・タグ・思い出から検索"
              />
            </label>
            <label className="filter-select">
              <span>収集状況</span>
              <select
                aria-label="収集状況"
                value={status}
                onChange={(event) => updateParam("status", event.target.value)}
              >
                <option value="">すべての一枚</option>
                <option value="purchased">お迎え済み</option>
                <option value="unpurchased">気になる一枚</option>
              </select>
            </label>
            <label className="filter-select">
              <span>並び順</span>
              <select
                aria-label="並び順"
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
                <option value="collection">いつもの並び</option>
                <option value="oldest">いつもの並びの逆順</option>
                <option value="name">名前順</option>
              </select>
            </label>
          </div>
          {allTags.length > 0 && (
            <div
              className="tag-filters"
              role="group"
              aria-label="タグで絞り込み"
            >
              <button
                type="button"
                className={`filter-chip ${!tag ? "selected" : ""}`}
                aria-pressed={!tag}
                onClick={() => updateParam("tag", "")}
              >
                すべて
              </button>
              {allTags.map((entry) => (
                <button
                  type="button"
                  key={entry}
                  className={`filter-chip ${tag === entry ? "selected" : ""}`}
                  aria-pressed={tag === entry}
                  onClick={() => updateParam("tag", tag === entry ? "" : entry)}
                >
                  {entry}
                </button>
              ))}
            </div>
          )}
          {activeFilterCount > 0 && (
            <button
              type="button"
              className="filter-reset text-link"
              onClick={clearFilters}
            >
              <Icon name="close" size={14} />
              絞り込みをリセット
            </button>
          )}
        </div>
        {error && (
          <p role="alert" className="inline-error">
            {error}
          </p>
        )}

        <div
          className={`collection-grid ${layout === "list" ? "collection-list" : ""}`}
        >
          {visibleItems.map((item, index) => {
            const name = getDisplayName(item.name);
            const position = collectionIndices.get(item.id) || 0;
            return (
              <article className="collection-card" key={item.id}>
                <div className={`artwork-mat mat-${position % 3}`}>
                  <button
                    type="button"
                    className="artwork-link"
                    aria-label={`${name}を大きく眺める`}
                    onClick={() => setViewing(index)}
                  >
                    <Artwork
                      item={item}
                      loading={index < 4 ? "eager" : "lazy"}
                      fetchPriority={index === 0 ? "high" : "auto"}
                    />
                    <span className="artwork-hover">
                      <Icon name="eye" size={16} />
                      大きく眺める
                    </span>
                  </button>
                  <button
                    type="button"
                    className={`favorite-button ${favorites.includes(item.id) ? "is-favorite" : ""}`}
                    aria-label={`${name}を${favorites.includes(item.id) ? "お気に入りから外す" : "お気に入りにする"}`}
                    aria-pressed={favorites.includes(item.id)}
                    onClick={() => toggleFavorite(item.id)}
                  >
                    <Icon
                      name="heart"
                      size={17}
                      fill={
                        favorites.includes(item.id) ? "currentColor" : "none"
                      }
                    />
                  </button>
                  {item.status === "unpurchased" && (
                    <span className="wish-badge">
                      <span />
                      気になる
                    </span>
                  )}
                </div>
                <div className="card-copy">
                  <div className="card-title-row">
                    <Link
                      to={`/items/${item.id}`}
                      aria-label={`${name}の記録を見る`}
                      title={item.name}
                    >
                      <h2>{name}</h2>
                    </Link>
                    <span className="card-number">
                      {String(position + 1).padStart(2, "0")}
                    </span>
                  </div>
                  {item.tags.length > 0 && (
                    <p className="card-tags">
                      {item.tags.slice(0, 2).join(" · ")}
                    </p>
                  )}
                  {layout === "list" && item.memo && (
                    <p className="card-memo">{item.memo}</p>
                  )}
                  {layout === "list" && (
                    <button
                      type="button"
                      className="card-view-button"
                      onClick={() => setViewing(index)}
                    >
                      ゆっくり眺める
                      <Icon name="eye" size={15} />
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
        {!visibleItems.length && (
          <div className="empty-collection">
            <Icon name={favoritesOnly ? "heart" : "leaf"} size={34} />
            <h2>
              {activeFilterCount
                ? "その一枚は、まだ見つかりませんでした。"
                : favoritesOnly
                  ? "何度でも眺めたい一枚に、ハートを。"
                  : "好きな一枚から、少しずつ。"}
            </h2>
            <p>
              {activeFilterCount
                ? "少し違う言葉やタグで、探してみてください。"
                : favoritesOnly
                  ? storageMode === "cloud"
                    ? "お気に入りは、ログインした端末で一緒に楽しめます。"
                    : storageMode === "loading"
                      ? "お気に入りを読み込んでいます。"
                      : "お気に入りは、このブラウザに保存されます。"
                  : "買った一枚も、いつか迎えたい一枚も。写真やお店のURLから残せます。"}
            </p>
            {activeFilterCount ? (
              <button
                type="button"
                className="outline-button"
                onClick={clearFilters}
              >
                絞り込みをリセット
              </button>
            ) : (
              <Link
                className="primary-button"
                to={favoritesOnly ? "/" : "/items/new"}
              >
                {favoritesOnly ? "コレクションを眺める" : "一枚を追加"}
                <Icon name="arrow" size={16} />
              </Link>
            )}
          </div>
        )}
      </section>

      {!!items.length && (
        <section className="collection-sharing" aria-label="コレクションを共有">
          <div>
            <span className="eyebrow">A LITTLE WORLD OF MY OWN</span>
            <h2>好きな柄を、誰かにも。</h2>
            <p>このコレクションを、そのまま見てもらう。</p>
          </div>
          <CollectionShare variant="full" />
        </section>
      )}
      {viewing !== null && (
        <ViewingRoom
          items={visibleItems}
          initialIndex={viewing}
          onClose={() => setViewing(null)}
        />
      )}
    </div>
  );
}
