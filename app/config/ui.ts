/**
 * UI設定の定数
 */

// レイアウト設定
export const LAYOUT_CONFIG = {
  // ヘッダー
  header: {
    height: "64px",
    mobileHeight: "56px",
  },

  // サイドバー
  sidebar: {
    width: "256px",
    collapsedWidth: "64px",
  },

  // コンテナ
  container: {
    maxWidth: "1200px",
    padding: "16px",
    mobilePadding: "8px",
  },
} as const;

// アニメーション設定
export const ANIMATION_CONFIG = {
  // 基本アニメーション
  duration: {
    fast: "150ms",
    normal: "250ms",
    slow: "500ms",
  },

  // イージング
  easing: {
    easeIn: "ease-in",
    easeOut: "ease-out",
    easeInOut: "ease-in-out",
    bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  },

  // トランジション
  transition: {
    all: "all 250ms ease-in-out",
    transform: "transform 250ms ease-in-out",
    opacity: "opacity 250ms ease-in-out",
  },
} as const;

// コンポーネント設定
export const COMPONENT_CONFIG = {
  // ボタン
  button: {
    borderRadius: "8px",
    padding: {
      sm: "8px 16px",
      md: "12px 24px",
      lg: "16px 32px",
    },
  },

  // カード
  card: {
    borderRadius: "12px",
    shadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
    shadowHover:
      "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  },

  // 入力フィールド
  input: {
    borderRadius: "8px",
    padding: "12px 16px",
    fontSize: "16px", // iOS zoom 防止
  },
} as const;

// カラーパレット
export const COLOR_PALETTE = {
  // プライマリカラー
  primary: {
    50: "#eff6ff",
    100: "#dbeafe",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    900: "#1e3a8a",
  },

  // セカンダリカラー
  secondary: {
    50: "#f8fafc",
    100: "#f1f5f9",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    900: "#0f172a",
  },

  // ステータスカラー
  status: {
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
    info: "#3b82f6",
  },
} as const;

// ブレークポイント
export const BREAKPOINTS = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

// Z-index階層
export const Z_INDEX = {
  dropdown: 1000,
  sticky: 1020,
  modal: 1030,
  popover: 1040,
  tooltip: 1050,
  toast: 1060,
} as const;
