import { AnalysisInputField } from "../common";

interface ImageUrlInputProps {
  imageUrl: string;
  isAnalyzing: boolean;
  onImageUrlChange: (url: string) => void;
  onAiAnalyze: () => void;
}

export function ImageUrlInput({
  imageUrl,
  isAnalyzing,
  onImageUrlChange,
  onAiAnalyze,
}: ImageUrlInputProps) {
  return (
    <div>
      <AnalysisInputField
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
  );
}
