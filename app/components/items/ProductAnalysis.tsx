import type { AnalysisResult } from "../../hooks/useItemForm";
import { AnalysisField } from "../common";

interface ProductAnalysisProps {
  productUrl: string;
  isAnalyzing: boolean;
  analysisResult: AnalysisResult | null;
  onProductUrlChange: (url: string) => void;
  onAnalyze: () => void;
}

export function ProductAnalysis({
  productUrl,
  isAnalyzing,
  analysisResult,
  onProductUrlChange,
  onAnalyze,
}: ProductAnalysisProps) {
  return (
    <div>
      <AnalysisField
        label="商品URL"
        id="productUrl"
        name="productUrl"
        type="url"
        value={productUrl}
        placeholder="商品のURLを入力してください"
        isAnalyzing={isAnalyzing}
        analyzeButtonText="商品分析"
        analyzingButtonText="商品分析中…"
        onChange={onProductUrlChange}
        onAnalyze={onAnalyze}
      />

      {/* 分析結果表示エリア */}
      {analysisResult && (
        <div
          className={`mt-4 p-4 rounded-md ${
            analysisResult.success
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          <div
            className={`text-sm ${
              analysisResult.success ? "text-green-800" : "text-red-800"
            }`}
          >
            {analysisResult.message}
          </div>
        </div>
      )}
    </div>
  );
}
