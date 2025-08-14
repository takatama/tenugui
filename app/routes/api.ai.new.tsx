import type { ActionFunctionArgs } from "react-router-dom";
import { getAllTags } from "../data/items";
import {
  analyzeTagWithGemini,
  validateAndCleanAnalysisResult,
} from "../lib/tagAnalysis";

interface RequestBody {
  imageUrl: string;
}

export async function action({ context, request }: ActionFunctionArgs) {
  console.log("タグ分析APIが呼び出されました");

  try {
    // リクエストボディの解析
    const body: RequestBody = await request.json();
    const { imageUrl } = body;

    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "imageUrl is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("分析対象画像URL:", imageUrl);

    // 環境変数からAPIキーを取得
    const apiKey = context.cloudflare.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY が設定されていません");
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 既存タグを取得
    const kv = context.cloudflare.env.TENUGUI_KV;
    const existingTags = await getAllTags(kv);

    // 画像分析実行
    const analysisResult = await analyzeTagWithGemini(
      imageUrl,
      apiKey,
      existingTags
    );

    if (!analysisResult) {
      return new Response(JSON.stringify({ error: "分析に失敗しました" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("AI分析完了:", analysisResult.tags.length, "個のタグを生成");

    // 結果の検証とクリーニング
    const cleanedResult = validateAndCleanAnalysisResult(analysisResult);

    return new Response(JSON.stringify(cleanedResult), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("AI分析エラー:", error);

    return new Response(
      JSON.stringify({
        error: "分析中にエラーが発生しました",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
