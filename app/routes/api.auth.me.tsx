import { type LoaderFunctionArgs } from "react-router";
import { getAuthStateOptional } from "../lib/auth-guard";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const authState = await getAuthStateOptional(request, context);

  return new Response(JSON.stringify(authState), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}
