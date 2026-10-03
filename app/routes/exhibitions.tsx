import { useEffect, useRef, useState } from "react";
import {
  Form,
  Link,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { getAllItems, type Item } from "../data/items";
import {
  createExhibition,
  ExhibitionValidationError,
  getExhibition,
  listExhibitions,
  setExhibitionVisibility,
  type Exhibition,
} from "../data/exhibitions";
import { requireAuth, requireAuthForAction } from "../lib/auth-guard";
import { usePwaReloadGuard } from "../hooks/usePwaUpdates";
import { Artwork } from "../components/gallery/Artwork";
import { Icon } from "../components/gallery/Icon";
import { ShareButton } from "../components/gallery/ShareButton";
import "../components/gallery/exhibitions.css";

interface LoaderData {
  items: Item[];
  exhibitions: Exhibition[];
  origin: string;
  savedId: string | null;
}

export const meta = () => [
  { title: "小さな展示室 — TENUGUI" },
  { name: "robots", content: "noindex" },
];

export async function loader({ request, context }: LoaderFunctionArgs) {
  await requireAuth(request, context);
  const kv = context.cloudflare.env.TENUGUI_KV;
  const url = new URL(request.url);
  const [items, exhibitions] = await Promise.all([
    getAllItems(kv),
    listExhibitions(kv),
  ]);
  const savedId = url.searchParams.get("saved");
  // A just-created record may not yet appear in KV's eventually consistent list.
  if (savedId && !exhibitions.some((exhibition) => exhibition.id === savedId)) {
    const saved = await getExhibition(kv, savedId);
    if (saved) exhibitions.unshift(saved);
  }
  return Response.json(
    { items, exhibitions, origin: url.origin, savedId } satisfies LoaderData,
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function action({ request, context }: ActionFunctionArgs) {
  await requireAuthForAction(request, context);
  const kv = context.cloudflare.env.TENUGUI_KV;
  const form = await request.formData();
  if (form.get("intent") === "visibility") {
    const id = String(form.get("exhibitionId") ?? "");
    const value = form.get("public");
    if (value !== "true" && value !== "false")
      return Response.json(
        { error: "公開設定を確認してください。" },
        { status: 400 },
      );
    const exhibition = await setExhibitionVisibility(kv, id, value === "true");
    if (!exhibition)
      return Response.json(
        { error: "展示が見つかりません。ページを更新してください。" },
        { status: 404 },
      );
    return redirect("/exhibitions");
  }
  if (form.get("intent") !== "create")
    return Response.json(
      { error: "操作を確認してください。" },
      { status: 400 },
    );
  try {
    const exhibition = await createExhibition(
      kv,
      {
        title: String(form.get("title") ?? ""),
        description: String(form.get("description") ?? ""),
        itemIds: form.getAll("itemIds").map(String),
        public: form.get("public") === "true",
      },
      await getAllItems(kv),
    );
    return redirect(`/exhibitions?saved=${exhibition.id}#my-exhibitions`);
  } catch (error) {
    if (!(error instanceof ExhibitionValidationError)) throw error;
    return Response.json({ error: error.message }, { status: 400 });
  }
}

export default function Exhibitions() {
  const { items, exhibitions, origin, savedId } = useLoaderData() as LoaderData;
  const result = useActionData() as { error?: string } | undefined;
  const navigation = useNavigation();
  const [selected, setSelected] = useState(new Set<string>());
  const [isPublic, setIsPublic] = useState(false);
  const [hasTextDraft, setHasTextDraft] = useState(false);
  const createForm = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!savedId) return;
    createForm.current?.reset();
    setSelected(new Set());
    setIsPublic(false);
    setHasTextDraft(false);
  }, [savedId]);
  const saving = navigation.state !== "idle";
  usePwaReloadGuard(saving || selected.size > 0 || isPublic || hasTextDraft);
  const itemMap = new Map(items.map((item) => [item.id, item]));
  const selectedItems = [...selected].flatMap((id) => {
    const item = itemMap.get(id);
    return item ? [item] : [];
  });
  const savedExhibition = exhibitions.find(
    (exhibition) => exhibition.id === savedId,
  );

  function select(id: string, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function move(id: string, direction: -1 | 1) {
    setSelected((current) => {
      const order = [...current];
      const position = order.indexOf(id);
      const destination = position + direction;
      if (position < 0 || destination < 0 || destination >= order.length)
        return current;
      [order[position], order[destination]] = [
        order[destination],
        order[position],
      ];
      return new Set(order);
    });
  }

  return (
    <div className="exhibitions-page">
      <header className="exhibitions-intro">
        <span className="exhibition-eyebrow">YOUR LITTLE GALLERY</span>
        <h1>小さな展示室</h1>
        <p>
          好きな一枚を、好きな並びで。
          <br />
          あなたの世界を、誰かにも。
        </p>
      </header>

      <section
        className="exhibition-create"
        aria-labelledby="create-exhibition-title"
      >
        <div className="exhibition-section-heading">
          <div>
            <span className="exhibition-eyebrow">CURATE A MOMENT</span>
            <h2 id="create-exhibition-title">いまの気分で、飾ってみる。</h2>
          </div>
          <Icon name="leaf" size={24} />
        </div>
        {items.length ? (
          <Form
            method="post"
            data-pwa-managed-form
            className="exhibition-form"
            ref={createForm}
            onChange={(event) => {
              const form = new FormData(event.currentTarget);
              setHasTextDraft(
                Boolean(form.get("title") || form.get("description")),
              );
            }}
          >
            <input type="hidden" name="intent" value="create" />
            {[...selected].map((id) => (
              <input key={id} type="hidden" name="itemIds" value={id} />
            ))}
            <div className="exhibition-form-fields">
              <label className="exhibition-field">
                <span>展示の名前</span>
                <input
                  name="title"
                  placeholder="たとえば、藍を愛でる日"
                  maxLength={80}
                  required
                />
              </label>
              <label className="exhibition-field">
                <span>
                  ひとこと紹介 <small>任意</small>
                </span>
                <textarea
                  name="description"
                  placeholder="この組み合わせが好きな理由や、季節のこと。"
                  maxLength={280}
                  rows={3}
                />
              </label>
            </div>
            <fieldset className="exhibition-selection">
              <legend>
                飾りたい手ぬぐい <span>{selected.size}枚選択中</span>
              </legend>
              <div className="exhibition-selection-grid">
                {items.map((item) => (
                  <label
                    className={`exhibition-select-item ${selected.has(item.id) ? "is-selected" : ""}`}
                    key={item.id}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(item.id)}
                      onChange={(event) =>
                        select(item.id, event.currentTarget.checked)
                      }
                    />
                    <div className="exhibition-select-art">
                      <Artwork item={item} />
                      <span
                        className="exhibition-selection-check"
                        aria-hidden="true"
                      >
                        <Icon name="check" size={14} />
                      </span>
                    </div>
                    <span className="exhibition-select-name">{item.name}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            {selectedItems.length > 0 && (
              <div className="exhibition-order" aria-label="展示の並び順">
                <div className="exhibition-order-heading">
                  <span>展示の並び</span>
                  <small>選んだ順に飾ります。上下で並べ替え。</small>
                </div>
                <ol className="exhibition-order-list">
                  {selectedItems.map((item, index) => (
                    <li key={item.id}>
                      <span className="exhibition-order-number">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <Artwork item={item} />
                      <span className="exhibition-order-name">{item.name}</span>
                      <div className="exhibition-order-buttons">
                        <button
                          type="button"
                          onClick={() => move(item.id, -1)}
                          disabled={index === 0}
                          aria-label={`${item.name}を上へ移動`}
                        >
                          <Icon
                            name="arrow"
                            size={15}
                            className="exhibition-order-up"
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => move(item.id, 1)}
                          disabled={index === selectedItems.length - 1}
                          aria-label={`${item.name}を下へ移動`}
                        >
                          <Icon
                            name="arrow"
                            size={15}
                            className="exhibition-order-down"
                          />
                        </button>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            <div className="exhibition-create-footer">
              <label className="exhibition-public-control">
                <input
                  type="checkbox"
                  name="public"
                  value="true"
                  checked={isPublic}
                  onChange={(event) => setIsPublic(event.currentTarget.checked)}
                />
                <span>
                  公開して、リンクから見られるようにする
                  <small>
                    {isPublic
                      ? "選んだ手ぬぐいの写真・名前・タグと、展示の紹介を共有します。"
                      : "非公開の展示は、ログインしているときだけ見られます。"}{" "}
                    思い出メモと商品リンクは展示に出ません。
                  </small>
                </span>
              </label>
              <button
                className="exhibition-button"
                type="submit"
                disabled={saving || !selected.size}
              >
                <Icon name="plus" size={16} />
                {saving ? "保存しています…" : "展示をつくる"}
              </button>
            </div>
            {result?.error && (
              <p className="exhibition-error" role="alert">
                {result.error}
              </p>
            )}
          </Form>
        ) : (
          <div className="exhibition-empty">
            <p>まずは、お気に入りの一枚を。</p>
            <Link to="/items/new" className="exhibition-button">
              手ぬぐいを迎える
              <Icon name="arrow" size={16} />
            </Link>
          </div>
        )}
      </section>

      <section
        className="exhibition-saved"
        id="my-exhibitions"
        aria-labelledby="saved-exhibitions-title"
      >
        <div className="exhibition-section-heading">
          <div>
            <span className="exhibition-eyebrow">COLLECTED MOMENTS</span>
            <h2 id="saved-exhibitions-title">わたしの展示</h2>
          </div>
          <span className="exhibition-count">
            {exhibitions.length} exhibitions
          </span>
        </div>
        {savedExhibition && (
          <p className="exhibition-saved-message" role="status">
            <Icon name="check" size={16} />
            {savedExhibition.public
              ? "展示ができました。リンクからシェアできます。"
              : "展示ができました。公開すると、リンクをシェアできます。"}
          </p>
        )}
        {exhibitions.length ? (
          <div className="exhibition-list">
            {exhibitions.map((exhibition) => {
              const preview = exhibition.itemIds
                .flatMap((id) => {
                  const item = itemMap.get(id);
                  return item ? [item] : [];
                })
                .slice(0, 3);
              return (
                <article className="exhibition-card" key={exhibition.id}>
                  <Link
                    to={`/exhibitions/${exhibition.id}`}
                    className="exhibition-card-preview"
                    aria-label={`展示「${exhibition.title}」を見る`}
                  >
                    {preview.map((item) => (
                      <Artwork item={item} key={item.id} />
                    ))}
                    {!preview.length && <Icon name="image" size={28} />}
                  </Link>
                  <div className="exhibition-card-body">
                    <div className="exhibition-card-top">
                      <span
                        className={`exhibition-visibility ${exhibition.public ? "is-public" : ""}`}
                      >
                        <Icon name="eye" size={13} />
                        {exhibition.public ? "公開中" : "非公開"}
                      </span>
                      <span>
                        {
                          exhibition.itemIds.filter((id) => itemMap.has(id))
                            .length
                        }
                        枚
                      </span>
                    </div>
                    <h3>
                      <Link to={`/exhibitions/${exhibition.id}`}>
                        {exhibition.title}
                      </Link>
                    </h3>
                    {exhibition.description && <p>{exhibition.description}</p>}
                    <div className="exhibition-card-actions">
                      {exhibition.public && (
                        <ShareButton
                          title={exhibition.title}
                          url={`${origin}/exhibitions/${exhibition.id}`}
                        />
                      )}
                      <Form method="post" data-pwa-managed-form>
                        <input type="hidden" name="intent" value="visibility" />
                        <input
                          type="hidden"
                          name="exhibitionId"
                          value={exhibition.id}
                        />
                        <input
                          type="hidden"
                          name="public"
                          value={String(!exhibition.public)}
                        />
                        <button
                          className="exhibition-text-button"
                          disabled={saving}
                        >
                          {exhibition.public ? "公開を停止" : "公開する"}
                        </button>
                      </Form>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="exhibition-empty exhibition-empty-subtle">
            <Icon name="grid" size={28} />
            <p>まだ、展示はありません。</p>
            <span>
              季節で選んだり、色で集めたり。
              <br />
              あなただけの組み合わせを楽しんで。
            </span>
          </div>
        )}
      </section>
    </div>
  );
}
