/**
 * 共通コンポーネント使用例集
 *
 * AI Agentがコンポーネントを効果的に使用するための実践的なパターン集
 */

import { useState } from "react";
import type { ReactNode } from "react";
import {
  Button,
  InputField,
  PlusIcon,
  SettingsIcon,
  LogoutIcon,
} from "./index";

// ============================================
// 基本的なボタンパターン
// ============================================

/**
 * フォーム送信ボタンの例
 */
export function FormSubmitExample() {
  const handleSubmit = () => console.log("フォーム送信");
  const handleCancel = () => console.log("キャンセル");

  return (
    <div className="flex gap-3 pt-4">
      <Button type="submit" variant="primary" size="xl">
        保存
      </Button>
      <Button variant="secondary" size="xl" onClick={handleCancel}>
        キャンセル
      </Button>
    </div>
  );
}

/**
 * アクションボタン群の例
 */
export function ActionButtonsExample() {
  return (
    <div className="flex items-center space-x-4">
      {/* 新規追加ボタン */}
      <Button
        variant="success"
        icon={<PlusIcon />}
        onClick={() => console.log("新規追加")}
      >
        手ぬぐい追加
      </Button>

      {/* 設定ボタン（アイコンのみ） */}
      <Button
        variant="ghost"
        icon={<SettingsIcon />}
        aria-label="設定"
        onClick={() => console.log("設定")}
      />

      {/* ログアウトボタン */}
      <Button
        variant="secondary"
        icon={<LogoutIcon />}
        onClick={() => console.log("ログアウト")}
      >
        ログアウト
      </Button>
    </div>
  );
}

/**
 * ローディング状態ボタンの例
 */
export function LoadingButtonExample() {
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async () => {
    setIsLoading(true);
    // API呼び出しのシミュレーション
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsLoading(false);
  };

  return (
    <Button
      variant="success"
      loading={isLoading}
      disabled={isLoading}
      onClick={handleAnalyze}
    >
      {isLoading ? "分析中..." : "商品分析"}
    </Button>
  );
}

// ============================================
// 入力フィールドパターン
// ============================================

/**
 * 基本的なフォームフィールドの例
 */
export function BasicFormExample() {
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    email: "",
    memo: "",
  });

  return (
    <div className="space-y-6">
      {/* 必須テキストフィールド */}
      <InputField
        label="商品名"
        id="name"
        name="name"
        required
        value={formData.name}
        placeholder="商品名を入力してください"
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />

      {/* URLフィールド */}
      <InputField
        label="商品URL"
        id="url"
        name="url"
        type="url"
        value={formData.url}
        placeholder="https://example.com/product"
        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
      />

      {/* メールフィールド */}
      <InputField
        label="連絡先メール"
        id="email"
        name="email"
        type="email"
        value={formData.email}
        placeholder="user@example.com"
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      />
    </div>
  );
}

/**
 * 右側要素付きフィールドの例
 */
export function FieldWithActionExample() {
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!url.trim()) return;

    setIsAnalyzing(true);
    // 分析処理のシミュレーション
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsAnalyzing(false);
  };

  return (
    <InputField
      label="商品URL"
      type="url"
      value={url}
      placeholder="分析したい商品のURLを入力してください"
      onChange={(e) => setUrl(e.target.value)}
      rightElement={
        <Button
          variant="success"
          size="md"
          disabled={!url.trim() || isAnalyzing}
          loading={isAnalyzing}
          onClick={handleAnalyze}
          className="whitespace-nowrap flex-shrink-0"
        >
          {isAnalyzing ? "分析中..." : "商品分析"}
        </Button>
      }
    />
  );
}

/**
 * サイズバリエーションの例
 */
export function SizeVariationsExample() {
  return (
    <div className="space-y-4">
      {/* 小さなフィールド */}
      <InputField label="検索キーワード" size="sm" placeholder="検索..." />

      {/* 標準サイズ */}
      <InputField label="商品名" size="md" placeholder="商品名を入力" />

      {/* 大きなフィールド */}
      <InputField label="重要な情報" size="lg" placeholder="詳細情報を入力" />
    </div>
  );
}

// ============================================
// 実用的な組み合わせパターン
// ============================================

/**
 * 商品追加フォームの例
 */
export function ProductFormExample() {
  const [formState, setFormState] = useState({
    productUrl: "",
    name: "",
    imageUrl: "",
    isAnalyzing: false,
    isSubmitting: false,
  });

  const handleAnalyze = async () => {
    setFormState((prev) => ({ ...prev, isAnalyzing: true }));
    // 分析ロジック
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setFormState((prev) => ({
      ...prev,
      isAnalyzing: false,
      name: "分析された商品名",
      imageUrl: "https://example.com/image.jpg",
    }));
  };

  const handleSubmit = async () => {
    setFormState((prev) => ({ ...prev, isSubmitting: true }));
    // 送信ロジック
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setFormState((prev) => ({ ...prev, isSubmitting: false }));
  };

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      {/* URL入力 + 分析ボタン */}
      <InputField
        label="商品URL"
        type="url"
        value={formState.productUrl}
        placeholder="商品のURLを入力してください"
        onChange={(e) =>
          setFormState((prev) => ({ ...prev, productUrl: e.target.value }))
        }
        rightElement={
          <Button
            variant="success"
            loading={formState.isAnalyzing}
            disabled={!formState.productUrl.trim() || formState.isAnalyzing}
            onClick={handleAnalyze}
          >
            商品分析
          </Button>
        }
      />

      {/* 商品名 */}
      <InputField
        label="商品名"
        required
        value={formState.name}
        placeholder="商品名を入力してください"
        onChange={(e) =>
          setFormState((prev) => ({ ...prev, name: e.target.value }))
        }
      />

      {/* 画像URL */}
      <InputField
        label="画像URL"
        type="url"
        required
        value={formState.imageUrl}
        placeholder="画像のURLを入力してください"
        onChange={(e) =>
          setFormState((prev) => ({ ...prev, imageUrl: e.target.value }))
        }
      />

      {/* 送信ボタン */}
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          variant="primary"
          size="xl"
          loading={formState.isSubmitting}
          disabled={!formState.name.trim() || !formState.imageUrl.trim()}
        >
          {formState.isSubmitting ? "保存中..." : "保存"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="xl"
          onClick={() => window.history.back()}
        >
          キャンセル
        </Button>
      </div>
    </form>
  );
}

// ============================================
// よくある置き換えパターン
// ============================================

/**
 * 従来のHTMLボタンから共通コンポーネントへの置き換え例
 */
export const MigrationExamples = {
  // ❌ 置き換え前
  oldButton: () => (
    <button
      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
      onClick={() => console.log("clicked")}
    >
      保存
    </button>
  ),

  // ✅ 置き換え後
  newButton: () => (
    <Button variant="primary" onClick={() => console.log("clicked")}>
      保存
    </Button>
  ),

  // ❌ 置き換え前
  oldInput: () => (
    <div>
      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
        商品名
      </label>
      <input
        type="text"
        id="name"
        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        placeholder="商品名を入力"
      />
    </div>
  ),

  // ✅ 置き換え後
  newInput: () => (
    <InputField label="商品名" id="name" placeholder="商品名を入力" />
  ),
};

export default {
  FormSubmitExample,
  ActionButtonsExample,
  LoadingButtonExample,
  BasicFormExample,
  FieldWithActionExample,
  SizeVariationsExample,
  ProductFormExample,
  MigrationExamples,
};
