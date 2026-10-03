import type { LoaderFunctionArgs } from "react-router";
import {
  createSession,
  createSessionCookie,
  isEmailAllowed,
  type CloudflareUser,
} from "../lib/cloudflare-auth";
import { clearOAuthCookie, consumeOAuthState } from "../lib/oauth-state";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const env = context.cloudflare.env;
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET)
    return new Response("Googleログインの設定がまだ完了していません。", {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  try {
    const returnTo = await consumeOAuthState(
      env.SESSIONS,
      request,
      url.searchParams.get("state"),
    );
    if (!code || returnTo === null)
      return new Response(
        "ログインを確認できませんでした。手ぬぐい帖から、もう一度ログインしてください。",
        {
          status: 400,
          headers: {
            "Cache-Control": "no-store",
            "Set-Cookie": clearOAuthCookie(),
          },
        },
      );
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: `${url.origin}/auth/callback`,
      }),
    });
    if (!tokenResponse.ok) throw new Error("OAuth token exchange failed");
    const token = (await tokenResponse.json()) as { access_token?: string };
    if (typeof token.access_token !== "string" || !token.access_token)
      throw new Error("OAuth token missing");
    const userResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${token.access_token}` } },
    );
    if (!userResponse.ok) throw new Error("OAuth user info failed");
    const profile = (await userResponse.json()) as {
      email?: string;
      name?: string;
      picture?: string;
      verified_email?: boolean;
    };
    if (
      typeof profile.email !== "string" ||
      !profile.email ||
      profile.verified_email !== true ||
      !isEmailAllowed(profile.email, env.ALLOWED_EMAILS || "")
    )
      return new Response(
        "このアトリエへの編集権限がありません。コレクションはトップページからご覧いただけます。",
        {
          status: 403,
          headers: {
            "Cache-Control": "no-store",
            "Set-Cookie": clearOAuthCookie(),
          },
        },
      );
    const user: CloudflareUser = {
      email: profile.email,
      name: typeof profile.name === "string" ? profile.name : undefined,
      picture:
        typeof profile.picture === "string" ? profile.picture : undefined,
    };
    const sessionId = await createSession(user, env.SESSIONS);
    const headers = new Headers({
      Location: returnTo,
      "Cache-Control": "no-store",
    });
    headers.append("Set-Cookie", createSessionCookie(sessionId));
    headers.append("Set-Cookie", clearOAuthCookie());
    return new Response(null, { status: 302, headers });
  } catch {
    return new Response(
      "ログインできませんでした。少し時間をおいて、もう一度お試しください。",
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
          "Set-Cookie": clearOAuthCookie(),
        },
      },
    );
  }
}
