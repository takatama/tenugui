import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { getAllItems } from "../data/items";
import { getAuthStateOptional, requireAuthForAction } from "../lib/auth-guard";

const PREFIX = "favorite:";
const HEADERS = { "Cache-Control": "no-store" };

export async function loader({ request, context }: LoaderFunctionArgs) {
  const auth = await getAuthStateOptional(request, context);
  if (!auth.isAuthenticated)
    return Response.json(
      { authenticated: false, favorites: [] },
      { headers: HEADERS },
    );
  const kv = context.cloudflare.env.TENUGUI_KV;
  const present = new Set((await getAllItems(kv)).map((item) => item.id));
  const favorites: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await kv.list({
      prefix: PREFIX,
      limit: 100,
      ...(cursor ? { cursor } : {}),
    });
    for (const key of page.keys) {
      const itemId = key.name.slice(PREFIX.length);
      if (present.has(itemId)) favorites.push(itemId);
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return Response.json(
    { authenticated: true, favorites: [...new Set(favorites)] },
    { headers: HEADERS },
  );
}

export async function action({ request, context }: ActionFunctionArgs) {
  await requireAuthForAction(request, context);
  if (request.method !== "POST")
    return Response.json(
      { error: "Method not allowed" },
      { status: 405, headers: HEADERS },
    );
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json(
      { error: "お気に入りの操作を確認してください。" },
      { status: 400, headers: HEADERS },
    );
  }
  if (!payload || typeof payload !== "object")
    return Response.json(
      { error: "お気に入りの操作を確認してください。" },
      { status: 400, headers: HEADERS },
    );
  const { itemId, favorite } = payload as {
    itemId?: unknown;
    favorite?: unknown;
  };
  if (
    typeof itemId !== "string" ||
    !itemId ||
    itemId.length > 200 ||
    typeof favorite !== "boolean"
  ) {
    return Response.json(
      { error: "お気に入りの操作を確認してください。" },
      { status: 400, headers: HEADERS },
    );
  }
  const kv = context.cloudflare.env.TENUGUI_KV;
  if (!(await getAllItems(kv)).some((item) => item.id === itemId))
    return Response.json(
      { error: "この一枚は見つかりませんでした。" },
      { status: 404, headers: HEADERS },
    );
  try {
    if (favorite) await kv.put(`${PREFIX}${itemId}`, "1");
    else await kv.delete(`${PREFIX}${itemId}`);
    return Response.json({ itemId, favorite }, { headers: HEADERS });
  } catch {
    return Response.json(
      { error: "お気に入りを保存できませんでした。もう一度お試しください。" },
      { status: 503, headers: HEADERS },
    );
  }
}
