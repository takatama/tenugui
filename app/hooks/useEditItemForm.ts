import { useState } from "react";
import type { Item } from "../data/items";

export function useEditItemForm(item: Item, existingTags: string[]) {
  const [productUrl, setProductUrl] = useState(item.productUrl || "");
  const [name, setName] = useState(item.name);
  const [imageUrl, setImageUrl] = useState(item.imageUrl);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [candidateImages, setCandidateImages] = useState<string[]>([]);
  const [analysisResult, setAnalysisResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // タグ関連の状態
  const [selectedTags, setSelectedTags] = useState<Set<string>>(
    new Set(item.tags || [])
  );
  const [newTagInput, setNewTagInput] = useState("");

  const updateTags = (newSelectedTags: Set<string>) => {
    setSelectedTags(newSelectedTags);
  };

  const handleTagToggle = (tag: string) => {
    const newSelectedTags = new Set(selectedTags);
    if (newSelectedTags.has(tag)) {
      newSelectedTags.delete(tag);
    } else {
      newSelectedTags.add(tag);
    }
    updateTags(newSelectedTags);
  };

  const handleAddNewTag = () => {
    const trimmedTag = newTagInput.trim();
    if (trimmedTag && !selectedTags.has(trimmedTag)) {
      const newSelectedTags = new Set(selectedTags);
      newSelectedTags.add(trimmedTag);
      updateTags(newSelectedTags);
      setNewTagInput("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddNewTag();
    }
  };

  const handleImageSelect = (selectedImageUrl: string) => {
    setImageUrl(selectedImageUrl);
  };

  // タグを文字列として取得
  const tags = Array.from(selectedTags).join(", ");

  return {
    // 既存の状態
    productUrl,
    name,
    imageUrl,
    isAnalyzing,
    candidateImages,
    analysisResult,

    // タグ関連の状態
    selectedTags,
    newTagInput,
    tags,

    // セッター
    setProductUrl,
    setName,
    setImageUrl,
    setIsAnalyzing,
    setCandidateImages,
    setAnalysisResult,
    setNewTagInput,

    // ハンドラー
    handleTagToggle,
    handleAddNewTag,
    handleKeyPress,
    handleImageSelect,
  };
}
