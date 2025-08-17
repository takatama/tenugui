import { AnalysisField } from "../common";
import { ApiErrorBoundary } from "../common";

interface ImageUrlFieldProps {
  imageUrl: string;
  isAnalyzing: boolean;
  onImageUrlChange: (url: string) => void;
  onAiAnalyze: () => void;
}

export function ImageUrlField({
  imageUrl,
  isAnalyzing,
  onImageUrlChange,
  onAiAnalyze,
}: ImageUrlFieldProps) {
  return (
    <ApiErrorBoundary
      operation="画像URL入力とタグ分析"
      onError={(error) => {
        // 画像URL入力エラー時のクリーンアップ処理
        console.error("ImageUrlField component error:", error);
      }}
    >
      <div>
        <AnalysisField
          label="画像URL"
          id="imageUrl"
          name="imageUrl"
          type="url"
          value={imageUrl}
          placeholder="画像のURLを入力してください"
          required
          isAnalyzing={isAnalyzing}
          analyzeButtonText="タグ分析"
          analyzingButtonText="タグ分析中…"
          onChange={onImageUrlChange}
          onAnalyze={onAiAnalyze}
        />

        {/* 画像プレビュー */}
        {imageUrl && (
          <div className="mt-2">
            <div className="text-sm text-gray-600 mb-1">プレビュー:</div>
            <div className="border border-gray-300 rounded-lg overflow-hidden w-48">
              <img
                src={imageUrl}
                alt="画像プレビュー"
                className="w-full aspect-square object-contain bg-gray-50"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
          </div>
        )}
      </div>
    </ApiErrorBoundary>
  );
}
