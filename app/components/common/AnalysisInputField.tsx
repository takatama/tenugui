import { InputField, Button } from "../common";

/**
 * 分析ボタン付き入力フィールドのプロパティ
 */
interface AnalysisInputFieldProps {
  /** フィールドのラベルテキスト */
  label: string;

  /** input要素のid属性 */
  id?: string;

  /** input要素のname属性 */
  name?: string;

  /** 入力フィールドのタイプ */
  type?: "text" | "url" | "email";

  /** 入力値 */
  value: string;

  /** プレースホルダーテキスト */
  placeholder?: string;

  /** 必須入力かどうか */
  required?: boolean;

  /** 分析中かどうか */
  isAnalyzing: boolean;

  /** 分析ボタンのテキスト */
  analyzeButtonText?: string;

  /** 分析中のボタンテキスト */
  analyzingButtonText?: string;

  /** 値変更時のハンドラー */
  onChange: (value: string) => void;

  /** 分析ボタンクリック時のハンドラー */
  onAnalyze: () => void;

  /** 追加のCSSクラス */
  className?: string;
}

/**
 * 分析ボタン付き入力フィールドコンポーネント
 *
 * URL分析や商品分析など、入力値に対してAI分析を行う場面で使用する
 * 統一されたパターンのコンポーネントです。
 *
 * @example
 * // 商品URL分析
 * <AnalysisInputField
 *   label="商品URL"
 *   type="url"
 *   value={productUrl}
 *   placeholder="分析したい商品のURLを入力"
 *   isAnalyzing={isAnalyzing}
 *   analyzeButtonText="商品分析"
 *   analyzingButtonText="分析中..."
 *   onChange={setProductUrl}
 *   onAnalyze={handleProductAnalysis}
 * />
 *
 * @example
 * // タグ分析
 * <AnalysisInputField
 *   label="画像URL"
 *   type="url"
 *   value={imageUrl}
 *   placeholder="タグ分析したい画像のURLを入力"
 *   isAnalyzing={isTagAnalyzing}
 *   analyzeButtonText="タグ分析"
 *   onChange={setImageUrl}
 *   onAnalyze={handleTagAnalysis}
 *   required
 * />
 */
export function AnalysisInputField({
  label,
  id,
  name,
  type = "text",
  value,
  placeholder,
  required = false,
  isAnalyzing,
  analyzeButtonText = "分析",
  analyzingButtonText = "分析中...",
  onChange,
  onAnalyze,
  className = "",
}: AnalysisInputFieldProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <InputField
      label={label}
      id={id}
      name={name}
      type={type}
      value={value}
      placeholder={placeholder}
      required={required}
      onChange={handleInputChange}
      className={className}
      rightElement={
        <Button
          variant="analysis"
          size="md"
          disabled={isAnalyzing || !value.trim()}
          loading={isAnalyzing}
          onClick={onAnalyze}
          className="whitespace-nowrap flex-shrink-0"
        >
          {isAnalyzing ? analyzingButtonText : analyzeButtonText}
        </Button>
      }
    />
  );
}
