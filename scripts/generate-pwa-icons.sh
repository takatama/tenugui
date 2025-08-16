#!/bin/bash

# PWAアイコン生成スクリプト
# Material Design Iconsを使用してアイコンセットを生成

set -e

echo "🎨 PWAアイコン生成スクリプト開始"

# 必要なディレクトリの作成
mkdir -p public/icons

# Material Design Iconsからベースアイコンを取得（例：grid_view）
# 手ぬぐいコレクション管理に適したアイコンとして grid_view を使用
echo "📥 ベースアイコンをダウンロード中..."

# SVGアイコンをダウンロード（Material Design Icons）
curl -s "https://fonts.gstatic.com/s/i/materialiconsoutlined/grid_view/v12/24px.svg" > base-icon.svg

# ImageMagickの確認
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagickがインストールされていません"
    echo "インストール方法: brew install imagemagick"
    exit 1
fi

echo "🔄 各サイズのPNGアイコンを生成中..."

# アプリアイコンサイズ生成
sizes=(16 32 72 96 128 144 152 180 192 384 512)

for size in "${sizes[@]}"; do
    echo "  → ${size}x${size}.png 生成中..."
    convert base-icon.svg -background "#3b82f6" -gravity center -extent ${size}x${size} public/icons/icon-${size}x${size}.png
done

echo "🔧 ショートカットアイコンを生成中..."

# 新規登録アイコン（プラス記号）
curl -s "https://fonts.gstatic.com/s/i/materialiconsoutlined/add/v13/24px.svg" > add-icon.svg
convert add-icon.svg -background "#22c55e" -gravity center -extent 96x96 public/icons/shortcut-add.png

# 一覧表示アイコン（リスト）
curl -s "https://fonts.gstatic.com/s/i/materialiconsoutlined/list/v12/24px.svg" > list-icon.svg
convert list-icon.svg -background "#3b82f6" -gravity center -extent 96x96 public/icons/shortcut-list.png

# ファビコン生成
echo "🌐 ファビコンを生成中..."
convert public/icons/icon-32x32.png public/favicon.ico

# 一時ファイルのクリーンアップ
rm -f base-icon.svg add-icon.svg list-icon.svg

echo "✅ アイコン生成完了！"
echo ""
echo "📁 生成されたファイル:"
ls -la public/icons/
echo ""
echo "🔗 次のステップ:"
echo "1. 生成されたアイコンを確認"
echo "2. 必要に応じてデザインを調整"
echo "3. PWAとして動作確認"
