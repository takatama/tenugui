import type { ReactNode } from "react";

/**
 * ラジオボタンの選択肢を表す型
 */
export interface RadioOption {
  /** 選択肢の値 */
  value: string;
  /** 選択肢の表示ラベル */
  label: string;
  /** 選択肢の説明（オプション） */
  description?: string;
  /** 選択肢が無効かどうか */
  disabled?: boolean;
}

/**
 * ラジオボタングループのプロパティ
 */
interface RadioGroupProps {
  /** フィールドグループのラベル */
  label?: string;

  /** name属性（同じグループのラジオボタンで統一） */
  name: string;

  /** 選択されている値 */
  value?: string;

  /** デフォルトで選択される値 */
  defaultValue?: string;

  /** 選択肢のリスト */
  options: RadioOption[];

  /** 値変更時のハンドラー */
  onChange?: (value: string) => void;

  /** ラジオボタンの配置方向 */
  direction?: "horizontal" | "vertical";

  /** 必須フィールドかどうか */
  required?: boolean;

  /** グループ全体を無効化するかどうか */
  disabled?: boolean;

  /** 追加のCSSクラス */
  className?: string;

  /** ラベルに追加するCSSクラス */
  labelClassName?: string;
}

/**
 * 統一されたラジオボタングループコンポーネント
 *
 * @example
 * // 基本的な使用
 * <RadioGroup
 *   label="ステータス"
 *   name="status"
 *   defaultValue="unpurchased"
 *   options={[
 *     { value: "purchased", label: "購入済み" },
 *     { value: "unpurchased", label: "未購入" },
 *   ]}
 * />
 *
 * @example
 * // 制御されたコンポーネント
 * <RadioGroup
 *   label="優先度"
 *   name="priority"
 *   value={priority}
 *   onChange={setPriority}
 *   options={[
 *     { value: "high", label: "高", description: "緊急対応が必要" },
 *     { value: "medium", label: "中", description: "通常の対応" },
 *     { value: "low", label: "低", description: "時間があるときに対応" },
 *   ]}
 *   direction="vertical"
 * />
 */
export function RadioGroup({
  label,
  name,
  value,
  defaultValue,
  options,
  onChange,
  direction = "horizontal",
  required = false,
  disabled = false,
  className = "",
  labelClassName = "",
}: RadioGroupProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };

  const containerClasses = `flex ${
    direction === "horizontal" ? "gap-6" : "flex-col gap-3"
  } ${className}`;

  return (
    <div className="space-y-1">
      {label && (
        <fieldset>
          <legend
            className={`block font-medium text-gray-700 mb-2 ${labelClassName}`}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </legend>
          <div className={containerClasses}>
            {options.map((option) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="radio"
                  name={name}
                  value={option.value}
                  checked={value ? value === option.value : undefined}
                  defaultChecked={
                    !value && defaultValue
                      ? defaultValue === option.value
                      : undefined
                  }
                  onChange={handleChange}
                  disabled={disabled || option.disabled}
                  required={required}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                />
                <div className="ml-2">
                  <span className="text-sm text-gray-700">{option.label}</span>
                  {option.description && (
                    <div className="text-xs text-gray-500">
                      {option.description}
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {!label && (
        <div className={containerClasses}>
          {options.map((option) => (
            <label key={option.value} className="flex items-center">
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={value ? value === option.value : undefined}
                defaultChecked={
                  !value && defaultValue
                    ? defaultValue === option.value
                    : undefined
                }
                onChange={handleChange}
                disabled={disabled || option.disabled}
                required={required}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
              />
              <div className="ml-2">
                <span className="text-sm text-gray-700">{option.label}</span>
                {option.description && (
                  <div className="text-xs text-gray-500">
                    {option.description}
                  </div>
                )}
              </div>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
