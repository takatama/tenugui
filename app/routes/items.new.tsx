import { createItem, getAllTags } from "../data/items";
import {
  redirect,
  useLoaderData,
  useSearchParams,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router-dom";
import { parseFormData } from "../lib/formUtils";
import { ItemForm } from "../components/items/ItemForm";
import { requireAuth, requireAuthForAction } from "../lib/auth-guard";
import { extractShareMetadata } from "../lib/urlUtils";

export async function loader({ context, request }: LoaderFunctionArgs) {
  // 認証チェック（共通化）
  await requireAuth(request, context);

  const kv = context.cloudflare.env.TENUGUI_KV;
  const existingTags = await getAllTags(kv);

  // Share Target対応: URLパラメータからメタデータを抽出
  const url = new URL(request.url);
  const shareData = extractShareMetadata(url.searchParams);

  // デバッグ用ログ
  console.log("Share Target Debug:", {
    fullUrl: request.url,
    searchParams: Object.fromEntries(url.searchParams),
    shareData,
  });

  return {
    existingTags,
    shareData,
  };
}

export async function action({ context, request }: ActionFunctionArgs) {
  // 認証チェック（共通化）
  await requireAuthForAction(request, context);

  const kv = context.cloudflare.env.TENUGUI_KV;
  const formData = await parseFormData(request);

  const newItem = await createItem(kv, {
    name: formData.name,
    imageUrl: formData.imageUrl,
    productUrl: formData.productUrl,
    tags: formData.tags,
    memo: formData.memo,
  });
  return redirect(`/items/${newItem.id}`);
}

export default function NewItem() {
  const { existingTags, shareData } = useLoaderData<typeof loader>();

  // デバッグ用：共有データをコンソールに出力
  console.log("NewItem Component Debug:", { shareData });

  return (
    <ItemForm
      existingTags={existingTags}
      submitLabel="登録する"
      title="新しい手ぬぐいを登録"
      initialProductUrl={shareData.url}
    />
  );
}
