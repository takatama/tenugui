import { useState } from "react";
import type { TagAnalysis } from "../data/items";

export interface AnalysisResult {
  success: boolean;
  message: string;
}

export function useItemForm() {
  const [productUrl, setProductUrl] = useState("");
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [tags, setTags] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [candidateImages, setCandidateImages] = useState<string[]>([]);
  const [tagAnalysis, setTagAnalysis] = useState<TagAnalysis | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [newTagInput, setNewTagInput] = useState("");

  const updateTags = (newSelectedTags: Set<string>) => {
    setSelectedTags(newSelectedTags);
    const tagsArray = Array.from(newSelectedTags);
    setTags(tagsArray.join(", "));
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

  const handleAddAllTags = () => {
    if (!tagAnalysis?.tags) return;
    const newSelectedTags = new Set(selectedTags);
    tagAnalysis.tags.forEach((tag) => newSelectedTags.add(tag));
    updateTags(newSelectedTags);
  };

  const handleClearAllTags = () => {
    setSelectedTags(new Set());
    setTags("");
  };

  const handleImageSelect = (selectedImageUrl: string) => {
    setImageUrl(selectedImageUrl);
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
    handleAddAllTags,
    handleClearAllTags,
    handleImageSelect,
    handleAddNewTag,
    handleKeyPress,
  };
}
