import type { ActionFunctionArgs } from "react-router-dom";

// Gemini API レスポンス型定義
interface GeminiResponse {
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

// 分析結果型定義
interface AnalysisResult {
  tags: string[];
  description: string;
  colors: string[];
  patterns: string[];
  confidence: number;
}

// Gemini APIを使用して画像を分析（リトライ機能付き）
async function analyzeImageWithGemini(
  imageUrl: string,
  apiKey: string
): Promise<AnalysisResult | null> {
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // 画像をbase64に変換
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.status}`);
      }

      const imageBuffer = await imageResponse.arrayBuffer();
      const uint8Array = new Uint8Array(imageBuffer);
      const base64Image = btoa(
        uint8Array.reduce((data, byte) => data + String.fromCharCode(byte), "")
      );
      const mimeType =
        imageResponse.headers.get("content-type") || "image/jpeg";

      const prompt = `
この手ぬぐいの画像を詳しく分析して、以下の情報をJSON形式で返してください：

{
  "tags": ["伝統的", "和風", "花柄", "青色", "白色"],
  "description": "手ぬぐいの詳細な説明",
  "colors": ["主要な色1", "主要な色2", "主要な色3"],
  "patterns": ["柄やパターンの種類"],
  "confidence": 0.95
}

以下の観点で分析してください：
1. 色（主要な色、配色パターン）
2. 柄・模様（幾何学模様、植物、動物、文字など）
3. スタイル（伝統的、現代的、季節性など）
4. 用途や特徴
5. 全体的な印象

レスポンスは必ずJSONフォーマットのみで返してください。`;

      const requestBody = {
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
          temperature: 0.2,
          topK: 32,
          topP: 1,
          maxOutputTokens: 1024,
        },
      };

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = (await response.json()) as GeminiResponse;

      if (data.error) {
        throw new Error(`Gemini API error: ${data.error.message}`);
      }

      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) {
        throw new Error("No content returned from Gemini API");
      }

      // JSONレスポンスをパース
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("No JSON found in response");
        }

        const result = JSON.parse(jsonMatch[0]) as AnalysisResult;

        // 基本的なバリデーション
        if (!result.tags || !Array.isArray(result.tags)) {
          result.tags = [];
        }
        if (!result.description || typeof result.description !== "string") {
          result.description = "分析情報なし";
        }
        if (!result.colors || !Array.isArray(result.colors)) {
          result.colors = [];
        }
        if (!result.patterns || !Array.isArray(result.patterns)) {
          result.patterns = [];
        }
        if (typeof result.confidence !== "number") {
          result.confidence = 0.5;
        }

        return result;
      } catch (parseError) {
        throw new Error("Failed to parse analysis result");
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // 503エラー（サーバー過負荷）の場合はリトライ
      if (lastError.message.includes("503") && attempt < maxRetries) {
        const waitTime = attempt * 2000;
        console.log(`リトライ中... (${attempt}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }

      if (attempt === maxRetries) {
        break;
      }
    }
  }

  console.error("画像分析に失敗しました:", lastError?.message);
  return null;
}

export async function loader() {
  return new Response("Use POST method with imageUrl", { status: 405 });
}

export async function action({ request, context }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const requestBody = await request.json();
    const { imageUrl } = requestBody as { imageUrl?: string };

    if (!imageUrl?.trim()) {
      return new Response("Image URL is required", { status: 400 });
    }

    // Cloudflare環境変数からAPIキーを取得
    const env = context?.cloudflare?.env as any;
    const apiKey = env?.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response("GEMINI_API_KEY is not configured", { status: 500 });
    }

    // Gemini API呼び出し
    const analysisResult = await analyzeImageWithGemini(imageUrl, apiKey);

    if (!analysisResult) {
      return new Response("Failed to analyze image", { status: 500 });
    }

    console.log("AI分析完了:", analysisResult.tags.length, "個のタグを生成");

    return Response.json({
      success: true,
      analysis: analysisResult,
      imageUrl,
    });
  } catch (error) {
    console.error("AI分析エラー:", error instanceof Error ? error.message : error);
    return new Response(
      `Internal server error: ${error instanceof Error ? error.message : "Unknown error"}`,
      { status: 500 }
    );
  }
}
