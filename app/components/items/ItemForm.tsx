import { Form } from "react-router-dom";
import type { Item, TagAnalysis } from "../../data/items";
import { useItemForm } from "../../hooks/useItemFormShared";
import { useProductAnalysis } from "../../hooks/useProductAnalysis";
import { useTagAnalysis } from "../../hooks/useTagAnalysis";
import { Button } from "../common/Button";
import {
  ProductAnalysis,
  ImageSelection,
  ImageUrlInput,
  TagAnalysisResult,
  TagSelection,
} from "./index";

interface ItemFormProps {
  existingTags: string[];
  initialItem?: Item;
  submitLabel: string;
  title: string;
  cancelUrl?: string;
  initialProductUrl?: string;
}

export function ItemForm({
  existingTags,
  initialItem,
  submitLabel,
  title,
  cancelUrl,
  initialProductUrl,
}: ItemFormProps) {
  const formState = useItemForm({ initialItem, initialProductUrl });
  const { analyzeProduct } = useProductAnalysis();
  const { analyzeImage } = useTagAnalysis();

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
      formState.setTagAnalysis,
      formState.setAnalysisResult
    );
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{title}</h1>
      <Form method="post" className="space-y-6">
        <div className="space-y-1">
          <ProductAnalysis
            productUrl={formState.productUrl}
            isAnalyzing={formState.isAnalyzing}
            analysisResult={formState.analysisResult}
            onProductUrlChange={formState.setProductUrl}
            onAnalyze={handleAnalyze}
          />
        </div>

        <div className="space-y-1">
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
            className="w-full border border-gray-300 rounded-md shadow-sm p-3 h-10 text-sm"
            placeholder="商品の名前を入力してください"
          />
        </div>

        {formState.candidateImages.length > 1 && (
          <div className="space-y-1">
            <ImageSelection
              candidateImages={formState.candidateImages}
              selectedImageUrl={formState.imageUrl}
              onImageSelect={formState.handleImageSelect}
            />
          </div>
        )}

        <div className="space-y-1">
          <ImageUrlInput
            imageUrl={formState.imageUrl}
            isAnalyzing={formState.isAnalyzing}
            onImageUrlChange={formState.setImageUrl}
            onAiAnalyze={handleAiAnalyze}
          />
        </div>

        {formState.tagAnalysis && (
          <div className="space-y-1">
            <TagAnalysisResult
              tagAnalysis={formState.tagAnalysis}
              selectedTags={formState.selectedTags}
              onTagToggle={formState.handleTagToggle}
              onAddAllTags={formState.handleAddAllAiTags}
              onClearAllTags={formState.handleClearAllTags}
            />
          </div>
        )}

        <div className="space-y-1">
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
        </div>

        <div className="space-y-1">
          <label htmlFor="memo" className="block font-medium text-gray-700">
            メモ
          </label>
          <textarea
            id="memo"
            name="memo"
            rows={4}
            placeholder="手ぬぐいに関するメモや説明を入力してください"
            defaultValue={initialItem?.memo || ""}
            className="w-full border border-gray-300 rounded-md shadow-sm p-3 text-sm resize-vertical"
          />
        </div>

        {/* Hidden fields for form submission */}
        <input type="hidden" name="productUrl" value={formState.productUrl} />
        <input type="hidden" name="tags" value={formState.tags} />

        <div className="flex gap-3 pt-4">
          <Button type="submit" variant="primary" size="lg">
            {submitLabel}
          </Button>
          {cancelUrl && (
            <Button variant="secondary" size="lg" href={cancelUrl}>
              キャンセル
            </Button>
          )}
        </div>
      </Form>
    </div>
  );
}
