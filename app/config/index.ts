/**
 * アプリケーション設定の集約
 */

export interface AppConfig {
  // AI API設定
  geminiApiKey?: string;

  // OG API設定
  ogApi: {
    url?: string;
    key?: string;
  };

  // Google OAuth設定
  googleOAuth: {
    clientId?: string;
    clientSecret?: string;
  };

  // セッション設定
  session: {
    secret?: string;
    duration: number;
  };

  // 認証設定
  auth: {
    allowedEmails?: string;
  };

  // KV設定
  kv: {
    tenugui: KVNamespace;
    sessions: KVNamespace;
  };
}

/**
 * 環境変数からアプリケーション設定を構築
 */
export function createAppConfig(env: Cloudflare.Env): AppConfig {
  return {
    geminiApiKey: env.GEMINI_API_KEY,

    ogApi: {
      url: env.OG_API_URL,
      key: env.OG_API_KEY,
    },

    googleOAuth: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },

    session: {
      secret: env.SESSION_SECRET,
      duration: SESSION_DURATION,
    },

    auth: {
      allowedEmails: env.ALLOWED_EMAILS,
    },

    kv: {
      tenugui: env.TENUGUI_KV,
      sessions: env.SESSIONS,
    },
  };
}

/**
 * 設定の検証
 */
export class ConfigValidationError extends Error {
  constructor(message: string) {
    super(`Configuration Error: ${message}`);
    this.name = "ConfigValidationError";
  }
}

/**
 * 必須設定の検証
 */
export function validateConfig(config: AppConfig): void {
  // KV設定は必須
  if (!config.kv.tenugui) {
    throw new ConfigValidationError("TENUGUI_KV is required");
  }

  if (!config.kv.sessions) {
    throw new ConfigValidationError("SESSIONS KV is required");
  }
}

/**
 * 機能別設定の検証
 */
export function validateGeminiConfig(config: AppConfig): void {
  if (!config.geminiApiKey) {
    throw new ConfigValidationError(
      "GEMINI_API_KEY is required for AI analysis"
    );
  }
}

export function validateOgApiConfig(config: AppConfig): void {
  if (!config.ogApi.url) {
    throw new ConfigValidationError(
      "OG_API_URL is required for product analysis"
    );
  }

  if (!config.ogApi.key) {
    throw new ConfigValidationError(
      "OG_API_KEY is required for product analysis"
    );
  }
}

export function validateGoogleOAuthConfig(config: AppConfig): void {
  if (!config.googleOAuth.clientId) {
    throw new ConfigValidationError(
      "GOOGLE_CLIENT_ID is required for authentication"
    );
  }

  if (!config.googleOAuth.clientSecret) {
    throw new ConfigValidationError(
      "GOOGLE_CLIENT_SECRET is required for authentication"
    );
  }

  if (!config.session.secret) {
    throw new ConfigValidationError(
      "SESSION_SECRET is required for authentication"
    );
  }
}

// セッション設定
export const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7日間

// API設定
export const API_ENDPOINTS = {
  AUTH_ME: "/api/auth/me",
  PRODUCT_ANALYSIS: "/api/product-analysis",
  TAG_ANALYSIS: "/api/tag-analysis",
  TAG_DELETE: "/api/tag-delete",
  TAG_RENAME: "/api/tag-rename",
  ITEM_ORDER: "/api/item-order",
} as const;

// 認証設定
export const AUTH_URLS = {
  LOGIN: "/auth?action=login",
  LOGOUT: "/auth?action=logout",
  CALLBACK: "/auth/callback",
} as const;

// UI設定
export const UI_CONFIG = {
  // 一覧表示設定
  items: {
    maxImagesPerAnalysis: 10,
    defaultImageLimit: 20,
  },

  // ページネーション設定
  pagination: {
    defaultPageSize: 12,
    maxPageSize: 50,
  },

  // ファイルアップロード設定
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ["image/jpeg", "image/png", "image/webp"],
  },

  // タイムアウト設定
  timeouts: {
    apiRequest: 30000, // 30秒
    imageAnalysis: 60000, // 60秒
  },
} as const;

// UI設定の再エクスポート
export * from "./ui";

// ヘルパー関数の再エクスポート
export * from "./helpers";
