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

  if (action === "login") {
    // Google OAuth認証URLを生成
    const redirectUri = `${url.origin}/auth/callback`;
    const authUrl = generateGoogleAuthUrl(
      env.GOOGLE_CLIENT_ID,
      redirectUri,
      encodeURIComponent(returnTo)
    );

    return new Response(null, {
      status: 302,
      headers: {
        Location: authUrl,
      },
    });
  }

  if (action === "logout") {
    // セッションを削除
    const kv = env.SESSIONS;
    const authState = await getAuthStateFromRequest(request, kv);

    if (authState.isAuthenticated) {
      const cookieHeader = request.headers.get("Cookie");
      const sessionId = extractSessionId(cookieHeader);
      if (sessionId) {
        await deleteSession(sessionId, kv);
      }
    }

    const clearCookie = clearSessionCookie();

    return new Response(null, {
      status: 302,
      headers: {
        Location: returnTo,
        "Set-Cookie": clearCookie,
      },
    });
  }

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
