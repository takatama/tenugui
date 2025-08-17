import { useApiRequest } from "./useApiRequest";
import { useAsyncOperation } from "./useAsyncOperation";
import { handleError } from "../lib/errorHandler";
import type { TagAnalysis } from "../data/items";
import type { AnalysisResult } from "./useItemFormShared";

export function useTagAnalysis() {
  const { request } = useApiRequest<TagAnalysis>();

  const tagAnalysis = useAsyncOperation(async (imageUrl: string) => {
    if (!imageUrl.trim()) {
      throw new Error("画像URLを入力してください");
    }

    console.log("タグ分析リクエスト開始:", imageUrl);

    const data = await request("/api/tag-analysis", {
      method: "POST",
      body: JSON.stringify({ imageUrl }),
    });

    console.log("タグ分析データ:", data);
    return data;
  });

  const analyzeImage = async (
    imageUrl: string,
    setIsAnalyzing: (analyzing: boolean) => void,
    setTagAnalysis: (analysis: TagAnalysis | null) => void,
    setAnalysisResult: (result: AnalysisResult | null) => void
  ) => {
    setAnalysisResult(null);

    try {
      setIsAnalyzing(true);
      const data = await tagAnalysis.execute(imageUrl);

      if (!data) {
        throw new Error("タグ分析結果を取得できませんでした");
      }

      // データの妥当性をチェック
      if (data.tags && Array.isArray(data.tags) && data.tags.length > 0) {
        setTagAnalysis(data);
        setAnalysisResult({
          success: true,
          message: `タグ分析完了！${data.tags.length}個のタグを提案しました。`,
        });
      } else {
        setAnalysisResult({
          success: false,
          message:
            "適切なタグを生成できませんでした。手動でタグを追加してください。",
        });
      }
    } catch (error) {
      const userMessage = handleError(error, {
        operation: "タグ分析",
        additionalData: { imageUrl },
      });

      setAnalysisResult({
        success: false,
        message: userMessage,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return { analyzeImage };
}
