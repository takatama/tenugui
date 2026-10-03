import { data, type ActionFunctionArgs } from "react-router";
import { changeTag } from "../data/collection-tools";
import { getAllTags } from "../data/items";
import { requireAuthForAction } from "../lib/auth-guard";
export async function action({ request, context }: ActionFunctionArgs) {
  await requireAuthForAction(request, context);
  if (request.method !== "PUT")
    return data({ error: "Method not allowed" }, { status: 405 });
  try {
    const payload = (await request.json()) as {
      oldTagName?: unknown;
      newTagName?: unknown;
    };
    if (
      typeof payload.oldTagName !== "string" ||
      typeof payload.newTagName !== "string"
    )
      return data({ error: "Tag names are required" }, { status: 400 });
    const oldTagName = payload.oldTagName.trim(),
      newTagName = payload.newTagName.trim();
    if (
      !oldTagName ||
      !newTagName ||
      newTagName.length > 40 ||
      oldTagName === newTagName
    )
      return data(
        { error: "Tag names must be different and valid" },
        { status: 400 },
      );
    const kv = context.cloudflare.env.TENUGUI_KV;
    if ((await getAllTags(kv)).includes(newTagName))
      return data({ error: "New tag name already exists" }, { status: 400 });
    const updatedItemsCount = await changeTag(kv, oldTagName, newTagName);
    return data({ success: true, oldTagName, newTagName, updatedItemsCount });
  } catch {
    return data({ error: "Failed to rename tag" }, { status: 500 });
  }
}
