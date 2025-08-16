import type { ActionFunctionArgs } from "react-router-dom";

// Microlink レスポンス型
interface MicrolinkImage {
  url?: string;
  type?: string;
  size?: number;
  height?: number;
  width?: number;
}
interface MicrolinkData {
  title?: string;
  image?: MicrolinkImage | string;
  images?: Array<MicrolinkImage | string>;
}
interface MicrolinkResponse {
  status: "success" | "fail";
  data?: MicrolinkData;
  error?: { message?: string };
}

// API レスポンス型
interface AnalyzeResult {
  name: string;
  imageUrls: string[];
}

function normalizeImageUrl(u: string): string {
  try {
    const s = u.replace(/&amp;/g, "&").trim();
    return s.split("?")[0];
  } catch {
    return u;
  }
}

function isImageUrl(s: string): boolean {
  return /^https?:\/\/.+\.(?:jpg|jpeg|png|webp)(?:$|[?#])/i.test(s);
}

// MicrolinkでOG情報取得
async function fetchOgWithMicrolink(
  targetUrl: string,
  apiKey?: string,
  maxImages = 10
): Promise<AnalyzeResult | null> {
  const apiUrl = new URL("https://api.microlink.io/");
  apiUrl.searchParams.set("url", targetUrl);
  // 軽量化（不要機能をオフ）
  apiUrl.searchParams.set("audio", "false");
  apiUrl.searchParams.set("video", "false");
  apiUrl.searchParams.set("screenshot", "false");

  // 楽天サイトの場合は特別な設定
  if (targetUrl.includes("rakuten.co.jp")) {
    apiUrl.searchParams.set("timeout", "30000"); // 30秒
    apiUrl.searchParams.set("waitFor", "2000"); // 2秒待機
  } else {
    apiUrl.searchParams.set("timeout", "15000"); // 15秒
  }

  const headers: Record<string, string> = {};
  if (apiKey) headers["x-api-key"] = apiKey;

  // リトライ機能付きのfetch
  const maxRetries = 2;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Microlink API attempt ${attempt}/${maxRetries}:`, {
        url: targetUrl,
        apiUrl: apiUrl.toString(),
      });

      const res = await fetch(apiUrl.toString(), {
        headers,
        // クライアント側のタイムアウトも設定
        signal: AbortSignal.timeout(35000), // 35秒
      });

      if (!res.ok) {
        // レスポンスヘッダーから制限情報を取得
        const rateLimitHeaders = {
          limit: res.headers.get("x-ratelimit-limit"),
          remaining: res.headers.get("x-ratelimit-remaining"),
          reset: res.headers.get("x-ratelimit-reset"),
          retryAfter: res.headers.get("retry-after"),
        };

        let rateLimitMessage = "";
        if (res.status === 429) {
          // 制限解除時刻を日本時間で計算
          if (rateLimitHeaders.reset) {
            const resetTime = new Date(parseInt(rateLimitHeaders.reset) * 1000);
            const jstTime = new Intl.DateTimeFormat("ja-JP", {
              timeZone: "Asia/Tokyo",
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }).format(resetTime);
            rateLimitMessage = `レート制限に達しました。制限解除: ${jstTime} (JST)`;
          } else if (rateLimitHeaders.retryAfter) {
            const retryAfterSeconds = parseInt(rateLimitHeaders.retryAfter);
            const retryAfterMinutes = Math.ceil(retryAfterSeconds / 60);
            rateLimitMessage = `レート制限に達しました。${retryAfterMinutes}分後に再試行してください。`;
          } else {
            rateLimitMessage =
              "レート制限に達しました。しばらく時間をおいて再試行してください。";
          }
        }

        const errorMessage = `Microlink API request failed: ${res.status} ${res.statusText}`;
        console.error(
          errorMessage,
          JSON.stringify(
            {
              url: targetUrl,
              apiUrl: apiUrl.toString(),
              status: res.status,
              statusText: res.statusText,
              attempt,
              rateLimitHeaders,
              rateLimitMessage,
            },
            null,
            2
          )
        );

        // 429エラーの場合は特別な処理（リトライしない）
        if (res.status === 429) {
          // 制限情報をエラーメッセージに含める
          throw new Error(rateLimitMessage || "API利用制限に達しました");
        }

        // 408 (Request Timeout) や 500番台エラーの場合はリトライ
        if ((res.status === 408 || res.status >= 500) && attempt < maxRetries) {
          console.log(
            `Retrying in 2 seconds... (attempt ${attempt + 1}/${maxRetries})`
          );
          await new Promise((resolve) => setTimeout(resolve, 2000));
          continue;
        }

        return null;
      }

      const json = (await res.json()) as MicrolinkResponse;
      if (json.status !== "success") {
        console.error(
          "Microlink API returned error status:",
          JSON.stringify(
            {
              url: targetUrl,
              status: json.status,
              error: json.error,
              data: json.data,
            },
            null,
            2
          )
        );
        return null;
      }

      if (!json.data) {
        console.error(
          "Microlink API returned no data:",
          JSON.stringify(
            {
              url: targetUrl,
              response: json,
            },
            null,
            2
          )
        );
        return null;
      }

      const title = json.data.title?.trim();

      // 画像候補を収集
      const images = new Set<string>();
      const push = (v: unknown) => {
        if (typeof v === "string" && isImageUrl(v))
          images.add(normalizeImageUrl(v));
        if (typeof v === "object" && v && "url" in (v as any)) {
          const u = (v as any).url;
          if (typeof u === "string" && isImageUrl(u))
            images.add(normalizeImageUrl(u));
        }
      };

      // メイン画像から取得
      if (json.data.image) push(json.data.image);

      // 画像配列から取得
      if (Array.isArray(json.data.images)) json.data.images.forEach(push);

      const imageUrls = Array.from(images).slice(0, maxImages);
      if (!title && imageUrls.length === 0) {
        console.error(
          "Microlink API returned no usable title or images:",
          JSON.stringify(
            {
              url: targetUrl,
              title,
              imageCount: imageUrls.length,
              data: json.data,
            },
            null,
            2
          )
        );
        return null;
      }

      return {
        name: title || "商品",
        imageUrls,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(
        `Microlink API request failed (attempt ${attempt}/${maxRetries}):`,
        JSON.stringify(
          {
            url: targetUrl,
            apiUrl: apiUrl.toString(),
            error: lastError.message,
            stack: lastError.stack,
            attempt,
          },
          null,
          2
        )
      );

      // 最後の試行でない場合はリトライ
      if (attempt < maxRetries) {
        console.log(
          `Retrying in 3 seconds... (attempt ${attempt + 1}/${maxRetries})`
        );
        await new Promise((resolve) => setTimeout(resolve, 3000));
        continue;
      }
    }
  }

  // すべての試行が失敗した場合
  console.error(`All ${maxRetries} attempts failed for Microlink API:`, {
    url: targetUrl,
    lastError: lastError?.message,
  });
  return null;
}

export async function loader() {
  return new Response("Use POST method with productUrl", { status: 405 });
}

export async function action({ request, context }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { productUrl, maxImages } = (await request.json()) as {
      productUrl?: string;
      maxImages?: number;
    };

    if (!productUrl?.trim()) {
      return new Response("Product URL is required", { status: 400 });
    }

    const apiKey = context?.cloudflare?.env?.MICROLINK_API_KEY as
      | string
      | undefined;

    const result = await fetchOgWithMicrolink(
      productUrl,
      apiKey,
      Math.min(maxImages || 10, 20)
    );
    if (!result) {
      return new Response("Failed to fetch OG info via Microlink", {
        status: 502,
      });
    }

    return Response.json(result);
  } catch (error) {
    console.error("Product analysis error:", error);

    // レート制限エラーの場合は詳細情報を返す
    if (error instanceof Error && error.message.includes("レート制限")) {
      return new Response(
        JSON.stringify({
          error: "RATE_LIMITED",
          message: error.message,
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response("Internal server error", { status: 500 });
  }
}
