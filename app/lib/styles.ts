/**
 * 手ぬぐい帖アプリケーション - UI定数とスタイルユーティリティ
 *
 * 統一されたデザインシステムを提供するための定数とヘルパー関数集
 *
 * @example
 * // ボタンクラスの生成
 * const classes = getButtonClasses('primary', 'lg');
 *
 * @example
 * // 入力フィールドクラスの生成
 * const inputClasses = getInputClasses('md', 'w-full');
 */

// ========================================
// 色の定義
// ========================================

/**
 * アプリケーション全体で使用する色の定義
 * TailwindCSSクラス形式で統一
 */
export const colors = {
  primary: {
    50: "bg-blue-50",
    100: "bg-blue-100",
    600: "bg-blue-600",
    700: "bg-blue-700",
    text: "text-blue-600",
    textDark: "text-blue-800",
  },
  secondary: {
    100: "bg-gray-100",
    200: "bg-gray-200",
    300: "bg-gray-300",
    600: "bg-gray-600",
    700: "bg-gray-700",
    text: "text-gray-600",
    textDark: "text-gray-700",
  },
  green: {
    600: "bg-green-600",
    700: "bg-green-700",
  },
  red: {
    600: "bg-red-600",
    700: "bg-red-700",
  },
} as const;

// ========================================
// ボタンの基本スタイル
// ========================================
export const buttonStyles = {
  base: "font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500",

  // サイズ
  sizes: {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-2 text-sm",
    lg: "px-4 py-2 text-sm",
    xl: "px-6 py-3 text-sm",
  },

  // バリアント
  variants: {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary:
      "bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-300",
    success: "bg-green-600 text-white hover:bg-green-700",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
  },
} as const;

// ========================================
// 入力フィールドのスタイル
// ========================================
export const inputStyles = {
  base: "border border-gray-300 rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
  sizes: {
    sm: "p-2 text-sm h-8",
    md: "p-3 text-sm h-10",
    lg: "p-4 text-base h-12",
  },
} as const;

// ========================================
// アイコンのサイズ
// ========================================
export const iconSizes = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
  xl: "w-8 h-8",
} as const;

// ========================================
// レスポンシブ用のブレイクポイント接頭辞
// ========================================
export const breakpoints = {
  sm: "sm:",
  md: "md:",
  lg: "lg:",
  xl: "xl:",
} as const;

// ========================================
// スペーシング
// ========================================
export const spacing = {
  section: "space-y-6",
  form: "space-y-4",
  formTight: "space-y-1",
  menu: "space-y-1",
} as const;

// ========================================
// ユーティリティ関数
// ========================================

/**
 * ボタンのCSSクラスを生成する
 *
 * @param variant - ボタンのスタイルバリアント
 * @param size - ボタンのサイズ
 * @param additionalClasses - 追加のCSSクラス
 * @returns 結合されたCSSクラス文字列
 *
 * @example
 * // プライマリボタン（デフォルト）
 * getButtonClasses() // "font-medium rounded-md ... bg-blue-600 text-white ..."
 *
 * @example
 * // 大きな成功ボタン
 * getButtonClasses('success', 'lg') // "... bg-green-600 text-white ... px-4 py-2 ..."
 *
 * @example
 * // カスタムクラス付き
 * getButtonClasses('secondary', 'md', 'w-full') // "... bg-gray-200 ... w-full"
 */
export function getButtonClasses(
  variant: keyof typeof buttonStyles.variants = "primary",
  size: keyof typeof buttonStyles.sizes = "md",
  additionalClasses = ""
): string {
  return [
    buttonStyles.base,
    buttonStyles.variants[variant],
    buttonStyles.sizes[size],
    additionalClasses,
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * 入力フィールドのCSSクラスを生成する
 *
 * @param size - 入力フィールドのサイズ
 * @param additionalClasses - 追加のCSSクラス
 * @returns 結合されたCSSクラス文字列
 *
 * @example
 * // 標準サイズの入力フィールド
 * getInputClasses() // "border border-gray-300 rounded-md ... p-3 text-sm h-10"
 *
 * @example
 * // 小さな入力フィールド
 * getInputClasses('sm') // "... p-2 text-sm h-8"
 *
 * @example
 * // 全幅の入力フィールド
 * getInputClasses('md', 'w-full') // "... p-3 text-sm h-10 w-full"
 */
export function getInputClasses(
  size: keyof typeof inputStyles.sizes = "md",
  additionalClasses = ""
): string {
  return [inputStyles.base, inputStyles.sizes[size], additionalClasses]
    .filter(Boolean)
    .join(" ");
}

/**
 * レスポンシブクラスを生成する
 */
export function getResponsiveClasses(classes: Record<string, string>): string {
  return Object.entries(classes)
    .map(([breakpoint, className]) => {
      const prefix = breakpoint === "base" ? "" : `${breakpoint}:`;
      return `${prefix}${className}`;
    })
    .join(" ");
}

/**
 * 条件付きクラスを結合する
 */
export function clsx(
  ...classes: (string | undefined | null | false)[]
): string {
  return classes.filter(Boolean).join(" ");
}
