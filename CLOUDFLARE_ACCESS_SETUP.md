# Google OAuth 認証機能設定手順

このアプリケーションでは、Workers.devドメインでも使えるGoogle OAuth認証による権限管理を実装しています。

## 1. Google Cloud Console設定

### 1.1 プロジェクト作成

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成

### 1.2 OAuth 2.0 設定

1. 「APIs & Services」→「Credentials」を選択
2. 「Create Credentials」→「OAuth 2.0 Client IDs」をクリック
3. 設定値:
   - **Application type**: Web application
   - **Name**: tenugui-auth
   - **Authorized redirect URI 1**: `https://tenugui.takatama.workers.dev/auth/callback`
   - **Authorized redirect URI 2**: `http://localhost:5173/auth/callback`

### 1.3 認証情報の取得

- **Client ID**: 後で使用
- **Client Secret**: 後で使用

## 2. Cloudflare KV設定

### 2.1 KV Namespaceの作成

```bash
# セッション用のKV namespaceを作成
npx wrangler kv:namespace create "SESSIONS"
npx wrangler kv:namespace create "SESSIONS" --preview
```

### 2.2 wrangler.jsonc更新

KV Namespace IDを追加:

```jsonc
"kv_namespaces": [
  {
    "binding": "TENUGUI_KV",
    "id": "your-existing-kv-id"
  },
  {
    "binding": "SESSIONS",
    "id": "your-sessions-kv-id",
    "preview_id": "your-sessions-preview-kv-id"
  }
]
```

## 3. 環境変数設定

### 3.1 開発環境用 (.dev.vars)

開発環境では `.dev.vars` ファイルを作成（Gitには含めない）:

```bash
# .dev.vars ファイル
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
SESSION_SECRET=your-session-secret # node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ALLOWED_EMAILS=your-email@gmail.com,another@gmail.com
```

### 3.2 本番環境のSecrets設定（推奨）

```bash
# セキュアな値はsecretsで設定
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put SESSION_SECRET
npx wrangler secret put ALLOWED_EMAILS

# GOOGLE_CLIENT_IDは公開しても安全ですがsecretsでも可
npx wrangler secret put GOOGLE_CLIENT_ID
```

### 3.3 wrangler.jsonc更新（最小限）

```jsonc
"vars": {
  "VALUE_FROM_CLOUDFLARE": "Hello from Cloudflare"
}
```

### 3.4 SESSION_SECRET生成方法

```bash
# Node.jsで生成（32バイトのランダム文字列）
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# OpenSSLで生成
openssl rand -hex 32
```

## 4. デプロイ

```bash
npm run build
npm run deploy
```

## 5. 動作確認

### 5.1 基本動作テスト

1. `http://localhost:5173/` にアクセス
2. 「手ぬぐい追加」ボタンをクリック
3. Google認証画面にリダイレクトされる
4. 許可されたメールアドレスでログイン
5. 編集機能が利用可能になる

### 5.2 ログアウトテスト

1. ログイン後、右上の「ログアウト」ボタンをクリック
2. 開発者ツールのコンソールでログを確認
3. 正常にログアウトされることを確認

### 5.3 デバッグログの確認

認証関連の問題がある場合、以下のログが出力されます：

- `[AUTH] Action: login/logout`
- `[AUTH] Cookie header: ...`
- `[AUTH] Extracted sessionId: ...`
- `[AUTH] Auth state result: ...`

### 5.4 Google Cloud Console設定確認

開発環境用のRedirect URIが設定されているか確認：

- `http://localhost:5173/auth/callback`

## 機能

- **閲覧**: すべてのユーザーがアクセス可能
- **編集・削除**: 認証されたユーザーのみ（ALLOWED_EMAILSで制御）
- **自動リダイレクト**: 未認証時は自動的にGoogle認証へ
- **セッション管理**: Cloudflare KVで7日間有効

## セキュリティ機能

- セッションIDはランダム生成
- セッションは7日で自動期限切れ
- HttpOnly, Secure, SameSite=Lax cookie
- 許可されたメールアドレスのみアクセス可能

## セキュリティ情報

### 公開して良い情報

- **GOOGLE_CLIENT_ID**: 公開されても問題ありません（OAuthの仕様上）

### 秘匿すべき情報

- **GOOGLE_CLIENT_SECRET**: 絶対に秘匿（Wrangler Secretsで管理）
- **SESSION_SECRET**: 絶対に秘匿（セッション署名用）
- **ALLOWED_EMAILS**: プライバシー保護のため秘匿推奨

### 推奨設定

1. 秘匿情報は全てWrangler Secretsで管理
2. `.dev.vars`ファイルは`.gitignore`で除外済み
3. `.dev.vars.example`でテンプレートを提供

## トラブルシューティング

### 認証エラーが発生する場合

1. GOOGLE_CLIENT_IDとGOOGLE_CLIENT_SECRETが正しく設定されているか確認
2. Google Cloud ConsoleのRedirect URIが正確か確認
3. ALLOWED_EMAILSにログインするメールアドレスが含まれているか確認

### セッションが保持されない場合

- SESSIONS KV namespaceが正しく設定されているか確認
- SESSION_SECRETが設定されているか確認
