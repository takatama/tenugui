/**
 * JSON レスポンス作成のユーティリティ
 */
export function createJsonResponse<T = unknown>(
  data: T,
  status = 200
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

/**
 * エラーレスポンス作成のユーティリティ
 */
export function createErrorResponse(message: string, status = 400): Response {
  return new Response(message, { status });
}

/**
 * リダイレクトレスポンス作成のユーティリティ
 */
export function createRedirectResponse(url: string, status = 302): Response {
  return new Response(null, {
    status,
    headers: {
      Location: url,
    },
  });
}

/**
 * Cookie付きリダイレクトレスポンス作成のユーティリティ
 */
export function createRedirectWithCookieResponse(
  url: string,
  cookie: string,
  status = 302
): Response {
  return new Response(null, {
    status,
    headers: {
      Location: url,
      "Set-Cookie": cookie,
    },
  });
}
