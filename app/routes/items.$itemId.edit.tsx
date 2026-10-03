import {
  data,
  useLoaderData,
  redirect,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "react-router";
import { getItemById, updateItem, getAllTags } from "../data/items";
import {
  FormValidationError,
  parseFormData,
  toFormValues,
  type ParsedFormData,
} from "../lib/formUtils";
import { ItemForm } from "../components/items/ItemForm";
import { requireAuth, requireAuthForAction } from "../lib/auth-guard";

export const meta = () => [{ title: "一枚の記録を編集 | 手ぬぐい帖" }];

export async function loader({ context, params, request }: LoaderFunctionArgs) {
  await requireAuth(request, context);
  const kv = context.cloudflare.env.TENUGUI_KV;
  if (!params.itemId)
    throw new Response("Item ID is required", { status: 400 });
  const item = await getItemById(kv, params.itemId);
  if (!item) throw new Response("Item not found", { status: 404 });
  return { item, existingTags: await getAllTags(kv) };
}

export async function action({ context, request, params }: ActionFunctionArgs) {
  await requireAuthForAction(request, context);
  const kv = context.cloudflare.env.TENUGUI_KV;
  if (!params.itemId)
    throw new Response("Item ID is required", { status: 400 });
  const currentItem = await getItemById(kv, params.itemId);
  if (!currentItem) throw new Response("Item not found", { status: 404 });
  let form: ParsedFormData | undefined;
  try {
    form = await parseFormData(request);
    // Retain the previous record, including its original photo address.
    await kv.put(
      `item-backup:${params.itemId}:before-edit`,
      JSON.stringify({ item: currentItem, savedAt: new Date().toISOString() }),
    );
    const updated = await updateItem(kv, params.itemId, form);
    if (!updated)
      return data(
        {
          error:
            "この一枚が見つかりませんでした。コレクションを確認してください。",
          values: toFormValues(form),
        },
        { status: 404 },
      );
    return redirect(`/items/${params.itemId}`);
  } catch (error) {
    if (error instanceof FormValidationError) {
      return data(
        {
          error: error.message,
          fieldErrors: error.fieldErrors,
          values: error.values,
        },
        { status: 400 },
      );
    }
    console.error(
      "Item update failed",
      error instanceof Error ? error.message : "Unknown error",
    );
    return data(
      {
        error:
          "保存できませんでした。入力内容はそのままです。もう一度お試しください。",
        values: form ? toFormValues(form) : undefined,
      },
      { status: 503 },
    );
  }
}

export default function EditItem() {
  const { item, existingTags } = useLoaderData<typeof loader>();
  return (
    <ItemForm
      existingTags={existingTags}
      initialItem={item}
      submitLabel="記録を保存する"
      title="この一枚の記録。"
      cancelUrl={`/items/${item.id}`}
    />
  );
}
