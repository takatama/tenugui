// 分析結果型定義
export interface TagAnalysisResult {
  tags: string[];
  description: string;
  colors: string[];
  patterns: string[];
  confidence: number;
}

// Gemini API レスポンス型定義
export interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
  error?: {
    message: string;
  };
}

// 画像をbase64に変換する関数
export async function convertImageToBase64(imageUrl: string): Promise<{
  base64Image: string;
  mimeType: string;
}> {
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to fetch image: ${imageResponse.status}`);
  }

  const imageBuffer = await imageResponse.arrayBuffer();
  const uint8Array = new Uint8Array(imageBuffer);
  const base64Image = btoa(
    uint8Array.reduce((data, byte) => data + String.fromCharCode(byte), "")
  );
  const mimeType = imageResponse.headers.get("content-type") || "image/jpeg";

  return { base64Image, mimeType };
}

// Gemini APIプロンプトを生成する関数
export function createAnalysisPrompt(existingTags: string[] = []): string {
  const existingTagsText =
    existingTags.length > 0
      ? `\n\n既存のタグ例: ${existingTags.slice(0, 20).join(", ")}`
      : "";

  return `この手ぬぐいの画像を分析して、以下の情報をJSON形式で返してください。${existingTagsText}

必須項目:
- tags: 手ぬぐいに関連する適切なタグを3-8個（既存のタグがある場合は優先的に使用）
- description: 手ぬぐいの特徴や用途の簡潔な説明（100文字以内）
- colors: 主要な色を3-5個
- patterns: 柄やパターンの特徴を2-4個
- confidence: 分析の信頼度（0-1の数値）

レスポンス形式:
{
  "tags": ["伝統", "藍色", "幾何学模様"],
  "description": "藍色を基調とした伝統的な幾何学模様の手ぬぐい",
  "colors": ["藍色", "白", "紺色"],
  "patterns": ["幾何学模様", "格子柄"],
  "confidence": 0.85
}

注意点:
- タグは手ぬぐいの用途、色、柄、素材、季節感などを含める
- 日本語で回答
- JSON以外の文字は含めない`;
}

// Gemini APIリクエストペイロードを作成する関数
export function createGeminiPayload(
  base64Image: string,
  mimeType: string,
  prompt: string
) {
  return {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Image,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 1000,
    },
  };
}

// Gemini APIレスポンスを解析する関数
export function parseGeminiResponse(
  response: GeminiResponse
): TagAnalysisResult {
  if (response.error) {
    throw new Error(`Gemini API error: ${response.error.message}`);
  }

  if (!response.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error("No response content from Gemini API");
  }

  const responseText = response.candidates[0].content.parts[0].text;
  console.log("Gemini API生レスポンス:", responseText);

  // JSONのみを抽出（前後の不要なテキストを除去）
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No valid JSON found in response");
  }

  try {
    const result = JSON.parse(jsonMatch[0]) as unknown;

    // 型安全な検証
    if (!isTagAnalysisResult(result)) {
      throw new Error("Invalid response format from Gemini API");
    }

    // デフォルト値の設定
    result.colors = result.colors || [];
    result.patterns = result.patterns || [];
    result.confidence =
      typeof result.confidence === "number" ? result.confidence : 0.7;

    return result;
  } catch (error) {
    console.error("JSON parse error:", error);
    throw new Error("Failed to parse analysis result");
  }
}

/**
 * TagAnalysisResult の型ガード
 */
function isTagAnalysisResult(obj: unknown): obj is TagAnalysisResult {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "tags" in obj &&
    Array.isArray((obj as TagAnalysisResult).tags) &&
    (obj as TagAnalysisResult).tags.length > 0 &&
    "description" in obj &&
    typeof (obj as TagAnalysisResult).description === "string"
  );
}
