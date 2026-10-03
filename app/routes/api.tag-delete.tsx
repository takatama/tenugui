import { data, type ActionFunctionArgs } from "react-router";
import { changeTag } from "../data/collection-tools";
import { requireAuthForAction } from "../lib/auth-guard";
export async function action({ request, context }: ActionFunctionArgs) {
  await requireAuthForAction(request, context);
  if (request.method !== "DELETE")
    return data({ error: "Method not allowed" }, { status: 405 });
  try {
    const payload = (await request.json()) as { tagToDelete?: unknown };
    if (typeof payload.tagToDelete !== "string" || !payload.tagToDelete.trim())
      return data({ error: "Tag name is required" }, { status: 400 });
    const count = await changeTag(
      context.cloudflare.env.TENUGUI_KV,
      payload.tagToDelete.trim(),
    );
    return data({
      success: true,
      deletedTag: payload.tagToDelete.trim(),
      deletedCount: count,
    });
  } catch {
    return data({ error: "Failed to delete tag" }, { status: 500 });
  }
}
