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
      <label htmlFor="imageUrl" className="block font-medium text-gray-700">
        画像URL
      </label>
      <div className="flex gap-2 items-center">
        <input
          type="url"
          id="imageUrl"
          name="imageUrl"
          value={imageUrl}
          onChange={(e) => onImageUrlChange(e.target.value)}
          required
          className="flex-1 border border-gray-300 rounded-md shadow-sm p-3 h-10 text-sm"
          placeholder="画像のURLを入力してください"
        />
        <button
          type="button"
          onClick={onAiAnalyze}
          disabled={isAnalyzing || !imageUrl.trim()}
          className="bg-purple-600 text-white font-medium py-2 px-3 rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 h-10 text-sm whitespace-nowrap flex-shrink-0"
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              タグ分析中…
            </>
          ) : (
            "タグ分析"
          )}
        </button>
      </div>

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
