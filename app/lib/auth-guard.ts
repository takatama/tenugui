import { redirect } from "react-router";
import { getAuthStateFromRequest, type AuthState } from "./cloudflare-auth";
import { AUTH_URLS } from "../config";

export interface AuthGuardOptions {
  redirectTo?: string;
  requireAuth?: boolean;
}

/**
 * ルートで認証をチェックする共通ユーティリティ
 */
export async function requireAuth(
  request: Request,
  context: { cloudflare: { env: any } },
  options: AuthGuardOptions = {}
): Promise<AuthState> {
  const { redirectTo = AUTH_URLS.LOGIN, requireAuth = true } = options;

  const sessionsKv = context.cloudflare.env.SESSIONS;
  const authState = await getAuthStateFromRequest(request, sessionsKv);

  if (requireAuth && !authState.isAuthenticated) {
    const url = new URL(request.url);
    const returnTo = encodeURIComponent(url.pathname + url.search);
    throw redirect(`${redirectTo}&returnTo=${returnTo}`);
  }

  return authState;
}

/**
 * アクション（POST/PUT/DELETE）で認証をチェックする共通ユーティリティ
 */
export async function requireAuthForAction(
  request: Request,
  context: { cloudflare: { env: any } }
): Promise<AuthState> {
  const sessionsKv = context.cloudflare.env.SESSIONS;
  const authState = await getAuthStateFromRequest(request, sessionsKv);

  if (!authState.isAuthenticated) {
    throw new Response("Unauthorized", { status: 401 });
  }

  return authState;
}

/**
 * 認証状態を取得（認証不要だが状態は知りたい場合）
 */
export async function getAuthStateOptional(
  request: Request,
  context: { cloudflare: { env: any } }
): Promise<AuthState> {
  const sessionsKv = context.cloudflare.env.SESSIONS;
  return await getAuthStateFromRequest(request, sessionsKv);
}
