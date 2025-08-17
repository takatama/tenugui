import { useState } from "react";
import type { Item } from "../data/items";
import { useTagManager } from "./useTagManager";

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

  // タグ管理フック
  const tagManager = useTagManager({
    initialTags: item.tags || [],
  });

  const handleImageSelect = (selectedImageUrl: string) => {
    setImageUrl(selectedImageUrl);
  };

  return {
    // 既存の状態
    productUrl,
    name,
    imageUrl,
    isAnalyzing,
    candidateImages,
    analysisResult,

    // タグ関連の状態（useTagManagerから）
    selectedTags: tagManager.selectedTags,
    newTagInput: tagManager.newTagInput,
    tags: tagManager.tagsString,

    // セッター
    setProductUrl,
    setName,
    setImageUrl,
    setIsAnalyzing,
    setCandidateImages,
    setAnalysisResult,
    setNewTagInput: tagManager.setNewTagInput,

    // ハンドラー（useTagManagerから）
    handleTagToggle: tagManager.handleTagToggle,
    handleAddNewTag: tagManager.handleAddNewTag,
    handleKeyPress: tagManager.handleKeyPress,
    handleImageSelect,
  };
}
