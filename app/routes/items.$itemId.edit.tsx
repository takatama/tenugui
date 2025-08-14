import {
  useLoaderData,
  Form,
  redirect,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "react-router-dom";
import { getItemById, updateItem, type Item } from "../data/items";
import { useState } from "react";

export async function loader({ context, params }: LoaderFunctionArgs) {
  const kv = context.cloudflare.env.TENUGUI_KV;
  const itemId = params.itemId;

  if (!itemId) {
    throw new Response("Item ID is required", { status: 400 });
  }

  const item = await getItemById(kv, itemId);

  if (!item) {
    throw new Response("Not Found", { status: 404 });
  }

  return new Response(JSON.stringify({ item }), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function action({ context, params, request }: ActionFunctionArgs) {
  const kv = context.cloudflare.env.TENUGUI_KV;
  const itemId = params.itemId;

  if (!itemId) {
    throw new Response("Item ID is required", { status: 400 });
  }

  const formData = await request.formData();
  const name = formData.get("name");
  const imageUrl = formData.get("imageUrl");
  const productUrl = formData.get("productUrl");
  const tagsString = formData.get("tags");
  const memo = formData.get("memo");

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

  const updatedItem = await updateItem(kv, itemId, {
    name,
    imageUrl,
    productUrl: productUrlValue,
    tags,
    memo,
  });

  if (!updatedItem) {
    throw new Response("Item not found", { status: 404 });
  }

  return redirect(`/items/${itemId}`);
}

interface LoaderData {
  item: Item;
}

export default function EditItem() {
  const { item } = useLoaderData() as LoaderData;
  const [productUrl, setProductUrl] = useState(item.productUrl || "");
  const [name, setName] = useState(item.name);
  const [imageUrl, setImageUrl] = useState(item.imageUrl);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [candidateImages, setCandidateImages] = useState<string[]>([]);
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
            message: `分析完了！商品名を取得し、${data.imageUrls.length}件の画像候補を見つけました。下記から画像を選択して「更新する」ボタンを押してください。`,
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

  return (
    <>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div
        style={{
          fontFamily: "sans-serif",
          padding: "2rem",
          maxWidth: "600px",
          margin: "auto",
        }}
      >
        <h1 style={{ fontSize: "2rem", marginBottom: "2rem" }}>
          手ぬぐいを編集
        </h1>

        <Form
          method="post"
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          <div>
            <label
              htmlFor="productUrl"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "bold",
              }}
            >
              商品URL
            </label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="url"
                id="productUrl"
                name="productUrl"
                value={productUrl}
                onChange={(e) => setProductUrl(e.target.value)}
                style={{
                  flex: "1",
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.375rem",
                  fontSize: "1rem",
                }}
              />
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                style={{
                  backgroundColor: isAnalyzing ? "#9ca3af" : "#059669",
                  color: "white",
                  padding: "0.75rem 1.5rem",
                  border: "none",
                  borderRadius: "0.375rem",
                  cursor: isAnalyzing ? "not-allowed" : "pointer",
                  fontSize: "1rem",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                {isAnalyzing ? (
                  <>
                    <div
                      style={{
                        width: "1rem",
                        height: "1rem",
                        border: "2px solid white",
                        borderTop: "2px solid transparent",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                      }}
                    ></div>
                    分析中...
                  </>
                ) : (
                  "分析"
                )}
              </button>
            </div>
          </div>

          {/* 画像候補選択セクション */}
          {candidateImages.length > 0 && (
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "bold",
                }}
              >
                画像を選択してください（{candidateImages.length}件の候補）
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "1rem",
                }}
              >
                {candidateImages.map((imgUrl, index) => (
                  <div
                    key={index}
                    onClick={() => handleImageSelect(imgUrl)}
                    style={{
                      cursor: "pointer",
                      border:
                        imageUrl === imgUrl
                          ? "2px solid #3b82f6"
                          : "2px solid #d1d5db",
                      borderRadius: "0.5rem",
                      overflow: "hidden",
                      boxShadow:
                        imageUrl === imgUrl
                          ? "0 0 0 2px rgba(59, 130, 246, 0.2)"
                          : "none",
                    }}
                  >
                    <img
                      src={imgUrl}
                      alt={`商品画像候補 ${index + 1}`}
                      style={{
                        width: "100%",
                        aspectRatio: "1",
                        objectFit: "contain",
                        backgroundColor: "#f9fafb",
                      }}
                    />
                    <div
                      style={{
                        padding: "0.5rem",
                        textAlign: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.875rem",
                          color: "#6b7280",
                        }}
                      >
                        候補 {index + 1}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="name"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "bold",
              }}
            >
              名前
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: "0.375rem",
                fontSize: "1rem",
              }}
            />
          </div>

          <div>
            <label
              htmlFor="imageUrl"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "bold",
              }}
            >
              画像URL
            </label>
            <input
              type="url"
              id="imageUrl"
              name="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: "0.375rem",
                fontSize: "1rem",
              }}
            />
            {/* 画像プレビュー */}
            {imageUrl && (
              <div style={{ marginTop: "0.5rem" }}>
                <div
                  style={{
                    fontSize: "0.875rem",
                    color: "#6b7280",
                    marginBottom: "0.25rem",
                  }}
                >
                  プレビュー:
                </div>
                <div
                  style={{
                    border: "1px solid #d1d5db",
                    borderRadius: "0.5rem",
                    overflow: "hidden",
                    width: "12rem",
                  }}
                >
                  <img
                    src={imageUrl}
                    alt="画像プレビュー"
                    style={{
                      width: "100%",
                      aspectRatio: "1",
                      objectFit: "contain",
                      backgroundColor: "#f9fafb",
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="tags"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "bold",
              }}
            >
              タグ（カンマ区切り）
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              defaultValue={item.tags?.join(", ") || ""}
              placeholder="例: 夏, 祭り, 青"
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: "0.375rem",
                fontSize: "1rem",
              }}
            />
            <p
              style={{
                marginTop: "0.25rem",
                fontSize: "0.875rem",
                color: "#6b7280",
              }}
            >
              複数のタグを追加する場合は、カンマ（,）で区切って入力してください
            </p>
          </div>

          <div>
            <label
              htmlFor="memo"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "bold",
              }}
            >
              メモ
            </label>
            <textarea
              id="memo"
              name="memo"
              rows={4}
              defaultValue={item.memo || ""}
              placeholder="手ぬぐいに関するメモや説明を入力してください"
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: "0.375rem",
                fontSize: "1rem",
                fontFamily: "inherit",
                resize: "vertical",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <button
              type="submit"
              style={{
                backgroundColor: "#2563eb",
                color: "white",
                padding: "0.75rem 1.5rem",
                border: "none",
                borderRadius: "0.375rem",
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: "bold",
              }}
            >
              更新
            </button>

            <a
              href={`/items/${item.id}`}
              style={{
                backgroundColor: "#6b7280",
                color: "white",
                padding: "0.75rem 1.5rem",
                textDecoration: "none",
                borderRadius: "0.375rem",
                fontSize: "1rem",
                fontWeight: "bold",
                display: "inline-block",
              }}
            >
              キャンセル
            </a>
          </div>
        </Form>
      </div>
    </>
  );
}
