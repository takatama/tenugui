import { useState } from "react";
import type { TagAnalysis, Item } from "../data/items";

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

  // タグ関連の状態
  const [selectedTags, setSelectedTags] = useState<Set<string>>(
    new Set(initialItem?.tags || [])
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

  const handleAddAllAiTags = () => {
    if (!tagAnalysis?.tags) return;
    const newSelectedTags = new Set(selectedTags);
    tagAnalysis.tags.forEach((tag) => newSelectedTags.add(tag));
    updateTags(newSelectedTags);
  };

  const handleClearAllTags = () => {
    setSelectedTags(new Set());
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
    // State
    productUrl,
    name,
    imageUrl,
    tags,
    isAnalyzing,
    candidateImages,
    tagAnalysis,
    analysisResult,
    selectedTags,
    newTagInput,

    // Setters
    setProductUrl,
    setName,
    setImageUrl,
    setIsAnalyzing,
    setCandidateImages,
    setTagAnalysis,
    setAnalysisResult,
    setNewTagInput,

    // Handlers
    handleTagToggle,
    handleAddAllAiTags,
    handleClearAllTags,
    handleImageSelect,
    handleAddNewTag,
    handleKeyPress,
  };
}
