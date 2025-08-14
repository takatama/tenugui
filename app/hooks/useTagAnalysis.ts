import type { TagAnalysis } from "../data/items";
import type { AnalysisResult } from "./useItemForm";

export function useTagAnalysis() {
  const analyzeImage = async (
    imageUrl: string,
    setIsAnalyzing: (analyzing: boolean) => void,
    setTagAnalysis: (analysis: TagAnalysis | null) => void,
    setAnalysisResult: (result: AnalysisResult | null) => void
  ) => {
    if (!imageUrl.trim()) {
      setAnalysisResult({
        success: false,
        message: "画像URLを入力してください",
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      console.log("タグ分析リクエスト開始:", imageUrl);

      const response = await fetch("/api/tag-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageUrl }),
      });

      console.log("タグ分析レスポンス:", {
        status: response.status,
        ok: response.ok,
      });

      if (response.ok) {
        const data = (await response.json()) as TagAnalysis;

        console.log("タグ分析データ:", data);

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
            message: "タグ分析結果が不正です",
          });
        }
      } else {
        const errorText = await response.text();
        setAnalysisResult({
          success: false,
          message: `タグ分析に失敗しました (${response.status}): ${errorText}`,
        });
      }
    } catch (error) {
      setAnalysisResult({
        success: false,
        message: `通信エラーが発生しました: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return { analyzeImage };
}
