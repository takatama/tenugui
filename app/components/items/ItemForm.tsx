import { Form } from "react-router-dom";
import type { Item, ImageAnalysis } from "../../data/items";
import { useItemForm } from "../../hooks/useItemFormShared";
import { useItemAnalysis } from "../../hooks/useItemAnalysis";
import {
  ProductAnalysis,
  ImageSelection,
  ImageUrlInput,
  AiAnalysisResult,
  TagSelection,
} from "./index";

interface ItemFormProps {
  existingTags: string[];
  initialItem?: Item;
  submitLabel: string;
  title: string;
  cancelUrl?: string;
}

export function ItemForm({
  existingTags,
  initialItem,
  submitLabel,
  title,
  cancelUrl,
}: ItemFormProps) {
  const formState = useItemForm({ initialItem });
  const { analyzeProduct, analyzeImage } = useItemAnalysis();

  const handleAnalyze = () => {
    analyzeProduct(
      formState.productUrl,
      formState.setIsAnalyzing,
      formState.setName,
      formState.setCandidateImages,
      formState.setImageUrl,
      formState.setAnalysisResult
    );
  };

  const handleAiAnalyze = () => {
    analyzeImage(
      formState.imageUrl,
      formState.setIsAnalyzing,
      formState.setAiAnalysis,
      formState.setAnalysisResult
    );
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{title}</h1>
      <Form method="post" className="space-y-4">
        <ProductAnalysis
          productUrl={formState.productUrl}
          isAnalyzing={formState.isAnalyzing}
          analysisResult={formState.analysisResult}
          onProductUrlChange={formState.setProductUrl}
          onAnalyze={handleAnalyze}
        />

        <div>
          <label htmlFor="name" className="block font-medium text-gray-700">
            名前
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formState.name}
            onChange={(e) => formState.setName(e.target.value)}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>

        <ImageSelection
          candidateImages={formState.candidateImages}
          selectedImageUrl={formState.imageUrl}
          onImageSelect={formState.handleImageSelect}
        />

        <ImageUrlInput
          imageUrl={formState.imageUrl}
          isAnalyzing={formState.isAnalyzing}
          onImageUrlChange={formState.setImageUrl}
          onAiAnalyze={handleAiAnalyze}
        />

        {formState.aiAnalysis && (
          <AiAnalysisResult
            aiAnalysis={formState.aiAnalysis}
            selectedTags={formState.selectedTags}
            onTagToggle={formState.handleTagToggle}
            onAddAllTags={formState.handleAddAllAiTags}
            onClearAllTags={formState.handleClearAllTags}
          />
        )}

        <TagSelection
          existingTags={existingTags}
          selectedTags={formState.selectedTags}
          tags={formState.tags}
          newTagInput={formState.newTagInput}
          onTagToggle={formState.handleTagToggle}
          onNewTagInputChange={formState.setNewTagInput}
          onAddNewTag={formState.handleAddNewTag}
          onKeyPress={formState.handleKeyPress}
        />

        <div>
          <label htmlFor="memo" className="block font-medium text-gray-700">
            メモ
          </label>
          <textarea
            id="memo"
            name="memo"
            rows={4}
            placeholder="手ぬぐいに関するメモや説明を入力してください"
            defaultValue={initialItem?.memo || ""}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            className="bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700"
          >
            {submitLabel}
          </button>
          {cancelUrl && (
            <a
              href={cancelUrl}
              className="bg-gray-600 text-white font-bold py-2 px-4 rounded-md hover:bg-gray-700 inline-block"
            >
              キャンセル
            </a>
          )}
        </div>
      </Form>
    </div>
  );
}
