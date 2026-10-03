// Keep secret binding declarations separate from Wrangler's generated runtime.
declare namespace Cloudflare {
  interface Env {
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    SESSION_SECRET?: string;
    ALLOWED_EMAILS?: string;
    GEMINI_API_KEY?: string;
    OG_API_URL?: string;
    OG_API_KEY?: string;
  }
}
interface Env extends Cloudflare.Env {}
