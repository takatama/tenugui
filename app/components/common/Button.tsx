import type { ReactNode } from "react";
import { getButtonClasses } from "../../lib/styles";

/**
 * 統一されたボタンコンポーネント
 *
 * @example
 * // 基本的な使用
 * <Button onClick={handleSave}>保存</Button>
 *
 * @example
 * // バリアントとサイズ指定
 * <Button variant="success" size="lg">追加</Button>
 *
 * @example
 * // アイコン付きボタン
 * <Button icon={<PlusIcon />} iconPosition="left">新規作成</Button>
 *
 * @example
 * // ローディング状態
 * <Button loading={isSubmitting}>送信中...</Button>
 *
 * @example
 * // アイコンのみボタン
 * <Button icon={<CloseIcon />} aria-label="閉じる" />
 */
interface ButtonProps {
  /** ボタンの表示テキスト。アイコンのみの場合は省略可能 */
  children?: ReactNode;

  /** ボタンのスタイルバリアント
   * - primary: メインアクション（保存、送信）
   * - secondary: サブアクション（キャンセル、戻る）
   * - success: 成功アクション（追加、分析）
   * - danger: 危険アクション（削除）
   * - ghost: 軽量アクション（メニュー、アイコンボタン）
   */
  variant?: "primary" | "secondary" | "success" | "danger" | "ghost";

  /** ボタンのサイズ
   * - sm: 小さなアクション
   * - md: 標準サイズ（デフォルト）
   * - lg: 重要なアクション
   * - xl: ヒーローアクション
   */
  size?: "sm" | "md" | "lg" | "xl";

  /** ボタンを無効化するかどうか */
  disabled?: boolean;

  /** ローディング状態を表示するかどうか。trueの場合、スピナーが表示される */
  loading?: boolean;

  /** クリック時のハンドラー関数 */
  onClick?: () => void;

  /** ボタンのHTML type属性 */
  type?: "button" | "submit" | "reset";

  /** 追加のCSSクラス */
  className?: string;

  /** ボタンに表示するアイコン */
  icon?: ReactNode;

  /** アイコンの表示位置 */
  iconPosition?: "left" | "right";

  /** アクセシビリティ用のaria-label属性。アイコンのみボタンでは必須 */
  "aria-label"?: string;

  /** アクセシビリティ用のaria-expanded属性。メニューボタンなどで使用 */
  "aria-expanded"?: boolean;
}

/**
 * 統一されたボタンコンポーネント
 *
 * 全てのクリック可能な要素でこのコンポーネントを使用してください。
 * デザインシステムに基づいた一貫したスタイリングが適用されます。
 */
export function Button({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  onClick,
  type = "button",
  className = "",
  icon,
  iconPosition = "left",
  "aria-label": ariaLabel,
  "aria-expanded": ariaExpanded,
}: ButtonProps) {
  const buttonClasses = getButtonClasses(
    variant,
    size,
    `${disabled || loading ? "cursor-not-allowed opacity-50" : ""} ${className}`
  );

  const loadingSpinner = (
    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
  );

  // アイコンのみの場合
  if (!children && icon) {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled || loading}
        className={buttonClasses}
        aria-label={ariaLabel}
        aria-expanded={ariaExpanded}
      >
        {loading ? loadingSpinner : icon}
      </button>
    );
  }

  const content = (
    <>
      {loading && iconPosition === "left" && loadingSpinner}
      {!loading && icon && iconPosition === "left" && icon}
      {children && <span>{children}</span>}
      {!loading && icon && iconPosition === "right" && icon}
      {loading && iconPosition === "right" && loadingSpinner}
    </>
  );

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={buttonClasses}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
    >
      <div className="flex items-center justify-center gap-2">{content}</div>
    </button>
  );
}
