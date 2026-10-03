# デザイン素材

`public/images/hero-tenugui.jpg`は組込みimagegenで生成した1536×1024の写真イメージをJPEGに圧縮しています。奥さまの部屋や実物を撮影したものではありません。

## 最終プロンプト

> Use case: photorealistic-natural
> Asset type: editorial lifestyle photograph for a Japanese tenugui collection website hero.
> Scene/backdrop: a serene Japandi home with warm ivory lime-plaster wall, soft natural daylight, and a long light-oak floating display shelf running horizontally near the lower third.
> Subject: one beautiful Japanese tenugui displayed vertically like a painting, hanging straight from a slender wooden rod fixed above the shelf, with its lower edge just above the shelf. The cloth is slender, width-to-height about 1:2.7, made of natural unbleached cotton with muted indigo abstract traditional wave motifs. Its full length is visible. On the right side of the shelf is a single small handmade sandy ceramic vase with one elegant leafless branch.
> Style/medium: premium Japanese lifestyle and craft magazine photography, completely photorealistic, rich tactile linen, wood grain and plaster texture, quiet refined beauty, honest materials.
> Composition/framing: landscape 3:2, wide interior detail, front-on with subtle depth. Tenugui left of center, vase on right, generous breathing room. The hanging cloth is the clear focal point, not draped or folded across the shelf.
> Lighting/mood: soft diagonal window sunlight from the left, gentle elongated shadows, calm warm afternoon.
> Color palette: warm ivory, oat, honeyed pale oak, dusty indigo.
> Constraints: no text, no letters, no logos, no watermarks, no people, no extra objects, no UI. Show a tenugui with clearly tall slender proportions, suspended vertically by a wood rod, never a square cloth or an oversized rug.

## サンプルの柄

いずれも360×960のコードで制作したSVGです。日本の工芸をヒントにしたデモ用の柄で、既存の商品や写真を複製したものではありません。

- `seigaiha.svg` — 藍の青海波
- `tsubaki.svg` — 赤い椿と生成り
- `mimosa.svg` — 芥子色の小さな花と緑の枝
- `mameshibori.svg` — 藍の豆絞り
- `yamayama.svg` — 苔色の山の稜線
- `kingyo.svg` — 朱の金魚と藍の波紋

SVGのtitle/descにもサンプルであることを記載しています。ローカルプレビューの画面写真は`docs/previews/`へ保存します。

## アプリのアイコン

ホーム画面のアイコンは、お気に入りだった旧版の花柄を組込みimagegenで編集したものです。花の配置と布の質感を保ち、藍地を苔色、花を生成り、花芯を芥子色に合わせています。マスターは`public/icons/icon-master.png`。`npm run icons`で各サイズのPNG、maskable版、ショートカットとICOを再生成できます。背景は不透明で、角の切り抜きはOSへ任せています。

編集指示は「既存の花柄・配置・布の質感を維持し、背景を苔色（画面のアクセント`#55674e`）、花を生成り（`#f6f4ee`）、金色の花芯を落ち着いた芥子色に変更。文字・ロゴ・新しい装飾・角丸を追加しない」です。小さなfaviconは読みやすさのため一輪の花を表すコード製SVGにしています。

`public/icons/brand.svg`と画面のロゴは、波模様の手ぬぐいを表したオリジナルの線画です。花柄のホーム画面アイコンと、画面内の控えめな線画を同じ色調で使っています。
