# PWAアイコン実装・テストガイド

## 実装手順

### 1. アイコンファイルの準備

#### オープンソースアイコンを使用する場合

```bash
# Material Design Iconsを使用
cd /Users/bx1039574/dev/tenugui
./scripts/generate-pwa-icons.sh
```

#### AI生成アイコンを使用する場合

```bash
# 1. AI_ICON_PROMPTS.mdのプロンプトを使用してアイコン生成
# 2. 512x512のPNGファイルをbase-icon.pngとして保存
# 3. 以下のスクリプトで各サイズ生成

mkdir -p public/icons

# 各サイズ生成（ImageMagick必要）
for size in 16 32 72 96 128 144 152 180 192 384 512; do
  convert base-icon.png -resize ${size}x${size} public/icons/icon-${size}x${size}.png
done

# ファビコン生成
convert public/icons/icon-32x32.png public/favicon.ico
```

### 2. マニフェストファイルの確認

現在の設定を確認：

```json
{
  "name": "Tenugui Manager",
  "short_name": "Tenugui",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ]
}
```

### 3. HTMLヘッダーの確認

`app/root.tsx`の設定確認：

```html
<link rel="manifest" href="/manifest.json" />
<link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
<link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png" />
```

## テスト方法

### 1. ローカル開発環境でのテスト

```bash
# 開発サーバー起動
npm run dev

# ブラウザで以下を確認
# http://localhost:5173
```

#### Chrome DevToolsでの確認

1. **F12** でDevToolsを開く
2. **Application** タブを選択
3. **Manifest** セクションを確認
4. アイコンが正しく表示されているかチェック

#### 確認ポイント

- [ ] Manifestが正しく読み込まれている
- [ ] 各サイズのアイコンが表示されている
- [ ] エラーが発生していない
- [ ] "Add to Home Screen"が表示される

### 2. モバイルデバイスでのテスト

#### Android Chrome

1. **メニュー（3点）** → **Add to Home screen**
2. ホーム画面にアイコンが追加されることを確認
3. アプリとして起動できることを確認

#### iOS Safari

1. **共有ボタン** → **Add to Home Screen**
2. ホーム画面にアイコンが追加されることを確認
3. アプリとして起動できることを確認

### 3. プロダクション環境でのテスト

```bash
# ビルドしてデプロイ
npm run build
npm run deploy

# デプロイ後のURL（例）
# https://your-app.pages.dev
```

#### PWAチェッカーツール

- [PWA Builder](https://www.pwabuilder.com/) - アプリのURLを入力して診断
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - PWAスコア確認

### 4. 各プラットフォームでの見た目確認

#### 必須チェックサイズ

| デバイス     | サイズ  | 表示場所           |
| ------------ | ------- | ------------------ |
| Android      | 192x192 | ホーム画面         |
| Android      | 512x512 | アプリストア風表示 |
| iOS          | 180x180 | ホーム画面         |
| デスクトップ | 32x32   | ブラウザタブ       |
| デスクトップ | 192x192 | ブックマーク       |

## トラブルシューティング

### よくある問題と解決方法

#### 1. アイコンが表示されない

```bash
# ファイルの存在確認
ls -la public/icons/

# パーミッション確認
chmod 644 public/icons/*.png

# ブラウザキャッシュクリア
# Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows)
```

#### 2. Add to Home Screenが表示されない

- HTTPSが必要（localhost除く）
- Service Workerの登録確認
- Manifestの必須項目確認

#### 3. アイコンがぼやける

```bash
# 高解像度版を確認
file public/icons/icon-512x512.png

# 再生成（より高品質で）
convert base-icon.png -resize 512x512 -quality 100 public/icons/icon-512x512.png
```

#### 4. iOS Safari でアイコンが正しく表示されない

```html
<!-- apple-touch-iconを追加 -->
<link rel="apple-touch-icon" href="/icons/icon-180x180.png" />
<link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180x180.png" />
```

## 品質チェックリスト

### デザイン品質

- [ ] 16x16でも内容が判別可能
- [ ] コントラストが十分
- [ ] ブランドカラーが適切
- [ ] 背景が透明または適切

### 技術品質

- [ ] 全サイズのPNGファイルが存在
- [ ] ファイルサイズが適切（各ファイル10KB以下推奨）
- [ ] ManifestのJSONが有効
- [ ] HTMLのlinkタグが正しい

### PWA機能

- [ ] Add to Home Screenが動作
- [ ] スタンドアロンモードで起動
- [ ] スプラッシュスクリーンが表示
- [ ] アイコンがホーム画面に正しく表示

### クロスプラットフォーム

- [ ] Android Chrome
- [ ] iOS Safari
- [ ] デスクトップChrome
- [ ] デスクトップSafari
- [ ] デスクトップFirefox

## パフォーマンス最適化

### ファイルサイズ最適化

```bash
# PNGファイルの最適化
brew install optipng
optipng public/icons/*.png

# または
npm install -g imagemin-cli
imagemin public/icons/*.png --out-dir=public/icons/ --plugin=imagemin-optipng
```

### 遅延読み込み対応

```html
<!-- 重要でないアイコンは遅延読み込み -->
<link rel="preload" href="/icons/icon-192x192.png" as="image" />
```

このガイドに従って、段階的にPWAアイコンの実装とテストを進めてください。
