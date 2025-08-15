import { type LoaderFunctionArgs } from "react-router";
import {
  createSession,
  createSessionCookie,
  isEmailAllowed,
  type CloudflareUser,
} from "../lib/cloudflare-auth";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const env = context.cloudflare.env;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code) {
    return new Response("認証コードが必要です", { status: 400 });
  }

  try {
    // Google OAuth トークンエンドポイントからアクセストークンを取得
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        code: code,
        grant_type: "authorization_code",
        redirect_uri: `${url.origin}/auth/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error("トークン取得に失敗しました");
    }

    const tokenData = (await tokenResponse.json()) as {
      access_token: string;
      token_type: string;
      expires_in: number;
    };

    // ユーザー情報を取得
    const userResponse = await fetch(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenData.access_token}`
    );

    if (!userResponse.ok) {
      throw new Error("ユーザー情報の取得に失敗しました");
    }

    const userData = (await userResponse.json()) as {
      email: string;
      name: string;
      picture?: string;
    };

    const user: CloudflareUser = {
      email: userData.email,
      name: userData.name,
      picture: userData.picture,
    };

    // 許可されたユーザーかチェック
    if (!isEmailAllowed(user.email, env.ALLOWED_EMAILS)) {
      return new Response(
        `
        <html>
          <head><title>アクセス拒否</title></head>
          <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1>アクセス拒否</h1>
            <p>このアプリケーションの使用権限がありません。</p>
            <p>メールアドレス: ${user.email}</p>
            <a href="/" style="color: blue;">トップページに戻る</a>
          </body>
        </html>
      `,
        {
          status: 403,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
          },
        }
      );
    }

    // セッションを作成
    const kv = env.SESSIONS;
    const sessionId = await createSession(user, kv);
    const sessionCookie = createSessionCookie(sessionId);

    // リダイレクト先を決定
    const redirectTo =
      state && state !== "null" ? decodeURIComponent(state) : "/";

    return new Response(null, {
      status: 302,
      headers: {
        Location: redirectTo,
        "Set-Cookie": sessionCookie,
      },
    });
  } catch (error) {
    console.error("認証エラー:", error);
    return new Response(
      `
      <html>
        <head><title>認証エラー</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h1>認証エラー</h1>
          <p>認証処理中にエラーが発生しました。</p>
          <a href="/" style="color: blue;">トップページに戻る</a>
        </body>
      </html>
    `,
      {
        status: 500,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      }
    );
  }
}
