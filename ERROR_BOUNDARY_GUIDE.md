# エラー境界適用ガイド

## 今後のリファクタリング推奨箇所

### 1. Settings.tsx にApiErrorBoundaryを適用

```tsx
import { ApiErrorBoundary } from "../components/common";

export default function Settings() {
  return (
    <ApiErrorBoundary operation="設定管理">
      {/* 既存のコンテンツ */}
    </ApiErrorBoundary>
  );
}
```

### 2. 商品分析フォームコンポーネント作成時

```tsx
<ApiErrorBoundary
  operation="商品分析"
  onError={(error) => {
    // 分析失敗時のクリーンアップ処理
    setIsAnalyzing(false);
    setAnalysisResult(null);
  }}
>
  <ProductAnalysisForm />
</ApiErrorBoundary>
```

### 3. 認証関連ページ

```tsx
<ErrorBoundary
  context={{ operation: "認証処理" }}
  fallback={(error, retry) => (
    <AuthErrorFallback error={error} onRetry={retry} />
  )}
>
  <AuthCallback />
</ErrorBoundary>
```

## 安定性向上の効果

### ✅ 改善される問題

- 画像読み込み失敗でのアプリクラッシュ
- API通信エラーでの白画面
- 予期しないレンダリングエラーでの全体停止
- エラー情報の統一的なログ記録

### 📊 ユーザーエクスペリエンス向上

- 部分的なエラーでも継続利用可能
- 明確なエラーメッセージとリトライオプション
- デベロッパーツールでの詳細なエラー情報

### 🛡️ 開発・保守性向上

- 統一されたエラーハンドリング
- コンテキスト付きエラーログ
- 再現可能なエラー条件の特定

## 導入優先順位

1. **高** - ギャラリー画像表示（実装済み）
2. **高** - 商品分析API呼び出し箇所
3. **中** - 設定管理画面
4. **中** - 認証フロー
5. **低** - 静的コンテンツ表示部分
