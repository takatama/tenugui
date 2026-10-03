import {
  data,
  useLoaderData,
  redirect,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "react-router";
import { getItemById, deleteItem } from "../data/items";
import { ItemDetailView } from "../components/items/ItemDetailView";
import { requireAuthForAction } from "../lib/auth-guard";

export async function loader({ context, params }: LoaderFunctionArgs) {
  if (!params.itemId)
    throw new Response("Item ID is required", { status: 400 });
  const item = await getItemById(
    context.cloudflare.env.TENUGUI_KV,
    params.itemId,
  );
  if (!item) throw new Response("Item not found", { status: 404 });
  return { item };
}

export const meta = ({
  data: loaderData,
}: {
  data?: Awaited<ReturnType<typeof loader>>;
}) => [
  {
    title: loaderData?.item
      ? `${loaderData.item.name} | 手ぬぐい帖`
      : "一枚の記録",
  },
  {
    name: "description",
    content: loaderData?.item?.memo
      ? loaderData.item.memo.slice(0, 160)
      : "好きな柄と、好きな時間。てぬぐいのコレクションから。",
  },
];

export async function action({ context, params, request }: ActionFunctionArgs) {
  await requireAuthForAction(request, context);
  if (!params.itemId)
    throw new Response("Item ID is required", { status: 400 });
  const formData = await request.formData();
  if (formData.get("intent") !== "delete")
    return data({ error: "削除の操作を確認してください。" }, { status: 400 });
  const kv = context.cloudflare.env.TENUGUI_KV;
  const item = await getItemById(kv, params.itemId);
  if (!item) throw new Response("Item not found", { status: 404 });

  try {
    // Save first. A failed backup must never remove an item.
    await kv.put(
      `item-backup:${item.id}:${Date.now()}`,
      JSON.stringify({
        item,
        deletedAt: new Date().toISOString(),
        imageRetained: true,
      }),
    );
    const deleted = await deleteItem(kv, item.id);
    if (!deleted)
      return data(
        {
          error:
            "この一枚が見つかりませんでした。コレクションを確認してください。",
        },
        { status: 404 },
      );
    // Uploaded photos remain in KV so the saved record can be recovered.
    return redirect("/");
  } catch (error) {
    console.error(
      "Item removal failed",
      error instanceof Error ? error.message : "Unknown error",
    );
    return data(
      {
        error:
          "棚から外せませんでした。記録はそのままです。もう一度お試しください。",
      },
      { status: 503 },
    );
  }
}

export default function ItemDetail() {
  const { item } = useLoaderData<typeof loader>();
  return <ItemDetailView item={item} />;
}
