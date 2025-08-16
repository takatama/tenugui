import type { ReactNode } from "react";
import { getInputClasses } from "../../lib/styles";

/**
 * 統一された入力フィールドコンポーネント
 *
 * @example
 * // 基本的な使用
 * <InputField
 *   label="商品名"
 *   value={name}
 *   onChange={(e) => setName(e.target.value)}
 * />
 *
 * @example
 * // 右側要素付き（ボタンなど）
 * <InputField
 *   label="商品URL"
 *   type="url"
 *   value={url}
 *   onChange={(e) => setUrl(e.target.value)}
 *   rightElement={
 *     <Button variant="success" onClick={analyze}>分析</Button>
 *   }
 * />
 *
 * @example
 * // 必須フィールド
 * <InputField
 *   label="メールアドレス"
 *   type="email"
 *   required
 *   value={email}
 *   onChange={(e) => setEmail(e.target.value)}
 * />
 */
interface InputFieldProps {
  /** フィールドのラベルテキスト */
  label?: string;

  /** input要素のid属性。ラベルとの関連付けに使用 */
  id?: string;

  /** input要素のname属性。フォーム送信時の識別子 */
  name?: string;

  /** 入力フィールドのタイプ */
  type?: "text" | "url" | "email" | "password" | "number";

  /** 入力値 */
  value?: string;

  /** プレースホルダーテキスト */
  placeholder?: string;

  /** 必須入力かどうか */
  required?: boolean;

  /** フィールドを無効化するかどうか */
  disabled?: boolean;

  /** フィールドのサイズ
   * - sm: 小さなフィールド（高さ32px）
   * - md: 標準サイズ（高さ40px、デフォルト）
   * - lg: 大きなフィールド（高さ48px）
   */
  size?: "sm" | "md" | "lg";

  /** 入力フィールドに追加するCSSクラス */
  className?: string;

  /** ラベルに追加するCSSクラス */
  labelClassName?: string;

  /** 値変更時のハンドラー */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;

  /** キー押下時のハンドラー */
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;

  /** 入力フィールドの右側に配置する要素（ボタンなど） */
  rightElement?: ReactNode;
}

/**
 * 統一された入力フィールドコンポーネント
 *
 * ラベル付きの入力フィールドを提供します。
 * rightElementを使用して、ボタンなどを右側に配置できます。
 */
export function InputField({
  label,
  id,
  name,
  type = "text",
  value,
  placeholder,
  required = false,
  disabled = false,
  size = "md",
  className = "",
  labelClassName = "",
  onChange,
  onKeyPress,
  rightElement,
}: InputFieldProps) {
  const inputClasses = getInputClasses(size, className);
  const containerClasses = rightElement ? "flex gap-2 items-center" : "";

  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={id}
          className={`block font-medium text-gray-700 ${labelClassName}`}
        >
          {label}
        </label>
      )}
      <div className={containerClasses}>
        <input
          type={type}
          id={id}
          name={name}
          value={value}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          onChange={onChange}
          onKeyPress={onKeyPress}
          className={
            rightElement ? `${inputClasses} flex-1` : `${inputClasses} w-full`
          }
        />
        {rightElement}
      </div>
    </div>
  );
}
