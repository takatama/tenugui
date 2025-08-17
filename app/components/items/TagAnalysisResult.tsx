import type { TagAnalysis } from "../../data/items";
import { TagList } from "../common/TagDisplay";
import { ApiErrorBoundary } from "../common";

interface TagAnalysisResultProps {
  tagAnalysis: TagAnalysis;
  selectedTags: Set<string>;
  onTagToggle: (tag: string) => void;
  onAddAllTags: () => void;
  onClearAllTags: () => void;
}

export function TagAnalysisResult({
  tagAnalysis,
  selectedTags,
  onTagToggle,
  onAddAllTags,
  onClearAllTags,
}: TagAnalysisResultProps) {
  return (
    <ApiErrorBoundary
      operation="タグ分析結果表示"
      onError={(error) => {
        // タグ分析結果エラー時のクリーンアップ処理
        console.error("TagAnalysisResult component error:", error);
      }}
    >
      <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
        <h3 className="font-medium text-purple-900 mb-3">タグ分析結果</h3>
        <div className="space-y-3 text-sm">
          <div>
            <span className="font-medium">説明:</span>
            <p className="text-gray-700 mt-1">{tagAnalysis.description}</p>
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
            <TagList
              tags={tagAnalysis.tags}
              variant="filter"
              selectedTags={selectedTags}
              onTagClick={onTagToggle}
              className="mt-1 gap-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              クリックでタグを選択・解除できます
            </p>
          </div>

          <div>
            <span className="font-medium">主要な色:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {tagAnalysis.colors.map((color, index) => (
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
              {tagAnalysis.patterns.map((pattern, index) => (
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
            <span className="ml-2">
              {Math.round(tagAnalysis.confidence * 100)}%
            </span>
          </div>
        </div>
      </div>
    </ApiErrorBoundary>
  );
}
