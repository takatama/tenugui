# 手ぬぐい帖 - 共通コンポーネントライブラリ

## 概要

このライブラリは、手ぬぐい帖アプリケーション全体で一貫したUIとUXを提供するための再利用可能なコンポーネント集です。

## 🎯 設計思想

- **一貫性**: 統一されたデザインシステム
- **再利用性**: DRY原則に基づいた共通コンポーネント
- **アクセシビリティ**: ARIA属性とキーボード操作対応
- **レスポンシブ**: モバイルファーストデザイン
- **型安全性**: TypeScriptによる厳密な型定義

## 📁 ディレクトリ構造

```
app/
├── components/
│   └── common/  ### 4. メンテナンス性向上のための改善

**新しいコンポーネントや改善を追加する際は：**

1. 既存のパターンに従う
2. TypeScript型定義を完備
3. アクセシビリティを考慮
4. ドキュメントを更新

### 🔄 最近の改善点

**2025年8月版: メンテナンス性向上**

1. **SaveButton**: インラインボタンスタイル → 共通Buttonコンポーネント使用
2. **ItemForm**: 手動input/radio → InputField/RadioGroupコンポーネント使用
3. **TagSelection**: インラインボタン → Buttonコンポーネント + PlusIconアイコン使用
4. **分析系コンポーネント**: 重複パターン → AnalysisInputFieldコンポーネント作成
5. **RadioGroup**: 新規コンポーネント追加（ラジオボタンパターンの共通化）
6. **AnalysisInputField**: 新規コンポーネント追加（分析ボタン付きInputFieldパターンの共通化）

**効果:**
- **コード削減**: 約200行のインラインスタイルを共通コンポーネントに置き換え
- **一貫性向上**: 全てのボタンと入力フィールドが統一されたデザインシステムを使用
- **保守性向上**: スタイル変更時の影響範囲が共通コンポーネントのみに限定
- **型安全性向上**: TypeScriptによる厳密な型チェック
- **再利用性向上**: 新機能開発時の開発速度向上# 共通コンポーネント
│       ├── Button.tsx   # ボタンコンポーネント
│       ├── InputField.tsx # 入力フィールド
│       ├── AnalysisInputField.tsx # 分析ボタン付き入力フィールド
│       ├── RadioGroup.tsx # ラジオボタングループ
│       ├── Icons.tsx    # アイコンライブラリ
│       ├── TagDisplay.tsx # タグ表示
│       └── index.ts     # エクスポート集約
└── lib/
    └── styles.ts        # スタイル定数・ユーティリティ
```

## 🚀 クイックスタート

### 基本的なボタン

```tsx
import { Button } from '../components/common';

// プライマリボタン
<Button onClick={handleClick}>保存</Button>

// アイコン付きボタン
<Button
  variant="success"
  icon={<PlusIcon />}
  onClick={handleAdd}
>
  追加
</Button>

// ローディング状態
<Button loading={isLoading}>処理中...</Button>
```

### 入力フィールド

```tsx
import { InputField } from '../components/common';

// 基本的な入力フィールド
<InputField
  label="商品名"
  value={name}
  onChange={(e) => setName(e.target.value)}
  placeholder="商品名を入力してください"
/>

// 右側にボタンがある入力フィールド
<InputField
  label="商品URL"
  type="url"
  value={url}
  onChange={(e) => setUrl(e.target.value)}
  rightElement={
    <Button variant="success" onClick={handleAnalyze}>
      分析
    </Button>
  }
/>
```

### 分析ボタン付き入力フィールド

```tsx
import { AnalysisInputField } from '../components/common';

// 商品URL分析
<AnalysisInputField
  label="商品URL"
  type="url"
  value={productUrl}
  placeholder="分析したい商品のURLを入力"
  isAnalyzing={isAnalyzing}
  analyzeButtonText="商品分析"
  analyzingButtonText="分析中..."
  onChange={setProductUrl}
  onAnalyze={handleProductAnalysis}
/>

// タグ分析
<AnalysisInputField
  label="画像URL"
  type="url"
  value={imageUrl}
  placeholder="タグ分析したい画像のURLを入力"
  isAnalyzing={isTagAnalyzing}
  analyzeButtonText="タグ分析"
  onChange={setImageUrl}
  onAnalyze={handleTagAnalysis}
  required
/>
```

### ラジオボタングループ

