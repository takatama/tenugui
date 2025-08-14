import { useState } from "react";
import type { ImageAnalysis } from "../data/items";

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
  const [aiAnalysis, setAiAnalysis] = useState<ImageAnalysis | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

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

  const handleAddAllAiTags = () => {
    if (!aiAnalysis?.tags) return;
    const newSelectedTags = new Set(selectedTags);
    aiAnalysis.tags.forEach((tag) => newSelectedTags.add(tag));
    updateTags(newSelectedTags);
  };

  const handleClearAllTags = () => {
    setSelectedTags(new Set());
    setTags("");
  };

  const handleImageSelect = (selectedImageUrl: string) => {
    setImageUrl(selectedImageUrl);
  };

  return {
    // State
    productUrl,
    name,
    imageUrl,
    tags,
    isAnalyzing,
    candidateImages,
    aiAnalysis,
    analysisResult,
    selectedTags,
    
    // Setters
    setProductUrl,
    setName,
    setImageUrl,
    setIsAnalyzing,
    setCandidateImages,
    setAiAnalysis,
    setAnalysisResult,
    
    // Handlers
    handleTagToggle,
    handleAddAllAiTags,
    handleClearAllTags,
    handleImageSelect,
  };
}
