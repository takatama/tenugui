import { createItem, getAllTags } from "../data/items";
import {
  redirect,
  useLoaderData,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router-dom";
import { parseFormData } from "../lib/formUtils";
import { ItemForm } from "../components/items/ItemForm";
import { requireAuth, requireAuthForAction } from "../lib/auth-guard";

export async function loader({ context, request }: LoaderFunctionArgs) {
  // 認証チェック（共通化）
  await requireAuth(request, context);

  const kv = context.cloudflare.env.TENUGUI_KV;
  const existingTags = await getAllTags(kv);

  return {
    existingTags,
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
  const { existingTags } = useLoaderData<typeof loader>();

  return (
    <ItemForm
      existingTags={existingTags}
      submitLabel="登録する"
      title="新しい手ぬぐいを登録"
    />
  );
}
