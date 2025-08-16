import {
  useLoaderData,
  redirect,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "react-router-dom";
import { getItemById, deleteItem, type Item } from "../data/items";
import { ItemDetailView } from "../components/items/ItemDetailView";
import { requireAuthForAction } from "../lib/auth-guard";
import { createJsonResponse } from "../lib/response-utils";
import {
  validateRequiredParam,
  validateItemExists,
} from "../lib/validation-utils";

export async function loader({ context, params }: LoaderFunctionArgs) {
  const kv = context.cloudflare.env.TENUGUI_KV;
  const itemId = validateRequiredParam(params.itemId, "Item ID");

  const item = await getItemById(kv, itemId);
  await validateItemExists(item);

  return createJsonResponse({ item });
}

export async function action({ context, params, request }: ActionFunctionArgs) {
  // 認証チェック（共通化）
  await requireAuthForAction(request, context);

  const kv = context.cloudflare.env.TENUGUI_KV;
  const itemId = params.itemId;

  if (!itemId) {
    throw new Response("Item ID is required", { status: 400 });
  }

  const deleted = await deleteItem(kv, itemId);

  if (!deleted) {
    throw new Response("Item not found", { status: 404 });
  }

  // キャッシュバスティングのためタイムスタンプ付きでリダイレクト
  const timestamp = Date.now();
  return redirect(`/?refresh=${timestamp}`);
}

interface LoaderData {
  item: Item;
}

export default function ItemDetail() {
  const { item } = useLoaderData() as LoaderData;

  return <ItemDetailView item={item} />;
}
