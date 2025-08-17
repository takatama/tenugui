import { useState } from "react";
import type { TagAnalysis, Item } from "../data/items";
import { useTagManager } from "./useTagManager";

export interface AnalysisResult {
  success: boolean;
  message: string;
}

interface UseItemFormOptions {
  initialItem?: Item;
  initialProductUrl?: string;
}

export function useItemForm(options: UseItemFormOptions = {}) {
  const { initialItem, initialProductUrl } = options;

  // 基本フォーム状態
  const [productUrl, setProductUrl] = useState(
    initialProductUrl || initialItem?.productUrl || ""
  );
  const [name, setName] = useState(initialItem?.name || "");
  const [imageUrl, setImageUrl] = useState(initialItem?.imageUrl || "");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [candidateImages, setCandidateImages] = useState<string[]>([]);
  const [tagAnalysis, setTagAnalysis] = useState<TagAnalysis | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );

  // タグ管理フック
  const tagManager = useTagManager({
    initialTags: initialItem?.tags || [],
  });

  const handleImageSelect = (selectedImageUrl: string) => {
    setImageUrl(selectedImageUrl);
  };

  // AI分析からタグを追加するためのヘルパー関数
  const handleAddAllAiTags = () => {
    tagManager.handleAddAllAiTags(tagAnalysis);
  };

  return {
    // State
    productUrl,
    name,
    imageUrl,
    tags: tagManager.tagsString,
    isAnalyzing,
    candidateImages,
    tagAnalysis,
    analysisResult,
    selectedTags: tagManager.selectedTags,
    newTagInput: tagManager.newTagInput,

    // Setters
    setProductUrl,
    setName,
    setImageUrl,
    setIsAnalyzing,
    setCandidateImages,
    setTagAnalysis,
    setAnalysisResult,
    setNewTagInput: tagManager.setNewTagInput,

    // Handlers
    handleTagToggle: tagManager.handleTagToggle,
    handleAddAllAiTags,
    handleClearAllTags: tagManager.handleClearAllTags,
    handleImageSelect,
    handleAddNewTag: tagManager.handleAddNewTag,
    handleKeyPress: tagManager.handleKeyPress,
  };
}
