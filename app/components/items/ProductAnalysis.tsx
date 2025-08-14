import type { AnalysisResult } from "../../hooks/useItemForm";

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
      <label htmlFor="productUrl" className="block font-medium text-gray-700">
        商品URL
      </label>
      <div className="flex gap-2">
        <input
          type="url"
          id="productUrl"
          name="productUrl"
          value={productUrl}
          onChange={(e) => onProductUrlChange(e.target.value)}
          className="mt-1 flex-1 border border-gray-300 rounded-md shadow-sm p-2"
        />
        <button
          type="button"
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className="mt-1 bg-green-600 text-white font-bold py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              商品分析中…
            </>
          ) : (
            "商品分析"
          )}
        </button>
      </div>

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
