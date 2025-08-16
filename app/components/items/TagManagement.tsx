import React, { useState } from "react";
import { TagDisplay } from "../common/TagDisplay";

interface TagManagementProps {
  tags: string[];
  onTagDelete: (tag: string) => void;
  onTagRename: (oldTag: string, newTag: string) => Promise<void>;
}

export function TagManagement({
  tags,
  onTagDelete,
  onTagRename,
}: TagManagementProps) {
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  const handleStartEdit = (tag: string) => {
    setEditingTag(tag);
    setEditingValue(tag);
  };

  const handleCancelEdit = () => {
    setEditingTag(null);
    setEditingValue("");
  };

  const handleSaveEdit = async () => {
    if (!editingTag || !editingValue.trim()) return;

    const newTagName = editingValue.trim();
    if (newTagName === editingTag) {
      handleCancelEdit();
      return;
    }

    try {
      setIsRenaming(true);
      await onTagRename(editingTag, newTagName);
      setEditingTag(null);
      setEditingValue("");
    } catch (error) {
      // エラーハンドリングは親コンポーネントで実行される
    } finally {
      setIsRenaming(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  if (tags.length === 0) {
    return <p className="text-gray-500">現在、タグがありません。</p>;
  }

  return (
    <div>
      <p className="text-gray-600 mb-4">
        現在 {tags.length} 個のタグがあります。
        <br />
        • タグをクリックして名前を変更
        <br />• × ボタンをクリックして削除
      </p>
      <div className="min-h-[40px] block w-full border border-gray-300 rounded-md shadow-sm p-3 bg-gray-50">
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <div key={tag} className="flex items-center">
              {editingTag === tag ? (
                <div className="flex items-center gap-1 bg-white border border-blue-300 rounded-full px-2 py-1">
                  <input
                    type="text"
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    onBlur={handleSaveEdit}
                    className="text-sm border-none outline-none bg-transparent min-w-[60px] max-w-[120px]"
                    autoFocus
                    disabled={isRenaming}
                  />
                  {isRenaming && (
                    <span className="text-xs text-blue-600">保存中...</span>
                  )}
                </div>
              ) : (
                <div className="flex items-center">
                  <TagDisplay
                    tag={tag}
                    variant="editable"
                    onClick={() => handleStartEdit(tag)}
                    className="cursor-pointer hover:bg-blue-100"
                  />
                  <button
                    type="button"
                    onClick={() => onTagDelete(tag)}
                    className="text-red-600 hover:text-red-800 hover:bg-red-100 rounded-full p-0.5 transition-colors ml-1"
                    title={`「${tag}」を削除`}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {editingTag && (
        <p className="text-xs text-gray-500 mt-2">
          Enterキーで保存、Escキーでキャンセル
        </p>
      )}
    </div>
  );
}
