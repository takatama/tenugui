import { useState, useCallback } from "react";
import type { TagAnalysis } from "../data/items";

interface UseTagManagerOptions {
  initialTags?: string[];
  onTagsChange?: (tags: string[]) => void;
}

export function useTagManager(options: UseTagManagerOptions = {}) {
  const { initialTags = [], onTagsChange } = options;

  const [selectedTags, setSelectedTags] = useState<Set<string>>(
    new Set(initialTags)
  );
  const [newTagInput, setNewTagInput] = useState("");

  // タグの状態を更新し、コールバックを呼び出す
  const updateTags = useCallback(
    (newSelectedTags: Set<string>) => {
      setSelectedTags(newSelectedTags);
      onTagsChange?.(Array.from(newSelectedTags));
    },
    [onTagsChange]
  );

  // タグの追加/削除をトグル
  const handleTagToggle = useCallback(
    (tag: string) => {
      const newSelectedTags = new Set(selectedTags);
      if (newSelectedTags.has(tag)) {
        newSelectedTags.delete(tag);
      } else {
        newSelectedTags.add(tag);
      }
      updateTags(newSelectedTags);
    },
    [selectedTags, updateTags]
  );

  // AI分析結果からのタグを全て追加
  const handleAddAllAiTags = useCallback(
    (tagAnalysis: TagAnalysis | null) => {
      if (!tagAnalysis?.tags) return;
      const newSelectedTags = new Set(selectedTags);
      tagAnalysis.tags.forEach((tag) => newSelectedTags.add(tag));
      updateTags(newSelectedTags);
    },
    [selectedTags, updateTags]
  );

  // 全てのタグをクリア
  const handleClearAllTags = useCallback(() => {
    updateTags(new Set());
  }, [updateTags]);

  // 新しいタグを追加
  const handleAddNewTag = useCallback(() => {
    const trimmedTag = newTagInput.trim();
    if (trimmedTag && !selectedTags.has(trimmedTag)) {
      const newSelectedTags = new Set(selectedTags);
      newSelectedTags.add(trimmedTag);
      updateTags(newSelectedTags);
      setNewTagInput("");
    }
  }, [newTagInput, selectedTags, updateTags]);

  // キーボードイベントハンドリング（Enterで新規タグ追加）
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddNewTag();
      }
    },
    [handleAddNewTag]
  );

  // タグを文字列として取得（カンマ区切り）
  const tagsString = Array.from(selectedTags).join(", ");

  // タグを配列として取得
  const tagsArray = Array.from(selectedTags);

  return {
    // 状態
    selectedTags,
    newTagInput,
    tagsString,
    tagsArray,

    // セッター
    setNewTagInput,
    setSelectedTags: updateTags,

    // ハンドラー
    handleTagToggle,
    handleAddAllAiTags,
    handleClearAllTags,
    handleAddNewTag,
    handleKeyPress,
  };
}
