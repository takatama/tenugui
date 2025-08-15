import type { CloudflareUser } from "../lib/cloudflare-auth";
import { LOGOUT_URL } from "../lib/cloudflare-auth";

interface AuthHeaderProps {
  user: CloudflareUser | null;
  isAuthenticated: boolean;
}

export function AuthHeader({ user, isAuthenticated }: AuthHeaderProps) {
  if (!isAuthenticated) {
    return (
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <div className="text-sm text-gray-600">
            編集や追加を行うにはログインが必要です
          </div>
          <a
            href="/auth?action=login"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Googleでログイン
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
      <div className="flex justify-between items-center max-w-6xl mx-auto">
        <div className="flex items-center space-x-3">
          {user?.picture && (
            <img
              src={user.picture}
              alt={user.name || user.email}
              className="w-8 h-8 rounded-full"
            />
          )}
          <div>
            <div className="text-sm font-medium text-blue-900">
              {user?.name || user?.email}
            </div>
            <div className="text-xs text-blue-600">編集権限でログイン中</div>
          </div>
        </div>
        <a
          href={LOGOUT_URL}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
        >
          ログアウト
        </a>
      </div>
    </div>
  );
}
