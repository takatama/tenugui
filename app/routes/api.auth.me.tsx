import { type LoaderFunctionArgs } from "react-router";
import { getAuthStateFromRequest } from "../lib/cloudflare-auth";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const kv = context.cloudflare.env.SESSIONS;

  console.log("[API AUTH ME] Request URL:", request.url);
  console.log(
    "[API AUTH ME] Request headers:",
    Object.fromEntries(request.headers.entries())
  );

  const authState = await getAuthStateFromRequest(request, kv);

  console.log("[API AUTH ME] Returning auth state:", authState);

  return new Response(JSON.stringify(authState), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
