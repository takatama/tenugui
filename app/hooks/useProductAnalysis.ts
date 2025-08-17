import { useApiRequest } from "./useApiRequest";
import { useAsyncOperation } from "./useAsyncOperation";
import { handleError } from "../lib/errorHandler";
import type { AnalysisResult } from "./useItemForm";

interface ProductAnalysisResponse {
  name?: string;
  imageUrls?: string[];
}

export function useProductAnalysis() {
  const { request } = useApiRequest<ProductAnalysisResponse>();

  const productAnalysis = useAsyncOperation(async (productUrl: string) => {
    if (!productUrl.trim()) {
      throw new Error("商品URLを入力してください");
    }

    return await request("/api/product-analysis", {
      method: "POST",
      body: JSON.stringify({ productUrl }),
    });
  });

  const analyzeProduct = async (
    productUrl: string,
    setIsAnalyzing: (analyzing: boolean) => void,
    setName: (name: string) => void,
    setCandidateImages: (images: string[]) => void,
    setImageUrl: (url: string) => void,
    setAnalysisResult: (result: AnalysisResult | null) => void
  ) => {
    // 初期化
    setCandidateImages([]);
    setAnalysisResult(null);

    try {
      setIsAnalyzing(true);
      const data = await productAnalysis.execute(productUrl);

      if (!data) {
        throw new Error("分析結果を取得できませんでした");
      }

      console.log("Product analysis response:", data);

      if (data.name) {
        setName(data.name);

        if (data.imageUrls && data.imageUrls.length > 0) {
          setCandidateImages(data.imageUrls);
          setImageUrl(data.imageUrls[0]);

          if (data.imageUrls.length === 1) {
            setAnalysisResult({
              success: true,
              message: "分析完了！商品名と画像を取得しました。",
            });
          } else {
            setAnalysisResult({
              success: true,
              message: `分析完了！商品名を取得し、${data.imageUrls.length}件の画像候補を見つけました。下記から画像を選択してください。`,
            });
          }
        } else {
          setCandidateImages([]);
          setAnalysisResult({
            success: true,
            message:
              "分析完了！商品名を取得しました。画像候補は見つかりませんでしたので、手動で画像URLを入力してください。",
          });
        }
      } else {
        setAnalysisResult({
          success: false,
          message: "商品情報を取得できませんでした",
        });
      }
    } catch (error) {
      const userMessage = handleError(error, {
        operation: "商品分析",
        additionalData: { productUrl },
      });

      setAnalysisResult({
        success: false,
        message: userMessage,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return { analyzeProduct };
}
