import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  Form,
  Link,
  useActionData,
  useBeforeUnload,
  useBlocker,
  useNavigation,
} from "react-router";
import type { Item } from "../../data/items";
import { Icon } from "../gallery/Icon";
import {
  isHttpUrl,
  isValidImageUrl,
  type ItemFormActionData,
  type ItemFormValues,
} from "../../lib/formUtils";
import "./item-pages.css";

interface ItemFormProps {
  existingTags: string[];
  initialItem?: Item;
  submitLabel: string;
  title: string;
  cancelUrl?: string;
  initialProductUrl?: string;
}

type SourceMode = "photo" | "image" | "product";

/** Resize locally, preserving the full pattern and removing camera metadata. */
async function preparePhoto(file: File): Promise<Blob> {
  if (file.size > 30 * 1024 * 1024)
    throw new Error("写真が大きすぎます。30MB以下の写真を選んでください。");
  if (
    file.type === "image/svg+xml" ||
    (file.type && !file.type.startsWith("image/"))
  ) {
    throw new Error("JPEG、PNG、WebPなどの写真を選んでください。");
  }
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = objectUrl;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () =>
        reject(
          new Error(
            "この写真を読み込めませんでした。JPEGやPNGの写真を選んでください。",
          ),
        );
    });
    if (!image.naturalWidth || !image.naturalHeight)
      throw new Error("写真を読み込めませんでした。");
    let ratio = Math.min(
      1,
      1600 / Math.max(image.naturalWidth, image.naturalHeight),
    );
    const canvas = document.createElement("canvas");
    const draw = () => {
      canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
      const ctx = canvas.getContext("2d");
      if (!ctx)
        throw new Error(
          "写真の処理に失敗しました。画像URLからの登録もお試しください。",
        );
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    };
    draw();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const quality = Math.max(0.5, 0.88 - attempt * 0.1);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/webp", quality),
      );
      if (!blob)
        throw new Error(
          "写真を用意できませんでした。別の写真をお試しください。",
        );
      if (blob.size <= 2 * 1024 * 1024) return blob;
      if (attempt >= 2) {
        ratio *= 0.8;
        draw();
      }
    }
    throw new Error("写真を小さくできませんでした。別の写真を選んでください。");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function ItemForm({
  existingTags,
  initialItem,
  submitLabel,
  title,
  cancelUrl = "/",
  initialProductUrl,
}: ItemFormProps) {
  const actionData = useActionData<ItemFormActionData>();
  const navigation = useNavigation();
  const values = actionData?.values;
  const [mode, setMode] = useState<SourceMode>(
    initialProductUrl ? "product" : "photo",
  );
  const [name, setName] = useState(values?.name ?? initialItem?.name ?? "");
  const [imageUrl, setImageUrl] = useState(
    values?.imageUrl ?? initialItem?.imageUrl ?? "",
  );
  const [productUrl, setProductUrl] = useState(
    values?.productUrl ?? initialProductUrl ?? initialItem?.productUrl ?? "",
  );
  const [memo, setMemo] = useState(values?.memo ?? initialItem?.memo ?? "");
  const [status, setStatus] = useState(
    values?.status ?? initialItem?.status ?? "purchased",
  );
  const [tags, setTags] = useState<string[]>(
    values?.tags
      .split(/[,、\n]/u)
      .map((tag) => tag.trim())
      .filter(Boolean) ??
      initialItem?.tags ??
      [],
  );
  const [tagInput, setTagInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [message, setMessage] = useState("");
  const [localError, setLocalError] = useState("");
  const [corrections, setCorrections] = useState<{
    action: ItemFormActionData | undefined;
    fields: (keyof ItemFormValues)[];
  }>({ action: actionData, fields: [] });
  const [candidateImages, setCandidateImages] = useState<string[]>([]);
  const [imageFailed, setImageFailed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const errorSummary = useRef<HTMLDivElement>(null);
  const savedValues = useRef({
    name: initialItem?.name ?? "",
    imageUrl: initialItem?.imageUrl ?? "",
    productUrl: initialProductUrl ?? initialItem?.productUrl ?? "",
    memo: initialItem?.memo ?? "",
    status: initialItem?.status ?? "purchased",
    tags: [...new Set(initialItem?.tags ?? [])].join(", "),
  });
  const submitting = navigation.state !== "idle";
  const submittingForm =
    submitting && navigation.formMethod?.toLowerCase() === "post";
  const busy = uploading || analyzing || submitting;
  // Corrections apply only to the result that was visible when editing. A new
  // submission automatically makes all of its new validation errors visible.
  const correctedFields =
    corrections.action === actionData ? corrections.fields : [];
  const fields = { ...actionData?.fieldErrors };
  for (const field of correctedFields) delete fields[field];
  const serverError = Object.keys(actionData?.fieldErrors || {}).length
    ? Object.values(fields).find(Boolean)
    : correctedFields.length
      ? undefined
      : actionData?.error;
  const hasImage = isValidImageUrl(imageUrl.trim()) && !imageFailed;
  const error = localError || serverError;
  const submittedTags = [
    ...new Set([
      ...tags,
      ...tagInput
        .split(/[,、\n]/u)
        .map((tag) => tag.trim())
        .filter(Boolean),
    ]),
  ];
  const unsaved =
    uploading ||
    analyzing ||
    name !== savedValues.current.name ||
    imageUrl !== savedValues.current.imageUrl ||
    productUrl !== savedValues.current.productUrl ||
    memo !== savedValues.current.memo ||
    status !== savedValues.current.status ||
    submittedTags.join(", ") !== savedValues.current.tags;
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      unsaved &&
      !submittingForm &&
      (currentLocation.pathname !== nextLocation.pathname ||
        currentLocation.search !== nextLocation.search),
  );
  useBeforeUnload((event) => {
    if (unsaved && !submittingForm) event.preventDefault();
  });

  useEffect(() => {
    if (blocker.state !== "blocked") return;
    if (
      window.confirm(
        "まだ保存していない記録があります。保存せずに移動しますか？",
      )
    )
      blocker.proceed();
    else blocker.reset();
  }, [blocker]);

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);
  useEffect(() => {
    if (actionData?.error) errorSummary.current?.focus();
  }, [actionData]);

  const correctField = (field: keyof ItemFormValues) => {
    setCorrections((previous) => ({
      action: actionData,
      fields: [
        ...new Set([
          ...(previous.action === actionData ? previous.fields : []),
          field,
        ]),
      ],
    }));
    setLocalError("");
    setMessage("");
  };

  const addTags = () => {
    correctField("tags");
    const added = tagInput
      .split(/[,、\n]/u)
      .map((tag) => tag.trim())
      .filter(Boolean);
    setTags((previous) => [...new Set([...previous, ...added])]);
    setTagInput("");
  };

  const toggleTag = (tag: string) => {
    correctField("tags");
    setTags((previous) =>
      previous.includes(tag)
        ? previous.filter((value) => value !== tag)
        : [...previous, tag],
    );
  };

  const uploadPhoto = async (file?: File) => {
    if (!file || busy) return;
    setUploading(true);
    setLocalError("");
    setMessage("写真を用意しています…");
    try {
      const photo = await preparePhoto(file);
      const body = new FormData();
      body.append(
        "image",
        photo,
        photo.type === "image/webp" ? "tenugui.webp" : "tenugui.png",
      );
      const response = await fetch("/api/images", { method: "POST", body });
      if (response.status === 401)
        throw new Error(
          "ログインの有効期限が切れました。ログインしてから、もう一度お試しください。",
        );
      const result = (await response.json()) as {
        imageUrl?: string;
        error?: string;
      };
      if (!response.ok || !result.imageUrl)
        throw new Error(
          result.error ||
            "写真を保存できませんでした。もう一度お試しください。",
        );
      correctField("imageUrl");
      setImageUrl(result.imageUrl);
      setCandidateImages([]);
      setMessage("写真を用意できました。名前や思い出は、あとからでも。");
    } catch (error) {
      setMessage("");
      setLocalError(
        error instanceof Error
          ? error.message
          : "写真を保存できませんでした。もう一度お試しください。",
      );
    } finally {
      setUploading(false);
    }
  };

  const selectPhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    void uploadPhoto(file);
  };

  const analyzeProduct = async () => {
    if (!isHttpUrl(productUrl.trim())) {
      setLocalError(
        "商品ページには http または https で始まるURLを入力してください。",
      );
      return;
    }
    setAnalyzing(true);
    setMessage("");
    setLocalError("");
    try {
      const response = await fetch("/api/product-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productUrl: productUrl.trim() }),
      });
      if (response.status === 401)
        throw new Error(
          "ログインの有効期限が切れました。ログインしてから、もう一度お試しください。",
        );
      if (!response.ok)
        throw new Error(
          "このページから情報を読み込めませんでした。写真か画像URLでも登録できます。",
        );
      const result = (await response.json()) as {
        name?: string;
        imageUrls?: string[];
      };
      if (result.name && !name.trim()) {
        correctField("name");
        setName(result.name);
      }
      const images = (result.imageUrls || []).filter(isValidImageUrl);
      setCandidateImages(images);
      if (images.length) {
        correctField("imageUrl");
        setImageUrl(images[0]);
        setMessage(
          images.length > 1
            ? "写真の候補を見つけました。お気に入りの一枚を選んでください。"
            : "商品情報を読み込みました。あなたの言葉で、名前を付けても。",
        );
      } else {
        setMessage(
          "名前を読み込みました。写真を選ぶか、画像URLを追加してください。",
        );
      }
    } catch (error) {
      setLocalError(
        error instanceof Error
          ? error.message
          : "商品情報を読み込めませんでした。",
      );
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="item-page">
      <Link to={cancelUrl} className="item-back">
        <Icon name="arrow" size={16} />
        {initialItem ? "一枚の記録に戻る" : "コレクションに戻る"}
      </Link>
      <header className="item-page-heading">
        <span className="item-eyebrow">
          {initialItem ? "A LITTLE RECORD" : "A NEW PIECE"}
        </span>
        <h1>{title}</h1>
        <p>
          {initialItem
            ? "名前も、思い出も。あなたらしい言葉で。"
            : "心に残った柄を、あなたの棚へ。写真だけでも、仲間入り。"}
        </p>
      </header>

      <Form
        method="post"
        className="item-form-layout"
        noValidate
        aria-busy={busy}
        onSubmit={() => {
          setLocalError("");
          setMessage("");
        }}
      >
        <aside className="item-form-preview">
          <div className="item-photo-mat">
            {hasImage ? (
              <img
                src={imageUrl.trim()}
                alt={name || "新しいてぬぐいの写真"}
                className="item-photo-preview"
                onError={() => setImageFailed(true)}
              />
            ) : (
              <div className="item-photo-empty">
                <Icon name="image" size={44} />
                <p>
                  {imageFailed
                    ? "写真を表示できませんでした"
                    : "ここに、次の一枚を。"}
                </p>
                <span>
                  {imageFailed
                    ? "画像のURLや公開設定を確認してください。"
                    : "柄の全体が見える写真がおすすめです。"}
                </span>
              </div>
            )}
          </div>
          <p className="item-preview-caption">
            <Icon name="leaf" size={14} />
            一枚ずつ、好きが重なっていく。
          </p>
        </aside>

        <fieldset
          className="item-form-fields"
          disabled={submittingForm}
          style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
        >
          {error && (
            <div
              className="item-alert"
              role="alert"
              tabIndex={-1}
              ref={errorSummary}
            >
              {error}
            </div>
          )}
          <section
            className="item-form-section"
            aria-labelledby="photo-heading"
          >
            <div className="item-section-heading">
              <span>01</span>
              <h2 id="photo-heading">一枚を選ぶ</h2>
            </div>
            <div className="item-source-switch" aria-label="写真の追加方法">
              {(
                [
                  ["photo", "写真から"],
                  ["image", "画像URLから"],
                  ["product", "お店のページから"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={mode === value}
                  className={mode === value ? "is-active" : ""}
                  onClick={() => {
                    setMode(value);
                    setLocalError("");
                  }}
                  disabled={busy}
                >
                  {label}
                </button>
              ))}
            </div>

            {mode === "photo" && (
              <div
                className={
                  "item-upload-zone" + (dragging ? " is-dragging" : "")
                }
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  void uploadPhoto(event.dataTransfer.files[0]);
                }}
              >
                <Icon name="upload" size={28} />
                <p>お気に入りの柄を、そのまま。</p>
                <span>写真を選ぶか、ここにドラッグしてください</span>
                <div className="item-upload-actions">
                  <button
                    type="button"
                    className="item-button"
                    disabled={busy}
                    onClick={() => photoInput.current?.click()}
                  >
                    {uploading
                      ? "写真を用意しています…"
                      : hasImage
                        ? "写真を変更する"
                        : "写真を選ぶ"}
                  </button>
                  <button
                    type="button"
                    className="item-button item-button-quiet"
                    disabled={busy}
                    onClick={() => cameraInput.current?.click()}
                  >
                    撮影する
                  </button>
                </div>
                <input
                  ref={photoInput}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={selectPhoto}
                />
                <input
                  ref={cameraInput}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  hidden
                  onChange={selectPhoto}
                />
                <small>写真は見やすいサイズに整えて保存します。</small>
              </div>
            )}

            {mode === "image" && (
              <div className="item-field">
                <label htmlFor="image-address">画像のURL</label>
                <input
                  id="image-address"
                  type="url"
                  inputMode="url"
                  value={imageUrl}
                  onChange={(event) => {
                    correctField("imageUrl");
                    setImageUrl(event.target.value);
                  }}
                  placeholder="https://..."
                  aria-invalid={!!fields.imageUrl}
                  aria-describedby={
                    fields.imageUrl ? "image-error" : "image-hint"
                  }
                  autoComplete="off"
                />
                <small id="image-hint">
                  画像そのものを開いたときのURLを貼り付けてください。
                </small>
              </div>
            )}

            {mode === "product" && (
              <div className="item-field">
                <label htmlFor="product-address">商品ページのURL</label>
                <div className="item-input-action">
                  <input
                    id="product-address"
                    type="url"
                    inputMode="url"
                    value={productUrl}
                    onChange={(event) => {
                      correctField("productUrl");
                      setProductUrl(event.target.value);
                    }}
                    placeholder="https://..."
                    aria-invalid={!!fields.productUrl}
                    aria-describedby={
                      fields.productUrl ? "product-error" : "product-hint"
                    }
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    className="item-button"
                    onClick={analyzeProduct}
                    disabled={busy || !productUrl.trim()}
                  >
                    {analyzing ? "読み込み中…" : "情報を読み込む"}
                  </button>
                </div>
                <small id="product-hint">
                  名前と写真を探します。読み込んだ内容は自由に変えられます。
                </small>
                {fields.productUrl && (
                  <p className="item-field-error" id="product-error">
                    {fields.productUrl}
                  </p>
                )}
              </div>
            )}
            {candidateImages.length > 1 && (
              <div className="item-candidates" aria-label="写真の候補">
                {candidateImages.map((url, index) => (
                  <button
                    key={url}
                    type="button"
                    className={imageUrl === url ? "is-selected" : ""}
                    aria-pressed={imageUrl === url}
                    aria-label={`写真の候補 ${index + 1}`}
                    onClick={() => {
                      correctField("imageUrl");
                      setImageUrl(url);
                    }}
                  >
                    <img src={url} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
            {fields.imageUrl && (
              <p className="item-field-error" id="image-error">
                {fields.imageUrl}
              </p>
            )}
            {message && (
              <p className="item-success" role="status">
                <Icon name="check" size={16} />
                {message}
              </p>
            )}
          </section>

          <section
            className="item-form-section"
            aria-labelledby="record-heading"
          >
            <div className="item-section-heading">
              <span>02</span>
              <h2 id="record-heading">
                記録を添える<small>あとからでも</small>
              </h2>
            </div>
            <div className="item-field">
              <label htmlFor="name">
                この一枚の名前<span>任意</span>
              </label>
              <input
                id="name"
                name="name"
                value={name}
                onChange={(event) => {
                  correctField("name");
                  setName(event.target.value);
                }}
                placeholder="例：春を待つ、桜の一枚"
                maxLength={200}
                aria-invalid={!!fields.name}
                aria-describedby={fields.name ? "name-error" : "name-hint"}
              />
              <small id="name-hint">
                空欄のままなら「名もなき一枚」として保存します。
              </small>
              {fields.name && (
                <p className="item-field-error" id="name-error">
                  {fields.name}
                </p>
              )}
            </div>

            <fieldset className="item-status-field">
              <legend>この一枚は</legend>
              <label className={status === "purchased" ? "is-selected" : ""}>
                <input
                  type="radio"
                  name="status"
                  value="purchased"
                  checked={status === "purchased"}
                  onChange={() => {
                    correctField("status");
                    setStatus("purchased");
                  }}
                />
                <Icon name="check" size={16} />
                <span>手元にある</span>
              </label>
              <label className={status === "unpurchased" ? "is-selected" : ""}>
                <input
                  type="radio"
                  name="status"
                  value="unpurchased"
                  checked={status === "unpurchased"}
                  onChange={() => {
                    correctField("status");
                    setStatus("unpurchased");
                  }}
                />
                <Icon name="eye" size={16} />
                <span>気になる</span>
              </label>
            </fieldset>

            <div className="item-field">
              <label htmlFor="new-tags">
                タグ<span>任意</span>
              </label>
              <div className="item-input-action">
                <input
                  id="new-tags"
                  value={tagInput}
                  onChange={(event) => {
                    correctField("tags");
                    setTagInput(event.target.value);
                  }}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !event.nativeEvent.isComposing
                    ) {
                      event.preventDefault();
                      addTags();
                    }
                  }}
                  placeholder="桜、旅の思い出、青…"
                  maxLength={500}
                  aria-describedby={fields.tags ? "tags-error" : "tags-hint"}
                />
                <button
                  type="button"
                  className="item-button item-button-quiet"
                  onClick={addTags}
                  disabled={!tagInput.trim()}
                >
                  追加
                </button>
              </div>
              <small id="tags-hint">
                季節や色、思い出。好きな言葉でつながります。
              </small>
              {tags.length > 0 && (
                <div className="item-tag-options">
                  {tags.map((tag) => (
                    <button
                      type="button"
                      className="is-selected"
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      aria-label={`${tag} を外す`}
                    >
                      {tag}
                      <Icon name="close" size={12} />
                    </button>
                  ))}
                </div>
              )}
              {existingTags.filter((tag) => !tags.includes(tag)).length > 0 && (
                <div className="item-existing-tags">
                  <span>これまでのタグ</span>
                  <div className="item-tag-options">
                    {existingTags
                      .filter((tag) => !tags.includes(tag))
                      .slice(0, 15)
                      .map((tag) => (
                        <button
                          type="button"
                          key={tag}
                          onClick={() => toggleTag(tag)}
                        >
                          {tag}
                          <Icon name="plus" size={12} />
                        </button>
                      ))}
                  </div>
                </div>
              )}
              {fields.tags && (
                <p className="item-field-error" id="tags-error">
                  {fields.tags}
                </p>
              )}
            </div>

            <div className="item-field">
              <label htmlFor="memo">
                思い出・ひとこと<span>任意</span>
              </label>
              <textarea
                id="memo"
                name="memo"
                rows={4}
                value={memo}
                onChange={(event) => {
                  correctField("memo");
                  setMemo(event.target.value);
                }}
                placeholder="出会った場所、好きなところ。この柄を見ると思い出すこと。"
                maxLength={10000}
                aria-invalid={!!fields.memo}
                aria-describedby={fields.memo ? "memo-error" : undefined}
              />
              {fields.memo && (
                <p className="item-field-error" id="memo-error">
                  {fields.memo}
                </p>
              )}
            </div>

            {mode !== "product" && (
              <details
                className="item-product-optional"
                open={!!fields.productUrl || undefined}
              >
                <summary>
                  見つけたお店のURLを添える<span>任意</span>
                </summary>
                <div className="item-field">
                  <label htmlFor="product-extra" className="sr-only">
                    商品ページのURL
                  </label>
                  <input
                    id="product-extra"
                    type="url"
                    inputMode="url"
                    value={productUrl}
                    onChange={(event) => {
                      correctField("productUrl");
                      setProductUrl(event.target.value);
                    }}
                    placeholder="https://..."
                    aria-invalid={!!fields.productUrl}
                  />
                  {fields.productUrl && (
                    <p className="item-field-error">{fields.productUrl}</p>
                  )}
                </div>
              </details>
            )}
          </section>

          <input type="hidden" name="imageUrl" value={imageUrl} />
          <input type="hidden" name="productUrl" value={productUrl} />
          <input type="hidden" name="tags" value={submittedTags.join(", ")} />
          <div className="item-form-submit">
            <button
              type="submit"
              className="item-button item-button-primary"
              disabled={busy}
            >
              <Icon name={submittingForm ? "leaf" : "check"} size={17} />
              {submittingForm ? "保存しています…" : submitLabel}
            </button>
            <Link to={cancelUrl} className="item-button item-button-quiet">
              キャンセル
            </Link>
          </div>
        </fieldset>
      </Form>
    </div>
  );
}
