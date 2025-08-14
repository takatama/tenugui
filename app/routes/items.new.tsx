import { createItem, getAllTags } from "../data/items";
import type { ImageAnalysis } from "../data/items";
import {
  Form,
  redirect,
  useLoaderData,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router-dom";
import { useState } from "react";

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
  const [productUrl, setProductUrl] = useState("");
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [tags, setTags] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [candidateImages, setCandidateImages] = useState<string[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<ImageAnalysis | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  const handleAnalyze = async () => {
    if (!productUrl.trim()) {
      setAnalysisResult({
        success: false,
        message: "商品URLを入力してください",
      });
      return;
    }

    setIsAnalyzing(true);
    setCandidateImages([]);
    setAnalysisResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productUrl }),
      });

      if (response.ok) {
        const data = (await response.json()) as {
          name?: string;
          imageUrls?: string[];
        };
        if (data.name && data.imageUrls && data.imageUrls.length > 0) {
          setName(data.name);
          setCandidateImages(data.imageUrls);
          // 最初の画像をデフォルトで選択
          setImageUrl(data.imageUrls[0]);
          setAnalysisResult({
            success: true,
            message: `分析完了！商品名を取得し、${data.imageUrls.length}件の画像候補を見つけました。下記から画像を選択して「追加する」ボタンを押してください。`,
          });
        } else {
          setAnalysisResult({
            success: false,
            message: "商品情報を取得できませんでした",
          });
        }
      } else {
        const errorText = await response.text();
        setAnalysisResult({
          success: false,
          message: `分析に失敗しました: ${errorText}`,
        });
      }
    } catch (error) {
      console.error("Error:", error);
      setAnalysisResult({
        success: false,
        message: "エラーが発生しました。もう一度お試しください。",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImageSelect = (selectedImageUrl: string) => {
    setImageUrl(selectedImageUrl);
  };

  const handleAiAnalyze = async () => {
    if (!imageUrl.trim()) {
      setAnalysisResult({
        success: false,
        message: "画像URLを入力してください",
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageUrl }),
      });

      if (response.ok) {
        const data = (await response.json()) as {
          success: boolean;
          analysis?: ImageAnalysis;
          existingTags?: string[];
        };

        if (data.success && data.analysis) {
          setAiAnalysis(data.analysis);

          setAnalysisResult({
            success: true,
            message: `AI分析完了！${data.analysis.tags.length}個のタグを提案しました。`,
          });
        } else {
          setAnalysisResult({
            success: false,
            message: "AI分析に失敗しました",
          });
        }
      } else {
        const errorText = await response.text();
        setAnalysisResult({
          success: false,
          message: `AI分析に失敗しました (${response.status}): ${errorText}`,
        });
      }
    } catch (error) {
      setAnalysisResult({
        success: false,
        message: `通信エラーが発生しました: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // タグ選択・削除の管理
  const handleTagToggle = (tag: string) => {
    const newSelectedTags = new Set(selectedTags);
    if (newSelectedTags.has(tag)) {
      newSelectedTags.delete(tag);
    } else {
      newSelectedTags.add(tag);
    }
    setSelectedTags(newSelectedTags);

    // tagsフィールドを更新
    const tagsArray = Array.from(newSelectedTags);
    setTags(tagsArray.join(", "));
  };

  const handleAddAllAiTags = () => {
    if (!aiAnalysis?.tags) return;

    const newSelectedTags = new Set(selectedTags);
    aiAnalysis.tags.forEach((tag) => newSelectedTags.add(tag));
    setSelectedTags(newSelectedTags);

    const tagsArray = Array.from(newSelectedTags);
    setTags(tagsArray.join(", "));
  };

  const handleClearAllTags = () => {
    setSelectedTags(new Set());
    setTags("");
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">新しい手ぬぐいを追加</h1>
      {/* react-router-domの<Form>コンポーネントを使う */}
      <Form method="post" className="space-y-4">
        <div>
          <label
            htmlFor="productUrl"
            className="block font-medium text-gray-700"
          >
            商品URL
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              id="productUrl"
              name="productUrl"
              value={productUrl}
              onChange={(e) => setProductUrl(e.target.value)}
              className="mt-1 flex-1 border border-gray-300 rounded-md shadow-sm p-2"
            />
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="mt-1 bg-green-600 text-white font-bold py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  分析中...
                </>
              ) : (
                "分析"
              )}
            </button>
          </div>
        </div>

        {/* 分析結果表示エリア */}
        {analysisResult && (
          <div
            className={`p-4 rounded-md ${
              analysisResult.success
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <div
              className={`text-sm ${
                analysisResult.success ? "text-green-800" : "text-red-800"
              }`}
            >
              {analysisResult.message}
            </div>
          </div>
        )}

        <div>
          <label htmlFor="name" className="block font-medium text-gray-700">
            名前
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>

        {/* 画像候補選択セクション - 名前の下に配置 */}
        {candidateImages.length > 0 && (
          <div>
            <label className="block font-medium text-gray-700 mb-2">
              画像を選択してください（{candidateImages.length}件の候補）
            </label>
            <div className="grid grid-cols-3 gap-4">
              {candidateImages.map((imgUrl, index) => (
                <div
                  key={index}
                  className={`cursor-pointer border-2 rounded-lg overflow-hidden ${
                    imageUrl === imgUrl
                      ? "border-blue-500 ring-2 ring-blue-200"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                  onClick={() => handleImageSelect(imgUrl)}
                >
                  <img
                    src={imgUrl}
                    alt={`商品画像候補 ${index + 1}`}
                    className="w-full aspect-square object-contain bg-gray-50"
                  />
                  <div className="p-2 text-center">
                    <span className="text-sm text-gray-600">
                      候補 {index + 1}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <label htmlFor="imageUrl" className="block font-medium text-gray-700">
            画像URL
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              id="imageUrl"
              name="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              required
              className="mt-1 flex-1 border border-gray-300 rounded-md shadow-sm p-2"
            />
            <button
              type="button"
              onClick={handleAiAnalyze}
              disabled={isAnalyzing || !imageUrl.trim()}
              className="mt-1 bg-purple-600 text-white font-bold py-2 px-4 rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  AI分析中...
                </>
              ) : (
                "AI分析"
              )}
            </button>
          </div>
          {/* 画像プレビュー */}
          {imageUrl && (
            <div className="mt-2">
              <div className="text-sm text-gray-600 mb-1">プレビュー:</div>
              <div className="border border-gray-300 rounded-lg overflow-hidden w-48">
                <img
                  src={imageUrl}
                  alt="画像プレビュー"
                  className="w-full aspect-square object-contain bg-gray-50"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* AI分析結果表示 */}
        {aiAnalysis && (
          <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
            <h3 className="font-medium text-purple-900 mb-3">AI分析結果</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium">説明:</span>
                <p className="text-gray-700 mt-1">{aiAnalysis.description}</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">提案タグ:</span>
                  <div className="space-x-2">
                    <button
                      type="button"
                      onClick={handleAddAllAiTags}
                      className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                    >
                      全て追加
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAllTags}
                      className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                    >
                      全て削除
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {aiAnalysis.tags.map((tag, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      className={`px-2 py-1 rounded-full text-xs cursor-pointer transition-colors ${
                        selectedTags.has(tag)
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  クリックでタグを選択・解除できます
                </p>
              </div>

              <div>
                <span className="font-medium">主要な色:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {aiAnalysis.colors.map((color, index) => (
                    <span
                      key={index}
                      className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs"
                    >
                      {color}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="font-medium">パターン:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {aiAnalysis.patterns.map((pattern, index) => (
                    <span
                      key={index}
                      className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs"
                    >
                      {pattern}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="font-medium">信頼度:</span>
                <span className="ml-2">
                  {Math.round(aiAnalysis.confidence * 100)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 既存タグ表示セクション */}
        {existingTags.length > 0 && (
          <div>
            <label className="block font-medium text-gray-700 mb-2">
              既存のタグから選択
            </label>
            <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-3 bg-gray-50">
              <div className="flex flex-wrap gap-1">
                {existingTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    className={`px-2 py-1 rounded-full text-xs cursor-pointer transition-colors ${
                      selectedTags.has(tag)
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              過去に使用したタグから選択できます
            </p>
          </div>
        )}

        <div>
          <label htmlFor="tags" className="block font-medium text-gray-700">
            選択されたタグ
          </label>
          <div className="mt-1 min-h-[42px] block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-50">
            {selectedTags.size > 0 ? (
              <div className="flex flex-wrap gap-1">
                {Array.from(selectedTags).map((tag) => (
                  <span
                    key={tag}
                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      className="text-blue-600 hover:text-blue-800 ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-gray-500 text-sm">
                既存タグまたはAI分析結果からタグを選択してください
              </span>
            )}
          </div>
          <input type="hidden" name="tags" value={tags} />
          <p className="mt-1 text-sm text-gray-500">
            既存タグまたはAI分析結果のタグをクリックして選択してください。選択したタグは×ボタンで削除できます。
          </p>
        </div>

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
        {aiAnalysis && (
          <input
            type="hidden"
            name="analysis"
            value={JSON.stringify({
              ...aiAnalysis,
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
