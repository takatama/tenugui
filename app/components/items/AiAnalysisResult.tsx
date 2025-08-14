import type { ImageAnalysis } from "../../data/items";

interface AiAnalysisResultProps {
  aiAnalysis: ImageAnalysis;
  selectedTags: Set<string>;
  onTagToggle: (tag: string) => void;
  onAddAllTags: () => void;
  onClearAllTags: () => void;
}

export function AiAnalysisResult({
  aiAnalysis,
  selectedTags,
  onTagToggle,
  onAddAllTags,
  onClearAllTags,
}: AiAnalysisResultProps) {
  return (
    <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
      <h3 className="font-medium text-purple-900 mb-3">AI分析結果</h3>
      <div className="space-y-3 text-sm">
        <div>
          <span className="font-medium">説明:</span>
          <p className="text-gray-700 mt-1">{aiAnalysis.description}</p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">提案タグ:</span>
            <div className="space-x-2">
              <button
                type="button"
                onClick={onAddAllTags}
                className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
              >
                全て追加
              </button>
              <button
                type="button"
                onClick={onClearAllTags}
                className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
              >
                全て削除
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {aiAnalysis.tags.map((tag, index) => (
              <button
                key={index}
                type="button"
                onClick={() => onTagToggle(tag)}
                className={`px-2 py-1 rounded-full text-xs cursor-pointer transition-colors ${
                  selectedTags.has(tag)
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            クリックでタグを選択・解除できます
          </p>
        </div>

        <div>
          <span className="font-medium">主要な色:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {aiAnalysis.colors.map((color, index) => (
              <span
                key={index}
                className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs"
              >
                {color}
              </span>
            ))}
          </div>
        </div>

        <div>
          <span className="font-medium">パターン:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {aiAnalysis.patterns.map((pattern, index) => (
              <span
                key={index}
                className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs"
              >
                {pattern}
              </span>
            ))}
          </div>
        </div>

        <div>
          <span className="font-medium">信頼度:</span>
          <span className="ml-2">{Math.round(aiAnalysis.confidence * 100)}%</span>
        </div>
      </div>
    </div>
  );
}
