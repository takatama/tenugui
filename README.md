# Tenugui コレクション管理アプリ

Tenugui は、日本の伝統的な布「手ぬぐい」を愛する人のためのコレクション管理アプリです。React Router と Cloudflare Workers を組み合わせたフルスタック構成で、PWA としてスマートフォンからも快適に利用できます。

---

## 主な機能

- **手ぬぐいの登録・一覧・詳細表示**: 画像、タグ、メモ、購入リンクなどを保存し管理できます。
- **AI・OG 情報を活用した分析機能**: Gemini API による画像解析や、OG API による商品ページ解析でタグ自動生成や商品情報取得を補助します。
- **タグ管理と並び替え**: タグの追加・削除・名前変更、ドラッグ＆ドロップによるアイテム並び替えに対応。
- **PWA 対応**: サービスワーカーと Web Manifest によってオフライン利用やホーム画面への追加が可能です。
- **エラー耐性の高い設計**: 汎用・API・画像ロード専用のエラー境界を備え、ユーザー体験を損ないません。
- **開発者に優しい環境**: TypeScript・Tailwind CSS・Hot Module Replacement (HMR) などを標準装備し、開発がスムーズです。

---

## 技術スタック

| 技術 | 役割 |
|------|------|
| React Router v7 | 画面遷移、SSR、データローディング |
| Cloudflare Workers / KV | サーバーサイド実行とストレージ |
| TypeScript | 型安全な実装 |
| Tailwind CSS | スタイリング |
| Gemini API / OG API | AI 解析・商品情報取得 |
| Google OAuth | 認証 |

---

## セットアップ

1. Node.js と npm をインストール
2. `.dev.vars.example` を参考に必要な環境変数を設定
3. 依存関係をインストール:

   ```bash
   npm install
   ```

4. 開発サーバーを起動:

   ```bash
   npm run dev
   ```

   ブラウザで `http://localhost:5173` を開きます。

---

## ビルド・プレビュー・デプロイ

| 目的 | コマンド |
|------|----------|
| 本番ビルド | `npm run build` |
| ビルド結果のプレビュー | `npm run preview` |
| Cloudflare Workers へのデプロイ | `npm run deploy` |
| プレビュー URL の作成 | `npx wrangler versions upload` |
| プレビュー版の本番反映 | `npx wrangler versions deploy` |

---

## プロジェクト構成（抜粋）

```
app/
 ├─ components/      UI コンポーネント群
 ├─ routes/          画面および API ルート
 ├─ data/            KV ストレージ操作ロジック
 ├─ config/          設定値とバリデーション
 └─ root.tsx         エントリーポイント & エラー境界
docs/
 └─ error-boundary-implementation.md  エラー境界の実装詳細
```

---

## ライセンス

このプロジェクトは [MIT License](LICENSE) の下で提供されています。

