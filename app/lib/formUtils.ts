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

export function parseFormData(request: Request): Promise<ParsedFormData> {
  return request.formData().then((formData) => {
    const name = formData.get("name");
    const imageUrl = formData.get("imageUrl");
    const productUrl = formData.get("productUrl");
    const tagsString = formData.get("tags");
    const memo = formData.get("memo");
    const status = formData.get("status");

    if (!name || !imageUrl) {
      throw new Response("名前と画像URLは必須です", { status: 400 });
    }

    const productUrlValue =
      typeof productUrl === "string" && productUrl.trim() !== ""
        ? productUrl.trim()
        : undefined;

    // タグ文字列をカンマで分割し、前後の空白を除去
    const tags =
      tagsString && typeof tagsString === "string"
        ? tagsString
            .split(",")
            .map((tag: string) => tag.trim())
            .filter((tag: string) => tag.length > 0)
        : [];

    const statusValue =
      status === "purchased" || status === "unpurchased"
        ? status
        : DEFAULT_STATUS;

    return {
      name: String(name),
      imageUrl: String(imageUrl),
      productUrl: productUrlValue,
      tags,
      memo: String(memo || ""),
      status: statusValue,
    };
  });
}