```tsx
import { RadioGroup } from '../components/common';

// 基本的なラジオボタングループ
<RadioGroup
  label="ステータス"
  name="status"
  defaultValue="unpurchased"
  options={[
    { value: "purchased", label: "購入済み" },
    { value: "unpurchased", label: "未購入" },
  ]}
/>

// 縦配置で説明付き
<RadioGroup
  label="優先度"
  name="priority"
  value={priority}
  onChange={setPriority}
  direction="vertical"
  options={[
    { value: "high", label: "高", description: "緊急対応が必要" },
    { value: "medium", label: "中", description: "通常の対応" },
    { value: "low", label: "低", description: "時間があるときに対応" },
  ]}
/>
```

### アイコンの使用

```tsx
import { PlusIcon, SettingsIcon, LogoutIcon } from '../components/common';

// サイズ指定
<PlusIcon size="lg" />
<SettingsIcon size="md" className="text-gray-400" />
```

## 📊 デザインシステム

### カラーパレット

```typescript
colors = {
  primary: { 600: "bg-blue-600", 700: "bg-blue-700" },
  secondary: { 200: "bg-gray-200", 300: "bg-gray-300" },
  success: { 600: "bg-green-600", 700: "bg-green-700" },
  danger: { 600: "bg-red-600", 700: "bg-red-700" },
};
```

### ボタンバリアント

- `primary`: メインアクション（保存、送信）
- `secondary`: サブアクション（キャンセル、戻る）
- `success`: 成功アクション（追加、分析）
- `danger`: 危険アクション（削除）
- `ghost`: 軽量アクション（メニュー、アイコンボタン）

### サイズ

- `sm`: 小さなアクション
- `md`: 標準サイズ（デフォルト）
- `lg`: 重要なアクション
- `xl`: ヒーローアクション

## 🔧 ユーティリティ関数

### getButtonClasses

```typescript
import { getButtonClasses } from "../lib/styles";

const classes = getButtonClasses("primary", "lg", "custom-class");
```

### getInputClasses

```typescript
import { getInputClasses } from "../lib/styles";

const classes = getInputClasses("md", "w-full");
```

## 📝 使用例とパターン

### フォーム構築

```tsx
import { InputField, Button } from "../components/common";

function ItemForm() {
  return (
    <form className="space-y-6">
      <InputField
        label="商品名"
        name="name"
        required
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />

      <div className="flex gap-3 pt-4">
        <Button type="submit" size="xl">
          保存
        </Button>
        <Button variant="secondary" size="xl" onClick={handleCancel}>
          キャンセル
        </Button>
      </div>
    </form>
  );
}
```

### アクションボタン群

```tsx
import {
  Button,
  PlusIcon,
  SettingsIcon,
  LogoutIcon,
} from "../components/common";

function ActionButtons() {
  return (
    <div className="flex items-center space-x-4">
      <Button variant="success" icon={<PlusIcon />} onClick={handleAdd}>
        追加
      </Button>

      <Button variant="ghost" icon={<SettingsIcon />} aria-label="設定" />

      <Button variant="secondary" icon={<LogoutIcon />} onClick={handleLogout}>
        ログアウト
      </Button>
    </div>
  );
}
```

## ⚡ AI Agent向けベストプラクティス

### 1. コンポーネント選択の指針

- **ボタン**: 全てのクリック可能な要素は`Button`コンポーネントを使用
- **入力**: ラベル付きフィールドは`InputField`を優先
- **アイコン**: 統一されたアイコンライブラリから選択

### 2. プロパティの優先順位

1. `variant`: 用途に応じた適切なバリアント選択
2. `size`: コンテキストに適したサイズ
3. `disabled`/`loading`: 状態の明確な表現
4. `aria-*`: アクセシビリティ属性

### 3. 既存コードの置き換えパターン

```tsx
// ❌ 避けるべき
<button className="bg-blue-600 text-white px-4 py-2 rounded...">
  保存
</button>

// ✅ 推奨
<Button variant="primary" size="lg">
  保存
</Button>
```

### 4. 新しいバリアント追加

新しいスタイルが必要な場合は、`/app/lib/styles.ts`の`buttonStyles.variants`に追加してください。

## 🔍 トラブルシューティング

### よくある問題

1. **スタイルが適用されない**: TailwindCSSクラスが正しく設定されているか確認
2. **型エラー**: プロパティの型定義を確認
3. **アイコンが表示されない**: インポートパスとアイコン名を確認

### デバッグ方法

```tsx
// スタイルクラスの確認
console.log(getButtonClasses("primary", "lg"));

// プロパティの確認
<Button
  {...props}
  onClick={(e) => {
    console.log("Button clicked:", e);
    onClick?.(e);
  }}
/>;
```

## 🤝 コントリビューション

新しいコンポーネントや改善を追加する際は：

1. 既存のパターンに従う
2. TypeScript型定義を完備
3. アクセシビリティを考慮
4. ドキュメントを更新
