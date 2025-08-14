import { createItem } from "../data/items";
import type { ImageAnalysis } from "../data/items";
import { Form, redirect, type ActionFunctionArgs } from "react-router-dom";
import { useState } from "react";

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
        };

        if (data.success && data.analysis) {
          setAiAnalysis(data.analysis);
          // AIが提案したタグを既存のタグに追加
          const aiTags = data.analysis.tags || [];
          const currentTags = tags
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t);
          const allTags = [...new Set([...currentTags, ...aiTags])];
          setTags(allTags.join(", "));

          setAnalysisResult({
            success: true,
            message: `AI分析完了！${aiTags.length}個のタグを提案しました。`,
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
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">説明:</span>
                <p className="text-gray-700 mt-1">{aiAnalysis.description}</p>
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

        <div>
          <label htmlFor="tags" className="block font-medium text-gray-700">
            タグ（カンマ区切り）
          </label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="例: 夏, 祭り, 青"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
          <p className="mt-1 text-sm text-gray-500">
            複数のタグを追加する場合は、カンマ（,）で区切って入力してください
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
