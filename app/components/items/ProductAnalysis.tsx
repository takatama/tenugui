import type { AnalysisResult } from "../../hooks/useItemForm";
import { InputField } from "../common/InputField";
import { Button } from "../common/Button";

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
      <InputField
        label="商品URL"
        id="productUrl"
        name="productUrl"
        type="url"
        value={productUrl}
        placeholder="商品のURLを入力してください"
        onChange={(e) => onProductUrlChange(e.target.value)}
        rightElement={
          <Button
            variant="success"
            size="md"
            disabled={isAnalyzing}
            loading={isAnalyzing}
            onClick={onAnalyze}
            className="whitespace-nowrap flex-shrink-0"
          >
            {isAnalyzing ? "商品分析中…" : "商品分析"}
          </Button>
        }
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
