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
      <div className="flex gap-2">
        <input
          type="url"
          id="imageUrl"
          name="imageUrl"
          value={imageUrl}
          onChange={(e) => onImageUrlChange(e.target.value)}
          required
          className="mt-1 flex-1 border border-gray-300 rounded-md shadow-sm p-2"
        />
        <button
          type="button"
          onClick={onAiAnalyze}
          disabled={isAnalyzing || !imageUrl.trim()}
          className="mt-1 bg-purple-600 text-white font-bold py-2 px-4 rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
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
