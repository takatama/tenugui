import type { ActionFunctionArgs } from "react-router-dom";

// 楽天API レスポンス型定義
interface RakutenApiResponse {
  Items?: Array<{
    Item: {
      itemName: string;
      mediumImageUrls?: Array<{ imageUrl: string }>;
    };
  }>;
}

// 商品情報型定義
interface ItemInfo {
  shopUrl: string;
  itemId: string;
}

// API レスポンス型定義
interface AnalyzeResult {
  name: string;
  imageUrls: string[];
}

// 楽天商品URLから商品情報を抽出
async function extractItemInfo(url: string): Promise<ItemInfo | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const html = await response.text();

    // HTMLから商品データを抽出
    const match = html.match(
      /<script type="application\/json" id="item-page-app-data">([\s\S]*?)<\/script>/
    );

    if (match) {
      const data = JSON.parse(match[1]);
      const itemInfo =
        data?.api?.data?.itemInfoSku || data?.newApi?.itemInfoSku;

      if (itemInfo?.itemId) {
        const urlMatch = url.match(/\/item\.rakuten\.co\.jp\/([^\/]+)\/[^\/]+/);
        const shopUrl = urlMatch?.[1];

        if (shopUrl) {
          return {
            shopUrl,
            itemId: itemInfo.itemId.toString(),
          };
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

// 楽天APIから商品情報を取得
async function fetchProductInfo(
  itemInfo: ItemInfo,
  applicationId: string
): Promise<AnalyzeResult | null> {
  try {
    const itemCode = `${itemInfo.shopUrl}:${itemInfo.itemId}`;
    const params = new URLSearchParams({
      format: "json",
      applicationId,
      itemCode,
      elements: "itemName,mediumImageUrls",
    });

    const response = await fetch(
      `https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601?${params}`
    );

    if (!response.ok) return null;

    const data = (await response.json()) as RakutenApiResponse;
    const item = data.Items?.[0]?.Item;

    if (!item) return null;

    // 画像URLからクエリパラメータを削除
    const imageUrls = (item.mediumImageUrls || [])
      .map((img) => img.imageUrl.split("?")[0])
      .filter(Boolean);

    return {
      name: item.itemName,
      imageUrls,
    };
  } catch {
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
    const { productUrl } = (await request.json()) as { productUrl?: string };

    if (!productUrl?.trim()) {
      return new Response("Product URL is required", { status: 400 });
    }

    // 環境変数から楽天Application IDを取得
    const applicationId = context?.cloudflare?.env?.RAKUTEN_APPLICATION_ID;
    if (!applicationId) {
      return new Response("Rakuten Application ID not configured", { status: 500 });
    }

    // 商品情報を抽出
    const itemInfo = await extractItemInfo(productUrl);
    if (!itemInfo) {
      return new Response("Failed to extract item information", {
        status: 400,
      });
    }

    // 楽天APIから商品情報を取得
    const productInfo = await fetchProductInfo(itemInfo, applicationId);
    if (!productInfo) {
      return new Response("Failed to fetch product information", {
        status: 500,
      });
    }

    return Response.json(productInfo);
  } catch {
    return new Response("Internal server error", { status: 500 });
  }
}
