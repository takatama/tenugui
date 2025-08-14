import type { ImageAnalysis } from "../data/items";
import type { AnalysisResult } from "./useItemForm";

export function useItemAnalysis() {
  const analyzeProduct = async (
    productUrl: string,
    setIsAnalyzing: (analyzing: boolean) => void,
    setName: (name: string) => void,
    setCandidateImages: (images: string[]) => void,
    setImageUrl: (url: string) => void,
    setAnalysisResult: (result: AnalysisResult | null) => void
  ) => {
    if (!productUrl.trim()) {
      setAnalysisResult({
        success: false,
        message: "商品URLを入力してください",
      });
      return;
    }

    setIsAnalyzing(true);
    setCandidateImages([]);
    setAnalysisResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productUrl }),
      });

      if (response.ok) {
        const data = (await response.json()) as {
          name?: string;
          imageUrls?: string[];
        };
        if (data.name && data.imageUrls && data.imageUrls.length > 0) {
          setName(data.name);
          setCandidateImages(data.imageUrls);
          setImageUrl(data.imageUrls[0]);
          setAnalysisResult({
            success: true,
            message: `分析完了！商品名を取得し、${data.imageUrls.length}件の画像候補を見つけました。下記から画像を選択して「追加する」ボタンを押してください。`,
          });
        } else {
          setAnalysisResult({
            success: false,
            message: "商品情報を取得できませんでした",
          });
        }
      } else {
        const errorText = await response.text();
        setAnalysisResult({
          success: false,
          message: `分析に失敗しました: ${errorText}`,
        });
      }
    } catch (error) {
      console.error("Error:", error);
      setAnalysisResult({
        success: false,
        message: "エラーが発生しました。もう一度お試しください。",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeImage = async (
    imageUrl: string,
    setIsAnalyzing: (analyzing: boolean) => void,
    setAiAnalysis: (analysis: ImageAnalysis | null) => void,
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
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageUrl }),
      });

      if (response.ok) {
        const data = (await response.json()) as {
          success: boolean;
          analysis?: ImageAnalysis;
          existingTags?: string[];
        };

        if (data.success && data.analysis) {
          setAiAnalysis(data.analysis);
          setAnalysisResult({
            success: true,
            message: `AI分析完了！${data.analysis.tags.length}個のタグを提案しました。`,
          });
        } else {
          setAnalysisResult({
            success: false,
            message: "AI分析に失敗しました",
          });
        }
      } else {
        const errorText = await response.text();
        setAnalysisResult({
          success: false,
          message: `AI分析に失敗しました (${response.status}): ${errorText}`,
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

  return {
    analyzeProduct,
    analyzeImage,
  };
}
