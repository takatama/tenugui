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

// セッションの有効期限（7日間）
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;

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
    console.log("[AUTH] No sessionId provided");
    return null;
  }

  console.log(`[AUTH] Getting session: ${sessionId}`);
  const sessionData = await kv.get(`session:${sessionId}`);
  if (!sessionData) {
    console.log(`[AUTH] No session data found for: ${sessionId}`);
    return null;
  }

  try {
    const parsed: SessionData = JSON.parse(sessionData);

    if (Date.now() > parsed.expires) {
      console.log(`[AUTH] Session expired for: ${sessionId}`);
      await kv.delete(`session:${sessionId}`);
      return null;
    }

    console.log(`[AUTH] Valid session found for user: ${parsed.user.email}`);
    return parsed.user;
  } catch (error) {
    console.log(`[AUTH] Error parsing session data: ${error}`);
    return null;
  }
}

export async function deleteSession(
  sessionId: string,
  kv: KVNamespace
): Promise<void> {
  console.log(`[AUTH] Deleting session: ${sessionId}`);
  await kv.delete(`session:${sessionId}`);
  console.log(`[AUTH] Session deleted: ${sessionId}`);
}

// 認証状態を取得（サーバーサイド）
export async function getAuthStateFromRequest(
  request: Request,
  kv: KVNamespace
): Promise<AuthState> {
  const cookieHeader = request.headers.get("Cookie");
  console.log(`[AUTH] Cookie header: ${cookieHeader}`);

  const sessionId = extractSessionId(cookieHeader);
  console.log(`[AUTH] Extracted sessionId: ${sessionId}`);

  if (!sessionId) {
    console.log("[AUTH] No sessionId found in cookies");
    return { isAuthenticated: false, user: null };
  }

  const user = await getSession(sessionId, kv);
  const authState = {
    isAuthenticated: !!user,
    user,
  };

  console.log(`[AUTH] Auth state result:`, authState);
  return authState;
}

// クライアントサイド用（既存のコードとの互換性）
export async function getAuthState(): Promise<AuthState> {
  try {
    console.log("[CLIENT] Fetching auth state from /api/auth/me");
    const response = await fetch("/api/auth/me", {
      credentials: "include",
    });

    console.log("[CLIENT] Response status:", response.status);
    console.log(
      "[CLIENT] Response headers:",
      Object.fromEntries(response.headers.entries())
    );

    if (response.ok) {
      const data = (await response.json()) as AuthState;
      console.log("[CLIENT] Auth response data:", data);
      return data;
    } else {
      console.log(
        "[CLIENT] Auth response not ok:",
        response.status,
        response.statusText
      );
    }
  } catch (error) {
    console.log("[CLIENT] 認証情報の取得に失敗:", error);
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
    console.log("[AUTH] No cookie header found");
    return null;
  }

  console.log(`[AUTH] Parsing cookies from: ${cookieHeader}`);
  const cookies = cookieHeader.split(";").reduce(
    (acc, cookie) => {
      const [name, value] = cookie.trim().split("=");
      acc[name] = value;
      return acc;
    },
    {} as Record<string, string>
  );

  const sessionId = cookies.session || null;
  console.log(`[AUTH] Found session cookie: ${sessionId}`);
  return sessionId;
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

// ログアウトURL
export const LOGOUT_URL = "/auth?action=logout";
