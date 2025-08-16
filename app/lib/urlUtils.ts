/**
 * URL関連のユーティリティ関数
 * PWA Share Target対応のため
 */

export interface ShareTargetData {
  url?: string;
  title?: string;
  text?: string;
}

/**
 * Share TargetやクエリパラメータからURLを抽出
 */
export function extractUrlFromParams(
  searchParams: URLSearchParams
): string | null {
  // Share Target API対応
  const sharedUrl = searchParams.get("url");
  if (sharedUrl) {
    return sharedUrl;
  }

  // フォールバック: 他の一般的なパラメータ名
  const fallbackParams = ["link", "productUrl", "itemUrl"];
  for (const param of fallbackParams) {
    const value = searchParams.get(param);
    if (value) {
      return value;
    }
  }

  return null;
}

/**
 * URLが有効な形式かチェック
 */
export function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * URLを正規化（プロトコル補完など）
 */
export function normalizeUrl(urlString: string): string {
  if (!urlString) return "";

  // プロトコルがない場合はhttpsを追加
  if (!urlString.startsWith("http://") && !urlString.startsWith("https://")) {
    return `https://${urlString}`;
  }

  return urlString;
}

/**
 * 文字列からURLを抽出する
 */
export function extractUrlFromString(text: string): string | null {
  if (!text) return null;

  // HTTP/HTTPSで始まるURLを検索する正規表現
  const urlRegex = /https?:\/\/[^\s]+/gi;
  const matches = text.match(urlRegex);

  if (matches && matches.length > 0) {
    // 最初に見つかったURLを返す
    return matches[0];
  }

  return null;
}

/**
 * Share Target用のメタデータ抽出
 */
export function extractShareMetadata(
  searchParams: URLSearchParams
): ShareTargetData {
  let extractedUrl: string | undefined;

  // 1. url パラメータが最優先
  const directUrl = searchParams.get("url");
  if (directUrl) {
    extractedUrl = directUrl;
  } else {
    // 2. text パラメータからURL抽出を試行
    const textParam = searchParams.get("text");
    if (textParam) {
      const urlFromText = extractUrlFromString(textParam);
      if (urlFromText) {
        extractedUrl = urlFromText;
      }
    }

    // 3. title パラメータからURL抽出を試行（textで見つからなかった場合）
    if (!extractedUrl) {
      const titleParam = searchParams.get("title");
      if (titleParam) {
        const urlFromTitle = extractUrlFromString(titleParam);
        if (urlFromTitle) {
          extractedUrl = urlFromTitle;
        }
      }
    }
  }

  return {
    url: extractedUrl,
    title: searchParams.get("title") || undefined,
    text: searchParams.get("text") || undefined,
  };
}
