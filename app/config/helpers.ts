/**
 * 設定ユーティリティヘルパー
 */

import type { AppConfig } from "./index";
import { createAppConfig } from "./index";

/**
 * コンテキストから設定を取得する汎用ヘルパー
 */
export function getConfigFromContext(context: any): AppConfig {
  if (!context?.cloudflare?.env) {
    throw new Error("Cloudflare context not available");
  }

  return createAppConfig(context.cloudflare.env);
}

/**
 * 設定値の存在チェック
 */
export function hasGeminiConfig(config: AppConfig): boolean {
  return !!config.geminiApiKey;
}

export function hasOgApiConfig(config: AppConfig): boolean {
  return !!(config.ogApi.url && config.ogApi.key);
}

export function hasGoogleOAuthConfig(config: AppConfig): boolean {
  return !!(
    config.googleOAuth.clientId &&
    config.googleOAuth.clientSecret &&
    config.session.secret
  );
}

/**
 * 機能固有の設定取得
 */
export function getGeminiConfig(config: AppConfig) {
  return {
    apiKey: config.geminiApiKey,
    isAvailable: hasGeminiConfig(config),
  };
}

export function getOgApiConfig(config: AppConfig) {
  return {
    url: config.ogApi.url,
    key: config.ogApi.key,
    isAvailable: hasOgApiConfig(config),
  };
}

export function getAuthConfig(config: AppConfig) {
  return {
    googleClientId: config.googleOAuth.clientId,
    googleClientSecret: config.googleOAuth.clientSecret,
    sessionSecret: config.session.secret,
    sessionDuration: config.session.duration,
    allowedEmails: config.auth.allowedEmails,
    isAvailable: hasGoogleOAuthConfig(config),
  };
}

/**
 * KV設定の取得
 */
export function getKvConfig(config: AppConfig) {
  return {
    tenugui: config.kv.tenugui,
    sessions: config.kv.sessions,
  };
}
