/**
 * パラメータバリデーションのユーティリティ
 */
export function validateRequiredParam(
  param: string | undefined,
  paramName: string
): string {
  if (!param) {
    throw new Response(`${paramName} is required`, { status: 400 });
  }
  return param;
}

/**
 * アイテム存在チェックのユーティリティ
 */
export async function validateItemExists<T>(
  item: T | null,
  itemName = "Item"
): Promise<T> {
  if (!item) {
    throw new Response(`${itemName} not found`, { status: 404 });
  }
  return item;
}

/**
 * 一般的なエラーハンドリング
 */
export function handleError(
  error: unknown,
  defaultMessage = "Internal Server Error"
): Response {
  console.error("Error:", error);

  if (error instanceof Response) {
    return error;
  }

  return new Response(defaultMessage, { status: 500 });
}
