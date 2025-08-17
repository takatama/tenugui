import type { ActionFunctionArgs } from "react-router-dom";
import { getAllTags } from "../data/items";
import { requireAuthForAction } from "../lib/auth-guard";
import {
  analyzeTagWithGemini,
  validateAndCleanAnalysisResult,
} from "../lib/tagAnalysis";
import { createAppConfig, validateGeminiConfig } from "../config";

interface RequestBody {
  imageUrl: string;
}

export async function action({ context, request }: ActionFunctionArgs) {
  console.log("タグ分析APIが呼び出されました");

  // 認証チェック
  await requireAuthForAction(request, context);

  // 設定の構築と検証
  const config = createAppConfig(context.cloudflare.env);

  try {
    validateGeminiConfig(config);
  } catch (error) {
    console.error("Configuration validation failed:", error);
    return new Response(
      JSON.stringify({
        error: "サービスが利用できません",
        details: error instanceof Error ? error.message : "Configuration error",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

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

    // 既存タグを取得
    const existingTags = await getAllTags(config.kv.tenugui);

    // 画像分析実行
    const analysisResult = await analyzeTagWithGemini(
      imageUrl,
      config.geminiApiKey!,
      existingTags
    );

    if (!analysisResult) {
      return new Response(JSON.stringify({ error: "分析に失敗しました" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("タグ分析完了:", analysisResult.tags.length, "個のタグを生成");

    // 結果の検証とクリーニング
    const cleanedResult = validateAndCleanAnalysisResult(analysisResult);

    return new Response(JSON.stringify(cleanedResult), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("タグ分析エラー:", error);

    return new Response(
      JSON.stringify({
        error: "タグ分析中にエラーが発生しました",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
