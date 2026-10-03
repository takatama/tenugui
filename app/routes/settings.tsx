import { useEffect, useRef, useState } from "react";
import {
  Form,
  data,
  useActionData,
  useLoaderData,
  useNavigation,
  useBlocker,
  useBeforeUnload,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { getItems, reorderItems } from "../data/items";
import {
  changeTag,
  getShelvedRecords,
  restoreShelvedRecord,
} from "../data/collection-tools";
import { requireAuth, requireAuthForAction } from "../lib/auth-guard";
import { Artwork } from "../components/gallery/Artwork";
import { Icon } from "../components/gallery/Icon";
import "../components/gallery/settings.css";

export function meta() {
  return [
    { title: "コレクションを整える — 手ぬぐい帖" },
    { name: "robots", content: "noindex" },
  ];
}
export async function loader({ request, context }: LoaderFunctionArgs) {
  await requireAuth(request, context);
  const kv = context.cloudflare.env.TENUGUI_KV;
  const [collection, shelved] = await Promise.all([
    getItems(kv),
    getShelvedRecords(kv),
  ]);
  return data(
    { ...collection, shelved },
    { headers: { "Cache-Control": "no-store" } },
  );
}
export async function action({ request, context }: ActionFunctionArgs) {
  await requireAuthForAction(request, context);
  const kv = context.cloudflare.env.TENUGUI_KV;
  const form = await request.formData();
  try {
    switch (form.get("intent")) {
      case "reorder": {
        const current = await getItems(kv);
        const ids = form.getAll("itemIds").map(String);
        const present = new Set(current.items.map((item) => item.id));
        if (
          new Set(ids).size !== present.size ||
          ids.length !== present.size ||
          ids.some((id) => !present.has(id))
        )
          return data(
            {
              error:
                "コレクションが変更されました。ページを更新して並べ直してください。",
            },
            { status: 409 },
          );
        await reorderItems(kv, ids);
        return data({ message: "好きな並びを保存しました。" });
      }
      case "rename":
      case "remove-tag": {
        const oldTag = String(form.get("oldTag") || "").trim();
        const newTag =
          form.get("intent") === "rename"
            ? String(form.get("newTag") || "").trim()
            : undefined;
        if (
          !oldTag ||
          (newTag !== undefined && (!newTag || newTag.length > 40))
        )
          return data(
            { error: "タグの名前を40文字以内で入力してください。" },
            { status: 400 },
          );
        await changeTag(kv, oldTag, newTag);
        return data({
          message: newTag
            ? `「${oldTag}」を「${newTag}」に整えました。`
            : `「${oldTag}」を外しました。写真と記録はそのままです。`,
        });
      }
      case "restore": {
        if (!(await restoreShelvedRecord(kv, String(form.get("key") || ""))))
          return data(
            { error: "戻す一枚が見つかりませんでした。" },
            { status: 404 },
          );
        return data({ message: "大切な一枚を棚に戻しました。" });
      }
      default:
        return data({ error: "操作を確認してください。" }, { status: 400 });
    }
  } catch {
    return data(
      { error: "保存できませんでした。もう一度お試しください。" },
      { status: 503 },
    );
  }
}

export default function Settings() {
  const { items, allTags, shelved } = useLoaderData<typeof loader>();
  const result = useActionData<typeof action>();
  const navigation = useNavigation();
  const [order, setOrder] = useState(items.map((item) => item.id));
  const loadedOrder = useRef(items.map((item) => item.id));
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [exportMessage, setExportMessage] = useState("");
  const saving = navigation.state !== "idle";
  const dirty = order.join(",") !== items.map((item) => item.id).join(",");
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && currentLocation.pathname !== nextLocation.pathname,
  );
  useBeforeUnload((event) => {
    if (dirty) event.preventDefault();
  });
  useEffect(() => {
    // Preserve an unfinished arrangement across tag edits/restores and merge new IDs.
    const previousLoadedOrder = loadedOrder.current;
    const nextLoadedOrder = items.map((item) => item.id);
    loadedOrder.current = nextLoadedOrder;
    setOrder((previous) => {
      if (previous.join(",") === previousLoadedOrder.join(","))
        return nextLoadedOrder;
      const available = new Set(items.map((item) => item.id));
      const retained = previous.filter((id) => available.has(id));
      return [
        ...retained,
        ...items.map((item) => item.id).filter((id) => !retained.includes(id)),
      ];
    });
  }, [items]);
  useEffect(() => {
    if (blocker.state === "blocked") {
      if (
        window.confirm(
          "並び順はまだ保存していません。変更を破棄して移動しますか？",
        )
      )
        blocker.proceed();
      else blocker.reset();
    }
  }, [blocker]);
  function move(index: number, offset: number) {
    const next = [...order];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    setOrder(next);
  }
  function exportCollection() {
    try {
      const blob = new Blob(
        [
          JSON.stringify(
            { version: 1, exportedAt: new Date().toISOString(), items },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `tenugui-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setExportMessage(
        "写真の参照URLと記録を保存しました。写真ファイル自体は含まれません。",
      );
    } catch {
      setExportMessage(
        "書き出せませんでした。ブラウザの設定をご確認ください。",
      );
    }
  }
  const itemMap = new Map(items.map((item) => [item.id, item]));
  return (
    <div className="settings-page">
      <header className="settings-intro">
        <span className="eyebrow">MAKE ROOM FOR WHAT YOU LOVE</span>
        <h1>コレクションを整える</h1>
        <p>
          好きな順に並べたり、言葉を整えたり。
          <br />
          あなたらしい棚を、少しずつ。
        </p>
      </header>
      {result && (
        <p
          className={`settings-feedback ${"error" in result ? "is-error" : ""}`}
          role={"error" in result ? "alert" : "status"}
        >
          {"error" in result ? result.error : result.message}
        </p>
      )}
      <section className="settings-panel">
        <div className="settings-panel-heading">
          <div>
            <span className="eyebrow">YOUR FAVORITE ORDER</span>
            <h2>好きな並びに</h2>
          </div>
          <span>{items.length}枚</span>
        </div>
        <p className="settings-description">
          矢印で一枚ずつ動かして、コレクションの順番を決められます。
        </p>
        <Form method="post">
          <input type="hidden" name="intent" value="reorder" />
          <ol className="settings-order-list">
            {order.map((id, index) => {
              const item = itemMap.get(id);
              return item ? (
                <li key={id}>
                  <input type="hidden" name="itemIds" value={id} />
                  <span className="settings-order-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="settings-order-art">
                    <Artwork item={item} />
                  </div>
                  <span className="settings-order-name">
                    {item.name}
                    <small>{item.tags.slice(0, 3).join(" / ")}</small>
                  </span>
                  <div className="settings-order-buttons">
                    <button
                      type="button"
                      className="icon-button"
                      disabled={saving || index === 0}
                      onClick={() => move(index, -1)}
                      aria-label={`${item.name}を前に移動`}
                    >
                      <Icon
                        name="arrow"
                        size={17}
                        style={{ transform: "rotate(-90deg)" }}
                      />
                    </button>
                    <button
                      type="button"
                      className="icon-button"
                      disabled={saving || index === order.length - 1}
                      onClick={() => move(index, 1)}
                      aria-label={`${item.name}を後に移動`}
                    >
                      <Icon
                        name="arrow"
                        size={17}
                        style={{ transform: "rotate(90deg)" }}
                      />
                    </button>
                  </div>
                </li>
              ) : null;
            })}
          </ol>
          {!items.length && (
            <p className="settings-description">
              まだ一枚もありません。新しい一枚を迎えたら、ここで並べましょう。
            </p>
          )}
          <div className="settings-panel-actions">
            <span role="status">
              {dirty ? "並び順はまだ保存していません" : "今の並び順です"}
            </span>
            <button className="primary-button" disabled={saving || !dirty}>
              <Icon name="check" size={16} />
              {saving ? "保存しています…" : "並びを保存"}
            </button>
          </div>
        </Form>
      </section>
      <section className="settings-panel">
        <div className="settings-panel-heading">
          <div>
            <span className="eyebrow">WORDS FOR YOUR COLLECTION</span>
            <h2>タグを整える</h2>
          </div>
          <Icon name="leaf" size={22} />
        </div>
        <div className="settings-tags">
          {allTags.map((tag) => (
            <div className="settings-tag-row" key={tag}>
              {editingTag === tag ? (
                <Form
                  method="post"
                  onSubmit={() => setEditingTag(null)}
                  className="settings-tag-edit"
                >
                  <input type="hidden" name="intent" value="rename" />
                  <input type="hidden" name="oldTag" value={tag} />
                  <label>
                    <span className="sr-only">「{tag}」の新しい名前</span>
                    <input
                      name="newTag"
                      defaultValue={tag}
                      maxLength={40}
                      required
                      autoFocus
                    />
                  </label>
                  <button className="text-link" disabled={saving}>
                    保存
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => setEditingTag(null)}
                    aria-label="名前の変更をやめる"
                  >
                    <Icon name="close" size={16} />
                  </button>
                </Form>
              ) : (
                <>
                  <span>
                    {tag}
                    <small>
                      {items.filter((item) => item.tags.includes(tag)).length}枚
                    </small>
                  </span>
                  <button
                    className="icon-button"
                    aria-label={`${tag}の名前を変える`}
                    onClick={() => setEditingTag(tag)}
                  >
                    <Icon name="edit" size={15} />
                  </button>
                  <Form
                    method="post"
                    onSubmit={(event) => {
                      if (
                        !window.confirm(
                          `「${tag}」をすべての一枚から外しますか？写真と記録はそのまま残ります。`,
                        )
                      )
                        event.preventDefault();
                    }}
                  >
                    <input type="hidden" name="intent" value="remove-tag" />
                    <input type="hidden" name="oldTag" value={tag} />
                    <button
                      className="icon-button"
                      aria-label={`${tag}を外す`}
                      disabled={saving}
                    >
                      <Icon name="close" size={15} />
                    </button>
                  </Form>
                </>
              )}
            </div>
          ))}
        </div>
        {!allTags.length && (
          <p className="settings-description">
            一枚の記録から、好きな言葉をタグにできます。
          </p>
        )}
      </section>
      <section className="settings-panel">
        <div className="settings-panel-heading">
          <div>
            <span className="eyebrow">KEEP YOUR MEMORIES SAFE</span>
            <h2>大切な記録を手元に</h2>
          </div>
          <Icon name="download" size={22} />
        </div>
        <p className="settings-description">
          名前・タグ・思い出と写真の参照URLを、JSONファイルに書き出します。写真ファイル自体は含まれません。
        </p>
        <button className="outline-button" onClick={exportCollection}>
          <Icon name="download" size={17} />
          コレクションを書き出す
        </button>
        {exportMessage && (
          <p className="settings-description" role="status">
            {exportMessage}
          </p>
        )}
      </section>
      <section className="settings-panel">
        <div className="settings-panel-heading">
          <div>
            <span className="eyebrow">A PLACE TO RETURN</span>
            <h2>棚から外した一枚</h2>
          </div>
          <span>{shelved.length}枚</span>
        </div>
        <p className="settings-description">
          ここから、写真と記録をそのまま棚に戻せます。
        </p>
        {shelved.length ? (
          <div className="settings-shelved">
            {shelved.map((record) => (
              <div className="settings-shelved-row" key={record.key}>
                <div className="settings-order-art">
                  <Artwork item={record.item} />
                </div>
                <span>{record.item.name}</span>
                <Form method="post">
                  <input type="hidden" name="intent" value="restore" />
                  <input type="hidden" name="key" value={record.key} />
                  <button className="outline-button" disabled={saving}>
                    <Icon name="plus" size={15} />
                    棚に戻す
                  </button>
                </Form>
              </div>
            ))}
          </div>
        ) : (
          <p className="settings-description">棚から外した一枚はありません。</p>
        )}
      </section>
    </div>
  );
}
