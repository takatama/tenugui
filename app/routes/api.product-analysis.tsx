import type { ActionFunctionArgs } from "react-router-dom";
import { requireAuthForAction } from "../lib/auth-guard";

// OG API レスポンス型
interface OgApiResponse {
  url: string;
  finalUrl?: string;
  title?: string;
  description?: string;
  lang?: string;
  favicon?: string;
  image?: string;
  fetchedAt?: string;
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

// OG APIで情報取得
async function fetchOg(
  targetUrl: string,
  ogApiUrl: string,
  apiKey: string,
  maxImages = 10
): Promise<AnalyzeResult | null> {
  const apiUrl = new URL(ogApiUrl);
  apiUrl.searchParams.set("url", targetUrl);

  try {
    console.log(`OG API request:`, {
      url: targetUrl,
      apiUrl: apiUrl.toString(),
    });

    const res = await fetch(apiUrl.toString(), {
      headers: {
        "X-API-Key": apiKey,
      },
      signal: AbortSignal.timeout(15000), // 15秒
    });

    if (!res.ok) {
      console.error("OG API request failed:", res.status, res.statusText);
      return null;
    }

    const json = (await res.json()) as OgApiResponse;

    const title = json.title?.trim();

    // 画像候補を収集
    const images = new Set<string>();
    if (json.image && isImageUrl(json.image)) {
      images.add(normalizeImageUrl(json.image));
    }

    const imageUrls = Array.from(images).slice(0, maxImages);
    if (!title && imageUrls.length === 0) {
      console.error("OG API returned no usable title or images:", {
        url: targetUrl,
        title,
        imageCount: imageUrls.length,
        data: json,
      });
      return null;
    }

    return {
      name: title || "商品",
      imageUrls,
    };
  } catch (error) {
    console.error("OG API request failed:", {
      url: targetUrl,
      apiUrl: apiUrl.toString(),
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function loader() {
  return new Response("Use POST method with productUrl", { status: 405 });
}

export async function action({ request, context }: ActionFunctionArgs) {
  // 認証チェック
  await requireAuthForAction(request, context);

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

    // OG APIエンドポイントとAPIキーを環境変数から取得
    const ogApiUrl = context?.cloudflare?.env?.OG_API_URL as string | undefined;
    const ogApiKey = context?.cloudflare?.env?.OG_API_KEY as string | undefined;

    if (!ogApiUrl) {
      return new Response("OG API URL is not configured", { status: 500 });
    }

    if (!ogApiKey) {
      return new Response("OG API Key is not configured", { status: 500 });
    }

    const result = await fetchOg(
      productUrl,
      ogApiUrl,
      ogApiKey,
      Math.min(maxImages || 10, 20)
    );
    if (!result) {
      return new Response("Failed to fetch OG info via OG API", {
        status: 502,
      });
    }

    return Response.json(result);
  } catch (error) {
    console.error("Product analysis error:", error);

    return new Response("Internal server error", { status: 500 });
  }
}
