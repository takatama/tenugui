import type { AnalysisResult, GeminiResponse } from "./geminiAnalysis";
import {
  convertImageToBase64,
  createAnalysisPrompt,
  createGeminiPayload,
  parseGeminiResponse,
} from "./geminiAnalysis";

// Gemini APIを使用して画像を分析（リトライ機能付き）
export async function analyzeImageWithGemini(
  imageUrl: string,
  apiKey: string,
  existingTags: string[] = []
): Promise<AnalysisResult | null> {
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `Gemini API 分析開始 (試行 ${attempt}/${maxRetries}):`,
        imageUrl
      );

      // 画像をbase64に変換
      const { base64Image, mimeType } = await convertImageToBase64(imageUrl);

      // プロンプト作成
      const prompt = createAnalysisPrompt(existingTags);

      // リクエストペイロード作成
      const payload = createGeminiPayload(base64Image, mimeType, prompt);

      // Gemini APIリクエスト
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Gemini API request failed (${response.status}): ${errorText}`
        );
      }

      const geminiResponse: GeminiResponse = await response.json();

      // レスポンス解析
      const result = parseGeminiResponse(geminiResponse);

      console.log("Gemini API 分析成功:", {
        tags: result.tags.length,
        confidence: result.confidence,
      });

      return result;
    } catch (error) {
      lastError = error as Error;
      console.error(`試行 ${attempt} 失敗:`, error);

      if (attempt < maxRetries) {
        // 指数バックオフでリトライ
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`${delay}ms後にリトライします...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  console.error("Gemini API 分析最終失敗:", lastError);
  return null;
}

// 分析結果の検証とクリーニング
export function validateAndCleanAnalysisResult(
  result: AnalysisResult
): AnalysisResult {
  return {
    tags: result.tags.filter((tag) => tag && tag.trim().length > 0).slice(0, 8),
    description:
      result.description?.substring(0, 200) ||
      "分析結果の説明が取得できませんでした",
    colors:
      result.colors
        ?.filter((color) => color && color.trim().length > 0)
        .slice(0, 5) || [],
    patterns:
      result.patterns
        ?.filter((pattern) => pattern && pattern.trim().length > 0)
        .slice(0, 4) || [],
    confidence: Math.max(0, Math.min(1, result.confidence || 0.7)),
  };
}
