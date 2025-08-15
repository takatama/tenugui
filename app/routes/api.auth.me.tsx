import { type LoaderFunctionArgs } from "react-router";
import { getAuthStateFromRequest } from "../lib/cloudflare-auth";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const kv = context.cloudflare.env.SESSIONS;

  const authState = await getAuthStateFromRequest(request, kv);

  return new Response(JSON.stringify(authState), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
