interface TagSelectionProps {
  existingTags: string[];
  selectedTags: Set<string>;
  tags: string;
  onTagToggle: (tag: string) => void;
}

export function TagSelection({
  existingTags,
  selectedTags,
  tags,
  onTagToggle,
}: TagSelectionProps) {
  return (
    <>
      {/* 既存タグ表示セクション */}
      {existingTags.length > 0 && (
        <div>
          <label className="block font-medium text-gray-700 mb-2">
            既存のタグから選択
          </label>
          <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-3 bg-gray-50">
            <div className="flex flex-wrap gap-1">
              {existingTags.map((tag) => (
                <button
                  key={tag}
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
          </div>
          <p className="mt-1 text-sm text-gray-500">
            過去に使用したタグから選択できます
          </p>
        </div>
      )}

      {/* 選択されたタグ表示 */}
      <div>
        <label htmlFor="tags" className="block font-medium text-gray-700">
          選択されたタグ
        </label>
        <div className="mt-1 min-h-[42px] block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-50">
          {selectedTags.size > 0 ? (
            <div className="flex flex-wrap gap-1">
              {Array.from(selectedTags).map((tag) => (
                <span
                  key={tag}
                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center gap-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => onTagToggle(tag)}
                    className="text-blue-600 hover:text-blue-800 ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <span className="text-gray-500 text-sm">
              既存タグまたはAI分析結果からタグを選択してください
            </span>
          )}
        </div>
        <input type="hidden" name="tags" value={tags} />
        <p className="mt-1 text-sm text-gray-500">
          既存タグまたはAI分析結果のタグをクリックして選択してください。選択したタグは×ボタンで削除できます。
        </p>
      </div>
    </>
  );
}
