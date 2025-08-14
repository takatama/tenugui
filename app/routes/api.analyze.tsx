import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router-dom";

// 楽天商品情報の型定義
interface RakutenProduct {
  itemName: string;
  mediumImageUrls: Array<{ imageUrl: string }>;
  smallImageUrls: Array<{ imageUrl: string }>;
  affiliateUrl: string;
  itemCode: string;
  shopName: string;
  itemPrice: number;
}

interface RakutenItemInfoResponse {
  Item: {
    itemName: string;
    mediumImageUrls?: Array<{ imageUrl: string }>;
    smallImageUrls?: Array<{ imageUrl: string }>;
    itemCode?: string;
    shopName?: string;
    shopUrl?: string;
  };
}

interface RakutenApiResponse {
  Items?: Array<{
    Item: {
      itemName: string;
      mediumImageUrls?: Array<{ imageUrl: string }>;
      smallImageUrls?: Array<{ imageUrl: string }>;
      itemCode?: string;
      shopName?: string;
      shopUrl?: string;
      shopOfTheYearFlag?: number;
    };
  }>;
}

interface RakutenItemInfoResponse {
  Item: {
    itemName: string;
    mediumImageUrls?: Array<{ imageUrl: string }>;
    smallImageUrls?: Array<{ imageUrl: string }>;
    itemCode?: string;
    shopName?: string;
    shopUrl?: string;
  };
}

// 楽天商品ページのHTMLを取得してshopUrlとitemIdを抽出する関数
async function extractItemInfoFromHtml(
  url: string
): Promise<{ shopUrl: string; itemId: string; manageNumber?: string } | null> {
  try {
    console.log("Fetching HTML from:", url);
    const response = await fetch(url);

    if (!response.ok) {
      console.error("Failed to fetch HTML:", response.status);
      return null;
    }

    const html = await response.text();

    // 別のパターンを試す - item-page-app-dataから抽出
    const appDataMatch = html.match(
      /<script type="application\/json" id="item-page-app-data">([\s\S]*?)<\/script>/
    );
    if (appDataMatch) {
      try {
        const jsonData = JSON.parse(appDataMatch[1]);
        const itemInfo =
          jsonData?.api?.data?.itemInfoSku || jsonData?.newApi?.itemInfoSku;

        if (itemInfo?.itemId) {
          console.log("Extracted from app-data:", {
            itemId: itemInfo.itemId.toString(),
            manageNumber: itemInfo.manageNumber,
          });

          // URLからshopUrlを抽出
          const urlMatch = url.match(/\/([^\/]+)\/([^\/]+)\/?$/);
          let shopUrl = "";
          if (urlMatch) {
            shopUrl = urlMatch[1]; // "anbo"
          }

          return {
            shopUrl: shopUrl,
            itemId: itemInfo.itemId.toString(),
            manageNumber: itemInfo.manageNumber,
          };
        }
      } catch (parseError) {
        console.error("Failed to parse app-data JSON:", parseError);
      }
    }

    // フォールバック: URLからshopUrlと推定itemIdを抽出
    const urlMatch = url.match(/\/([^\/]+)\/([^\/]+)\/?$/);
    if (urlMatch) {
      const shopUrl = urlMatch[1]; // "anbo"
      const manageNumber = urlMatch[2]; // "148348-358"

      console.log("Extracted from URL as fallback:", { shopUrl, manageNumber });
      return {
        shopUrl: shopUrl,
        itemId: "", // HTMLから取得できなかった場合は空
        manageNumber: manageNumber,
      };
    }

    console.error("Could not extract shopUrl and itemId from HTML");
    return null;
  } catch (error) {
    console.error("Error fetching HTML:", error);
    return null;
  }
}

// 楽天APIを呼び出して商品情報を取得する関数
async function fetchProductInfo(
  itemInfo: { shopUrl: string; itemId: string; manageNumber?: string },
  context?: any
): Promise<{ name: string; imageUrls: string[] } | null> {
  try {
    const applicationId = "1087180819141226826";
    const itemCode = `${itemInfo.shopUrl}:${itemInfo.itemId}`;

    console.log("Fetching product info for itemCode:", itemCode);

    const params = new URLSearchParams({
      format: "json",
      applicationId: applicationId,
      itemCode: itemCode,
      elements: "itemName,mediumImageUrls", // レスポンスサイズを最小化
    });

    const apiUrl = `https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601`;
    console.log("API URL:", `${apiUrl}?${params}`);

    const response = await fetch(`${apiUrl}?${params}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Rakuten API error:", response.status, errorText);
      return null;
    }

    const data = (await response.json()) as RakutenApiResponse;

    if (!data.Items || data.Items.length === 0) {
      console.log("No items found for itemCode:", itemCode);
      return null;
    }

    const item = data.Items[0].Item;

    // 複数の画像URLを取得し、クエリパラメータを削除
    const imageUrls = (item.mediumImageUrls || [])
      .map((img) => img.imageUrl.split("?")[0]) // クエリパラメータを削除
      .filter((url) => url); // 空文字列を除外

    console.log("Successfully found item:", item.itemName);
    console.log("Image URLs found:", imageUrls.length);

    return {
      name: item.itemName,
      imageUrls: imageUrls,
    };
  } catch (error) {
    console.error("Error fetching product info:", error);
    return null;
  }
}

export async function loader({ request }: LoaderFunctionArgs) {
  return new Response("Analyze API - Use POST method with productUrl", {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
}

export async function action({ request, context }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: {
        Allow: "POST",
        "Content-Type": "text/plain",
      },
    });
  }

  try {
    const data = await request.json();
    const { productUrl } = data as { productUrl?: string };

    if (!productUrl || typeof productUrl !== "string") {
      return new Response("Product URL is required", {
        status: 400,
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }

    console.log("Analyzing product URL:", productUrl);

    // 商品URLからHTMLを取得してshopId、itemIdを抽出
    const itemInfo = await extractItemInfoFromHtml(productUrl);
    if (!itemInfo) {
      return new Response(
        "Invalid product URL or failed to extract item information",
        {
          status: 400,
          headers: {
            "Content-Type": "text/plain",
          },
        }
      );
    }

    console.log("Extracted item info:", itemInfo);

    // 楽天APIから商品情報を取得
    const productInfo = await fetchProductInfo(itemInfo, context);
    if (!productInfo) {
      return new Response("Failed to fetch product information", {
        status: 500,
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }

    // 商品情報をJSONで返す
    return new Response(
      JSON.stringify({
        name: productInfo.name,
        imageUrls: productInfo.imageUrls,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in analyze action:", error);
    return new Response("Internal server error", {
      status: 500,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }
}
