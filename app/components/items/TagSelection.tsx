import React from "react";

interface TagSelectionProps {
  existingTags: string[];
  selectedTags: Set<string>;
  tags: string;
  newTagInput: string;
  onTagToggle: (tag: string) => void;
  onNewTagInputChange: (value: string) => void;
  onAddNewTag: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
}

export function TagSelection({
  existingTags,
  selectedTags,
  tags,
  newTagInput,
  onTagToggle,
  onNewTagInputChange,
  onAddNewTag,
  onKeyPress,
}: TagSelectionProps) {
  return (
    <div className="space-y-4">
      {/* タグ選択・追加エリア */}
      <div>
        <label className="block font-medium text-gray-700 mb-2">
          タグを選択または追加
        </label>
        
        {/* 既存タグ + 新規追加を同じエリアに */}
        <div className="border border-gray-300 rounded-md p-3 bg-gray-50 space-y-3">
          {/* 既存タグ */}
          {existingTags.length > 0 && (
            <div>
              <div className="text-xs text-gray-600 mb-2">既存のタグ</div>
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
          )}
          
          {/* 新規タグ追加（コンパクト版） */}
          <div>
            <div className="text-xs text-gray-600 mb-2">新しいタグを追加</div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => onNewTagInputChange(e.target.value)}
                onKeyPress={onKeyPress}
                placeholder="新しいタグ..."
                className="flex-1 border border-gray-300 rounded-md shadow-sm px-2 py-1 text-sm"
              />
              <button
                type="button"
                onClick={onAddNewTag}
                disabled={
                  !newTagInput.trim() || selectedTags.has(newTagInput.trim())
                }
                className="bg-blue-600 text-white font-medium py-1 px-3 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
              >
                +
              </button>
            </div>
          </div>
        </div>
        
        <p className="mt-1 text-xs text-gray-500">
          既存タグをクリックして選択、または新しいタグを入力してEnterキーまたは「+」ボタンで追加
        </p>
      </div>

      {/* 選択されたタグ表示（コンパクト版） */}
      <div>
        <label htmlFor="tags" className="block font-medium text-gray-700 mb-2">
          選択中のタグ
        </label>
        <div className="min-h-[40px] block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white">
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
                    className="text-blue-600 hover:text-blue-800 ml-1 text-xs"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <span className="text-gray-400 text-sm">タグが選択されていません</span>
          )}
        </div>
        <input type="hidden" name="tags" value={tags} />
      </div>
    </div>
  );
}
