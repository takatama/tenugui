import {
  data,
  redirect,
  useLoaderData,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { createItem, getAllTags } from "../data/items";
import {
  FormValidationError,
  parseFormData,
  toFormValues,
  type ParsedFormData,
} from "../lib/formUtils";
import { ItemForm } from "../components/items/ItemForm";
import { requireAuth, requireAuthForAction } from "../lib/auth-guard";
import { extractShareMetadata } from "../lib/urlUtils";

export const meta = () => [{ title: "一枚、仲間入り。 | 手ぬぐい帖" }];

export async function loader({ context, request }: LoaderFunctionArgs) {
  await requireAuth(request, context);
  const existingTags = await getAllTags(context.cloudflare.env.TENUGUI_KV);
  const shareData = extractShareMetadata(new URL(request.url).searchParams);
  return { existingTags, shareData };
}

export async function action({ context, request }: ActionFunctionArgs) {
  await requireAuthForAction(request, context);
  let form: ParsedFormData | undefined;
  try {
    form = await parseFormData(request);
    const newItem = await createItem(context.cloudflare.env.TENUGUI_KV, form);
    return redirect(`/items/${newItem.id}`);
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
      "Item creation failed",
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

export default function NewItem() {
  const { existingTags, shareData } = useLoaderData<typeof loader>();
  return (
    <ItemForm
      existingTags={existingTags}
      submitLabel="この一枚を迎える"
      title="一枚、仲間入り。"
      initialProductUrl={shareData.url}
    />
  );
}
