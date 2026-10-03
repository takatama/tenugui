import type { ItemStatus } from "../types/status";
import { DEFAULT_STATUS } from "../types/status";

export interface ParsedFormData {
  name: string;
  imageUrl: string;
  productUrl?: string;
  tags: string[];
  memo: string;
  status: ItemStatus;
}

export interface ItemFormValues {
  name: string;
  imageUrl: string;
  productUrl: string;
  tags: string;
  memo: string;
  status: string;
}

export interface ItemFormActionData {
  error: string;
  fieldErrors?: Partial<Record<keyof ItemFormValues, string>>;
  values?: ItemFormValues;
}

export class FormValidationError extends Error {
  constructor(
    public readonly values: ItemFormValues,
    public readonly fieldErrors: NonNullable<ItemFormActionData["fieldErrors"]>,
  ) {
    super(Object.values(fieldErrors)[0] || "入力内容を確認してください。");
    this.name = "FormValidationError";
  }
}

export function isHttpUrl(value: string): boolean {
  try {
    if (!/^https?:\/\//i.test(value)) return false;
    if (/\s|[\\\u0000-\u001f\u007f]/u.test(value)) return false;
    const url = new URL(value);
    return (
      (url.protocol === "https:" || url.protocol === "http:") &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

/** Only uploaded/static image paths or complete HTTP(S) addresses may be rendered. */
export function isValidImageUrl(value: string): boolean {
  return (
    /^\/images\/(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[a-z0-9][a-z0-9._-]*\.(?:png|jpe?g|webp|gif|svg))$/i.test(
      value,
    ) || isHttpUrl(value)
  );
}

export function toFormValues(value: ParsedFormData): ItemFormValues {
  return {
    ...value,
    productUrl: value.productUrl || "",
    tags: value.tags.join(", "),
  };
}

export async function parseFormData(request: Request): Promise<ParsedFormData> {
  const formData = await request.formData();
  const text = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value : "";
  };
  const values: ItemFormValues = {
    name: text("name"),
    imageUrl: text("imageUrl"),
    productUrl: text("productUrl"),
    tags: text("tags"),
    memo: text("memo"),
    status: text("status"),
  };
  const errors: NonNullable<ItemFormActionData["fieldErrors"]> = {};
  const imageUrl = values.imageUrl.trim();
  const productUrl = values.productUrl.trim();
  const tags = [
    ...new Set(
      values.tags
        .split(/[,、\n]/u)
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ];

  if (!imageUrl)
    errors.imageUrl = "写真を選ぶか、画像のURLを入力してください。";
  else if (imageUrl.length > 4000 || !isValidImageUrl(imageUrl)) {
    errors.imageUrl =
      "画像には http または https で始まるURLを入力してください。";
  }
  if (productUrl && (productUrl.length > 4000 || !isHttpUrl(productUrl))) {
    errors.productUrl =
      "商品ページには http または https で始まるURLを入力してください。";
  }
  if (values.name.trim().length > 200)
    errors.name = "名前は200文字以内で入力してください。";
  if (values.memo.length > 10000)
    errors.memo = "思い出は10,000文字以内で入力してください。";
  if (tags.length > 50 || tags.some((tag) => tag.length > 80))
    errors.tags = "タグは50個まで、ひとつ80文字以内で入力してください。";

  if (Object.keys(errors).length) throw new FormValidationError(values, errors);
  return {
    name: values.name.trim() || "名もなき一枚",
    imageUrl,
    productUrl: productUrl || undefined,
    tags,
    memo: values.memo,
    status:
      values.status === "purchased" || values.status === "unpurchased"
        ? values.status
        : DEFAULT_STATUS,
  };
}
