import {
  useLoaderData,
  redirect,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "react-router-dom";
import { getItemById, deleteItem, type Item } from "../data/items";
import { ItemDetailView } from "../components/items/ItemDetailView";

export async function loader({ context, params }: LoaderFunctionArgs) {
  const kv = context.cloudflare.env.TENUGUI_KV;
  const itemId = params.itemId;

  if (!itemId) {
    throw new Response("Item ID is required", { status: 400 });
  }

  const item = await getItemById(kv, itemId);

  if (!item) {
    throw new Response("Not Found", { status: 404 });
  }

  return new Response(JSON.stringify({ item }), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function action({ context, params }: ActionFunctionArgs) {
  const kv = context.cloudflare.env.TENUGUI_KV;
  const itemId = params.itemId;

  if (!itemId) {
    throw new Response("Item ID is required", { status: 400 });
  }

  const deleted = await deleteItem(kv, itemId);

  if (!deleted) {
    throw new Response("Item not found", { status: 404 });
  }

  return redirect("/");
}

interface LoaderData {
  item: Item;
}

export default function ItemDetail() {
  const { item } = useLoaderData() as LoaderData;

  return <ItemDetailView item={item} />;
}
