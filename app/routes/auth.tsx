import { type LoaderFunctionArgs, type ActionFunctionArgs } from "react-router";
import {
  generateGoogleAuthUrl,
  clearSessionCookie,
  deleteSession,
  getAuthStateFromRequest,
} from "../lib/cloudflare-auth";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const env = context.cloudflare.env;
  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  const returnTo = url.searchParams.get("returnTo") || "/";

  console.log(`[AUTH] Action: ${action}, ReturnTo: ${returnTo}`);

  if (action === "login") {
    console.log("[AUTH] Processing login action");
    // Google OAuth認証URLを生成
    const redirectUri = `${url.origin}/auth/callback`;
    const authUrl = generateGoogleAuthUrl(
      env.GOOGLE_CLIENT_ID,
      redirectUri,
      encodeURIComponent(returnTo)
    );
    console.log(`[AUTH] Redirecting to Google OAuth: ${authUrl}`);

    return new Response(null, {
      status: 302,
      headers: {
        Location: authUrl,
      },
    });
  }

  if (action === "logout") {
    console.log("[AUTH] Processing logout action");
    // セッションを削除
    const kv = env.SESSIONS;
    const authState = await getAuthStateFromRequest(request, kv);

    console.log(`[AUTH] Current auth state:`, authState);

    if (authState.isAuthenticated) {
      const cookieHeader = request.headers.get("Cookie");
      const sessionId = extractSessionId(cookieHeader);
      console.log(`[AUTH] Found sessionId: ${sessionId}`);
      if (sessionId) {
        await deleteSession(sessionId, kv);
        console.log(`[AUTH] Deleted session: ${sessionId}`);
      }
    } else {
      console.log("[AUTH] User was not authenticated");
    }

    const clearCookie = clearSessionCookie();
    console.log(`[AUTH] Clearing cookie and redirecting to: ${returnTo}`);

    return new Response(null, {
      status: 302,
      headers: {
        Location: returnTo,
        "Set-Cookie": clearCookie,
      },
    });
  }

  console.log(`[AUTH] Invalid action: ${action}`);
  return new Response("Invalid action", { status: 400 });
}

export async function action({ request, context }: ActionFunctionArgs) {
  return loader({ request, context } as LoaderFunctionArgs);
}

function extractSessionId(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").reduce(
    (acc, cookie) => {
      const [name, value] = cookie.trim().split("=");
      acc[name] = value;
      return acc;
    },
    {} as Record<string, string>
  );

  return cookies.session || null;
}
