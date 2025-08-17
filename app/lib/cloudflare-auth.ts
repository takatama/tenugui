import { SESSION_DURATION, AUTH_URLS } from "../config";

export interface CloudflareUser {
  email: string;
  name?: string;
  picture?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: CloudflareUser | null;
}

export interface SessionData {
  user: CloudflareUser;
  expires: number;
}

// セッション管理
export async function createSession(
  user: CloudflareUser,
  kv: KVNamespace
): Promise<string> {
  const sessionId = crypto.randomUUID();
  const sessionData: SessionData = {
    user,
    expires: Date.now() + SESSION_DURATION,
  };

  await kv.put(`session:${sessionId}`, JSON.stringify(sessionData), {
    expirationTtl: SESSION_DURATION / 1000,
  });

  return sessionId;
}

export async function getSession(
  sessionId: string,
  kv: KVNamespace
): Promise<CloudflareUser | null> {
  if (!sessionId) {
    return null;
  }

  const sessionData = await kv.get(`session:${sessionId}`);
  if (!sessionData) {
    return null;
  }

  try {
    const parsed: SessionData = JSON.parse(sessionData);

    if (Date.now() > parsed.expires) {
      await kv.delete(`session:${sessionId}`);
      return null;
    }

    return parsed.user;
  } catch (error) {
    return null;
  }
}

export async function deleteSession(sessionId: string, kv: KVNamespace) {
  await kv.delete(`session:${sessionId}`);
}

// 認証状態を取得（サーバーサイド）
export async function getAuthStateFromRequest(
  request: Request,
  kv: KVNamespace
): Promise<AuthState> {
  const cookieHeader = request.headers.get("Cookie");
  const sessionId = extractSessionId(cookieHeader);

  if (!sessionId) {
    return { isAuthenticated: false, user: null };
  }

  const user = await getSession(sessionId, kv);
  return {
    isAuthenticated: !!user,
    user,
  };
}

// クライアントサイド用（既存のコードとの互換性）
export async function getAuthState(): Promise<AuthState> {
  try {
    const response = await fetch("/api/auth/me", {
      credentials: "include",
    });

    if (response.ok) {
      const data = (await response.json()) as AuthState;
      return data;
    }
  } catch (error) {
    // エラーログはエラー処理として残す
    console.error("認証情報の取得に失敗:", error);
  }

  return {
    isAuthenticated: false,
    user: null,
  };
}

// 特定のメールアドレスが許可されているかチェック
export function isEmailAllowed(email: string, allowedEmails: string): boolean {
  const allowed = allowedEmails.split(",").map((e) => e.trim());
  return allowed.includes(email);
}

// Cookie操作
export function createSessionCookie(sessionId: string): string {
  const maxAge = SESSION_DURATION / 1000;
  return `session=${sessionId}; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax; Path=/`;
}

export function clearSessionCookie(): string {
  return `session=; Max-Age=0; HttpOnly; Secure; SameSite=Lax; Path=/`;
}

function extractSessionId(cookieHeader: string | null): string | null {
  if (!cookieHeader) {
    return null;
  }

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

// Google OAuth URL生成
export function generateGoogleAuthUrl(
  clientId: string,
  redirectUri: string,
  state?: string
): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state: state || crypto.randomUUID(),
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

// ログアウトURL（設定から取得）
export const LOGOUT_URL = AUTH_URLS.LOGOUT;
