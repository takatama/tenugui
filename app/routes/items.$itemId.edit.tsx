import {
  useLoaderData,
  redirect,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "react-router-dom";
import { getItemById, updateItem, getAllTags, type Item } from "../data/items";
import { parseFormData } from "../lib/formUtils";
import { ItemForm } from "../components/items/ItemForm";

export async function loader({ context, params }: LoaderFunctionArgs) {
  const kv = context.cloudflare.env.TENUGUI_KV;
  const itemId = params.itemId;

  if (!itemId) {
    throw new Response("Item ID is required", { status: 400 });
  }

  const item = await getItemById(kv, itemId);

  if (!item) {
    throw new Response("Item not found", { status: 404 });
  }

  const existingTags = await getAllTags(kv);

  return {
    item,
    existingTags,
  };
}

export async function action({ context, request, params }: ActionFunctionArgs) {
  const kv = context.cloudflare.env.TENUGUI_KV;
  const itemId = params.itemId;

  if (!itemId) {
    throw new Response("Item ID is required", { status: 400 });
  }

  const result = await parseFormData(request);

  const { name, imageUrl, productUrl, tags, memo } = result;

  const updatedItem = {
    name,
    imageUrl,
    productUrl,
    tags,
    memo,
  };

  await updateItem(kv, itemId, updatedItem);

  return redirect(`/items/${itemId}`);
}

type LoaderData = {
  item: Item;
  existingTags: string[];
};

export default function EditItem() {
  const { item, existingTags } = useLoaderData() as LoaderData;

  return (
    <ItemForm
      existingTags={existingTags}
      initialItem={item}
      submitLabel="更新する"
      title="手ぬぐいを編集"
      cancelUrl={`/items/${item.id}`}
    />
  );
}
