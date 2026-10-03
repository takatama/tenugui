import { useMemo, useState } from "react";
import {
  Link,
  useLoaderData,
  useSearchParams,
  type LoaderFunctionArgs,
} from "react-router";
import { getItems, type Item } from "../data/items";
import { Artwork } from "../components/gallery/Artwork";
import { Icon } from "../components/gallery/Icon";
import { ViewingRoom } from "../components/gallery/ViewingRoom";
import { useFavorites } from "../hooks/useFavorites";
export function meta() {
  return [
    { title: "手ぬぐい帖 — 好きな一枚が、私の世界になる。" },
    {
      name: "description",
      content:
        "心にとまった一枚を集め、ゆっくり眺める。手ぬぐいと、日々をつづる小さな美術館。",
    },
  ];
}
export async function loader({ context }: LoaderFunctionArgs) {
  const kv = context.cloudflare.env.TENUGUI_KV;
  const result = await getItems(kv);
  const isDemo =
    import.meta.env.DEV &&
    (result.items.some((item) => item.id.startsWith("demo-")) ||
      (await kv.get("items")) === null);
  return Response.json(
    { ...result, isDemo },
    { headers: { "Cache-Control": "no-store" } },
  );
}
interface LoaderData {
  items: Item[];
  allTags: string[];
  totalCount: number;
  isDemo: boolean;
}
export default function Items() {
  const { items, allTags, totalCount, isDemo } = useLoaderData<LoaderData>();
  const [params, setParams] = useSearchParams();
  const { favorites, toggleFavorite, error, storageMode } = useFavorites();
  const [sort, setSort] = useState("collection");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [viewing, setViewing] = useState<number | null>(null);
  const query = params.get("q") || "";
  const tag = params.get("tag") || "";
  const favoritesOnly = params.get("view") === "favorites";
  const status = params.get("status") || "";
  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    setParams(next, { preventScrollReset: true, replace: key === "q" });
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
      filtered.sort((a, b) => a.name.localeCompare(b.name, "ja"));
    if (sort === "oldest") filtered.reverse();
    return filtered;
  }, [items, favoritesOnly, favorites, tag, status, query, sort]);
  return (
    <div className="collection-page">
      <section className="collection-hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="tiny-line" />
            THE ART OF COLLECTING
          </div>
          <h1 id="hero-title">
            好きな一枚が、
            <br />
            私の世界になる。
          </h1>
          <p>
            ふと出会った色、心ひかれた柄。
            <br />
            てぬぐいと、日々の小さなよろこびを集める。
          </p>
          <Link className="primary-button hero-button" to="/items/new">
            <Icon name="plus" size={17} />
            新しい一枚を迎える
          </Link>
          <span className="hero-footnote">
            A little collection, a world of my own.
          </span>
        </div>
        <div className="hero-photo">
          <img
            src="/images/hero-tenugui.jpg"
            alt="木の棒に飾られた藍色のてぬぐいと、枝を活けた陶器。柔らかな陽の差す静かな空間。"
            fetchPriority="high"
          />
          <span className="hero-photo-label">暮らしに、一枚の余白を。</span>
        </div>
      </section>
      <section
        className="collection-section"
        aria-labelledby="collection-title"
      >
        <div className="section-heading">
          <div>
            <span className="eyebrow">YOUR PERSONAL GALLERY</span>
            <h2 id="collection-title">
              {favoritesOnly ? "お気に入りの一枚" : "私のコレクション"}
              <span className="collection-total">
                {favoritesOnly
                  ? items.filter((item) => favorites.includes(item.id)).length
                  : totalCount}
                <small>枚</small>
              </span>
            </h2>
          </div>
          <button
            className="outline-button"
            disabled={visibleItems.length === 0}
            onClick={() => setViewing(0)}
          >
            <Icon name="eye" size={17} />
            展示モード
            <span className="desktop-only">
              <Icon name="arrow" size={16} />
            </span>
          </button>
        </div>
        {isDemo && (
          <p className="demo-notice">
            <span>サンプルコレクション</span>
            この画面の作品はデザイン確認用です。保存先はローカル環境です。
          </p>
        )}
        <div className="collection-toolbar">
          <label className="search-field">
            <Icon name="search" size={18} />
            <input
              type="search"
              value={query}
              onChange={(event) => updateParam("q", event.target.value)}
              placeholder="名前やタグで、一枚を探す"
              aria-label="名前・タグ・思い出から検索"
            />
            <kbd className="search-hint">探す</kbd>
          </label>
          <div className="toolbar-options">
            <label className="sort-field">
              <Icon name="sliders" size={16} />
              <span className="sr-only">並び順</span>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
                <option value="collection">コレクション順</option>
                <option value="oldest">コレクション順の逆順</option>
                <option value="name">名前順</option>
              </select>
            </label>
            <div className="view-switch" aria-label="表示形式">
              <button
                className={`icon-button ${layout === "grid" ? "selected" : ""}`}
                aria-label="ギャラリー表示"
                aria-pressed={layout === "grid"}
                onClick={() => setLayout("grid")}
              >
                <Icon name="grid" size={17} />
              </button>
              <button
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
        <div className="filter-row">
          <div className="tag-filters" aria-label="タグで絞り込み">
            <button
              className={`filter-chip ${!tag ? "selected" : ""}`}
              aria-pressed={!tag}
              onClick={() => updateParam("tag", "")}
            >
              すべて<span>{items.length}</span>
            </button>
            {allTags.map((entry) => (
              <button
                key={entry}
                className={`filter-chip ${tag === entry ? "selected" : ""}`}
                aria-pressed={tag === entry}
                onClick={() => updateParam("tag", tag === entry ? "" : entry)}
              >
                {entry}
              </button>
            ))}
          </div>
          <label className="status-filter">
            <span className="sr-only">収集状況</span>
            <select
              value={status}
              onChange={(event) => updateParam("status", event.target.value)}
            >
              <option value="">すべての一枚</option>
              <option value="purchased">お迎え済み</option>
              <option value="unpurchased">気になる一枚</option>
            </select>
          </label>
        </div>
        <div className="results-caption" role="status" aria-live="polite">
          <span>
            {visibleItems.length}枚の{favoritesOnly ? "お気に入り" : "てぬぐい"}
            {tag ? ` · ${tag}` : ""}
          </span>
          <span>ひとつひとつに、出会いの物語。</span>
        </div>
        {error && (
          <p role="alert" className="inline-error">
            {error}
          </p>
        )}
        <div
          className={`collection-grid ${layout === "list" ? "collection-list" : ""}`}
        >
          {visibleItems.map((item, index) => (
            <article className="collection-card" key={item.id}>
              <div
                className={`artwork-mat mat-${items.findIndex((entry) => entry.id === item.id) % 6}`}
              >
                <Link
                  to={`/items/${item.id}`}
                  className="artwork-link"
                  aria-label={`${item.name}の詳細を開く`}
                >
                  <Artwork item={item} />
                  <span className="artwork-hover">
                    一枚の物語をひらく <Icon name="arrow" size={16} />
                  </span>
                </Link>
                <button
                  className={`favorite-button ${favorites.includes(item.id) ? "is-favorite" : ""}`}
                  aria-label={`${item.name}を${favorites.includes(item.id) ? "お気に入りから外す" : "お気に入りにする"}`}
                  aria-pressed={favorites.includes(item.id)}
                  onClick={() => toggleFavorite(item.id)}
                >
                  <Icon
                    name="heart"
                    size={18}
                    fill={favorites.includes(item.id) ? "currentColor" : "none"}
                  />
                </button>
                {item.status === "unpurchased" && (
                  <span className="wish-badge">気になる一枚</span>
                )}
              </div>
              <div className="card-copy">
                <div className="card-title-row">
                  <Link to={`/items/${item.id}`}>
                    <h3>{item.name}</h3>
                  </Link>
                  <span className="card-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <p className="card-tags">
                  {item.tags.slice(0, 3).join(" / ") || "大切なコレクション"}
                </p>
                {layout === "list" && (
                  <p className="card-memo">
                    {item.memo || "この一枚の物語を、これから。"}
                  </p>
                )}
                <button
                  className="card-view-button"
                  onClick={() => setViewing(index)}
                >
                  ゆっくり眺める <Icon name="eye" size={15} />
                </button>
              </div>
            </article>
          ))}
        </div>
        {visibleItems.length === 0 && (
          <div className="empty-collection">
            <Icon name={favoritesOnly ? "heart" : "leaf"} size={40} />
            <h3>
              {query || tag || status
                ? "その一枚は、まだ見つかりませんでした。"
                : favoritesOnly
                  ? "心ひかれた一枚に、ハートを。"
                  : "最初の一枚から、あなたの世界がはじまる。"}
            </h3>
            <p>
              {favoritesOnly
                ? storageMode === "cloud"
                  ? "お気に入りは、ログインした端末で一緒に楽しめます。"
                  : storageMode === "loading"
                    ? "お気に入りを読み込んでいます。"
                    : "お気に入りは、このブラウザに保存されます。"
                : "写真といっしょに、小さな出会いを残しましょう。"}
            </p>
            {query || tag || status ? (
              <button
                className="outline-button"
                onClick={() => {
                  const next = new URLSearchParams();
                  if (favoritesOnly) next.set("view", "favorites");
                  setParams(next);
                }}
              >
                絞り込みをリセット
              </button>
            ) : (
              <Link className="primary-button" to="/items/new">
                <Icon name="plus" size={17} />
                一枚を迎える
              </Link>
            )}
          </div>
        )}
      </section>
      <section className="collection-invitation">
        <div className="invitation-mark">
          <Icon name="book" size={30} />
        </div>
        <div>
          <span className="eyebrow">A WORLD WORTH SHARING</span>
          <h3>好きなものを並べて、私らしい展示室に。</h3>
          <p>選んだ一枚に言葉を添えて。あなたの世界へ、大切な人をご招待。</p>
        </div>
        <Link to="/exhibitions" className="text-link">
          私の展示室へ <Icon name="arrow" size={18} />
        </Link>
      </section>
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
