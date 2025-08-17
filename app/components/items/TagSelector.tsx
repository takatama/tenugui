import React from "react";
import { TagList } from "../common/TagDisplay";
import { InputField, Button, PlusIcon } from "../common";

interface TagSelectorProps {
  existingTags: string[];
  selectedTags: Set<string>;
  tags: string;
  newTagInput: string;
  onTagToggle: (tag: string) => void;
  onNewTagInputChange: (value: string) => void;
  onAddNewTag: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
}

export function TagSelector({
  existingTags,
  selectedTags,
  tags,
  newTagInput,
  onTagToggle,
  onNewTagInputChange,
  onAddNewTag,
  onKeyPress,
}: TagSelectorProps) {
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
            <InputField
              value={newTagInput}
              onChange={(e) => onNewTagInputChange(e.target.value)}
              onKeyPress={onKeyPress}
              placeholder="新しいタグ..."
              size="sm"
              rightElement={
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onAddNewTag}
                  disabled={
                    !newTagInput.trim() || selectedTags.has(newTagInput.trim())
                  }
                  icon={<PlusIcon />}
                  aria-label="タグを追加"
                />
              }
            />
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
            <TagList
              tags={Array.from(selectedTags)}
              variant="removable"
              onTagRemove={onTagToggle}
              className="gap-1"
            />
          ) : (
            <span className="text-gray-400 text-sm">
              タグが選択されていません
            </span>
          )}
        </div>
        <input type="hidden" name="tags" value={tags} />
      </div>
    </div>
  );
}
