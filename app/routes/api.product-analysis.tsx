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

  const headers: Record<string, string> = {};
  if (apiKey) headers["x-api-key"] = apiKey;

  try {
    const res = await fetch(apiUrl.toString(), { headers });
    if (!res.ok) {
      console.error(
        `Microlink API request failed: ${res.status} ${res.statusText}`,
        JSON.stringify(
          {
            url: targetUrl,
            apiUrl: apiUrl.toString(),
            status: res.status,
            statusText: res.statusText,
          },
          null,
          2
        )
      );
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
    console.error(
      "Microlink API request failed with exception:",
      JSON.stringify(
        {
          url: targetUrl,
          apiUrl: apiUrl.toString(),
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
        null,
        2
      )
    );
    return null;
  }
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
  } catch {
    return new Response("Internal server error", { status: 500 });
  }
}
