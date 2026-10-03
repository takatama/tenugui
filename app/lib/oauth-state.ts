const COOKIE = "tenugui_oauth";
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export function safeReturnTo(value: string, origin: string): string {
  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u001f\u007f]/u.test(value)
  )
    return "/";
  try {
    const url = new URL(value, origin);
    return url.origin === origin
      ? `${url.pathname}${url.search}${url.hash}`
      : "/";
  } catch {
    return "/";
  }
}
export async function createOAuthState(
  kv: KVNamespace,
  returnTo: string,
  origin: string,
) {
  const state = crypto.randomUUID();
  await kv.put(
    `oauth:${state}`,
    JSON.stringify({
      returnTo: safeReturnTo(returnTo, origin),
      expires: Date.now() + 600000,
    }),
    { expirationTtl: 600 },
  );
  return {
    state,
    cookie: `${COOKIE}=${state}; Max-Age=600; HttpOnly; Secure; SameSite=Lax; Path=/auth`,
  };
}
export function clearOAuthCookie() {
  return `${COOKIE}=; Max-Age=0; HttpOnly; Secure; SameSite=Lax; Path=/auth`;
}
export async function consumeOAuthState(
  kv: KVNamespace,
  request: Request,
  state: string | null,
): Promise<string | null> {
  if (!state || !UUID.test(state)) return null;
  const cookie = request.headers
    .get("Cookie")
    ?.split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1);
  if (cookie !== state) return null;
  const record = await kv.get<{ returnTo: string; expires: number }>(
    `oauth:${state}`,
    "json",
  );
  if (
    !record ||
    typeof record.expires !== "number" ||
    !Number.isFinite(record.expires) ||
    record.expires <= Date.now() ||
    typeof record.returnTo !== "string"
  )
    return null;
  await kv.delete(`oauth:${state}`);
  return safeReturnTo(record.returnTo, new URL(request.url).origin);
}
