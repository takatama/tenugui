import type { ImageAnalysis } from "../data/items";

export interface ParsedFormData {
  name: string;
  imageUrl: string;
  productUrl?: string;
  tags: string[];
  memo: string;
  analysis?: ImageAnalysis;
}

export function parseFormData(request: Request): Promise<ParsedFormData> {
  return request.formData().then((formData) => {
    const name = formData.get("name");
    const imageUrl = formData.get("imageUrl");
    const productUrl = formData.get("productUrl");
    const tagsString = formData.get("tags");
    const memo = formData.get("memo");
    const analysisData = formData.get("analysis");

    if (
      typeof name !== "string" ||
      typeof imageUrl !== "string" ||
      typeof tagsString !== "string" ||
      typeof memo !== "string"
    ) {
      throw new Error("Invalid form data");
    }

    // productUrlは空文字列の場合はundefinedとして扱う
    const productUrlValue =
      typeof productUrl === "string" && productUrl.trim() !== ""
        ? productUrl.trim()
        : undefined;

    // タグ文字列をカンマで分割し、前後の空白を除去
    const tags = tagsString
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    // 分析データがある場合はパース
    let analysis: ImageAnalysis | undefined;
    if (typeof analysisData === "string" && analysisData.trim() !== "") {
      try {
        analysis = JSON.parse(analysisData);
      } catch (error) {
        console.error("Failed to parse analysis data:", error);
      }
    }

    return {
      name,
      imageUrl,
      productUrl: productUrlValue,
      tags,
      memo,
      analysis,
    };
  });
}
