import { createItem, getAllTags } from "../data/items";
import type { ImageAnalysis } from "../data/items";
import {
  Form,
  redirect,
  useLoaderData,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router-dom";
import { useItemForm } from "../hooks/useItemForm";
import { useItemAnalysis } from "../hooks/useItemAnalysis";
import {
  ProductAnalysis,
  ImageSelection,
  ImageUrlInput,
  AiAnalysisResult,
  TagSelection,
} from "../components/items";

export async function loader({ context }: LoaderFunctionArgs) {
  const kv = context.cloudflare.env.TENUGUI_KV;
  const existingTags = await getAllTags(kv);

  return {
    existingTags,
  };
}

export async function action({ context, request }: ActionFunctionArgs) {
  const kv = context.cloudflare.env.TENUGUI_KV;
  const formData = await request.formData();
  const name = formData.get("name");
  const imageUrl = formData.get("imageUrl");
  const productUrl = formData.get("productUrl");
  const tagsString = formData.get("tags");
  const memo = formData.get("memo");
  const analysisData = formData.get("analysis");

  if (
    typeof name !== "string" ||
    typeof imageUrl !== "string" ||
    typeof tagsString !== "string" ||
    typeof memo !== "string"
  ) {
    throw new Error("Invalid form data");
  }

  // productUrlは空文字列の場合はundefinedとして扱う
  const productUrlValue =
    typeof productUrl === "string" && productUrl.trim() !== ""
      ? productUrl.trim()
      : undefined;

  // タグ文字列をカンマで分割し、前後の空白を除去
  const tags = tagsString
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);

  // 分析データがある場合はパース
  let analysis: ImageAnalysis | undefined;
  if (typeof analysisData === "string" && analysisData.trim() !== "") {
    try {
      analysis = JSON.parse(analysisData);
    } catch (error) {
      console.error("Failed to parse analysis data:", error);
    }
  }

  const newItem = await createItem(kv, {
    name,
    imageUrl,
    productUrl: productUrlValue,
    tags,
    memo,
    analysis,
  });
  return redirect(`/items/${newItem.id}`);
}

export default function NewItem() {
  const { existingTags } = useLoaderData<typeof loader>();
  const formState = useItemForm();
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
      <h1 className="text-2xl font-bold mb-6">新しい手ぬぐいを追加</h1>
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
          onTagToggle={formState.handleTagToggle}
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
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>

        {/* 分析データを隠しフィールドで送信 */}
        {formState.aiAnalysis && (
          <input
            type="hidden"
            name="analysis"
            value={JSON.stringify({
              ...formState.aiAnalysis,
              analyzedAt: new Date().toISOString(),
            })}
          />
        )}

        <button
          type="submit"
          className="bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700"
        >
          追加する
        </button>
      </Form>
    </div>
  );
}
