interface ImageSelectionProps {
  candidateImages: string[];
  selectedImageUrl: string;
  onImageSelect: (url: string) => void;
}

export function ImageSelection({
  candidateImages,
  selectedImageUrl,
  onImageSelect,
}: ImageSelectionProps) {
  if (candidateImages.length === 0) {
    return null;
  }

  return (
    <div>
      <label className="block font-medium text-gray-700 mb-2">
        画像を選択してください（{candidateImages.length}件の候補）
      </label>
      <div className="grid grid-cols-3 gap-4">
        {candidateImages.map((imgUrl, index) => (
          <div
            key={index}
            className={`cursor-pointer border-2 rounded-lg overflow-hidden ${
              selectedImageUrl === imgUrl
                ? "border-blue-500 ring-2 ring-blue-200"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onClick={() => onImageSelect(imgUrl)}
          >
            <img
              src={imgUrl}
              alt={`商品画像候補 ${index + 1}`}
              className="w-full aspect-square object-contain bg-gray-50"
            />
            <div className="p-2 text-center">
              <span className="text-sm text-gray-600">候補 {index + 1}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
